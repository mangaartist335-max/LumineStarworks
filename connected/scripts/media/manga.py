"""Original manga for MangaShelf: three short stories, drawn procedurally.

Pages read right to left like printed Japanese manga: in every row the
first panel is on the right.
"""

import math

import numpy as np
from PIL import Image, ImageDraw, ImageOps

from common import ensure_dirs, font, record, wrap

PW, PH = 800, 1150
M = 36  # page margin
G = 14  # gutter


# ── Drawing primitives ─────────────────────────────────────────────────────

def screentone(w, h, spacing=7, r=1.4, level=200):
    img = Image.new("L", (w, h), 255)
    d = ImageDraw.Draw(img)
    for y in range(0, h, spacing):
        off = (y // spacing) % 2 * spacing // 2
        for x in range(off, w, spacing):
            d.ellipse((x - r, y - r, x + r, y + r), fill=level - 120)
    return img


def bg_sky(d, w, h, night=False):
    if night:
        d.rectangle((0, 0, w, h), fill=40)
        rng = np.random.default_rng(w * 7 + h)
        for _ in range(int(w * h / 900)):
            x, y = rng.integers(0, w), rng.integers(0, h)
            d.point((x, y), fill=255)
        d.ellipse((w - 120, 30, w - 50, 100), fill=245)
        d.ellipse((w - 100, 24, w - 40, 84), fill=40)
        return
    for i, (x, y, s) in enumerate([(0.2, 0.25, 1.0), (0.65, 0.18, 0.8), (0.85, 0.35, 0.6)]):
        cx, cy, r = x * w, y * h, 40 * s
        for k in range(4):
            d.ellipse((cx - r + k * r * 0.6, cy - r * 0.6, cx + r * 0.4 + k * r * 0.6, cy + r * 0.5), outline=0, fill=255, width=2)


def bg_street(d, w, h, horizon=0.55):
    hy = int(h * horizon)
    for i in range(6):
        x0 = i * w / 6
        top = hy - 60 - (i % 3) * 40
        d.rectangle((x0 + 4, top, x0 + w / 6 - 4, h), outline=0, width=2, fill=250)
        for wy in range(int(top) + 14, h - 20, 30):
            for wx in range(int(x0) + 14, int(x0 + w / 6) - 18, 24):
                d.rectangle((wx, wy, wx + 10, wy + 14), outline=0, width=1)
    # lantern string
    d.line([(x, 40 + 18 * math.sin(x / w * math.pi)) for x in range(0, w, 8)], fill=0, width=2)
    for k in range(1, 6):
        x = k * w / 6
        y = 40 + 18 * math.sin(x / w * math.pi)
        d.ellipse((x - 11, y, x + 11, y + 26), fill=255, outline=0, width=2)
        d.line((x - 11, y + 13, x + 11, y + 13), fill=0)
    d.rectangle((0, h - 30, w, h), fill=230, outline=0)


def bg_room(d, w, h):
    d.line((0, h * 0.75, w, h * 0.75), fill=0, width=2)
    d.rectangle((w * 0.62, h * 0.12, w * 0.92, h * 0.5), outline=0, width=3, fill=245)
    d.line((w * 0.77, h * 0.12, w * 0.77, h * 0.5), fill=0, width=2)
    d.rectangle((w * 0.06, h * 0.2, w * 0.4, h * 0.24), fill=200, outline=0)
    for k in range(5):
        d.rectangle((w * 0.08 + k * 22, h * 0.2 - 30 + (k % 2) * 6, w * 0.08 + k * 22 + 16, h * 0.2), outline=0, fill=255)


def bg_roof(d, w, h):
    bg_sky(d, w, h)
    d.polygon([(0, h * 0.7), (w * 0.45, h * 0.6), (w * 0.45, h), (0, h)], fill=220, outline=0)
    d.polygon([(w * 0.55, h * 0.66), (w, h * 0.58), (w, h), (w * 0.55, h)], fill=235, outline=0)
    d.rectangle((w * 0.15, h * 0.5, w * 0.22, h * 0.64), fill=180, outline=0)
    d.line([(w * 0.6 + k * 30, h * 0.5 + (k % 2) * 6) for k in range(10)], fill=0, width=1)


def bg_tower(d, w, h):
    cx, cy, r = w / 2, h * 0.45, min(w, h) * 0.36
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=255, outline=0, width=6)
    for k in range(12):
        a = math.radians(k * 30)
        d.line((cx + r * 0.85 * math.sin(a), cy - r * 0.85 * math.cos(a), cx + r * 0.95 * math.sin(a), cy - r * 0.95 * math.cos(a)), fill=0, width=4)
    d.line((cx, cy, cx + r * 0.5, cy - r * 0.2), fill=0, width=6)
    d.line((cx, cy, cx - r * 0.1, cy - r * 0.75), fill=0, width=4)


def bg_space(d, w, h):
    d.rectangle((0, 0, w, h), fill=25)
    rng = np.random.default_rng(w + h * 3)
    for _ in range(int(w * h / 600)):
        x, y = rng.integers(0, w), rng.integers(0, h)
        d.point((x, y), fill=230)
    d.ellipse((w * 0.7, h * 0.15, w * 0.9, h * 0.15 + w * 0.2), outline=230, width=2)


def bg_shop(d, w, h):
    d.rectangle((0, h * 0.62, w, h), fill=225, outline=0)
    d.line((0, h * 0.62, w, h * 0.62), fill=0, width=3)
    for k in range(7):
        x = 30 + k * (w - 60) / 7
        d.ellipse((x, h * 0.55, x + 50, h * 0.62), fill=255, outline=0, width=2)
        d.arc((x + 8, h * 0.56, x + 42, h * 0.6), 200, 340, fill=0)
    d.rectangle((w * 0.05, h * 0.1, w * 0.95, h * 0.14), fill=200, outline=0)


def speed_lines(d, w, h, cx=None, cy=None, n=70):
    cx = w / 2 if cx is None else cx
    cy = h / 2 if cy is None else cy
    rng = np.random.default_rng(int(w * 3 + h))
    for _ in range(n):
        a = rng.random() * math.pi * 2
        r0 = min(w, h) * (0.3 + rng.random() * 0.2)
        r1 = max(w, h)
        d.line((cx + r0 * math.cos(a), cy + r0 * math.sin(a), cx + r1 * math.cos(a), cy + r1 * math.sin(a)), fill=0, width=1 + int(rng.random() * 2))


