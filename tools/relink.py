#!/usr/bin/env python3
"""เปลี่ยนลิงก์ claude.ai/artifact/<รหัส> ภายในเกม ให้ชี้ไปเกมใน repo นี้ (../<โฟลเดอร์>/)
เพื่อให้ปุ่มที่เปิดเกมอื่นเปิดในกรอบเว็บ KruAu ได้ (claude.ai เปิดซ้อนในเว็บอื่นไม่ได้)

- ใช้ได้เฉพาะรหัสที่อยู่ใน games.json แล้ว
- ลิงก์ที่ถูกเปลี่ยน จะเอา target="_blank" / rel="noopener" ออก ให้เปิดในกรอบเดิม
- บันทึก sha256 (8 ตัวแรก) ของไฟล์ต้นฉบับจาก claude.ai ไว้ใน games.json ช่อง "upstream"
  ตอนซิงก์ให้เทียบ sha ที่ Artifact list แสดงกับค่านี้ (ไม่ใช่ไฟล์ในเครื่อง ซึ่งถูกแก้ลิงก์แล้ว)
- เกมที่เรียก claude.use("downloads") (ปุ่มดาวน์โหลด PDF ซึ่งใช้ได้เฉพาะบน claude.ai)
  จะได้ไฟล์ kruau-shim.js ในโฟลเดอร์เกม + แทรก <script> ใน index.html ให้ดาวน์โหลดผ่านเบราว์เซอร์แทน
- รันซ้ำได้ (ไฟล์ที่แก้แล้ว จะไม่ถูกแตะซ้ำ)

ใช้: python3 tools/relink.py            (ทุกเกม)
     python3 tools/relink.py amath-     (เฉพาะโฟลเดอร์ที่ขึ้นต้นด้วย)
"""
import hashlib, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LINK = re.compile(r'https://claude\.ai/(?:artifact|public/artifacts)/([A-Za-z0-9]+)')


SHIM = """/* KruAu: แทน claude.use("downloads") เมื่อเปิดนอก claude.ai ให้บันทึกไฟล์ผ่านเบราว์เซอร์ */
(function () {
  if (window.claude && window.claude.use) return;
  window.claude = window.claude || {};
  window.claude.use = function (name) {
    if (name !== "downloads") return Promise.reject(new Error("unsupported"));
    return Promise.resolve({ save: function (o) {
      var d = o.data, blob = d instanceof Blob ? d : new Blob([d]);
      var url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = o.filename || "file"; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
      return Promise.resolve();
    } });
  };
})();
"""
SHIM_TAG = '<script src="kruau-shim.js"></script>'


def shim(g, gdir, changed):
    srcs = ''.join(open(os.path.join(gdir, n), encoding='utf-8').read() for n in os.listdir(gdir) if n.endswith('.js') and n != 'kruau-shim.js')
    if 'claude.use("downloads")' not in srcs and "claude.use('downloads')" not in srcs:
        return
    open(os.path.join(gdir, 'kruau-shim.js'), 'w', encoding='utf-8').write(SHIM)
    fp = os.path.join(gdir, 'index.html'); raw = open(fp, 'rb').read(); text = raw.decode('utf-8')
    if SHIM_TAG in text:
        return
    i = text.find('<script')
    if i < 0:
        return
    g.setdefault('upstream', {})['index.html'] = hashlib.sha256(raw).hexdigest()[:8]
    open(fp, 'w', encoding='utf-8', newline='').write(text[:i] + SHIM_TAG + text[i:])
    changed.append('%s/index.html + kruau-shim.js (upstream %s)' % (g['folder'], g['upstream']['index.html']))


def main(prefix=''):
    path = os.path.join(ROOT, 'games.json')
    book = json.load(open(path, encoding='utf-8'))
    games = book['games']
    folder_of = {k: v['folder'] for k, v in games.items()}
    changed = []
    for gid, g in games.items():
        if not g['folder'].startswith(prefix):
            continue
        gdir = os.path.join(ROOT, 'games', g['folder'])
        for name in sorted(os.listdir(gdir)):
            if not name.endswith(('.js', '.html', '.css')):
                continue
            fp = os.path.join(gdir, name)
            raw = open(fp, 'rb').read()
            text = raw.decode('utf-8')
            if not any(m.group(1) in folder_of for m in LINK.finditer(text)):
                continue
            sha = hashlib.sha256(raw).hexdigest()[:8]
            text = LINK.sub(lambda m: '../%s/' % folder_of[m.group(1)] if m.group(1) in folder_of else m.group(0), text)
            # ค่าคงที่ที่ถูกเปลี่ยนเป็นลิงก์ภายใน เช่น const CLOCK_URL = "../amath-clock/";
            consts = re.findall(r'(?:const|let|var)\s+(\w+)\s*=\s*["\']\.\./[\w-]+/["\']', text)
            out = []
            for line in text.split('\n'):
                if 'href="../' in line or any('${%s}' % c in line for c in consts):
                    line = line.replace(' target="_blank"', '').replace(' rel="noopener"', '')
                out.append(line)
            open(fp, 'w', encoding='utf-8', newline='').write('\n'.join(out))
            g.setdefault('upstream', {})[name] = sha
            changed.append('%s/%s (upstream %s)' % (g['folder'], name, sha))
        shim(g, gdir, changed)
    if changed:
        open(path, 'w', encoding='utf-8').write(json.dumps(book, ensure_ascii=False, indent=1) + '\n')
    print('\n'.join(changed) or 'ไม่มีลิงก์ claude.ai ที่ต้องเปลี่ยน')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '')
