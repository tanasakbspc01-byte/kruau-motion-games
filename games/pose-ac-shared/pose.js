/* เกมขยับร่างกายแบบจำแนกด้วยท่าทาง — อ่านเนื้อหาจาก window.PG */
(() => {
"use strict";
const C = window.PG;
const $ = s => document.querySelector(s);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const KEY = "kruau-pose-" + C.key;
let prefs = { mode: C.modes[0].id, rounds: 10, think: 6, sound: true };
try { Object.assign(prefs, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) {}
if (!C.modes.some(m => m.id === prefs.mode)) prefs.mode = C.modes[0].id;
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) {} };
const MODE = () => C.modes.find(m => m.id === prefs.mode);

/* sound + speech */
let ac = null, thVoice = null;
function tone(f, d = .12, type = "sine", v = .18) { if (!prefs.sound) return; try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(v, ac.currentTime); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + d); o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + d); } catch (e) {} }
const sfx = { tick: () => tone(660, .1, "square", .08), go: () => { tone(523, .12); setTimeout(() => tone(784, .25), 120); }, reveal: () => { tone(880, .1); setTimeout(() => tone(1175, .2), 100); } };
function pickVoice() { try { const v = speechSynthesis.getVoices(); thVoice = v.find(x => /th/i.test(x.lang)) || null; } catch (e) {} }
try { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; } catch (e) {}
function speak(t) { if (!prefs.sound || !t) return; try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = "th-TH"; if (thVoice) u.voice = thVoice; u.rate = .9; u.pitch = 1.1; speechSynthesis.speak(u); } catch (e) {} }

/* stick figures */
const L = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
const legs = `${L(50, 68, 42, 108)}${L(50, 68, 58, 108)}<path d="M18 112H82" class="gnd"/>`;
const FIG = {
  sit: `<circle cx="46" cy="40" r="10"/>${L(46, 51, 46, 78)}${L(46, 58, 76, 60)}${L(46, 60, 72, 68)}${L(46, 78, 70, 82)}${L(70, 82, 70, 108)}${L(46, 78, 28, 86)}${L(28, 86, 30, 108)}<path d="M18 112H86" class="gnd"/>`,
  stand: `<circle cx="50" cy="16" r="10"/>${L(50, 27, 50, 68)}${L(50, 36, 38, 64)}${L(50, 36, 62, 64)}${legs}`,
  jump: `<circle cx="50" cy="20" r="10"/>${L(50, 31, 50, 64)}${L(50, 38, 26, 10)}${L(50, 38, 74, 10)}${L(50, 64, 34, 92)}${L(50, 64, 66, 92)}<path d="M18 114H82" class="gnd"/><path d="M14 30l-6-4M14 44H6M86 30l6-4M86 44h8" class="mv"/>`,
  cross: `<circle cx="50" cy="16" r="10"/>${L(50, 27, 50, 68)}${L(30, 30, 68, 58)}${L(70, 30, 32, 58)}${legs}`,
  chest: `<circle cx="50" cy="16" r="10"/>${L(50, 27, 50, 68)}<path d="M50 36L34 50L47 50M50 36L66 50L53 50"/><path d="M50 44c-3-4-8-1-5 3l5 4 5-4c3-4-2-7-5-3z" class="heart"/>${legs}`,
  wide: `<circle cx="50" cy="16" r="10"/>${L(50, 27, 50, 68)}${L(50, 36, 10, 30)}${L(50, 36, 90, 30)}${L(50, 68, 32, 108)}${L(50, 68, 68, 108)}<path d="M14 112H86" class="gnd"/><path d="M4 22l-4-4M96 22l4-4" class="mv"/>`,
  circle: `<circle cx="50" cy="34" r="10"/>${L(50, 45, 50, 80)}<path d="M50 52C24 46 20 8 50 4C80 8 76 46 50 52"/>${L(50, 80, 42, 112)}${L(50, 80, 58, 112)}`,
  one: `<circle cx="50" cy="20" r="10"/>${L(50, 31, 50, 70)}${L(50, 40, 74, 4)}${L(50, 40, 38, 66)}${L(50, 70, 42, 110)}${L(50, 70, 58, 110)}<path d="M18 114H82" class="gnd"/><text x="80" y="10" class="num">1</text>`,
  two: `<circle cx="50" cy="20" r="10"/>${L(50, 31, 50, 70)}${L(50, 40, 30, 4)}${L(50, 40, 70, 4)}${L(50, 70, 42, 110)}${L(50, 70, 58, 110)}<path d="M18 114H82" class="gnd"/><text x="76" y="12" class="num">2</text>`
};
const fig = (k, cls = "") => `<svg class="fig ${cls}" viewBox="-4 -6 108 124">${FIG[k]}</svg>`;
const legend = (mode, big) => `<div class="legend ${big ? "big" : ""}">${mode.poses.map(p => `<div class="pose ${p.c}" data-id="${p.id}">${fig(p.fig)}<b>${p.name}</b><small>${p.rule}</small></div>`).join("")}</div>`;
const seg = (id, opts) => `<div class="seg" data-k="${id}">${opts.map(([v, t]) => `<button type="button" data-v="${v}" class="${String(prefs[id]) === String(v) ? "on" : ""}">${t}</button>`).join("")}</div>`;
const app = () => $("#app");

