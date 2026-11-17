// Jana rangka HTML setiap halaman (jalankan: node tools/make-pages.js). Kandungan dilukis oleh skrip halaman.
const fs = require("fs");
const V = "4";
const pages = [
  ["perjalanan.html", "perjalanan", "Peta Perjalanan", "journey.js"],
  ["bandar.html", "bandar", "Bandar Pintar", "city.js"],
  ["esp32.html", "esp32", "Kenali ESP32", "esp32.js"],
  ["led.html", "led", "LED dan Perintang", "led.js"],
  ["maya-1.html", "maya1", "Makmal Maya: Misi 1", "lab.js"],
  ["maya-2.html", "maya2", "Makmal Maya: Misi 2", "lab.js"],
  ["maya-3.html", "maya3", "Makmal Maya: Misi 3", "lab.js"],
  ["hardware-1.html", "hw1", "Hardware: Misi 1", "lab.js", "hw.js"],
  ["hardware-2.html", "hw2", "Hardware: Misi 2", "lab.js", "hw.js"],
  ["hardware-3.html", "hw3", "Hardware: Misi 3", "lab.js", "hw.js"],
  ["penutup.html", "penutup", "Penutup", "end.js"]
];
for (const [file, step, title, ...js] of pages) {
  const html = `<!doctype html>
<html lang="ms">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · ESP32 Bandar Pintar</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=IBM+Plex+Mono:wght@500;600&family=IBM+Plex+Sans:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/site.css?v=${V}">
<link rel="stylesheet" href="assets/css/pages.css?v=${V}">
${js.includes("lab.js") ? `<link rel="stylesheet" href="assets/css/lab.css?v=${V}">
` : ""}
<link rel="icon" href="assets/img/icon.svg" type="image/svg+xml">
<script src="assets/js/config.js?v=${V}" defer></script>
<script src="assets/js/core.js?v=${V}" defer></script>
${js.map((j) => `<script src="assets/js/${j}?v=${V}" defer></script>`).join("\n")}
</head>
<body data-step="${step}">
<main id="main"></main>
<div class="wrap" id="gate"></div>
</body>
</html>
`;
  fs.writeFileSync(file, html);
}
// Kemas kini tag versi di index.html juga
let idx = fs.readFileSync("index.html", "utf8").replace(/\?v=\w+/g, "?v=" + V);
fs.writeFileSync("index.html", idx);
console.log("ok", pages.length);
