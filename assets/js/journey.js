/* Peta Perjalanan: hala tuju program, hasil pembelajaran dan peraturan */
window.EBP_PAGE = function (E) {
  const { $, esc, MISSIONS, pairName } = E;
  const nm = pairName();
  const M = MISSIONS.slice(1);
  const stops = [
    { ico: "🏙️", t: "Bandar Pintar", min: "10 min", d: "Terokai sebuah bandar maya. Cari di mana mikropengawal bersembunyi dalam kehidupan harian kita." },
    { ico: "🧠", t: "Kenali ESP32", min: "10 min", d: "Kenali bahagian papan ESP32, \"otak\" yang akan kita program hari ini." },
    { ico: "💡", t: "LED & Perintang", min: "10 min", d: "Bagaimana LED berfungsi, dan kenapa ia perlukan perintang supaya tidak terbakar." },
    { ico: "💻", t: "Makmal Maya", min: "20 min", d: "Susun blok program dan uji di simulator. Selamat untuk cuba dan silap!", m: true },
    { ico: "🔧", t: "Hardware Sebenar", min: "35 min", d: "Buat misi yang sama dengan ESP32, LED dan perintang yang sebenar.", m: true },
    { ico: "🎓", t: "Penutup", min: "5 min", d: "Imbas semula apa yang kamu pelajari dan kenali kerjaya dalam bidang ini." }
  ];
  $("#main").innerHTML = `
    <section class="hero"><div class="wrap">
      <span class="kick">Peta Perjalanan</span>
      <h1>${nm ? `Hai <span class="hi-name">${esc(nm)}</span>!` : "Selamat Datang, Jurutera Muda!"}</h1>
      <p>Hari ini kamu akan menjadi jurutera muda yang ditugaskan menghidupkan sistem lampu sebuah bandar pintar. Inilah perjalanan kita.</p>
    </div></section>

    <section class="sec"><div class="wrap">
      <h2>Di Akhir Program, Kamu Boleh…</h2>
      <div class="grid3 goals">
        <div class="goal"><span class="goal-i">🧠</span><p>Menerangkan <strong>ESP32</strong> sebagai "otak" peranti pintar: <strong>Input → Proses → Output</strong>.</p></div>
        <div class="goal"><span class="goal-i">🧩</span><p>Menyusun <strong>blok program</strong> untuk menghidupkan, memadam dan mengelipkan LED.</p></div>
        <div class="goal"><span class="goal-i">🔌</span><p>Memasang <strong>litar LED dan perintang</strong> dan memuat naik program ke ESP32 sebenar.</p></div>
      </div>
    </div></section>

    <section class="sec"><div class="wrap">
      <h2>Laluan Kita</h2>
      <ol class="road">
        ${stops.map((s, i) => `<li class="stop" style="--i:${i}">
          <div class="stop-n"><span>${s.ico}</span><b>${i + 1}</b></div>
          <div class="stop-b"><div class="stop-h"><h3>${s.t}</h3><span class="pill">${s.min}</span></div><p>${s.d}</p>
          ${s.m ? `<div class="stop-m">${M.map((m) => `<span class="mchip">${m.ico} Misi ${m.n}: ${m.t}</span>`).join("")}</div>` : ""}</div>
        </li>`).join("")}
      </ol>
      <p class="road-note">💻 Makmal Maya dahulu, kemudian 🔧 hardware sebenar dengan misi yang <strong>sama</strong>. Bila kamu sudah faham di skrin, litar sebenar jadi lebih mudah!</p>
    </div></section>

    <section class="sec"><div class="wrap">
      <h2>Peraturan Jurutera Muda</h2>
      <div class="grid2 rules">
        <div class="card rule"><span class="rule-i">👩‍✈️🧭</span><div><h3>Bekerja Berpasangan</h3><p><strong>Juruterbang</strong> pegang tetikus. <strong>Navigator</strong> baca arahan dan semak. <strong>Tukar peranan setiap misi!</strong></p></div></div>
        <div class="card rule"><span class="rule-i">🔑</span><div><h3>Tunggu Kata Kunci</h3><p>Setiap bahagian dikunci. Pensyarah akan beri kata kunci bila semua sudah sedia, jadi kita bergerak bersama.</p></div></div>
        <div class="card rule"><span class="rule-i">🧪</span><div><h3>Jangan Takut Salah</h3><p>Jurutera sebenar pun mencuba berkali-kali. Kalau salah, baca petunjuk dan cuba lagi.</p></div></div>
        <div class="card rule"><span class="rule-i">🙋</span><div><h3>Angkat Tangan</h3><p>Tersangkut? Angkat tangan. Pensyarah dan instruktor akan datang membantu.</p></div></div>
      </div>
    </div></section>`;
};
