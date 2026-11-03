const DTCMAP = {
  "5D8C": ["A1000"],
  "5D8E": ["A4000"],
  "5D8F": ["A8000", "F0001", "F0002", "F0004", "F0008", "F0010", "F0020", "F0040", "F0080", "F0100", "F0200", "F0400", "F0800", "F1000", "F2000"],
  "5D90": ["20001"],
  "5D91": ["20002"],
  "5D92": ["20020"],
  "5D93": ["20008"],
  "5D94": ["20010"],
  "5D95": ["20004"],
  "5D96": ["20040"],
  "5D97": ["80020", "80040", "90400", "90800", "F4000", "F8000"],
  "5D99": ["A0200", "A0400"],
  "5D9A": ["1C0001", "1C0002", "1C0004", "1C0100", "1C0200", "1C0400"],
  "5D9B": ["1C0040", "1C0800", "1C1000"],
  "5D9C": ["1C0020"],
  "5D9D": ["1C0080"],
  "5D9E": ["1C0008"],
  "5D9F": ["1C4000"],
  "5DA0": ["30001"],
  "5DA1": ["30002"],
  "5DA2": ["30020"],
  "5DA3": ["30008"],
  "5DA4": ["30010"],
  "5DA5": ["30004"],
  "5DA6": ["30040"],
  "5DAA": ["1D0001", "1D0002", "1D0004", "1D0100", "1D0200", "1D0400"],
  "5DAB": ["1D0040", "1D0800", "1D1000"],
  "5DAC": ["1D0020"],
  "5DAD": ["1D0080"],
  "5DAE": ["1D0008"],
  "5DAF": ["1D4000"],
  "5DB0": ["40001"],
  "5DB1": ["40002"],
  "5DB2": ["40020"],
  "5DB3": ["40008"],
  "5DB4": ["40010"],
  "5DB5": ["40004"],
  "5DB6": ["40040"],
  "5DBA": ["1E0001", "1E0002", "1E0004", "1E0100", "1E0200", "1E0400"],
  "5DBB": ["1E0040", "1E0800", "1E1000"],
  "5DBC": ["1E0020"],
  "5DBD": ["1E0080"],
  "5DBE": ["1E0008"],
  "5DBF": ["1E4000"],
  "5DC0": ["50001"],
  "5DC1": ["50002"],
  "5DC2": ["50020"],
  "5DC3": ["50008"],
  "5DC4": ["50010"],
  "5DC5": ["50004"],
  "5DC6": ["50040"],
  "5DCA": ["1F0001", "1F0002", "1F0004", "1F0100", "1F0200", "1F0400"],
  "5DCB": ["1F0040", "1F0800", "1F1000"],
  "5DCC": ["1F0020"],
  "5DCD": ["1F0080"],
  "5DCE": ["1F0008"],
  "5DCF": ["1F4000"],
  "5DD0": ["88000"],
  "5DD1": ["84000"],
  "5DD2": ["150004"],
  "5DD3": ["150100", "150200", "150400", "150800", "151000", "152000", "154000"],
  "5DF0": ["60100", "60200", "60400"],
  "5DF1": ["60800"],
  "5DF2": ["10002", "10004", "10008", "10010", "10020", "10100", "A0001", "A0100"],
  "5DF4": ["80001", "A0080"],
  "5DF5": ["10001", "10080", "10200", "10400", "10800", "11000", "14000", "60001", "60002", "60004", "60008", "60010", "60020", "70001", "70002", "70004", "70008", "70010", "70020", "70040", "70080", "70100", "70200", "70400", "70800", "71000", "72000", "74000", "78000", "80004", "150080"],
  "5DF7": ["80002"],
  "5DFF": ["94000"],
  "5E00": ["140001"],
  "5E01": ["140002"],
  "5E02": ["140008"],
  "5E03": ["140010"],
  "5E04": ["140020"],
  "5E05": ["140040"],
  "5E06": ["140080"],
  "5E07": ["140100"],
  "5E08": ["140200"],
  "5E11": ["A0002", "A0004"],
  "5E14": ["A0008"],
  "5E15": ["A0010"],
  "5E16": ["B0004"],
  "5E18": ["B0010"],
  "5E19": ["B0040"],
  "5E1A": ["A0020"],
  "5E1E": ["A0040"],
  "5E1F": ["B0002", "120008", "120080"],
  "5E20": ["110001", "110002", "110004", "110100", "110200", "110400"],
  "5E24": ["110040", "110800", "111000"],
  "5E25": ["114000"],
  "5E26": ["80008", "80010"],
  "5E28": ["130400"],
  "5E29": ["131000"],
  "5E2D": ["B2000"],
  "5E2E": ["B4000"],
  "5E2F": ["90001", "90002"],
  "5E30": ["100100", "100200", "100400", "100800"],
  "5E32": ["101000", "102000"],
  "5E34": ["D0001", "D0002", "D0008"],
  "5E35": ["D0004"],
  "5E38": ["100001", "100002", "100004", "100008"],
  "5E3C": ["100010", "100020", "100040"],
  "5E40": ["120001", "120002", "120004", "120020", "120040"],
  "5E43": ["120010"],
  "5E4E": ["81000"],
  "5E4F": ["80800"],
  "5E52": ["B0800"],
  "5E53": ["B1000"],
  "5E54": ["C8000"],
  "5E58": ["C1000"],
  "5E59": ["C0001", "C0002", "C0004", "C0008", "C0010", "C0020", "C0040", "C0080"],
  "5E5B": ["91000"],
  "5E5C": ["92000"],
  "5E5D": ["90100", "90200"],
  "5E5E": ["90010", "90020"],
  "5E5F": ["C2000"]
};
// Fault code -> [meaning, ABS-lamp verdict (yes/no/?), effect]. See README "Faults and the ABS lamp".
const FAULTINFO = {
  "10001": ["ECU internal / hardware (bit 0)", "yes", "ABS off, ABS lamp"],
  "10002": ["ECU internal / hardware (bit 1)", "yes", "ABS off, ABS lamp"],
  "10004": ["valve-driver chip start-up failure, all valves off", "yes", "ABS off, ABS lamp"],
  "10008": ["ECU internal / hardware (bit 3)", "yes", "ABS off, ABS lamp"],
  "10010": ["ECU internal / hardware (bit 4)", "yes", "ABS off, ABS lamp"],
  "10020": ["ECU internal / hardware (bit 5)", "yes", "ABS off, ABS lamp"],
  "10080": ["ECU internal fault (direct lamp request, blink code)", "yes", "ABS lamp (direct request)"],
  "10100": ["ECU internal / hardware (bit 8)", "yes", "ABS off, ABS lamp"],
  "10200": ["ECU internal / hardware (bit 9)", "yes", "ABS off, ABS lamp"],
  "10400": ["ECU internal / hardware (bit 10)", "yes", "ABS off, ABS lamp"],
  "10800": ["ECU internal / hardware (bit 11)", "yes", "ABS off, ABS lamp"],
  "11000": ["ECU internal / hardware (bit 12)", "yes", "ABS off, ABS lamp"],
  "14000": ["NVM / EEPROM access failure", "?", "not traced"],
  "20001": ["wheel-speed sensor FL: sensor status report from the wheel-sensor ASIC (open / short / supply)", "yes", "ABS off, ABS lamp"],
  "20002": ["wheel-speed sensor FL: glitch recovery lasting too long above 20 km/h", "yes", "ABS off, ABS lamp"],
  "20004": ["wheel-speed sensor FL: sensor status report from the wheel-sensor ASIC", "yes", "ABS off, ABS lamp"],
  "20008": ["wheel-speed sensor FL: wheel below the slow-wheel / standstill limit (wheel stuck or sensor dead)", "yes", "ABS off, ABS lamp"],
  "20010": ["wheel-speed sensor FL: ABS phase on this wheel for more than 2800 frames (28 s)", "yes", "ABS off, ABS lamp"],
  "20020": ["wheel-speed sensor FL: missing tooth / irregular tooth period", "yes", "ABS off, ABS lamp"],
  "20040": ["wheel-speed sensor FL: sensor status report from the wheel-sensor ASIC", "yes", "ABS off, ABS lamp"],
  "30001": ["wheel-speed sensor FR: sensor status report from the wheel-sensor ASIC (open / short / supply)", "yes", "ABS off, ABS lamp"],
  "30002": ["wheel-speed sensor FR: glitch recovery lasting too long above 20 km/h", "yes", "ABS off, ABS lamp"],
  "30004": ["wheel-speed sensor FR: sensor status report from the wheel-sensor ASIC", "yes", "ABS off, ABS lamp"],
  "30008": ["wheel-speed sensor FR: wheel below the slow-wheel / standstill limit (wheel stuck or sensor dead)", "yes", "ABS off, ABS lamp"],
  "30010": ["wheel-speed sensor FR: ABS phase on this wheel for more than 2800 frames (28 s)", "yes", "ABS off, ABS lamp"],
  "30020": ["wheel-speed sensor FR: missing tooth / irregular tooth period", "yes", "ABS off, ABS lamp"],
  "30040": ["wheel-speed sensor FR: sensor status report from the wheel-sensor ASIC", "yes", "ABS off, ABS lamp"],
  "40001": ["wheel-speed sensor RL: sensor status report from the wheel-sensor ASIC (open / short / supply)", "yes", "ABS off, ABS lamp"],
  "40002": ["wheel-speed sensor RL: glitch recovery lasting too long above 20 km/h", "yes", "ABS off, ABS lamp"],
  "40004": ["wheel-speed sensor RL: sensor status report from the wheel-sensor ASIC", "yes", "ABS off, ABS lamp"],
  "40008": ["wheel-speed sensor RL: wheel below the slow-wheel / standstill limit (wheel stuck or sensor dead)", "yes", "ABS off, ABS lamp"],
  "40010": ["wheel-speed sensor RL: ABS phase on this wheel for more than 2800 frames (28 s)", "yes", "ABS off, ABS lamp"],
  "40020": ["wheel-speed sensor RL: missing tooth / irregular tooth period", "yes", "ABS off, ABS lamp"],
  "40040": ["wheel-speed sensor RL: sensor status report from the wheel-sensor ASIC", "yes", "ABS off, ABS lamp"],
  "50001": ["wheel-speed sensor RR: sensor status report from the wheel-sensor ASIC (open / short / supply)", "yes", "ABS off, ABS lamp"],
  "50002": ["wheel-speed sensor RR: glitch recovery lasting too long above 20 km/h", "yes", "ABS off, ABS lamp"],
  "50004": ["wheel-speed sensor RR: sensor status report from the wheel-sensor ASIC", "yes", "ABS off, ABS lamp"],
  "50008": ["wheel-speed sensor RR: wheel below the slow-wheel / standstill limit (wheel stuck or sensor dead)", "yes", "ABS off, ABS lamp"],
  "50010": ["wheel-speed sensor RR: ABS phase on this wheel for more than 2800 frames (28 s)", "yes", "ABS off, ABS lamp"],
  "50020": ["wheel-speed sensor RR: missing tooth / irregular tooth period", "yes", "ABS off, ABS lamp"],
  "50040": ["wheel-speed sensor RR: sensor status report from the wheel-sensor ASIC", "yes", "ABS off, ABS lamp"],
  "60001": ["valve relay / pump (bit 0)", "yes", "ABS off, ABS lamp"],
  "60002": ["valve relay / pump (bit 1)", "yes", "ABS off, ABS lamp"],
  "60004": ["valve relay / pump (bit 2)", "yes", "ABS off, ABS lamp"],
  "60008": ["valve relay / pump (bit 3)", "yes", "ABS off, ABS lamp"],
  "60010": ["valve relay / pump (bit 4)", "yes", "ABS off, ABS lamp"],
  "60020": ["valve relay / pump (bit 5)", "yes", "ABS off, ABS lamp"],
  "60100": ["pump motor fault (pump_fault_report)", "yes", "ABS off, ABS lamp"],
  "60200": ["pump motor fault (pump_fault_report)", "yes", "ABS off, ABS lamp"],
  "60400": ["pump motor fault (pump_fault_report)", "yes", "ABS off, ABS lamp"],
  "60800": ["valve relay / pump fault", "yes", "ABS off, ABS lamp"],
  "70001": ["valve-driver fault bit 0", "?", "not traced"],
  "70002": ["valve-driver fault bit 1", "?", "not traced"],
  "70004": ["valve-driver fault bit 2", "?", "not traced"],
  "70008": ["valve-driver fault bit 3", "?", "not traced"],
  "70010": ["valve-driver fault bit 4", "?", "not traced"],
  "70020": ["valve-driver fault bit 5", "?", "not traced"],
  "70040": ["valve-driver fault bit 6", "?", "not traced"],
  "70080": ["valve-driver fault bit 7", "?", "not traced"],
  "70100": ["valve-driver fault bit 8", "?", "not traced"],
  "70200": ["valve-driver fault bit 9", "?", "not traced"],
  "70400": ["valve-driver fault bit 10", "?", "not traced"],
  "70800": ["valve-driver fault bit 11", "?", "not traced"],
  "71000": ["valve-driver fault bit 12", "yes", "ABS off, ABS lamp"],
  "72000": ["valve-driver fault bit 13", "yes", "ABS off, ABS lamp"],
  "74000": ["valve-driver fault bit 14", "yes", "ABS off, ABS lamp"],
  "78000": ["valve-driver fault bit 15", "yes", "ABS off, ABS lamp"],
  "80001": ["hydraulic / USV (bit 0)", "?", "not traced"],
  "80002": ["hydraulic / USV (bit 1)", "?", "not traced"],
  "80004": ["hydraulic / USV (bit 2)", "?", "not traced"],
  "80008": ["hydraulic / USV (bit 3)", "?", "not traced"],
  "80010": ["hydraulic / USV (bit 4)", "?", "not traced"],
  "80020": ["hydraulic / USV (bit 5)", "?", "not traced"],
  "80040": ["hydraulic / USV (bit 6)", "?", "not traced"],
  "80800": ["hydraulic / USV (bit 11)", "?", "not traced"],
  "81000": ["hydraulic / USV (bit 12)", "?", "not traced"],
  "84000": ["hydraulic / USV (bit 14)", "?", "not traced"],
  "88000": ["USV disabled / USV learn aborted", "no", "brake TCS + ASR off (no ABS lamp)"],
  "90001": ["brake switch / fluid (bit 0)", "?", "not traced"],
  "90002": ["brake switch / fluid (bit 1)", "?", "not traced"],
  "90010": ["brake-light switch fault", "no", "pedal switch ignored by brake-TCS inhibit"],
  "90020": ["brake-light switch fault", "no", "pedal switch ignored by brake-TCS inhibit"],
  "90100": ["brake switch / fluid (bit 8)", "?", "not traced"],
  "90200": ["brake fluid level (no raiser in this firmware)", "no", "brake TCS + ASR off (no ABS lamp)"],
  "90400": ["brake switch / fluid (bit 10)", "?", "not traced"],
  "90800": ["brake switch / fluid (bit 11)", "?", "not traced"],
  "91000": ["brake switch / fluid (bit 12)", "?", "not traced"],
  "92000": ["brake switch / fluid (bit 13)", "?", "not traced"],
  "94000": ["brake switch / fluid (bit 14)", "?", "not traced"],
  "A0001": ["CAN controller / bus fault", "no", "brake TCS + ASR off (no ABS lamp)"],
  "A0002": ["CAN bus fault (suppresses the other CAN faults while set)", "no", "brake TCS + ASR off (no ABS lamp)"],
  "A0004": ["CAN controller / bus fault", "no", "brake TCS + ASR off (no ABS lamp)"],
  "A0008": ["engine CAN signals timed out (no DME on the bus)", "no", "brake TCS + ASR off (no ABS lamp)"],
  "A0010": ["CAN receive timeout (message watchdog 0x1242c)", "no", "logged (CAN)"],
  "A0020": ["engine data implausible: rpm invalid, torque 0xFF or engine-status bit set", "no", "brake TCS + ASR off (no ABS lamp)"],
  "A0040": ["steering frame 0x0C2 alive counter frozen, or sensor-cluster communication fault", "no", "yaw/ay/steering untrusted, DSC off (no ABS lamp)"],
  "A0080": ["CAN (bit 7)", "no", "logged (CAN)"],
  "A0100": ["CAN (bit 8)", "no", "logged (CAN)"],
  "A0200": ["CAN (bit 9)", "no", "logged (CAN)"],
  "A0400": ["CAN (bit 10)", "no", "logged (CAN)"],
  "A1000": ["CAN (bit 12)", "no", "logged (CAN)"],
  "A4000": ["CAN (bit 14)", "no", "logged (CAN)"],
  "A8000": ["CAN (bit 15)", "no", "logged (CAN)"],
  "B0002": ["CAN signal fault (no direct raiser found in the code)", "yes", "ABS off, ABS lamp"],
  "B0004": ["0x520 mode field = 3 without mode 2 seen (transmission message)", "yes", "ABS off, ABS lamp"],
  "B0010": ["engine message 0x280 error bit (byte 0 bit 7) set", "no", "brake TCS + ASR off (no ABS lamp)"],
  "B0040": ["gear-signal source bit on 0x440", "no", "brake TCS + ASR off (no ABS lamp)"],
  "B0800": ["CAN signal (bit 11)", "?", "not traced"],
  "B1000": ["CAN signal (bit 12)", "?", "not traced"],
  "B2000": ["CAN signal (bit 13)", "?", "not traced"],
  "B4000": ["CAN signal (bit 14)", "?", "not traced"],
  "C0001": ["coding / variant (bit 0)", "no", "brake TCS + ASR off (no ABS lamp)"],
  "C0002": ["vehicle coding out of range (row > 48 or field1 > 1); coding reset to row 0", "no", "brake TCS + ASR off (no ABS lamp)"],
  "C0004": ["coding / variant (bit 2)", "no", "brake TCS + ASR off (no ABS lamp)"],
  "C0008": ["coding / variant (bit 3)", "no", "brake TCS + ASR off (no ABS lamp)"],
  "C0010": ["coding / variant (bit 4)", "no", "brake TCS + ASR off (no ABS lamp)"],
  "C0020": ["coding / variant (bit 5)", "no", "brake TCS + ASR off (no ABS lamp)"],
  "C0040": ["vehicle coding mirror checksum wrong (EEPROM 0x0FA); coding reset to row 0", "no", "brake TCS + ASR off (no ABS lamp)"],
  "C0080": ["coding / variant (bit 7)", "no", "brake TCS + ASR off (no ABS lamp)"],
  "C1000": ["CAN scan / tester fault: any frame on 0x2C0, or 0x5DC with the flag bit set", "yes", "ABS off, ABS lamp"],
  "C2000": ["coding / variant fault", "?", "not traced"],
  "C8000": ["coding / variant (bit 15)", "no", "brake TCS + ASR off (no ABS lamp)"],
  "D0001": ["group 0xD (bit 0)", "?", "not traced"],
  "D0002": ["group 0xD (bit 1)", "?", "not traced"],
  "D0004": ["group 0xD (bit 2)", "?", "not traced"],
  "D0008": ["group 0xD (bit 3)", "?", "not traced"],
  "F0001": ["unused bit (bit 0)", "?", "not traced"],
  "F0002": ["unused bit (bit 1)", "?", "not traced"],
  "F0004": ["unused bit (bit 2)", "?", "not traced"],
  "F0008": ["unused bit (bit 3)", "?", "not traced"],
  "F0010": ["unused bit (bit 4)", "?", "not traced"],
  "F0020": ["unused bit (bit 5)", "?", "not traced"],
  "F0040": ["unused bit (bit 6)", "?", "not traced"],
  "F0080": ["unused bit (bit 7)", "?", "not traced"],
  "F0100": ["unused bit (bit 8)", "?", "not traced"],
  "F0200": ["unused bit (bit 9)", "?", "not traced"],
  "F0400": ["unused bit (bit 10)", "?", "not traced"],
  "F0800": ["unused bit (bit 11)", "?", "not traced"],
  "F1000": ["unused bit (bit 12)", "?", "not traced"],
  "F2000": ["unused bit (bit 13)", "?", "not traced"],
  "F4000": ["unused bit (bit 14)", "?", "not traced"],
  "F8000": ["unused bit (bit 15)", "?", "not traced"],
  "100001": ["group 0x10 (bit 0)", "?", "not traced"],
  "100002": ["group 0x10 (bit 1)", "?", "not traced"],
  "100004": ["group 0x10 (bit 2)", "?", "not traced"],
  "100008": ["group 0x10 (bit 3)", "?", "not traced"],
  "100010": ["group 0x10 (bit 4)", "?", "not traced"],
  "100020": ["group 0x10 (bit 5)", "?", "not traced"],
  "100040": ["group 0x10 (bit 6)", "?", "not traced"],
  "100100": ["group 0x10 (bit 8)", "?", "not traced"],
  "100200": ["group 0x10 (bit 9)", "?", "not traced"],
  "100400": ["group 0x10 (bit 10)", "?", "not traced"],
  "100800": ["group 0x10 (bit 11)", "?", "not traced"],
  "101000": ["group 0x10 (bit 12)", "?", "not traced"],
  "102000": ["group 0x10 (bit 13)", "?", "not traced"],
  "110001": ["pressure sensing / brake assist (bit 0)", "?", "not traced"],
  "110002": ["pressure sensing / brake assist (bit 1)", "?", "not traced"],
  "110004": ["brake-assist (HBA) fault", "no", "brake TCS off (no ABS lamp)"],
  "110040": ["pressure sensing / brake assist (bit 6)", "?", "not traced"],
  "110100": ["pressure sensing / brake assist (bit 8)", "?", "not traced"],
  "110200": ["pressure sensing / brake assist (bit 9)", "?", "not traced"],
  "110400": ["brake-assist (HBA) fault", "no", "brake TCS off (no ABS lamp)"],
  "110800": ["pressure sensing / brake assist (bit 11)", "?", "not traced"],
  "111000": ["pressure sensing / brake assist (bit 12)", "?", "not traced"],
  "114000": ["pressure sensing / brake assist (bit 14)", "?", "not traced"],
  "120001": ["steering offset out of range", "no", "yaw/ay/steering untrusted, DSC off (no ABS lamp)"],
  "120002": ["steering plausibility vs wheel speeds failed (verified state)", "no", "yaw/ay/steering untrusted, DSC off (no ABS lamp)"],
  "120004": ["steering plausibility vs yaw / lateral accel failed", "no", "yaw/ay/steering untrusted, DSC off (no ABS lamp)"],
  "120008": ["steering sensor never reported initialised (30 retries)", "no", "yaw/ay/steering untrusted, DSC off (no ABS lamp)"],
  "120010": ["0x0C2 checksum wrong, sensor state 3, or re-init timeout", "no", "yaw/ay/steering untrusted, DSC off (no ABS lamp)"],
  "120020": ["steering verification timeout (NVM latched, re-raised every start)", "no", "yaw/ay/steering untrusted, DSC off (no ABS lamp)"],
  "120040": ["steering verification timeout (NVM latched, re-raised every start)", "no", "yaw/ay/steering untrusted, DSC off (no ABS lamp)"],
  "120080": ["steering offset never calibrated (raised every cycle until a steering zero cal)", "no", "yaw/ay/steering untrusted, DSC off (no ABS lamp)"],
  "130400": ["group 0x13 (bit 10)", "?", "not traced"],
  "131000": ["group 0x13 (bit 12)", "?", "not traced"],
  "140001": ["group 0x14 (bit 0)", "?", "not traced"],
  "140002": ["group 0x14 (bit 1)", "?", "not traced"],
  "140008": ["group 0x14 (bit 3)", "?", "not traced"],
  "140010": ["group 0x14 (bit 4)", "?", "not traced"],
  "140020": ["group 0x14 (bit 5)", "?", "not traced"],
  "140040": ["group 0x14 (bit 6)", "?", "not traced"],
  "140080": ["group 0x14 (bit 7)", "?", "not traced"],
  "140100": ["group 0x14 (bit 8)", "?", "not traced"],
  "140200": ["group 0x14 (bit 9)", "?", "not traced"],
  "150004": ["master-pressure sensor invalid (also raised by a failed inlet-valve learn)", "yes", "ABS off, ABS lamp"],
  "150080": ["master-pressure sensor (bit 7)", "?", "not traced"],
  "150100": ["master-pressure sensor (bit 8)", "?", "not traced"],
  "150200": ["master-pressure sensor (bit 9)", "?", "not traced"],
  "150400": ["master-pressure sensor (bit 10)", "?", "not traced"],
  "150800": ["master-pressure sensor (bit 11)", "?", "not traced"],
  "151000": ["master-pressure sensor (bit 12)", "?", "not traced"],
  "152000": ["master-pressure sensor (bit 13)", "?", "not traced"],
  "154000": ["master-pressure sensor (bit 14)", "?", "not traced"],
  "1C0001": ["wheel-pressure sensor FL: signal / plausibility bit 0", "no", "sensor dropped by Z4 pressure code"],
  "1C0002": ["wheel-pressure sensor FL: signal / plausibility bit 1", "no", "sensor dropped by Z4 pressure code"],
  "1C0004": ["wheel-pressure sensor FL: signal / plausibility bit 2", "no", "sensor dropped by Z4 pressure code"],
  "1C0008": ["wheel-pressure sensor FL: signal / plausibility bit 3", "no", "sensor dropped by Z4 pressure code"],
  "1C0020": ["wheel-pressure sensor FL: signal / plausibility bit 5", "no", "sensor dropped by Z4 pressure code"],
  "1C0040": ["wheel-pressure sensor FL: signal / plausibility bit 6", "no", "sensor dropped by Z4 pressure code"],
  "1C0080": ["wheel-pressure sensor FL: signal / plausibility bit 7", "no", "sensor dropped by Z4 pressure code"],
  "1C0100": ["wheel-pressure sensor FL: signal / plausibility bit 8", "no", "sensor dropped by Z4 pressure code"],
  "1C0200": ["wheel-pressure sensor FL: signal / plausibility bit 9", "no", "sensor dropped by Z4 pressure code"],
  "1C0400": ["wheel-pressure sensor FL: signal / plausibility bit 10", "no", "sensor dropped by Z4 pressure code"],
  "1C0800": ["wheel-pressure sensor FL: signal / plausibility bit 11", "no", "sensor dropped by Z4 pressure code"],
  "1C1000": ["wheel-pressure sensor FL: signal / plausibility bit 12", "no", "sensor dropped by Z4 pressure code"],
  "1C4000": ["wheel-pressure sensor FL: signal / plausibility bit 14", "no", "sensor dropped by Z4 pressure code"],
  "1D0001": ["wheel-pressure sensor FR: signal / plausibility bit 0", "no", "sensor dropped by Z4 pressure code"],
  "1D0002": ["wheel-pressure sensor FR: signal / plausibility bit 1", "no", "sensor dropped by Z4 pressure code"],
  "1D0004": ["wheel-pressure sensor FR: signal / plausibility bit 2", "no", "sensor dropped by Z4 pressure code"],
  "1D0008": ["wheel-pressure sensor FR: signal / plausibility bit 3", "no", "sensor dropped by Z4 pressure code"],
  "1D0020": ["wheel-pressure sensor FR: signal / plausibility bit 5", "no", "sensor dropped by Z4 pressure code"],
  "1D0040": ["wheel-pressure sensor FR: signal / plausibility bit 6", "no", "sensor dropped by Z4 pressure code"],
  "1D0080": ["wheel-pressure sensor FR: signal / plausibility bit 7", "no", "sensor dropped by Z4 pressure code"],
  "1D0100": ["wheel-pressure sensor FR: signal / plausibility bit 8", "no", "sensor dropped by Z4 pressure code"],
  "1D0200": ["wheel-pressure sensor FR: signal / plausibility bit 9", "no", "sensor dropped by Z4 pressure code"],
  "1D0400": ["wheel-pressure sensor FR: signal / plausibility bit 10", "no", "sensor dropped by Z4 pressure code"],
  "1D0800": ["wheel-pressure sensor FR: signal / plausibility bit 11", "no", "sensor dropped by Z4 pressure code"],
  "1D1000": ["wheel-pressure sensor FR: signal / plausibility bit 12", "no", "sensor dropped by Z4 pressure code"],
  "1D4000": ["wheel-pressure sensor FR: signal / plausibility bit 14", "no", "sensor dropped by Z4 pressure code"],
  "1E0001": ["wheel-pressure sensor RL: signal / plausibility bit 0", "no", "sensor dropped by Z4 pressure code"],
  "1E0002": ["wheel-pressure sensor RL: signal / plausibility bit 1", "no", "sensor dropped by Z4 pressure code"],
  "1E0004": ["wheel-pressure sensor RL: signal / plausibility bit 2", "no", "sensor dropped by Z4 pressure code"],
  "1E0008": ["wheel-pressure sensor RL: signal / plausibility bit 3", "no", "sensor dropped by Z4 pressure code"],
  "1E0020": ["wheel-pressure sensor RL: signal / plausibility bit 5", "no", "sensor dropped by Z4 pressure code"],
  "1E0040": ["wheel-pressure sensor RL: signal / plausibility bit 6", "no", "sensor dropped by Z4 pressure code"],
  "1E0080": ["wheel-pressure sensor RL: signal / plausibility bit 7", "no", "sensor dropped by Z4 pressure code"],
  "1E0100": ["wheel-pressure sensor RL: signal / plausibility bit 8", "no", "sensor dropped by Z4 pressure code"],
  "1E0200": ["wheel-pressure sensor RL: signal / plausibility bit 9", "no", "sensor dropped by Z4 pressure code"],
  "1E0400": ["wheel-pressure sensor RL: signal / plausibility bit 10", "no", "sensor dropped by Z4 pressure code"],
  "1E0800": ["wheel-pressure sensor RL: signal / plausibility bit 11", "no", "sensor dropped by Z4 pressure code"],
  "1E1000": ["wheel-pressure sensor RL: signal / plausibility bit 12", "no", "sensor dropped by Z4 pressure code"],
  "1E4000": ["wheel-pressure sensor RL: signal / plausibility bit 14", "no", "sensor dropped by Z4 pressure code"],
  "1F0001": ["wheel-pressure sensor RR: signal / plausibility bit 0", "no", "sensor dropped by Z4 pressure code"],
  "1F0002": ["wheel-pressure sensor RR: signal / plausibility bit 1", "no", "sensor dropped by Z4 pressure code"],
  "1F0004": ["wheel-pressure sensor RR: signal / plausibility bit 2", "no", "sensor dropped by Z4 pressure code"],
  "1F0008": ["wheel-pressure sensor RR: signal / plausibility bit 3", "no", "sensor dropped by Z4 pressure code"],
  "1F0020": ["wheel-pressure sensor RR: signal / plausibility bit 5", "no", "sensor dropped by Z4 pressure code"],
  "1F0040": ["wheel-pressure sensor RR: signal / plausibility bit 6", "no", "sensor dropped by Z4 pressure code"],
  "1F0080": ["wheel-pressure sensor RR: signal / plausibility bit 7", "no", "sensor dropped by Z4 pressure code"],
  "1F0100": ["wheel-pressure sensor RR: signal / plausibility bit 8", "no", "sensor dropped by Z4 pressure code"],
  "1F0200": ["wheel-pressure sensor RR: signal / plausibility bit 9", "no", "sensor dropped by Z4 pressure code"],
  "1F0400": ["wheel-pressure sensor RR: signal / plausibility bit 10", "no", "sensor dropped by Z4 pressure code"],
  "1F0800": ["wheel-pressure sensor RR: signal / plausibility bit 11", "no", "sensor dropped by Z4 pressure code"],
  "1F1000": ["wheel-pressure sensor RR: signal / plausibility bit 12", "no", "sensor dropped by Z4 pressure code"],
  "1F4000": ["wheel-pressure sensor RR: signal / plausibility bit 14", "no", "sensor dropped by Z4 pressure code"]
};
// ---- $1A identification blocks ----
// Additional DTC names, shown when a DTC has no entry in the internal fault table.
const EXTRA_DTC = {
  "5DE0": "BBV FA not initialized (brake-pad thickness, front axle)",
  "5DE1": "BBV RA not initialized (brake-pad thickness, rear axle)",
  "5DE2": "critical brake-pad thickness front axle reached",
  "5DE3": "critical brake-pad thickness rear axle reached",
  "5E21": "pressure transducer 2 electrically defective or noisy",
  "5E50": "SZL serial number wrong (\"no fault\")",
  "5E51": "SZL serial number invalid (\"no fault\")",
};

