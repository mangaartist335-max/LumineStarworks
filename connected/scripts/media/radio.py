"""The radio stations' audio: original instrumentals, DJ lines, station IDs,
adverts, promos and TalkWave AM's talk segments.

Every word comes from data/radio-script.json (the Radio app shows the same
text as captions). Voices are synthesised with ffmpeg's flite filter, and
the music is synthesised from scratch like the rest of the Connected Era's
media. Run on its own with: python3 scripts/media/radio.py
"""

import json
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))

from common import ROOT, SR, WORK, ensure_dirs, fast_noise_bed, normalize, note_freq, place, record, save_manifest, tone, write_wav  # noqa: E402
from music import drums  # noqa: E402
from videos import melody_track  # noqa: E402

SCRIPT = json.loads((ROOT / "data" / "radio-script.json").read_text())
DUR = 44  # seconds per song: long enough to enjoy, small enough to ship


# ── Music ──────────────────────────────────────────────────────────────────

def chords_of(prog, beats, octave=3):
    shapes = {"": [0, 4, 7], "m": [0, 3, 7]}
    out = []
    for name in prog:
        root, kind = (name[:-1], "m") if name.endswith("m") else (name, "")
        base = note_freq(f"{root}{octave}")
        out.append(([base * 2 ** (s / 12) for s in shapes[kind]], beats))
    return out


def chord_track(dur, prog, bpm, beats, kind="pad", vol=0.1, octave=3):
    track = np.zeros(int(dur * SR) + SR, dtype=np.float32)
    beat = 60 / bpm
    t = 0.0
    while t < dur:
        for freqs, b in chords_of(prog, beats, octave):
            for f in freqs:
                place(track, tone(f, b * beat, kind, vol, (0.05, 0.2, 0.7, 0.3)), t)
            t += b * beat
    return track[: int(dur * SR)]


def power_chords(dur, roots, bpm, per_chord=8, vol=0.16):
    """Distorted root-and-fifth eighth notes, the garage band staple."""
    track = np.zeros(int(dur * SR) + SR, dtype=np.float32)
    beat = 60 / bpm
    t = 0.0
    while t < dur:
        for r in roots:
            f = note_freq(r)
            for _ in range(per_chord):
                hit = tone(f, beat * 0.48, "saw", 1.0, (0.002, 0.05, 0.8, 0.05)) + tone(f * 1.5, beat * 0.48, "saw", 0.8, (0.002, 0.05, 0.8, 0.05))
                place(track, (np.tanh(hit * 3.0) * vol).astype(np.float32), t)
                t += beat / 2
    return track[: int(dur * SR)]


def swing_track(dur, bpm, prog, melody, waltz=False):
    """Walking bass, comping piano on the off-beats and a brushed hi-hat."""
    track = np.zeros(int(dur * SR) + SR, dtype=np.float32)
    beat = 60 / bpm
    per_bar = 3 if waltz else 4
    brush = fast_noise_bed(0.09, 1.0, 7, 3) * np.exp(-np.arange(int(0.09 * SR)) / SR * 35)
    t, bar = 0.0, 0
    while t < dur:
        root = prog[bar % len(prog)]
        minor = root.endswith("m")
        r = note_freq(f"{root.rstrip('m')}2")
        third = 3 if minor else 4
        walk = [0, third, 7, 9] if not waltz else [0, 7, 12]
        for i in range(per_bar):
            place(track, tone(r * 2 ** (walk[i] / 12), beat * 0.9, "pluck", 0.32), t + i * beat)
            swing = beat * 0.66
            place(track, (brush * 0.12).astype(np.float32), t + i * beat)
            place(track, (brush * 0.07).astype(np.float32), t + i * beat + swing)
            if (waltz and i > 0) or (not waltz and i % 2 == 1):
                for s in [12, 12 + third, 19]:
                    place(track, tone(r * 2 ** (s / 12), beat * 0.6, "piano", 0.11), t + i * beat)
        t += per_bar * beat
        bar += 1
    lead = melody_track(dur, melody, bpm, "piano", 0.2)
    return track[: int(dur * SR)] + lead


