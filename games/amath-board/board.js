(() => {
"use strict";
const $ = s => document.querySelector(s);
const app = $("#app");
const TRAINER_URL = "../amath-trainer/";
const N = 15, CENTER = 7 * N + 7, KEY = "kruau-amath-game";
/* premium squares (ตามกระดานรุ่นประถม) */
const PREM = (() => {
  const P = new Array(N * N).fill("");
  const top = [
    { 0: "3L", 3: "2P", 7: "3L", 11: "2P", 14: "3L" },
    { 1: "2L", 5: "3P", 9: "3P", 13: "2L" },
    { 2: "2L", 6: "2P", 8: "2P", 12: "2L" },
    { 0: "2P", 3: "2L", 7: "2P", 11: "2L", 14: "2P" },
    { 4: "3P", 10: "3P" },
    { 1: "3P", 5: "3P", 9: "3P", 13: "3P" },
    { 2: "2P", 6: "2P", 8: "2P", 12: "2P" },
    { 0: "3L", 3: "2P", 7: "★", 11: "2P", 14: "3L" }];
  for (let r = 0; r < N; r++) { const row = top[r <= 7 ? r : 14 - r]; for (const c in row) P[r * N + +c] = row[c]; }
  return P;
})();
const pieceMul = p => p === "2P" ? 2 : p === "3P" || p === "★" ? 3 : 1;
const eqMul = p => p === "2L" ? 2 : p === "3L" ? 3 : 1;
const show = s => s === "-" ? "−" : s;
const sumPts = rack => rack.reduce((a, k) => a + AM.PTS[k], 0);
const fmt = ms => { const neg = ms < 0; let s = Math.ceil(Math.abs(ms) / 1000); const m = Math.floor(s / 60); s %= 60; return (neg ? "−" : "") + (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s; };
const overMin = ms => ms < 0 ? Math.ceil(-ms / 60000 - 1e-9) : 0;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
let ac = null;
function tone(f, d = .1, v = .15) { if (!S || !S.cfg.sound) return; try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; g.gain.setValueAtTime(v, ac.currentTime); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + d); o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + d); } catch (e) {} }
function toast(m, ms = 2600) { let t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); } t.innerHTML = m; t.classList.add("on"); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove("on"), ms); }
let wake = null; async function keepAwake() { try { if (navigator.wakeLock && !wake) { wake = await navigator.wakeLock.request("screen"); wake.addEventListener("release", () => wake = null); } } catch (e) {} }

let S = null;
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
const loadGame = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } };
const defCfg = { names: ["ทีม A", "ทีม B"], min: 22, clock: true, hide: true, sound: true, ai: false, level: 2, hints: true };
const LVN = { 1: "ง่าย", 2: "กลาง", 3: "เก่ง" };
let CFG = Object.assign({}, defCfg, (() => { try { return JSON.parse(localStorage.getItem(KEY + "-cfg")) || {}; } catch (e) { return {}; } })());

