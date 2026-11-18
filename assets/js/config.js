/* ESP32 Bandar Pintar: tetapan program.
   Untuk lawatan sekolah lain, tukar maklumat dalam EVENT sahaja.
   Kata kunci disimpan dalam base64 (bukan rahsia sebenar, cuma tidak terus terbaca).
   Untuk menukar kata kunci: buka tools/kunci.html, taip perkataan baharu, salin baris yang dijana ke sini. */
window.EBP_CONFIG = {
  EVENT: {
    program: "Lawatan dan Demonstrasi Pusat TVET UniMAP",
    modul: "Pengenalan kepada ESP32: Bandar Pintar",
    tarikh: "Khamis, 19 November 2026",
    masa: "11.00 pagi – 12.30 tengah hari",
    // Baris LCD di halaman hadapan: maksimum 20 aksara setiap baris (huruf besar, nombor, tanda baca asas)
    lcd: ["ESP32 BANDAR PINTAR", "PENGENALAN ESP32", "19 NOV 2026 11.00PG"],
    tempat: "Makmal Industri UniMAP–Tessolve, Pusat TVET UniMAP",
    peserta: "Pelajar Tingkatan 3, SMK Sultanah Asma, Alor Setar"
  },
  TEAM: {
    oleh: [
      { nama: "Ts. Dr. Mohd Zamri Bin Zahir Ahmad", jawatan: "Pensyarah Kanan", fakulti: "Fakulti Kejuruteraan & Teknologi Elektronik", singkatan: "FKTEN", foto: "assets/img/zamri.jpg" }
    ],
    instruktor: [
      { nama: "Ts. Dr. Mohd Wafi Bin Nasrudin", jawatan: "Pensyarah Kanan", fakulti: "Fakulti Kejuruteraan & Teknologi Elektronik", singkatan: "FKTEN", foto: "assets/img/wafi.jpg" },
      { nama: "Ts. Dr. Mohamad Shukor Bin Abdul Rahim", jawatan: "Pensyarah Kanan", fakulti: "Fakulti Kejuruteraan & Teknologi Elektrik", singkatan: "FKTE", foto: "assets/img/shukor.jpg" }
    ]
  },
  // Susunan litar lalai di Makmal Maya Misi 3 dan Hardware: "A" (jumper F-M) atau "B" (dua breadboard)
  SUSUNAN: "A",
  // Kata kunci 1 hingga 11 (base64), mengikut halaman yang dibuka. Kata kunci halaman yang lebih jauh juga diterima (cth. JURUTERA terus ke Penutup jika Misi Khas dilangkau)
  KEYS: ["UElOVEFS", "T1RBSw==", "Q0FIQVlB", "TUVOQVJB", "S0VMSVA=", "U0lNUEFORw==", "TElUQVI=", "VVBMT0FE", "SVNZQVJBVA==", "RElTS08=", "SlVSVVRFUkE="],
  // Kod mod fasilitator (base64)
  FAC: "WkFNTTIwMjY="
};
