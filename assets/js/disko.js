/* Misi Khas: Lampu Disko. Pelajar mengubah corak dan nilai delay untuk 3 LED (litar Misi 3), lihat pratonton,
   kemudian salin kod ke Arduino IDE dan muat naik semula. */
window.EBP_PAGE = function (E) {
  const { $, $$, esc, S, save, beep, chime, confetti } = E;
  const L = window.EBPLab;
  const LEDS = [["r", "25", "🔴", "merah"], ["y", "26", "🟡", "kuning"], ["g", "27", "🟢", "hijau"]];
  const P = {
    kelip: { t: "💃 Kelip Serentak", s: [{ r: 1, y: 1, g: 1, ms: 300 }, { r: 0, y: 0, g: 0, ms: 300 }] },
    kejar: { t: "🏃 Kejar-kejar", s: [{ r: 1, y: 0, g: 0, ms: 200 }, { r: 0, y: 1, g: 0, ms: 200 }, { r: 0, y: 0, g: 1, ms: 200 }] },
    pelangi: { t: "🌈 Pelangi", s: [{ r: 1, y: 1, g: 0, ms: 250 }, { r: 0, y: 1, g: 1, ms: 250 }, { r: 1, y: 0, g: 1, ms: 250 }] },
    pantul: { t: "🏓 Pantul", s: [{ r: 1, y: 0, g: 0, ms: 150 }, { r: 0, y: 1, g: 0, ms: 150 }, { r: 0, y: 0, g: 1, ms: 150 }, { r: 0, y: 1, g: 0, ms: 150 }] }
  };
  const clone = (a) => a.map((x) => Object.assign({}, x));
  S.disko = S.disko || { p: "kejar", s: clone(P.kejar.s) };
  const D = S.disko;
  if (!Array.isArray(D.s) || !D.s.length) D.s = clone(P.kejar.s);
  const names = S.names.filter((n) => n.trim());

  $("#main").innerHTML = `
    <section class="hero hero-disko"><div class="wrap">
      <span class="kick">⭐ Misi Khas · Bonus</span>
      <h1>🪩 Lampu Disko</h1>
      <p>Hebat, kamu sudah siap lampu isyarat! Sekarang guna litar yang <strong>sama</strong> (3 LED) untuk membuat <strong>lampu disko</strong>. Pilih corak, ubah nilai <strong>delay</strong>, lihat pratonton, kemudian muat naik semula ke ESP32.</p>
    </div></section>
    <section class="sec"><div class="wrap">
      <div class="card dk-card">
        <div class="lab-h"><h2>1. Pilih Corak</h2><span class="lab-tip">Litar Misi 3 tidak perlu diubah</span></div>
        <div class="dk-presets" id="presets">${Object.entries(P).map(([k, p]) => `<button type="button" class="dk-pre" data-p="${k}">${p.t}</button>`).join("")}</div>
        <div class="dk-grid">
          <div>
            <h3 class="dk-h">2. Ubah Corak dan Delay</h3>
            <p class="dk-tip">Setiap baris ialah satu langkah. Tekan lampu untuk hidupkan atau padamkan, dan taip berapa lama (ms) langkah itu kekal. <strong>Nombor kecil = lebih laju!</strong></p>
            <ol class="dk-steps" id="steps"></ol>
            <div class="dk-tools"><button type="button" class="btn ghost" id="addS">＋ Tambah langkah</button><button type="button" class="btn ghost" id="faster">⏩ Semua lebih laju</button><button type="button" class="btn ghost" id="slower">⏪ Semua lebih perlahan</button></div>
            <p class="dk-warn" id="warn" aria-live="polite"></p>
          </div>
          <div>
            <h3 class="dk-h">🖥️ Pratonton <span class="sim-time" id="dkTime"></span></h3>
            <div id="floor"></div>
            <div id="dkBench" class="dk-bench"></div>
          </div>
        </div>
      </div>
    </div></section>
    <section class="sec"><div class="wrap">
      <div class="card">
        <h2>3. Salin Kod dan Muat Naik Semula</h2>
        <ol class="dk-up"><li>Tekan <strong>📋 Salin kod</strong>.</li><li>Dalam <strong>Arduino IDE</strong>: klik ruang kod, tekan <span class="kbd">Ctrl</span> + <span class="kbd">A</span>, kemudian <span class="kbd">Ctrl</span> + <span class="kbd">V</span>.</li><li>Tekan <strong>➜ Upload</strong>. Tekan <strong>BOOT</strong> jika tersangkut di "Connecting…".</li><li>Lihat lampu disko kamu menyala! Ubah lagi corak atau delay, kemudian salin dan muat naik semula.</li></ol>
        <div class="copy-row"><button type="button" class="btn" id="copyBtn">📋 Salin kod</button><span id="copyMsg" aria-live="polite"></span></div>
        <pre class="code small" id="dkCode"></pre>
        <div class="dk-chal"><h3>⭐ Cabaran</h3><ul>
          <li>Jadikan corak <strong>Kejar-kejar</strong> dua kali lebih laju. Berapakah nilai delay yang baharu?</li>
          <li>Cipta corak sendiri dengan <strong>5 langkah</strong>.</li>
          <li>Cuba delay <strong>20 ms</strong>. Kenapa semua lampu nampak seperti menyala serentak? (Petunjuk: mata kita tidak cukup pantas!)</li></ul></div>
        <div id="dkDone"></div>
      </div>
    </div></section>`;

  /* ---------- Program daripada langkah ---------- */
  const prog = () => {
    const p = [];
    D.s.forEach((st) => { LEDS.forEach(([k, pin]) => p.push(L.mk.dw(pin, st[k] ? "HIGH" : "LOW"))); p.push(L.mk.delay(Math.max(0, Math.round(+st.ms || 0)))); });
    return p;
  };
  function paintSteps() {
    $("#steps").innerHTML = D.s.map((st, i) => `<li class="dk-row" data-i="${i}"><span class="dk-n">${i + 1}</span>
      <span class="dk-leds">${LEDS.map(([k, , ico, c]) => `<button type="button" class="dk-led ${k}${st[k] ? " on" : ""}" data-k="${k}" aria-pressed="${st[k] ? "true" : "false"}" aria-label="LED ${c} langkah ${i + 1}">${st[k] ? ico : "⚫"}</button>`).join("")}</span>
      <label class="dk-ms">delay <input type="number" min="0" max="5000" step="10" inputmode="numeric" value="${st.ms}" aria-label="Delay langkah ${i + 1} dalam ms"> ms</label>
      <button type="button" class="bk-x dk-x" aria-label="Buang langkah ${i + 1}"${D.s.length <= 1 ? " disabled" : ""}>✕</button></li>`).join("");
    $$("#presets .dk-pre").forEach((b) => b.classList.toggle("on", b.dataset.p === D.p));
  }
  let R = null;
  function update(full) {
    save();
    if (full) paintSteps();
    const pr = prog();
    $("#dkCode").textContent = L.code(pr);
    const min = Math.min(...D.s.map((x) => +x.ms || 0));
    $("#warn").innerHTML = D.s.every((x) => !x.r && !x.y && !x.g) ? "Semua lampu padam dalam setiap langkah. Hidupkan sekurang-kurangnya satu lampu!" : min < 30 ? "👀 Delay sangat kecil! Lampu bertukar terlalu laju sehingga mata kita nampak ia seperti menyala serentak." : "";
    if (R) R.stop();
    R = L.runner($("#floor"), pr, (st) => {
      $("#floor").innerHTML = floor(st);
      $("#dkBench").innerHTML = L.benchSvg({ layout: E.layout(), m: 3, bench: L.FULL(), lit: st, view: "bb", flow: false });
    }, { time: (t) => { $("#dkTime").textContent = "⏱ " + L.secs(Math.floor(t / 100) * 100); } });
  }
  function floor(st) {
    const on = (p) => !!st[p];
    const beam = (x, p, c) => on(p) ? `<path d="M${x},16 L${x - 70},250 L${x + 70},250Z" fill="${c}" opacity=".26"/><ellipse cx="${x}" cy="246" rx="74" ry="14" fill="${c}" opacity=".55"/>` : "";
    return `<svg viewBox="0 0 520 260" class="sim-svg dk-floor" aria-hidden="true">
      <defs><linearGradient id="dkf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14082b"/><stop offset="1" stop-color="#2b1250"/></linearGradient></defs>
      <rect width="520" height="260" fill="url(#dkf)"/>
      ${Array.from({ length: 10 }, (_, i) => `<rect x="${i * 52}" y="214" width="52" height="46" fill="${(i % 2) ? "#2a1a4a" : "#36225e"}"/>`).join("")}
      ${beam(130, 25, "#ff3b2f")}${beam(260, 26, "#ffcc00")}${beam(390, 27, "#2ee06a")}
      <path d="M260,0 V44" stroke="#9aa7b3" stroke-width="2"/>
      <g class="dk-ball"><circle cx="260" cy="64" r="20" fill="#cfd8e3"/>${Array.from({ length: 12 }, (_, i) => `<rect x="${244 + (i % 4) * 8}" y="${50 + Math.floor(i / 4) * 9}" width="7" height="8" fill="${["#fff", "#aab6c4", "#e7edf3"][i % 3]}" opacity=".9"/>`).join("")}</g>
      ${[70, 200, 320, 450].map((x, i) => `<g transform="translate(${x} 214)"><g class="dancer d${i % 2}"><circle cy="-46" r="9" fill="#0b0618"/><path d="M0,-36 V-12 M0,-30 L-14,${i % 2 ? -44 : -20} M0,-30 L14,${i % 2 ? -20 : -44} M0,-12 L-10,8 M0,-12 L10,8" stroke="#0b0618" stroke-width="6" stroke-linecap="round" fill="none"/></g></g>`).join("")}
      ${[[130, 25, "#ff3b2f"], [260, 26, "#ffcc00"], [390, 27, "#2ee06a"]].map(([x, p, c]) => `${on(p) ? `<circle cx="${x}" cy="16" r="20" fill="${c}" opacity=".4" class="jglow"/>` : ""}<circle cx="${x}" cy="16" r="9" fill="${on(p) ? c : "#1a1026"}" stroke="${on(p) ? "#fff" : "#3a2a55"}" stroke-width="2"/>`).join("")}
    </svg>`;
  }

  $("#presets").addEventListener("click", (e) => { const b = e.target.closest("[data-p]"); if (!b) return; D.p = b.dataset.p; D.s = clone(P[D.p].s); beep(900, 50, 0.03, "sine"); update(true); });
  $("#steps").addEventListener("click", (e) => {
    const row = e.target.closest(".dk-row"); if (!row) return; const i = +row.dataset.i;
    const led = e.target.closest(".dk-led");
    if (led) { D.s[i][led.dataset.k] = D.s[i][led.dataset.k] ? 0 : 1; D.p = "sendiri"; beep(D.s[i][led.dataset.k] ? 1200 : 600, 40, 0.03, "sine"); update(true); return; }
    if (e.target.closest(".dk-x") && D.s.length > 1) { D.s.splice(i, 1); D.p = "sendiri"; beep(400, 60, 0.03, "sine"); update(true); }
  });
  $("#steps").addEventListener("input", (e) => {
    const inp = e.target.closest("input"); if (!inp) return; const i = +inp.closest(".dk-row").dataset.i;
    let v = Math.round(+inp.value); if (!isFinite(v) || v < 0) v = 0; if (v > 5000) v = 5000;
    D.s[i].ms = v; D.p = "sendiri"; update(false); $$("#presets .dk-pre").forEach((b) => b.classList.remove("on"));
  });
  $("#addS").addEventListener("click", () => { if (D.s.length >= 8) { $("#warn").textContent = "Maksimum 8 langkah."; return; } D.s.push({ r: 0, y: 0, g: 0, ms: 200 }); D.p = "sendiri"; beep(900, 50, 0.03, "sine"); update(true); });
  $("#faster").addEventListener("click", () => { D.s.forEach((x) => { x.ms = Math.max(10, Math.round(x.ms / 2)); }); D.p = "sendiri"; beep(1300, 50, 0.03, "sine"); update(true); });
  $("#slower").addEventListener("click", () => { D.s.forEach((x) => { x.ms = Math.min(5000, Math.round(x.ms * 2)); }); D.p = "sendiri"; beep(500, 50, 0.03, "sine"); update(true); });
  $("#copyBtn").addEventListener("click", async () => {
    const t = $("#dkCode").textContent;
    if (await E.copyText(t)) $("#copyMsg").textContent = "✓ Kod disalin! Tampal dalam Arduino IDE.";
    else { const r = document.createRange(); r.selectNodeContents($("#dkCode")); const s2 = getSelection(); s2.removeAllRanges(); s2.addRange(r); $("#copyMsg").textContent = "Kod dipilih. Tekan Ctrl + C."; }
    beep(1000, 50, 0.03, "sine");
  });
  function paintDone() {
    const h = $("#dkDone");
    if (S.done.disko) { h.innerHTML = `<div class="win card"><div class="win-h"><span class="win-i">🪩</span><div><h2>Lampu Disko Berjaya!</h2><p>Syabas${names.length ? ` ${esc(E.pairName())}` : ""}! Kamu telah mencipta corak lampu sendiri dengan mengubah program.</p></div></div><p class="wait">⏳ Tunggu <strong>kata kunci</strong> daripada pensyarah untuk ke Penutup.</p></div>`; return; }
    h.innerHTML = `<div class="done-card"><p>Bila lampu disko menyala pada ESP32 sebenar, tunjukkan kepada instruktor dan tekan butang ini.</p><button type="button" class="btn amber big" id="dkOk">🪩 Disko kami berjaya!</button></div>`;
    $("#dkOk").addEventListener("click", () => { S.done.disko = true; save(); chime(); confetti(200); if (E.mini) E.mini.say("DISKO BERJAYA!"); paintDone(); });
  }
  update(true);
  paintDone();
};
