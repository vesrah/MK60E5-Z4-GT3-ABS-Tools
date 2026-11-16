# MK60E1 vs MK60E5 (M3): CAN differences

What differs on the two CAN buses between the E90 MK60E1 (DSC81, software 6769845A) and the E9x M3 MK60E5 (software
7846816A). The two DBC pairs in this folder are the detail:

| Module | PT-CAN | F-CAN |
|---|---|---|
| MK60E1 | `e90_mk60e1_dsc_6769845A_ptcan.dbc` (40 messages) | `e90_mk60e1_dsc_6769845A_fcan.dbc` (16 messages) |
| MK60E5 M3 | `e90_mk60e5_dsc_7846816A_ptcan.dbc` (48 messages) | `e90_mk60e5_dsc_7846816A_fcan.dbc` (32 messages) |

**In short:** the MK60E1 runs the same application with the MK60E5-only features taken out. The frames a datalogger
normally wants are identical on both. The MK60E1 lacks the raw longitudinal-acceleration frames, CCP, the
start/stop (MSA) input and everything to do with hill-hold, brake pre-fill, disc drying and M-Drive. Its steering-angle
sensor arrives on `0x0C8` instead of `0x0C9`.

Both files come from the firmware images, not from bus captures. Layouts and fixed or discarded fields were read from
each image. Meanings and scalings on the MK60E1 are carried over from the M3 where the handler matches and were not
verified separately.

## Identical on both

Same ID, length, period and field layout, and the same handling in the firmware:

- **Sent, PT-CAN:** `0x0C4` steering angle, `0x0CE` wheel speeds, `0x1A0` speed / accelerations / yaw rate, `0x1A6`
  distance pulses, `0x31D` tyre-pressure status, `0x374` wheel tolerance, `0x4A9` network management, `0x5A9` cluster
  messages, `0x629` diagnostic response.
- **Received, PT-CAN:** `0x0A8` and `0x0A9` engine torque, `0x130` terminal status, `0x1B4` cluster status
  (discarded), `0x2E4` trailer, `0x316` and `0x319` buttons, `0x330` odometer, `0x380` VIN, `0x388` vehicle type
  (discarded), `0x398` chassis controls, `0x480` network management, `0x580` service answers, `0x6F1` diagnostic
  request.
- **F-CAN:** `0x080` sensor command, `0x0CE` wheel speeds, `0x11E` AFS interventions, `0x130` terminal status relay,
  `0x374` wheel tolerance; the sensor cluster `0x0CD` / `0x0D1` / `0x0D4` / `0x140`; `0x194`, `0x1D6` and `0x2A6`
  (forwarded to PT-CAN by both).

## Frames only the MK60E5 M3 has

| Bus | ID | Direction | What |
|---|---|---|---|
| PT-CAN | `0x0BF` | sent | Drivetrain wheel-torque request (all fields "not available") |
| PT-CAN | `0x0E1` | sent | Brake wheel torque (constants only); the MK60E1 sends `0x0DF` instead |
| PT-CAN | `0x193` | sent | Cruise display (all fields "not available") |
| PT-CAN | `0x1A3` | sent | Raw longitudinal acceleration and learned offset, 20 ms |
| PT-CAN | `0x2B3` | sent | The same two values at a coarser scale, 50 ms |
| PT-CAN | `0x797` / `0x798` | received / sent | CCP command and reply; the MK60E1 has no CCP at all |
| PT-CAN | `0x0AC`, `0x0B4` | received | Drivetrain wheel torque 2 and 1 (discarded) |
| PT-CAN | `0x308` | received | Start/stop (MSA) status |
| PT-CAN and F-CAN | `0x1D9` | received on F-CAN, forwarded | M-Drive button |
| F-CAN | `0x0C9` | received | Steering-angle sensor frame for the DSC (see below) |
| F-CAN | `0x78E`, `0x78F`, `0x790`, `0x791`, `0x797`, `0x798` | both | Peer exchange with an external brake-request module (off in the stock calibration) |
| F-CAN | `0x7D4`..`0x7D8`, `0x7DC`..`0x7DF` | both | Continental-internal records |

