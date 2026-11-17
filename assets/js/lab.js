/* Makmal Maya: blok gaya TUNIOT (seret dan lepas), penjana kod, simulator dan lukisan litar.
   window.EBPLab dikongsi dengan halaman Hardware (hw.js). */
(function () {
  "use strict";
  const E = window.EBP;
  const { $, $$, esc, board, pinXY, beep, chime, confetti, S, save, MISSIONS } = E;

  /* ================= Blok ================= */
  const PINS = ["25", "26", "27", "32", "33"];
  const PIN_COL = { 25: "merah", 26: "kuning", 27: "hijau" };
  const mk = { led: (v = "HIGH") => ({ t: "led", v }), dw: (pin = "25", v = "HIGH") => ({ t: "dw", pin, v }), delay: (ms = 1000) => ({ t: "delay", ms }) };
  const LABEL = { led: "Integrated LED Stat", dw: "DigitalWrite PIN#", delay: "Delay Ms" };

  const sel = (f, val, opts, lab, ro) => ro ? `<span class="bk-f">${esc(opts.find((o) => o[0] === val)?.[1] || val)} ▾</span>` :
    `<select class="bk-f" data-f="${f}" aria-label="${esc(lab)}">${opts.map(([v, t]) => `<option value="${v}"${v === val ? " selected" : ""}>${esc(t)}</option>`).join("")}</select>`;
  const HL = [["HIGH", "HIGH"], ["LOW", "LOW"]];
  function blockHtml(b, i, ro) {
    const n = i + 1;
    if (b.t === "led") return `<span class="bk-h">${LABEL.led} ${sel("v", b.v, HL, `Blok ${n}: keadaan LED`, ro)}</span>`;
    if (b.t === "dw") return `<span class="bk-h">${LABEL.dw} ${sel("pin", b.pin, PINS.map((p) => [p, "D" + p]), `Blok ${n}: pin`, ro)} STAT ${sel("v", b.v, HL, `Blok ${n}: keadaan`, ro)}</span>`;
    return `<span class="bk-h">${LABEL.delay} <span class="bk-num">${ro ? `<span>${b.ms}</span>` : `<input type="number" data-f="ms" value="${b.ms}" min="0" max="20000" step="100" inputmode="numeric" aria-label="Blok ${n}: masa dalam milisaat">`}</span></span>`;
  }
  const cls = (b) => (b.t === "delay" ? "bk delay" : "bk io");
  // Program sebagai blok baca sahaja (untuk halaman Hardware)
  function staticBlocks(prog) {
    return `<div class="bk-ws ro" role="img" aria-label="Susunan blok TUNIOT"><div class="bk-c"><div class="bk-ch">Setup</div><div class="bk-in empty"></div><div class="bk-ch">Main loop</div>
      <div class="bk-in">${prog.map((b, i) => `<div class="${cls(b)}">${blockHtml(b, i, true)}</div>`).join("")}</div><div class="bk-cf"></div></div></div>`;
  }

  /* ================= Kod (sama seperti TUNIOT) ================= */
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

  /* ================= Simulasi =================
     Satu pusingan Main loop dipecah kepada segmen {ms, st}: keadaan pin semasa setiap Delay.
     Keadaan pin dibawa ke pusingan seterusnya (seperti ESP32 sebenar). */
  function segments(prog) {
    let st = { 2: 0, 25: 0, 26: 0, 27: 0, 32: 0, 33: 0 };
    let segs = [];
    for (let round = 0; round < 2; round++) {
      segs = []; let flick = new Set();
      prog.forEach((b) => {
        if (b.t === "delay") { if (b.ms > 0) segs.push({ ms: b.ms, st: Object.assign({}, st) }); }
        else { const p = b.t === "led" ? 2 : +b.pin, v = b.v === "HIGH" ? 1 : 0; if (st[p] !== v) flick.add(p); st[p] = v; }
      });
      segs.flick = flick;
    }
    const total = segs.reduce((a, s) => a + s.ms, 0);
    if (!total) {
      // tiada Delay: ESP32 mengulang terlalu laju. Pin yang bertukar nampak malap.
      const f = new Set(); const st2 = Object.assign({}, st);
      prog.forEach((b) => { if (b.t !== "delay") { const p = b.t === "led" ? 2 : +b.pin, v = b.v === "HIGH" ? 1 : 0; if (st2[p] !== v) f.add(p); st2[p] = v; } });
      return { segs: [{ ms: 1000, st: Object.assign({}, st) }], total: 0, fast: f };
    }
    return { segs, total, fast: new Set() };
  }
  // Gabung segmen berturut yang sama (secara kitaran) untuk pin tertentu
  function merged(sim, pins) {
    const key = (s) => pins.map((p) => s.st[p]).join("");
    let out = [];
    sim.segs.forEach((s) => { const k = key(s); if (out.length && out[out.length - 1].k === k) out[out.length - 1].ms += s.ms; else out.push({ k, ms: s.ms, st: s.st }); });
    if (out.length > 1 && out[0].k === out[out.length - 1].k) { out[0].ms += out.pop().ms; }
    return out;
  }
  const stAt = (sim, t) => {
    if (!sim.total) return sim.segs[0].st;
    let x = t % sim.total;
    for (const s of sim.segs) { if (x < s.ms) return s.st; x -= s.ms; }
    return sim.segs[sim.segs.length - 1].st;
  };
  const secs = (ms) => (ms / 1000).toLocaleString("ms-MY", { maximumFractionDigits: 2 }) + " s";
  const colName = (k3) => { const on = []; if (k3[0] === "1") on.push("merah"); if (k3[1] === "1") on.push("kuning"); if (k3[2] === "1") on.push("hijau"); return on.length ? on.join(" + ") : "semua padam"; };

  /* ================= Lukisan litar Misi 3 (susunan A atau B) ================= */
  const BX = 250, BY = 280, BK = 1.1;
  const UNITS = [{ pin: "27", c: "hijau", col: "#22c55e", W: 230 }, { pin: "26", c: "kuning", col: "#f5c400", W: 430 }, { pin: "25", c: "merah", col: "#ef3b2f", W: 630 }];
  const WCOL = { 27: "#1f9d4c", 26: "#e0a800", 25: "#d93a2b", GND: "#222" };
  function circuit(o = {}) {
    // o: { layout: "A"|"B", wires: true|false|{pin:bool}, st: {25,26,27}, labels: true }
    const lay = o.layout || "A", st = o.st || {}, showW = o.wires === undefined ? true : o.wires;
    const px = (n) => pinXY(BX, BY, BK, "top", n);
    const yStart = lay === "B" ? 272 : px("D25")[1];
    let s = "";
    // Breadboard (LED)
    s += `<rect x="140" y="14" width="620" height="166" rx="10" class="bb"/><path d="M155,32 H745" class="rail-n"/><text x="148" y="37" class="bb-t" text-anchor="end">−</text>`;
    for (let x = 165; x <= 745; x += 20) s += `<circle cx="${x}" cy="32" r="2.6" class="hole"/>`;
    ["a", "b", "c", "d", "e"].forEach((r, i) => { s += `<text x="152" y="${74 + i * 20}" class="bb-t" text-anchor="middle">${r}</text>`; for (let x = 170; x <= 740; x += 20) s += `<circle cx="${x}" cy="${70 + i * 20}" r="2.6" class="hole"/>`; });
    // Unit LED + perintang
    UNITS.forEach((u) => {
      const L = u.W + 80, on = !!st[u.pin];
      s += `<path d="M${u.W},110 H${u.W + 22} M${L - 22},110 H${L}" class="lead"/><rect x="${u.W + 22}" y="102" width="36" height="16" rx="7" class="res-b"/>`;
      s += [2, 2, 1].map((c, i) => `<rect x="${u.W + 28 + i * 7}" y="102" width="4" height="16" fill="${["#d22", "#d22", "#7a4a1e"][i]}"/>`).join("") + `<rect x="${u.W + 50}" y="102" width="4" height="16" fill="#c9a227"/>`;
      s += `<path d="M${L},70 V58" class="lead"/><path d="M${L + 18},44 L${L + 20},32" class="lead"/>`;
      s += `<circle cx="${L + 9}" cy="50" r="${on ? 22 : 0}" fill="${u.col}" opacity=".35" class="ledglow"/><path d="M${L - 3},60 V46 a12,12 0 0 1 24,0 V60Z" fill="${on ? u.col : u.col + "55"}" stroke="${on ? "#fff" : "#888"}" stroke-width="1.5" class="ledbody${on ? " on" : ""}"/>`;
      s += `<text x="${L + 9}" y="196" class="bb-lab" text-anchor="middle">LED ${u.c}</text>`;
    });
    // ESP32 (+ breadboard 1 dalam susunan B)
    if (lay === "B") {
      s += `<rect x="215" y="258" width="480" height="168" rx="10" class="bb"/>`;
      for (let x = 225; x <= 685; x += 18.5 * BK) s += `<circle cx="${x.toFixed(1)}" cy="272" r="2.6" class="hole"/>`;
      s += `<text x="700" y="290" class="bb-lab">Breadboard 1</text><text x="770" y="40" class="bb-lab">Breadboard 2</text>`;
    } else s += `<text x="770" y="40" class="bb-lab">Breadboard</text>`;
    s += board(BX, BY, { k: BK, pwr: true, hi: ["t:D25", "t:D26", "t:D27", "t:GND"] });
    // Wayar
    const chan = { 25: 196, 26: 216, 27: 236, GND: 252 };
    const wd = (pin) => {
      if (pin === "GND") { const [x] = px("GND"); return `M${x},${yStart} V${chan.GND} H165 V32`; }
      const [x] = px("D" + pin), u = UNITS.find((q) => q.pin === pin);
      return `M${x},${yStart} V${chan[pin]} H${u.W} V150`;
    };
    ["27", "26", "25", "GND"].forEach((p) => {
      const show = showW === true || (typeof showW === "object" && showW[p]);
      if (show) s += `<path d="${wd(p)}" class="cw" stroke="${WCOL[p]}"/><circle cx="${p === "GND" ? 165 : UNITS.find((q) => q.pin === p).W}" cy="${p === "GND" ? 32 : 150}" r="5" fill="${WCOL[p]}"/>` + (lay === "A" ? `<rect x="${px(p === "GND" ? "GND" : "D" + p)[0] - 5}" y="${yStart - 22}" width="10" height="18" rx="2" class="fconn"/>` : `<circle cx="${px(p === "GND" ? "GND" : "D" + p)[0]}" cy="${yStart}" r="4.5" fill="${WCOL[p]}"/>`);
      else if (typeof showW === "object") { const [x] = px(p === "GND" ? "GND" : "D" + p); s += `<text x="${x}" y="${yStart - 10}" class="qmark" text-anchor="middle">?</text>`; }
    });
    return `<svg viewBox="0 0 900 430" class="circ" role="img" aria-label="Litar Misi 3, susunan ${lay}: pin D27, D26, D25 ke perintang dan LED hijau, kuning, merah; GND ke rel negatif">${s}</svg>`;
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
      <circle cx="260" cy="44" r="${on ? 46 : 0}" fill="#4ea3ff" opacity="${fast ? 0.15 : 0.28}" class="beam"/>
      <circle cx="260" cy="44" r="11" fill="${on ? "#7cc0ff" : "#1d2c4a"}" stroke="#0d1830" stroke-width="2" class="${on ? "bon" : ""}"/>
      ${on && !fast ? `<path d="M110,90 l30,-6 l-30,-6 l6,6Z" fill="#cfd8df" class="plane"/>` : ""}
    </svg>`;
  }
  function junction(st) {
    const r = st[25], y = st[26], g = st[27];
    return `<svg viewBox="0 0 520 220" class="sim-svg junc" aria-hidden="true">
      <rect width="520" height="220" fill="#cfe9f7"/><rect y="140" width="520" height="60" fill="#3b4249"/><path d="M0,170 H520" stroke="#fff" stroke-width="3" stroke-dasharray="22 16"/>
      <rect y="200" width="520" height="20" fill="#7dbb6f"/><rect x="300" y="142" width="6" height="56" fill="#fff" opacity=".8"/>
      <rect x="318" y="60" width="6" height="82" fill="#5b6670"/><rect x="302" y="10" width="38" height="92" rx="8" fill="#1d2328"/>
      <circle cx="321" cy="30" r="10" fill="#ef3b2f" opacity="${r ? 1 : 0.2}"/><circle cx="321" cy="56" r="10" fill="#f5c400" opacity="${y ? 1 : 0.2}"/><circle cx="321" cy="82" r="10" fill="#22c55e" opacity="${g ? 1 : 0.2}"/>
      <g id="jcar"><rect x="-64" y="-24" width="64" height="18" rx="6" fill="#e4572e"/><path d="M-52,-24 l9,-12 h26 l9,12Z" fill="#e4572e"/><circle cx="-50" cy="-5" r="6" fill="#111"/><circle cx="-14" cy="-5" r="6" fill="#111"/></g>
    </svg>`;
  }

  /* ================= Halaman Makmal Maya ================= */
  const MDATA = {
    1: {
      story: "Malam semakin gelap. Kapal terbang perlu nampak menara bandar kita! Tugas kamu: <strong>hidupkan lampu menara</strong>. Lampu menara disambung ke LED biru pada pin <strong>GPIO2</strong> ESP32.",
      tasks: ["Seret blok <strong>Integrated LED Stat</strong> ke dalam <strong>Main loop</strong>.", "Pilih keadaan yang membuat LED <strong>menyala</strong>.", "Tekan <strong>▶ Jalankan</strong>, kemudian <strong>✓ Semak Misi</strong>."],
      pal: ["led"], start: [],
      hints: ["Blok <strong>Integrated LED Stat</strong> mengawal LED biru GPIO2. Seret ia dari Kotak Blok ke ruang di bawah <strong>Main loop</strong>.", "Ingat bahasa pin: <strong>HIGH = 3.3 V = menyala</strong>, LOW = 0 V = padam. Semak pilihan dalam blok kamu."],
      pins: [2],
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
      story: "Lampu menara sudah menyala, tetapi lampu amaran kapal terbang mesti <strong>berkelip</strong> supaya lebih mudah dilihat. Tugas kamu: jadikan lampu <strong>menyala 1 saat, padam 1 saat</strong>, berulang-ulang.",
      tasks: ["Program Misi 1 sudah ada. Tambah blok <strong>Delay Ms</strong> dan blok LED.", "Susun supaya LED: <strong>menyala → tunggu → padam → tunggu</strong>.", "Ingat: <strong>1 saat = 1000 ms</strong> (milisaat)."],
      pal: ["led", "delay"], start: [mk.led("HIGH")],
      hints: ["Lampu yang berkelip perlukan <strong>empat</strong> langkah: menyala, tunggu, padam, tunggu. Berapa blok LED dan berapa blok Delay Ms yang kamu perlukan?", "Main loop berulang terus dari bawah ke atas semula. Jika tiada Delay selepas LED padam, LED padam terlalu sekejap untuk dilihat. Semak juga nombor dalam setiap Delay Ms."],
      pins: [2],
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
      extra: "⭐ <strong>Cabaran:</strong> tukar nombor Delay Ms supaya lampu berkelip lebih laju (cth. 200 ms). Tekan ▶ untuk lihat!"
    },
    3: {
      story: "Simpang di tengah bandar sesak! Bandar perlukan <strong>lampu isyarat</strong>. Lampu merah, kuning dan hijau disambung ke pin <strong>D25, D26 dan D27</strong>. Turutan: <strong>merah 3 saat → hijau 3 saat → kuning 1 saat</strong>, kemudian ulang.",
      tasks: ["<strong>Langkah A:</strong> sambung wayar ke pin yang betul.", "<strong>Langkah B:</strong> bahagian lampu <strong>merah</strong> sudah disusun. Tambah bahagian <strong>hijau</strong> dan <strong>kuning</strong>.", "Hanya <strong>satu</strong> lampu menyala pada satu masa."],
      pal: ["dw", "delay"], start: [mk.dw("25", "HIGH"), mk.dw("26", "LOW"), mk.dw("27", "LOW"), mk.delay(3000)],
      hints: ["Lihat bahagian merah yang sudah ada: ia <strong>menghidupkan</strong> satu lampu, <strong>memadam</strong> lampu lain, kemudian <strong>menunggu</strong>. Setiap warna perlukan corak yang sama.", "Semak pin: <strong>D25 = merah, D26 = kuning, D27 = hijau</strong>. Sebelum lampu baharu menyala, lampu sebelumnya mesti dipadam (LOW). Tekan ▶ dan perhati jalur masa."],
      pins: [25, 26, 27],
      check(sim) {
        if (!sim.total) return "Lampu bertukar terlalu laju. Setiap warna perlukan <strong>Delay Ms</strong>.";
        const m = merged(sim, [25, 26, 27]);
        const want = [["100", 3000], ["001", 3000], ["010", 1000]];
        const ok = m.length === 3 && [0, 1, 2].some((s) => want.every((w, i) => m[(s + i) % 3].k === w[0] && m[(s + i) % 3].ms === w[1]));
        if (ok) return true;
        return "Simulator menunjukkan: " + m.map((x) => `<strong>${colName(x.k)}</strong> ${secs(x.ms)}`).join(" → ") + ". Misi meminta: <strong>merah</strong> 3 s → <strong>hijau</strong> 3 s → <strong>kuning</strong> 1 s.";
      },
      done: "Lampu isyarat bandar berfungsi! Kereta kini bergerak dengan selamat.",
      extra: "⭐ <strong>Cabaran:</strong> cipta corak sendiri, cth. <em>lampu berlari</em> (hijau → kuning → merah, setiap satu 300 ms)."
    }
  };

  function labPage() {
    const step = document.body.dataset.step, m = +step.slice(-1), D = MDATA[m], M = MISSIONS[m];
    S.prog = S.prog || {};
    let prog = Array.isArray(S.prog[m]) ? S.prog[m].map((b) => Object.assign({}, b)) : D.start.map((b) => Object.assign({}, b));
    const names = S.names.filter((n) => n.trim());
    const pilot = names.length === 2 ? names[(m + 1) % 2] : null, nav = names.length === 2 ? names[m % 2] : null;
    const doneKey = "maya" + m;
    let tries = 0, wiresOk = m !== 3 || !!S.wired;

    $("#main").innerHTML = `
      <section class="hero"><div class="wrap">
        <span class="kick">💻 Makmal Maya · Misi ${m} daripada 3</span>
        <h1>${M.ico} ${esc(M.t)}</h1>
        <p>${D.story}</p>
        ${pilot ? `<p class="roles">👩‍✈️ Juruterbang: <strong>${esc(pilot)}</strong> &nbsp;·&nbsp; 🧭 Navigator: <strong>${esc(nav)}</strong></p>` : `<p class="roles">👩‍✈️🧭 Ingat: tukar peranan Juruterbang dan Navigator setiap misi!</p>`}
      </div></section>
      <section class="sec"><div class="wrap">
        <div class="card task"><h2>🎯 Tugas</h2><ol>${D.tasks.map((t) => `<li>${t}</li>`).join("")}</ol></div>
        ${m === 3 ? `<div class="card wire-step" id="wireStep"></div>` : ""}
        <div class="lab ${m === 3 && !wiresOk ? "locked" : ""}" id="lab">
          <div class="lab-ws card">
            <div class="lab-h"><h2>🧩 Susun Blok</h2><span class="lab-tip">Seret blok, atau tekan untuk tambah</span></div>
            <div class="ws-grid">
              <div class="palette" id="pal" aria-label="Kotak blok"><div class="pal-h">Kotak Blok</div>${D.pal.map((t) => `<button type="button" class="${cls(mk[t]())} pal-b" data-new="${t}">${blockHtml(mk[t](), 0, true)}</button>`).join("")}<div class="pal-bin" aria-hidden="true">🗑 Seret ke sini untuk buang</div></div>
              <div class="bk-ws"><div class="bk-c"><div class="bk-ch">Setup</div><div class="bk-in empty"></div><div class="bk-ch">Main loop</div><div class="bk-in" id="loop"></div><div class="bk-cf"></div></div></div>
            </div>
            <div class="lab-btns"><button type="button" class="btn" id="runBtn">▶ Jalankan</button><button type="button" class="btn amber" id="chkBtn">✓ Semak Misi</button><button type="button" class="btn ghost" id="codeBtn">📝 Lihat kod</button><button type="button" class="btn ghost" id="resetBtn">↺ Mula semula</button></div>
            <pre class="code" id="codeBox" hidden></pre>
          </div>
          <div class="lab-sim card">
            <div class="lab-h"><h2>🖥️ Simulator</h2><span class="sim-time" id="simTime">Berhenti</span></div>
            <div id="simScene"></div>
            <div class="tl-strip" id="tlStrip"></div>
          </div>
        </div>
        <div class="fb" id="fb" aria-live="polite"></div>
      </div></section>`;

    /* ---------- Langkah A (Misi 3): sambung wayar ---------- */
    if (m === 3) {
      const WANT = { hijau: "27", kuning: "26", merah: "25", gnd: "GND" };
      const got = S.wireSel || {};
      const opts = [["", "Pilih pin…"], ["25", "D25"], ["26", "D26"], ["27", "D27"], ["GND", "GND"]];
      const paintW = () => {
        const shown = { 27: got.hijau === "27", 26: got.kuning === "26", 25: got.merah === "25", GND: got.gnd === "GND" };
        $("#wireStep").innerHTML = `<div class="lab-h"><h2>🔌 Langkah A: Sambung Wayar</h2><div class="seg lay-seg" role="group" aria-label="Susunan litar"><button type="button" data-l="A" class="${E.layout() === "A" ? "on" : ""}">A · Jumper F-M</button><button type="button" data-l="B" class="${E.layout() === "B" ? "on" : ""}">B · Dua breadboard</button></div></div>
          <div class="ws2"><div class="circ-wrap">${circuit({ layout: E.layout(), wires: shown, st: {} })}</div>
          <div class="wsel">${[["hijau", "LED hijau", "#1f9d4c"], ["kuning", "LED kuning", "#e0a800"], ["merah", "LED merah", "#d93a2b"], ["gnd", "Rel negatif (−)", "#222"]].map(([k, t, c]) => `<label class="wrow ${got[k] ? (got[k] === WANT[k] ? "ok" : "bad") : ""}"><span class="wdot" style="background:${c}"></span><span>Wayar ke <strong>${t}</strong> disambung ke pin</span>
            <select data-w="${k}">${opts.map(([v, tt]) => `<option value="${v}"${got[k] === v ? " selected" : ""}>${tt}</option>`).join("")}</select></label>`).join("")}
            <p class="wnote" id="wNote">${wiresOk ? "✅ Semua wayar betul! Sekarang susun blok di Langkah B." : "Petunjuk: lihat jadual pin dalam cerita misi di atas. Setiap litar mesti kembali ke <strong>GND</strong>."}</p></div></div>`;
        $$("[data-w]", $("#wireStep")).forEach((s2) => s2.addEventListener("change", () => {
          got[s2.dataset.w] = s2.value; S.wireSel = got;
          const ok = Object.keys(WANT).every((k) => got[k] === WANT[k]);
          if (got[s2.dataset.w] === WANT[s2.dataset.w]) beep(1100, 70, 0.03, "sine"); else if (s2.value) beep(260, 120, 0.03, "sawtooth");
          if (ok && !wiresOk) { wiresOk = true; S.wired = true; chime(); $("#lab").classList.remove("locked"); if (E.mini) E.mini.say("WAYAR SIAP!"); }
          save(); paintW();
        }));
        $$(".lay-seg button", $("#wireStep")).forEach((b) => b.addEventListener("click", () => { S.layout = b.dataset.l; save(); paintW(); }));
      };
      paintW();
    }

    /* ---------- Ruang kerja blok ---------- */
    const loopEl = $("#loop");
    const persist = () => { S.prog[m] = prog; save(); if (!$("#codeBox").hidden) $("#codeBox").textContent = code(prog); };
    function paint() {
      loopEl.innerHTML = prog.length ? prog.map((b, i) => `<div class="${cls(b)} placed" data-i="${i}">${blockHtml(b, i, false)}<button type="button" class="bk-x" aria-label="Buang blok ${i + 1}">✕</button></div>`).join("")
        : `<div class="bk-drop">Seret blok ke sini</div>`;
    }
    paint();
    loopEl.addEventListener("change", (e) => {
      const el = e.target.closest("[data-f]"), blk = e.target.closest("[data-i]");
      if (!el || !blk) return;
      const b = prog[+blk.dataset.i];
      if (el.dataset.f === "ms") { let v = Math.round(+el.value); if (!isFinite(v) || v < 0) v = 0; if (v > 20000) v = 20000; b.ms = v; el.value = v; }
      else b[el.dataset.f] = el.value;
      persist(); restart();
    });
    loopEl.addEventListener("input", (e) => { const el = e.target.closest('[data-f="ms"]'), blk = e.target.closest("[data-i]"); if (el && blk && el.value !== "") { const v = Math.max(0, Math.min(20000, Math.round(+el.value) || 0)); prog[+blk.dataset.i].ms = v; persist(); } });
    loopEl.addEventListener("click", (e) => { const x = e.target.closest(".bk-x"); if (x) { prog.splice(+x.parentElement.dataset.i, 1); paint(); persist(); restart(); beep(400, 60, 0.03, "sine"); } });

    /* ---------- Seret dan lepas (Pointer Events: tetikus dan sentuhan) ---------- */
    let drag = null;
    const startDrag = (e, src) => {
      if (e.button > 0) return;
      if (e.target.closest("select, input, .bk-x")) return;
      const fromI = src.dataset.i !== undefined ? +src.dataset.i : null;
      drag = { sx: e.clientX, sy: e.clientY, src, fromI, kind: src.dataset.new, on: false, id: e.pointerId };
    };
    const ph = document.createElement("div"); ph.className = "bk-ph";
    function moveDrag(e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.on) {
        if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 6) return;
        drag.on = true;
        const r = drag.src.getBoundingClientRect();
        drag.ox = e.clientX - r.left; drag.oy = e.clientY - r.top;
        drag.ghost = drag.src.cloneNode(true); drag.ghost.classList.add("bk-ghost"); drag.ghost.style.width = r.width + "px";
        document.body.appendChild(drag.ghost);
        if (drag.fromI !== null) drag.src.classList.add("bk-lift");
        document.body.classList.add("dragging");
      }
      e.preventDefault();
      drag.ghost.style.transform = `translate(${e.clientX - drag.ox}px, ${e.clientY - drag.oy}px)`;
      const lr = loopEl.getBoundingClientRect();
      const inside = e.clientX > lr.left - 60 && e.clientX < lr.right + 80 && e.clientY > lr.top - 40 && e.clientY < lr.bottom + 50;
      drag.inside = inside;
      $("#pal").classList.toggle("bin", !inside && drag.fromI !== null && !!document.elementFromPoint(e.clientX, e.clientY)?.closest("#pal"));
      if (inside) {
        const kids = $$(".placed", loopEl).filter((k) => !k.classList.contains("bk-lift"));
        let idx = kids.length;
        for (let i = 0; i < kids.length; i++) { const kr = kids[i].getBoundingClientRect(); if (e.clientY < kr.top + kr.height / 2) { idx = i; break; } }
        drag.to = idx;
        const empty = $(".bk-drop", loopEl); if (empty) empty.remove();
        if (idx < kids.length) loopEl.insertBefore(ph, kids[idx]); else loopEl.appendChild(ph);
      } else if (ph.parentNode) ph.remove();
    }
    function endDrag(e) {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag; drag = null;
      document.body.classList.remove("dragging"); $("#pal").classList.remove("bin");
      if (ph.parentNode) ph.remove();
      if (!d.on) { // tekan sahaja: tambah di hujung
        if (d.kind) { prog.push(mk[d.kind]()); paint(); persist(); restart(); beep(900, 50, 0.03, "sine"); flashLast(); }
        return;
      }
      d.ghost.remove();
      if (d.inside) {
        let b;
        if (d.fromI !== null) { b = prog.splice(d.fromI, 1)[0]; } else b = mk[d.kind]();
        prog.splice(Math.min(d.to, prog.length), 0, b);
        beep(900, 50, 0.03, "sine");
      } else if (d.fromI !== null) { prog.splice(d.fromI, 1); beep(400, 60, 0.03, "sine"); }
      paint(); persist(); restart();
    }
    const flashLast = () => { const l = $$(".placed", loopEl).pop(); if (l) { l.classList.add("pop"); } };
    $("#pal").addEventListener("pointerdown", (e) => { const b = e.target.closest(".pal-b"); if (b) startDrag(e, b); });
    loopEl.addEventListener("pointerdown", (e) => { const b = e.target.closest(".placed"); if (b) startDrag(e, b); });
    window.addEventListener("pointermove", moveDrag, { passive: false });
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    // Papan kekunci: Enter / Space pada blok dalam Kotak Blok menambahnya
    $("#pal").addEventListener("keydown", (e) => { const b = e.target.closest(".pal-b"); if (b && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); prog.push(mk[b.dataset.new]()); paint(); persist(); restart(); } });

    /* ---------- Simulator ---------- */
    let sim = null, t0 = 0, raf = 0, running = false;
    const scene = $("#simScene");
    function drawScene(st, fast) {
      if (m === 3) {
        scene.innerHTML = `<div class="sim3">${circuit({ layout: E.layout(), wires: true, st })}${junction(st)}</div>`;
      } else {
        const on = !!st[2];
        scene.innerHTML = `<div class="sim12">${towerScene(on, fast)}<svg viewBox="-20 -10 400 140" class="sim-board" aria-hidden="true">${board(0, 0, { pwr: true, led: on })}</svg></div>`;
      }
    }
    function strip(simR) {
      const pins = D.pins, W = 6000;
      const rowsH = pins.map((p) => {
        let x = 0, html = "";
        if (!simR.total) return `<div class="ts-row"><span class="ts-l">${p === 2 ? "LED" : "D" + p}</span><div class="ts-bar"><i class="${simR.fast.has(p) ? "dim" : simR.segs[0].st[p] ? "on" : ""} c${p}" style="left:0;width:100%"></i></div></div>`;
        while (x < W) { for (const sg of simR.segs) { if (x >= W) break; const w = Math.min(sg.ms, W - x); if (sg.st[p]) html += `<i class="on c${p}" style="left:${(x / W) * 100}%;width:${(w / W) * 100}%"></i>`; x += w; } }
        return `<div class="ts-row"><span class="ts-l">${p === 2 ? "LED" : "D" + p}</span><div class="ts-bar">${html}<b class="ts-now"></b></div></div>`;
      }).join("");
      $("#tlStrip").innerHTML = `<div class="ts-h">Jalur masa (6 saat pertama)</div>${rowsH}<div class="ts-ax"><span>0 s</span><span>3 s</span><span>6 s</span></div>`;
    }
    let lastKey = "";
    function frame(now) {
      const t = now - t0, st = stAt(sim, t), key = JSON.stringify(st);
      if (key !== lastKey) { drawScene(st, sim.fast.size > 0); lastKey = key; }
      $("#simTime").textContent = "⏱ " + secs(Math.floor(t / 100) * 100);
      const nowEl = $$(".ts-now"); nowEl.forEach((n) => (n.style.left = ((t % 6000) / 6000) * 100 + "%"));
      if (m === 3) { // kereta di simpang
        const car = $("#jcar"); if (car) { carX = moveCar(carX, st); car.setAttribute("transform", `translate(${carX.toFixed(0)} 196)`); }
      }
      raf = requestAnimationFrame(frame);
    }
    let carX = -70, lastNow = 0;
    function moveCar(x, st) {
      const n = performance.now(), dt = Math.min(60, n - (lastNow || n)); lastNow = n;
      const stop = 296, before = x <= stop && x > stop - 140;
      let v = 0.16 * dt; if (!st[27] && before) v = Math.max(0, Math.min(v, (stop - x) * 0.08));
      x += v; if (x > 600) x = -70; return x;
    }
    function run() {
      sim = segments(prog); strip(sim); running = true; t0 = performance.now(); lastKey = "";
      $("#runBtn").textContent = "■ Henti";
      cancelAnimationFrame(raf);
      if (E.reduceMotion) { drawScene(stAt(sim, 0), sim.fast.size > 0); $("#simTime").textContent = "Berjalan"; }
      else raf = requestAnimationFrame(frame);
    }
    function stop() { running = false; cancelAnimationFrame(raf); $("#runBtn").textContent = "▶ Jalankan"; $("#simTime").textContent = "Berhenti"; drawScene({}, false); $("#tlStrip").innerHTML = `<p class="ts-empty">Tekan <strong>▶ Jalankan</strong> untuk melihat program kamu bekerja.</p>`; }
    function restart() { if (running) run(); }
    $("#runBtn").addEventListener("click", () => { if (running) stop(); else { run(); beep(700, 60, 0.03, "sine"); } });
    stop();

    /* ---------- Semak misi + petunjuk ---------- */
    const fb = $("#fb");
    function showDone(fresh) {
      fb.innerHTML = `<div class="win card"><div class="win-h"><span class="win-i">🎉</span><div><h2>Misi ${m} Siap${names.length ? `, ${esc(E.pairName())}` : ""}!</h2><p>${D.done}</p></div></div>
        <div class="win-code"><h3>📝 Kod Arduino yang dijana</h3><p>Inilah kod yang <strong>sama</strong> yang TUNIOT akan hasilkan dalam sesi hardware nanti. ESP32 membaca kod ini, bukan blok.</p><pre class="code">${esc(code(prog))}</pre></div>
        ${D.extra ? `<p class="extra">${D.extra}</p>` : ""}
        <p class="wait">⏳ Tunggu <strong>kata kunci</strong> daripada pensyarah untuk ke misi seterusnya.</p></div>`;
      if (fresh) { chime(); confetti(); if (E.mini) E.mini.say(`MISI ${m} SIAP!`); }
    }
    $("#chkBtn").addEventListener("click", () => {
      if (m === 3 && !wiresOk) { fb.innerHTML = `<div class="hint card">🔌 Selesaikan <strong>Langkah A: Sambung Wayar</strong> dahulu.</div>`; return; }
      const s = segments(prog), r = D.check(s, prog);
      if (!running) run();
      if (r === true) {
        const fresh = !S.done[doneKey]; S.done[doneKey] = true; save(); showDone(fresh);
        fb.scrollIntoView({ behavior: E.reduceMotion ? "auto" : "smooth", block: "start" });
        return;
      }
      tries++;
      const hs = D.hints.slice(0, Math.min(tries, D.hints.length));
      fb.innerHTML = `<div class="hint card"><p class="hint-r">🤔 <strong>Belum lagi.</strong> ${r}</p>${hs.map((h, i) => `<p class="hint-h"><span>Petunjuk ${i + 1}</span>${h}</p>`).join("")}${tries > D.hints.length ? `<p class="hint-x">Masih tersangkut? Angkat tangan, instruktor akan membantu. 🙋</p>` : ""}</div>`;
      beep(260, 140, 0.035, "sawtooth");
    });
    $("#codeBtn").addEventListener("click", () => { const c = $("#codeBox"); c.hidden = !c.hidden; c.textContent = code(prog); $("#codeBtn").textContent = c.hidden ? "📝 Lihat kod" : "📝 Tutup kod"; });
    let armed = false;
    $("#resetBtn").addEventListener("click", (e) => {
      if (!armed) { armed = true; e.target.textContent = "Tekan lagi untuk sahkan"; setTimeout(() => { armed = false; e.target.textContent = "↺ Mula semula"; }, 2500); return; }
      armed = false; e.target.textContent = "↺ Mula semula";
      prog = D.start.map((b) => Object.assign({}, b)); paint(); persist(); restart(); fb.innerHTML = "";
    });
    if (S.done[doneKey]) showDone(false);
  }

  window.EBPLab = { mk, code, segments, merged, staticBlocks, circuit, MDATA, blockHtml, UNITS };
  if (/^maya\d$/.test(document.body.dataset.step || "")) window.EBP_PAGE = labPage;
})();
