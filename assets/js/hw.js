/* Hardware Sebenar: rujukan dari Makmal Maya (litar, blok, kod) → pasang litar langkah demi langkah → salin kod → muat naik */
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
  const STEPS = (m === 3 ? ["wire"] : []).concat(["usb", "copy", "paste", "upload", "see"]);
  const lay = E.layout();
  const mayaBench = S.bench && S.bench[3];
  const ownBench = m === 3 && S.done.maya3 && mayaBench && mayaBench.res && mayaBench.res.every(Boolean);
  const phases = m === 3 ? [["🔴 Fasa Merah · 3 saat", "r", 4], ["🟢 Fasa Hijau · 3 saat", "g", SP.own ? S.prog[3].g.length : 4], ["🟡 Fasa Kuning · 1 saat", "y", SP.own ? S.prog[3].y.length : 4]] : null;
  const step = (id, title, body) => `<li class="hw-step${ticks[id] ? " ok" : ""}" data-s="${id}"><h3>${title}</h3>${body}<label class="hw-tick"><input type="checkbox" data-t="${id}"${ticks[id] ? " checked" : ""}> Siap</label></li>`;

  /* ---------- Langkah memasang litar Misi 3 (gambar berubah ikut langkah) ---------- */
  const wireTxt = lay === "B"
    ? "Cucuk satu hujung wayar <strong>jantan–jantan</strong> ke lubang <strong>di sebelah pin</strong> ESP32 pada Breadboard 1, dan hujung lain ke Breadboard 2."
    : "Hujung <strong>betina</strong> wayar dipasang terus pada <strong>pin ESP32</strong>, dan hujung <strong>jantan</strong> dicucuk ke breadboard.";
  const base = () => ({ esp: true, usb: false, res: [0, 0, 0], led: {}, wires: {} });
  const WSTEPS = [
    { t: "Cabut kabel USB", f: "", b: () => base(), d: "Pastikan kabel USB <strong>dicabut</strong>. Jangan sekali-kali memasang litar semasa ESP32 ada kuasa." },
    { t: "Pasang 3 perintang 220 Ω", f: "res", b: () => Object.assign(base(), { res: [1, 1, 1] }), d: "Pasang setiap perintang <strong>mendatar di baris c</strong>, seperti gambar. Perintang tiada arah, jadi boleh dipasang ke mana-mana arah." },
    { t: "Pasang 3 LED", f: "led", b: () => Object.assign(base(), { res: [1, 1, 1], led: { 27: "ok", 26: "ok", 25: "ok" } }), d: "Kaki <strong>panjang (+)</strong> di baris <strong>a</strong>, pada lajur yang sama dengan hujung kanan perintang. Kaki <strong>pendek (−)</strong> ke <strong>rel biru (−)</strong>. Hijau di kiri, kuning di tengah, merah di kanan." },
    { t: "Sambung wayar D27, D26, D25", f: "w", b: () => Object.assign(base(), { res: [1, 1, 1], led: { 27: "ok", 26: "ok", 25: "ok" }, wires: { 27: "u27", 26: "u26", 25: "u25" } }), d: `${wireTxt}<br><span class="wdot" style="background:#1f9d4c"></span><strong>D27</strong> → perintang LED hijau · <span class="wdot" style="background:#e0a800"></span><strong>D26</strong> → LED kuning · <span class="wdot" style="background:#d93a2b"></span><strong>D25</strong> → LED merah. Pin ini ialah terminal <strong>positif (+)</strong> bila HIGH.` },
    { t: "Sambung wayar GND ke rel biru (−)", f: "gnd", b: () => Object.assign(base(), { res: [1, 1, 1], led: { 27: "ok", 26: "ok", 25: "ok" }, wires: { 27: "u27", 26: "u26", 25: "u25", GND: "rail" } }), d: "Sambung pin <strong>GND</strong> ESP32 ke <strong>rel biru (−)</strong>. Semua kaki pendek LED berkongsi rel ini, jadi arus kembali ke GND (0 V) melalui wayar ini." },
    { t: "Navigator semak, kemudian sambung USB", f: "usb", b: () => Object.assign(L.FULL(), {}), lit: { 25: 1, 26: 1, 27: 1 }, d: "🧭 Navigator semak setiap kaki LED dan wayar sekali lagi, bandingkan dengan gambar. Baru sambung kabel USB. Titik kuning menunjukkan arus mengalir dari <strong>+ (pin)</strong> → perintang → LED → <strong>− (GND)</strong>." }
  ];
  let ws = Math.min(S.hw.ws3 || 0, WSTEPS.length - 1);
  const parts3 = [["🧠", "ESP32 30-pin", "1 unit"], ["🔌", "Kabel USB data", "1 unit"], ["▦", "Breadboard", lay === "B" ? "2 unit" : "1 unit"], ["🔴", "LED merah, kuning, hijau", "1 setiap warna"], ["〰️", "Perintang 220 Ω", "3 unit"], ["🧵", lay === "B" ? "Wayar jumper jantan–jantan" : "Wayar jumper betina–jantan", "4 utas"]];
  const wiring = m !== 3 ? "" : `
    <section class="sec" id="pasang"><div class="wrap">
      <div class="card"><div class="lab-h"><h2>🔌 Pasang Litar Langkah demi Langkah</h2><div class="seg lay-seg" role="group" aria-label="Susunan litar"><button type="button" data-l="A" class="${lay === "A" ? "on" : ""}">A · Jumper F-M</button><button type="button" data-l="B" class="${lay === "B" ? "on" : ""}">B · Dua breadboard</button></div></div>
        <p class="lead">Ikut langkah yang sama seperti di Makmal Maya. Gambar menunjukkan apa yang perlu dipasang pada setiap langkah.</p>
        <div class="parts">${parts3.map(([i, t, n]) => `<div class="part"><span>${i}</span><div><strong>${t}</strong><small>${n}</small></div></div>`).join("")}</div>
        <div class="wstep" id="wstep"></div>
      </div>
    </div></section>`;

  $("#main").innerHTML = `
    <section class="hero hero-hw"><div class="wrap">
      <span class="kick">🔧 Hardware Sebenar · Misi ${m} daripada 3</span>
      <h1>${M.ico} ${esc(M.t)}</h1>
      <p>Sama seperti di Makmal Maya, tetapi kali ini dengan ESP32 yang sebenar! <strong>Matlamat:</strong> ${goal}</p>
      ${pilot ? `<p class="roles">👩‍✈️ Juruterbang: <strong>${esc(pilot)}</strong> &nbsp;·&nbsp; 🧭 Navigator: <strong>${esc(nav)}</strong></p>` : ""}
    </div></section>
    <section class="sec"><div class="wrap">
      <div class="card ref">
        <div class="lab-h"><h2>📋 Rujukan dari Makmal Maya Kamu</h2><span class="ref-tag ${SP.own ? "own" : ""}">${SP.own ? "✓ Hasil kerja kamu sendiri" : "Contoh yang betul"}</span></div>
        <p class="ref-note">${SP.own ? `Inilah ${m === 3 ? "litar dan " : ""}program yang kamu siapkan dalam <strong>Makmal Maya Misi ${m}</strong>. Buat perkara yang sama pada ESP32 sebenar.` : `Kamu belum menyiapkan Makmal Maya Misi ${m}, jadi ini contoh yang betul. <a href="maya-${m}.html">Buka Makmal Maya Misi ${m}</a>.`}</p>
        <div class="ref-grid">
          <div><h3 class="ref-h">${m === 3 ? (ownBench ? "Litar kamu" : "Litar yang betul") : "ESP32 dan kabel USB"} <span class="sim-time" id="refTime"></span></h3><div id="refBench"></div>
            ${m === 3 ? `<div class="vlegend"><span><b class="pos">+</b> pin HIGH = 3.3 V</span><span><b class="neg">−</b> GND = 0 V</span><span><i class="flw"></i> arus + → −</span></div>` : ""}</div>
          <div><h3 class="ref-h">Blok kamu</h3><div id="refBlocks">${L.staticBlocks(PROG, phases)}</div></div>
        </div>
      </div>
    </div></section>
    ${wiring}
    <section class="sec"><div class="wrap">
      <h2>Muat Naik Program</h2>
      <ol class="hw-steps">
        ${step("usb", "Sambung ESP32 ke Komputer", `<p>Sambungkan kabel USB dari ESP32 ke PC. <strong>LED merah (PWR)</strong> pada papan akan menyala.</p>`)}
        ${step("copy", "Salin Kod dari Makmal Maya", `<p>${SP.own ? "Inilah kod <strong>program kamu sendiri</strong> dari Makmal Maya Misi " + m + "." : "Ini kod contoh yang betul untuk Misi " + m + "."} Tekan butang untuk menyalinnya.</p>
          <div class="copy-row"><button type="button" class="btn" id="copyBtn">📋 Salin kod</button><span id="copyMsg" aria-live="polite"></span></div>
          <pre class="code small" id="codeTxt">${esc(SRC)}</pre>`)}
        ${step("paste", "Tampal dalam Arduino IDE", `<p>Buka <strong>Arduino IDE</strong>. Klik di dalam ruang kod, tekan ${k("Ctrl")} + ${k("A")} (pilih semua), kemudian ${k("Ctrl")} + ${k("V")} untuk menggantikan kod lama.</p><p>Semak di atas: papan <strong>ESP32 Dev Module</strong> dan port <strong>COM</strong> sudah dipilih.</p>`)}
        ${step("upload", "Muat Naik ke ESP32", `<p>Tekan butang <strong>Upload</strong> (anak panah ➜). Tunggu sehingga muncul <strong>"Done uploading"</strong> (sekitar 30 hingga 60 saat).</p><p>Jika lama tersangkut di <strong>"Connecting…"</strong>, tekan dan tahan butang <strong>BOOT</strong> pada ESP32 sehingga peratus muat naik bermula, sama seperti di Makmal Maya.</p>`)}
        ${step("see", "Perhati Hasilnya!", `<p>${goal} Bandingkan dengan rujukan Makmal Maya di atas.</p>${m === 2 ? `<p>⭐ <strong>Cabaran:</strong> dalam Arduino IDE, tukar kedua-dua <code>delay(1000)</code> kepada <code>delay(200)</code> dan muat naik semula. Apa berlaku?</p>` : m === 3 ? `<p>⭐ <strong>Cabaran:</strong> tukar nombor dalam <code>delay(...)</code> dan muat naik semula. Bolehkah kamu jadikan lampu hijau lebih lama?</p>` : ""}`)}
      </ol>
      <details class="card trouble"><summary>🆘 Tidak menjadi? Semak di sini</summary><dl>
        <dt>Tiada port COM atau "Failed to connect"</dt><dd>Cabut dan sambung semula kabel USB. Pastikan kabel ialah kabel <strong>data</strong>. Pilih semula port dalam <em>Tools › Port</em>. Cuba tekan dan tahan <strong>BOOT</strong> semasa "Connecting…".</dd>
        <dt>"redefinition of 'void setup()'"</dt><dd>Kod lama masih ada. Klik dalam ruang kod, tekan ${k("Ctrl")} + ${k("A")} dahulu, kemudian ${k("Ctrl")} + ${k("V")}.</dd>
        <dt>Muat naik berjaya tetapi LED tidak menyala</dt><dd>${m === 3 ? "Semak kaki LED: kaki <strong>panjang (+)</strong> ke arah perintang, kaki <strong>pendek (−)</strong> ke rel biru (−). Semak wayar GND dan pin D25, D26, D27. Bandingkan dengan gambar langkah 6." : "Tekan butang <strong>EN</strong> sekali untuk memulakan semula program."}</dd>
      </dl></details>
      <div class="hw-done" id="hwDone"></div>
    </div></section>`;

  /* ---------- Rujukan: litar beranimasi ikut program kamu ---------- */
  const refBench = mayaBench && ownBench ? mayaBench : L.FULL();
  const blocksEl = $("#refBlocks");
  const sim = L.segments(PROG);
  let lastSeg = -2;
  const R = L.runner($("#refBench"), PROG, (st) => {
    $("#refBench").innerHTML = L.benchSvg({ layout: lay, m, bench: m === 3 ? Object.assign({}, refBench, { usb: true }) : Object.assign(L.FULL(), { esp: true, usb: true }), lit: st });
  }, { time: (t) => {
    $("#refTime").textContent = "⏱ " + L.secs(Math.floor(t / 100) * 100);
    const si = L.segAt(sim, t);
    if (si !== lastSeg) { lastSeg = si; const sg = si >= 0 ? sim.segs[si] : null; $$("[data-k]", blocksEl).forEach((el) => { const kk = +el.dataset.k; el.classList.toggle("run", sg ? kk >= sg.from && kk <= sg.to : !sim.total); }); }
  } });
  void R;

  /* ---------- Langkah memasang ---------- */
  function paintW() {
    const host = $("#wstep"); if (!host) return;
    const W = WSTEPS[ws];
    host.innerHTML = `<div class="ws-dots" role="tablist" aria-label="Langkah memasang">${WSTEPS.map((x, i) => `<button type="button" class="wsd${i === ws ? " on" : i < ws ? " ok" : ""}" data-w="${i}" aria-label="Langkah ${i + 1}: ${esc(x.t)}"${i === ws ? ' aria-current="step"' : ""}>${i < ws ? "✓" : i + 1}</button>`).join('<i class="wsl"></i>')}</div>
      <div class="ws-body"><div class="ws-pic">${L.benchSvg({ layout: lay, m: 3, bench: W.b(), lit: W.lit || {}, focus: W.f || "", view: W.f === "res" || W.f === "led" ? "bb" : "" })}</div>
        <div class="ws-txt"><span class="ws-k">Langkah ${ws + 1} daripada ${WSTEPS.length}</span><h3>${W.t}</h3><p>${W.d}</p>
          <div class="ws-nav"><button type="button" class="btn ghost" id="wPrev"${ws === 0 ? " disabled" : ""}>‹ Sebelum</button>${ws < WSTEPS.length - 1 ? `<button type="button" class="btn" id="wNext">✓ Siap, langkah seterusnya ›</button>` : `<button type="button" class="btn amber" id="wDone">${ticks.wire ? "✓ Litar siap" : "✓ Litar siap dipasang"}</button>`}</div></div></div>`;
  }
  if (m === 3) {
    paintW();
    $("#wstep").addEventListener("click", (e) => {
      const d = e.target.closest("[data-w]"); if (d) { ws = +d.dataset.w; }
      else if (e.target.closest("#wPrev")) ws = Math.max(0, ws - 1);
      else if (e.target.closest("#wNext")) { ws = Math.min(WSTEPS.length - 1, ws + 1); beep(1000, 50, 0.03, "sine"); }
      else if (e.target.closest("#wDone")) { ticks.wire = true; save(); chime(); paintDone(); const n = $('[data-s="usb"]'); if (n) n.scrollIntoView({ behavior: E.reduceMotion ? "auto" : "smooth", block: "center" }); }
      else return;
      S.hw.ws3 = ws; save(); paintW();
    });
  }

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
    const left = STEPS.filter((x) => !ticks[x]).length;
    host.innerHTML = `<div class="card done-card"><p>${all ? "Semua langkah siap! Tunjukkan hasil kepada instruktor, kemudian tekan butang ini." : `Tandakan setiap langkah sebagai <strong>Siap</strong> (${left} lagi). Bila LED berfungsi, tunjukkan kepada instruktor.`}</p><button type="button" class="btn amber big done-btn" id="doneBtn"${all ? "" : " disabled"}>🎉 Kami berjaya!</button></div>`;
    const b = $("#doneBtn");
    if (b) b.addEventListener("click", () => { S.done[key] = true; save(); chime(); confetti(); if (E.mini) E.mini.say(`HW MISI ${m} BERJAYA!`); paintDone(); });
  }
  paintDone();
};
