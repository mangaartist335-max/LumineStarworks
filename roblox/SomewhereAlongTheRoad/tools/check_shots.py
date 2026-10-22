"""Checks every cutscene camera against the built town (dist/map.json).

Most shots are first person, so the camera is your avatar's eyes: standing, walking, sitting
or crouching. For each shot it samples the view and reports:
  * eyes (or a free camera) inside a part: a wall, a tree trunk, a canopy...
  * cameras below the ground (the lookout hill)
  * your avatar standing inside something, or a walk that bumps into something solid
  * solid parts between your eyes and what the shot is looking at
Then it draws dist/shot_map.png: where you are in every shot, numbered, with your gaze.

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

# Things a shot must show besides the point it looks at (checked from your eyes).
SUBJECTS = {
    "Bus stop": (-44, 7, -62),  # the store sign across the road
    "Lights out": (40, 6, 57.5),  # the diner counter
}

# Things a shot's gaze sweeps past on purpose (the sign you walk by, a lamp post on the street).
EXPECTED = {
    "Welcome sign": {"Board", "Post"},
    "Main street at night": {"Pole"},
}

# You can see through these (store and diner windows).
SEE_THROUGH = {"Glass"}

AUTO_DOORS = {"SlidingDoor", "DoorSign"}

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


def avatar_at(avatar, seconds):
    """Where the avatar's feet are `seconds` into the shot (walking at its speed through its points)."""
    pos = avatar["at"]
    left = seconds * avatar["speed"]
    for p in avatar["walk"]:
        d = sub(p, pos)
        length = math.sqrt(dot(d, d))
        if left <= length:
            return lerp(pos, p, left / length if length else 1)
        left -= length
        pos = p
    return pos


def eye_at(avatar, seconds):
    """Where your eyes are (the first-person camera), matching Cinematic.plannedEye."""
    if avatar["sit"]:
        seat = avatar["sitAt"]
        eye = (seat[0], seat[1] + 2.9, seat[2])
    else:
        feet = avatar_at(avatar, seconds)
        eye = (feet[0], feet[1] + avatar["eyeHeight"], feet[2])
    if avatar["crouch"]:
        eye = (eye[0], eye[1] - avatar["crouchDrop"], eye[2])
    return eye


def first_hit(part, a, b):
    """Fraction along a->b where the segment enters the part, or None."""
    if part["k"] == "Ball":
        return 0.5 if segment_hits(part, a, b) else None
    la, lb = local(part, a), local(part, b)
    h = half_extents(part)
    t0, t1 = 0.0, 1.0
    for i in range(3):
        d = lb[i] - la[i]
        if abs(d) < 1e-9:
            if abs(la[i]) > h[i]:
                return None
            continue
        u0 = (-h[i] - la[i]) / d
        u1 = (h[i] - la[i]) / d
        if u0 > u1:
            u0, u1 = u1, u0
        t0, t1 = max(t0, u0), min(t1, u1)
        if t0 > t1:
            return None
    return t0


def check_body(avatar, duration, parts):
    """Your avatar shouldn't stand inside things or walk into them."""
    notes = []
    if avatar["sit"]:
        return notes
    for i in range(9):
        feet = avatar_at(avatar, duration * i / 8)
        chest = (feet[0], feet[1] + 3, feet[2])
        for part in parts:
            if part["n"] not in FOLIAGE and inside(part, chest, margin=-0.2):
                notes.append(f"avatar stands inside {part['n']} at {tuple(round(v, 1) for v in feet)}")
    points = [avatar["at"]] + list(avatar["walk"] or [])
    for a, b in zip(points, points[1:]):
        for h in (1.5, 3.0):
            a2 = (a[0], a[1] + h, a[2])
            b2 = (b[0], b[1] + h, b[2])
            hit = sorted({p["n"] for p in parts if p["n"] not in FOLIAGE | AUTO_DOORS and p["t"] < 0.6 and segment_hits(p, a2, b2)})
            if hit:
                notes.append(f"walk from {tuple(round(v) for v in a)} to {tuple(round(v) for v in b)} bumps into {', '.join(hit)}")
    return notes


