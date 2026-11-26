/* PR: วาดหน้า A4 บน canvas แล้วรวมเป็น PDF (ภาพ JPEG ต่อหน้า) + บันทึกไฟล์ผ่าน downloads capability */
var PR = (() => {
"use strict";
const PW = 1240, PH = 1754; /* A4 @150dpi */
let DL = null;
(async () => { try { if (window.claude && claude.use) DL = await claude.use("downloads"); } catch (e) { DL = null; } })();
function page() {
  const c = document.createElement("canvas"); c.width = PW; c.height = PH;
  const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, PW, PH); g.fillStyle = "#000"; g.textBaseline = "alphabetic";
  return { c, g };
}
const font = (g, size, w = 600) => { g.font = `${w} ${size}px Mali, "Sarabun", "Tahoma", sans-serif`; };
function text(g, s, x, y, size, opt = {}) { font(g, size, opt.w || 600); g.fillStyle = opt.color || "#000"; g.textAlign = opt.align || "left"; g.fillText(s, x, y); g.textAlign = "left"; }
function wrap(g, s, x, y, maxW, size, lh, opt = {}) {
  font(g, size, opt.w || 400); g.fillStyle = opt.color || "#000";
  /* Thai has no spaces: break by characters when needed */
  const words = s.split(/(\s+)/); let line = "", yy = y;
  const flush = () => { g.fillText(line, x, yy); yy += lh; line = ""; };
  for (const w of words) {
    if (g.measureText(line + w).width <= maxW) { line += w; continue; }
    if (line.trim()) flush();
    let chunk = "";
    for (const ch of w.trimStart()) { if (g.measureText(chunk + ch).width > maxW) { line = chunk; flush(); chunk = ""; } chunk += ch; }
    line = chunk;
  }
  if (line.trim()) flush();
  return yy;
}
function header(g, title, sub, pageNo, total, studentLine = true) {
  text(g, title, 80, 110, 46, { w: 700 });
  if (sub) text(g, sub, 80, 160, 26, { w: 400, color: "#444" });
  if (studentLine) text(g, "ชื่อ ..................................................  เลขที่ ........  ชั้น ........  วันที่ ....................", 80, 215, 24, { w: 400 });
  g.strokeStyle = "#000"; g.lineWidth = 3; g.beginPath(); g.moveTo(80, studentLine ? 240 : 185); g.lineTo(PW - 80, studentLine ? 240 : 185); g.stroke();
  text(g, `หน้า ${pageNo}/${total}`, PW - 80, PH - 50, 20, { w: 400, color: "#666", align: "right" });
  text(g, "KruAu · สุ่มโจทย์ใหม่ได้ไม่จำกัด", 80, PH - 50, 20, { w: 400, color: "#888" });
  return studentLine ? 285 : 230;
}
function toJpeg(c) { const d = c.toDataURL("image/jpeg", 0.9); const b = atob(d.split(",")[1]); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return { jpeg: u, w: c.width, h: c.height }; }
function pdf(canvases) {
  const pages = canvases.map(toJpeg);
  const chunks = [], offs = []; let len = 0;
  const enc = new TextEncoder();
  const push = b => { if (typeof b === "string") b = enc.encode(b); chunks.push(b); len += b.length; };
  push("%PDF-1.4\n"); push(new Uint8Array([37, 226, 227, 207, 211, 10]));
  const W = 595.28, H = 841.89, n = pages.length;
  const obj = (num, body) => { offs[num] = len; push(`${num} 0 obj\n`); body(); push("\nendobj\n"); };
  obj(1, () => push("<< /Type /Catalog /Pages 2 0 R >>"));
  obj(2, () => push(`<< /Type /Pages /Kids [${pages.map((_, i) => `${3 + 3 * i} 0 R`).join(" ")}] /Count ${n} >>`));
  pages.forEach((p, i) => {
    const pg = 3 + 3 * i, ct = 4 + 3 * i, im = 5 + 3 * i, cs = `q ${W} 0 0 ${H} 0 0 cm /Im${i} Do Q`;
    obj(pg, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im${i} ${im} 0 R >> >> /Contents ${ct} 0 R >>`));
    obj(ct, () => push(`<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`));
    obj(im, () => { push(`<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`); push(p.jpeg); push("\nendstream"); });
  });
  const total = 3 + 3 * n, xref = len;
  let x = `xref\n0 ${total}\n0000000000 65535 f \n`; for (let k = 1; k < total; k++) x += String(offs[k]).padStart(10, "0") + " 00000 n \n";
  push(x); push(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(chunks, { type: "application/pdf" });
}
/* preview sheet with download button */
function preview(canvases, filename, onClose) {
  const m = document.createElement("div"); m.className = "prv";
  m.innerHTML = `<div class="prv-bar"><b>ใบงาน ${canvases.length} หน้า</b><button type="button" class="prv-dl" id="prvDl">⬇️ ดาวน์โหลด PDF</button><button type="button" class="prv-x" id="prvX">✕ ปิด</button></div>
    <p class="prv-msg" id="prvMsg">ดาวน์โหลดแล้วเปิดไฟล์ PDF สั่งพิมพ์ได้เลย (A4 แนวตั้ง)</p><div class="prv-pages"></div>`;
  const box = m.querySelector(".prv-pages");
  canvases.forEach(c => { const img = new Image(); img.src = c.toDataURL("image/jpeg", .8); img.alt = "หน้าใบงาน"; box.appendChild(img); });
  document.body.appendChild(m);
  m.querySelector("#prvX").onclick = () => { m.remove(); onClose && onClose(); };
  const msg = m.querySelector("#prvMsg");
  m.querySelector("#prvDl").onclick = async () => {
    const blob = pdf(canvases);
    if (!DL) { try { DL = window.claude && claude.use ? await claude.use("downloads") : null; } catch (e) { DL = null; } }
    if (!DL) { msg.textContent = "เครื่องนี้ดาวน์โหลดจากหน้านี้ไม่ได้ · แตะค้างที่รูปหน้าใบงานด้านล่างเพื่อบันทึกรูปแล้วพิมพ์แทนได้"; msg.className = "prv-msg bad"; return; }
    try { await DL.save({ filename, data: blob }); msg.textContent = "✅ บันทึกไฟล์แล้ว เปิดไฟล์ PDF แล้วสั่งพิมพ์ได้เลย"; msg.className = "prv-msg ok"; }
    catch (e) {
      try { await DL.save({ filename, data: new Uint8Array(await blob.arrayBuffer()) }); msg.textContent = "✅ บันทึกไฟล์แล้ว"; msg.className = "prv-msg ok"; }
      catch (e2) { msg.textContent = "ยังไม่ได้บันทึกไฟล์ (ยกเลิกหรือเครื่องไม่อนุญาต) ลองกดอีกครั้ง หรือแตะค้างที่รูปหน้าใบงานเพื่อบันทึกรูป"; msg.className = "prv-msg bad"; }
    }
  };
}
const CSS = `.prv{position:fixed;inset:0;background:#3a3a46;z-index:100;display:flex;flex-direction:column;font-family:Mali,sans-serif}
.prv-bar{display:flex;gap:8px;align-items:center;padding:10px 12px;background:#1f1f29;color:#fff}.prv-bar b{flex:1;font-size:16px}
.prv-bar button{border:0;border-radius:999px;padding:10px 16px;font:700 15px Mali,sans-serif;cursor:pointer}.prv-dl{background:#22c55e;color:#fff}.prv-x{background:#fff;color:#222}
.prv-msg{margin:0;padding:8px 14px;background:#fff8d6;color:#5b4a00;font-size:14px}.prv-msg.ok{background:#dcfce7;color:#14532d}.prv-msg.bad{background:#ffe4e6;color:#881337}
.prv-pages{flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;align-items:center;gap:14px}.prv-pages img{width:min(100%,760px);background:#fff;box-shadow:0 4px 16px rgba(0,0,0,.4)}`;
(() => { const s = document.createElement("style"); s.textContent = CSS; document.head.appendChild(s); })();
async function ready() { try { await Promise.all([document.fonts.load("700 40px Mali"), document.fonts.load("400 24px Mali"), document.fonts.load("600 24px Mali")]); } catch (e) {} }
return { PW, PH, page, text, wrap, font, header, pdf, preview, ready };
})();
