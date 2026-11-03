// PCAN-USB driver against a fake USB device: node service-tool/test_pcan_usb.js
// Expected bytes are worked out by hand from the protocol, not produced by the driver.
const test = require("node:test");
const assert = require("node:assert");
const { PcanUsb, PcanKwp, pcanBtr, pcanDecodeBuffer, pcanEncodeFrame } = require("../assets/pcan_usb.js");

global.KwpError = class KwpError extends Error {
  constructor(nrc) { super(`NRC 0x${nrc.toString(16)}`); this.nrc = nrc; }
};

const hex = a => Array.from(a, b => b.toString(16).padStart(2, "0")).join(" ");
const bytes = s => Uint8Array.from(s.split(" ").map(x => parseInt(x, 16)));

class FakeDevice {
  constructor(major = 8) {
    this.deviceVersionMajor = major;
    this.opened = false;
    this.configuration = null;
    this.out = [];        // [endpoint, hex of first 16 bytes, length]
    this.pending = [];
    this.inbox = [];
  }
  async open() { this.opened = true; }
  async selectConfiguration() { this.configuration = {}; }
  async claimInterface() {}
  async releaseInterface() {
    this.pending.splice(0).forEach(p => p.reject(new Error("aborted")));
  }
  async close() { this.opened = false; }
  async transferOut(ep, data) {
    this.out.push([ep, hex(data.slice(0, 16)), data.length]);
    if (ep === 2 && this.onCan) this.onCan(data);
    return { status: "ok" };
  }
  transferIn() {
    return new Promise((resolve, reject) => {
      if (this.inbox.length) return resolve(this._wrap(this.inbox.shift()));
      this.pending.push({ resolve, reject });
    });
  }
  _wrap(b) { return { status: "ok", data: new DataView(b.buffer, b.byteOffset, b.byteLength) }; }
  deliver(b) {
    const p = this.pending.shift();
    if (p) p.resolve(this._wrap(b)); else this.inbox.push(b);
  }
}
const tick = () => new Promise(r => setTimeout(r, 0));

test("500 kbit/s is PEAK's published 0x001C", () => {
  assert.deepStrictEqual(pcanBtr(500000), [0x00, 0x1C]);
  assert.deepStrictEqual(pcanBtr(250000), [0x01, 0x1C]);
  assert.deepStrictEqual(pcanBtr(125000), [0x03, 0x1C]);
  assert.throws(() => pcanBtr(1000000));
});

test("standard frame: id << 5, first timestamp is 16 bits", () => {
  // CCP DTO 0x6A0: 0x6A0 << 5 = 0xD400 -> 00 D4; ts 0x1234 -> 34 12
  const d = pcanDecodeBuffer(bytes("00 01 08 00 d4 34 12 ff 00 01 aa bb cc dd ee"));
  assert.strictEqual(d.bad, null);
  assert.strictEqual(d.frames.length, 1);
  const f = d.frames[0];
  assert.strictEqual(f.id, 0x6A0);
  assert.strictEqual(f.ext, false);
  assert.strictEqual(f.ts, 0x1234);
  assert.strictEqual(hex(f.data), "ff 00 01 aa bb cc dd ee");
});

test("later timestamps are 8 bits and carry on wrap", () => {
  // ts 0x12F0, then 0xF8 -> 0x12F8, then 0x04 wraps -> 0x1304
  const d = pcanDecodeBuffer(bytes("00 03 01 20 00 f0 12 a1 01 40 00 f8 a2 02 60 00 04 a3 a4"));
  assert.strictEqual(d.bad, null);
  assert.deepStrictEqual(d.frames.map(f => f.id), [1, 2, 3]);
  assert.deepStrictEqual(d.frames.map(f => f.ts), [0x12F0, 0x12F8, 0x1304]);
  assert.strictEqual(hex(d.frames[1].data), "a2");
  assert.strictEqual(hex(d.frames[2].data), "a3 a4");
});

test("extended frame: id << 3 in 32 bits", () => {
  // 0x18DAF129 << 3 = 0xC6D78948 -> 48 89 d7 c6
  const d = pcanDecodeBuffer(bytes("00 01 22 48 89 d7 c6 10 00 01 02"));
  assert.strictEqual(d.frames[0].id, 0x18DAF129);
  assert.strictEqual(d.frames[0].ext, true);
  assert.strictEqual(hex(d.frames[0].data), "01 02");
});

