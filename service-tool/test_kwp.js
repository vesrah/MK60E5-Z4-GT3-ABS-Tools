// KWP Module: MD5, M3 level-5 auth, Enable CCP flow, routines and brake bleeding.  node service-tool/test_kwp.js
// MD5 and auth vectors are from the RFC and from kwp.py (computed independently of this code).
const test = require("node:test");
const assert = require("node:assert");

global.DTCMAP = {}; global.FAULTINFO = {};
global.IDENT_LEN = {}; global.IDENT_SRC = {}; global.SW_IDENT_94 = [];
const { md5, Module, MockKwp, bleedSeq, bleedFrame, actuateFrame, WHEEL_MASK, EXTRA_DTC } = require("../assets/kwp.js");

const hex = a => Array.from(a, b => b.toString(16).padStart(2, "0")).join("");
const bytes = s => s.match(/../g).map(x => parseInt(x, 16));

test("MD5 matches the RFC test vectors", () => {
  assert.strictEqual(hex(md5([])), "d41d8cd98f00b204e9800998ecf8427e");
  assert.strictEqual(hex(md5(Array.from("abc", c => c.charCodeAt(0)))), "900150983cd24fb0d6963f7d28e17f72");
  assert.strictEqual(hex(md5(Array.from("The quick brown fox jumps over the lazy dog", c => c.charCodeAt(0)))),
    "9e107d9d372bb6826bd81d3542a419d6");
  // 56 and 64 bytes both force the length into a second padding block
  assert.strictEqual(hex(md5(Array.from("a".repeat(56), c => c.charCodeAt(0)))),
    "3b0c8ac703f828b04c6c197006d17218");
  assert.strictEqual(hex(md5(Array.from("a".repeat(64), c => c.charCodeAt(0)))),
    "014842d480b571495a4a0363793f7367");
});

test("level-5 response = MD5(key || uid||w564||zufall || key), vs kwp.py", () => {
  const key = bytes("00112233445566778899aabbccddeeff");
  const data16 = [...Array.from("273c", c => c.charCodeAt(0)), ...bytes("00b40000"), 0, 1, 2, 3, 4, 5, 6, 7];
  assert.strictEqual(hex(md5([...key, ...data16, ...key])), "829dca06a11a7f4b446c0d0e87f190a3");
});

// A fake transport that scripts a cooperative module and records every request. For 31 08
// it recomputes the expected response, so a wrong MD5 or assembly fails the test.
function fakeM3(key16, { expectW564 = [0x00, 0xB4, 0x00, 0x00], grant = true } = {}) {
  const zufall = [0, 1, 2, 3, 4, 5, 6, 7];
  const t = { kind: "can", log: [], uid: null };
  t.request = async (p) => {
    t.log.push(p.join(" "));
    const s = p[0];
    if (s === 0x10) return [0x50, p[1]];
    if (s === 0x1A && p[1] === 0x89) return [0x5A, 0x89, 0x00, 0xB4, 0x00, 0x00];
    if (s === 0x31 && p[1] === 0x07) { t.uid = p.slice(3, 7); return [0x71, 0x07, ...zufall]; }
    if (s === 0x31 && p[1] === 0x08) {
      const data16 = [...t.uid, ...expectW564, ...zufall];
      const want = Array.from(md5([...key16, ...data16, ...key16]));
      assert.deepStrictEqual(p.slice(2), want, "response bytes must be MD5(key||data16||key)");
      return grant ? [0x71, 0x08, 0x01] : [0x71, 0x08, 0x00];
    }
    if (s === 0x27 && p[1] === 0xFB) return [0x67, 0xFB, 0x12, 0x34];   // 0x7E seed
    if (s === 0x27 && p[1] === 0xFC) return [0x67, 0xFC];              // 0x7E key accepted
    if (s === 0x31 && p[1] === 0x31) return [0x71, 0x31, 0x01];        // CCP enable
    throw new Error("unexpected request " + p.join(" "));
  };
  return t;
}

test("M3 Enable CCP: auth5 then 0x7E then 31 31 01, in order", async () => {
  const key16 = bytes("00112233445566778899aabbccddeeff");
  const t = fakeM3(key16);
  const mod = new Module(t, { ccpKey: 0x070B }, "m3", { uid: null, w564: null, key16 });
  const r = await mod.enableCcp();
  assert.strictEqual(r.auth5, true);
  const services = t.log.map(l => l.split(" ").slice(0, 2).join(" "));
  assert.deepStrictEqual(services, ["16 129", "16 135", "26 137", "49 7", "49 8", "39 251", "39 252", "49 49"]);
  //  10 81      10 87      1A 89     31 07   31 08   27 FB     27 FC    31 31
});

