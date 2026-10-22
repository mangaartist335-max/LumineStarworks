"""Top-down preview of the generated town, drawn from dist/map.json.

Usage (from the project folder):  python3 tools/render_map.py
Writes dist/map_overview.png (whole map) and dist/map_town.png (town centre, zoomed in).
This is a flat plan view for checking layout, not a render of how the game looks.
"""

import json
import math
import os
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DIST = os.path.join(ROOT, "dist")

TERRAIN_COLORS = {
    "Grass": (112, 142, 80),
    "LeafyGrass": (98, 128, 70),
    "Asphalt": (80, 80, 82),
    "Pavement": (160, 156, 150),
    "Concrete": (160, 156, 150),
    "Ground": (138, 112, 84),
    "Mud": (96, 80, 64),
    "Water": (70, 120, 130),
    "Air": None,
}


def load():
    with open(os.path.join(DIST, "map.json")) as f:
        return json.load(f)


class View:
    def __init__(self, min_x, max_x, min_z, max_z, scale):
        self.min_x, self.max_x, self.min_z, self.max_z = min_x, max_x, min_z, max_z
        self.scale = scale
        self.w = int((max_x - min_x) * scale)
        self.h = int((max_z - min_z) * scale)

    def pt(self, x, z):
        return ((x - self.min_x) * self.scale, (z - self.min_z) * self.scale)


def rect_corners(cx, cz, yaw, sx, sz):
    c, s = math.cos(yaw), math.sin(yaw)
    pts = []
    for dx, dz in ((-1, -1), (1, -1), (1, 1), (-1, 1)):
        lx, lz = dx * sx / 2, dz * sz / 2
        # yaw follows Roblox: LookVector = (-sin, 0, -cos)
        x = cx + lx * c + lz * s
        z = cz - lx * s + lz * c
        pts.append((x, z))
    return pts


def draw_terrain(draw, view, ops):
    hill_level = 0
    for op in ops:
        color = TERRAIN_COLORS.get(op["mat"], (255, 0, 255))
        if color is None:
            continue
        if op["op"] == "block":
            x, y, z, yaw = op["cf"]
            sx, sy, sz = op["size"]
            top = y + sy / 2
            if top < -0.6 and op["mat"] != "Water":
                continue
            pts = [view.pt(px, pz) for px, pz in rect_corners(x, z, yaw, sx, sz)]
            draw.polygon(pts, fill=color)
        elif op["op"] == "cylinder":
            x, y, z, _ = op["cf"]
            r = op["radius"]
            if op["mat"] == "Grass" and y > 0:
                hill_level += 1
                shade = min(60, hill_level * 4)
                color = (color[0] + shade // 2, color[1] + shade // 3, color[2] + shade // 4)
            (ax, az), (bx, bz) = view.pt(x - r, z - r), view.pt(x + r, z + r)
            draw.ellipse([ax, az, bx, bz], fill=color)


def part_footprint(part):
    px, py, pz = part["p"]
    sx, sy, sz = part["s"]
    xv, yv, zv = part["x"], part["y"], part["z"]
    kind = part["k"]
    if kind == "Ball":
        return ("circle", (px, pz, sx / 2))
    if kind == "Cylinder":
        if abs(xv[1]) > 0.9:
            return ("circle", (px, pz, sy / 2))
        # Axis lies flat: draw the swept rectangle.
        ax, az = xv[0] * sx / 2, xv[2] * sx / 2
        n = math.hypot(xv[0], xv[2]) or 1
        wx, wz = -xv[2] / n * sy / 2, xv[0] / n * sy / 2
        return ("poly", [(px - ax - wx, pz - az - wz), (px + ax - wx, pz + az - wz), (px + ax + wx, pz + az + wz), (px - ax + wx, pz - az + wz)])
    corners = []
    for dx, dy, dz in ((-1, -1, -1), (1, -1, -1), (1, -1, 1), (-1, -1, 1), (-1, 1, -1), (1, 1, -1), (1, 1, 1), (-1, 1, 1)):
        x = px + xv[0] * dx * sx / 2 + yv[0] * dy * sy / 2 + zv[0] * dz * sz / 2
        z = pz + xv[2] * dx * sx / 2 + yv[2] * dy * sy / 2 + zv[2] * dz * sz / 2
        corners.append((x, z))
    # Convex hull of the projected corners.
    pts = sorted(set((round(a, 3), round(b, 3)) for a, b in corners))
    if len(pts) < 3:
        return ("poly", pts)

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    lower, upper = [], []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return ("poly", lower[:-1] + upper[:-1])


def top_height(part):
    py = part["p"][1]
    sx, sy, sz = part["s"]
    yv = part["y"]
    return py + abs(yv[1]) * sy / 2 + (sx + sz) * 0.001


def render(data, view, path, labels=None, outline=True):
    img = Image.new("RGB", (view.w, view.h), (112, 142, 80))
    draw = ImageDraw.Draw(img)
    draw_terrain(draw, view, data["terrain"])
    parts = sorted(data["parts"], key=top_height)
    for part in parts:
        kind, geo = part_footprint(part)
        col = tuple(part["c"])
        if part["t"] > 0.3:
            col = tuple(int(c * 0.6 + 200 * 0.4) for c in col)
        edge = tuple(max(0, int(c * 0.7)) for c in col) if outline else None
        if kind == "circle":
            x, z, r = geo
            (ax, az), (bx, bz) = view.pt(x - r, z - r), view.pt(x + r, z + r)
            if bx - ax < 0.5:
                continue
            draw.ellipse([ax, az, bx, bz], fill=col, outline=edge)
        else:
            pts = [view.pt(x, z) for x, z in geo]
            if len(pts) >= 3:
                draw.polygon(pts, fill=col, outline=edge)
    if labels:
        try:
            font = ImageFont.truetype("DejaVuSans-Bold.ttf", int(max(12, view.scale * 4)))
        except OSError:
            font = ImageFont.load_default()
        for text, x, z in labels:
            px, pz = view.pt(x, z)
            draw.text((px, pz), text, fill=(255, 255, 255), font=font, anchor="mm", stroke_width=3, stroke_fill=(30, 30, 30))
    # North arrow.
    draw.text((16, 12), "N ↑ (store side)", fill=(255, 255, 255), stroke_width=2, stroke_fill=(0, 0, 0))
    img.save(path)
    print(f"wrote {path} ({view.w}x{view.h})")


def main():
    data = load()
    render(
        data,
        View(-600, 600, -380, 540, 1.1),
        os.path.join(DIST, "map_overview.png"),
        labels=[
            ("Town", 40, -110),
            ("Trail", -150, 120),
            ("Creek", -330, 172),
            ("Lookout", -150, 382),
            ("Clearing", -214, 270),
            ("Sunflower truck", 240, -125),
        ],
        outline=False,
    )
    render(
        data,
        View(-130, 210, -112, 92, 4),
        os.path.join(DIST, "map_town.png"),
        labels=[
            ("Halfway Mart", -50, -100),
            ("Bus stop", -30, 38),
            ("Mile Marker Diner", 40, 80),
            ("Hollis", 114, 80),
        ],
    )


if __name__ == "__main__":
    sys.exit(main())
