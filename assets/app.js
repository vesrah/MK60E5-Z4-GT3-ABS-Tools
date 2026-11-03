// ---- UI glue ----
let mod = null;
const $ = s => document.querySelector(s);
const hx = v => v ? parseInt(v.replace(/^0x/i, ''), 16) : 0;
const fmt = a => Array.from(a, b => b.toString(16).padStart(2, '0')).join(' ');

function log(m, c) {
  const d = $("#log"), t = new Date().toLocaleTimeString();
  d.innerHTML += `<div class="${c || ''}">[${t}] ${m}</div>`;
  d.scrollTop = d.scrollHeight;
}

document.querySelectorAll(".tab").forEach(t => t.onclick = () => {
  document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
  document.querySelectorAll("section").forEach(x => x.classList.remove("active"));
  t.classList.add("active");
  $("#" + t.dataset.t).classList.add("active");
});

if (!("serial" in navigator)) {
  $("#unsupported").textContent =
    "Web Serial not available in this browser (use Chrome/Edge over https or localhost). Mock mode still works.";
}

// Per-target transport defaults. Z4 GT3 = K-line KWP; M3 = D-CAN (BMW-FAST).
const TARGETS = {
  z4: { label: "Z4 GT3", proto: "kwp",  baud: 9600 },     // K-line only
  m3: { label: "M3",     proto: "fast", baud: 115200 },   // diagnostics on CAN: PCAN-USB, or a D-CAN cable over serial
};

// When the target changes, preset the baud to that target's default.
if ($("#target")) {
  $("#target").onchange = e => {
    const cfg = TARGETS[e.target.value];
    if (cfg) $("#baud").value = String(cfg.baud);
    const m3 = e.target.value === "m3", mode = $("#mode");
    mode.querySelector('option[value="pcan"]').disabled = !m3;
    if (mode.value !== "mock") mode.value = m3 ? "pcan" : "serial";
    document.querySelectorAll(".m3only").forEach(el => { el.style.display = m3 ? "" : "none"; });
    log(`target: ${cfg.label} (${m3 ? "CAN" : "K-line KWP"})`);
  };
}

// Every action button except Connect is disabled until a connection is made,
// so clicking one before connecting simply does nothing.
const actionButtons = Array.from(document.querySelectorAll("button"))
  .filter(b => !/connect\(\)|pcan|bleedStop/.test(b.getAttribute("onclick") || ""));   // the CAN test needs no K-line; Stop is enabled only while bleeding
function setConnected(on) {
  actionButtons.forEach(b => { b.disabled = !on; });
}
setConnected(false);

// The $27 constants are read from the toolbar fields whenever they are needed, so they
// can be typed or corrected after connecting.
function parseHexBytes(s) {
  s = (s || "").trim().replace(/^0x/i, "").replace(/\s+/g, "");
  if (!s) return null;
  if (s.length % 2) s = "0" + s;
  const b = [];
  for (let i = 0; i < s.length; i += 2) b.push(parseInt(s.substr(i, 2), 16));
  return b.some(x => Number.isNaN(x)) ? null : b;
}

function readAuth() {
  const u = ($("#uid") && $("#uid").value || "").trim();
  let uid = null;
  if (u) uid = /^0x/i.test(u) ? parseHexBytes(u) : Array.from(u, c => c.charCodeAt(0));
  if (uid) uid = uid.concat([0, 0, 0, 0]).slice(0, 4);
  return { uid, w564: parseHexBytes($("#w564") && $("#w564").value),
           key16: parseHexBytes($("#l5key") && $("#l5key").value) };
}

function readKeys() {
  const keys = {};
  if ($("#kccp").value.trim()) keys.ccpKey = hx($("#kccp").value.trim());
  if ($("#kcoding").value.trim()) keys.codingKey = hx($("#kcoding").value.trim());
  return keys;
}

