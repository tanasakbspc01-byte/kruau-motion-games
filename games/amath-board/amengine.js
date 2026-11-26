/* A-Math engine (ชุดประถม 70 ตัว): ตรวจสมการ + หาสมการทั้งหมดจากแป้น */
var AM = (() => {
"use strict";
const SET = [
  ["0", 4, 1], ["1", 4, 1], ["2", 4, 1], ["3", 4, 1], ["4", 4, 2], ["5", 3, 2], ["6", 3, 2], ["7", 2, 2], ["8", 3, 2], ["9", 2, 2],
  ["10", 1, 3], ["11", 1, 4], ["12", 1, 3], ["13", 1, 6], ["14", 1, 4], ["15", 1, 4], ["16", 1, 4], ["20", 1, 5],
  ["+", 4, 2], ["-", 4, 2], ["+/-", 5, 1], ["×/÷", 4, 1], ["=", 8, 1], ["?", 4, 0]
];
const PTS = {}, CNT = {}; SET.forEach(([k, c, p]) => { PTS[k] = p; CNT[k] = c; });
const BLANK_OPTS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "+", "-", "×", "÷", "="];
const opts = k => k === "+/-" ? ["+", "-"] : k === "×/÷" ? ["×", "÷"] : k === "?" ? BLANK_OPTS : [k];
const isDigit = s => s.length === 1 && s >= "0" && s <= "9";
const isTwo = s => s.length === 2;
const isNumSym = s => isDigit(s) || isTwo(s);
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
const R = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return [n / g, d / g]; };
const add = (a, b) => R(a[0] * b[1] + b[0] * a[1], a[1] * b[1]);
const sub = (a, b) => R(a[0] * b[1] - b[0] * a[1], a[1] * b[1]);
const mul = (a, b) => R(a[0] * b[0], a[1] * b[1]);
const div = (a, b) => b[0] === 0 ? null : R(a[0] * b[1], a[1] * b[0]);
function bag() { const b = []; SET.forEach(([k, c]) => { for (let i = 0; i < c; i++) b.push(k); }); return b; }

/* syms: array of resolved symbols ("0".."9","10".."20","+","-","×","÷","=") -> {ok, msg, value} */
function check(syms) {
  if (!syms.length) return { ok: false, msg: "ยังไม่ได้วางเบี้ย" };
  if (!syms.includes("=")) return { ok: false, msg: "ต้องมีเครื่องหมาย = อย่างน้อย 1 ตัว" };
  const sides = [[]]; syms.forEach(s => s === "=" ? sides.push([]) : sides[sides.length - 1].push(s));
  let val = null; const vals = [];
  for (const side of sides) {
    if (!side.length) return { ok: false, msg: "เครื่องหมาย = ต้องมีจำนวนอยู่ทั้งสองข้าง" };
    /* tokenize */
    const toks = []; let i = 0;
    if (side[0] === "-") { toks.push("neg"); i = 1; }
    if (["+", "×", "÷"].includes(side[0])) return { ok: false, msg: `ห้ามขึ้นต้นด้วยเครื่องหมาย ${side[0]}` };
    let expectNum = true;
    while (i < side.length) {
      const s = side[i];
      if (expectNum) {
        if (isTwo(s)) {
          if (i + 1 < side.length && isNumSym(side[i + 1])) return { ok: false, msg: `เบี้ย ${s} (2 หลัก) ห้ามต่อกับตัวเลขอื่น` };
          toks.push(+s); i++;
        } else if (isDigit(s)) {
          let j = i, str = ""; while (j < side.length && isDigit(side[j])) { str += side[j]; j++; }
          if (j < side.length && isTwo(side[j])) return { ok: false, msg: `เบี้ย ${side[j]} (2 หลัก) ห้ามต่อกับตัวเลขอื่น` };
          if (str.length > 3) return { ok: false, msg: `ต่อตัวเลขได้ไม่เกิน 3 หลัก (${str})` };
          if (str.length > 1 && str[0] === "0") return { ok: false, msg: `เลข 0 ห้ามอยู่หน้าจำนวน (${str})` };
          toks.push(+str); i = j;
        } else return { ok: false, msg: "มีเครื่องหมายติดกัน ต้องมีจำนวนคั่น" };
        expectNum = false;
      } else {
        if (!["+", "-", "×", "÷"].includes(s)) return { ok: false, msg: "จำนวนต้องคั่นด้วยเครื่องหมาย" };
        toks.push(s); i++; expectNum = true;
      }
    }
    if (expectNum) return { ok: false, msg: "ห้ามจบด้วยเครื่องหมาย" };
    let neg = false; if (toks[0] === "neg") { neg = true; toks.shift(); if (toks[0] === 0) return { ok: false, msg: "ห้ามใช้ −0" }; }
    /* evaluate × ÷ first */
    const terms = []; let cur = R(neg ? -toks[0] : toks[0]);
    for (let k = 1; k < toks.length; k += 2) {
      const op = toks[k], n = R(toks[k + 1]);
      if (op === "×") cur = mul(cur, n);
      else if (op === "÷") { cur = div(cur, n); if (!cur) return { ok: false, msg: "หารด้วย 0 ไม่ได้" }; }
      else { terms.push(cur); terms.push(op); cur = n; }
    }
    terms.push(cur);
    let v = terms[0]; for (let k = 1; k < terms.length; k += 2) v = terms[k] === "+" ? add(v, terms[k + 1]) : sub(v, terms[k + 1]);
    vals.push(v);
    if (val && (val[0] !== v[0] || val[1] !== v[1])) return { ok: false, msg: `ค่าแต่ละข้างไม่เท่ากัน (${vals.map(fmtR).join(" ≠ ")})`, vals };
    val = v;
  }
  return { ok: true, value: val };
}
const fmtR = r => r[1] === 1 ? String(r[0]) : `${r[0]}/${r[1]}`;
const score = tiles => tiles.reduce((a, k) => a + PTS[k], 0) + (tiles.length === 8 ? 40 : 0);