/* ======================= HOME ======================= */
function home() {
  stop();
  app().className = "home";
  const M = MODE();
  app().innerHTML = `
  <header class="top"><div class="logo">${fig(C.logo || "jump")}</div><div><h1>${C.title}</h1><p>${C.subtitle}</p></div></header>
  <section class="card"><h2>เลือกเรื่อง</h2>
    <div class="modes">${C.modes.map(m => `<button type="button" class="mode ${prefs.mode === m.id ? "on" : ""}" data-m="${m.id}"><b>${m.icon} ${m.name}</b><small>${m.desc} · ${m.items.length} การ์ด</small></button>`).join("")}</div>
    <div id="lg">${legend(M)}</div></section>
  <section class="card"><div class="two"><div><h3>จำนวนข้อ</h3>${seg("rounds", [[10, "10"], [15, "15"], [20, "20"]])}</div>
    <div><h3>เวลาคิด</h3>${seg("think", [[4, "4 วิ"], [6, "6 วิ"], [10, "10 วิ"]])}</div></div>
    <label class="tg"><input type="checkbox" id="snd" ${prefs.sound ? "checked" : ""}> เปิดเสียงและอ่านการ์ดออกเสียง</label></section>
  <button type="button" class="btn big" id="go">▶ เริ่มเลย!</button>
  <p class="foot">วางไอแพดหน้าห้อง (แนะนำแนวนอน) · ระหว่างคิดให้ <b>มือแตะไหล่</b> · พอได้ยิน "ทำท่า!" ทุกคนทำท่าพร้อมกัน</p>`;
  app().querySelectorAll(".mode").forEach(b => b.onclick = () => { prefs.mode = b.dataset.m; save(); app().querySelectorAll(".mode").forEach(x => x.classList.toggle("on", x === b)); $("#lg").innerHTML = legend(MODE()); });
  app().querySelectorAll(".seg").forEach(s => s.querySelectorAll("button").forEach(b => b.onclick = () => { prefs[s.dataset.k] = +b.dataset.v; save(); s.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); }));
  $("#snd").onchange = e => { prefs.sound = e.target.checked; save(); };
  $("#go").onclick = () => begin();
}

