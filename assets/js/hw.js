/* Hardware Sebenar: salin kod dari Makmal Maya → Arduino IDE → muat naik, dengan litar susunan A / B */
window.EBP_PAGE = function (E) {
  const { $, $$, esc, S, save, beep, chime, confetti, MISSIONS } = E;
  const L = window.EBPLab;
  const m = +document.body.dataset.step.slice(-1), M = MISSIONS[m];
  const SP = L.savedProg(m), PROG = SP.prog, SRC = L.code(PROG);
  const names = S.names.filter((n) => n.trim());
  const pilot = names.length === 2 ? names[(m + 1) % 2] : null, nav = names.length === 2 ? names[m % 2] : null;
  S.hw = S.hw || {};
  const ticks = S.hw[m] || (S.hw[m] = {});
  const k = (t) => `<span class="kbd">${t}</span>`;
  const goal = {
    1: "LED <strong>biru</strong> pada papan ESP32 (GPIO2) <strong>menyala</strong> dan kekal menyala.",
    2: "LED biru <strong>berkelip</strong>: 1 saat menyala, 1 saat padam.",
    3: "LED pada breadboard bertukar: <strong>merah 3 s → hijau 3 s → kuning 1 s</strong>, berulang."
  }[m];
  const STEPS = ["usb", "copy", "paste", "upload", "see"];
  const step = (id, title, body) => `<li class="hw-step${ticks[id] ? " ok" : ""}" data-s="${id}"><h3>${title}</h3>${body}<label class="hw-tick"><input type="checkbox" data-t="${id}"${ticks[id] ? " checked" : ""}> Siap</label></li>`;
  const lay = E.layout();
  const parts3 = [["🧠", "ESP32 30-pin", "1 unit"], ["🔌", "Kabel USB data", "1 unit"], ["▦", "Breadboard", lay === "B" ? "2 unit" : "1 unit"], ["🔴", "LED merah, kuning, hijau", "1 setiap warna"], ["〰️", "Perintang 220 Ω", "3 unit"], ["🧵", lay === "B" ? "Wayar jumper jantan–jantan" : "Wayar jumper betina–jantan", "4 utas"]];
  const wireTxt = lay === "B"
    ? "Cucuk satu hujung wayar ke <strong>lubang kosong di sebelah pin</strong> ESP32 pada Breadboard 1, dan hujung lain ke Breadboard 2."
    : "Hujung <strong>betina</strong> wayar dipasang terus pada <strong>pin ESP32</strong>, dan hujung <strong>jantan</strong> dicucuk ke breadboard.";

  const wiring = m !== 3 ? "" : `
    <section class="sec"><div class="wrap">
      <div class="card"><div class="lab-h"><h2>🔌 Pasang Litar</h2><div class="seg lay-seg" role="group" aria-label="Susunan litar"><button type="button" data-l="A" class="${lay === "A" ? "on" : ""}">A · Jumper F-M</button><button type="button" data-l="B" class="${lay === "B" ? "on" : ""}">B · Dua breadboard</button></div></div>
        <div class="callout"><strong>⚠️ Cabut kabel USB dahulu</strong>sebelum memasang atau mengubah litar, sama seperti di Makmal Maya.</div>
        <div class="parts">${parts3.map(([i, t, n]) => `<div class="part"><span>${i}</span><div><strong>${t}</strong><small>${n}</small></div></div>`).join("")}</div>
        <div class="ws2"><div class="circ-wrap">${L.benchSvg({ layout: lay, m: 3, bench: L.FULL(), lit: { 25: 1, 26: 1, 27: 1 } })}</div>
        <div><h3>Langkah memasang</h3><ol class="wire-list">
          <li>Pasang 3 <strong>perintang 220 Ω</strong> mendatar di baris <strong>c</strong>, seperti gambar.</li>
          <li>Pasang 3 <strong>LED</strong>: kaki <strong>panjang (+)</strong> di baris <strong>a</strong> (lajur yang sama dengan hujung kanan perintang), kaki <strong>pendek (−)</strong> ke <strong>rel biru (−)</strong>.</li>
          <li>${wireTxt}</li>
          <li><span class="wdot" style="background:#1f9d4c"></span><strong>D27</strong> → LED hijau &nbsp; <span class="wdot" style="background:#e0a800"></span><strong>D26</strong> → LED kuning &nbsp; <span class="wdot" style="background:#d93a2b"></span><strong>D25</strong> → LED merah</li>
          <li><span class="wdot" style="background:#222"></span><strong>GND</strong> → rel biru (−).</li>
          <li>🧭 Navigator <strong>semak semula</strong> setiap wayar dan kaki LED, kemudian baru sambung kabel USB.</li></ol></div></div>
      </div>
    </div></section>`;

  $("#main").innerHTML = `
    <section class="hero hero-hw"><div class="wrap">
      <span class="kick">🔧 Hardware Sebenar · Misi ${m} daripada 3</span>
      <h1>${M.ico} ${esc(M.t)}</h1>
      <p>Sama seperti di Makmal Maya, tetapi kali ini dengan ESP32 yang sebenar! <strong>Matlamat:</strong> ${goal}</p>
      ${pilot ? `<p class="roles">👩‍✈️ Juruterbang: <strong>${esc(pilot)}</strong> &nbsp;·&nbsp; 🧭 Navigator: <strong>${esc(nav)}</strong></p>` : ""}
    </div></section>
    ${wiring}
    <section class="sec"><div class="wrap">
      <h2>Langkah Demi Langkah</h2>
      <ol class="hw-steps">
        ${step("usb", "Sambung ESP32 ke Komputer", `<p>Sambungkan kabel USB dari ESP32 ke PC. <strong>LED merah (PWR)</strong> pada papan akan menyala.</p>`)}
        ${step("copy", "Salin Kod dari Makmal Maya", `<p>${SP.own ? "Inilah kod <strong>program kamu sendiri</strong> dari Makmal Maya Misi " + m + "." : "Kamu belum menyiapkan Makmal Maya Misi " + m + ", jadi ini kod contoh yang betul."} Tekan butang untuk menyalinnya.</p>
          <div class="copy-row"><button type="button" class="btn" id="copyBtn">📋 Salin kod</button><span id="copyMsg" aria-live="polite"></span></div>
          <pre class="code small" id="codeTxt">${esc(SRC)}</pre>`)}
        ${step("paste", "Tampal dalam Arduino IDE", `<p>Buka <strong>Arduino IDE</strong>. Klik di dalam ruang kod, tekan ${k("Ctrl")} + ${k("A")} (pilih semua), kemudian ${k("Ctrl")} + ${k("V")} untuk menggantikan kod lama.</p><p>Semak di atas: papan <strong>ESP32 Dev Module</strong> dan port <strong>COM</strong> sudah dipilih.</p>`)}
        ${step("upload", "Muat Naik ke ESP32", `<p>Tekan butang <strong>Upload</strong> (anak panah ➜). Tunggu sehingga muncul <strong>"Done uploading"</strong> (sekitar 30 hingga 60 saat).</p><p>Jika lama tersangkut di <strong>"Connecting…"</strong>, tekan dan tahan butang <strong>BOOT</strong> pada ESP32 sehingga peratus muat naik bermula, sama seperti di Makmal Maya.</p>`)}
        ${step("see", "Perhati Hasilnya!", `<p>${goal}</p>${m === 2 ? `<p>⭐ <strong>Cabaran:</strong> dalam Arduino IDE, tukar kedua-dua <code>delay(1000)</code> kepada <code>delay(200)</code> dan muat naik semula. Apa berlaku?</p>` : m === 3 ? `<p>⭐ <strong>Cabaran:</strong> tukar nombor dalam <code>delay(...)</code> dan muat naik semula. Bolehkah kamu jadikan lampu hijau lebih lama?</p>` : ""}`)}
      </ol>
      <details class="card trouble"><summary>🆘 Tidak menjadi? Semak di sini</summary><dl>
        <dt>Tiada port COM atau "Failed to connect"</dt><dd>Cabut dan sambung semula kabel USB. Pastikan kabel ialah kabel <strong>data</strong>. Pilih semula port dalam <em>Tools › Port</em>. Cuba tekan dan tahan <strong>BOOT</strong> semasa "Connecting…".</dd>
        <dt>"redefinition of 'void setup()'"</dt><dd>Kod lama masih ada. Klik dalam ruang kod, tekan ${k("Ctrl")} + ${k("A")} dahulu, kemudian ${k("Ctrl")} + ${k("V")}.</dd>
        <dt>Muat naik berjaya tetapi LED tidak menyala</dt><dd>${m === 3 ? "Semak kaki LED: kaki <strong>panjang</strong> ke arah perintang, kaki <strong>pendek</strong> ke rel (−). Semak wayar GND dan pin D25, D26, D27." : "Tekan butang <strong>EN</strong> sekali untuk memulakan semula program."}</dd>
      </dl></details>
      <div class="hw-done" id="hwDone"></div>
    </div></section>`;

  $$("[data-t]").forEach((c) => c.addEventListener("change", () => {
    ticks[c.dataset.t] = c.checked; save();
    c.closest(".hw-step").classList.toggle("ok", c.checked);
    if (c.checked) beep(1100, 60, 0.03, "sine");
    paintDone();
  }));
  $$(".lay-seg button").forEach((b) => b.addEventListener("click", () => { S.layout = b.dataset.l; save(); location.reload(); }));
  $("#copyBtn").addEventListener("click", async () => {
    if (await E.copyText(SRC)) $("#copyMsg").textContent = "✓ Kod disalin! Sekarang tampal dalam Arduino IDE.";
    else { const r = document.createRange(); r.selectNodeContents($("#codeTxt")); const s2 = getSelection(); s2.removeAllRanges(); s2.addRange(r); $("#copyMsg").textContent = "Kod dipilih. Tekan Ctrl + C."; }
    beep(1000, 50, 0.03, "sine");
  });

  const key = "hw" + m;
  function paintDone() {
    const all = STEPS.every((x) => ticks[x]);
    const host = $("#hwDone");
    if (S.done[key]) {
      host.innerHTML = `<div class="win card"><div class="win-h"><span class="win-i">🏆</span><div><h2>Misi ${m} Berjaya dengan ESP32 Sebenar!</h2><p>Syabas${names.length ? ` ${esc(E.pairName())}` : ""}! Kamu baru sahaja memprogram mikropengawal sebenar.</p></div></div><p class="wait">⏳ Tunggu <strong>kata kunci</strong> daripada pensyarah untuk ke bahagian seterusnya.</p></div>`;
      return;
    }
    host.innerHTML = `<div class="card done-card"><p>${all ? "Semua langkah siap! Tunjukkan hasil kepada instruktor, kemudian tekan butang ini." : "Tandakan setiap langkah sebagai <strong>Siap</strong>. Bila LED berfungsi, tunjukkan kepada instruktor."}</p><button type="button" class="btn amber big done-btn" id="doneBtn"${all ? "" : " disabled"}>🎉 Kami berjaya!</button></div>`;
    const b = $("#doneBtn");
    if (b) b.addEventListener("click", () => { S.done[key] = true; save(); chime(); confetti(); if (E.mini) E.mini.say(`HW MISI ${m} BERJAYA!`); paintDone(); });
  }
  paintDone();
};
