"""Shared helpers for generating the Connected Era's original media.

Everything here is drawn or synthesised from scratch (shapes, gradients,
procedural noise, additive synthesis), so all output is original work that
can ship with the project.
"""

import json
import math
import os
import subprocess
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "public" / "media"
WORK = Path(__file__).resolve().parent / ".work"
MANIFEST = ROOT / "data" / "generated" / "media-manifest.json"

FONT_DIR = "/usr/share/fonts/truetype"
_fonts = {}


def font(size, bold=False, mono=False, serif=False):
    key = (size, bold, mono, serif)
    if key not in _fonts:
        if mono:
            name = "dejavu/DejaVuSansMono-Bold.ttf" if bold else "dejavu/DejaVuSansMono.ttf"
        elif serif:
            name = "dejavu/DejaVuSerif-Bold.ttf" if bold else "dejavu/DejaVuSerif.ttf"
        else:
            name = "dejavu/DejaVuSans-Bold.ttf" if bold else "dejavu/DejaVuSans.ttf"
        _fonts[key] = ImageFont.truetype(os.path.join(FONT_DIR, name), size)
    return _fonts[key]


def ensure_dirs(*parts):
    p = PUBLIC.joinpath(*parts)
    p.mkdir(parents=True, exist_ok=True)
    return p


def lerp(a, b, t):
    return a + (b - a) * t


def lerp_color(c1, c2, t):
    return tuple(int(round(lerp(a, b, t))) for a, b in zip(c1, c2))


def vertical_gradient(w, h, stops):
    """stops: [(position 0-1, (r,g,b)), ...] -> RGB numpy array."""
    ys = np.linspace(0, 1, h)
    out = np.zeros((h, w, 3), dtype=np.float32)
    for c in range(3):
        xs = [s[0] for s in stops]
        vs = [s[1][c] for s in stops]
        col = np.interp(ys, xs, vs)
        out[:, :, c] = col[:, None]
    return out


