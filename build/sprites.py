#!/usr/bin/env python3
"""從角色設定圖（assets/characters/*_sheet.jpg）裁切角色素材並去背，輸出到 deck/img/。

去背方式：從裁切框邊緣做 flood fill，把與外框相連的淺色背景設為透明；
角色有黑色描邊，所以內部的白色（襯衫、帽 T）不會被吃掉。
用法：python3 build/sprites.py
"""
import os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "characters")
OUT = os.path.join(ROOT, "deck", "img")

# (輸出名稱, 來源圖, 裁切框 x0, y0, x1, y1)
CROPS = [
    ("allan_body", "allan_sheet.jpg", (40, 85, 772, 1472)),
    ("allan_smile", "allan_sheet.jpg", (768, 790, 1022, 1122)),
    ("allan_laugh", "allan_sheet.jpg", (1070, 790, 1335, 1122)),
    ("allan_think", "allan_sheet.jpg", (1378, 790, 1642, 1122)),
    ("allan_confused", "allan_sheet.jpg", (1640, 790, 1968, 1122)),
    ("allan_surprised", "allan_sheet.jpg", (768, 1132, 1022, 1468)),
    ("allan_point", "allan_sheet.jpg", (1040, 1132, 1335, 1468)),
    ("allan_wink", "allan_sheet.jpg", (1380, 1132, 1645, 1468)),
    ("allan_worried", "allan_sheet.jpg", (1700, 1132, 1962, 1468)),
    ("arale_body", "arale_sheet.jpg", (70, 800, 410, 1472)),
    ("arale_laugh", "arale_sheet.jpg", (440, 810, 794, 1113)),
    ("arale_think", "arale_sheet.jpg", (827, 810, 1180, 1113)),
    ("arale_surprised", "arale_sheet.jpg", (1213, 810, 1566, 1113)),
    ("arale_confused", "arale_sheet.jpg", (1597, 810, 1951, 1113)),
    ("arale_explain", "arale_sheet.jpg", (440, 1145, 794, 1448)),
    ("arale_cry", "arale_sheet.jpg", (827, 1145, 1180, 1448)),
    ("arale_thumb", "arale_sheet.jpg", (1213, 1145, 1566, 1448)),
    ("arale_cheer", "arale_sheet.jpg", (1597, 1145, 1951, 1448)),
]


def cutout(img, bottom=True, holes=0):
    """bottom=False：半身像的衣服貼著下緣，不從下緣找背景（避免吃掉淺色襯衫）。
    holes>0：另外移除被身體包住、面積大於此值的白色區塊（例如兩腿之間的空隙）。"""
    a = np.asarray(img.convert("RGB")).astype(int)
    light = (a.min(axis=2) > 228) & (a.max(axis=2) - a.min(axis=2) < 22)
    lab, _ = ndimage.label(light)
    seeds = [lab[0], lab[:, 0], lab[:, -1]] + ([lab[-1]] if bottom else [])
    edge = set(np.unique(np.concatenate(seeds))) - {0}
    bg = np.isin(lab, list(edge))
    if holes:
        sizes = ndimage.sum(np.ones_like(lab), lab, range(1, lab.max() + 1))
        bg |= np.isin(lab, [i + 1 for i, sz in enumerate(sizes) if sz > holes])
    # 只保留最大的前景連通區（去掉角落殘留的小字或雜點）
    fg_lab, n = ndimage.label(~bg)
    if n > 1:
        sizes = ndimage.sum(np.ones_like(fg_lab), fg_lab, range(1, n + 1))
        keep = np.isin(fg_lab, [i + 1 for i, s in enumerate(sizes) if s > sizes.max() * 0.04])
    else:
        keep = ~bg
    alpha = Image.fromarray((keep * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(0.8))
    out = img.convert("RGBA")
    out.putalpha(alpha)
    return out.crop(out.getbbox())


def main():
    os.makedirs(OUT, exist_ok=True)
    sheets = {}
    for name, src, box in CROPS:
        if src not in sheets:
            sheets[src] = Image.open(os.path.join(SRC, src))
        im = cutout(sheets[src].crop(box), bottom=name.endswith("_body"), holes={"arale_body": 3000, "allan_confused": 2500}.get(name, 0))
        print(name, "原尺寸", im.size)  # 全身圖的原尺寸＝characters.js 疊圖座標系
        limit = 720 if name.endswith("_body") else 280
        k = limit / max(im.size)
        if k < 1:
            im = im.resize((round(im.size[0] * k), round(im.size[1] * k)), Image.LANCZOS)
        im.save(os.path.join(OUT, name + ".png"), optimize=True)


if __name__ == "__main__":
    main()
