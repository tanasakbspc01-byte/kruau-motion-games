(() => {
"use strict";
const $ = s => document.querySelector(s);
const app = $("#app");
const LS = { get(k, d) { try { const v = JSON.parse(localStorage.getItem("kruau-kl-" + k)); return v == null ? d : v; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem("kruau-kl-" + k, JSON.stringify(v)); } catch (e) {} } };
const prefs = Object.assign({ lv: 2, n: 4, sec: 60, tsec: 30, tround: 1, sound: true }, LS.get("prefs", {}));
const savePrefs = () => LS.set("prefs", prefs);
let ac = null;
function tone(f, d = .1, v = .15) { if (!prefs.sound) return; try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; g.gain.setValueAtTime(v, ac.currentTime); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + d); o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + d); } catch (e) {} }
const yay = () => [523, 659, 784].forEach((f, k) => setTimeout(() => tone(f, .15), k * 90));
function toast(m, ms = 2200) { let t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); } t.innerHTML = m; t.classList.add("on"); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove("on"), ms); }
const fmtV = r => r[1] === 1 ? String(r[0]) : (r[0] / r[1]).toFixed(2).replace(/\.?0+$/, "") + ` <small>(${r[0]}/${r[1]})</small>`;
/* solver expression -> html */
const exHTML = e => { let h = e.replace(/(\d)√/g, "<sup>$1</sup>√").replace(/\^(\d+)/g, "<sup>$1</sup>"); let prev; do { prev = h; h = h.replace(/\^\(([^()]*)\)/g, "<sup>$1</sup>"); } while (h !== prev); return h; };
/* tokens -> html */
function tokHTML(tks) {
  let h = "", supDepth = 0, pendingSup = false;
  for (let i = 0; i < tks.length; i++) {
    const t = tks[i];
    if (t.t === "op" && t.v === "^") { pendingSup = true; h += `<sup class="cs">`; continue; }
    let s = t.t === "d" ? (tks[i + 1] && tks[i + 1].t === "nroot" ? `<sup>${t.v}</sup>` : String(t.v)) : t.t === "op" ? ` ${t.v} ` : t.t === "sqrt" ? "√" : t.t === "nroot" ? "√" : t.t;
    h += s;
    if (pendingSup) {
      if (t.t === "(") supDepth++;
      else if (t.t === ")") supDepth--;
      if (supDepth === 0 && (t.t === "d" || t.t === ")") && !(tks[i + 1] && tks[i + 1].t === "nroot")) { h += "</sup>"; pendingSup = false; }
    }
  }
  if (pendingSup) h += "</sup>";
  return h || `<span class="ph">แตะตัวเลขและเครื่องหมายเพื่อเขียนวิธีคิด</span>`;
}
let timer = null; const stopTimer = () => { if (timer) clearInterval(timer); timer = null; };
const LVL = { 1: "ป.1–3 (+ − × ÷ ยกกำลัง)", 2: "ป.4–6 (+ − × ÷ ยกกำลัง ถอดราก)" };

