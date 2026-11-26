/* คิดเลขเร็ว: สุ่มโจทย์ตามกติกา + ตัวแปลงนิพจน์ + ตัวหาคำตอบที่ตรง/ใกล้ที่สุด */
var KL = (() => {
"use strict";
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
const R = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return [n / g, d / g]; };
const LIM = 1e7;
const ok = r => r && Number.isFinite(r[0]) && Math.abs(r[0]) <= LIM && r[1] <= 10000;
const OPS = {
  "+": (a, b) => R(a[0] * b[1] + b[0] * a[1], a[1] * b[1]),
  "−": (a, b) => R(a[0] * b[1] - b[0] * a[1], a[1] * b[1]),
  "×": (a, b) => R(a[0] * b[0], a[1] * b[1]),
  "÷": (a, b) => b[0] === 0 ? null : R(a[0] * b[1], a[1] * b[0]),
  "^": (a, b) => { if (b[1] !== 1 || b[0] < 0 || b[0] > 20) return null; if (a[0] === 0 && b[0] === 0) return null; const n = Math.pow(a[0], b[0]), d = Math.pow(a[1], b[0]); return Math.abs(n) > LIM || d > 10000 ? null : R(n, d); }
};
function iroot(x, n) { if (x < 0) return null; const r = Math.round(Math.pow(x, 1 / n)); for (const c of [r - 1, r, r + 1]) if (c >= 0 && Math.pow(c, n) === x) return c; return null; }
function root(a, n) { if (a[0] < 0) return null; const p = iroot(a[0], n), q = iroot(a[1], n); return p === null || q === null ? null : R(p, q); }
const val = r => r[0] / r[1];
const fmtR = r => r[1] === 1 ? String(r[0]) : `${r[0]}/${r[1]}`;

/* ---------- generate problem ---------- */
function digitsOK(ds) { const c = {}; for (const d of ds) { c[d] = (c[d] || 0) + 1; if (c[d] > 2) return false; } return (c[0] || 0) <= 1; }
function problem(n) {
  let ds; do { ds = Array.from({ length: n }, () => Math.floor(Math.random() * 10)); } while (!digitsOK(ds));
  const tlen = n === 4 ? 2 : 3; let t = 0; while (t < Math.pow(10, tlen - 1)) t = Math.floor(Math.random() * Math.pow(10, tlen));
  return { digits: ds, target: t };
}

/* ---------- parser (tokens) ---------- */
/* token: {t:"d",v,i} digit (i = index in problem digits) | {t:"op",v:"+−×÷^"} | {t:"("} | {t:")"} | {t:"sqrt"} | {t:"nroot"} */
function parse(tokens, allowRoot) {
  let p = 0, rootDepth = 0;
  const err = m => { throw new Error(m); };
  const peek = () => tokens[p];
  function expr() { let v = term(); while (peek() && peek().t === "op" && (peek().v === "+" || peek().v === "−")) { const o = tokens[p++].v; v = OPS[o](v, term()); } return v; }
  function term() { let v = power(); while (peek() && peek().t === "op" && (peek().v === "×" || peek().v === "÷")) { const o = tokens[p++].v; const b = power(); const r = OPS[o](v, b); if (!r) err("หารด้วย 0 ไม่ได้"); v = r; } return v; }
  function power() { const b = unary(); if (peek() && peek().t === "op" && peek().v === "^") { p++; const e = power(); const r = OPS["^"](b, e); if (!r) err("เลขชี้กำลังต้องเป็นจำนวนนับ และผลต้องไม่ใหญ่เกินไป"); return r; } return b; }
  function unary() {
    const tk = peek(); if (!tk) err("นิพจน์ยังไม่จบ");
    if (tk.t === "sqrt") { if (!allowRoot) err("ระดับ ป.1–3 ใช้การถอดรากไม่ได้"); if (rootDepth) err("ถอดรากได้ชั้นเดียว"); p++; rootDepth++; const a = unary(); rootDepth--; const r = root(a, 2); if (!r) err("ถอดรากที่สองแล้วต้องได้จำนวนเต็ม"); return r; }
    if (tk.t === "d" && tokens[p + 1] && tokens[p + 1].t === "nroot") { if (!allowRoot) err("ระดับ ป.1–3 ใช้การถอดรากไม่ได้"); if (rootDepth) err("ถอดรากได้ชั้นเดียว"); const n = tk.v; if (n < 2) err("อันดับที่ของรากต้องเป็น 2 ขึ้นไป"); p += 2; rootDepth++; const a = unary(); rootDepth--; const r = root(a, n); if (!r) err(`ถอดรากที่ ${n} แล้วต้องได้จำนวนเต็ม`); return r; }
    return primary();
  }
  function primary() {
    const tk = peek(); if (!tk) err("นิพจน์ยังไม่จบ");
    if (tk.t === "d") { p++; if (peek() && peek().t === "d") err("ต้องมีเครื่องหมายคั่นระหว่างตัวเลข (ห้ามนำเลขมาต่อกัน)"); if (peek() && (peek().t === "(" || peek().t === "sqrt")) err("ต้องมีเครื่องหมายก่อนวงเล็บ/ราก"); return R(tk.v); }
    if (tk.t === "(") { p++; const v = expr(); if (!peek() || peek().t !== ")") err("วงเล็บยังไม่ปิด"); p++; if (peek() && (peek().t === "d" || peek().t === "(" || peek().t === "sqrt")) err("ต้องมีเครื่องหมายหลังวงเล็บ"); return v; }
    if (tk.t === ")") err("วงเล็บปิดเกิน");
    err("วางเครื่องหมายติดกันไม่ได้");
  }
  if (!tokens.length) throw new Error("ยังไม่ได้เขียนวิธีคิด");
  const v = expr(); if (p < tokens.length) err(tokens[p].t === ")" ? "วงเล็บปิดเกิน" : "นิพจน์ไม่ถูกต้อง");
  return v;
}
function evalTokens(tokens, allowRoot) { try { return { ok: true, v: parse(tokens, allowRoot) }; } catch (e) { return { ok: false, msg: e.message }; } }

/* ---------- solver: exact or closest using every digit once ---------- */
function solve(digits, target, allowRoot, maxMs = 1500) {
  const n = digits.length, full = (1 << n) - 1, t0 = Date.now();
  const M = new Array(1 << n);
  const cx = e => e.length + 6 * (e.split("√").length - 1) + 3 * (e.split("^").length - 1);
  const add = (map, r, e, rt, pr) => { if (!ok(r)) return; const k = r[0] + "/" + r[1]; const o = map.get(k); if (!o || cx(e) < o.c) map.set(k, { r, e, rt, pr, c: cx(e) }); };
  /* pr: precedence of top-level op for bracket display: 9 atom, 3 ^, 2 ×÷, 1 +− */
  for (let i = 0; i < n; i++) {
    const m = new Map(); const d = digits[i];
    add(m, R(d), String(d), false, 9);
    if (allowRoot) { const s = root(R(d), 2); if (s) add(m, s, `√${d}`, true, 8); }
    M[1 << i] = m;
  }
  /* nth root: index digit i applied to value of mask (without i) — handled as binary op */
  const wrap = (x, need) => x.pr < need ? `(${x.e})` : x.e;
  let timedOut = false;
  const masks = []; for (let m = 1; m <= full; m++) masks.push(m);
  masks.sort((a, b) => pop(a) - pop(b));
  for (const mask of masks) {
    if (pop(mask) < 2) continue;
    const out = new Map();
    for (let a = (mask - 1) & mask; a > 0; a = (a - 1) & mask) {
      const b = mask ^ a; if (!b) continue;
      const A = M[a], B = M[b]; if (!A || !B) continue;
      for (const x of A.values()) {
        if (Date.now() - t0 > maxMs) { timedOut = true; break; }
        for (const y of B.values()) {
          if (a < b) {
            add(out, OPS["+"](x.r, y.r), `${wrap(x, 1)} + ${wrap(y, 1)}`, x.rt || y.rt, 1);
            add(out, OPS["×"](x.r, y.r), `${wrap(x, 2)} × ${wrap(y, 2)}`, x.rt || y.rt, 2);
          }
          add(out, OPS["−"](x.r, y.r), `${wrap(x, 1)} − ${wrap(y, 2)}`, x.rt || y.rt, 1);
          const dv = OPS["÷"](x.r, y.r); if (dv) add(out, dv, `${wrap(x, 2)} ÷ ${wrap(y, 3)}`, x.rt || y.rt, 2);
          const pw = OPS["^"](x.r, y.r); if (pw) add(out, pw, `${wrap(x, 9)}^${y.pr === 9 ? y.e : "(" + y.e + ")"}`, x.rt || y.rt, 3);
          if (allowRoot && pop(a) === 1 && !y.rt && x.r[1] === 1 && x.r[0] >= 3 && x.e === String(x.r[0])) {
            const rr = root(y.r, x.r[0]); if (rr) add(out, rr, `${x.r[0]}√${wrap(y, 9)}`, true, 8);
          }
        }
      }
      if (timedOut) break;
    }
    if (allowRoot) for (const x of [...out.values()]) if (!x.rt) { const s = root(x.r, 2); if (s) add(out, s, `√(${x.e})`, true, 8); }
    M[mask] = out;
    if (timedOut) break;
  }
  const fin = M[full] || new Map();
  let best = null, bd = Infinity;
  const pool = [...fin.values()].filter(x => x.r[1] === 1 && x.r[0] > 0);
  for (const x of pool) { const d = Math.abs(val(x.r) - target); if (d < bd - 1e-9 || (Math.abs(d - bd) < 1e-9 && best && x.c < best.c)) { bd = d; best = x; } }
  const exact = [...fin.values()].filter(x => x.r[1] === 1 && x.r[0] === target).sort((p, q) => p.c - q.c).slice(0, 3);
  return { best, dist: bd, exact, timedOut, count: fin.size };
}
function pop(m) { let k = 0; while (m) { m &= m - 1; k++; } return k; }
return { problem, parse, evalTokens, solve, fmtR, val, R };
})();
if (typeof module !== "undefined") module.exports = KL;
