(() => {
"use strict";
const $ = s => document.querySelector(s);
const app = $("#app");
const CLOCK_URL = "../amath-clock/";
const LS = { get(k, d) { try { const v = JSON.parse(localStorage.getItem("kruau-amath-" + k)); return v == null ? d : v; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem("kruau-amath-" + k, JSON.stringify(v)); } catch (e) {} } };
const prefs = Object.assign({ racks: 10, sec: 90, sound: true }, LS.get("prefs", {}));
const stats = Object.assign({ racks: 0, eqs: 0, bingos: 0, bestTimed: 0 }, LS.get("stats", {}));
const saveStats = () => LS.set("stats", stats);
let ac = null;
function tone(f, d = .1, v = .15) { if (!prefs.sound) return; try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; g.gain.setValueAtTime(v, ac.currentTime); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + d); o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + d); } catch (e) {} }
const yay = () => [523, 659, 784].forEach((f, k) => setTimeout(() => tone(f, .15), k * 90));
const bingoSnd = () => [523, 659, 784, 1047, 1319].forEach((f, k) => setTimeout(() => tone(f, .2), k * 100));
function toast(m, ms = 2200) { let t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); } t.innerHTML = m; t.classList.add("on"); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove("on"), ms); }
const show = s => s === "-" ? "−" : s;
const eqText = syms => syms.map((x, k) => show(x) + ((x === "-" && (k === 0 || syms[k - 1] === "=")) ? "\u0001" : "")).join(" ").replace(/\u0001 /g, "").replace(/(\d) (?=\d)/g, "$1");
function tileHTML(k, cls = "", extra = "", sym) {
  const face = sym != null ? show(sym) : k === "?" ? "" : k === "+/-" ? "+/−" : show(k);
  return `<button type="button" class="tile ${cls} ${k === "?" ? "blank" : ""} ${face.length > 2 ? "sm" : ""}" ${extra}><span>${face}</span><i>${AM.PTS[k]}</i></button>`;
}

