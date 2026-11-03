# MK60E5 Z4 GT3 service tool

A small browser diagnostic tool for the flashed MK60E5 (ZB 6769162). It reads
and clears faults, reads and writes coding, runs the valve- and sensor-offset
calibration routines, bleeds the brakes, and reads live data and memory - over
the module's own KWP2000 services on K-line.

## Two ways to run

**Browser only - `standalone.html` (recommended).** Chrome/Edge can open the
K+DCAN cable directly through the Web Serial API, so the browser does all the
KWP itself; there is no backend. Web Serial needs a secure context, so serve
the file over `http://localhost` or `https://` (not `file://`):

```sh
python3 -m http.server 8000     # then open http://localhost:8000/service-tool/standalone.html
```

or host it on any https page (this repo's GitHub Pages works). It also carries
a built-in mock, so it runs in any browser with no hardware for a dry run.

**Python bridge - `server.py` + `index.html`.** Use this to script it. Mock mode
needs only Python 3; real mode needs `pyserial` and a K+DCAN cable:

```sh
python3 service-tool/server.py                       # mock, http://127.0.0.1:8730
python3 service-tool/server.py --port /dev/cu.usbserial-XXXX --baud 9600
```

Real mode's dependencies are in `requirements.txt` (`pip install -r
service-tool/requirements.txt`).

## Features → KWP services

| Feature | Service(s) | Preconditions |
|---|---|---|
| Part number (ZB) | `$1A 80` -> `5A 80 00 00 <ZB: 4 bytes packed BCD> ...` (29 bytes; indices and dates follow) | none; read on connect |
| Software ID / identification | `$1A 94` -> `5A 94` + 30 bytes (software ID string + binary tail); `$1A 80/8F/90/99` EEPROM ident records | none; read on connect |
| Read faults | `$18 02 FF FF` -> `58 count [hi lo status]...` | none |
| Clear faults | `$14 FF FF` | none (coding DTC returns next power-on) |
| Read coding | `$23 00 00 FA 03 03` (EEPROM 0x0FA-0x0FC) | none |
| Read coding (cross-check) | `$22 30 00` (readDataByCommonIdentifier 0x3000) | none |
| Write coding | `$3D 00 00 FB 03 01 DD` x3 (row, field1, checksum) | `$10 87` + security `0x7F` |
| Valve calibration | `$31 29 00` outlet-valve learn first, then `$31 28 00` inlet, `$33` status | session; actuates valves |
| Sensor calibration | `$31 20/21/22/24 00` offsets | stationary |
| Brake bleeding | `$30 10 07 <valves> <aux> 01 <valves> <aux>`, 104 frames per side; one-shot per wheel `$30 10 07 00 00 FF <valves> 10` | session; runs the pump, pulses the valves |
| Live data | `$21 0x02/0x05/0x06/0x07` | none |
| Memory read | `$23 00 HH LL 03 NN` (type 3 = EEPROM) | none |

## Faults and the ABS lamp

A few DTCs (brake-pad thickness `0x5DE0`-`0x5DE3`, pressure transducer 2 `0x5E21`, SZL serial number `0x5E50`/`0x5E51`) have a name but no internal fault entry, so their ABS-lamp column is shown as unknown.

A `$18` DTC is a 2-byte number that several internal fault bits can share, so
the tool lists every candidate fault behind each DTC with its meaning. The
**ABS lamp** column says whether that fault switches ABS off, which is what
drives the ABS warning lamp output (pin 44):

- **yes** - the fault sets the ABS-off reaction (wheel-speed sensor faults,
  ECU / valve-relay / valve-driver faults, master pressure invalid `0x150004`,
  CAN faults `0xB0002` / `0xB0004`, the CAN scan fault `0xC1000`), or requests
  the lamp directly (`0x10080`, `0x12000`).
- **no** - traced and does not. Engine-CAN loss (`0xA0008`), the coding faults
  (`0x5E59`) and the steering faults (`0x1200xx`, including "offset never
  calibrated" `0x120080`) only disable brake TCS / ASR or mark yaw, lateral
  acceleration and steering untrusted; the ABS keeps working and the lamp
  stays off.
- **depends** - the DTC is shared by faults with different verdicts.
  `0x5E1F` is the common case: `0xB0002` lights the lamp, `0x120008` /
  `0x120080` do not.
- **not traced** - groups whose lamp behaviour isn't characterised here.

The lamp also lights during the power-on self-test.
Status `0x40` in the status byte means the fault is currently present, not just
stored. The TCS/DSC indicator (lamp channel 3) is only sent on CAN (`0x1A0`)
and is not covered by the column.

## Security key

Writing coding and unlocking levels `0x7E`/`0x7F` need the per-unit `$27`
constants for your unit. They are **not** stored in this repo; each page takes
them from the module's `$1A 94` block on connect. To override them, type them
into the two toolbar fields in `standalone.html`, or for `server.py` put a
`seedkey.json` next to the scripts (it is gitignored) with your own values:

```json
{ "6769162": { "ccpKey": "0x....", "codingKey": "0x...." } }  (old names afb9e/afb10 still accepted)
```

Mock mode needs no key. The two toolbar buttons, **Unlock: Enable CCP** (`10 87`, `27 FB/FC` with the CCP key (0x7E), `31 31 01`) and **Unlock: Enable Coding Write** (`10 87`, `27 FD/FE` with the coding key (0x7F)), run their whole sequence in order; coding writes and calibration routines open the session they need themselves. The constants are read from the fields at the moment you click, so they can be typed after connecting.

## Brake bleeding

The **Bleeding** tab runs the module's bleeding sequence one side at a time
(left = FL + RL, right = FR + RR). It opens the adjustment session (`10 87`),
then sends 104 `$30` InputOutputControlByLocalIdentifier frames on local id
`0x10`, control parameter `0x07` (short-term adjustment):

```
30 10 07 <valves> <aux> 01 <valves> <aux>
```

`valves` has two bits per wheel (FL bits 0-1, FR 2-3, RL 4-5, RR 6-7);
`aux` is `0x10` for the pump motor, `0x0F` for the four switching valves and
`0x00` for everything off. Each side runs about a minute at the default 200 ms
pause between frames: a pump-on phase cycling the valves, twenty on/off pulses
of that side's wheels, the switching valves, then all off. **Stop** sends the
all-off frame and ends the run; the page shows the frame count and the valves
and pump state as it goes.

The same tab has a one-shot per-wheel form, `30 10 07 00 00 FF <valves> 10`
(that wheel's inlet + outlet valves with the pump), and an **All off** button.
The one-shot form is unverified on hardware. In the hosted page the sequence is
also offered for the M3 target over CAN; it has not been verified on that module.

## Safety

Writes, valve routines and bleeding are confirmed in the UI and gated by the module's own
session, security and stationary checks. Valve calibration actuates the valves
and pump - bench only. Bleeding runs the pump and pulses the valves for about a
minute per side; **Stop** sends the all-off frame. Coding writes take effect at the next power-on and the
checksum is recomputed for you.

## Files

- `standalone.html` - browser-only tool (Web Serial + built-in mock), one file.
- `server.py` - loopback HTTP + JSON bridge for the Python path.
- `kwp.py` - the KWP service layer (serial + mock transports, key algorithms).
- `test_pcan_usb.js` - tests for the WebUSB PCAN-USB driver in `assets/pcan_usb.js`; run `node service-tool/test_pcan_usb.js`.
- `test_kwp.js` - tests for the KWP module in `assets/kwp.js` (MD5, M3 level-5 auth, routines, bleeding); run `node service-tool/test_kwp.js`.
- `test_kwp.py` - the same for `kwp.py` against the mock; run `python3 service-tool/test_kwp.py`.
- `requirements.txt` - Python dependencies for real-hardware mode; mock mode needs none.
- `index.html` - UI served by `server.py`.
- `dtcmap.json` - DTC -> internal-fault decode table.
- `faultinfo.json` - internal fault -> meaning, ABS-lamp verdict and effect (source of truth for the `FAULTINFO` table embedded in `standalone.html` and `assets/kwp.js`).