def song(style):
    d = DUR
    if style == "pop":
        m = melody_track(d, [("E5", 0.5), ("G5", 0.5), ("A5", 1), ("G5", 0.5), ("E5", 0.5), ("D5", 1), ("C5", 0.5), ("D5", 0.5), ("E5", 1), (None, 1)], 120, "pluck", 0.24, bass=[("C2", 4), ("G1", 4), ("A1", 4), ("F1", 4)])
        return normalize(m + chord_track(d, ["C", "G", "Am", "F"], 120, 4) + drums(d, 120), 0.85)
    if style == "pop2":
        m = melody_track(d, [("A4", 0.5), ("C5", 0.5), ("F5", 0.5), ("E5", 0.5), ("D5", 1), ("C5", 1), ("A4", 0.5), ("Bb4", 0.5), ("C5", 2)], 126, "square", 0.1, bass=[("F1", 4), ("C2", 4), ("D2", 4), ("Bb1", 4)], bass_kind="saw")
        return normalize(m + chord_track(d, ["F", "C", "Dm", "Bb"], 126, 4, vol=0.09) + drums(d, 126), 0.85)
    if style == "pop3":
        m = melody_track(d, [("B4", 1), ("D5", 0.5), ("B4", 0.5), ("A4", 1), ("G4", 1), ("E5", 1), ("D5", 1), ("B4", 2)], 116, "pluck", 0.26, bass=[("G1", 4), ("D2", 4), ("E2", 4), ("C2", 4)])
        return normalize(m + chord_track(d, ["G", "D", "Em", "C"], 116, 4) + drums(d, 116, "half"), 0.85)
    if style == "punk":
        g = power_chords(d, ["E2", "E2", "A2", "B2"], 172)
        return normalize(g + drums(d, 172, "four", 0.55), 0.88)
    if style == "punk2":
        g = power_chords(d, ["D2", "G2", "A2", "G2"], 184, 4)
        lead = melody_track(d, [("D4", 1), ("F#4", 1), ("A4", 2), ("G4", 1), ("F#4", 1), ("E4", 2)], 184, "saw", 0.05)
        return normalize(g + lead + drums(d, 184, "four", 0.55), 0.88)
    if style == "emo":
        arp = melody_track(d, [(n, 0.5) for n in ["C4", "G4", "E5", "G4", "A3", "E4", "C5", "E4", "F3", "C4", "A4", "C4", "G3", "D4", "B4", "D4"]], 140, "pluck", 0.22)
        g = power_chords(d, ["C3", "A2", "F2", "G2"], 140, 8, 0.07)
        return normalize(arp + g + drums(d, 140, "half", 0.4), 0.85)
    if style in ("ambient", "ambient2"):
        prog = ["Dm", "Bb", "F", "C"] if style == "ambient" else ["Am", "F", "C", "G"]
        pads = chord_track(d, prog, 60, 4, "pad", 0.12)
        bells = melody_track(d, [("A5", 2), (None, 2), ("F5", 2), (None, 1), ("E5", 1), ("D5", 3), (None, 3)] if style == "ambient" else [("E5", 3), ("C5", 1), (None, 2), ("G5", 2), (None, 4)], 60, "sine", 0.08)
        return normalize(pads + bells + fast_noise_bed(d, 0.025, 11 if style == "ambient" else 12, 300), 0.8)
    if style in ("chip", "chip2", "chip3"):
        bpm, prog = {"chip": (140, ["C", "Am", "F", "G"]), "chip2": (150, ["A", "F", "C", "G"]), "chip3": (128, ["E", "C", "G", "D"])}[style]
        arps = []
        for name in prog:
            root = name.rstrip("m")
            minor = name.endswith("m")
            base = note_freq(f"{root}4")
            for s in [0, 3 if minor else 4, 7, 12] * 4:
                arps.append(base * 2 ** (s / 12))
        track = np.zeros(int(d * SR) + SR, dtype=np.float32)
        beat = 60 / bpm
        t, i = 0.0, 0
        while t < d:
            place(track, tone(arps[i % len(arps)], beat * 0.24, "square", 0.08, (0.002, 0.02, 0.6, 0.02)), t)
            t += beat / 4
            i += 1
        bass = melody_track(d, [(f"{n.rstrip('m')}2", 4) for n in prog], bpm, "square", 0.09)
        return normalize(track[: int(d * SR)] + bass + drums(d, bpm, "half", 0.35), 0.85)
    if style == "swing":
        return normalize(swing_track(d, 132, ["C", "Am", "Dm", "G"], [("E5", 1), ("G5", 0.66), ("E5", 0.34), ("C5", 2), ("D5", 1), ("F5", 1), ("A5", 2)]), 0.85)
    if style == "shuffle":
        return normalize(swing_track(d, 112, ["G", "G", "C", "D"], [("B4", 0.66), ("D5", 0.34), ("G5", 1), ("E5", 1), ("D5", 1), ("B4", 0.66), ("A4", 0.34), ("G4", 3)]), 0.85)
    if style == "waltz":
        return normalize(swing_track(d, 96, ["F", "Dm", "Bb", "C"], [("A4", 1), ("C5", 1), ("F5", 1), ("E5", 2), ("C5", 1), ("D5", 3)], waltz=True), 0.85)
    raise ValueError(style)


