(() => {
"use strict";
const $ = s => document.querySelector(s);
const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const gcd = (a, b) => b ? gcd(b, a % b) : a;
const KEY = "kruau-m5-pose";
let prefs = { mode: "three", level: 1, rounds: 10, think: 6, sound: true };
try { Object.assign(prefs, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) {}
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) {} };

/* ---------- sound + speech ---------- */
let ac = null, thVoice = null;
function tone(f, d = .12, type = "sine", v = .18) {
  if (!prefs.sound) return;
  try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = f; g.gain.setValueAtTime(v, ac.currentTime); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + d);
    o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + d); } catch (e) {}
}
const sfx = { tick: () => tone(660, .1, "square", .08), go: () => { tone(523, .12); setTimeout(() => tone(784, .25), 120); }, reveal: () => { tone(880, .1); setTimeout(() => tone(1175, .2), 100); } };
function pickVoice() { try { const v = speechSynthesis.getVoices(); thVoice = v.find(x => /th/i.test(x.lang)) || null; } catch (e) {} }
try { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; } catch (e) {}
function speak(t) {
  if (!prefs.sound || !t) return;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = "th-TH"; if (thVoice) u.voice = thVoice; u.rate = .9; u.pitch = 1.1; speechSynthesis.speak(u); } catch (e) {}
}

/* ---------- poses (SVG stick figures) ---------- */
const L = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
const FIG = {
  sit: `<circle cx="46" cy="40" r="10"/>${L(46, 51, 46, 78)}${L(46, 58, 76, 60)}${L(46, 60, 72, 68)}${L(46, 78, 70, 82)}${L(70, 82, 70, 108)}${L(46, 78, 28, 86)}${L(28, 86, 30, 108)}<path d="M18 112H86" class="gnd"/>`,
  stand: `<circle cx="50" cy="16" r="10"/>${L(50, 27, 50, 68)}${L(50, 36, 38, 64)}${L(50, 36, 62, 64)}${L(50, 68, 42, 108)}${L(50, 68, 58, 108)}<path d="M18 112H82" class="gnd"/>`,
  jump: `<circle cx="50" cy="20" r="10"/>${L(50, 31, 50, 64)}${L(50, 38, 26, 10)}${L(50, 38, 74, 10)}${L(50, 64, 34, 92)}${L(50, 64, 66, 92)}<path d="M18 114H82" class="gnd"/><path d="M14 30l-6-4M14 44H6M86 30l6-4M86 44h8" class="mv"/>`,
  clap: `<circle cx="50" cy="34" r="10"/>${L(50, 45, 50, 80)}<path d="M50 52L28 32L46 8M50 52L72 32L54 8"/>${L(50, 80, 42, 112)}${L(50, 80, 58, 112)}<path d="M36 4l-7-5M64 4l7-5M50 0v-5" class="mv"/>`,
  cross: `<circle cx="50" cy="16" r="10"/>${L(50, 27, 50, 68)}${L(30, 30, 68, 58)}${L(70, 30, 32, 58)}${L(50, 68, 42, 108)}${L(50, 68, 58, 108)}<path d="M18 112H82" class="gnd"/>`
};
const fig = (k, cls = "") => `<svg class="fig ${cls}" viewBox="-4 -6 108 124">${FIG[k]}</svg>`;
const POSES = {
  three: [
    { id: "lt", fig: "sit", name: "นั่งลง", rule: "น้อยกว่า 50%", say: "น้อยกว่าห้าสิบเปอร์เซ็นต์ นั่งลง", c: "c-blue" },
    { id: "eq", fig: "stand", name: "ยืนตรง", rule: "เท่ากับ 50%", say: "เท่ากับห้าสิบเปอร์เซ็นต์ ยืนตรง", c: "c-yel" },
    { id: "gt", fig: "jump", name: "กระโดดชูมือ", rule: "มากกว่า 50%", say: "มากกว่าห้าสิบเปอร์เซ็นต์ กระโดดชูมือ", c: "c-pink" }],
  same: [
    { id: "eq", fig: "clap", name: "ตบมือเหนือหัว", rule: "เท่ากับเป้าหมาย", say: "เท่ากัน ตบมือเหนือหัว", c: "c-green" },
    { id: "ne", fig: "cross", name: "ไขว้แขน", rule: "ไม่เท่ากับเป้าหมาย", say: "ไม่เท่ากัน ไขว้แขน", c: "c-red" }]
};

