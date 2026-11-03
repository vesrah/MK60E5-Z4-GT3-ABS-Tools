#!/usr/bin/env python3
"""Local bridge server for the Z4 GT3 DSC60 web tool.

Serves the single-page UI and a small JSON API that drives the module over
KWP2000 (K-line). Runs in mock mode by default so the UI works with no
hardware; pass --port to talk to a real K+DCAN cable.

    python3 tools/webtool/server.py                 # mock, http://127.0.0.1:8730
    python3 tools/webtool/server.py --port /dev/cu.usbserial-XXXX --baud 9600

Only loopback is bound. This tool writes coding, runs valve/sensor
routines and the brake-bleeding sequence; those are gated behind explicit confirmations in the UI and the
module's own session/security/stationary checks. The Dump tab reads flash and
RAM over CCP on a CAN adapter through python-can (see ccp.py).
"""
import argparse
import json
import os
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import ccp
import kwp

HERE = os.path.dirname(os.path.abspath(__file__))
_lock = threading.Lock()
_state = {"module": None, "cfg": {}}
_dump = {"thread": None, "cancel": None, "status": {"state": "idle"}}


def _connect(cfg):
    mod = _state.get("module")
    if mod is not None:
        try:
            mod.t.close()
        except Exception:
            pass
    t = kwp.make_transport(mock=cfg.get("mock", True),
                           port=cfg.get("port"), baud=int(cfg.get("baud", 9600)))
    _state["module"] = kwp.Module(t, zb=cfg.get("zb", "6769162"))
    _state["cfg"] = cfg
    return {"kind": t.kind, "keys": sorted(_state["module"].keys.keys())}


def _hexint(v):
    """Accept an int (from JSON) or a hex string like '0x7F' / '0FA'."""
    return int(v, 16) if isinstance(v, str) else int(v)


def _dump_start(mod, body):
    """Start a background CCP dump into dumps/. It runs on CAN, beside the K-line session."""
    if _dump["thread"] is not None and _dump["thread"].is_alive():
        raise RuntimeError("a dump is already running")
    start, size = _hexint(body["start"]), _hexint(body["size"])
    interface = body.get("interface", "pcan")
    mock = interface == "mock"
    name = f"{'mock_' if mock else ''}dump_0x{start:06x}_0x{start + size - 1:06x}.bin"
    path = os.path.join(HERE, "dumps", name)

    def enable():
        with _lock:
            try:
                mod.enable_ccp()
            except kwp.KwpError as e:
                if e.nrc != 0x22:  # 0x22 = already enabled, CONNECT gets retried either way
                    raise

    if mock:
        bus, message = ccp.MockCcpBus(enabled=lambda: getattr(mod.t, "ccp_enabled", True)), ccp.Frame
    else:
        bus, message = ccp.open_bus(interface, body.get("channel", "PCAN_USBBUS1"))
    cancel = threading.Event()
    status = {"state": "running", "start": start, "size": size, "next": 0, "rate": 0, "path": path}

    def progress(offset, rate):
        status.update(next=offset, rate=round(rate))

    def run():
        try:
            status.update(ccp.dump_region(ccp.CcpClient(bus, message), start, size, path,
                                          fresh=bool(body.get("fresh")),
                                          # a mock K-line can't turn CCP on in a real module
                                          enable=enable if mock or mod.t.kind != "mock" else None,
                                          progress=progress, cancel=cancel))
        except Exception as e:  # noqa - surfaced through dump_status
            status.update(state="error", detail=str(e))  # not "error": that fails the API call
        finally:
            bus.shutdown()

    _dump.update(status=status, cancel=cancel, thread=threading.Thread(target=run, daemon=True))
    _dump["thread"].start()
    return status


def _dump_cancel():
    if _dump["cancel"] is not None:
        _dump["cancel"].set()
    return _dump["status"]


_bleed = {"thread": None, "cancel": None, "status": {"state": "idle"}}