/* ======================= SETUP ======================= */
function setup() {
  stopLoop();
  const g = loadGame(), live = g && !g.over;
  app.className = "setup";
  app.innerHTML = `
  <header class="top"><div class="logo"><span>A</span><i>=</i></div><div><h1>เอแม็ท กระดานจริง</h1><p>เล่น 2 ฝั่งบนเครื่องเดียว หรือเล่นกับคอม · กระดาน 15×15 · เบี้ยรุ่นประถม 70 ตัว · ตรวจสมการและคิดคะแนนให้อัตโนมัติ</p></div></header>
  ${live ? `<div class="rrow"><button type="button" class="resume" id="resume">▶ เล่นเกมที่ค้างไว้ต่อ · ${esc(g.cfg.names[0])} ${g.score[0]} – ${g.score[1]} ${esc(g.cfg.names[1])}</button><button type="button" class="rx" id="drop">✕<span>ยกเลิก</span></button></div>` : ""}
  <section class="card">
    <h3>คู่แข่ง</h3>
    <div class="seg" id="opp"><button type="button" data-v="0" class="${CFG.ai ? "" : "on"}">👥 2 ฝั่ง (เครื่องเดียว)</button><button type="button" data-v="1" class="${CFG.ai ? "on" : ""}">🤖 เล่นกับคอม</button></div>
    <div id="aiopt" ${CFG.ai ? "" : "hidden"}><p class="hint">ระดับคอมพิวเตอร์</p><div class="seg" id="lvl">${[1, 2, 3].map(v => `<button type="button" data-v="${v}" class="${CFG.level === v ? "on" : ""}">${["", "🌱 ง่าย", "🌿 กลาง", "🔥 เก่ง"][v]}</button>`).join("")}</div>
    <label class="tg"><input type="checkbox" id="o-hint" ${CFG.hints ? "checked" : ""}> มีปุ่ม 💡 ใบ้ (ให้คอมช่วยหาสมการที่ดีที่สุดจากแป้นเรา)</label></div>
    <h3 id="nmh">${CFG.ai ? "ชื่อผู้เล่น" : "ชื่อทีม"}</h3>
    <div class="names"><label><span class="dot d0"></span><input id="n0" value="${esc(CFG.names[0])}" maxlength="16"></label><label id="n1l" ${CFG.ai ? "hidden" : ""}><span class="dot d1"></span><input id="n1" value="${esc(CFG.names[1])}" maxlength="16"></label></div>
    <p class="hint">ฝั่งที่เริ่มก่อนสุ่มให้อัตโนมัติ (จับเบี้ยคนละตัว ใครได้เลขน้อยกว่าเริ่มก่อน แบบในสนาม)</p>
    <h3>นาฬิกา</h3>
    <div class="seg" id="min">${[0, 18, 20, 22].map(m => `<button type="button" data-v="${m}" class="${(CFG.clock ? CFG.min : 0) === m ? "on" : ""}">${m ? m + " นาที" : "ไม่จับเวลา"}</button>`).join("")}</div>
    <label class="tg"><input type="checkbox" id="o-hide" ${CFG.hide ? "checked" : ""}> ซ่อนแป้นตอนเปลี่ยนตา (โหมด 2 ฝั่ง)</label>
    <label class="tg"><input type="checkbox" id="o-snd" ${CFG.sound ? "checked" : ""}> เสียง</label>
  </section>
  <button type="button" class="btn big" id="go">🎲 เริ่มเกมใหม่</button>
  <section class="card how"><h3>วิธีเล่น</h3><ol>
    <li>แตะเบี้ยในแป้น แล้วแตะช่องบนกระดานเพื่อวาง (แตะเบี้ยที่วางแล้วเพื่อเอาคืน)</li>
    <li>ตาแรกต้องทับ ★ กลางกระดาน ตาต่อไปต้องต่อกับเบี้ยเดิม วางเป็นแถวเดียวกัน</li>
    <li>กด <b>✔ ลงเบี้ย</b> ระบบตรวจทุกสมการที่เกิดขึ้น คิดคะแนนช่องพิเศษ บิงโก +40 และเติมเบี้ยให้</li>
    <li>2P/3P คูณเฉพาะเบี้ยที่ทับ · 2L/3L คูณทั้งสมการ · ★ = 3P · ช่องพิเศษนับเฉพาะตาที่วางทับ</li>
    <li>เปลี่ยนเบี้ยได้เมื่อในถุงเหลือ 5 ตัวขึ้นไป (เสียตา) · ผ่านตาได้</li>
    <li>ลงเบี้ยหมดแป้นก่อน (ถุงหมดแล้ว) ได้แต้มเบี้ยค้างของอีกฝั่ง อีกฝั่งถูกหักเท่ากัน · เกินเวลาหักนาทีละ 10</li>
  </ol></section>
  <a class="link" href="${TRAINER_URL}">🧮 ไปหน้าฝึกต่อสมการจากแป้น</a>`;
  app.querySelectorAll("#min button").forEach(b => b.onclick = () => { const v = +b.dataset.v; CFG.clock = v > 0; if (v) CFG.min = v; app.querySelectorAll("#min button").forEach(x => x.classList.toggle("on", x === b)); });
  app.querySelectorAll("#opp button").forEach(b => b.onclick = () => { CFG.ai = b.dataset.v === "1"; app.querySelectorAll("#opp button").forEach(x => x.classList.toggle("on", x === b)); $("#aiopt").hidden = !CFG.ai; $("#n1l").hidden = CFG.ai; $("#nmh").textContent = CFG.ai ? "ชื่อผู้เล่น" : "ชื่อทีม"; });
  app.querySelectorAll("#lvl button").forEach(b => b.onclick = () => { CFG.level = +b.dataset.v; app.querySelectorAll("#lvl button").forEach(x => x.classList.toggle("on", x === b)); });
  $("#o-hint").onchange = e => CFG.hints = e.target.checked;
  ["n0", "n1"].forEach((id, i) => $("#" + id).oninput = e => CFG.names[i] = e.target.value.trim() || (i ? "ทีม B" : "ทีม A"));
  $("#o-hide").onchange = e => CFG.hide = e.target.checked;
  $("#o-snd").onchange = e => CFG.sound = e.target.checked;
  if (live) { $("#resume").onclick = () => { S = g; play(); if (S.cfg.clock) pause(true); else if (isAI(S.turn)) scheduleAI(); }; $("#drop").onclick = () => confirmBox("ยกเลิกเกมที่ค้างไว้?", "กระดานและคะแนนของเกมนั้นจะถูกลบ", "ยกเลิกเกม", () => { localStorage.removeItem(KEY); setup(); }); }
  $("#go").onclick = () => { if (live) return confirmBox("เริ่มเกมใหม่?", "เกมที่ค้างอยู่จะถูกลบ", "เริ่มใหม่", newGame); newGame(); };
}
function newGame() {
  try { localStorage.setItem(KEY + "-cfg", JSON.stringify(CFG)); } catch (e) {}
  const bag = AM.shuffle((() => { const b = []; AM.SET.forEach(([k, c]) => { for (let i = 0; i < c; i++) b.push(k); }); return b; })());
  /* จับเบี้ยเลือกฝั่งเริ่ม: ตัวเลขน้อยกว่าเริ่มก่อน (เครื่องหมาย/BLANK ถือว่าน้อยกว่า 0) */
  const rank = k => /^\d+$/.test(k) ? +k : k === "?" ? -0.5 : -1;
  let a, b; do { a = bag[Math.floor(Math.random() * 70)]; b = bag[Math.floor(Math.random() * 70)]; } while (rank(a) === rank(b));
  const first = rank(a) < rank(b) ? 0 : 1;
  const cfg = JSON.parse(JSON.stringify(CFG)); if (cfg.ai) cfg.names = [cfg.names[0], `🤖 คอม (${LVN[cfg.level]})`];
  S = { cfg, bag, board: new Array(N * N).fill(null), racks: [[], []], score: [0, 0], turn: first, pending: [], sel: -1,
        left: [CFG.min * 60000, CFG.min * 60000], log: [], over: false, paused: false, moves: 0, draw: [a, b], view: [null, null], hidden: CFG.hide && !CFG.ai, hintsUsed: 0 };
  refill(0); refill(1); save();
  play(); if (isAI(S.turn)) scheduleAI(1800);
  toast(`จับเบี้ย: ${esc(S.cfg.names[0])} ได้ [${show(a === "?" ? "BLANK" : a)}] · ${esc(S.cfg.names[1])} ได้ [${show(b === "?" ? "BLANK" : b)}]<br><b>${esc(S.cfg.names[first])} เริ่มก่อน</b>`, 4000);
}
function refill(i) { while (S.racks[i].length < 8 && S.bag.length) S.racks[i].push(S.bag.pop()); S.view[i] = null; }