/* ======================= HOME ======================= */
let timer = null; const stopTimer = () => { if (timer) clearInterval(timer); timer = null; };
function home() {
  stopTimer(); G = null;
  app.className = "home";
  app.innerHTML = `
  <header class="top"><div class="logo"><span>A</span><i>=</i></div><div><h1>ฝึกต่อสมการ เอแม็ท</h1><p>ชุดเบี้ยรุ่นประถม 70 ตัว · ฝึกมองแป้น 8 ตัว แล้วต่อให้เป็นสมการให้ไว</p></div></header>
  <section class="modes">
    <button type="button" class="mode m1" data-m="free"><b>🎯 ฝึกอิสระ</b><small>หาสมการจากแป้นให้ได้มากที่สุด ไม่จับเวลา มีใบ้และเฉลย</small></button>
    <button type="button" class="mode m2" data-m="timed"><b>⏱️ จับเวลาเหมือนตาจริง</b><small>${prefs.racks} แป้น · แป้นละ ${prefs.sec} วินาที · เก็บสมการคะแนนสูงสุดของแต่ละแป้น</small></button>
    <button type="button" class="mode m3" data-m="bingo"><b>🌟 ล่าบิงโก</b><small>แป้นที่ใช้ครบ 8 ตัวได้แน่นอน หาให้เจอ! (+40 คะแนน)</small></button>
  </section>
  <section class="card"><h3>⏱️ ตั้งค่าโหมดจับเวลา</h3>
    <div class="two"><div><p class="lb">จำนวนแป้น</p><div class="seg" data-k="racks">${[5, 10, 15].map(v => `<button type="button" data-v="${v}" class="${prefs.racks === v ? "on" : ""}">${v}</button>`).join("")}</div></div>
    <div><p class="lb">เวลาต่อแป้น</p><div class="seg" data-k="sec">${[60, 90, 120, 180].map(v => `<button type="button" data-v="${v}" class="${prefs.sec === v ? "on" : ""}">${v} วิ</button>`).join("")}</div></div></div>
    <label class="tg"><input type="checkbox" id="snd" ${prefs.sound ? "checked" : ""}> เสียง</label></section>
  <section class="card stats"><div><b>${stats.racks}</b><small>แป้นที่ฝึก</small></div><div><b>${stats.eqs}</b><small>สมการที่ต่อได้</small></div><div><b>${stats.bingos}</b><small>บิงโก</small></div><div><b>${stats.bestTimed}%</b><small>สถิติจับเวลา</small></div></section>
  <details class="card rules"><summary>📘 กติกาการต่อสมการที่ใช้ในเกมนี้</summary><ul>
    <li>ต้องมีเครื่องหมาย <b>=</b> อย่างน้อย 1 ตัว (มีหลายตัวได้ เช่น 2+4=6=3×2)</li>
    <li>คิด × ÷ ก่อน + − ตามหลักคณิตศาสตร์</li>
    <li>ต่อเลขโดดได้ไม่เกิน 3 หลัก และเลข 0 ห้ามอยู่หน้า (เช่น 05 ไม่ได้)</li>
    <li>เบี้ย 2 หลัก (10–20) ห้ามต่อกับตัวเลขอื่น</li>
    <li>ใช้เครื่องหมายลบนำหน้าจำนวนได้ที่ต้นสมการหรือหลัง = (เช่น 3−5=−2) แต่ห้าม −0</li>
    <li>ผลหารเป็นเศษส่วนได้ (เช่น 1÷2=2÷4)</li>
    <li>เบี้ย +/− และ ×/÷ เลือกใช้ได้อย่างใดอย่างหนึ่ง · เบี้ยว่าง (BLANK) แทนได้ทุกตัว แต่ได้ 0 คะแนน</li>
    <li>คะแนน = ผลรวมแต้มเบี้ย (ยังไม่คิดช่องพิเศษบนกระดาน) · ใช้ครบ 8 ตัว <b>+40 บิงโก</b></li></ul></details>
  <a class="clocklink board" href="../amath-board/">⚔️ เล่นเอแม็ทเต็มกระดาน 2 ฝั่ง</a>
  <a class="clocklink" href="${CLOCK_URL}">⏱️ เปิดนาฬิกาเอแม็ท (สำหรับแข่งบนกระดานจริง)</a>`;
  app.querySelectorAll(".mode").forEach(b => b.onclick = () => start(b.dataset.m));
  app.querySelectorAll(".seg").forEach(s => s.querySelectorAll("button").forEach(b => b.onclick = () => { prefs[s.dataset.k] = +b.dataset.v; LS.set("prefs", prefs); home(); }));
  $("#snd").onchange = e => { prefs.sound = e.target.checked; LS.set("prefs", prefs); };
}