/* ======================= GAME ======================= */
let G = null, timers = [];
const later = (f, ms) => timers.push(setTimeout(f, ms));
function stop() { timers.forEach(clearTimeout); timers = []; if (G && G.iv) clearInterval(G.iv); try { speechSynthesis.cancel(); } catch (e) {} }
function deck(M, n) {
  /* balanced: spread answers evenly, no repeats until all used */
  const by = {}; M.items.forEach(it => (by[it.a] = by[it.a] || []).push(it));
  Object.values(by).forEach(shuffle);
  const keys = shuffle(Object.keys(by)), out = []; let k = 0, guard = 0;
  while (out.length < n && guard++ < 999) { const key = keys[k++ % keys.length]; const it = by[key].shift(); if (it) { out.push(it); by[key].push(it); } }
  return shuffle(out);
}
function begin(replay) {
  stop();
  try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume && ac.resume(); } catch (e) {}
  const M = MODE();
  G = { M, cards: replay || deck(M, Math.min(prefs.rounds, Math.max(4, M.items.length))), i: 0, log: [] };
  intro();
}
function intro() {
  app().className = "play";
  app().innerHTML = `<div class="stage intro"><h2>${G.M.icon} ${G.M.name}</h2>${legend(G.M, true)}
    <p>ระหว่างคิด: <b>มือแตะไหล่ 🤔</b> · ได้ยิน "ทำท่า!" แล้วค่อยทำ</p>
    <button type="button" class="btn big" id="ready">พร้อมแล้ว ▶</button><button type="button" class="x" id="quit">✕</button></div>`;
  speak(G.M.poses.map(p => p.rule + " " + p.name).join(" "));
  $("#ready").onclick = next; $("#quit").onclick = home;
}
function next() {
  stop();
  if (G.i >= G.cards.length) return end();
  const c = G.cards[G.i];
  const len = c.t.length, size = len > 60 ? "s3" : len > 34 ? "s2" : "s1";
  app().innerHTML = `<div class="stage q">
    <div class="topbar"><span class="pill">ข้อ ${G.i + 1}/${G.cards.length}</span><span class="pill soft">${G.M.icon} ${G.M.short || G.M.name}</span><button type="button" class="x" id="quit">✕</button></div>
    <div class="qcard">${c.e ? `<div class="emo">${c.e}</div>` : ""}<p class="qt ${size}">${esc(c.t)}</p>${G.M.ask ? `<p class="cap">${G.M.ask}</p>` : ""}</div>
    <div class="think"><svg viewBox="0 0 40 40" class="ring"><circle cx="20" cy="20" r="17"/><circle cx="20" cy="20" r="17" id="arc"/></svg><b id="sec">${prefs.think}</b><span>มือแตะไหล่ 🤔 คิดในใจ…</span></div>
    ${legend(G.M)}</div>`;
  $("#quit").onclick = home;
  later(() => speak(c.t), 200);
  let left = prefs.think; const arc = $("#arc"), CIR = 2 * Math.PI * 17;
  arc.style.strokeDasharray = CIR; arc.style.strokeDashoffset = 0;
  requestAnimationFrame(() => { arc.style.transition = `stroke-dashoffset ${prefs.think}s linear`; arc.style.strokeDashoffset = CIR; });
  G.iv = setInterval(() => {
    left--; const s = $("#sec"); if (s) s.textContent = Math.max(left, 0);
    if (left <= 3 && left > 0) sfx.tick();
    if (left <= 0) { clearInterval(G.iv); act(); }
  }, 1000);
}
function act() {
  sfx.go(); speak("ทำท่า!");
  const t = $(".think"); if (t) { t.classList.add("go"); t.innerHTML = `<b class="now">ทำท่า! ค้างไว้!</b>`; }
  later(reveal, 2200);
}
function reveal() {
  const c = G.cards[G.i], p = G.M.poses.find(x => x.id === c.a);
  sfx.reveal(); speak(`${p.rule} ${p.name}`);
  const q = $(".stage.q"); if (!q) return;
  q.querySelector(".think").outerHTML = `<div class="ans ${p.c}">${fig(p.fig, "pop")}<div><b>${p.name}</b><small>${p.rule}</small>${c.w ? `<p class="ex">💡 ${esc(c.w)}</p>` : ""}</div></div>
    <div class="ctl"><button type="button" class="btn ghost" id="miss">👎 หลายคนทำผิด</button><button type="button" class="btn" id="nx">${G.i + 1 >= G.cards.length ? "ดูสรุป 🏁" : "ข้อต่อไป ▶"}</button></div>`;
  q.querySelectorAll(".legend .pose").forEach(e => e.classList.toggle("dim", e.dataset.id !== c.a));
  let miss = false;
  $("#miss").onclick = e => { miss = !miss; e.currentTarget.classList.toggle("on", miss); };
  $("#nx").onclick = () => { G.log.push({ c, miss }); G.i++; next(); };
}
function end() {
  stop();
  const missed = G.log.filter(x => x.miss), ok = G.log.length - missed.length, pct = G.log.length ? Math.round(100 * ok / G.log.length) : 0;
  app().className = "home";
  app().innerHTML = `<section class="card res"><div class="trophy">${fig("jump")}</div><h1>เก่งมากทั้งห้อง!</h1>
    <p class="sum">ส่วนใหญ่ทำถูก <b>${ok}</b> จาก ${G.log.length} ข้อ · คิดเป็น <b>${pct}%</b> 🎉</p>
    <h3>${missed.length ? `ข้อที่หลายคนพลาด (${missed.length})` : "ไม่มีข้อที่หลายคนพลาดเลย 👏"}</h3>
    <ul class="rev">${missed.map(x => { const p = G.M.poses.find(y => y.id === x.c.a); return `<li><span class="mini">${x.c.e || "❓"}</span><span><b>${esc(x.c.t)}</b><br><b class="${p.c}t">→ ${p.name} (${p.rule})</b>${x.c.w ? `<br><small>${esc(x.c.w)}</small>` : ""}</span></li>`; }).join("")}</ul>
    <div class="row">${missed.length ? `<button type="button" class="btn" id="redo">🔁 เล่นเฉพาะข้อที่พลาด</button>` : ""}<button type="button" class="btn ${missed.length ? "ghost" : ""}" id="again">🎲 เล่นใหม่ (สุ่มการ์ดใหม่)</button><button type="button" class="btn ghost" id="hm">🏠 หน้าแรก</button></div></section>`;
  speak(`เก่งมาก ส่วนใหญ่ทำถูก ${pct} เปอร์เซ็นต์`);
  if (missed.length) $("#redo").onclick = () => begin(missed.map(x => x.c));
  $("#again").onclick = () => begin(); $("#hm").onclick = home;
}
document.addEventListener("keydown", e => { if (e.key !== " " && e.key !== "Enter") return; const b = $("#nx") || $("#ready"); if (b) { e.preventDefault(); b.click(); } });
document.title = C.title;
home();
})();