def bg_stairs(d, w, h):
    for k in range(12):
        y = h - k * h / 12
        x0 = w * 0.1 + k * 18
        d.polygon([(x0, y), (x0 + w * 0.5, y - 12), (x0 + w * 0.5, y - h / 12 - 12), (x0, y - h / 12)], outline=0, fill=240 - (k % 2) * 20)


def bg_class(d, w, h):
    d.rectangle((w * 0.08, h * 0.1, w * 0.92, h * 0.45), fill=70, outline=0, width=3)
    d.text((w * 0.15, h * 0.2), "Astronomy p.42", font=font(18), fill=240)
    for k in range(3):
        d.rectangle((w * 0.1 + k * w * 0.3, h * 0.7, w * 0.3 + k * w * 0.3, h * 0.78), fill=230, outline=0, width=2)


BACKGROUNDS = {
    "sky": bg_sky, "street": bg_street, "room": bg_room, "roof": bg_roof, "tower": bg_tower,
    "space": bg_space, "shop": bg_shop, "stairs": bg_stairs, "class": bg_class,
    "night": lambda d, w, h: bg_sky(d, w, h, True),
}

HAIR = {
    "mei": ("bob", 40, "cap"),
    "ren": ("spiky", 230, "scarf"),
    "gen": ("bald", 255, "glasses"),
    "ito": ("bun", 70, "goggles"),
    "taro": ("messy", 50, None),
    "sora": ("ponytail", 60, None),
    "teacher": ("short", 90, "glasses"),
    "hina": ("ponytail", 110, "bandana"),
    "usagi": ("bob", 230, "ears"),
    "baker": ("short", 120, None),
    "kid": ("messy", 140, None),
}


def draw_face(d, cx, cy, r, face, look=0):
    ex = r * 0.38
    ey = cy + r * 0.05
    lx = look * r * 0.08
    if face in ("laugh",):
        for s in (-1, 1):
            d.arc((cx + s * ex - r * 0.18 + lx, ey - r * 0.1, cx + s * ex + r * 0.18 + lx, ey + r * 0.15), 200, 340, fill=0, width=3)
    elif face == "sleep":
        for s in (-1, 1):
            d.arc((cx + s * ex - r * 0.16, ey - r * 0.05, cx + s * ex + r * 0.16, ey + r * 0.12), 20, 160, fill=0, width=3)
    else:
        sz = 0.12 if face == "surprised" else 0.17
        for s in (-1, 1):
            x = cx + s * ex + lx
            d.ellipse((x - r * sz, ey - r * sz * 1.5, x + r * sz, ey + r * sz * 1.5), fill=0)
            d.ellipse((x - r * sz * 0.2, ey - r * sz * 1.1, x + r * sz * 0.4, ey - r * sz * 0.5), fill=255)
        if face == "determined":
            for s in (-1, 1):
                d.line((cx + s * ex - r * 0.2, ey - r * 0.38 - s * r * 0.06, cx + s * ex + r * 0.2, ey - r * 0.32 + s * r * 0.06), fill=0, width=4)
        if face == "worried":
            for s in (-1, 1):
                d.line((cx + s * ex - r * 0.2, ey - r * 0.3 + s * r * 0.08, cx + s * ex + r * 0.2, ey - r * 0.36 - s * r * 0.08), fill=0, width=3)
            d.ellipse((cx + r * 0.75, cy - r * 0.4, cx + r * 0.9, cy - r * 0.15), outline=0, width=2)
    my = cy + r * 0.48
    if face in ("smile", "laugh", "determined"):
        d.arc((cx - r * 0.22, my - r * 0.18, cx + r * 0.22, my + r * 0.14), 10, 170, fill=0, width=3)
        if face == "laugh":
            d.chord((cx - r * 0.22, my - r * 0.14, cx + r * 0.22, my + r * 0.2), 0, 180, fill=0)
    elif face == "surprised":
        d.ellipse((cx - r * 0.09, my - r * 0.1, cx + r * 0.09, my + r * 0.14), outline=0, width=3)
    elif face == "worried":
        d.arc((cx - r * 0.18, my, cx + r * 0.18, my + r * 0.2), 200, 340, fill=0, width=3)
    elif face != "sleep":
        d.line((cx - r * 0.12, my, cx + r * 0.12, my), fill=0, width=3)


