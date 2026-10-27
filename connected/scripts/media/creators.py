"""Videos for the four MeTube creators the Master Bible names (ch. 7):
XXICEBURNERXX, HEARTCORE_ANGEL, NOOBDESTROYER92 and STRAWBERRY_STATIC.

The Bible allows period-style videos about 2012 soccer, mall failures,
nightcore mixes and talent-show mishaps, marked as constructed
reconstructions; MeTube labels each one on its watch page. Every video has
a happy ending. Run on its own with: python3 scripts/media/creators.py
"""

import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import SR, VideoWriter, ensure_dirs, fast_noise_bed, font, normalize, note_freq, place, record, save_manifest, thumbnail_from, tone, vertical_gradient  # noqa: E402
from videos import FPS, H, W, caption, card, end_card, thump, timed  # noqa: E402
from radio import song  # noqa: E402


def whistle(track, t, vol=0.25):
    n = int(0.5 * SR)
    tt = np.arange(n) / SR
    f = 2800 + 120 * np.sin(2 * np.pi * 30 * tt)
    place(track, (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 3) * vol).astype(np.float32), t)


def cheer(track, t, dur=2.5, vol=0.4, seed=3):
    bed = fast_noise_bed(dur, vol, seed, 25)
    env = np.minimum(1, np.arange(len(bed)) / (0.2 * SR)) * np.linspace(1, 0.3, len(bed))
    place(track, (bed * env).astype(np.float32), t)


def clap_track(track, t0, t1, bpm=120, vol=0.25):
    beat = 60 / bpm
    clap = fast_noise_bed(0.06, 1.0, 21, 2) * np.exp(-np.arange(int(0.06 * SR)) / SR * 50)
    t = t0
    while t < t1:
        place(track, (clap * vol).astype(np.float32), t)
        t += beat


# ── XXICEBURNERXX: top 5 goals of summer 2012 ─────────────────────────────

