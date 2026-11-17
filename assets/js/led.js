/* LED & Perintang: kaki LED, arah arus, fungsi perintang (eksperimen), kod warna */
window.EBP_PAGE = function (E) {
  const { $, $$, beep, quiz, S, save, chime } = E;
  const COL = ["#111", "#7a4a1e", "#d22", "#f07800", "#f2d200", "#1d9a3a", "#1d5fd0", "#7a3fc0", "#888", "#f4f4f4"];
  const CNAME = ["Hitam", "Coklat", "Merah", "Oren", "Kuning", "Hijau", "Biru", "Ungu", "Kelabu", "Putih"];
  const RS = [0, 10, 47, 100, 220, 330, 470, 1000, 4700, 10000];
  const VS = 3.3, VF = 2.0;

  $("#main").innerHTML = `
    <section class="hero"><div class="wrap">
      <span class="kick">Bahagian 3</span>
      <h1>LED dan Perintang</h1>
      <p>Dalam misi nanti, ESP32 akan menghidupkan LED. Tetapi LED perlukan "kawan baik", iaitu <strong>perintang</strong>. Jom kita lihat kenapa.</p>
    </div></section>

    <section class="sec"><div class="wrap">
      <h2>1. Kenali LED</h2>
      <div class="grid2">
        <div class="card"><svg viewBox="0 0 320 260" class="led-anat" role="img" aria-label="LED dengan kaki panjang anod positif dan kaki pendek katod negatif">
          <path d="M120,40 a40,40 0 0 1 80,0 v70 h-80Z" class="la-body"/><rect x="112" y="108" width="96" height="10" rx="2" class="la-rim"/><path d="M200,108 v10" class="la-flat"/>
          <path d="M140,118 V240" class="la-leg"/><path d="M180,118 V205" class="la-leg"/>
          <text x="128" y="255" text-anchor="end" class="la-t">Kaki panjang</text><text x="70" y="200" class="la-big">+</text><text x="20" y="225" class="la-t">ANOD</text>
          <text x="192" y="225" class="la-t">Kaki pendek</text><text x="245" y="185" class="la-big">−</text><text x="230" y="205" class="la-t">KATOD</text>
          <text x="214" y="104" class="la-s">sisi rata (−)</text></svg></div>
        <div><p class="lead"><strong>LED</strong> (Light Emitting Diode) ialah lampu kecil yang menyala bila arus melaluinya. Ia jimat tenaga dan tahan lama.</p>
          <div class="callout"><strong>Penting: LED ada arah!</strong>Arus hanya boleh mengalir dari kaki <strong>panjang (+)</strong> ke kaki <strong>pendek (−)</strong>. Jika LED dipasang terbalik, ia tidak akan menyala.</div>
          <div class="card pol"><svg viewBox="0 0 300 120" id="polSvg" aria-hidden="true"></svg>
            <div class="pol-ctl"><button type="button" class="btn ghost" id="polBtn">↻ Pusing LED</button><span id="polMsg" aria-live="polite"></span></div></div></div>
      </div>
    </div></section>

    <section class="sec"><div class="wrap">
      <h2>2. Kenapa LED Perlukan Perintang?</h2>
      <div class="grid3 analogy">
        <div class="an"><span>🚰</span><strong>Tekanan air = Voltan</strong><small>ESP32 memberi "tekanan" 3.3 V untuk menolak arus.</small></div>
        <div class="an"><span>🪈</span><strong>Paip sempit = Perintang</strong><small>Perintang menghadkan berapa banyak arus yang boleh mengalir.</small></div>
        <div class="an"><span>🎡</span><strong>Kincir air = LED</strong><small>Terlalu banyak air, kincir rosak. Terlalu sikit, kincir tidak berpusing.</small></div>
      </div>
      <p class="lead">Perintang ialah komponen yang <strong>menghadkan arus</strong>. Tanpa perintang, arus terlalu besar dan LED akan <strong>panas lalu terbakar</strong>. Cuba sendiri!</p>
      <div class="card exp">
        <div class="exp-grid">
          <div><svg viewBox="0 0 460 250" id="expSvg" role="img" aria-label="Litar: pin ESP32, perintang, LED, kembali ke GND"></svg></div>
          <div class="exp-side">
            <label class="rlab" for="rSl">Nilai perintang: <output id="rOut">220 Ω</output></label>
            <input type="range" id="rSl" min="0" max="${RS.length - 1}" step="1" value="4" aria-describedby="rStat">
            <div class="rticks" aria-hidden="true"><span>0 Ω</span><span>10 kΩ</span></div>
            <div class="rstat" id="rStat" aria-live="polite"></div>
            <div class="calc" id="calc"></div>
          </div>
        </div>
      </div>
    </div></section>

    <section class="sec"><div class="wrap">
      <h2>3. Perintang Kita Hari Ini: 220 Ω</h2>
      <div class="grid2">
        <div class="card"><svg viewBox="0 0 360 110" aria-hidden="true">${resistor(40, 55, 280, 220, true)}</svg>
          <table class="tbl bands"><thead><tr><th>Jalur</th><th>Warna</th><th>Maksud</th></tr></thead><tbody>
          <tr><td>1</td><td><i style="background:#d22"></i> Merah</td><td>2</td></tr>
          <tr><td>2</td><td><i style="background:#d22"></i> Merah</td><td>2</td></tr>
          <tr><td>3</td><td><i style="background:#7a4a1e"></i> Coklat</td><td>× 10</td></tr>
          <tr><td>4</td><td><i style="background:#c9a227"></i> Emas</td><td>± 5%</td></tr></tbody></table>
          <p class="bands-sum"><strong>2 2 × 10 = 220 Ω</strong></p></div>
        <div><div class="callout teal"><strong>Perintang tiada arah</strong>Tidak seperti LED, perintang boleh dipasang ke mana-mana arah.</div>
          <div class="callout blue"><strong>Kira sendiri (Hukum Ohm)</strong>Arus = (Voltan ESP32 − Voltan LED) ÷ Perintang<br>= (3.3 V − 2.0 V) ÷ 220 Ω ≈ <strong>0.006 A = 6 mA</strong>. LED selamat di bawah 20 mA. ✓</div></div>
      </div>
    </div></section>

    <section class="sec"><div class="wrap"><h2>Kuiz Pantas</h2><div id="quiz"></div></div></section>`;

  /* ---------- Lukisan perintang dengan jalur warna ---------- */
  function bands(r) {
    if (!r) return null;
    const s = String(r), d1 = +s[0], d2 = +(s[1] || 0), m = s.length - 2;
    return [d1, d2, m];
  }
  function resistor(x, y, w, r, big) {
    const b = bands(r), h = big ? 34 : 20, bw = big ? 10 : 6;
    if (!b) return `<path d="M${x},${y} H${x + w}" class="wireL"/><text x="${x + w / 2}" y="${y - 10}" text-anchor="middle" class="ex-t">tiada perintang!</text>`;
    const bx = x + w * 0.22, bwid = w * 0.56;
    return `<path d="M${x},${y} H${bx} M${bx + bwid},${y} H${x + w}" class="leadL"/>
      <rect x="${bx}" y="${y - h / 2}" width="${bwid}" height="${h}" rx="${h / 2.4}" class="res-b"/>
      ${b.map((c, i) => `<rect x="${bx + bwid * (0.18 + i * 0.14)}" y="${y - h / 2}" width="${bw}" height="${h}" fill="${COL[c]}"/>`).join("")}
      <rect x="${bx + bwid * 0.78}" y="${y - h / 2}" width="${bw}" height="${h}" fill="#c9a227"/>`;
  }

  /* ---------- Arah LED ---------- */
  let flip = false;
  function pol() {
    const ok = !flip;
    $("#polSvg").innerHTML = `<rect x="10" y="30" width="60" height="60" rx="8" class="hl-esp"/><text x="40" y="58" text-anchor="middle" class="hl-t">3.3V</text><text x="40" y="76" text-anchor="middle" class="hl-s">+  −</text>
      <path d="M70,45 H130 M170,45 H230 V100 H40 V90" class="hl-w${ok ? " live" : ""}"/>
      <g transform="translate(150 45) ${flip ? "scale(-1 1)" : ""}"><path d="M-14,-14 L10,0 L-14,14Z" class="dio${ok ? " on" : ""}"/><path d="M10,-14 V14" class="dio-k"/><text x="-18" y="-20" class="la-s" ${flip ? 'transform="scale(-1 1)"' : ""}>+</text><text x="12" y="-20" class="la-s" ${flip ? 'transform="scale(-1 1)"' : ""}>−</text></g>
      <circle cx="150" cy="45" r="30" class="glow${ok ? " on" : ""}"/>`;
    $("#polMsg").innerHTML = ok ? "✓ Kaki panjang ke (+): <strong>LED menyala</strong>" : "✗ Terbalik: <strong>LED tidak menyala</strong>";
  }
  pol();
  $("#polBtn").addEventListener("click", () => { flip = !flip; pol(); beep(flip ? 300 : 900, 80, 0.03, "sine"); });

  /* ---------- Eksperimen perintang ---------- */
  let burnt = false, flowT = 0;
  const fmtR = (r) => (r >= 1000 ? r / 1000 + " kΩ" : r + " Ω");
  function draw() {
    const r = RS[+$("#rSl").value];
    const I = r ? (VS - VF) / r : Infinity, mA = I * 1000;
    if (!r || mA > 100) burnt = true;
    const lit = !burnt && mA > 0.05, bright = burnt ? 0 : Math.min(1, Math.pow(mA / 15, 0.6));
    let cls, txt;
    if (burnt) { cls = "bad"; txt = "💥 <strong>LED terbakar!</strong> Arus terlalu besar tanpa perintang yang cukup. LED sudah rosak."; }
    else if (mA > 20) { cls = "warn"; txt = "🔥 <strong>Terlalu banyak arus!</strong> LED sangat panas dan akan cepat rosak."; }
    else if (mA >= 3) { cls = "ok"; txt = r === 220 ? "✅ <strong>Selamat dan cukup terang!</strong> Inilah nilai yang kita guna hari ini." : "✅ <strong>Selamat.</strong> LED menyala dengan baik."; }
    else if (mA >= 1) { cls = "dim"; txt = "🌙 <strong>Malap.</strong> Perintang terlalu besar, arus sedikit."; }
    else { cls = "dim"; txt = "😴 <strong>Terlalu malap.</strong> Arus terlalu kecil, LED hampir tidak nampak."; }
    $("#rOut").textContent = r ? fmtR(r) : "0 Ω (tiada)";
    $("#rStat").className = "rstat " + cls; $("#rStat").innerHTML = txt + (burnt ? ` <button type="button" class="btn amber" id="newLed">Ganti LED baru</button>` : "");
    $("#calc").innerHTML = r ? `<div class="cl"><span>Arus</span> = (3.3 V − 2.0 V) ÷ ${fmtR(r)}</div><div class="cl big"><span></span> = <strong>${mA >= 1 ? mA.toFixed(1) : mA.toFixed(2)} mA</strong> <small>${mA > 20 ? "(melebihi had 20 mA!)" : "(had LED: 20 mA)"}</small></div>`
      : `<div class="cl"><span>Arus</span> = 1.3 V ÷ 0 Ω = <strong>sangat besar!</strong></div>`;
    const glow = lit ? `rgba(255,60,40,${(0.25 + bright * 0.6).toFixed(2)})` : "transparent";
    $("#expSvg").innerHTML = `
      <rect x="10" y="80" width="80" height="90" rx="10" class="hl-esp"/><text x="50" y="118" text-anchor="middle" class="hl-t">ESP32</text><text x="50" y="138" text-anchor="middle" class="hl-s">D25 = HIGH</text>
      <path d="M90,100 H130" class="wireL"/>${resistor(130, 100, 150, r)}<path d="M280,100 H330" class="wireL"/>
      <g transform="translate(345 100)">
        <circle r="${10 + bright * 30}" fill="${glow}" class="led-glow"/>
        <path d="M-14,-16 a14,14 0 0 1 28,0 v22 h-28Z" class="led-b${lit ? " on" : ""}${burnt ? " burnt" : ""}" style="${lit ? `fill:rgb(255,${Math.round(90 + 120 * (1 - bright))},${Math.round(80 * (1 - bright))})` : ""}"/>
        ${burnt ? `<g class="smoke"><circle cx="-4" cy="-30" r="8"/><circle cx="6" cy="-44" r="10"/><circle cx="-2" cy="-60" r="12"/></g>` : ""}
      </g>
      <path d="M360,106 H420 V215 H50 V170" class="wireL"/><text x="235" y="236" text-anchor="middle" class="hl-s">GND (0 V)</text>
      ${!burnt && mA > 0.05 ? Array.from({ length: 6 }, (_, i) => `<circle r="4" class="eflow" data-i="${i}"/>`).join("") : ""}
      <text x="345" y="150" text-anchor="middle" class="ex-t">LED</text>`;
    const nb = $("#newLed"); if (nb) nb.addEventListener("click", () => { burnt = false; $("#rSl").value = 4; draw(); beep(900, 80, 0.03, "sine"); });
    if (r === 220 && !burnt && !S.ledDone) { S.ledDone = true; save(); }
    E.__mA = mA;
  }
  $("#rSl").addEventListener("input", () => { const prev = burnt; draw(); if (burnt && !prev) { beep(120, 400, 0.06, "sawtooth"); } else beep(800 + +$("#rSl").value * 60, 30, 0.02, "sine"); });
  draw();
  // Titik arus bergerak di sepanjang litar (laju ikut arus)
  const path = [[90, 100], [420, 100], [420, 215], [50, 215], [50, 170]];
  const segs = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1])), tot = segs.reduce((a, b) => a + b, 0);
  const at = (d) => { d = ((d % tot) + tot) % tot; for (let i = 0; i < segs.length; i++) { if (d <= segs[i]) { const k = d / segs[i]; return [path[i][0] + (path[i + 1][0] - path[i][0]) * k, path[i][1] + (path[i + 1][1] - path[i][1]) * k]; } d -= segs[i]; } return path[0]; };
  let lastT = performance.now();
  (function loop(now) {
    const dt = now - lastT; lastT = now;
    const mA = E.__mA || 0, v = Math.min(0.5, mA * 0.02 + 0.01);
    flowT += dt * v;
    $$("#expSvg .eflow").forEach((c) => { const [x, y] = at(flowT + (+c.dataset.i) * tot / 6); c.setAttribute("cx", x.toFixed(1)); c.setAttribute("cy", y.toFixed(1)); });
    if (!E.reduceMotion) requestAnimationFrame(loop);
  })(lastT);

  quiz($("#quiz"), [
    { q: "Kaki LED yang <strong>panjang</strong> ialah…", opts: ["Katod (−)", "Anod (+)"], a: 1, why: "Kaki panjang = anod (+). Ia disambung ke arah pin ESP32." },
    { q: "Apakah fungsi perintang dalam litar LED?", opts: ["Menambah arus", "Menghadkan arus supaya LED tidak terbakar", "Menukar warna LED"], a: 1, why: "Perintang menghadkan arus supaya LED selamat." },
    { q: "Apa berlaku jika LED disambung terus ke ESP32 tanpa perintang?", opts: ["LED lebih tahan lama", "Arus terlalu besar, LED boleh terbakar", "Tiada apa-apa"], a: 1, why: "Tanpa perintang, arus terlalu besar dan LED (serta pin ESP32) boleh rosak." }
  ], () => chime());
};