def draw_person(d, who, cx, base, r, face="smile", look=0, body=True):
    style, tone, acc = HAIR.get(who, ("short", 80, None))
    head_cy = base - r * 3.2 if body else base - r
    if body:
        top = head_cy + r * 0.9
        d.polygon([(cx - r * 0.7, top), (cx + r * 0.7, top), (cx + r * 1.0, base), (cx - r * 1.0, base)], fill=255, outline=0, width=3)
        d.line((cx - r * 0.75, top + r * 0.3, cx - r * 1.3, top + r * 1.4), fill=0, width=3)
        d.line((cx + r * 0.75, top + r * 0.3, cx + r * 1.3, top + r * 1.4), fill=0, width=3)
        if acc == "scarf":
            d.rectangle((cx - r * 0.7, top - r * 0.05, cx + r * 0.7, top + r * 0.25), fill=120, outline=0, width=2)
            d.polygon([(cx + r * 0.4, top + r * 0.2), (cx + r * 1.4, top + r * 0.7), (cx + r * 0.5, top + r * 0.5)], fill=120, outline=0)
        if who == "mei":
            d.line((cx - r * 0.7, top, cx + r * 0.9, base - r * 0.6), fill=0, width=3)
            d.rectangle((cx + r * 0.5, base - r * 0.9, cx + r * 1.2, base - r * 0.3), fill=200, outline=0, width=2)
    cy = head_cy
    if style == "ponytail":
        d.ellipse((cx + r * 0.6, cy - r * 0.6, cx + r * 1.4, cy + r * 0.9), fill=tone, outline=0, width=2)
    if style == "bun":
        d.ellipse((cx - r * 0.35, cy - r * 1.45, cx + r * 0.35, cy - r * 0.8), fill=tone, outline=0, width=2)
    if acc == "ears":
        for s in (-1, 1):
            d.ellipse((cx + s * r * 0.45 - r * 0.22, cy - r * 2.1, cx + s * r * 0.45 + r * 0.22, cy - r * 0.6), fill=255, outline=0, width=3)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=255, outline=0, width=3)
    if style == "bob":
        # bangs stop above the eyes; side locks frame the face
        d.chord((cx - r * 1.08, cy - r * 1.12, cx + r * 1.08, cy + r * 0.56), 180, 360, fill=tone, outline=0)
        d.rectangle((cx - r * 1.05, cy - r * 0.3, cx - r * 0.72, cy + r * 0.75), fill=tone)
        d.rectangle((cx + r * 0.72, cy - r * 0.3, cx + r * 1.05, cy + r * 0.75), fill=tone)
    elif style == "spiky":
        pts = [(cx - r * 1.05, cy - r * 0.05)]
        for k in range(7):
            a = math.pi + k * math.pi / 6
            pts.append((cx + r * 1.35 * math.cos(a - 0.15), cy + r * 1.35 * math.sin(a - 0.15)))
            pts.append((cx + r * 0.95 * math.cos(a), cy + r * 0.95 * math.sin(a)))
        pts.append((cx + r * 1.05, cy - r * 0.05))
        d.polygon(pts, fill=tone, outline=0)
    elif style in ("messy", "short", "ponytail", "bun"):
        d.chord((cx - r * 1.04, cy - r * 1.06, cx + r * 1.04, cy + r * 0.5), 175, 365, fill=tone, outline=0)
        if style == "messy":
            for k in range(5):
                x = cx - r * 0.8 + k * r * 0.4
                d.polygon([(x, cy - r * 0.55), (x + r * 0.2, cy - r * 0.25), (x + r * 0.4, cy - r * 0.55)], fill=tone)
    if acc == "cap":
        d.chord((cx - r * 1.05, cy - r * 1.25, cx + r * 1.05, cy - r * 0.1), 180, 360, fill=90, outline=0, width=2)
        d.rectangle((cx - r * 1.3, cy - r * 0.5, cx + r * 0.2, cy - r * 0.35), fill=90, outline=0)
    if acc == "bandana":
        d.rectangle((cx - r * 1.0, cy - r * 0.75, cx + r * 1.0, cy - r * 0.5), fill=180, outline=0, width=2)
    draw_face(d, cx, cy, r, face, look)
    if acc == "glasses":
        for s in (-1, 1):
            d.ellipse((cx + s * r * 0.38 - r * 0.24, cy - r * 0.18, cx + s * r * 0.38 + r * 0.24, cy + r * 0.28), outline=0, width=3)
        if who == "gen":
            d.arc((cx - r * 0.4, cy + r * 0.3, cx + r * 0.4, cy + r * 0.6), 180, 360, fill=0, width=5)
    if acc == "goggles":
        d.rectangle((cx - r * 0.9, cy - r * 0.7, cx + r * 0.9, cy - r * 0.55), fill=0)
        for s in (-1, 1):
            d.ellipse((cx + s * r * 0.4 - r * 0.25, cy - r * 0.85, cx + s * r * 0.4 + r * 0.25, cy - r * 0.4), fill=200, outline=0, width=3)


def draw_cat(d, cx, base, r):
    d.ellipse((cx - r * 1.4, base - r * 1.4, cx + r * 0.6, base), fill=255, outline=0, width=3)
    d.ellipse((cx, base - r * 2.2, cx + r * 1.4, base - r * 0.9), fill=255, outline=0, width=3)
    for s in (0.2, 1.0):
        d.polygon([(cx + r * s, base - r * 1.9), (cx + r * (s + 0.15), base - r * 2.6), (cx + r * (s + 0.4), base - r * 2.05)], fill=255, outline=0)
    d.ellipse((cx + r * 0.4, base - r * 1.65, cx + r * 0.55, base - r * 1.45), fill=0)
    d.ellipse((cx + r * 0.85, base - r * 1.65, cx + r * 1.0, base - r * 1.45), fill=0)
    d.arc((cx - r * 2.2, base - r * 1.6, cx - r * 1.0, base - r * 0.2), 120, 250, fill=0, width=4)


def draw_pip(d, cx, cy, r, face="smile"):
    d.ellipse((cx - r * 1.8, cy - r * 0.35, cx + r * 1.8, cy + r * 0.35), outline=0, width=3)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=255, outline=0, width=3)
    d.arc((cx - r * 0.6, cy - r * 0.9, cx + r * 0.2, cy - r * 0.2), 180, 300, fill=0, width=2)
    draw_face(d, cx, cy, r * 0.8, face)
    d.arc((cx - r * 1.8, cy - r * 0.35, cx + r * 1.8, cy + r * 0.35), 20, 160, fill=0, width=3)


def bubble(d, x, y, text, w, kind="speech", tail=None, size=19):
    f = font(size, bold=True)
    lines = wrap(d, text, f, w - 30)
    lh = size + 6
    bh = lh * len(lines) + 28
    bw = min(w, max(d.textlength(ln, font=f) for ln in lines) + 44)
    box = (x - bw / 2, y - bh / 2, x + bw / 2, y + bh / 2)
    if kind == "box":
        d.rectangle(box, fill=255, outline=0, width=3)
    elif kind == "thought":
        d.ellipse(box, fill=255, outline=0, width=2)
        if tail:
            for k, rr in enumerate((10, 7, 4)):
                tx = x + (tail[0] - x) * (0.55 + k * 0.17)
                ty = y + (tail[1] - y) * (0.55 + k * 0.17)
                d.ellipse((tx - rr, ty - rr, tx + rr, ty + rr), fill=255, outline=0, width=2)
    else:
        if tail:
            d.polygon([(x - 12, y + bh / 2 - 8), (x + 12, y + bh / 2 - 8), tail], fill=255, outline=0, width=3)
        d.ellipse(box, fill=255, outline=0, width=3)
        if tail:
            d.polygon([(x - 10, y + bh / 2 - 9), (x + 10, y + bh / 2 - 9), (x + (tail[0] - x) * 0.3, y + bh / 2 + 6)], fill=255)
    ty = y - bh / 2 + 14 + lh / 2
    for ln in lines:
        d.text((x, ty), ln, font=f, fill=0, anchor="mm")
        ty += lh


def sfx(d, x, y, text, size=46):
    d.text((x, y), text, font=font(size, bold=True), fill=255, anchor="mm", stroke_width=5, stroke_fill=0)


# ── Panels and pages ───────────────────────────────────────────────────────

