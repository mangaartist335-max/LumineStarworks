"""Snapshots for SnapNest's starting albums: everyday scenes from around
town, drawn from scratch so they belong to the people who "took" them.
Run on its own with: python3 scripts/media/snapshots.py
"""

import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import ensure_dirs, font, noise2d, record, save_manifest, vertical_gradient  # noqa: E402

W, H = 800, 600


def base(sky, ground, horizon=0.58, seed=1):
    arr = vertical_gradient(W, H, [(0, sky[0]), (horizon - 0.01, sky[1]), (horizon, ground[0]), (1, ground[1])]).astype(np.float32)
    n = noise2d(W, H, 60, seed)[..., None] * 18 - 9
    return Image.fromarray(np.clip(arr + n, 0, 255).astype(np.uint8))


def tree(d, x, y, s=1.0, leaf=(70, 140, 70)):
    d.rectangle((x - 8 * s, y - 60 * s, x + 8 * s, y), fill=(110, 80, 50))
    for dx, dy, r in [(0, -95, 48), (-30, -70, 36), (30, -70, 36)]:
        d.ellipse((x + dx * s - r * s, y + dy * s - r * s, x + dx * s + r * s, y + dy * s + r * s), fill=leaf)


def finish(img, path, key, title):
    img = img.filter(ImageFilter.GaussianBlur(0.6))
    img.save(path, quality=84)
    record(f"snapshot:{key}", path, title=title, width=W, height=H)


def picnic(p):
    img = base(((120, 190, 255), (200, 230, 255)), ((110, 180, 90), (80, 150, 70)), seed=3)
    d = ImageDraw.Draw(img)
    for x in (90, 690):
        tree(d, x, 360, 1.3)
    d.polygon([(220, 470), (580, 430), (650, 560), (170, 590)], fill=(220, 60, 60))
    for i in range(6):
        d.line((220 + i * 60, 470 - i * 7, 170 + i * 80, 590), fill=(250, 240, 240), width=4)
    d.rectangle((360, 430, 450, 480), fill=(170, 120, 60))
    d.arc((360, 395, 450, 465), 180, 360, fill=(120, 80, 40), width=6)
    for x, c in [(300, (255, 120, 120)), (500, (250, 210, 90)), (540, (140, 200, 255))]:
        d.ellipse((x, 500, x + 40, 525), fill=c)
    d.ellipse((620, 60, 700, 140), fill=(255, 240, 160))
    return img


def kites(p):
    img = base(((80, 160, 250), (190, 225, 255)), ((120, 190, 100), (90, 160, 80)), horizon=0.75, seed=4)
    d = ImageDraw.Draw(img)
    for i, (x, y, c) in enumerate([(200, 150, (240, 80, 80)), (420, 90, (250, 200, 60)), (610, 190, (90, 120, 240))]):
        d.polygon([(x, y - 40), (x + 30, y), (x, y + 50), (x - 30, y)], fill=c)
        d.line((x, y + 50, x - 60 + i * 40, 560), fill=(60, 60, 60), width=1)
        for k in range(4):
            d.line((x - 4 + k * 3, y + 55 + k * 18, x + 6 + k * 3, y + 65 + k * 18), fill=c, width=4)
    for x in (120, 380, 650):
        d.ellipse((x - 10, 520, x + 10, 540), fill=(240, 200, 170))
        d.rectangle((x - 8, 540, x + 8, 575), fill=(80, 110, 200))
    return img


