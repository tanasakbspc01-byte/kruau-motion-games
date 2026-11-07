/* Block-world helpers on top of KIT: tier names, hearts with checkpoint respawn, coins, obby progress strip, rank badge. */
(function(){
const BK = window.BK = {};
KIT.TIER = ["", "มือใหม่", "โปร", "ตำนาน"];
const SHIRTS = ["#FF5D8F","#2F80ED","#3DBE5A","#FF9F1C","#8B5CF6","#00B8D9","#E5484D"];
BK.avatar = (shirt="#2F80ED", pants="#1F2A44", skin="#FFD7A8") => `<svg viewBox="0 0 40 56" aria-hidden="true"><rect x="10" y="1" width="20" height="17" rx="2" fill="${skin}" stroke="#1F2A44" stroke-width="2"/><rect x="15" y="7" width="3" height="3" fill="#1F2A44"/><rect x="23" y="7" width="3" height="3" fill="#1F2A44"/><path d="M16 13 h9" stroke="#1F2A44" stroke-width="2"/><rect x="8" y="19" width="24" height="18" rx="1" fill="${shirt}" stroke="#1F2A44" stroke-width="2"/><rect x="1" y="19" width="7" height="17" rx="1" fill="${skin}" stroke="#1F2A44" stroke-width="2"/><rect x="32" y="19" width="7" height="17" rx="1" fill="${skin}" stroke="#1F2A44" stroke-width="2"/><rect x="8" y="37" width="11" height="17" rx="1" fill="${pants}" stroke="#1F2A44" stroke-width="2"/><rect x="21" y="37" width="11" height="17" rx="1" fill="${pants}" stroke="#1F2A44" stroke-width="2"/></svg>`;
BK.shirtFor = name => { let h = 0; for (const c of String(name)) h = (h*31 + c.charCodeAt(0)) >>> 0; return SHIRTS[h % SHIRTS.length]; };

BK.mount = function(cfg){
  const play = cfg.play;
  cfg.play = function(level, ctx){
    const S = {hearts:3, coins:0, done:0, total:0};
    /* HUD strip lives just above the stage */
    let bar = document.getElementById("bkBar");
    if (!bar){ bar = document.createElement("div"); bar.id = "bkBar"; bar.className = "bk-bar"; ctx.stage.parentNode.insertBefore(bar, ctx.stage); }
    const shirt = BK.shirtFor(ctx.name);
    bar.innerHTML = `<span class="bk-hearts" id="bkH"></span><span class="bk-coins" id="bkC">🪙 0</span>
      <div class="bk-track" id="bkT"><span class="flag">🏁</span><span class="av" id="bkA" style="left:4%">${BK.avatar(shirt)}</span></div>`;
    const $ = id => document.getElementById(id);
    const drawHearts = () => { $("bkH").innerHTML = [0,1,2].map(i => `<span class="${i < S.hearts ? "" : "off"}">❤️</span>`).join(""); };
    const drawTrack = n => {
      const T = $("bkT"); T.querySelectorAll(".pf").forEach(p => p.remove());
      const k = Math.max(2, Math.min(14, n));
      for (let i=0;i<k;i++){ const p = document.createElement("span"); p.className = "pf" + ((i+1) % 5 === 0 ? " cp" : ""); p.style.left = (6 + i*(86/(k-1))) + "%"; T.insertBefore(p, T.firstChild); }
    };
    const moveAv = (cls) => { const a = $("bkA"); if (!a) return; const f = S.total ? S.done / S.total : 0; a.style.left = (6 + f*86) + "%"; a.classList.remove("jump","fall"); void a.offsetWidth; if (cls) a.classList.add(cls); };
    drawHearts();
    const pop = (txt) => { const el = document.createElement("div"); el.className = "bk-pop"; el.textContent = txt;
      const r = ctx.stage.getBoundingClientRect(); el.style.left = (r.left + r.width/2 - 30) + "px"; el.style.top = Math.max(80, r.top + 40) + "px"; document.body.appendChild(el); setTimeout(() => el.remove(), 950); };
    const oc = ctx.correct, ow = ctx.wrong, op = ctx.progress;
    ctx.correct = (base=100, msg) => { const g = oc(base, msg); if (g){ const c = Math.max(1, Math.round(g/10)); S.coins += c; $("bkC").textContent = "🪙 " + S.coins; pop("+" + c + " 🪙"); } return g; };
    ctx.wrong = (msg, pen=10) => {
      ow(msg, pen); S.hearts--; drawHearts(); moveAv("fall");
      if (S.hearts <= 0){
        S.hearts = 3; S.coins = Math.max(0, S.coins - 5); $("bkC").textContent = "🪙 " + S.coins;
        const o = document.createElement("div"); o.className = "bk-respawn"; o.innerHTML = "💥 หัวใจหมด!<br>รีสปอนที่เช็กพอยต์ (−5 🪙)"; document.body.appendChild(o);
        setTimeout(() => { o.remove(); drawHearts(); }, 1400);
      }
    };
    ctx.progress = (done, total) => { op(done, total); const first = S.total !== total; S.total = total; if (first) drawTrack(total); const moved = done > S.done; S.done = done; moveAv(moved ? "jump" : null); };
    ctx.cleanup(() => { const o = document.querySelector(".bk-respawn"); if (o) o.remove(); });
    play(level, ctx);
  };
  KIT.mount(cfg);
  /* swap the cat mascots for a block avatar */
  document.querySelectorAll(".hero-cat").forEach(el => { const d = document.createElement("div"); d.className = "bk-avatar-hero"; d.innerHTML = BK.avatar("#FF5D8F"); el.replaceWith(d); });
  document.querySelectorAll(".brand svg").forEach(el => { const d = document.createElement("div"); d.style.cssText = "width:40px;height:52px;flex:none"; d.innerHTML = BK.avatar("#FFD23F"); el.replaceWith(d); });
  /* rank badge on the result card */
  const res = document.getElementById("kResult");
  if (res) new MutationObserver(() => {
    if (!res.classList.contains("open")) return;
    const st = document.querySelectorAll("#kStars span:not(.off)").length;
    const rk = st >= 3 ? "💎 แรงก์เพชร" : st === 2 ? "🥇 แรงก์ทอง" : "🥈 แรงก์เงิน";
    let b = document.getElementById("bkRank"); if (!b){ b = document.createElement("div"); b.id = "bkRank"; b.className = "bk-rank"; document.getElementById("kStars").after(b); }
    b.textContent = rk;
  }).observe(res, {attributes:true, attributeFilter:["class"]});
};
})();
