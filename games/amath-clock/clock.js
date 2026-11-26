(() => {
"use strict";
const $ = s => document.querySelector(s);
const app = $("#app");
const KEY = "kruau-amath-clock";
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } };
const store = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
const defCfg = { min: 22, names: ["ทีม A", "ทีม B"], first: 0, score: true, rotate: true, sound: true };
let S = load();
if (!S || !S.cfg) S = { cfg: defCfg };
S.cfg = Object.assign({}, defCfg, S.cfg);

/* ---------- audio / wake / vibrate ---------- */
let ac = null;
function beep(f = 880, d = .15, n = 1) {
  if (!S.cfg.sound) return;
  try { ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    for (let k = 0; k < n; k++) { const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime + k * (d + .08);
      o.frequency.value = f; g.gain.setValueAtTime(.25, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d); } } catch (e) {}
}
const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };
let wake = null;
async function keepAwake() { try { if (navigator.wakeLock && !wake) { wake = await navigator.wakeLock.request("screen"); wake.addEventListener("release", () => { wake = null; }); } } catch (e) {} }
document.addEventListener("visibilitychange", () => { if (!document.hidden && S.started && !S.ended) keepAwake(); });

/* ---------- helpers ---------- */
function fmt(ms) {
  const neg = ms < 0; let s = neg ? Math.ceil(-ms / 1000) : Math.ceil(ms / 1000);
  const m = Math.floor(s / 60); s %= 60;
  return (neg ? "−" : "") + (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
}
const overMin = ms => ms < 0 ? Math.ceil(-ms / 60000 - 1e-9) : 0;
const penalty = ms => overMin(ms) * 10;
const sum = a => a.reduce((x, y) => x + y, 0);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/* ======================= SETUP ======================= */
function setup() {
  stopLoop();
  const c = S.cfg, live = S.started && !S.ended;
  app.className = "setup";
  app.innerHTML = `
  <header class="top"><div class="logo">⏱️</div><div><h1>นาฬิกาเอแม็ท</h1><p>นาฬิกากดสลับ 2 ฝั่ง · เวลาติดลบได้ · หักคะแนนเกินเวลาอัตโนมัติ</p></div></header>
  ${live ? `<button type="button" class="resume" id="resume">▶ กลับไปเกมที่ค้างอยู่ · ${esc(S.names[0])} ${fmt(S.left[0])} | ${esc(S.names[1])} ${fmt(S.left[1])}</button>` : ""}
  <section class="card">
    <h3>เวลาฝั่งละ</h3>
    <div class="seg" id="min">${[18, 20, 22].map(m => `<button type="button" data-v="${m}" class="${c.min === m ? "on" : ""}">${m} นาที</button>`).join("")}<button type="button" data-v="x" class="${[18, 20, 22].includes(c.min) ? "" : "on"}">กำหนดเอง</button></div>
    <div class="cust" ${[18, 20, 22].includes(c.min) ? "hidden" : ""}><input type="number" id="cmin" min="1" max="99" value="${c.min}" inputmode="numeric"> นาที</div>
    <p class="hint">กติกางานศิลปหัตถกรรม: ฝั่งละ 22 นาที (ประถมปรับเป็น 18–20 นาทีได้ ตามที่กรรมการแจ้ง) · เกินเวลาหักนาทีละ 10 คะแนน เศษวินาทีปัดเป็น 1 นาที</p>
    <h3>ชื่อทีม</h3>
    <div class="names"><label><span class="dot d0"></span><input id="n0" value="${esc(c.names[0])}" maxlength="18"></label><label><span class="dot d1"></span><input id="n1" value="${esc(c.names[1])}" maxlength="18"></label></div>
    <h3>ฝั่งที่เริ่มเล่นก่อน</h3>
    <div class="seg" id="first"><button type="button" data-v="0" class="${c.first === 0 ? "on" : ""}">${esc(c.names[0])}</button><button type="button" data-v="1" class="${c.first === 1 ? "on" : ""}">${esc(c.names[1])}</button></div>
    <label class="tg"><input type="checkbox" id="o-score" ${c.score ? "checked" : ""}> จดคะแนนแต่ละตาในแอป <small>(รวมคะแนนและสรุปผลให้)</small></label>
    <label class="tg"><input type="checkbox" id="o-rotate" ${c.rotate ? "checked" : ""}> จอแนวตั้ง: หมุนฝั่งบนให้หันหน้าเข้าหาผู้เล่นตรงข้าม</label>
    <label class="tg"><input type="checkbox" id="o-sound" ${c.sound ? "checked" : ""}> เสียงเตือน (เหลือ 1 นาที / หมดเวลา / ทุกนาทีที่เกิน)</label>
  </section>
  <button type="button" class="btn big" id="go">⏱️ ${live ? "เริ่มเกมใหม่" : "เริ่มเกม"}</button>
  <section class="card how"><h3>วิธีใช้</h3><ol>
    <li>วางเครื่องกลางโต๊ะ แต่ละฝั่งดูครึ่งจอของตัวเอง</li>
    <li>ลงเบี้ย ขานคะแนนเสร็จแล้ว <b>แตะครึ่งจอของตัวเอง</b> เวลาจะสลับไปฝั่งตรงข้าม</li>
    <li>ตรวจสมการหรือเรียกกรรมการ กด <b>⏸ พัก</b> ตรงกลาง</li>
    <li>เวลาหมดแล้วนาฬิกาเดินต่อเป็นเลขติดลบสีแดง และแสดงคะแนนที่จะถูกหัก</li>
    <li>กด ✏️ ที่ฝั่งตัวเองเพื่อจดคะแนนตานั้น ระหว่างที่อีกฝั่งกำลังคิด</li>
  </ol></section>`;
  app.querySelectorAll("#min button").forEach(b => b.onclick = () => {
    app.querySelectorAll("#min button").forEach(x => x.classList.toggle("on", x === b));
    const cu = app.querySelector(".cust");
    if (b.dataset.v === "x") { cu.hidden = false; $("#cmin").focus(); } else { cu.hidden = true; c.min = +b.dataset.v; }
  });
  $("#cmin").oninput = e => { const v = Math.max(1, Math.min(99, +e.target.value || 1)); c.min = v; };
  app.querySelectorAll("#first button").forEach(b => b.onclick = () => { c.first = +b.dataset.v; app.querySelectorAll("#first button").forEach(x => x.classList.toggle("on", x === b)); });
  ["n0", "n1"].forEach((id, i) => $("#" + id).oninput = e => { c.names[i] = e.target.value.trim() || (i ? "ทีม B" : "ทีม A"); app.querySelectorAll("#first button")[i].textContent = c.names[i]; });
  $("#o-score").onchange = e => c.score = e.target.checked;
  $("#o-rotate").onchange = e => c.rotate = e.target.checked;
  $("#o-sound").onchange = e => c.sound = e.target.checked;
  if ($("#resume")) $("#resume").onclick = () => { play(); setPaused(true); };
  $("#go").onclick = () => {
    if (live && !confirm("มีเกมที่ค้างอยู่ จะเริ่มเกมใหม่แทนใช่ไหม?")) return;
    const ms = c.min * 60000;
    S = { cfg: c, names: c.names.slice(), left: [ms, ms], total: ms, turn: c.first, running: false, paused: false, started: false, ended: false, scores: [[], []], turns: [0, 0], warned: [false, false], overBeep: [0, 0], log: [] };
    try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume && ac.resume(); } catch (e) {}
    store(); play();
  };
}

