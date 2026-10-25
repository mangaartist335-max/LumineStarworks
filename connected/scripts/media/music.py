"""Original music for the Music Player's sample library and MeTube."""

import numpy as np

from common import SR, encode_mp3, ensure_dirs, fast_noise_bed, normalize, note_freq, place, record, tone
from videos import melody_track, piano_piece, thump


def drums(dur, bpm, pattern="four", vol=0.5):
    track = np.zeros(int(dur * SR) + SR, dtype=np.float32)
    beat = 60 / bpm
    t, i = 0.0, 0
    hat = fast_noise_bed(0.05, 1.0, 3, 2) * np.exp(-np.arange(int(0.05 * SR)) / SR * 60)
    while t < dur:
        if pattern == "four" or i % 2 == 0:
            thump(track, t, vol)
        place(track, (hat * vol * 0.25).astype(np.float32), t + beat / 2)
        if i % 4 == 2:
            place(track, (fast_noise_bed(0.12, 1.0, i, 6) * np.exp(-np.arange(int(0.12 * SR)) / SR * 25) * vol * 0.4).astype(np.float32), t)
        t += beat
        i += 1
    return track[: int(dur * SR)]


def morning_commute(dur=60):
    m = melody_track(dur, [("G4", 0.5), ("B4", 0.5), ("D5", 0.5), ("B4", 0.5), ("C5", 0.5), ("E5", 0.5), ("D5", 1), ("A4", 0.5), ("B4", 0.5), ("G4", 1), (None, 1)], 120, "pluck", 0.22,
                     bass=[("G2", 2), ("E2", 2), ("C2", 2), ("D2", 2)], chords=[(["G3", "B3", "D4"], 2), (["E3", "G3", "B3"], 2), (["C3", "E3", "G3"], 2), (["D3", "F#3", "A3"], 2)])
    return normalize(m + drums(dur, 120), 0.85)


def neon_night_drive(dur=60):
    arps = []
    for root in ["A3", "F3", "C4", "G3"]:
        f = note_freq(root)
        names = {"A3": ["A3", "C4", "E4", "A4"], "F3": ["F3", "A3", "C4", "F4"], "C4": ["C4", "E4", "G4", "C5"], "G3": ["G3", "B3", "D4", "G4"]}[root]
        arps += [(n, 0.25) for n in names * 4]
    m = melody_track(dur, arps, 100, "saw", 0.08, bass=[("A1", 4), ("F1", 4), ("C2", 4), ("G1", 4)], bass_kind="saw",
                     chords=[(["A3", "C4", "E4"], 4), (["F3", "A3", "C4"], 4), (["C3", "E3", "G3"], 4), (["G3", "B3", "D4"], 4)])
    return normalize(m + drums(dur, 100, "half", 0.45), 0.85)


def campfire_strings(dur=60):
    pattern = []
    for chord in [["D3", "A3", "D4", "F#4"], ["B2", "F#3", "B3", "D4"], ["G2", "D3", "G3", "B3"], ["A2", "E3", "A3", "C#4"]]:
        pattern += [(n, 0.5) for n in chord + chord[::-1]]
    m = melody_track(dur, pattern, 90, "pluck", 0.28)
    m += fast_noise_bed(dur, 0.03, 4, 400)  # soft fire crackle bed
    return normalize(m, 0.85)


TRACKS = [
    ("morning-commute", "Morning Commute", "Pocket Radio", morning_commute),
    ("summer-rain", "Summer Rain", "AkiraKeys", lambda: piano_piece(60)),
    ("neon-night-drive", "Neon Night Drive", "Midnight Arcade", neon_night_drive),
    ("campfire-strings", "Campfire Strings", "Wren & Co.", campfire_strings),
]


def main():
    out = ensure_dirs("music")
    for key, title, artist, fn in TRACKS:
        track = fn()
        path = out / f"{key}.mp3"
        encode_mp3(track, path, title, artist)
        record(f"music:{key}", path, title=title, artist=artist, duration=round(len(track) / SR, 2))
        print("music", key, path.stat().st_size // 1024, "KB")


if __name__ == "__main__":
    main()