const IDENT_LEN = { 0x80: 29, 0x8F: 30, 0x90: 7, 0x94: 30, 0x99: 4 };
const IDENT_SRC = { 0x80: "EEPROM block 10 +0x1A", 0x8F: "EEPROM block 0 +0", 0x90: "EEPROM block 10 +0x37",
                    0x94: "fixed block", 0x99: "EEPROM block 10 +0x16" };
const SW_IDENT_94 = [0x0c, 0x41, 0x4e, 0x5f, 0x42, 0x42, 0x46, 0x30, 0x30, 0x30, 0x33, 0x38, 0x20,
                     0x90, 0x00, 0x0e, 0x00, 0x1d, 0x07, 0x14, 0x0a, 0x1d, 0x00, 0x03, 0x00, 0x00, 0x00, 0x82, 0x01, 0x01];

// Per-DTC ABS-lamp verdict from its candidate internal faults: "yes" / "no" / "depends" / "?".
function dtcLamp(faults) {
  const v = faults.map(f => (FAULTINFO[f] || [])[1] || "?");
  if (!v.length) return "?";
  if (v.every(x => x === "yes")) return "yes";
  if (v.every(x => x === "no")) return "no";
  if (v.includes("yes")) return "depends";
  return v.includes("no") ? "no" : "?";
}
const NRCN = {0x10:"generalReject",0x11:"serviceNotSupported",0x12:"subFuncNotSupported",0x13:"wrongLength",0x22:"conditionsNotCorrect",0x31:"requestOutOfRange",0x33:"securityAccessDenied",0x35:"invalidKey",0x78:"responsePending"};
const TGT=0x29, sleep=ms=>new Promise(r=>setTimeout(r,ms));
class KwpError extends Error{constructor(nrc){super(`NRC 0x${nrc.toString(16)} ${NRCN[nrc]||'?'}`);this.nrc=nrc;}}

