#!/usr/bin/env python3
"""KWP module against the mock and a recording transport: python3 service-tool/test_kwp.py"""
import threading
import unittest
from unittest import mock

import kwp

# The expected (valves, aux) pairs of each side's bleeding sequence, 104 frames.
BLEED_LEFT = "1100 5510 dd10 5510 5510 1110 1110 5510 dd10 5510 5510 1110 1110 5510 dd10 5510 5510 1110 1110 5510 dd10 5510 5510 1110 1110 5510 dd10 5510 5510 1110 1110 5510 dd10 5510 5510 1110 1110 5510 dd10 5510 5510 1110 1110 5510 dd10 5510 5510 1110 1110 5510 dd10 5510 5510 1110 1110 5510 dd10 5510 5510 1110 1110 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 000f 000f 0000"
BLEED_RIGHT = "4400 5510 7710 5510 5510 4410 4410 5510 7710 5510 5510 4410 4410 5510 7710 5510 5510 4410 4410 5510 7710 5510 5510 4410 4410 5510 7710 5510 5510 4410 4410 5510 7710 5510 5510 4410 4410 5510 7710 5510 5510 4410 4410 5510 7710 5510 5510 4410 4410 5510 7710 5510 5510 4410 4410 5510 7710 5510 5510 4410 4410 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 000f 000f 0000"


class Recorder:
    """Records every request and answers with a generic positive response."""
    kind = "fake"

    def __init__(self):
        self.log = []

    def request(self, p):
        self.log.append(" ".join(f"{b:02x}" for b in p))
        return bytes([p[0] | 0x40] + list(p[1:]))

    def close(self):
        pass


def pairs(seq):
    return " ".join(f"{v:02x}{a:02x}" for v, a in seq)


class RoutineTests(unittest.TestCase):
    def test_routine_sends_option_byte(self):
        t = Recorder()
        kwp.Module(t).run_routine(0x29)
        self.assertEqual(t.log, ["10 87", "31 29 00"])

    def test_routine_explicit_args_win(self):
        t = Recorder()
        kwp.Module(t).run_routine(0x31, [0x01])
        self.assertEqual(t.log[-1], "31 31 01")


class BleedTests(unittest.TestCase):
    def test_sequences(self):
        self.assertEqual(pairs(kwp.bleed_sequence("left")), BLEED_LEFT)
        self.assertEqual(pairs(kwp.bleed_sequence("right")), BLEED_RIGHT)
        self.assertEqual(len(kwp.bleed_sequence("left")), 104)
        with self.assertRaises(ValueError):
            kwp.bleed_sequence("front")

    def test_frames(self):
        self.assertEqual(kwp.bleed_frame(0x11, 0x10), [0x30, 0x10, 0x07, 0x11, 0x10, 0x01, 0x11, 0x10])
        self.assertEqual(kwp.actuate_frame(0xC0, 0x10), [0x30, 0x10, 0x07, 0x00, 0x00, 0xFF, 0xC0, 0x10])
        self.assertEqual(kwp.WHEEL_MASK, {"FL": 0x03, "FR": 0x0C, "RL": 0x30, "RR": 0xC0})
        self.assertEqual(kwp.bleed_desc(0xDD, 0x10), "FL, FR (both), RL, RR (both), pump")
        self.assertEqual(kwp.bleed_desc(0x00, 0x0F), "switching valves")
        self.assertEqual(kwp.bleed_desc(0x00, 0x00), "all off")

    @mock.patch("kwp.time.sleep")
    def test_bleed_runs_the_whole_sequence(self, _sleep):
        t = Recorder()
        steps = []
        r = kwp.Module(t).bleed("left", pause=0, progress=lambda i, n, v, a: steps.append(i))
        self.assertEqual(r, {"side": "left", "frames": 104, "total": 104, "stopped": False})
        self.assertEqual(len(t.log), 105)
        self.assertEqual(t.log[0], "10 87")
        self.assertEqual(t.log[1], "30 10 07 11 00 01 11 00")
        self.assertEqual(t.log[-1], "30 10 07 00 00 01 00 00")
        for line in t.log[1:]:
            b = line.split()
            self.assertEqual(len(b), 8)
            self.assertEqual(b[:3], ["30", "10", "07"])
            self.assertEqual(b[5], "01")
            self.assertEqual((b[3], b[4]), (b[6], b[7]))
        self.assertEqual(steps, list(range(104)))

    @mock.patch("kwp.time.sleep")
    def test_bleed_cancel_sends_all_off(self, _sleep):
        t = Recorder()
        cancel = threading.Event()

        def progress(i, n, v, a):
            if i == 2:
                cancel.set()

        lock = threading.Lock()
        r = kwp.Module(t).bleed("right", pause=0, progress=progress, cancel=cancel, lock=lock)
        self.assertEqual(r, {"side": "right", "frames": 3, "total": 104, "stopped": True})
        self.assertEqual(len(t.log), 5)
        self.assertEqual(t.log[1], "30 10 07 44 00 01 44 00")
        self.assertEqual(t.log[-1], "30 10 07 00 00 01 00 00")
        self.assertFalse(lock.locked())

    def test_actuate(self):
        t = Recorder()
        m = kwp.Module(t)
        self.assertEqual(m.actuate("RR"), {"wheel": "RR", "valves": "0xC0"})
        m.actuate_off()
        self.assertEqual(t.log, ["10 87", "30 10 07 00 00 ff c0 10", "30 10 07 00 00 01 00 00"])
        with self.assertRaises(ValueError):
            m.actuate("LF")


class MockTests(unittest.TestCase):
    def test_30_needs_session_and_22_reads_coding(self):
        t = kwp.MockKwp()
        with self.assertRaises(kwp.KwpError) as cm:
            t.request(kwp.bleed_frame(0x11, 0))
        self.assertEqual(cm.exception.nrc, 0x22)
        t.request([0x10, 0x87])
        self.assertEqual(t.request(kwp.bleed_frame(0x11, 0)), bytes([0x70, 0x10, 0x07]))
        self.assertEqual(kwp.Module(t).read_coding_id(), {"bytes": "fa0000", "len": 3})

    @mock.patch("kwp.time.sleep")
    def test_bleed_against_mock(self, _sleep):
        r = kwp.Module(kwp.MockKwp()).bleed("left", pause=0)
        self.assertEqual(r["frames"], 104)

    def test_dtc_extra_names(self):
        t = kwp.MockKwp()
        t.dtcs = [(0x5D, 0xE0, 0x60), (0x5E, 0x59, 0x60)]
        j = kwp.Module(t).read_dtcs()
        self.assertIn("brake-pad thickness", j["dtcs"][0]["extra"])
        self.assertEqual(j["dtcs"][0]["lamp"], "?")
        self.assertIsNone(j["dtcs"][1]["extra"])        # 5E59 has an internal decode


if __name__ == "__main__":
    unittest.main()
