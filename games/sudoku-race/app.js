(() => {
"use strict";
const { TYPES, SYMS, generate, geometry } = SDK;
const $ = s => document.querySelector(s);
const app = $("#app");
const LS = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem("kruau-sudoku-" + k)); return v == null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("kruau-sudoku-" + k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem("kruau-sudoku-" + k); } catch (e) {} }
};
const prefs = Object.assign({ instant: false, dup: true, autoNote: true, level: "exam", examLevel: "exam", examMin: 60 }, LS.get("prefs", {}));
const savePrefs = () => LS.set("prefs", prefs);
const LV = { easy: "🌱 ง่าย", exam: "🏆 เหมือนสนามสอบ", hard: "🔥 ท้าทาย" };
const T_ = id => TYPES.find(t => t.id === id);
const fmt = s => { s = Math.max(0, Math.floor(s)); const m = Math.floor(s / 60), x = s % 60; return `${m < 10 ? "0" : ""}${m}:${x < 10 ? "0" : ""}${x}`; };
const sym = (T, v) => v ? SYMS[T.sym][v] : "";
let tone = (f, d = .1) => { try { const A = tone.ac || (tone.ac = new (window.AudioContext || window.webkitAudioContext)()); const o = A.createOscillator(), g = A.createGain(); o.frequency.value = f; g.gain.setValueAtTime(.12, A.currentTime); g.gain.exponentialRampToValueAtTime(.001, A.currentTime + d); o.connect(g); g.connect(A.destination); o.start(); o.stop(A.currentTime + d); } catch (e) {} };
function toast(msg, ms = 2200) { let t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); } t.textContent = msg; t.classList.add("on"); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove("on"), ms); }
function modal(html) { const m = document.createElement("div"); m.className = "modal"; m.innerHTML = `<div class="sheet">${html}</div>`; document.body.appendChild(m); m.addEventListener("click", e => { if (e.target === m) m.remove(); }); return m; }

let timer = null; const stopTimer = () => { if (timer) clearInterval(timer); timer = null; };
let B = null;   /* active board: {p, cur, notes, sel, undo, pencil, mode, ...} */

