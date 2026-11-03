#!/usr/bin/env python3
"""KWP2000 service layer for the Z4 GT3 (DSC60, ZB 6769162) web tool.

Two transports with the same .request(payload) -> body contract:

  RealKwp  - drives a K+DCAN cable (KWP2000* line settings and framing).
             Target 0x29. Needs pyserial.
  MockKwp  - simulates the module from its documented service behaviour,
             so the UI runs with no hardware attached.

Module wraps either transport with the high-level operations the UI calls:
read/clear faults, read/write coding, valve- and sensor-calibration routines,
memory and live-data reads, session and security.

Security constants are loaded at runtime from a gitignored seedkey.json;
they are never embedded in this file.
"""
import json
import os
import time
from contextlib import nullcontext

HERE = os.path.dirname(os.path.abspath(__file__))
TGT = 0x29  # DSC diagnostic address


class KwpError(Exception):
    def __init__(self, nrc, name):
        self.nrc = nrc
        self.name = name
        super().__init__(f"NRC 0x{nrc:02X} {name}")


NRC = {0x10: "generalReject", 0x11: "serviceNotSupported", 0x12: "subFuncNotSupported",
       0x13: "wrongLength", 0x22: "conditionsNotCorrect", 0x31: "requestOutOfRange",
       0x33: "securityAccessDenied", 0x35: "invalidKey", 0x78: "responsePending"}

# $1A identification blocks: id -> (length, where it lives)
IDENT_BLOCKS = {0x80: (29, "EEPROM block 10 +0x1A"), 0x8F: (30, "EEPROM block 0 +0"),
                0x90: (7, "EEPROM block 10 +0x37"), 0x94: (30, "fixed block"),
                0x99: (4, "EEPROM block 10 +0x16")}

# The fixed 30-byte software-identification block the module returns for `$1A 94`:
# length byte, the 12-character software ID string, then a `90 00 0E` tag + 14-byte binary tail.
SW_IDENT_0x94 = bytes.fromhex("0c414e5f42424630303033382090000e001d07140a1d0003000000820101")


# ---- key algorithms (ported from kline_ident) ----
def _ror16(v, n):
    v &= 0xFFFF
    return ((v >> n) | (v << (16 - n))) & 0xFFFF


def _bitrev16(v):
    r = 0
    for i in range(16):
        r |= ((v >> i) & 1) << (15 - i)
    return r & 0xFFFF


def kt_seedrev(seed, state=4):
    return (_bitrev16(seed) ^ _ror16(seed, state + 1)) & 0xFFFF


def kt_ccp_key(seed, const):        # level 0x7E key transform (CCP)
    s = seed & 0xFFFF
    ns = (~s) & 0xFFFF
    res = 0
    for i in range(4):
        base = i * 4
        res |= ((s >> base) & 1) << (base + 2)
        res |= ((s >> (base + 2)) & 1) << base
        res |= ((ns >> (base + 1)) & 1) << (base + 1)
        res |= ((ns >> (base + 3)) & 1) << (base + 3)
    res = (res ^ _ror16(s, 5)) & 0xFFFF
    acc = 0
    for i in range(13):
        acc = (acc ^ ((res & (0xF << i)) << ((res >> i) & 0xF))) & 0xFFFFFFFF
    acc ^= (acc >> 16)
    return (res ^ acc ^ const) & 0xFFFF


def kt_coding_key(seed, const):     # level 0x7F key transform (coding write)
    X = _ror16(seed, 3)
    res = 0
    for i in range(8):
        a, b = 15 - i, 7 - i
        if ((X >> i) & 1) ^ ((X >> (i + 8)) & 1):
            res |= ((X >> a) & 1) << b
            res |= ((X >> b) & 1) << a
        else:
            res |= ((~X >> a) & 1) << a
            res |= ((~X >> b) & 1) << b
    return (res ^ const) & 0xFFFF


def load_seedkey(zb="6769162"):
    """Return {'ccpKey': int, 'codingKey': int} from a local seedkey.json, or {}.

    Looked up next to this file. It holds the per-unit security constants;
    it is gitignored and never committed. Without it, mock mode still works and real unlock reports a
    missing-constant error (you can also type the constants into standalone.html).
    """
    path = os.path.join(HERE, "seedkey.json")
    if not os.path.exists(path):
        return {}
    # tolerate the // comments the file uses
    raw = "\n".join(l for l in open(path) if not l.lstrip().startswith("//"))
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    e = data.get(zb) or data.get(zb[:7]) or {}
    alias = {"afb9e": "ccpKey", "afb10": "codingKey"}   # old seedkey.json names still accepted
    out = {}
    for k, v in e.items():
        name = alias.get(k, k)
        if name in ("ccpKey", "codingKey"):
            out[name] = int(v, 16) if isinstance(v, str) else v
    return out