def render_panel(w, h, spec):
    img = Image.new("L", (w, h), 255)
    d = ImageDraw.Draw(img)
    if spec.get("tone"):
        img.paste(screentone(w, h), (0, 0))
    bg = spec.get("bg")
    if bg:
        BACKGROUNDS[bg](d, w, h)
    if spec.get("speed"):
        speed_lines(d, w, h)
    for c in spec.get("chars", []):
        who = c["who"]
        cx, base = c.get("x", 0.5) * w, c.get("y", 0.95) * h
        r = c.get("s", 0.14) * h
        if who == "tofu":
            draw_cat(d, cx, base, r * 0.6)
        elif who == "pip":
            draw_pip(d, cx, c.get("y", 0.5) * h, r, c.get("face", "smile"))
        else:
            draw_person(d, who, cx, base, r, c.get("face", "smile"), c.get("look", 0), c.get("body", True))
    for item in spec.get("draw", []):
        item(d, w, h)
    for s in spec.get("sfx", []):
        sfx(d, s[1] * w, s[2] * h, s[0], s[3] if len(s) > 3 else 46)
    for b in spec.get("text", []):
        tail = (b["tail"][0] * w, b["tail"][1] * h) if b.get("tail") else None
        bubble(d, b.get("x", 0.5) * w, b.get("y", 0.2) * h, b["t"], b.get("w", 0.6) * w, b.get("kind", "speech"), tail, b.get("size", 19))
    return img


def layout(rows):
    """rows: list of (height weight, [panel width weights]). Panels in a row are ordered right to left."""
    total = sum(r[0] for r in rows)
    avail_h = PH - 2 * M - G * (len(rows) - 1)
    rects = []
    y = M
    for hw, cols in rows:
        h = avail_h * hw / total
        avail_w = PW - 2 * M - G * (len(cols) - 1)
        x = PW - M
        tw = sum(cols)
        for cw in cols:
            pw = avail_w * cw / tw
            rects.append((int(x - pw), int(y), int(x), int(y + h)))
            x -= pw + G
        y += h + G
    return rects


def render_page(rows, panels, title=None):
    page = Image.new("L", (PW, PH), 255)
    d = ImageDraw.Draw(page)
    for rect, spec in zip(layout(rows), panels):
        x0, y0, x1, y1 = rect
        page.paste(render_panel(x1 - x0, y1 - y0, spec), (x0, y0))
        d.rectangle(rect, outline=0, width=4)
    if title:
        d.text((PW / 2, PH - 16), title, font=font(13), fill=110, anchor="mm")
    return page


def title_page(series, chapter, author, bg, chars, narration):
    page = Image.new("L", (PW, PH), 255)
    panel = render_panel(PW - 2 * M, PH - 2 * M, {"bg": bg, "tone": bg in ("street", "roof"), "chars": chars})
    page.paste(panel, (M, M))
    d = ImageDraw.Draw(page)
    d.rectangle((M, M, PW - M, PH - M), outline=0, width=5)
    d.rectangle((M + 30, M + 30, PW - M - 30, M + 170), fill=255, outline=0, width=4)
    size = 46
    while size > 24 and d.textlength(series, font=font(size, bold=True, serif=True)) > PW - 2 * M - 90:
        size -= 2
    d.text((PW / 2, M + 82), series, font=font(size, bold=True, serif=True), fill=0, anchor="mm")
    d.text((PW / 2, M + 136), chapter, font=font(24, bold=True), fill=60, anchor="mm")
    bubble(d, PW / 2, PH - M - 120, narration, 560, "box", size=20)
    d.text((PW - M - 20, PH - M - 30), f"by {author}", font=font(18, bold=True), fill=0, anchor="rm", stroke_width=3, stroke_fill=255)
    return page


def cover(series, author, colors, draw):
    w, h = 400, 600
    img = Image.new("RGB", (w, h), colors[0])
    d = ImageDraw.Draw(img)
    for y in range(h):
        k = y / h
        d.line((0, y, w, y), fill=tuple(int(a + (b - a) * k) for a, b in zip(colors[0], colors[1])))
    gray = Image.new("L", (w, h - 170), 255)
    gd = ImageDraw.Draw(gray)
    draw(gd, w, h - 170)
    pale = tuple(int(255 - (255 - c) * 0.25) for c in colors[0])
    img.paste(ImageOps.colorize(gray, black=(24, 22, 30), white=pale), (0, 130))
    d.rectangle((0, 0, w, 120), fill=(255, 255, 255))
    lines = wrap(d, series, font(34, bold=True, serif=True), w - 30)
    y = 60 - 20 * (len(lines) - 1)
    for ln in lines:
        d.text((w / 2, y), ln, font=font(34, bold=True, serif=True), fill=colors[1], anchor="mm")
        y += 40
    d.rectangle((0, h - 40, w, h), fill=(20, 20, 20))
    d.text((w / 2, h - 20), author, font=font(18, bold=True), fill=(255, 255, 255), anchor="mm")
    return img


def tb(t, x=0.5, y=0.2, w=0.6, tail=None, kind="speech", size=19):
    return {"t": t, "x": x, "y": y, "w": w, "tail": tail, "kind": kind, "size": size}


def ch(who, x=0.5, y=0.95, s=0.14, face="smile", look=0, body=True):
    return {"who": who, "x": x, "y": y, "s": s, "face": face, "look": look, "body": body}


def sign(text):
    def draw(d, w, h):
        d.rectangle((w * 0.2, h * 0.1, w * 0.8, h * 0.3), fill=255, outline=0, width=3)
        d.text((w / 2, h * 0.2), text, font=font(22, bold=True), fill=0, anchor="mm")
    return draw


def parcel(x=0.5, y=0.6, s=0.12):
    def draw(d, w, h):
        cx, cy, r = x * w, y * h, s * min(w, h)
        d.rectangle((cx - r, cy - r * 0.7, cx + r, cy + r * 0.7), fill=230, outline=0, width=3)
        d.line((cx - r, cy, cx + r, cy), fill=0, width=2)
        d.line((cx, cy - r * 0.7, cx, cy + r * 0.7), fill=0, width=2)
    return draw


def gear(x=0.5, y=0.55, s=0.12):
    def draw(d, w, h):
        cx, cy, r = x * w, y * h, s * min(w, h)
        for k in range(10):
            a = k * math.pi / 5
            d.rectangle((cx + r * math.cos(a) - 6, cy + r * math.sin(a) - 6, cx + r * math.cos(a) + 6, cy + r * math.sin(a) + 6), fill=120)
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=170, outline=0, width=3)
        d.ellipse((cx - r * 0.35, cy - r * 0.35, cx + r * 0.35, cy + r * 0.35), fill=255, outline=0, width=2)
    return draw


def bread(x=0.5, y=0.6, s=0.12, moon=False):
    def draw(d, w, h):
        cx, cy, r = x * w, y * h, s * min(w, h)
        d.ellipse((cx - r, cy - r * 0.8, cx + r, cy + r * 0.8), fill=225, outline=0, width=3)
        if moon:
            d.arc((cx - r * 0.6, cy - r * 0.5, cx + r * 0.4, cy + r * 0.5), 60, 300, fill=0, width=4)
        else:
            for k in range(3):
                d.arc((cx - r * 0.7 + k * r * 0.45, cy - r * 0.4, cx - r * 0.2 + k * r * 0.45, cy + r * 0.3), 200, 340, fill=0, width=2)
    return draw