test("RTR carries no payload", () => {
  const d = pcanDecodeBuffer(bytes("00 02 18 00 d4 01 00 01 20 00 05 aa"));
  assert.strictEqual(d.bad, null);
  assert.strictEqual(d.frames[0].rtr, true);
  assert.strictEqual(d.frames[0].data.length, 0);
  assert.strictEqual(d.frames[1].id, 1);
  assert.strictEqual(hex(d.frames[1].data), "aa");
});

test("self-reception frame has a client byte after the data", () => {
  // id 1 with the SRR flag: (1 << 5) | 1 = 0x21
  const d = pcanDecodeBuffer(bytes("00 02 01 21 00 10 00 aa 80 01 40 00 11 bb"));
  assert.strictEqual(d.bad, null);
  assert.strictEqual(hex(d.frames[1].data), "bb");
  assert.strictEqual(d.frames[1].id, 2);
});

test("DLC above 8 consumes its length but returns 8 bytes", () => {
  const d = pcanDecodeBuffer(bytes("00 02 09 20 00 01 00 01 02 03 04 05 06 07 08 09 01 40 00 02 aa"));
  assert.strictEqual(d.bad, null);
  assert.strictEqual(d.frames[0].data.length, 8);
  assert.strictEqual(hex(d.frames[1].data), "aa");
});

test("status records between frames: bus event, analog, bus load, timestamp, error", () => {
  const d = pcanDecodeBuffer(bytes(
    "00 06" +
    " 44 05 80 00 7f 81 00" +     // bus event, rx 0x7F tx 0x81
    " 40 02 00 11 22" +           // analog: always 2 bytes
    " 40 03 00 33" +              // bus load: always 1 byte
    " 42 04 00 34 12" +           // timestamp record
    " 40 01 10" +                 // error: bus off
    " 01 20 00 10 00 aa"));
  assert.strictEqual(d.bad, null);
  assert.deepStrictEqual(d.counters, { rx: 0x7F, tx: 0x81 });
  assert.strictEqual(d.sawTs, true);
  assert.deepStrictEqual(d.errors, [0x10]);
  assert.strictEqual(hex(d.frames[0].data), "aa");
});

test("a status record's timestamp counts as the buffer's first", () => {
  const d = pcanDecodeBuffer(bytes("00 02 c0 01 04 10 00 01 20 00 20 aa"));
  assert.strictEqual(d.bad, null);
  assert.strictEqual(d.frames[0].ts, 0x0020);
});

test("truncated buffers report instead of reading past the end", () => {
  for (const s of ["00 01 08 00 d4 34 12 ff", "00 01 08 00", "00 02 00 20 00 01 00", "00 01 40 01", "00"]) {
    const d = pcanDecodeBuffer(bytes(s));
    assert.ok(d.bad, s);
  }
  assert.strictEqual(pcanDecodeBuffer(new Uint8Array(0)).bad, null);
});

test("encode: CCP CONNECT on 0x6A2 and an extended frame", () => {
  // 0x6A2 << 5 = 0xD440 -> 40 d4
  const b = pcanEncodeFrame(0x6A2, [1, 1, 0, 0, 0, 0, 0, 0], { counter: 7 });
  assert.strictEqual(b.length, 64);
  assert.strictEqual(hex(b.slice(0, 13)), "02 01 08 40 d4 01 01 00 00 00 00 00 00");
  assert.strictEqual(b[63], 7);
  const e = pcanEncodeFrame(0x18DAF129, [9], { ext: true });
  assert.strictEqual(hex(e.slice(0, 8)), "02 01 21 48 89 d7 c6 09");
  assert.throws(() => pcanEncodeFrame(0x800, []));
  assert.throws(() => pcanEncodeFrame(1, new Array(9).fill(0)));
});