/* ======================= GAME ======================= */
let G = null;
function start(mode) {
  try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume && ac.resume(); } catch (e) {}
  G = { mode, round: 0, total: mode === "timed" ? prefs.racks : Infinity, sum: 0, max: 0, log: [] };
  nextRack();
}
function genRack() {
  if (G.mode === "bingo") { const b = AM.makeBingo(); const sol = AM.solve(b.tiles, { maxMs: 1500 }); return { tiles: b.tiles, sol }; }
  for (let t = 0; t < 30; t++) {
    const tiles = AM.drawRack(); const sol = AM.solve(tiles, { maxMs: 1200 });
    if (sol.list.some(x => x.syms.length >= 5)) return { tiles, sol };
  }
  const tiles = AM.drawRack(); return { tiles, sol: AM.solve(tiles, { maxMs: 1200 }) };
}
function nextRack() {
  stopTimer();
  if (G.round >= G.total) return summary();
  app.className = "home"; app.innerHTML = `<div class="loading"><div class="spin"></div><p>กำลังสุ่มเบี้ย…</p></div>`;
  setTimeout(() => {
    const r = genRack();
    Object.assign(G, { tiles: r.tiles, sol: r.sol, placed: [], found: [], best: null, hint: 0, revealed: false, left: prefs.sec, t0: Date.now() });
    G.round++; stats.racks++; saveStats();
    render();
    if (G.mode === "timed") timer = setInterval(() => { G.left--; const c = $("#clock"); if (c) { c.textContent = G.left; c.classList.toggle("low", G.left <= 10); } if (G.left <= 10 && G.left > 0) tone(880, .05, .08); if (G.left <= 0) { stopTimer(); tone(330, .4); reveal(); } }, 1000);
  }, 30);
}
const maxScore = () => G.sol.list.length ? G.sol.list[0].score : 0;
function render() {
  const title = { free: "🎯 ฝึกอิสระ", timed: `⏱️ แป้นที่ ${G.round}/${G.total}`, bingo: "🌟 ล่าบิงโก" }[G.mode];
  app.className = "play";
  app.innerHTML = `
  <header class="bh"><button type="button" class="ib" id="hm">🏠</button><b class="tt">${title}</b>${G.mode === "timed" ? `<span class="clock" id="clock">${G.left}</span>` : `<span class="pill">${G.mode === "bingo" ? "ใช้ครบ 8 ตัว" : `แป้นที่ ${G.round}`}</span>`}</header>
  <div class="eqbox"><div class="eqrow" id="eq"></div><div class="eqmsg" id="msg">แตะเบี้ยในแป้นเพื่อวางเรียงเป็นสมการ</div></div>
  <div class="ctl"><button type="button" class="cb" id="back">⌫ ถอย</button><button type="button" class="cb" id="clr">✕ ล้าง</button><button type="button" class="cb ok" id="chk">✔ ตรวจสมการ</button></div>
  <div class="rack" id="rack"></div>
  <div class="ctl2">
    <button type="button" class="cb" id="shuf">🔀 สลับแป้น</button>
    ${G.mode !== "timed" ? `<button type="button" class="cb" id="hint">💡 ใบ้</button>` : ""}
    <button type="button" class="cb warn" id="rev">${G.mode === "timed" ? "📤 ส่งแป้นนี้" : "👀 เฉลย"}</button>
  </div>
  <div class="found" id="found"></div>
  <div class="pop" id="pop" hidden></div>`;
  $("#hm").onclick = () => { stopTimer(); home(); };
  $("#back").onclick = () => { G.placed.pop(); draw(); };
  $("#clr").onclick = () => { G.placed = []; draw(); };
  $("#chk").onclick = submit;
  $("#shuf").onclick = () => { const order = AM.shuffle([...G.tiles.keys()]); G.view = order; draw(); };
  if ($("#hint")) $("#hint").onclick = hint;
  $("#rev").onclick = () => { stopTimer(); reveal(); };
  G.view = G.view && G.view.length === G.tiles.length ? G.view : [...G.tiles.keys()];
  draw();
}
function draw() {
  const used = new Set(G.placed.map(p => p.i));
  $("#rack").innerHTML = G.view.map(i => tileHTML(G.tiles[i], used.has(i) ? "used" : (G.hl && G.hl.has(i) ? "hl" : ""), `data-i="${i}"`)).join("");
  $("#eq").innerHTML = G.placed.length ? G.placed.map((p, k) => tileHTML(G.tiles[p.i], "inrow", `data-k="${k}"`, p.s)).join("") : `<span class="ph">ㅤ</span>`;
  $("#rack").querySelectorAll(".tile").forEach(t => t.onclick = () => place(+t.dataset.i, t));
  $("#eq").querySelectorAll(".tile").forEach(t => t.onclick = () => editPlaced(+t.dataset.k, t));
  $("#found").innerHTML = G.found.length ? `<h4>สมการที่ต่อได้ (${G.found.length})${G.best ? ` · ดีที่สุด <b>${G.best.score}</b> คะแนน` : ""}</h4>${G.found.map(f => `<span class="fq ${f.syms.length === 8 ? "bg" : ""}">${eqText(f.syms)} <em>${f.score}</em></span>`).join("")}` : "";
  const m = $("#msg"); if (m && !G.placed.length) { m.className = "eqmsg"; m.textContent = "แตะเบี้ยในแป้นเพื่อวางเรียงเป็นสมการ"; }
}
function place(i, el) {
  if (G.revealed || G.placed.some(p => p.i === i)) return;
  const k = G.tiles[i], o = AM.opts(k);
  tone(600, .04, .08);
  if (o.length === 1) { G.placed.push({ i, s: o[0] }); draw(); return; }
  choose(k, null, s => { G.placed.push({ i, s }); draw(); });
}
function editPlaced(k, el) {
  if (G.revealed) return;
  const p = G.placed[k], kind = G.tiles[p.i];
  if (AM.opts(kind).length === 1) { G.placed.splice(k, 1); draw(); return; }
  choose(kind, p.s, s => { if (s === null) G.placed.splice(k, 1); else p.s = s; draw(); }, true);
}
function choose(kind, cur, cb, canRemove) {
  const pop = $("#pop"), o = AM.opts(kind);
  pop.hidden = false;
  pop.innerHTML = `<div class="psheet"><p>${kind === "?" ? "เบี้ยว่าง (BLANK) จะแทนตัวไหน?" : kind === "+/-" ? "ใช้เป็น + หรือ − ?" : "ใช้เป็น × หรือ ÷ ?"}</p>
    <div class="pg ${kind === "?" ? "many" : ""}">${o.map(s => `<button type="button" data-s="${s}" class="${s === cur ? "on" : ""}">${show(s)}</button>`).join("")}</div>
    <div class="row">${canRemove ? `<button type="button" class="cb" id="prm">↩ เอาออกจากสมการ</button>` : ""}<button type="button" class="cb" id="pcl">ยกเลิก</button></div></div>`;
  pop.querySelectorAll(".pg button").forEach(b => b.onclick = () => { pop.hidden = true; cb(b.dataset.s); });
  if ($("#prm")) $("#prm").onclick = () => { pop.hidden = true; cb(null); };
  $("#pcl").onclick = () => { pop.hidden = true; };
  pop.onclick = e => { if (e.target === pop) pop.hidden = true; };
}
function submit() {
  if (G.revealed) return;
  const syms = G.placed.map(p => p.s), m = $("#msg");
  if (syms.length < 3) { m.className = "eqmsg bad"; m.textContent = "สมการต้องใช้เบี้ยอย่างน้อย 3 ตัว"; tone(220, .2); return; }
  if (G.mode === "bingo" && syms.length < 8) { m.className = "eqmsg bad"; m.textContent = `โหมดบิงโกต้องใช้ครบ 8 ตัว (ตอนนี้ ${syms.length} ตัว)`; tone(220, .2); return; }
  const r = AM.check(syms);
  if (!r.ok) { m.className = "eqmsg bad"; m.textContent = "❌ " + r.msg; tone(220, .2); return; }
  const key = syms.join(" ");
  if (G.found.some(f => f.key === key)) { m.className = "eqmsg"; m.textContent = "สมการนี้ต่อไปแล้ว ลองแบบอื่น"; return; }
  const sc = AM.score(G.placed.map(p => G.tiles[p.i]));
  const f = { key, syms, score: sc }; G.found.push(f); stats.eqs++;
  if (!G.best || sc > G.best.score) G.best = f;
  if (syms.length === 8) { stats.bingos++; bingoSnd(); toast(`🌟 บิงโก! +40 · ได้ ${sc} คะแนน`); } else { yay(); }
  saveStats();
  G.placed = []; draw();
  m.className = "eqmsg good"; m.textContent = `✅ ถูกต้อง! ${eqText(syms)} ได้ ${sc} คะแนน${sc === maxScore() ? " — สูงสุดของแป้นนี้แล้ว! 🏆" : ""}`;
  if (G.mode === "bingo" && syms.length === 8) setTimeout(() => { if (G && !G.revealed) reveal(); }, 900);
}
function hint() {
  const L = G.sol.list, bingos = L.filter(x => x.syms.length === 8);
  G.hint++;
  const m = $("#msg"); m.className = "eqmsg info";
  if (G.hint === 1) m.innerHTML = `💡 แป้นนี้ต่อได้ <b>${L.length}${G.sol.partial ? "+" : ""}</b> สมการ · ${bingos.length ? `<b>มีบิงโก ${bingos.length} แบบ</b>` : "ไม่มีบิงโก"} · คะแนนสูงสุด <b>${maxScore()}</b>`;
  else {
    const target = G.mode === "bingo" && bingos.length ? bingos[0] : L[0];
    if (!target) { m.textContent = "แป้นนี้ไม่มีสมการ"; return; }
    if (G.hint === 2) { G.hl = new Set(target.tiles); draw(); m.innerHTML = "💡 เบี้ยที่ไฮไลต์สีเหลือง ใช้ต่อสมการคะแนนสูงสุดได้"; }
    else m.innerHTML = `💡 สมการเริ่มด้วย <b>${eqText(target.syms.slice(0, Math.min(3, target.syms.length - 1)))} …</b>`;
  }
}
function reveal() {
  if (G.revealed) return; G.revealed = true; stopTimer();
  const L = G.sol.list, mx = maxScore(), my = G.best ? G.best.score : 0;
  const bingos = L.filter(x => x.syms.length === 8);
  if (G.mode === "timed") { G.sum += my; G.max += mx; }
  G.log.push({ tiles: G.tiles, my, mx, best: G.best && G.best.syms, top: L[0] && L[0].syms });
  const top = L.slice(0, 8);
  const rv = document.createElement("div"); rv.className = "reveal";
  rv.innerHTML = `<h3>${G.mode === "timed" ? (G.left <= 0 ? "⏰ หมดเวลา!" : "📤 ส่งแล้ว") : "👀 เฉลยแป้นนี้"}</h3>
    <div class="rsum"><div><small>ของฉัน</small><b>${my}</b></div><div><small>สูงสุดที่ทำได้</small><b>${mx}</b></div><div><small>สมการทั้งหมด</small><b>${L.length}${G.sol.partial ? "+" : ""}</b></div></div>
    ${bingos.length ? `<p class="bn">🌟 แป้นนี้มีบิงโก ${bingos.length} แบบ เช่น <b>${eqText(bingos[0].syms)}</b>${bingos[1] ? ` · <b>${eqText(bingos[1].syms)}</b>` : ""}</p>` : `<p class="muted">แป้นนี้ไม่มีบิงโก (ใช้ครบ 8 ตัวไม่ได้)</p>`}
    <h4>สมการคะแนนสูง</h4><ol class="tops">${top.map(x => `<li><span>${eqText(x.syms)}</span><em>${x.score}</em></li>`).join("")}</ol>
    <div class="row"><button type="button" class="btn" id="nx">${G.round >= G.total ? "ดูสรุป 🏁" : "แป้นต่อไป ▶"}</button>${G.mode !== "timed" ? `<button type="button" class="btn ghost" id="hm2">🏠 หน้าแรก</button>` : ""}</div>`;
  app.appendChild(rv);
  ["#chk", "#back", "#clr", "#hint", "#rev", "#shuf"].forEach(s => { const b = $(s); if (b) b.disabled = true; });
  rv.scrollIntoView({ behavior: "smooth", block: "start" });
  $("#nx").onclick = nextRack;
  if ($("#hm2")) $("#hm2").onclick = home;
}
function summary() {
  stopTimer();
  const pct = G.max ? Math.round(100 * G.sum / G.max) : 0;
  if (pct > stats.bestTimed) { stats.bestTimed = pct; saveStats(); }
  app.className = "home";
  app.innerHTML = `<section class="card res"><div class="cele">${pct >= 80 ? "🏆" : pct >= 50 ? "🎉" : "💪"}</div><h2>สรุปโหมดจับเวลา</h2>
    <p class="big">${G.sum} / ${G.max} คะแนน</p><p>ทำได้ <b>${pct}%</b> ของคะแนนสูงสุดที่เป็นไปได้ · สถิติดีที่สุด ${stats.bestTimed}%</p>
    <table class="lg"><tr><th>แป้น</th><th>สมการของฉัน</th><th>ได้</th><th>สูงสุด</th></tr>${G.log.map((l, k) => `<tr><td>${k + 1}</td><td>${l.best ? eqText(l.best) : "–"}<br><small>เฉลย: ${l.top ? eqText(l.top) : "–"}</small></td><td>${l.my}</td><td>${l.mx}</td></tr>`).join("")}</table>
    <div class="row"><button type="button" class="btn" id="again">🔁 เล่นอีกรอบ</button><button type="button" class="btn ghost" id="hm">🏠 หน้าแรก</button></div></section>`;
  if (pct >= 80) bingoSnd();
  $("#again").onclick = () => start("timed"); $("#hm").onclick = home;
}
document.addEventListener("keydown", e => {
  if (!G || G.revealed || !$("#rack")) return;
  if (e.key === "Enter") { e.preventDefault(); submit(); }
  else if (e.key === "Backspace") { e.preventDefault(); G.placed.pop(); draw(); }
});
home();
})();