async function connect() {
  const keys = readKeys();
  const target = $("#target") ? $("#target").value : "z4";
  const cfg = TARGETS[target] || TARGETS.z4;
  const mode = $("#mode").value;
  if (pcan) { log("close the CAN adapter test first: it has the adapter open", "bad"); return; }
  const t = mode === "serial" ? new WebSerialKwp(parseInt($("#baud").value), cfg.proto)
    : mode === "pcan" ? new PcanKwp()
    : new MockKwp();
  if (mod) {                       // reconnecting: free the previous port or adapter first
    try { await mod.t.close(); } catch (e) { /* already gone */ }
    mod = null;
    setConnected(false);
    $("#conn").textContent = "not connected";
    $("#conn").className = "pill";
  }
  t.onStatus = s => {
    if (s.fatal) {
      log("CAN adapter: " + s.fatal, "bad");
      mod = null;
      setConnected(false);
      $("#conn").textContent = "not connected";
      $("#conn").className = "pill";
    } else if (s.bad) {
      log("CAN adapter bad buffer: " + s.bad, "bad");
    } else if (s.overrun) {
      log("CAN adapter: receive overrun, frames were lost", "bad");
    } else {
      log(`CAN bus ${s.state} (rx errors ${s.counters.rx}, tx errors ${s.counters.tx})`, s.state === "active" ? "ok" : "bad");
    }
  };
  try {
    await t.connect();
  } catch (e) {
    // user dismissed the port picker, or no device: do nothing
    if (e && (e.name === "NotFoundError" || /No port selected/i.test(e.message || ""))) return;
    log("connect: " + e.message, "bad");
    return;
  }
  mod = new Module(t, keys, target, readAuth());
  setConnected(true);
  const how = t.kind === "can" ? "CAN" : cfg.proto === "kwp" ? "K-line" : "D-CAN serial";
  $("#conn").textContent = t.kind === "mock" ? "mock" : `${cfg.label} (${how})`;
  $("#conn").className = "pill on";
  log(`port open for ${cfg.label} (${t.kind === "can" ? "PCAN-USB" : t.kind}); keys: ${Object.keys(keys).join(", ") || "none"}`);
  const zb = await readIdent(0x80, true);   // ZB (part number)
  const sw = await readIdent(0x94, true);   // software ID
  if (zb || sw) {
    log(`${cfg.label} is answering`, "ok");
  } else {                                  // the port opening says nothing about the module
    $("#conn").textContent = `${cfg.label}: no answer`;
    $("#conn").className = "pill";
    log(`the port is open but the ${cfg.label} didn't answer: check wiring, power and the target`, "bad");
  }
}

function setSess(t) { $("#sess").textContent = t; $("#sess").className = "pill on"; }
function setSec(t) { $("#sec").textContent = t; $("#sec").className = "pill on"; }

// Both unlock buttons run the whole sequence themselves (10 87, seed, key, ...), so nothing
// has to be clicked in a particular order first.
async function enableCodingWrite() {
  try {
    mod.keys = readKeys();
    const j = await mod.enableCodingWrite();
    setSess("session 0x87");
    setSec("coding write (0x7F)");
    log(`coding write enabled: 10 87 + level ${j.level} seed ${j.seed || '-'} key ${j.key || '-'}${j.already ? ' (already open)' : ''}`, "ok");
  } catch (e) {
    log("enable coding write: " + e.message, "bad");
  }
}

async function enableCcp() {
  try {
    mod.keys = readKeys();
    mod.auth = readAuth();
    const j = await mod.enableCcp();
    setSess("session 0x87");
    setSec("CCP (0x7E) + 31 31 01");
    const pre = j.auth5 ? "level-5 auth + " : "10 87 + ";
    log(`CCP enabled: ${pre}level ${j.level} seed ${j.seed || '-'} key ${j.key || '-'}${j.already ? ' (already open)' : ''} + 31 31 01`, "ok");
  } catch (e) {
    log("enable CCP: " + e.message, "bad");
  }
}

const LAMP_TXT = { yes: ["ABS lamp ON", "bad"], no: ["no ABS lamp", "ok"], depends: ["depends on fault", "warn"], "?": ["not traced", "mut"] };

async function readDtcs() {
  try {
    const j = await mod.readDtcs();
    let h = `<table><tr><th>DTC</th><th>status</th><th>ABS lamp</th><th>internal fault(s) and meaning</th></tr>`;
    j.dtcs.forEach(d => {
      const [lt, lc] = LAMP_TXT[d.lamp] || LAMP_TXT["?"];
      const st = (d.status & 0x40) ? "present" : "stored";
      const rows = d.faults.length
        ? d.faults.map((f, i) => {
            const inf = d.info[i] || [];
            return `<div><b>0x${f}</b> ${inf[0] || ''}${inf[2] ? ` <span class="mut">- ${inf[2]}</span>` : ''}</div>`;
          }).join('')
        : d.extra ? `<div>${d.extra}</div>`
        : '<span class="mut">no decode table for this target</span>';
      h += `<tr><td>0x${d.dtc}</td><td>0x${d.status.toString(16)} ${st}</td><td class="${lc}">${lt}</td><td>${rows}</td></tr>`;
    });
    h += `</table><div class="note" style="color:var(--mut)">status 0x40 = fault currently present; "depends" = the DTC is shared by several internal faults and only some of them switch ABS off.</div>`;
    if (!j.count) h = `<p class="ok">no stored faults</p>`;
    $("#dtcs").innerHTML = h;
    log(`read ${j.count} DTC(s)`);
  } catch (e) {
    log("read_dtcs: " + e.message, "bad");
  }
}

