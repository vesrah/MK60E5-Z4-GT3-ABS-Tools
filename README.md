# MK60E5 Z4 GT3 ABS Tools
Tools and notes to help in the diagnosis and configuration of the MK60E5 out of a BMW Z4 that has been flashed with Z4 GT3 / Motorsport software.  For diagnostics K-Line pin 2 needs to be wired to the diagnostic connector, unlike normal E1/E5.

The part number for these units is 34516769162 with the 829.3 code on the module.  They are compatible with a VW yaw sensor with the part number 7H0907652A, note that this yaw sensor is not pinned the same as the BMW yaw sensor.

## CANBUS
These units, when flashed, read tire circumference (front and rear separately), a traction-control threshold and mode, an ABS intervention level, and a gear-shift flag - all from a single CAN message, ID `0x5BA`. The hosted page at https://vesrah.github.io/MK60E5-Z4-GT3-ABS-Tools/ generates that message for your settings and also includes the diagnostic service tool (see below).

### ABS intervention level (`0x5BA` byte 7)
The firmware handles the level linearly. A higher level makes ABS intervene earlier (on a smaller wheel deceleration); **level 0 is the most permissive** (ABS waits the longest). This is *not* the 0-9-8-…-1 order some documentation lists. The level sets the base wheel-deceleration threshold, which sits on top of a base calibration already roughly 0.25–0.45 g more permissive than the road car (1.25g).

### Tire circumference (`0x5BA` bytes 3–6)
Front and rear circumference in mm (low byte first within each pair). The module accepts a new pair only when both values are 1500–3000 and the car is essentially stopped (reference speed < 4 km/h), so a size change takes effect at a standstill. Until the first accepted pair it uses the built-in defaults.

### Traction control (`0x5BA` bytes 1–2)
Byte 1 is a slip-threshold factor (30–250 %).
Byte 2 selects the TCS mode (0 = engine-torque cut off, 1/2 = on).
Note that brake-based traction control cannot be fully switched off by this message - "off" only disables the engine-torque request - and stability control (AYC / yaw braking) is disabled in this software regardless of these settings.

### Gear-shift flag (`0x5BA` byte 8)
0 none, 1 up, 2 down. A non-zero value suppresses rear-wheel ABS for about 150 ms to ride out the driveline disturbance of a shift.

### Steering / stability
The GT3 software runs with no steering-angle sensor by default, and treats yaw and lateral acceleration as untrusted (and keeps stability control off) until a steering zero calibration is done. A steering sensor, if fitted, lives on the main CAN bus (`0x0C2`), not the F-CAN yaw bus. The yaw sensor on F-CAN supplies yaw rate plus lateral and longitudinal acceleration.

### CAN databases (DBC)
The [`dbc/`](dbc/) folder has DBC files for datalogging and bus work:

- `z4_gt3_dsc_6769162_main.dbc` - the main bus (what you tap on PT-CAN for datalogging): 20 messages, including the four wheel speeds, the wheel pressures, the Brake 1/2/3 status and lamp messages, the engine-torque requests, and the `0x5BA` config message.
- `z4_gt3_dsc_6769162_fcan.dbc` - the F-CAN sensor-cluster bus: 4 messages carrying yaw rate and lateral/longitudinal acceleration from the yaw sensor.

## Service tool
The hosted page (root [`index.html`](index.html), styles and scripts under [`assets/`](assets/)) combines the `0x5BA` generator with a browser diagnostic tool: read and clear faults, read and write coding, run the valve- and sensor-calibration routines, bleed the brakes, and read live data and memory over K-line. It runs entirely in Chrome/Edge via the Web Serial API (no backend); other browsers get the generator and a mock. It needs a K+DCAN cable on pin 2, and the `$27` security constants for coding writes are supplied by you, not shipped in the repo.

On connect the tool reads the module's BMW part number (ZB, from `$1A 80`) and its software identification (`$1A 94`, a fixed identification string) and shows both in the header. The `$1A 94` block also carries the module's own `$27` key constants (the CCP key (0x7E) and coding key (0x7F)), so the tool extracts them and fills the toolbar fields automatically; you only need to type a constant if you are overriding it. The fault readout decodes each DTC to its internal fault code(s), says what each one means, and whether it switches ABS off and lights the ABS warning lamp (pin 44); see [`service-tool/README.md`](service-tool/README.md#faults-and-the-abs-lamp) for the rule and its limits.

A **Target** selector switches between the Z4 GT3 (K-line KWP) and the road-car M3, whose diagnostics are on CAN. For the M3, **Connect** uses a PEAK PCAN-USB through WebUSB (KWP over ISO-TP, `0x6F1`/`0x629`, 500 kbit/s); the Web Serial option remains for a D-CAN cable (BMW-FAST framing, to be confirmed on hardware). On the M3 it reads fault codes, runs the same sensor-zeroing routines and can run the brake-bleeding sequence (unverified on that module); codes are shown raw (the M3 has its own fault table, not the Z4 decode). Supply the matching unit's `$27` constants either way. The two **Unlock** buttons run the whole sequence themselves (adjustment session `10 87`, seed, key, and for CCP the `31 31 01` enable routine), and coding writes and calibration routines open the session they need, so nothing has to be clicked in a particular order.

The hosted page has a WebUSB driver for the classic PEAK PCAN-USB ([`assets/pcan_usb.js`](assets/pcan_usb.js)) with a receive-only adapter test, on the Memory / live tab.

A single-file copy and an optional Python-bridge version are in [`service-tool/`](service-tool/) for running locally or scripting; see [`service-tool/README.md`](service-tool/README.md). (The Target selector is in the hosted page; the single-file and Python copies are Z4-only for now.)

## Wiring

##### Z4 MK60E5

| Pin | Usage | Notes |
|-----|-------|-------|
| 1 | Power | 12v 30 amps |
| 2 | K-Line | Required for diagnostics |
| 3 | Brake Fluid Level | Splice to ground; fluid monitor not used by firmware |
| 4 | Brake Switch Input | Ground normally, open on pedal press; ABS uses master pressure, not this switch |
| 5 |  |  |
| 6 |  |  |
| 7 |  |  |
| 8 |  |  |
| 9 |  |  |
| 10 |  |  |
| 11 | F CAN High | Yaw sensor CAN High (yaw + accel; not steering) |
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
| 38 | Parking Brake | Splice to ground; not read by firmware |
| 39 | PT CAN Power | Yaw sensor 12v |
| 40 |  |  |
| 41 |  |  |
| 42 | RR Wheel Speed Signal |  |
| 43 | RR Wheel Speed Power |  |
| 44 | ABS Error Light | ABS warning lamp output |
| 45 | FL Wheel Speed Power |  |
| 46 | FL Wheel Speed Signal |  |
| 47 | Ground |  |

##### VW Yaw Sensor

| Pin | Usage
|-----|-------|
| 1 | 12v Power |
| 2 | CAN Low |
| 3 | Ground |
| 4 | CAN High |