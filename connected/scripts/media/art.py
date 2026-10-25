"""Original fan-art and sketches for Tum and 3Chan posts."""

import math

import numpy as np
from PIL import Image, ImageDraw, ImageOps

from common import ensure_dirs, font, record
from manga import bg_sky, bg_space, bg_street, draw_cat, draw_person, draw_pip, speed_lines

W, H = 640, 480


def sketch(draw_fn, tint_dark, tint_light, paper=True):
    gray = Image.new("L", (W, H), 255)
    d = ImageDraw.Draw(gray)
    draw_fn(d)
    img = ImageOps.colorize(gray, black=tint_dark, white=tint_light)
    if paper:
        dd = ImageDraw.Draw(img, "RGBA")
        rng = np.random.default_rng(3)
        for _ in range(1500):
            x, y = rng.integers(0, W), rng.integers(0, H)
            dd.point((x, y), fill=(0, 0, 0, 18))
    return img


def mei_fanart(d):
    bg_street(d, W, H)
    draw_person(d, "mei", W * 0.5, H * 0.98, H * 0.1, "laugh")
    d.text((20, 20), "Mei from Lantern Street Couriers!", font=font(20, bold=True), fill=40)


def pip_doodle(d):
    bg_space(d, W, H)
    draw_pip(d, W * 0.5, H * 0.45, H * 0.18, "laugh")
    d.text((W / 2, H - 30), "pip pip hooray", font=font(22, bold=True), fill=230, anchor="mm")


def mochi_sketch(d):
    draw_cat(d, W * 0.52, H * 0.85, 90)
    d.text((20, 20), "Mochi (from TheHendersonsHome) mid-wiggle", font=font(18, bold=True), fill=60)
    for k in range(5):
        d.arc((W * 0.15 + k * 8, H * 0.6 - k * 8, W * 0.3 + k * 8, H * 0.75 - k * 8), 200, 300, fill=120, width=2)


def courier_ship(d):
    d.rectangle((0, 0, W, H), fill=30)
    rng = np.random.default_rng(9)
    for _ in range(300):
        x, y = rng.integers(0, W), rng.integers(0, H)
        d.point((x, y), fill=220)
    cx, cy = W * 0.45, H * 0.5
    d.polygon([(cx + 120, cy), (cx - 80, cy - 70), (cx - 40, cy), (cx - 80, cy + 70)], fill=235, outline=255)
    d.polygon([(cx - 45, cy - 20), (cx - 120, cy), (cx - 45, cy + 20)], fill=160)
    for i, r in enumerate([40, 28, 18]):
        d.ellipse((W * 0.8 - r, H * 0.25 + i * 90 - r, W * 0.8 + r, H * 0.25 + i * 90 + r), fill=120, outline=200)
    d.text((20, H - 40), "Star Courier fan art - the parcel always gets through", font=font(18, bold=True), fill=230)


def sunset_painting(d):
    bg_sky(d, W, H)
    for i in range(5):
        y = H * 0.55 + i * 30
        d.polygon([(0, H), (0, y), (W * 0.3, y - 40 + i * 6), (W * 0.6, y - 10), (W, y - 50 + i * 8), (W, H)], fill=200 - i * 30)
    d.ellipse((W * 0.62, H * 0.18, W * 0.78, H * 0.34), fill=255, outline=120, width=3)


def paper_plane(d):
    speed_lines(d, W, H, W * 0.3, H * 0.6, 50)
    cx, cy = W * 0.55, H * 0.45
    d.polygon([(cx + 140, cy - 40), (cx - 120, cy - 10), (cx - 30, cy + 10)], fill=255, outline=0, width=3)
    d.polygon([(cx + 140, cy - 40), (cx - 30, cy + 10), (cx - 60, cy + 70)], fill=225, outline=0, width=3)
    d.text((20, 20), "24 metres!!", font=font(30, bold=True), fill=0)


ART = [
    ("mei-fanart", mei_fanart, (60, 30, 20), (255, 236, 210)),
    ("pip-doodle", pip_doodle, (20, 20, 50), (200, 225, 255)),
    ("mochi-sketch", mochi_sketch, (70, 50, 30), (255, 248, 236)),
    ("courier-ship", courier_ship, (10, 10, 30), (180, 220, 255)),
    ("sunset-painting", sunset_painting, (90, 40, 60), (255, 214, 170)),
    ("paper-plane", paper_plane, (20, 40, 60), (235, 245, 255)),
]


def main():
    out = ensure_dirs("art")
    for key, fn, dark, light in ART:
        p = out / f"{key}.jpg"
        sketch(fn, dark, light).save(p, quality=86)
        record(f"art:{key}", p)
    print("art", len(ART))


if __name__ == "__main__":
    main()
