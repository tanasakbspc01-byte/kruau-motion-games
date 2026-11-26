/* ตัวสร้างโจทย์ อัจฉริยภาพทางคณิตศาสตร์ — ป.1–3 (L1) และ ป.4–6 (L2) */
var QG = (() => {
"use strict";
const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
const lcm = (a, b) => a / gcd(a, b) * b;
const N = n => Number(n).toLocaleString("en-US");
const F = (n, d) => `<span class="fr"><span>${n}</span><span>${d}</span></span>`;
const red = (n, d) => { const g = gcd(n, d) || 1; return [n / g, d / g]; };
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
/* answer helpers */
const num = (v, ex, unit) => ({ a: [v, 1], ans: N(v), ex, unit: unit || "" });
const frac = (n, d, ex) => { const [a, b] = red(n, d); const h = b === 1 ? N(a) : F(a, b); return { a: [a, b], ans: b === 1 ? N(a) : `${a}/${b}`, ansH: h, ex: ex + (gcd(n, d) > 1 ? ` = ${h} <small>(ทอนเป็นอย่างต่ำ)</small>` : ""), frac: true }; };
const dec = (v, ex, unit) => { const r = Math.round(v * 1000) / 1000; const d = 1000; return { a: red(Math.round(r * d), d), ans: String(r), ex, unit: unit || "", dec: true }; };

/* ======================= ป.1–3 ======================= */
const L1 = {
  calc: [
    ["บวกลบจำนวน", () => { const a = R(120, 9999), b = R(15, 999), plus = Math.random() < .5; return plus ? Object.assign({ q: `${N(a)} + ${N(b)} = □` }, num(a + b, `ตั้งบวกตามหลัก ได้ ${N(a + b)}`)) : Object.assign({ q: `${N(a + b)} − ${N(b)} = □` }, num(a, `ตั้งลบตามหลัก ได้ ${N(a)}`)); }],
    ["คูณ", () => { const a = R(12, 99), b = R(3, 9); return Object.assign({ q: `${a} × ${b} = □` }, num(a * b, `${a} × ${b} = (${Math.floor(a / 10) * 10} × ${b}) + (${a % 10} × ${b}) = ${Math.floor(a / 10) * 10 * b} + ${a % 10 * b} = ${a * b}`)); }],
    ["หาร", () => { const q = R(6, 45), d = R(3, 9); return Object.assign({ q: `${q * d} ÷ ${d} = □` }, num(q, `${d} × ${q} = ${q * d} ดังนั้น ${q * d} ÷ ${d} = ${q}`)); }],
    ["หาตัวไม่ทราบค่า", () => { const a = R(15, 99), c = R(a + 10, 200); return pick([
      () => Object.assign({ q: `□ + ${a} = ${c}` }, num(c - a, `□ = ${c} − ${a} = ${c - a}`)),
      () => Object.assign({ q: `${c} − □ = ${a}` }, num(c - a, `□ = ${c} − ${a} = ${c - a}`)),
      () => { const d = R(3, 9), q = R(4, 12); return Object.assign({ q: `□ × ${d} = ${q * d}` }, num(q, `□ = ${q * d} ÷ ${d} = ${q}`)); }])(); }],
    ["ลำดับการคำนวณ", () => { const a = R(2, 20), b = R(2, 9), c = R(2, 9); return Math.random() < .5
      ? Object.assign({ q: `${a} + ${b} × ${c} = □` }, num(a + b * c, `คูณก่อนบวก: ${b} × ${c} = ${b * c} แล้ว ${a} + ${b * c} = ${a + b * c}`))
      : Object.assign({ q: `(${a} + ${b}) × ${c} = □` }, num((a + b) * c, `ทำในวงเล็บก่อน: ${a} + ${b} = ${a + b} แล้ว × ${c} = ${(a + b) * c}`)); }],
    ["แบบรูป", () => { if (Math.random() < .7) { const s = R(1, 20), d = R(2, 9), k = R(4, 5), seq = Array.from({ length: k }, (_, i) => s + i * d); return Object.assign({ q: `${seq.join(", ")}, □ จำนวนถัดไปคือ` }, num(s + k * d, `เพิ่มขึ้นทีละ ${d} ดังนั้น ${seq[k - 1]} + ${d} = ${s + k * d}`)); }
      const s = R(1, 5), seq = [s, s * 2, s * 4, s * 8]; return Object.assign({ q: `${seq.join(", ")}, □ จำนวนถัดไปคือ` }, num(s * 16, `เพิ่มเป็น 2 เท่าทุกครั้ง ${s * 8} × 2 = ${s * 16}`)); }],
    ["ค่าประจำหลัก", () => { let n; do { n = R(10000, 99999); } while (new Set(String(n)).size < 5 || String(n).includes("0")); const s = String(n), i = R(0, 4), d = +s[i], v = d * Math.pow(10, 4 - i); return Object.assign({ q: `เลขโดด ${d} ใน ${N(n)} มีค่าเท่าไร` }, num(v, `${d} อยู่หลัก${["หมื่น", "พัน", "ร้อย", "สิบ", "หน่วย"][i]} มีค่า ${N(v)}`)); }],
    ["เวลา", () => { const h = R(1, 4), m = R(5, 55); return Object.assign({ q: `${h} ชั่วโมง ${m} นาที = □ นาที` }, num(h * 60 + m, `1 ชั่วโมง = 60 นาที → ${h} × 60 + ${m} = ${h * 60 + m}`, "นาที")); }],
    ["การวัด", () => pick([
      () => { const m = R(2, 9), c = R(5, 95); return Object.assign({ q: `${m} เมตร ${c} เซนติเมตร = □ เซนติเมตร` }, num(m * 100 + c, `1 เมตร = 100 ซม. → ${m * 100} + ${c} = ${m * 100 + c}`, "ซม.")); },
      () => { const k = R(1, 9), g = R(50, 950); return Object.assign({ q: `${k} กิโลกรัม ${g} กรัม = □ กรัม` }, num(k * 1000 + g, `1 กก. = 1,000 กรัม → ${N(k * 1000)} + ${g} = ${N(k * 1000 + g)}`, "กรัม")); },
      () => { const l = R(2, 9); return Object.assign({ q: `${l} ลิตร = □ มิลลิลิตร` }, num(l * 1000, `1 ลิตร = 1,000 มล.`, "มล.")); }])()],
    ["เงิน", () => { const a = R(1, 5), b = R(1, 6), c = R(1, 9), d = R(0, 4); const t = a * 100 + b * 20 + c * 10 + d * 5; return Object.assign({ q: `ธนบัตร 100 บาท ${a} ใบ, ธนบัตร 20 บาท ${b} ใบ, เหรียญ 10 บาท ${c} เหรียญ${d ? `, เหรียญ 5 บาท ${d} เหรียญ` : ""} รวมเป็นเงินกี่บาท` }, num(t, `${a * 100} + ${b * 20} + ${c * 10}${d ? ` + ${d * 5}` : ""} = ${t}`, "บาท")); }],
    ["เศษส่วน", () => { const d = pick([5, 6, 7, 8, 9, 10]), a = R(1, d - 2), b = R(1, d - 1 - a); return Math.random() < .5
      ? Object.assign({ q: `${F(a, d)} + ${F(b, d)} = □` }, frac(a + b, d, `ตัวส่วนเท่ากัน บวกตัวเศษ ${a} + ${b} = ${a + b} ได้ ${F(a + b, d)}`))
      : Object.assign({ q: `${F(a + b, d)} − ${F(b, d)} = □` }, frac(a, d, `ตัวส่วนเท่ากัน ลบตัวเศษ ${a + b} − ${b} = ${a}`)); }],
    ["คิดลัด", () => pick([
      () => { const k = R(2, 9); return Object.assign({ q: `25 × ${k} × 4 = □` }, num(100 * k, `25 × 4 = 100 แล้ว × ${k} = ${100 * k}`)); },
      () => { const k = R(3, 6); return Object.assign({ q: `${Array(k).fill(99).join(" + ")} = □` }, num(99 * k, `99 × ${k} = 100 × ${k} − ${k} = ${99 * k}`)); },
      () => { const a = R(11, 49), b = 100 - a, c = R(10, 90); return Object.assign({ q: `${a} + ${c} + ${b} = □` }, num(100 + c, `จับคู่ ${a} + ${b} = 100 แล้ว + ${c} = ${100 + c}`)); }])()]
  ],
  prob: [
    ["ซื้อของ-เงินทอน", () => { const p1 = R(12, 45), n1 = R(2, 5), p2 = R(5, 30), n2 = R(2, 6), pay = 0, it1 = pick(["สมุด", "ปากกา", "ขนมปัง", "ไส้กรอก"]), it2 = pick(["ดินสอ", "นม", "ยางลบ", "ไอศกรีม"]); const tot = p1 * n1 + p2 * n2; const pay2 = [100, 500, 1000].find(x => x > tot); return Object.assign({ q: `ซื้อ${it1} ${n1} ชิ้น ชิ้นละ ${p1} บาท และ${it2} ${n2} ชิ้น ชิ้นละ ${p2} บาท จ่ายเงิน ${N(pay2)} บาท จะได้เงินทอนกี่บาท` }, num(pay2 - tot, `ราคารวม ${p1}×${n1} + ${p2}×${n2} = ${p1 * n1} + ${p2 * n2} = ${tot} บาท<br>เงินทอน ${N(pay2)} − ${tot} = ${pay2 - tot} บาท`, "บาท")); }],
    ["ไก่กับสุนัข", () => { const ch = R(2, 12), dg = R(2, 10); return Object.assign({ q: `มีไก่กับสุนัขรวมกัน ${ch + dg} ตัว นับขาได้ ${ch * 2 + dg * 4} ขา มีสุนัขกี่ตัว` }, num(dg, `สมมติทุกตัวเป็นไก่ จะมีขา ${(ch + dg) * 2} ขา ขาที่เกินมา ${ch * 2 + dg * 4} − ${(ch + dg) * 2} = ${dg * 2} ขา<br>สุนัข 1 ตัวมีขามากกว่าไก่ 2 ขา → สุนัข ${dg * 2} ÷ 2 = ${dg} ตัว`, "ตัว")); }],
    ["แบ่งของ", () => { const k = R(3, 8), q = R(4, 12), r = R(1, k - 1), fr = pick(["ส้ม", "ลูกอม", "ดินสอ", "สติกเกอร์"]); return Object.assign({ q: `มี${fr} ${k * q + r} ชิ้น แบ่งให้เด็ก ${k} คน คนละเท่า ๆ กันให้มากที่สุด จะเหลือ${fr}กี่ชิ้น` }, num(r, `${k * q + r} ÷ ${k} = ${q} เศษ ${r} → ได้คนละ ${q} ชิ้น เหลือ ${r} ชิ้น`, "ชิ้น")); }],
    ["ปลูกต้นไม้", () => { const s = pick([2, 3, 4, 5, 10]), k = R(4, 12), L = s * k, both = Math.random() < .3; return Object.assign({ q: `ถนนยาว ${L} เมตร ปลูกต้นไม้ห่างกันต้นละ ${s} เมตร ปลูกที่หัวและท้ายถนนด้วย${both ? " ปลูกทั้งสองข้างถนน" : " (ข้างเดียว)"} ต้องใช้ต้นไม้กี่ต้น` }, num((k + 1) * (both ? 2 : 1), `ช่วงห่าง ${L} ÷ ${s} = ${k} ช่วง จำนวนต้น = ช่วง + 1 = ${k + 1}${both ? `<br>สองข้างถนน × 2 = ${(k + 1) * 2}` : ""}`, "ต้น")); }],
    ["อายุ", () => { const a = R(8, 14), d = R(2, 6), t = R(2, 8); return Object.assign({ q: `พี่อายุ ${a} ปี น้องอายุน้อยกว่าพี่ ${d} ปี อีก ${t} ปีข้างหน้า อายุพี่กับน้องรวมกันกี่ปี` }, num(a + t + (a - d) + t, `น้องอายุ ${a} − ${d} = ${a - d} ปี<br>อีก ${t} ปี: พี่ ${a + t} ปี น้อง ${a - d + t} ปี รวม ${2 * a - d + 2 * t} ปี`, "ปี")); }],
    ["จับมือ", () => { const n = R(4, 9); return Object.assign({ q: `เพื่อน ${n} คน จับมือทักทายกันคนละ 1 ครั้งกับทุกคน จะมีการจับมือทั้งหมดกี่ครั้ง` }, num(n * (n - 1) / 2, `คนแรกจับ ${n - 1} ครั้ง คนถัดไป ${n - 2} ... รวม ${Array.from({ length: n - 1 }, (_, i) => n - 1 - i).join(" + ")} = ${n * (n - 1) / 2}`, "ครั้ง")); }],
    ["ผลบวกเรียงกัน", () => { const n = R(4, 10) * 2; return Object.assign({ q: `1 + 2 + 3 + ... + ${n} = □` }, num(n * (n + 1) / 2, `จับคู่หัวท้าย (1 + ${n}) = ${n + 1} มี ${n} ÷ 2 คู่ → ${n + 1} × ${n} ÷ 2 = ${n * (n + 1) / 2}`)); }],
    ["ผลรวม-ผลต่าง", () => { const b = R(10, 40), d = R(4, 20), a = b + d, f1 = pick(["ส้ม", "มะม่วง", "นักเรียนชาย"]), f2 = { "ส้ม": "แอปเปิล", "มะม่วง": "มังคุด", "นักเรียนชาย": "นักเรียนหญิง" }[f1]; return Object.assign({ q: `มี${f1}มากกว่า${f2} ${d} ${f1.startsWith("นักเรียน") ? "คน" : "ผล"} รวมกันทั้งหมด ${a + b} ${f1.startsWith("นักเรียน") ? "คน" : "ผล"} มี${f1}กี่${f1.startsWith("นักเรียน") ? "คน" : "ผล"}` }, num(a, `(ผลรวม + ผลต่าง) ÷ 2 = (${a + b} + ${d}) ÷ 2 = ${a}`, f1.startsWith("นักเรียน") ? "คน" : "ผล")); }],
    ["ช่วงเวลา", () => { const h = R(7, 11), m = pick([0, 10, 15, 20, 30, 40, 45]), dur = R(35, 150), e = h * 60 + m + dur; const f = x => `${Math.floor(x / 60)}.${String(x % 60).padStart(2, "0")}`; return Object.assign({ q: `เริ่มทำงานเวลา ${f(h * 60 + m)} น. ทำเสร็จเวลา ${f(e)} น. ใช้เวลาทั้งหมดกี่นาที` }, num(dur, `${f(e)} − ${f(h * 60 + m)} → ${Math.floor(dur / 60)} ชั่วโมง ${dur % 60} นาที = ${dur} นาที`, "นาที")); }],
    ["นับรูป", () => { const n = R(3, 6); return Object.assign({ q: `แถวของจุด ${n} จุดเรียงเป็นเส้นตรง ลากเส้นตรงเชื่อมจุด 2 จุดใด ๆ ได้ส่วนของเส้นตรงทั้งหมดกี่เส้น` }, num(n * (n - 1) / 2, `เลือกจุด 2 จุดจาก ${n} จุด = ${n - 1} + ${n - 2} + ... + 1 = ${n * (n - 1) / 2}`, "เส้น")); }]
  ],
  mcq: [
    ["รูปเรขาคณิต", () => { const sh = pick([["สี่เหลี่ยมมุมฉาก", "มุมฉาก", 4], ["สามเหลี่ยม", "มุม", 3], ["ห้าเหลี่ยม", "ด้าน", 5], ["หกเหลี่ยม", "ด้าน", 6], ["ทรงสี่เหลี่ยมมุมฉาก", "หน้า", 6], ["ทรงสี่เหลี่ยมมุมฉาก", "ขอบ", 12], ["ทรงสี่เหลี่ยมมุมฉาก", "จุดยอด", 8], ["พีระมิดฐานสี่เหลี่ยม", "หน้า", 5]]); return Object.assign({ q: `รูป${sh[0]}มี${sh[1]}กี่${sh[1] === "มุมฉาก" ? "มุม" : sh[1] === "ด้าน" ? "ด้าน" : sh[1] === "หน้า" ? "หน้า" : sh[1] === "ขอบ" ? "เส้น" : "จุด"}` }, num(sh[2], `${sh[0]}มี${sh[1]} ${sh[2]}`)); }],
    ["เปรียบเทียบจำนวน", () => { const base = R(1000, 9000), xs = shuffle([base, base + R(1, 9) * 10, base - R(1, 9) * 100, base + R(1, 9)]); const mx = Math.max(...xs); return { q: "จำนวนใดมีค่ามากที่สุด", ch: xs.map(N), ci: xs.indexOf(mx), ex: `เทียบทีละหลักจากซ้าย ${N(mx)} มากที่สุด` }; }]
  ]
};

/* ======================= ป.4–6 ======================= */
const L2 = {
  calc: [
    ["ลำดับการคำนวณ", () => { const c = R(2, 9), d = R(2, 9), e = R(2, 6), a = R(5, 30), b = R(2, 20); const v = (a + b) * c - d; return Object.assign({ q: `(${a} + ${b}) × ${c} − ${d * e} ÷ ${e} = □` }, num(v, `วงเล็บก่อน ${a + b} × ${c} = ${(a + b) * c}<br>${d * e} ÷ ${e} = ${d}<br>${(a + b) * c} − ${d} = ${v}`)); }],
    ["บวกลบเศษส่วน", () => { const b = pick([2, 3, 4, 5, 6, 8]), d = pick([3, 4, 5, 6, 10, 12].filter(x => x !== b)), a = R(1, b - 1), c = R(1, d - 1), plus = Math.random() < .6; if (gcd(a, b) > 1 || gcd(c, d) > 1) return L2.calc[1][1](); let n = plus ? a * d + c * b : a * d - c * b; const den = b * d; if (n <= 0) return L2.calc[1][1](); const L = lcm(b, d); return Object.assign({ q: `${F(a, b)} ${plus ? "+" : "−"} ${F(c, d)} = □ <small>(ตอบเป็นเศษส่วนอย่างต่ำ)</small>` }, frac(n, den, `ทำตัวส่วนให้เท่ากัน (ค.ร.น. ของ ${b}, ${d} = ${L})<br>${F(a * L / b, L)} ${plus ? "+" : "−"} ${F(c * L / d, L)} = ${F(a * L / b + (plus ? 1 : -1) * c * L / d, L)}`)); }],
    ["คูณหารเศษส่วน", () => { let a, b, c, d; do { a = R(1, 6); b = R(a + 1, 9); c = R(1, 8); d = R(c + 1, 10); } while (gcd(a, b) > 1 || gcd(c, d) > 1); return Math.random() < .5
      ? Object.assign({ q: `${F(a, b)} × ${F(c, d)} = □` }, frac(a * c, b * d, `เศษคูณเศษ ส่วนคูณส่วน = ${F(a * c, b * d)}`))
      : Object.assign({ q: `${F(a, b)} ÷ ${F(c, d)} = □` }, frac(a * d, b * c, `หารด้วยเศษส่วน = คูณด้วยส่วนกลับ ${F(a, b)} × ${F(d, c)} = ${F(a * d, b * c)}`)); }],
    ["ทศนิยม", () => pick([
      () => { const a = R(11, 99) / 10, b = R(101, 999) / 100; return Object.assign({ q: `${a} + ${b} = □` }, dec(a + b, `ตั้งจุดทศนิยมให้ตรงกัน ${a.toFixed(2)} + ${b.toFixed(2)} = ${(a + b).toFixed(2)}`)); },
      () => { const a = pick([12.5, 2.5, 7.5, 0.25, 1.5]), b = pick([4, 8, 0.4, 0.8, 6]); return Object.assign({ q: `${a} × ${b} = □` }, dec(a * b, `${a} × ${b} = ${Math.round(a * b * 1000) / 1000}`)); },
      () => { const q = R(12, 95) / 10, d = pick([2, 4, 5]); return Object.assign({ q: `${Math.round(q * d * 100) / 100} ÷ ${d} = □` }, dec(q, `${Math.round(q * d * 100) / 100} ÷ ${d} = ${q}`)); }])()],
    ["ร้อยละ", () => { const p = pick([5, 10, 12, 15, 20, 25, 30, 40, 75]), n = R(2, 30) * 20; const v = p * n / 100; return Number.isInteger(v) ? Object.assign({ q: `ร้อยละ ${p} ของ ${N(n)} เท่ากับเท่าไร` }, num(v, `${n} × ${p} ÷ 100 = ${v}`)) : L2.calc[4][1](); }],
    ["ค.ร.น. ห.ร.ม.", () => { const g = R(2, 12), a = g * R(2, 9), b = g * R(2, 9); if (a === b) return L2.calc[5][1](); return Math.random() < .5 ? Object.assign({ q: `ห.ร.ม. ของ ${a} และ ${b} คือ` }, num(gcd(a, b), `ตัวหารร่วมที่มากที่สุดของ ${a} และ ${b} คือ ${gcd(a, b)}`)) : Object.assign({ q: `ค.ร.น. ของ ${a} และ ${b} คือ` }, num(lcm(a, b), `ค.ร.น. = ${a} × ${b} ÷ ห.ร.ม.(${gcd(a, b)}) = ${lcm(a, b)}`)); }],
    ["สมการ", () => { const x = R(2, 30), a = R(2, 9), b = R(1, 40); return Object.assign({ q: `${a}x + ${b} = ${a * x + b} แล้ว x = □` }, num(x, `${a}x = ${a * x + b} − ${b} = ${a * x} → x = ${a * x} ÷ ${a} = ${x}`)); }],
    ["ค่าเฉลี่ย", () => { const n = R(4, 6), avg = R(20, 80); const xs = Array.from({ length: n - 1 }, () => avg + R(-15, 15)); xs.push(avg * n - xs.reduce((a, b) => a + b, 0)); if (xs[n - 1] <= 0) return L2.calc[7][1](); return Object.assign({ q: `ค่าเฉลี่ยของ ${xs.join(", ")} คือ` }, num(avg, `ผลรวม ${avg * n} ÷ ${n} = ${avg}`)); }],
    ["เลขยกกำลัง", () => pick([
      () => { const a = R(11, 25); return Object.assign({ q: `${a}² = □` }, num(a * a, `${a} × ${a} = ${a * a}`)); },
      () => { const a = R(2, 6); return Object.assign({ q: `${a}³ = □` }, num(a ** 3, `${a} × ${a} × ${a} = ${a ** 3}`)); },
      () => { const k = R(5, 10); return Object.assign({ q: `2<sup>${k}</sup> = □` }, num(2 ** k, `2 คูณกัน ${k} ตัว = ${2 ** k}`)); }])()],
    ["คิดลัด", () => pick([
      () => { const n = R(12, 89); return Object.assign({ q: `99 × ${n} = □` }, num(99 * n, `(100 − 1) × ${n} = ${100 * n} − ${n} = ${99 * n}`)); },
      () => { const n = R(12, 89); return Object.assign({ q: `101 × ${n} = □` }, num(101 * n, `(100 + 1) × ${n} = ${100 * n} + ${n} = ${101 * n}`)); },
      () => { const n = R(11, 99); return Object.assign({ q: `${n} × 125 × 8 = □` }, num(1000 * n, `125 × 8 = 1,000 → ${n} × 1,000 = ${N(1000 * n)}`)); },
      () => { const a = R(2, 9) * 10 + 5; return Object.assign({ q: `${a}² = □` }, num(a * a, `เลขลงท้าย 5 ยกกำลังสอง: ${Math.floor(a / 10)} × ${Math.floor(a / 10) + 1} = ${Math.floor(a / 10) * (Math.floor(a / 10) + 1)} ต่อท้ายด้วย 25`)); }])()],
    ["การประมาณค่า", () => { const n = R(12345, 987654), u = pick([100, 1000, 10000]); const v = Math.round(n / u) * u; return Object.assign({ q: `ประมาณ ${N(n)} เป็นจำนวนเต็ม${{ 100: "ร้อย", 1000: "พัน", 10000: "หมื่น" }[u]}` }, num(v, `ดูหลักถัดไปทางขวา ถ้า ≥ 5 ปัดขึ้น ได้ ${N(v)}`)); }],
    ["มุม", () => { const a = R(30, 80), b = R(30, 100 - (a > 70 ? 20 : 0)); if (a + b >= 170) return L2.calc[11][1](); return Object.assign({ q: `รูปสามเหลี่ยมมีมุมสองมุมขนาด ${a}° และ ${b}° มุมที่เหลือมีขนาดกี่องศา` }, num(180 - a - b, `มุมภายในสามเหลี่ยมรวม 180° → 180 − ${a} − ${b} = ${180 - a - b}`, "องศา")); }],
    ["พื้นที่-ปริมาตร", () => pick([
      () => { const b = R(4, 20) * 2, h = R(3, 15); return Object.assign({ q: `สามเหลี่ยมฐานยาว ${b} ซม. สูง ${h} ซม. มีพื้นที่กี่ตารางเซนติเมตร` }, num(b * h / 2, `½ × ฐาน × สูง = ½ × ${b} × ${h} = ${b * h / 2}`, "ตร.ซม.")); },
      () => { const w = R(3, 12), l = R(w + 1, 20), h = R(2, 10); return Object.assign({ q: `กล่องทรงสี่เหลี่ยมมุมฉาก กว้าง ${w} ซม. ยาว ${l} ซม. สูง ${h} ซม. มีปริมาตรกี่ลูกบาศก์เซนติเมตร` }, num(w * l * h, `กว้าง × ยาว × สูง = ${w} × ${l} × ${h} = ${w * l * h}`, "ลบ.ซม.")); },
      () => { const a = R(3, 10), b = a + R(2, 10), h = R(2, 8) * 2; return Object.assign({ q: `สี่เหลี่ยมคางหมู ด้านคู่ขนานยาว ${a} ซม. และ ${b} ซม. สูง ${h} ซม. มีพื้นที่กี่ตารางเซนติเมตร` }, num((a + b) * h / 2, `½ × (${a} + ${b}) × ${h} = ${(a + b) * h / 2}`, "ตร.ซม.")); }])()],
    ["เศษจากการหาร", () => { const d = R(3, 12), q = R(100, 999), r = R(1, d - 1); return Object.assign({ q: `${N(q * d + r)} ÷ ${d} เหลือเศษเท่าไร` }, num(r, `${d} × ${q} = ${q * d} เหลือเศษ ${q * d + r} − ${q * d} = ${r}`)); }]
  ],
  prob: [
    ["ไก่กับกระต่าย", () => { const c = R(5, 25), r = R(3, 20); return Object.assign({ q: `ฟาร์มมีไก่และกระต่ายรวม ${c + r} ตัว มีขารวม ${2 * c + 4 * r} ขา มีกระต่ายกี่ตัว` }, num(r, `สมมติเป็นไก่ทั้งหมด ขา ${(c + r) * 2} ขา เกินมา ${2 * c + 4 * r - (c + r) * 2} ขา<br>กระต่ายมีขามากกว่าไก่ตัวละ 2 → ${(2 * c + 4 * r - (c + r) * 2)} ÷ 2 = ${r} ตัว`, "ตัว")); }],
    ["อายุ", () => pick([
      () => { const s = R(6, 15), k = R(3, 5); return Object.assign({ q: `พ่ออายุเป็น ${k} เท่าของลูก อายุรวมกัน ${s * (k + 1)} ปี ลูกอายุกี่ปี` }, num(s, `ลูก 1 ส่วน พ่อ ${k} ส่วน รวม ${k + 1} ส่วน = ${s * (k + 1)} ปี → 1 ส่วน = ${s} ปี`, "ปี")); },
      () => { for (;;) { const s = R(4, 14), k = R(3, 5), t = R(2, 12), f = k * s; if ((f + t) % (s + t) === 0) { const m = (f + t) / (s + t); return Object.assign({ q: `ปัจจุบันแม่อายุ ${f} ปี ลูกอายุ ${s} ปี อีกกี่ปีแม่จะมีอายุเป็น ${m} เท่าของลูก` }, num(t, `ให้อีก x ปี: ${f} + x = ${m}(${s} + x) → ${f} + x = ${m * s} + ${m}x → ${f - m * s} = ${m - 1}x → x = ${t}`, "ปี")); } } }])()],
    ["งานร่วมกัน", () => { const [a, b] = pick([[3, 6], [4, 12], [6, 12], [10, 15], [12, 24], [20, 30], [6, 3], [15, 10], [12, 6], [30, 20]]); const t = a * b / (a + b); return Object.assign({ q: `ก ทาสีบ้านเสร็จใน ${a} วัน ข ทาเสร็จใน ${b} วัน ถ้าช่วยกันทำจะเสร็จในกี่วัน` }, num(t, `1 วัน ก ทำได้ ${F(1, a)} ข ทำได้ ${F(1, b)} รวม ${F(1, a)} + ${F(1, b)} = ${F(1, t)} ของงาน → ใช้ ${t} วัน`, "วัน")); }],
    ["กำไร-ขาดทุน", () => pick([
      () => { const c = R(4, 40) * 50, p = pick([10, 20, 25, 30, 40]); return Object.assign({ q: `ซื้อพัดลมมา ${N(c)} บาท ต้องการกำไรร้อยละ ${p} ต้องขายราคากี่บาท` }, num(c * (100 + p) / 100, `ราคาขาย = ${N(c)} × ${100 + p}/100 = ${N(c * (100 + p) / 100)} บาท`, "บาท")); },
      () => { const pr = R(4, 40) * 100, d = pick([10, 15, 20, 25, 30]); return Object.assign({ q: `เสื้อติดราคา ${N(pr)} บาท ลดราคาร้อยละ ${d} ต้องจ่ายเงินกี่บาท` }, num(pr * (100 - d) / 100, `ลด ${N(pr)} × ${d}/100 = ${N(pr * d / 100)} บาท → จ่าย ${N(pr * (100 - d) / 100)} บาท`, "บาท")); }])()],
    ["ระยะทาง-ความเร็ว", () => pick([
      () => { const v = R(4, 12) * 10, t = R(2, 6); return Object.assign({ q: `รถยนต์แล่นด้วยอัตราเร็ว ${v} กิโลเมตรต่อชั่วโมง เป็นเวลา ${t} ชั่วโมง ได้ระยะทางกี่กิโลเมตร` }, num(v * t, `ระยะทาง = อัตราเร็ว × เวลา = ${v} × ${t} = ${v * t}`, "กม.")); },
      () => { const v1 = R(4, 9) * 10, v2 = R(3, 8) * 10, t = R(2, 4); return Object.assign({ q: `รถสองคันอยู่ห่างกัน ${(v1 + v2) * t} กม. แล่นเข้าหากัน คันหนึ่งเร็ว ${v1} กม./ชม. อีกคัน ${v2} กม./ชม. อีกกี่ชั่วโมงจะพบกัน` }, num(t, `เข้าใกล้กันชั่วโมงละ ${v1} + ${v2} = ${v1 + v2} กม. → ${(v1 + v2) * t} ÷ ${v1 + v2} = ${t} ชม.`, "ชั่วโมง")); }])()],
    ["มุมเข็มนาฬิกา", () => { const h = R(1, 11), m = pick([0, 30]); let a = Math.abs(30 * h - 5.5 * m); if (a > 180) a = 360 - a; return Object.assign({ q: `เวลา ${h}.${m ? "30" : "00"} น. เข็มสั้นและเข็มยาวทำมุมกันกี่องศา (มุมที่เล็กกว่า)` }, num(a, `เข็มสั้นอยู่ที่ ${30 * h + 0.5 * m}° เข็มยาวอยู่ที่ ${6 * m}° ต่างกัน ${Math.abs(30 * h + 0.5 * m - 6 * m)}°${Math.abs(30 * h - 5.5 * m) > 180 ? ` → มุมเล็ก 360 − ${Math.abs(30 * h - 5.5 * m)} = ${a}°` : ""}`, "องศา")); }],
    ["ค.ร.น. ประยุกต์", () => { const xs = pick([[6, 8, 12], [4, 6, 10], [5, 6, 15], [8, 12, 18], [9, 12, 15], [10, 12, 20], [6, 9, 15]]); const L = xs.reduce(lcm); return Object.assign({ q: `ระฆัง 3 ใบตีทุก ๆ ${xs.join(", ")} นาที ตามลำดับ ถ้าตีพร้อมกันครั้งแรก อีกกี่นาทีจะตีพร้อมกันอีกครั้ง` }, num(L, `ค.ร.น. ของ ${xs.join(", ")} = ${L}`, "นาที")); }],
    ["ห.ร.ม. ประยุกต์", () => { const g = pick([6, 8, 9, 12, 15]), a = g * R(2, 7), b = g * R(2, 7), c = g * R(2, 7); return Object.assign({ q: `มีริบบิ้น 3 เส้น ยาว ${a}, ${b} และ ${c} ซม. ต้องการตัดเป็นท่อนยาวเท่ากันให้ยาวที่สุดโดยไม่เหลือเศษ จะได้ทั้งหมดกี่ท่อน` }, num((a + b + c) / gcd(gcd(a, b), c), `ห.ร.ม. ของ ${a}, ${b}, ${c} = ${gcd(gcd(a, b), c)} ซม.<br>จำนวนท่อน = (${a} + ${b} + ${c}) ÷ ${gcd(gcd(a, b), c)} = ${(a + b + c) / gcd(gcd(a, b), c)}`, "ท่อน")); }],
    ["อนุกรม", () => { const a = R(1, 10), d = R(2, 7), n = R(8, 20), l = a + (n - 1) * d; return Object.assign({ q: `${a} + ${a + d} + ${a + 2 * d} + ... + ${l} = □` }, num((a + l) * n / 2, `มี (${l} − ${a}) ÷ ${d} + 1 = ${n} พจน์<br>ผลบวก = (${a} + ${l}) × ${n} ÷ 2 = ${(a + l) * n / 2}`)); }],
    ["นับเลขโดด", () => { const n = R(30, 250); const cnt = Math.min(n, 9) + Math.max(0, Math.min(n, 99) - 9) * 2 + Math.max(0, n - 99) * 3; return Object.assign({ q: `เขียนเลขหน้าหนังสือตั้งแต่หน้า 1 ถึงหน้า ${n} ต้องเขียนเลขโดดทั้งหมดกี่ตัว` }, num(cnt, `หน้า 1–9: 9 ตัว${n > 9 ? `<br>หน้า 10–${Math.min(n, 99)}: ${Math.min(n, 99) - 9} × 2 = ${(Math.min(n, 99) - 9) * 2} ตัว` : ""}${n > 99 ? `<br>หน้า 100–${n}: ${n - 99} × 3 = ${(n - 99) * 3} ตัว` : ""}<br>รวม ${cnt} ตัว`, "ตัว")); }],
    ["ค่าเฉลี่ย", () => { const k = R(3, 5), a = R(60, 80), want = a + R(2, 5); const need = want * (k + 1) - a * k; if (need > 100) return L2.prob[10][1](); return Object.assign({ q: `สอบ ${k} ครั้ง ได้คะแนนเฉลี่ย ${a} คะแนน ครั้งที่ ${k + 1} ต้องได้กี่คะแนน คะแนนเฉลี่ยทั้ง ${k + 1} ครั้งจึงจะเป็น ${want}` }, num(need, `ต้องมีคะแนนรวม ${want} × ${k + 1} = ${want * (k + 1)}<br>มีแล้ว ${a} × ${k} = ${a * k} → ต้องได้ ${need}`, "คะแนน")); }],
    ["ทางเดินรอบสนาม", () => { const w = R(5, 20), l = w + R(2, 15), p = R(1, 3); return Object.assign({ q: `สนามรูปสี่เหลี่ยมผืนผ้ากว้าง ${w} ม. ยาว ${l} ม. ทำทางเดินกว้าง ${p} ม. รอบนอกสนาม ทางเดินมีพื้นที่กี่ตารางเมตร` }, num((w + 2 * p) * (l + 2 * p) - w * l, `รูปใหญ่ (${w + 2 * p} × ${l + 2 * p}) = ${(w + 2 * p) * (l + 2 * p)} ลบสนาม ${w * l} = ${(w + 2 * p) * (l + 2 * p) - w * l}`, "ตร.ม.")); }],
    ["อัตราส่วน", () => { const a = R(1, 5), b = R(a + 1, 8), k = R(5, 40) * 10; return Object.assign({ q: `แบ่งเงิน ${N((a + b) * k)} บาทให้พี่และน้องในอัตราส่วน ${b} : ${a} พี่ได้เงินกี่บาท` }, num(b * k, `รวม ${a + b} ส่วน = ${N((a + b) * k)} → 1 ส่วน = ${k} บาท<br>พี่ ${b} ส่วน = ${N(b * k)} บาท`, "บาท")); }]
  ],
  mcq: [
    ["เปรียบเทียบเศษส่วน", () => { const fs = []; while (fs.length < 4) { const d = R(3, 12), n = R(1, d - 1); if (!fs.some(f => f[0] * d === n * f[1])) fs.push([n, d]); } const mi = fs.reduce((b, f, i) => f[0] / f[1] > fs[b][0] / fs[b][1] ? i : b, 0); return { q: "เศษส่วนใดมีค่ามากที่สุด", chH: fs.map(f => F(f[0], f[1])), ch: fs.map(f => `${f[0]}/${f[1]}`), ci: mi, ex: `แปลงเป็นทศนิยม: ${fs.map(f => `${f[0]}/${f[1]} ≈ ${(f[0] / f[1]).toFixed(3)}`).join(", ")}` }; }],
    ["จำนวนเฉพาะ", () => { const pr = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97], co = [9, 15, 21, 27, 33, 39, 49, 51, 57, 63, 69, 77, 81, 87, 91, 93]; const p = pick(pr.filter(x => x > 10)), cs = shuffle(co.slice()).slice(0, 3), xs = shuffle([p, ...cs]); return { q: "จำนวนใดเป็นจำนวนเฉพาะ", ch: xs.map(String), ci: xs.indexOf(p), ex: `${p} มีตัวประกอบแค่ 1 กับตัวเอง · ${cs.map(c => { for (let k = 3; k < c; k++) if (c % k === 0) return `${c} = ${k} × ${c / k}`; return c; }).join(", ")}` }; }],
    ["การหารลงตัว", () => { const d = pick([3, 4, 6, 9]); let good; do { good = R(100, 999) * 1; } while (good % d); const bad = []; while (bad.length < 3) { const x = R(100, 999); if (x % d && !bad.includes(x)) bad.push(x); } const xs = shuffle([good, ...bad]); return { q: `จำนวนใดหารด้วย ${d} ลงตัว`, ch: xs.map(String), ci: xs.indexOf(good), ex: { 3: "ผลบวกของเลขโดดหารด้วย 3 ลงตัว", 9: "ผลบวกของเลขโดดหารด้วย 9 ลงตัว", 4: "สองหลักสุดท้ายหารด้วย 4 ลงตัว", 6: "เป็นเลขคู่ และผลบวกเลขโดดหารด้วย 3 ลงตัว" }[d] + ` → ${good}` }; }]
  ]
};

/* make MCQ from numeric generator */
function toMCQ(q) {
  if (q.ch) return q;
  const v = q.a[0] / q.a[1];
  const opts = new Set([q.ans]);
  const cand = q.frac ? [[q.a[0] + 1, q.a[1]], [q.a[0], q.a[1] + 1], [Math.max(1, q.a[0] - 1), q.a[1]], [q.a[1], q.a[0]], [q.a[0] * 2, q.a[1]]].map(([n, d]) => { const [a, b] = red(n, d); return b === 1 ? N(a) : `${a}/${b}`; })
    : q.dec ? [v + .1, v - .1, v * 10, v / 10, v + 1].map(x => String(Math.round(x * 1000) / 1000))
    : (() => { const base = Math.round(v), step = Math.max(1, Math.round(Math.abs(base) * .1)); return [base + step, base - step, base + 2 * step, base + 10, base - 10, base + 1, base - 1].filter(x => x >= 0).map(N); })();
  for (const c of shuffle(cand)) { if (opts.size >= 4) break; if (c !== q.ans) opts.add(c); }
  let k = 2; while (opts.size < 4) opts.add(N(Math.round(v) + k++));
  const ch = shuffle([...opts]);
  return Object.assign({}, q, { ch, ci: ch.indexOf(q.ans), chH: q.frac ? ch.map(s => s.includes("/") ? F(...s.split("/")) : s) : null });
}
const BANK = { 1: L1, 2: L2 };
function topics(level) { const B = BANK[level]; return { calc: B.calc.map(x => x[0]), prob: B.prob.map(x => x[0]) }; }
function gen(level, part, topic) {
  const B = BANK[level];
  if (part === 1) {
    const pool = [...B.mcq, ...B.calc, ...B.prob.slice(0, Math.ceil(B.prob.length / 2))];
    const [t, f] = pick(pool); return Object.assign(toMCQ(f()), { t, part: 1 });
  }
  const list = part === 2 ? B.calc : B.prob;
  const g = topic ? list.find(x => x[0] === topic) : pick(list);
  return Object.assign(g[1](), { t: g[0], part });
}
function exam(level) {
  const make = (part, n) => { const out = [], used = {}; let guard = 0; while (out.length < n && guard++ < 500) { const q = gen(level, part); const key = q.q; if (out.some(o => o.q === key)) continue; used[q.t] = (used[q.t] || 0) + 1; if (used[q.t] > Math.ceil(n / 5)) continue; out.push(q); } return out; };
  return [...make(1, 10), ...make(2, 20), ...make(3, 10)];
}
/* parse user answer -> [n,d] */
function parseAns(s) {
  s = String(s).replace(/,/g, "").replace(/\s+/g, " ").trim(); if (!s) return null;
  let m;
  if ((m = s.match(/^(-?\d+) (\d+)\/(\d+)$/))) { const w = +m[1], n = +m[2], d = +m[3]; if (!d) return null; return red(w * d + (w < 0 ? -n : n), d); }
  if ((m = s.match(/^(-?\d+)\/(\d+)$/))) { if (!+m[2]) return null; return red(+m[1], +m[2]); }
  if ((m = s.match(/^-?\d*\.?\d+$/))) { const v = parseFloat(s); const p = (s.split(".")[1] || "").length; const d = Math.pow(10, p); return red(Math.round(v * d), d); }
  return null;
}
const same = (a, b) => a && b && a[0] * b[1] === b[0] * a[1];
/* check user's raw string vs question: {ok, note} */
function check(q, s) {
  const v = parseAns(s); if (!v) return { ok: false, empty: !String(s).trim() };
  if (!same(v, q.a)) return { ok: false };
  const m = String(s).replace(/,/g, "").trim().match(/^(\d+)\/(\d+)$/);
  if (q.frac && m && gcd(+m[1], +m[2]) !== 1) return { ok: false, note: "ค่าถูกแต่ยังไม่เป็นเศษส่วนอย่างต่ำ" };
  return { ok: true };
}
return { gen, exam, topics, toMCQ, parseAns, same, check, F };
})();
if (typeof module !== "undefined") module.exports = QG;
