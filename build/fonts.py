#!/usr/bin/env python3
"""把簡報用到的字元從 Google Fonts 下載成「子集字型」放進 deck/fonts/，
讓簡報可離線播放、錄影時字型也一致。修改投影片文字後請重新執行。

用法：python3 build/fonts.py
"""
import os
import re
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "deck", "fonts")
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
FAMILIES = [
    ("Chiron GoRound TC", [500, 700, 900]),
    ("Noto Sans TC", [400, 500, 700, 900]),
    ("Baloo 2", [700, 800]),
]
SOURCES = ["deck/index.html", "deck/characters.js", "deck/engine.js", "deck/timeline.js", "content/dialogue.json"]


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def parse_range(r):
    out = set()
    for part in r.split(","):
        part = part.strip().upper().replace("U+", "")
        if "-" in part:
            a, b = part.split("-")
            out |= set(range(int(a, 16), int(b, 16) + 1))
        elif "?" in part:
            out |= set(range(int(part.replace("?", "0"), 16), int(part.replace("?", "F"), 16) + 1))
        else:
            out.add(int(part, 16))
    return out


def subset(path, used):
    from fontTools import subset as fts
    from fontTools.ttLib import TTFont
    f = TTFont(path)
    s = fts.Subsetter(fts.Options(flavor="woff2", layout_features=["*"]))
    s.populate(unicodes=used)
    s.subset(f)
    f.flavor = "woff2"
    f.save(path)


def main():
    chars = set()
    for s in SOURCES:
        chars |= set(open(os.path.join(ROOT, s), encoding="utf-8").read())
    chars |= set("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")
    text = "".join(sorted(c for c in chars if c.isprintable() and ord(c) >= 32 and not (0x1F000 <= ord(c) <= 0x1FFFF)))
    used = {ord(c) for c in text}
    os.makedirs(OUT, exist_ok=True)
    for old in os.listdir(OUT):
        os.remove(os.path.join(OUT, old))
    css_out = []
    for fam, weights in FAMILIES:
        for w in weights:
            q = urllib.parse.urlencode({"family": f"{fam}:wght@{w}", "display": "swap"})
            css = get("https://fonts.googleapis.com/css2?" + q).decode()
            blocks = re.findall(r"@font-face\s*\{[^}]+\}", css)
            assert blocks, css[:300]
            kept = 0
            for i, b in enumerate(blocks):
                rng = re.search(r"unicode-range:\s*([^;]+);", b)
                if rng and not (used & parse_range(rng.group(1))):
                    continue  # 這個分片沒有用到的字，略過
                url = re.search(r"url\((https://[^)]+)\)", b).group(1)
                fn = f"{fam.replace(' ', '')}-{w}-{i}.woff2"
                raw = os.path.join(OUT, fn)
                open(raw, "wb").write(get(url))
                subset(raw, used)
                kept += 1
                b = b.replace(url, f"fonts/{fn}").replace("font-display: swap", "font-display: block")
                b = re.sub(r"\s+format\('woff2'\)", " format('woff2')", b)
                css_out.append(b)
            fn = f"{kept}/{len(blocks)} 分片"
            print("ok", fam, w, fn)
    open(os.path.join(OUT, "fonts.css"), "w", encoding="utf-8").write("\n".join(css_out) + "\n")


if __name__ == "__main__":
    main()
