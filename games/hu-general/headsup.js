(function(){
"use strict";
const C = window.HU_CONFIG;
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const shuffle = a => { for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const KEY = "kruau-headsup-" + C.key;
const store = {
  get(){ try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch(e){ return mem; } },
  set(o){ mem = o; try { localStorage.setItem(KEY, JSON.stringify(o)); } catch(e){} }
};
let mem = {};
let prefs = Object.assign({time:60, tilt:true, cats:[C.cats[0].id], custom:"", useCustom:false, onlyCustom:false, sound:true}, store.get());
const save = () => store.set(prefs);

/* ---------- sound ---------- */
let ac = null;
function tone(f, d = .12, type = "sine", when = 0, vol = .2){
  if (!prefs.sound) return;
  try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const t = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = f; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + d); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + .02); } catch(e){}
}
const sfx = { ok:() => { tone(660, .1); tone(990, .16, "sine", .09); }, pass:() => tone(220, .2, "square", 0, .08), tick:() => tone(880, .06, "triangle"), go:() => { tone(523, .1); tone(784, .2, "sine", .1); }, end:() => [784, 659, 523, 392].forEach((f, i) => tone(f, .2, "triangle", i * .14)) };
const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch(e){} };

/* ---------- home ---------- */
function customWords(){ return prefs.custom.split(/\n|,/).map(s => s.trim()).filter(Boolean).map(w => ({w, e:""})); }
function deck(){
  let list = [];
  if (!prefs.onlyCustom) C.cats.filter(c => prefs.cats.includes(c.id)).forEach(c => c.words.forEach(x => { const [w, e] = x.split("|"); list.push({w, e:e || "", cat:c.name}); }));
  if (prefs.useCustom || prefs.onlyCustom) list = list.concat(customWords().map(x => Object.assign(x, {cat:"คำของครู"})));
  const seen = new Set(); return shuffle(list.filter(x => !seen.has(x.w) && seen.add(x.w)));
}
function renderHome(){
  $("#app").className = "home";
  const nCustom = customWords().length;
  $("#app").innerHTML = `
  <header class="top"><div class="logo">${C.icon}</div><div><h1>${esc(C.title)}</h1><p>${esc(C.subtitle)}</p></div></header>
  <section class="card how"><b>วิธีเล่น</b> คนทาย 1 คนถือเครื่องแปะหน้าผาก หันจอให้เพื่อน (แนะนำให้หมุนเครื่องเป็นแนวนอน) เพื่อน ๆ ช่วยกันใบ้ด้วยคำพูดหรือท่าทาง ห้ามพูดคำนั้นตรง ๆ!<br>
    ✅ <b>ทายถูก</b>: ก้มจอลงพื้น หรือแตะฝั่งขวา · ⏭️ <b>ข้าม</b>: เงยจอขึ้นฟ้า หรือแตะฝั่งซ้าย</section>
  <section class="card"><h2>เลือกหมวดคำ <small>(เลือกได้หลายหมวด)</small></h2><div class="cats">${C.cats.map(c => `<button class="cat${prefs.cats.includes(c.id) ? " on" : ""}" type="button" data-id="${c.id}"><span>${c.icon}</span>${esc(c.name)}<small>${c.words.length} คำ</small></button>`).join("")}</div></section>
  <section class="card"><h2>เวลาต่อรอบ</h2><div class="seg">${[60, 90, 120].map(t => `<button type="button" data-t="${t}" class="${prefs.time === t ? "on" : ""}">${t} วินาที</button>`).join("")}</div>
    <label class="tg"><input type="checkbox" id="tilt" ${prefs.tilt ? "checked" : ""}> ใช้การเอียงเครื่อง (ก้ม = ถูก · เงย = ข้าม)</label>
    <label class="tg"><input type="checkbox" id="snd" ${prefs.sound ? "checked" : ""}> เปิดเสียง</label></section>
  <section class="card"><h2>✏️ คำของครู <small id="nc">(${nCustom} คำ)</small></h2>
    <p class="hint">พิมพ์คำที่อยากให้ทาย บรรทัดละ 1 คำ (หรือคั่นด้วย ,) บันทึกไว้ในเครื่องนี้</p>
    <textarea id="cw" rows="4" placeholder="เช่น&#10;ครูอู๋&#10;ห้องสมุด&#10;สนามฟุตบอล">${esc(prefs.custom)}</textarea>
    <div class="row2"><button class="btn ghost" type="button" id="savec">💾 บันทึกคำ</button><span id="saved"></span></div>
    <label class="tg"><input type="checkbox" id="usec" ${prefs.useCustom ? "checked" : ""}> รวมคำของครูในเกม</label>
    <label class="tg"><input type="checkbox" id="onlyc" ${prefs.onlyCustom ? "checked" : ""}> เล่นเฉพาะคำของครู</label></section>
  <button class="btn big" type="button" id="start">▶ เริ่มเล่น</button>
  <p class="foot">เปิดในไอแพดหรือโทรศัพท์ · แนะนำให้ปิดการล็อกหมุนจอ</p>`;
  $(".cats").onclick = e => { const b = e.target.closest(".cat"); if (!b) return; const id = b.dataset.id; prefs.cats = prefs.cats.includes(id) ? prefs.cats.filter(x => x !== id) : [...prefs.cats, id]; save(); b.classList.toggle("on"); };
  $(".seg").onclick = e => { const b = e.target.closest("[data-t]"); if (!b) return; prefs.time = +b.dataset.t; save(); document.querySelectorAll(".seg button").forEach(x => x.classList.toggle("on", x === b)); };
  $("#tilt").onchange = e => { prefs.tilt = e.target.checked; save(); };
  $("#snd").onchange = e => { prefs.sound = e.target.checked; save(); };
  $("#usec").onchange = e => { prefs.useCustom = e.target.checked; save(); };
  $("#onlyc").onchange = e => { prefs.onlyCustom = e.target.checked; save(); };
  $("#savec").onclick = () => { prefs.custom = $("#cw").value; if (customWords().length && !prefs.onlyCustom) prefs.useCustom = true; save(); $("#saved").textContent = `บันทึกแล้ว ${customWords().length} คำ ✓`; $("#nc").textContent = `(${customWords().length} คำ)`; $("#usec").checked = prefs.useCustom; };
  $("#start").onclick = start;
}

