"""Original desktop wallpapers, sample photos and profile pictures."""

import math

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from common import ensure_dirs, font, noise2d, record, to_image, vertical_gradient

W, H = 1920, 1080


def connected_blue(w=W, h=H):
    base = vertical_gradient(w, h, [(0, (8, 40, 92)), (0.55, (18, 92, 168)), (1, (6, 30, 70))])
    img = to_image(base)
    glow = Image.new("RGB", (w, h), (0, 0, 0))
    d = ImageDraw.Draw(glow)
    for i, (amp, off, width, color) in enumerate([(160, 0.58, 90, (120, 200, 255)), (120, 0.66, 50, (190, 235, 255)), (200, 0.5, 140, (60, 150, 230))]):
        pts = []
        for x in range(-50, w + 60, 20):
            y = h * off + amp * math.sin(x / w * math.pi * 1.6 + i * 0.8) - x * 0.12
            pts.append((x, y))
        d.line(pts, fill=color, width=width)
    glow = glow.filter(ImageFilter.GaussianBlur(45))
    img = Image.blend(img, Image.fromarray(np.minimum(255, np.asarray(img, dtype=np.int32) + np.asarray(glow, dtype=np.int32)).astype(np.uint8)), 0.85)
    d = ImageDraw.Draw(img, "RGBA")
    rng = np.random.default_rng(3)
    for _ in range(60):
        x, y, r = rng.integers(0, w), rng.integers(0, h), int(rng.integers(6, 40))
        d.ellipse((x - r, y - r, x + r, y + r), fill=(255, 255, 255, int(rng.integers(8, 30))))
    return img.filter(ImageFilter.GaussianBlur(1))


def mountains(d, w, h, base_y, amp, color, seed, rough=6):
    rng = np.random.default_rng(seed)
    pts = [(0, h)]
    y = base_y
    for x in range(0, w + 40, 40):
        y += rng.normal(0, amp / rough)
        y = min(max(y, base_y - amp), base_y + amp * 0.3)
        pts.append((x, y))
    pts.append((w, h))
    d.polygon(pts, fill=color)


def aurora_lake(w=W, h=H):
    sky = vertical_gradient(w, h, [(0, (4, 8, 28)), (0.45, (12, 30, 64)), (0.62, (20, 60, 90)), (1, (6, 14, 30))])
    n = noise2d(w, h, 420, 11, 3)
    band = np.exp(-((np.linspace(0, 1, h)[:, None] - (0.28 + 0.12 * np.sin(np.linspace(0, 6, w)[None, :] + n * 3))) ** 2) / 0.006)
    sky[:, :, 1] += band * 150 * n
    sky[:, :, 2] += band * 90 * n
    sky[:, :, 0] += band * 30
    img = to_image(sky)
    d = ImageDraw.Draw(img)
    rng = np.random.default_rng(5)
    for _ in range(500):
        x, y = rng.integers(0, w), rng.integers(0, int(h * 0.55))
        b = int(rng.integers(120, 255))
        d.point((x, y), fill=(b, b, b))
    mountains(d, w, h, int(h * 0.6), 140, (10, 22, 38), 7)
    mountains(d, w, h, int(h * 0.66), 80, (6, 14, 26), 9)
    # Lake: mirrored, darkened sky band
    top = int(h * 0.72)
    reflect = img.crop((0, top - (h - top), w, top)).transpose(Image.FLIP_TOP_BOTTOM)
    reflect = Image.blend(reflect, Image.new("RGB", reflect.size, (4, 10, 22)), 0.55).filter(ImageFilter.GaussianBlur(3))
    img.paste(reflect, (0, top))
    return img


def harbor_lights(w=W, h=H):
    img = to_image(vertical_gradient(w, h, [(0, (40, 30, 80)), (0.5, (220, 120, 90)), (0.62, (250, 180, 120)), (1, (20, 24, 50))]))
    d = ImageDraw.Draw(img)
    rng = np.random.default_rng(21)
    water = int(h * 0.7)
    x = 0
    while x < w:
        bw = int(rng.integers(50, 140))
        bh = int(rng.integers(120, 420))
        d.rectangle((x, water - bh, x + bw, water), fill=(18, 20, 40))
        for wy in range(water - bh + 14, water - 10, 22):
            for wx in range(x + 8, x + bw - 10, 18):
                if rng.random() < 0.45:
                    d.rectangle((wx, wy, wx + 8, wy + 10), fill=(255, int(rng.integers(190, 235)), 120))
        x += bw + int(rng.integers(4, 18))
    d.rectangle((0, water, w, h), fill=(16, 22, 48))
    for y in range(water + 6, h, 7):
        for _ in range(14):
            sx = int(rng.integers(0, w))
            d.line((sx, y, sx + int(rng.integers(10, 50)), y), fill=(255, 200, 130), width=1)
    return img.filter(ImageFilter.GaussianBlur(0.8))


