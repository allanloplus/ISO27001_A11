#!/usr/bin/env python3
"""由 content/dialogue.json 與 deck/timeline.js 產生講師講稿 content/講稿.md（含時間碼）。"""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
tl = json.loads(open(os.path.join(ROOT, "deck", "timeline.js"), encoding="utf-8").read().split("window.TIMELINE = ", 1)[1].rstrip().rstrip(";"))
TITLES = {
    "cover": "開場", "why": "為什麼要管供應者", "map": "運作流程地圖", "part1": "第一部分｜ISMS 作業重點",
    "c519": "5.19 供應者關係中之資訊安全", "c520": "5.20 於供應者協議中闡明資訊安全", "c66": "6.6 機密性或保密協議",
    "c521": "5.21 管理 ICT 供應鏈中之資訊安全", "c522": "5.22 供應者服務之監視、審查及變更管理",
    "c523": "5.23 使用雲端服務之資訊安全", "c830": "8.30 委外開發", "part2": "第二部分｜稽核查核重點",
    "trail": "稽核軌跡", "checklist": "查核問題與證據", "tricks": "稽核員私房招數", "part3": "第三部分｜常見的缺失",
    "nc1": "常見缺失 No.1–4", "nc2": "常見缺失 No.5–8", "ncwrite": "缺失陳述寫法", "quiz": "隨堂小測驗", "summary": "重點回顧",
}
WHO = {"A": "**Allan 老師**", "R": "**阿拉蕾**"}
fmt = lambda s: f"{int(s // 60)}:{int(s % 60):02d}"
out = ["# 供應者關係安全｜動畫課程講稿", "",
       "ISO/IEC 27001:2022 附錄A 控制屬性「運作流程」：供應者關係安全（5.19、5.20、6.6、5.21、5.22、5.23、8.30）", "",
       f"總長 {fmt(tl['total'])}。時間碼對應 `video/` 影片與 `deck/index.html` 播放器。", ""]
for i, s in enumerate(tl["slides"], 1):
    out += [f"## {i:02d}. {TITLES.get(s['id'], s['id'])}　`{fmt(s['start'])}`", ""]
    out += [f"- `{fmt(l['start'])}` {WHO[l['who']]}：{l['text']}" for l in s["lines"]]
    out.append("")
open(os.path.join(ROOT, "content", "講稿.md"), "w", encoding="utf-8").write("\n".join(out))
print("ok")
