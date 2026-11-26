#!/usr/bin/env python3
"""เปลี่ยนลิงก์ claude.ai/artifact/<รหัส> ภายในเกม ให้ชี้ไปเกมใน repo นี้ (../<โฟลเดอร์>/)
เพื่อให้ปุ่มที่เปิดเกมอื่นเปิดในกรอบเว็บ KruAu ได้ (claude.ai เปิดซ้อนในเว็บอื่นไม่ได้)

- ใช้ได้เฉพาะรหัสที่อยู่ใน games.json แล้ว
- ลิงก์ที่ถูกเปลี่ยน จะเอา target="_blank" / rel="noopener" ออก ให้เปิดในกรอบเดิม
- บันทึก sha256 (8 ตัวแรก) ของไฟล์ต้นฉบับจาก claude.ai ไว้ใน games.json ช่อง "upstream"
  ตอนซิงก์ให้เทียบ sha ที่ Artifact list แสดงกับค่านี้ (ไม่ใช่ไฟล์ในเครื่อง ซึ่งถูกแก้ลิงก์แล้ว)
- รันซ้ำได้ (ไฟล์ที่ไม่มีลิงก์ claude.ai เหลือแล้ว จะไม่ถูกแตะ)

ใช้: python3 tools/relink.py            (ทุกเกม)
     python3 tools/relink.py amath-     (เฉพาะโฟลเดอร์ที่ขึ้นต้นด้วย)
"""
import hashlib, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LINK = re.compile(r'https://claude\.ai/(?:artifact|public/artifacts)/([A-Za-z0-9]+)')


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
    if changed:
        open(path, 'w', encoding='utf-8').write(json.dumps(book, ensure_ascii=False, indent=1) + '\n')
    print('\n'.join(changed) or 'ไม่มีลิงก์ claude.ai ที่ต้องเปลี่ยน')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '')