// ---- key algorithms (ported from kwp.py / kline_ident) ----
const ror16 = (v, n) => ((v >>> n) | (v << (16 - n))) & 0xFFFF;

function bitrev16(v) {
  let r = 0;
  for (let i = 0; i < 16; i++) r |= ((v >> i) & 1) << (15 - i);
  return r & 0xFFFF;
}

const ktSeedrev = s => (bitrev16(s) ^ ror16(s, 5)) & 0xFFFF;

function ktCcpKey(seed, c) {
  const s = seed & 0xFFFF, ns = (~s) & 0xFFFF;
  let res = 0;
  for (let i = 0; i < 4; i++) {
    const b = i * 4;
    res |= ((s >> b) & 1) << (b + 2);
    res |= ((s >> (b + 2)) & 1) << b;
    res |= ((ns >> (b + 1)) & 1) << (b + 1);
    res |= ((ns >> (b + 3)) & 1) << (b + 3);
  }
  res = (res ^ ror16(s, 5)) & 0xFFFF;
  let acc = 0;
  for (let i = 0; i < 13; i++) {
    acc = (acc ^ (((res & (0xF << i)) << ((res >> i) & 0xF)) >>> 0)) >>> 0;
  }
  acc = (acc ^ (acc >>> 16)) >>> 0;
  return (res ^ acc ^ c) & 0xFFFF;
}