async function readIdent(id, quiet) {
  try {
    const j = await mod.readIdent(id);
    if (!j.bytes.length) { log(`$1A 0x${id.toString(16).toUpperCase()}: no answer`); return false; }
    const hid = "0x" + id.toString(16).toUpperCase();
    let h = `<table><tr><th>$1A id</th><th>source</th><th>decoded</th><th>bytes</th></tr>`;
    if (j.zb !== undefined) {
      h += `<tr><td>${hid}</td><td>${j.source}</td><td class="ok">ZB ${j.zb}</td><td>${fmt(j.bytes)}</td></tr></table>`;
      $("#zb").textContent = "ZB " + j.zb;
      $("#zb").className = "pill on";
      log(`part number ZB ${j.zb}`, "ok");
    } else if (j.swId !== undefined) {
      h += `<tr><td>${hid}</td><td>${j.source}</td><td class="ok">${j.swId}</td><td>${fmt(j.bytes)}</td></tr></table>` +
           `<div class="note" style="color:var(--mut)">tail (version/date block; the module's $27 key constants are carried here): ${fmt(j.tail)}</div>`;
      $("#swid").textContent = "SW " + j.swId;
      $("#swid").className = "pill on";
      log(`software id ${j.swId}`, "ok");
      if (j.keys) {
        const hx4 = v => "0x" + v.toString(16).toUpperCase().padStart(4, "0");
        let filled = [];
        if (!$("#kccp").value.trim()) { $("#kccp").value = hx4(j.keys.ccpKey); filled.push("CCP key"); }
        if (!$("#kcoding").value.trim()) { $("#kcoding").value = hx4(j.keys.codingKey); filled.push("coding key"); }
        h += `<div class="note" style="color:var(--mut)">$27 key constants from this block: CCP key (0x7E) ${hx4(j.keys.ccpKey)}, coding key (0x7F) ${hx4(j.keys.codingKey)}${filled.length ? " (filled " + filled.join(" + ") + ")" : ""}</div>`;
        if (filled.length) log(`key constants from ident: CCP key ${hx4(j.keys.ccpKey)} coding key ${hx4(j.keys.codingKey)}`, "ok");
      }
    } else {
      h += `<tr><td>${hid}</td><td>${j.source}</td><td>${j.ascii}</td><td>${fmt(j.bytes)}</td></tr></table>`;
      log(`$1A ${hid}: ${j.bytes.length} bytes`);
    }
    $("#ident-out").innerHTML = h;
    return true;
  } catch (e) {
    log("read_ident: " + e.message, quiet ? "" : "bad");
    return e.nrc !== undefined;   // a negative response is still the module answering
  }
}

async function clearDtcs() {
  if (!confirm("Clear all stored fault memory?")) return;
  try {
    await mod.clearDtcs();
    log("faults cleared", "ok");
    readDtcs();
  } catch (e) {
    log("clear: " + e.message, "bad");
  }
}

async function readCoding() {
  try {
    const j = await mod.readCoding();
    $("#coding-out").innerHTML =
      `<table><tr><th>checksum</th><th>row</th><th>field1</th><th>cksum</th></tr>` +
      `<tr><td>0x${j.ck.toString(16)}</td><td>${j.row}</td><td>${j.f1}</td>` +
      `<td class="${j.ok ? 'ok' : 'bad'}">${j.ok ? 'valid' : 'BAD'}</td></tr></table>`;
    $("#row").value = j.row;
    $("#field1").value = j.f1;
    log(`coding row ${j.row} field1 ${j.f1}`);
  } catch (e) {
    log("read_coding: " + e.message, "bad");
  }
}

async function writeCoding() {
  const row = +$("#row").value, f1 = +$("#field1").value;
  if (!confirm(`Write coding row=${row} field1=${f1}? Session and unlock are done automatically. Effective next power-on.`)) return;
  try {
    const done = await mod.writeCoding(row, f1);
    log("coding written: " + done.join(' '), "ok");
  } catch (e) {
    log("write_coding: " + e.message, "bad");
  }
}

async function routine(rid, name) {
  try {
    await mod.routine(rid);
    log(`routine 0x${rid.toString(16)} (${name}) started`, "ok");
    rstatus(rid);
  } catch (e) {
    log("routine: " + e.message, "bad");
  }
}

