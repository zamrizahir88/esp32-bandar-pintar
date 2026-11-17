/* Kenali ESP32: bahagian papan, cara memberi arahan, HIGH dan LOW */
window.EBP_PAGE = function (E) {
  const { $, $$, esc, board, beep, S, save, quiz, chime, gateNote } = E;
  const PARTS = [
    ["cip", "🧠", "Cip ESP32 (Otak)", "Inilah otaknya! Di dalam kotak besi ini ada pemproses yang boleh membuat <strong>240 juta</strong> langkah sesaat, serta Wi-Fi dan Bluetooth."],
    ["antena", "📶", "Antena Wi-Fi", "Garisan berliku-liku emas ini ialah antena. Ia membolehkan ESP32 berhubung dengan internet dan telefon tanpa wayar."],
    ["usb", "🔌", "Port USB", "Kabel USB ke komputer memberi <strong>kuasa</strong> kepada ESP32 dan digunakan untuk <strong>memuat naik program</strong>."],
    ["usbcip", "🔁", "Cip Penukar USB", "Cip kecil ini menjadi \"penterjemah\" antara komputer dan ESP32 semasa program dimuat naik."],
    ["pwr", "🔴", "LED Kuasa (PWR)", "Menyala merah bila ESP32 mendapat kuasa. Jika tidak menyala, semak kabel USB."],
    ["led2", "🔵", "LED Biru (GPIO2)", "LED kecil yang disambung ke pin <strong>GPIO2</strong>. Kita boleh mengawalnya dengan program. <strong>Misi 1 kamu!</strong>"],
    ["en", "🔄", "Butang EN (Reset)", "Tekan untuk memulakan semula program dari awal, seperti \"restart\" telefon."],
    ["boot", "⏬", "Butang BOOT", "Digunakan semasa memuat naik program. Jika muat naik tersangkut di \"Connecting…\", tekan dan tahan butang ini."],
    ["gpio", "📍", "Pin GPIO", "Kaki-kaki emas ini ialah pin <strong>input/output</strong>. Kita sambungkan LED, sensor dan motor di sini. Hari ini kita guna D25, D26 dan D27."],
    ["kuasa", "⚡", "Pin Kuasa (GND, 3V3, VIN)", "<strong>GND</strong> ialah 0 V (negatif). <strong>3V3</strong> memberi 3.3 V. <strong>VIN</strong> menerima 5 V dari USB. Setiap litar mesti kembali ke GND."]
  ];
  const seen = new Set((S.espSeen || []).filter((k) => PARTS.some((p) => p[0] === k)));

  $("#main").innerHTML = `
    <section class="hero"><div class="wrap">
      <span class="kick">Bahagian 2</span>
      <h1>Kenali ESP32</h1>
      <p>ESP32 ialah papan mikropengawal yang murah tetapi sangat berkuasa. Ia digunakan dalam rumah pintar, kilang dan projek IoT di seluruh dunia. Tekan setiap bahagian papan untuk mengenalinya.</p>
    </div></section>
    <section class="sec"><div class="wrap">
      <div class="esp-top"><h2>Bahagian Papan ESP32 (30 Pin)</h2><div class="found"><span><span id="eCount">0</span>/${PARTS.length} bahagian dikenali</span> <span class="f-bar"><i id="eBar"></i></span></div></div>
      <div class="esp-grid">
        <div class="card esp-board"><svg viewBox="-30 -20 420 165" id="espSvg" role="img" aria-label="Papan ESP32. Tekan bahagian untuk maklumat."></svg></div>
        <div class="card esp-info" id="espInfo" aria-live="polite"></div>
      </div>
      <div class="part-list" id="partList">${PARTS.map(([id, ico, t]) => `<button type="button" data-part="${id}"><span>${ico}</span>${esc(t)}</button>`).join("")}</div>
    </div></section>

    <section class="sec"><div class="wrap">
      <h2>Bagaimana Kita Memberi Arahan kepada ESP32?</h2>
      <p class="lead">ESP32 tidak faham Bahasa Melayu. Kita beri arahan melalui <strong>program</strong>. Hari ini kita menyusun blok, dan komputer menukarnya kepada kod.</p>
      <div class="flow" id="flow">
        <div class="fl"><span>🧩</span><strong>1. Susun blok</strong><small>dalam TUNIOT</small></div><div class="fl-a">➜</div>
        <div class="fl"><span>📝</span><strong>2. Kod Arduino</strong><small>dijana secara automatik</small></div><div class="fl-a">➜</div>
        <div class="fl"><span>⬆️</span><strong>3. Muat naik</strong><small>melalui kabel USB</small></div><div class="fl-a">➜</div>
        <div class="fl"><span>⚙️</span><strong>4. ESP32 bekerja</strong><small>ulang-ulang tanpa henti</small></div>
      </div>
      <div class="grid2 sl">
        <div class="card"><h3>⚙️ Setup</h3><p>Arahan di sini dijalankan <strong>sekali sahaja</strong> bila ESP32 dihidupkan.</p></div>
        <div class="card"><h3>🔁 Main loop</h3><p>Arahan di sini diulang <strong>berkali-kali tanpa henti</strong>, dari atas ke bawah, selagi ESP32 hidup.</p></div>
      </div>
    </div></section>

    <section class="sec"><div class="wrap">
      <h2>HIGH dan LOW: Bahasa Pin ESP32</h2>
      <div class="grid2 hl-grid">
        <div><p class="lead">Setiap pin output hanya ada dua keadaan, seperti suis lampu:</p>
          <ul class="hl-list"><li><b class="hi">HIGH</b> = pin mengeluarkan <strong>3.3 V</strong>, arus mengalir, LED <strong>menyala</strong>.</li><li><b class="lo">LOW</b> = pin <strong>0 V</strong>, tiada arus, LED <strong>padam</strong>.</li></ul>
          <p>Cuba tekan suis program di sebelah.</p></div>
        <div class="card hl-demo"><svg viewBox="0 0 360 170" id="hlSvg" aria-hidden="true"></svg>
          <div class="seg" role="group" aria-label="Keadaan pin D25"><button type="button" data-v="LOW" class="on">LOW</button><button type="button" data-v="HIGH">HIGH</button></div>
          <p class="hl-read" id="hlRead" aria-live="polite"></p></div>
      </div>
    </div></section>

    <section class="sec"><div class="wrap"><h2>Kuiz Pantas</h2><div id="quiz"></div></div></section>`;

  /* ---------- Papan interaktif ---------- */
  const svg = $("#espSvg");
  let sel = null;
  function paint() {
    svg.innerHTML = board(0, 0, { parts: true, pwr: true, led: sel === "led2" });
    $$("[data-part]", svg).forEach((g) => { g.classList.add("prt"); g.classList.toggle("sel", g.dataset.part === sel); g.classList.toggle("seen", seen.has(g.dataset.part)); });
  }
  function pick(id) {
    sel = id; seen.add(id); S.espSeen = [...seen]; save();
    const p = PARTS.find((x) => x[0] === id);
    $("#espInfo").innerHTML = `<div class="dev-h"><span class="dev-i">${p[1]}</span><h3>${esc(p[2])}</h3></div><p>${p[3]}</p>${seen.size === PARTS.length ? gateNote("🎉 <strong>Semua bahagian dikenali!</strong> Lihat bahagian di bawah, kemudian tunggu kata kunci daripada pensyarah.") : ""}`;
    $$("#partList button").forEach((b) => b.classList.toggle("on", b.dataset.part === id));
    $$("#partList button").forEach((b) => b.classList.toggle("seen", seen.has(b.dataset.part)));
    paint(); beep(1100, 60, 0.03, "sine");
    $("#eCount").textContent = seen.size; $("#eBar").style.width = (seen.size / PARTS.length) * 100 + "%";
    if (seen.size === PARTS.length && !S.espDone) { S.espDone = true; save(); chime(); if (E.mini) E.mini.say("ESP32 DIKENALI!"); }
  }
  $("#espInfo").innerHTML = `<div class="dev-empty"><span>👆</span><h3>Tekan satu bahagian</h3><p>Tekan pada papan atau pada senarai di bawah.</p></div>`;
  paint();
  $("#eCount").textContent = seen.size; $("#eBar").style.width = (seen.size / PARTS.length) * 100 + "%";
  $$("#partList button").forEach((b) => b.classList.toggle("seen", seen.has(b.dataset.part)));
  svg.addEventListener("click", (e) => { const g = e.target.closest("[data-part]"); if (g) pick(g.dataset.part); });
  $("#partList").addEventListener("click", (e) => { const b = e.target.closest("button[data-part]"); if (b) pick(b.dataset.part); });

  /* ---------- Aliran arahan (animasi berturut) ---------- */
  const fls = $$("#flow .fl");
  let fi = 0;
  if (!E.reduceMotion) setInterval(() => { fls.forEach((f, i) => f.classList.toggle("on", i === fi)); fi = (fi + 1) % fls.length; }, 1100);

  /* ---------- HIGH / LOW ---------- */
  function hl(v) {
    const on = v === "HIGH";
    $("#hlSvg").innerHTML = `
      <rect x="10" y="40" width="90" height="90" rx="10" class="hl-esp"/><text x="55" y="80" text-anchor="middle" class="hl-t">ESP32</text><text x="55" y="100" text-anchor="middle" class="hl-s">pin D25</text>
      <path d="M100,70 H170" class="hl-w${on ? " live" : ""}"/><rect x="170" y="60" width="50" height="20" rx="4" class="hl-res"/><path d="M220,70 H262" class="hl-w${on ? " live" : ""}"/>
      <circle cx="280" cy="70" r="18" class="hl-led${on ? " on" : ""}"/><path d="M298,70 H340 V140 H55 V130" class="hl-w${on ? " live" : ""}"/><text x="200" y="158" text-anchor="middle" class="hl-s">kembali ke GND (0 V)</text>
      <text x="140" y="56" text-anchor="middle" class="hl-v">${on ? "3.3 V" : "0 V"}</text>`;
    $("#hlRead").innerHTML = on ? "<strong>HIGH:</strong> 3.3 V keluar dari pin, arus mengalir, LED menyala 💡" : "<strong>LOW:</strong> pin 0 V, tiada arus, LED padam.";
    $$(".hl-demo .seg button").forEach((b) => b.classList.toggle("on", b.dataset.v === v));
  }
  hl("LOW");
  $(".hl-demo .seg").addEventListener("click", (e) => { const b = e.target.closest("button[data-v]"); if (b) { hl(b.dataset.v); beep(b.dataset.v === "HIGH" ? 1000 : 500, 60, 0.03, "sine"); } });

  quiz($("#quiz"), [
    { q: "Bahagian manakah yang menjadi \"otak\" ESP32?", opts: ["Port USB", "Cip ESP-WROOM-32", "Butang EN", "Antena"], a: 1, why: "Cip ESP-WROOM-32 mengandungi pemproses, Wi-Fi dan Bluetooth." },
    { q: "Arahan dalam <em>Main loop</em> dijalankan…", opts: ["Sekali sahaja", "Berulang-ulang tanpa henti", "Bila butang ditekan sahaja"], a: 1, why: "Main loop diulang dari atas ke bawah selagi ESP32 hidup." },
    { q: "Jika pin ditetapkan <strong>HIGH</strong>, LED yang disambung akan…", opts: ["Padam", "Menyala", "Berkelip sendiri"], a: 1, why: "HIGH = 3.3 V keluar dari pin, jadi arus mengalir dan LED menyala." }
  ]);
};
