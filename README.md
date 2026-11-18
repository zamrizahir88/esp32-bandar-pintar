# ESP32 Bandar Pintar

Laman interaktif untuk latihan pengenalan ESP32 kepada pelajar sekolah menengah (Pusat TVET UniMAP).
HTML, CSS dan JavaScript biasa sahaja: tiada langkah binaan. Dihoskan di GitHub Pages (cawangan `main`, folder akar).

## Aliran
Halaman Hadapan (LCD) → Peta Perjalanan → Bandar Pintar → Kenali ESP32 → LED & Perintang →
Makmal Maya Misi 1–3 → Hardware Misi 1–3 → Misi Khas: Lampu Disko (jika ada masa) → Penutup.
Setiap halaman selepas Peta Perjalanan dibuka dengan **kata kunci** yang diberi oleh pensyarah. Kata kunci halaman yang lebih jauh juga diterima: contohnya JURUTERA di Hardware Misi 3 terus membuka Penutup jika Misi Khas dilangkau.

## Untuk pensyarah
- **Mod fasilitator:** tekan logo UniMAP 5 kali, atau `Ctrl` + `Shift` + `F`. Ia memaparkan semua kata kunci,
  membuka semua halaman, menukar susunan litar (A / B) dan menetapkan semula PC.
- **Maklumat program** (tarikh, sekolah, pensyarah, susunan lalai): `assets/js/config.js`.
- **Makmal Maya:** setiap misi ada 4 stesen (① Pasang Litar, ② Susun Blok, ③ Salin & Upload dalam Arduino IDE maya, ④ Uji). Pelajar menyalin kod dari laman ini ke Arduino IDE sebenar; TUNIOT tidak perlu dibuka.
- **Tukar kata kunci:** buka `tools/kunci.html`, kemudian salin baris yang dijana ke `config.js`.
- Kemajuan dan nama disimpan dalam pelayar PC itu sahaja (localStorage, kunci `ebp-v1`). Tiada data dihantar ke mana-mana.
- Selepas menukar fail JS/CSS: tukar `V` dalam `tools/make-pages.js` dan jalankan `node tools/make-pages.js`
  untuk mengemas kini tag versi (GitHub Pages menyimpan cache selama 10 minit).

## Kredit
Dibangunkan oleh Ts. Dr. Mohd Zamri Bin Zahir Ahmad (FKTEN, UniMAP). Lukisan SVG asal.
Kod blok mengikut TUNIOT for ESP32 (easycoding.tn).

## Kunci kemajuan dan Mod Projektor (18 Nov 2026)
- Kata kunci hanya membuka halaman seterusnya bila halaman semasa siap: kuiz lulus (semua betul), 4 stesen Makmal Maya siap, atau "Kami berjaya!" di Hardware. Jika belum, popup memberitahu apa yang perlu disiapkan. Mod fasilitator mengatasi kunci ini.
- Mod Projektor (fasilitator sahaja): butang 🖥️ di bucu kiri bawah, atau dalam dialog Mod Fasilitator. Biasa / Besar (125%) / Sangat Besar (150%); dihadkan supaya lebar kandungan sekurang-kurangnya 1000 px.
