# 供應者關係安全｜ISO/IEC 27001:2022 動畫課程

以「運作流程」控制屬性分類的 **供應者關係安全（Supplier relationships security）** 教學動畫簡報。
Q版 **Allan Lo 講師**（台灣男聲配音）搭配 **助教阿拉蕾** 串場，分三大面向講解：

1. **ISMS 作業重點**：5.19、5.20、6.6、5.21、5.22、5.23、8.30 逐一說明，每個控制附一則管理實務案例
2. **稽核查核重點**：稽核軌跡、查核問題與證據對照表、稽核員私房招數
3. **常見的缺失**：缺失排行榜 No.1–8、缺失陳述（NCR）寫法、修正與矯正措施的差別

最後有隨堂測驗與重點回顧，全長約 15 分鐘。

## 檔案

| 路徑 | 說明 |
|---|---|
| `video/供應者關係安全_動畫課程.mp4` | 1920×1080 成品影片（含配音、字幕，15:10，約 57 MB） |
| `index.html` | 入口頁，自動導向 `deck/index.html`（可直接用於 GitHub Pages） |
| `deck/index.html` | 互動播放器：可暫停、跳頁、調速、開關字幕，可離線使用 |
| `content/dialogue.json` | 講稿原始檔（修改台詞從這裡改） |
| `content/講稿.md` | 含時間碼的講師講稿 |
| `build/` | 配音、字型、錄影的建置腳本 |

播放器快捷鍵：空白鍵 播放／暫停、← → 上／下一頁、M 章節選單、C 字幕、F 全螢幕。開始畫面與控制列的「☰ 章節」可直接跳到任一章節。網址加 `#c520` 等投影片 id 可直接跳到該頁。
用瀏覽器直接開啟 `deck/index.html` 即可；若瀏覽器限制本機檔案，可在 `deck/` 執行 `python3 -m http.server` 再開 `http://localhost:8000`。

## 重新產生

```bash
pip install edge-tts fonttools brotli
python3 build/tts.py        # 依 dialogue.json 產生配音與 deck/timeline.js
python3 build/fonts.py      # 依用到的字產生子集字型（改了投影片文字才需要）
python3 build/script_md.py  # 產生 content/講稿.md
node build/render.js        # 逐格錄製 MP4（需 Playwright + ffmpeg）
node build/render.js --stills 30,120   # 只輸出指定秒數截圖檢查版面
```

投影片畫面在 `deck/index.html`：元素加 `data-c="2"` 代表第 2 句台詞開始時出現，`data-d` 為延遲秒數，`data-fx` 為動畫效果（up / pop / stamp / slideup / type…），`data-hl` 為講到該句時高亮。

## 備註

- 配音使用 Microsoft Edge 線上語音：講師 `zh-TW-YunJheNeural`、助教 `zh-TW-HsiaoYuNeural`（提高音調）。
- 實務案例皆為改編、去識別化的輔導情境；SolarWinds、Kaseya、MOVEit 為公開資安事件。
- 「阿拉蕾」為致敬風格的原創 Q 版繪製；若要公開販售或對外大量散布，請留意角色名稱與造型的著作權。