/* ======================= PLAY ======================= */
let raf = 0, last = 0, saveT = 0;
function stopLoop() { cancelAnimationFrame(raf); raf = 0; }
function loop(t) {
  if (S && S.cfg.clock && !S.over && !S.paused) {
    const dt = last ? t - last : 0; last = t;
    const i = S.turn, b = S.left[i]; S.left[i] -= dt;
    if (b > 60000 && S.left[i] <= 60000) tone(880, .12);
    if (b > 0 && S.left[i] <= 0) tone(440, .5);
    if (t - saveT > 2000) { saveT = t; save(); }
    paintClock();
  } else last = t;
  raf = requestAnimationFrame(loop);
}
function play() {
  app.className = "game";
  app.innerHTML = `
  <div class="side">
    <div class="scores">${[0, 1].map(i => `<div class="pl p${i}" id="pl${i}"><div class="pn"><span class="dot d${i}"></span>${esc(S.cfg.names[i])}</div><b class="ps" id="sc${i}">${S.score[i]}</b>${S.cfg.clock ? `<span class="pc" id="ck${i}">${fmt(S.left[i])}</span>` : ""}</div>`).join("")}</div>
    <div class="turnbar" id="turnbar"></div>
    <div class="rackwrap"><div class="rack" id="rack"></div><div class="cover" id="cover" hidden></div></div>
    <div class="acts">
      <button type="button" class="ab ok" id="play">✔ ลงเบี้ย</button>
      <button type="button" class="ab" id="recall">↩ เก็บคืน</button>
      <button type="button" class="ab" id="shuf">🔀 สลับ</button>
      ${S.cfg.ai && S.cfg.hints ? `<button type="button" class="ab hintb" id="hintb">💡 ใบ้</button>` : ""}
    </div>
    <div class="acts">
      <button type="button" class="ab" id="exch">🔁 เปลี่ยนเบี้ย</button>
      <button type="button" class="ab" id="pass">⏭ ผ่าน</button>
      ${S.cfg.clock ? `<button type="button" class="ab" id="pause">⏸ พัก</button>` : ""}
      <button type="button" class="ab" id="menu">☰</button>
    </div>
    <div class="msg" id="msg"></div>
    <div class="bagi" id="bagi"></div>
    <div class="log" id="log"></div>
  </div>
  <div class="bwrap" id="bwrap"><div class="board" id="board"></div></div>
  <div class="ov" id="ov" hidden></div>`;
  $("#play").onclick = commit; $("#recall").onclick = recall; $("#shuf").onclick = shuffleRack;
  $("#exch").onclick = exchange; $("#pass").onclick = () => isAI(S.turn) ? 0 : confirmBox("ผ่านตานี้?", `ให้ ${esc(S.cfg.names[1 - S.turn])} เล่นต่อ`, "ผ่าน", () => { recall(true); logMove({ type: "pass" }); endTurn(); });
  if ($("#pause")) $("#pause").onclick = () => pause(!S.paused);
  if ($("#hintb")) $("#hintb").onclick = hint;
  $("#menu").onclick = menu;
  $("#board").onclick = e => { const c = e.target.closest(".cell"); if (c) tapCell(+c.dataset.i); };
  keepAwake();
  renderAll();
  stopLoop(); last = 0; raf = requestAnimationFrame(loop);
}
function renderAll() { renderBoard(); renderRack(); renderSide(); }
function renderBoard() {
  const pend = new Map(S.pending.map(p => [p.c, p]));
  let h = "";
  for (let i = 0; i < N * N; i++) {
    const t = S.board[i], p = pend.get(i), pr = PREM[i];
    const cls = ["cell", pr ? "pr pr" + pr.replace("★", "S") : ""];
    let inner = pr ? `<em>${pr}</em>` : "";
    if (t || p) {
      const k = t ? t.k : S.racks[S.turn][p.r], s = t ? t.s : p.s;
      inner = `<span class="bt ${k === "?" ? "bl" : ""} ${p ? "pend" : ""} ${t && t.m === S.moves - 1 ? "last" : ""}"><b class="${String(show(s)).length > 1 ? "two" : ""}">${show(s)}</b><i>${AM.PTS[k]}</i></span>`;
    }
    h += `<div class="${cls.join(" ")}" data-i="${i}">${inner}</div>`;
  }
  $("#board").innerHTML = h;
}
function rackOrder(i) { const r = S.racks[i]; if (!S.view[i] || S.view[i].length !== r.length) S.view[i] = [...r.keys()]; return S.view[i]; }
function renderRack() {
  const i = rackSide(), r = S.racks[i], used = new Set(S.turn === i ? S.pending.map(p => p.r) : []);
  $("#rack").innerHTML = rackOrder(i).map(j => { const k = r[j]; const face = k === "?" ? "" : k === "+/-" ? "+/−" : show(k);
    return `<button type="button" class="tile ${k === "?" ? "blank" : ""} ${face.length > 2 ? "sm" : ""} ${used.has(j) ? "used" : ""} ${S.sel === j ? "sel" : ""} ${S.exch && S.exch.has(j) ? "ex" : ""}" data-j="${j}"><span>${face}</span><i>${AM.PTS[k]}</i></button>`; }).join("");
  $("#rack").querySelectorAll(".tile").forEach(t => t.onclick = () => tapRack(+t.dataset.j));
  $("#rack").classList.toggle("wait", isAI(S.turn));
  const cv = $("#cover");
  if (S.hidden && !S.over) { cv.hidden = false; cv.innerHTML = `<button type="button" id="reveal">👀 ตาของ <b>${esc(S.cfg.names[S.turn])}</b><br><small>แตะเพื่อเปิดแป้น${S.cfg.clock ? " · เวลากำลังเดิน" : ""}</small></button>`; $("#reveal").onclick = () => { S.hidden = false; last = 0; save(); renderRack(); }; }
  else cv.hidden = true;
}
function renderSide() {
  for (const i of [0, 1]) { $("#pl" + i).classList.toggle("on", S.turn === i && !S.over); $("#sc" + i).textContent = S.score[i]; }
  $("#turnbar").innerHTML = S.over ? "🏁 จบเกม" : isAI(S.turn) ? `<span class="think">🤖 คอมกำลังคิด…</span>` : `ตาของ <span class="dot d${S.turn}"></span><b>${esc(S.cfg.names[S.turn])}</b>${S.moves === 0 ? " · ตาแรกต้องทับ ★" : ""}`;
  $("#bagi").innerHTML = S.cfg.ai ? `ถุง: เหลือ <b>${S.bag.length}</b> ตัว · คอมมีเบี้ย ${S.racks[1].length} ตัว${S.hintsUsed ? ` · ใช้ใบ้ ${S.hintsUsed} ครั้ง` : ""}` : `ถุง: เหลือ <b>${S.bag.length}</b> ตัว · แป้น${esc(S.cfg.names[1 - S.turn])}: ${S.racks[1 - S.turn].length} ตัว`;
  $("#log").innerHTML = S.log.length ? `<h4>บันทึกการเล่น</h4>` + S.log.slice().reverse().map(l => `<div class="lg l${l.p}"><span class="dot d${l.p}"></span><span class="lt">${l.text}</span><b>${l.pts > 0 ? "+" + l.pts : l.pts < 0 ? l.pts : ""}</b></div>`).join("") : "";
  paintClock();
}
function paintClock() {
  if (!S.cfg.clock) return;
  for (const i of [0, 1]) { const c = $("#ck" + i); if (!c) continue; c.textContent = fmt(S.left[i]); c.classList.toggle("neg", S.left[i] < 0); c.classList.toggle("low", S.left[i] >= 0 && S.left[i] < 60000); }
}
function msg(t, cls = "") { const m = $("#msg"); m.className = "msg " + cls; m.innerHTML = t; }

