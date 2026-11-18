/* LED & Perintang: kaki LED dan arah arus (+ ke −), analogi air bergambar, eksperimen perintang, kod warna */
window.EBP_PAGE = function (E) {
  const { $, $$, beep, quiz, S, save, chime } = E;
  const COL = ["#111", "#7a4a1e", "#d22", "#f07800", "#f2d200", "#1d9a3a", "#1d5fd0", "#7a3fc0", "#888", "#f4f4f4"];
  const RS = [0, 10, 47, 100, 220, 330, 470, 1000, 4700, 10000];
  const VS = 3.3, VF = 2.0;
  // Anak panah kecil pada wayar: (x, y, arah dalam darjah)
  const arr = (x, y, deg, cls = "arr") => `<path d="M-6,-5 L5,0 L-6,5Z" transform="translate(${x} ${y}) rotate(${deg})" class="${cls}"/>`;

  $("#main").innerHTML = `
    <section class="hero"><div class="wrap">
      <span class="kick">Bahagian 3</span>
      <h1>LED dan Perintang</h1>
      <p>Dalam misi nanti, ESP32 akan menghidupkan LED. Tetapi LED perlukan "kawan baik", iaitu <strong>perintang</strong>. Jom kita lihat ke mana arus mengalir dan kenapa perintang penting.</p>
    </div></section>

    <section class="sec"><div class="wrap">
      <h2>1. Kenali LED</h2>
      <div class="grid2">
        <div class="card"><svg viewBox="0 0 320 260" class="led-anat" role="img" aria-label="LED dengan kaki panjang anod positif dan kaki pendek katod negatif">
          <path d="M120,40 a40,40 0 0 1 80,0 v70 h-80Z" class="la-body"/><rect x="112" y="108" width="96" height="10" rx="2" class="la-rim"/><path d="M200,108 v10" class="la-flat"/>
          <path d="M140,118 V240" class="la-leg"/><path d="M180,118 V205" class="la-leg"/>
          <text x="128" y="255" text-anchor="end" class="la-t">Kaki panjang</text><text x="70" y="200" class="la-big">+</text><text x="20" y="225" class="la-t pos">ANOD</text>
          <text x="192" y="225" class="la-t">Kaki pendek</text><text x="245" y="185" class="la-big neg">−</text><text x="230" y="205" class="la-t neg">KATOD</text>
          <text x="214" y="104" class="la-s">sisi rata (−)</text></svg></div>
        <div><p class="lead"><strong>LED</strong> (Light Emitting Diode) ialah lampu kecil yang menyala bila arus melaluinya. Ia jimat tenaga dan tahan lama.</p>
          <div class="callout"><strong>Penting: LED ada arah!</strong>Arus keluar dari terminal <strong>positif (+)</strong> sumber kuasa, masuk ke kaki <strong>panjang (+)</strong> LED, keluar dari kaki <strong>pendek (−)</strong>, dan kembali ke terminal <strong>negatif (−)</strong>. Jika LED dipasang terbalik, arus tidak boleh mengalir dan LED tidak menyala.</div>
          <div class="card pol"><svg viewBox="0 0 300 140" id="polSvg" aria-hidden="true"></svg>
            <div class="pol-ctl"><button type="button" class="btn ghost" id="polBtn">↻ Pusing LED</button><span id="polMsg" aria-live="polite"></span></div></div></div>
      </div>
    </div></section>

    <section class="sec"><div class="wrap">
      <h2>2. Kenapa LED Perlukan Perintang?</h2>
      <p class="lead">Pin ESP32 mengeluarkan <strong>3.3 V</strong>. LED cuma memerlukan arus yang <strong>kecil</strong>, kira-kira 5 hingga 20 mA. Jika LED disambung terus tanpa perintang, arus yang terlalu besar akan mengalir, LED menjadi panas lalu terbakar, dan pin ESP32 juga boleh rosak. Untuk memahaminya, mari bayangkan <strong>aliran air</strong> dalam paip.</p>
      <div class="card water">
        <div class="water-h"><h3>Analogi: Air dalam Paip</h3>
          <div class="seg" role="group" aria-label="Paip sempit"><button type="button" data-w="0">Tanpa paip sempit</button><button type="button" data-w="1" class="on">Dengan paip sempit</button></div></div>
        <svg viewBox="0 0 660 300" id="waterSvg" role="img" aria-label="Analogi air: tangki, paip, paip sempit, kincir air dan paip balik"></svg>
        <p class="water-st" id="waterSt" aria-live="polite"></p>
      </div>
      <h3 class="map-h">Padankan Analogi dengan Litar Sebenar</h3>
      <p class="mt-s">Seret setiap kad litar ke analogi yang sama maksudnya (atau tekan kad, kemudian tekan petak). Kemudian tekan <strong>Semak padanan</strong>.</p>
      <div class="card match" id="match"></div>
      <p class="lead mt">Jadi, <strong>perintang</strong> ialah komponen yang <strong>menghadkan arus</strong>, sama seperti paip sempit mengurangkan aliran air. Sekarang cuba dengan litar sebenar: gerakkan gelangsar untuk menukar nilai perintang dan lihat apa berlaku kepada LED.</p>
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

  /* ---------- Arah LED: + di terminal arus keluar, − di terminal arus masuk ---------- */
  let flip = false;
  function pol() {
    const ok = !flip;
    $("#polSvg").innerHTML = `
      <rect x="10" y="34" width="64" height="72" rx="8" class="hl-esp"/><text x="42" y="66" text-anchor="middle" class="hl-t">3.3 V</text><text x="42" y="84" text-anchor="middle" class="hl-s light">sumber</text>
      <path d="M74,50 H128 M172,50 H240 V122 H42 V106" class="hl-w${ok ? " live" : ""}"/>
      <circle cx="74" cy="50" r="5" class="term pos"/><text x="84" y="40" class="tsign pos">+</text><text x="80" y="68" class="tsub">arus keluar</text>
      <circle cx="42" cy="106" r="5" class="term neg"/><text x="20" y="128" class="tsign neg">−</text><text x="56" y="138" class="tsub">arus masuk</text>
      ${ok ? arr(104, 50, 0) + arr(240, 88, 90) + arr(140, 122, 180) : `<text x="150" y="98" text-anchor="middle" class="xmark">✕ tiada arus</text>`}
      <circle cx="150" cy="50" r="32" class="glow${ok ? " on" : ""}"/>
      <g transform="translate(150 50)"><g${flip ? ' transform="scale(-1 1)"' : ""}><path d="M-14,-14 L10,0 L-14,14Z" class="dio${ok ? " on" : ""}"/><path d="M10,-14 V14" class="dio-k"/></g>
        <text x="${flip ? 16 : -16}" y="-20" text-anchor="middle" class="tsign pos sm">+</text><text x="${flip ? -16 : 16}" y="-20" text-anchor="middle" class="tsign neg sm">−</text>
        <text x="${flip ? 16 : -16}" y="30" text-anchor="middle" class="tsub">kaki panjang</text></g>`;
    $("#polMsg").innerHTML = ok ? "✓ Kaki panjang (+) menghadap terminal (+): <strong>LED menyala</strong>" : "✗ Terbalik: kaki panjang (+) kini menghadap terminal (−), jadi <strong>arus tidak boleh mengalir dan LED padam</strong>";
  }
  pol();
  $("#polBtn").addEventListener("click", () => { flip = !flip; pol(); beep(flip ? 300 : 900, 80, 0.03, "sine"); });

  /* ---------- Analogi air (bergambar, beranimasi) ---------- */
  let narrow = true, broke = false, brokeT = 0;
  function water() {
    const fast = !narrow;
    const pw = narrow ? 8 : 26; // lebar paip di bahagian sempit
    const blades = Array.from({ length: 8 }, (_, i) => `<path d="M0,0 L0,-40" transform="rotate(${i * 45})" class="wb"/>`).join("");
    $("#waterSvg").innerHTML = `
      <defs><linearGradient id="wtr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc4ff"/><stop offset="1" stop-color="#2f7cf0"/></linearGradient></defs>
      <!-- tangki -->
      <rect x="30" y="20" width="120" height="110" rx="10" class="tank"/><rect x="34" y="44" width="112" height="82" rx="6" fill="url(#wtr)" class="tank-w"/>
      <text x="90" y="80" text-anchor="middle" class="wt-big">3.3 V</text>
      <!-- paip ke kanan, bahagian sempit, kincir -->
      <path d="M350,112 H600 V262 H70 V130" class="pipe" stroke-width="24"/><path d="M146,112 H252" class="pipe" stroke-width="24"/><path d="M248,112 H352" class="pipe" stroke-width="${pw + 4}"/>
      <path d="M146,112 H250 M350,112 H600 V262 H70 V132" class="wflow${fast ? " fast" : ""}${broke ? " stop" : ""}"/>
      <path d="M250,112 H350" class="wsq${fast ? " fast" : ""}" stroke-width="${narrow ? 4 : 18}"/>
      ${narrow ? `<rect x="250" y="96" width="100" height="32" rx="6" class="narrow"/>` : ""}
      <g transform="translate(470 112)"><g class="wheel${broke ? " broke" : fast ? " vfast" : " ok"}">${blades}<circle r="12" class="wh"/></g>${broke ? `<path d="M-30,-30 L-8,-6 L-20,6 L10,30" class="crack"/>` : ""}</g>
      <circle cx="70" cy="200" r="22" class="pump"/><text x="70" y="206" text-anchor="middle" class="pump-t">⟳</text>
      <!-- label bernombor -->
      <g class="wlab"><circle cx="90" cy="150" r="11"/><text x="90" y="155">1</text></g><text x="106" y="155" class="wl">Tangki = Voltan</text>
      <g class="wlab"><circle cx="198" cy="82" r="11"/><text x="198" y="87">2</text></g><text x="168" y="70" class="wl">Aliran = Arus</text>
      <g class="wlab"><circle cx="300" cy="150" r="11"/><text x="300" y="155">3</text></g><text x="${narrow ? 256 : 262}" y="176" class="wl">${narrow ? "Paip sempit = Perintang" : "Tiada paip sempit!"}</text>
      <g class="wlab"><circle cx="470" cy="176" r="11"/><text x="470" y="181">4</text></g><text x="432" y="202" class="wl">Kincir = LED</text>
      <g class="wlab"><circle cx="340" cy="240" r="11"/><text x="340" y="245">5</text></g><text x="356" y="245" class="wl">Air kembali = GND</text>
      ${broke ? `<text x="470" y="52" text-anchor="middle" class="wboom">💥 Kincir patah!</text>` : ""}`;
    $("#waterSt").className = "water-st " + (broke ? "bad" : fast ? "warn" : "ok");
    $("#waterSt").innerHTML = broke ? "💥 <strong>Terlalu banyak air!</strong> Kincir berpusing terlalu laju lalu patah. Inilah yang berlaku kepada LED tanpa perintang: <strong>terbakar</strong>." :
      fast ? "🌊 <strong>Air meluru terlalu laju!</strong> Tiada paip sempit untuk menghadkan aliran…" :
      "✅ <strong>Aliran terkawal.</strong> Paip sempit menghadkan aliran, jadi kincir berpusing dengan selamat. Perintang melakukan perkara yang sama untuk LED.";
  }
  water();
  $(".water .seg").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-w]"); if (!b) return;
    narrow = b.dataset.w === "1"; broke = false; clearTimeout(brokeT);
    $$(".water .seg button").forEach((x) => x.classList.toggle("on", x === b));
    water(); beep(narrow ? 900 : 500, 60, 0.03, "sine");
    if (!narrow) brokeT = setTimeout(() => { broke = true; water(); beep(120, 400, 0.05, "sawtooth"); }, E.reduceMotion ? 300 : 2400);
  });

  /* ---------- Aktiviti padanan: analogi air ↔ litar sebenar ---------- */
  const PAIRS = [
    ["v", "🚰 Tangki air yang tinggi menolak air", "⚡ <strong>Voltan</strong>: pin ESP32 memberi 3.3 V"],
    ["i", "🌊 Banyaknya air yang mengalir", "〰️ <strong>Arus</strong> (diukur dalam mA)"],
    ["r", "🪈 Paip sempit mengurangkan aliran", "▭ <strong>Perintang</strong> menghadkan arus"],
    ["l", "🎡 Kincir air berpusing bila air lalu", "💡 <strong>LED</strong> menyala bila arus lalu"],
    ["g", "↩️ Air kembali ke bawah", "⏚ Arus kembali ke <strong>GND (0 V)</strong>"]
  ];
  const MA = { put: {}, sel: null, done: !!S.ledMatch };
  if (MA.done) PAIRS.forEach(([k]) => { MA.put[k] = k; });
  // Kad dalam bank dikocok sekali, tetapi tidak sama dengan susunan jawapan
  const bankOrder = (() => { let o; do { o = PAIRS.map(([k]) => k).sort(() => Math.random() - 0.5); } while (o.every((k, i) => k === PAIRS[i][0])); return o; })();
  const chipHtml = (k, extra = "") => `<button type="button" class="mchip2${MA.sel === k ? " sel" : ""}${extra}" data-chip="${k}">${PAIRS.find((p) => p[0] === k)[2]}</button>`;
  function paintMatch(res) {
    const used = new Set(Object.values(MA.put));
    $("#match").innerHTML = `<div class="mrows">${PAIRS.map(([k, a], i) => {
      const c = MA.put[k], st = res ? (res[k] === true ? " right" : res[k] === false ? " wrong" : "") : MA.done ? " right" : "";
      return `<div class="mrow"><span class="am-n">${i + 1}</span><span class="am-a">${a}</span><span class="am-x" aria-hidden="true">➜</span><div class="mslot${c ? " full" : ""}${st}" data-slot="${k}" tabindex="0" role="button" aria-label="Petak untuk analogi ${i + 1}">${c ? chipHtml(c, MA.done ? " lock" : "") : `<span class="mslot-e">letak kad di sini</span>`}</div></div>`;
    }).join("")}</div>
      ${MA.done ? `<div class="mwin">🎉 <strong>Semua padanan betul!</strong> Tangki menolak air seperti voltan menolak arus, dan paip sempit menghadkan aliran seperti perintang melindungi LED.</div>`
        : `<div class="mbank" data-bank="1" aria-label="Kad litar">${bankOrder.filter((k) => !used.has(k)).map((k) => chipHtml(k)).join("") || `<span class="mslot-e">Semua kad sudah diletakkan. Tekan Semak padanan.</span>`}</div>
      <div class="mctl"><button type="button" class="btn" id="mChk"${used.size === PAIRS.length ? "" : " disabled"}>✓ Semak padanan</button><button type="button" class="btn ghost" id="mClr">↺ Mula semula</button><span class="mmsg" id="mMsg" aria-live="polite"></span></div>`}`;
  }
  paintMatch();
  function putChip(k, slot) {
    Object.keys(MA.put).forEach((s2) => { if (MA.put[s2] === k) delete MA.put[s2]; });
    if (slot) MA.put[slot] = k;
    MA.sel = null; beep(slot ? 900 : 500, 40, 0.03, "sine"); paintMatch();
  }
  const mEl = $("#match");
  const mDrag = { k: null, ghost: null, x0: 0, y0: 0, moved: false, src: null };
  mEl.addEventListener("click", (e) => {
    if (MA.done) return;
    if (mDrag.moved) { mDrag.moved = false; return; }
    if (e.target.closest("#mClr")) { MA.put = {}; MA.sel = null; paintMatch(); return; }
    if (e.target.closest("#mChk")) {
      const res = {}; let good = 0;
      PAIRS.forEach(([k]) => { res[k] = MA.put[k] === k; if (res[k]) good++; });
      if (good === PAIRS.length) { MA.done = true; S.ledMatch = true; save(); paintMatch(); chime(); E.confetti(70); return; }
      paintMatch(res);
      $("#mMsg").innerHTML = `<strong>${good}/${PAIRS.length}</strong> betul. Kad dalam petak merah akan kembali ke bawah.`;
      $$(".mslot.wrong", mEl).forEach((x) => x.classList.add("shakeb"));
      beep(240, 140, 0.035, "sawtooth");
      setTimeout(() => { PAIRS.forEach(([k]) => { if (!res[k]) delete MA.put[k]; }); paintMatch(); $("#mMsg").innerHTML = `<strong>${good}/${PAIRS.length}</strong> betul. Padankan semula kad yang lain.`; }, 1400);
      return;
    }
    const chip = e.target.closest("[data-chip]"), slot = e.target.closest("[data-slot]");
    if (slot && MA.sel && (!chip || chip.dataset.chip !== MA.sel)) { putChip(MA.sel, slot.dataset.slot); return; }
    if (chip) { MA.sel = MA.sel === chip.dataset.chip ? null : chip.dataset.chip; beep(700, 30, 0.02, "sine"); paintMatch(); return; }
    if (e.target.closest("[data-bank]") && MA.sel) putChip(MA.sel, null);
  });
  mEl.addEventListener("keydown", (e) => { const slot = e.target.closest("[data-slot]"); if (slot && MA.sel && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); putChip(MA.sel, slot.dataset.slot); } });
  // Seret dan lepas (tetikus atau sentuhan)
  mEl.addEventListener("pointerdown", (e) => {
    const chip = e.target.closest("[data-chip]"); if (!chip || MA.done || e.button > 0) return;
    mDrag.k = chip.dataset.chip; mDrag.x0 = e.clientX; mDrag.y0 = e.clientY; mDrag.moved = false; mDrag.src = chip;
  });
  const mMove = (e) => {
    if (!mDrag.k) return;
    if (!mDrag.ghost) {
      if (Math.hypot(e.clientX - mDrag.x0, e.clientY - mDrag.y0) < 6) return;
      const g = mDrag.ghost = mDrag.src.cloneNode(true); g.classList.add("mghost"); g.style.width = mDrag.src.offsetWidth + "px"; document.body.appendChild(g);
      mDrag.src.classList.add("dragging"); mDrag.moved = true;
    }
    mDrag.ghost.style.left = e.clientX + "px"; mDrag.ghost.style.top = e.clientY + "px";
    const over = document.elementFromPoint(e.clientX, e.clientY);
    $$(".mslot", mEl).forEach((x) => x.classList.toggle("over", !!over && x.contains(over)));
  };
  const mUp = (e) => {
    if (!mDrag.k) return;
    const k = mDrag.k; mDrag.k = null;
    if (!mDrag.ghost) return;
    mDrag.ghost.parentNode.removeChild(mDrag.ghost); mDrag.ghost = null;
    const over = document.elementFromPoint(e.clientX, e.clientY), slot = over && over.closest("[data-slot]"), bank = over && over.closest("[data-bank]");
    if (slot) putChip(k, slot.dataset.slot); else if (bank) putChip(k, null); else paintMatch();
    setTimeout(() => { mDrag.moved = false; }, 0);
  };
  window.addEventListener("pointermove", mMove);
  window.addEventListener("pointerup", mUp);
  window.addEventListener("pointercancel", mUp);

  /* ---------- Eksperimen perintang ---------- */
  let burnt = false, flowT = 0;
  const fmtR = (r) => (r >= 1000 ? r / 1000 + " kΩ" : r + " Ω");
  function draw() {
    const r = RS[+$("#rSl").value];
    const I = r ? (VS - VF) / r : Infinity, mA = I * 1000;
    if (!r || mA > 100) burnt = true;
    const lit = !burnt && mA > 0.05, bright = burnt ? 0 : Math.min(1, Math.pow(mA / 15, 0.6));
    let cls, txt;
    if (burnt) { cls = "bad"; txt = "💥 <strong>LED terbakar!</strong> Arus terlalu besar kerana perintang tidak cukup. LED sudah rosak."; }
    else if (mA > 20) { cls = "warn"; txt = "🔥 <strong>Terlalu banyak arus!</strong> LED sangat panas dan akan cepat rosak."; }
    else if (mA >= 3) { cls = "ok"; txt = r === 220 ? "✅ <strong>Selamat dan cukup terang!</strong> Inilah nilai yang kita guna hari ini." : "✅ <strong>Selamat.</strong> LED menyala dengan baik."; }
    else if (mA >= 1) { cls = "dim"; txt = "🌙 <strong>Malap.</strong> Perintang terlalu besar, jadi arus sedikit."; }
    else { cls = "dim"; txt = "😴 <strong>Terlalu malap.</strong> Arus terlalu kecil, LED hampir tidak nampak."; }
    $("#rOut").textContent = r ? fmtR(r) : "0 Ω (tiada)";
    $("#rStat").className = "rstat " + cls; $("#rStat").innerHTML = txt + (burnt ? ` <button type="button" class="btn amber" id="newLed">Ganti LED baru</button>` : "");
    $("#calc").innerHTML = r ? `<div class="cl"><span>Arus</span> = (3.3 V − 2.0 V) ÷ ${fmtR(r)}</div><div class="cl big"><span></span> = <strong>${mA >= 1 ? mA.toFixed(1) : mA.toFixed(2)} mA</strong> <small>${mA > 20 ? "(melebihi had 20 mA!)" : "(had LED: 20 mA)"}</small></div>`
      : `<div class="cl"><span>Arus</span> = 1.3 V ÷ 0 Ω = <strong>sangat besar!</strong></div>`;
    const glow = lit ? `rgba(255,60,40,${(0.25 + bright * 0.6).toFixed(2)})` : "transparent";
    const flowOn = !burnt && mA > 0.05;
    $("#expSvg").innerHTML = `
      <rect x="10" y="74" width="80" height="102" rx="10" class="hl-esp"/><text x="50" y="112" text-anchor="middle" class="hl-t">ESP32</text><text x="50" y="132" text-anchor="middle" class="hl-s light">D25 = HIGH</text>
      <circle cx="90" cy="100" r="5" class="term pos"/><text x="96" y="88" class="tsign pos">+</text><text x="110" y="88" class="tsub">3.3 V</text>
      <circle cx="50" cy="176" r="5" class="term neg"/><text x="60" y="198" class="tsign neg">−</text><text x="74" y="198" class="tsub">GND 0 V</text>
      <path d="M90,100 H130" class="wireL"/>${resistor(130, 100, 150, r)}<path d="M280,100 H330" class="wireL"/>
      <g transform="translate(345 100)">
        <circle r="${10 + bright * 32}" fill="${glow}" class="led-glow"/>
        <path d="M-14,-16 a14,14 0 0 1 28,0 v22 h-28Z" class="led-b${lit ? " on" : ""}${burnt ? " burnt" : ""}" style="${lit ? `fill:rgb(255,${Math.round(90 + 120 * (1 - bright))},${Math.round(80 * (1 - bright))})` : ""}"/>
        <text x="-30" y="4" class="tsign pos sm">+</text><text x="20" y="4" class="tsign neg sm">−</text>
        ${burnt ? `<g class="smoke"><circle cx="-4" cy="-30" r="8"/><circle cx="6" cy="-44" r="10"/><circle cx="-2" cy="-60" r="12"/></g>` : ""}
      </g>
      <path d="M360,106 H420 V215 H50 V176" class="wireL"/>
      ${flowOn ? arr(112, 100, 0) + arr(420, 160, 90) + arr(235, 215, 180) + arr(50, 196, 270) : ""}
      ${flowOn ? Array.from({ length: 6 }, (_, i) => `<circle r="4" class="eflow" data-i="${i}"/>`).join("") : ""}
      <text x="345" y="150" text-anchor="middle" class="ex-t">LED</text>
      <text x="235" y="240" text-anchor="middle" class="hl-s">arus mengalir dari + ke −</text>`;
    const nb = $("#newLed"); if (nb) nb.addEventListener("click", () => { burnt = false; $("#rSl").value = 4; draw(); beep(900, 80, 0.03, "sine"); });
    if (r === 220 && !burnt && !S.ledDone) { S.ledDone = true; save(); }
    E.__mA = mA;
  }
  $("#rSl").addEventListener("input", () => { const prev = burnt; draw(); if (burnt && !prev) { beep(120, 400, 0.06, "sawtooth"); } else beep(800 + +$("#rSl").value * 60, 30, 0.02, "sine"); });
  draw();
  // Titik arus bergerak di sepanjang litar (laju ikut arus)
  const path = [[90, 100], [420, 100], [420, 215], [50, 215], [50, 176]];
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
    { q: "Kaki LED yang <strong>panjang</strong> ialah…", opts: ["Katod (−)", "Anod (+)"], a: 1, why: "Kaki panjang = anod (+). Ia disambung ke arah pin ESP32 (positif)." },
    { q: "Arus dalam litar LED mengalir…", opts: ["Dari − ke +", "Dari + melalui LED ke −", "Tidak bergerak"], a: 1, why: "Arus keluar dari terminal +, melalui perintang dan LED, kemudian kembali ke − (GND)." },
    { q: "Dalam analogi air, perintang sama seperti…", opts: ["Tangki air", "Paip sempit", "Kincir air"], a: 1, why: "Paip sempit menghadkan aliran air, sama seperti perintang menghadkan arus." },
    { q: "Apa berlaku jika LED disambung terus ke ESP32 tanpa perintang?", opts: ["LED lebih tahan lama", "Arus terlalu besar, LED boleh terbakar", "Tiada apa-apa"], a: 1, why: "Tanpa perintang, arus terlalu besar dan LED (serta pin ESP32) boleh rosak." }
  ], () => chime());
};