# Additional DTC names, shown when a DTC has no entry in the internal fault table.
EXTRA_DTC = {
    0x5DE0: "BBV FA not initialized (brake-pad thickness, front axle)",
    0x5DE1: "BBV RA not initialized (brake-pad thickness, rear axle)",
    0x5DE2: "critical brake-pad thickness front axle reached",
    0x5DE3: "critical brake-pad thickness rear axle reached",
    0x5E21: "pressure transducer 2 electrically defective or noisy",
    0x5E50: 'SZL serial number wrong ("no fault")',
    0x5E51: 'SZL serial number invalid ("no fault")',
}

# ---- brake bleeding --------------------------------------------------------
# The module bleeds with $30 InputOutputControlByLocalIdentifier on local id 0x10, control
# parameter 0x07 (short-term adjustment), one frame per actuator state:
#     30 10 07 <valves> <aux> 01 <valves> <aux>
# valves: two bits per wheel (FL bits 0-1, FR 2-3, RL 4-5, RR 6-7); aux: 0x10 = pump motor,
# 0x0F = the four switching valves, 0x00 = everything off. Each side is a 104-frame sequence;
# the default inter-frame pause is 200 ms.
BLEED_SIDES = {"left": ("FL + RL", 0x11, 0xDD), "right": ("FR + RR", 0x44, 0x77)}
# One-shot per-wheel form, inlet + outlet valves + pump:  30 10 07 00 00 FF <valves> 10
WHEEL_MASK = {"FL": 0x03, "FR": 0x0C, "RL": 0x30, "RR": 0xC0}


def bleed_sequence(side):
    """(valves, aux) pairs of one side's bleeding sequence."""
    if side not in BLEED_SIDES:
        raise ValueError("bleed side must be 'left' or 'right'")
    _, one, mixed = BLEED_SIDES[side]
    seq = [(one, 0x00)]
    for _ in range(10):
        seq += [(0x55, 0x10), (mixed, 0x10), (0x55, 0x10), (0x55, 0x10), (one, 0x10), (one, 0x10)]
    for _ in range(20):
        seq += [(one, 0x00), (0x00, 0x00)]
    seq += [(0x00, 0x0F), (0x00, 0x0F), (0x00, 0x00)]
    return seq


def bleed_frame(valves, aux):
    return [0x30, 0x10, 0x07, valves, aux, 0x01, valves, aux]


def actuate_frame(valves, aux):
    return [0x30, 0x10, 0x07, 0x00, 0x00, 0xFF, valves, aux]


def bleed_desc(valves, aux):
    """Human-readable actuator state for one bleeding frame."""
    wheels = []
    for i, name in enumerate(("FL", "FR", "RL", "RR")):
        b = (valves >> (2 * i)) & 3
        if b:
            wheels.append(name + (" (both)" if b == 3 else ""))
    if aux == 0x10:
        wheels.append("pump")
    elif aux == 0x0F:
        wheels.append("switching valves")
    elif aux:
        wheels.append(f"aux 0x{aux:02X}")
    return ", ".join(wheels) or "all off"


# ---- transports -------------------------------------------------------------
def _kwp_frame(tgt, payload):
    """BMW KWP2000* frame: B8 <tgt> F1 <len> <payload..> <xor>."""
    f = bytes([0xB8, tgt, 0xF1, len(payload)]) + bytes(payload)
    x = 0
    for b in f:
        x ^= b
    return f + bytes([x])


