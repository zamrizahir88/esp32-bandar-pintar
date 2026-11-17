/* Penutup: tahniah, imbas semula, kerjaya dan terima kasih */
window.EBP_PAGE = function (E) {
  const { $, esc, S, CFG, LCD, MISSIONS, confetti, chime, beep, lcdNames, pairName } = E;
  const nm = pairName();
  const did = (k) => !!S.done[k];
  const recap = [
    ["🏙️", "Mikropengawal ada di sekeliling kita: Input → Proses → Output.", true],
    ["🧠", "ESP32 ialah \"otak\" dengan pin GPIO, Wi-Fi dan Bluetooth.", true],
    ["💡", "LED perlukan perintang 220 Ω supaya arus selamat.", true],
    ...[1, 2, 3].map((m) => [MISSIONS[m].ico, `Misi ${m}: ${MISSIONS[m].t} (maya ${did("maya" + m) ? "✓" : "–"} · hardware ${did("hw" + m) ? "✓" : "–"})`, did("maya" + m) || did("hw" + m)])
  ];
  const jobs = [
    ["🔧", "Juruteknik Elektronik", "Memasang, menguji dan membaiki litar serta peralatan elektronik."],
    ["🌐", "Jurutera IoT", "Membina peranti pintar yang berhubung dengan internet, seperti rumah pintar."],
    ["🏭", "Jurutera Automasi", "Memprogram mesin dan robot di kilang supaya bekerja secara automatik."],
    ["🔬", "Jurutera Semikonduktor", "Mereka bentuk dan menguji cip, seperti cip di dalam ESP32."]
  ];
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
      <p class="lead">Kemahiran yang kamu cuba hari ini digunakan oleh ramai profesional. Laluan <strong>TVET</strong> dan kejuruteraan boleh membawa kamu ke sana!</p>
      <div class="grid2 jobs">${jobs.map(([i, t, d]) => `<div class="card job"><span>${i}</span><div><h3>${t}</h3><p>${d}</p></div></div>`).join("")}</div>
    </div></section>
    <section class="sec"><div class="wrap grid2">
      <div class="card"><h2>🏠 Teruskan di Rumah</h2><p><strong>TUNIOT</strong> percuma dan boleh dibuka di mana-mana pelayar: <a href="http://easycoding.tn/esp32/demos/code/" target="_blank" rel="noopener">easycoding.tn</a>.</p><p>Laman ini juga boleh dibuka semula untuk mengulang Makmal Maya.</p></div>
      <div class="card"><h2>🙏 Terima Kasih</h2><p>Terima kasih kepada guru-guru dan pelajar <strong>${esc(CFG.EVENT.peserta.split(", ").slice(1).join(", ") || CFG.EVENT.peserta)}</strong> kerana menyertai program ini.</p>
        <p class="thanks">${[...CFG.TEAM.oleh, ...CFG.TEAM.instruktor].map((p) => `${esc(p.nama)}`).join("<br>")}</p><p class="small-mut">Pusat TVET UniMAP · Universiti Malaysia Perlis</p></div>
    </div></section>`;

  const L = new LCD($("#endLcd"), 20, 4, { dot: 5, gap: 1, margin: 14, on: true });
  const n = lcdNames() || "SYABAS!";
  const go = () => L.type(["*** TAHNIAH! ***", n, "JURUTERA MUDA", "BANDAR PINTAR ♥"], { center: true, tick: () => beep(2400, 8, 0.012) }).then(() => L.blink(3));
  go();
  setTimeout(() => { confetti(160); chime(); }, E.reduceMotion ? 0 : 900);
  $("#partyBtn").addEventListener("click", () => { confetti(200); chime(); go(); });
};