test("start sends the driver's sequence at 500 kbit/s, silent", async () => {
  const dev = new FakeDevice();
  const can = new PcanUsb(dev);
  await can.start({ bitrate: 500000, listenOnly: true });
  const z = n => " 00".repeat(n);
  assert.deepStrictEqual(dev.out.map(o => o[1]), [
    "03 02 00" + z(13),       // bus off
    "09 02 00 01" + z(12),    // SJA1000 init
    "01 02 1c 00" + z(12),    // BTR1, BTR0
    "0b 02 06" + z(13),       // bus error reporting
    "03 03 01" + z(13),       // silent on
    "0a 02 00" + z(13),       // external 5 V off
    "03 02 01" + z(13),       // bus on
  ]);
  assert.ok(dev.out.every(o => o[0] === 1 && o[2] === 16));
  assert.strictEqual(dev.pending.length, 4);
  await assert.rejects(can.send(1, []), /listen-only/);
  assert.strictEqual(dev.out.length, 7, "listen-only must not transmit");
  await can.close();
  assert.strictEqual(dev.opened, false);
  assert.strictEqual(dev.out[7][1], "03 02 00" + z(13));
  assert.strictEqual(dev.out[8][1], "09 02 00 01" + z(12));
});

test("listen-only is refused on a revision that can't do it, before touching USB", async () => {
  const dev = new FakeDevice(3);
  await assert.rejects(new PcanUsb(dev).start({ listenOnly: true }), /no listen-only/);
  assert.strictEqual(dev.out.length, 0);
  assert.strictEqual(dev.opened, false);
});

test("frames reach onFrame and recv; send works when not silent", async () => {
  const dev = new FakeDevice();
  const can = new PcanUsb(dev);
  const seen = [];
  await can.start({ listenOnly: false, onFrame: f => seen.push(f.id) });
  assert.ok(dev.out.some(o => o[1].startsWith("03 03 00")), "silent mode off");
  await can.send(0x6A2, [1, 1, 0, 0, 0, 0, 0, 0]);
  const last = dev.out[dev.out.length - 1];
  assert.strictEqual(last[0], 2);
  assert.strictEqual(last[2], 64);
  dev.deliver(bytes("00 01 01 00 d4 01 00 ff"));
  await tick();
  const f = await can.recv(100);
  assert.strictEqual(f.id, 0x6A0);
  assert.deepStrictEqual(seen, [0x6A0]);
  const w = can.recv(1000);          // a waiting recv gets the next frame directly
  dev.deliver(bytes("00 01 01 20 d4 01 00 fe"));
  assert.strictEqual((await w).id, 0x6A1);
  assert.strictEqual(await can.recv(5), null);
  await can.close();
});

test("bus state follows error records and the error counters", async () => {
  const dev = new FakeDevice();
  const can = new PcanUsb(dev);
  const states = [];
  await can.start({ onStatus: s => states.push(s.state) });
  dev.deliver(bytes("00 01 40 01 08"));                  // heavy with low counters
  await tick();
  dev.deliver(bytes("00 01 42 05 80 00 90 00"));         // rx counter 0x90 (rec_len 2 only reaches ptr[1])
  await tick();
  dev.deliver(bytes("00 01 40 01 10"));                  // bus off
  await tick();
  assert.deepStrictEqual(states, ["warning", "bus-off"]);
  await can.close();
});

test("the queue is bounded when nobody reads", async () => {
  const can = new PcanUsb(new FakeDevice());
  for (let i = 0; i < 5000; i++) can._push({ id: i });
  assert.strictEqual(can.queue.length, 4096);
  assert.strictEqual(can.stats.dropped, 904);
  assert.strictEqual(can.stats.frames, 5000);
});