class RealKwp:
    """K-line transport (KWP2000*: 8E1, DTR low), ported from kline_ident."""

    def __init__(self, port, baud=9600, wait=0.3, tgt=TGT):
        try:
            import serial
        except ImportError:
            raise RuntimeError("K-line needs pyserial: pip install -r requirements.txt") from None
        self._ser = serial.Serial(port, baudrate=baud, bytesize=8, parity=serial.PARITY_EVEN,
                                  stopbits=1, timeout=0.05, write_timeout=1)
        self._ser.dtr = False
        self._ser.rts = False
        time.sleep(0.3)
        self.wait = wait
        self.tgt = tgt
        self.kind = "serial"

    def _send(self, payload):
        """Send one request and return the raw response with any echo removed."""
        req = _kwp_frame(self.tgt, payload)
        self._ser.reset_input_buffer()
        self._ser.write(req)
        self._ser.flush()
        end = time.monotonic() + self.wait
        data = bytearray()
        while time.monotonic() < end:
            chunk = self._ser.read(256)
            data += chunk
            if not chunk and len(data) > len(req):
                break
        rx = bytes(data)
        return rx[len(req):] if rx.startswith(req) else rx

    def request(self, payload):
        raw = self._send(payload)
        body = raw[4:-1] if (len(raw) >= 5 and raw[0] == 0xB8) else raw
        if body and body[0] == 0x7F:
            nrc = body[2] if len(body) > 2 else 0
            raise KwpError(nrc, NRC.get(nrc, "?"))
        return bytes(body)

    def close(self):
        try:
            self._ser.close()
        except Exception:
            pass


class MockKwp:
    """Simulates the module from its documented behaviour."""

    def __init__(self, tgt=TGT):
        self.tgt = tgt
        self.kind = "mock"
        self.session = 0x81
        self.sec_level = 0
        self._seed = 0
        self.routine = {}  # id -> remaining ticks
        self.ccp_enabled = False  # set by 31 31 01; gates the mock CCP slave
        # sample coding values for the mock
        self.eeprom = bytearray(0x400)
        self.eeprom[0xFA] = 0xFA
        self.eeprom[0xFB] = 0x00
        self.eeprom[0xFC] = 0x00
        # sample DTCs for the mock (hi, lo, status)
        self.dtcs = [(0x5E, 0x59, 0x60), (0x5E, 0x1F, 0x60), (0x5E, 0x1E, 0x60)]

    def request(self, payload):
        p = list(payload)
        s = p[0]
        if s == 0x10:  # session
            self.session = p[1]
            return bytes([0x50, p[1]])
        if s == 0x27:  # security
            sub = p[1]
            if sub in (0x03, 0xFB, 0xFD):  # seed request
                self._seed = 0x1234
                return bytes([0x67, sub, self._seed >> 8, self._seed & 0xFF])
            # key submit: mock always grants
            self.sec_level = {0x04: 0x03, 0xFC: 0x7E, 0xFE: 0x7F}.get(sub, self.sec_level)
            return bytes([0x67, sub])
        if s == 0x1A:  # read ECU identification
            iid = p[1] if len(p) > 1 else 0
            if iid == 0x94:
                return bytes([0x5A, 0x94]) + SW_IDENT_0x94
            if iid in IDENT_BLOCKS:  # EEPROM-backed blocks: content not on file, zero-filled
                blk = bytearray(IDENT_BLOCKS[iid][0])
                if iid == 0x80:
                    blk[2:6] = bytes.fromhex("06769162")  # part number 6769162, packed BCD at bytes 2..5
                return bytes([0x5A, iid]) + bytes(blk)
            raise KwpError(0x12, NRC[0x12])
        if s == 0x18:  # read DTC by status
            out = bytearray([0x58, len(self.dtcs)])
            for hi, lo, st in self.dtcs:
                out += bytes([hi, lo, st])
            return bytes(out)
        if s == 0x14:  # clear
            if not (p[1] == 0xFF and p[2] in (0xFF, 0xFC)):
                raise KwpError(0x12, NRC[0x12])
            self.dtcs = []
            return bytes([0x54])
        if s == 0x23:  # read memory by address: 23 00 HH LL TT NN
            addr = (p[2] << 8) | p[3]
            n = p[5]
            return bytes([0x63]) + bytes(self.eeprom[addr:addr + n])
        if s == 0x3D:  # write memory by address: 3D 00 HH LL 03 01 DD
            if self.sec_level != 0x7F or self.session != 0x87:
                raise KwpError(0x33, NRC[0x33])
            addr = (p[2] << 8) | p[3]
            self.eeprom[addr] = p[6]
            return bytes([0x7D, 0x00, p[2], p[3], 0x03])
        if s == 0x31:  # start routine
            rid = p[1]
            if self.session == 0x81:
                raise KwpError(0x22, NRC[0x22])
            if rid == 0x31:  # CCP enable: needs 0x7E, re-enabling answers conditionsNotCorrect
                if self.sec_level != 0x7E:
                    raise KwpError(0x33, NRC[0x33])
                if self.ccp_enabled and p[2] == 0x01:
                    raise KwpError(0x22, NRC[0x22])
                self.ccp_enabled = p[2] == 0x01
                return bytes([0x71, rid, p[2]])
            self.routine[rid] = 5
            return bytes([0x71, rid])
        if s == 0x33:  # routine status
            rid = p[1]
            left = self.routine.get(rid, 0)
            if left > 0:
                self.routine[rid] = left - 1
            done = self.routine.get(rid, 0) == 0
            return bytes([0x73, rid, 0x02 if done else 0x01])
        if s == 0x30:  # input/output control: bleeding, valve actuation
            if self.session == 0x81:
                raise KwpError(0x22, NRC[0x22])
            if len(p) != 8 or p[1] != 0x10 or p[2] != 0x07:
                raise KwpError(0x12, NRC[0x12])
            return bytes([0x70, 0x10, 0x07])
        if s == 0x22:  # read data by common id: 0x3000 = coding
            if p[1] != 0x30 or p[2] != 0x00:
                raise KwpError(0x31, NRC[0x31])
            return bytes([0x62, 0x30, 0x00, self.eeprom[0xFA], self.eeprom[0xFB], self.eeprom[0xFC]])
        if s == 0x21:  # live data by local id
            lid = p[1]
            return bytes([0x61, lid]) + _mock_live(lid)
        if s == 0x3E:
            return bytes([0x7E, p[1] if len(p) > 1 else 0])
        raise KwpError(0x11, NRC[0x11])

    def close(self):
        pass


