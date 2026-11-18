/* Penutup: LCD beranimasi, tahniah, imbas semula, kerjaya (dengan anggaran gaji) dan terima kasih */
window.EBP_PAGE = function (E) {
  const { $, esc, S, CFG, LCD, MISSIONS, confetti, chime, beep, lcdNames, pairName } = E;
  const nm = pairName();
  const did = (k) => !!S.done[k];
  const recap = [
    ["🏙️", "Mikropengawal ada di sekeliling kita: Input → Proses → Output.", true],
    ["🧠", "ESP32 ialah \"otak\" dengan pin GPIO, Wi-Fi dan Bluetooth. Setup berjalan sekali, Main loop berulang.", true],
    ["💡", "Arus mengalir dari + ke −. LED perlukan perintang 220 Ω supaya arus selamat.", true],
    ...[1, 2, 3].map((m) => [MISSIONS[m].ico, `Misi ${m}: ${MISSIONS[m].t} (maya ${did("maya" + m) ? "✓" : "–"} · hardware ${did("hw" + m) ? "✓" : "–"})`, did("maya" + m) || did("hw" + m)]),
    ...(did("disko") ? [["🪩", "Misi Khas: Lampu Disko ✓", true]] : [])
  ];
  // Anggaran gaji bulanan di Malaysia (RM), daripada tinjauan gaji dan iklan kerja 2025/2026
  const jobs = [
    ["🔧", "Juruteknik Elektronik", "Memasang, menguji dan membaiki litar serta peralatan elektronik di kilang dan makmal.", "Diploma / Sijil TVET", [2000, 3000], [3500, 5000]],
    ["🌐", "Jurutera IoT / Elektronik", "Membina peranti pintar yang berhubung dengan internet, seperti rumah dan bandar pintar.", "Ijazah Kejuruteraan", [3000, 4000], [6000, 10000]],
    ["🏭", "Jurutera Automasi", "Memprogram mesin, robot dan PLC di kilang supaya bekerja secara automatik.", "Ijazah Kejuruteraan", [3500, 4500], [6000, 10000]],
    ["🔬", "Jurutera Semikonduktor", "Mereka bentuk dan menguji cip, seperti cip di dalam ESP32. Banyak di Pulau Pinang dan Kulim.", "Ijazah Kejuruteraan", [3500, 5000], [7000, 12000]]
  ];
  const MAX = 12000, rm = (n) => "RM" + n.toLocaleString("en-MY");
  const bar = ([a, b], cls) => `<span class="sal-bar ${cls}"><i style="left:${(a / MAX) * 100}%;width:${((b - a) / MAX) * 100}%"></i></span>`;

  $("#main").innerHTML = `
    <section class="cover end-cover"><div class="wrap">
      <div class="end-lcd"><div class="end-pcb"><canvas id="endLcd"></canvas></div></div>
      <h1 class="end-h">Tahniah${nm ? `, <span>${esc(nm)}</span>` : ""}! 🎉</h1>
      <p class="end-p">Kamu kini seorang <strong>Jurutera Muda Bandar Pintar</strong>. Hari ini kamu telah memprogram mikropengawal sebenar!</p>
      <button type="button" class="btn amber big" id="partyBtn">🎊 Raikan!</button>
    </div></section>
    <section class="sec"><div class="wrap">
      <h2>Apa Yang Kamu Pelajari Hari Ini</h2>
      <ul class="recap">${recap.map(([i, t, ok]) => `<li class="${ok ? "ok" : ""}"><span>${i}</span>${t}</li>`).join("")}</ul>
    </div></section>
    <section class="sec"><div class="wrap">
      <h2>Kerjaya Masa Depan dalam Bidang Ini</h2>
      <p class="lead">Kemahiran yang kamu cuba hari ini digunakan oleh ramai profesional. Laluan <strong>TVET</strong> dan kejuruteraan boleh membawa kamu ke kerjaya yang <strong>stabil dan bergaji baik</strong>. Gaji bertambah apabila kemahiran dan pengalaman bertambah!</p>
      <div class="grid2 jobs">${jobs.map(([i, t, d, q, a, b]) => `<div class="card job"><span class="job-i">${i}</span><div class="job-b"><h3>${t}</h3><p>${d}</p><p class="job-q">🎓 ${q}</p>
        <div class="sal"><div class="sal-r"><span class="sal-l">Gaji permulaan</span>${bar(a, "a")}<strong>${rm(a[0])} – ${rm(a[1])}</strong></div>
        <div class="sal-r"><span class="sal-l">Selepas 5+ tahun</span>${bar(b, "b")}<strong>${rm(b[0])} – ${rm(b[1])}${b[1] >= 10000 ? "+" : ""}</strong></div></div></div></div>`).join("")}</div>
      <div class="sal-note"><strong>💡 Sebagai perbandingan:</strong> gaji penengah (median) pekerja di Malaysia ialah sekitar <strong>RM3,000</strong> sebulan. Jurutera berpengalaman boleh memperoleh <strong>2 hingga 4 kali ganda</strong> daripada itu.<br><small>Anggaran gaji bulanan kasar di Malaysia berdasarkan tinjauan gaji dan iklan kerja 2025–2026. Gaji sebenar bergantung pada syarikat, lokasi, kelulusan dan pengalaman.</small></div>
    </div></section>
    <section class="sec"><div class="wrap grid2">
      <div class="card"><h2>🏠 Teruskan di Rumah</h2><p>Blok yang kamu susun hari ini sama gaya dengan <strong>TUNIOT</strong>, perisian percuma yang boleh dibuka di mana-mana pelayar: <a href="http://easycoding.tn/esp32/demos/code/" target="_blank" rel="noopener">easycoding.tn</a>.</p><p>Laman ini juga boleh dibuka semula untuk mengulang Makmal Maya.</p></div>
      <div class="card"><h2>🙏 Terima Kasih</h2><p>Terima kasih kepada guru-guru dan pelajar <strong>${esc(CFG.EVENT.peserta.split(", ").slice(1).join(", ") || CFG.EVENT.peserta)}</strong> kerana menyertai program ini.</p>
        <p class="thanks">${[...CFG.TEAM.oleh, ...CFG.TEAM.instruktor, ...(CFG.TEAM.fasilitator || [])].map((p) => `${esc(p.nama)}`).join("<br>")}</p><p class="small-mut">Pusat TVET UniMAP · Universiti Malaysia Perlis</p></div>
    </div></section>`;

  /* ---------- LCD: babak berulang (taip, nama bergerak, kemajuan misi, bintang berkelip, terima kasih) ---------- */
  const L = new LCD($("#endLcd"), 20, 4, { dot: 5, gap: 1, margin: 14, on: true });
  const names = lcdNames() || "JURUTERA MUDA";
  const tick = () => beep(2400, 8, 0.012);
  const wait = (ms) => new Promise((r) => { L.timers.push(setTimeout(r, ms)); });
  const mk = (n, m) => n.padEnd(13) + (did("maya" + m) ? "✓" : "-") + "   " + (did("hw" + m) ? "✓" : "-");
  let alive = true;
  async function twinkle(ms, mid) {
    const end = performance.now() + ms;
    while (alive && performance.now() < end) {
      const rows = Array.from({ length: 4 }, () => Array.from({ length: 20 }, () => (Math.random() < 0.12 ? "*" : Math.random() < 0.05 ? "♥" : " ")).join(""));
      if (mid) { const t = L.center(mid); rows[1] = t.split("").map((c, i) => (c !== " " ? c : rows[1][i])).join(""); }
      L.buf = rows; L.draw(); await wait(220);
    }
  }
  async function scroll(row, text, ms) {
    const t = "    " + text.toUpperCase() + "    ";
    const end = performance.now() + ms;
    let i = 0;
    while (alive && performance.now() < end) { L.buf[row] = L.pad((t + t).slice(i, i + 20)); L.draw(); i = (i + 1) % t.length; await wait(200); }
  }
  async function fill(ms) {
    for (let c = 0; c <= 20 && alive; c++) { L.buf = L.buf.map((r, i) => (i === 3 ? L.pad("█".repeat(c)) : r)); L.draw(); await wait(ms / 20); }
  }
  async function show() {
    if (E.reduceMotion) { L.setAll(["*** TAHNIAH! ***", names, "JURUTERA MUDA", "BANDAR PINTAR ♥"], true); return; }
    while (alive) {
      await L.type(["*** TAHNIAH! ***", names, "JURUTERA MUDA", "BANDAR PINTAR ♥"], { center: true, tick });
      await L.blink(3); await wait(1600);
      await L.type(["MISI".padEnd(12) + "MAYA HW", mk("1 MENARA", 1), mk("2 BERKELIP", 2), mk("3 ISYARAT", 3)], { tick });
      await wait(2600);
      await twinkle(3200, "SYABAS!");
      L.setAll(["", "", "TERIMA KASIH!", ""], true);
      await scroll(1, names + " ♥ ESP32 BANDAR PINTAR ♥ UNIMAP", 5200);
      L.setAll(["MEMUAT NAIK MASA", "DEPAN KAMU...", "", ""], true);
      await fill(1800); L.set(2, "SIAP! 100%", true); await L.blink(2); await wait(1400);
    }
  }
  show();
  window.addEventListener("pagehide", () => { alive = false; L.clearTimers(); });
  setTimeout(() => { confetti(160); chime(); }, E.reduceMotion ? 0 : 900);
  $("#partyBtn").addEventListener("click", () => { confetti(200); chime(); });
};