# ── Stories ────────────────────────────────────────────────────────────────

def lantern_ch1():
    pages = [title_page("LANTERN STREET COURIERS", "Chapter 1: First Delivery", "Hana Mizuki", "street", [ch("mei", 0.5, 0.92, 0.07, "smile")], "Lantern Street. Where every parcel has a story.")]
    pages.append(render_page([(1, [1]), (1, [1, 1]), (1.1, [1])], [
        {"bg": "street", "draw": [sign("COURIERS WANTED!")], "text": [tb("Gen's Delivery Co. has been on Lantern Street for forty years.", 0.5, 0.82, 0.8, kind="box")]},
        {"chars": [ch("mei", 0.5, 1.1, 0.2, "determined")], "text": [tb("I'd like to apply!", 0.45, 0.18, 0.7, (0.5, 0.35))]},
        {"chars": [ch("gen", 0.5, 1.1, 0.2, "surprised")], "text": [tb("You? Can you even carry a parcel up a hill?", 0.5, 0.2, 0.8, (0.45, 0.35))]},
        {"tone": True, "speed": True, "chars": [ch("mei", 0.5, 0.98, 0.13, "laugh")], "text": [tb("Watch me!", 0.25, 0.2, 0.35, (0.4, 0.45))]},
    ], "Lantern Street Couriers - 1"))
    pages.append(render_page([(1, [1, 1]), (1.2, [1])], [
        {"draw": [parcel(0.3, 0.65)], "chars": [ch("gen", 0.7, 1.1, 0.18, "smile")], "text": [tb("Fine. First job: this goes to the top of the clock tower.", 0.45, 0.2, 0.85, (0.65, 0.4))]},
        {"tone": True, "chars": [ch("mei", 0.5, 1.15, 0.22, "surprised")], "text": [tb("The TOP?!", 0.5, 0.15, 0.5, (0.5, 0.3))]},
        {"bg": "room", "chars": [ch("tofu", 0.45, 0.85, 0.2)], "text": [tb("Mrrp.", 0.7, 0.35, 0.25, (0.55, 0.55)), tb("Tofu, the shop cat, approves.", 0.3, 0.12, 0.45, kind="box")]},
    ], "Lantern Street Couriers - 2"))
    pages.append(render_page([(1, [1]), (1, [1, 1])], [
        {"speed": True, "chars": [ch("mei", 0.5, 0.98, 0.14, "determined", 1)], "sfx": [("DASH!", 0.2, 0.25, 56)]},
        {"bg": "street", "chars": [ch("mei", 0.6, 0.96, 0.08, "smile")], "text": [tb("Left at the noodle stand... right at the bridge...", 0.45, 0.3, 0.8, (0.6, 0.55))]},
        {"bg": "tower", "text": [tb("There it is!", 0.5, 0.88, 0.5, kind="box")]},
    ], "Lantern Street Couriers - 3"))
    pages.append(render_page([(1, [1, 1]), (1, [1])], [
        {"bg": "stairs", "text": [tb("Two hundred stairs...", 0.5, 0.12, 0.7, kind="box")]},
        {"tone": True, "chars": [ch("mei", 0.5, 1.1, 0.2, "worried")], "text": [tb("Why... is it... always... stairs...", 0.5, 0.18, 0.85, (0.5, 0.35))]},
        {"speed": True, "chars": [ch("mei", 0.5, 0.97, 0.14, "determined")], "text": [tb("Almost there!", 0.25, 0.25, 0.35, (0.4, 0.45))]},
    ], "Lantern Street Couriers - 4"))
    pages.append(render_page([(1.1, [1]), (1, [1, 1])], [
        {"draw": [gear(0.15, 0.4, 0.1), gear(0.85, 0.3, 0.12)], "chars": [ch("ito", 0.5, 1.05, 0.13, "surprised")], "text": [tb("Oh! A courier? Nobody's come all the way up here in years!", 0.5, 0.16, 0.8, (0.5, 0.35))]},
        {"draw": [parcel(0.5, 0.75, 0.15)], "chars": [ch("mei", 0.5, 1.15, 0.18, "laugh")], "text": [tb("Delivery for Ito Clockworks!", 0.5, 0.16, 0.85, (0.5, 0.3))]},
        {"draw": [gear(0.5, 0.6, 0.18)], "text": [tb("The last piece! Now the old clock can sing again.", 0.5, 0.18, 0.85, (0.5, 0.4))]},
    ], "Lantern Street Couriers - 5"))
    pages.append(render_page([(1, [1]), (1.3, [1]), (0.8, [1])], [
        {"bg": "tower", "sfx": [("CLICK...", 0.22, 0.25, 34), ("CLICK...", 0.8, 0.7, 34)]},
        {"bg": "sky", "speed": True, "sfx": [("DONNNNG", 0.5, 0.5, 72)]},
        {"tone": True, "chars": [ch("mei", 0.35, 1.2, 0.3, "laugh", body=False), ch("ito", 0.7, 1.2, 0.3, "laugh", body=False)], "text": [tb("It works!", 0.5, 0.2, 0.4)]},
    ], "Lantern Street Couriers - 6"))
    pages.append(render_page([(1.5, [1]), (1, [1, 1])], [
        {"bg": "sky", "draw": [lambda d, w, h: [d.rectangle((k * w / 9, h * 0.6 - (k % 3) * 30, k * w / 9 + w / 10, h), fill=200, outline=0) for k in range(9)]], "chars": [ch("mei", 0.3, 0.98, 0.1, "smile", 1), ch("ito", 0.7, 0.98, 0.1, "smile", -1)], "text": [tb("Will you come again tomorrow?", 0.72, 0.15, 0.45, (0.7, 0.35)), tb("Every day, if there's a parcel!", 0.3, 0.3, 0.45, (0.3, 0.5))]},
        {"text": [tb("And that's how Mei became a Lantern Street courier.", 0.5, 0.5, 0.85, kind="box")]},
        {"text": [tb("END OF CHAPTER 1", 0.5, 0.5, 0.8, kind="box", size=22)]},
    ], "Lantern Street Couriers - 7"))
    return pages