def noise2d(w, h, scale, seed, octaves=4):
    """Smooth value noise in [0, 1]."""
    rng = np.random.default_rng(seed)
    total = np.zeros((h, w), dtype=np.float32)
    amp, norm = 1.0, 0.0
    for o in range(octaves):
        gw = max(2, int(w / scale * (2 ** o)) + 2)
        gh = max(2, int(h / scale * (2 ** o)) + 2)
        grid = rng.random((gh, gw)).astype(np.float32)
        img = Image.fromarray((grid * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
        total += np.asarray(img, dtype=np.float32) / 255 * amp
        norm += amp
        amp *= 0.5
    return total / norm


def to_image(arr):
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def text_center(draw, xy, text, fnt, fill, anchor="mm", stroke=0, stroke_fill=None):
    draw.text(xy, text, font=fnt, fill=fill, anchor=anchor, stroke_width=stroke, stroke_fill=stroke_fill)


def wrap(draw, text, fnt, max_width):
    words, lines, cur = text.split(), [], ""
    for wd in words:
        test = f"{cur} {wd}".strip()
        if draw.textlength(test, font=fnt) <= max_width:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = wd
    if cur:
        lines.append(cur)
    return lines


# ── Audio synthesis ────────────────────────────────────────────────────────

SR = 44100


def note_freq(name):
    """'A4' -> 440.0, 'C#5', 'Bb3'."""
    names = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
    n = names[name[0]]
    rest = name[1:]
    if rest.startswith("#"):
        n += 1
        rest = rest[1:]
    elif rest.startswith("b"):
        n -= 1
        rest = rest[1:]
    octave = int(rest)
    midi = 12 * (octave + 1) + n
    return 440.0 * 2 ** ((midi - 69) / 12)


def env_adsr(n, a=0.01, d=0.1, s=0.6, r=0.2):
    t = np.arange(n) / SR
    total = n / SR
    e = np.ones(n, dtype=np.float32) * s
    a_n = int(a * SR)
    d_n = int(d * SR)
    r_n = int(min(r, total * 0.5) * SR)
    if a_n:
        e[:a_n] = np.linspace(0, 1, a_n)
    if d_n:
        e[a_n:a_n + d_n] = np.linspace(1, s, len(e[a_n:a_n + d_n]))
    if r_n:
        e[-r_n:] *= np.linspace(1, 0, r_n)
    return e


def tone(freq, dur, kind="sine", vol=0.3, adsr=(0.01, 0.1, 0.6, 0.2)):
    n = int(dur * SR)
    t = np.arange(n) / SR
    if kind == "sine":
        w = np.sin(2 * np.pi * freq * t)
    elif kind == "square":
        w = np.sign(np.sin(2 * np.pi * freq * t)) * 0.6
    elif kind == "saw":
        w = 2 * (t * freq - np.floor(0.5 + t * freq))
    elif kind == "piano":
        w = sum(np.sin(2 * np.pi * freq * k * t) * (0.6 ** (k - 1)) * np.exp(-t * (1.2 + k * 0.8)) for k in range(1, 6))
        return (w * vol).astype(np.float32)
    elif kind == "pluck":
        w = sum(np.sin(2 * np.pi * freq * k * t) * (0.5 ** (k - 1)) for k in range(1, 5)) * np.exp(-t * 5)
        return (w * vol).astype(np.float32)
    elif kind == "pad":
        w = (np.sin(2 * np.pi * freq * t) + 0.5 * np.sin(2 * np.pi * freq * 1.005 * t) + 0.3 * np.sin(2 * np.pi * freq * 2.01 * t)) / 1.8
    else:
        raise ValueError(kind)
    return (w * env_adsr(n, *adsr) * vol).astype(np.float32)


def place(track, clip, start):
    if start < 0:
        return
    i = int(start * SR)
    end = min(len(track), i + len(clip))
    if i < len(track):
        track[i:end] += clip[: end - i]


def noise_bed(dur, vol=0.05, seed=1, lowpass=0.05):
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    x = rng.standard_normal(n).astype(np.float32)
    # one-pole low-pass for a soft rain/crowd texture
    y = np.zeros_like(x)
    a = lowpass
    acc = 0.0
    for i in range(0, n, 1):
        acc += a * (x[i] - acc)
        y[i] = acc
    y /= max(1e-6, np.max(np.abs(y)))
    return y * vol


def fast_noise_bed(dur, vol=0.05, seed=1, smooth=40):
    rng = np.random.default_rng(seed)
    n = int(dur * SR)
    x = rng.standard_normal(n + smooth).astype(np.float32)
    k = np.ones(smooth, dtype=np.float32) / smooth
    y = np.convolve(x, k, mode="valid")[:n]
    y /= max(1e-6, np.max(np.abs(y)))
    return y * vol


def normalize(track, peak=0.85):
    m = np.max(np.abs(track))
    return track * (peak / m) if m > 0 else track


def write_wav(path, track):
    data = (np.clip(track, -1, 1) * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


# ── Video encoding ─────────────────────────────────────────────────────────


class VideoWriter:
    """Pipes RGB frames into ffmpeg, then muxes an audio track into WebM (VP9 + Opus)."""

    def __init__(self, out_path, w=640, h=360, fps=24):
        self.out = Path(out_path)
        self.w, self.h, self.fps = w, h, fps
        WORK.mkdir(parents=True, exist_ok=True)
        self.tmp_video = WORK / (self.out.stem + ".video.webm")
        self.proc = subprocess.Popen(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}", "-r", str(fps), "-i", "-",
                "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "38", "-deadline", "good", "-cpu-used", "5",
                "-row-mt", "1", "-pix_fmt", "yuv420p", str(self.tmp_video),
            ],
            stdin=subprocess.PIPE,
        )
        self.frames = 0

    def add(self, img):
        if img.size != (self.w, self.h):
            img = img.resize((self.w, self.h))
        self.proc.stdin.write(img.convert("RGB").tobytes())
        self.frames += 1

    def finish(self, audio_track=None):
        self.proc.stdin.close()
        self.proc.wait()
        duration = self.frames / self.fps
        if audio_track is not None:
            wav = WORK / (self.out.stem + ".wav")
            n = int(duration * SR)
            track = np.zeros(n, dtype=np.float32)
            track[: min(n, len(audio_track))] = audio_track[:n]
            write_wav(wav, track)
            subprocess.run(
                ["ffmpeg", "-y", "-loglevel", "error", "-i", str(self.tmp_video), "-i", str(wav),
                 "-c:v", "copy", "-c:a", "libopus", "-b:a", "64k", "-shortest", str(self.out)],
                check=True,
            )
        else:
            os.replace(self.tmp_video, self.out)
        return duration


def thumbnail_from(video_path, at, out_path, w=320, h=180):
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{at:.2f}", "-i", str(video_path), "-frames:v", "1",
         "-vf", f"scale={w}:{h}", "-q:v", "4", str(out_path)],
        check=True,
    )


def encode_mp3(track, out_path, title, artist):
    WORK.mkdir(parents=True, exist_ok=True)
    wav = WORK / (Path(out_path).stem + ".wav")
    write_wav(wav, track)
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-c:a", "libmp3lame", "-b:a", "128k",
         "-metadata", f"title={title}", "-metadata", f"artist={artist}", "-metadata", "album=Connected Era Originals",
         str(out_path)],
        check=True,
    )


# ── Manifest ───────────────────────────────────────────────────────────────

_manifest = {}


def record(key, path, **extra):
    p = Path(path)
    _manifest[key] = {"url": "/media/" + str(p.relative_to(PUBLIC)).replace(os.sep, "/"), "size": p.stat().st_size, **extra}


def save_manifest():
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    existing = {}
    if MANIFEST.exists():
        existing = json.loads(MANIFEST.read_text())
    existing.update(_manifest)
    MANIFEST.write_text(json.dumps(dict(sorted(existing.items())), indent=1) + "\n")