test("M3 Enable CCP defaults UID to 273c and reads W564 from $1A 89", async () => {
  const key16 = bytes("ffeeddccbbaa99887766554433221100");
  const t = fakeM3(key16);
  const mod = new Module(t, { ccpKey: 0x070B }, "m3", { key16 });
  await mod.enableCcp();
  const auth07 = t.log.find(l => l.startsWith("49 7 3")).split(" ").map(Number);
  assert.deepStrictEqual(auth07.slice(3), [0x32, 0x37, 0x33, 0x63]);   // "273c"
  assert.ok(t.log.some(l => l === "26 137"), "reads $1A 89 for W564");
});

test("M3 Enable CCP without a key is refused before any request", async () => {
  const t = fakeM3(bytes("00112233445566778899aabbccddeeff"));
  const mod = new Module(t, { ccpKey: 0x070B }, "m3", {});
  await assert.rejects(mod.enableCcp(), /level-5 key/);
  assert.strictEqual(t.log.length, 0);
});

test("M3 Enable CCP surfaces a rejected auth", async () => {
  const key16 = bytes("00112233445566778899aabbccddeeff");
  const t = fakeM3(key16, { grant: false });
  const mod = new Module(t, { ccpKey: 0x070B }, "m3", { key16 });
  await assert.rejects(mod.enableCcp(), /auth rejected/);
  assert.ok(!t.log.some(l => l.startsWith("39 251")), "must not try the 0x7E unlock after a failed auth");
});

test("an explicit W564 override is used instead of $1A 89", async () => {
  const key16 = bytes("00112233445566778899aabbccddeeff");
  const t = fakeM3(key16, { expectW564: [0xAA, 0xBB, 0xCC, 0xDD] });
  const mod = new Module(t, { ccpKey: 0x070B }, "m3", { key16, w564: [0xAA, 0xBB, 0xCC, 0xDD] });
  await mod.enableCcp();
  assert.ok(!t.log.some(l => l === "26 137"), "override means no $1A 89 read");
});

test("Z4 Enable CCP is unchanged: 10 87, 0x7E, 31 31 01, no auth5", async () => {
  const log = [];
  const t = { kind: "serial", request: async (p) => {
    log.push(p.join(" "));
    if (p[0] === 0x10) return [0x50, p[1]];
    if (p[0] === 0x27 && p[1] === 0xFB) return [0x67, 0xFB, 0x12, 0x34];
    if (p[0] === 0x27 && p[1] === 0xFC) return [0x67, 0xFC];
    if (p[0] === 0x31) return [0x71, 0x31];
    throw new Error("unexpected " + p.join(" "));
  }};
  const mod = new Module(t, { ccpKey: 0x1D14 }, "z4");
  const r = await mod.enableCcp();
  assert.strictEqual(r.auth5, undefined);
  assert.deepStrictEqual(log.map(l => l.split(" ").slice(0, 2).join(" ")), ["16 135", "39 251", "39 252", "49 49"]);
});

// ---- routines and brake bleeding ----

// Records every request and answers with a generic positive response.
function recorder() {
  const t = { kind: "fake", log: [] };
  t.request = async p => { t.log.push(hex(p).match(/../g).join(" ")); return [p[0] | 0x40, ...p.slice(1)]; };
  return t;
}

// The expected (valves, aux) pairs of each side's sequence, 104 frames.
const BLEED_LEFT = "1100 5510 dd10 5510 5510 1110 1110 5510 dd10 5510 5510 1110 1110 5510 dd10 5510 5510 1110 1110 5510 dd10 5510 5510 1110 1110 5510 dd10 5510 5510 1110 1110 5510 dd10 5510 5510 1110 1110 5510 dd10 5510 5510 1110 1110 5510 dd10 5510 5510 1110 1110 5510 dd10 5510 5510 1110 1110 5510 dd10 5510 5510 1110 1110 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 1100 0000 000f 000f 0000";
const BLEED_RIGHT = "4400 5510 7710 5510 5510 4410 4410 5510 7710 5510 5510 4410 4410 5510 7710 5510 5510 4410 4410 5510 7710 5510 5510 4410 4410 5510 7710 5510 5510 4410 4410 5510 7710 5510 5510 4410 4410 5510 7710 5510 5510 4410 4410 5510 7710 5510 5510 4410 4410 5510 7710 5510 5510 4410 4410 5510 7710 5510 5510 4410 4410 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 4400 0000 000f 000f 0000";
const pairs = q => q.map(([v, a]) => v.toString(16).padStart(2, "0") + a.toString(16).padStart(2, "0")).join(" ");