// A module on 0x6F1/0x629 behind the fake adapter. handler(service payload) returns the
// list of reply payloads; ISO-TP framing here is written out separately from the driver's.
function fakeModule(dev, handler, { stmin = 0, bs = 0, broadcast = true } = {}) {
  const log = { rx: [], fc: 0, raw: [] };
  let longReq = null, pendingTail = null;
  const frame = (id, bytes) => {
    const v = id << 5;
    return Uint8Array.from([0, 1, 8, v & 0xFF, v >> 8, 0, 0, ...bytes, ...new Array(8 - bytes.length).fill(0)]);
  };
  const reply = b => dev.deliver(frame(0x629, [0xF1, ...b]));
  const respond = p => {
    log.rx.push(p);
    for (const r of handler(p)) {
      if (broadcast) dev.deliver(frame(0x4A0, [1, 2, 3, 4, 5, 6, 7, 8]));
      if (r.length <= 6) {
        reply([r.length, ...r]);
      } else {
        reply([0x10 | (r.length >> 8), r.length & 0xFF, ...r.slice(0, 5)]);
        pendingTail = r.slice(5);
      }
    }
  };
  dev.onCan = data => {
    const n = data[2] & 0x0F, id = (data[3] | (data[4] << 8)) >> 5, b = Array.from(data.slice(5, 5 + n));
    log.raw.push(b);
    assert.strictEqual(id, 0x6F1);
    assert.strictEqual(n, 8);
    assert.strictEqual(b[0], 0x29);
    const pci = b[1] & 0xF0;
    if (pci === 0x00) {
      respond(b.slice(2, 2 + b[1]));
    } else if (pci === 0x10) {
      longReq = { total: ((b[1] & 0x0F) << 8) | b[2], buf: b.slice(3) };
      reply([0x30, bs, stmin]);
    } else if (pci === 0x20) {
      longReq.buf.push(...b.slice(2));
      if (longReq.buf.length >= longReq.total) { const p = longReq.buf.slice(0, longReq.total); longReq = null; respond(p); }
    } else if (pci === 0x30) {
      log.fc++;
      let tail = pendingTail, sn = 1;
      pendingTail = null;
      while (tail && tail.length) {
        reply([0x20 | sn, ...tail.slice(0, 6)]);
        tail = tail.slice(6);
        sn = (sn + 1) & 0x0F;
      }
    }
  };
  return log;
}

async function kwpOn(handler, opts) {
  const dev = new FakeDevice();
  const t = new PcanKwp(new PcanUsb(dev));
  const log = fakeModule(dev, handler, opts);
  await t.connect();
  return { dev, t, log };
}

test("M3 CAN: connect ACKs on the bus at 500 kbit/s", async () => {
  const { dev, t } = await kwpOn(() => []);
  assert.ok(dev.out.some(o => o[1].startsWith("03 03 00")), "not listen-only");
  assert.ok(dev.out.some(o => o[1].startsWith("01 02 1c 00")), "500 kbit/s");
  await t.close();
});

test("M3 CAN: single-frame exchange with the address in byte 0, broadcasts skipped", async () => {
  const { t, log } = await kwpOn(p => [[p[0] | 0x40, p[1]]]);
  assert.deepStrictEqual(await t.request([0x10, 0x87]), [0x50, 0x87]);
  assert.deepStrictEqual(log.raw[0], [0x29, 0x02, 0x10, 0x87, 0, 0, 0, 0]);
  await t.close();
});

test("M3 CAN: frames go out on 0x6F1", async () => {
  const { dev, t } = await kwpOn(p => [[p[0] | 0x40]]);
  await t.request([0x3E, 0x01]);
  const tx = dev.out.filter(o => o[0] === 2)[0];
  assert.strictEqual(tx[1].slice(0, 14), "02 01 08 20 de");   // 0x6F1 << 5 = 0xDE20
  assert.strictEqual(tx[2], 64);
  await t.close();
});

test("M3 CAN: a 29-byte ident reply reassembles and sends flow control", async () => {
  const block = Array.from({ length: 29 }, (_, i) => i + 1);
  const { t, log } = await kwpOn(() => [[0x5A, 0x80, ...block]]);
  const r = await t.request([0x1A, 0x80]);
  assert.deepStrictEqual(r, [0x5A, 0x80, ...block]);
  assert.strictEqual(log.fc, 1);
  assert.ok(log.raw.some(b => hex(b) === "29 30 00 00 00 00 00 00"));
  await t.close();
});

test("M3 CAN: a request too long for one frame uses first + consecutive frames", async () => {
  const { t, log } = await kwpOn(p => [[p[0] | 0x40, 0, p[2], p[3], 3]]);
  await t.request([0x3D, 0x00, 0x00, 0xFB, 0x03, 0x01, 0x07]);
  assert.deepStrictEqual(log.rx[0], [0x3D, 0x00, 0x00, 0xFB, 0x03, 0x01, 0x07]);
  assert.strictEqual(hex(log.raw[0]), "29 10 07 3d 00 00 fb 03");
  assert.strictEqual(hex(log.raw[1]), "29 21 01 07 00 00 00 00");
  await t.close();
});