def _bleed_start(mod, body):
    """Run a bleeding sequence in the background; poll bleed_status, bleed_cancel stops it."""
    if _bleed["thread"] is not None and _bleed["thread"].is_alive():
        raise RuntimeError("a bleeding run is already in progress")
    side = body.get("side", "left")
    pause = float(body.get("pause", 0.2))
    total = len(kwp.bleed_sequence(side))
    cancel = threading.Event()
    status = {"state": "running", "side": side, "frame": 0, "total": total, "desc": "", "valves": 0, "aux": 0}

    def progress(i, n, valves, aux):
        status.update(frame=i + 1, total=n, valves=valves, aux=aux, desc=kwp.bleed_desc(valves, aux))

    def run():
        try:
            r = mod.bleed(side, pause=pause, progress=progress, cancel=cancel, lock=_lock)
            status.update(state="stopped" if r["stopped"] else "done", frame=r["frames"])
        except Exception as e:  # noqa - surfaced through bleed_status
            status.update(state="error", detail=str(e))
            try:
                with _lock:
                    mod.actuate_off()
            except Exception:
                pass

    _bleed.update(status=status, cancel=cancel, thread=threading.Thread(target=run, daemon=True))
    _bleed["thread"].start()
    return status


def _bleed_cancel():
    if _bleed["cancel"] is not None:
        _bleed["cancel"].set()
    return _bleed["status"]


def _dispatch(action, body):
    if action == "connect":
        return _connect(body)
    if action == "dump_status":
        return _dump["status"]
    if action == "dump_cancel":
        return _dump_cancel()
    if action == "bleed_status":
        return _bleed["status"]
    if action == "bleed_cancel":
        return _bleed_cancel()

    mod = _state.get("module")
    if mod is None:
        mod = _state["module"] = kwp.Module(kwp.make_transport(mock=True))

    handlers = {
        "session":        lambda: mod.enter_session(_hexint(body["level"])),
        "unlock":         lambda: mod.unlock(_hexint(body["level"])),
        "enable_ccp":     mod.enable_ccp,
        "enable_coding_write": mod.enable_coding_write,
        "tester_present": mod.tester_present,
        "read_ident":     lambda: mod.read_ident(_hexint(body.get("id", 0x94))),
        "read_dtcs":      mod.read_dtcs,
        "clear_dtcs":     mod.clear_dtcs,
        "read_coding":    mod.read_coding,
        "read_coding_id": mod.read_coding_id,
        "write_coding":   lambda: mod.write_coding(int(body["row"]), int(body.get("field1", 0))),
        "run_routine":    lambda: mod.run_routine(_hexint(body["rid"]), body.get("args")),
        "routine_status": lambda: mod.routine_status(_hexint(body["rid"])),
        "read_memory":    lambda: mod.read_memory(_hexint(body["addr"]), int(body["length"]),
                                                  int(body.get("mtype", 3))),
        "read_live":      lambda: mod.read_live(_hexint(body["lid"])),
        "bleed_start":    lambda: _bleed_start(mod, body),
        "actuate":        lambda: mod.actuate(body["wheel"]),
        "actuate_off":    mod.actuate_off,
        "dump_start":     lambda: _dump_start(mod, body),
    }

    fn = handlers.get(action)
    if fn is None:
        return {"error": f"unknown action {action}"}
    return fn()


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, data, ctype="application/json"):
        payload = data if isinstance(data, bytes) else json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        path = self.path.split("?")[0]
        if path in ("/", "/index.html"):
            with open(os.path.join(HERE, "index.html"), "rb") as f:
                return self._send(200, f.read(), "text/html; charset=utf-8")
        self._send(404, {"error": "not found"})

    def do_POST(self):
        if not self.path.startswith("/api/"):
            return self._send(404, {"error": "not found"})
        action = self.path[len("/api/"):].split("?")[0]
        n = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(n) or b"{}") if n else {}
        try:
            with _lock:
                result = _dispatch(action, body)
            self._send(200, result)
        except kwp.KwpError as e:
            self._send(200, {"error": str(e), "nrc": f"0x{e.nrc:02X}"})
        except Exception as e:  # noqa
            self._send(200, {"error": f"{type(e).__name__}: {e}"})

    def log_message(self, *a):
        pass


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", help="serial device; omit for mock mode")
    ap.add_argument("--baud", type=int, default=9600)
    ap.add_argument("--zb", default="6769162")
    ap.add_argument("--http-port", type=int, default=8730)
    args = ap.parse_args()
    _connect({"mock": not args.port, "port": args.port, "baud": args.baud, "zb": args.zb})
    mode = "MOCK (no hardware)" if not args.port else f"SERIAL {args.port} @ {args.baud}"
    print(f"Z4 GT3 DSC web tool  -  {mode}")
    print(f"open http://127.0.0.1:{args.http_port}/")
    ThreadingHTTPServer(("127.0.0.1", args.http_port), Handler).serve_forever()


if __name__ == "__main__":
    main()