def _mock_live(lid):
    if lid == 0x02:  # conditioned values, 16-bit BE, FFFF = invalid
        vals = [0x0190, 0x0000, 0xFFFF, 0xFFFF, 0xFFFF, 0x0000, 0x0000, 0x0000, 0x0000, 0xFFFF]
        out = bytearray()
        for v in vals:
            out += bytes([v >> 8, v & 0xFF])
        return bytes(out)
    if lid == 0x05:
        return bytes([0x00])
    if lid == 0x07:  # four raw wheel speeds (0.01 km/h), then 5 zero
        return bytes([0, 0, 0, 0, 0, 0, 0, 0]) + bytes(5)
    return bytes([0x00])


# ---- DTC decode -------------------------------------------------------------
def load_dtc_names():
    """dtc number -> list of internal fault codes, from the bundled dtcmap.json."""
    jpath = os.path.join(HERE, "dtcmap.json")
    if not os.path.exists(jpath):
        return {}
    try:
        raw = json.load(open(jpath))
        return {int(k, 16): [int(f, 16) for f in v] for k, v in raw.items()}
    except (ValueError, json.JSONDecodeError):
        return {}


def load_fault_info():
    """fault code -> {d, lamp, eff} from the bundled faultinfo.json (see README), or {}."""
    path = os.path.join(HERE, "faultinfo.json")
    if not os.path.exists(path):
        return {}
    try:
        raw = json.load(open(path))
    except (ValueError, json.JSONDecodeError):
        return {}
    return {int(k, 16): v for k, v in raw.items()}


def dtc_lamp(infos):
    """Per-DTC ABS-lamp verdict from its candidate faults: yes / no / depends / ?."""
    v = [i.get("lamp", "?") for i in infos]
    if not v:
        return "?"
    if all(x == "yes" for x in v):
        return "yes"
    if all(x == "no" for x in v):
        return "no"
    if "yes" in v:
        return "depends"
    return "no" if "no" in v else "?"


def decode_status(b):
    """A compact decode of the $18 status byte."""
    bits = []
    if b & 0x80:
        bits.append("warning-lamp")
    if b & 0x40:
        bits.append("confirmed")
    if b & 0x20:
        bits.append("pending")
    if b & 0x01:
        bits.append("present")
    return bits


