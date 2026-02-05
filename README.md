# MK60E5 Z4 GT3 ABS Tools
Tools and notes to help in the diagnosis and configuration of the MK60E5 out of a BMW Z4 that has been flashed with Z4 GT3 / Motorsport software.  For diagnostics K-Line pin 2 needs to be wired to the diagnostic connector, unlike normal E1/E5.

The part number for these units is 34516769162 with the 829.3 code on the module.  They are compatible with a VW yaw sensor with the part number 7H0907652A, note that this yaw sensor is not pinned the same as the BMW yaw sensor.

## Wiring

| Pin | Usage | Notes |
|-----|-------|-------|
| 1 | Power | 12v 30 amps |
| 2 | K-Line |  |
| 3 | Brake Fluid Level | Splice to ground |
| 4 | Brake Switch Input | Ground normally, open on pedal press |
| 5 |  |  |
| 6 |  |  |
| 7 |  |  |
| 8 |  |  |
| 9 |  |  |
| 10 |  |  |
| 11 | F CAN High | Yaw sensor CAN High |
| 12 |  |  |
| 13 |  |  |
| 14 |  |  |
| 15 | PT CAN Low | For Datalog |
| 16 | Ground |  |
| 17 | Switched Power | 12v 5 amps, spliced to 29 |
| 18 |  |  |
| 19 |  |  |
| 20 |  |  |
| 21 |  |  |
| 22 |  |  |
| 23 |  |  |
| 24 |  |  |
| 25 |  |  |
| 26 | F CAN Low | Yaw sensor CAN Low |
| 27 | PT CAN Ground | Yaw sensor ground |
| 28 |  |  |
| 29 | Switched Power | 12v 5 amps, wakeup, spliced to 17, can be switched for ABS on / off |
| 30 | PT CAN High | For data logging |
| 31 |  |  |
| 32 | Power | 12v 30 amps |
| 33 | FR Wheel Speed Signal |  |
| 34 | FR Wheel Speed Power |  |
| 35 |  |  |
| 36 | RL Wheel Speed Power |  |
| 37 | RL Wheel Speed Signal |  |
| 38 | Parking Brake | Splice to ground |
| 39 | PT CAN Power | Yaw sensor 12v |
| 40 |  |  |
| 41 |  |  |
| 42 | RR Wheel Speed Signal |  |
| 43 | RR Wheel Speed Power |  |
| 44 | ABS Error Light |  |
| 45 | FL Wheel Speed Power |  |
| 46 | FL Wheel Speed Signal |  |
| 47 | Ground |  |