/* ======================= HOME ======================= */
function home() {
  stopTimer(); B = null; window.scrollTo(0, 0);
  const cur = LS.get("cur", null), ex = LS.get("exam", null), stats = LS.get("stats", {}), hist = LS.get("hist", []);
  const exLeft = ex && !ex.done ? ex.dur - (Date.now() - ex.start) / 1000 : 0;
  const card = T => { const s = stats[T.id] || {}; const n = (s.easy || 0) + (s.exam || 0) + (s.hard || 0);
    return `<button type="button" class="tcard" data-t="${T.id}"><span class="ic ic-${T.id}">${icon(T)}</span><b>${T.name}</b><small>${T.th}</small>${n ? `<em>✓ ${n}</em>` : ""}</button>`; };
  app.className = "home";
  app.innerHTML = `
  <header class="top"><div class="logo">${mini()}</div><div><h1>ซูโดกุ สนามแข่ง</h1><p>ฝึกซ้อมแข่งศิลปหัตถกรรม ระดับประถม · ครบ 10 แบบ · โจทย์ใหม่ไม่ซ้ำทุกครั้ง</p></div></header>
  ${cur && !cur.done ? `<div class="rrow"><button type="button" class="resume" id="resume">▶ ทำต่อ: <b>${T_(cur.p.type).name}</b> · ${LV[cur.p.level]} · ${fmt(cur.elapsed)}</button><button type="button" class="rx" id="cancelCur">✕<span>ยกเลิก</span></button></div>` : ""}
  ${ex && !ex.done && exLeft > 0 ? `<div class="rrow"><button type="button" class="resume exam" id="resumeEx">⏱️ ทำข้อสอบต่อ · เหลือเวลา ${fmt(exLeft)}</button><button type="button" class="rx" id="cancelEx">✕<span>ยกเลิก</span></button></div>` : ""}
  <section class="card">
    <div class="tabs"><button type="button" class="tab on" data-tab="pr">🎯 ฝึกรายแบบ</button><button type="button" class="tab" data-tab="ex">⏱️ จำลองสอบ</button></div>
    <div id="tab-pr">
      <h3>ระดับ</h3>
      <div class="seg" id="lv">${Object.entries(LV).map(([k, t]) => `<button type="button" data-v="${k}" class="${prefs.level === k ? "on" : ""}">${t}</button>`).join("")}</div>
      <h3>เลือกแบบที่จะฝึก <small>(กดแล้วได้โจทย์ใหม่ทันที)</small></h3>
      <p class="grp">ตาราง 6×6</p><div class="tgrid">${TYPES.filter(t => t.n === 6).map(card).join("")}</div>
      <p class="grp">ตาราง 9×9</p><div class="tgrid">${TYPES.filter(t => t.n === 9).map(card).join("")}</div>
      <button type="button" class="btn ghost wide" id="rnd">🎲 สุ่มแบบให้หน่อย</button>
      <details class="set"><summary>⚙️ ตัวช่วยระหว่างฝึก</summary>
        <label class="tg"><input type="checkbox" data-p="instant" ${prefs.instant ? "checked" : ""}> บอกช่องที่ผิดทันที <small>(เหมาะกับผู้เริ่มต้น)</small></label>
        <label class="tg"><input type="checkbox" data-p="dup" ${prefs.dup ? "checked" : ""}> เตือนเมื่อกรอกซ้ำในแถว/คอลัมน์/ตาราง</label>
        <label class="tg"><input type="checkbox" data-p="autoNote" ${prefs.autoNote ? "checked" : ""}> ลบเลขดินสอที่ใช้ไม่ได้ให้อัตโนมัติ</label>
      </details>
    </div>
    <div id="tab-ex" hidden>
      <p class="lead">สุ่มโจทย์ใหม่ครบ <b>10 แบบ</b> เรียงเหมือนข้อสอบจริง ข้อละ 10 คะแนน รวม 100 คะแนน<br>ระหว่างสอบ<b>ไม่มีตัวช่วย</b> ตรวจคำตอบตอนกดส่งเท่านั้น เหมือนสนามจริง</p>
      <ol class="exlist">${TYPES.map(t => `<li>${t.name}</li>`).join("")}</ol>
      <h3>เวลาสอบ</h3><div class="seg" id="emin">${[30, 45, 60, 90].map(m => `<button type="button" data-v="${m}" class="${prefs.examMin === m ? "on" : ""}">${m} นาที</button>`).join("")}</div>
      <h3>ความยาก</h3><div class="seg" id="elv">${["easy", "exam", "hard"].map(k => `<button type="button" data-v="${k}" class="${prefs.examLevel === k ? "on" : ""}">${LV[k]}</button>`).join("")}</div>
      <button type="button" class="btn big" id="startEx">⏱️ เริ่มสอบ</button>
      ${hist.length ? `<h3>ประวัติการสอบ</h3><table class="hist"><tr><th>วันที่</th><th>ถูก</th><th>เวลาที่ใช้</th><th>รวม</th></tr>${hist.slice(0, 8).map(h => `<tr><td>${new Date(h.at).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}</td><td>${h.correct}/10</td><td>${fmt(h.used)}</td><td><b>${h.total}</b></td></tr>`).join("")}</table>` : ""}
    </div>
  </section>
  <p class="foot">เล่นบนโทรศัพท์ได้เต็มจอ · ความคืบหน้าบันทึกในเครื่องอัตโนมัติ</p>`;
  app.querySelectorAll(".tab").forEach(b => b.onclick = () => { app.querySelectorAll(".tab").forEach(x => x.classList.toggle("on", x === b)); $("#tab-pr").hidden = b.dataset.tab !== "pr"; $("#tab-ex").hidden = b.dataset.tab !== "ex"; });
  const segBind = (id, key, num) => app.querySelectorAll(`#${id} button`).forEach(b => b.onclick = () => { prefs[key] = num ? +b.dataset.v : b.dataset.v; savePrefs(); app.querySelectorAll(`#${id} button`).forEach(x => x.classList.toggle("on", x === b)); });
  segBind("lv", "level"); segBind("emin", "examMin", 1); segBind("elv", "examLevel");
  app.querySelectorAll("[data-p]").forEach(i => i.onchange = () => { prefs[i.dataset.p] = i.checked; savePrefs(); });
  app.querySelectorAll(".tcard").forEach(b => b.onclick = () => newPractice(b.dataset.t));
  $("#rnd").onclick = () => newPractice(TYPES[Math.floor(Math.random() * 10)].id);
  if ($("#resume")) $("#resume").onclick = () => openPractice(cur);
  if ($("#resumeEx")) $("#resumeEx").onclick = () => examList();
  if ($("#cancelCur")) $("#cancelCur").onclick = () => ask("ยกเลิกโจทย์ที่ทำค้างไว้?", "ข้อที่ทำค้างจะถูกลบ เริ่มข้อใหม่ได้ทุกเมื่อ", "ยกเลิกโจทย์", () => { LS.del("cur"); home(); });
  if ($("#cancelEx")) $("#cancelEx").onclick = () => ask("ยกเลิกข้อสอบที่ทำค้างไว้?", "คำตอบที่ทำไว้จะถูกลบ และไม่บันทึกคะแนน", "ยกเลิกการสอบ", () => { LS.del("exam"); home(); });
  $("#startEx").onclick = () => { if (ex && !ex.done && exLeft > 0) return ask("มีข้อสอบที่ทำค้างอยู่", "จะยกเลิกชุดเดิม แล้วเริ่มชุดใหม่แทนใช่ไหม?", "เริ่มชุดใหม่", startExam); startExam(); };
  if (location.hash === "#exam") app.querySelector('[data-tab="ex"]').click();
}
function ask(title, msg, yes, fn) {
  const m = modal(`<h2>${title}</h2><p>${msg}</p><div class="row"><button type="button" class="btn danger" id="aY">${yes}</button><button type="button" class="btn ghost" id="aN">ไม่ใช่ กลับไป</button></div>`);
  m.querySelector("#aY").onclick = () => { m.remove(); fn(); };
  m.querySelector("#aN").onclick = () => m.remove();
}
function icon(T) {
  const s = { num: T.n === 6 ? "1–6" : "1–9", en: T.n === 6 ? "A–F" : "A–I", th: "ก–ฉ" }[T.sym];
  return T.diag ? `<i class="x">╳</i>${s}` : T.jig ? `🧩` : T.eo ? `<i class="eo"></i>คู่` : s;
}
function mini() { return `<svg viewBox="0 0 30 30"><rect x="1" y="1" width="28" height="28" rx="4" fill="#fff" stroke="#3B2A55" stroke-width="2"/><path d="M10.3 1v28M19.6 1v28M1 10.3h28M1 19.6h28" stroke="#3B2A55" stroke-width="1.2"/><text x="5.6" y="8.6" font-size="7" font-weight="700" fill="#7C3AED">1</text><text x="14.6" y="17.8" font-size="7" font-weight="700" fill="#EC4899">5</text><text x="23.8" y="27" font-size="7" font-weight="700" fill="#0EA5E9">9</text></svg>`; }

