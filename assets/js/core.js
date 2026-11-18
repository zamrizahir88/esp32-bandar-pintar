/* ESP32 Bandar Pintar: teras laman (langkah, kata kunci, LCD, peta perjalanan, mod fasilitator).
   Setiap halaman memuatkan config.js, core.js dan skrip halamannya sendiri, yang mendaftar window.EBP_PAGE. */
(function () {
  "use strict";
  const CFG = window.EBP_CONFIG;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Langkah (setiap satu halaman) ---------------- */
  const STEPS = [
    { id: "hadapan", page: "index.html", title: "Halaman Hadapan", st: 0, lcd: "SELAMAT DATANG" },
    { id: "perjalanan", page: "perjalanan.html", title: "Peta Perjalanan", st: 0, lcd: "PETA PERJALANAN" },
    { id: "bandar", page: "bandar.html", title: "Bandar Pintar", st: 1, lcd: "BANDAR PINTAR" },
    { id: "esp32", page: "esp32.html", title: "Kenali ESP32", st: 2, lcd: "KENALI ESP32" },
    { id: "led", page: "led.html", title: "LED & Perintang", st: 3, lcd: "LED & PERINTANG" },
    { id: "maya1", page: "maya-1.html", title: "Makmal Maya: Misi 1", st: 4, m: 1, lcd: "MAYA: MISI 1" },
    { id: "maya2", page: "maya-2.html", title: "Makmal Maya: Misi 2", st: 4, m: 2, lcd: "MAYA: MISI 2" },
    { id: "maya3", page: "maya-3.html", title: "Makmal Maya: Misi 3", st: 4, m: 3, lcd: "MAYA: MISI 3" },
    { id: "hw1", page: "hardware-1.html", title: "Hardware: Misi 1", st: 5, m: 1, lcd: "HARDWARE: MISI 1" },
    { id: "hw2", page: "hardware-2.html", title: "Hardware: Misi 2", st: 5, m: 2, lcd: "HARDWARE: MISI 2" },
    { id: "hw3", page: "hardware-3.html", title: "Hardware: Misi 3", st: 5, m: 3, lcd: "HARDWARE: MISI 3" },
    { id: "disko", page: "disko.html", title: "Misi Khas: Lampu Disko", st: 5, lcd: "MISI KHAS: DISKO" },
    { id: "penutup", page: "penutup.html", title: "Penutup", st: 6, lcd: "TAHNIAH!" }
  ];
  const STATIONS = [
    { ico: "🚀", t: "Mula" },
    { ico: "🏙️", t: "Bandar Pintar" },
    { ico: "🧠", t: "Kenali ESP32" },
    { ico: "💡", t: "LED & Perintang" },
    { ico: "💻", t: "Makmal Maya", n: 3 },
    { ico: "🔧", t: "Hardware Sebenar", n: 3 },
    { ico: "🎓", t: "Penutup" }
  ];

  const MISSIONS = [
    null,
    { n: 1, t: "Lampu Menara", ico: "🗼", lcd: "LAMPU MENARA", sum: "Hidupkan lampu di puncak menara (LED biru GPIO2)." },
    { n: 2, t: "Lampu Amaran Berkelip", ico: "✈️", lcd: "LAMPU BERKELIP", sum: "Jadikan lampu menara berkelip: 1 saat menyala, 1 saat padam." },
    { n: 3, t: "Lampu Isyarat Simpang", ico: "🚦", lcd: "LAMPU ISYARAT", sum: "Kawal 3 LED: merah, hijau, kuning, mengikut turutan." }
  ];

  /* ---------------- Simpanan (PC ini sahaja) ---------------- */
  const KEY = "ebp-v1";
  const DEF = { names: ["", ""], unlocked: 1, done: {}, layout: null, fac: false };
  let S;
  try { S = Object.assign({}, DEF, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { S = Object.assign({}, DEF); }
  if (!Array.isArray(S.names)) S.names = ["", ""];
  if (typeof S.done !== "object" || !S.done) S.done = {};
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storan disekat: teruskan tanpa simpan */ } };

  const stepIdx = (id) => STEPS.findIndex((s) => s.id === id);
  const here = () => stepIdx(document.body.dataset.step || "hadapan");
  const pairName = (sep = " & ") => S.names.map((n) => n.trim()).filter(Boolean).join(sep);
  const lcdNames = () => { const n = S.names.map((x) => x.trim()).filter(Boolean); const a = n.join(" & "); return a.length <= 20 ? a : n.join("&"); };
  const layout = () => S.layout || CFG.SUSUNAN || "A";

  /* ---------------- Penapis nama ---------------- */
  const BAD = ["babi", "bodoh", "sial", "pukimak", "puki", "pantat", "lancau", "celaka", "bangsat", "keparat", "butoh", "kote", "bahlul", "haram", "anjing", "fuck", "shit", "bitch", "dick", "sex", "porn", "stupid", "idiot", "lahanat", "jubur", "kimak", "cibai", "pepek", "tetek"];
  function cleanName(v) {
    const t = String(v || "").toUpperCase().replace(/[^A-Z0-9 '\-]/g, "").replace(/\s+/g, " ").trim().slice(0, 9);
    const flat = t.toLowerCase().replace(/[^a-z]/g, "");
    if (BAD.some((w) => flat.includes(w))) return { ok: false, v: "" };
    return { ok: true, v: t };
  }

  /* ---------------- Fon LCD 5×7 (baris, 5 bit) ---------------- */
  const F = {
    "0": "0E11131519110E", "1": "040C040404040E", "2": "0E11010204081F", "3": "1F02040201110E", "4": "02060A121F0202", "5": "1F101E0101110E",
    "6": "0608101E11110E", "7": "1F010204080808", "8": "0E11110E11110E", "9": "0E11110F01020C", " ": "00000000000000", "!": "04040404040004",
    "&": "0C12140815120D", "'": "0C040800000000", "(": "02040808080402", ")": "08040202020408", "+": "0004041F040400", ",": "000000000C0408",
    "-": "0000001F000000", ".": "00000000000C0C", "/": "00010204081000", ":": "000C0C000C0C00", "<": "02040810080402", "=": "00001F001F0000",
    ">": "08040201020408", "?": "0E110102040004", "A": "0E1111111F1111", "B": "1E11111E11111E", "C": "0E11101010110E", "D": "1C12111111121C",
    "E": "1F10101E10101F", "F": "1F10101E101010", "G": "0E11101711110F", "H": "1111111F111111", "I": "0E04040404040E", "J": "0702020202120C",
    "K": "11121418141211", "L": "1010101010101F", "M": "111B1515111111", "N": "11111915131111", "O": "0E11111111110E", "P": "1E11111E101010",
    "Q": "0E11111115120D", "R": "1E11111E141211", "S": "0F10100E01011E", "T": "1F040404040404", "U": "1111111111110E", "V": "11111111110A04",
    "W": "1111111515150A", "X": "11110A040A1111", "Y": "1111110A040404", "Z": "1F01020408101F", "_": "0000000000001F", "♥": "000A1F1F0E0400",
    "█": "1F1F1F1F1F1F1F", "*": "0004150E150400", "#": "0A0A1F0A1F0A0A", "%": "18190204081303", "»": "00140A050A1400", "✓": "00010212140800"
  };
  const glyph = (ch) => {
    const h = F[ch] || F["?"], rows = [];
    for (let i = 0; i < 7; i++) rows.push(parseInt(h.substr(i * 2, 2), 16) || 0);
    return rows;
  };

  /* ---------------- LCD (canvas) ---------------- */
  class LCD {
    constructor(canvas, cols, rows, o = {}) {
      this.c = canvas; this.cols = cols; this.rows = rows; this.on = !!o.on;
      this.d = o.dot || 6; this.g = o.gap || 1; this.m = o.margin || 14;
      this.buf = Array.from({ length: rows }, () => " ".repeat(cols));
      this.cursor = null; this.timers = []; this.flash = false;
      const cw = (5 * this.d + 4 * this.g), chw = cw + 2 * this.d, chh = 8 * (this.d + this.g) + this.d;
      this.cw = chw; this.ch = chh;
      canvas.width = this.m * 2 + cols * chw - 2 * this.d + this.d;
      canvas.height = this.m * 2 + rows * chh - this.d;
      this.ctx = canvas.getContext("2d");
      this.draw();
    }
    clearTimers() { this.timers.forEach((t) => clearTimeout(t) || clearInterval(t)); this.timers = []; }
    power(on) { this.on = on; if (!on) { this.clearTimers(); this.buf = this.buf.map(() => " ".repeat(this.cols)); this.cursor = null; } this.draw(); }
    pad(t) { t = String(t).toUpperCase(); return (t + " ".repeat(this.cols)).slice(0, this.cols); }
    center(t) { t = String(t).toUpperCase().slice(0, this.cols); const l = Math.floor((this.cols - t.length) / 2); return this.pad(" ".repeat(l) + t); }
    set(row, t, center) { this.buf[row] = center ? this.center(t) : this.pad(t); this.draw(); }
    setAll(lines, center) { lines.forEach((t, i) => (this.buf[i] = center ? this.center(t) : this.pad(t))); this.draw(); }
    // Taip baris demi baris, huruf demi huruf. Pulangkan Promise.
    type(lines, o = {}) {
      const speed = reduceMotion ? 0 : (o.speed || 45);
      const target = lines.map((t) => (o.center ? this.center(t) : this.pad(t)));
      return new Promise((done) => {
        if (!speed) { this.buf = target.slice(); this.draw(); return done(); }
        let r = 0, c = 0;
        if (o.clear !== false) this.buf = this.buf.map(() => " ".repeat(this.cols));
        const step = () => {
          if (!this.on) return done();
          if (r >= target.length) { this.cursor = null; this.draw(); return done(); }
          const line = target[r];
          // langkau ruang kosong di hujung baris
          if (line.slice(c).trim() === "") { r++; c = 0; this.timers.push(setTimeout(step, speed * 2)); return; }
          this.buf[r] = this.buf[r].slice(0, c) + line[c] + this.buf[r].slice(c + 1);
          if (line[c] !== " " && o.tick) o.tick();
          this.cursor = [r, c + 1 < this.cols ? c + 1 : c];
          c++; this.draw();
          this.timers.push(setTimeout(step, line[c - 1] === " " ? speed * 0.4 : speed));
        };
        step();
      });
    }
    marquee(row, text, ms = 260) {
      const t = "   " + String(text).toUpperCase() + "   ";
      let i = 0;
      const id = setInterval(() => {
        if (!this.on) return clearInterval(id);
        const s = (t + t).slice(i, i + this.cols);
        this.buf[row] = this.pad(s); this.draw(); i = (i + 1) % t.length;
      }, reduceMotion ? 1200 : ms);
      this.timers.push(id);
      return id;
    }
    blink(times = 2) {
      if (reduceMotion) return Promise.resolve();
      return new Promise((done) => {
        let n = 0;
        const id = setInterval(() => { this.flash = !this.flash; this.draw(); if (++n >= times * 2) { clearInterval(id); this.flash = false; this.draw(); done(); } }, 160);
        this.timers.push(id);
      });
    }
    draw() {
      const x = this.ctx, W = this.c.width, H = this.c.height;
      const on = this.on && !this.flash;
      const g = x.createLinearGradient(0, 0, 0, H);
      if (on) { g.addColorStop(0, "#2f7cf0"); g.addColorStop(1, "#1d56c4"); } else if (this.on) { g.addColorStop(0, "#5aa0ff"); g.addColorStop(1, "#3b7bea"); } else { g.addColorStop(0, "#1a2a44"); g.addColorStop(1, "#111c30"); }
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      const dOff = this.on ? "rgba(255,255,255,0.09)" : "rgba(255,255,255,0.03)", dOn = "#f2f8ff";
      for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
        const ch = this.buf[r][c], rows = glyph(ch);
        const ox = this.m + c * this.cw, oy = this.m + r * this.ch;
        const curHere = this.cursor && this.cursor[0] === r && this.cursor[1] === c;
        for (let yy = 0; yy < 8; yy++) for (let xx = 0; xx < 5; xx++) {
          const lit = this.on && ((yy < 7 && (rows[yy] >> (4 - xx)) & 1) || (curHere && yy === 7));
          x.fillStyle = lit ? dOn : dOff;
          x.fillRect(ox + xx * (this.d + this.g), oy + yy * (this.d + this.g), this.d, this.d);
        }
      }
      if (on) { x.fillStyle = "rgba(255,255,255,0.06)"; x.fillRect(0, 0, W, H * 0.45); }
    }
  }

  /* ---------------- Bunyi kecil (Web Audio) ---------------- */
  let AC = null;
  function beep(freq = 1800, ms = 18, vol = 0.03, type = "square") {
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === "suspended") AC.resume();
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = type; o.frequency.value = freq; g.gain.value = vol;
      o.connect(g); g.connect(AC.destination);
      const t = AC.currentTime; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
      o.start(t); o.stop(t + ms / 1000 + 0.02);
    } catch (e) { /* tiada bunyi */ }
  }
  const chime = () => { [880, 1175, 1568].forEach((f, i) => setTimeout(() => beep(f, 160, 0.05, "sine"), i * 110)); };

  /* ---------------- Konfeti ---------------- */
  function confetti(n = 120) {
    if (reduceMotion) return;
    const cv = document.createElement("canvas");
    cv.className = "confetti"; document.body.appendChild(cv);
    const x = cv.getContext("2d"); cv.width = innerWidth; cv.height = innerHeight;
    const cols = ["#0b6e6e", "#f2b705", "#e4572e", "#2f7cf0", "#26a269", "#ffffff"];
    const P = Array.from({ length: n }, () => ({ x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * 0.5, vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 3, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3, s: 6 + Math.random() * 6, c: cols[(Math.random() * cols.length) | 0] }));
    const t0 = performance.now();
    (function f(now) {
      x.clearRect(0, 0, cv.width, cv.height);
      P.forEach((p) => { p.x += p.vx; p.y += p.vy; p.r += p.vr; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); x.restore(); });
      if (now - t0 < 3800) requestAnimationFrame(f); else cv.remove();
    })(t0);
  }

  /* ---------------- Lukisan ESP32 DevKit 30-pin (SVG) ----------------
     Papan dilukis mendatar: USB di kiri, antena di kanan.
     Baris atas = header kiri papan (EN di hujung antena), baris bawah = header kanan. */
  const TOP = ["EN", "VP", "VN", "D34", "D35", "D32", "D33", "D25", "D26", "D27", "D14", "D12", "D13", "GND", "VIN"];
  const BOT = ["D23", "D22", "TX0", "RX0", "D21", "D19", "D18", "D5", "TX2", "RX2", "D4", "D2", "D15", "GND", "3V3"];
  const T = (x, y, t, a = "start", c = "") => `<text x="${x}" y="${y}" text-anchor="${a}"${c ? ` class="${c}"` : ""}>${esc(t)}</text>`;
  const pinXY = (bx, by, k, row, name) => {
    const i = (row === "top" ? TOP : BOT).indexOf(name);
    return [bx + (318 - i * 18.5) * k, by + (row === "top" ? 9 : 111) * k];
  };
  const btnSvg = (x, y, lab, down, ly, id) =>
    `<g${id ? ` data-part="${id}"` : ""}><rect class="dk-btnb" x="${x - 10}" y="${y - 10}" width="20" height="20" rx="3"/><circle class="dk-btnc${down ? " down" : ""}" cx="${x}" cy="${y}" r="6.5"/>${T(x, y + ly, lab, "middle", "dk-t")}</g>`;
  // o: { k, pwr, led, hi: ["t:D25"], parts: true (tambah data-part untuk halaman Kenali ESP32) }
  function board(bx, by, o = {}) {
    const k = o.k || 1, hi = o.hi || [], P = (id) => (o.parts ? ` data-part="${id}"` : "");
    let s = `<g class="dk" transform="translate(${bx} ${by}) scale(${k})">`;
    s += `<rect class="dk-usb"${P("usb")} x="-14" y="44" width="32" height="32" rx="3"/>`;
    s += `<rect class="dk-pcb" x="0" y="0" width="360" height="120" rx="8"/>`;
    s += `<g${P("cip")}><rect class="dk-can" x="200" y="32" width="112" height="58" rx="4"/>${T(256, 58, "ESP-WROOM-32", "middle", "dk-can-t")}${T(256, 75, "Wi-Fi + Bluetooth", "middle", "dk-can-s")}</g>`;
    s += `<path class="dk-ant"${P("antena")} d="M322,32h24v12h-18v12h18v12h-18v12h18v12h-24"/>`;
    s += `<rect class="dk-chip"${P("usbcip")} x="94" y="44" width="30" height="32" rx="2"/>`;
    s += btnSvg(30, 36, "BOOT", o.boot, -16, o.parts && "boot") + btnSvg(30, 84, "EN", o.en, 26, o.parts && "en");
    s += `<g${P("pwr")}><circle class="dk-led red${o.pwr ? " on" : ""}" cx="146" cy="44" r="5"/>${T(155, 48, "PWR", "start", "dk-t")}</g>`;
    s += `<g${P("led2")}>${o.led ? '<circle class="dk-halo" cx="146" cy="78" r="18"/>' : ""}<circle class="dk-led blue${o.led ? " on" : ""}" cx="146" cy="78" r="5"/>${T(155, 82, "GPIO2", "start", "dk-t")}</g>`;
    [TOP, BOT].forEach((list, r) => list.forEach((p, i) => {
      const x = 318 - i * 18.5, on = hi.includes((r ? "b:" : "t:") + p);
      const part = o.parts ? ` data-part="${p === "GND" || p === "VIN" || p === "3V3" ? "kuasa" : "gpio"}"` : "";
      s += `<g${part}><circle class="dk-pin${on ? " hi" : ""}" cx="${x}" cy="${r ? 111 : 9}" r="4"/>${T(x, r ? 101 : 25, p, "middle", `dk-pl${on ? " hi" : ""}`)}</g>`;
    }));
    return s + "</g>";
  }

  /* ---------------- Rangka halaman: kepala, peta, kaki ---------------- */
  function journeyBar(idx) {
    const cur = STEPS[idx];
    return `<nav class="jb" aria-label="Peta perjalanan">${STATIONS.map((s, i) => {
      const stSteps = STEPS.map((x, j) => [x, j]).filter(([x]) => x.st === i);
      const reach = stSteps.some(([, j]) => j <= S.unlocked);
      const state = i < cur.st ? "done" : i === cur.st ? "now" : "next";
      const dots = s.n ? `<span class="jb-dots">${[1, 2, 3].map((m) => {
        const j = STEPS.findIndex((x) => x.st === i && x.m === m);
        return `<i class="${j < idx ? "d" : j === idx ? "n" : ""}"></i>`;
      }).join("")}</span>` : "";
      const first = stSteps.length ? stSteps[0][1] : 0;
      const tag = reach && i !== cur.st ? "a" : "span";
      const href = tag === "a" ? ` href="${STEPS[Math.min(first, S.unlocked)].page}"` : "";
      return `<${tag} class="jb-s ${state}"${href}${i === cur.st ? ' aria-current="step"' : ""}><span class="jb-i" aria-hidden="true">${s.ico}</span><span class="jb-t">${s.t}</span>${dots}</${tag}>`;
    }).join('<span class="jb-line" aria-hidden="true"></span>')}</nav>`;
  }

  function header(idx) {
    const h = document.createElement("header");
    h.className = "top";
    h.innerHTML = `<div class="wrap top-in">
        <div class="brand"><img src="assets/img/unimap-logo.png" alt="UniMAP" width="640" height="299" id="logoTap"><span class="brand-t"><strong>ESP32 Bandar Pintar</strong><small>Pusat TVET UniMAP</small></span></div>
        <button type="button" class="mini-lcd" id="miniLcd" title="Tukar nama pasangan"><span class="sr-only">Nama pasangan: ${esc(pairName() || "belum diisi")}. Tekan untuk tukar.</span><canvas aria-hidden="true"></canvas></button>
      </div>
      ${idx > 0 ? `<div class="wrap">${journeyBar(idx)}</div>` : ""}`;
    document.body.prepend(h);
    const cv = $("#miniLcd canvas", h);
    const L = new LCD(cv, 20, 2, { on: true, dot: 3, gap: 1, margin: 7 });
    const paint = () => L.setAll([lcdNames() || "JURUTERA MUDA", STEPS[idx].lcd], false);
    paint();
    EBP.mini = { lcd: L, paint, say: (t) => { L.set(1, t); L.blink(2).then(() => setTimeout(paint, 2500)); } };
    $("#miniLcd", h).addEventListener("click", () => nameDialog(paint));
    // Mod fasilitator: tekan logo 5 kali dengan cepat, atau Ctrl+Shift+F
    let taps = 0, tt;
    $("#logoTap", h).addEventListener("click", (e) => {
      taps++; clearTimeout(tt); tt = setTimeout(() => (taps = 0), 1500);
      if (taps >= 5) { taps = 0; facDialog(); }
    });
  }

  function footer() {
    const f = document.createElement("footer");
    f.className = "foot";
    f.innerHTML = `<div class="wrap">© 2026 ${esc(CFG.TEAM.oleh[0].nama)} · ${esc(CFG.TEAM.oleh[0].singkatan)}, Universiti Malaysia Perlis (UniMAP)${S.fac ? ' · <button type="button" class="linkish" id="facOpen">⚙ Mod fasilitator</button>' : ""}</div>`;
    document.body.appendChild(f);
    const b = $("#facOpen", f);
    if (b) b.addEventListener("click", facDialog);
  }

  /* ---------------- Dialog dalam halaman ---------------- */
  function dialog(html, o = {}) {
    const d = document.createElement("div");
    d.className = "dlg-back";
    d.innerHTML = `<div class="dlg${o.wide ? " wide" : ""}" role="dialog" aria-modal="true" aria-label="${esc(o.label || "Dialog")}"><button type="button" class="dlg-x" aria-label="Tutup">✕</button>${html}</div>`;
    document.body.appendChild(d);
    const close = () => { d.remove(); document.removeEventListener("keydown", key); if (o.onClose) o.onClose(); };
    const key = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", key);
    d.addEventListener("click", (e) => { if (e.target === d || e.target.closest(".dlg-x")) close(); });
    const f = d.querySelector("input, button:not(.dlg-x)"); if (f) setTimeout(() => f.focus(), 30);
    return { el: d, close };
  }

  function nameDialog(after) {
    const D = dialog(`<h2>Nama Pasangan</h2><p>Nama ini dipaparkan pada LCD di setiap halaman. Maksimum 9 huruf setiap nama.</p>
      <form class="names" id="nmForm"><label>Nama 1<input name="a" maxlength="9" autocomplete="off" value="${esc(S.names[0])}"></label>
      <label>Nama 2<input name="b" maxlength="9" autocomplete="off" value="${esc(S.names[1])}"></label>
      <p class="err" id="nmErr" role="alert"></p><button class="btn" type="submit">Simpan</button></form>`, { label: "Nama pasangan" });
    $("#nmForm", D.el).addEventListener("submit", (e) => {
      e.preventDefault();
      const a = cleanName(e.target.a.value), b = cleanName(e.target.b.value);
      if (!a.ok || !b.ok) { $("#nmErr", D.el).textContent = "Sila guna nama yang sopan."; return; }
      S.names = [a.v, b.v]; save(); D.close(); if (after) after();
    });
  }

  /* ---------------- Kata kunci ---------------- */
  const norm = (s) => String(s || "").toUpperCase().replace(/\s+/g, "").trim();
  const keyFor = (stepIndex) => { try { return atob(CFG.KEYS[stepIndex - 2] || ""); } catch (e) { return ""; } };

  function gate(idx) {
    const host = $("div#gate");
    if (!host) return;
    // Bar halaman: ‹ Sebelumnya (kiri) dan Seterusnya › (kanan) dalam satu baris
    const next = STEPS[idx + 1], prev = idx > 0 ? STEPS[idx - 1] : null;
    const back = prev
      ? `<a class="pg pg-prev" href="${prev.page}"><span class="pg-arr" aria-hidden="true">‹</span><span class="pg-tx"><span class="pg-k">Sebelumnya</span><strong>${esc(prev.title)}</strong></span></a>`
      : `<span class="pg pg-none" aria-hidden="true"></span>`;
    const wrap = (inner) => { host.innerHTML = `<nav class="pager${next ? "" : " last"}" aria-label="Halaman sebelum dan seterusnya">${back}${inner}</nav>`; };
    if (!next) { wrap(""); return; }
    const already = S.unlocked >= idx + 1;
    const needKey = idx + 1 >= 2;
    let target = next;
    const go = () => { location.href = target.page; };
    if (!needKey || already) {
      wrap(`<a class="pg pg-next" href="${next.page}" id="gateGo"><span class="pg-tx"><span class="pg-k">${idx === 0 ? "Mula" : "Seterusnya"}</span><strong>${esc(next.title)}</strong></span><span class="pg-arr" aria-hidden="true">›</span></a>`);
      $("#gateGo", host).addEventListener("click", () => { if (!needKey) { S.unlocked = Math.max(S.unlocked, idx + 1); save(); } });
      return;
    }
    wrap(`<form class="pg pg-lock" id="gateForm" autocomplete="off">
        <span class="pg-tx"><span class="pg-k">🔒 Seterusnya · perlu kata kunci</span><strong>${esc(next.title)}</strong></span>
        <span class="gate-in"><input id="gateKey" aria-label="Kata kunci" placeholder="Kata kunci" autocapitalize="characters" spellcheck="false"><button class="btn" type="submit">Buka 🔓</button></span>
        <span class="gate-msg" id="gateMsg" role="status" aria-live="polite">Tunggu arahan pensyarah. Kata kunci diberi bila semua sudah sedia.</span>
      </form>`);
    $("#gateForm", host).addEventListener("submit", (e) => {
      e.preventDefault();
      const v = norm($("#gateKey", host).value), msg = $("#gateMsg", host);
      if (!v) { msg.className = "gate-msg bad"; msg.textContent = "Taip kata kunci dahulu."; return; }
      // Halaman ini belum siap (kuiz / stesen / hardware): kata kunci belum boleh digunakan
      const bl = blocker(idx);
      if (bl) { msg.className = "gate-msg bad"; msg.innerHTML = "🔒 " + bl.t + "."; blockDialog(bl); return; }
      // Kata kunci halaman seterusnya, atau kata kunci halaman yang lebih jauh (cth. terus ke Penutup jika Misi Khas dilangkau)
      let hit = -1;
      for (let j = idx + 1; j < STEPS.length; j++) if (v === norm(keyFor(j))) { hit = j; break; }
      if (S.fac && v === "FAC") hit = idx + 1;
      if (hit > 0) {
        target = STEPS[hit];
        S.unlocked = Math.max(S.unlocked, hit); save();
        msg.className = "gate-msg ok"; msg.textContent = "✓ Betul! Membuka " + target.title + "…"; chime();
        setTimeout(go, reduceMotion ? 50 : 650);
      } else {
        msg.className = "gate-msg bad"; msg.textContent = "Kata kunci salah. Dengar semula arahan pensyarah, ya.";
        const f = $("#gateForm", host); f.classList.remove("shake"); void f.offsetWidth; f.classList.add("shake");
        beep(220, 160, 0.04, "sawtooth");
      }
    });
  }

  /* ---------------- Mod fasilitator ---------------- */
  function facDialog() {
    if (!S.fac) {
      const D = dialog(`<h2>Mod Fasilitator</h2><p>Untuk pensyarah dan instruktor sahaja.</p><form id="facF" class="names"><label>Kod fasilitator<input type="password" name="k" autocomplete="off"></label><p class="err" id="facErr" role="alert"></p><button class="btn" type="submit">Masuk</button></form>`, { label: "Mod fasilitator" });
      $("#facF", D.el).addEventListener("submit", (e) => {
        e.preventDefault();
        let ok = false; try { ok = norm(e.target.k.value) === norm(atob(CFG.FAC)); } catch (x) { ok = false; }
        if (!ok) { $("#facErr", D.el).textContent = "Kod salah."; return; }
        S.fac = true; save(); D.close(); facDialog();
      });
      return;
    }
    const rows = STEPS.map((s, i) => `<tr><td>${i < 2 ? "—" : i - 1}</td><td><a href="${s.page}">${esc(s.title)}</a></td><td><code>${i < 2 ? "(tiada)" : esc(keyFor(i))}</code></td></tr>`).join("");
    const D = dialog(`<h2>Mod Fasilitator</h2>
      <p>Kata kunci diberi kepada pelajar untuk <strong>membuka</strong> halaman di sebelahnya. Dalam mod ini, semua halaman boleh dibuka dari peta perjalanan.</p>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>Halaman (buka)</th><th>Kata kunci</th></tr></thead><tbody>${rows}</tbody></table></div>
      <h3>Susunan litar (PC ini)</h3>
      <div class="seg" role="group" aria-label="Susunan litar"><button type="button" data-l="A" class="${layout() === "A" ? "on" : ""}">A · Jumper F-M</button><button type="button" data-l="B" class="${layout() === "B" ? "on" : ""}">B · Dua breadboard</button></div>
      <h3>Mod Projektor</h3>
      <p class="small-mut">Besarkan tulisan dan gambar untuk paparan di projektor. Butang 🖥️ di bucu kiri bawah juga boleh digunakan.</p>
      <div id="facProj">${projSeg()}</div>
      <h3>PC ini</h3>
      <div class="fac-act"><button type="button" class="btn ghost" id="facAll">Buka semua halaman</button>
      <button type="button" class="btn ghost" id="facReset">Set semula PC ini (padam nama &amp; kemajuan)</button>
      <button type="button" class="btn ghost" id="facOut">Keluar mod fasilitator</button></div>`, { label: "Mod fasilitator", wide: true });
    $$("[data-l]", D.el).forEach((b) => b.addEventListener("click", () => { S.layout = b.dataset.l; save(); location.reload(); }));
    $("#facProj", D.el).addEventListener("click", (e) => { const b = e.target.closest("[data-pj]"); if (!b) return; setProj(+b.dataset.pj); $("#facProj", D.el).innerHTML = projSeg(); });
    $("#facAll", D.el).addEventListener("click", () => { S.unlocked = STEPS.length - 1; save(); location.reload(); });
    let armed = false;
    $("#facReset", D.el).addEventListener("click", (e) => {
      if (!armed) { armed = true; e.target.textContent = "Tekan sekali lagi untuk sahkan"; return; }
      try { localStorage.removeItem(KEY); localStorage.removeItem("ebp-cover-on"); } catch (x) { /* abaikan */ }
      location.href = "index.html";
    });
    $("#facOut", D.el).addEventListener("click", () => { S.fac = false; save(); location.reload(); });
  }
  document.addEventListener("keydown", (e) => { if (e.ctrlKey && e.shiftKey && (e.key === "F" || e.key === "f")) { e.preventDefault(); facDialog(); } });

  /* ---------------- Mod Projektor (fasilitator sahaja) ----------------
     Membesarkan header, kandungan dan footer. Saiz dihadkan supaya lebar kandungan tidak kurang daripada 1000 px
     (susun atur komputer kekal), jadi pada skrin kecil pembesaran mungkin kurang daripada yang dipilih. */
  const PROJ_KEY = "ebp-proj", PL = [["Biasa", 0], ["Besar", 1.25], ["Sangat Besar", 1.5]];
  let projLvl = 0;
  try { projLvl = Math.max(0, Math.min(2, +localStorage.getItem(PROJ_KEY) || 0)); } catch (x) { projLvl = 0; }
  function applyProj() {
    const want = S.fac ? PL[projLvl][1] : 0, root = document.documentElement;
    if (!want) { root.classList.remove("proj"); root.style.removeProperty("--pz"); window.EBP_PZ = 1; }
    else { const z = Math.max(1, Math.min(want, window.innerWidth / 1000)); root.classList.add("proj"); root.style.setProperty("--pz", z.toFixed(3)); window.EBP_PZ = z; }
    paintProj();
  }
  function setProj(l) { projLvl = l; try { localStorage.setItem(PROJ_KEY, String(l)); } catch (x) { /* abaikan */ } applyProj(); }
  const projSeg = () => `<div class="seg proj-seg" role="group" aria-label="Saiz paparan projektor">${PL.map(([t], i) => `<button type="button" data-pj="${i}" class="${i === projLvl ? "on" : ""}" aria-pressed="${i === projLvl}">${t}</button>`).join("")}</div>`;
  const projNote = () => { const z = window.EBP_PZ || 1, want = PL[projLvl][1]; return !want ? "Saiz biasa" : `Saiz sebenar: <strong>${Math.round(z * 100)}%</strong>${z < want - 0.01 ? " (dihadkan oleh lebar skrin)" : ""}`; };
  function paintProj() {
    let bar = document.getElementById("projBar");
    if (!S.fac) { if (bar) bar.parentNode.removeChild(bar); return; }
    if (!bar) {
      bar = document.createElement("div"); bar.id = "projBar"; bar.className = "projbar";
      document.body.appendChild(bar);
      bar.addEventListener("click", (e) => {
        const b = e.target.closest("[data-pj]"); if (b) { setProj(+b.dataset.pj); return; }
        if (e.target.closest(".pj-tog")) { bar.classList.toggle("open"); paintProj(); }
      });
    }
    const open = bar.classList.contains("open");
    bar.innerHTML = `<button type="button" class="pj-tog" aria-expanded="${open}" title="Mod Projektor">🖥️<span>${open ? "✕" : projLvl ? Math.round((window.EBP_PZ || 1) * 100) + "%" : "Projektor"}</span></button>${open ? `<div class="pj-pan"><strong>Mod Projektor</strong>${projSeg()}<small>${projNote()}</small><small class="pj-tip">Petua: tekan <kbd>F11</kbd> untuk skrin penuh.</small></div>` : ""}`;
  }
  window.addEventListener("resize", () => { if (S.fac && projLvl) applyProj(); });

  /* ---------------- Penunjuk ke kotak kata kunci (bila satu bahagian selesai) ---------------- */
  const gateNote = (msg) => `<div class="gnote"><p>${msg}</p><button type="button" class="btn amber" data-togate>🔑 Ke kotak kata kunci ↓</button></div>`;
  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-togate]")) return;
    const g = $("div#gate"); if (!g) return;
    g.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    const i = $("#gateKey"); if (i) setTimeout(() => i.focus({ preventScroll: true }), reduceMotion ? 0 : 500);
  });

  /* ---------------- Salin teks ke papan klip (dengan cara sandaran) ---------------- */
  async function copyText(t) {
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(t); return true; } } catch (e) { /* cuba cara sandaran */ }
    try {
      const ta = document.createElement("textarea");
      ta.value = t; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;left:-9999px;top:0;opacity:0";
      document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, t.length);
      const ok = document.execCommand("copy"); ta.remove(); return ok;
    } catch (e) { return false; }
  }

  /* ---------------- Kuiz ringkas ---------------- */
  // qs: [{ q, opts: [...], a: index, why }]
  // Kuiz: jawab semua soalan, tekan Semak. Semua mesti betul untuk lulus; jika ada yang salah, Ulang Semula mengosongkan semua jawapan.
  let quizOn = false;
  function quiz(el, qs, onDone) {
    quizOn = true;
    const id = (STEPS[here()] || {}).id || "q";
    S.quiz = S.quiz || {};
    const pick = {};
    let state = S.quiz[id] ? "pass" : "ask"; // ask | fail | pass
    function paint(res) {
      el.innerHTML = qs.map((q, i) => {
        const cls = state === "pass" ? " ok" : res ? (res[i] ? " good" : " bad") : "";
        return `<div class="qz${cls}" data-i="${i}"><p class="qz-q"><span class="qz-n">${i + 1}</span><span>${q.q}</span></p><div class="qz-o" role="radiogroup">${q.opts.map((o, j) => {
          const on = state === "pass" ? j === q.a : pick[i] === j;
          const mark = state === "pass" && j === q.a ? " right" : res && on ? (res[i] ? " right" : " wrong") : on ? " pick" : "";
          return `<button type="button" role="radio" aria-checked="${on}" data-j="${j}"${state === "ask" ? "" : " disabled"} class="${mark.trim()}">${o}</button>`;
        }).join("")}</div>${state === "pass" ? `<p class="qz-why">✓ ${q.why || "Betul!"}</p>` : res && !res[i] ? `<p class="qz-why bad">✗ Jawapan ini belum tepat.</p>` : ""}</div>`;
      }).join("") + `<div class="qz-bar">${state === "ask" ? `<button type="button" class="btn" id="qzChk"${Object.keys(pick).length === qs.length ? "" : " disabled"}>✓ Semak Jawapan</button><span class="qz-cnt">${Object.keys(pick).length}/${qs.length} dijawab</span>`
        : state === "fail" ? `<button type="button" class="btn amber" id="qzRe">🔄 Ulang Semula</button><span class="qz-cnt bad">Skor <strong>${res.filter(Boolean).length}/${qs.length}</strong>. Semua jawapan mesti betul. Tekan Ulang Semula dan cuba lagi!</span>`
        : `<span class="qz-sum">🎉 Semua betul! Kuiz lulus. Tunggu kata kunci daripada pensyarah.</span>`}</div>`;
    }
    paint();
    el.addEventListener("click", (e) => {
      const b = e.target.closest("button[data-j]");
      if (b && state === "ask") { const i = +b.closest(".qz").dataset.i; pick[i] = +b.dataset.j; beep(900, 30, 0.02, "sine"); paint(); return; }
      if (e.target.closest("#qzChk")) {
        const res = qs.map((q, i) => pick[i] === q.a);
        if (res.every(Boolean)) {
          state = "pass"; S.quiz[id] = true; save(); paint(); chime(); confetti(90);
          if (onDone) onDone(qs.length);
        } else {
          state = "fail"; paint(res); beep(240, 160, 0.035, "sawtooth");
          $$(".qz.bad", el).forEach((x) => x.classList.add("shake"));
        }
        return;
      }
      if (e.target.closest("#qzRe")) {
        Object.keys(pick).forEach((k) => delete pick[k]); state = "ask"; paint(); beep(700, 50, 0.03, "sine");
        el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      }
    });
  }

  // Apa yang mesti siap di halaman ini sebelum kata kunci boleh membuka halaman seterusnya
  function blocker(idx) {
    if (S.fac) return null;
    const id = STEPS[idx].id;
    if (quizOn && !(S.quiz || {})[id]) return { i: "📝", t: "Selesaikan kuiz dahulu", m: "Kamu perlu menjawab <strong>Kuiz Pantas</strong> di halaman ini sehingga <strong>semua betul</strong> sebelum boleh ke halaman seterusnya.", b: "📝 Ke Kuiz", to: "#quiz" };
    let mm = /^maya(\d)$/.exec(id);
    if (mm && !S.done[id]) return { i: "💻", t: `Siapkan Misi ${mm[1]} dahulu`, m: `Selesaikan <strong>keempat-empat stesen</strong> Makmal Maya Misi ${mm[1]} (① hingga ④) sebelum ke bahagian seterusnya.`, b: "💻 Ke stesen misi", to: "#stn" };
    mm = /^hw(\d)$/.exec(id);
    if (mm && !S.done[id]) return { i: "🔧", t: `Siapkan Hardware Misi ${mm[1]} dahulu`, m: "Tandakan setiap langkah sebagai <strong>Siap</strong>, tunjukkan hasilnya kepada instruktor, kemudian tekan <strong>🎉 Kami berjaya!</strong>", b: "🔧 Ke langkah terakhir", to: "#doneBtn" };
    return null;
  }
  function blockDialog(bl) {
    const D = dialog(`<div class="blk"><span class="blk-i" aria-hidden="true">${bl.i}</span><h2>${bl.t}</h2><p>${bl.m}</p><button type="button" class="btn amber big" id="blkGo">${bl.b} ↓</button></div>`, { label: bl.t });
    beep(330, 140, 0.035, "triangle");
    $("#blkGo", D.el).addEventListener("click", () => {
      D.close();
      const t = $(bl.to) || $(bl.to === "#doneBtn" ? "#hwDone, .done-card" : "#main");
      if (t) { t.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" }); t.classList.remove("flash"); void t.offsetWidth; t.classList.add("flash"); }
    });
  }

  /* ---------------- Mula ---------------- */
  const EBP = window.EBP = { CFG, STEPS, STATIONS, MISSIONS, S, save, $, $$, esc, LCD, beep, chime, confetti, board, pinXY, T, TOP, BOT, dialog, quiz, gateNote, copyText, pairName, lcdNames, cleanName, layout, reduceMotion, here, nameDialog };

  document.addEventListener("DOMContentLoaded", () => {
    const idx = here();
    // Kawalan: halaman yang belum dibuka kunci menghantar pelajar ke halaman terakhir yang dibuka
    if (idx > S.unlocked && !S.fac) { location.replace(STEPS[S.unlocked].page); return; }
    if (S.fac) S.unlocked = Math.max(S.unlocked, idx);
    applyProj();
    header(idx);
    footer();
    if (typeof window.EBP_PAGE === "function") window.EBP_PAGE(EBP);
    gate(idx);
  });
})();