def lantern_ch2():
    pages = [title_page("LANTERN STREET COURIERS", "Chapter 2: Rooftop Shortcut", "Hana Mizuki", "roof", [ch("mei", 0.35, 0.8, 0.07, "determined"), ch("ren", 0.65, 0.78, 0.07, "smile")], "The fastest way across town isn't on any map.")]
    pages.append(render_page([(1, [1, 1]), (1, [1])], [
        {"draw": [parcel(0.3, 0.7)], "chars": [ch("gen", 0.65, 1.1, 0.18, "surprised")], "text": [tb("Rush order! The bakery across the canal, before noon!", 0.5, 0.18, 0.85, (0.6, 0.35))]},
        {"chars": [ch("mei", 0.5, 1.1, 0.2, "worried")], "text": [tb("That's twenty minutes away!", 0.5, 0.18, 0.8, (0.5, 0.35))]},
        {"bg": "street", "chars": [ch("ren", 0.75, 0.97, 0.12, "smile", -1)], "text": [tb("Ten, if you know the rooftops.", 0.4, 0.3, 0.5, (0.65, 0.45))]},
    ], "Lantern Street Couriers - 9"))
    pages.append(render_page([(1, [1]), (1, [1, 1])], [
        {"tone": True, "chars": [ch("ren", 0.5, 1.0, 0.13, "laugh")], "text": [tb("I'm Ren. Swift Wind Couriers.", 0.3, 0.25, 0.45, (0.42, 0.42))]},
        {"chars": [ch("mei", 0.5, 1.1, 0.2, "determined")], "text": [tb("A rival courier?!", 0.5, 0.18, 0.75, (0.5, 0.35))]},
        {"speed": True, "chars": [ch("ren", 0.5, 1.1, 0.2, "smile")], "text": [tb("Race you. Loser buys melon bread.", 0.5, 0.18, 0.85, (0.5, 0.35))]},
    ], "Lantern Street Couriers - 10"))
    pages.append(render_page([(1.2, [1]), (1, [1, 1])], [
        {"bg": "roof", "speed": True, "chars": [ch("mei", 0.35, 0.6, 0.09, "determined"), ch("ren", 0.65, 0.55, 0.09, "laugh")], "sfx": [("HUP!", 0.5, 0.15, 50)]},
        {"tone": True, "chars": [ch("mei", 0.5, 1.05, 0.15, "surprised")], "sfx": [("WHOA-", 0.5, 0.15, 40)]},
        {"chars": [ch("ren", 0.5, 1.1, 0.18, "smile")], "text": [tb("Bend your knees when you land!", 0.5, 0.18, 0.85, (0.5, 0.33))]},
    ], "Lantern Street Couriers - 11"))
    pages.append(render_page([(1, [1, 1]), (1.2, [1])], [
        {"bg": "roof", "chars": [ch("mei", 0.5, 0.97, 0.1, "worried")], "text": [tb("Sorry, laundry!", 0.5, 0.18, 0.6, (0.5, 0.4))]},
        {"bg": "sky", "chars": [ch("ren", 0.5, 1.1, 0.18, "determined")], "text": [tb("This is the big one.", 0.5, 0.18, 0.7, (0.5, 0.35))]},
        {"tone": True, "chars": [ch("mei", 0.5, 1.2, 0.3, "determined", body=False)], "text": [tb("I can do it.", 0.2, 0.3, 0.3, (0.35, 0.45))]},
    ], "Lantern Street Couriers - 12"))
    pages.append(render_page([(1.4, [1]), (1, [1, 1])], [
        {"bg": "sky", "speed": True, "chars": [ch("mei", 0.4, 0.6, 0.08, "laugh"), ch("ren", 0.62, 0.55, 0.08, "laugh")], "sfx": [("WHOOSH!", 0.5, 0.85, 64)]},
        {"bg": "roof", "sfx": [("THUD!", 0.5, 0.4, 56)]},
        {"tone": True, "chars": [ch("mei", 0.35, 1.2, 0.28, "laugh", body=False), ch("ren", 0.7, 1.2, 0.28, "laugh", body=False)], "text": [tb("Ha ha ha!", 0.5, 0.18, 0.45)]},
    ], "Lantern Street Couriers - 13"))
    pages.append(render_page([(1, [1]), (1, [1, 1])], [
        {"bg": "shop", "chars": [ch("baker", 0.5, 0.95, 0.12, "laugh")], "text": [tb("Right on time! Thank you both!", 0.5, 0.18, 0.7, (0.5, 0.4))]},
        {"draw": [bread(0.35, 0.6), bread(0.65, 0.6)], "text": [tb("Melon bread. On the house!", 0.5, 0.2, 0.8, kind="box")]},
        {"chars": [ch("ren", 0.3, 1.1, 0.16, "smile"), ch("mei", 0.72, 1.1, 0.16, "determined")], "text": [tb("Guess it's a tie.", 0.3, 0.14, 0.45, (0.3, 0.3)), tb("Rematch tomorrow?", 0.72, 0.3, 0.45, (0.72, 0.42))]},
    ], "Lantern Street Couriers - 14"))
    pages.append(render_page([(1.4, [1]), (1, [1, 1])], [
        {"bg": "roof", "chars": [ch("mei", 0.3, 0.95, 0.1, "smile"), ch("ren", 0.6, 0.95, 0.1, "smile"), ch("tofu", 0.85, 0.95, 0.14)], "text": [tb("Mrrp.", 0.85, 0.5, 0.2, (0.85, 0.7))]},
        {"chars": [ch("mei", 0.5, 1.15, 0.2, "laugh")], "text": [tb("Okay... rooftops are amazing.", 0.5, 0.18, 0.85, (0.5, 0.33))]},
        {"text": [tb("END OF CHAPTER 2", 0.5, 0.5, 0.8, kind="box", size=22)]},
    ], "Lantern Street Couriers - 15"))
    return pages


