/* KruAu game kit: start screen, name entry, level picker, per-device leaderboard, HUD, result modal, sound. */
(function(){
"use strict";
const K = window.KIT = {};
K.TIER = ["", "ง่าย", "กลาง", "ยาก"];

/* ---------- utilities ---------- */
K.rand = (a,b) => a + Math.floor(Math.random()*(b-a+1));
K.pick = arr => arr[Math.floor(Math.random()*arr.length)];
K.gcd = (a,b) => b ? K.gcd(b, a%b) : Math.abs(a);
K.shuffle = a => { for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
K.esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
K.fmt = n => Number(n).toLocaleString("en-US");
K.fmtTime = s => Math.floor(s/60) + ":" + String(s%60).padStart(2,"0");
K.frac = (n,d) => `<span class="frac"><span class="n">${n}</span><span class="d">${d}</span></span>`;
/* numeric distractors: unique, positive, not equal to answer */
K.numOptions = (ans, makers, count=4) => {
  const set = new Set([ans]); let g = 0;
  while (set.size < count && g++ < 200){
    const v = typeof makers === "function" ? makers(ans) : K.pick(makers)(ans);
    if (v !== undefined && v !== null && v > 0 && Number.isFinite(v)) set.add(v);
  }
  return K.shuffle([...set]);
};
/* Thai number words */
const TD = ["ศูนย์","หนึ่ง","สอง","สาม","สี่","ห้า","หก","เจ็ด","แปด","เก้า"];
const TU = ["","สิบ","ร้อย","พัน","หมื่น","แสน"];
function group(n, ed){
  const s = String(n); let out = "";
  for (let i=0;i<s.length;i++){
    const d = +s[i], p = s.length-1-i;
    if (!d) continue;
    if (p === 1) out += d===1 ? "สิบ" : d===2 ? "ยี่สิบ" : TD[d]+"สิบ";
    else if (p === 0) out += (d===1 && (s.length>1 || ed)) ? "เอ็ด" : TD[d];
    else out += TD[d] + TU[p];
  }
  return out;
}
K.thaiWords = n => {
  if (n === 0) return "ศูนย์";
  if (n >= 1e6){
    const hi = Math.floor(n/1e6), lo = n % 1e6;
    return K.thaiWords(hi) + "ล้าน" + (lo ? group(lo, true) : "");
  }
  return group(n, false);
};
K.thaiDigits = s => String(s).replace(/[0-9]/g, d => "๐๑๒๓๔๕๖๗๘๙"[d]);

/* ---------- sound ---------- */
let soundOn = true, ac = null;
function tone(freq, dur=0.12, type="sine", when=0, vol=0.15){
  if (!soundOn) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const t = ac.currentTime + when, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t+dur);
    o.connect(g).connect(ac.destination); o.start(t); o.stop(t+dur+0.02);
  } catch(e){}
}
K.sfx = {
  tap:  () => tone(520, .07, "triangle"),
  good: () => { tone(660,.1); tone(880,.14,"sine",.09); },
  bad:  () => tone(200,.18,"square",0,.06),
  pop:  () => tone(900,.08,"sine",0,.12),
  win:  () => [523,659,784,1047].forEach((f,i)=>tone(f,.18,"triangle",i*.12))
};

/* ---------- SVG mascots ---------- */
const SYMBOLS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<symbol id="cat" viewBox="0 0 100 100">
<path d="M18 40 L22 10 L42 28 Z" fill="#F4B76E" stroke="#5A4335" stroke-width="3" stroke-linejoin="round"/>
<path d="M82 40 L78 10 L58 28 Z" fill="#F4B76E" stroke="#5A4335" stroke-width="3" stroke-linejoin="round"/>
<path d="M24 16 L27 30 L36 27 Z" fill="#F7B7C3"/><path d="M76 16 L73 30 L64 27 Z" fill="#F7B7C3"/>
<ellipse cx="50" cy="56" rx="38" ry="34" fill="#F6C27E" stroke="#5A4335" stroke-width="3"/>
<path d="M44 24 q2 8 0 12 M50 23 v13 M56 24 q-2 8 0 12" stroke="#E0964A" stroke-width="3" fill="none" stroke-linecap="round"/>
<ellipse cx="50" cy="70" rx="15" ry="11" fill="#FFF3E3"/>
<path d="M34 54 q5 -6 10 0" stroke="#5A4335" stroke-width="3" fill="none" stroke-linecap="round"/>
<path d="M56 54 q5 -6 10 0" stroke="#5A4335" stroke-width="3" fill="none" stroke-linecap="round"/>
<circle cx="30" cy="64" r="5" fill="#F7A9B5" opacity=".8"/><circle cx="70" cy="64" r="5" fill="#F7A9B5" opacity=".8"/>
<path d="M47 64 h6 l-3 3 z" fill="#E8708F"/>
<path d="M44 70 q3 4 6 0 q3 4 6 0" stroke="#5A4335" stroke-width="2.5" fill="none" stroke-linecap="round"/>
</symbol>
<symbol id="hatcat" viewBox="0 0 100 100">
<use href="#cat" x="0" y="8" width="100" height="92"/>
<path d="M22 24 L50 12 L78 24 L50 34 Z" fill="#5A4335"/><rect x="38" y="26" width="24" height="8" rx="2" fill="#5A4335"/>
<path d="M74 25 v10" stroke="#F6CD6B" stroke-width="3"/><circle cx="74" cy="37" r="3" fill="#F6CD6B"/>
</symbol>
</defs></svg>`;

/* ---------- mount ---------- */
K.mount = function(cfg){
  const LB_KEY = "kruau-" + cfg.key + "-lb-v1";
  let memLB = {1:[],2:[],3:[]};
  try { const raw = localStorage.getItem(LB_KEY); if (raw){ const o = JSON.parse(raw); if (o && o[1]) memLB = o; } } catch(e){}
  const saveLB = () => { try { localStorage.setItem(LB_KEY, JSON.stringify(memLB)); } catch(e){} };
  const norm = s => s.trim().toLowerCase();

  document.body.innerHTML = SYMBOLS + `
<header class="topbar">
  <div class="brand"><svg viewBox="0 0 100 100" aria-hidden="true"><use href="#cat"/></svg>
    <div><div class="brand-name">${cfg.title}</div><div class="brand-sub">${cfg.subtitle}</div></div></div>
  <button class="sound-btn" id="kSound" type="button" aria-pressed="true">🔊 เสียงเปิด</button>
</header>
<main class="wrap" id="kStart">
  <section class="hero">
    <svg class="hero-cat" viewBox="0 0 100 100" aria-hidden="true"><use href="#hatcat"/></svg>
    <div>
      <div class="bubble" id="kGreet">${cfg.bubble || "ใส่ชื่อแล้วเลือกด่านได้เลยจ้า~"}</div>
      <h1>${cfg.heroHTML}</h1>
      <p>${cfg.heroDesc}</p>
      <div class="name-row"><label for="kName" class="sr">ชื่อนักเรียน</label>
        <input id="kName" type="text" maxlength="20" autocomplete="off" placeholder="พิมพ์ชื่อเล่นหรือชื่อ-เลขที่ เช่น มะปราง 12"></div>
      <div class="name-err" id="kNameErr" role="alert"></div>
    </div>
  </section>
  <h2 class="section-title">🎯 เลือกด่าน</h2>
  <div class="levels" id="kLevels"></div>
  <div class="two-col">
    <section class="panel howto"><h3 class="section-title">📖 วิธีเล่น</h3>
      <ol>${cfg.howto.map(s=>`<li>${s}</li>`).join("")}</ol>
      ${cfg.note ? `<div class="note">${cfg.note}</div>` : ""}
    </section>
    <section class="panel">
      <div class="lb-head"><h3 class="section-title">🏆 ตารางคะแนน</h3><div class="tabs" role="tablist" id="kTabs"></div></div>
      <table class="lb"><thead><tr><th>อันดับ</th><th>ชื่อ</th><th class="num">เวลา</th><th class="num">คะแนน</th></tr></thead><tbody id="kLB"></tbody></table>
      <div class="lb-foot"><span>เก็บคะแนนสูงสุดของแต่ละคนในเครื่องนี้</span><button class="link-btn" id="kClear" type="button">ล้างตารางด่านนี้</button></div>
    </section>
  </div>
</main>
<main class="wrap hidden" id="kGame">
  <div class="hud">
    <div class="hud-left"><button class="back-btn" id="kQuit" type="button">← ออก</button>
      <span class="chip player" id="kHName"></span><span class="chip lv" id="kHLevel"></span></div>
    <div class="hud-right"><span class="chip" id="kHTime">⏱ 0:00</span><span class="chip" id="kHProg">${cfg.progIcon||"✅"} 0/0</span><span class="chip" id="kHScore">⭐ 0</span></div>
  </div>
  <div class="say" id="kSay" aria-live="polite"></div>
  <div class="stage" id="kStage"></div>
</main>
<div class="modal" id="kResult" role="dialog" aria-modal="true" aria-labelledby="kResTitle"><div class="sheet">
  <svg class="cat-mini" viewBox="0 0 100 100" aria-hidden="true"><use href="#hatcat"/></svg>
  <h2 id="kResTitle"></h2><div class="stars" id="kStars"></div>
  <table class="breakdown"><tbody id="kResBody"></tbody></table>
  <div class="rank" id="kRank"></div>
  <div class="btn-row"><button class="btn" id="kAgain" type="button">เล่นอีกครั้ง</button><button class="btn" id="kNext" type="button" style="--c:var(--good)">ด่านถัดไป →</button></div>
  <div class="btn-row"><button class="btn ghost" id="kHome" type="button">ดูตารางคะแนน / เปลี่ยนผู้เล่น</button></div>
</div></div>
<div class="modal" id="kConfirm" role="dialog" aria-modal="true" aria-labelledby="kCfTitle"><div class="sheet">
  <h2 id="kCfTitle">ล้างตารางคะแนน?</h2><p id="kCfText" style="margin:0;color:var(--ink-soft)"></p>
  <div class="btn-row"><button class="btn ghost" id="kCfNo" type="button">ยกเลิก</button><button class="btn" id="kCfYes" type="button" style="--c:var(--bad)">ล้างเลย</button></div>
</div></div>
<div class="confetti" id="kConfetti"></div>`;

  const $ = id => document.getElementById(id);
  let tab = 1, player = "", session = null;

  $("kSound").onclick = () => { soundOn = !soundOn; $("kSound").textContent = soundOn ? "🔊 เสียงเปิด" : "🔇 เสียงปิด"; $("kSound").setAttribute("aria-pressed", soundOn); };

  function renderLevels(){
    const nm = norm($("kName").value);
    $("kLevels").innerHTML = Object.entries(cfg.levels).map(([id,L]) => {
      const mine = nm && (memLB[id]||[]).find(e => norm(e.name) === nm);
      return `<button class="level" type="button" data-level="${id}" style="--c:${L.color}">
        <span class="lv-top"><span class="lv-name">ด่าน ${id} · ${K.TIER[id]}</span><span class="lv-pill">${L.pill}</span></span>
        <span class="lv-desc">${L.desc}</span>
        <span class="lv-best">${mine ? "สถิติของฉัน: "+mine.score+" คะแนน" : "ยังไม่เคยเล่น"}</span></button>`;
    }).join("");
  }
  function renderTabs(){ $("kTabs").innerHTML = [1,2,3].map(i => `<button class="tab" role="tab" type="button" data-tab="${i}" aria-selected="${i===tab}">${K.TIER[i]}</button>`).join(""); }
  function renderLB(){
    const list = memLB[tab] || [];
    if (!list.length){ $("kLB").innerHTML = `<tr><td colspan="4" class="lb-empty">ยังไม่มีใครเล่นด่าน ${tab} เป็นคนแรกเลย!</td></tr>`; return; }
    $("kLB").innerHTML = list.slice(0,10).map((e,i) => `<tr class="${player && norm(e.name)===norm(player)?'me':''}">
      <td><span class="medal ${i<3?'m'+(i+1):''}">${i+1}</span></td><td>${K.esc(e.name)}</td>
      <td class="num">${K.fmtTime(e.time)}</td><td class="num">${e.score}</td></tr>`).join("");
  }
  $("kTabs").onclick = e => { const b = e.target.closest("[data-tab]"); if (!b) return; tab = +b.dataset.tab; renderTabs(); renderLB(); };
  $("kName").oninput = () => { $("kNameErr").textContent = ""; renderLevels(); };
  $("kName").onkeydown = e => { if (e.key === "Enter") $("kLevels").querySelector("[data-level='1']").click(); };
  $("kLevels").onclick = e => {
    const b = e.target.closest("[data-level]"); if (!b) return;
    const nm = $("kName").value.trim();
    if (!nm){ $("kNameErr").textContent = "พิมพ์ชื่อก่อนนะ จะได้ขึ้นตารางคะแนน"; $("kName").focus(); return; }
    player = nm; start(+b.dataset.level);
  };
  $("kClear").onclick = () => { $("kCfText").textContent = `คะแนนทั้งหมดของด่าน ${tab} ในเครื่องนี้จะถูกลบ`; $("kConfirm").classList.add("open"); $("kCfNo").focus(); };
  $("kCfNo").onclick = () => $("kConfirm").classList.remove("open");
  $("kCfYes").onclick = () => { memLB[tab] = []; saveLB(); renderLB(); renderLevels(); $("kConfirm").classList.remove("open"); };
  document.addEventListener("keydown", e => { if (e.key === "Escape") $("kConfirm").classList.remove("open"); });

  function endSession(){
    if (!session) return;
    session.alive = false;
    clearInterval(session.timer);
    session.timers.forEach(clearTimeout);
    session.cleanups.forEach(f => { try { f(); } catch(e){} });
    session = null;
  }

  function start(level){
    endSession();
    const L = cfg.levels[level];
    const S = session = {level, L, alive:true, sec:0, score:0, combo:0, mistakes:0, right:0, timers:[], cleanups:[], done:false};
    S.timer = setInterval(() => { S.sec++; $("kHTime").textContent = "⏱ " + K.fmtTime(S.sec); }, 1000);
    $("kHName").textContent = "🐱 " + player;
    $("kHLevel").textContent = `ด่าน ${level} · ${K.TIER[level]}`; $("kHLevel").style.setProperty("--c", L.color);
    $("kHTime").textContent = "⏱ 0:00"; $("kHScore").textContent = "⭐ 0";
    $("kSay").textContent = ""; $("kSay").className = "say";
    const stage = $("kStage"); stage.innerHTML = ""; stage.style.setProperty("--c", L.color);
    $("kStart").classList.add("hidden"); $("kGame").classList.remove("hidden");
    window.scrollTo(0,0);

    const ctx = {
      level, L, stage, name: player, sfx: K.sfx,
      alive: () => S.alive,
      sec: () => S.sec,
      after: (ms, fn) => { const t = setTimeout(() => { if (S.alive) fn(); }, ms); S.timers.push(t); return t; },
      cleanup: fn => S.cleanups.push(fn),
      say: (msg, cls) => { $("kSay").textContent = msg; $("kSay").className = "say" + (cls ? " "+cls : ""); },
      progress: (done, total) => { $("kHProg").textContent = `${cfg.progIcon||"✅"} ${done}/${total}`; },
      correct: (base=100, msg) => {
        if (S.done) return 0;
        S.combo++; S.right++;
        const gain = Math.round(base + (S.combo-1)*Math.round(base/4));
        S.score += gain; $("kHScore").textContent = "⭐ " + S.score;
        ctx.say(msg || (S.combo > 1 ? `ถูกต้อง! คอมโบ x${S.combo} +${gain}` : `ถูกต้อง! +${gain}`), "good");
        K.sfx.good(); return gain;
      },
      wrong: (msg, penalty=10) => {
        if (S.done) return;
        S.combo = 0; S.mistakes++; S.score = Math.max(0, S.score - penalty);
        $("kHScore").textContent = "⭐ " + S.score;
        ctx.say(msg || "ยังไม่ถูก ลองอีกครั้งนะ", "bad"); K.sfx.bad();
      },
      finish: (opts={}) => finish(S, opts)
    };
    cfg.play(level, ctx);
  }

  function finish(S, opts){
    if (!S.alive || S.done) return;
    S.done = true; clearInterval(S.timer);
    const target = opts.targetSec || 0;
    const acc = S.right / Math.max(1, S.right + S.mistakes);
    const timeBonus = Math.round(Math.max(0, target - S.sec) * 5 * acc);
    const total = S.score + timeBonus;
    const stars = acc >= .9 ? 3 : acc >= .7 ? 2 : 1;
    const list = memLB[S.level] || (memLB[S.level] = []);
    const nk = norm(player); const i = list.findIndex(e => norm(e.name) === nk);
    const entry = {name:player, score:total, time:S.sec, stars, at:Date.now()};
    let improved = true;
    if (i >= 0){ const o = list[i]; if (o.score > total || (o.score === total && o.time <= S.sec)) improved = false; else list[i] = entry; }
    else list.push(entry);
    list.sort((a,b) => b.score - a.score || a.time - b.time); if (list.length > 50) list.length = 50;
    saveLB();
    const rank = list.findIndex(e => norm(e.name) === nk) + 1;
    setTimeout(() => {
      K.sfx.win(); confetti();
      $("kResTitle").textContent = (stars === 3 ? "สุดยอด " : stars === 2 ? "เก่งมาก " : "ผ่านแล้ว ") + player + "!";
      $("kStars").innerHTML = [1,2,3].map(s => `<span class="${s<=stars?'':'off'}">⭐</span>`).join("");
      $("kStars").setAttribute("aria-label", `ได้ ${stars} ดาว`);
      $("kResBody").innerHTML = `
        <tr><td>คะแนนจากการตอบ (รวมคอมโบ)</td><td>${S.score}</td></tr>
        <tr><td>โบนัสเวลา (${K.fmtTime(S.sec)}, คิดตามความแม่นยำ)</td><td>+${timeBonus}</td></tr>
        <tr><td>ตอบถูก / ตอบผิด</td><td>${S.right} / ${S.mistakes}</td></tr>
        <tr class="total"><td>คะแนนรวม</td><td>${total}</td></tr>`;
      $("kRank").textContent = improved ? `🏆 อันดับที่ ${rank} จาก ${list.length} คน ในด่าน ${S.level}`
        : `สถิติเดิมดีกว่า (${list[rank-1].score} คะแนน) ยังอยู่อันดับที่ ${rank}`;
      $("kNext").classList.toggle("hidden", S.level >= 3);
      $("kResult").classList.add("open"); $("kAgain").focus();
    }, 500);
  }
  let lastLevel = 1;
  const levelOf = () => (session && session.level) || lastLevel;
  $("kAgain").onclick = () => { const l = levelOf(); $("kResult").classList.remove("open"); start(l); };
  $("kNext").onclick = () => { const l = Math.min(3, levelOf()+1); $("kResult").classList.remove("open"); start(l); };
  $("kHome").onclick = () => { $("kResult").classList.remove("open"); goHome(); };
  $("kQuit").onclick = () => goHome();
  function goHome(){
    tab = levelOf(); lastLevel = tab;
    endSession();
    $("kGame").classList.add("hidden"); $("kStart").classList.remove("hidden");
    renderTabs(); renderLB(); renderLevels();
    $("kGreet").textContent = "ให้เพื่อนคนต่อไปใส่ชื่อแล้วเล่นต่อได้เลย~";
    window.scrollTo(0,0);
  }
  function confetti(){
    const box = $("kConfetti"), colors = ["#F2A65A","#F2A7B8","#7FD39A","#86B6F0","#B7A4EE","#F6CD6B"];
    let h = "";
    for (let i=0;i<60;i++) h += `<i style="left:${Math.random()*100}%;background:${K.pick(colors)};animation-duration:${1.6+Math.random()*1.6}s;animation-delay:${Math.random()*.5}s"></i>`;
    box.innerHTML = h; setTimeout(() => box.innerHTML = "", 3800);
  }
  renderLevels(); renderTabs(); renderLB();
};

/* ---------- multiple-choice helper ----------
   q: {label, html, big, options:[html], answer:index, onNext, cols, explain}
   wrong picks are disabled and counted; the question stays until answered right. */
K.mcq = function(ctx, host, q){
  host.innerHTML = `
    <div class="qcard"><div class="qlabel">${q.label||""}</div><div class="qtext ${q.big?'big':''}">${q.html}</div></div>
    <div class="choices" style="${q.cols?`grid-template-columns:repeat(${q.cols},1fr)`:""}">
      ${q.options.map((o,i) => `<button class="choice" type="button" data-i="${i}">${o}</button>`).join("")}
    </div>`;
  let first = true;
  host.querySelector(".choices").onclick = e => {
    const b = e.target.closest(".choice"); if (!b || b.disabled) return;
    const i = +b.dataset.i;
    if (i === q.answer){
      b.classList.add("right");
      host.querySelectorAll(".choice").forEach(x => x.disabled = true);
      ctx.correct(first ? 100 : 50);
      ctx.after(750, q.onNext);
    } else {
      first = false; b.classList.add("wrong"); b.disabled = true;
      ctx.wrong(q.explain ? q.explain : undefined);
    }
  };
};
})();
