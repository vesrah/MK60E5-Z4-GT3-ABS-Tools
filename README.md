# MK60E5 Z4 GT3 ABS Tools
Tools and notes to help in the diagnosis and configuration of the MK60E5 out of a BMW Z4 that has been flashed with Z4 GT3 / Motorsport software.  For diagnostics K-Line pin 2 needs to be wired to the diagnostic connector, unlike normal E1/E5.

The part number for these units is 34516769162 with the 829.3 code on the module.  They are compatible with a VW yaw sensor with the part number 7H0907652A, note that this yaw sensor is not pinned the same as the BMW yaw sensor.

## How the GT3 software differs from the road car
A recap of how the Z4 GT3 software (6769162) differs from the road-car M3 MK60E5 software. Neither is derived from the other: both are branches of the same parent software, so each difference below is a comparison between the two branches, not a record of what was changed. The behaviour is read from the firmware; what it means on track is interpretation and has not been measured.

In short, where the road-car branch is a road ABS with stability functions, this branch is a race ABS that works on wheel slip and deceleration only.

**Set from the car**
- An ABS level knob, tyre circumferences and a gear-shift flag arrive in one CAN message (`0x5BA`, see below). Nothing else about the ABS can be changed at runtime, and tyre sizes need no recoding.
- Without `0x5BA` on the bus the module uses level 0 (the most permissive), its built-in tyre sizes, and no gear-shift suppression.

**ABS intervenes later**
- A wheel has to decelerate harder before ABS starts releasing pressure.
- The reference speed is allowed to fall much faster, and faster still as speed rises, so the high deceleration that downforce makes possible is not mistaken for all four wheels slipping.
- The special handling of the first moments of a stop that the road car has is inactive here.
- The wheel-speed glitch filter only catches sensor dropouts, so kerb strikes and the onset of a lock reach ABS at once.

**ABS releases and rebuilds differently**
- The first release on a lock is deeper and pressure then comes back in larger steps.
- Pressure is rebuilt faster, a stop is handed back to the pedal after fewer steps, and easing the pedal ends the pressure-decrease phase at once.
- The hydraulic model assumes faster valves than the M3's, and the pump is expected to run for long periods.

**Each wheel is judged on its own**
- The coupling between wheels that the road car has is absent or switched off: the yaw-moment limit on the high-grip front wheel on split surfaces, the inside/outside wheel logic in corners, lateral brake-force distribution, the pre-emptive rear control under hard braking and the paired rear release.
- There is no brake-based stability help under braking: the car pulls harder toward the high-grip side on a split surface than a road car would.
- Rear ABS entry does not depend on speed, and rough-road or kerb detection does not make the rear axle more cautious.

**Stability and traction control**
- Yaw stability control (AYC) is disabled in the code, in every switch mode, with or without the sensors.
- Traction control is still active. "Off" only stops the engine-torque cut; brake-based traction control stays on and is unaffected by a missing yaw or steering sensor.

**Brake pedal and brake assist**
- "Driver is braking" comes from master-cylinder pressure, not the brake-light switch. A failed master-pressure sensor therefore hides the pedal from several ABS decisions.
- Brake assist only triggers at a much higher pedal pressure than on the road car.
- A brake-fade support mode (extra pressure when the front brakes are hot and fading) exists in the software but is coded off on this module, as are hill hold and brake drying.

**Road-car functions this branch does not have**
- The road-car ABS mode handshake, reverse-driving detection, brake-fluid level monitoring and tyre-pressure loss detection.
- Instrument-cluster check-control and service messages, and fault history / freeze-frame data.
- A confirmation stage for wheel-sensor faults: here they are set directly.

## CANBUS
These units, when flashed, read tire circumference (front and rear separately), a traction-control threshold and mode, an ABS intervention level, and a gear-shift flag - all from a single CAN message, ID `0x5BA`. The hosted page at https://vesrah.github.io/MK60E5-Z4-GT3-ABS-Tools/ generates that message for your settings and also includes the diagnostic service tool (see below).

### ABS intervention level (`0x5BA` byte 7)
A higher level makes ABS intervene earlier (on a smaller wheel deceleration); **level 0 is the most permissive** (ABS waits the longest). This is *not* the 0-9-8-…-1 order some documentation lists. With this calibration only levels 0 to 4 differ; levels 4 to 9 behave the same. The level sets the base wheel-deceleration threshold, which sits on top of a base calibration already more permissive than the road car's.

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

- `z4_gt3_mk60e5_dsc_6769162_ptcan.dbc` - the main bus (what you tap on PT-CAN for datalogging): 20 messages, including the four wheel speeds, the wheel pressures, the Brake 1/2/3 status and lamp messages, the engine-torque requests, and the `0x5BA` config message.
- `z4_gt3_mk60e5_dsc_6769162_fcan.dbc` - the F-CAN sensor-cluster bus: 4 messages carrying yaw rate and lateral/longitudinal acceleration from the yaw sensor.
- `e90_mk60e5_dsc_7846816A_ptcan.dbc` - the road-car E9x M3 module (software 7846816A), PT-CAN: 48 messages with every field of the firmware's message tables, including the wheel speeds (`0x0CE`), DSC status (`0x19E`), speed/acceleration/yaw (`0x1A0`), wheel pressures (`0x2B2`) and the engine, gearbox and cluster frames it receives.
- `e90_mk60e5_dsc_7846816A_fcan.dbc` - the same module's F-CAN: 32 messages, including the steering-angle sensor (`0x0C9`), the sensor cluster (`0x0CD`/`0x0D1`/`0x0D4`) and the module's command frame (`0x080`).
- `e90_mk60e1_dsc_6769845A_ptcan.dbc` - the road-car E90 MK60E1 module (DSC81, software 6769845A), PT-CAN: 40 messages. The same message set as the M3 with frames and fields removed; meanings and scalings are carried over from the M3 where the firmware handler matches.
- `e90_mk60e1_dsc_6769845A_fcan.dbc` - the same module's F-CAN: 16 messages; the steering-angle sensor is on `0x0C8` here.
- `e46_mk60_dsc_APPY2782_ptcan.dbc` - the older non-M MK60 module (software identification `APPY2782.KC8`, E46-generation bus), PT-CAN at 500 kbit/s: 12 messages. It sends ASC1 (`0x153`: lamp and status bits, torque requests in % of the engine's standard torque, vehicle speed), ASC2 (`0x1F0`: the four wheel speeds and the wheel-tolerance values) and ASC3 (`0x1F3`: yaw rate, lateral and longitudinal acceleration) every 7 ms, and receives the engine (`0x316`, `0x329`), steering-angle sensor (`0x1F5`), gearbox and instrument-cluster frames. **It sends nothing until the engine frame `0x329` has delivered a valid CAN level (byte 0 = `0x11` or `0x36`).** Read from the firmware; not bench-checked.
- `e46_mk60_dsc_APPY2782_fcan.dbc` - the same module's private sensor-cluster bus: 4 messages. The cluster frames use the Z4 GT3's identifiers (`0x130`/`0x131`/`0x132`) with yaw rate in bytes 0-1 and lateral acceleration in bytes 4-5 of `0x130`; the module sends the self-test command `0x002` every cycle.

[`dbc/mk60e1-vs-mk60e5-can.md`](dbc/mk60e1-vs-mk60e5-can.md) summarises what differs on CAN between the MK60E1 and the M3 MK60E5.

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