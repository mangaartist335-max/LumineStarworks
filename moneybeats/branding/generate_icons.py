#!/usr/bin/env python3
"""Generates every MoneyBeats icon and splash image from the source logo.

Usage (from the moneybeats/ folder):

    python3 branding/generate_icons.py

Requires Pillow (pip install pillow). Re-run it whenever the logo changes.

Writes:
  assets/brand/moneybeats_logo.png        in-app logo (transparent)
  assets/app_icon.png                     512 px preview icon
  android  mipmap-*/ic_launcher.png       legacy launcher icons (API 24-25)
           mipmap-*/ic_launcher_foreground.png, ic_launcher_monochrome.png
                                          adaptive icon layers (API 26+, themed icons 33+)
           drawable-*/ic_stat_moneybeats.png
                                          white silhouette for the playback notification
           drawable-*/splash_logo.png     logo on the launch screen
  ios      AppIcon.appiconset/*.png       app icons (opaque; iOS applies the mask)
           LaunchImage.imageset/*.png     logo on the launch screen
  windows  runner/resources/app_icon.ico
"""

import json
import os
import sys

from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, "branding", "moneybeats_logo_source.webp")

BACKGROUND = (16, 17, 18)  # AppColors.background, #101112
GLOW = (20, 70, 160)  # soft blue halo behind the logo
RENDER = 1024  # icons are drawn at this size, then downscaled


def path(*parts):
    full = os.path.join(ROOT, *parts)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    return full


def load_logo():
    """The source logo, cleaned up and trimmed to its visible bounds."""
    logo = Image.open(SOURCE).convert("RGBA")
    r, g, b, a = logo.split()
    # Drop faint alpha noise around the artwork and make solid areas fully opaque.
    a = a.point(lambda v: 0 if v < 10 else (255 if v >= 250 else v))
    logo = Image.merge("RGBA", (r, g, b, a))
    return logo.crop(a.getbbox())


def fit(logo, width):
    height = round(logo.height * width / logo.width)
    return logo.resize((width, height), Image.LANCZOS)


def silhouette(logo):
    """A white version of the logo that keeps its alpha (for system tints)."""
    white = Image.new("RGBA", logo.size, (255, 255, 255, 255))
    white.putalpha(logo.getchannel("A"))
    return white


def glow_layer(size, strength=0.55):
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    inset = size * 0.2
    draw.ellipse([inset, inset * 1.25, size - inset, size - inset * 1.25],
                 fill=GLOW + (int(255 * strength),))
    return layer.filter(ImageFilter.GaussianBlur(size * 0.12))


def compose(size, logo, logo_ratio, background=True, rounded=False, glow=True):
    """Logo centred on a square canvas, rendered large and scaled to [size]."""
    canvas = Image.new("RGBA", (RENDER, RENDER), (0, 0, 0, 0))
    if background:
        base = Image.new("RGBA", (RENDER, RENDER), (0, 0, 0, 0))
        draw = ImageDraw.Draw(base)
        if rounded:
            draw.rounded_rectangle([0, 0, RENDER - 1, RENDER - 1],
                                   radius=int(RENDER * 0.22), fill=BACKGROUND + (255,))
        else:
            draw.rectangle([0, 0, RENDER, RENDER], fill=BACKGROUND + (255,))
        canvas = Image.alpha_composite(canvas, base)
        if glow:
            halo = glow_layer(RENDER)
            if rounded:
                mask = base.getchannel("A")
                halo.putalpha(Image.composite(halo.getchannel("A"),
                                              Image.new("L", halo.size, 0), mask))
            canvas = Image.alpha_composite(canvas, halo)
    elif glow:
        canvas = Image.alpha_composite(canvas, glow_layer(RENDER, strength=0.35))

    scaled = fit(logo, int(RENDER * logo_ratio))
    x = (RENDER - scaled.width) // 2
    y = (RENDER - scaled.height) // 2
    canvas.alpha_composite(scaled, (x, y))
    return canvas.resize((size, size), Image.LANCZOS)


def main():
    if not os.path.exists(SOURCE):
        sys.exit(f"Source logo not found: {SOURCE}")
    logo = load_logo()
    print(f"logo {logo.width}x{logo.height}")

    # In-app logo.
    fit(logo, 900).save(path("assets", "brand", "moneybeats_logo.png"), optimize=True)
    compose(512, logo, 0.78, rounded=True).save(path("assets", "app_icon.png"), optimize=True)

    res = ("android", "app", "src", "main", "res")
    densities = {"mdpi": 1, "hdpi": 1.5, "xhdpi": 2, "xxhdpi": 3, "xxxhdpi": 4}
    for name, scale in densities.items():
        # Legacy launcher icon (48 dp).
        compose(round(48 * scale), logo, 0.78, rounded=True).save(
            path(*res, f"mipmap-{name}", "ic_launcher.png"), optimize=True)
        # Adaptive icon layers (108 dp canvas, logo inside the 66 dp safe zone).
        fg = round(108 * scale)
        compose(fg, logo, 0.56, background=False).save(
            path(*res, f"mipmap-{name}", "ic_launcher_foreground.png"), optimize=True)
        compose(fg, silhouette(logo), 0.56, background=False, glow=False).save(
            path(*res, f"mipmap-{name}", "ic_launcher_monochrome.png"), optimize=True)
        # Notification icon (24 dp, white silhouette).
        compose(round(24 * scale), silhouette(logo), 0.96, background=False, glow=False).save(
            path(*res, f"drawable-{name}", "ic_stat_moneybeats.png"), optimize=True)
        # Launch screen logo (200 dp wide).
        fit(logo, round(200 * scale)).save(
            path(*res, f"drawable-{name}", "splash_logo.png"), optimize=True)

    # iOS app icons.
    appicon = path("ios", "Runner", "Assets.xcassets", "AppIcon.appiconset", "Contents.json")
    for entry in json.load(open(appicon))["images"]:
        filename = entry.get("filename")
        if not filename:
            continue
        points = float(entry["size"].split("x")[0])
        scale = int(entry["scale"].replace("x", ""))
        px = round(points * scale)
        compose(px, logo, 0.78).convert("RGB").save(
            os.path.join(os.path.dirname(appicon), filename), optimize=True)

    # iOS launch image (220 pt wide).
    launch = ("ios", "Runner", "Assets.xcassets", "LaunchImage.imageset")
    for suffix, scale in (("", 1), ("@2x", 2), ("@3x", 3)):
        fit(logo, 220 * scale).save(path(*launch, f"LaunchImage{suffix}.png"), optimize=True)

    # Windows icon.
    compose(256, logo, 0.82, rounded=True).save(
        path("windows", "runner", "resources", "app_icon.ico"),
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])

    print("All icons written.")


if __name__ == "__main__":
    main()