Both modules receive a 2-byte `0x1A3` (ACC long-term frame) on PT-CAN and discard it. The M3 file gives only the sent
layout for that ID, the MK60E1 file only the received one.

## Frames only the MK60E1 has

| Bus | ID | Direction | What |
|---|---|---|---|
| PT-CAN | `0x0DF` | sent, 20 ms | Brake wheel torque in the place of `0x0E1`: constants only, its last three fields 2 bits each |
| PT-CAN | `0x190` | received | Three fields, all discarded; sender and meaning not established |
| F-CAN | `0x0C3` | received | Three fields, all discarded; sender and meaning not established |

## Steering-angle sensor

| | MK60E1 | MK60E5 M3 |
|---|---|---|
| Frame the DSC reads | F-CAN `0x0C8` | F-CAN `0x0C9` |
| Angle | bits 0..15 | bits 0..15 |
| Angle rate | bits 24..39, read directly | from the service data (selector 11); bits 24..39 hold a second, inverted angle for a plausibility check |
| Status fields | bits 16..17 and 40..41 | bits 16..17, 18..19 and 40..41 |
| Service data | selector at bits 44..47, word at 48..63 | the same |
| `0x0C8` | evaluated; copies forwarded to PT-CAN when a forward flag is set | not evaluated; forwarded to PT-CAN |

`0x0C4`, the angle the DSC relays on PT-CAN, has the same layout on both.

## Same frame, different fields

| Bus | ID | Field | MK60E1 | MK60E5 M3 |
|---|---|---|---|---|
| PT-CAN | `0x0B6` | bits 38..39 | absent | two ABS motion-state bits |
| PT-CAN | `0x19E` | bits 26..27 | fixed 3 | master pressure above the hill-hold threshold |
| PT-CAN | `0x19E` | ABS status, bits 8..9 | 2 while the ABS fault is latched | also 2 while ABS is degraded with the lamp on |
| PT-CAN | `0x2B2` | hill-hold state, bits 50..52 | fixed 0 | live |
| PT-CAN | `0x2B2` | brake pre-fill state, bits 56..57 | fixed 0 | live |
| PT-CAN | `0x2B2` | disc-drying state, bits 59..60 | fixed 0 | live |
| PT-CAN | `0x0AA` | pedal / cruise state, bits 52..55 | discarded | stored (brake pre-fill) |
| PT-CAN | `0x0BA` | bits 62..63 | absent | a gear flag |
| PT-CAN | `0x0D5` | length | 5 bytes | 6 bytes (two more bits, discarded) |
| PT-CAN | `0x226` | rain state byte and mode word | not read; only the selector nibble is stored | all three read (disc drying) |
| PT-CAN | `0x2A6` | receive record | none | present, fields discarded |
| PT-CAN | `0x310` | outside temperature | discarded | stored (tyre temperature model) |
| PT-CAN | `0x399` | M-Drive state and configured DSC mode | discarded (checksum and alive still checked) | used |
| PT-CAN | `0x3B0` | reverse gear | discarded | used on manual cars (hill-hold) |
| F-CAN | `0x118`, `0x11F` | bits 56..63 | not in the table | named in the DBC, not read |

## Not differences

- **Cycle times on received F-CAN frames.** The MK60E1 file carries the periods from that firmware's table (10 ms for
  the cluster frames, 200 ms for `0x194`, 1000 ms for `0x1D6`); the M3 file leaves them out because its sources do not
  give them. This is a gap in the M3 file, not a behaviour difference.
- **`0x080` period.** The M3 file gives 10 ms, which was established on that image; the MK60E1 file gives none. The
  routine that fills the frame is the same on both.
- **`0x11E`.** The M3 holds this frame off and never sends it. Whether the MK60E1 sends it was not checked.
- **Service-data multiplexer.** The M3 file decodes it selector by selector on `0x0C9`; the MK60E1 file leaves it as a
  selector and a raw word on `0x0C8` because the selectors were not checked one by one there.