/* ======================= PLAY ======================= */
let raf = 0, last = 0, saveT = 0;
function stopLoop() { cancelAnimationFrame(raf); raf = 0; }
function loop(t) {
  if (S.running && !S.paused && !S.ended) {
    const dt = t - (last || t); last = t;
    const i = S.turn; const before = S.left[i]; S.left[i] -= dt; const now = S.left[i];
    if (!S.warned[i] && before > 60000 && now <= 60000) { S.warned[i] = true; beep(880, .12, 2); }
    if (before > 0 && now <= 0) { beep(440, .5, 1); buzz([300, 100, 300]); }
    const om = overMin(now); if (om > 1 && om > S.overBeep[i]) { S.overBeep[i] = om; beep(330, .25, 1); }
    if (om === 1 && !S.overBeep[i]) S.overBeep[i] = 1;
    if (t - saveT > 1000) { saveT = t; store(); }
  } else last = t;
  paint();
  raf = requestAnimationFrame(loop);
}
function play() {
  app.className = "play" + (S.cfg.rotate ? " rot" : "");
  app.innerHTML = `
  <div class="half h1 ${S.cfg.rotate ? "flip" : ""}" data-i="1">${halfHTML(1)}</div>
  <div class="mid">
    <button type="button" class="mb" id="menu" aria-label="เมนู">☰</button>
    <button type="button" class="mb wide" id="pause">⏸ พัก</button>
    <button type="button" class="mb" id="undo" aria-label="ย้อนการสลับ">↶</button>
    <button type="button" class="mb end" id="end">🏁 จบเกม</button>
  </div>
  <div class="half h0" data-i="0">${halfHTML(0)}</div>
  <div class="overlay" id="ov" hidden></div>`;
  app.querySelectorAll(".half").forEach(h => {
    h.addEventListener("pointerdown", e => {
      if (e.target.closest(".sc, .kp")) return;
      tapHalf(+h.dataset.i);
    });
  });
  bindScore(0); bindScore(1);
  $("#pause").onclick = togglePause;
  $("#undo").onclick = undoSwitch;
  $("#end").onclick = () => confirmBox("จบเกมแล้วสรุปผล?", "นาฬิกาจะหยุด แล้วไปหน้าสรุปคะแนน", "จบเกม", endGame);
  $("#menu").onclick = () => { if (S.started && !S.paused) { S.paused = true; store(); } setup(); };
  keepAwake();
  stopLoop(); last = 0; raf = requestAnimationFrame(loop);
}
function halfHTML(i) {
  return `<div class="hn"><span class="dot d${i}"></span><b>${esc(S.names[i])}</b><span class="tc" id="tc${i}"></span></div>
    <div class="time" id="t${i}">${fmt(S.left[i])}</div>
    <div class="pen" id="p${i}"></div>
    <div class="tap" id="hint${i}"></div>
    ${S.cfg.score ? `<div class="sc"><button type="button" class="scb" id="sb${i}">✏️ จดคะแนน</button><span class="tot">รวม <b id="tot${i}">${sum(S.scores[i])}</b></span><span class="lastsc" id="ls${i}"></span></div>
    <div class="kp" id="kp${i}" hidden><div class="kd"><span>คะแนนตานี้</span><b id="kv${i}">0</b></div><div class="kg">${[1, 2, 3, 4, 5, 6, 7, 8, 9, "⌫", 0, "✓"].map(k => `<button type="button" data-k="${k}" class="${k === "✓" ? "ok" : ""}">${k}</button>`).join("")}</div><div class="kx"><button type="button" data-k="del">ลบคะแนนตาล่าสุด</button><button type="button" data-k="x">ปิด</button></div></div>` : ""}`;
}
function bindScore(i) {
  if (!S.cfg.score) return;
  const kp = $("#kp" + i); let val = "";
  const show = () => { $("#kv" + i).textContent = val || "0"; };
  $("#sb" + i).onclick = e => { e.stopPropagation(); val = ""; show(); kp.hidden = false; };
  kp.querySelectorAll("button").forEach(b => b.onclick = e => {
    e.stopPropagation(); const k = b.dataset.k;
    if (k === "x") { kp.hidden = true; return; }
    if (k === "del") { const v = S.scores[i].pop(); store(); paintScores(); kp.hidden = true; if (v != null) toast(`ลบคะแนน ${v} ของ ${S.names[i]} แล้ว`); return; }
    if (k === "⌫") { val = val.slice(0, -1); show(); return; }
    if (k === "✓") { if (val !== "") { S.scores[i].push(+val); store(); paintScores(); } kp.hidden = true; return; }
    if (val.length < 3) { val = (val === "0" ? "" : val) + k; show(); }
  });
}
function paintScores() {
  for (const i of [0, 1]) {
    const t = $("#tot" + i); if (!t) continue;
    t.textContent = sum(S.scores[i]);
    const a = S.scores[i]; $("#ls" + i).textContent = a.length ? `ตาล่าสุด +${a[a.length - 1]} (${a.length} ตา)` : "";
  }
}
function tapHalf(i) {
  if (S.ended) return;
  if (S.paused) { togglePause(); return; }
  if (!S.started) {
    if (i !== S.turn) { toast(`${S.names[S.turn]} เริ่มก่อน · แตะฝั่ง ${S.names[S.turn]} เพื่อเริ่ม`); }
    else { S.started = true; S.running = true; S.log.push({ t: Date.now(), ev: "start" }); beep(660, .1); buzz(30); store(); }
    return;
  }
  if (i !== S.turn) return; /* แตะฝั่งที่ไม่ใช่ตาตัวเอง ไม่ทำอะไร */
  S.log.push({ from: i, left: S.left.slice() });
  S.turns[i]++; S.turn = 1 - i; last = 0;
  beep(i ? 740 : 990, .07); buzz(25); store();
}
function undoSwitch() {
  const l = S.log; const k = l.length - 1;
  if (k < 0 || l[k].from == null) { toast("ย้อนไม่ได้"); return; }
  const e = l.pop(); S.turn = e.from; S.turns[e.from]--; toast(`ย้อนกลับเป็นตาของ ${S.names[e.from]} (เวลาที่เดินไปแล้วไม่คืน)`); store();
}
function togglePause() { setPaused(!S.paused); }
function setPaused(p) {
  if (!S.started || S.ended) return;
  S.paused = p; last = 0; store();
  const ov = $("#ov"); if (!ov) return;
  if (S.paused) { ov.hidden = false; ov.innerHTML = `<div class="pbox"><b>⏸ พักเวลา</b><p>ตรวจสมการ / เรียกกรรมการ</p><button type="button" class="btn big" id="resumeP">▶ เดินเวลาต่อ (ตา ${esc(S.names[S.turn])})</button></div>`; $("#resumeP").onclick = e => { e.stopPropagation(); setPaused(false); }; }
  else { ov.hidden = true; ov.innerHTML = ""; }
  $("#pause").textContent = S.paused ? "▶ เดินต่อ" : "⏸ พัก";
}
function paint() {
  for (const i of [0, 1]) {
    const el = $("#t" + i); if (!el) return;
    const ms = S.left[i], h = el.parentNode;
    el.textContent = fmt(ms);
    const active = S.started && S.turn === i && !S.ended, waiting = !S.started && S.turn === i;
    h.classList.toggle("active", active); h.classList.toggle("wait", waiting);
    h.classList.toggle("neg", ms < 0); h.classList.toggle("low", ms >= 0 && ms <= 60000);
    h.classList.toggle("paused", !!S.paused);
    $("#p" + i).textContent = ms < 0 ? `เกินเวลา ${overMin(ms)} นาที · หัก ${penalty(ms)} คะแนน` : "";
    $("#tc" + i).textContent = `${S.turns[i]} ตา`;
    $("#hint" + i).textContent = waiting ? "👆 แตะเพื่อเริ่มเวลา" : active ? "ลงเบี้ยแล้ว แตะเพื่อสลับ" : S.started ? "รออีกฝั่ง…" : "";
  }
  paintScores();
}
function confirmBox(title, msg, yes, fn) {
  const ov = $("#ov"); ov.hidden = false;
  ov.innerHTML = `<div class="pbox"><b>${title}</b><p>${msg}</p><div class="row"><button type="button" class="btn danger" id="cy">${yes}</button><button type="button" class="btn ghost" id="cn">ยกเลิก</button></div></div>`;
  $("#cy").onclick = () => { ov.hidden = true; fn(); };
  $("#cn").onclick = () => { ov.hidden = true; if (S.paused) setPaused(true); };
}
function toast(m) { let t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); } t.textContent = m; t.classList.add("on"); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove("on"), 2400); }