function ktCodingKey(seed, c) {
  const X = ror16(seed, 3);
  let res = 0;
  for (let i = 0; i < 8; i++) {
    const a = 15 - i, b = 7 - i;
    if (((X >> i) & 1) ^ ((X >> (i + 8)) & 1)) {
      res |= ((X >> a) & 1) << b;
      res |= ((X >> b) & 1) << a;
    } else {
      res |= ((~X >> a) & 1) << a;
      res |= ((~X >> b) & 1) << b;
    }
  }
  return (res ^ c) & 0xFFFF;
}

// MD5, for the M3 level-5 Authentisierung (Web Crypto has no MD5). Input and output
// are byte arrays. Verified against the RFC vectors and kwp.py in test_kwp.js.
function md5(input) {
  const s = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
             5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
             4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
             6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21];
  const K = new Uint32Array(64);
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0;
  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
  const msg = Array.from(input), bits = msg.length * 8;
  msg.push(0x80);
  while (msg.length % 64 !== 56) msg.push(0);
  for (let i = 0; i < 4; i++) msg.push((bits >>> (8 * i)) & 0xff);
  for (let i = 0; i < 4; i++) msg.push((Math.floor(bits / 2 ** 32) >>> (8 * i)) & 0xff);
  const rotl = (x, c) => (x << c) | (x >>> (32 - c));
  for (let off = 0; off < msg.length; off += 64) {
    const M = new Uint32Array(16);
    for (let i = 0; i < 16; i++) {
      M[i] = (msg[off + i * 4]) | (msg[off + i * 4 + 1] << 8) |
             (msg[off + i * 4 + 2] << 16) | (msg[off + i * 4 + 3] << 24);
    }
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F, g;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      F = (F + A + K[i] + M[g]) >>> 0;
      A = D; D = C; C = B;
      B = (B + rotl(F, s[i])) >>> 0;
    }
    a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
  }
  const out = new Uint8Array(16);
  [a0, b0, c0, d0].forEach((h, j) => { for (let i = 0; i < 4; i++) out[j * 4 + i] = (h >>> (8 * i)) & 0xff; });
  return out;
}