/* ======================= HOME ======================= */
function home() {
  stopTimer(); G = null;
  const st = LS.get("stats", { items: 0, exact: 0, best: 0 }), hist = LS.get("hist", []);
  app.className = "home";
  app.innerHTML = `
  <header class="top"><div class="logo"><b>4957</b><i>→ 88</i></div><div><h1>คิดเลขเร็ว สนามแข่ง</h1><p>สุ่มเลขโดดตามกติกาศิลปหัตถกรรม · ใช้ตัวเลขครบทุกตัว ให้ได้ผลลัพธ์ตรงหรือใกล้ที่สุด</p></div></header>
  <section class="card"><h3>ระดับ</h3>
    <div class="seg" id="lv">${[1, 2].map(v => `<button type="button" data-v="${v}" class="${prefs.lv === v ? "on" : ""}">${v === 1 ? "ป.1–3" : "ป.4–6"}</button>`).join("")}</div>
    <p class="hint">${LVL[prefs.lv]}</p></section>
  <section class="modes">
    <div class="mode m1"><b>🎯 ฝึกทีละข้อ</b><small>ตอบแล้วรู้ผลทันที พร้อมเฉลยวิธีที่ได้คำตอบตรง/ใกล้ที่สุด</small>
      <div class="mrow"><span>โจทย์</span><div class="seg sm" data-k="n">${[[4, "4 ตัว → 2 หลัก"], [5, "5 ตัว → 3 หลัก"]].map(([v, t]) => `<button type="button" data-v="${v}" class="${prefs.n === v ? "on" : ""}">${t}</button>`).join("")}</div></div>
      <div class="mrow"><span>เวลา</span><div class="seg sm" data-k="sec">${[[30, "30 วิ"], [60, "60 วิ"], [120, "2 นาที"], [0, "ไม่จับ"]].map(([v, t]) => `<button type="button" data-v="${v}" class="${prefs.sec === v ? "on" : ""}">${t}</button>`).join("")}</div></div>
      <button type="button" class="btn" id="goP">▶ เริ่มฝึก</button></div>
    <div class="mode m2"><b>🏟️ จำลองสอบ</b><small>เหมือนสนามจริง: ข้อละ 30 วินาที ไม่เฉลยระหว่างสอบ ดูผลตอนจบรอบ</small>
      <div class="mrow"><span>รอบ</span><div class="seg sm" data-k="tround">${[[1, "รอบ 1: 30 ข้อ (4 ตัว)"], [2, "รอบ 2: 20 ข้อ (5 ตัว)"], [3, "ลองสั้น 10 ข้อ"]].map(([v, t]) => `<button type="button" data-v="${v}" class="${prefs.tround === v ? "on" : ""}">${t}</button>`).join("")}</div></div>
      <div class="mrow"><span>เวลา/ข้อ</span><div class="seg sm" data-k="tsec">${[[30, "30 วิ (จริง)"], [45, "45 วิ"], [60, "60 วิ"]].map(([v, t]) => `<button type="button" data-v="${v}" class="${prefs.tsec === v ? "on" : ""}">${t}</button>`).join("")}</div></div>
      <button type="button" class="btn" id="goE">⏱️ เริ่มสอบ</button></div>
    <div class="mode m3"><b>📺 โหมดครู · สุ่มโจทย์ขึ้นจอ</b><small>ใช้แทน "โปรแกรมสุ่มตัวเลขพร้อมแสดงเวลา" ให้นักเรียนทั้งห้องเขียนคำตอบลงกระดาษ</small>
      <button type="button" class="btn" id="goT">📺 เปิดโหมดครู</button></div>
  </section>
  <section class="card stats"><div><b>${st.items}</b><small>ข้อที่ฝึก</small></div><div><b>${st.exact}</b><small>ได้ตรงเป๊ะ</small></div><div><b>${st.best}</b><small>เท่าคำตอบที่ดีที่สุด</small></div></section>
  ${hist.length ? `<section class="card"><h3>ประวัติจำลองสอบ</h3><table class="hist"><tr><th>วันที่</th><th>รอบ</th><th>ตรงเป๊ะ</th><th>ดีที่สุด</th></tr>${hist.slice(0, 6).map(h => `<tr><td>${new Date(h.at).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}</td><td>${h.name}</td><td>${h.exact}/${h.n}</td><td>${h.best}/${h.n}</td></tr>`).join("")}</table></section>` : ""}
  <details class="card rules"><summary>📘 กติกา (งานศิลปหัตถกรรมนักเรียน)</summary><ul>
    <li>รอบที่ 1: 30 ข้อ สุ่มเลขโดด 4 ตัว ผลลัพธ์ 2 หลัก · รอบที่ 2: 20 ข้อ สุ่มเลขโดด 5 ตัว ผลลัพธ์ 3 หลัก · ข้อละ 30 วินาที</li>
    <li>เลขโดดในโจทย์ซ้ำได้ไม่เกิน 2 ตัว และมีเลข 0 ได้ตัวเดียว</li>
    <li>ใช้ตัวเลขที่สุ่มได้ครบทุกตัว ตัวละ 1 ครั้ง ห้ามนำเลขมาต่อกันเป็นจำนวนหลายหลัก</li>
    <li>ป.1–3: บวก ลบ คูณ หาร ยกกำลัง · ป.4–6: เพิ่มการถอดรากที่ n (ต้องใส่อันดับที่ของรากจากตัวเลขที่สุ่ม ยกเว้นรากที่สอง) ถอดรากได้ชั้นเดียว</li>
    <li>คำตอบสุดท้ายต้องเป็นจำนวนนับเท่านั้น (ไม่เป็นเศษส่วน ไม่ติดลบ ไม่เป็น 0)</li>
    <li>ได้คะแนนเมื่อคำตอบตรงผลลัพธ์ ถ้าไม่มีใครตรง คำตอบที่ใกล้ที่สุดได้คะแนน</li></ul></details>`;
  app.querySelectorAll("#lv button").forEach(b => b.onclick = () => { prefs.lv = +b.dataset.v; savePrefs(); home(); });
  app.querySelectorAll(".seg[data-k]").forEach(sg => sg.querySelectorAll("button").forEach(b => b.onclick = () => { prefs[sg.dataset.k] = +b.dataset.v; savePrefs(); sg.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); }));
  $("#goP").onclick = () => start("practice"); $("#goE").onclick = () => start("exam"); $("#goT").onclick = teacher;
}