/* ======================= RESULT ======================= */
function endGame() {
  S.ended = true; S.running = false; stopLoop(); store();
  try { wake && wake.release(); } catch (e) {}
  result();
}
function result() {
  app.className = "setup";
  const raw = [0, 1].map(i => S.cfg.score ? sum(S.scores[i]) : (S.manual ? S.manual[i] : 0));
  const draw = () => {
    const pen = [0, 1].map(i => penalty(S.left[i]));
    const net = [0, 1].map(i => raw[i] - pen[i]);
    const diff = Math.abs(net[0] - net[1]), w = net[0] === net[1] ? -1 : net[0] > net[1] ? 0 : 1;
    $("#rt").innerHTML = `<tr><th></th><th><span class="dot d0"></span>${esc(S.names[0])}</th><th><span class="dot d1"></span>${esc(S.names[1])}</th></tr>
      <tr><td>คะแนนจากกระดาน</td>${[0, 1].map(i => `<td><input type="number" inputmode="numeric" class="ri" data-i="${i}" value="${raw[i]}"></td>`).join("")}</tr>
      <tr><td>เวลาคงเหลือ</td>${[0, 1].map(i => `<td class="${S.left[i] < 0 ? "red" : ""}">${fmt(S.left[i])}</td>`).join("")}</tr>
      <tr><td>หักเกินเวลา</td>${[0, 1].map(i => `<td class="${pen[i] ? "red" : ""}">${pen[i] ? "−" + pen[i] : "0"}</td>`).join("")}</tr>
      <tr class="net"><td>คะแนนสุทธิ</td>${[0, 1].map(i => `<td><b>${net[i]}</b></td>`).join("")}</tr>
      <tr><td>ผล</td>${[0, 1].map(i => `<td>${w < 0 ? "🤝 เสมอ (1)" : w === i ? "🏆 ชนะ (2)" : "แพ้ (0)"}</td>`).join("")}</tr>`;
    $("#rd").innerHTML = w < 0 ? "เสมอกัน" : `<b>${esc(S.names[w])}</b> ชนะ ผลต่าง <b>${diff}</b> คะแนน${diff > 150 ? ` <small>(รุ่นประถมนับผลต่างสูงสุด 150)</small>` : ""}`;
    app.querySelectorAll(".ri").forEach(inp => inp.oninput = () => { raw[+inp.dataset.i] = +inp.value || 0; S.manual = raw.slice(); store(); const pos = inp.selectionStart; draw(); const n = app.querySelector(`.ri[data-i="${inp.dataset.i}"]`); n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} });
  };
  app.innerHTML = `<header class="top"><div class="logo">🏁</div><div><h1>สรุปผลเกม</h1><p>เวลา ${S.cfg.min} นาทีต่อฝั่ง · ${S.turns[0] + S.turns[1]} ตา</p></div></header>
  <section class="card"><table class="rt" id="rt"></table><p class="rd" id="rd"></p>
  <p class="hint">${S.cfg.score ? "คะแนนรวมจากที่จดไว้ แก้ได้ เช่น ปรับคะแนนเบี้ยค้างแป้นท้ายเกม" : "กรอกคะแนนจากใบบันทึกได้เลย"} · หักเกินเวลานาทีละ 10 คะแนน เศษวินาทีปัดเป็น 1 นาที</p></section>
  ${S.cfg.score ? `<section class="card"><h3>คะแนนรายตา</h3><div class="tl">${[0, 1].map(i => `<div><b><span class="dot d${i}"></span>${esc(S.names[i])}</b><p>${S.scores[i].map((v, k) => `<span>${k + 1}) ${v}</span>`).join("") || "–"}</p></div>`).join("")}</div></section>` : ""}
  <div class="row"><button type="button" class="btn" id="again">🔁 เกมใหม่ (สลับฝั่งเริ่ม)</button><button type="button" class="btn ghost" id="back">↩ กลับไปแก้เวลา</button><button type="button" class="btn ghost" id="hm">⚙️ ตั้งค่า</button></div>`;
  draw();
  $("#again").onclick = () => { S.cfg.first = 1 - S.cfg.first; const ms = S.cfg.min * 60000; S = { cfg: S.cfg, names: S.cfg.names.slice(), left: [ms, ms], total: ms, turn: S.cfg.first, running: false, paused: false, started: false, ended: false, scores: [[], []], turns: [0, 0], warned: [false, false], overBeep: [0, 0], log: [] }; store(); play(); };
  $("#back").onclick = () => { S.ended = false; S.running = true; store(); play(); setPaused(true); };
  $("#hm").onclick = setup;
}

/* ---------- keyboard (for computers) ---------- */
document.addEventListener("keydown", e => {
  if (!app.classList.contains("play") || e.target.tagName === "INPUT") return;
  if (e.key === " ") { e.preventDefault(); tapHalf(S.turn); }
  else if (e.key === "p" || e.key === "P" || e.key === "Escape") togglePause();
});

if (S.started && S.ended) result();
else if (S.started) { play(); setPaused(true); toast("กลับมาที่เกมเดิม · เวลาพักไว้ กด ▶ เพื่อเดินต่อ"); }
else setup();
})();