def paper_ch1():
    pages = [title_page("PAPER PLANET", "Chapter 1: Fold Here", "Ren Takagi", "space", [ch("pip", 0.5, 0.5, 0.06), ch("taro", 0.5, 0.95, 0.07, "surprised")], "Taro has folded a thousand paper planes. Tonight he folds something else.")]
    pages.append(render_page([(1.1, [1]), (1, [1, 1])], [
        {"bg": "room", "chars": [ch("taro", 0.35, 0.95, 0.11, "determined")], "text": [tb("One more fold...", 0.65, 0.3, 0.45, (0.42, 0.45))]},
        {"draw": [lambda d, w, h: (d.rectangle((w * 0.15, h * 0.2, w * 0.85, h * 0.85), fill=255, outline=0, width=3), d.line((w * 0.15, h * 0.2, w * 0.85, h * 0.85), fill=0, width=2), d.text((w * 0.5, h * 0.35), "FOLD HERE", font=font(22, bold=True), fill=0, anchor="mm"))]},
        {"speed": True, "sfx": [("FWOOMP", 0.5, 0.5, 52)]},
    ], "Paper Planet - 1"))
    pages.append(render_page([(1.2, [1]), (1, [1, 1])], [
        {"bg": "space", "chars": [ch("pip", 0.5, 0.5, 0.2)], "text": [tb("Hello! Is this Earth?", 0.5, 0.15, 0.6, (0.5, 0.3))]},
        {"tone": True, "chars": [ch("taro", 0.5, 1.15, 0.22, "surprised")], "text": [tb("MY ORIGAMI TALKS?!", 0.5, 0.15, 0.8, (0.5, 0.3))]},
        {"chars": [ch("pip", 0.5, 0.55, 0.22, "laugh")], "text": [tb("I'm Pip! I'm a planet. A small one.", 0.5, 0.15, 0.85)]},
    ], "Paper Planet - 2"))
    pages.append(render_page([(1, [1]), (1, [1, 1])], [
        {"bg": "room", "speed": True, "chars": [ch("pip", 0.7, 0.4, 0.09, "laugh")], "sfx": [("ZOOM!", 0.3, 0.3, 54)]},
        {"bg": "room", "sfx": [("CLATTER", 0.5, 0.6, 40)]},
        {"chars": [ch("taro", 0.5, 1.1, 0.2, "worried")], "text": [tb("Shh! My sister's asleep!", 0.5, 0.18, 0.85, (0.5, 0.33))]},
    ], "Paper Planet - 3"))
    pages.append(render_page([(1, [1, 1]), (1, [1])], [
        {"chars": [ch("sora", 0.5, 1.1, 0.18, "sleep")], "text": [tb("Taro... why is your homework glowing?", 0.5, 0.18, 0.9, (0.5, 0.35))]},
        {"chars": [ch("taro", 0.5, 1.1, 0.18, "laugh")], "text": [tb("Science project!", 0.5, 0.18, 0.75, (0.5, 0.33))]},
        {"bg": "room", "chars": [ch("taro", 0.45, 0.97, 0.12, "worried"), ch("pip", 0.62, 0.55, 0.05, "laugh")], "text": [tb("Hi!", 0.75, 0.35, 0.2, (0.64, 0.5))]},
    ], "Paper Planet - 4"))
    pages.append(render_page([(1, [1]), (1, [1, 1])], [
        {"tone": True, "chars": [ch("sora", 0.5, 1.2, 0.3, "surprised", body=False)], "text": [tb("...It has a FACE.", 0.2, 0.3, 0.3, (0.35, 0.45))]},
        {"chars": [ch("pip", 0.5, 0.6, 0.2, "laugh")], "text": [tb("And a ring! Want to see it spin?", 0.5, 0.15, 0.85)]},
        {"speed": True, "chars": [ch("pip", 0.5, 0.5, 0.18, "laugh")], "sfx": [("SPIN!", 0.5, 0.15, 40)]},
    ], "Paper Planet - 5"))
    pages.append(render_page([(1.3, [1]), (1, [1, 1])], [
        {"bg": "night", "chars": [ch("taro", 0.3, 0.98, 0.1, "smile", 1), ch("sora", 0.55, 0.98, 0.1, "smile", 1), ch("pip", 0.78, 0.6, 0.05)], "text": [tb("My home is somewhere out there.", 0.65, 0.2, 0.5, (0.77, 0.45))]},
        {"chars": [ch("taro", 0.5, 1.1, 0.18, "determined")], "text": [tb("Then we'll find it.", 0.5, 0.18, 0.7, (0.5, 0.33))]},
        {"chars": [ch("sora", 0.5, 1.1, 0.18, "smile")], "text": [tb("After breakfast.", 0.5, 0.18, 0.7, (0.5, 0.33))]},
    ], "Paper Planet - 6"))
    pages.append(render_page([(1.2, [1]), (1, [1, 1])], [
        {"bg": "room", "chars": [ch("pip", 0.5, 0.6, 0.12, "sleep")], "sfx": [("zzz", 0.7, 0.35, 34)]},
        {"text": [tb("Taro had folded a thousand paper planes. This was his first planet.", 0.5, 0.5, 0.9, kind="box")]},
        {"text": [tb("END OF CHAPTER 1", 0.5, 0.5, 0.8, kind="box", size=22)]},
    ], "Paper Planet - 7"))
    return pages


def paper_ch2():
    pages = [title_page("PAPER PLANET", "Chapter 2: Crash Course", "Ren Takagi", "class", [ch("taro", 0.4, 0.95, 0.07, "worried"), ch("pip", 0.65, 0.55, 0.05, "laugh")], "Rule one of having a planet: don't take it to school.")]
    pages.append(render_page([(1, [1, 1]), (1, [1])], [
        {"chars": [ch("pip", 0.5, 0.55, 0.2, "smile")], "text": [tb("Is school like a space station?", 0.5, 0.15, 0.85)]},
        {"chars": [ch("taro", 0.5, 1.1, 0.18, "worried")], "text": [tb("Just stay in the bag. Please.", 0.5, 0.18, 0.85, (0.5, 0.33))]},
        {"bg": "class", "chars": [ch("teacher", 0.2, 0.95, 0.1, "smile")], "text": [tb("Today: the rings of Saturn!", 0.55, 0.6, 0.5, (0.25, 0.6))]},
    ], "Paper Planet - 9"))
    pages.append(render_page([(1.2, [1]), (1, [1, 1])], [
        {"bg": "class", "speed": True, "chars": [ch("pip", 0.5, 0.35, 0.1, "laugh")], "text": [tb("Did someone say RINGS?", 0.5, 0.75, 0.6, (0.5, 0.45))]},
        {"chars": [ch("teacher", 0.5, 1.1, 0.18, "surprised")], "text": [tb("Is that... a planet?", 0.5, 0.18, 0.75, (0.5, 0.33))]},
        {"tone": True, "sfx": [("GASP!", 0.5, 0.5, 54)]},
    ], "Paper Planet - 10"))
    pages.append(render_page([(1, [1]), (1, [1, 1])], [
        {"speed": True, "chars": [ch("taro", 0.4, 0.98, 0.12, "determined"), ch("pip", 0.7, 0.4, 0.06, "surprised")], "sfx": [("GOTCHA!", 0.5, 0.15, 48)]},
        {"chars": [ch("kid", 0.3, 1.1, 0.16, "laugh"), ch("sora", 0.72, 1.1, 0.16, "laugh")], "text": [tb("So cool!!", 0.5, 0.15, 0.5)]},
        {"chars": [ch("teacher", 0.5, 1.1, 0.18, "laugh")], "text": [tb("Astronomy club starts today. Bring your... friend.", 0.5, 0.18, 0.9, (0.5, 0.35))]},
    ], "Paper Planet - 11"))
    pages.append(render_page([(1.4, [1]), (1, [1, 1])], [
        {"bg": "class", "chars": [ch("taro", 0.3, 0.97, 0.1, "smile"), ch("kid", 0.55, 0.97, 0.1, "smile"), ch("pip", 0.8, 0.5, 0.06, "laugh")], "text": [tb("I like it here.", 0.8, 0.2, 0.3, (0.8, 0.4))]},
        {"text": [tb("Pip's first day of school: a success. Mostly.", 0.5, 0.5, 0.9, kind="box")]},
        {"text": [tb("END OF CHAPTER 2", 0.5, 0.5, 0.8, kind="box", size=22)]},
    ], "Paper Planet - 12"))
    return pages