// ---- Web Serial transport ----
class WebSerialKwp {
  // proto "kwp"  = K-line KWP2000* (8E1, DTR low, B8 header, XOR checksum)  -> Z4 GT3
  // proto "fast" = BMW-FAST / D-CAN (8N1, DTR high, 0x80|len header, sum)   -> M3 (to confirm on hardware)
  constructor(baud, proto) {
    this.baud = baud;
    this.proto = proto || "kwp";
    this.kind = "serial";
    this.wait = 350;
    this.rx = [];
  }

  async connect() {
    this.port = await navigator.serial.requestPort();
    const kline = this.proto === "kwp";
    await this.port.open({
      baudRate: this.baud, dataBits: 8,
      parity: kline ? "even" : "none", stopBits: 1, flowControl: "none",
    });
    try {
      // K-line holds DTR low; BMW-FAST / D-CAN holds it high
      await this.port.setSignals({ dataTerminalReady: !kline, requestToSend: false });
    } catch (e) { /* some cables ignore signal control */ }
    this._pump();
  }

  // background reader: push everything the port delivers into this.rx
  async _pump() {
    this.reader = this.port.readable.getReader();
    try {
      for (;;) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) for (const b of value) this.rx.push(b);
      }
    } catch (e) {
      /* port closed */
    } finally {
      try { this.reader.releaseLock(); } catch (e) {}
    }
  }

  xor(a) {
    let x = 0;
    for (const b of a) x ^= b;
    return x & 0xFF;
  }

  sum(a) {
    let s = 0;
    for (const b of a) s = (s + b) & 0xFF;
    return s;
  }

  frame(p) {
    if (this.proto === "fast") {
      // BMW-FAST: [0x80|len] [tgt] [0xF1] data... [sum]
      const f = [0x80 | p.length, TGT, 0xF1, ...p];
      f.push(this.sum(f));
      return Uint8Array.from(f);
    }
    // K-line KWP2000*: [0xB8] [tgt] [0xF1] [len] data... [xor]
    const f = [0xB8, TGT, 0xF1, p.length, ...p];
    f.push(this.xor(f));
    return Uint8Array.from(f);
  }

  async request(p) {
    const req = this.frame(p);
    this.rx.length = 0;
    const w = this.port.writable.getWriter();
    await w.write(req);
    w.releaseLock();

    // wait for the response to arrive and settle (quiet gap), then parse
    const start = Date.now();
    let last = 0, stable = Date.now();
    while (Date.now() - start < this.wait + p.length * 6) {
      await sleep(20);
      if (this.rx.length !== last) {
        last = this.rx.length;
        stable = Date.now();
      } else if (this.rx.length > req.length && Date.now() - stable > 70) {
        break;
      }
    }

    let rx = this.rx.slice();
    // single-wire lines echo the request; drop it if present
    if (rx.length >= req.length && req.every((b, i) => rx[i] === b)) rx = rx.slice(req.length);
    let body;
    if (this.proto === "fast") {
      // response: [0x80|len] [0xF1] [tgt] body... [sum]
      body = rx.length >= 4 ? rx.slice(3, rx.length - 1) : rx;
    } else {
      body = (rx.length >= 5 && rx[0] === 0xB8) ? rx.slice(4, rx.length - 1) : rx;
    }
    if (body.length && body[0] === 0x7F) throw new KwpError(body[2] || 0);
    return body;
  }

  async close() {
    try { await this.reader.cancel(); } catch (e) {}
    try { await this.port.close(); } catch (e) {}
  }
}