/* ======================= PLAY (practice + exam) ======================= */
let G = null;
function start(mode) {
  try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume && ac.resume(); } catch (e) {}
  const R = prefs.tround;
  G = mode === "practice" ? { mode, n: prefs.n, total: Infinity, sec: prefs.sec, i: 0, log: [] }
    : { mode, n: R === 2 ? 5 : 4, total: R === 1 ? 30 : R === 2 ? 20 : 10, sec: prefs.tsec, i: 0, log: [], name: R === 1 ? "รอบ 1" : R === 2 ? "รอบ 2" : "10 ข้อ" };
  G.allowRoot = prefs.lv === 2;
  next();
}
function next() {
  stopTimer();
  if (G.i >= G.total) return examResult();
  G.p = KL.problem(G.n); G.tk = []; G.used = new Set(); G.done = false; G.left = G.sec; G.i++;
  render();
  if (G.sec) timer = setInterval(() => {
    G.left--; const c = $("#clock"); if (c) { c.textContent = G.left; c.classList.toggle("low", G.left <= 5); }
    const bar = $("#tbar"); if (bar) bar.style.width = (100 * G.left / G.sec) + "%";
    if (G.left <= 5 && G.left > 0) tone(880, .05, .08);
    if (G.left <= 0) { stopTimer(); tone(330, .4); timeUp(); }
  }, 1000);
}
function render() {
  const p = G.p, rootKeys = G.allowRoot;
  app.className = "play";
  app.innerHTML = `
  <header class="bh"><button type="button" class="ib" id="hm">🏠</button><b class="tt">${G.mode === "practice" ? `🎯 ฝึก · ข้อ ${G.i}` : `🏟️ ${G.name} · ข้อ ${G.i}/${G.total}`}</b>${G.sec ? `<span class="clock" id="clock">${G.left}</span>` : ""}</header>
  ${G.sec ? `<div class="tb"><i id="tbar" style="width:100%"></i></div>` : ""}
  <div class="prob"><div class="pl">โจทย์ที่สุ่ม</div><div class="digits" id="digits"></div><div class="pl">ผลลัพธ์</div><div class="target">${p.target}</div></div>
  <div class="work"><div class="expr" id="expr"></div><div class="val" id="val"></div></div>
  <div class="keys">
    <div class="kr ops">${["+", "−", "×", "÷"].map(o => `<button type="button" class="k op" data-op="${o}">${o}</button>`).join("")}<button type="button" class="k op" data-op="^">x<sup>y</sup></button></div>
    <div class="kr ops"><button type="button" class="k" data-p="(">(</button><button type="button" class="k" data-p=")">)</button>${rootKeys ? `<button type="button" class="k" data-r="sqrt">√</button><button type="button" class="k" data-r="nroot"><sup>n</sup>√</button>` : ""}<button type="button" class="k del" id="bk">⌫</button></div>
    <div class="kr"><button type="button" class="k clr" id="clr">ล้าง</button><button type="button" class="k sub" id="sub">${G.mode === "practice" ? "✔ ส่งคำตอบ" : "✔ ส่ง / ข้อต่อไป"}</button></div>
  </div>
  ${rootKeys ? `<p class="tip">รากที่ n: แตะตัวเลขที่เป็นอันดับที่ก่อน แล้วแตะ <sup>n</sup>√ เช่น 3 <sup>n</sup>√ 8 = <sup>3</sup>√8 = 2</p>` : ""}
  <div id="fb"></div>`;
  $("#hm").onclick = () => { stopTimer(); if (G.mode === "exam" && G.log.length) { if (!confirm("ออกจากการสอบ? ผลจะไม่ถูกบันทึก")) { return; } } home(); };
  app.querySelectorAll("[data-op]").forEach(b => b.onclick = () => push({ t: "op", v: b.dataset.op }));
  app.querySelectorAll("[data-p]").forEach(b => b.onclick = () => push({ t: b.dataset.p }));
  app.querySelectorAll("[data-r]").forEach(b => b.onclick = () => push({ t: b.dataset.r }));
  $("#bk").onclick = () => { if (G.done) return; const t = G.tk.pop(); if (t && t.t === "d") G.used.delete(t.i); draw(); };
  $("#clr").onclick = () => { if (G.done) return; G.tk = []; G.used.clear(); draw(); };
  $("#sub").onclick = submit;
  draw();
}
function push(t) { if (G.done) return; if (G.tk.length > 40) return; G.tk.push(t); tone(620, .03, .06); draw(); }
function draw() {
  $("#digits").innerHTML = G.p.digits.map((d, i) => `<button type="button" class="dg ${G.used.has(i) ? "used" : ""}" data-i="${i}">${d}</button>`).join("");
  $("#digits").querySelectorAll(".dg").forEach(b => b.onclick = () => { const i = +b.dataset.i; if (G.done || G.used.has(i)) return; G.used.add(i); push({ t: "d", v: G.p.digits[i], i }); });
  $("#expr").innerHTML = tokHTML(G.tk);
  const r = G.tk.length ? KL.evalTokens(G.tk, G.allowRoot) : null, v = $("#val");
  if (!r) { v.innerHTML = ""; v.className = "val"; }
  else if (r.ok) { const d = Math.abs(KL.val(r.v) - G.p.target); v.className = "val " + (d === 0 ? "eq" : ""); v.innerHTML = `= <b>${fmtV(r.v)}</b>${d === 0 ? " 🎯 ตรงเป๊ะ!" : ` <small>(ห่าง ${+d.toFixed(2)})</small>`}${G.used.size < G.p.digits.length ? ` <em>ยังใช้ตัวเลขไม่ครบ</em>` : ""}${r.v[1] !== 1 || r.v[0] <= 0 ? ` <em>คำตอบต้องเป็นจำนวนนับ</em>` : ""}`; }
  else { v.className = "val wait"; v.textContent = r.msg; }
}
function judge() {
  const r = G.tk.length ? KL.evalTokens(G.tk, G.allowRoot) : { ok: false, msg: "ไม่ได้ตอบ" };
  const all = G.used.size === G.p.digits.length;
  if (r.ok && !all) return { ok: false, msg: "ต้องใช้ตัวเลขให้ครบทุกตัว" };
  if (r.ok && (r.v[1] !== 1 || r.v[0] <= 0)) return { ok: false, msg: `คำตอบต้องเป็นจำนวนนับ (ตอนนี้ได้ ${r.v[1] !== 1 ? KL.fmtR(r.v) : r.v[0]})` };
  return r;
}
function submit() {
  if (G.done) return;
  const r = judge();
  if (G.mode === "practice" && !r.ok) { toast("❌ " + r.msg); tone(220, .2); return; }
  finishItem(r);
}
function timeUp() { if (G.done) return; finishItem(judge(), true); }
function finishItem(r, timeout) {
  G.done = true; stopTimer();
  const sol = KL.solve(G.p.digits, G.p.target, G.allowRoot, 1500);
  const mine = r.ok ? Math.abs(KL.val(r.v) - G.p.target) : null;
  const exact = r.ok && mine === 0, asBest = r.ok && mine <= sol.dist + 1e-9;
  G.log.push({ p: G.p, expr: r.ok ? tokHTML(G.tk) : null, v: r.ok ? r.v : null, mine, best: sol.best ? sol.best.e : null, bestV: sol.best ? sol.best.r : null, dist: sol.dist, exact, asBest, msg: r.ok ? "" : r.msg });
  if (G.mode === "practice") {
    const st = LS.get("stats", { items: 0, exact: 0, best: 0 }); st.items++; if (exact) st.exact++; if (asBest) st.best++; LS.set("stats", st);
    if (exact) yay(); else if (asBest) tone(660, .2); else tone(300, .25);
    const fb = $("#fb");
    fb.innerHTML = `<div class="res ${exact ? "good" : asBest ? "ok" : "bad"}">
      <h3>${timeout && !r.ok ? "⏰ หมดเวลา" : exact ? "🎯 ตรงเป๊ะ! เก่งมาก" : asBest ? "👍 ใกล้ที่สุดเท่าที่ทำได้แล้ว!" : r.ok ? `ได้ ${fmtV(r.v)} ห่าง ${+mine.toFixed(2)}` : "❌ " + r.msg}</h3>
      ${sol.best ? `<p>${sol.dist === 0 ? "✅ วิธีที่ได้ผลลัพธ์ตรง" : `ไม่มีวิธีที่ได้ ${G.p.target} พอดี · ใกล้ที่สุดคือ`}: <b class="sx">${exHTML(sol.best.e)} = ${fmtV(sol.best.r)}</b></p>` : ""}
      ${sol.exact.length > 1 ? `<p class="muted">วิธีอื่น: ${sol.exact.slice(1).map(x => exHTML(x.e)).join(" · ")}</p>` : ""}
      <button type="button" class="btn" id="nx">ข้อต่อไป ▶</button></div>`;
    $("#nx").onclick = next; fb.scrollIntoView({ behavior: "smooth", block: "nearest" });
    app.querySelectorAll(".keys button").forEach(b => b.disabled = true);
  } else {
    if (timeout) toast("⏰ หมดเวลา ข้อต่อไป", 1200);
    setTimeout(next, timeout ? 900 : 150);
  }
}
function examResult() {
  stopTimer();
  const L = G.log, ex = L.filter(x => x.exact).length, be = L.filter(x => x.asBest).length;
  const hist = LS.get("hist", []); hist.unshift({ at: Date.now(), name: G.name, n: L.length, exact: ex, best: be }); LS.set("hist", hist.slice(0, 30));
  app.className = "home";
  app.innerHTML = `<section class="card resx"><div class="cele">${be >= L.length * .8 ? "🏆" : be >= L.length * .5 ? "🎉" : "💪"}</div><h2>ผลจำลองสอบ · ${G.name}</h2>
    <div class="sum"><div><b>${ex}</b><small>ตรงเป๊ะ</small></div><div><b>${be}</b><small>เท่าคำตอบที่ดีที่สุด<br>(ได้คะแนนแน่นอน)</small></div><div><b>${L.length}</b><small>ข้อทั้งหมด</small></div></div>
    <p class="muted">ในสนามจริง ถ้าไม่มีใครได้ตรง คำตอบที่ใกล้ที่สุดได้คะแนน ข้อที่ "เท่าคำตอบที่ดีที่สุด" จึงได้คะแนนแน่นอน</p>
    <table class="lg"><tr><th>ข้อ</th><th>โจทย์</th><th>ของฉัน</th><th>เฉลย</th></tr>${L.map((x, k) => `<tr class="${x.exact ? "g" : x.asBest ? "o" : "b"}"><td>${k + 1}</td><td><b>${x.p.digits.join(" ")}</b><br>→ ${x.p.target}</td><td>${x.expr ? `${x.expr} = ${fmtV(x.v)}` : `<i>${x.msg}</i>`}</td><td>${x.best ? `${exHTML(x.best)} = ${fmtV(x.bestV)}` : "–"}</td></tr>`).join("")}</table>
    <div class="row"><button type="button" class="btn" id="again">🔁 สอบอีกรอบ</button><button type="button" class="btn ghost" id="hm2">🏠 หน้าแรก</button></div></section>`;
  if (be >= L.length * .8) yay();
  $("#again").onclick = () => start("exam"); $("#hm2").onclick = home;
}

