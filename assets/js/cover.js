/* Halaman hadapan: ESP32 + LCD 20×4 (I2C), nama pasangan, maklumat program dan kredit */
window.EBP_PAGE = function (E) {
  const { $, esc, CFG, S, save, LCD, board, pinXY, beep, chime, lcdNames, cleanName } = E;
  const EV = CFG.EVENT;

  $("#coverKick").textContent = EV.program;

  /* ---------- Babak: LCD + ESP32 + wayar ---------- */
  const bx = 330, by = 400, k = 1.25;
  const P = (row, n) => pinXY(bx, by, k, row, n);
  const [gx, gy] = P("top", "GND"), [vx, vy] = P("top", "VIN"), [dx, dy] = P("bot", "D21"), [cx, cy] = P("bot", "D22");
  const hp = [110, 140, 170, 200], hy = 336;
  const wires = [
    { c: "#1b1b1b", lab: "GND", d: `M${hp[0]},${hy} V366 H${gx} V${gy}` },
    { c: "#d93a2b", lab: "VCC", d: `M${hp[1]},${hy} V382 H${vx} V${vy}` },
    { c: "#2f6fe0", lab: "SDA", d: `M${hp[2]},${hy} V566 H${dx} V${dy}` },
    { c: "#e6b400", lab: "SCL", d: `M${hp[3]},${hy} V578 H${cx} V${cy}` }
  ];
  const holes = [[78, 38], [922, 38], [78, 292], [922, 292]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" class="lcd-hole"/>`).join("");
  $("#lcdScene").innerHTML = `<svg viewBox="0 0 1000 600" role="img" aria-label="Papan ESP32 disambung kepada LCD 20 kali 4 melalui empat wayar: GND, VCC, SDA dan SCL">
      <rect x="60" y="20" width="880" height="290" rx="12" class="lcd-pcb"/>${holes}
      <rect x="95" y="50" width="810" height="230" rx="6" class="lcd-bezel"/>
      <foreignObject x="103" y="58" width="794" height="214"><div xmlns="http://www.w3.org/1999/xhtml" class="lcd-glass"><canvas id="bigLcd"></canvas></div></foreignObject>
      <rect x="88" y="300" width="140" height="22" rx="3" class="lcd-bp"/>
      ${hp.map((x, i) => `<rect x="${x - 6}" y="318" width="12" height="18" class="hdr"/><text x="${x}" y="315" text-anchor="middle" class="hdr-t">${wires[i].lab}</text>`).join("")}
      <text x="940" y="336" text-anchor="end" class="scene-lab">LCD 20×4 (I2C)</text>
      ${wires.map((w, i) => `<path d="${w.d}" class="wire" data-c="${w.c}" id="w${i}"/>`).join("")}
      <g id="espG">${board(bx, by, { k })}</g>
      <text x="${bx + 225 * k}" y="${by - 14}" text-anchor="middle" class="scene-lab">ESP32 (otak)</text>
    </svg>`;
  const L = new LCD($("#bigLcd"), 20, 4, { dot: 5, gap: 1, margin: 14 });
  const credit = `OLEH: ${CFG.TEAM.oleh.map((p) => p.nama).join(", ")} * INSTRUKTOR: ${CFG.TEAM.instruktor.map((p) => p.nama).join(" * ")} * ${EV.program}`;
  const tick = () => beep(2400, 8, 0.012);

  let on = false, run = 0;
  const btn = $("#pwrBtn"), hint = $("#coverHint"), form = $("#nameForm");
  function paintBoard() { $("#espG").innerHTML = board(bx, by, { k, pwr: on, hi: on ? ["t:GND", "t:VIN", "b:D21", "b:D22"] : [] }); }
  async function powerOn() {
    const my = ++run;
    on = true; btn.setAttribute("aria-pressed", "true"); btn.classList.add("on"); $(".pwr-t", btn).textContent = "Matikan ESP32";
    paintBoard(); beep(660, 80, 0.04, "sine");
    document.querySelectorAll(".wire").forEach((w, i) => setTimeout(() => { w.style.stroke = w.dataset.c; w.classList.add("live"); }, 120 * i));
    hint.textContent = "Arus mengalir dari ESP32 ke LCD melalui wayar…";
    await new Promise((r) => setTimeout(r, E.reduceMotion ? 0 : 650));
    if (my !== run) return;
    L.power(true);
    await L.type(EV.lcd.concat(["MASUKKAN NAMA ANDA"]), { center: true, tick });
    if (my !== run) return;
    if (S.names.some((n) => n.trim())) await showNames(my);
    else { L.marquee(3, credit); }
    hint.textContent = "ESP32 sedang menghantar teks ke LCD. Sekarang masukkan nama kamu.";
    form.hidden = false;
  }
  function powerOff() {
    run++; on = false; btn.setAttribute("aria-pressed", "false"); btn.classList.remove("on"); $(".pwr-t", btn).textContent = "Hidupkan ESP32";
    L.power(false); paintBoard(); beep(330, 90, 0.04, "sine");
    document.querySelectorAll(".wire").forEach((w) => { w.style.stroke = ""; w.classList.remove("live"); });
    hint.textContent = "ESP32 dimatikan. Tekan butang untuk menghidupkannya semula.";
  }
  async function showNames(my) {
    L.clearTimers();
    await L.type([EV.lcd[0], "SELAMAT DATANG", "JURUTERA MUDA:", lcdNames()], { center: true, tick });
    if (my !== run) return;
    await L.blink(2);
    chime();
  }
  btn.addEventListener("click", () => (on ? powerOff() : powerOn()));

  // Isi semula nama yang sudah disimpan
  form.a.value = S.names[0] || ""; form.b.value = S.names[1] || "";
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const a = cleanName(form.a.value), b = cleanName(form.b.value), err = $("#nameErr");
    if (!a.ok || !b.ok) { err.textContent = "Sila guna nama yang sopan, ya."; return; }
    if (!a.v) { err.textContent = "Taip sekurang-kurangnya satu nama."; return; }
    err.textContent = "";
    S.names = [a.v, b.v]; save();
    form.a.value = a.v; form.b.value = b.v;
    if (E.mini) E.mini.paint();
    if (!on) { await powerOn(); return; }
    showNames(run);
    hint.textContent = `Hai ${E.pairName()}! Nama kamu akan sentiasa ada di LCD kecil di atas setiap halaman.`;
  });

  /* ---------- Maklumat program ---------- */
  const row = (k2, v) => `<div class="ir"><dt>${k2}</dt><dd>${esc(v)}</dd></div>`;
  $("#infoCard").innerHTML = `<h2><span aria-hidden="true">📋</span> Maklumat Program</h2><dl class="info">
      ${row("Program", EV.program)}${row("Modul", EV.modul)}${row("Tarikh", EV.tarikh)}${row("Masa", EV.masa)}${row("Tempat", EV.tempat)}${row("Peserta", EV.peserta)}</dl>`;
  const person = (p) => `<div class="person"><img src="${p.foto}" alt="" width="72" height="72" loading="lazy"><div><strong>${esc(p.nama)}</strong><span>${esc(p.jawatan)}</span><span class="fac">${esc(p.fakulti)} (${esc(p.singkatan)})</span></div></div>`;
  $("#teamCard").innerHTML = `<h2><span aria-hidden="true">👨‍🏫</span> Disediakan Oleh</h2>${CFG.TEAM.oleh.map(person).join("")}
      <h2 class="mt"><span aria-hidden="true">👥</span> Instruktor</h2>${CFG.TEAM.instruktor.map(person).join("")}`;
};