/* ---------- game ---------- */
let G = null, wake = null;
async function start(){
  { const cw = $("#cw"); if (cw) prefs.custom = cw.value; } save();
  const words = deck();
  if (!words.length){ alert("ยังไม่มีคำให้เล่น เลือกหมวดคำ หรือบันทึกคำของครูก่อนนะ"); return; }
  try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume && ac.resume(); } catch(e){}
  let permP = null;
  if (prefs.tilt && window.DeviceOrientationEvent){
    try { permP = typeof DeviceOrientationEvent.requestPermission === "function" ? DeviceOrientationEvent.requestPermission() : Promise.resolve("granted"); } catch(e){ permP = null; }
  }
  try { if (document.documentElement.requestFullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {}); } catch(e){}
  try { if (navigator.wakeLock) navigator.wakeLock.request("screen").then(w => { wake = w; }).catch(() => {}); } catch(e){}
  let tiltOK = false;
  if (permP){ try { tiltOK = (await permP) === "granted"; } catch(e){ tiltOK = false; } }
  G = {words, i:0, got:[], pass:[], left:prefs.time, tilt:tiltOK, state:"count", neutral:false, lock:false, timer:null};
  countdown();
}
function countdown(){
  $("#app").className = "play";
  let n = 3;
  const show = () => { $("#app").innerHTML = `<div class="stage count"><div class="cn">${n}</div><p>แปะเครื่องไว้ที่หน้าผาก หันจอให้เพื่อน!</p></div>`; sfx.tick(); };
  show();
  const t = setInterval(() => { n--; if (n > 0) show(); else { clearInterval(t); sfx.go(); play(); } }, 1000);
}
function play(){
  G.state = "play";
  $("#app").innerHTML = `<div class="stage" id="stg"><div class="bar"><span id="tm">${G.left}</span><span id="sc">✅ 0</span><span id="tl">${G.tilt ? "📱 เอียงได้" : ""}</span></div>
    <div class="word" id="wd"></div><div class="cat-tag" id="ct"></div>
    <button class="zone pass" type="button" id="zp">⏭️<br>ข้าม</button><button class="zone ok" type="button" id="zo">✅<br>ถูก</button><div class="flash" id="fl"></div></div>`;
  showWord();
  $("#zo").onclick = () => mark(true);
  $("#zp").onclick = () => mark(false);
  G.timer = setInterval(() => { G.left--; const tm = $("#tm"); if (tm) tm.textContent = G.left; if (G.left <= 5 && G.left > 0) sfx.tick(); if (G.left <= 0) end(); }, 1000);
}
function fit(el){ const len = [...el.textContent].length; el.style.fontSize = len > 18 ? "min(9vw,9vh)" : len > 10 ? "min(13vw,14vh)" : "min(18vw,22vh)"; }
function showWord(){
  if (G.i >= G.words.length){ G.words = shuffle(G.words.slice()); G.i = 0; }
  const w = G.words[G.i];
  $("#wd").innerHTML = `${w.e ? `<span class="emo">${w.e}</span>` : ""}<span class="tx">${esc(w.w)}</span>`; fit($("#wd .tx"));
  $("#ct").textContent = w.cat || "";
}
function mark(ok){
  if (!G || G.state !== "play" || G.lock) return;
  G.lock = true;
  const w = G.words[G.i]; (ok ? G.got : G.pass).push(w.w);
  ok ? sfx.ok() : sfx.pass(); buzz(ok ? 60 : [30, 40, 30]);
  const fl = $("#fl"); fl.className = "flash " + (ok ? "g" : "r"); fl.textContent = ok ? "✅ ถูกต้อง!" : "⏭️ ข้าม";
  $("#sc").textContent = `✅ ${G.got.length}`;
  setTimeout(() => { if (!G || G.state !== "play") return; fl.className = "flash"; G.i++; showWord(); G.lock = false; }, 750);
}
function onTilt(e){
  if (!G || G.state !== "play" || !G.tilt || e.gamma == null) return;
  const g = Math.abs(e.gamma), b = Math.abs(e.beta);
  if (g > 60){ G.neutral = true; return; }
  if (G.neutral && g < 28){ G.neutral = false; mark(b > 90); }
}
window.addEventListener("deviceorientation", onTilt);
function end(){
  clearInterval(G.timer); G.state = "end"; sfx.end(); buzz([100, 60, 100]);
  try { wake && wake.release(); } catch(e){}
  try { document.fullscreenElement && document.exitFullscreen(); } catch(e){}
  $("#app").className = "result";
  $("#app").innerHTML = `<div class="res"><div class="big-score">${G.got.length}</div><p>คำที่ทายถูก ในเวลา ${prefs.time} วินาที</p>
    <div class="lists"><div><h3>✅ ทายถูก (${G.got.length})</h3><ul>${G.got.map(w => `<li>${esc(w)}</li>`).join("") || "<li class=e>-</li>"}</ul></div>
    <div><h3>⏭️ ข้าม (${G.pass.length})</h3><ul>${G.pass.map(w => `<li>${esc(w)}</li>`).join("") || "<li class=e>-</li>"}</ul></div></div>
    <div class="row2"><button class="btn big" type="button" id="again">🔁 เล่นอีกรอบ</button><button class="btn ghost" type="button" id="home">🏠 หน้าแรก</button></div>
    <p class="hint">💡 คำที่ข้าม ครูหยิบมาอธิบายต่อในห้องได้</p></div>`;
  $("#again").onclick = start; $("#home").onclick = () => { G = null; renderHome(); };
}
document.addEventListener("visibilitychange", async () => { if (document.visibilityState === "visible" && G && G.state === "play"){ try { if (navigator.wakeLock) wake = await navigator.wakeLock.request("screen"); } catch(e){} } });
document.addEventListener("keydown", e => { if (!G || G.state !== "play") return; if (e.key === "ArrowRight" || e.key === " ") mark(true); if (e.key === "ArrowLeft") mark(false); });
document.title = C.title;
renderHome();
})();
