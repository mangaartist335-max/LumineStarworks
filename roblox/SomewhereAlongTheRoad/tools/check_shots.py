"""Checks every cutscene camera against the built town (dist/map.json).

For each shot it samples the camera path and reports:
  * cameras sitting inside a part (a wall, a tree trunk, a canopy...)
  * cameras below the ground (the lookout hill)
  * solid parts blocking the view of the shot's subject
Then it draws dist/shot_map.png: every camera path on the map, numbered.

Usage (from the project folder):  python3 tools/check_shots.py
"""

import json
import math
import os
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(os.path.dirname(HERE), "dist")

# Hill shape from World/Layout.luau.
HILL = (-150.0, 362.0, 112.0, 30.0)

# What each shot is really about, so we can check nothing solid is in the way.
SUBJECTS = {
    "Bus stop": (-30, 3.2, 27.3),
    "Halfway Mart": (-50, 15.9, -62.6),
    "Gerald": (-6, 2.2, 19.5),
    "Why it crossed": (40, 4.5, 39.2),
    "The tiny door": (-100.9, 1.0, 120),
    "Wendell": (-147.8, 4.5, 184),
    "The deer": (-128, 4, 74),
    "Lights out": (40, 20.6, 57.5),
    "Something rare": (-210, 4, 242),
    "Title": (-30, 3, 24),
    "The lookout": (40, 20.6, 57.5),
}

FOLIAGE = {"Leaves", "Needles", "Bush", "Plant", "Flower"}


def hill_height(x, z):
    cx, cz, r, h = HILL
    d2 = (x - cx) ** 2 + (z - cz) ** 2
    return 0.0 if d2 >= r * r else h * (1 - d2 / (r * r))


def ease(a, style):
    if style == "Linear":
        return a
    if style == "Out":
        return 1 - (1 - a) ** 2
    return 0.5 - math.cos(a * math.pi) / 2


def lerp(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


def sub(a, b):
    return (a[0] - b[0], a[1] - b[1], a[2] - b[2])


def dot(a, b):
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


def local(part, p):
    d = sub(p, part["p"])
    return (dot(d, part["x"]), dot(d, part["y"]), dot(d, part["z"]))


def half_extents(part):
    sx, sy, sz = part["s"]
    if part["k"] == "Ball":
        return None
    return (sx / 2, sy / 2, sz / 2)


def inside(part, p, margin=0.3):
    if part["k"] == "Ball":
        r = part["s"][0] / 2 + margin
        return dot(sub(p, part["p"]), sub(p, part["p"])) < r * r
    lp = local(part, p)
    h = half_extents(part)
    return all(abs(lp[i]) < h[i] + margin for i in range(3))


def segment_hits(part, a, b):
    """True if the segment a->b passes through the part (slab test / sphere test)."""
    if part["k"] == "Ball":
        r = part["s"][0] / 2
        ab = sub(b, a)
        t = max(0.0, min(1.0, dot(sub(part["p"], a), ab) / max(dot(ab, ab), 1e-9)))
        closest = lerp(a, b, t)
        d = sub(closest, part["p"])
        return dot(d, d) < r * r
    la, lb = local(part, a), local(part, b)
    h = half_extents(part)
    t0, t1 = 0.0, 1.0
    for i in range(3):
        d = lb[i] - la[i]
        if abs(d) < 1e-9:
            if abs(la[i]) > h[i]:
                return False
            continue
        u0 = (-h[i] - la[i]) / d
        u1 = (h[i] - la[i]) / d
        if u0 > u1:
            u0, u1 = u1, u0
        t0, t1 = max(t0, u0), min(t1, u1)
        if t0 > t1:
            return False
    return True


def main():
    with open(os.path.join(DIST, "map.json")) as f:
        data = json.load(f)
    parts = [p for p in data["parts"] if p["t"] < 0.6]
    shots = data["shots"]
    issues = 0
    for n, shot in enumerate(shots, 1):
        notes = []
        samples = []
        for i in range(9):
            e = ease(i / 8, shot["ease"])
            samples.append((lerp(shot["from"]["pos"], shot["to"]["pos"], e), lerp(shot["from"]["look"], shot["to"]["look"], e)))
        for pos, _look in samples:
            ground = hill_height(pos[0], pos[2])
            if pos[1] < ground + 0.8:
                notes.append(f"camera too close to the ground at {tuple(round(v, 1) for v in pos)} (ground {ground:.1f})")
            for part in parts:
                if inside(part, pos):
                    notes.append(f"camera inside {part['n']} at {tuple(round(v, 1) for v in pos)}")
        subject = SUBJECTS.get(shot["name"])
        if subject:
            for pos, _look in samples[::2]:
                # Stop just short of the subject so its own parts don't count.
                d = sub(subject, pos)
                length = math.sqrt(dot(d, d))
                end = lerp(pos, subject, max(0.0, (length - 2.5) / length))
                blockers = {}
                for part in parts:
                    if segment_hits(part, pos, end):
                        kind = "leaves" if part["n"] in FOLIAGE else "solid"
                        blockers[part["n"]] = kind
                solid = sorted(k for k, v in blockers.items() if v == "solid")
                soft = sorted(k for k, v in blockers.items() if v == "leaves")
                if solid:
                    notes.append(f"view of subject blocked by {', '.join(solid)} from {tuple(round(v, 1) for v in pos)}")
                if soft:
                    notes.append(f"(leaves in the way: {', '.join(soft)} from {tuple(round(v, 1) for v in pos)})")
        unique = list(dict.fromkeys(notes))
        status = "ok" if not [u for u in unique if not u.startswith("(")] else "CHECK"
        if status != "ok":
            issues += 1
        print(f"{n:2d}. {shot['name']:<22} {shot['duration']:>5.1f}s  {status}")
        for u in unique[:6]:
            print(f"      - {u}")
    draw(data, shots)
    print(f"\n{issues} shot(s) need a look" if issues else "\nAll shots clear")
    return 1 if issues else 0


def draw(data, shots):
    base = Image.open(os.path.join(DIST, "map_overview.png")).convert("RGB")
    scale = 1.1
    min_x, min_z = -600, -380

    def pt(x, z):
        return ((x - min_x) * scale, (z - min_z) * scale)

    d = ImageDraw.Draw(base)
    try:
        font = ImageFont.truetype("DejaVuSans-Bold.ttf", 15)
    except OSError:
        font = ImageFont.load_default()
    for n, shot in enumerate(shots, 1):
        a = shot["from"]["pos"]
        b = shot["to"]["pos"]
        d.line([pt(a[0], a[2]), pt(b[0], b[2])], fill=(255, 214, 64), width=3)
        for key in ("from", "to"):
            p = shot[key]["pos"]
            look = shot[key]["look"]
            v = (look[0] - p[0], look[2] - p[2])
            length = math.hypot(*v) or 1
            tip = (p[0] + v[0] / length * 22, p[2] + v[1] / length * 22)
            d.line([pt(p[0], p[2]), pt(*tip)], fill=(255, 120, 90), width=2)
        x, z = pt(a[0], a[2])
        d.ellipse([x - 9, z - 9, x + 9, z + 9], fill=(30, 30, 30))
        d.text((x, z), str(n), fill=(255, 255, 255), font=font, anchor="mm")
    out = os.path.join(DIST, "shot_map.png")
    base.save(out)
    print(f"wrote {out}")


if __name__ == "__main__":
    sys.exit(main())