/* ---------- input ---------- */
function tapRack(j) {
  if (S.over || S.paused) return;
  if (isAI(S.turn)) { msg("🤖 รอคอมเล่นก่อนนะ", "info"); return; }
  if (S.pending.some(p => p.r === j)) { S.pending = S.pending.filter(p => p.r !== j); S.sel = -1; renderBoard(); renderRack(); return; }
  S.sel = S.sel === j ? -1 : j; renderRack();
  if (S.sel >= 0) msg("แตะช่องว่างบนกระดานเพื่อวางเบี้ย");
}
function tapCell(c) {
  if (S.over || S.paused || S.hidden || S.exch || isAI(S.turn)) return;
  const p = S.pending.find(x => x.c === c);
  if (p) {
    const k = S.racks[S.turn][p.r];
    if (AM.opts(k).length > 1) return choose(k, p.s, s => { if (s === null) S.pending = S.pending.filter(x => x !== p); else p.s = s; renderBoard(); renderRack(); }, true);
    S.pending = S.pending.filter(x => x !== p); renderBoard(); renderRack(); return;
  }
  if (S.board[c]) return;
  if (S.sel < 0) { /* ถ้ายังไม่เลือกเบี้ย ใช้ตัวแรกที่ยังว่าง */ msg("เลือกเบี้ยในแป้นก่อน แล้วค่อยแตะช่อง"); return; }
  const j = S.sel, k = S.racks[S.turn][j], o = AM.opts(k);
  const put = s => { S.pending.push({ c, r: j, s }); S.sel = nextFree(); tone(600, .04, .08); renderBoard(); renderRack(); msg(""); };
  if (o.length === 1) put(o[0]); else choose(k, null, s => { if (s) put(s); });
}
function nextFree() { return -1; }
function choose(kind, cur, cb, canRemove) {
  const ov = $("#ov"), o = AM.opts(kind); ov.hidden = false;
  ov.innerHTML = `<div class="psheet"><p>${kind === "?" ? "เบี้ยว่าง (BLANK) จะแทนตัวไหน?" : kind === "+/-" ? "ใช้เป็น + หรือ − ?" : "ใช้เป็น × หรือ ÷ ?"}</p>
    <div class="pg ${kind === "?" ? "many" : ""}">${o.map(s => `<button type="button" data-s="${s}" class="${s === cur ? "on" : ""}">${show(s)}</button>`).join("")}</div>
    <div class="row">${canRemove ? `<button type="button" class="ab" id="prm">↩ เอาเบี้ยคืน</button>` : ""}<button type="button" class="ab" id="pcl">ยกเลิก</button></div></div>`;
  ov.querySelectorAll(".pg button").forEach(b => b.onclick = () => { ov.hidden = true; cb(b.dataset.s); });
  if ($("#prm")) $("#prm").onclick = () => { ov.hidden = true; cb(null); };
  $("#pcl").onclick = () => { ov.hidden = true; };
}
function recall(silent) { S.pending = []; S.sel = -1; renderBoard(); renderRack(); if (!silent) msg(""); }
function shuffleRack() { const v = rackOrder(S.turn); AM.shuffle(v); renderRack(); }