test("routine: 10 87, then 31 <rid> 00 with the option byte", async () => {
  const t = recorder();
  await new Module(t, {}, "z4").routine(0x29);
  assert.deepStrictEqual(t.log, ["10 87", "31 29 00"]);
});

test("bleeding sequences: 104 frames per side, right side mirrors the left", () => {
  assert.strictEqual(pairs(bleedSeq("left")), BLEED_LEFT);
  assert.strictEqual(pairs(bleedSeq("right")), BLEED_RIGHT);
  assert.strictEqual(bleedSeq("left").length, 104);
  assert.throws(() => bleedSeq("front"), /left or right/);
});

test("bleed: 10 87, then one 30 10 07 frame per step with the state repeated, all off last", async () => {
  const t = recorder(), steps = [];
  const r = await new Module(t, {}, "z4").bleed("left", { pause: 0, onStep: (i, n) => steps.push([i, n]) });
  assert.deepStrictEqual(r, { side: "left", frames: 104, total: 104, stopped: false });
  assert.strictEqual(t.log.length, 105);
  assert.strictEqual(t.log[0], "10 87");
  assert.strictEqual(t.log[1], "30 10 07 11 00 01 11 00");
  assert.strictEqual(t.log[2], "30 10 07 55 10 01 55 10");
  assert.strictEqual(t.log[104], "30 10 07 00 00 01 00 00");
  for (const l of t.log.slice(1)) {
    const b = l.split(" ");
    assert.strictEqual(b.length, 8);
    assert.deepStrictEqual(b.slice(0, 3), ["30", "10", "07"]);
    assert.strictEqual(b[5], "01");
    assert.strictEqual(b[3], b[6]);
    assert.strictEqual(b[4], b[7]);
  }
  assert.strictEqual(steps.length, 104);
  assert.deepStrictEqual(steps[0], [0, 104]);
});

test("bleed stop: ends early and sends the all-off frame", async () => {
  const t = recorder();
  let sent = 0;
  const r = await new Module(t, {}, "z4").bleed("right", { pause: 0, onStep: () => sent++, stop: () => sent >= 3 });
  assert.deepStrictEqual(r, { side: "right", frames: 3, total: 104, stopped: true });
  assert.strictEqual(t.log.length, 5);                       // 10 87, 3 frames, all off
  assert.strictEqual(t.log[1], "30 10 07 44 00 01 44 00");
  assert.strictEqual(t.log[4], "30 10 07 00 00 01 00 00");
});

test("actuate: one-shot per-wheel frame with the pump; RR is 0xC0", async () => {
  assert.deepStrictEqual(WHEEL_MASK, { FL: 0x03, FR: 0x0C, RL: 0x30, RR: 0xC0 });
  assert.deepStrictEqual(actuateFrame(0xC0, 0x10), [0x30, 0x10, 0x07, 0x00, 0x00, 0xFF, 0xC0, 0x10]);
  assert.deepStrictEqual(bleedFrame(0x11, 0x10), [0x30, 0x10, 0x07, 0x11, 0x10, 0x01, 0x11, 0x10]);
  const t = recorder(), mod = new Module(t, {}, "z4");
  await mod.actuate("RR");
  await mod.actuateOff();
  assert.deepStrictEqual(t.log, ["10 87", "30 10 07 00 00 ff c0 10", "30 10 07 00 00 01 00 00"]);
  await assert.rejects(mod.actuate("LF"), /FL, FR, RL or RR/);
});

test("mock: $30 needs the adjustment session; $22 30 00 returns the coding bytes", async () => {
  const m = new MockKwp();
  await assert.rejects(m.request(bleedFrame(0x11, 0)), /0x22/);
  await m.request([0x10, 0x87]);
  assert.deepStrictEqual(await m.request(bleedFrame(0x11, 0)), [0x70, 0x10, 0x07]);
  const mod = new Module(m, {}, "z4");
  assert.deepStrictEqual(await mod.readCodingId(), [0xFA, 0x00, 0x00]);
  const r = await mod.bleed("left", { pause: 0 });
  assert.strictEqual(r.frames, 104);
});

test("DTCs with no internal decode fall back to the extra name table", async () => {
  const m = new MockKwp();
  m.dtcs = [[0x5D, 0xE0, 0x60], [0x5E, 0x59, 0x60]];
  const j = await new Module(m, {}, "z4").readDtcs();
  assert.strictEqual(j.dtcs[0].extra, EXTRA_DTC["5DE0"]);
  assert.match(j.dtcs[0].extra, /brake-pad thickness/);
  assert.strictEqual(j.dtcs[0].lamp, "?");
  assert.strictEqual(j.dtcs[1].extra, null);                 // DTCMAP is empty in this test, but 5E59 has no extra name either
});