// ---- JS mock (mirrors kwp.py MockKwp) ----
class MockKwp {
  constructor() {
    this.kind = "mock";
    this.session = 0x81;
    this.sec = 0;
    this.ee = new Uint8Array(0x400);
    this.ee[0xFA] = 0xFA;                 // bench coding checksum (test pattern)
    this.rout = {};
    this.dtcs = [[0x5E, 0x59, 0x60], [0x5E, 0x1F, 0x60], [0x5E, 0x1E, 0x60]];
  }

  async connect() {}

  async request(p) {
    const s = p[0];
    if (s === 0x10) {                     // start diagnostic session
      this.session = p[1];
      return [0x50, p[1]];
    }
    if (s === 0x27) {                     // security access
      const sub = p[1];
      if (sub === 0x03 || sub === 0xFB || sub === 0xFD) return [0x67, sub, 0x12, 0x34];  // seed
      this.sec = { 4: 0x03, 0xFC: 0x7E, 0xFE: 0x7F }[sub] || this.sec;                   // key: mock grants
      return [0x67, sub];
    }
    if (s === 0x1A) {                     // read ECU identification
      const id = p[1];
      if (id === 0x94) return [0x5A, 0x94, ...SW_IDENT_94];
      if (id === 0x89) return [0x5A, 0x89, 0x00, 0xB4, 0x00, 0x00];   // level-5 W564 = last 4 bytes
      const n = IDENT_LEN[id];
      if (n === undefined) throw new KwpError(0x12);
      const blk = new Array(n).fill(0);            // EEPROM-backed blocks: content not on file
      if (id === 0x80) blk.splice(2, 4, 0x06, 0x76, 0x91, 0x62);   // part number 6769162, packed BCD at bytes 2..5
      return [0x5A, id, ...blk];
    }
    if (s === 0x18) {                     // read DTC by status
      const o = [0x58, this.dtcs.length];
      this.dtcs.forEach(d => o.push(...d));
      return o;
    }
    if (s === 0x14) {                     // clear DTCs
      if (!(p[1] === 0xFF && (p[2] === 0xFF || p[2] === 0xFC))) throw new KwpError(0x12);
      this.dtcs = [];
      return [0x54];
    }
    if (s === 0x23) {                     // read memory by address
      const a = (p[2] << 8) | p[3], n = p[5];
      return [0x63, ...this.ee.slice(a, a + n)];
    }
    if (s === 0x3D) {                     // write memory by address
      if (this.sec !== 0x7F || this.session !== 0x87) throw new KwpError(0x33);
      this.ee[(p[2] << 8) | p[3]] = p[6];
      return [0x7D, 0, p[2], p[3], 0x03];
    }
    if (s === 0x31) {                     // start routine / level-5 auth
      if (p[1] === 0x07) return [0x71, 0x07, 0, 1, 2, 3, 4, 5, 6, 7];   // auth: random (zufall)
      if (p[1] === 0x08) return [0x71, 0x08, 0x01];                     // auth: accepted (mock grants)
      if (this.session === 0x81) throw new KwpError(0x22);
      this.rout[p[1]] = 4;
      return [0x71, p[1]];
    }
    if (s === 0x33) {                     // routine status (counts down to done)
      const r = p[1];
      if (this.rout[r] > 0) this.rout[r]--;
      const done = (this.rout[r] || 0) === 0;
      return [0x73, r, done ? 2 : 1];
    }
    if (s === 0x30) {                     // input/output control: bleeding, valve actuation
      if (this.session === 0x81) throw new KwpError(0x22);
      if (p[1] !== 0x10 || p[2] !== 0x07 || p.length !== 8) throw new KwpError(0x12);
      return [0x70, 0x10, 0x07];
    }
    if (s === 0x22) {                     // read data by common id: 0x3000 = coding
      if (p[1] !== 0x30 || p[2] !== 0x00) throw new KwpError(0x31);
      return [0x62, 0x30, 0x00, this.ee[0xFA], this.ee[0xFB], this.ee[0xFC]];
    }
    if (s === 0x21) return [0x61, p[1], ...mockLive(p[1])];   // live data
    if (s === 0x3E) return [0x7E, p[1] || 0];                 // tester present
    throw new KwpError(0x11);
  }