# ---- high-level module operations ------------------------------------------
class Module:
    def __init__(self, transport, zb="6769162"):
        self.t = transport
        self.zb = zb
        self.keys = load_seedkey(zb)
        self.dtc_names = load_dtc_names()
        self.fault_info = load_fault_info()

    # session / security
    def enter_session(self, level):
        self.t.request([0x10, level])
        return {"session": f"0x{level:02X}"}

    def tester_present(self):
        self.t.request([0x3E, 0x01])
        return {"ok": True}

    def unlock(self, level):
        """level: 0x03 (seedrev), 0x7E (CCP key), 0x7F (coding key)."""
        seed_sub, key_sub = {0x03: (0x03, 0x04), 0x7E: (0xFB, 0xFC),
                             0x7F: (0xFD, 0xFE)}[level]
        body = self.t.request([0x27, seed_sub])
        if len(body) < 4 or body[0] != 0x67:
            raise KwpError(0x22, "no seed")
        seed = (body[2] << 8) | body[3]
        if seed == 0:
            return {"level": f"0x{level:02X}", "already": True}
        if level == 0x03:
            key = kt_seedrev(seed)
        elif level == 0x7E:
            if "ccpKey" not in self.keys:
                raise KwpError(0x33, "no CCP key (0x7E) in seedkey.json")
            key = kt_ccp_key(seed, self.keys["ccpKey"])
        else:
            if "codingKey" not in self.keys:
                raise KwpError(0x33, "no coding key (0x7F) in seedkey.json")
            key = kt_coding_key(seed, self.keys["codingKey"])
        self.t.request([0x27, key_sub, (key >> 8) & 0xFF, key & 0xFF])
        return {"level": f"0x{level:02X}", "seed": f"0x{seed:04X}", "key": f"0x{key:04X}"}

    # identification
    def read_ident(self, iid=0x94):
        """$1A <id>. For 0x94 decode the software-identification string."""
        body = self.t.request([0x1A, iid])
        data = body[2:] if len(body) >= 2 and body[0] == 0x5A else body
        out = {"id": f"0x{iid:02X}", "bytes": data.hex(), "len": len(data),
               "source": IDENT_BLOCKS.get(iid, (0, "?"))[1]}
        if iid == 0x80 and len(data) >= 6:
            # BMW part number (ZB): packed BCD in bytes 2..5 of the 0x80 block (5A 80 00 00 <ZB:4> ...)
            bcd = data[2:6]
            if all((b >> 4) <= 9 and (b & 0xF) <= 9 for b in bcd):
                out["zb"] = bcd.hex().lstrip("0") or "0"
        n = data[0] if data else 0
        s = data[1:1 + n]
        if iid == 0x94 and 0 < n < len(data) and all(0x20 <= b < 0x7F for b in s):
            out["sw_id"] = s.decode("ascii").strip()
            out["tail"] = data[1 + n:].hex()
            if len(data) > 0x15:
                out["keys"] = {"ccpKey": (data[0x11] << 8) | data[0x13],
                               "codingKey": (data[0x14] << 8) | data[0x15]}
                for name, value in out["keys"].items():  # seedkey.json still wins
                    self.keys.setdefault(name, value)
        else:
            out["ascii"] = "".join(chr(b) if 0x20 <= b < 0x7F else "." for b in data)
        return out

    # one-click sequences, order-independent: adjustment session, then unlock
    def enable_coding_write(self):
        self.enter_session(0x87)
        return self.unlock(0x7F)

    def enable_ccp(self):
        self.enter_session(0x87)
        u = self.unlock(0x7E)
        self.t.request([0x31, 0x31, 0x01])  # diagnostic state 4: CCP served on CAN
        return u

    # faults
    def read_dtcs(self):
        body = self.t.request([0x18, 0x02, 0xFF, 0xFF])
        if not body or body[0] != 0x58:
            raise KwpError(0x10, "bad $18 reply")
        count = body[1]
        out = []
        for i in range(count):
            off = 2 + i * 3
            hi, lo, st = body[off], body[off + 1], body[off + 2]
            dtc = (hi << 8) | lo
            faults = self.dtc_names.get(dtc, [])
            infos = [self.fault_info.get(f, {"d": "(no entry)", "lamp": "?", "eff": ""}) for f in faults]
            out.append({
                "dtc": f"0x{dtc:04X}",
                "status": f"0x{st:02X}",
                "status_bits": decode_status(st),
                "faults": [f"0x{f:05X}" for f in faults],
                "info": infos,
                "extra": EXTRA_DTC.get(dtc) if not faults else None,
                "lamp": dtc_lamp(infos),
            })
        return {"count": count, "dtcs": out}

    def clear_dtcs(self):
        self.t.request([0x14, 0xFF, 0xFF])
        return {"cleared": True}

    # coding
    def read_coding(self):
        body = self.t.request([0x23, 0x00, 0x00, 0xFA, 0x03, 0x03])
        data = body[1:] if body and body[0] == 0x63 else body
        cksum, row, field1 = data[0], data[1], data[2]
        ok = cksum == ((row ^ field1) + 1) & 0xFF
        return {"checksum": f"0x{cksum:02X}", "row": row, "field1": field1,
                "checksum_ok": ok, "raw": data.hex()}

    def write_coding(self, row, field1=0):
        """Write row/field1 and the checksum; opens $10 87 + 0x7F itself."""
        self.enable_coding_write()
        cksum = ((row ^ field1) + 1) & 0xFF
        writes = [(0x00FB, row), (0x00FC, field1), (0x00FA, cksum)]
        done = []
        for addr, val in writes:
            self.t.request([0x3D, 0x00, (addr >> 8) & 0xFF, addr & 0xFF, 0x03, 0x01, val])
            done.append({"addr": f"0x{addr:03X}", "value": f"0x{val:02X}"})
        return {"written": done, "note": "takes effect at next power-on"}

    # routines (valve + sensor calibration)
    def run_routine(self, rid, args=None):
        self.enter_session(0x87)  # routines need the adjustment session
        payload = [0x31, rid] + list(args if args is not None else [0x00])  # 0x00 = routine-entry option
        self.t.request(payload)
        return {"started": f"0x{rid:02X}"}

    def routine_status(self, rid):
        body = self.t.request([0x33, rid])
        st = body[2] if len(body) > 2 else 0
        return {"routine": f"0x{rid:02X}", "status": f"0x{st:02X}",
                "running": st == 0x01, "done": st == 0x02}

    # memory / live data
    def read_memory(self, addr, length, mtype=0x03):
        out = bytearray()
        while length > 0:
            n = min(length, 0x20)
            body = self.t.request([0x23, 0x00, (addr >> 8) & 0xFF, addr & 0xFF, mtype, n])
            out += body[1:] if body and body[0] == 0x63 else body
            addr += n
            length -= n
        return {"bytes": out.hex(), "len": len(out)}

    def read_live(self, lid):
        body = self.t.request([0x21, lid])
        data = body[2:] if len(body) >= 2 and body[0] == 0x61 else body
        return {"lid": f"0x{lid:02X}", "bytes": data.hex(), "len": len(data)}

    # brake bleeding / actuator control ($30 10 07)
    def bleed(self, side, pause=0.2, progress=None, cancel=None, lock=None):
        """Run one side's bleeding sequence. progress(i, n, valves, aux) runs before each
        frame; cancel (a threading.Event or any object with is_set()) ends the run early with
        the all-off frame. lock, if given, is held around each K-line exchange."""
        seq = bleed_sequence(side)
        lock = lock if lock is not None else nullcontext()
        with lock:
            self.enter_session(0x87)
        time.sleep(0.1)                      # settle after 10 87
        for i, (valves, aux) in enumerate(seq):
            if cancel is not None and cancel.is_set():
                with lock:
                    self.t.request(bleed_frame(0x00, 0x00))
                return {"side": side, "frames": i, "total": len(seq), "stopped": True}
            if progress:
                progress(i, len(seq), valves, aux)
            with lock:
                self.t.request(bleed_frame(valves, aux))
            if pause:
                time.sleep(pause)
        return {"side": side, "frames": len(seq), "total": len(seq), "stopped": False}

    def actuate(self, wheel):
        """One wheel's inlet + outlet valves with the pump (one-shot form)."""
        if wheel not in WHEEL_MASK:
            raise ValueError("wheel must be FL, FR, RL or RR")
        self.enter_session(0x87)
        self.t.request(actuate_frame(WHEEL_MASK[wheel], 0x10))
        return {"wheel": wheel, "valves": f"0x{WHEEL_MASK[wheel]:02X}"}

    def actuate_off(self):
        self.t.request(bleed_frame(0x00, 0x00))   # everything off
        return {"off": True}

    def read_coding_id(self):
        """Coding via $22 30 00: a cross-check for read_coding()."""
        body = self.t.request([0x22, 0x30, 0x00])
        data = body[3:] if len(body) >= 3 and body[0] == 0x62 else body
        return {"bytes": bytes(data).hex(), "len": len(data)}


def make_transport(mock=True, port=None, baud=9600):
    if mock or not port:
        return MockKwp()
    return RealKwp(port, baud=baud)