/* ---------- representations ---------- */
const FR = (a, b) => `<span class="fr"><span>${a}</span><span>${b}</span></span>`;
const TH = ["ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
const decStr = p => String(p / 100);
const decSay = s => s.replace(/\./, " จุด ").replace(/\d/g, d => TH[d] + " ").replace(/^ศูนย์ /, "ศูนย์");
function grid(p) {
  let s = ""; for (let i = 0; i < 100; i++) { const r = Math.floor(i / 10), c = i % 10; s += `<rect x="${c * 10 + 1}" y="${r * 10 + 1}" width="8.6" height="8.6" rx="1.6" class="${i < p ? "on" : ""}"/>`; }
  return `<svg class="grid" viewBox="0 0 101 101">${s}</svg>`;
}
function bar(a, b) {
  let s = ""; const w = 100 / b; for (let i = 0; i < b; i++) s += `<rect x="${i * w + .8}" y="1" width="${w - 1.6}" height="28" rx="2" class="${i < a ? "on" : ""}"/>`;
  return `<svg class="bar" viewBox="0 0 100 30">${s}</svg>`;
}
const WORDS = { "1/2": "ครึ่งหนึ่ง", "1/4": "หนึ่งในสี่", "3/4": "สามในสี่", "1/10": "หนึ่งในสิบ", "1/5": "หนึ่งในห้า", "9/10": "เก้าในสิบ", "4/5": "สี่ในห้า" };
const STORIES = [
  (a, b) => `ห้องมีนักเรียน ${b} คน<br>ชอบกินส้มตำ ${a} คน`,
  (a, b) => `ปลูกต้นทานตะวัน ${b} ต้น<br>ออกดอกแล้ว ${a} ต้น`,
  (a, b) => `ยิงลูกโทษ ${b} ครั้ง<br>เข้าประตู ${a} ครั้ง`,
  (a, b) => `มีลูกโป่ง ${b} ลูก<br>เป็นสีแดง ${a} ลูก`,
  (a, b) => `ทำข้อสอบ ${b} ข้อ<br>ตอบถูก ${a} ข้อ`,
  (a, b) => `แมวจร ${b} ตัว<br>ฉีดวัคซีนแล้ว ${a} ตัว`
];
/* card: {a,b (value), form, html, say, key} */
function card(form, a, b, extra) {
  const g = gcd(a, b), p = 100 * a / b;
  let html, say;
  switch (form) {
    case "pct": html = `<b class="big">${p}%</b>`; say = `${p} เปอร์เซ็นต์`; break;
    case "roi": html = `<b class="big">ร้อยละ ${p}</b>`; say = `ร้อยละ ${p}`; break;
    case "f100": html = `<b class="big">${FR(p, 100)}</b>`; say = `เศษ ${p} ส่วน 100`; break;
    case "frac": html = `<b class="big">${FR(a, b)}</b>`; say = `เศษ ${a} ส่วน ${b}`; break;
    case "dec": { const s = decStr(p); html = `<b class="big">${s}</b>`; say = decSay(s); break; }
    case "grid": html = `${grid(p)}<p class="cap">ส่วนที่ระบายสี</p>`; say = "ส่วนที่ระบายสี คิดเป็นกี่เปอร์เซ็นต์"; break;
    case "bar": html = `${bar(a, b)}<p class="cap">ส่วนที่ระบายสี</p>`; say = "ส่วนที่ระบายสี คิดเป็นกี่เปอร์เซ็นต์"; break;
    case "word": html = `<b class="big wd">${WORDS[a / g + "/" + b / g]}</b>`; say = WORDS[a / g + "/" + b / g]; break;
    case "story": { const t = (extra != null ? STORIES[extra] : pick(STORIES))(a, b); html = `<p class="story">${t}</p><p class="cap">คิดเป็นร้อยละเท่าไร?</p>`; say = t.replace("<br>", " "); break; }
  }
  return { a, b, form, html, say, key: form + a + "/" + b };
}
function pctText(a, b) { const p = 100 * a / b; return Number.isInteger(p * 10) ? `= ${p}%` : `≈ ${(Math.round(p * 10) / 10)}%`; }
function explain(c) {
  const { a, b, form } = c, g = gcd(a, b), ra = a / g, rb = b / g, p = 100 * a / b;
  if (form === "pct") return `${p}% = ${FR(p, 100)}`;
  if (form === "roi") return `ร้อยละ ${p} = ${p}% = ${FR(p, 100)}`;
  if (form === "dec") return `${decStr(p)} = ${FR(p, 100)} = ${p}%`;
  if (form === "f100") return `${FR(p, 100)} = ${p}%`;
  if (form === "grid") return `ระบาย ${p} ช่อง จาก 100 ช่อง = ${FR(p, 100)} = ${p}%`;
  let s = (form === "bar" ? `ระบาย ${a} ส่วน จาก ${b} ส่วน = ` : form === "word" ? `${WORDS[ra + "/" + rb]} = ` : form === "story" ? `${a} จาก ${b} = ` : "") + FR(a, b);
  let x = a, y = b;
  if (100 % b !== 0 && g > 1) { s += ` = ${FR(ra, rb)}`; x = ra; y = rb; }
  if (100 % y === 0) { const k = 100 / y; if (y !== 100) s += ` = ${FR(x + "×" + k, y + "×" + k)} = ${FR(x * k, 100)}`; s += ` = ${p}%`; }
  else s += ` ${pctText(a, b)}`; if (!Number.isInteger(p * 10)) s += ` (${2 * a > b ? "มากกว่า" : 2 * a < b ? "น้อยกว่า" : "เท่ากับ"}ครึ่ง)`;
  return s;
}

/* ---------- question generators ---------- */
const FORMS = {
  1: ["pct", "pct", "roi", "f100", "grid", "grid", "word"],
  2: ["pct", "f100", "frac", "frac", "frac", "dec", "dec", "bar", "grid", "word"],
  3: ["frac", "frac", "frac", "dec", "dec", "pct", "bar", "story", "grid", "f100"]
};
const DEN = { 1: [2, 4, 5, 10], 2: [2, 4, 5, 10, 20, 25, 50], 3: [3, 6, 8, 12, 15, 16, 20, 25, 40, 50] };
const SDEN = [10, 20, 25, 40, 50, 30, 12, 8];
function wantCmp(r) { return r < .38 ? -1 : r < .62 ? 0 : 1; }
function pFor(cmp, level) {
  if (cmp === 0) return 50;
  if (level === 1) return cmp < 0 ? 5 * R(1, 9) : 5 * R(11, 19);
  const near = level === 3 && Math.random() < .45;
  if (near) return cmp < 0 ? R(45, 49) : R(51, 55);
  return cmp < 0 ? R(1, 49) : R(51, 99);
}
function abFor(cmp, dens, maxB) {
  for (let t = 0; t < 60; t++) {
    const b = pick(dens.filter(d => !maxB || d <= maxB)); if (cmp === 0 && b % 2) continue;
    const a = cmp === 0 ? b / 2 : cmp < 0 ? R(1, Math.ceil(b / 2) - 1) : R(Math.floor(b / 2) + 1, b - 1);
    if (a >= 1 && a < b) return [a, b];
  }
  return [1, 2];
}
function genThree(level) {
  const cmp = wantCmp(Math.random());
  let form = pick(FORMS[level]);
  if (form === "word") {
    const opts = Object.keys(WORDS).map(k => k.split("/").map(Number)).filter(([a, b]) => Math.sign(2 * a - b) === cmp);
    const [a, b] = pick(opts); return card("word", a, b);
  }
  if (form === "frac") { const [a, b] = abFor(cmp, DEN[level]); return card("frac", a, b); }
  if (form === "bar") { const [a, b] = abFor(cmp, [2, 3, 4, 5, 6, 8, 10], 10); return card("bar", a, b); }
  if (form === "story") { const [a, b] = abFor(cmp, SDEN); return card("story", a, b); }
  let p = pFor(cmp, level);
  if (form === "dec" && level === 3 && Math.random() < .35) {
    /* traps: 0.5 vs 0.05 vs 0.45 */
    p = pick(cmp < 0 ? [5, 4, 9, 45, 48] : cmp > 0 ? [60, 70, 55, 51, 90] : [50]);
  }
  return card(form, p, 100);
}
const TARGETS = { 1: [50, 25, 75, 10, 20], 2: [50, 25, 75, 20, 40, 60, 80, 30, 70], 3: [25, 75, 40, 60, 80, 5, 15, 35, 45, 20, 90] };
function equalForms(T, level) {
  const out = [], g0 = gcd(T * 10, 1000), a = T * 10 / g0, b = 1000 / g0;
  if (Number.isInteger(T)) { out.push(card("f100", T, 100), card("roi", T, 100), card("grid", T, 100)); if (level > 1) out.push(card("dec", T, 100)); }
  out.push(card("frac", a, b));
  if (level > 1) for (const k of [2, 3, 4, 5]) if (b * k <= 60 && b * k !== 100) out.push(card("frac", a * k, b * k));
  if (b <= 10) out.push(card("bar", a, b));
  if (WORDS[a + "/" + b]) out.push(card("word", a, b));
  if (level === 3) { const k = pick([1, 2, 4, 5].filter(k => b * k <= 50 && b * k >= 4)); if (k) out.push(card("story", a * k, b * k)); }
  return out.filter(c => c.form !== "pct");
}
function notEqualForms(T, level) {
  const out = [];
  if (Number.isInteger(T)) {
    if (T % 10 === 0 && level > 1) out.push(card("dec", T / 10, 100));
    const s = String(T); if (level > 1 && s.length === 2 && +s[0] < +s[1] && s[0] !== "0") out.push(card("frac", +s[0], +s[1]));
    if (100 % T === 0 && T !== 50) out.push(card("frac", 1, T));
  }
  for (let i = 0; i < 4; i++) {
    let q; do { q = level === 1 ? 5 * R(1, 19) : R(2, 98); } while (q === T || Math.abs(q - T) > 30);
    const f = pick(level === 1 ? ["f100", "roi", "grid", "pct"] : ["f100", "dec", "grid", "pct", "roi"]);
    out.push(card(f, q, 100));
    if (level > 1) { const [a, b] = pick([[1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 2], [3, 10], [7, 10], [1, 8], [3, 8]]); if (100 * a / b !== T) out.push(card(level > 1 && b <= 10 && Math.random() < .3 ? "bar" : "frac", a, b)); }
  }
  return out;
}
function genSame(level, T) {
  const eq = Math.random() < .5;
  const c = pick(eq ? equalForms(T, level) : notEqualForms(T, level));
  c.T = T; return c;
}
const answerOf = c => prefs.mode === "three" ? ["lt", "eq", "gt"][Math.sign(2 * c.a - c.b) + 1] : (Math.abs(100 * c.a / c.b - c.T) < 1e-9 ? "eq" : "ne");

/* ---------- screens ---------- */
const app = () => $("#app");
const legend = (mode, big) => `<div class="legend ${big ? "big" : ""}">${POSES[mode].map(p => `<div class="pose ${p.c}" data-id="${p.id}">${fig(p.fig)}<b>${p.name}</b><small>${p.rule}</small></div>`).join("")}</div>`;
const seg = (id, val, opts) => `<div class="seg" data-k="${id}">${opts.map(([v, t]) => `<button type="button" data-v="${v}" class="${String(prefs[id]) === String(v) ? "on" : ""}">${t}</button>`).join("")}</div>`;

function home() {
  stop();
  app().className = "home";
  app().innerHTML = `
  <header class="top"><div class="logo">${fig("jump")}</div><div><h1>ร้อยละ ขยับท่า!</h1><p>คณิต ป.5 บทที่ 5 ร้อยละ · ดูโจทย์ คิดในใจ แล้วทำท่าพร้อมกันทั้งห้อง</p></div></header>
  <section class="card"><h2>เลือกโหมด</h2>
    <div class="modes">
      <button type="button" class="mode ${prefs.mode === "three" ? "on" : ""}" data-m="three"><b>🧍 น้อย · เท่า · มากกว่า 50%</b><small>จำแนกเป็น 3 กลุ่มด้วย 3 ท่า</small></button>
      <button type="button" class="mode ${prefs.mode === "same" ? "on" : ""}" data-m="same"><b>👏 เท่ากันไหม?</b><small>เทียบกับร้อยละเป้าหมาย เท่ากัน/ไม่เท่ากัน</small></button>
    </div>
    <div id="lg">${legend(prefs.mode)}</div></section>
  <section class="card"><h2>ระดับ</h2>${seg("level", prefs.level, [[1, "🌱 ง่าย"], [2, "🌿 กลาง"], [3, "🌳 ยาก"]])}
    <p class="hint" id="lvh"></p>
    <div class="two"><div><h3>จำนวนข้อ</h3>${seg("rounds", prefs.rounds, [[10, "10"], [15, "15"], [20, "20"]])}</div>
    <div><h3>เวลาคิด</h3>${seg("think", prefs.think, [[4, "4 วิ"], [6, "6 วิ"], [10, "10 วิ"]])}</div></div>
    <label class="tg"><input type="checkbox" id="snd" ${prefs.sound ? "checked" : ""}> เปิดเสียงและอ่านโจทย์ออกเสียง</label></section>
  <button type="button" class="btn big" id="go">▶ เริ่มเลย!</button>
  <p class="foot">วางไอแพดหน้าห้อง (แนะนำแนวนอน) · ระหว่างคิดให้ <b>มือแตะไหล่</b> · พอได้ยิน "ทำท่า!" ทุกคนทำท่าพร้อมกัน</p>`;
  const lvText = { 1: "ร้อยละ · เปอร์เซ็นต์ · เศษส่วนที่มีตัวส่วนเป็น 100 · ตาราง 100 ช่อง · คำพูด (ครึ่งหนึ่ง สามในสี่)", 2: "+ เศษส่วนตัวส่วน 2, 4, 5, 10, 20, 25, 50 · ทศนิยม · แถบเศษส่วน", 3: "+ เศษส่วนที่ทำเป็นส่วน 100 ไม่ได้ · ค่าใกล้ 50% · กับดัก 0.5 / 0.05 · โจทย์ปัญหา" };
  const lv = () => { $("#lvh").textContent = lvText[prefs.level]; };
  lv();
  app().querySelectorAll(".mode").forEach(b => b.onclick = () => { prefs.mode = b.dataset.m; save(); app().querySelectorAll(".mode").forEach(x => x.classList.toggle("on", x === b)); $("#lg").innerHTML = legend(prefs.mode); });
  app().querySelectorAll(".seg").forEach(s => s.querySelectorAll("button").forEach(b => b.onclick = () => { prefs[s.dataset.k] = +b.dataset.v; save(); s.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); lv(); }));
  $("#snd").onchange = e => { prefs.sound = e.target.checked; save(); };
  $("#go").onclick = () => begin();
}