/* ======================= PRACTICE ======================= */
function loading(msg) { app.className = "home"; app.innerHTML = `<div class="loading"><div class="spin"></div><p>${msg}</p></div>`; }
function newPractice(typeId) {
  loading("กำลังสร้างโจทย์ใหม่…");
  setTimeout(() => {
    const p = generate(typeId, prefs.level);
    const st = { p, cur: p.givens.slice(), notes: new Array(p.givens.length).fill(0), elapsed: 0, hints: 0, checks: 0, done: false };
    LS.set("cur", st); openPractice(st);
  }, 30);
}
function openPractice(st) { B = mkBoard(st, "practice"); render(); startClock(); }
function mkBoard(st, mode, extra) {
  const T = T_(st.p.type);
  return Object.assign({ st, T, G: geometry(T, st.p.regions), mode, sel: -1, undo: [], pencil: false, flash: null }, extra || {});
}
function persist() {
  if (!B) return;
  if (B.mode === "practice") LS.set("cur", B.st);
  else if (B.mode === "exam") LS.set("exam", B.ex);
}
function startClock() {
  stopTimer();
  timer = setInterval(() => {
    if (!B) return;
    if (B.mode === "practice") { if (document.hidden || B.st.done) return; B.st.elapsed++; const t = $("#clock"); if (t) t.textContent = fmt(B.st.elapsed); if (B.st.elapsed % 5 === 0) persist(); }
    else if (B.mode === "exam" || B.mode === "list") { const left = B.ex.dur - (Date.now() - B.ex.start) / 1000; const t = $("#clock"); if (t) { t.textContent = fmt(left); t.classList.toggle("low", left < 300); } if (left <= 0) { stopTimer(); submitExam(true); } }
  }, 1000);
}

