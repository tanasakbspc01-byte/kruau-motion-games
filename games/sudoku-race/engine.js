/* Sudoku engine: geometry, jigsaw regions, solver, generator (logic-graded) */
var SDK = (() => {
"use strict";
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pop = m => { let k = 0; while (m) { m &= m - 1; k++; } return k; };
const bitsOf = m => { const o = []; for (let v = 1; v < 10; v++) if (m & (1 << v)) o.push(v); return o; };

const TYPES = [
  { id: "c6", n: 6, sym: "num", name: "6×6 Classic", th: "ซูโดกุ 6×6 พื้นฐาน", rule: "เติมตัวเลข 1–6 แนวตั้ง แนวนอน และตารางย่อย ห้ามซ้ำ" },
  { id: "a6", n: 6, sym: "en", name: "6×6 Alphabet", th: "ซูโดกุ 6×6 ตัวอักษร", rule: "เติม A–F แนวตั้ง แนวนอน และตารางย่อย ห้ามซ้ำ" },
  { id: "d6", n: 6, sym: "num", diag: 1, name: "6×6 Diagonal", th: "ซูโดกุ 6×6 ทแยงมุม", rule: "เติม 1–6 แนวตั้ง แนวนอน ตารางย่อย และเส้นทแยงมุม 2 เส้น ห้ามซ้ำ" },
  { id: "j6", n: 6, sym: "num", jig: 1, name: "6×6 Jigsaw", th: "ซูโดกุ 6×6 จิ๊กซอว์", rule: "เติม 1–6 แนวตั้ง แนวนอน และตารางย่อยที่ตีกรอบเส้นหนา ห้ามซ้ำ" },
  { id: "t6", n: 6, sym: "th", name: "6×6 Thai Alphabet", th: "ซูโดกุ 6×6 อักษรไทย", rule: "เติม ก ข ค ง จ ฉ แนวตั้ง แนวนอน และตารางย่อย ห้ามซ้ำ" },
  { id: "c9", n: 9, sym: "num", name: "9×9 Classic", th: "ซูโดกุ 9×9 พื้นฐาน", rule: "เติมตัวเลข 1–9 แนวตั้ง แนวนอน และตารางย่อย ห้ามซ้ำ" },
  { id: "a9", n: 9, sym: "en", name: "9×9 Alphabet", th: "ซูโดกุ 9×9 ตัวอักษร", rule: "เติม A–I แนวตั้ง แนวนอน และตารางย่อย ห้ามซ้ำ" },
  { id: "d9", n: 9, sym: "num", diag: 1, name: "9×9 Diagonal", th: "ซูโดกุ 9×9 ทแยงมุม", rule: "เติม 1–9 แนวตั้ง แนวนอน ตารางย่อย และเส้นทแยงมุม 2 เส้น ห้ามซ้ำ" },
  { id: "j9", n: 9, sym: "num", jig: 1, name: "9×9 Jigsaw", th: "ซูโดกุ 9×9 จิ๊กซอว์", rule: "เติม 1–9 แนวตั้ง แนวนอน และตารางย่อยที่ตีกรอบเส้นหนา ห้ามซ้ำ" },
  { id: "e9", n: 9, sym: "num", eo: 1, name: "9×9 Even-Odd", th: "ซูโดกุ 9×9 คู่-คี่", rule: "เติม 1–9 แนวตั้ง แนวนอน และตารางย่อย ห้ามซ้ำ ช่องแรเงาต้องเป็นเลขคู่เท่านั้น" }
];
const SYMS = { num: "_123456789", en: "_ABCDEFGHI", th: "_กขคงจฉ" };

function boxRegions(n) {
  const br = n === 6 ? 2 : 3, bc = 3, out = new Array(n * n);
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) out[r * n + c] = Math.floor(r / br) * (n / bc) + Math.floor(c / bc);
  return out;
}
function nbrs(n, i) { const r = Math.floor(i / n), c = i % n, o = []; if (r) o.push(i - n); if (r < n - 1) o.push(i + n); if (c) o.push(i - 1); if (c < n - 1) o.push(i + 1); return o; }
function connected(n, reg, id) {
  const cells = []; for (let i = 0; i < n * n; i++) if (reg[i] === id) cells.push(i);
  const seen = new Set([cells[0]]), st = [cells[0]];
  while (st.length) { const x = st.pop(); for (const y of nbrs(n, x)) if (reg[y] === id && !seen.has(y)) { seen.add(y); st.push(y); } }
  return seen.size === cells.length;
}
function jigsawRegions(n) {
  const reg = boxRegions(n), N = n * n; let ok = 0, tries = 0;
  const want = n === 6 ? 40 : 110;
  while (ok < want && tries++ < 20000) {
    const a = Math.floor(Math.random() * N), na = nbrs(n, a).filter(x => reg[x] !== reg[a]); if (!na.length) continue;
    const R1 = reg[a], R2 = reg[na[Math.floor(Math.random() * na.length)]];
    const cand = []; for (let b = 0; b < N; b++) if (reg[b] === R2 && b !== a && nbrs(n, b).some(x => reg[x] === R1 && x !== a)) cand.push(b);
    if (!cand.length) continue;
    const b = cand[Math.floor(Math.random() * cand.length)];
    reg[a] = R2; reg[b] = R1;
    if (connected(n, reg, R1) && connected(n, reg, R2)) ok++; else { reg[a] = R1; reg[b] = R2; }
  }
  return reg;
}
function geometry(T, reg) {
  const n = T.n, N = n * n, units = [];
  for (let r = 0; r < n; r++) { const u = []; for (let c = 0; c < n; c++) u.push(r * n + c); units.push(u); }
  for (let c = 0; c < n; c++) { const u = []; for (let r = 0; r < n; r++) u.push(r * n + c); units.push(u); }
  for (let k = 0; k < n; k++) { const u = []; for (let i = 0; i < N; i++) if (reg[i] === k) u.push(i); units.push(u); }
  if (T.diag) { const a = [], b = []; for (let i = 0; i < n; i++) { a.push(i * n + i); b.push(i * n + n - 1 - i); } units.push(a, b); }
  const peers = []; for (let i = 0; i < N; i++) peers.push(new Set());
  for (const u of units) for (const x of u) for (const y of u) if (x !== y) peers[x].add(y);
  return { n, N, units, peers: peers.map(s => [...s]), full: (1 << (n + 1)) - 2 };
}
function search(G, g, allow, limit, rand, nodeLimit) {
  let count = 0, sol = null, nodes = 0; const N = G.N;
  const cand = c => { let m = allow ? allow[c] : G.full; for (const p of G.peers[c]) if (g[p]) m &= ~(1 << g[p]); return m; };
  function rec() {
    if (++nodes > nodeLimit) throw "limit";
    let best = -1, bm = 0, bc = 99;
    for (let c = 0; c < N; c++) if (!g[c]) { const m = cand(c), k = pop(m); if (!k) return false; if (k < bc) { bc = k; best = c; bm = m; if (k === 1) break; } }
    if (best < 0) { count++; if (!sol) sol = g.slice(); return count >= limit; }
    const vs = bitsOf(bm); if (rand) shuffle(vs);
    for (const v of vs) { g[best] = v; if (rec()) { g[best] = 0; return true; } }
    g[best] = 0; return false;
  }
  rec(); return { count, sol };
}
/* human-style: naked + hidden singles only */
function logicSolve(G, g0, allow) {
  const g = g0.slice(), N = G.N;
  const cand = c => { let m = allow ? allow[c] : G.full; for (const p of G.peers[c]) if (g[p]) m &= ~(1 << g[p]); return m; };
  let progress = true;
  while (progress) {
    progress = false; let empty = 0;
    for (let c = 0; c < N; c++) if (!g[c]) { const m = cand(c); if (!m) return null; if (pop(m) === 1) { g[c] = bitsOf(m)[0]; progress = true; } else empty++; }
    if (!empty) return g;
    if (progress) continue;
    for (const u of G.units) {
      for (let v = 1; v <= G.n; v++) {
        let where = -1, k = 0, has = false;
        for (const c of u) { if (g[c] === v) { has = true; break; } if (!g[c] && (cand(c) & (1 << v))) { k++; where = c; } }
        if (!has && k === 1) { g[where] = v; progress = true; }
      }
    }
  }
  for (let c = 0; c < N; c++) if (!g[c]) return null;
  return g;
}
const TARGET = { easy: { 6: 20, 9: 42 }, exam: { 6: 15, 9: 32 }, hard: { 6: 0, 9: 0 } }, EO_EXAM = 28;
function generate(typeId, level) {
  const T = TYPES.find(t => t.id === typeId);
  for (let attempt = 0; attempt < 40; attempt++) {
    const reg = T.jig ? jigsawRegions(T.n) : boxRegions(T.n);
    const G = geometry(T, reg);
    let sol;
    try { sol = search(G, new Array(G.N).fill(0), null, 1, true, 60000).sol; } catch (e) { continue; }
    if (!sol) continue;
    const shade = T.eo ? sol.map(v => v % 2 === 0 ? 1 : 0) : null;
    const allow = shade ? shade.map(s => s ? 0b101010100 : 0b1010101010) : null;
    const g = sol.slice(); let count = G.N; const target = T.eo && level === "exam" ? EO_EXAM : TARGET[level][T.n];
    for (const c of shuffle([...Array(G.N).keys()])) {
      if (count <= target) break;
      const v = g[c]; g[c] = 0;
      if (logicSolve(G, g, allow)) count--; else g[c] = v;
    }
    if (T.n === 9 && level === "exam" && count > 38) continue;
    return { type: typeId, level, n: T.n, regions: reg, givens: g, sol, shade, clues: count };
  }
  throw new Error("generate failed");
}
return { TYPES, SYMS, generate, geometry, boxRegions, logicSolve, search };
})();
if (typeof module !== "undefined") module.exports = SDK;