async function rstatus(rid) {
  try {
    const j = await mod.rstatus(rid);
    const el = $("#" + ($("#valve").classList.contains("active") ? "valve" : "sensor") + "-out");
    const state = j.done ? 'done' : j.running ? 'running' : 'idle';
    el.innerHTML = `routine 0x${rid.toString(16)}: <span class="${j.done ? 'ok' : 'warn'}">0x${j.st.toString(16)} ${state}</span>`;
    log(`routine 0x${rid.toString(16)} status 0x${j.st.toString(16)}`);
  } catch (e) {
    log("status: " + e.message, "bad");
  }
}

async function live(lid) {
  try {
    const b = await mod.live(lid);
    $("#live-out").innerHTML =
      `<table><tr><th>$21 id</th><th>bytes</th></tr><tr><td>0x${lid.toString(16)}</td><td>${fmt(b)}</td></tr></table>`;
    log(`$21 0x${lid.toString(16)}: ${b.length} bytes`);
  } catch (e) {
    log("live: " + e.message, "bad");
  }
}

async function readMem() {
  try {
    const b = await mod.readMem(hx($("#maddr").value), +$("#mlen").value, +$("#mtype").value);
    $("#mem-out").innerHTML =
      `<table><tr><th>len</th><th>bytes</th></tr><tr><td>${b.length}</td><td>${fmt(b)}</td></tr></table>`;
    log(`$23 read ${b.length} bytes`);
  } catch (e) {
    log("read_mem: " + e.message, "bad");
  }
}

// ---- Brake bleeding: runs the sequence frame by frame ----
let bleedRun = null;   // { stop: bool } while a sequence is running

function bleedButtons(running) {
  document.querySelectorAll("#bleed button").forEach(b => {
    const isStop = /bleedStop/.test(b.getAttribute("onclick") || "");
    b.disabled = isStop ? !running : (running || !mod);
  });
}

async function bleed(side) {
  if (bleedRun) return;
  const label = BLEED_SIDES[side].label, target = ($("#target") || {}).value || "z4";
  const warn = target === "m3" ? "\n\nThis sequence has not been verified on the M3 module." : "";
  if (!confirm(`Bleed the ${label} circuits? Runs the pump and pulses the valves for about ${Math.round(104 * (0.35 + (+$("#bleed-pause").value || 0) / 1000))} s. ` +
               `Bleeder screws on that side open, reservoir topped up, pedal pressure as per the procedure.${warn}`)) return;
  bleedRun = { stop: false };
  bleedButtons(true);
  const out = $("#bleed-out");
  log(`bleeding ${label} on the ${TARGETS[target].label}: 104 frames, pause ${+$("#bleed-pause").value || 0} ms`);
  try {
    const r = await mod.bleed(side, {
      pause: +$("#bleed-pause").value || 0,
      stop: () => bleedRun.stop,
      onStep: (i, n, v, aux) => {
        out.innerHTML = `<div>frame ${i + 1} / ${n}: <b>${bleedDesc(v, aux)}</b> <span class="mut">(30 10 07 ${fmt(bleedFrame(v, aux).slice(3))})</span></div>` +
                        `<div class="mut" style="height:6px;background:var(--mut);opacity:.3;border-radius:3px;margin-top:6px"><div style="height:6px;width:${Math.round(100 * (i + 1) / n)}%;background:var(--ok);border-radius:3px;opacity:1"></div></div>`;
      },
    });
    if (r.stopped) {
      out.innerHTML = `<span class="warn">stopped after ${r.frames} of ${r.total} frames; all valves and pump off</span>`;
      log(`bleeding ${label} stopped after ${r.frames} frames`, "warn");
    } else {
      out.innerHTML = `<span class="ok">${label} sequence complete (${r.total} frames)</span>`;
      log(`bleeding ${label} complete`, "ok");
    }
  } catch (e) {
    out.innerHTML = `<span class="bad">${e.message}</span>`;
    log("bleed: " + e.message, "bad");
    try { await mod.actuateOff(); } catch (e2) { /* the module times the override out itself */ }
  } finally {
    bleedRun = null;
    bleedButtons(false);
  }
}

function bleedStop() {
  if (bleedRun) { bleedRun.stop = true; log("bleeding: stop requested, sending all-off", "warn"); }
}

async function actuate(wheel) {
  if (!confirm(`Open the ${wheel} inlet + outlet valves and run the pump (one-shot)?`)) return;
  try {
    const r = await mod.actuate(wheel);
    $("#bleed-out").innerHTML = `<span class="ok">${wheel} actuated (valves 0x${r.valves.toString(16)}, pump)</span>`;
    log(`actuate ${wheel}: 30 10 07 00 00 FF ${r.valves.toString(16).padStart(2, '0')} 10`, "ok");
  } catch (e) {
    log("actuate: " + e.message, "bad");
  }
}

