/* KruAu สื่อการสอน — ตัวขับสไลด์ แบบทดสอบ และกิจกรรม (แต่ละโฟลเดอร์มีสำเนาของตัวเอง) */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  /* {3/4} → เศษส่วนแบบตั้ง, {2 3/4} → จำนวนคละ */
  function fx(s) {
    return String(s)
      .replace(/\{(\d+) ([\d?]+)\/([\d?]+)\}/g, '<span class="mx">$1<span class="fr"><span>$2</span><span>$3</span></span></span>')
      .replace(/\{([^{}\/<>]+)\/([^{}\/<>]+)\}/g, '<span class="fr"><span>$1</span><span>$2</span></span>');
  }
  function store(k, v) {
    try {
      if (v === undefined) return localStorage.getItem(k);
      localStorage.setItem(k, v);
    } catch (e) { return null; }
  }

  /* ---------- เสียง ---------- */
  var actx = null, soundOn = store('kruau-media-sound') !== 'off';
  function tone(freqs, dur) {
    if (!soundOn) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      freqs.forEach(function (f, i) {
        var o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + i * dur;
        o.type = 'triangle'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
      });
    } catch (e) { /* ไม่มีเสียงก็ใช้งานได้ */ }
  }
  var sound = {
    good: function () { tone([660, 880], 0.12); },
    bad: function () { tone([300, 220], 0.16); },
    win: function () { tone([523, 659, 784, 1046], 0.13); },
    tap: function () { tone([520], 0.06); }
  };

  function confetti() {
    var box = document.createElement('div'), cols = ['#FF5C7A', '#FFC93C', '#2ECC71', '#3FA9F5', '#9B6CF0', '#FF9F43'];
    box.className = 'confetti';
    for (var i = 0; i < 70; i++) {
      var p = document.createElement('i');
      p.style.left = Math.random() * 100 + '%';
      p.style.background = cols[i % cols.length];
      p.style.animationDuration = 1.8 + Math.random() * 1.6 + 's';
      p.style.animationDelay = Math.random() * 0.5 + 's';
      box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(function () { box.remove(); }, 4200);
  }
  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 1800);
  }

  /* ---------- คะแนนรวม ---------- */
  var score = {};
  function totals() {
    var g = 0, n = 0;
    Object.keys(score).forEach(function (k) { g += score[k][0]; n += score[k][1]; });
    return [g, n];
  }
  function starsFor(g, n) {
    var r = n ? g / n : 0;
    return r >= 0.9 ? 3 : r >= 0.6 ? 2 : r > 0 ? 1 : 0;
  }
  function starText(s) { return '⭐'.repeat(s) + '☆'.repeat(3 - s); }

  /* ---------- แบบทดสอบปรนัย ---------- */
  function Quiz(el, items, opt) {
    opt = opt || {};
    var name = el.getAttribute('data-quiz'), order, i, good, answered;
    function start() { order = opt.keepOrder ? items.slice() : shuffle(items); i = 0; good = 0; show(); }
    function show() {
      answered = false;
      var q = order[i], idx = q.c.map(function (_, k) { return k; });
      if (!q.fixed) idx = shuffle(idx);
      el.innerHTML = '<div class="qhead"><span>ข้อ ' + (i + 1) + ' / ' + order.length + '</span><span>✅ ' + good + '</span></div>' +
        '<div class="qq pop">' + fx(q.q) + '</div>' +
        '<div class="qc">' + idx.map(function (k, n) {
          return '<button data-k="' + k + '"><span class="k">' + 'กขคง'[n] + '</span><span>' + fx(q.c[k]) + '</span></button>';
        }).join('') + '</div><div class="why hidden"></div>' +
        '<div class="row center"><button class="btn hidden" data-go>' + (i + 1 < order.length ? 'ข้อต่อไป ➜' : 'ดูผลคะแนน 🏁') + '</button></div>';
      $$('.qc button', el).forEach(function (b) {
        b.onclick = function () {
          if (answered) return;
          answered = true;
          var k = +b.getAttribute('data-k'), ok = k === q.a, why = $('.why', el);
          $$('.qc button', el).forEach(function (x) {
            x.disabled = true;
            if (+x.getAttribute('data-k') === q.a) x.classList.add('ok');
          });
          if (!ok) b.classList.add('no');
          if (ok) { good++; sound.good(); } else sound.bad();
          why.className = 'why pop ' + (ok ? 'good' : 'bad');
          why.innerHTML = (ok ? '🎉 <b>ถูกต้อง!</b> ' : '💡 <b>ยังไม่ถูก ลองดูเหตุผลนะ</b> ') + fx(q.w || '');
          $('[data-go]', el).classList.remove('hidden');
          $('.qhead span:last-child', el).textContent = '✅ ' + good;
        };
      });
      $('[data-go]', el).onclick = function () { i++; if (i < order.length) show(); else done(); };
    }
    function done() {
      score[name] = [good, order.length];
      var s = starsFor(good, order.length);
      el.innerHTML = '<div class="result card c-yellow pop"><div class="stars">' + starText(s) + '</div>' +
        '<div class="big">ได้ ' + good + ' จาก ' + order.length + ' ข้อ</div>' +
        '<p>' + (s === 3 ? 'เก่งมาก! เข้าใจครบเลย 🏆' : s === 2 ? 'ดีมาก! ทบทวนข้อที่ผิดอีกนิดนะ 💪' : 'ไม่เป็นไร ย้อนกลับไปอ่านแล้วลองใหม่ได้นะ 🌱') + '</p>' +
        '<div class="row center"><button class="btn ghost" data-again>🔁 ทำอีกครั้ง</button>' +
        (opt.noNext ? '' : '<button class="btn" data-next>ไปต่อ ➜</button>') + '</div></div>';
      if (s >= 2) { sound.win(); confetti(); }
      $('[data-again]', el).onclick = start;
      var nx = $('[data-next]', el); if (nx) nx.onclick = function () { K.go(K.cur + 1); };
      if (opt.onDone) opt.onDone(good, order.length);
    }
    start();
  }

  /* ---------- คัดแยก: แตะการ์ด แล้วแตะกล่อง ---------- */
  function Sorter(el, cfg) {
    var name = el.getAttribute('data-sorter'), sel = null, left, wrong;
    function start() {
      wrong = 0; left = cfg.items.length; sel = null;
      el.innerHTML = '<p class="sub">👆 แตะการ์ด 1 ใบ แล้วแตะกล่องที่ถูกต้อง</p><div class="pool"></div><div class="bins"></div><div class="feedback"></div>';
      var pool = $('.pool', el), bins = $('.bins', el);
      shuffle(cfg.items).forEach(function (it) {
        var b = document.createElement('button');
        b.className = 'chip'; b.innerHTML = fx(it.t); b._k = it.k; b._w = it.w;
        b.onclick = function () {
          sound.tap();
          $$('.chip', el).forEach(function (x) { x.classList.remove('sel'); });
          sel = b; b.classList.add('sel');
          $$('.bin', el).forEach(function (x) { x.classList.add('ready'); });
        };
        pool.appendChild(b);
      });
      cfg.bins.forEach(function (bn) {
        var d = document.createElement('div');
        d.className = 'bin'; d.style.setProperty('--c', bn.c || 'var(--blue)');
        d.innerHTML = '<b>' + fx(bn.t) + '</b><div class="got"></div>';
        d.setAttribute('role', 'button'); d.tabIndex = 0;
        d.onclick = function () {
          if (!sel) { toast('แตะการ์ดก่อนนะ 👆'); return; }
          $$('.bin', el).forEach(function (x) { x.classList.remove('ready'); });
          var fb = $('.feedback', el);
          if (sel._k === bn.k) {
            sound.good();
            var s = document.createElement('span'); s.innerHTML = sel.innerHTML; $('.got', d).appendChild(s);
            sel.remove(); sel = null; left--;
            fb.innerHTML = '<span class="t-green">✅ ถูกต้อง!</span>';
            if (!left) finish();
          } else {
            sound.bad(); wrong++;
            sel.classList.add('no');
            var c = sel; setTimeout(function () { c.classList.remove('no'); }, 450);
            fb.innerHTML = '<span class="t-red">❌ ยังไม่ใช่</span>' + (sel._w ? ' — ' + fx(sel._w) : ' ลองคิดอีกครั้งนะ');
          }
        };
        bins.appendChild(d);
      });
    }
    function finish() {
      var n = cfg.items.length, g = Math.max(0, n - wrong);
      score[name] = [g, n];
      var fb = $('.feedback', el);
      fb.innerHTML = '<div class="card c-green pop center"><div class="big">🎉 คัดแยกครบแล้ว!</div><p>ตอบผิด ' + wrong + ' ครั้ง ' + starText(starsFor(g, n)) +
        '</p><div class="row center" style="margin-top:8px"><button class="btn ghost">🔁 เล่นอีกครั้ง</button></div></div>';
      $('button', fb).onclick = start;
      $('.pool', el).classList.add('hidden');
      sound.win(); if (!wrong) confetti();
    }
    start();
  }

  /* ---------- เรียงลำดับขั้นตอน: แตะตามลำดับ ---------- */
  function Order(el, cfg) {
    var name = el.getAttribute('data-order'), next, wrong;
    var steps = cfg.items || cfg, hint = cfg.hint || '👆 แตะขั้นตอนเรียงจากขั้นแรกไปขั้นสุดท้าย', unit = cfg.unit || 'ขั้นที่';
    function start() {
      next = 0; wrong = 0;
      el.innerHTML = '<p class="sub">' + hint + '</p><div class="order"></div><div class="feedback"></div>';
      var box = $('.order', el);
      shuffle(steps.map(function (s, k) { return { s: s, k: k }; })).forEach(function (o) {
        var b = document.createElement('button');
        b.innerHTML = '<span class="n">?</span><span>' + fx(o.s) + '</span>';
        b.onclick = function () {
          if (b.classList.contains('done')) return;
          var fb = $('.feedback', el);
          if (o.k === next) {
            sound.good(); b.classList.add('done'); $('.n', b).textContent = next + 1; next++;
            box.appendChild(b);
            fb.innerHTML = '<span class="t-green">✅ ถูกต้อง ' + unit + ' ' + next + '</span>';
            $$('button:not(.done)', box).forEach(function (x) { box.appendChild(x); });
            if (next === steps.length) {
              var g = Math.max(0, steps.length - wrong);
              score[name] = [g, steps.length];
              fb.innerHTML = '<div class="card c-green pop center"><div class="big">🎉 เรียงครบแล้ว!</div><p>แตะผิด ' + wrong + ' ครั้ง ' + starText(starsFor(g, steps.length)) +
                '</p><div class="row center" style="margin-top:8px"><button class="btn ghost">🔁 เล่นอีกครั้ง</button></div></div>';
              $('button', fb).onclick = start;
              sound.win(); if (!wrong) confetti();
            }
          } else {
            sound.bad(); wrong++; b.classList.add('no');
            setTimeout(function () { b.classList.remove('no'); }, 450);
            fb.innerHTML = '<span class="t-red">❌ ยังไม่ใช่' + unit + ' ' + (next + 1) + ' ลองใหม่นะ</span>';
          }
        };
        box.appendChild(b);
      });
    }
    start();
  }

  /* ---------- ตัวขับสไลด์ ---------- */
  var K = {
    cur: 0, slides: [], fx: fx, shuffle: shuffle, sound: sound, confetti: confetti, toast: toast, score: score,
    quizzes: {}, sorters: {}, orders: {}, onShow: {},
    totals: totals, starsFor: starsFor, starText: starText,
    Quiz: Quiz, Sorter: Sorter, Order: Order,
    go: function (n, instant) {
      var S = K.slides;
      n = Math.max(0, Math.min(S.length - 1, n));
      S.forEach(function (s, k) {
        s.classList.toggle('on', k === n);
        s.classList.toggle('left', k < n);
        if (k === n) { s.scrollTop = 0; s.removeAttribute('aria-hidden'); } else s.setAttribute('aria-hidden', 'true');
      });
      if (n !== K.cur && !instant) sound.tap();
      K.cur = n;
      $$('.dots button').forEach(function (d, k) { d.classList.toggle('on', k === n); if (k < n) d.classList.add('done'); });
      $('.prog i').style.width = ((n + 1) / S.length * 100) + '%';
      $('.count').textContent = (n + 1) + ' / ' + S.length;
      $('[data-prev]').disabled = n === 0;
      var nx = $('[data-nextslide]');
      nx.textContent = n === S.length - 1 ? '🏠 เริ่มใหม่' : 'ถัดไป ▶';
      var id = S[n].getAttribute('data-id');
      if (id && K.onShow[id]) K.onShow[id](S[n]);
      if (S[n].hasAttribute('data-final')) K.final(S[n]);
    },
    final: function (sl) {
      var box = $('[data-score]', sl); if (!box) return;
      var t = totals();
      if (!t[1]) { box.innerHTML = '<p>ทำแบบฝึกหัดในสื่อนี้ให้ครบ แล้วกลับมาดูคะแนนรวมได้นะ 😊</p>'; return; }
      var s = starsFor(t[0], t[1]);
      box.innerHTML = '<div class="stars">' + starText(s) + '</div><div class="big">คะแนนรวม ' + t[0] + ' / ' + t[1] + '</div>';
      if (s >= 2) { confetti(); sound.win(); }
    },
    init: function () {
      var stage = $('.stage');
      stage.innerHTML = fx(stage.innerHTML);
      K.slides = $$('.slide', stage);
      var dots = $('.dots');
      K.slides.forEach(function (s, k) {
        var d = document.createElement('button');
        d.setAttribute('aria-label', 'ไปหน้า ' + (k + 1) + ' ' + (s.getAttribute('data-title') || ''));
        d.title = s.getAttribute('data-title') || '';
        d.onclick = function () { K.go(k); };
        dots.appendChild(d);
      });
      $('[data-prev]').onclick = function () { K.go(K.cur - 1); };
      $('[data-nextslide]').onclick = function () { K.go(K.cur === K.slides.length - 1 ? 0 : K.cur + 1); };
      document.addEventListener('keydown', function (e) {
        if (/INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || '')) return;
        if (e.key === 'ArrowRight' || e.key === 'PageDown') K.go(K.cur + 1);
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') K.go(K.cur - 1);
      });
      /* ปัดซ้าย-ขวาบน iPad */
      var sx = 0, sy = 0, ok = false;
      stage.addEventListener('touchstart', function (e) {
        var t = e.target;
        ok = e.touches.length === 1 && !(t.closest && t.closest('input,textarea,select,.noswipe'));
        if (ok) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }
      }, { passive: true });
      stage.addEventListener('touchend', function (e) {
        if (!ok) return;
        var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
        if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 1.6) K.go(K.cur + (dx < 0 ? 1 : -1));
      }, { passive: true });
      /* ปุ่มบนแถบ */
      var snd = $('[data-sound]');
      function paintSnd() { snd.textContent = soundOn ? '🔊' : '🔇'; snd.setAttribute('aria-label', soundOn ? 'ปิดเสียง' : 'เปิดเสียง'); }
      snd.onclick = function () { soundOn = !soundOn; store('kruau-media-sound', soundOn ? 'on' : 'off'); paintSnd(); sound.tap(); };
      paintSnd();
      var fs = $('[data-fs]'), root = document.documentElement;
      var req = root.requestFullscreen || root.webkitRequestFullscreen;
      if (!req || !(document.fullscreenEnabled || document.webkitFullscreenEnabled)) fs.classList.add('hidden');
      fs.onclick = function () {
        var on = document.fullscreenElement || document.webkitFullscreenElement;
        try {
          if (on) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
          else req.call(root);
        } catch (e) { toast('เปิดเต็มจอไม่ได้ในเครื่องนี้'); }
      };
      $('[data-home]').onclick = function () { K.go(0); };
      /* ขั้นตอนเปิดทีละขั้น */
      $$('[data-reveal]').forEach(function (b) {
        var box = document.getElementById(b.getAttribute('data-reveal'));
        var label = b.innerHTML;
        b.onclick = function () {
          var hid = $$('.step:not(.show)', box);
          if (!hid.length) { $$('.step', box).forEach(function (x) { x.classList.remove('show'); }); b.innerHTML = label; return; }
          hid[0].classList.add('show'); sound.tap();
          hid[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          if (hid.length === 1) b.innerHTML = '🔁 ดูใหม่ตั้งแต่ต้น';
        };
      });
      /* การ์ดพลิก */
      $$('.flip').forEach(function (f) { f.onclick = function () { f.classList.toggle('open'); sound.tap(); }; });
      /* กิจกรรม */
      $$('[data-quiz]').forEach(function (el) {
        var n = el.getAttribute('data-quiz');
        if (K.quizzes[n]) Quiz(el, K.quizzes[n], { noNext: el.hasAttribute('data-nonext') });
      });
      $$('[data-sorter]').forEach(function (el) { var c = K.sorters[el.getAttribute('data-sorter')]; if (c) Sorter(el, c); });
      $$('[data-order]').forEach(function (el) { var c = K.orders[el.getAttribute('data-order')]; if (c) Order(el, c); });
      if (K.setup) K.setup();
      K.go(0, true);
    }
  };
  window.Kit = K;
  document.addEventListener('DOMContentLoaded', function () { K.init(); });
})();