def soccer_goals(path):
    dur = 24
    vw = VideoWriter(path, W, H, FPS)
    audio = fast_noise_bed(dur, 0.05, 31, 300)
    pitch = Image.fromarray(vertical_gradient(W, H, [(0, (60, 150, 70)), (1, (40, 120, 55))]).astype(np.uint8))
    d0 = ImageDraw.Draw(pitch)
    for x in range(0, W, 64):
        d0.rectangle((x, 0, x + 32, H), fill=(55, 140, 65))
    d0.rectangle((20, 20, W - 20, H - 20), outline=(240, 240, 240), width=3)
    d0.line((W // 2, 20, W // 2, H - 20), fill=(240, 240, 240), width=3)
    d0.ellipse((W // 2 - 50, H // 2 - 50, W // 2 + 50, H // 2 + 50), outline=(240, 240, 240), width=3)
    d0.rectangle((W - 120, H // 2 - 80, W - 20, H // 2 + 80), outline=(240, 240, 240), width=3)
    d0.rectangle((W - 26, H // 2 - 36, W - 12, H // 2 + 36), fill=(250, 250, 250))
    goals = [
        ("#5: Long range from Danny", [(200, 250), (W - 18, H // 2 - 20)]),
        ("#4: Header off a corner", [(W - 60, 30), (W - 140, H // 2), (W - 18, H // 2 + 10)]),
        ("#3: Nutmeg, then bottom corner", [(300, 180), (420, 190), (W - 18, H // 2 + 28)]),
        ("#2: Free kick over the wall", [(380, 120), (W - 18, H // 2 - 30)]),
        ("#1: My first ever volley!!", [(330, 300), (480, 200), (W - 18, H // 2)]),
    ]
    seg = 3.6
    caps = []
    for i, (title, _) in enumerate(goals):
        start = 2 + i * seg
        caps.append((start, start + seg, title))
        thump(audio, start + 0.3, 0.45)
        whistle(audio, start + seg - 1.1, 0.12)
        cheer(audio, start + seg - 1.4, 1.6, 0.3, 40 + i)
    for f in range(dur * FPS):
        t = f / FPS
        if t < 2:
            vw.add(card("TOP 5 GOALS of my Summer 2012 League!!", "XXICEBURNERXX - under 14s", ((20, 110, 50), (6, 50, 20)), t))
            continue
        if t >= 2 + len(goals) * seg:
            vw.add(end_card("XXICEBURNERXX", "Best season ever. GG everyone!"))
            continue
        i = int((t - 2) // seg)
        k = min(1.0, ((t - 2) % seg) / (seg - 1.4))
        pts = goals[i][1]
        legs = len(pts) - 1
        leg = min(legs - 1, int(k * legs))
        lk = k * legs - leg
        (x0, y0), (x1, y1) = pts[leg], pts[leg + 1]
        bx, by = x0 + (x1 - x0) * lk, y0 + (y1 - y0) * lk - 30 * math.sin(math.pi * lk)
        img = pitch.copy()
        d = ImageDraw.Draw(img, "RGBA")
        for px, py in [(160, 120), (240, 260), (360, 200), (470, 120), (520, 250)]:
            d.ellipse((px - 9, py - 9, px + 9, py + 9), fill=(40, 90, 220))
        d.ellipse((W - 70, H // 2 - 9, W - 52, H // 2 + 9), fill=(240, 200, 40))
        d.ellipse((pts[0][0] - 10, pts[0][1] - 10, pts[0][0] + 10, pts[0][1] + 10), fill=(220, 50, 50))
        d.ellipse((bx - 7, by - 7, bx + 7, by + 7), fill=(255, 255, 255), outline=(20, 20, 20), width=2)
        if k >= 1:
            d.text((W // 2, 60), "GOAL!!", font=font(44, bold=True), fill=(255, 235, 60), anchor="mm", stroke_width=3, stroke_fill=(30, 30, 30))
        caption(img, timed(caps, t))
        vw.add(img)
    return vw.finish(normalize(audio, 0.6)), 17.5


# ── HEARTCORE_ANGEL: a nightcore mix ──────────────────────────────────────

def nightcore(path):
    base = song("pop2")
    speed = 1.25
    idx = np.arange(0, len(base) - 1, speed)
    audio = np.interp(idx, np.arange(len(base)), base).astype(np.float32)
    dur = int(len(audio) / SR)
    vw = VideoWriter(path, W, H, FPS)
    rng = np.random.default_rng(5)
    sparkles = [(rng.random() * W, rng.random() * H, 2 + rng.random() * 4, rng.random() * 6.28) for _ in range(60)]
    bg = Image.fromarray(vertical_gradient(W, H, [(0, (255, 170, 210)), (0.6, (170, 140, 240)), (1, (90, 80, 190))]).astype(np.uint8))
    for f in range(dur * FPS):
        t = f / FPS
        img = bg.copy()
        d = ImageDraw.Draw(img, "RGBA")
        for x, y, r, ph in sparkles:
            a = int(120 + 120 * math.sin(t * 3 + ph))
            yy = (y - t * 12) % H
            d.ellipse((x - r, yy - r, x + r, yy + r), fill=(255, 255, 255, max(0, a)))
        # original drawing: a girl's silhouette under a crescent moon, glow sticks in hand
        d.ellipse((470, 40, 560, 130), fill=(255, 250, 220))
        d.ellipse((495, 30, 585, 120), fill=(200, 160, 245))
        d.ellipse((150, 130, 230, 210), fill=(60, 40, 90))
        d.polygon([(130, 330), (250, 330), (215, 205), (165, 205)], fill=(60, 40, 90))
        sway = 10 * math.sin(t * 2 * math.pi * 126 * speed / 60 / 2)
        for side, col in [(-1, (120, 255, 160)), (1, (255, 120, 200))]:
            hx = 190 + side * 55
            d.line((190 + side * 20, 230, hx + sway, 170), fill=(60, 40, 90), width=12)
            d.line((hx + sway, 170, hx + sway + side * 8, 128), fill=col + (255,), width=8)
            d.ellipse((hx + sway + side * 8 - 14, 114, hx + sway + side * 8 + 14, 142), fill=col + (90,))
        d.text((W - 30, H - 70), "Nightcore", font=font(40, bold=True), fill=(255, 255, 255), anchor="rm", stroke_width=2, stroke_fill=(120, 60, 160))
        d.text((W - 30, H - 32), "Glow Stick Summer", font=font(20, bold=True), fill=(255, 240, 250), anchor="rm")
        vw.add(img)
    return vw.finish(normalize(audio, 0.85)), 6


# ── NOOBDESTROYER92: the claw machine ─────────────────────────────────────

def claw_machine(path):
    dur = 22
    vw = VideoWriter(path, W, H, FPS)
    audio = np.zeros(int(dur * SR) + SR, dtype=np.float32)
    # a cheerful arcade loop under everything
    loop = song("chip")
    audio[: min(len(audio), len(loop))] += loop[: len(audio)] * 0.25
    tries = [(2.5, 1, False), (5.0, 7, False), (7.5, 13, False), (10.0, 19, False), (12.5, 20, True)]
    caps = [(2.5, 5, "Try 1. Easy, right?"), (5, 7.5, "Try 7. The claw is too weak, I swear"), (7.5, 10, "Try 13. Mom went to buy pretzels"), (10, 12.5, "Try 19. Last quarter..."), (12.5, 18, "TRY 20!!! WE GOT HIM!!!"), (18, 20, "His name is Sir Fluffington. He lives on my desk now.")]
    for start, _, win in tries:
        place(audio, tone(note_freq("C5"), 0.12, "square", 0.15), start + 0.2)
        if win:
            for i, n in enumerate(["C5", "E5", "G5", "C6"]):
                place(audio, tone(note_freq(n), 0.15, "square", 0.18), start + 1.8 + i * 0.12)
            cheer(audio, start + 2.0, 2.5, 0.35, 61)
        else:
            place(audio, tone(note_freq("G3"), 0.35, "square", 0.12), start + 1.8)
    for f in range(dur * FPS):
        t = f / FPS
        if t < 2.5:
            vw.add(card("MALL FAIL?? 20 tries at the claw machine", "NOOBDESTROYER92", ((40, 40, 110), (10, 10, 50)), t))
            continue
        if t >= 20:
            vw.add(end_card("NOOBDESTROYER92", "Never give up. Also bring more quarters."))
            continue
        cur = max([x for x in tries if x[0] <= t], key=lambda x: x[0])
        start, n, win = cur
        k = t - start
        img = Image.fromarray(vertical_gradient(W, H, [(0, (250, 230, 200)), (1, (220, 200, 170))]).astype(np.uint8))
        d = ImageDraw.Draw(img, "RGBA")
        d.rectangle((160, 20, 480, 340), fill=(220, 60, 90), outline=(120, 20, 40), width=4)
        d.rectangle((180, 50, 460, 250), fill=(200, 235, 255, 255))
        for i, col in enumerate([(255, 210, 90), (140, 220, 140), (250, 160, 200), (160, 190, 250), (240, 240, 240)]):
            x = 200 + i * 52
            d.ellipse((x, 205, x + 44, 245), fill=col)
        target_x = 304 + 22
        drop = min(1.0, k / 0.9) if k < 0.9 else max(0.0, 1 - (k - 1.0) / 0.8)
        cy = 60 + 140 * drop
        d.line((target_x, 50, target_x, cy), fill=(80, 80, 80), width=3)
        d.line((target_x - 14, cy + 12, target_x, cy), fill=(80, 80, 80), width=3)
        d.line((target_x + 14, cy + 12, target_x, cy), fill=(80, 80, 80), width=3)
        holding = win and k >= 0.9
        if holding:
            py = cy + 10
            d.ellipse((target_x - 22, py, target_x + 22, py + 40), fill=(240, 240, 240))
            d.ellipse((target_x - 10, py + 12, target_x - 4, py + 18), fill=(30, 30, 30))
            d.ellipse((target_x + 4, py + 12, target_x + 10, py + 18), fill=(30, 30, 30))
        d.text((320, 290), f"TRIES: {n}", font=font(22, bold=True), fill=(255, 240, 120), anchor="mm")
        if win and k > 1.8:
            d.text((320, 140), "WINNER!", font=font(46, bold=True), fill=(255, 220, 40), anchor="mm", stroke_width=3, stroke_fill=(120, 40, 20))
        caption(img, timed(caps, t))
        vw.add(img)
    return vw.finish(normalize(audio, 0.7)), 15


# ── STRAWBERRY_STATIC: the talent show ────────────────────────────────────

def talent_show(path):
    dur = 24
    vw = VideoWriter(path, W, H, FPS)
    audio = np.zeros(int(dur * SR) + SR, dtype=np.float32)
    tune = song("pop3")
    seg1 = tune[: int(5 * SR)]
    place(audio, seg1 * 0.7, 2.5)
    clap_track(audio, 9.0, 13.5, 116, 0.3)
    place(audio, tune[int(5 * SR): int(13 * SR)] * 0.75, 13.5)
    cheer(audio, 20.5, 3.0, 0.45, 77)
    caps = [(2.5, 7.5, "Spring talent show 2013. Me on keyboard. So nervous!"), (7.5, 9, "...and then the plug fell out."), (9, 13.5, "So the WHOLE gym started clapping the beat for me"), (13.5, 20.5, "Plugged back in and finished it. Best. Night. Ever."), (20.5, 22, "We got second place!!")]
    for f in range(dur * FPS):
        t = f / FPS
        if t < 2.5:
            vw.add(card("Talent show mishap!! (it turned out great)", "STRAWBERRY_STATIC", ((150, 40, 90), (50, 10, 40)), t))
            continue
        if t >= 22:
            vw.add(end_card("STRAWBERRY_STATIC", "Thank you to everyone who clapped <3"))
            continue
        img = Image.fromarray(vertical_gradient(W, H, [(0, (40, 20, 50)), (0.7, (90, 40, 70)), (0.71, (120, 80, 50)), (1, (90, 60, 40))]).astype(np.uint8))
        d = ImageDraw.Draw(img, "RGBA")
        d.polygon([(220, 0), (420, 0), (500, 260), (140, 260)], fill=(255, 240, 200, 50))
        unplugged = 7.5 <= t < 13.5
        d.rectangle((230, 200, 410, 225), fill=(30, 30, 30))
        for i in range(14):
            d.rectangle((234 + i * 12.5, 203, 244 + i * 12.5, 222), fill=(250, 250, 250))
        d.ellipse((300, 120, 340, 160), fill=(250, 200, 170))
        d.rectangle((302, 160, 338, 205), fill=(230, 80, 130))
        plug_x = 430 + (30 if unplugged else 0)
        d.line((410, 215, plug_x, 250), fill=(20, 20, 20), width=3)
        d.rectangle((plug_x - 6, 246, plug_x + 6, 256), fill=(200, 200, 200))
        for i in range(12):
            x = 40 + i * 50
            bob = 6 * math.sin(t * 2 * math.pi * 116 / 60) if unplugged else 0
            d.ellipse((x, 300 + bob, x + 30, 330 + bob), fill=(20, 15, 25))
            if unplugged and int(t * 116 / 60) % 2 == 0:
                d.text((x + 15, 285 + bob), "*clap*", font=font(10, bold=True), fill=(255, 230, 150), anchor="mm")
        caption(img, timed(caps, t))
        vw.add(img)
    return vw.finish(normalize(audio, 0.7)), 10


VIDEOS = [
    ("summer-league-top5", soccer_goals),
    ("nightcore-glow-stick-summer", nightcore),
    ("claw-machine-20-tries", claw_machine),
    ("talent-show-unplugged", talent_show),
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
    main(sys.argv[1:] or None)
    save_manifest()
