# kruau-motion-games — กติกาสำหรับ Claude

repo นี้เก็บเกมของเว็บ KruAu (GitHub Pages: https://tanasakbspc01-byte.github.io/kruau-motion-games/)
เว็บ KruAu อ่าน `games.json` เพื่อเปลี่ยนลิงก์ claude.ai เป็นเกมใน repo นี้อัตโนมัติ (claude.ai เปิดซ้อนในเว็บอื่นไม่ได้)

## เมื่อผู้ใช้พิมพ์ "อัปเดตเกม" (หรือคล้ายกัน) — ไม่ต้องขอลิงก์ ให้หาเอง
1. อ่านชีต KruAu (Google Sheet id `1hWyIK-_z5f8mTiIdC3Ch0Elsw5Zr5DwuBKKs6GweGBs`) แท็บ **Media** คอลัมน์ `url`
   ด้วย Google Drive connector (`read_file_content`)
2. เลือกแถวที่ url เป็น `claude.ai/artifact/<รหัส>` (หรือ `claude.ai/public/artifacts/<รหัส>`) ที่ **ยังไม่มี** ใน `games.json`
   ถ้าผู้ใช้แปะลิงก์มาในแชทด้วย ให้รวมลิงก์เหล่านั้นด้วย
3. ดึงเกมด้วยเครื่องมือ Artifact: `list` scope `files` ดูว่ามีกี่ไฟล์ → `read` ด้วย `paths` ให้ครบทุกไฟล์ (index.html, kit.js, kit.css …)
   - ตรวจว่าไม่มี `window.claude` (API เฉพาะ claude.ai) ถ้ามี ให้แจ้งผู้ใช้ ห้ามย้ายแบบเงียบ ๆ
4. วางไว้ที่ `games/<ชื่อโฟลเดอร์ภาษาอังกฤษสั้น ๆ>/` ทุกไฟล์ในโฟลเดอร์เดียวกัน (แต่ละเกมมี kit ของตัวเอง ห้ามใช้ร่วมกัน)
5. เพิ่มใน `games.json`: `"<รหัส>": {"folder": "<โฟลเดอร์>", "title": "<ชื่อเกม>"}`
6. เพิ่มการ์ดใน `index.html` (หัวข้อ "เกมทั้งหมด") และแถวในตาราง `README.md`
7. ทดสอบเปิดทุกเกมใหม่ด้วย Playwright (file://) ต้องไม่มี page error
8. commit + push ขึ้น `main` แล้วบอกผู้ใช้เป็นภาษาไทย: ย้ายเกมไหนบ้าง และ "รอ 1–3 นาทีแล้วเกมจะเปิดในเว็บ KruAu ได้เอง ไม่ต้องแก้ลิงก์"

ห้ามแก้ชีตของผู้ใช้ ห้ามแก้ repo KruAu (game-Kruau) ในงานนี้ — ไม่ต้องให้ผู้ใช้วางไฟล์โค้ดใหม่