def market(p):
    img = base(((150, 200, 250), (220, 235, 250)), ((190, 180, 160), (170, 160, 140)), horizon=0.5, seed=5)
    d = ImageDraw.Draw(img)
    for i, x in enumerate((60, 310, 560)):
        stripe = [(240, 80, 80), (80, 160, 90), (250, 190, 60)][i]
        d.polygon([(x, 220), (x + 200, 220), (x + 220, 270), (x - 20, 270)], fill=stripe)
        for k in range(5):
            d.polygon([(x + k * 44, 220), (x + k * 44 + 20, 220), (x + k * 44 + 24, 270), (x + k * 44 + 4, 270)], fill=(250, 250, 245))
        d.rectangle((x, 270, x + 200, 420), fill=(150, 110, 70))
        d.rectangle((x - 10, 400, x + 210, 430), fill=(120, 85, 55))
        fruit = [(220, 40, 60), (250, 160, 40), (120, 180, 60)][i]
        for r in range(3):
            for c in range(8):
                fx, fy = x + 10 + c * 24, 350 + r * 16
                d.ellipse((fx, fy, fx + 18, fy + 16), fill=fruit)
    d.text((W // 2, 120), "FARMERS' MARKET", font=font(40, bold=True), fill=(90, 60, 30), anchor="mm")
    return img


def pumpkin(p):
    img = base(((250, 190, 120), (255, 225, 170)), ((170, 140, 90), (140, 110, 70)), seed=6)
    d = ImageDraw.Draw(img)
    for x in range(0, W, 90):
        d.rectangle((x, 260, x + 70, 330), fill=(230, 200, 120))
        d.line((x, 280, x + 70, 280), fill=(200, 170, 100), width=3)
    for dx in (-90, -45, 0, 45, 90):
        d.ellipse((400 + dx - 70, 330, 400 + dx + 70, 520), fill=(240, 130, 40), outline=(200, 100, 30), width=3)
    d.rectangle((388, 300, 412, 340), fill=(100, 140, 60))
    d.rounded_rectangle((520, 470, 700, 530), 8, fill=(255, 250, 240))
    d.text((610, 500), "1st PLACE", font=font(28, bold=True), fill=(180, 60, 40), anchor="mm")
    return img


def snowman(p):
    img = base(((170, 200, 230), (220, 230, 245)), ((245, 248, 252), (225, 232, 242)), horizon=0.6, seed=7)
    d = ImageDraw.Draw(img)
    rng = np.random.default_rng(8)
    for _ in range(220):
        x, y = rng.random() * W, rng.random() * H
        d.ellipse((x - 2, y - 2, x + 2, y + 2), fill=(255, 255, 255))
    for cx, cy, r in [(400, 470, 95), (400, 330, 70), (400, 220, 50)]:
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(250, 252, 255), outline=(200, 210, 225), width=2)
    d.polygon([(345, 290), (455, 290), (440, 400), (400, 380), (360, 400)], fill=(30, 30, 35))
    d.polygon([(385, 270), (415, 270), (400, 300)], fill=(250, 250, 250))
    d.polygon([(390, 280), (400, 274), (410, 280), (400, 286)], fill=(30, 30, 35))
    d.rectangle((355, 150, 445, 160), fill=(25, 25, 30))
    d.rectangle((370, 95, 430, 152), fill=(25, 25, 30))
    for ex in (385, 415):
        d.ellipse((ex - 5, 205, ex + 5, 215), fill=(20, 20, 20))
    d.polygon([(400, 222), (440, 230), (400, 234)], fill=(240, 130, 40))
    return img


def ice_rink(p):
    img = base(((60, 80, 140), (140, 160, 210)), ((210, 230, 245), (180, 205, 230)), horizon=0.55, seed=9)
    d = ImageDraw.Draw(img)
    for x in range(0, W, 40):
        d.line((x, 330, x, 300), fill=(120, 80, 50), width=4)
    d.line((0, 300, W, 300), fill=(120, 80, 50), width=5)
    for k in range(20):
        x = 40 + k * 40
        d.ellipse((x - 4, 60 + 10 * math.sin(k), x + 4, 68 + 10 * math.sin(k)), fill=(255, 230, 140))
    for i, (x, c) in enumerate([(220, (220, 60, 80)), (400, (60, 140, 220)), (560, (90, 180, 90))]):
        y = 420 + (i % 2) * 40
        d.ellipse((x - 14, y - 70, x + 14, y - 42), fill=(240, 205, 175))
        d.rectangle((x - 18, y - 42, x + 18, y + 10), fill=c)
        d.line((x - 10, y + 10, x - 22, y + 50), fill=(40, 40, 60), width=8)
        d.line((x + 10, y + 10, x + 22, y + 50), fill=(40, 40, 60), width=8)
        d.arc((x - 60, y + 40, x + 60, y + 80), 200, 340, fill=(170, 190, 220), width=2)
    return img


SHOTS = [
    ("picnic-park", "Picnic in the park", picnic),
    ("kite-day", "Kite day", kites),
    ("farmers-market", "Saturday farmers' market", market),
    ("harvest-pumpkin", "Harvest fair pumpkins", pumpkin),
    ("tuxedo-snowman", "The tuxedo snowman", snowman),
    ("ice-rink", "Free skate at the rink", ice_rink),
]


def main():
    out = ensure_dirs("snapshots")
    for key, title, fn in SHOTS:
        path = out / f"{key}.jpg"
        finish(fn(path), path, key, title)
        print("snapshot", key, path.stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
    save_manifest()