async function actuateOff() {
  try {
    await mod.actuateOff();
    $("#bleed-out").innerHTML = `<span class="ok">all valves and pump off</span>`;
    log("actuators off (30 10 07 00 00 01 00 00)", "ok");
  } catch (e) {
    log("actuate off: " + e.message, "bad");
  }
}

async function readCodingId() {
  try {
    const b = await mod.readCodingId();
    const j = b.length >= 3 ? ` <span class="mut">(checksum 0x${b[0].toString(16)}, row ${b[1]}, field1 ${b[2]} if laid out like EEPROM 0x0FA)</span>` : "";
    $("#coding-id-out").innerHTML = `<table><tr><th>$22 3000</th><th>bytes</th></tr><tr><td>${b.length} bytes</td><td>${fmt(b)}${j}</td></tr></table>`;
    log(`$22 30 00: ${fmt(b)}`);
  } catch (e) {
    log("read_coding ($22): " + e.message, "bad");
  }
}

// ---- CAN adapter test: receive-only, it never calls can.send() ----
let pcan = null, pcanTimer = null, pcanSeen = new Map();

function pcanButtons(open) {
  $("#pcan-go").disabled = open;
  $("#pcan-stop").disabled = !open;
}

function pcanRender(note) {
  const hid = id => "0x" + id.toString(16).toUpperCase().padStart(3, "0");
  const rows = Array.from(pcanSeen.entries()).sort((a, b) => a[0] - b[0]).map(([id, s]) =>
    `<tr><td>${hid(id)}</td><td>${s.count}</td><td>${s.rtr ? "RTR" : fmt(s.data)}</td></tr>`).join("");
  const stateClass = !pcan ? "mut" : pcan.state === "active" ? "ok" : "bad";
  const st = pcan ? pcan.stats : { frames: 0, overruns: 0, badBuffers: 0 };
  $("#pcan-out").innerHTML =
    `<div class="row"><span class="${stateClass}">bus ${pcan ? pcan.state : "closed"}</span>` +
    `<span>${st.frames} frames</span><span>${st.overruns} overruns</span><span>${st.badBuffers} bad buffers</span></div>` +
    (note ? `<div class="bad">${note}</div>` : "") +
    (rows ? `<table><tr><th>CAN id</th><th>count</th><th>last data</th></tr>${rows}</table>` : "");
}

async function pcanStart() {
  if (mod && mod.t.kind === "can") { log("the M3 connection has the adapter open", "bad"); return; }
  let can;
  try {
    can = await PcanUsb.request();
  } catch (e) {
    if (e.name !== "NotFoundError") log("PCAN-USB: " + e.message, "bad");   // NotFoundError = picker dismissed
    return;
  }
  pcanSeen = new Map();
  const listenOnly = $("#pcan-silent").checked;
  const bitrate = parseInt($("#pcan-rate").value);
  try {
    await can.start({
      bitrate, listenOnly,
      onFrame: f => {
        const key = f.ext ? f.id + 0x100000000 : f.id;
        const s = pcanSeen.get(key) || { count: 0 };
        pcanSeen.set(key, { count: s.count + 1, data: f.data, rtr: f.rtr });
      },
      onStatus: s => {
        if (s.fatal) {
          log("PCAN-USB: " + s.fatal, "bad");
          pcanStop(s.fatal);
        } else if (s.bad) {
          log("PCAN-USB bad buffer: " + s.bad, "bad");
        } else if (s.overrun) {
          log("PCAN-USB: receive overrun, frames were lost", "bad");
        } else {
          log(`PCAN-USB bus ${s.state} (rx errors ${s.counters.rx}, tx errors ${s.counters.tx})`, s.state === "active" ? "ok" : "bad");
        }
      },
    });
  } catch (e) {
    log("PCAN-USB: " + e.message, "bad");
    return;
  }
  pcan = can;
  pcanButtons(true);
  log(`PCAN-USB open at ${bitrate / 1000} kbit/s${listenOnly ? ", listen-only" : ""}`, "ok");
  pcanTimer = setInterval(() => pcanRender(), 250);
  pcanRender();
}

async function pcanStop(note) {
  clearInterval(pcanTimer);
  const can = pcan;
  pcanButtons(false);
  if (can) {
    try { await can.close(); } catch (e) { log("PCAN-USB close: " + e.message, "bad"); }
    pcanRender(note);
    pcan = null;
    log("PCAN-USB closed");
  }
}