def moonlit_bakery():
    pages = [title_page("MOONLIT BAKERY", "A one-shot story", "Sora Ichika", "night", [ch("hina", 0.5, 0.92, 0.07, "smile")], "Hina's bakery opens at midnight. Most nights, nobody comes.")]
    pages.append(render_page([(1.2, [1]), (1, [1, 1])], [
        {"bg": "shop", "chars": [ch("hina", 0.5, 0.95, 0.12, "smile")], "text": [tb("The bread's almost ready...", 0.5, 0.18, 0.6, (0.5, 0.35))]},
        {"tone": True, "sfx": [("CLING!", 0.5, 0.5, 52)]},
        {"chars": [ch("hina", 0.5, 1.1, 0.18, "surprised")], "text": [tb("A customer? At this hour?", 0.5, 0.18, 0.85, (0.5, 0.33))]},
    ], "Moonlit Bakery - 1"))
    pages.append(render_page([(1, [1, 1]), (1.1, [1])], [
        {"chars": [ch("usagi", 0.5, 1.15, 0.16, "smile")], "text": [tb("Excuse me... do you sell moon bread?", 0.5, 0.15, 0.9, (0.5, 0.3))]},
        {"chars": [ch("hina", 0.5, 1.1, 0.18, "worried")], "text": [tb("Moon bread? Um... what's that?", 0.5, 0.18, 0.85, (0.5, 0.33))]},
        {"bg": "shop", "chars": [ch("hina", 0.3, 0.95, 0.11, "worried"), ch("usagi", 0.7, 0.95, 0.09, "smile")]},
    ], "Moonlit Bakery - 2"))
    pages.append(render_page([(1, [1]), (1, [1, 1])], [
        {"tone": True, "chars": [ch("usagi", 0.5, 1.0, 0.13, "laugh")], "text": [tb("Bread shaped like the moon! It's for my grandma's birthday.", 0.5, 0.18, 0.8, (0.5, 0.38))]},
        {"chars": [ch("hina", 0.5, 1.1, 0.18, "determined")], "text": [tb("Leave it to me!", 0.5, 0.18, 0.7, (0.5, 0.33))]},
        {"speed": True, "draw": [bread(0.5, 0.55, 0.22, True)]},
    ], "Moonlit Bakery - 3"))
    pages.append(render_page([(1, [1, 1]), (1.2, [1])], [
        {"bg": "shop", "chars": [ch("hina", 0.5, 0.95, 0.12, "determined")], "sfx": [("PAT PAT", 0.5, 0.2, 34)]},
        {"tone": True, "sfx": [("DING!", 0.5, 0.5, 60)]},
        {"draw": [bread(0.5, 0.55, 0.28, True)], "chars": [ch("usagi", 0.82, 1.15, 0.14, "laugh")], "text": [tb("It's perfect!", 0.25, 0.2, 0.4, (0.4, 0.4))]},
    ], "Moonlit Bakery - 4"))
    pages.append(render_page([(1.5, [1]), (1, [1, 1])], [
        {"bg": "night", "draw": [lambda d, w, h: d.polygon([(w * 0.7, 0), (w * 0.85, 0), (w * 0.55, h), (w * 0.35, h)], fill=90)], "chars": [ch("usagi", 0.62, 0.55, 0.07, "laugh"), ch("hina", 0.25, 0.97, 0.1, "smile", 1)], "text": [tb("Thank you!", 0.75, 0.2, 0.35, (0.64, 0.33)), tb("Come back anytime!", 0.25, 0.4, 0.4, (0.25, 0.55))]},
        {"text": [tb("Some customers come from very far away.", 0.5, 0.5, 0.85, kind="box")]},
        {"text": [tb("THE END", 0.5, 0.5, 0.6, kind="box", size=24)]},
    ], "Moonlit Bakery - 5"))
    return pages


SERIES = [
    ("lantern-street", [("ch1", lantern_ch1), ("ch2", lantern_ch2)], "Lantern Street Couriers", "Hana Mizuki", ((255, 214, 150), (190, 70, 40)), lambda d, w, h: (bg_street(d, w, h), draw_person(d, "mei", w / 2, h * 0.98, h * 0.09, "laugh"))),
    ("paper-planet", [("ch1", paper_ch1), ("ch2", paper_ch2)], "Paper Planet", "Ren Takagi", ((140, 200, 255), (30, 50, 120)), lambda d, w, h: (bg_space(d, w, h), draw_pip(d, w * 0.5, h * 0.35, h * 0.12, "laugh"), draw_person(d, "taro", w * 0.5, h * 0.98, h * 0.07, "surprised"))),
    ("moonlit-bakery", [("oneshot", moonlit_bakery)], "Moonlit Bakery", "Sora Ichika", ((60, 50, 110), (20, 16, 40)), lambda d, w, h: (bg_sky(d, w, h, True), draw_person(d, "hina", w * 0.4, h * 0.98, h * 0.08, "smile"), draw_person(d, "usagi", w * 0.7, h * 0.98, h * 0.06, "laugh"))),
]


def main():
    for key, chapters, title, author, colors, cover_draw in SERIES:
        base = ensure_dirs("manga", key)
        cp = base / "cover.jpg"
        cover(title, author, colors, cover_draw).save(cp, quality=88)
        record(f"manga-cover:{key}", cp)
        for ck, fn in chapters:
            pages = fn()
            folder = ensure_dirs("manga", key, ck)
            for i, page in enumerate(pages, start=1):
                p = folder / f"{i:02d}.png"
                page.save(p, optimize=True)
            record(f"manga-chapter:{key}/{ck}", folder / "01.png", pages=len(pages))
            print("manga", key, ck, len(pages), "pages")


if __name__ == "__main__":
    main()