/* ---------- move validation & scoring ---------- */
function evaluate(board, pending, firstMove) {
  if (!pending.length) return { ok: false, msg: "ยังไม่ได้วางเบี้ย" };
  const cells = pending.map(p => p.c), rows = new Set(cells.map(c => Math.floor(c / N))), cols = new Set(cells.map(c => c % N));
  if (rows.size > 1 && cols.size > 1) return { ok: false, msg: "ต้องวางเบี้ยเป็นแถวเดียวกัน (แนวนอนหรือแนวตั้ง)" };
  const B = board.slice(); pending.forEach(p => B[p.c] = { k: p.k, s: p.s, n: true });
  let dir = rows.size === 1 && cells.length > 1 ? 1 : cols.size === 1 && cells.length > 1 ? N : 0;
  if (!dir) { const c = cells[0]; const hz = (c % N > 0 && B[c - 1]) || (c % N < N - 1 && B[c + 1]); dir = hz ? 1 : N; }
  /* contiguity */
  const sorted = cells.slice().sort((a, b) => a - b);
  for (let c = sorted[0]; c <= sorted[sorted.length - 1]; c += dir) if (!B[c]) return { ok: false, msg: "เบี้ยที่วางต้องติดกันเป็นแนวเดียว ห้ามเว้นช่อง" };
  if (firstMove) { if (!cells.includes(CENTER)) return { ok: false, msg: "ตาแรกต้องวางเบี้ยทับช่อง ★ กลางกระดาน" }; if (cells.length < 3) return { ok: false, msg: "ตาแรกต้องเป็นสมการอย่างน้อย 3 ตัว" }; }
  else {
    const touch = cells.some(c => [c - N, c + N, c % N ? c - 1 : -1, c % N < N - 1 ? c + 1 : -1].some(x => x >= 0 && x < N * N && board[x]));
    if (!touch) return { ok: false, msg: "ต้องวางต่อกับเบี้ยที่อยู่บนกระดานแล้ว" };
  }
  const line = (c, d) => { let s = c; const step = d, ok = x => x >= 0 && x < N * N && B[x] && (d === N || Math.floor(x / N) === Math.floor(c / N));
    while (ok(s - step)) s -= step; const out = []; for (let x = s; ok(x); x += step) out.push(x); return out; };
  const eqs = []; const main = line(cells[0], dir); if (main.length > 1) eqs.push(main);
  const cross = dir === 1 ? N : 1;
  for (const c of cells) { const l = line(c, cross); if (l.length > 1) eqs.push(l); }
  if (!eqs.length) return { ok: false, msg: "ต้องเป็นสมการอย่างน้อย 3 ตัว" };
  let total = 0; const parts = [];
  for (const L of eqs) {
    const syms = L.map(x => B[x].s), r = AM.check(syms), txt = eqStr(syms);
    if (!r.ok) return { ok: false, msg: `❌ ${txt} : ${r.msg}` };
    let sc = 0, em = 1;
    for (const x of L) { const t = B[x]; let p = AM.PTS[t.k]; if (t.n) { p *= pieceMul(PREM[x]); em *= eqMul(PREM[x]); } sc += p; }
    sc *= em; total += sc; parts.push({ txt, sc, em });
  }
  const bingo = pending.length === 8; if (bingo) total += 40;
  return { ok: true, total, parts, bingo };
}
function eqStr(syms) { return syms.map((x, k) => show(x) + ((x === "-" && (k === 0 || syms[k - 1] === "=")) ? "\u0001" : "")).join(" ").replace(/\u0001 /g, "").replace(/(\d) (?=\d)/g, "$1"); }
function commit(force) {
  if (S.over || S.paused || S.hidden || S.exch) return;
  if (isAI(S.turn) && force !== true) return;
  const rack = S.racks[S.turn], pend = S.pending.map(p => ({ c: p.c, k: rack[p.r], s: p.s }));
  const r = evaluate(S.board, pend, S.moves === 0);
  if (!r.ok) { msg(r.msg, "bad"); tone(220, .25); return; }
  pend.forEach(p => S.board[p.c] = { k: p.k, s: p.s, m: S.moves, p: S.turn });
  const usedIdx = new Set(S.pending.map(p => p.r)); S.racks[S.turn] = rack.filter((_, j) => !usedIdx.has(j));
  S.score[S.turn] += r.total;
  logMove({ type: "play", text: r.parts.map(p => `${p.txt}${p.em > 1 ? ` <small>×${p.em}</small>` : ""}`).join(" · ") + (r.bingo ? " · 🌟บิงโก+40" : ""), pts: r.total });
  if (r.bingo) [523, 659, 784, 1047, 1319].forEach((f, k) => setTimeout(() => tone(f, .2), k * 100)); else [660, 880].forEach((f, k) => setTimeout(() => tone(f, .1), k * 90));
  toast(`${r.bingo ? "🌟 บิงโก! " : "✅ "}${esc(S.cfg.names[S.turn])} +${r.total} คะแนน<br><small>${r.parts.map(p => `${p.txt} → ${p.sc} คะแนน`).join("<br>")}</small>`);
  S.pending = []; S.sel = -1; S.moves++;
  refill(S.turn);
  if (!S.racks[S.turn].length && !S.bag.length) return finish(S.turn);
  endTurn();
}
function logMove(m) { S.log.push(Object.assign({ p: S.turn, pts: 0, text: m.type === "pass" ? "ผ่าน" : m.type === "exch" ? `เปลี่ยนเบี้ย ${m.n} ตัว` : "" }, m.type === "play" ? m : {})); }
function endTurn() {
  S.turn = 1 - S.turn; S.sel = -1; S.exch = null; S.hidden = !!S.cfg.hide && !S.cfg.ai; last = 0; save();
  renderAll(); msg("");
  if (isAI(S.turn)) scheduleAI();
}
function exchange() {
  if (S.over || isAI(S.turn)) return;
  if (S.paused) { msg("กด ▶ เล่นต่อก่อน", "bad"); return; }
  if (S.bag.length < 5) { msg(`ในถุงเหลือ ${S.bag.length} ตัว (น้อยกว่า 5) เปลี่ยนเบี้ยไม่ได้`, "bad"); toast("ในถุงเหลือน้อยกว่า 5 ตัว เปลี่ยนเบี้ยไม่ได้"); return; }
  recall(true);
  const r = S.racks[S.turn], sel = new Set(), ov = $("#ov");
  const draw = () => {
    ov.hidden = false;
    ov.innerHTML = `<div class="psheet exs"><p style="font-size:20px">🔁 เปลี่ยนเบี้ย · ${esc(S.cfg.names[S.turn])}</p>
      <p class="muted">แตะเลือกเบี้ยที่ต้องการเปลี่ยน (กี่ตัวก็ได้ 1–${r.length} ตัว) · เปลี่ยนแล้วเสียตา ให้อีกฝั่งเล่นต่อ</p>
      <div class="exrack">${r.map((k, j) => { const face = k === "?" ? "" : k === "+/-" ? "+/−" : show(k); return `<button type="button" class="tile ${k === "?" ? "blank" : ""} ${face.length > 2 ? "sm" : ""} ${sel.has(j) ? "ex" : ""}" data-j="${j}"><span>${face}</span><i>${AM.PTS[k]}</i>${sel.has(j) ? "<u>✓</u>" : ""}</button>`; }).join("")}</div>
      <div class="row"><button type="button" class="ab" id="exall">${sel.size === r.length ? "ไม่เลือกเลย" : "เลือกทั้งหมด"}</button></div>
      <div class="row"><button type="button" class="ab ok" id="exy" ${sel.size ? "" : "disabled"}>🔁 เปลี่ยน ${sel.size} ตัว แล้วจบตา</button><button type="button" class="ab" id="exn2">ยกเลิก</button></div></div>`;
    ov.querySelectorAll(".exrack .tile").forEach(t => t.onclick = () => { const j = +t.dataset.j; sel.has(j) ? sel.delete(j) : sel.add(j); draw(); });
    $("#exall").onclick = () => { if (sel.size === r.length) sel.clear(); else r.forEach((_, j) => sel.add(j)); draw(); };
    $("#exn2").onclick = () => { ov.hidden = true; };
    $("#exy").onclick = () => {
      if (!sel.size) return;
      const out = [...sel].map(j => r[j]); S.racks[S.turn] = r.filter((_, j) => !sel.has(j));
      refill(S.turn); S.bag.push(...out); AM.shuffle(S.bag);
      ov.hidden = true; logMove({ type: "exch", n: out.length });
      toast(`🔁 ${esc(S.cfg.names[S.turn])} เปลี่ยนเบี้ย ${out.length} ตัว<br><small>ตาของ ${esc(S.cfg.names[1 - S.turn])}</small>`);
      endTurn();
    };
  };
  draw();
}
function pause(p) {
  if (!S.cfg.clock || S.over) return;
  S.paused = p; last = 0; save();
  const ov = $("#ov");
  if (p) { ov.hidden = false; ov.innerHTML = `<div class="psheet"><p style="font-size:24px">⏸ พักเวลา</p><p>ตรวจสมการ / เรียกกรรมการ</p><button type="button" class="btn big" id="res">▶ เล่นต่อ</button></div>`; $("#res").onclick = () => pause(false); }
  else { ov.hidden = true; if (isAI(S.turn)) scheduleAI(); }
  if ($("#pause")) $("#pause").textContent = p ? "▶ ต่อ" : "⏸ พัก";
}
function menu() {
  const ov = $("#ov"); ov.hidden = false;
  ov.innerHTML = `<div class="psheet"><p>เมนู</p><div class="col">
    <button type="button" class="ab" id="m-end">🏁 จบเกมตอนนี้ (หักแต้มเบี้ยค้างแป้นทั้งสองฝั่ง)</button>
    <button type="button" class="ab" id="m-home">🏠 ออกไปหน้าแรก (เกมค้างไว้เล่นต่อได้)</button>
    <button type="button" class="ab" id="m-x">ปิด</button></div></div>`;
  $("#m-end").onclick = () => { ov.hidden = true; confirmBox("จบเกมตอนนี้?", "แต่ละฝั่งจะถูกหักแต้มเบี้ยที่ค้างในแป้นของตัวเอง", "จบเกม", () => finish(-1)); };
  $("#m-home").onclick = () => { if (S.cfg.clock) S.paused = true; save(); setup(); };
  $("#m-x").onclick = () => ov.hidden = true;
}
function confirmBox(t, m, yes, fn) {
  let ov = $("#ov"); if (!ov) { ov = document.createElement("div"); ov.id = "ov"; ov.className = "ov"; app.appendChild(ov); }
  ov.hidden = false;
  ov.innerHTML = `<div class="psheet"><p style="font-size:20px">${t}</p><p class="muted">${m}</p><div class="row"><button type="button" class="ab danger" id="cy">${yes}</button><button type="button" class="ab" id="cn">ยกเลิก</button></div></div>`;
  $("#cy").onclick = () => { ov.hidden = true; fn(); }; $("#cn").onclick = () => { ov.hidden = true; if (S && S.paused) pause(true); };
}