/* ======================= TEACHER (projector) ======================= */
let T = null;
function teacher() {
  stopTimer();
  T = T || { n: 4, sec: 30, i: 0, lv: prefs.lv, p: null, left: 0, run: false, show: false };
  app.className = "teach";
  const draw = () => {
    app.innerHTML = `
    <div class="tbar"><button type="button" class="ib" id="hm">🏠</button>
      <div class="seg sm" id="tn">${[[4, "4 ตัว · ผล 2 หลัก"], [5, "5 ตัว · ผล 3 หลัก"]].map(([v, t]) => `<button type="button" data-v="${v}" class="${T.n === v ? "on" : ""}">${t}</button>`).join("")}</div>
      <div class="seg sm" id="ts">${[30, 45, 60].map(v => `<button type="button" data-v="${v}" class="${T.sec === v ? "on" : ""}">${v} วิ</button>`).join("")}</div>
      <div class="seg sm" id="tl">${[1, 2].map(v => `<button type="button" data-v="${v}" class="${T.lv === v ? "on" : ""}">${v === 1 ? "ป.1–3" : "ป.4–6"}</button>`).join("")}</div></div>
    <div class="tmain">
      <div class="tno">${T.p ? `ข้อที่ ${T.i}` : "กด ▶ สุ่มโจทย์"}</div>
      <div class="tlbl">โจทย์ที่สุ่ม</div><div class="tdig">${T.p ? T.p.digits.join("") : "– – – –"}</div>
      <div class="tlbl">ผลลัพธ์</div><div class="ttg">${T.p ? T.p.target : "– –"}</div>
      <div class="tclock ${T.left <= 5 && T.run ? "low" : ""}" id="tc">${T.p ? T.left : ""}</div>
      <div class="tsol" id="tsol">${T.show && T.sol ? (T.sol.best ? `${T.sol.dist === 0 ? "✅" : `ใกล้ที่สุด (ห่าง ${+T.sol.dist.toFixed(2)})`} ${exHTML(T.sol.best.e)} = ${fmtV(T.sol.best.r)}` : "") : ""}</div>
    </div>
    <div class="tctl"><button type="button" class="btn big" id="tgo">${T.p ? "▶ ข้อต่อไป" : "▶ สุ่มโจทย์"}</button>${T.p ? `<button type="button" class="btn ghost" id="tsl">${T.show ? "ซ่อนเฉลย" : "👀 เฉลย"}</button><button type="button" class="btn ghost" id="tps">${T.run ? "⏸ หยุดเวลา" : "▶ เดินเวลา"}</button>` : ""}<button type="button" class="btn ghost" id="trs">รีเซ็ตข้อ</button></div>`;
    $("#hm").onclick = () => { stopTimer(); home(); };
    const bind = (id, k) => app.querySelectorAll(`#${id} button`).forEach(b => b.onclick = () => { T[k] = +b.dataset.v; draw(); });
    bind("tn", "n"); bind("ts", "sec"); bind("tl", "lv");
    $("#tgo").onclick = () => { T.i++; T.p = KL.problem(T.n); T.sol = null; T.show = false; T.left = T.sec; T.run = true; tone(660, .1); run(); draw(); };
    if ($("#tsl")) $("#tsl").onclick = () => { if (!T.sol) T.sol = KL.solve(T.p.digits, T.p.target, T.lv === 2, 2000); T.show = !T.show; draw(); };
    if ($("#tps")) $("#tps").onclick = () => { T.run = !T.run; if (T.run) run(); else stopTimer(); draw(); };
    $("#trs").onclick = () => { T.i = 0; T.p = null; T.run = false; stopTimer(); draw(); };
  };
  const run = () => { stopTimer(); timer = setInterval(() => { if (!T.run) return; T.left--; const c = $("#tc"); if (c) { c.textContent = Math.max(0, T.left); c.classList.toggle("low", T.left <= 5); } if (T.left <= 5 && T.left > 0) tone(880, .06, .1); if (T.left <= 0) { T.run = false; stopTimer(); tone(330, .6, .2); const c2 = $("#tc"); if (c2) c2.textContent = "หมดเวลา"; const ps = $("#tps"); if (ps) ps.textContent = "▶ เดินเวลา"; } }, 1000); };
  draw();
}

document.addEventListener("keydown", e => {
  if (app.className === "teach" && (e.key === " " || e.key === "Enter")) { e.preventDefault(); const b = $("#tgo"); b && b.click(); return; }
  if (!G || G.done || app.className !== "play") return;
  const k = e.key;
  if (/^[0-9]$/.test(k)) { const i = G.p.digits.findIndex((d, j) => d === +k && !G.used.has(j)); if (i >= 0) { G.used.add(i); push({ t: "d", v: +k, i }); } }
  else if ({ "+": 1, "-": 1, "*": 1, "/": 1, "^": 1 }[k]) push({ t: "op", v: { "+": "+", "-": "−", "*": "×", "/": "÷", "^": "^" }[k] });
  else if (k === "(" || k === ")") push({ t: k });
  else if (k === "Backspace") $("#bk").click();
  else if (k === "Enter") { e.preventDefault(); submit(); }
});
home();
})();