# ── Voices ─────────────────────────────────────────────────────────────────

def speak(text, voice, am=False):
    """Text to speech through ffmpeg's flite filter, returned at SR."""
    WORK.mkdir(parents=True, exist_ok=True)
    txt = WORK / "line.txt"
    txt.write_text(text)
    out = WORK / "line.wav"
    af = "highpass=f=260,lowpass=f=3600,volume=1.2" if am else "highpass=f=80,volume=1.1"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", f"flite=textfile={txt}:voice={voice}", "-af", af, "-ar", str(SR), "-ac", "1", str(out)], check=True)
    with wave.open(str(out)) as w:
        data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32767
    return data


def chime(color):
    """A short three-note station chime, pitched per station."""
    base = {"cvpop": "C5", "garage": "E4", "ambient": "A4", "talkwave": "G4", "pixel": "C6", "oldies": "F4"}[color]
    f = note_freq(base)
    out = np.zeros(int(1.2 * SR), dtype=np.float32)
    for i, s in enumerate([0, 4, 7]):
        place(out, tone(f * 2 ** (s / 12), 0.5, "pluck" if color != "pixel" else "square", 0.25), i * 0.16)
    return out


def with_lead_in(voice, lead=None, gap=0.05):
    clip = voice if lead is None else np.concatenate([lead[: int(0.95 * SR)], np.zeros(int(gap * SR), dtype=np.float32), voice])
    return np.concatenate([np.zeros(int(0.1 * SR), dtype=np.float32), clip, np.zeros(int(0.3 * SR), dtype=np.float32)])


def encode(track, key, out_dir, bitrate, **meta):
    WORK.mkdir(parents=True, exist_ok=True)
    wav = WORK / f"{key}.wav"
    write_wav(wav, np.clip(track, -1, 1))
    path = out_dir / f"{key}.mp3"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-ar", "22050", "-ac", "1", "-c:a", "libmp3lame", "-b:a", bitrate, str(path)], check=True)
    wav.unlink()
    record(f"radio:{key}", path, duration=round(len(track) / SR, 2), **meta)
    return path


def main(only=None):
    out = ensure_dirs("radio")
    stations = {s["id"]: s for s in SCRIPT["stations"]}
    total = 0

    def want(key):
        return not only or any(key.startswith(o) for o in only)

    for t in SCRIPT["tracks"]:
        if "style" not in t or not want(t["id"]):
            continue  # songs from the Music Player's library are reused as they are
        total += encode(song(t["style"]), t["id"], out, "48k", title=t["title"], artist=t["artist"]).stat().st_size
        st = stations[t["station"]]
        line = SCRIPT["backAnnounce"].format(title=t["title"], artist=t["artist"])
        total += encode(with_lead_in(speak(line, st["voice"])), f"ba_{t['id']}", out, "40k").stat().st_size
    for t in SCRIPT["tracks"]:
        if "style" in t or not want(f"ba_{t['id']}"):
            continue
        st = stations[t["station"]]
        line = SCRIPT["backAnnounce"].format(title=t["title"], artist=t["artist"])
        total += encode(with_lead_in(speak(line, st["voice"])), f"ba_{t['id']}", out, "40k").stat().st_size

    for st in SCRIPT["stations"]:
        am = st["id"] == "talkwave"
        for i, text in enumerate(st["ids"]):
            if want(f"id_{st['id']}"):
                total += encode(with_lead_in(speak(text, st["voice"], am), chime(st["id"])), f"id_{st['id']}_{i}", out, "40k").stat().st_size
        for p in st["programmes"]:
            if p.get("intro") and want(f"intro_{p['id']}"):
                total += encode(with_lead_in(speak(p["intro"], p["voice"], am), chime(st["id"])), f"intro_{p['id']}", out, "40k").stat().st_size

    for s in SCRIPT["spots"]:
        if want(s["id"]):
            total += encode(with_lead_in(speak(s["text"], s["voice"])), s["id"], out, "40k").stat().st_size
    for s in SCRIPT["talk"]:
        if want(s["id"]):
            total += encode(with_lead_in(speak(s["text"], s["voice"], True)), s["id"], out, "40k").stat().st_size
    print(f"radio ok, {total // 1024} KB")


if __name__ == "__main__":
    main(sys.argv[1:] or None)
    save_manifest()
