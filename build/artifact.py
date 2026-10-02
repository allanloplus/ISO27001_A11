#!/usr/bin/env python3
"""產生線上發佈版（單一 HTML，字型改用 Google Fonts，JS 內嵌），輸出到 dist/。
旁白音軌另以 audio/narration.mp3 一併發佈。"""
import os, re, shutil
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, "deck"); OUT = os.path.join(ROOT, "dist")
s = open(os.path.join(D, "index.html"), encoding="utf-8").read()
head = s[s.index("<title>"):s.index("</head>")]
body = s[s.index("<body"):s.index("</body>")]
body = body[body.index(">") + 1:]
head = re.sub(r'<!-- 字型.*?-->\s*<link rel="stylesheet" href="fonts/fonts.css">',
              '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Chiron+GoRound+TC:wght@500;700;900&family=Noto+Sans+TC:wght@400;500;700;900&display=swap">', head, flags=re.S)
for f in ["timeline.js", "characters.js", "engine.js"]:
    js = open(os.path.join(D, f), encoding="utf-8").read()
    body = body.replace(f'<script src="{f}"></script>', "<script>\n" + js + "\n</script>")
# 播放器初始為暫停狀態（原 body class）
body = "<script>document.body.classList.add('paused')</script>\n" + body
os.makedirs(os.path.join(OUT, "audio"), exist_ok=True)
open(os.path.join(OUT, "supplier-security.html"), "w", encoding="utf-8").write(head + body)
shutil.copy(os.path.join(D, "audio", "narration.mp3"), os.path.join(OUT, "audio", "narration.mp3"))
print("ok")