  async close() {}
}

function mockLive(lid) {
  if (lid === 0x02) {                     // conditioned values, 16-bit BE, FFFF = invalid
    const v = [0x0190, 0, 0xFFFF, 0xFFFF, 0xFFFF, 0, 0, 0, 0, 0xFFFF], o = [];
    v.forEach(x => o.push(x >> 8, x & 0xFF));
    return o;
  }
  if (lid === 0x07) return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];  // raw wheel speeds + pad
  return [0];
}

// ---- Brake bleeding ----
// The module bleeds with $30 InputOutputControlByLocalIdentifier on local id 0x10,
// control parameter 0x07 (short-term adjustment), one frame per actuator state:
//   30 10 07 <valves> <aux> 01 <valves> <aux>
// valves: two bits per wheel (FL bits 0-1, FR 2-3, RL 4-5, RR 6-7), aux: 0x10 = pump motor,
// 0x0F = the four switching valves, 0x00 = everything off. Each side is a 104-frame sequence;
// the default inter-frame pause is 200 ms.
const BLEED_SIDES = {
  left:  { label: "FL + RL", one: 0x11, mixed: 0xDD },
  right: { label: "FR + RR", one: 0x44, mixed: 0x77 },
};
function bleedSeq(side) {
  const s = BLEED_SIDES[side];
  if (!s) throw new Error("bleed side must be left or right");
  const q = [[s.one, 0x00]];
  for (let i = 0; i < 10; i++) q.push([0x55, 0x10], [s.mixed, 0x10], [0x55, 0x10], [0x55, 0x10], [s.one, 0x10], [s.one, 0x10]);
  for (let i = 0; i < 20; i++) q.push([s.one, 0x00], [0x00, 0x00]);
  q.push([0x00, 0x0F], [0x00, 0x0F], [0x00, 0x00]);
  return q;
}
const bleedFrame = (v, aux) => [0x30, 0x10, 0x07, v, aux, 0x01, v, aux];
// One-shot per-wheel form, inlet + outlet valves + pump:
//   30 10 07 00 00 FF <valves> 10
const WHEEL_MASK = { FL: 0x03, FR: 0x0C, RL: 0x30, RR: 0xC0 };
const actuateFrame = (v, aux) => [0x30, 0x10, 0x07, 0x00, 0x00, 0xFF, v, aux];
// Human-readable actuator state for one bleeding frame.
function bleedDesc(v, aux) {
  const w = ["FL", "FR", "RL", "RR"].map((n, i) => { const b = (v >> (2 * i)) & 3; return b ? `${n}${b === 3 ? " (both)" : ""}` : null; }).filter(Boolean);
  const a = aux === 0x10 ? "pump" : aux === 0x0F ? "switching valves" : aux ? `aux 0x${aux.toString(16)}` : null;
  return [...w, a].filter(Boolean).join(", ") || "all off";
}

// ---- Module (ported) ----
class Module {
  constructor(t, keys, target, auth) {
    this.t = t;
    this.keys = keys;
    this.target = target || "z4";   // "z4" decodes DTCs via DTCMAP; "m3" shows raw codes
    this.auth = auth || {};          // M3 level-5 material: { uid, w564, key16 } (byte arrays)
  }

  // M3 level-5 Authentisierung (KWP 0x31 07 / 0x31 08). uid defaults to WinKFP's "273c";
  // w564 (null) is read per-unit from $1A 89; key16 is the 16-byte level-5 key (not stored
  // in the repo). Must run before the 0x7E unlock that gates CCP on the M3.
  async auth5(uid, w564, key16) {
    if (!key16 || key16.length !== 16) throw new Error("M3 CCP needs the 16-byte level-5 key: type it in the L5 field");
    uid = (uid && uid.length) ? uid.slice(0, 4) : [0x32, 0x37, 0x33, 0x63];   // "273c"
    await this.session(0x81).catch(() => {});   // tolerate a refusal from a stuck session
    await this.session(0x87).catch(() => {});
    if (!w564 || !w564.length) {
      const r = await this.t.request([0x1A, 0x89]);
      const d = (r.length >= 2 && r[0] === 0x5A) ? r.slice(2) : r;
      w564 = Array.from(d.slice(-4));
    }
    const rnd = await this.t.request([0x31, 0x07, 0x03, ...uid]);   // -> 71 07 <zufall:8>
    const zufall = Array.from(rnd.slice(2, 10));
    if (zufall.length !== 8) throw new Error("level-5 auth: no random from the module (31 07)");
    const data16 = [...uid.slice(0, 4), ...w564.slice(0, 4), ...zufall];   // uid || w564 || zufall
    const resp = md5([...key16, ...data16, ...key16]);                     // MD5(key || data16 || key)
    const rr = await this.t.request([0x31, 0x08, ...resp]);                // -> 71 08 01
    if (!(rr[0] === 0x71 && rr[2] === 0x01)) throw new Error("level-5 auth rejected by the module (wrong key or W564)");
    return { zufall };
  }

  async session(l) {
    await this.t.request([0x10, l]);
    return { session: `0x${l.toString(16)}` };
  }

  async unlock(l) {
    const [seedSub, keySub] = { 0x03: [0x03, 0x04], 0x7E: [0xFB, 0xFC], 0x7F: [0xFD, 0xFE] }[l];
    const b = await this.t.request([0x27, seedSub]);
    if (b.length < 4 || b[0] !== 0x67) throw new KwpError(0x22);
    const seed = (b[2] << 8) | b[3];
    if (seed === 0) return { level: `0x${l.toString(16)}`, already: true };

    let key;
    if (l === 0x03) {
      key = ktSeedrev(seed);
    } else if (l === 0x7E) {
      if (!this.keys.ccpKey) throw new Error("no CCP key (0x7E): type it in the toolbar field and retry");
      key = ktCcpKey(seed, this.keys.ccpKey);
    } else {
      if (!this.keys.codingKey) throw new Error("no coding key (0x7F): type it in the toolbar field and retry");
      key = ktCodingKey(seed, this.keys.codingKey);
    }
    try {
      await this.t.request([0x27, keySub, (key >> 8) & 0xFF, key & 0xFF]);
    } catch (e) {
      if (e.nrc === 0x10) throw new Error(`key 0x${key.toString(16)} rejected for seed 0x${seed.toString(16)} (NRC 0x10): wrong constant for this unit`);
      throw e;
    }
    return { level: `0x${l.toString(16)}`, seed: `0x${seed.toString(16)}`, key: `0x${key.toString(16)}` };
  }

