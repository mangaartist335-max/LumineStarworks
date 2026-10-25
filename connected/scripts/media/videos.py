"""Original MeTube videos, drawn frame by frame with their own soundtracks."""

import math

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from common import (
    PUBLIC, SR, VideoWriter, ensure_dirs, fast_noise_bed, font, normalize, note_freq, place, record,
    thumbnail_from, tone, vertical_gradient, wrap,
)

W, H, FPS = 640, 360, 24


# ── Shared pieces ──────────────────────────────────────────────────────────

def card(title, subtitle, colors=((30, 40, 90), (10, 14, 40)), t=1.0):
    img = Image.fromarray(vertical_gradient(W, H, [(0, colors[0]), (1, colors[1])]).astype(np.uint8))
    d = ImageDraw.Draw(img)
    a = min(1.0, t)
    lines = wrap(d, title, font(30, bold=True), W - 80)
    y = H // 2 - 22 * len(lines)
    for ln in lines:
        d.text((W // 2, y), ln, font=font(30, bold=True), fill=(255, 255, 255), anchor="mm")
        y += 40
    d.text((W // 2, y + 10), subtitle, font=font(18), fill=(int(200 * a), int(220 * a), 255), anchor="mm")
    return img


def caption(img, text):
    if not text:
        return img
    d = ImageDraw.Draw(img, "RGBA")
    f = font(17, bold=True)
    lines = wrap(d, text, f, W - 60)
    h = 26 * len(lines) + 14
    d.rectangle((0, H - h - 8, W, H - 8), fill=(0, 0, 0, 150))
    y = H - h - 8 + 8
    for ln in lines:
        d.text((W // 2, y + 10), ln, font=f, fill=(255, 255, 255), anchor="mm")
        y += 26
    return img


def end_card(channel, line="Thanks for watching!"):
    return card(line, f"Subscribe to {channel} for more", ((60, 20, 20), (20, 6, 6)))


def timed(captions, t):
    for start, end, text in captions:
        if start <= t < end:
            return text
    return ""


def melody_track(dur, notes, bpm, kind="square", vol=0.18, bass=None, bass_kind="sine", chords=None, chord_kind="pad"):
    """notes: list of (note|None, beats). Loops until dur."""
    track = np.zeros(int(dur * SR) + SR, dtype=np.float32)
    beat = 60 / bpm
    t = 0.0
    while t < dur:
        for n, beats in notes:
            if t >= dur:
                break
            if n:
                place(track, tone(note_freq(n), beats * beat * 0.95, kind, vol, (0.005, 0.05, 0.7, 0.05)), t)
            t += beats * beat
    if bass:
        t = 0.0
        while t < dur:
            for n, beats in bass:
                if t >= dur:
                    break
                place(track, tone(note_freq(n), beats * beat, bass_kind, vol * 1.1, (0.01, 0.1, 0.8, 0.1)), t)
                t += beats * beat
    if chords:
        t = 0.0
        while t < dur:
            for chord, beats in chords:
                if t >= dur:
                    break
                for n in chord:
                    place(track, tone(note_freq(n), beats * beat, chord_kind, vol * 0.45, (0.2, 0.3, 0.7, 0.4)), t)
                t += beats * beat
    return track[: int(dur * SR)]


def blip(track, t, freq=880, dur=0.08, vol=0.25, kind="square"):
    place(track, tone(freq, dur, kind, vol, (0.002, 0.02, 0.5, 0.03)), t)


def boing(track, t, vol=0.3):
    n = int(0.35 * SR)
    tt = np.arange(n) / SR
    f = 220 + 400 * np.exp(-tt * 8)
    phase = 2 * np.pi * np.cumsum(f) / SR
    place(track, (np.sin(phase) * np.exp(-tt * 6) * vol).astype(np.float32), t)


def thump(track, t, vol=0.5):
    n = int(0.25 * SR)
    tt = np.arange(n) / SR
    f = 120 * np.exp(-tt * 10) + 40
    phase = 2 * np.pi * np.cumsum(f) / SR
    place(track, (np.sin(phase) * np.exp(-tt * 14) * vol).astype(np.float32), t)


def rain_layer(seed, n=120):
    rng = np.random.default_rng(seed)
    return [(rng.random() * W, rng.random() * H, 6 + rng.random() * 10, 8 + rng.random() * 8) for _ in range(n)]


def draw_rain(d, drops, t, color=(200, 220, 255, 110)):
    for x, y, length, speed in drops:
        yy = (y + t * speed * 40) % H
        xx = (x - t * 20) % W
        d.line((xx, yy, xx - 2, yy + length), fill=color, width=1)


# ── 1/11. Star Courier gameplay ────────────────────────────────────────────

def star_courier(path, boss=False):
    dur = 32
    vw = VideoWriter(path, W, H, FPS)
    rng = np.random.default_rng(7 if not boss else 8)
    bg = Image.fromarray(vertical_gradient(W, H, [(0, (4, 4, 20)), (1, (10, 18, 52))]).astype(np.uint8))
    stars = [(rng.random() * W, rng.random() * (H - 40), 0.3 + rng.random() * 1.6) for _ in range(140)]
    ship_x = 120

    def ship_y(t):
        return 175 + 70 * math.sin(t * 0.9) + 25 * math.sin(t * 2.3)

    rocks = []
    for i in range(70):
        speed = 140 + rng.random() * 120
        tc = 2.5 + i * 0.42
        x0 = ship_x + speed * tc
        y = rng.random() * (H - 80) + 30
        if abs(y - ship_y(tc)) < 55:
            y = ship_y(tc) + (70 if y < ship_y(tc) else -70)
        rocks.append((x0, min(max(y, 20), H - 50), 10 + rng.random() * 14, speed, rng.random() < 0.3))
    parcels = [(ship_x + 160 * (3 + i * 1.3), 3 + i * 1.3) for i in range(22)]
    audio = melody_track(
        dur,
        [("E5", 0.5), ("G5", 0.5), ("A5", 0.5), ("G5", 0.5), ("E5", 0.5), ("D5", 0.5), ("C5", 1), ("D5", 0.5), ("E5", 0.5), ("G5", 1), (None, 1)],
        150, "square", 0.12,
        bass=[("C3", 1), ("C3", 1), ("A2", 1), ("A2", 1), ("F2", 1), ("F2", 1), ("G2", 1), ("G2", 1)],
        bass_kind="square",
    )
    score = 0
    collected = set()
    title = "Star Courier - Level 4 Boss (Final Part)" if boss else "Star Courier - Levels 1-3 Walkthrough"
    caps = (
        [(2, 9, "Level 4! The boss only fires from the middle lane, so stay high or low."), (9, 18, "Wait for the orbs to pass, then line up with its core."), (18, 27, "Last phase: it speeds up. Keep breathing, you've got this!"), (27, 31, "MISSION COMPLETE. GG everyone!")]
        if boss
        else [(2, 10, "Level 1: easy warm-up. Grab every parcel for the bonus."), (10, 19, "Tip: the blue rocks drift slower, so use them as cover."), (19, 28, "Level 3 gets busy. Hug the bottom lane when it gets tight!"), (28, 31, "No deaths! Part 2 coming soon.")]
    )
    boss_hp = 1.0
    for f in range(dur * FPS):
        t = f / FPS
        if t < 2:
            vw.add(card(title, "PixelPilotGaming", ((10, 20, 60), (2, 4, 16)), t))
            continue
        img = bg.copy()
        d = ImageDraw.Draw(img)
        for sx, sy, sp in stars:
            x = (sx - t * 60 * sp) % W
            b = int(120 + 80 * sp / 2)
            d.point((x, sy), fill=(b, b, b))
        sy = ship_y(t)
        if not boss:
            for x0, y, r, speed, blue in rocks:
                x = x0 - speed * t
                if -30 < x < W + 30:
                    col = (90, 140, 220) if blue else (150, 120, 100)
                    d.ellipse((x - r, y - r, x + r, y + r), fill=col, outline=(40, 40, 50))
            for i, (px, tc) in enumerate(parcels):
                x = px - 160 * t
                y = ship_y(tc)
                if i in collected:
                    continue
                if x <= ship_x + 10:
                    collected.add(i)
                    score += 250
                    blip(audio, t, 1320, 0.07)
                    continue
                if x < W + 20:
                    d.rectangle((x - 9, y - 9, x + 9, y + 9), fill=(250, 200, 60), outline=(120, 80, 10))
                    d.line((x - 9, y, x + 9, y), fill=(160, 100, 20))
        else:
            bx, by = W - 120 + 10 * math.sin(t * 2), H // 2 - 10 + 60 * math.sin(t * 0.7)
            d.polygon([(bx - 60, by), (bx, by - 50), (bx + 50, by - 20), (bx + 50, by + 20), (bx, by + 50)], fill=(160, 60, 90), outline=(255, 120, 160))
            d.ellipse((bx - 18, by - 18, bx + 18, by + 18), fill=(255, 220, 90) if int(t * 4) % 2 else (255, 160, 60))
            for k in range(6):
                ox = bx - 60 - ((t * 160 + k * 110) % 520)
                oy = by + 30 * math.sin(k + t)
                d.ellipse((ox - 8, oy - 8, ox + 8, oy + 8), fill=(255, 90, 140))
            if f % 18 == 0 and t < 27:
                boss_hp = max(0.0, boss_hp - 0.035)
                blip(audio, t, 660, 0.05, 0.2)
                d.line((ship_x + 20, sy, bx - 20, by), fill=(120, 255, 200), width=3)
            d.rectangle((W - 230, 14, W - 30, 26), outline=(255, 255, 255))
            d.rectangle((W - 229, 15, W - 229 + int(198 * boss_hp), 25), fill=(255, 80, 120))
            d.text((W - 238, 20), "CORE", font=font(12, bold=True), fill=(255, 255, 255), anchor="rm")
            score = int((1 - boss_hp) * 20000)
        d.polygon([(ship_x + 22, sy), (ship_x - 14, sy - 13), (ship_x - 6, sy), (ship_x - 14, sy + 13)], fill=(230, 240, 255), outline=(120, 200, 255))
        flame = 6 + 4 * math.sin(t * 30)
        d.polygon([(ship_x - 8, sy - 5), (ship_x - 8 - flame * 2, sy), (ship_x - 8, sy + 5)], fill=(255, 170, 60))
        level = 4 if boss else (1 if t < 10 else 2 if t < 19 else 3)
        d.text((14, 12), f"SCORE {score:06d}", font=font(16, bold=True, mono=True), fill=(255, 255, 255))
        d.text((14, 32), "LIVES " + "<3 " * 3, font=font(13, mono=True), fill=(255, 120, 140))
        d.text((W // 2, 18), f"LEVEL {level}", font=font(16, bold=True, mono=True), fill=(120, 220, 255), anchor="mm")
        if not boss and (10 <= t < 11.5 or 19 <= t < 20.5):
            d.text((W // 2, H // 2), f"LEVEL {level}", font=font(40, bold=True, mono=True), fill=(255, 230, 120), anchor="mm")
        caption(img, timed(caps, t))
        vw.add(img)
    return vw.finish(normalize(audio, 0.6)), 14 if not boss else 22


# ── 2. Mochi vs. the laser pointer ─────────────────────────────────────────

def room_background():
    img = Image.new("RGB", (W, H), (236, 222, 196))
    d = ImageDraw.Draw(img)
    d.rectangle((0, 250, W, H), fill=(170, 120, 80))
    for x in range(0, W, 48):
        d.line((x, 250, x - 30, H), fill=(150, 104, 68), width=2)
    d.rectangle((380, 40, 560, 170), fill=(170, 210, 240), outline=(255, 255, 255), width=8)
    d.line((470, 40, 470, 170), fill=(255, 255, 255), width=6)
    d.rounded_rectangle((40, 150, 300, 260), 20, fill=(90, 120, 170))
    d.rounded_rectangle((30, 130, 70, 260), 16, fill=(80, 108, 155))
    d.rounded_rectangle((270, 130, 310, 260), 16, fill=(80, 108, 155))
    d.ellipse((200, 280, 520, 350), fill=(210, 90, 90))
    return img


def draw_cat(d, x, y, stretch=0.0, color=(250, 190, 110)):
    body_w = 60 + stretch * 30
    d.ellipse((x - body_w / 2, y - 26, x + body_w / 2, y + 22), fill=color)
    hx, hy = x + body_w / 2 - 6, y - 26
    d.ellipse((hx - 20, hy - 18, hx + 20, hy + 18), fill=color)
    d.polygon([(hx - 18, hy - 8), (hx - 12, hy - 30), (hx - 2, hy - 14)], fill=color)
    d.polygon([(hx + 18, hy - 8), (hx + 12, hy - 30), (hx + 2, hy - 14)], fill=color)
    d.ellipse((hx - 9, hy - 5, hx - 3, hy + 2), fill=(40, 40, 40))
    d.ellipse((hx + 3, hy - 5, hx + 9, hy + 2), fill=(40, 40, 40))
    d.polygon([(hx - 3, hy + 5), (hx + 3, hy + 5), (hx, hy + 9)], fill=(240, 120, 130))
    d.arc((x - body_w / 2 - 30, y - 30, x - body_w / 2 + 10, y + 10), 90, 250, fill=color, width=8)


def mochi(path):
    dur = 22
    vw = VideoWriter(path, W, H, FPS)
    bg = room_background()
    audio = melody_track(dur, [("C5", 0.5), ("E5", 0.5), ("G5", 0.5), ("E5", 0.5), ("F5", 0.5), ("A5", 0.5), ("G5", 1)], 128, "pluck", 0.2,
                         bass=[("C3", 2), ("F2", 2), ("G2", 2), ("C3", 2)])
    caps = [(2, 7, "Day 3 of training Mochi. She is VERY focused today."), (7, 13, "Left... right... she's getting faster!"), (13, 17, "The big pounce!!"), (17, 20, "Straight into the cushion pile. She meant to do that.")]
    cat_x, cat_y, vx = 140.0, 300.0, 0.0
    bounced = False
    for f in range(dur * FPS):
        t = f / FPS
        if t < 2:
            vw.add(card("Mochi vs. the Laser Pointer", "TheHendersonsHome", ((240, 150, 90), (180, 80, 60)), t))
            continue
        if t >= 20:
            img = card("Mochi: 1  Laser: 0", "Thanks for watching!", ((240, 150, 90), (180, 80, 60)))
            vw.add(img)
            continue
        img = bg.copy()
        d = ImageDraw.Draw(img)
        if t < 13:
            dot_x = 320 + 220 * math.sin(t * 1.4) * math.cos(t * 0.5)
            dot_y = 300 + 25 * math.sin(t * 2.7)
        else:
            dot_x, dot_y = 520, 260
        target = dot_x - 40
        vx = vx * 0.85 + (target - cat_x) * 0.04
        cat_x += vx
        stretch = min(1.0, abs(vx) / 12)
        cy = cat_y
        if 13 <= t < 16:
            k = (t - 13) / 3
            cat_x = 300 + 220 * k
            cy = 300 - 110 * math.sin(math.pi * k)
            stretch = 1.0
        if t >= 16:
            cat_x, cy = 520, 300
            if not bounced:
                boing(audio, t)
                bounced = True
        # cushions
        for i, (cx, col) in enumerate([(500, (240, 200, 90)), (540, (120, 190, 140)), (520, (230, 120, 160))]):
            jiggle = 6 * math.sin((t - 16) * 18) * math.exp(-(t - 16) * 2) if t >= 16 else 0
            d.rounded_rectangle((cx - 34, 270 - i * 14 + jiggle, cx + 34, 310 - i * 14 + jiggle), 14, fill=col)
        draw_cat(d, cat_x, cy, stretch)
        if t < 16:
            d.ellipse((dot_x - 5, dot_y - 5, dot_x + 5, dot_y + 5), fill=(255, 30, 30))
            d.ellipse((dot_x - 10, dot_y - 10, dot_x + 10, dot_y + 10), outline=(255, 120, 120))
        if 13 <= t < 13.1:
            boing(audio, t, 0.15)
        caption(img, timed(caps, t))
        vw.add(img)
    return vw.finish(normalize(audio, 0.6)), 15


# ── 3. Summer Rain (music upload) ──────────────────────────────────────────

def piano_piece(dur):
    track = np.zeros(int(dur * SR) + SR, dtype=np.float32)
    beat = 60 / 76
    chords = [["C3", "G3", "E4"], ["A2", "E3", "C4"], ["F2", "C3", "A3"], ["G2", "D3", "B3"]]
    melody = ["E5", "D5", "C5", "D5", "E5", "G5", "E5", "D5", "C5", "A4", "C5", "D5", "B4", "G4", "A4", "B4"]
    t, i = 1.0, 0
    while t < dur - 1:
        if i % 4 == 0:
            for n in chords[(i // 4) % 4]:
                place(track, tone(note_freq(n), beat * 4, "piano", 0.22), t)
        place(track, tone(note_freq(melody[i % len(melody)]), beat * 1.5, "piano", 0.3), t)
        t += beat
        i += 1
    track = track[: int(dur * SR)]
    track += fast_noise_bed(dur, 0.06, 5, 60)
    return normalize(track, 0.7)


def summer_rain(path):
    dur = 40
    audio = piano_piece(dur)
    vw = VideoWriter(path, W, H, FPS)
    drops = rain_layer(3, 160)
    beads = [(np.random.default_rng(i).random() * W, np.random.default_rng(i + 99).random() * H, 3 + (i % 5)) for i in range(60)]
    base = Image.fromarray(vertical_gradient(W, H, [(0, (60, 80, 110)), (1, (30, 40, 60))]).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))
    hop = SR // FPS
    for f in range(dur * FPS):
        t = f / FPS
        img = base.copy()
        d = ImageDraw.Draw(img, "RGBA")
        draw_rain(d, drops, t)
        for bx, by, r in beads:
            yy = (by + t * r * 3) % H
            d.ellipse((bx - r, yy - r, bx + r, yy + r * 1.3), fill=(220, 235, 255, 70), outline=(255, 255, 255, 90))
        d.rectangle((0, 0, W, H), outline=(40, 30, 24), width=18)
        d.line((W // 2, 0, W // 2, H), fill=(40, 30, 24), width=10)
        chunk = audio[f * hop: f * hop + 2048]
        if len(chunk) < 2048:
            chunk = np.pad(chunk, (0, 2048 - len(chunk)))
        spec = np.abs(np.fft.rfft(chunk * np.hanning(2048)))[2:200]
        bands = [float(np.mean(spec[i * 6:(i + 1) * 6])) for i in range(32)]
        mx = max(1e-3, max(bands))
        for i, v in enumerate(bands):
            h = int(8 + 90 * min(1.0, v / mx) * (0.6 + 0.4 * math.sin(t + i)))
            x = 96 + i * 14
            d.rectangle((x, 300 - h, x + 9, 300), fill=(255, 220, 150, 200))
        d.text((W // 2, 60), "Summer Rain", font=font(34, bold=True, serif=True), fill=(255, 255, 255), anchor="mm")
        d.text((W // 2, 98), "original piano piece - AkiraKeys", font=font(16), fill=(230, 230, 240), anchor="mm")
        vw.add(img)
    return vw.finish(audio), 10


# ── 4. Paint tutorial ──────────────────────────────────────────────────────

def paint_tutorial(path):
    dur = 32
    vw = VideoWriter(path, W, H, FPS)
    audio = melody_track(dur, [("G4", 1), ("B4", 1), ("D5", 1), ("B4", 1)], 96, "pluck", 0.14, chords=[(["G3", "B3", "D4"], 4), (["E3", "G3", "B3"], 4), (["C3", "E3", "G3"], 4), (["D3", "F#3", "A3"], 4)])
    caps = [(2, 8, "Step 1: pick a light blue and fill the top of the canvas for the sky."), (8, 14, "Step 2: choose yellow, hold Shift and drag the ellipse tool for a perfect sun."), (14, 21, "Step 3: draw your hills with the brush, then fill them green."), (21, 27, "Step 4: File > Save As > PNG picture. Name it 'my wallpaper'."), (27, 30, "Step 5: right-click the file and choose Set as desktop background. Done!")]
    canvas = (40, 86, 600, 330)
    for f in range(dur * FPS):
        t = f / FPS
        if t < 2:
            vw.add(card("How to make your own wallpaper in Paint", "TechTipsTom - beginner tutorial", ((40, 110, 180), (16, 50, 100)), t))
            continue
        img = Image.new("RGB", (W, H), (240, 244, 250))
        d = ImageDraw.Draw(img)
        d.rectangle((0, 0, W, 26), fill=(190, 210, 236))
        d.text((10, 13), "untitled - Paint", font=font(13), fill=(20, 30, 50), anchor="lm")
        d.rectangle((0, 26, W, 78), fill=(245, 248, 252))
        for i, col in enumerate([(0, 0, 0), (127, 127, 127), (237, 28, 36), (255, 127, 39), (255, 242, 0), (34, 177, 76), (0, 162, 232), (63, 72, 204), (163, 73, 164), (255, 255, 255), (153, 217, 234), (181, 230, 29)]):
            x = 330 + (i % 6) * 22
            y = 34 + (i // 6) * 20
            d.rectangle((x, y, x + 18, y + 16), fill=col, outline=(120, 120, 120))
        for i, label in enumerate(["Pencil", "Fill", "Text", "Brush", "Shapes"]):
            d.rectangle((12 + i * 60, 36, 66 + i * 60, 70), outline=(170, 180, 200), fill=(255, 255, 255))
            d.text((39 + i * 60, 53), label, font=font(10), fill=(40, 40, 60), anchor="mm")
        d.rectangle(canvas, fill=(255, 255, 255), outline=(150, 160, 180))
        cx0, cy0, cx1, cy1 = canvas
        if t >= 3:
            k = min(1.0, (t - 3) / 4)
            d.rectangle((cx0 + 1, cy0 + 1, cx1 - 1, cy0 + 1 + int((cy1 - cy0 - 2) * k)), fill=(153, 217, 234))
        if t >= 9:
            k = min(1.0, (t - 9) / 3)
            r = 40 * k
            d.ellipse((470 - r, 140 - r, 470 + r, 140 + r), fill=(255, 242, 0))
        if t >= 15:
            k = min(1.0, (t - 15) / 4)
            pts = [(cx0 + 1, cy1 - 1)]
            for x in range(cx0, int(cx0 + (cx1 - cx0) * k) + 1, 10):
                pts.append((x, 270 - 30 * math.sin((x - cx0) / 90)))
            pts.append((pts[-1][0], cy1 - 1))
            if len(pts) > 2:
                d.polygon(pts, fill=(34, 177, 76))
        if 22 <= t < 27:
            d.rectangle((180, 130, 460, 250), fill=(240, 240, 240), outline=(80, 100, 140), width=2)
            d.rectangle((180, 130, 460, 152), fill=(190, 210, 236))
            d.text((190, 141), "Save As", font=font(12), fill=(20, 20, 40), anchor="lm")
            d.text((196, 180), "File name:", font=font(12), fill=(20, 20, 20), anchor="lm")
            typed = "my wallpaper"[: max(0, int((t - 22.5) * 6))]
            d.rectangle((270, 170, 450, 190), fill=(255, 255, 255), outline=(120, 120, 120))
            d.text((274, 180), typed, font=font(12), fill=(0, 0, 0), anchor="lm")
            d.text((196, 210), "Save as type:  PNG (*.png)", font=font(12), fill=(20, 20, 20), anchor="lm")
            d.rectangle((380, 222, 450, 242), fill=(225, 235, 250), outline=(100, 120, 160))
            d.text((415, 232), "Save", font=font(12), fill=(0, 0, 0), anchor="mm")
        mx = 320 + 200 * math.sin(t * 0.8)
        my = 200 + 80 * math.cos(t * 1.1)
        d.polygon([(mx, my), (mx, my + 18), (mx + 5, my + 13), (mx + 12, my + 13)], fill=(255, 255, 255), outline=(0, 0, 0))
        caption(img, timed(caps, t))
        vw.add(img)
    return vw.finish(normalize(audio, 0.5)), 20


# ── 5. Backyard trick shot ─────────────────────────────────────────────────

def trick_shot(path):
    dur = 20
    vw = VideoWriter(path, W, H, FPS)
    audio = fast_noise_bed(dur, 0.12, 9, 200)
    bg = Image.fromarray(vertical_gradient(W, H, [(0, (140, 200, 255)), (0.55, (200, 230, 255)), (0.56, (90, 170, 80)), (1, (60, 140, 60))]).astype(np.uint8))
    d0 = ImageDraw.Draw(bg)
    for x in range(0, W, 22):
        d0.rectangle((x, 150, x + 16, 210), fill=(200, 160, 110))
    d0.rectangle((0, 160, W, 166), fill=(170, 130, 90))
    d0.rectangle((470, 210, 600, 300), outline=(255, 255, 255), width=5)
    for k in range(0, 130, 12):
        d0.line((470 + k, 212, 470 + k, 298), fill=(230, 230, 230))
    for k in range(0, 90, 12):
        d0.line((472, 212 + k, 598, 212 + k), fill=(230, 230, 230))

    def ball_pos(s):
        # kick (0) -> fence (1.2s) -> post (2.0s) -> net (2.6s)
        if s < 1.2:
            k = s / 1.2
            return 80 + 300 * k, 290 - 160 * math.sin(math.pi * k * 0.9)
        if s < 2.0:
            k = (s - 1.2) / 0.8
            return 380 - 40 * k + 160 * k, 170 + 40 * k
        if s < 2.6:
            k = (s - 2.0) / 0.6
            return 500 + 40 * k, 210 + 60 * k
        return 540, 285

    caps = [(2, 6, "Attempt #47. My neighbour said it was impossible."), (6, 9, "Off the fence... off the post... IN!!"), (9, 17, "Slow-motion replay!"), (17, 19, "We're going to Sunday league finals, baby.")]
    thump(audio, 2.0 + 1.0)
    thump(audio, 2.0 + 2.2, 0.4)
    thump(audio, 2.0 + 3.0, 0.3)
    place(audio, fast_noise_bed(3, 0.35, 10, 30), 2.0 + 3.6)
    for f in range(dur * FPS):
        t = f / FPS
        if t < 2:
            vw.add(card("Backyard Trick Shot: off the fence and in!", "SundayStrikers", ((30, 120, 60), (10, 60, 30)), t))
            continue
        img = bg.copy()
        d = ImageDraw.Draw(img, "RGBA")
        if t < 9:
            s = max(0.0, (t - 3) / 1.15)
            label = ""
        else:
            s = max(0.0, (t - 10) / 3.0)
            label = "REPLAY"
            for k in range(1, 8):
                px, py = ball_pos(max(0.0, s - k * 0.05))
                d.ellipse((px - 9, py - 9, px + 9, py + 9), fill=(255, 255, 255, 40))
        bx, by = ball_pos(min(s, 3.0))
        d.ellipse((60, 250, 90, 300), fill=(240, 80, 60))
        d.ellipse((66, 230, 86, 252), fill=(240, 200, 170))
        d.ellipse((bx - 10, by - 10, bx + 10, by + 10), fill=(255, 255, 255), outline=(30, 30, 30), width=2)
        if label:
            d.text((W - 20, 20), label, font=font(22, bold=True), fill=(255, 230, 60), anchor="ra")
        caption(img, timed(caps, t))
        vw.add(img)
    return vw.finish(normalize(audio, 0.6)), 7


# ── 6. Transitions (video editing) ─────────────────────────────────────────

def scene_img(i):
    palettes = [((255, 140, 90), (255, 200, 120)), ((80, 160, 255), (150, 220, 255)), ((120, 220, 140), (200, 250, 190)), ((200, 120, 255), (240, 190, 255)), ((255, 220, 90), (255, 250, 200)), ((90, 90, 120), (160, 160, 200))]
    a, b = palettes[i % len(palettes)]
    img = Image.fromarray(vertical_gradient(W, H, [(0, a), (1, b)]).astype(np.uint8))
    d = ImageDraw.Draw(img)
    for k in range(5):
        r = 30 + k * 18
        d.ellipse((W * (0.2 + 0.15 * k) - r, H * 0.5 - r, W * (0.2 + 0.15 * k) + r, H * 0.5 + r), outline=(255, 255, 255), width=3)
    d.text((W // 2, 50), f"Clip {chr(65 + i)}", font=font(30, bold=True), fill=(255, 255, 255), anchor="mm")
    return img


def transitions(path):
    dur = 28
    vw = VideoWriter(path, W, H, FPS)
    audio = melody_track(dur, [("A4", 0.5), ("C5", 0.5), ("E5", 0.5), ("A5", 0.5)], 120, "saw", 0.07, bass=[("A2", 2), ("F2", 2), ("C3", 2), ("G2", 2)])
    scenes = [scene_img(i) for i in range(6)]
    names = ["1. Cross dissolve", "2. Wipe", "3. Zoom", "4. Slide", "5. Dip to white"]
    for f in range(dur * FPS):
        t = f / FPS
        if t < 2:
            vw.add(card("5 Smooth Transitions for Your Montage", "CutAboveEdits - editing tips", ((40, 40, 50), (10, 10, 14)), t))
            continue
        if t >= 27:
            vw.add(end_card("CutAboveEdits"))
            continue
        seg = int((t - 2) // 5)
        local = (t - 2) % 5
        a, b = scenes[seg], scenes[seg + 1]
        k = min(1.0, max(0.0, (local - 2.5) / 1.5))
        ease = k * k * (3 - 2 * k)
        if seg == 0:
            img = Image.blend(a, b, ease)
        elif seg == 1:
            img = a.copy()
            x = int(W * ease)
            img.paste(b.crop((0, 0, x, H)), (0, 0)) if x > 0 else None
        elif seg == 2:
            z = 1 + ease * 0.8
            za = a.resize((int(W * z), int(H * z))).crop((int(W * (z - 1) / 2), int(H * (z - 1) / 2), int(W * (z - 1) / 2) + W, int(H * (z - 1) / 2) + H))
            img = Image.blend(za, b, ease)
        elif seg == 3:
            img = Image.new("RGB", (W, H))
            off = int(W * ease)
            img.paste(a, (-off, 0))
            img.paste(b, (W - off, 0))
        else:
            white = Image.new("RGB", (W, H), (255, 255, 255))
            img = Image.blend(a, white, min(1.0, ease * 2)) if ease < 0.5 else Image.blend(white, b, (ease - 0.5) * 2)
        caption(img, names[seg])
        vw.add(img)
    return vw.finish(normalize(audio, 0.5)), 6


# ── 7. Desktop tour (computer customisation) ───────────────────────────────

def desktop_tour(path):
    dur = 27
    vw = VideoWriter(path, W, H, FPS)
    audio = melody_track(dur, [("E4", 1), ("G4", 1), ("B4", 1), ("D5", 1)], 90, "pad", 0.12, chords=[(["E3", "G3", "B3"], 4), (["C3", "E3", "G3"], 4)])
    keys = ["aurora-lake", "retro-grid", "cherry-hills", "starfield"]
    walls = [Image.open(PUBLIC / "wallpapers" / f"{k}.jpg").resize((W, H)) for k in keys]
    labels = ["Wallpaper: Aurora Lake. So calm for late-night homework.", "Retro Grid for gaming nights. Purple everything!", "Cherry Blossom Hills for spring. Very relaxing.", "And Starfield, my current favourite."]
    for f in range(dur * FPS):
        t = f / FPS
        if t < 2:
            vw.add(card("My Desktop Tour 2013", "ModMyMachine - themes, icons and docks", ((30, 60, 90), (10, 20, 40)), t))
            continue
        if t >= 26:
            vw.add(end_card("ModMyMachine", "Show me your desktops in the comments!"))
            continue
        i = min(3, int((t - 2) // 6))
        local = (t - 2) % 6
        img = walls[i].copy()
        if local < 0.6 and i > 0:
            img = Image.blend(walls[i - 1], walls[i], local / 0.6)
        d = ImageDraw.Draw(img, "RGBA")
        d.rectangle((0, H - 30, W, H), fill=(20, 40, 70, 190))
        d.ellipse((6, H - 28, 32, H - 2), fill=(60, 140, 220))
        dock_w = 7 * 38
        d.rounded_rectangle((W // 2 - dock_w // 2, H - 84, W // 2 + dock_w // 2, H - 40), 12, fill=(255, 255, 255, 70))
        for k in range(7):
            x = W // 2 - dock_w // 2 + 8 + k * 38
            d.rounded_rectangle((x, H - 78, x + 30, H - 48), 6, fill=[(240, 90, 80), (90, 180, 240), (250, 200, 60), (120, 210, 120), (190, 120, 230), (240, 150, 70), (200, 200, 210)][k])
        cx, cy = W - 70, 70
        d.ellipse((cx - 40, cy - 40, cx + 40, cy + 40), fill=(255, 255, 255, 200), outline=(80, 80, 80))
        ang = t * 0.5
        d.line((cx, cy, cx + 22 * math.sin(ang), cy - 22 * math.cos(ang)), fill=(30, 30, 30), width=3)
        d.line((cx, cy, cx + 32 * math.sin(ang * 12), cy - 32 * math.cos(ang * 12)), fill=(200, 40, 40), width=2)
        d.rounded_rectangle((W - 130, 125, W - 10, 175), 8, fill=(255, 255, 255, 190))
        d.text((W - 120, 150), "72°F  Sunny", font=font(15, bold=True), fill=(40, 40, 60), anchor="lm")
        caption(img, labels[i])
        vw.add(img)
    return vw.finish(normalize(audio, 0.5)), 8


# ── 8. Rainy Saturday vlog ─────────────────────────────────────────────────

def rainy_vlog(path):
    dur = 32
    vw = VideoWriter(path, W, H, FPS)
    audio = melody_track(dur, [("A4", 1), ("C5", 1), ("E5", 2)], 72, "piano", 0.18, chords=[(["F3", "A3", "C4", "E4"], 4), (["C3", "E3", "G3", "B3"], 4), (["D3", "F3", "A3", "C4"], 4), (["G2", "B2", "D3", "F3"], 4)], chord_kind="pad")
    audio = audio + fast_noise_bed(dur, 0.05, 12, 60)
    drops = rain_layer(5, 140)
    caps = [(2, 8, "Morning! It's pouring outside, so... it's officially pancake day."), (8, 14, "Three pancakes, blueberries, too much syrup. Perfect."), (14, 21, "Found a new sketchbook at the shop yesterday. First doodle: our street."), (21, 27, "Pepper has the right idea. Nap o'clock."), (27, 30, "Thanks for hanging out! See you next Saturday :)")]
    for f in range(dur * FPS):
        t = f / FPS
        if t < 2:
            vw.add(card("Rainy Saturday Vlog: pancakes, sketching and a sleepy cat", "DailyDanaVlogs", ((90, 110, 140), (40, 50, 70)), t))
            continue
        if t < 8:
            img = Image.fromarray(vertical_gradient(W, H, [(0, (110, 130, 160)), (1, (70, 85, 110))]).astype(np.uint8))
            d = ImageDraw.Draw(img, "RGBA")
            for x in range(0, W, 70):
                d.rectangle((x, 200 - (x % 3) * 30, x + 60, H), fill=(60, 70, 90))
            draw_rain(d, drops, t)
            d.rectangle((0, 0, W, H), outline=(240, 236, 230), width=24)
            d.rectangle((0, H - 50, W, H), fill=(220, 200, 170))
            d.ellipse((480, H - 110, 560, H - 50), fill=(250, 250, 250))
            for k in range(3):
                sx = 505 + k * 14
                d.line([(sx + 6 * math.sin(t * 3 + k + j / 3), H - 115 - j * 6) for j in range(8)], fill=(255, 255, 255, 120), width=3)
        elif t < 14:
            img = Image.new("RGB", (W, H), (250, 236, 210))
            d = ImageDraw.Draw(img, "RGBA")
            d.ellipse((140, 230, 500, 330), fill=(255, 255, 255), outline=(200, 200, 200))
            for k in range(3):
                d.ellipse((200, 230 - k * 26, 440, 280 - k * 26), fill=(222, 170, 100), outline=(180, 120, 60))
            drip = min(70, (t - 8) * 20)
            d.ellipse((260, 160, 380, 190), fill=(150, 80, 20, 220))
            d.line((380, 180, 380, 180 + drip), fill=(150, 80, 20, 220), width=6)
            for bx, by in [(290, 168), (320, 172), (345, 166)]:
                d.ellipse((bx - 7, by - 7, bx + 7, by + 7), fill=(60, 70, 160))
        elif t < 21:
            img = Image.new("RGB", (W, H), (190, 150, 110))
            d = ImageDraw.Draw(img)
            d.rectangle((150, 60, 490, 320), fill=(252, 250, 244), outline=(120, 100, 80), width=3)
            k = (t - 14) / 6
            strokes = [((200, 250), (200, 170)), ((200, 170), (260, 120)), ((260, 120), (320, 170)), ((320, 170), (320, 250)), ((200, 250), (320, 250)), ((240, 250), (240, 200)), ((240, 200), (270, 200)), ((270, 200), (270, 250)), ((340, 250), (340, 150)), ((340, 150), (440, 150)), ((440, 150), (440, 250)), ((340, 250), (440, 250))]
            n = int(len(strokes) * min(1.0, k * 1.2))
            for a, b in strokes[:n]:
                d.line((a, b), fill=(40, 40, 50), width=3)
            d.line((470, 300, 470 - 60 * math.cos(t * 4), 320 + 10 * math.sin(t * 4)), fill=(230, 180, 40), width=8)
        elif t < 27:
            img = Image.new("RGB", (W, H), (120, 140, 190))
            d = ImageDraw.Draw(img)
            d.ellipse((140, 200, 500, 340), fill=(200, 80, 90))
            breathe = 4 * math.sin(t * 2)
            d.ellipse((240, 210 - breathe, 400, 300), fill=(60, 60, 70))
            d.ellipse((370, 210 - breathe, 440, 270), fill=(60, 60, 70))
            d.polygon([(380, 220), (388, 196), (400, 216)], fill=(60, 60, 70))
            d.polygon([(410, 216), (424, 196), (432, 222)], fill=(60, 60, 70))
            for k in range(3):
                zz = (t * 0.8 + k * 0.33) % 1
                d.text((450 + zz * 40, 190 - zz * 80), "z", font=font(18 + k * 4, bold=True), fill=(255, 255, 255))
        else:
            img = card("See you next Saturday!", "DailyDanaVlogs", ((90, 110, 140), (40, 50, 70)))
        caption(img, timed(caps, t))
        vw.add(img)
    return vw.finish(normalize(audio, 0.6)), 10


# ── 9/10. Anime commentary ─────────────────────────────────────────────────

def commentary(path, title, slides, colors, verdict):
    dur = 2 + len(slides) * 5 + 4
    vw = VideoWriter(path, W, H, FPS)
    audio = melody_track(dur, [("D5", 1), ("F5", 1), ("A5", 1), ("G5", 1)], 84, "pad", 0.1, chords=[(["D3", "F3", "A3"], 4), (["Bb2", "D3", "F3"], 4), (["C3", "E3", "G3"], 4), (["A2", "C#3", "E3"], 4)])
    for f in range(dur * FPS):
        t = f / FPS
        if t < 2:
            vw.add(card(title, "AnimeTalkTuesday - spoiler-free", colors, t))
            continue
        if t >= dur - 4:
            vw.add(card(verdict, "What did you think? Tell me in the comments!", colors))
            continue
        i = int((t - 2) // 5)
        local = (t - 2) % 5
        heading, bullets = slides[i]
        img = Image.fromarray(vertical_gradient(W, H, [(0, colors[0]), (1, colors[1])]).astype(np.uint8))
        d = ImageDraw.Draw(img, "RGBA")
        for k in range(18):
            x = (k * 53 + t * 20) % W
            y = (k * 97) % H
            d.ellipse((x - 3, y - 3, x + 3, y + 3), fill=(255, 255, 255, 50))
        d.rounded_rectangle((20, 20, 170, 46), 12, fill=(255, 200, 60))
        d.text((95, 33), "SPOILER-FREE", font=font(13, bold=True), fill=(40, 30, 10), anchor="mm")
        d.text((40, 90), heading, font=font(26, bold=True), fill=(255, 255, 255), anchor="lm")
        for j, b in enumerate(bullets):
            if local >= 0.6 + j * 0.9:
                for li, ln in enumerate(wrap(d, b, font(18), W - 120)):
                    d.text((60, 140 + j * 52 + li * 22), ("- " if li == 0 else "  ") + ln, font=font(18), fill=(235, 240, 255), anchor="lm")
        vw.add(img)
    return vw.finish(normalize(audio, 0.5)), 4


# ── 12. Biscuit's first snow day ───────────────────────────────────────────

def snow_day(path):
    dur = 22
    vw = VideoWriter(path, W, H, FPS)
    audio = melody_track(dur, [("G5", 0.5), ("E5", 0.5), ("C5", 0.5), ("E5", 0.5), ("D5", 1), ("G4", 1)], 120, "pluck", 0.2, bass=[("C3", 2), ("G2", 2)])
    rng = np.random.default_rng(17)
    flakes = [(rng.random() * W, rng.random() * H, 1 + rng.random() * 3) for _ in range(150)]
    caps = [(2, 8, "Biscuit has never seen snow before. Reaction incoming..."), (8, 14, "HOP. HOP. HOP. He has decided snow is the best thing ever."), (14, 19, "Snow face! 10/10 would hop again."), (19, 20.5, "Hot cocoa time for the humans.")]
    trail = []
    for f in range(dur * FPS):
        t = f / FPS
        if t < 2:
            vw.add(card("Biscuit's First Snow Day!", "TheHendersonsHome", ((120, 170, 220), (60, 100, 160)), t))
            continue
        if t >= 20.5:
            vw.add(end_card("TheHendersonsHome", "Thanks for watching!"))
            continue
        img = Image.fromarray(vertical_gradient(W, H, [(0, (180, 200, 230)), (0.6, (225, 235, 250)), (0.61, (245, 248, 255)), (1, (230, 238, 250))]).astype(np.uint8))
        d = ImageDraw.Draw(img)
        x = 60 + (t - 2) * 30 if t < 14 else 420
        hop = abs(math.sin(t * 5)) * 40 if 8 <= t < 14 else 0
        y = 290 - hop
        if f % 6 == 0 and t < 14:
            trail.append(x)
        for px in trail:
            d.ellipse((px - 6, 300, px + 6, 308), fill=(200, 210, 230))
        d.ellipse((x - 40, y - 20, x + 40, y + 20), fill=(220, 150, 80))
        d.ellipse((x + 22, y - 40, x + 62, y - 6), fill=(220, 150, 80))
        d.polygon([(x + 28, y - 34), (x + 30, y - 58), (x + 42, y - 38)], fill=(220, 150, 80))
        d.polygon([(x + 48, y - 38), (x + 58, y - 58), (x + 60, y - 32)], fill=(220, 150, 80))
        d.ellipse((x + 50, y - 26, x + 58, y - 18), fill=(30, 30, 30))
        d.ellipse((x + 34, y - 30, x + 40, y - 24), fill=(30, 30, 30))
        if t >= 14:
            d.ellipse((x + 36, y - 22, x + 64, y - 6), fill=(250, 252, 255))
        for i, (fx, fy, s) in enumerate(flakes):
            yy = (fy + t * 30 * s) % H
            xx = (fx + 10 * math.sin(t + i)) % W
            d.ellipse((xx - s, yy - s, xx + s, yy + s), fill=(255, 255, 255))
        if 8 <= t < 14 and int(t * 5 * 2 / math.pi) != int((t - 1 / FPS) * 5 * 2 / math.pi):
            boing(audio, t, 0.08)
        caption(img, timed(caps, t))
        vw.add(img)
    return vw.finish(normalize(audio, 0.6)), 10


# ── 13. Paper plane distance challenge ─────────────────────────────────────

def paper_planes(path):
    dur = 24
    vw = VideoWriter(path, W, H, FPS)
    audio = melody_track(dur, [("C5", 0.5), ("D5", 0.5), ("E5", 0.5), ("G5", 0.5), ("E5", 1), ("C5", 1)], 116, "pluck", 0.18, bass=[("C3", 2), ("A2", 2), ("F2", 2), ("G2", 2)])
    caps = [(2, 8, "Paper plane challenge! Throw 1: the classic dart."), (8, 14, "Throw 2: wide wings. Very elegant, very... short."), (14, 20, "Throw 3: my secret design. Folded it at 2am. Here we go!"), (20, 22, "NEW RECORD: 24 metres!! Folding guide in the description.")]
    throws = [(2.5, 9), (8.5, 6), (14.5, 24)]
    for f in range(dur * FPS):
        t = f / FPS
        if t < 2:
            vw.add(card("Paper Plane Distance Challenge", "DailyDanaVlogs", ((90, 170, 120), (40, 100, 60)), t))
            continue
        if t >= 22:
            vw.add(card("New record: 24 m!", "Thanks for watching!", ((90, 170, 120), (40, 100, 60))))
            continue
        img = Image.fromarray(vertical_gradient(W, H, [(0, (150, 210, 255)), (0.62, (220, 240, 255)), (0.63, (110, 190, 100)), (1, (80, 160, 80))]).astype(np.uint8))
        d = ImageDraw.Draw(img)
        for m in range(0, 26, 2):
            x = 60 + m * 22
            d.line((x, 240, x, 250), fill=(255, 255, 255), width=2)
            if m % 4 == 0:
                d.text((x, 262), f"{m}m", font=font(11), fill=(255, 255, 255), anchor="mm")
        for start, dist in throws:
            if start <= t < start + 5.5:
                k = min(1.0, (t - start) / 4)
                x = 60 + dist * 22 * k
                y = 200 - 90 * math.sin(math.pi * k) + 40 * k
                d.polygon([(x + 16, y), (x - 12, y - 8), (x - 4, y), (x - 12, y + 8)], fill=(255, 255, 255), outline=(120, 120, 140))
                if k >= 1:
                    d.text((x, y - 24), f"{dist} m", font=font(16, bold=True), fill=(255, 255, 255), anchor="mm")
        caption(img, timed(caps, t))
        vw.add(img)
    return vw.finish(normalize(audio, 0.6)), 18


VIDEOS = [
    ("star-courier-1", lambda p: star_courier(p, False)),
    ("star-courier-boss", lambda p: star_courier(p, True)),
    ("mochi-laser", mochi),
    ("summer-rain", summer_rain),
    ("paint-wallpaper-tutorial", paint_tutorial),
    ("backyard-trick-shot", trick_shot),
    ("five-transitions", transitions),
    ("desktop-tour-2013", desktop_tour),
    ("rainy-saturday-vlog", rainy_vlog),
    ("sinful-apex-review", lambda p: commentary(
        p, "Sinful Apex: Why the Finale Works",
        [
            ("The basics", ["Flow Pictures, 24 episodes", "Aired Aug 15, 2011 - Jan 23, 2012", "Directed by Kaihatsu Miura"]),
            ("Why it works", ["Every episode moves the climb forward", "No filler, no recap episodes", "The tower lords each get a moment"]),
            ("The music", ["LUNE as the singer Aria Moonbirth", "The ending song hits harder every week"]),
        ],
        ((90, 30, 70), (30, 10, 30)), "Verdict: 9/10, go watch it!")),
    ("iron-to-requiem-first-impressions", lambda p: commentary(
        p, "Iron to Requiem: First Impressions",
        [
            ("The basics", ["CHAOS Home, 26 episodes planned", "Premiered April 4, 2013, on Thursdays", "Music by Hiroyuki Sawano"]),
            ("After episode 1", ["Steady animation, confident opener", "That soundtrack is already a highlight"]),
        ],
        ((40, 60, 90), (10, 16, 30)), "Verdict so far: very promising!")),
    ("biscuit-snow-day", snow_day),
    ("paper-plane-challenge", paper_planes),
]


def main(only=None):
    out = ensure_dirs("videos")
    thumbs = ensure_dirs("videos", "thumbs")
    for key, fn in VIDEOS:
        if only and key not in only:
            continue
        path = out / f"{key}.webm"
        duration, thumb_at = fn(path)
        tp = thumbs / f"{key}.jpg"
        thumbnail_from(path, thumb_at, tp)
        record(f"video:{key}", path, duration=round(duration, 2), width=W, height=H)
        record(f"video-thumb:{key}", tp)
        print("video", key, round(duration, 1), "s", path.stat().st_size // 1024, "KB")


if __name__ == "__main__":
    import sys
    main(sys.argv[1:] or None)
