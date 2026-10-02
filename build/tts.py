#!/usr/bin/env python3
"""依 content/dialogue.json 產生配音、合成旁白音軌，並輸出 deck/timeline.js。

講師 Allan Lo：zh-TW-YunJheNeural（台灣男聲）
助教阿拉蕾：zh-TW-HsiaoYuNeural（提高音調、加快語速）

用法：python3 build/tts.py
"""
import asyncio
import hashlib
import json
import os
import subprocess
import sys
import wave

# 在需要自訂 CA 的代理環境中，讓 edge-tts 使用系統指定的憑證包
_ca = os.environ.get("TTS_CA_BUNDLE") or ("/root/.ccr/ca-bundle.crt" if os.path.exists("/root/.ccr/ca-bundle.crt") else None)
if _ca:
    import certifi
    certifi.where = lambda: _ca

import edge_tts  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "build", ".tts-cache")
DECK = os.path.join(ROOT, "deck")
RATE = 24000

VOICES = {
    "A": dict(voice="zh-TW-YunJheNeural", rate="+6%", pitch="+0Hz"),
    "R": dict(voice="zh-TW-HsiaoYuNeural", rate="+14%", pitch="+28Hz"),
}

# 字幕顯示文字 → 語音發音（長字串優先替換）
PRONOUNCE = {
    "ISO 27001": "ISO 二七零零一",
    "5.19": "五點一九", "5.20": "五點二十", "5.21": "五點二一", "5.22": "五點二二",
    "5.23": "五點二三", "6.6": "六點六", "8.30": "八點三十", "8.33": "八點三三",
    "二〇二〇": "二零二零", "二〇二一": "二零二一", "二〇二二": "二零二二", "二〇二三": "二零二三",
    "IaaS": "I A A S", "PaaS": "P A A S", "SaaS": "S A A S",
    "SBOM": "S BOM", "SOC 2": "S O C two", "CASB": "C A S B",
    "OWASP": "OWASP", "MOVEit": "Move it", "Kaseya": "卡塞亞",
    "Q版": "Q版", "～": "，", "……": "，",
}

HEAD = 0.7      # 每頁開始前的靜音（讓轉場動畫跑完）
GAP = 0.45      # 句與句之間
TAIL = 1.0      # 每頁結束後


def to_speech(text):
    for k in sorted(PRONOUNCE, key=len, reverse=True):
        text = text.replace(k, PRONOUNCE[k])
    return text


async def synth(who, text, path):
    v = VOICES[who]
    for attempt in range(5):
        try:
            await edge_tts.Communicate(to_speech(text), v["voice"], rate=v["rate"], pitch=v["pitch"]).save(path)
            if os.path.getsize(path) > 0:
                return
        except Exception as e:  # 網路偶發錯誤，重試
            print(f"  retry {attempt + 1}: {e}", file=sys.stderr)
        await asyncio.sleep(2 ** attempt)
    raise RuntimeError(f"TTS failed: {text}")


def decode(mp3):
    out = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", mp3, "-f", "s16le", "-ac", "1", "-ar", str(RATE), "-"],
        check=True, capture_output=True).stdout
    return out


def silence(sec):
    return b"\x00\x00" * int(round(sec * RATE))


async def main():
    os.makedirs(CACHE, exist_ok=True)
    os.makedirs(os.path.join(DECK, "audio"), exist_ok=True)
    data = json.load(open(os.path.join(ROOT, "content", "dialogue.json"), encoding="utf-8"))

    pcm = bytearray()
    t = 0.0
    slides = []
    for s in data["slides"]:
        pcm += silence(HEAD)
        t += HEAD
        start = t - HEAD
        lines = []
        for i, (who, text) in enumerate(s["lines"]):
            v = VOICES[who]
            key = hashlib.sha1(json.dumps([v, to_speech(text)], ensure_ascii=False).encode()).hexdigest()[:16]
            mp3 = os.path.join(CACHE, f"{key}.mp3")
            if not os.path.exists(mp3) or os.path.getsize(mp3) == 0:
                print(f"TTS [{s['id']}#{i}] {who}: {text[:24]}…")
                await synth(who, text, mp3)
            raw = decode(mp3)
            dur = len(raw) / 2 / RATE
            if i:
                pcm += silence(GAP)
                t += GAP
            lines.append(dict(who=who, text=text, start=round(t, 3), end=round(t + dur, 3)))
            pcm += raw
            t += dur
        pcm += silence(TAIL)
        t += TAIL
        slides.append(dict(id=s["id"], part=s["part"], start=round(start, 3), end=round(t, 3), lines=lines))

    wav = os.path.join(CACHE, "narration.wav")
    with wave.open(wav, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(bytes(pcm))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-af", "loudnorm=I=-16:TP=-1.5",
                    "-ar", "44100", "-ac", "1", "-b:a", "64k", os.path.join(DECK, "audio", "narration.mp3")], check=True)

    tl = dict(total=round(t, 3), slides=slides)
    with open(os.path.join(DECK, "timeline.js"), "w", encoding="utf-8") as f:
        f.write("// 由 build/tts.py 自動產生，請勿手動修改\nwindow.TIMELINE = ")
        json.dump(tl, f, ensure_ascii=False, indent=1)
        f.write(";\n")
    print(f"完成：{len(slides)} 頁，總長 {t / 60:.1f} 分鐘")


if __name__ == "__main__":
    asyncio.run(main())