/* ======================= BOARD RENDER ======================= */
function render() {
  const { st, T, G } = B, n = T.n, p = st.p;
  const ex = B.mode === "exam" || B.mode === "review";
  const title = B.mode === "practice" ? `${T.name} <small>${LV[p.level]}</small>` : `ข้อ ${B.idx + 1}. ${T.name}`;
  const clock = B.mode === "practice" ? fmt(st.elapsed) : B.mode === "exam" ? fmt(B.ex.dur - (Date.now() - B.ex.start) / 1000) : "";
  app.className = "play";
  app.innerHTML = `
  <header class="bh"><button type="button" class="ib" id="back" aria-label="กลับ">${B.mode === "practice" ? "🏠" : "☰"}</button><div class="tt"><b>${title}</b></div>${clock ? `<span class="clock" id="clock">${clock}</span>` : `<span class="clock">${B.ok ? "✅ ถูก" : "❌ ผิด"}</span>`}</header>
  <p class="rule">${T.rule}</p>
  <div class="bwrap"><div class="board" id="board" style="--n:${n}"></div>${T.diag ? `<svg class="diag" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0 0L100 100M100 0L0 100"/></svg>` : ""}</div>
  ${B.mode === "review" ? `<div class="tools rv"><button type="button" class="tool ${B.showSol ? "on" : ""}" id="solT">👀 ${B.showSol ? "ดูคำตอบของฉัน" : "ดูเฉลย"}</button>${B.idx > 0 ? `<button type="button" class="tool" id="prv">◀ ข้อก่อน</button>` : ""}${B.idx < 9 ? `<button type="button" class="tool" id="nxt">ข้อต่อไป ▶</button>` : ""}</div>` : `
  <div class="pad" id="pad" style="--n:${n}"></div>
  <div class="tools">
    <button type="button" class="tool ${B.pencil ? "on" : ""}" id="pen">✏️<span>ดินสอ</span></button>
    <button type="button" class="tool" id="era">⌫<span>ลบ</span></button>
    <button type="button" class="tool" id="und">↶<span>ย้อน</span></button>
    ${B.mode === "practice" ? `<button type="button" class="tool" id="hint">💡<span>ใบ้</span></button><button type="button" class="tool" id="chk">✔<span>ตรวจ</span></button>` : `<button type="button" class="tool" id="prv" ${B.idx ? "" : "disabled"}>◀<span>ข้อก่อน</span></button><button type="button" class="tool" id="nxt" ${B.idx < 9 ? "" : "disabled"}>▶<span>ข้อถัดไป</span></button>`}
  </div>`}`;
  drawCells(); drawPad();
  $("#back").onclick = () => { persist(); if (B.mode === "practice") { if (B.st.done) return home(); const m = modal(`<h2>ออกจากโจทย์นี้</h2><p>เก็บไว้ทำต่อทีหลัง หรือยกเลิกข้อนี้?</p><div class="row"><button type="button" class="btn" id="keep">💾 เก็บไว้ทำต่อ</button><button type="button" class="btn danger" id="drop">✕ ยกเลิกข้อนี้</button></div><button type="button" class="btn ghost wide" id="stay">กลับไปทำต่อ</button>`); m.querySelector("#keep").onclick = () => { m.remove(); home(); }; m.querySelector("#drop").onclick = () => { m.remove(); LS.del("cur"); home(); }; m.querySelector("#stay").onclick = () => m.remove(); } else B.mode === "review" ? examResult() : examList(); };
  if (B.mode === "review") {
    $("#solT").onclick = () => { B.showSol = !B.showSol; render(); };
    if ($("#prv")) $("#prv").onclick = () => reviewItem(B.idx - 1);
    if ($("#nxt")) $("#nxt").onclick = () => reviewItem(B.idx + 1);
    return;
  }
  $("#pen").onclick = () => { B.pencil = !B.pencil; $("#pen").classList.toggle("on", B.pencil); drawPad(); };
  $("#era").onclick = erase; $("#und").onclick = undo;
  if (B.mode === "practice") { $("#hint").onclick = hint; $("#chk").onclick = check; }
  else { $("#prv").onclick = () => openExamItem(B.idx - 1); $("#nxt").onclick = () => openExamItem(B.idx + 1); }
}
function drawCells() {
  const { st, T, G } = B, n = T.n, p = st.p, reg = p.regions, cur = B.mode === "review" && B.showSol ? p.sol : st.cur;
  const sel = B.sel, selV = sel >= 0 ? cur[sel] : 0, peers = sel >= 0 ? new Set(G.peers[sel]) : new Set();
  const helpDup = B.mode === "practice" && prefs.dup, helpWrong = B.mode === "practice" && prefs.instant;
  let h = "";
  for (let i = 0; i < n * n; i++) {
    const r = Math.floor(i / n), c = i % n, v = cur[i], given = !!p.givens[i];
    const cls = ["cell"];
    if (c === 0 || reg[i - 1] !== reg[i]) cls.push("bl"); if (r === 0 || reg[i - n] !== reg[i]) cls.push("bt");
    if (c === n - 1) cls.push("br"); if (r === n - 1) cls.push("bb");
    if (p.shade && p.shade[i]) cls.push("shade");
    if (given) cls.push("given");
    if (i === sel) cls.push("sel"); else if (peers.has(i)) cls.push("peer");
    if (B.mode === "practice" && v && v === selV && i !== sel) cls.push("same");
    if (!given && v) {
      if (helpDup && G.peers[i].some(q => cur[q] === v)) cls.push("dup");
      if ((helpWrong || (B.flash && B.flash.has(i)) || (B.mode === "review" && !B.showSol)) && v !== p.sol[i]) cls.push("wrong");
    }
    if (B.mode === "review" && !B.showSol && !v) cls.push("miss");
    if (B.mode === "review" && B.showSol && !given) cls.push("solv");
    let inner = "";
    if (v) inner = `<span class="v">${sym(T, v)}</span>`;
    else if (st.notes[i]) { inner = `<span class="nt n${n}">`; for (let k = 1; k <= n; k++) inner += `<i>${st.notes[i] & (1 << k) ? sym(T, k) : ""}</i>`; inner += "</span>"; }
    h += `<div class="${cls.join(" ")}" data-i="${i}">${inner}</div>`;
  }
  const bd = $("#board"); bd.innerHTML = h;
  bd.onclick = e => { const c = e.target.closest(".cell"); if (!c) return; B.sel = +c.dataset.i; drawCells(); };
}
function drawPad() {
  const pad = $("#pad"); if (!pad) return;
  const { T, st } = B, n = T.n, cnt = new Array(n + 1).fill(0);
  st.cur.forEach(v => { if (v) cnt[v]++; });
  const help = B.mode === "practice";
  let h = ""; for (let v = 1; v <= n; v++) h += `<button type="button" class="key ${B.pencil ? "pen" : ""} ${help && cnt[v] >= n ? "full" : ""}" data-v="${v}">${sym(T, v)}${help ? `<small>${n - cnt[v] > 0 ? n - cnt[v] : "✓"}</small>` : ""}</button>`;
  pad.innerHTML = h;
  pad.querySelectorAll(".key").forEach(k => k.onclick = () => input(+k.dataset.v));
}
function snap() { B.undo.push({ cur: B.st.cur.slice(), notes: B.st.notes.slice() }); if (B.undo.length > 200) B.undo.shift(); }
function input(v) {
  const { st, G } = B, i = B.sel;
  if (i < 0) { toast("แตะเลือกช่องก่อนนะ"); return; }
  if (st.p.givens[i]) { toast("ช่องนี้เป็นโจทย์ แก้ไม่ได้"); return; }
  snap();
  if (B.pencil) { if (st.cur[i]) return; st.notes[i] ^= (1 << v); }
  else {
    if (st.cur[i] === v) st.cur[i] = 0; else { st.cur[i] = v; st.notes[i] = 0; if (prefs.autoNote && B.mode === "practice") G.peers[i].forEach(q => st.notes[q] &= ~(1 << v)); }
    tone(st.cur[i] ? 660 : 440, .06);
  }
  after();
}
function erase() { const i = B.sel; if (i < 0 || B.st.p.givens[i]) return; snap(); B.st.cur[i] = 0; B.st.notes[i] = 0; after(); }
function undo() { const u = B.undo.pop(); if (!u) { toast("ย้อนต่อไม่ได้แล้ว"); return; } B.st.cur = u.cur; B.st.notes = u.notes; after(); }
function after() {
  drawCells(); drawPad(); persist();
  const { st } = B; if (st.cur.some(v => !v)) return;
  if (B.mode === "exam") { toast("เติมครบทุกช่องแล้ว ไปข้อต่อไปได้เลย"); return; }
  if (st.cur.every((v, i) => v === st.p.sol[i])) win();
  else toast("เติมครบแล้ว แต่ยังมีช่องผิด ลองกด ✔ ตรวจ", 3000);
}
function hint() {
  const { st } = B; let i = B.sel;
  if (i < 0 || st.p.givens[i] || st.cur[i] === st.p.sol[i]) {
    const cand = []; st.cur.forEach((v, k) => { if (v !== st.p.sol[k]) cand.push(k); });
    if (!cand.length) return; i = cand[Math.floor(Math.random() * cand.length)];
  }
  snap(); st.cur[i] = st.p.sol[i]; st.notes[i] = 0; st.hints++; B.sel = i; toast(`ใบ้แล้ว ${st.hints} ครั้ง`); after();
}
function check() {
  const { st } = B; st.checks++;
  const bad = new Set(); st.cur.forEach((v, i) => { if (v && v !== st.p.sol[i]) bad.add(i); });
  if (!bad.size) { const left = st.cur.filter(v => !v).length; toast(left ? `ยังไม่มีช่องผิด 👍 เหลืออีก ${left} ช่อง` : "ถูกทั้งหมด!"); return; }
  B.flash = bad; drawCells(); toast(`มีช่องผิด ${bad.size} ช่อง (สีแดง)`, 2500); tone(220, .2);
  setTimeout(() => { if (B) { B.flash = null; drawCells(); } }, 2500);
}
function win() {
  const { st, T } = B; st.done = true; persist(); LS.del("cur");
  const stats = LS.get("stats", {}), s = stats[T.id] || (stats[T.id] = {});
  s[st.p.level] = (s[st.p.level] || 0) + 1;
  const bk = "best_" + st.p.level, nb = !st.hints && (!s[bk] || st.elapsed < s[bk]); if (nb) s[bk] = st.elapsed;
  LS.set("stats", stats);
  [523, 659, 784, 1047].forEach((f, k) => setTimeout(() => tone(f, .18), k * 110));
  const m = modal(`<div class="cele">🎉</div><h2>เก่งมาก! แก้ ${T.name} สำเร็จ</h2>
    <p class="big">⏱️ ${fmt(st.elapsed)}</p><p>${st.hints ? `ใช้คำใบ้ ${st.hints} ครั้ง` : "ไม่ใช้คำใบ้เลย 👏"} · ${LV[st.p.level]}</p>
    ${nb ? `<p class="nb">🏅 สถิติใหม่ของแบบนี้!</p>` : s[bk] ? `<p>สถิติดีที่สุด ${fmt(s[bk])}</p>` : ""}
    <p class="muted">แก้แบบนี้สำเร็จแล้ว ${(s.easy || 0) + (s.exam || 0) + (s.hard || 0)} ข้อ</p>
    <div class="row"><button type="button" class="btn" id="again">🔁 โจทย์ใหม่ แบบเดิม</button><button type="button" class="btn ghost" id="hm">🏠 เลือกแบบอื่น</button></div>`);
  m.querySelector("#again").onclick = () => { m.remove(); newPractice(T.id); };
  m.querySelector("#hm").onclick = () => { m.remove(); home(); };
}

/* ======================= EXAM ======================= */
function startExam() {
  loading("กำลังสร้างข้อสอบ 0/10…");
  const items = []; let k = 0;
  const step = () => {
    items.push({ p: generate(TYPES[k].id, prefs.examLevel) }); k++;
    const pEl = app.querySelector(".loading p"); if (pEl) pEl.textContent = `กำลังสร้างข้อสอบ ${k}/10…`;
    if (k < 10) return setTimeout(step, 10);
    items.forEach(it => { it.cur = it.p.givens.slice(); it.notes = new Array(it.p.givens.length).fill(0); });
    const ex = { items, start: Date.now(), dur: prefs.examMin * 60, done: false, level: prefs.examLevel };
    LS.set("exam", ex); B = { mode: "list", ex }; examList();
  };
  setTimeout(step, 30);
}
function examList() {
  const ex = LS.get("exam", null); if (!ex) return home();
  if (ex.done) return examResult();
  B = { mode: "list", ex };
  const left = ex.dur - (Date.now() - ex.start) / 1000;
  app.className = "home";
  app.innerHTML = `<header class="bh sticky"><button type="button" class="ib" id="back">🏠</button><div class="tt"><b>ข้อสอบซูโดกุ</b><small>${LV[ex.level]}</small></div><span class="clock" id="clock">${fmt(left)}</span></header>
  <p class="lead c">เลือกข้อที่จะทำ ทำข้อไหนก่อนก็ได้ · ตรวจตอนกดส่ง</p>
  <div class="elist">${ex.items.map((it, i) => { const T = T_(it.p.type), tot = it.cur.length, f = it.cur.filter(v => v).length, g = it.p.givens.filter(v => v).length, pct = Math.round(100 * (f - g) / (tot - g));
    return `<button type="button" class="eitem ${f === tot ? "full" : f > g ? "part" : ""}" data-i="${i}"><b>${i + 1}</b><span>${T.name}<small>${T.th}</small></span><i class="pbar"><i style="width:${pct}%"></i></i><em>${f === tot ? "ครบ ✓" : pct + "%"}</em></button>`; }).join("")}</div>
  <button type="button" class="btn big" id="sub">📤 ส่งข้อสอบ</button>
  <button type="button" class="btn ghost wide" id="cx">✕ ยกเลิกการสอบชุดนี้</button>
  <p class="muted c">กด 🏠 ออกไปก่อนได้ ข้อสอบจะค้างไว้ให้กลับมาทำต่อ (เวลายังเดินอยู่)</p>`;
  $("#back").onclick = home;
  $("#cx").onclick = () => ask("ยกเลิกการสอบชุดนี้?", "คำตอบที่ทำไว้จะถูกลบ และไม่บันทึกคะแนน", "ยกเลิกการสอบ", () => { stopTimer(); LS.del("exam"); home(); });
  app.querySelectorAll(".eitem").forEach(b => b.onclick = () => openExamItem(+b.dataset.i));
  $("#sub").onclick = () => {
    const empty = ex.items.filter(it => it.cur.some(v => !v)).length;
    const m = modal(`<h2>ส่งข้อสอบเลยไหม?</h2><p>${empty ? `ยังมี <b>${empty} ข้อ</b> ที่เติมไม่ครบ` : "เติมครบทุกข้อแล้ว 👍"}</p><p class="muted">ส่งแล้วแก้ไขไม่ได้</p><div class="row"><button type="button" class="btn" id="yes">ส่งเลย</button><button type="button" class="btn ghost" id="no">กลับไปทำต่อ</button></div>`);
    m.querySelector("#yes").onclick = () => { m.remove(); submitExam(false); };
    m.querySelector("#no").onclick = () => m.remove();
  };
  startClock();
}
function openExamItem(i) {
  const ex = B.ex || LS.get("exam", null); if (i < 0 || i > 9) return;
  const it = ex.items[i];
  B = mkBoard({ p: it.p, cur: it.cur, notes: it.notes }, "exam", { ex, idx: i });
  B.st = it; /* edit in place */
  render(); startClock();
}
function submitExam(auto) {
  const ex = (B && B.ex) || LS.get("exam", null); if (!ex || ex.done) return;
  const used = Math.min(ex.dur, Math.round((Date.now() - ex.start) / 1000)), left = ex.dur - used;
  const res = ex.items.map(it => it.cur.every((v, i) => v === it.p.sol[i]));
  const correct = res.filter(Boolean).length, score = correct * 10;
  const bonus = correct === 10 ? Math.floor(left / 60) : 0;
  ex.done = true; ex.result = { res, correct, score, bonus, total: score + bonus, used, left, auto };
  LS.set("exam", ex);
  const hist = LS.get("hist", []); hist.unshift({ at: Date.now(), correct, total: score + bonus, used }); LS.set("hist", hist.slice(0, 30));
  examResult();
}
function examResult() {
  stopTimer();
  const ex = LS.get("exam", null); if (!ex || !ex.result) return home();
  const R = ex.result; B = { mode: "result", ex };
  app.className = "home";
  app.innerHTML = `<section class="card res">
    <div class="cele">${R.correct >= 8 ? "🏆" : R.correct >= 5 ? "🎉" : "💪"}</div>
    <h2>${R.auto ? "หมดเวลา! " : ""}ผลการสอบ</h2>
    <table class="sheet-t"><tr><th>เวลาที่ใช้</th><th>เวลาที่เหลือ</th><th>คะแนน</th><th>โบนัสเวลา</th><th>รวม</th></tr>
    <tr><td>${fmt(R.used)}</td><td>${fmt(R.left)}</td><td>${R.score}</td><td>${R.bonus}</td><td><b>${R.total}</b></td></tr></table>
    <p class="muted">โบนัสเวลา: 1 คะแนนต่อ 1 นาทีที่เหลือ (ได้เมื่อถูกครบ 10 ข้อ)</p>
    <div class="elist">${ex.items.map((it, i) => `<button type="button" class="eitem ${R.res[i] ? "ok" : "bad"}" data-i="${i}"><b>${i + 1}</b><span>${T_(it.p.type).name}<small>แตะเพื่อดูคำตอบ/เฉลย</small></span><em>${R.res[i] ? "✅ 10" : "❌ 0"}</em></button>`).join("")}</div>
    <div class="row"><button type="button" class="btn" id="again">⏱️ สอบชุดใหม่</button><button type="button" class="btn ghost" id="hm">🏠 หน้าแรก</button></div></section>`;
  app.querySelectorAll(".eitem").forEach(b => b.onclick = () => reviewItem(+b.dataset.i));
  $("#again").onclick = startExam; $("#hm").onclick = home;
  if (R.correct === 10) [523, 659, 784, 1047, 1319].forEach((f, k) => setTimeout(() => tone(f, .2), k * 120));
}
function reviewItem(i) {
  const ex = LS.get("exam", null), it = ex.items[i];
  B = mkBoard({ p: it.p, cur: it.cur, notes: it.notes.map(() => 0) }, "review", { ex, idx: i, ok: ex.result.res[i], showSol: false });
  render();
}

/* ======================= KEYBOARD ======================= */
document.addEventListener("keydown", e => {
  if (!B || !B.T || B.mode === "review" || document.querySelector(".modal")) return;
  const n = B.T.n, k = e.key;
  let v = 0;
  if (/^[1-9]$/.test(k)) v = +k;
  else if (B.T.sym === "en" && /^[a-iA-I]$/.test(k)) v = k.toUpperCase().charCodeAt(0) - 64;
  else if (B.T.sym === "th") v = SYMS.th.indexOf(k);
  if (v > 0 && v <= n) { e.preventDefault(); return input(v); }
  if (k === "Backspace" || k === "Delete" || k === "0") { e.preventDefault(); return erase(); }
  if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === "z") { e.preventDefault(); return undo(); }
  if (k === " " || k.toLowerCase() === "p") { e.preventDefault(); $("#pen") && $("#pen").click(); return; }
  const mv = { ArrowUp: -n, ArrowDown: n, ArrowLeft: -1, ArrowRight: 1 }[k];
  if (mv) { e.preventDefault(); if (B.sel < 0) B.sel = 0; else { const r = Math.floor(B.sel / n), c = B.sel % n; if (k === "ArrowLeft" && c === 0 || k === "ArrowRight" && c === n - 1 || k === "ArrowUp" && r === 0 || k === "ArrowDown" && r === n - 1) return; B.sel += mv; } drawCells(); }
});
document.addEventListener("visibilitychange", () => { if (document.hidden) persist(); });
home();
})();