def cherry_hills(w=W, h=H):
    img = to_image(vertical_gradient(w, h, [(0, (255, 214, 226)), (0.6, (255, 240, 236)), (1, (210, 236, 210))]))
    d = ImageDraw.Draw(img, "RGBA")
    for i, (base, color) in enumerate([(0.62, (170, 210, 160)), (0.7, (140, 190, 130)), (0.8, (110, 170, 110))]):
        pts = [(0, h)]
        for x in range(0, w + 30, 30):
            pts.append((x, h * base + 60 * math.sin(x / w * math.pi * (2 + i) + i)))
        pts.append((w, h))
        d.polygon(pts, fill=color)
    rng = np.random.default_rng(31)
    for _ in range(260):
        x, y, r = rng.integers(0, w), rng.integers(0, h), int(rng.integers(4, 11))
        d.ellipse((x - r, y - r // 2, x + r, y + r // 2), fill=(255, 170, 200, int(rng.integers(120, 220))))
    return img


def starfield(w=W, h=H):
    n1 = noise2d(w, h, 500, 41, 4)
    n2 = noise2d(w, h, 300, 42, 3)
    arr = np.zeros((h, w, 3), dtype=np.float32)
    arr[:, :, 0] = 10 + n1 ** 3 * 140
    arr[:, :, 1] = 6 + (n1 * n2) ** 2 * 80
    arr[:, :, 2] = 22 + n2 ** 2 * 170
    img = to_image(arr)
    d = ImageDraw.Draw(img)
    rng = np.random.default_rng(43)
    for _ in range(1400):
        x, y = rng.integers(0, w), rng.integers(0, h)
        b = int(rng.integers(140, 255))
        r = 1 if rng.random() < 0.94 else 2
        d.ellipse((x - r, y - r, x + r, y + r), fill=(b, b, min(255, b + 20)))
    return img


def retro_grid(w=W, h=H):
    img = to_image(vertical_gradient(w, h, [(0, (20, 0, 40)), (0.55, (120, 20, 110)), (0.56, (30, 0, 50)), (1, (10, 0, 20))]))
    d = ImageDraw.Draw(img)
    cx, horizon = w // 2, int(h * 0.56)
    for i in range(12):
        r = 260
        y = horizon - 40 - i * 0
    sun = Image.new("L", (w, h), 0)
    sd = ImageDraw.Draw(sun)
    sd.ellipse((cx - 230, horizon - 380, cx + 230, horizon + 80), fill=255)
    for k in range(8):
        y = horizon - 120 + k * 22
        sd.rectangle((0, y, w, y + 4 + k), fill=0)
    sun_col = Image.fromarray(vertical_gradient(w, h, [(0, (255, 230, 90)), (0.56, (255, 60, 140)), (1, (255, 60, 140))]).astype(np.uint8))
    img.paste(sun_col, (0, 0), sun.crop((0, 0, w, horizon)).resize((w, horizon)).crop((0, 0, w, h)) if False else sun)
    d.rectangle((0, horizon, w, h), fill=(16, 0, 30))
    for i in range(1, 22):
        y = horizon + int((i / 22) ** 2.2 * (h - horizon))
        d.line((0, y, w, y), fill=(255, 60, 200), width=2)
    for k in range(-24, 25):
        d.line((cx + k * 40, horizon, cx + k * 260, h), fill=(255, 60, 200), width=2)
    return img.filter(ImageFilter.GaussianBlur(0.6))


def ocean_glass(w=W, h=H):
    base = vertical_gradient(w, h, [(0, (150, 230, 240)), (0.5, (30, 160, 190)), (1, (8, 60, 110))])
    c = noise2d(w, h, 140, 51, 3)
    caustic = np.abs(np.sin(c * 18)) ** 8
    base += caustic[:, :, None] * np.array([90, 110, 90])[None, None, :]
    return to_image(base).filter(ImageFilter.GaussianBlur(1.2))


def autumn_path(w=W, h=H):
    img = to_image(vertical_gradient(w, h, [(0, (255, 200, 120)), (0.55, (240, 140, 70)), (1, (120, 60, 30))]))
    d = ImageDraw.Draw(img, "RGBA")
    rng = np.random.default_rng(61)
    for i in range(14):
        x = int(i * w / 13 + rng.integers(-40, 40))
        trunk_h = int(rng.integers(380, 600))
        d.rectangle((x - 10, h - trunk_h, x + 10, h), fill=(60, 30, 20))
        for _ in range(26):
            r = int(rng.integers(40, 90))
            cx = x + int(rng.integers(-120, 120))
            cy = h - trunk_h + int(rng.integers(-120, 80))
            col = [(200, 70, 30), (230, 120, 40), (180, 40, 30), (240, 170, 60)][int(rng.integers(0, 4))]
            d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(*col, 200))
    d.polygon([(w * 0.42, h), (w * 0.49, h * 0.62), (w * 0.51, h * 0.62), (w * 0.62, h)], fill=(150, 110, 70, 230))
    for _ in range(200):
        x, y = rng.integers(0, w), rng.integers(int(h * 0.5), h)
        d.ellipse((x, y, x + 10, y + 6), fill=(220, 100, 40, 200))
    return img


WALLPAPERS = [
    ("connected-blue", "Connected Blue", connected_blue),
    ("aurora-lake", "Aurora Lake", aurora_lake),
    ("harbor-lights", "Harbor Lights", harbor_lights),
    ("cherry-hills", "Cherry Blossom Hills", cherry_hills),
    ("starfield", "Starfield", starfield),
    ("retro-grid", "Retro Grid", retro_grid),
    ("ocean-glass", "Ocean Glass", ocean_glass),
    ("autumn-path", "Autumn Path", autumn_path),
]


AVATARS = [
    ("flower", (255, 140, 170), (255, 220, 120)),
    ("fish", (60, 160, 220), (255, 170, 60)),
    ("ball", (80, 180, 90), (255, 255, 255)),
    ("guitar", (150, 90, 200), (240, 190, 110)),
    ("rocket", (40, 50, 110), (230, 80, 60)),
    ("cat", (250, 190, 110), (90, 60, 40)),
    ("robot", (120, 140, 160), (120, 220, 255)),
    ("sun", (110, 190, 255), (255, 220, 60)),
    ("gamepad", (70, 70, 90), (110, 230, 140)),
    ("palette", (240, 230, 210), (220, 80, 80)),
    ("star", (30, 40, 80), (255, 230, 90)),
    ("leaf", (200, 240, 200), (60, 150, 70)),
]


def avatar(kind, bg, fg, s=96):
    img = Image.fromarray(vertical_gradient(s, s, [(0, tuple(min(255, c + 40) for c in bg)), (1, bg)]).astype(np.uint8))
    d = ImageDraw.Draw(img)
    c = s // 2
    if kind == "flower":
        for a in range(0, 360, 60):
            x, y = c + 20 * math.cos(math.radians(a)), c + 20 * math.sin(math.radians(a))
            d.ellipse((x - 14, y - 14, x + 14, y + 14), fill=(255, 255, 255))
        d.ellipse((c - 12, c - 12, c + 12, c + 12), fill=fg)
    elif kind == "fish":
        d.ellipse((c - 28, c - 16, c + 18, c + 16), fill=fg)
        d.polygon([(c + 14, c), (c + 34, c - 16), (c + 34, c + 16)], fill=fg)
        d.ellipse((c - 18, c - 6, c - 10, c + 2), fill=(20, 20, 20))
    elif kind == "ball":
        d.ellipse((c - 30, c - 30, c + 30, c + 30), fill=fg, outline=(30, 30, 30), width=3)
        d.regular_polygon((c, c, 11), 5, fill=(30, 30, 30))
    elif kind == "guitar":
        d.ellipse((c - 22, c - 2, c + 14, c + 30), fill=fg)
        d.ellipse((c - 14, c - 16, c + 8, c + 6), fill=fg)
        d.line((c - 3, c + 10, c + 26, c - 30), fill=(90, 50, 30), width=6)
        d.ellipse((c - 9, c + 8, c + 1, c + 18), fill=(60, 30, 20))
    elif kind == "rocket":
        d.polygon([(c, c - 34), (c + 14, c + 10), (c - 14, c + 10)], fill=(240, 240, 250))
        d.polygon([(c - 14, c + 10), (c - 24, c + 26), (c - 6, c + 14)], fill=fg)
        d.polygon([(c + 14, c + 10), (c + 24, c + 26), (c + 6, c + 14)], fill=fg)
        d.ellipse((c - 6, c - 12, c + 6, c), fill=(100, 180, 255))
        d.polygon([(c - 8, c + 14), (c + 8, c + 14), (c, c + 34)], fill=(255, 190, 60))
    elif kind == "cat":
        d.ellipse((c - 28, c - 20, c + 28, c + 30), fill=fg)
        d.polygon([(c - 26, c - 6), (c - 20, c - 34), (c - 4, c - 18)], fill=fg)
        d.polygon([(c + 26, c - 6), (c + 20, c - 34), (c + 4, c - 18)], fill=fg)
        d.ellipse((c - 14, c - 2, c - 6, c + 8), fill=(250, 240, 200))
        d.ellipse((c + 6, c - 2, c + 14, c + 8), fill=(250, 240, 200))
        d.polygon([(c - 4, c + 12), (c + 4, c + 12), (c, c + 17)], fill=(240, 130, 140))
    elif kind == "robot":
        d.rounded_rectangle((c - 26, c - 22, c + 26, c + 24), 8, fill=(220, 225, 235))
        d.ellipse((c - 16, c - 8, c - 4, c + 4), fill=fg)
        d.ellipse((c + 4, c - 8, c + 16, c + 4), fill=fg)
        d.rectangle((c - 12, c + 10, c + 12, c + 14), fill=(90, 100, 120))
        d.line((c, c - 22, c, c - 34), fill=(220, 225, 235), width=3)
        d.ellipse((c - 4, c - 40, c + 4, c - 32), fill=(255, 90, 90))
    elif kind == "sun":
        for a in range(0, 360, 30):
            x1, y1 = c + 22 * math.cos(math.radians(a)), c + 22 * math.sin(math.radians(a))
            x2, y2 = c + 38 * math.cos(math.radians(a)), c + 38 * math.sin(math.radians(a))
            d.line((x1, y1, x2, y2), fill=fg, width=5)
        d.ellipse((c - 18, c - 18, c + 18, c + 18), fill=fg)
    elif kind == "gamepad":
        d.rounded_rectangle((c - 34, c - 14, c + 34, c + 18), 14, fill=(200, 205, 215))
        d.rectangle((c - 24, c - 2, c - 12, c + 4), fill=(60, 60, 70))
        d.rectangle((c - 21, c - 5, c - 15, c + 7), fill=(60, 60, 70))
        d.ellipse((c + 12, c - 6, c + 20, c + 2), fill=fg)
        d.ellipse((c + 20, c + 2, c + 28, c + 10), fill=(255, 100, 100))
    elif kind == "palette":
        d.ellipse((c - 32, c - 26, c + 32, c + 28), fill=(250, 245, 235), outline=(150, 120, 90), width=2)
        for i, col in enumerate([(220, 60, 60), (60, 120, 220), (250, 200, 50), (80, 180, 90)]):
            a = math.radians(200 + i * 45)
            x, y = c + 18 * math.cos(a), c + 14 * math.sin(a)
            d.ellipse((x - 7, y - 7, x + 7, y + 7), fill=col)
    elif kind == "star":
        pts = []
        for i in range(10):
            r = 32 if i % 2 == 0 else 14
            a = math.radians(-90 + i * 36)
            pts.append((c + r * math.cos(a), c + r * math.sin(a)))
        d.polygon(pts, fill=fg)
    elif kind == "leaf":
        d.ellipse((c - 18, c - 32, c + 18, c + 30), fill=fg)
        d.line((c, c - 26, c, c + 34), fill=(30, 90, 40), width=3)
    return img


def main():
    out = ensure_dirs("wallpapers")
    thumbs = ensure_dirs("wallpapers", "thumbs")
    samples = ensure_dirs("samples", "pictures")
    for key, title, fn in WALLPAPERS:
        img = fn()
        path = out / f"{key}.jpg"
        img.save(path, quality=88)
        record(f"wallpaper:{key}", path, title=title, width=W, height=H)
        t = thumbs / f"{key}.jpg"
        img.resize((320, 180), Image.LANCZOS).save(t, quality=85)
        record(f"wallpaper-thumb:{key}", t)
        print("wallpaper", key)
    for key, name in [("aurora-lake", "Northern Lights.jpg"), ("harbor-lights", "Harbor at Dusk.jpg"), ("cherry-hills", "Spring Hills.jpg"), ("autumn-path", "Autumn Walk.jpg")]:
        src = out / f"{key}.jpg"
        p = samples / name.replace(" ", "-").lower()
        Image.open(src).resize((1280, 720), Image.LANCZOS).save(p, quality=86)
        record(f"sample-picture:{name}", p, name=name)
    av = ensure_dirs("avatars")
    for kind, bg, fg in AVATARS:
        p = av / f"{kind}.png"
        avatar(kind, bg, fg).save(p)
        record(f"avatar:{kind}", p)
    print("avatars", len(AVATARS))


if __name__ == "__main__":
    main()