/* ---------- end ---------- */
function finish(outBy) {
  S.over = true; S.pending = [];
  const rem = [sumPts(S.racks[0]), sumPts(S.racks[1])], adj = [0, 0];
  if (outBy >= 0) { const o = 1 - outBy; adj[outBy] += rem[o]; adj[o] -= rem[o]; }
  else { adj[0] -= rem[0]; adj[1] -= rem[1]; }
  const pen = [0, 1].map(i => S.cfg.clock ? overMin(S.left[i]) * 10 : 0);
  S.final = { base: S.score.slice(), adj, pen, rem, outBy };
  S.score = [0, 1].map(i => S.score[i] + adj[i] - pen[i]);
  save(); stopLoop(); renderAll(); result();
}
function result() {
  const F = S.final, w = S.score[0] === S.score[1] ? -1 : S.score[0] > S.score[1] ? 0 : 1, diff = Math.abs(S.score[0] - S.score[1]);
  const ov = $("#ov"); ov.hidden = false;
  ov.innerHTML = `<div class="psheet res"><div style="font-size:48px">${w < 0 ? "🤝" : "🏆"}</div><p style="font-size:22px">${w < 0 ? "เสมอ!" : `${esc(S.cfg.names[w])} ชนะ ${diff} คะแนน`}</p>
    <table class="rt"><tr><th></th>${[0, 1].map(i => `<th><span class="dot d${i}"></span>${esc(S.cfg.names[i])}</th>`).join("")}</tr>
    <tr><td>คะแนนจากกระดาน</td>${F.base.map(v => `<td>${v}</td>`).join("")}</tr>
    <tr><td>เบี้ยค้างแป้น</td>${F.adj.map(v => `<td class="${v < 0 ? "red" : v > 0 ? "grn" : ""}">${v > 0 ? "+" : ""}${v}</td>`).join("")}</tr>
    ${S.cfg.clock ? `<tr><td>หักเกินเวลา</td>${F.pen.map(v => `<td class="${v ? "red" : ""}">${v ? "−" + v : 0}</td>`).join("")}</tr>` : ""}
    <tr class="net"><td>คะแนนสุทธิ</td>${S.score.map(v => `<td><b>${v}</b></td>`).join("")}</tr></table>
    ${diff > 150 ? `<p class="muted">รุ่นประถมนับผลต่างสูงสุด 150 คะแนน</p>` : ""}
    ${S.cfg.ai && S.racks[1].length ? `<p class="muted">เบี้ยที่เหลือในแป้นคอม: ${S.racks[1].map(k => k === "?" ? "BLANK" : show(k)).join(" ")}</p>` : ""}
    <div class="row"><button type="button" class="ab ok" id="again">🎲 เกมใหม่</button><button type="button" class="ab" id="view">ดูกระดาน</button><button type="button" class="ab" id="hm">🏠</button></div></div>`;
  $("#again").onclick = () => { localStorage.removeItem(KEY); newGame(); };
  $("#view").onclick = () => { ov.hidden = true; const tb = $("#turnbar"); tb.innerHTML = `🏁 จบเกม · <button type="button" class="ab" id="sr">ดูผล</button>`; $("#sr").onclick = result; };
  $("#hm").onclick = () => { localStorage.removeItem(KEY); setup(); };
}
/* ======================= COMPUTER PLAYER ======================= */
function isAI(i) { return !!(S && S.cfg.ai && i === 1); }
function rackSide() { return S.cfg.ai ? 0 : S.turn; }
let aiTimer = 0;
function scheduleAI(delay = 700) {
  clearTimeout(aiTimer);
  aiTimer = setTimeout(() => { if (!S || S.over || !isAI(S.turn)) return; if (S.paused) return; aiTurn(); }, delay);
}
const AI_BLANK = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "+", "-", "×", "÷", "="];
function genMoves(side, budget) {
  const B = S.board, rack = S.racks[side], first = !B.some(Boolean), t0 = Date.now(), out = [];
  const optsOf = k => k === "?" ? AI_BLANK : AM.opts(k);
  const crossCache = new Map();
  const crossOK = (c, d2, sym) => {
    const key = c + "|" + d2 + "|" + sym; if (crossCache.has(key)) return crossCache.get(key);
    const same = x => d2 === N || Math.floor(x / N) === Math.floor(c / N);
    const before = []; let x = c - d2; while (x >= 0 && same(x) && B[x]) { before.unshift(B[x].s); x -= d2; }
    const after = []; x = c + d2; while (x < N * N && same(x) && B[x]) { after.push(B[x].s); x += d2; }
    const v = !before.length && !after.length ? true : AM.check([...before, sym, ...after]).ok;
    crossCache.set(key, v); return v;
  };
  const hasCross = (c, d2) => { const same = x => d2 === N || Math.floor(x / N) === Math.floor(c / N); return (c - d2 >= 0 && same(c - d2) && B[c - d2]) || (c + d2 < N * N && same(c + d2) && B[c + d2]); };
  let stop = false;
  for (const dir of [1, N]) {
    const d2 = dir === 1 ? N : 1;
    for (let li = 0; li < N && !stop; li++) {
      const at = p => dir === 1 ? li * N + p : p * N + li;
      for (let p0 = 0; p0 < N && !stop; p0++) {
        if (B[at(p0)]) continue;
        for (let k = 1; k <= rack.length && !stop; k++) {
          const news = []; let p = p0;
          while (p < N && news.length < k) { if (!B[at(p)]) news.push(p); p++; }
          if (news.length < k) break;
          let end = news[k - 1]; while (end + 1 < N && B[at(end + 1)]) end++;
          let st = p0; while (st - 1 >= 0 && B[at(st - 1)]) st--;
          const L = end - st + 1; if (L < 3) continue;
          const cellsNew = news.map(at);
          if (first) { if (!cellsNew.includes(CENTER)) continue; }
          else if (!(L > k || cellsNew.some(c => hasCross(c, d2)))) continue;
          /* pattern */
          const pat = []; for (let q = st; q <= end; q++) { const c = at(q); pat.push(B[c] ? { fixed: B[c].s, c } : { c, cross: hasCross(c, d2) }); }
          const used = new Array(rack.length).fill(false), seq = [], fill = [];
          const rec = (pos, stt, run, zero, eq) => {
            if (Date.now() - t0 > budget) { stop = true; return; }
            if (pos === pat.length) {
              if ((stt === 2 || stt === 3) && eq > 0 && AM.check(seq).ok) {
                const pend = fill.map(f => ({ c: f.c, k: rack[f.r], s: f.s }));
                const ev = evaluate(B, pend, first);
                if (ev.ok) out.push({ pend: fill.map(f => ({ c: f.c, r: f.r, s: f.s })), total: ev.total, n: fill.length });
              }
              return;
            }
            const cell = pat[pos];
            const step = (s, r) => {
              let ns = -1, nr = 0, nz = false, ne = eq;
              if (s.length === 1 && s >= "0" && s <= "9") { if (stt === 0 || stt === 1 || stt === 4) { ns = 2; nr = 1; nz = s === "0"; } else if (stt === 2 && run < 3 && !(run === 1 && zero)) { ns = 2; nr = run + 1; nz = zero; } }
              else if (s.length === 2) { if (stt === 0 || stt === 1 || stt === 4) ns = 3; }
              else if (s === "=") { if (stt === 2 || stt === 3) { ns = 0; ne = eq + 1; } }
              else if (s === "-") { if (stt === 2 || stt === 3) ns = 4; else if (stt === 0) ns = 1; }
              else if (stt === 2 || stt === 3) ns = 4;
              if (ns < 0) return;
              seq.push(s); if (r >= 0) fill.push({ c: cell.c, r, s });
              rec(pos + 1, ns, nr, nz, ne);
              seq.pop(); if (r >= 0) fill.pop();
            };
            if (cell.fixed) { step(cell.fixed, -1); return; }
            const tried = new Set();
            for (let r = 0; r < rack.length && !stop; r++) {
              if (used[r] || tried.has(rack[r])) continue; tried.add(rack[r]);
              used[r] = true;
              for (const s of optsOf(rack[r])) { if (cell.cross && !crossOK(cell.c, d2, s)) continue; step(s, r); if (stop) break; }
              used[r] = false;
            }
          };
          rec(0, 0, 0, false, 0);
        }
      }
    }
  }
  /* unique by placement */
  const seen = new Set(), list = [];
  out.sort((a, b) => b.total - a.total);
  for (const m of out) { const key = m.pend.map(x => x.c + x.s).sort().join(","); if (!seen.has(key)) { seen.add(key); list.push(m); } }
  return { list, timedOut: stop, ms: Date.now() - t0 };
}
function pickMove(list, level) {
  if (!list.length) return null;
  if (level >= 3) return list[0];
  if (level === 2) { const i = Math.min(list.length - 1, Math.floor(list.length * (0.08 + Math.random() * 0.17))); return list[i]; }
  const short = list.filter(m => m.n <= 4); const pool = short.length ? short : list;
  return pool[Math.floor(pool.length * (0.4 + Math.random() * 0.6)) % pool.length];
}
function aiTurn() {
  if (!isAI(S.turn) || S.over) return;
  const budget = { 1: 1200, 2: 2000, 3: 3500 }[S.cfg.level] || 2000;
  const res = genMoves(1, budget), mv = pickMove(res.list, S.cfg.level);
  if (mv) {
    S.pending = mv.pend.map(x => ({ c: x.c, r: x.r, s: x.s })); renderBoard();
    tone(500, .06, .08);
    setTimeout(() => { if (S && isAI(S.turn) && !S.paused) commit(true); else if (S) { S.pending = []; renderBoard(); } }, 1100);
    return;
  }
  const rack = S.racks[1];
  if (S.bag.length >= 5) {
    let keepEq = false; const sel = []; rack.forEach((k, j) => { if (k === "=" && !keepEq) { keepEq = true; return; } if (k === "?") return; sel.push(j); });
    const outT = sel.map(j => rack[j]); S.racks[1] = rack.filter((_, j) => !sel.includes(j)); refill(1); S.bag.push(...outT); AM.shuffle(S.bag);
    logMove({ type: "exch", n: outT.length }); toast(`🤖 คอมเปลี่ยนเบี้ย ${outT.length} ตัว`); endTurn();
  } else {
    const prev = S.log[S.log.length - 1];
    logMove({ type: "pass" });
    toast(prev && prev.text === "ผ่าน" ? "🤖 คอมผ่านตา<br><small>ทั้งสองฝั่งลงต่อไม่ได้แล้ว กด ☰ → 🏁 จบเกม ได้เลย</small>" : "🤖 คอมผ่านตา", 4000);
    endTurn();
  }
}
function hint() {
  if (S.over || isAI(S.turn) || S.paused) return;
  msg("💡 กำลังหาสมการที่ดีที่สุดจากแป้นของคุณ…", "info");
  setTimeout(() => {
    const res = genMoves(0, 3000), mv = res.list[0];
    if (!mv) { msg("💡 แป้นนี้หาที่ลงไม่ได้เลย ลองเปลี่ยนเบี้ยหรือผ่านตา", "info"); return; }
    S.hintsUsed = (S.hintsUsed || 0) + 1;
    S.pending = mv.pend.map(x => ({ c: x.c, r: x.r, s: x.s })); S.sel = -1; renderBoard(); renderRack(); renderSide();
    msg(`💡 ลองแบบนี้ได้ <b>${mv.total}</b> คะแนน${res.list.length > 1 ? ` (หาได้ ${res.list.length}${res.timedOut ? "+" : ""} แบบ)` : ""} · กด ✔ ลงเบี้ย หรือ ↩ เก็บคืนแล้วคิดเอง`, "info");
  }, 60);
}

document.addEventListener("visibilitychange", () => { if (document.hidden && S) save(); else if (S && !S.over) keepAwake(); });

const g0 = loadGame();
if (g0 && !g0.over && location.hash !== "#new") { S = g0; play(); if (S.cfg.clock) pause(true); else if (isAI(S.turn)) scheduleAI(); }
else setup();
})();