test("M3 CAN: an 8-byte bleeding frame goes out as first + consecutive frame", async () => {
  const { t, log } = await kwpOn(p => [[0x70, p[1], p[2]]]);
  const body = await t.request([0x30, 0x10, 0x07, 0x11, 0x00, 0x01, 0x11, 0x00]);
  assert.deepStrictEqual(body, [0x70, 0x10, 0x07]);
  assert.deepStrictEqual(log.rx[0], [0x30, 0x10, 0x07, 0x11, 0x00, 0x01, 0x11, 0x00]);
  assert.strictEqual(hex(log.raw[0]), "29 10 08 30 10 07 11 00");
  assert.strictEqual(hex(log.raw[1]), "29 21 01 11 00 00 00 00");
  await t.close();
});

test("M3 CAN: negative responses throw KwpError with the NRC", async () => {
  const { t } = await kwpOn(p => [[0x7F, p[0], 0x33]]);
  await assert.rejects(t.request([0x31, 0x31, 0x01]), e => e instanceof KwpError && e.nrc === 0x33);
  await t.close();
});

test("M3 CAN: responsePending keeps waiting for the real answer", async () => {
  const { t } = await kwpOn(p => [[0x7F, p[0], 0x78], [p[0] | 0x40, 0xAA]]);
  assert.deepStrictEqual(await t.request([0x21, 0x02]), [0x61, 0xAA]);
  await t.close();
});

test("M3 CAN: overlapping requests run one at a time, and a failure doesn't block the next", async () => {
  const { t, log } = await kwpOn(p => p[0] === 0x18 ? [[0x7F, 0x18, 0x22]] : [[p[0] | 0x40, p[1]]]);
  const a = t.request([0x1A, 0x80]), b = t.request([0x18, 0x02]), c = t.request([0x21, 0x05]);
  assert.deepStrictEqual(await a, [0x5A, 0x80]);
  await assert.rejects(b, /NRC 0x22/);
  assert.deepStrictEqual(await c, [0x61, 0x05]);
  assert.deepStrictEqual(log.rx.map(p => p[0]), [0x1A, 0x18, 0x21]);
  await t.close();
});

test("M3 CAN: a reply addressed to someone else is ignored; silence times out", async () => {
  const { dev, t } = await kwpOn(() => []);
  const started = Date.now();
  const v = 0x629 << 5;
  dev.deliver(Uint8Array.from([0, 1, 8, v & 0xFF, v >> 8, 0, 0, 0xF2, 2, 0x5A, 0x80, 0, 0, 0, 0]));
  await assert.rejects(t.request([0x1A, 0x80]), /no response/);
  assert.ok(Date.now() - started >= 1900);
  await t.close();
});

test("open reuses a granted adapter and only asks when there isn't exactly one", async () => {
  const pcan = { vendorId: 0x0C72, productId: 0x000C }, other = { vendorId: 1, productId: 2 };
  let asked = 0;
  const usb = list => ({ getDevices: async () => list, requestDevice: async () => { asked++; return pcan; } });
  assert.strictEqual((await PcanUsb.open(usb([other, pcan]))).device, pcan);
  assert.strictEqual(asked, 0);
  await PcanUsb.open(usb([other]));
  assert.strictEqual(asked, 1);
  await PcanUsb.open(usb([pcan, pcan]));
  assert.strictEqual(asked, 2);
});

test("an unplugged adapter is reported once and stops the read loops", async () => {
  const dev = new FakeDevice();
  const can = new PcanUsb(dev);
  const fatal = [];
  await can.start({ onStatus: s => s.fatal && fatal.push(s.fatal) });
  dev.pending.splice(0).forEach(p => p.reject(new Error("device gone")));
  await tick();
  assert.strictEqual(fatal.length, 1);
  assert.strictEqual(can.running, false);
  assert.strictEqual(can.state, "closed");
});