let G = null, timers = [];
const later = (f, ms) => timers.push(setTimeout(f, ms));
function stop() { timers.forEach(clearTimeout); timers = []; if (G && G.iv) clearInterval(G.iv); try { speechSynthesis.cancel(); } catch (e) {} }

function begin(replay) {
  stop();
  try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume && ac.resume(); } catch (e) {}
  G = { level: prefs.level, n: replay ? replay.length : prefs.rounds, i: 0, log: [], seen: new Set(), replay: replay || null, T: null };
  intro();
}
function intro() {
  app().className = "play";
  const T = prefs.mode === "same";
  app().innerHTML = `<div class="stage intro"><h2>${T ? "ท่าของเกม เท่ากันไหม?" : "ท่าของเกม"}</h2>${legend(prefs.mode, true)}
    <p>ระหว่างคิด: <b>มือแตะไหล่ 🤔</b> · ได้ยิน "ทำท่า!" แล้วค่อยทำ</p>
    <button type="button" class="btn big" id="ready">พร้อมแล้ว ▶</button><button type="button" class="x" id="quit">✕</button></div>`;
  speak(POSES[prefs.mode].map(p => p.rule + " " + p.name).join(" "));
  $("#ready").onclick = next; $("#quit").onclick = home;
}
function newTarget() {
  const pool = TARGETS[G.level].filter(t => t !== G.T); G.T = pick(pool);
}
function next() {
  stop();
  if (G.i >= G.n) return end();
  let c;
  if (G.replay) c = G.replay[G.i];
  else if (prefs.mode === "three") { let t = 0; do { c = genThree(G.level); } while (G.seen.has(c.key) && ++t < 30); }
  else {
    if (G.i % 3 === 0) { newTarget(); return announce(); }
    let t = 0; do { c = genSame(G.level, G.T); } while (G.seen.has(c.key) && ++t < 30);
  }
  showCard(c);
}
function announce() {
  app().innerHTML = `<div class="stage target"><p>ร้อยละเป้าหมายรอบนี้</p><b class="tgt">${G.T}%</b><p>การ์ดไหน <b>เท่ากับ</b> ${G.T}% → ตบมือเหนือหัว 👏<br>ไม่เท่า → ไขว้แขน 🙅</p><button type="button" class="btn big" id="ok">เข้าใจแล้ว ▶</button></div>`;
  speak(`เป้าหมาย ${G.T} เปอร์เซ็นต์`);
  $("#ok").onclick = () => { let c, t = 0; do { c = genSame(G.level, G.T); } while (G.seen.has(c.key) && ++t < 30); showCard(c); };
}
function showCard(c) {
  G.seen.add(c.key); G.cur = c;
  const same = prefs.mode === "same";
  app().innerHTML = `<div class="stage q">
    <div class="topbar"><span class="pill">ข้อ ${G.i + 1}/${G.n}</span>${same ? `<span class="pill tg">เป้าหมาย ${c.T}%</span>` : `<span class="pill">เทียบกับ 50%</span>`}<button type="button" class="x" id="quit">✕</button></div>
    <div class="qcard">${c.html}</div>
    <div class="think"><svg viewBox="0 0 40 40" class="ring"><circle cx="20" cy="20" r="17"/><circle cx="20" cy="20" r="17" id="arc"/></svg><b id="sec">${prefs.think}</b><span>มือแตะไหล่ 🤔 คิดในใจ…</span></div>
    ${legend(prefs.mode)}</div>`;
  $("#quit").onclick = home;
  later(() => speak(c.say), 200);
  let left = prefs.think; const arc = $("#arc"), C = 2 * Math.PI * 17;
  arc.style.strokeDasharray = C; arc.style.strokeDashoffset = 0;
  requestAnimationFrame(() => { arc.style.transition = `stroke-dashoffset ${prefs.think}s linear`; arc.style.strokeDashoffset = C; });
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
  const c = G.cur, ans = answerOf(c), p = POSES[prefs.mode].find(x => x.id === ans);
  sfx.reveal(); speak(p.say);
  const q = $(".stage.q"); if (!q) return;
  q.querySelector(".think").outerHTML = `<div class="ans ${p.c}">${fig(p.fig, "pop")}<div><b>${p.name}</b><small>${p.rule}</small><p class="ex">${explain(c)}${prefs.mode === "same" ? (ans === "eq" ? " ✅" : ` ≠ ${c.T}%`) : ""}</p></div></div>
    <div class="ctl"><button type="button" class="btn ghost" id="miss">👎 หลายคนทำผิด</button><button type="button" class="btn" id="nx">${G.i + 1 >= G.n ? "ดูสรุป 🏁" : "ข้อต่อไป ▶"}</button></div>`;
  q.querySelectorAll(".legend .pose").forEach(e => e.classList.toggle("dim", e.dataset.id !== ans));
  let miss = false;
  $("#miss").onclick = e => { miss = !miss; e.currentTarget.classList.toggle("on", miss); };
  $("#nx").onclick = () => { G.log.push({ c, ans, miss }); G.i++; next(); };
}
function end() {
  stop();
  const missed = G.log.filter(x => x.miss), ok = G.log.length - missed.length;
  const pct = G.log.length ? Math.round(100 * ok / G.log.length) : 0;
  app().className = "home";
  app().innerHTML = `<section class="card res">
    <div class="trophy">${fig("jump")}</div><h1>เก่งมากทั้งห้อง!</h1>
    <p class="sum">ส่วนใหญ่ทำถูก <b>${ok}</b> จาก ${G.log.length} ข้อ · คิดเป็น <b>${pct}%</b> 🎉</p>
    <h3>${missed.length ? `ข้อที่หลายคนพลาด (${missed.length})` : "ไม่มีข้อที่หลายคนพลาดเลย 👏"}</h3>
    <ul class="rev">${missed.map(x => { const p = POSES[prefs.mode].find(y => y.id === x.ans); return `<li><span class="mini">${x.c.html}</span><span>${explain(x.c)}${x.c.T != null ? ` · เป้าหมาย ${x.c.T}%` : ""}<br><b class="${p.c}t">→ ${p.name} (${p.rule})</b></span></li>`; }).join("")}</ul>
    <div class="row">${missed.length ? `<button type="button" class="btn" id="redo">🔁 เล่นเฉพาะข้อที่พลาด</button>` : ""}<button type="button" class="btn ${missed.length ? "ghost" : ""}" id="again">🎲 เล่นใหม่ (โจทย์ใหม่)</button><button type="button" class="btn ghost" id="hm">🏠 หน้าแรก</button></div></section>`;
  speak(`เก่งมาก ส่วนใหญ่ทำถูก ${pct} เปอร์เซ็นต์`);
  if (missed.length) $("#redo").onclick = () => begin(missed.map(x => x.c));
  $("#again").onclick = () => begin(); $("#hm").onclick = home;
}
document.addEventListener("keydown", e => {
  if (e.key !== " " && e.key !== "Enter") return;
  const b = $("#nx") || $("#ready") || $("#ok"); if (b) { e.preventDefault(); b.click(); }
});
home();
})();