/* solve: tiles = kinds (length<=8). returns {list:[{syms,tiles(idx),score}], partial} */
function solve(tiles, opt = {}) {
  const maxMs = opt.maxMs || 1500, onlyLen = opt.onlyLen || 0, minLen = opt.minLen || 3;
  const t0 = Date.now(), n = tiles.length, used = new Array(n).fill(false);
  const seq = [], idx = [], found = new Map(); let partial = false, steps = 0;
  /* state: 0 start-of-side, 1 after unary minus, 2 digit run, 3 two-digit, 4 binary op */
  function rec(st, run, zero, eq) {
    if ((++steps & 1023) === 0 && Date.now() - t0 > maxMs) { partial = true; throw 0; }
    const L = seq.length;
    if ((st === 2 || st === 3) && eq > 0 && L >= minLen && (!onlyLen || L === onlyLen)) {
      const r = check(seq);
      if (r.ok) { const key = seq.join(" "); const ts = idx.map(i => tiles[i]); const sc = score(ts); const old = found.get(key); if (!old || old.score < sc) found.set(key, { syms: seq.slice(), tiles: idx.slice(), score: sc }); }
    }
    if (L === n) return;
    if (onlyLen && L >= onlyLen) return;
    const tried = new Set();
    for (let i = 0; i < n; i++) {
      if (used[i] || tried.has(tiles[i])) continue; tried.add(tiles[i]);
      used[i] = true; idx.push(i);
      for (const s of opts(tiles[i])) {
        let ns = -1, nr = 0, nz = false, ne = eq;
        if (isDigit(s)) {
          if (st === 0 || st === 1 || st === 4) { ns = 2; nr = 1; nz = s === "0"; }
          else if (st === 2 && run < 3 && !(run === 1 && zero)) { ns = 2; nr = run + 1; nz = zero; }
        } else if (isTwo(s)) { if (st === 0 || st === 1 || st === 4) ns = 3; }
        else if (s === "=") { if (st === 2 || st === 3) { ns = 0; ne = eq + 1; } }
        else if (s === "-") { if (st === 2 || st === 3) ns = 4; else if (st === 0) ns = 1; }
        else { if (st === 2 || st === 3) ns = 4; }
        if (ns < 0) continue;
        seq.push(s); rec(ns, nr, nz, ne); seq.pop();
      }
      idx.pop(); used[i] = false;
    }
  }
  try { rec(0, 0, false, 0); } catch (e) { if (e !== 0) throw e; }
  const list = [...found.values()].sort((a, b) => b.score - a.score || b.syms.length - a.syms.length);
  return { list, partial, ms: Date.now() - t0 };
}
/* draw a rack from a fresh bag; must contain '=' or blank */
function drawRack(n = 8) {
  for (;;) { const b = bag(), r = []; for (let i = 0; i < n; i++) r.push(b.splice(Math.floor(Math.random() * b.length), 1)[0]); if (r.some(k => k === "=" || k === "?")) return r; }
}
/* build a bingo rack: random valid 8-tile equation using real tile counts */
const RI = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
function numTiles(v, allowTwo) {
  if (allowTwo && [10, 11, 12, 13, 14, 15, 16, 20].includes(v) && Math.random() < .6) return [String(v)];
  return String(v).split("");
}
function makeBingo() {
  for (let t = 0; t < 4000; t++) {
    const pat = RI(0, 5); let syms = [];
    const a = RI(1, 20), b = RI(1, 20);
    const T = x => numTiles(x, true);
    if (pat === 0) { const c = a + b; syms = [...T(a), "+", ...T(b), "=", ...T(c)]; }
    else if (pat === 1) { const c = a * b; if (c > 999) continue; syms = [...T(a), "×", ...T(b), "=", ...T(c)]; }
    else if (pat === 2) { const c = a * b; if (c > 999) continue; syms = [...T(c), "÷", ...T(b), "=", ...T(a)]; }
    else if (pat === 3) { const c = RI(1, 20), d = a + b - c; if (d < 0) continue; syms = [...T(a), "+", ...T(b), "=", ...T(c), "+", ...T(d)]; }
    else if (pat === 4) { const c = RI(1, 9), d = a * c - b; if (d < 0) continue; syms = [...T(a), "×", ...T(c), "-", ...T(b), "=", ...T(d)]; }
    else { const c = a - b; if (c < 0) continue; syms = [...T(a), "-", ...T(b), "=", ...T(c)]; }
    if (Math.random() < .5) { const k = syms.indexOf("="); syms = [...syms.slice(k + 1), "=", ...syms.slice(0, k)]; }
    if (syms.length !== 8 || !check(syms).ok) continue;
    /* map symbols to tiles respecting counts */
    const left = Object.assign({}, CNT), tiles = []; let ok = true;
    for (const s of syms) {
      let k = s;
      if (s === "×" || s === "÷") k = "×/÷";
      else if ((s === "+" || s === "-") && (left[s] <= 0 || Math.random() < .4)) k = "+/-";
      if (left[k] > 0 && !(Math.random() < .06)) { left[k]--; tiles.push(k); }
      else if (left["?"] > 0) { left["?"]--; tiles.push("?"); }
      else { ok = false; break; }
    }
    if (!ok) continue;
    return { tiles: shuffle(tiles), example: syms };
  }
  return null;
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
return { SET, PTS, CNT, BLANK_OPTS, opts, check, solve, score, drawRack, makeBingo, shuffle, fmtR };
})();
if (typeof module !== "undefined") module.exports = AM;