  async readIdent(id) {
    const b = await this.t.request([0x1A, id]);
    const d = Array.from((b.length >= 2 && b[0] === 0x5A) ? b.slice(2) : b);
    const out = { id, bytes: d, source: (this.target === "z4" && IDENT_SRC[id]) || "?" };   // Z4 firmware locations
    if (id === 0x80 && d.length >= 6) {
      // BMW part number (ZB): packed BCD in bytes 2..5 of the 0x80 block (5A 80 00 00 <ZB:4> ...)
      const bcd = d.slice(2, 6);
      if (bcd.every(b => (b >> 4) <= 9 && (b & 0xF) <= 9)) {
        out.zb = bcd.map(b => b.toString(16).padStart(2, '0')).join('').replace(/^0+/, '') || "0";
      }
    }
    const n = d[0];
    if (id === 0x94 && d.length > 1 && n > 0 && n < d.length &&
        d.slice(1, 1 + n).every(c => c >= 0x20 && c < 0x7F)) {
      out.swId = String.fromCharCode(...d.slice(1, 1 + n)).trim();
      out.tail = d.slice(1 + n);
      if (d.length > 0x15) {
        out.keys = {
          ccpKey: (d[0x11] << 8) | d[0x13],
          codingKey: (d[0x14] << 8) | d[0x15],
        };
      }
    } else {
      out.ascii = d.map(c => (c >= 0x20 && c < 0x7F) ? String.fromCharCode(c) : ".").join("");
    }
    return out;
  }

  // One-click sequences, order-independent: open the adjustment session, then unlock.
  async enableCodingWrite() {
    await this.session(0x87);
    return await this.unlock(0x7F);
  }

  async enableCcp() {
    // M3: CCP (0x797/0x798) is gated behind level 0x7E, which in turn needs the
    // level-5 Authentisierung first. Z4: just the 0x87 session.
    if (this.target === "m3") {
      await this.auth5(this.auth.uid, this.auth.w564, this.auth.key16);
      const u = await this.unlock(0x7E);
      await this.t.request([0x31, 0x31, 0x01]);
      return { ...u, auth5: true };
    }
    await this.session(0x87);
    const u = await this.unlock(0x7E);
    await this.t.request([0x31, 0x31, 0x01]);   // diagnostic state 4: CCP is served on CAN
    return u;
  }

  async readDtcs() {
    const b = await this.t.request([0x18, 0x02, 0xFF, 0xFF]);
    if (!b.length || b[0] !== 0x58) throw new KwpError(0x10);
    const n = b[1], out = [];
    for (let i = 0; i < n; i++) {
      const o = 2 + i * 3;
      const dtc = (b[o] << 8) | b[o + 1];
      const key = dtc.toString(16).toUpperCase().padStart(4, '0');
      // DTCMAP is the Z4 GT3 fault table; the M3 has its own, so show raw codes there
      const faults = this.target === "z4" ? (DTCMAP[key] || []) : [];
      const info = this.target === "z4" ? faults.map(f => FAULTINFO[f] || ["(no entry)", "?", ""]) : [];
      const extra = (this.target === "z4" && !faults.length) ? (EXTRA_DTC[key] || null) : null;
      out.push({ dtc: key, status: b[o + 2], faults, info, extra, lamp: this.target === "z4" ? dtcLamp(faults) : "?" });
    }
    return { count: n, dtcs: out };
  }

  async clearDtcs() {
    await this.t.request([0x14, 0xFF, 0xFF]);
  }

  async readCoding() {
    const b = await this.t.request([0x23, 0, 0, 0xFA, 0x03, 0x03]);
    const d = b[0] === 0x63 ? b.slice(1) : b;
    const ck = d[0], row = d[1], f1 = d[2];
    return { ck, row, f1, ok: ck === (((row ^ f1) + 1) & 0xFF) };
  }

  async writeCoding(row, f1) {
    await this.enableCodingWrite();            // session + 0x7F, whatever was clicked before
    const ck = ((row ^ f1) + 1) & 0xFF;
    const writes = [[0xFB, row], [0xFC, f1], [0xFA, ck]];
    const done = [];
    for (const [a, v] of writes) {
      await this.t.request([0x3D, 0, 0, a, 0x03, 0x01, v]);
      done.push(`0x0${a.toString(16).toUpperCase()}=0x${v.toString(16).padStart(2, '0')}`);
    }
    return done;
  }

  async routine(rid) {
    await this.session(0x87);                 // routines need the adjustment session
    await this.t.request([0x31, rid, 0x00]);  // routine-entry option byte
  }

  async rstatus(rid) {
    const b = await this.t.request([0x33, rid]);
    const st = b[2] || 0;
    return { st, running: st === 1, done: st === 2 };
  }

  async readMem(a, n, t) {
    let out = [];
    while (n > 0) {
      const k = Math.min(n, 0x20);
      const b = await this.t.request([0x23, 0, (a >> 8) & 0xFF, a & 0xFF, t, k]);
      out = out.concat(Array.from(b[0] === 0x63 ? b.slice(1) : b));
      a += k;
      n -= k;
    }
    return out;
  }

  async live(lid) {
    const b = await this.t.request([0x21, lid]);
    return (b.length >= 2 && b[0] === 0x61) ? b.slice(2) : b;
  }

  // Brake bleeding: runs one side's sequence (see bleedSeq). onStep(i, n, valves, aux) is
  // called before each frame; stop() is polled between frames and, when it returns true, the
  // all-off frame is sent and the run ends early. The target's own session/NRC checks still apply.
  async bleed(side, { pause = 200, onStep, stop } = {}) {
    const seq = bleedSeq(side);
    await this.session(0x87);
    await sleep(100);                              // settle after 10 87
    for (let i = 0; i < seq.length; i++) {
      if (stop && stop()) {
        await this.t.request(bleedFrame(0x00, 0x00));
        return { side, frames: i, total: seq.length, stopped: true };
      }
      const [v, aux] = seq[i];
      if (onStep) onStep(i, seq.length, v, aux);
      await this.t.request(bleedFrame(v, aux));
      if (pause) await sleep(pause);
    }
    return { side, frames: seq.length, total: seq.length, stopped: false };
  }

  // One wheel's inlet + outlet valves with the pump (one-shot form).
  async actuate(wheel) {
    const v = WHEEL_MASK[wheel];
    if (v === undefined) throw new Error("wheel must be FL, FR, RL or RR");
    await this.session(0x87);
    await this.t.request(actuateFrame(v, 0x10));
    return { wheel, valves: v };
  }

  async actuateOff() {
    await this.t.request(bleedFrame(0x00, 0x00));   // everything off
  }

  // Coding via $22 30 00 (readDataByCommonIdentifier 0x3000): a cross-check for the EEPROM
  // read in readCoding().
  async readCodingId() {
    const b = await this.t.request([0x22, 0x30, 0x00]);
    return Array.from((b.length >= 3 && b[0] === 0x62) ? b.slice(3) : b);
  }
}


if (typeof module !== "undefined") module.exports = { md5, Module, MockKwp, ktCcpKey, ktCodingKey, ktSeedrev, bleedSeq, bleedFrame, actuateFrame, bleedDesc, WHEEL_MASK, EXTRA_DTC };
