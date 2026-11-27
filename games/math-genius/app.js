(() => {
"use strict";
const $ = s => document.querySelector(s);
const app = $("#app");
const LS = { get(k, d) { try { const v = JSON.parse(localStorage.getItem("kruau-genius-" + k)); return v == null ? d : v; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem("kruau-genius-" + k, JSON.stringify(v)); } catch (e) {} }, del(k) { try { localStorage.removeItem("kruau-genius-" + k); } catch (e) {} } };
const prefs = Object.assign({ lv: 2, min: 120, sound: true }, LS.get("prefs", {}));
const savePrefs = () => LS.set("prefs", prefs);
const LVN = { 1: "ป.1–3", 2: "ป.4–6" };
const PTS = { 1: 1, 2: 2, 3: 5 };
const PARTN = { 1: "ตอนที่ 1 · ปรนัย 4 ตัวเลือก", 2: "ตอนที่ 2 · คิดเลขเร็วและคำนวณ", 3: "ตอนที่ 3 · โจทย์ปัญหา" };
let ac = null;
function tone(f, d = .1, v = .14) { if (!prefs.sound) return; try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; g.gain.setValueAtTime(v, ac.currentTime); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + d); o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + d); } catch (e) {} }
const yay = () => [523, 659, 784].forEach((f, k) => setTimeout(() => tone(f, .15), k * 90));
function toast(m, ms = 2200) { let t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); } t.innerHTML = m; t.classList.add("on"); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove("on"), ms); }
function modal(html) { const m = document.createElement("div"); m.className = "modal"; m.innerHTML = `<div class="sheet">${html}</div>`; document.body.appendChild(m); return m; }
function ask(t, msg, yes, fn) { const m = modal(`<h3>${t}</h3><p>${msg}</p><div class="row"><button type="button" class="btn danger" id="aY">${yes}</button><button type="button" class="btn ghost" id="aN">ไม่ใช่</button></div>`); m.querySelector("#aY").onclick = () => { m.remove(); fn(); }; m.querySelector("#aN").onclick = () => m.remove(); }
const fmt = s => { s = Math.max(0, Math.floor(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ":" : "") + String(m).padStart(h ? 2 : 1, "0") + ":" + String(x).padStart(2, "0"); };
const medal = p => p >= 80 ? ["🥇", "เหรียญทอง"] : p >= 70 ? ["🥈", "เหรียญเงิน"] : p >= 60 ? ["🥉", "เหรียญทองแดง"] : ["📜", "เกียรติบัตร"];
const ansShow = q => q.ansH || q.ans;
let timer = null; const stopTimer = () => { if (timer) clearInterval(timer); timer = null; };

/* ======================= HOME ======================= */
function home() {
  stopTimer();
  const ex = LS.get("exam", null), hist = LS.get("hist", []), st = LS.get("stats", {});
  const left = ex && !ex.done ? ex.dur - (Date.now() - ex.start) / 1000 : 0;
  const T = QG.topics(prefs.lv);
  const chip = (p, t) => { const s = st[prefs.lv + ":" + t] || { n: 0, c: 0 }; return `<button type="button" class="chip" data-p="${p}" data-t="${t}">${t}${s.n ? ` <em>${s.c}/${s.n}</em>` : ""}</button>`; };
  app.className = "home";
  app.innerHTML = `
  <header class="top"><div class="logo">🧠</div><div><h1>อัจฉริยภาพทางคณิตศาสตร์</h1><p>ข้อสอบจำลองตามเกณฑ์งานศิลปหัตถกรรม · สุ่มโจทย์ใหม่ทุกครั้ง · มีเฉลยวิธีคิดทุกข้อ</p></div></header>
  ${ex && !ex.done && left > 0 ? `<div class="rrow"><button type="button" class="resume" id="resume">▶ ทำข้อสอบต่อ · ${LVN[ex.lv]} · เหลือเวลา ${fmt(left)}</button><button type="button" class="rx" id="cx">✕<span>ยกเลิก</span></button></div>` : ""}
  <section class="card"><h3>ระดับ</h3><div class="seg" id="lv">${[1, 2].map(v => `<button type="button" data-v="${v}" class="${prefs.lv === v ? "on" : ""}">${LVN[v]}</button>`).join("")}</div></section>
  <section class="mode m1"><b>🏆 ข้อสอบจำลองเต็มชุด</b><small>3 ตอน 40 ข้อ · ตอนที่ 1 ปรนัย 10 ข้อ (ข้อละ 1) · ตอนที่ 2 คิดเลขเร็ว/คำนวณ 20 ข้อ (ข้อละ 2) · ตอนที่ 3 โจทย์ปัญหา 10 ข้อ (ข้อละ 5) · เต็ม 100</small>
    <div class="mrow"><span>เวลา</span><div class="seg sm" id="min">${[[120, "120 นาที (จริง)"], [90, "90 นาที"], [60, "60 นาที"]].map(([v, t]) => `<button type="button" data-v="${v}" class="${prefs.min === v ? "on" : ""}">${t}</button>`).join("")}</div></div>
    <div class="row l"><button type="button" class="btn" id="goE">🏆 เริ่มสอบ</button><button type="button" class="btn ghost" id="prn">🖨️ พิมพ์ข้อสอบ PDF</button></div></section>
  <section class="mode m2"><b>📘 ฝึกรายตอน</b><small>ทำทีละข้อ ตรวจทันที พร้อมเฉลยวิธีคิด ไม่จำกัดจำนวน</small>
    <div class="row l">${[1, 2, 3].map(p => `<button type="button" class="btn ghost" data-part="${p}">ตอนที่ ${p}</button>`).join("")}</div></section>
  <section class="mode m3"><b>🎯 ฝึกรายเรื่อง</b><small>เลือกเรื่องที่ยังไม่คล่อง ตัวเลขในวงเล็บคือ ถูก/ทำทั้งหมด</small>
    <p class="grp">คิดเลขเร็วและคำนวณ</p><div class="chips">${T.calc.map(t => chip(2, t)).join("")}</div>
    <p class="grp">โจทย์ปัญหา</p><div class="chips">${T.prob.map(t => chip(3, t)).join("")}</div></section>
  ${hist.length ? `<section class="card"><h3>ประวัติการสอบ</h3><table class="hist"><tr><th>วันที่</th><th>ระดับ</th><th>ตอน 1/2/3</th><th>รวม</th><th></th></tr>${hist.slice(0, 8).map(h => `<tr><td>${new Date(h.at).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}</td><td>${LVN[h.lv]}</td><td>${h.p.join(" / ")}</td><td><b>${h.total}</b></td><td>${medal(h.total)[0]}</td></tr>`).join("")}</table></section>` : ""}
  <details class="card rules"><summary>📘 เกณฑ์การแข่งขัน</summary><ul>
    <li>ทำแบบทดสอบ 120 นาที 3 ตอน คะแนนเต็ม 100</li>
    <li>ตอนที่ 1 ปรนัย 4 ตัวเลือก 10 ข้อ ข้อละ 1 คะแนน · ตอนที่ 2 เติมคำตอบ คิดเลขเร็วและคิดคำนวณ 20 ข้อ ข้อละ 2 คะแนน · ตอนที่ 3 เติมคำตอบ โจทย์ปัญหา 10 ข้อ ข้อละ 5 คะแนน</li>
    <li>ร้อยละ 80–100 เหรียญทอง · 70–79 เหรียญเงิน · 60–69 เหรียญทองแดง · ต่ำกว่า 60 เกียรติบัตร</li>
    <li>คะแนนเท่ากันตัดสินจากตอนที่ 3, 2, 1 ตามลำดับ</li>
    <li>คำตอบเศษส่วนให้ตอบเป็นเศษส่วนอย่างต่ำ พิมพ์แบบ 3/4 (เศษเกินได้) หรือทศนิยมก็ได้</li></ul></details>`;
  app.querySelectorAll("#lv button").forEach(b => b.onclick = () => { prefs.lv = +b.dataset.v; savePrefs(); home(); });
  app.querySelectorAll("#min button").forEach(b => b.onclick = () => { prefs.min = +b.dataset.v; savePrefs(); app.querySelectorAll("#min button").forEach(x => x.classList.toggle("on", x === b)); });
  $("#prn").onclick = printMenu;
  $("#goE").onclick = () => { if (ex && !ex.done && left > 0) return ask("มีข้อสอบที่ทำค้างอยู่", "จะยกเลิกชุดเดิมแล้วเริ่มชุดใหม่ใช่ไหม?", "เริ่มชุดใหม่", startExam); startExam(); };
  if ($("#resume")) { $("#resume").onclick = () => openExam(0); $("#cx").onclick = () => ask("ยกเลิกข้อสอบที่ทำค้าง?", "คำตอบที่ทำไว้จะถูกลบ ไม่บันทึกคะแนน", "ยกเลิก", () => { LS.del("exam"); home(); }); }
  app.querySelectorAll("[data-part]").forEach(b => b.onclick = () => practice(+b.dataset.part, null));
  app.querySelectorAll(".chip").forEach(b => b.onclick = () => practice(+b.dataset.p, b.dataset.t));
}

/* ======================= ANSWER INPUT (keypad) ======================= */
function keypad(id) {
  return `<div class="kp" id="${id}">${["7", "8", "9", "⌫", "4", "5", "6", "/", "1", "2", "3", ".", "0", "ล้าง"].map(k => `<button type="button" data-k="${k}" class="${k === "ล้าง" ? "w2" : ""}">${k}</button>`).join("")}</div>`;
}
function bindKeypad(id, get, set) {
  document.querySelectorAll(`#${id} button`).forEach(b => b.onclick = () => {
    const k = b.dataset.k; let v = get();
    if (k === "⌫") v = v.slice(0, -1); else if (k === "ล้าง") v = ""; else if (v.length < 12) v += k;
    set(v); tone(600, .03, .05);
  });
}
const qHTML = q => `<div class="qt">${q.q}</div>`;

/* ======================= PRACTICE ======================= */
function practice(part, topic) {
  stopTimer();
  const P = { part, topic, n: 0, c: 0, streak: 0 };
  const nextQ = () => {
    const q = QG.gen(prefs.lv, part, topic); P.q = q; P.v = ""; P.done = false; P.n++;
    app.className = "play";
    app.innerHTML = `
    <header class="bh"><button type="button" class="ib" id="hm">🏠</button><b class="tt">${topic ? `🎯 ${topic}` : `📘 ${PARTN[part]}`}<small>${LVN[prefs.lv]} · ข้อ ${P.n}</small></b><span class="pill">✅ ${P.c}${P.streak > 2 ? ` 🔥${P.streak}` : ""}</span></header>
    <section class="qcard"><div class="tag">${q.t}</div>${qHTML(q)}
      ${q.ch ? `<div class="choices">${q.ch.map((c, i) => `<button type="button" class="ch" data-i="${i}"><b>${"กขคง"[i]}</b> ${q.chH ? q.chH[i] : c}</button>`).join("")}</div>`
        : `<div class="ansrow"><span>ตอบ</span><div class="ans" id="ans">&nbsp;</div>${q.unit ? `<span class="unit">${q.unit}</span>` : ""}</div>`}</section>
    ${q.ch ? "" : keypad("kp") + `<button type="button" class="btn big" id="chk">✔ ตรวจคำตอบ</button>`}
    <div id="fb"></div>`;
    $("#hm").onclick = home;
    if (q.ch) app.querySelectorAll(".ch").forEach(b => b.onclick = () => { if (!P.done) judge(+b.dataset.i === q.ci, null, b); });
    else {
      bindKeypad("kp", () => P.v, v => { P.v = v; $("#ans").innerHTML = v || "&nbsp;"; });
      $("#chk").onclick = () => { if (P.done) return; const r = QG.check(q, P.v); if (r.empty) { toast("ใส่คำตอบก่อนนะ"); return; } judge(r.ok, r.note); };
    }
  };
  const judge = (ok, note, btn) => {
    P.done = true; const q = P.q;
    const st = LS.get("stats", {}), key = prefs.lv + ":" + q.t; st[key] = st[key] || { n: 0, c: 0 }; st[key].n++; if (ok) st[key].c++; LS.set("stats", st);
    if (ok) { P.c++; P.streak++; yay(); } else { P.streak = 0; tone(220, .25); }
    if (q.ch) app.querySelectorAll(".ch").forEach((b, i) => { b.disabled = true; b.classList.toggle("good", i === q.ci); if (btn && b === btn && !ok) b.classList.add("bad"); });
    else { $("#ans").classList.add(ok ? "good" : "bad"); app.querySelectorAll("#kp button, #chk").forEach(b => b.disabled = true); }
    const fb = $("#fb");
    fb.innerHTML = `<div class="res ${ok ? "good" : "bad"}"><h3>${ok ? pick(["✅ ถูกต้อง! เก่งมาก", "✅ ถูกต้อง!", "🎉 ยอดเยี่ยม!"]) : `❌ ${note || "ยังไม่ถูก"}`}</h3>
      <p>คำตอบ: <b>${q.ch ? (q.chH ? q.chH[q.ci] : q.ch[q.ci]) : ansShow(q)}</b> ${q.unit || ""}</p><div class="ex">💡 ${q.ex}</div>
      <button type="button" class="btn" id="nx">ข้อต่อไป ▶</button></div>`;
    $("#nx").onclick = nextQ; fb.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };
  nextQ();
}
const pick = a => a[Math.floor(Math.random() * a.length)];

/* ======================= EXAM ======================= */
function startExam() {
  const qs = QG.exam(prefs.lv);
  const ex = { lv: prefs.lv, qs, ans: qs.map(() => null), flag: qs.map(() => false), start: Date.now(), dur: prefs.min * 60, done: false };
  LS.set("exam", ex); openExam(0);
}
let E = null;
function openExam(i) {
  E = LS.get("exam", null); if (!E) return home(); if (E.done) return result();
  E.i = i; drawExam();
  stopTimer();
  timer = setInterval(() => { const left = E.dur - (Date.now() - E.start) / 1000; const c = $("#clock"); if (c) { c.textContent = fmt(left); c.classList.toggle("low", left < 600); } if (left <= 0) { stopTimer(); submit(true); } }, 1000);
}
const saveE = () => { const { i, ...rest } = E; LS.set("exam", rest); };
function drawExam() {
  const q = E.qs[E.i], i = E.i, part = q.part;
  const left = E.dur - (Date.now() - E.start) / 1000;
  app.className = "play exam";
  app.innerHTML = `
  <header class="bh"><button type="button" class="ib" id="hm">🏠</button><b class="tt">ข้อ ${i + 1}/40<small>${PARTN[part]} · ข้อละ ${PTS[part]} คะแนน</small></b><span class="clock" id="clock">${fmt(left)}</span></header>
  <section class="qcard"><button type="button" class="flag ${E.flag[i] ? "on" : ""}" id="flag">⭐ ${E.flag[i] ? "ติดดาวไว้" : "ติดดาวกลับมาดู"}</button>${qHTML(q)}
    ${q.ch ? `<div class="choices">${q.ch.map((c, k) => `<button type="button" class="ch ${E.ans[i] === k ? "sel" : ""}" data-i="${k}"><b>${"กขคง"[k]}</b> ${q.chH ? q.chH[k] : c}</button>`).join("")}</div>`
      : `<div class="ansrow"><span>ตอบ</span><div class="ans" id="ans">${E.ans[i] || "&nbsp;"}</div>${q.unit ? `<span class="unit">${q.unit}</span>` : ""}</div>`}</section>
  ${q.ch ? "" : keypad("kp")}
  <div class="nav"><button type="button" class="btn ghost" id="prv" ${i ? "" : "disabled"}>◀ ข้อก่อน</button><button type="button" class="btn ghost" id="grid">☰ ทุกข้อ</button><button type="button" class="btn" id="nxt">${i < 39 ? "ข้อต่อไป ▶" : "📤 ส่ง"}</button></div>
  <div class="bubbles">${E.qs.map((x, k) => `<button type="button" class="bb p${x.part} ${E.ans[k] != null && E.ans[k] !== "" ? "done" : ""} ${E.flag[k] ? "fl" : ""} ${k === i ? "cur" : ""}" data-k="${k}">${k + 1}</button>`).join("")}</div>
  <button type="button" class="btn danger wide" id="sub">📤 ส่งข้อสอบ</button>`;
  $("#hm").onclick = () => { saveE(); home(); };
  $("#flag").onclick = () => { E.flag[i] = !E.flag[i]; saveE(); drawExam(); };
  if (q.ch) app.querySelectorAll(".ch").forEach(b => b.onclick = () => { E.ans[i] = +b.dataset.i; saveE(); tone(600, .04, .06); drawExam(); });
  else bindKeypad("kp", () => E.ans[i] || "", v => { E.ans[i] = v; saveE(); $("#ans").innerHTML = v || "&nbsp;"; const bb = app.querySelector(`.bb[data-k="${i}"]`); bb && bb.classList.toggle("done", !!v); });
  $("#prv").onclick = () => { E.i--; drawExam(); };
  $("#nxt").onclick = () => { if (E.i < 39) { E.i++; drawExam(); } else confirmSubmit(); };
  $("#grid").onclick = () => $(".bubbles").scrollIntoView({ behavior: "smooth" });
  app.querySelectorAll(".bb").forEach(b => b.onclick = () => { E.i = +b.dataset.k; drawExam(); window.scrollTo(0, 0); });
  $("#sub").onclick = confirmSubmit;
}
function confirmSubmit() {
  const empty = E.ans.filter(a => a == null || a === "").length, fl = E.flag.filter(Boolean).length;
  ask("ส่งข้อสอบเลยไหม?", `${empty ? `ยังไม่ได้ตอบ <b>${empty} ข้อ</b>` : "ตอบครบทุกข้อแล้ว 👍"}${fl ? ` · ติดดาวไว้ ${fl} ข้อ` : ""}<br><small>ส่งแล้วแก้ไขไม่ได้</small>`, "ส่งเลย", () => submit(false));
}
function submit(auto) {
  stopTimer();
  const used = Math.min(E.dur, Math.round((Date.now() - E.start) / 1000));
  const res = E.qs.map((q, k) => { const a = E.ans[k]; if (a == null || a === "") return { ok: false, empty: true }; return q.ch ? { ok: a === q.ci } : QG.check(q, a); });
  const p = [1, 2, 3].map(part => E.qs.reduce((s, q, k) => s + (q.part === part && res[k].ok ? PTS[part] : 0), 0));
  const total = p[0] + p[1] + p[2];
  E.done = true; E.result = { res, p, total, used, auto };
  saveE();
  const hist = LS.get("hist", []); hist.unshift({ at: Date.now(), lv: E.lv, p, total, used }); LS.set("hist", hist.slice(0, 30));
  result();
}
function result() {
  E = E || LS.get("exam", null); if (!E || !E.result) return home();
  const R = E.result, [ic, mn] = medal(R.total);
  app.className = "home";
  app.innerHTML = `<section class="card resx"><div class="cele">${ic}</div><h2>${R.auto ? "หมดเวลา! " : ""}${mn}</h2>
    <p class="big">${R.total} / 100</p>
    <div class="sum">${[1, 2, 3].map(p => `<div><small>ตอนที่ ${p}</small><b>${R.p[p - 1]}</b><small>เต็ม ${[10, 40, 50][p - 1]}</small></div>`).join("")}</div>
    <p class="muted">ใช้เวลา ${fmt(R.used)} · ${LVN[E.lv]}</p>
    <div class="row"><button type="button" class="btn" id="again">🏆 สอบชุดใหม่</button><button type="button" class="btn ghost" id="hm">🏠 หน้าแรก</button></div></section>
  <section class="card"><h3>ตรวจคำตอบทีละข้อ</h3>${E.qs.map((q, k) => { const r = R.res[k], a = E.ans[k];
    const mine = a == null || a === "" ? "<i>ไม่ได้ตอบ</i>" : q.ch ? (q.chH ? q.chH[a] : q.ch[a]) : a;
    return `<details class="rv ${r.ok ? "ok" : "no"}"><summary><b>${k + 1}.</b> <span class="rt">${q.t}</span> ${r.ok ? "✅" : "❌"} <em>${r.ok ? "+" + PTS[q.part] : 0}</em></summary>
      <div class="qt sm">${q.q}</div><p>ตอบ: ${mine} ${r.note ? `<small>(${r.note})</small>` : ""} · เฉลย: <b>${q.ch ? (q.chH ? q.chH[q.ci] : q.ch[q.ci]) : ansShow(q)}</b> ${q.unit || ""}</p><div class="ex">💡 ${q.ex}</div></details>`; }).join("")}</section>`;
  if (R.total >= 80) yay();
  $("#again").onclick = startExam; $("#hm").onclick = () => { LS.del("exam"); home(); };
}
/* ======================= PRINT (PDF) ======================= */
function richTokens(html) {
  const out = [];
  html = String(html).replace(/<br\s*\/?>/g, "\n").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
  const re = /<span class="fr"><span>(.*?)<\/span><span>(.*?)<\/span><\/span>|<sup[^>]*>(.*?)<\/sup>|\n/g;
  let last = 0, m;
  const pushText = t => { t = t.replace(/<[^>]+>/g, ""); if (t) out.push({ t: "text", s: t }); };
  while ((m = re.exec(html))) {
    pushText(html.slice(last, m.index));
    if (m[0] === "\n") out.push({ t: "br" });
    else if (m[1] != null) out.push({ t: "fr", n: m[1].replace(/<[^>]+>/g, ""), d: m[2].replace(/<[^>]+>/g, "") });
    else out.push({ t: "sup", s: m[3].replace(/<[^>]+>/g, "") });
    last = re.lastIndex;
  }
  pushText(html.slice(last));
  return out;
}
/* lay out rich text; returns {lines:[{h,items:[{x,tok}]}], height} */
function layoutRich(g, html, maxW, size, weight = 600) {
  PR.font(g, size, weight);
  const fs = size * .72, lines = []; let cur = { items: [], w: 0, fr: false };
  const push = () => { lines.push(cur); cur = { items: [], w: 0, fr: false }; };
  const wOf = tok => { if (tok.t === "fr") { PR.font(g, fs, weight); const w = Math.max(g.measureText(tok.n).width, g.measureText(tok.d).width) + 8; PR.font(g, size, weight); return w; } if (tok.t === "sup") { PR.font(g, fs, weight); const w = g.measureText(tok.s).width + 2; PR.font(g, size, weight); return w; } return g.measureText(tok.s).width; };
  const place = tok => { const w = wOf(tok); if (cur.w + w > maxW && cur.items.length) push(); cur.items.push({ x: cur.w, tok }); cur.w += w; if (tok.t === "fr") cur.fr = true; };
  for (const tok of richTokens(html)) {
    if (tok.t === "br") { push(); continue; }
    if (tok.t !== "text") { place(tok); continue; }
    for (const piece of tok.s.split(/(\s+)/)) {
      if (!piece) continue;
      if (!cur.items.length && /^\s+$/.test(piece)) continue;
      const w = g.measureText(piece).width;
      if (w <= maxW) { place({ t: "text", s: piece }); continue; }
      let chunk = ""; for (const ch of piece) { if (g.measureText(chunk + ch).width > maxW - cur.w && chunk) { place({ t: "text", s: chunk }); push(); chunk = ""; } chunk += ch; } if (chunk) place({ t: "text", s: chunk });
    }
  }
  if (cur.items.length) push();
  lines.forEach(l => l.h = size * (l.fr ? 2.25 : 1.6));
  return { lines, height: lines.reduce((a, l) => a + l.h, 0), size, weight };
}
function drawRich(g, L, x, y, color = "#000") {
  const size = L.size, fs = size * .72;
  for (const l of L.lines) {
    const mid = y + l.h / 2;
    for (const it of l.items) {
      const tk = it.tok; g.fillStyle = color; g.textBaseline = "middle";
      if (tk.t === "text") { PR.font(g, size, L.weight); g.fillText(tk.s, x + it.x, mid); }
      else if (tk.t === "sup") { PR.font(g, fs, L.weight); g.fillText(tk.s, x + it.x + 1, mid - size * .32); }
      else { PR.font(g, fs, L.weight); const w = Math.max(g.measureText(tk.n).width, g.measureText(tk.d).width) + 8, cx = x + it.x + w / 2; g.textAlign = "center"; g.fillText(tk.n, cx, mid - fs * .62); g.fillText(tk.d, cx, mid + fs * .66); g.textAlign = "left"; g.strokeStyle = color; g.lineWidth = 2; g.beginPath(); g.moveTo(x + it.x + 2, mid); g.lineTo(x + it.x + w - 2, mid); g.stroke(); }
    }
    y += l.h;
  }
  g.textBaseline = "alphabetic";
  return y;
}
function printMenu() {
  const m = modal(`<h3>🖨️ พิมพ์ข้อสอบจำลอง (PDF)</h3><p>สุ่มข้อสอบชุดใหม่ 40 ข้อ 3 ตอน ระดับ <b>${LVN[prefs.lv]}</b> ลงกระดาษ A4 รูปแบบเดียวกับการสอบ</p>
    <label class="tg"><input type="checkbox" id="pk" checked> แนบหน้าเฉลยท้ายชุด</label>
    <label class="tg"><input type="checkbox" id="px" checked> เฉลยแบบมีวิธีคิด (ถ้าไม่เลือก มีแต่คำตอบ)</label>
    <div class="row"><button type="button" class="btn" id="pgo">สร้างข้อสอบ</button><button type="button" class="btn ghost" id="pcx">ยกเลิก</button></div>`);
  m.querySelector("#pcx").onclick = () => m.remove();
  m.querySelector("#pgo").onclick = async () => {
    const key = m.querySelector("#pk").checked, exp = m.querySelector("#px").checked;
    m.querySelector(".sheet").innerHTML = `<h3>กำลังสุ่มข้อสอบและจัดหน้า…</h3><p>รอสักครู่</p>`;
    await PR.ready(); await new Promise(r => setTimeout(r, 40));
    const qs = QG.exam(prefs.lv), pages = buildExamPDF(qs, key, exp);
    m.remove();
    PR.preview(pages, `อัจฉริยภาพ-${LVN[prefs.lv].replace(/[^0-9ป]/g, "")}-${new Date().toISOString().slice(0, 10)}.pdf`);
  };
}
function buildExamPDF(qs, key, exp) {
  const X = 80, W = PR.PW - 160, BOTTOM = PR.PH - 110, pages = [];
  const date = new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
  const sub = `ระดับ ${LVN[prefs.lv]} · 3 ตอน 40 ข้อ · คะแนนเต็ม 100 · เวลา 120 นาที · ${date}`;
  let pg = null, y = 0;
  const newPage = (title, student) => { pg = PR.page(); pages.push(pg); y = PR.header(pg.g, title, sub, pages.length, 0, student); };
  const need = h => { if (y + h > BOTTOM) newPage("แบบทดสอบอัจฉริยภาพทางคณิตศาสตร์", false); };
  newPage("แบบทดสอบอัจฉริยภาพทางคณิตศาสตร์", true);
  let part = 0;
  qs.forEach((q, i) => {
    const g = pg.g;
    if (q.part !== part) {
      part = q.part; need(110);
      const t = PARTN[part] + ` (${[10, 20, 10][part - 1]} ข้อ ข้อละ ${PTS[part]} คะแนน)`;
      pg.g.fillStyle = "#EEF6F4"; pg.g.fillRect(X, y + 10, W, 52); PR.text(pg.g, t, X + 16, y + 46, 26, { w: 700 }); y += 80;
    }
    const L = layoutRich(pg.g, q.q, W - 60, 26, 500);
    let h = L.height + 16, chL = null, colW = (W - 60) / 2;
    if (q.ch) { chL = q.ch.map((c, k) => layoutRich(pg.g, `${"กขคง"[k]}. ${q.chH ? q.chH[k] : c}`, colW - 20, 24, 500)); h += Math.max(chL[0].height, chL[1].height) + Math.max(chL[2].height, chL[3].height) + 10; }
    else h += 56;
    need(h + 10);
    const gg = pg.g;
    PR.text(gg, `${i + 1}.`, X, y + 6 + L.lines[0].h / 2 + 9, 26, { w: 700 });
    let yy = drawRich(gg, L, X + 60, y + 6);
    if (q.ch) {
      const r1 = Math.max(chL[0].height, chL[1].height), r2 = Math.max(chL[2].height, chL[3].height);
      drawRich(gg, chL[0], X + 60, yy + 4); drawRich(gg, chL[1], X + 60 + colW, yy + 4);
      drawRich(gg, chL[2], X + 60, yy + 8 + r1); drawRich(gg, chL[3], X + 60 + colW, yy + 8 + r1);
      yy += r1 + r2 + 12;
    } else {
      PR.text(gg, "ตอบ", X + 60, yy + 40, 24, { w: 600 });
      gg.strokeStyle = "#777"; gg.setLineDash([4, 6]); gg.lineWidth = 1.5; gg.beginPath(); gg.moveTo(X + 120, yy + 42); gg.lineTo(X + 460, yy + 42); gg.stroke(); gg.setLineDash([]);
      if (q.unit) PR.text(gg, q.unit, X + 472, yy + 40, 24, { w: 400 });
      yy += 56;
    }
    y = yy + 14;
  });
  if (key) {
    pg = PR.page(); pages.push(pg); y = PR.header(pg.g, "เฉลยแบบทดสอบ", sub, pages.length, 0, false);
    qs.forEach((q, i) => {
      const ans = q.ch ? `${"กขคง"[q.ci]}. ${q.chH ? q.chH[q.ci] : q.ch[q.ci]}` : `${q.ansH || q.ans}${q.unit ? " " + q.unit : ""}`;
      const A = layoutRich(pg.g, `ข้อ ${i + 1}  →  ${ans}`, W, 23, 700);
      const E = exp ? layoutRich(pg.g, q.ex, W - 40, 19, 400) : null;
      const h = A.height + (E ? E.height + 6 : 0) + 10;
      if (y + h > BOTTOM) { pg = PR.page(); pages.push(pg); y = PR.header(pg.g, "เฉลยแบบทดสอบ (ต่อ)", sub, pages.length, 0, false); }
      y = drawRich(pg.g, A, X, y);
      if (E) y = drawRich(pg.g, E, X + 40, y, "#444") + 6;
      y += 4;
    });
  }
  /* fix page numbers */
  pages.forEach((p, k) => { const g = p.g; g.fillStyle = "#fff"; g.fillRect(PR.PW - 300, PR.PH - 80, 220, 40); PR.text(g, `หน้า ${k + 1}/${pages.length}`, PR.PW - 80, PR.PH - 50, 20, { w: 400, color: "#666", align: "right" }); });
  return pages.map(p => p.c);
}

home();
})();