def blockers(parts, eye, target, expected=frozenset()):
    """Solid parts between the eye and a point (stopping just short of it), nearest first."""
    d = sub(target, eye)
    length = math.sqrt(dot(d, d))
    if length < 3:
        return [], []
    end = lerp(eye, target, (length - 2.5) / length)
    solid, soft = {}, set()
    for part in parts:
        # The thing you're looking at doesn't block itself, and the store doors slide open.
        if part["n"] in AUTO_DOORS or inside(part, target, margin=1.0):
            continue
        t = first_hit(part, eye, end)
        if t is None:
            continue
        if part["n"] in FOLIAGE | SEE_THROUGH | expected:
            soft.add(part["n"])
        else:
            dist = t * (length - 2.5)
            solid[part["n"]] = min(dist, solid.get(part["n"], 1e9))
    return sorted(solid.items(), key=lambda kv: kv[1]), sorted(soft)


def samples_for(shot):
    """(camera, look) pairs across the shot, with the time of each."""
    out = []
    avatar = shot.get("avatar")
    for i in range(9):
        t = shot["duration"] * i / 8
        e = ease(i / 8, shot["ease"])
        look = lerp(shot["from"]["look"], shot["to"]["look"], e)
        if shot.get("pov") and avatar:
            cam = eye_at(avatar, t)
        else:
            a = shot["from"]["pos"]
            cam = lerp(a, shot["to"]["pos"] or a, e)
        out.append((t, cam, look))
    return out


def main():
    with open(os.path.join(DIST, "map.json")) as f:
        data = json.load(f)
    parts = [p for p in data["parts"] if p["t"] < 0.6]
    shots = data["shots"]
    issues = 0
    for n, shot in enumerate(shots, 1):
        notes = []
        samples = samples_for(shot)
        for _t, cam, _look in samples:
            ground = hill_height(cam[0], cam[2])
            if cam[1] < ground + 0.8:
                notes.append(f"camera too close to the ground at {tuple(round(v, 1) for v in cam)} (ground {ground:.1f})")
            for part in parts:
                if inside(part, cam, margin=0.25):
                    notes.append(f"camera inside {part['n']} at {tuple(round(v, 1) for v in cam)}")
        # What you're looking at (tracked shots turn toward a moving thing; this checks the
        # starting gaze), plus any extra subject the shot needs to show.
        for t, cam, look in samples[::2]:
            targets = [("view", look)]
            if shot["name"] in SUBJECTS:
                targets.append(("subject", SUBJECTS[shot["name"]]))
            for label, target in targets:
                solid, soft = blockers(parts, cam, target, EXPECTED.get(shot["name"], frozenset()))
                if solid:
                    names = ", ".join(f"{k} ({v:.0f} studs away)" for k, v in solid[:4])
                    notes.append(f"{label} at {t:.0f}s blocked by {names}")
                if soft:
                    notes.append(f"(seen past, fine: {', '.join(soft)} in the {label} at {t:.0f}s)")
        avatar = shot.get("avatar")
        if avatar:
            notes.extend(check_body(avatar, shot["duration"], parts))
        unique = list(dict.fromkeys(notes))
        status = "ok" if not [u for u in unique if not u.startswith("(")] else "CHECK"
        if status != "ok":
            issues += 1
        kind = "eyes" if shot.get("pov") else "free"
        print(f"{n:2d}. {shot['name']:<22} {shot['duration']:>5.1f}s  {kind:<4}  {status}")
        for u in unique[:8]:
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
        samples = samples_for(shot)
        path = [pt(cam[0], cam[2]) for _t, cam, _look in samples]
        d.line(path, fill=(255, 214, 64), width=3)
        for _t, cam, look in (samples[0], samples[-1]):
            v = (look[0] - cam[0], look[2] - cam[2])
            length = math.hypot(*v) or 1
            tip = (cam[0] + v[0] / length * 22, cam[2] + v[1] / length * 22)
            d.line([pt(cam[0], cam[2]), pt(*tip)], fill=(255, 120, 90), width=2)
        x, z = path[0]
        d.ellipse([x - 9, z - 9, x + 9, z + 9], fill=(30, 30, 30))
        d.text((x, z), str(n), fill=(255, 255, 255), font=font, anchor="mm")
    out = os.path.join(DIST, "shot_map.png")
    base.save(out)
    print(f"wrote {out}")


if __name__ == "__main__":
    sys.exit(main())
