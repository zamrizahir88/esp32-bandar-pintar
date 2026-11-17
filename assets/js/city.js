/* Bandar Pintar: simulasi bandar, cari 6 peranti yang dikawal mikropengawal */
window.EBP_PAGE = function (E) {
  const { $, $$, esc, beep, chime, confetti, S, save, gateNote } = E;
  const DEV = {
    menara: { ico: "🗼", t: "Lampu Amaran Menara", d: "Menara tinggi ada lampu merah di puncaknya supaya juruterbang kapal terbang nampak menara itu pada waktu malam. Lampu ini berkelip mengikut masa yang tetap.", i: "Pemasa (masa)", p: "Mikropengawal mengira masa", o: "Lampu merah berkelip", m: "Misi 1 & 2 nanti: kamu akan program lampu ini!" },
    lif: { ico: "🛗", t: "Lif", d: "Bila butang tingkat ditekan, mikropengawal memutuskan ke mana lif perlu bergerak, menghidupkan motor, dan memaparkan nombor tingkat.", i: "Butang tingkat", p: "Mikropengawal memilih arah", o: "Motor lif + paparan nombor" },
    aircond: { ico: "❄️", t: "Penghawa Dingin", d: "Sensor suhu mengukur suhu bilik. Jika lebih panas daripada suhu yang ditetapkan, mikropengawal menghidupkan pemampat dan kipas.", i: "Sensor suhu", p: "Mikropengawal membandingkan suhu", o: "Kipas + pemampat sejuk" },
    isyarat: { ico: "🚦", t: "Lampu Isyarat", d: "Lampu isyarat bertukar warna mengikut turutan dan masa yang tetap: merah, hijau, kuning. Ada yang juga menggunakan sensor untuk mengesan kereta.", i: "Pemasa (dan sensor kereta)", p: "Mikropengawal mengawal turutan", o: "Lampu merah, kuning, hijau", m: "Misi 3 nanti: kamu akan bina lampu isyarat sendiri!" },
    jalan: { ico: "💡", t: "Lampu Jalan Automatik", d: "Sensor cahaya (LDR) mengesan bila hari menjadi gelap. Mikropengawal terus menghidupkan lampu jalan tanpa perlu sesiapa menekan suis. Cuba tukar kepada malam!", i: "Sensor cahaya (LDR)", p: "Mikropengawal: gelap atau terang?", o: "Lampu jalan menyala" },
    pagar: { ico: "🏠", t: "Pagar Automatik", d: "Bila butang alat kawalan jauh ditekan, mikropengawal menerima isyarat radio dan menghidupkan motor untuk membuka atau menutup pagar.", i: "Alat kawalan jauh", p: "Mikropengawal menerima isyarat", o: "Motor membuka pagar" }
  };
  const found = new Set((S.cityFound || []).filter((k) => DEV[k]));

  $("#main").innerHTML = `
    <section class="hero"><div class="wrap">
      <span class="kick">Bahagian 1</span>
      <h1>Bandar Pintar</h1>
      <p>Di sekeliling kita ada banyak "otak kecil" yang dipanggil <strong>mikropengawal</strong>. Ia bersembunyi dalam peranti harian dan bekerja tanpa henti. Cari <strong>6 peranti pintar</strong> dalam bandar ini. Tekan tanda <span class="q-ico">?</span> yang berkelip.</p>
    </div></section>
    <section class="sec city-sec"><div class="wrap">
      <div class="city-top">
        <div class="found" aria-live="polite"><span><span id="fCount">0</span>/6 peranti dijumpai</span> <span class="f-bar"><i id="fBar"></i></span></div>
        <button type="button" class="btn ghost" id="dayBtn">🌙 Tukar kepada malam</button>
      </div>
      <div class="city-wrap"><div class="city" id="city"></div>
        <aside class="dev-panel card" id="devPanel" aria-live="polite"></aside>
      </div>
    </div></section>
    <section class="sec"><div class="wrap">
      <h2>Semua Peranti Pintar Bekerja dengan Cara Yang Sama</h2>
      <div class="ipo big">
        <div class="ipo-b in"><span>🎛️</span><strong>INPUT</strong><small>Maklumat masuk: butang, sensor, masa</small></div>
        <div class="ipo-a" aria-hidden="true">➜</div>
        <div class="ipo-b pr"><span>🧠</span><strong>PROSES</strong><small>Mikropengawal berfikir dan membuat keputusan mengikut <em>program</em></small></div>
        <div class="ipo-a" aria-hidden="true">➜</div>
        <div class="ipo-b out"><span>💡</span><strong>OUTPUT</strong><small>Tindakan: lampu, motor, bunyi, paparan</small></div>
      </div>
      <div class="callout teal"><strong>Apakah itu mikropengawal?</strong>Sebuah komputer yang sangat kecil dalam satu cip. Ia tidak ada skrin atau papan kekunci, tetapi boleh membaca input dan mengawal output mengikut program yang kita tulis. Hari ini, mikropengawal kita ialah <strong>ESP32</strong>.</div>
    </div></section>`;

  /* ---------- Lukisan bandar ---------- */
  const win = (x, y, w, h, cols, rows, cls = "win") => {
    let s = ""; const gw = w / cols, gh = h / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) s += `<rect class="${cls}" x="${(x + c * gw + gw * 0.2).toFixed(1)}" y="${(y + r * gh + gh * 0.2).toFixed(1)}" width="${(gw * 0.6).toFixed(1)}" height="${(gh * 0.6).toFixed(1)}" rx="2"/>`;
    return s;
  };
  const lamp = (x) => `<g class="slamp"><rect x="${x - 3}" y="330" width="6" height="128" class="pole"/><path d="M${x},334 q0,-14 22,-14" class="arm"/><rect x="${x + 14}" y="316" width="22" height="9" rx="3" class="lhead"/><path class="lbeam" d="M${x + 16},325 L${x + 2},458 L${x + 50},458 L${x + 34},325Z"/><circle cx="${x + 25}" cy="327" r="5" class="lbulb"/></g>`;
  const hot = (id, x, y) => `<g class="hot" data-dev="${id}" tabindex="0" role="button" aria-label="${esc(DEV[id].t)}"><circle cx="${x}" cy="${y}" r="27" class="hot-r"/><circle cx="${x}" cy="${y}" r="21" class="hot-c"/><text x="${x}" y="${y + 8}" text-anchor="middle" class="hot-t">?</text></g>`;
  const stars = Array.from({ length: 40 }, (_, i) => `<circle class="star" cx="${(i * 97) % 1200}" cy="${(i * 53) % 230 + 10}" r="${i % 3 ? 1.2 : 2}"/>`).join("");
  $("#city").innerHTML = `<svg viewBox="0 0 1200 600" role="img" aria-label="Bandar pintar dengan menara, bangunan pejabat, apartmen, lampu isyarat, lampu jalan dan rumah dengan pagar automatik">
    <defs><linearGradient id="skyD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc4f2"/><stop offset="1" stop-color="#d7f0ff"/></linearGradient>
    <linearGradient id="skyN" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1530"/><stop offset="1" stop-color="#26365e"/></linearGradient></defs>
    <rect width="1200" height="600" class="sky"/><g class="stars">${stars}</g>
    <circle cx="1090" cy="80" r="38" class="sun"/><g class="moon"><circle cx="1090" cy="80" r="32"/><circle cx="1105" cy="70" r="28" class="moon-cut"/></g>
    <path d="M0,420 Q150,350 300,410 T620,400 T900,395 T1200,405 V460 H0Z" class="hill"/>
    <!-- menara -->
    <g><path d="M78,458 L96,120 L104,120 L122,458Z" class="tower"/><path d="M84,400 L116,400 M88,320 L112,320 M92,240 L108,240 M95,170 L105,170" class="tower-x"/>
      <rect x="94" y="96" width="12" height="26" class="tower"/><circle cx="100" cy="92" r="8" class="beacon" id="beacon"/></g>
    <!-- pejabat + lif -->
    <g><rect x="160" y="210" width="190" height="248" class="bld b1"/>${win(168, 222, 110, 228, 3, 6)}
      <rect x="292" y="218" width="48" height="236" class="shaft"/><rect x="296" y="404" width="40" height="46" class="liftcar" id="liftCar"/>
      <rect x="296" y="196" width="40" height="18" rx="3" class="ldisp"/><text x="316" y="210" text-anchor="middle" class="ldisp-t" id="liftNo">G</text></g>
    <!-- apartmen + penghawa dingin -->
    <g><rect x="380" y="260" width="140" height="198" class="bld b2"/>${win(388, 272, 124, 176, 3, 5)}
      <g id="acUnit"><rect x="530" y="300" width="56" height="40" rx="4" class="ac"/><circle cx="558" cy="320" r="15" class="ac-f"/><g class="ac-blades" id="acBlades"><path d="M558,320 l0,-12 M558,320 l10,6 M558,320 l-10,6" class="ac-b"/></g>
      <rect x="532" y="276" width="52" height="20" rx="3" class="ldisp"/><text x="558" y="291" text-anchor="middle" class="ldisp-t" id="acT">30°C</text></g></g>
    <!-- jalan -->
    <rect x="0" y="458" width="1200" height="14" class="pave"/><rect x="0" y="472" width="1200" height="80" class="road"/>
    <path d="M0,512 H1200" class="lane"/><rect x="0" y="552" width="1200" height="48" class="grass"/>
    <rect x="700" y="474" width="8" height="76" class="stopline"/>
    ${lamp(600)}${lamp(840)}${lamp(1140)}
    <g class="ldr"><rect x="586" y="350" width="10" height="10" rx="2"/></g>
    <!-- lampu isyarat -->
    <g><rect x="716" y="330" width="7" height="128" class="pole"/><rect x="700" y="270" width="40" height="96" rx="8" class="tl-box"/>
      <circle cx="720" cy="290" r="11" class="tl r" id="tlR"/><circle cx="720" cy="318" r="11" class="tl y" id="tlY"/><circle cx="720" cy="346" r="11" class="tl g" id="tlG"/></g>
    <!-- kereta -->
    <g id="car"><rect x="-70" y="-26" width="70" height="20" rx="6" class="car"/><path d="M-58,-26 l10,-14 h30 l10,14Z" class="car"/><path d="M-52,-27 l7,-10 h10 v10Z M-31,-27 v-10 h9 l6,10Z" class="carw"/><circle cx="-54" cy="-5" r="7" class="tyre"/><circle cx="-16" cy="-5" r="7" class="tyre"/></g>
    <!-- rumah + pagar -->
    <g><path d="M960,360 L1040,300 L1120,360Z" class="roof"/><rect x="972" y="360" width="136" height="98" class="house"/><rect x="1024" y="400" width="30" height="58" class="door"/>${win(980, 368, 40, 30, 1, 1)}${win(1062, 368, 40, 30, 1, 1)}
      <rect x="860" y="420" width="110" height="38" class="gate-rail"/><g id="pagarG">${Array.from({ length: 9 }, (_, i) => `<rect x="${864 + i * 12}" y="422" width="5" height="34" class="gate-bar"/>`).join("")}<rect x="862" y="424" width="108" height="5" class="gate-bar"/><rect x="862" y="447" width="108" height="5" class="gate-bar"/></g></g>
    ${hot("menara", 130, 110)}${hot("lif", 316, 175)}${hot("aircond", 600, 286)}${hot("isyarat", 762, 290)}${hot("jalan", 880, 330)}${hot("pagar", 915, 395)}
  </svg>`;
  const svg = $("#city svg");

  /* ---------- Panel maklumat ---------- */
  const panel = $("#devPanel");
  const empty = () => { panel.innerHTML = `<div class="dev-empty"><span>🔍</span><h3>Pilih satu peranti</h3><p>Tekan tanda <span class="q-ico">?</span> dalam bandar untuk melihat bagaimana mikropengawal membantu.</p></div>`; };
  function show(id) {
    const d = DEV[id];
    found.add(id); S.cityFound = [...found]; save();
    $$(".hot", svg).forEach((h) => h.classList.toggle("seen", found.has(h.dataset.dev)));
    $$(".hot", svg).forEach((h) => h.classList.toggle("sel", h.dataset.dev === id));
    panel.innerHTML = `<div class="dev"><div class="dev-h"><span class="dev-i">${d.ico}</span><h3>${esc(d.t)}</h3></div><p>${esc(d.d)}</p>
      <div class="ipo sm"><div class="ipo-b in"><strong>INPUT</strong><small>${esc(d.i)}</small></div><div class="ipo-a">➜</div><div class="ipo-b pr"><strong>PROSES</strong><small>${esc(d.p)}</small></div><div class="ipo-a">➜</div><div class="ipo-b out"><strong>OUTPUT</strong><small>${esc(d.o)}</small></div></div>
      ${d.m ? `<p class="dev-m">⭐ ${esc(d.m)}</p>` : ""}${found.size === 6 ? gateNote("🎉 <strong>Semua 6 peranti dijumpai!</strong> Tunggu kata kunci daripada pensyarah untuk ke <strong>Kenali ESP32</strong>.") : ""}</div>`;
    act(id);
    paintCount(true);
  }
  function paintCount(ping) {
    $("#fCount").textContent = found.size; $("#fBar").style.width = (found.size / 6) * 100 + "%";
    if (ping) beep(1200, 70, 0.03, "sine");
    if (found.size === 6 && !S.cityDone) { S.cityDone = true; save(); chime(); confetti(); if (E.mini) E.mini.say("BANDAR DITEROKA!"); }
  }
  empty(); paintCount(false);
  $$(".hot", svg).forEach((h) => {
    h.classList.toggle("seen", found.has(h.dataset.dev));
    h.addEventListener("click", () => show(h.dataset.dev));
    h.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(h.dataset.dev); } });
  });

  /* ---------- Siang / malam ---------- */
  let night = false;
  const setNight = (v) => { night = v; svg.classList.toggle("night", v); $("#dayBtn").textContent = v ? "☀️ Tukar kepada siang" : "🌙 Tukar kepada malam"; };
  $("#dayBtn").addEventListener("click", () => { setNight(!night); beep(night ? 500 : 900, 90, 0.03, "sine"); });

  /* ---------- Tindakan setiap peranti ---------- */
  let floor = 0, gateOpen = false, acTimer = null;
  function act(id) {
    if (id === "jalan" && !night) setNight(true);
    if (id === "lif") {
      floor = floor === 0 ? 4 : 0;
      $("#liftCar").style.transform = `translateY(${-floor * 46}px)`;
      let shown = floor ? 0 : 4; const step = floor ? 1 : -1;
      const t = setInterval(() => { shown += step; $("#liftNo").textContent = shown === 0 ? "G" : shown; if (shown === floor) clearInterval(t); }, 300);
    }
    if (id === "pagar") { gateOpen = !gateOpen; $("#pagarG").style.transform = gateOpen ? "translateX(-96px)" : ""; }
    if (id === "aircond") {
      clearInterval(acTimer); let t = 30; $("#acBlades").classList.add("spin");
      acTimer = setInterval(() => { t--; $("#acT").textContent = t + "°C"; if (t <= 24) { clearInterval(acTimer); } }, 450);
    }
  }

  /* ---------- Animasi: lampu isyarat, kereta, lampu menara ---------- */
  const PH = [["r", 3000], ["g", 3000], ["y", 1000]], cyc = 7000;
  let carX = -80, last = performance.now(), t0 = last, raf;
  function frame(now) {
    const dt = Math.min(60, now - last); last = now;
    const t = (now - t0) % cyc; let acc = 0, ph = "r";
    for (const [p, ms] of PH) { if (t < acc + ms) { ph = p; break; } acc += ms; }
    $("#tlR").classList.toggle("on", ph === "r"); $("#tlY").classList.toggle("on", ph === "y"); $("#tlG").classList.toggle("on", ph === "g");
    const stopX = 694, before = carX <= stopX && carX > stopX - 120;
    let v = 0.18 * dt;
    if (ph !== "g" && before) v = Math.max(0, Math.min(v, (stopX - carX) * 0.08));
    carX += v; if (carX > 1290) carX = -80;
    $("#car").setAttribute("transform", `translate(${carX.toFixed(1)} 540)`);
    $("#beacon").classList.toggle("on", Math.floor(now / 1000) % 2 === 0);
    raf = requestAnimationFrame(frame);
  }
  if (!E.reduceMotion) raf = requestAnimationFrame(frame);
  else { $("#tlR").classList.add("on"); $("#car").setAttribute("transform", "translate(600 540)"); }
  document.addEventListener("visibilitychange", () => { if (document.hidden) cancelAnimationFrame(raf); else if (!E.reduceMotion) { last = performance.now(); raf = requestAnimationFrame(frame); } });
};
