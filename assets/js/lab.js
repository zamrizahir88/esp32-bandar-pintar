/* Makmal Maya: 4 stesen setiap misi (① Pasang Litar → ② Susun Blok → ③ Salin & Upload → ④ Uji).
   Blok gaya TUNIOT (seret dan lepas), penjana kod (sama seperti TUNIOT), simulator, meja makmal maya
   dan Arduino IDE maya. window.EBPLab dikongsi dengan halaman Hardware (hw.js). */
(function () {
  "use strict";
  const E = window.EBP;
  const { $, $$, esc, board, pinXY, beep, chime, confetti, S, save, MISSIONS } = E;

  /* ================= Blok ================= */
  const PINS = [["25", "D25 🔴"], ["26", "D26 🟡"], ["27", "D27 🟢"], ["32", "D32"], ["33", "D33"]];
  // Blok baharu bermula KOSONG: pelajar memilih HIGH/LOW, pin dan menaip masa sendiri
  const mk = { led: (v = "") => ({ t: "led", v }), dw: (pin = "", v = "") => ({ t: "dw", pin, v }), delay: (ms = null) => ({ t: "delay", ms }) };
  const hasMs = (b) => typeof b.ms === "number" && isFinite(b.ms);
  const missing = (b) => b.t === "delay" ? (hasMs(b) ? "" : "taip masa (ms)") : b.t === "led" ? (b.v ? "" : "pilih HIGH atau LOW") : !b.pin && !b.v ? "pilih pin dan HIGH/LOW" : !b.pin ? "pilih pin" : !b.v ? "pilih HIGH atau LOW" : "";
  const LABEL = { led: "Integrated LED Stat", dw: "DigitalWrite PIN#", delay: "Delay Ms" };
  const HL = [["HIGH", "HIGH"], ["LOW", "LOW"]];
  const sel = (f, val, opts, lab, ro) => ro ? `<span class="bk-f${val ? "" : " q"}">${val ? esc((opts.find((o) => o[0] === val) || [0, val])[1]) : "pilih"} ▾</span>` :
    `<select class="bk-f${val ? "" : " q"}" data-f="${f}" aria-label="${esc(lab)}"><option value=""${val ? "" : " selected"} disabled>pilih…</option>${opts.map(([v, t]) => `<option value="${v}"${v === val ? " selected" : ""}>${esc(t)}</option>`).join("")}</select>`;
  function blockHtml(b, n, ro) {
    if (b.t === "led") return `<span class="bk-h">${LABEL.led} ${sel("v", b.v, HL, `Blok ${n}: keadaan LED`, ro)}</span>`;
    if (b.t === "dw") return `<span class="bk-h">${LABEL.dw} ${sel("pin", b.pin, PINS, `Blok ${n}: pin`, ro)} STAT ${sel("v", b.v, HL, `Blok ${n}: keadaan`, ro)}</span>`;
    return `<span class="bk-h">${LABEL.delay} <span class="bk-num">${ro ? `<span class="${hasMs(b) ? "" : "q"}">${hasMs(b) ? b.ms : "?"}</span>` : `<input type="number" data-f="ms" value="${hasMs(b) ? b.ms : ""}" placeholder="ms" min="0" max="20000" step="100" inputmode="numeric" class="${hasMs(b) ? "" : "q"}" aria-label="Blok ${n}: masa dalam milisaat">`}</span> <small class="bk-u">ms</small></span>`;
  }
  const cls = (b) => (b.t === "delay" ? "bk delay" : "bk io");
  // phases (pilihan): [[tajuk, kelas r|g|y, bilangan blok], ...] untuk Misi 3
  function staticBlocks(prog, phases) {
    let body = "";
    if (phases) { let i = 0; phases.forEach(([t, c, n]) => { body += `<div class="phase ${c}"><div class="ph-h">${t}</div><div class="bk-zone">${prog.slice(i, i + n).map((b, j) => `<div class="${cls(b)}" data-k="${i + j}">${blockHtml(b, i + j + 1, true)}</div>`).join("")}</div></div>`; i += n; }); }
    else body = prog.map((b, i) => `<div class="${cls(b)}" data-k="${i}">${blockHtml(b, i + 1, true)}</div>`).join("");
    return `<div class="bk-ws ro" role="img" aria-label="Susunan blok"><div class="bk-c${phases ? " wide" : ""}"><div class="bk-ch">Setup</div><div class="bk-in empty"></div><div class="bk-ch">Main loop <small>↻ berulang</small></div>
      <div class="bk-in">${body}</div><div class="bk-cf"></div></div></div>`;
  }

  /* ================= Kod (format sama seperti TUNIOT for ESP32) ================= */
  const HEAD = `/////////////////////////////////
// Generated with a lot of love//
// with TUNIOT FOR ESP32     //
// Website: Easycoding.tn      //
/////////////////////////////////
`;
  function code(prog) {
    const pins = [];
    prog.forEach((b) => { const p = b.t === "led" ? "2" : b.t === "dw" ? b.pin : null; if (p && !pins.includes(p)) pins.push(p); });
    const body = prog.map((b) => b.t === "delay" ? `    delay(${b.ms});` : `    digitalWrite(${b.t === "led" ? 2 : b.pin},${b.v});`).join("\n");
    return `${HEAD}

void setup()
{
${pins.map((p) => `pinMode(${p}, OUTPUT);\n`).join("")}
}


void loop()
{
${body ? "\n" + body + "\n" : ""}
}`;
  }
  const SAMPLE = {
    1: [mk.led("HIGH")],
    2: [mk.led("HIGH"), mk.delay(1000), mk.led("LOW"), mk.delay(1000)],
    3: [mk.dw("26", "LOW"), mk.dw("27", "LOW"), mk.dw("25", "HIGH"), mk.delay(3000), mk.dw("25", "LOW"), mk.dw("27", "HIGH"), mk.delay(3000), mk.dw("27", "LOW"), mk.dw("26", "HIGH"), mk.delay(1000)]
  };
  const RED = () => [mk.dw("26", "LOW"), mk.dw("27", "LOW"), mk.dw("25", "HIGH"), mk.delay(3000)];

  /* ================= Simulasi ================= */
  function segments(prog) {
    let st = { 2: 0, 25: 0, 26: 0, 27: 0, 32: 0, 33: 0 }, segs = [];
    for (let round = 0; round < 2; round++) {
      segs = []; let from = 0;
      prog.forEach((b, k) => {
        if (missing(b)) return;
        if (b.t === "delay") { if (b.ms > 0) { segs.push({ ms: b.ms, st: Object.assign({}, st), from, to: k }); from = k + 1; } }
        else st[b.t === "led" ? 2 : +b.pin] = b.v === "HIGH" ? 1 : 0;
      });
    }
    const total = segs.reduce((a, s) => a + s.ms, 0);
    if (!total) {
      const f = new Set(), st2 = Object.assign({}, st);
      prog.forEach((b) => { if (b.t !== "delay" && !missing(b)) { const p = b.t === "led" ? 2 : +b.pin, v = b.v === "HIGH" ? 1 : 0; if (st2[p] !== v) f.add(p); st2[p] = v; } });
      return { segs: [{ ms: 1000, st: Object.assign({}, st) }], total: 0, fast: f };
    }
    return { segs, total, fast: new Set() };
  }
  function merged(sim, pins) {
    const key = (s) => pins.map((p) => s.st[p]).join("");
    const out = [];
    sim.segs.forEach((s) => { const k = key(s); if (out.length && out[out.length - 1].k === k) out[out.length - 1].ms += s.ms; else out.push({ k, ms: s.ms, st: s.st }); });
    if (out.length > 1 && out[0].k === out[out.length - 1].k) out[0].ms += out.pop().ms;
    return out;
  }
  const segAt = (sim, t) => {
    if (!sim.total) return -1;
    let x = t % sim.total;
    for (let i = 0; i < sim.segs.length; i++) { if (x < sim.segs[i].ms) return i; x -= sim.segs[i].ms; }
    return sim.segs.length - 1;
  };
  const stAt = (sim, t) => {
    if (!sim.total) return sim.segs[0].st;
    let x = t % sim.total;
    for (const s of sim.segs) { if (x < s.ms) return s.st; x -= s.ms; }
    return sim.segs[sim.segs.length - 1].st;
  };
  const secs = (ms) => (ms / 1000).toLocaleString("ms-MY", { maximumFractionDigits: 2 }) + " s";
  const colName = (k3) => { const on = []; if (k3[0] === "1") on.push("merah"); if (k3[1] === "1") on.push("kuning"); if (k3[2] === "1") on.push("hijau"); return on.length ? on.join(" + ") : "semua padam"; };

  /* ================= Meja makmal / litar (susunan A atau B) =================
     Koordinat: ESP32 di (BX, BY) skala BK; breadboard LED di atas. Dulang komponen di x < 0. */
  const BX = 250, BY = 280, BK = 1.1;
  const UNITS = [{ pin: "27", c: "hijau", col: "#22c55e", W: 230 }, { pin: "26", c: "kuning", col: "#f5c400", W: 430 }, { pin: "25", c: "merah", col: "#ef3b2f", W: 630 }];
  const WCOL = { 27: "#1f9d4c", 26: "#e0a800", 25: "#d93a2b", GND: "#222" };
  const TGT = { u27: [230, 150], u26: [430, 150], u25: [630, 150], rail: [165, 32] };
  const WANT = { 27: "u27", 26: "u26", 25: "u25", GND: "rail" };
  const CHAN = { 25: 196, 26: 216, 27: 236, GND: 252 };
  const pinPos = (p) => pinXY(BX, BY, BK, "top", p === "GND" ? "GND" : "D" + p);
  const USBP = [BX - 14 * BK, BY + 60 * BK];
  // Keadaan litar lengkap (untuk Hardware dan ④ Uji)
  const FULL = () => ({ esp: true, usb: true, res: [1, 1, 1], led: { 27: "ok", 26: "ok", 25: "ok" }, wires: { 27: "u27", 26: "u26", 25: "u25", GND: "rail" } });
  // o: { layout, m (1-3), bench, lit: {2,25,26,27}, edit, armed, selPin, tray, showRev, focus: "res"|"led"|"w"|"gnd"|"usb", flow: true }
  function benchSvg(o) {
    const lay = o.layout || "A", b = o.bench || FULL(), lit = o.lit || {}, m = o.m || 3, edit = !!o.edit;
    const yStart = lay === "B" ? 272 : pinPos("25")[1];
    const show3 = m === 3;
    const wOk = (p) => b.wires[p] === WANT[p];
    let s = `<defs>${UNITS.map((u) => [u.pin, u.col]).concat([["2", "#4ea3ff"]]).map(([p, c]) => `<radialGradient id="glw${p}"><stop offset="0" stop-color="${c}" stop-opacity=".95"/><stop offset=".4" stop-color="${c}" stop-opacity=".5"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`).join("")}</defs>`;
    if (show3) {
      s += `<rect x="140" y="14" width="620" height="166" rx="10" class="bb"/><path d="M155,32 H745" class="rail-n"/>`;
      s += `<text x="134" y="38" class="neg-t" text-anchor="end">− GND</text><text x="134" y="52" class="neg-s" text-anchor="end">0 V</text>`;
      for (let x = 165; x <= 745; x += 20) s += `<circle cx="${x}" cy="32" r="2.6" class="hole"/>`;
      ["a", "b", "c", "d", "e"].forEach((r, i) => { s += `<text x="152" y="${74 + i * 20}" class="bb-t" text-anchor="middle">${r}</text>`; for (let x = 170; x <= 740; x += 20) s += `<circle cx="${x}" cy="${70 + i * 20}" r="2.6" class="hole"/>`; });
      s += `<text x="770" y="40" class="bb-lab">${lay === "B" ? "Breadboard 2" : "Breadboard"}</text>`;
      UNITS.forEach((u, i) => {
        const L = u.W + 80;
        if (b.res[i]) {
          s += `<g class="fx f-res"><path d="M${u.W},110 H${u.W + 22} M${L - 22},110 H${L}" class="lead"/><rect x="${u.W + 22}" y="102" width="36" height="16" rx="7" class="res-b"/>`;
          s += ["#d22", "#d22", "#7a4a1e"].map((c, j) => `<rect x="${u.W + 28 + j * 7}" y="102" width="4" height="16" fill="${c}"/>`).join("") + `<rect x="${u.W + 50}" y="102" width="4" height="16" fill="#c9a227"/></g>`;
        } else if (edit) s += `<rect x="${u.W - 4}" y="98" width="88" height="24" rx="8" class="slot${o.armed === "res" ? "" : " dim"}" data-zone="res${i}"/>`;
        const ls = b.led[u.pin];
        if (ls) {
          const ok = ls === "ok", ask = ls === "ask", on = ok && !!lit[u.pin];
          let g = "";
          if (ask) g += `<path d="M${L},70 V58" class="lead dash"/><path d="M${L + 18},46 L${L + 20},32" class="lead dash"/>`;
          else if (ok) g += `<path d="M${L},70 V58" class="lead lg"/><path d="M${L + 18},46 L${L + 20},32" class="lead"/>`;
          else g += `<path d="M${L},70 V60" class="lead"/><path d="M${L + 18},46 L${L + 20},22" class="lead lg"/>`;
          if (on) g += `<circle cx="${L + 9}" cy="47" r="40" fill="url(#glw${u.pin})" class="halo"/>`;
          g += `<path d="M${L - 3},60 V46 a12,12 0 0 1 24,0 V60Z" fill="${u.col}" stroke="${on ? "#fff" : "#555"}" stroke-width="1.5"/>`;
          if (!on) g += `<path d="M${L - 3},60 V46 a12,12 0 0 1 24,0 V60Z" fill="#14181d" opacity=".66"/>`;
          else g += `<ellipse cx="${L + 4}" cy="44" rx="4" ry="7" fill="#fff" opacity=".75"/>`;
          if (ask) g += `<circle cx="${L + 9}" cy="18" r="11" class="askb"/><text x="${L + 9}" y="23" text-anchor="middle" class="askt">?</text>`;
          else if (ok) g += `<text x="${L - 14}" y="70" class="pm">+</text><text x="${L + 26}" y="30" class="mm">−</text>`;
          else g += `<text x="${L + 26}" y="22" class="pm">+</text><text x="${L - 14}" y="70" class="mm">−</text>${o.showRev ? `<text x="${L + 9}" y="10" class="warnm" text-anchor="middle">⚠</text>` : ""}`;
          s += `<g class="fx f-led${on ? " lit" : ""}"${edit ? ` data-led="${u.pin}"` : ""}>${g}${edit ? `<rect x="${L - 14}" y="10" width="46" height="62" fill="transparent" class="ledhit"/>` : ""}</g>`;
        } else if (edit) s += `<circle cx="${L + 9}" cy="46" r="26" class="slot${o.armed === "led" + u.pin ? "" : " dim"}" data-zone="led${u.pin}"/><text x="${L + 9}" y="51" text-anchor="middle" class="slot-t">${u.c[0].toUpperCase()}</text>`;
        s += `<text x="${L + 9}" y="196" class="bb-lab" text-anchor="middle">LED ${u.c}</text>`;
      });
    }
    // ESP32 (+ breadboard 1 dalam susunan B)
    if (lay === "B") {
      s += `<rect x="215" y="258" width="480" height="168" rx="10" class="bb"/>`;
      for (let x = 225; x <= 685; x += 18.5 * BK) s += `<circle cx="${x.toFixed(1)}" cy="272" r="2.6" class="hole"/>`;
      s += `<text x="700" y="290" class="bb-lab">Breadboard 1</text>`;
    }
    if (b.esp) s += `<g class="fx f-esp">${board(BX, BY, { k: BK, pwr: !!b.usb, led: !!lit[2], hi: show3 ? ["t:D25", "t:D26", "t:D27", "t:GND"] : [] })}</g>`;
    else if (edit) s += `<rect x="${BX - 20}" y="${BY - 6}" width="${396 + 30}" height="${132 + 12}" rx="12" class="slot ${o.armed === "esp" ? "" : "dim"}" data-zone="esp"/><text x="${BX + 198}" y="${BY + 72}" text-anchor="middle" class="slot-t big">Letak ESP32 di sini</text>`;
    // Wayar
    if (show3) {
      ["27", "26", "25", "GND"].forEach((p) => {
        const t = b.wires[p];
        const [x] = pinPos(p);
        if (t) {
          const [tx, ty] = TGT[t];
          s += `<g class="fx f-w${p === "GND" ? " f-gnd" : ""}"${edit ? ` data-wire="${p}"` : ""}><path d="M${x},${yStart} V${CHAN[p]} H${tx} V${ty}" class="cw" stroke="${WCOL[p]}"/><circle cx="${tx}" cy="${ty}" r="5" fill="${WCOL[p]}"/>` +
            (lay === "A" ? `<rect x="${x - 5}" y="${yStart - 22}" width="10" height="18" rx="2" class="fconn"/>` : `<circle cx="${x}" cy="${yStart}" r="4.5" fill="${WCOL[p]}"/>`) + `</g>`;
        }
        if (edit && b.esp) s += `<circle cx="${x}" cy="${yStart}" r="10" class="pinhit${o.selPin === p ? " on" : ""}${o.armed === "wire" ? " drop" : ""}" data-pin="${p}"/>`;
        // Tanda voltan pada hujung wayar di breadboard (bila tidak mengedit)
        if (!edit && b.esp && t && p !== "GND" && TGT[t]) {
          const hi = !!lit[p], [tx] = TGT[t];
          s += `<g class="vtag ${hi ? "pos" : "off"}"><rect x="${tx - 26}" y="158" width="52" height="17" rx="8.5"/><text x="${tx}" y="170.5" text-anchor="middle">${hi ? "+ 3.3 V" : "0 V"}</text></g>`;
        }
      });
      // Aliran arus: + (pin HIGH) → wayar → perintang → LED → rel (−) → GND
      if (o.flow !== false && wOk("GND")) {
        const [xg] = pinPos("GND");
        UNITS.forEach((u, i) => {
          if (!(lit[u.pin] && b.res[i] && b.led[u.pin] === "ok" && wOk(u.pin))) return;
          const [x] = pinPos(u.pin), L = u.W + 80;
          s += `<path d="M${x},${yStart} V${CHAN[u.pin]} H${u.W} V110 H${L} V60 M${L + 18},46 L${L + 20},32 H165 V${CHAN.GND} H${xg} V${yStart}" class="iflow"/>`;
        });
      }
      if (edit && o.selPin) Object.entries(TGT).forEach(([k, [x, y]]) => { s += `<circle cx="${x}" cy="${y}" r="13" class="tgthit" data-tgt="${k}"/>`; });
    }
    // Kabel USB
    if (b.usb) s += `<g class="fx f-usb"${edit ? ' data-plug="1"' : ""}><path d="M${USBP[0] - 30},${USBP[1]} C${USBP[0] - 120},${USBP[1]} ${-60},${420} ${-150},${420}" class="usbc"/><rect x="${USBP[0] - 34}" y="${USBP[1] - 9}" width="34" height="18" rx="3" class="usbp"/>${edit ? `<rect x="${USBP[0] - 90}" y="${USBP[1] - 26}" width="92" height="52" fill="transparent" class="plughit"/>` : ""}</g>`;
    else if (edit && b.esp) s += `<rect x="${USBP[0] - 44}" y="${USBP[1] - 16}" width="44" height="32" rx="6" class="slot ${o.armed === "usb" ? "" : "dim"}" data-zone="usb"/>`;
    // Dulang komponen
    if (o.tray) {
      const ty = show3 ? 8 : 214;
      s += `<rect x="-150" y="${ty}" width="130" height="${432 - ty}" rx="12" class="tray"/><text x="-85" y="${ty + 22}" text-anchor="middle" class="tray-t">DULANG</text>`;
      trayItems(m, b).forEach((it) => { s += `<g class="titem${o.armed === it.id ? " armed" : ""}" data-item="${it.id}" transform="translate(${it.x} ${it.y})">${it.svg}<text y="${it.ly}" text-anchor="middle" class="tray-l">${it.lab}</text></g>`; });
    }
    const vb = o.tray ? (show3 ? "-160 0 1060 440" : "-160 204 970 236") : "76 0 790 430";
    return `<svg viewBox="${o.view === "bb" ? "76 0 790 205" : show3 || o.tray ? vb : "180 230 560 210"}" class="circ bench${edit ? " edit" : ""}${o.focus ? " fz fz-" + o.focus : ""}" role="img" aria-label="Meja makmal: ESP32${show3 ? ", breadboard, 3 LED dan perintang" : ""}">${s}</svg>`;
  }
  const RES_SVG = `<path d="M-34,0 H-16 M16,0 H34" class="lead"/><rect x="-16" y="-8" width="32" height="16" rx="7" class="res-b"/><rect x="-10" y="-8" width="4" height="16" fill="#d22"/><rect x="-3" y="-8" width="4" height="16" fill="#d22"/><rect x="4" y="-8" width="4" height="16" fill="#7a4a1e"/>`;
  const ledSvg = (c) => `<path d="M-4,10 V30 M6,10 V22" class="lead"/><path d="M-11,10 V-2 a11,11 0 0 1 22,0 V10Z" fill="${c}" stroke="#777" stroke-width="1.5"/><text x="-12" y="30" class="pm s">+</text>`;
  const WIRE_SVG = `<path d="M-34,8 C-12,-22 12,26 34,-6" class="cw" stroke="#d93a2b"/><path d="M-34,16 C-10,-10 14,34 34,4" class="cw" stroke="#1f9d4c"/><rect x="-38" y="4" width="8" height="14" rx="1" class="fconn"/><rect x="30" y="-12" width="8" height="14" rx="1" fill="#9aa7b3"/>`;
  function trayItems(m, b) {
    const it = [];
    if (!b.esp) it.push({ id: "esp", x: -85, y: m === 3 ? 90 : 290, svg: `<rect x="-44" y="-22" width="88" height="44" rx="5" fill="#1c2a36"/><rect x="2" y="-12" width="30" height="24" rx="2" fill="#b8c2cb"/><rect x="-52" y="-7" width="10" height="14" fill="#aeb8c1"/>`, lab: "ESP32", ly: 40 });
    if (!b.usb) it.push({ id: "usb", x: -85, y: 395, svg: `<rect x="-17" y="-9" width="34" height="18" rx="3" class="usbp"/><path d="M-17,0 H-40" class="usbc"/>`, lab: "Kabel USB", ly: 28 });
    if (m === 3) {
      const nres = 3 - b.res.reduce((a, x) => a + x, 0);
      for (let i = 0; i < nres; i++) it.push({ id: "res", x: -85, y: 62 + i * 30, svg: RES_SVG, lab: i === nres - 1 ? "Perintang 220 Ω" : "", ly: 24 });
      UNITS.forEach((u, i) => { if (!b.led[u.pin]) it.push({ id: "led" + u.pin, x: -120 + i * 35, y: 200, svg: ledSvg(u.col), lab: "", ly: 0 }); });
      if (UNITS.some((u) => !b.led[u.pin])) it.push({ id: "_l", x: -85, y: 250, svg: "", lab: "LED (kaki panjang +)", ly: 0 });
      const nw = 4 - ["27", "26", "25", "GND"].filter((p) => b.wires[p]).length;
      if (nw > 0) it.push({ id: "wire", x: -85, y: 300, svg: WIRE_SVG, lab: `Wayar jumper ×${nw}`, ly: 38 });
    }
    return it;
  }

  /* ================= Babak simulator ================= */
  function towerScene(on, fast) {
    return `<svg viewBox="0 0 520 300" class="sim-svg" aria-hidden="true">
      <rect width="520" height="300" class="sim-sky${on ? " lit" : ""}"/>
      ${Array.from({ length: 18 }, (_, i) => `<circle cx="${(i * 71) % 520}" cy="${(i * 37) % 120 + 10}" r="1.4" fill="#fff" opacity=".7"/>`).join("")}
      <path d="M0,250 Q130,220 260,245 T520,240 V300 H0Z" fill="#1e3a2c"/>
      <rect x="30" y="200" width="70" height="60" fill="#22324a"/><rect x="400" y="190" width="90" height="70" fill="#22324a"/>
      <path d="M232,262 L252,70 L268,70 L288,262Z" fill="#7d8a98"/><path d="M240,200 H280 M244,150 H276 M248,110 H272" stroke="#c9d4dd" stroke-width="3"/>
      <rect x="252" y="52" width="16" height="20" fill="#7d8a98"/>
      <defs><radialGradient id="twg"><stop offset="0" stop-color="#cfe8ff" stop-opacity="1"/><stop offset=".25" stop-color="#4ea3ff" stop-opacity=".75"/><stop offset="1" stop-color="#4ea3ff" stop-opacity="0"/></radialGradient></defs>
      ${on ? `<path d="M260,44 L80,0 L80,60Z M260,44 L440,0 L440,60Z" fill="#4ea3ff" opacity="${fast ? 0.06 : 0.14}"/><circle cx="260" cy="44" r="${fast ? 40 : 78}" fill="url(#twg)" opacity="${fast ? 0.45 : 1}"/>` : ""}
      <circle cx="260" cy="44" r="11" fill="${on ? (fast ? "#5a8fc8" : "#e8f4ff") : "#0b1220"}" stroke="${on ? "#9fd0ff" : "#05080f"}" stroke-width="2"/>
      ${on && !fast ? `<path d="M110,90 l30,-6 l-30,-6 l6,6Z" fill="#cfd8df" class="plane"/>` : ""}
    </svg>`;
  }
  function junction(st) {
    return `<svg viewBox="0 0 520 220" class="sim-svg junc" aria-hidden="true">
      <rect width="520" height="220" fill="#cfe9f7"/><rect y="140" width="520" height="60" fill="#3b4249"/><path d="M0,170 H520" stroke="#fff" stroke-width="3" stroke-dasharray="22 16"/>
      <rect y="200" width="520" height="20" fill="#7dbb6f"/><rect x="300" y="142" width="6" height="56" fill="#fff" opacity=".8"/>
      <rect x="318" y="60" width="6" height="82" fill="#5b6670"/><rect x="302" y="10" width="38" height="92" rx="8" fill="#1d2328"/>
      ${[[30, 25, "#ff3b2f"], [56, 26, "#ffcc00"], [82, 27, "#2ee06a"]].map(([y, p, c]) => st[p] ? `<circle cx="321" cy="${y}" r="26" fill="${c}" opacity=".35" class="jglow"/><circle cx="321" cy="${y}" r="10" fill="${c}" stroke="#fff" stroke-width="1.5"/><circle cx="318" cy="${y - 3}" r="3" fill="#fff" opacity=".8"/>` : `<circle cx="321" cy="${y}" r="10" fill="${c}"/><circle cx="321" cy="${y}" r="10" fill="#0d1014" opacity=".78"/>`).join("")}
      <g class="jcar"><rect x="-64" y="-24" width="64" height="18" rx="6" fill="#e4572e"/><path d="M-52,-24 l9,-12 h26 l9,12Z" fill="#e4572e"/><circle cx="-50" cy="-5" r="6" fill="#111"/><circle cx="-14" cy="-5" r="6" fill="#111"/></g>
    </svg>`;
  }
  // Animasi berterusan untuk satu program: lukis keadaan bila berubah, gerakkan kereta
  function runner(host, prog, draw, o = {}) {
    const sim = segments(prog);
    let raf = 0, t0 = performance.now(), last = "", carX = -70, ln = 0;
    const tick = (now) => {
      const st = stAt(sim, now - t0), k = JSON.stringify(st);
      if (k !== last) { draw(st, sim); last = k; }
      if (o.time) o.time(now - t0);
      const car = host.querySelector(".jcar");
      if (car) {
        const dt = Math.min(60, now - (ln || now)); ln = now;
        const stop = 296, before = carX <= stop && carX > stop - 140;
        let v = 0.16 * dt; if (!st[27] && before) v = Math.max(0, Math.min(v, (stop - carX) * 0.08));
        carX += v; if (carX > 600) carX = -70;
        car.setAttribute("transform", `translate(${carX.toFixed(0)} 196)`);
      }
      raf = requestAnimationFrame(tick);
    };
    if (E.reduceMotion) draw(stAt(sim, 0), sim); else raf = requestAnimationFrame(tick);
    return { stop() { cancelAnimationFrame(raf); }, sim };
  }

  /* ================= Jalur masa: sasaran vs program ================= */
  const TARGET = {
    1: [{ ms: 6000, st: { 2: 1 } }],
    2: [{ ms: 1000, st: { 2: 1 } }, { ms: 1000, st: { 2: 0 } }],
    3: [{ ms: 3000, st: { 25: 1, 26: 0, 27: 0 } }, { ms: 3000, st: { 25: 0, 26: 0, 27: 1 } }, { ms: 1000, st: { 25: 0, 26: 1, 27: 0 } }]
  };
  function segCls(m, st, fast) {
    if (m < 3) return fast && fast.has(2) ? "dim" : st[2] ? "c2" : "";
    const on = [25, 26, 27].filter((p) => st[p]);
    if (!on.length) return "";
    return on.length > 1 ? "mix" : "c" + on[0];
  }
  function barHtml(m, segs, total, W, fast) {
    if (!total) return `<i class="${segCls(m, segs[0].st, fast)}" style="left:0;width:100%"></i>`;
    let x = 0, h = "";
    while (x < W) for (const sg of segs) { if (x >= W) break; const w = Math.min(sg.ms, W - x); const c = segCls(m, sg.st); if (c) h += `<i class="${c}" style="left:${(x / W) * 100}%;width:${(w / W) * 100}%"></i>`; x += w; }
    return h;
  }
  function stripHtml(m, sim) {
    const W = m === 3 ? 14000 : 6000, tg = TARGET[m], tt = tg.reduce((a, s) => a + s.ms, 0);
    const ax = m === 3 ? ["0 s", "7 s", "14 s"] : ["0 s", "3 s", "6 s"];
    return `<div class="ts-h">Jalur masa: sasaran misi dan program kamu</div>
      <div class="ts-row"><span class="ts-l">🎯 Sasaran</span><div class="ts-bar">${barHtml(m, tg, tt, W)}</div></div>
      <div class="ts-row"><span class="ts-l">💻 Kamu</span><div class="ts-bar">${sim ? barHtml(m, sim.segs, sim.total, W, sim.fast) + '<b class="ts-now"></b>' : ""}</div></div>
      <div class="ts-ax"><span>${ax[0]}</span><span>${ax[1]}</span><span>${ax[2]}</span></div>
      ${m === 3 ? `<div class="ts-key"><span><i class="c25"></i>merah</span><span><i class="c27"></i>hijau</span><span><i class="c26"></i>kuning</span><span><i class="mix"></i>lebih daripada satu</span><span><i></i>padam</span></div>` : ""}`;
  }

  /* ================= Data misi ================= */
  const MDATA = {
    1: {
      story: "Malam semakin gelap. Kapal terbang perlu nampak menara bandar kita! Tugas kamu: <strong>hidupkan lampu menara</strong>. Lampu menara disambung ke LED biru pada pin <strong>GPIO2</strong> ESP32.",
      pal: ["led"], start: () => ({ loop: [] }),
      hints: ["Blok <strong>Integrated LED Stat</strong> mengawal LED biru GPIO2. Seret ia dari Kotak Blok ke ruang di bawah <strong>Main loop</strong>.", "Ingat bahasa pin: <strong>HIGH = 3.3 V = menyala</strong>, LOW = 0 V = padam. Semak pilihan dalam blok kamu."],
      task: "Seret blok <strong>Integrated LED Stat</strong> dari Kotak Blok ke dalam <strong>Main loop</strong>, kemudian <strong>pilih sendiri</strong> keadaan yang membuat LED <strong>menyala</strong>.",
      check(sim, prog) {
        if (!prog.length) return "Main loop masih kosong. Seret satu blok ke dalamnya.";
        const m = merged(sim, [2]);
        if (m.length === 1 && m[0].k === "1" && !sim.fast.size) return true;
        if (m.length === 1 && m[0].k === "0") return "Lampu menara masih <strong>padam</strong>.";
        return "Lampu menara perlu <strong>menyala terus</strong>, bukan berkelip.";
      },
      done: "Lampu menara menyala! Kapal terbang kini nampak menara bandar kita."
    },
    2: {
      story: "Lampu amaran kapal terbang mesti <strong>berkelip</strong> supaya lebih mudah dilihat. Tugas kamu: jadikan lampu <strong>menyala 1 saat, padam 1 saat</strong>, berulang-ulang.",
      pal: ["led", "delay"], start: () => ({ loop: [] }),
      hints: ["Lampu yang berkelip perlukan <strong>empat</strong> langkah: menyala, tunggu, padam, tunggu. Berapa blok LED dan berapa blok Delay Ms yang kamu perlukan?", "Main loop berulang terus dari bawah ke atas semula. Jika tiada Delay selepas LED padam, LED padam terlalu sekejap untuk dilihat. Semak juga nombor dalam setiap Delay Ms."],
      task: "Seret blok <strong>Integrated LED Stat</strong> dan <strong>Delay Ms</strong> ke dalam <strong>Main loop</strong> supaya LED: <strong>menyala → tunggu → padam → tunggu</strong>. Pilih HIGH/LOW dan taip masa sendiri. Ingat: <strong>1 saat = 1000 ms</strong>.",
      check(sim, prog) {
        if (!sim.total) return sim.fast.size ? "LED bertukar terlalu laju sehingga nampak <strong>malap</strong>. ESP32 perlu <strong>menunggu</strong> antara arahan." : "LED tidak berkelip. Ia perlu menyala dan padam bergilir-gilir.";
        const m = merged(sim, [2]);
        if (m.length === 1) {
          if (m[0].k === "1" && prog.some((b) => b.t === "led" && b.v === "LOW")) return "LED nampak <strong>sentiasa menyala</strong>. Ia padam, tetapi terlalu sekejap untuk dilihat!";
          return m[0].k === "1" ? "LED sentiasa <strong>menyala</strong>. Ia belum berkelip." : "LED sentiasa <strong>padam</strong>.";
        }
        const on = m.filter((x) => x.k === "1"), off = m.filter((x) => x.k === "0");
        if (m.length !== 2) return "LED berkelip, tetapi coraknya belum betul: " + m.map((x) => `${x.k === "1" ? "menyala" : "padam"} ${secs(x.ms)}`).join(", ") + ".";
        if (on[0].ms === 1000 && off[0].ms === 1000) return true;
        return `LED berkelip! Tetapi ia menyala <strong>${secs(on[0].ms)}</strong> dan padam <strong>${secs(off[0].ms)}</strong>. Misi meminta 1 saat dan 1 saat.`;
      },
      done: "Lampu amaran berkelip dengan sempurna: 1 saat menyala, 1 saat padam!",
      extra: "⭐ <strong>Cabaran:</strong> di ② tukar Delay Ms kepada 200 dan tekan ▶. Lampu berkelip lebih laju!"
    },
    3: {
      story: "Simpang di tengah bandar sesak! Bandar perlukan <strong>lampu isyarat</strong>: <strong>merah 3 saat → hijau 3 saat → kuning 1 saat</strong>, kemudian ulang.",
      pal: ["dw", "delay"], start: () => ({ g: [], y: [] }),
      hints: ["Lihat Fasa Merah yang sudah siap: ia <strong>padam</strong> lampu lain, <strong>hidupkan</strong> lampu merah, kemudian <strong>tunggu</strong>. Fasa Hijau dan Fasa Kuning ikut corak yang sama.", "Semak pin dan masa: <strong>D25 🔴 merah, D26 🟡 kuning, D27 🟢 hijau</strong>. Pada awal fasa baharu, lampu fasa sebelumnya mesti dipadam (LOW). Bandingkan jalur <strong>🎯 Sasaran</strong> dengan <strong>💻 Kamu</strong>."],
      task: "Fasa Merah sudah siap sebagai contoh. Isi <strong>Fasa Hijau</strong> dan <strong>Fasa Kuning</strong>: setiap fasa = <strong>padam</strong> lampu sebelum (LOW) → <strong>hidupkan</strong> lampu baharu (HIGH) → <strong>tunggu</strong> (Delay Ms). Pilih pin, HIGH/LOW dan masa sendiri.",
      check(sim) {
        if (!sim.total) return "Lampu bertukar terlalu laju. Setiap fasa perlukan <strong>Delay Ms</strong>.";
        const m = merged(sim, [25, 26, 27]);
        const want = [["100", 3000], ["001", 3000], ["010", 1000]];
        const ok = m.length === 3 && [0, 1, 2].some((s) => want.every((w, i) => m[(s + i) % 3].k === w[0] && m[(s + i) % 3].ms === w[1]));
        if (ok) return true;
        return "Program kamu: " + m.map((x) => `<strong>${colName(x.k)}</strong> ${secs(x.ms)}`).join(" → ") + ". Sasaran: <strong>merah</strong> 3 s → <strong>hijau</strong> 3 s → <strong>kuning</strong> 1 s.";
      },
      done: "Lampu isyarat bandar berfungsi! Kereta kini bergerak dengan selamat.",
      extra: "⭐ <strong>Cabaran:</strong> cuba corak sendiri, cth. <em>lampu berlari</em> (setiap lampu 300 ms)."
    }
  };

  /* ================= Halaman Makmal Maya ================= */
  function labPage() {
    const m = +document.body.dataset.step.slice(-1), D = MDATA[m], M = MISSIONS[m];
    S.prog = S.prog || {}; S.bench = S.bench || {}; S.st = S.st || {};
    const ST = S.st[m] || (S.st[m] = {});
    // Program: zon blok. Misi 3: Fasa Merah tetap + zon g (hijau) dan y (kuning).
    let Z = (() => {
      const sv = S.prog[m];
      if (m === 3) return sv && Array.isArray(sv.g) && Array.isArray(sv.y) ? { g: sv.g.slice(), y: sv.y.slice() } : D.start();
      return Array.isArray(sv) ? { loop: sv.slice() } : D.start();
    })();
    const flat = () => (m === 3 ? RED().concat(Z.g, Z.y) : Z.loop.slice());
    const names = S.names.filter((n) => n.trim());
    const pilot = names.length === 2 ? names[(m + 1) % 2] : null, nav = names.length === 2 ? names[m % 2] : null;
    const doneKey = "maya" + m;
    const STN = [["bench", "①", "Pasang Litar"], ["prog", "②", "Susun Blok"], ["upload", "③", "Salin & Upload"], ["test", "④", "Uji"]];
    let cur = ST.at || "bench";
    const okUpTo = (i) => STN.slice(0, i).every(([k]) => ST[k]);
    if (!okUpTo(STN.findIndex(([k]) => k === cur))) cur = "bench";

    $("#main").innerHTML = `
      <section class="hero"><div class="wrap">
        <span class="kick">💻 Makmal Maya · Misi ${m} daripada 3</span>
        <h1>${M.ico} ${esc(M.t)}</h1>
        <p>${D.story}</p>
        ${pilot ? `<p class="roles">👩‍✈️ Juruterbang: <strong>${esc(pilot)}</strong> &nbsp;·&nbsp; 🧭 Navigator: <strong>${esc(nav)}</strong></p>` : `<p class="roles">👩‍✈️🧭 Ingat: tukar peranan Juruterbang dan Navigator setiap misi!</p>`}
      </div></section>
      <section class="sec"><div class="wrap">
        <p class="stn-intro">Setiap misi ada <strong>4 stesen</strong>, sama seperti di makmal sebenar nanti.</p>
        <nav class="stn" id="stn" aria-label="Stesen misi"></nav>
        <div id="panel"></div>
      </div></section>`;

    function paintNav() {
      $("#stn").innerHTML = STN.map(([k, n, t], i) => {
        const open = okUpTo(i), state = k === cur ? "now" : ST[k] ? "done" : open ? "open" : "lock";
        return `<button type="button" class="stn-b ${state}" data-k="${k}"${open ? "" : " disabled"}${k === cur ? ' aria-current="step"' : ""}><span class="stn-n">${ST[k] && k !== cur ? "✓" : n}</span><span class="stn-t">${t}</span></button>`;
      }).join('<span class="stn-line" aria-hidden="true"></span>');
    }
    $("#stn").addEventListener("click", (e) => { const b = e.target.closest(".stn-b"); if (b && !b.disabled) go(b.dataset.k); });
    let cleanup = null;
    function go(k, scroll) {
      if (cleanup) { cleanup(); cleanup = null; }
      cur = k; ST.at = k; save(); paintNav();
      const host = $("#panel");
      cleanup = ({ bench: benchStation, prog: progStation, upload: uploadStation, test: testStation })[k](host) || null;
      if (scroll) $("#stn").scrollIntoView({ behavior: E.reduceMotion ? "auto" : "smooth", block: "start" });
    }
    function finish(k, next, msg) {
      const fresh = !ST[k]; ST[k] = true; save(); paintNav();
      if (fresh) { chime(); if (E.mini && msg) E.mini.say(msg); }
      if (next) { const b = $("#nextStn"); if (b) b.hidden = false; }
    }
    const nextBtn = (k, t) => `<div class="stn-next"><button type="button" class="btn big" id="nextStn" data-go="${k}"${ST[cur] ? "" : " hidden"}>${t} ›</button></div>`;
    $("#panel").addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (b) go(b.dataset.go, true); });
    // Program berubah: upload dan uji perlu dibuat semula
    const progChanged = () => { if (ST.prog || ST.upload || ST.test) { ST.prog = false; ST.upload = false; ST.test = false; save(); paintNav(); } };

    /* ---------------- ① Pasang Litar ---------------- */
    function benchStation(host) {
      const B = S.bench[m] || (S.bench[m] = m === 1 ? { esp: false, usb: false, res: [0, 0, 0], led: {}, wires: {} }
        : m === 2 ? FULL() : { esp: true, usb: true, unplugged: false, res: [0, 0, 0], led: {}, wires: {}, checked: false });
      if (m === 2) { B.esp = true; B.usb = true; }
      let armed = null, selPin = null, showRev = false, askPin = null, noClick = false;
      const ledDone = (p) => B.led[p] === "ok" || B.led[p] === "rev";
      const steps3 = () => [
        ["Cabut kabel USB dahulu (tekan pada kabel). Jangan pasang litar semasa ada kuasa!", !B.usb || B.unplugged],
        ["Seret 3 <strong>perintang 220 Ω</strong> ke petak di baris c.", B.res.every(Boolean)],
        ["Seret LED <strong>hijau, kuning dan merah</strong> ke petak warnanya, dan jawab: kaki panjang (+) ke mana?", UNITS.every((u) => ledDone(u.pin))],
        ["Sambung 4 <strong>wayar jumper</strong>: seret wayar dari dulang (atau dari pin) ke pin ESP32 D27, D26, D25 dan GND, kemudian ke lubang tujuannya.", ["27", "26", "25", "GND"].every((p) => B.wires[p])],
        ["Navigator: tekan <strong>🧭 Semak litar</strong>.", B.checked],
        ["Seret kabel USB semula ke port ESP32.", B.checked && B.usb]
      ];
      const steps1 = () => [[E.layout() === "B" ? "Seret ESP32 dari dulang ke Breadboard 1." : "Seret <strong>ESP32</strong> dari dulang ke meja.", B.esp], ["Seret <strong>kabel USB</strong> ke port ESP32. Lihat LED merah PWR menyala!", B.usb]];
      host.innerHTML = `<div class="card stn-card">
        <div class="lab-h"><h2>① Pasang Litar</h2>${m === 3 ? `<div class="seg lay-seg" role="group" aria-label="Susunan litar"><button type="button" data-l="A" class="${E.layout() === "A" ? "on" : ""}">A · Jumper F-M</button><button type="button" data-l="B" class="${E.layout() === "B" ? "on" : ""}">B · Dua breadboard</button></div>` : ""}</div>
        ${m === 2 ? `<p class="lead">Litar sama seperti Misi 1: kita guna <strong>LED biru terbina</strong> pada GPIO2, jadi tiada wayar diperlukan. Semak ESP32 dan kabel USB, kemudian teruskan.</p>` : ""}
        <div class="bench-grid"><div class="bench-wrap"><div id="benchSvg"></div><div class="btoast" id="bToast" aria-hidden="true" hidden></div><div class="legq" id="legQ" hidden></div></div>
          ${m === 3 ? `<div class="vlegend"><span><b class="pos">+</b> pin D25 / D26 / D27 bila <strong>HIGH</strong> (3.3 V)</span><span><b class="neg">−</b> rel biru, disambung ke <strong>GND</strong> (0 V)</span><span><i class="flw"></i> arus: <strong>+ → perintang → LED → −</strong></span></div>` : ""}
          <div class="bench-side"><ol class="bsteps" id="bSteps"></ol><div id="bMsg" class="bmsg" aria-live="polite"></div>
          ${m === 3 ? `<button type="button" class="btn amber" id="chkC">🧭 Semak litar</button>` : ""}${m === 2 ? `<button type="button" class="btn amber" id="ok2">✓ Litar sudah sedia</button>` : ""}</div></div>
        <p class="bench-tip">${m === 3 ? "💡 Seret komponen dari <strong>dulang</strong>, atau tekan komponen dan kemudian tekan tempatnya. Tekan LED yang sudah dipasang untuk memusingnya. Tekan wayar untuk membuangnya." : "💡 Seret dari <strong>dulang</strong> di kiri, atau tekan komponen dan kemudian tekan tempatnya."}</p>
      </div>${nextBtn("prog", "Seterusnya: ② Susun Blok")}`;
      const svgHost = $("#benchSvg", host), wrapEl = $(".bench-wrap", host);
      const toPx = (x, y) => { const sv = svgHost.querySelector("svg"), p = sv.createSVGPoint(); p.x = x; p.y = y; const q = p.matrixTransform(sv.getScreenCTM()), r = wrapEl.getBoundingClientRect(); return [q.x - r.left, q.y - r.top]; };
      function paint() {
        svgHost.innerHTML = benchSvg({ layout: E.layout(), m, bench: B, edit: m !== 2, tray: m !== 2, armed, selPin, showRev });
        const list = m === 3 ? steps3() : steps1();
        const firstOpen = list.findIndex(([, d]) => !d);
        $("#bSteps", host).innerHTML = list.map(([t, d], i) => `<li class="${d ? "ok" : i === firstOpen ? "now" : ""}">${t}</li>`).join("");
        paintLeg();
        save();
        if (firstOpen === -1 && m !== 2 && !ST.bench) { finish("bench", true, "LITAR SIAP!"); msg("✅ <strong>Litar siap!</strong> Teruskan ke ② Susun Blok.", "ok"); }
      }
      // Mesej: di sisi, dan juga sebagai toast di atas meja supaya sentiasa kelihatan
      let toastT = 0;
      const msg = (h, c = "") => {
        const el = $("#bMsg", host); el.className = "bmsg " + c; el.innerHTML = h;
        const t = $("#bToast", host); clearTimeout(toastT);
        if (!h || /leg-q/.test(h)) { t.hidden = true; return; }
        t.className = "btoast " + c; t.innerHTML = h.replace(/<ul>[\s\S]*<\/ul>/, " Lihat senarai di bawah meja."); t.hidden = false;
        toastT = setTimeout(() => { t.hidden = true; }, c === "bad" ? 6000 : 3500);
      };
      const svgPt = (e) => { const sv = svgHost.querySelector("svg"), p = sv.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(sv.getScreenCTM().inverse()); };
      // Soalan kaki LED, terapung betul-betul di sebelah LED
      function paintLeg() {
        const q = $("#legQ", host);
        if (!askPin || B.led[askPin] !== "ask") { q.hidden = true; return; }
        const u = UNITS.find((x) => x.pin === askPin), L = u.W + 80;
        q.innerHTML = `<p><strong>LED ${u.c}</strong>: kaki <strong>panjang (+)</strong> dicucuk ke mana?</p><div class="leg-q"><button type="button" class="btn" data-leg="ok">↓ Ke baris a (arah perintang)</button><button type="button" class="btn ghost" data-leg="rev">↑ Ke rel biru (−)</button></div>`;
        q.hidden = false;
        const [px, py] = toPx(L + 9, 70), W = wrapEl.clientWidth, qw = q.offsetWidth;
        const lx = Math.max(6, Math.min(W - qw - 6, px - qw / 2));
        q.style.left = lx + "px"; q.style.setProperty("--ax", Math.max(16, Math.min(qw - 16, px - lx)) + "px");
        q.style.top = (py + 14) + "px";
      }
      $("#legQ", host).addEventListener("click", (e) => {
        const b = e.target.closest("[data-leg]"); if (!b || !askPin) return;
        const u = UNITS.find((q) => q.pin === askPin);
        B.led[askPin] = b.dataset.leg; B.checked = false; askPin = null;
        beep(900, 50, 0.04, "sine");
        msg(b.dataset.leg === "ok" ? `✓ LED ${u.c} dipasang: kaki panjang (+) ke arah perintang.` : `LED ${u.c} dipasang. Navigator akan menyemaknya nanti. 😉`);
        paint();
      });
      // Letak komponen ke zon
      function place(item, zone) {
        if (item === "esp" && zone === "esp") { B.esp = true; beep(700, 60, 0.04, "sine"); msg("ESP32 diletakkan. 👍"); }
        else if (item === "usb" && zone === "usb") {
          if (m === 3 && !B.checked) { msg("⚠️ Navigator perlu <strong>semak litar</strong> dahulu sebelum kuasa disambung.", "bad"); return false; }
          B.usb = true; beep(1200, 50, 0.05, "square"); setTimeout(() => beep(1600, 60, 0.04, "sine"), 90); msg("🔌 Klik! LED merah <strong>PWR</strong> menyala: ESP32 mendapat kuasa.", "ok");
        }
        else if (m === 3 && B.usb && (item === "res" || item === "wire" || /^led/.test(item))) { msg("⚠️ <strong>Cabut kabel USB dahulu</strong> sebelum memasang komponen (tekan pada kabel).", "bad"); beep(260, 120, 0.03, "sawtooth"); return false; }
        else if (item === "res" && /^res\d$/.test(zone)) { B.res[+zone.slice(3)] = 1; beep(900, 50, 0.04, "sine"); B.checked = false; msg("Perintang 220 Ω dipasang. Perintang tiada arah."); }
        else if (/^led\d+$/.test(item) && /^led\d+$/.test(zone)) {
          if (item !== zone) { const u = UNITS.find((q) => "led" + q.pin === zone), w = UNITS.find((q) => "led" + q.pin === item); msg(`Petak ini untuk <strong>LED ${u.c}</strong>. Letakkan LED ${w.c} di petak <strong>${w.c[0].toUpperCase()}</strong>.`, "bad"); beep(260, 120, 0.03, "sawtooth"); return false; }
          const pin = item.slice(3); B.led[pin] = "ask"; askPin = pin; B.checked = false; beep(800, 50, 0.04, "sine");
          msg(`LED ${UNITS.find((q) => q.pin === pin).c} diletakkan. Jawab soalan di sebelah LED.`);
        }
        else if (item === "wire" && /^pin:/.test(zone)) {
          const p = zone.slice(4); selPin = p; beep(1000, 40, 0.04, "sine");
          armed = null; paint(); msg(`Hujung wayar dicucuk pada pin <strong>${p === "GND" ? "GND" : "D" + p}</strong>. Sekarang tekan lubang tujuan yang bercahaya hijau.`); return true;
        }
        else return false;
        armed = null; paint(); return true;
      }
      // Seret komponen dari dulang (Pointer Events)
      let drag = null, wd = null;
      svgHost.addEventListener("pointerdown", (e) => {
        const pinEl = e.target.closest("[data-pin]");
        if (pinEl && !armed && m === 3) {
          // Seret wayar terus dari pin ke lubang tujuan
          if (B.usb) return;
          e.preventDefault();
          wd = { p: pinEl.dataset.pin, sx: e.clientX, sy: e.clientY, on: false, pid: e.pointerId };
          return;
        }
        const it = e.target.closest("[data-item]");
        if (!it || it.dataset.item === "_l") return;
        e.preventDefault();
        const p = svgPt(e);
        drag = { id: it.dataset.item, sx: e.clientX, sy: e.clientY, p0: p, on: false, pid: e.pointerId, base: it.getAttribute("transform") };
      });
      const onMove = (e) => {
        if (wd && e.pointerId === wd.pid) {
          if (!wd.on && Math.hypot(e.clientX - wd.sx, e.clientY - wd.sy) < 6) return;
          if (!wd.on) {
            wd.on = true; selPin = wd.p; armed = null; paint();
            const [x] = pinPos(wd.p), y0 = E.layout() === "B" ? 272 : pinPos("25")[1];
            wd.x0 = x; wd.y0 = y0;
            const ln = document.createElementNS("http://www.w3.org/2000/svg", "path"); ln.setAttribute("class", "rubber"); ln.setAttribute("stroke", WCOL[wd.p]); svgHost.querySelector("svg").appendChild(ln); wd.ln = ln;
          }
          const q = svgPt(e); wd.ln.setAttribute("d", `M${wd.x0},${wd.y0} L${q.x.toFixed(1)},${q.y.toFixed(1)}`);
          return;
        }
        if (!drag || e.pointerId !== drag.pid) return;
        if (!drag.on && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 6) return;
        if (!drag.on) { drag.on = true; armed = drag.id; selPin = null; paint(); drag.el = svgHost.querySelector(`[data-item="${drag.id}"]`); if (!drag.el) { drag = null; return; } drag.el.classList.add("dragging"); svgHost.querySelector("svg").appendChild(drag.el); }
        const p = svgPt(e);
        drag.el.setAttribute("transform", `${drag.base} translate(${p.x - drag.p0.x} ${p.y - drag.p0.y})`);
      };
      const nearest = (p, sel, max) => { let best = null, bd = max; $$(sel, svgHost).forEach((zz) => { const bb = zz.getBBox(), cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2, dd = Math.hypot(p.x - cx, p.y - cy) - Math.max(bb.width, bb.height) / 2; if (dd < bd) { bd = dd; best = zz; } }); return best; };
      const onUp = (e) => {
        if (wd && e.pointerId === wd.pid) {
          const w = wd; wd = null;
          if (!w.on) return; // klik biasa: dikendalikan oleh 'click'
          noClick = true; setTimeout(() => { noClick = false; }, 0);
          if (w.ln) w.ln.remove();
          const under = document.elementFromPoint(e.clientX, e.clientY);
          let tg = under && under.closest("[data-tgt]");
          if (!tg) tg = nearest(svgPt(e), "[data-tgt]", 36);
          if (tg) connect(w.p, tg.dataset.tgt);
          else { msg("Lepaskan hujung wayar pada <strong>lubang yang bercahaya hijau</strong>.", "bad"); paint(); }
          return;
        }
        if (!drag || e.pointerId !== drag.pid) return;
        const d = drag; drag = null;
        if (!d.on) { armed = armed === d.id ? null : d.id; selPin = null; paint(); if (armed) msg(d.id === "wire" ? "Wayar dipilih. Tekan <strong>pin ESP32</strong> yang bercahaya untuk mencucuk hujung pertama." : "Sekarang tekan tempat yang bercahaya untuk meletakkannya."); return; }
        noClick = true; setTimeout(() => { noClick = false; }, 0);
        if (d.el) d.el.style.display = "none";
        const under = document.elementFromPoint(e.clientX, e.clientY);
        const sel = d.id === "wire" ? "[data-pin]" : "[data-zone]";
        let z = under && under.closest(sel);
        if (!z) z = nearest(svgPt(e), sel, d.id === "wire" ? 30 : 60);
        let ok = false;
        if (z) ok = place(d.id, d.id === "wire" ? "pin:" + z.dataset.pin : z.dataset.zone);
        if (!ok) { armed = null; paint(); if (!z) msg("Lepaskan komponen pada <strong>petak yang bercahaya</strong>.", "bad"); }
      };
      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      function connect(p, t) {
        B.wires[p] = t; B.checked = false; beep(1000, 50, 0.04, "sine"); selPin = null;
        const nm = { u27: "LED hijau", u26: "LED kuning", u25: "LED merah", rail: "rel biru (−)" };
        msg(`Wayar <strong>${p === "GND" ? "GND" : "D" + p}</strong> → ${nm[t]} disambung.`); paint();
      }
      // Tekan: zon, pin, sasaran wayar, wayar, LED, palam USB
      svgHost.addEventListener("click", (e) => {
        if (m === 2 || noClick) return;
        const z = e.target.closest("[data-zone]");
        if (z && armed) { place(armed, z.dataset.zone); return; }
        const plug = e.target.closest("[data-plug]");
        if (plug && m === 3) { B.usb = false; B.unplugged = true; B.checked = false; beep(500, 60, 0.04, "sine"); msg("🔌 Kabel USB dicabut. Sekarang selamat untuk memasang litar.", "ok"); paint(); return; }
        if (plug) return;
        const pin = e.target.closest("[data-pin]");
        if (pin) {
          if (B.usb) { msg("⚠️ Cabut kabel USB dahulu.", "bad"); return; }
          if (armed === "wire") { place("wire", "pin:" + pin.dataset.pin); return; }
          selPin = selPin === pin.dataset.pin ? null : pin.dataset.pin; armed = null;
          msg(selPin ? `Pin <strong>${selPin === "GND" ? "GND" : "D" + selPin}</strong> dipilih. Sekarang tekan lubang tujuan yang bercahaya hijau.` : "");
          paint(); return;
        }
        const tg = e.target.closest("[data-tgt]");
        if (tg && selPin) { connect(selPin, tg.dataset.tgt); return; }
        const w = e.target.closest("[data-wire]");
        if (w && !B.usb) { delete B.wires[w.dataset.wire]; B.checked = false; beep(400, 60, 0.03, "sine"); msg("Wayar dibuang dan kembali ke dulang."); paint(); return; }
        const led = e.target.closest("[data-led]");
        if (led && !B.usb) {
          const p = led.dataset.led;
          if (B.led[p] === "ask") { askPin = p; paint(); return; }
          B.led[p] = B.led[p] === "ok" ? "rev" : "ok"; B.checked = false; beep(800, 50, 0.03, "sine"); msg("LED dipusing ↻."); paint(); return;
        }
      });
      if (m === 3) {
        $("#chkC", host).addEventListener("click", () => {
          const errs = [];
          if (B.usb) errs.push("Kabel USB masih disambung. Cabut dahulu.");
          UNITS.forEach((u, i) => { if (!B.res[i]) errs.push(`Perintang untuk LED ${u.c} belum dipasang.`); });
          UNITS.forEach((u) => { const v = B.led[u.pin]; if (!v) errs.push(`LED ${u.c} belum dipasang.`); else if (v === "ask") errs.push(`LED ${u.c}: jawab dahulu soalan kaki panjang (+). Tekan LED itu.`); else if (v === "rev") errs.push(`LED ${u.c} <strong>terbalik</strong>: kaki panjang (+) mesti ke arah perintang. Tekan LED itu untuk memusingnya.`); });
          const nm = { u27: "LED hijau", u26: "LED kuning", u25: "LED merah", rail: "rel biru (−)" };
          ["27", "26", "25", "GND"].forEach((p) => { const lab = p === "GND" ? "GND" : "D" + p; if (!B.wires[p]) errs.push(`Wayar dari <strong>${lab}</strong> belum disambung.`); else if (B.wires[p] !== WANT[p]) errs.push(`Wayar <strong>${lab}</strong> disambung ke ${nm[B.wires[p]]}. Semak jadual pin: D25 🔴, D26 🟡, D27 🟢, GND → rel (−).`); });
          showRev = true;
          if (errs.length) { B.checked = false; msg(`<strong>🧭 Navigator jumpa ${errs.length} perkara:</strong><ul>${errs.map((x) => `<li>${x}</li>`).join("")}</ul>`, "bad"); beep(260, 140, 0.035, "sawtooth"); }
          else { B.checked = true; msg("✅ <strong>Litar betul!</strong> Sekarang seret kabel USB semula ke port ESP32.", "ok"); beep(1320, 90, 0.04, "sine"); }
          paint();
        });
      }
      if (m === 2) $("#ok2", host).addEventListener("click", () => finish("bench", true, "LITAR SEDIA!"));
      $$(".lay-seg button", host).forEach((b) => b.addEventListener("click", () => { S.layout = b.dataset.l; save(); paint(); $$(".lay-seg button", host).forEach((x) => x.classList.toggle("on", x === b)); }));
      const onResize = () => paintLeg();
      window.addEventListener("resize", onResize);
      // LED yang belum dijawab dari lawatan lepas
      askPin = (UNITS.find((u) => B.led[u.pin] === "ask") || {}).pin || null;
      paint();
      if (ST.bench) msg("✅ Litar siap. Teruskan ke ② Susun Blok.", "ok");
      return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); window.removeEventListener("pointercancel", onUp); window.removeEventListener("resize", onResize); clearTimeout(toastT); };
    }

    /* ---------------- ② Susun Blok ---------------- */
    function progStation(host) {
      const phases = m === 3;
      const off = (z) => (z === "g" ? 4 : z === "y" ? 4 + Z.g.length : 0);
      const zoneHtml = (z, max) => `<div class="bk-zone" data-zone="${z}">${(Z[z] || []).map((b, i) => `<div class="${cls(b)} placed${missing(b) ? " need" : ""}" data-z="${z}" data-i="${i}" data-k="${off(z) + i}"${missing(b) ? ` title="Belum lengkap: ${missing(b)}"` : ""}>${blockHtml(b, i + 1, false)}<button type="button" class="bk-x" aria-label="Buang blok">✕</button></div>`).join("")}${max ? Array.from({ length: Math.max(0, max - (Z[z] || []).length) }, () => `<div class="bk-slot">petak kosong</div>`).join("") : (Z[z] || []).length ? "" : `<div class="bk-drop">Seret blok ke sini</div>`}</div>`;
      const loopHtml = () => phases ? `
        <div class="phase r"><div class="ph-h">🔴 Fasa Merah · 3 saat <span class="ph-ok">✓ siap (contoh)</span></div><div class="bk-zone locked">${RED().map((b, i) => `<div class="${cls(b)}" data-k="${i}">${blockHtml(b, i + 1, true)}</div>`).join("")}</div></div>
        <div class="phase g"><div class="ph-h">🟢 Fasa Hijau · 3 saat <span class="ph-n">3 blok</span></div>${zoneHtml("g", 3)}</div>
        <div class="phase y"><div class="ph-h">🟡 Fasa Kuning · 1 saat <span class="ph-n">3 blok</span></div>${zoneHtml("y", 3)}</div>` : zoneHtml("loop", 0);
      host.innerHTML = `<div class="card stn-card"><div class="lab-h"><h2>② Susun Blok</h2><span class="lab-tip">Seret blok, atau tekan untuk tambah</span></div>
        <details class="howrun"${m === 1 ? " open" : ""}><summary>⚙️🔁 Bagaimana program ESP32 berjalan? <span>(Setup dan Main loop)</span></summary>
          <div class="hr-body"><div class="hr-flow" id="hrFlow" aria-hidden="true"><div class="hr-s" data-s="0"><span>🔌</span><b>ESP32 dihidupkan</b></div><i class="hr-a">➜</i><div class="hr-s" data-s="1"><span>⚙️</span><b>Setup</b><small>sekali sahaja</small></div><i class="hr-a">➜</i><div class="hr-s loop" data-s="2"><span class="hr-spin">🔁</span><b>Main loop</b><small>berulang selama-lamanya</small></div></div>
            <div class="hr-txt"><p><strong>Setup</strong> dijalankan <strong>sekali sahaja</strong> semasa ESP32 baru dihidupkan, untuk membuat persediaan. Hari ini Setup dibiarkan kosong kerana kod persediaan pin dijana secara automatik.</p>
            <p><strong>Main loop</strong> dijalankan dari blok <strong>paling atas ke paling bawah</strong>, kemudian kembali ke atas semula, <strong>berulang-ulang</strong> selagi ESP32 hidup. Semua blok kita letak di dalam Main loop. Semasa ▶ Jalankan, blok yang sedang bekerja akan <strong>bercahaya</strong>.</p></div></div></details>
        <p class="stn-task">🎯 ${D.task}</p>
        ${phases ? `<div class="pin-key"><span><i class="c25"></i><strong>D25</strong> merah</span><span><i class="c26"></i><strong>D26</strong> kuning</span><span><i class="c27"></i><strong>D27</strong> hijau</span></div>` : ""}
        <div class="lab">
          <div class="lab-ws">
            <div class="ws-grid">
              <div class="palette" id="pal" aria-label="Kotak blok"><div class="pal-h">Kotak Blok</div>${D.pal.map((t) => `<button type="button" class="${cls(mk[t]())} pal-b" data-new="${t}">${blockHtml(mk[t](), 0, true)}</button>`).join("")}<div class="pal-bin" aria-hidden="true">🗑 Seret ke sini untuk buang</div></div>
              <div class="bk-ws"><div class="bk-c${phases ? " wide" : ""}"><div class="bk-ch">Setup</div><div class="bk-in empty setup-note">kosong · persediaan pin dibuat automatik</div><div class="bk-ch">Main loop <small>↻ berulang</small></div><div class="bk-in" id="loop">${loopHtml()}</div><div class="bk-cf"></div></div></div>
            </div>
            <div class="lab-btns"><button type="button" class="btn" id="runBtn">▶ Jalankan</button><button type="button" class="btn amber" id="chkBtn">✓ Semak Program</button><button type="button" class="btn ghost" id="resetBtn">↺ Mula semula</button></div>
            <p class="inc-note" id="incNote" hidden></p>
          </div>
          <div class="lab-sim"><div class="lab-h"><h3>🖥️ Pratonton</h3><span class="sim-time" id="simTime">Berhenti</span></div><div id="simScene"></div><div class="tl-strip" id="tlStrip"></div></div>
        </div>
        <div class="fb" id="fb" aria-live="polite"></div>
      </div>${nextBtn("upload", "Seterusnya: ③ Salin & Upload")}`;
      const loopEl = $("#loop", host);
      const hrS = $$("#hrFlow .hr-s", host); let hrI = 0;
      const hrT = E.reduceMotion ? 0 : setInterval(() => { const seq = [0, 1, 2, 2, 2, 2]; const k = seq[hrI++ % seq.length]; hrS.forEach((el, i) => el.classList.toggle("on", i === k)); }, 850);
      const persist = () => { S.prog[m] = m === 3 ? { g: Z.g, y: Z.y } : Z.loop; save(); };
      const repaint = () => { loopEl.innerHTML = loopHtml(); };
      const incNote = () => { const n = flat().filter((b) => missing(b)).length, el = $("#incNote", host); el.hidden = !n; el.innerHTML = n ? `⚠️ <strong>${n} blok belum lengkap</strong> (bergaris merah). Pilih HIGH/LOW, pin atau taip masa. Blok yang belum lengkap diabaikan semasa ▶ Jalankan.` : ""; };
      const changed = () => { persist(); progChanged(); incNote(); restart(); const nb = $("#nextStn", host); if (nb) nb.hidden = true; $("#fb", host).innerHTML = ""; };
      loopEl.addEventListener("change", (e) => {
        const el = e.target.closest("[data-f]"), blk = e.target.closest("[data-i]");
        if (!el || !blk) return;
        const b = Z[blk.dataset.z][+blk.dataset.i];
        if (el.dataset.f === "ms") { if (el.value.trim() === "") b.ms = null; else { let v = Math.round(+el.value); if (!isFinite(v) || v < 0) v = 0; if (v > 20000) v = 20000; b.ms = v; if (String(v) !== el.value) el.value = v; } }
        else b[el.dataset.f] = el.value;
        const ok = !missing(b); blk.classList.toggle("need", !ok); el.classList.toggle("q", el.dataset.f === "ms" ? !hasMs(b) : !el.value);
        if (ok) blk.removeAttribute("title"); else blk.title = "Belum lengkap: " + missing(b);
        changed();
      });
      loopEl.addEventListener("input", (e) => { const el = e.target.closest("input[data-f=ms]"); if (el) el.dispatchEvent(new Event("change", { bubbles: true })); });
      loopEl.addEventListener("click", (e) => { const x = e.target.closest(".bk-x"); if (x) { const p = x.parentElement; Z[p.dataset.z].splice(+p.dataset.i, 1); repaint(); changed(); beep(400, 60, 0.03, "sine"); } });
      // Seret dan lepas antara zon
      let drag = null;
      const ph = document.createElement("div"); ph.className = "bk-ph";
      const zones = () => $$(".bk-zone[data-zone]", loopEl);
      const addTo = (t) => { const z = m === 3 ? (Z.g.length < 3 ? "g" : "y") : "loop"; Z[z].push(mk[t]()); repaint(); changed(); beep(900, 50, 0.03, "sine"); };
      const startDrag = (e, src) => {
        if (e.button > 0 || e.target.closest("select, input, .bk-x")) return;
        drag = { sx: e.clientX, sy: e.clientY, src, from: src.dataset.z ? [src.dataset.z, +src.dataset.i] : null, kind: src.dataset.new, on: false, id: e.pointerId };
      };
      const onMove = (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        if (!drag.on) {
          if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 6) return;
          drag.on = true;
          const r = drag.src.getBoundingClientRect(); drag.ox = e.clientX - r.left; drag.oy = e.clientY - r.top;
          drag.ghost = drag.src.cloneNode(true); drag.ghost.classList.add("bk-ghost"); drag.ghost.style.width = r.width + "px"; document.body.appendChild(drag.ghost);
          if (drag.from) drag.src.classList.add("bk-lift");
          document.body.classList.add("dragging");
        }
        e.preventDefault();
        drag.ghost.style.transform = `translate(${e.clientX - drag.ox}px, ${e.clientY - drag.oy}px)`;
        let zone = null;
        for (const z of zones()) { const r = z.getBoundingClientRect(); if (e.clientX > r.left - 50 && e.clientX < r.right + 80 && e.clientY > r.top - 22 && e.clientY < r.bottom + 22) { zone = z; break; } }
        drag.zone = zone;
        $("#pal", host).classList.toggle("bin", !zone && !!drag.from);
        if (zone) {
          const kids = $$(".placed", zone).filter((k) => !k.classList.contains("bk-lift"));
          let idx = kids.length;
          for (let i = 0; i < kids.length; i++) { const kr = kids[i].getBoundingClientRect(); if (e.clientY < kr.top + kr.height / 2) { idx = i; break; } }
          drag.to = idx;
          const before = kids[idx] || zone.querySelector(".bk-slot, .bk-drop");
          if (before) zone.insertBefore(ph, before); else zone.appendChild(ph);
        } else if (ph.parentNode) ph.remove();
      };
      const onUp = (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        const d = drag; drag = null;
        document.body.classList.remove("dragging"); $("#pal", host).classList.remove("bin");
        if (ph.parentNode) ph.remove();
        if (!d.on) { if (d.kind) addTo(d.kind); return; }
        d.ghost.remove();
        if (d.zone) {
          const zk = d.zone.dataset.zone;
          let b, to = d.to;
          if (d.from) { b = Z[d.from[0]].splice(d.from[1], 1)[0]; if (d.from[0] === zk && d.from[1] < to) to--; } else b = mk[d.kind]();
          Z[zk].splice(Math.min(to, Z[zk].length), 0, b); beep(900, 50, 0.03, "sine");
        } else if (d.from) { Z[d.from[0]].splice(d.from[1], 1); beep(400, 60, 0.03, "sine"); }
        repaint(); changed();
      };
      $("#pal", host).addEventListener("pointerdown", (e) => { const b = e.target.closest(".pal-b"); if (b) startDrag(e, b); });
      loopEl.addEventListener("pointerdown", (e) => { const b = e.target.closest(".placed"); if (b) startDrag(e, b); });
      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      $("#pal", host).addEventListener("keydown", (e) => { const b = e.target.closest(".pal-b"); if (b && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); addTo(b.dataset.new); } });
      // Pratonton
      let R = null, running = false;
      const scene = $("#simScene", host);
      const drawScene = (st, sim) => {
        scene.innerHTML = m === 3 ? junction(st) : `<div class="sim12">${towerScene(!!st[2], sim && sim.fast.size > 0)}</div>`;
      };
      function run() {
        if (R) R.stop();
        running = true; $("#runBtn", host).textContent = "■ Henti";
        const W = m === 3 ? 14000 : 6000;
        let lastSeg = -2; const simNow = segments(flat());
        R = runner(scene, flat(), drawScene, { time: (t) => {
          const si = segAt(simNow, t);
          if (si !== lastSeg) { lastSeg = si; const sg = si >= 0 ? simNow.segs[si] : null; $$("[data-k]", loopEl).forEach((el) => { const k = +el.dataset.k; el.classList.toggle("run", sg ? k >= sg.from && k <= sg.to : !simNow.total && !el.classList.contains("need")); el.classList.toggle("wait", !!sg && k === sg.to); }); }
          $("#simTime", host).textContent = "⏱ " + secs(Math.floor(t / 100) * 100); const n = $(".ts-now", host); if (n) n.style.left = ((t % W) / W) * 100 + "%"; } });
        $("#tlStrip", host).innerHTML = stripHtml(m, R.sim);
      }
      function stop() { if (R) R.stop(); R = null; running = false; $$("[data-k]", loopEl).forEach((el) => el.classList.remove("run", "wait")); $("#runBtn", host).textContent = "▶ Jalankan"; $("#simTime", host).textContent = "Berhenti"; drawScene({}, null); $("#tlStrip", host).innerHTML = stripHtml(m, null); }
      function restart() { if (running) run(); }
      $("#runBtn", host).addEventListener("click", () => { if (running) stop(); else { run(); beep(700, 60, 0.03, "sine"); } });
      stop(); incNote();
      let tries = 0;
      $("#chkBtn", host).addEventListener("click", () => {
        const p = flat(), bad = p.findIndex((b) => missing(b));
        let r;
        if (bad >= 0) { const el = $(`[data-k="${bad}"]`, loopEl); if (el) { el.classList.remove("shakeb"); void el.offsetWidth; el.classList.add("shakeb"); } r = `Ada blok yang <strong>belum lengkap</strong> (bergaris merah): ${missing(p[bad])}. Setiap blok mesti diisi penuh.`; }
        else r = D.check(segments(p), p);
        if (!running) run();
        const fb = $("#fb", host);
        if (r === true) {
          fb.innerHTML = `<div class="win card"><div class="win-h"><span class="win-i">✅</span><div><h3>Program betul!</h3><p>Sekarang, salin kod dan muat naik ke ESP32 di stesen ③.</p></div></div></div>`;
          finish("prog", true, "PROGRAM BETUL!");
          return;
        }
        tries++;
        const hs = D.hints.slice(0, Math.min(tries, D.hints.length));
        fb.innerHTML = `<div class="hint card"><p class="hint-r">🤔 <strong>Belum lagi.</strong> ${r}</p>${hs.map((h, i) => `<p class="hint-h"><span>Petunjuk ${i + 1}</span>${h}</p>`).join("")}${tries > D.hints.length ? `<p class="hint-x">Masih tersangkut? Angkat tangan, instruktor akan membantu. 🙋</p>` : ""}</div>`;
        beep(260, 140, 0.035, "sawtooth");
      });
      let armedR = false;
      $("#resetBtn", host).addEventListener("click", (e) => {
        if (!armedR) { armedR = true; e.target.textContent = "Tekan lagi untuk sahkan"; setTimeout(() => { armedR = false; e.target.textContent = "↺ Mula semula"; }, 2500); return; }
        armedR = false; e.target.textContent = "↺ Mula semula"; Z = D.start(); repaint(); changed();
      });
      if (ST.prog) $("#fb", host).innerHTML = `<div class="win card"><div class="win-h"><span class="win-i">✅</span><div><h3>Program betul!</h3><p>Teruskan ke ③ Salin & Upload.</p></div></div></div>`;
      return () => { clearInterval(hrT); if (R) R.stop(); window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); window.removeEventListener("pointercancel", onUp); };
    }

    /* ---------------- ③ Salin & Upload (Arduino IDE maya) ---------------- */
    const BLANK = "void setup() {\n  // put your setup code here, to run once:\n\n}\n\nvoid loop() {\n  // put your main code here, to run repeatedly:\n\n}\n";
    function uploadStation(host) {
      const src = code(flat());
      const needBoot = m === 1;
      host.innerHTML = `<div class="card stn-card"><div class="lab-h"><h2>③ Salin & Upload</h2></div>
        <p class="lead">Inilah latihan untuk langkah sebenar di sesi hardware: <strong>salin kod → tampal dalam Arduino IDE → Upload</strong>.</p>
        <div class="up-grid">
          <div><h3 class="up-h"><span class="up-n">1</span> Salin kod program kamu</h3>
            <div class="copy-row"><button type="button" class="btn" id="copyBtn">📋 Salin kod</button><span id="copyMsg" aria-live="polite"></span></div>
            <pre class="code small" id="srcCode">${esc(src)}</pre>
            <h3 class="up-h"><span class="up-n">2</span> Tampal dalam Arduino IDE</h3><p>Klik di dalam ruang kod Arduino IDE, tekan <span class="kbd">Ctrl</span> + <span class="kbd">A</span> (pilih semua), kemudian <span class="kbd">Ctrl</span> + <span class="kbd">V</span> (tampal). <button type="button" class="linkish small-l" id="pasteHelp">Tak boleh tampal?</button></p>
            <h3 class="up-h"><span class="up-n">3</span> Tekan ➜ Upload</h3><p>Semak papan <strong>ESP32 Dev Module</strong> dan port <strong>COM3</strong>. ${needBoot ? "Jika tersangkut di <strong>Connecting…</strong>, tekan butang <strong>BOOT</strong> pada ESP32." : ""}</p>
            <div class="mini-esp"><svg viewBox="-20 -10 400 140" id="miniEsp" aria-label="ESP32: tekan butang BOOT jika diperlukan"></svg><small>Tekan <strong>BOOT</strong> pada papan ini jika diminta.</small></div>
          </div>
          <div class="ide" role="group" aria-label="Arduino IDE maya">
            <div class="ide-bar"><span class="ide-dots"><i></i><i></i><i></i></span>sketch_nov19a | Arduino IDE</div>
            <div class="ide-tools"><button type="button" class="ide-btn" id="verBtn" title="Verify">✓</button><button type="button" class="ide-btn up" id="upBtn" title="Upload">➜</button>
              <span class="ide-sel">🧩 ESP32 Dev Module</span><span class="ide-sel">🔌 COM3</span></div>
            <div class="ide-tab">sketch_nov19a.ino</div>
            <textarea class="ide-code" id="ideCode" spellcheck="false" aria-label="Ruang kod Arduino IDE">${esc(BLANK)}</textarea>
            <div class="ide-prog" id="ideProg" hidden><i></i></div>
            <pre class="ide-out" id="ideOut" aria-live="polite">Output</pre>
          </div>
        </div>
      </div>${nextBtn("test", "Seterusnya: ④ Uji")}`;
      let boot = false, phase = "idle", timers = [];
      const clr = () => { timers.forEach(clearTimeout); timers = []; };
      const out = $("#ideOut", host), prog = $("#ideProg", host);
      const paintEsp = () => { $("#miniEsp", host).innerHTML = board(0, 0, { pwr: true, boot, led: false }); };
      paintEsp();
      const log = (t, c) => { out.innerHTML += `\n<span class="${c || ""}">${esc(t)}</span>`; out.scrollTop = out.scrollHeight; };
      $("#copyBtn", host).addEventListener("click", async () => {
        if (await E.copyText(src)) $("#copyMsg", host).textContent = "✓ Kod disalin! Sekarang tampal dalam Arduino IDE.";
        else { const r = document.createRange(); r.selectNodeContents($("#srcCode", host)); const s2 = getSelection(); s2.removeAllRanges(); s2.addRange(r); $("#copyMsg", host).textContent = "Kod dipilih. Tekan Ctrl + C untuk salin."; }
        beep(1000, 50, 0.03, "sine");
      });
      $("#pasteHelp", host).addEventListener("click", () => { $("#ideCode", host).value = src; $("#ideCode", host).focus(); beep(900, 50, 0.03, "sine"); });
      const norm = (t) => t.replace(/\r/g, "").replace(/[ \t]+$/gm, "").trim();
      function compile() {
        const t = norm($("#ideCode", host).value), want = norm(src);
        if (t === want) return true;
        if ((t.match(/void\s+setup\s*\(/g) || []).length > 1) return "error: redefinition of 'void setup()'\n💡 Kod lama masih ada. Tekan Ctrl + A dahulu untuk pilih SEMUA, kemudian Ctrl + V.";
        if (t === norm(BLANK)) return "empty";
        return "differ";
      }
      $("#verBtn", host).addEventListener("click", () => {
        clr(); out.innerHTML = "Compiling sketch...";
        const r = compile();
        timers.push(setTimeout(() => {
          if (r === true) log("Sketch uses 268645 bytes (20%) of program storage space.", "ok");
          else if (r === "empty") log("Sketch uses 260321 bytes (19%)… tetapi ini kod kosong! 💡 Tampal kod kamu dahulu.", "warn");
          else if (r === "differ") log("💡 Kod ini tidak sama dengan program kamu. Salin semula dari langkah 1, kemudian Ctrl + A dan Ctrl + V.", "warn");
          else log(r, "err");
        }, 700));
      });
      $("#upBtn", host).addEventListener("click", () => {
        if (phase === "busy" || phase === "connect") return;
        clr(); boot = false; paintEsp();
        out.innerHTML = "Compiling sketch..."; phase = "busy";
        const r = compile();
        if (r !== true) {
          timers.push(setTimeout(() => {
            phase = "idle";
            if (r === "empty") log("💡 Ini masih kod kosong Arduino IDE. Tampal kod program kamu dahulu (Ctrl + A, kemudian Ctrl + V).", "warn");
            else if (r === "differ") log("💡 Kod ini tidak sama dengan program kamu. Salin semula dari langkah 1, kemudian Ctrl + A dan Ctrl + V.", "warn");
            else { log("Compilation error:", "err"); log(r, "err"); }
            beep(260, 140, 0.035, "sawtooth");
          }, 800));
          return;
        }
        timers.push(setTimeout(() => { log("Sketch uses 268645 bytes (20%) of program storage space."); log("esptool.py v4.6\nSerial port COM3"); out.innerHTML += "\nConnecting..."; phase = "connect"; connect(0); }, 1100));
      });
      function connect(n) {
        if (phase !== "connect") return;
        if (!needBoot || boot) { writing(); return; }
        out.innerHTML += "."; out.scrollTop = out.scrollHeight;
        if (n === 6) { log("💡 Tersangkut di Connecting? Tekan butang BOOT pada ESP32!", "warn"); out.innerHTML += "\nConnecting..."; }
        if (n > 28) { phase = "idle"; log("A fatal error occurred: Failed to connect to ESP32: No serial data received.", "err"); log("💡 Tekan ➜ Upload sekali lagi, dan tekan BOOT semasa Connecting…", "warn"); return; }
        timers.push(setTimeout(() => connect(n + 1), 450));
      }
      function writing() {
        phase = "busy";
        log("\nChip is ESP32-D0WD-V3 (revision v3.1)\nUploading stub...\nRunning stub...");
        prog.hidden = false; let pc = 0;
        const step = () => {
          pc += 10; prog.firstElementChild.style.width = pc + "%";
          log(`Writing at 0x000${(16 + pc).toString(16)}000... (${pc} %)`);
          if (pc < 100) timers.push(setTimeout(step, 260));
          else timers.push(setTimeout(() => {
            log("Leaving...\nHard resetting via RTS pin...");
            log("Done uploading. ✅", "ok"); phase = "idle"; boot = false; paintEsp();
            finish("upload", true, "DONE UPLOADING!");
          }, 400));
        };
        timers.push(setTimeout(step, 400));
      }
      $("#miniEsp", host).addEventListener("pointerdown", (e) => {
        const p = e.target.closest("g"); // butang BOOT di kawasan kiri atas papan
        const sv = $("#miniEsp", host), pt = sv.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const q = pt.matrixTransform(sv.getScreenCTM().inverse());
        if (Math.hypot(q.x - 30, q.y - 36) < 18) {
          boot = true; paintEsp(); beep(600, 40, 0.03, "square");
          if (phase === "connect") { log("\n(BOOT ditekan) 👍", "ok"); }
          setTimeout(() => { boot = false; paintEsp(); }, 700);
        }
        void p;
      });
      if (ST.upload) { out.innerHTML = "Output\nDone uploading. ✅"; }
      return clr;
    }

    /* ---------------- ④ Uji ---------------- */
    function testStation(host) {
      const B = S.bench[m] || FULL();
      host.innerHTML = `<div class="card stn-card"><div class="lab-h"><h2>④ Uji</h2><span class="sim-time" id="simTime"></span></div>
        <p class="lead">Program sudah dimuat naik. ESP32 kini menjalankan <strong>Main loop</strong> berulang-ulang, tanpa komputer pun!</p>
        <div class="test-grid"><div id="tBench"></div><div id="tScene"></div></div>
        ${m === 3 ? `<div class="vlegend"><span><b class="pos">+</b> pin HIGH mengeluarkan 3.3 V</span><span><b class="neg">−</b> GND (0 V)</span><span><i class="flw"></i> titik kuning = arus mengalir dari + ke −</span></div>` : ""}
        <div id="tWin"></div></div>`;
      const R = runner(host, flat(), (st) => {
        $("#tBench", host).innerHTML = benchSvg({ layout: E.layout(), m, bench: m === 3 ? B : Object.assign(FULL(), { esp: true, usb: true }), lit: st });
        $("#tScene", host).innerHTML = m === 3 ? junction(st) : towerScene(!!st[2], false);
      }, { time: (t) => { $("#simTime", host).textContent = "⏱ " + secs(Math.floor(t / 100) * 100); } });
      const fresh = !S.done[doneKey];
      ST.test = true; S.done[doneKey] = true; save(); paintNav();
      $("#tWin", host).innerHTML = `<div class="win"><div class="win-h"><span class="win-i">🎉</span><div><h2>Misi ${m} Siap${names.length ? `, ${esc(E.pairName())}` : ""}!</h2><p>${D.done}</p></div></div>
        ${D.extra ? `<p class="extra">${D.extra}</p>` : ""}
        <p class="extra">🔧 Dalam <strong>sesi hardware</strong> nanti, kamu akan buat langkah yang <strong>sama</strong> dengan ESP32 sebenar, dan menyalin kod yang sama dari laman ini ke Arduino IDE.</p>
        <p class="wait">⏳ Tunggu <strong>kata kunci</strong> daripada pensyarah untuk ke bahagian seterusnya.</p></div>`;
      if (fresh) { chime(); confetti(); if (E.mini) E.mini.say(`MISI ${m} SIAP!`); }
      return () => R.stop();
    }

    paintNav();
    go(cur);
  }

  // Program pasangan dari Makmal Maya (untuk halaman Hardware). Kembali ke contoh jika belum siap.
  function savedProg(m) {
    const sv = S.prog && S.prog[m];
    if (!S.done || !S.done["maya" + m] || !sv) return { prog: SAMPLE[m], own: false };
    if (m === 3) return Array.isArray(sv.g) ? { prog: RED().concat(sv.g, sv.y), own: true } : { prog: SAMPLE[3], own: false };
    return Array.isArray(sv) ? { prog: sv, own: true } : { prog: SAMPLE[m], own: false };
  }

  window.EBPLab = { mk, code, segments, merged, staticBlocks, benchSvg, FULL, MDATA, SAMPLE, savedProg, UNITS, runner, junction, towerScene, stripHtml, secs, segAt, RED };
  if (/^maya\d$/.test(document.body.dataset.step || "")) window.EBP_PAGE = labPage;
})();
