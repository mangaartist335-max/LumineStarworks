"""Makes the town's whole sound pack from scratch.

Every sound here is synthesized by this script: birds, crickets, wind, rain, the creek, the
store's fridge hum, diner chatter, a little jukebox tune and the rest. Nothing is downloaded or
sampled, so it's all yours to upload to Roblox.

Usage (from the project folder):  python3 tools/make_sounds.py
Writes audio/<Slot>.ogg (one per Config.Sounds slot) and audio/spectrograms.png (a picture of
every sound, handy for a quick look). Needs numpy, Pillow and ffmpeg.

The loops are built to repeat seamlessly: noise is made in the frequency domain (so it wraps
around), and anything that rings past the end carries on from the start.
"""

import os
import subprocess
import sys
import tempfile
import wave
import zlib

import numpy as np

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "audio")
TAU = 2 * np.pi


# Building blocks ------------------------------------------------------------------------

def rng_for(name):
    return np.random.default_rng(zlib.crc32(name.encode()))


def secs(n):
    return np.arange(n) / SR


def shape_band(lo=None, hi=None, slope=0.0, order=2):
    """A gentle band-pass (Butterworth-like edges) with an optional tilt (f ** slope)."""
    def shape(f):
        f = np.maximum(f, 1.0)
        g = f ** slope
        if lo:
            g = g / np.sqrt(1 + (lo / f) ** (2 * order))
        if hi:
            g = g / np.sqrt(1 + (f / hi) ** (2 * order))
        return g
    return shape


def peak_shape(center, width):
    """A narrow resonance around `center` Hz (for whistles and formants)."""
    def shape(f):
        return 1 / (1 + ((f - center) / width) ** 2)
    return shape


def noise(n, rng, shape):
    """Noise with the given spectrum, normalized. It repeats perfectly every n samples."""
    freqs = np.fft.rfftfreq(n, 1 / SR)
    spec = (rng.standard_normal(len(freqs)) + 1j * rng.standard_normal(len(freqs))) * shape(freqs)
    spec[0] = 0
    x = np.fft.irfft(spec, n)
    return x / (np.std(x) + 1e-12)


def filt(x, shape, loop=True):
    """Zero-phase filter by spectrum. Loops wrap around; one-shots get room for their tail."""
    n = len(x)
    pad = 0 if loop else min(SR, n)
    m = n + pad
    f = np.fft.rfftfreq(m, 1 / SR)
    y = np.fft.irfft(np.fft.rfft(x, m) * shape(f), m)
    return y[:n]


def wander(n, rate, rng, lo=0.0, hi=1.0):
    """A smooth random drift between lo and hi, changing about `rate` times a second.
    Wraps around, so it loops."""
    k = max(2, int(round(n / SR * rate)))
    pts = rng.uniform(lo, hi, k)
    pos = np.arange(n) * k / n
    i0 = np.floor(pos).astype(int) % k
    i1 = (i0 + 1) % k
    w = (1 - np.cos((pos - np.floor(pos)) * np.pi)) / 2
    return pts[i0] * (1 - w) + pts[i1] * w


def place(buf, ev, start, gain=1.0, loop=True):
    """Add a sound into a buffer at `start` samples. In a loop, anything past the end wraps."""
    n = buf.shape[-1]
    idx = int(start) + np.arange(len(ev))
    if loop:
        np.add.at(buf, idx % n, ev * gain)
    else:
        keep = (idx >= 0) & (idx < n)
        buf[idx[keep]] += ev[keep] * gain


def place_stereo(buf, ev, start, pan, gain=1.0, loop=True):
    a = (np.clip(pan, -1, 1) + 1) * np.pi / 4
    place(buf[0], ev, start, gain * np.cos(a), loop)
    place(buf[1], ev, start, gain * np.sin(a), loop)


def osc(freq, partials=((1, 1.0),), phase=0.0):
    """Additive oscillator. `freq` is a number per sample (array); partials are (ratio, amp)."""
    ph = TAU * np.cumsum(freq) / SR + phase
    out = np.zeros_like(ph)
    for ratio, amp in partials:
        out += amp * np.sin(ph * ratio)
    return out


def glide(f0, f1, n, power=1.0):
    u = np.linspace(0, 1, max(n, 1)) ** power
    return f0 * (f1 / f0) ** u


def hump(n, power=1.0):
    """A soft rise-and-fall envelope."""
    return np.sin(np.pi * np.linspace(0, 1, max(n, 1))) ** power


def decay(n, tau, attack=0.004):
    t = secs(n)
    env = np.exp(-t / tau)
    a = int(attack * SR)
    if a > 0:
        env[:a] *= np.linspace(0, 1, a)
    return env


def silence(seconds):
    return np.zeros(int(seconds * SR))


def reverb(x, seconds=1.2, mix=0.25, rng=None, damp=5000.0, loop=True, predelay=0.012):
    """A soft room: convolution with a decaying-noise impulse. Loops wrap the tail around."""
    rng = rng or np.random.default_rng(7)
    n_ir = int(seconds * SR)
    ir = rng.standard_normal(n_ir) * np.exp(-6.9 * np.arange(n_ir) / n_ir)
    ir = filt(ir, shape_band(hi=damp, order=1), loop=False)
    ir[: int(predelay * SR)] = 0
    ir /= np.sqrt(np.sum(ir ** 2)) + 1e-12
    n = len(x)
    if loop:
        if n_ir > n:
            ir = np.pad(ir, (0, (-n_ir) % n)).reshape(-1, n).sum(axis=0)
        wet = np.fft.irfft(np.fft.rfft(x) * np.fft.rfft(ir, n), n)
    else:
        m = n + n_ir
        wet = np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(ir, m), m)[:n]
    return x * (1 - mix) + wet * mix


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def periodic(freq, seconds):
    """Nudge a frequency so it fits a whole number of cycles in the loop (so it repeats cleanly)."""
    return max(1, round(freq * seconds)) / seconds


# Birds and bugs --------------------------------------------------------------------------

def note(f0, f1, dur, harm=0.12, vib=0.0, vib_rate=0.0, power=1.0, env_power=1.5):
    n = int(dur * SR)
    f = glide(f0, f1, n, power)
    if vib:
        f = f * (1 + vib * np.sin(TAU * vib_rate * secs(n)))
    return hump(n, env_power) * osc(f, ((1, 1.0), (2, harm)))


def call_whistle(rng):
    # A sweet two-note whistle: high, then a little lower.
    f = rng.uniform(3500, 4300)
    return np.concatenate([note(f, f * 0.98, 0.26), silence(0.06), note(f * 0.84, f * 0.79, 0.34)])


def call_trill(rng):
    base = rng.uniform(4200, 5600)
    parts = []
    k = int(rng.integers(7, 14))
    for i in range(k):
        parts.append(note(base * 1.3, base * 0.75, 0.035, harm=0.05) * (1 - 0.4 * i / k))
        parts.append(silence(0.03))
    return np.concatenate(parts)


def call_warble(rng):
    parts = []
    f = rng.uniform(3000, 4500)
    for _ in range(int(rng.integers(5, 10))):
        nxt = float(np.clip(f * rng.uniform(0.8, 1.25), 2600, 5400))
        parts.append(note(f, nxt, rng.uniform(0.06, 0.13), vib=0.02, vib_rate=rng.uniform(25, 40)))
        parts.append(silence(rng.uniform(0.01, 0.05)))
        f = nxt
    return np.concatenate(parts)


def call_tweet(rng):
    one = note(rng.uniform(2700, 3200), rng.uniform(4400, 5200), 0.07, power=0.7)
    if rng.random() < 0.6:
        return np.concatenate([one, silence(rng.uniform(0.08, 0.16)), one * 0.8])
    return one


def call_dove(rng):
    # A soft, low "hoo-OO-hoo hoo hoo", far away.
    f = rng.uniform(480, 560)
    seq = [(f, f * 1.02, 0.28), (f * 1.12, f * 0.98, 0.42), (f, f * 0.97, 0.25), (f, f * 0.97, 0.25), (f, f * 0.96, 0.3)]
    parts = []
    for i, (a, b, d) in enumerate(seq):
        parts.append(note(a, b, d, harm=0.2, env_power=1.0))
        parts.append(silence(0.18 if i == 1 else 0.1))
    return np.concatenate(parts)


def day_birds():
    L = 48
    n = L * SR
    rng = rng_for("DayBirds")
    out = np.zeros((2, n))
    # Morning air underneath (very quiet).
    for ch in range(2):
        out[ch] += 0.012 * noise(n, rng, shape_band(400, 7000, slope=-0.5))
    singers = [
        (call_whistle, 7, 13), (call_whistle, 9, 16),
        (call_warble, 6, 11), (call_warble, 10, 18),
        (call_trill, 9, 15), (call_tweet, 4, 8), (call_tweet, 6, 10),
        (call_dove, 16, 24),
    ]
    for make, every_lo, every_hi in singers:
        pan = rng.uniform(-0.9, 0.9)
        near = rng.uniform(0.25, 1.0)
        t = rng.uniform(0, every_hi)
        while t < L:
            call = make(rng)
            if near < 0.5:
                call = filt(call, shape_band(hi=3000 + 4000 * near), loop=False)
            place_stereo(out, call, t * SR, pan + rng.uniform(-0.05, 0.05), 0.35 * near)
            t += rng.uniform(every_lo, every_hi)
    # Lots of tiny far-off chirps so it never goes completely quiet.
    for _ in range(140):
        call = filt(call_tweet(rng) if rng.random() < 0.6 else note(*rng.uniform(3000, 5000, 2), 0.05), shape_band(hi=3500), loop=False)
        place_stereo(out, call, rng.uniform(0, n), rng.uniform(-1, 1), rng.uniform(0.02, 0.06))
    return out


def night_crickets():
    L = 30
    n = L * SR
    rng = rng_for("NightCrickets")
    out = np.zeros((2, n))
    for ch in range(2):
        out[ch] += 0.01 * noise(n, rng, shape_band(80, 1200, slope=-1.0))

    def cricket(level, pan, far):
        fc = rng.uniform(4200, 4900)
        pulses = int(rng.integers(3, 5))
        pulse = hump(int(0.014 * SR), 2) * np.sin(TAU * fc * secs(int(0.014 * SR)))
        chirp = np.zeros(int((0.03 * pulses + 0.02) * SR))
        for p in range(pulses):
            place(chirp, pulse, int(p * 0.03 * SR), loop=False)
        if far:
            chirp = filt(chirp, shape_band(hi=4000), loop=False)
        period = rng.uniform(0.42, 0.7)
        t = rng.uniform(0, period)
        while t < L:
            place_stereo(out, chirp, t * SR, pan, level * rng.uniform(0.85, 1.0))
            t += period * rng.uniform(0.97, 1.03)

    for _ in range(5):
        cricket(rng.uniform(0.18, 0.35), rng.uniform(-0.8, 0.8), False)
    for _ in range(24):
        cricket(rng.uniform(0.02, 0.06), rng.uniform(-1, 1), True)
    # A tree frog somewhere off to the side, now and then.
    t = rng.uniform(2, 6)
    while t < L - 1:
        croak = np.zeros(int(0.5 * SR))
        for k in range(2):
            m = int(0.13 * SR)
            buzz = (np.sin(TAU * 62 * secs(m)) > 0.2) * np.sin(TAU * 1650 * secs(m))
            place(croak, filt(buzz * hump(m, 0.7), shape_band(900, 3000), loop=False), int(k * 0.2 * SR), loop=False)
        place_stereo(out, croak, t * SR, -0.6, 0.05)
        t += rng.uniform(6, 11)
    return out


# Weather ---------------------------------------------------------------------------------

def wind():
    L = 40
    n = L * SR
    rng = rng_for("Wind")
    gust = wander(n, 0.14, rng, 0.2, 1.0) ** 1.6
    out = np.zeros((2, n))
    bands = [(60, 250, 0.9), (180, 600, 0.7), (450, 1400, 0.45), (1100, 3200, 0.25), (2600, 7000, 0.12)]
    for ch in range(2):
        g = np.roll(gust, int(ch * 0.35 * SR))
        for i, (lo, hi, level) in enumerate(bands):
            weight = level * (0.35 + 0.65 * g ** (1 + i * 0.4))
            out[ch] += weight * noise(n, rng, shape_band(lo, hi, slope=-0.5))
        # A soft whistle through the trees when it picks up.
        for f in (720, 910):
            out[ch] += 0.12 * g ** 2.5 * wander(n, 0.2, rng, 0.3, 1.0) * noise(n, rng, peak_shape(f, 18))
    return out


def rain():
    L = 30
    n = L * SR
    rng = rng_for("Rain")
    out = np.zeros((2, n))
    for ch in range(2):
        density = wander(n, 0.25, rng, 0.85, 1.0)
        out[ch] += density * noise(n, rng, shape_band(500, 9000, slope=-0.3))
        out[ch] += 0.4 * noise(n, rng, shape_band(80, 700, slope=-0.8))
        # Individual drops: sparse taps, grouped by pitch, each group rung through its own "plip".
        for _ in range(8):
            f = rng.uniform(1400, 4200)
            m = int(0.03 * SR)
            plip = np.exp(-secs(m) / 0.006) * np.sin(TAU * f * glide(1, 1.15, m) * secs(m))
            taps = np.zeros(n)
            k = int(L * 4)
            taps[rng.integers(0, n, k)] = rng.exponential(1.0, k)
            out[ch] += 0.35 * np.fft.irfft(np.fft.rfft(taps) * np.fft.rfft(plip, n), n)
    return out


def thunder():
    n = 10 * SR
    rng = rng_for("Thunder")
    out = np.zeros((2, n))
    t = secs(n)
    for ch in range(2):
        rumble = noise(n, rng, shape_band(25, 420, slope=-1.0))
        rolls = np.zeros(n)
        for _ in range(6):
            c = rng.uniform(0.3, 6.0)
            rolls += rng.uniform(0.4, 1.0) * np.exp(-((t - c) / rng.uniform(0.3, 0.9)) ** 2)
        env = (1 - np.exp(-t / 0.25)) * np.exp(-t / 2.6) * (0.5 + rolls)
        out[ch] += rumble * env
        crack = noise(n, rng, shape_band(900, 9000)) * np.exp(-t / 0.07) * (t > 0.03)
        for _ in range(4):
            c = rng.uniform(0.08, 0.6)
            crack += 0.4 * noise(n, rng, shape_band(1200, 8000)) * np.exp(-np.abs(t - c) / 0.03)
        out[ch] += 0.5 * crack
    out[:, : int(0.002 * SR)] *= np.linspace(0, 1, int(0.002 * SR))
    return out


# Places ----------------------------------------------------------------------------------

def creek():
    L = 30
    n = L * SR
    rng = rng_for("Creek")
    out = 0.22 * wander(n, 0.4, rng, 0.6, 1.0) * noise(n, rng, shape_band(150, 3000, slope=-0.5))
    out += 0.05 * noise(n, rng, shape_band(2500, 9000))
    # Babbling: lots of tiny bubbles, each a quick rising "bloop".
    busy = wander(n, 0.8, rng, 0.3, 1.0)
    t = 0.0
    while t < L:
        f0 = np.exp(rng.uniform(np.log(320), np.log(1800)))
        dur = rng.uniform(0.02, 0.06)
        m = int(dur * SR)
        f = f0 * (1 + rng.uniform(0.2, 0.9) * np.linspace(0, 1, m))
        b = np.sin(TAU * np.cumsum(f) / SR) * np.exp(-secs(m) / (dur * 0.35))
        place(out, b, t * SR, rng.lognormal(-1.6, 0.5))
        t += rng.exponential(1 / 110) / busy[int(t * SR) % n]
    return out


def store_hum():
    L = 20
    n = L * SR
    rng = rng_for("StoreHum")
    t = secs(n)
    out = np.zeros(n)
    # The fridge compressor: a low hum with a few overtones that slowly beat against each other.
    for k, amp in enumerate([1.0, 0.7, 0.45, 0.3, 0.16, 0.1], start=1):
        f = periodic(60 * k + rng.uniform(-0.3, 0.3), L)
        out += amp * np.sin(TAU * f * t + rng.uniform(0, TAU))
    out *= 0.3
    # The fan, whooshing softly with a gentle flutter.
    fan = noise(n, rng, shape_band(120, 1500, slope=-1.0))
    out += 0.22 * fan * (1 + 0.15 * np.sin(TAU * periodic(24, L) * t))
    # The lights, buzzing very faintly.
    for k in range(1, 18, 2):
        out += 0.025 / k ** 0.5 * np.sin(TAU * 120 * k * t)
    return out


def diner_chatter():
    L = 40
    n = L * SR
    rng = rng_for("DinerChatter")
    out = np.zeros(n)
    vowels = [(730, 1090, 2440), (530, 1840, 2480), (300, 2200, 2950), (570, 840, 2410),
              (320, 900, 2250), (660, 1720, 2410), (490, 1350, 1690)]

    def phrase(f0, seconds):
        """A murmured phrase: syllables of a voice shaped by vowel formants (additive)."""
        m = int(seconds * SR)
        syl_rate = rng.uniform(4.0, 5.5)
        k = max(2, int(seconds * syl_rate))
        picks = [vowels[i] for i in rng.integers(0, len(vowels), k + 1)]
        pos = np.linspace(0, k, m)
        i0 = np.minimum(pos.astype(int), k)
        formants = np.array(picks)[i0]
        pitch = f0 * (1 - 0.12 * np.linspace(0, 1, m)) * (1 + 0.06 * np.sin(TAU * rng.uniform(0.8, 1.6) * secs(m) + rng.uniform(0, TAU)))
        ph = TAU * np.cumsum(pitch) / SR
        sig = np.zeros(m)
        for h in range(1, int(3400 / f0)):
            fh = h * pitch
            amp = np.zeros(m)
            for j, bw in enumerate((90, 110, 160)):
                amp += (1.0, 0.5, 0.25)[j] / (1 + ((fh - formants[:, j]) / bw) ** 2)
            sig += amp / h ** 0.6 * np.sin(h * ph)
        syl = (0.5 - 0.5 * np.cos(TAU * (pos % 1))) ** 0.8
        env = syl * hump(m, 0.3)
        consonants = noise(m, rng, shape_band(2200, 6000)) * (pos % 1 < 0.12) * 0.12
        return sig * env + consonants * hump(m, 0.3)

    for _ in range(8):
        f0 = rng.uniform(95, 130) if rng.random() < 0.5 else rng.uniform(170, 225)
        level = rng.uniform(0.25, 1.0)
        t = rng.uniform(0, 3)
        while t < L:
            dur = rng.uniform(0.9, 3.2)
            place(out, phrase(f0, dur), t * SR, level)
            t += dur + rng.uniform(0.5, 3.0)
    out = filt(out, shape_band(120, 3000))
    out /= np.std(out) + 1e-12
    # Forks, spoons and mugs.
    t = rng.uniform(0, 1)
    while t < L:
        m = int(0.25 * SR)
        f = rng.uniform(2600, 5200)
        clink = np.exp(-secs(m) / rng.uniform(0.04, 0.09)) * osc(np.full(m, f), ((1, 1.0), (2.76, 0.4), (5.4, 0.15)))
        place(out, clink, t * SR, rng.uniform(0.08, 0.25))
        if rng.random() < 0.3:
            place(out, clink, (t + rng.uniform(0.08, 0.2)) * SR, 0.1)
        if rng.random() < 0.15:
            mm = int(0.06 * SR)
            place(out, np.sin(TAU * 180 * secs(mm)) * np.exp(-secs(mm) / 0.015), (t + 0.4) * SR, 0.4)
        t += rng.uniform(0.8, 4.0)
    return reverb(out, 0.9, 0.45, rng, damp=3500)


def soft_hum():
    """The rare, magical moment: a warm chord that swells and glimmers."""
    L = 20
    n = L * SR
    rng = rng_for("SoftHum")
    t = secs(n)
    out = np.zeros(n)
    for m, level in [(50, 0.8), (57, 0.7), (62, 0.55), (66, 0.45), (69, 0.4), (76, 0.22)]:
        swell = wander(n, 0.25, rng, 0.45, 1.0)
        for detune in (-0.1, 0.1):
            f = periodic(midi(m), L) + detune
            out += level * swell * (np.sin(TAU * f * t + rng.uniform(0, TAU)) + 0.15 * np.sin(TAU * 2 * f * t))
    # Little sparkles up high.
    for _ in range(26):
        mm = int(1.6 * SR)
        f = midi(int(rng.choice([86, 88, 90, 93, 95, 98])))
        sparkle = decay(mm, 0.45, attack=0.03) * (np.sin(TAU * f * secs(mm)) + 0.2 * np.sin(TAU * 2.76 * f * secs(mm)))
        place(out, sparkle, rng.uniform(0, n), rng.uniform(0.08, 0.2))
    return reverb(out, 2.8, 0.45, rng, damp=6000)


# Vehicles --------------------------------------------------------------------------------

def engine_loop(name, L, rate, wobble, kernel_freqs, kernel_tau, noise_band, clatter=0.0):
    """A pulse every firing, rung through a few body resonances. Periods are nudged so a whole
    number of them fill the loop exactly."""
    n = int(L * SR)
    rng = rng_for(name)
    count = int(round(L * rate))
    periods = 1 + wobble * rng.standard_normal(count)
    periods *= n / periods.sum()
    starts = np.concatenate([[0], np.cumsum(periods)[:-1]]).astype(int)
    taps = np.zeros(n)
    taps[starts % n] = rng.uniform(0.75, 1.0, count)
    m = int(kernel_tau * 6 * SR)
    kt = secs(m)
    kernel = np.zeros(m)
    for f, amp in kernel_freqs:
        kernel += amp * np.sin(TAU * f * kt) * np.exp(-kt / kernel_tau)
    out = np.fft.irfft(np.fft.rfft(taps) * np.fft.rfft(kernel, n), n)
    out /= np.std(out) + 1e-12
    pulse_env = np.fft.irfft(np.fft.rfft(taps) * np.fft.rfft(np.exp(-secs(int(0.02 * SR)) / 0.006), n), n)
    out += 0.4 * noise(n, rng, shape_band(*noise_band)) * (0.4 + pulse_env / (pulse_env.max() + 1e-9))
    if clatter:
        tick = noise(int(0.012 * SR), rng, shape_band(2000, 6000)) * np.exp(-secs(int(0.012 * SR)) / 0.002)
        out += clatter * np.fft.irfft(np.fft.rfft(taps) * np.fft.rfft(tick, n), n) / (np.abs(tick).max() + 1e-9)
    return filt(out, shape_band(30, 4000))


def engine():
    return engine_loop("Engine", 6, 52, 0.02, [(104, 1.0), (208, 0.6), (330, 0.35), (620, 0.15)], 0.012, (80, 900, 2))


def tractor():
    return engine_loop("Tractor", 6, 13.5, 0.04, [(55, 1.0), (110, 0.8), (230, 0.4), (480, 0.2)], 0.03, (60, 600, 2), clatter=0.25)


def mower():
    out = engine_loop("Mower", 6, 48, 0.03, [(190, 1.0), (390, 0.7), (880, 0.35)], 0.008, (300, 2500, 2))
    rng = rng_for("MowerBlade")
    n = len(out)
    return out + 0.25 * noise(n, rng, shape_band(300, 2000)) * (1 + 0.5 * np.sin(TAU * periodic(24, 6) * secs(n)))


def horn():
    """A friendly 'honk-honk' (with just a hint of quack: it's on the duck truck)."""
    rng = rng_for("Horn")
    out = np.zeros(int(1.4 * SR))

    def honk(seconds):
        m = int(seconds * SR)
        bend = 1 + 0.05 * np.exp(-secs(m) / 0.04)
        sig = np.zeros(m)
        for f0 in (370, 466):
            pitch = f0 * bend
            ph = TAU * np.cumsum(pitch) / SR
            for h in range(1, 18):
                fh = h * f0
                formant = 1 / (1 + ((fh - 1150) / 400) ** 2) + 0.6 / (1 + ((fh - 2600) / 500) ** 2)
                sig += (0.35 / h + formant) / h ** 0.3 * np.sin(h * ph)
        env = np.minimum(1, secs(m) / 0.012) * np.minimum(1, (seconds - secs(m)) / 0.04)
        return sig * env

    place(out, honk(0.2), int(0.02 * SR), loop=False)
    place(out, honk(0.36), int(0.34 * SR), loop=False)
    return reverb(out, 0.5, 0.12, rng, loop=False)


# Little moments --------------------------------------------------------------------------

def bell(f, partials, seconds, strike=0.3, rng=None):
    m = int(seconds * SR)
    t = secs(m)
    out = np.zeros(m)
    for ratio, amp, tau in partials:
        out += amp * np.exp(-t / tau) * (np.sin(TAU * f * ratio * t) + 0.5 * np.sin(TAU * f * ratio * 1.002 * t))
    out[: int(0.002 * SR)] *= np.linspace(0, 1, int(0.002 * SR))
    # Let the ring fade away over the last third instead of stopping.
    tail = int(m / 3)
    out[-tail:] *= 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, tail))
    if strike and rng is not None:
        k = int(0.004 * SR)
        out[:k] += strike * noise(k, rng, shape_band(2000, 9000)) * np.linspace(1, 0, k)
    return out


def store_chime():
    rng = rng_for("StoreChime")
    out = np.zeros(int(4.0 * SR))
    bar = [(1, 1.0, 1.4), (2.756, 0.35, 0.6), (5.404, 0.12, 0.25)]
    place(out, bell(midi(76), bar, 3.4, rng=rng), 0, loop=False)
    place(out, bell(midi(72), bar, 3.4, rng=rng), int(0.45 * SR), 0.9, loop=False)
    return reverb(out, 0.8, 0.15, rng, loop=False)


def counter_bell():
    rng = rng_for("CounterBell")
    partials = [(1, 1.0, 1.4), (2.32, 0.5, 0.7), (4.25, 0.25, 0.35), (6.63, 0.1, 0.18)]
    return reverb(bell(1975, partials, 3.2, strike=0.5, rng=rng), 0.6, 0.1, rng, loop=False)


def owl():
    rng = rng_for("Owl")
    f = 335.0
    pattern = [(0.36, 0.26), (0.18, 0.08), (0.18, 0.22), (0.58, 0.26), (0.34, 0.0)]
    parts = []
    for dur, gap in pattern:
        m = int(dur * SR)
        pitch = f * (1 + 0.03 * np.sin(np.pi * np.linspace(0, 1, m)) - 0.05 * np.linspace(0, 1, m))
        env = np.minimum(1, secs(m) / 0.06) * np.minimum(1, (dur - secs(m)) / 0.08)
        tone = osc(pitch, ((1, 1.0), (2, 0.22), (3, 0.06)))
        breath = 0.12 * noise(m, rng, peak_shape(f, 60))
        parts += [(tone + breath) * env, silence(gap)]
    return reverb(np.concatenate(parts + [silence(1.0)]), 1.1, 0.18, rng, damp=3000, loop=False)


def chicken():
    """'Buk... buk... buk-buk-BAGAWK!' (cartoonish on purpose: it's the funny incident)."""
    rng = rng_for("Chicken")

    def voice(f0, f1, seconds, rasp=0.0):
        m = int(seconds * SR)
        pitch = glide(f0, f1, m, 0.8) * (1 + rasp * (noise(m, rng, shape_band(20, 120)) * 0.05))
        ph = TAU * np.cumsum(pitch) / SR
        sig = np.zeros(m)
        for h in range(1, 16):
            fh = h * f0
            formant = 1 / (1 + ((fh - 1300) / 350) ** 2) + 0.5 / (1 + ((fh - 3000) / 500) ** 2)
            sig += (0.2 / h + formant) * np.sin(h * ph)
        if rasp:
            sig *= 1 + rasp * np.sin(ph * 0.5)
        env = np.minimum(1, secs(m) / 0.008) * np.minimum(1, (seconds - secs(m)) / 0.03)
        return sig * env

    parts = [
        voice(420, 320, 0.08), silence(0.35), voice(410, 310, 0.08), silence(0.3),
        voice(430, 330, 0.07), silence(0.09), voice(430, 320, 0.07), silence(0.07),
        voice(440, 470, 0.06), silence(0.02), voice(560, 720, 0.32, rasp=0.6), silence(0.4),
    ]
    return reverb(np.concatenate(parts), 0.5, 0.1, rng, loop=False)


def rustle():
    L = 10
    n = L * SR
    rng = rng_for("Rustle")
    out = np.zeros(n)
    t = rng.uniform(0, 0.5)
    while t < L:
        burst = rng.uniform(0.3, 1.2)
        for _ in range(int(burst * rng.uniform(30, 70))):
            m = int(rng.uniform(0.005, 0.03) * SR)
            grain = noise(m, rng, shape_band(1500, 8000)) * hump(m, 0.5)
            place(out, grain, (t + rng.uniform(0, burst)) * SR, rng.uniform(0.1, 0.5))
        if rng.random() < 0.25:
            m = int(0.04 * SR)
            snap = np.sin(TAU * rng.uniform(900, 1800) * secs(m)) * np.exp(-secs(m) / 0.006)
            place(out, snap, (t + burst * 0.5) * SR, 0.5)
        t += burst + rng.uniform(0.3, 1.5)
    return filt(out, shape_band(400, 9000))


def door():
    rng = rng_for("Door")
    out = np.zeros(int(1.2 * SR))
    for k, when in enumerate((0.0, 0.05)):
        m = int(0.02 * SR)
        click = noise(m, rng, shape_band(1000, 5000)) * np.exp(-secs(m) / 0.003)
        place(out, click, int((0.02 + when) * SR), 0.6 - 0.2 * k, loop=False)
    # A short, friendly creak: stick-slip pulses rung through the wood.
    m = int(0.55 * SR)
    rate = glide(170, 260, m) * (1 + 0.05 * noise(m, rng, shape_band(5, 60)))
    phase = np.cumsum(rate) / SR
    taps = np.diff(np.floor(phase), prepend=0) * rng.uniform(0.6, 1.0, m)
    kt = secs(int(0.03 * SR))
    wood = sum(a * np.sin(TAU * f * kt) * np.exp(-kt / 0.006) for f, a in ((360, 1.0), (740, 0.6), (1350, 0.3)))
    creak = np.convolve(taps, wood)[:m] * hump(m, 0.6)
    place(out, creak, int(0.12 * SR), 0.5 / (np.abs(creak).max() + 1e-9), loop=False)
    return reverb(out, 0.6, 0.12, rng, loop=False)


def sip():
    rng = rng_for("Sip")
    out = np.zeros(int(0.9 * SR))
    m = int(0.25 * SR)
    slurp = noise(m, rng, shape_band(1500, 4500)) * hump(m, 1.2) * 0.25
    place(out, slurp, 0, loop=False)
    for k in range(3):
        mm = int(0.07 * SR)
        f = glide(240, 420, mm)
        gulp = np.sin(TAU * np.cumsum(f) / SR) * hump(mm, 1.0)
        place(out, gulp, int((0.3 + k * 0.16) * SR), 0.5, loop=False)
    return filt(out, shape_band(150, 6000), loop=False)


# Music -----------------------------------------------------------------------------------

def music_box(f, seconds, vel):
    m = int(seconds * SR)
    t = secs(m)
    tau = 1.3 * (523 / f) ** 0.5
    tone = np.sin(TAU * f * t) + 0.3 * np.sin(TAU * 2 * f * t) * np.exp(-t / 0.3) + 0.1 * np.sin(TAU * 5.3 * f * t) * np.exp(-t / 0.05)
    return vel * tone * decay(m, tau, attack=0.002)


def ice_cream_tune():
    """An original little music-box melody (8 bars, loops)."""
    bpm = 120
    beat = 60 / bpm
    L = 8 * 4 * beat
    n = int(L * SR)
    out = np.zeros(n)
    melody = [
        [(76, 0, 1), (79, 1, 1), (84, 2, 1), (79, 3, 1)],
        [(81, 0, 1), (79, 1, 1), (76, 2, 2)],
        [(77, 0, 1), (81, 1, 1), (86, 2, 1), (81, 3, 1)],
        [(79, 0, 3)],
        [(76, 0, 1), (79, 1, 0.5), (81, 1.5, 0.5), (79, 2, 1), (76, 3, 1)],
        [(74, 0, 1), (77, 1, 1), (81, 2, 1), (79, 3, 1)],
        [(72, 0, 1), (76, 1, 1), (74, 2, 1), (71, 3, 1)],
        [(72, 0, 3)],
    ]
    chords = [(48, 52, 55), (45, 52, 57), (50, 53, 57), (43, 50, 55), (48, 52, 55), (50, 53, 57), (43, 50, 53), (48, 52, 55)]
    for bar in range(8):
        for m, at, _dur in melody[bar]:
            place(out, music_box(midi(m), 2.5, 1.0), ((bar * 4 + at) * beat) * SR)
        root, third, fifth = chords[bar]
        for i, m in enumerate((root + 12, fifth + 12, third + 24, fifth + 12) * 2):
            place(out, music_box(midi(m), 1.6, 0.35), ((bar * 4 + i * 0.5) * beat) * SR)
    rng = rng_for("IceCreamTune")
    # Out of a little speaker on the truck roof.
    out = np.tanh(1.5 * out / (np.abs(out).max() + 1e-9))
    out = filt(out, shape_band(350, 5500))
    out *= 1 + 0.06 * np.sin(TAU * periodic(5, L) * secs(n))
    return reverb(out, 0.7, 0.15, rng)


def jukebox():
    """An original, easy-going shuffle in F (16 bars, loops): Rhodes, upright bass, vibes, brushes."""
    bpm = 120
    beat = 60 / bpm
    L = 16 * 4 * beat
    n = int(L * SR)
    rng = rng_for("Jukebox")

    def swing(p):
        whole = np.floor(p)
        frac = p - whole
        return whole + (2 / 3 if abs(frac - 0.5) < 1e-6 else frac)

    def at(bar, p):
        return int((bar * 4 + swing(p)) * beat * SR)

    def rhodes(f, seconds, vel):
        m = int(seconds * SR)
        t = secs(m)
        tone = np.sin(TAU * f * t) + 0.25 * np.sin(TAU * 2 * f * t) + 0.12 * np.sin(TAU * 7 * f * t) * np.exp(-t / 0.04)
        env = decay(m, 1.1, 0.004) * np.minimum(1, np.maximum(0, (seconds - t) / 0.08))
        return vel * tone * env * (1 + 0.12 * np.sin(TAU * 4.5 * t))

    def bass(f, seconds, vel):
        m = int(seconds * SR)
        t = secs(m)
        tone = np.sin(TAU * f * t) + 0.5 * np.sin(TAU * 2 * f * t) * np.exp(-t / 0.25) + 0.2 * np.sin(TAU * 3 * f * t) * np.exp(-t / 0.1)
        return vel * tone * decay(m, 0.6, 0.006) * np.minimum(1, np.maximum(0, (seconds - t) / 0.05))

    def vibes(f, seconds, vel):
        m = int((seconds + 1.2) * SR)
        t = secs(m)
        tone = np.sin(TAU * f * t) + 0.12 * np.sin(TAU * 4 * f * t) * np.exp(-t / 0.15)
        held = np.where(t < seconds, 1.0, np.exp(-(t - seconds) / 0.15))
        return vel * tone * decay(m, 1.6, 0.003) * held * (1 + 0.3 * np.sin(TAU * 5.5 * t))

    chords = {"F": (41, (57, 60, 64, 69)), "Dm": (38, (57, 60, 64, 65)), "Gm": (43, (58, 62, 65, 69)), "C": (36, (58, 62, 64, 69))}
    walk = {"F": (41, 45, 48, 39), "Dm": (38, 41, 45, 44), "Gm": (43, 46, 50, 49), "C": (48, 45, 43, 42)}
    progression = ["F", "Dm", "Gm", "C"] * 4
    melody = [
        [(72, 0, 1), (69, 1, 0.5), (72, 1.5, 0.5), (74, 2, 1.5)],
        [(77, 0, 1), (76, 1, 0.5), (74, 1.5, 0.5), (72, 2, 2)],
        [(70, 0, 0.5), (74, 0.5, 0.5), (77, 1, 1), (76, 2, 0.5), (74, 2.5, 0.5), (72, 3, 1)],
        [(69, 0, 2), (67, 2, 1)],
        [(72, 0, 1), (69, 1, 0.5), (72, 1.5, 0.5), (77, 2, 1.5)],
        [(76, 0, 1), (74, 1, 0.5), (72, 1.5, 0.5), (69, 2, 2)],
        [(70, 0, 0.5), (69, 0.5, 0.5), (67, 1, 1), (70, 2, 0.5), (74, 2.5, 0.5), (76, 3, 1)],
        [(77, 0, 3)],
        [(81, 0, 1), (79, 1, 0.5), (77, 1.5, 0.5), (81, 2, 1), (84, 3, 1)],
        [(81, 0, 2), (79, 2, 0.5), (77, 2.5, 0.5), (74, 3, 1)],
        [(79, 0, 1), (77, 1, 0.5), (74, 1.5, 0.5), (70, 2, 1), (74, 3, 1)],
        [(72, 0, 1), (76, 1, 1), (79, 2, 1), (82, 3, 1)],
        [(81, 0, 1.5), (77, 1.5, 0.5), (72, 2, 2)],
        [(74, 0, 0.5), (77, 0.5, 0.5), (81, 1, 1), (79, 2, 1), (77, 3, 1)],
        [(76, 0, 1), (74, 1, 1), (70, 2, 0.5), (74, 2.5, 0.5), (77, 3, 1)],
        [(76, 0, 2), (72, 2, 1)],
    ]
    keys = np.zeros(n)
    low = np.zeros(n)
    lead = np.zeros(n)
    drums = np.zeros(n)
    for bar, name in enumerate(progression):
        _root, voicing = chords[name]
        for m in voicing:
            place(keys, rhodes(midi(m), 1.4 * beat, 0.3), at(bar, 0))
            place(keys, rhodes(midi(m), 0.8 * beat, 0.22), at(bar, 2.5))
        for i, m in enumerate(walk[name]):
            place(low, bass(midi(m), 0.95 * beat, 0.9), at(bar, i))
        for m, p, d in melody[bar]:
            place(lead, vibes(midi(m), d * beat, 0.5), at(bar, p))
        for i in range(4):
            mm = int(0.16 * SR)
            swish = noise(mm, rng, shape_band(2000, 8000)) * decay(mm, 0.05, 0.01)
            place(drums, swish, at(bar, i), 0.5 if i % 2 else 0.25)
            tick = noise(int(0.04 * SR), rng, shape_band(4000, 10000)) * decay(int(0.04 * SR), 0.01, 0.001)
            place(drums, tick, at(bar, i + 0.5), 0.12)
            if i % 2 == 0:
                km = int(0.2 * SR)
                place(drums, np.sin(TAU * 55 * secs(km)) * decay(km, 0.06, 0.003), at(bar, i), 0.5)
    out = 0.5 * keys + 0.55 * low + 0.5 * lead + 0.3 * drums
    # Through the jukebox's speaker, in the corner of a diner.
    out = filt(out, shape_band(90, 6500))
    out = np.tanh(1.2 * out / (np.abs(out).max() + 1e-9))
    return reverb(out, 0.8, 0.2, rng, damp=4500)


# The pack --------------------------------------------------------------------------------

# slot: (maker, looped, how loud). Levels are RMS dBFS for beds and loops, peak dBFS for the
# short sounds and the sparse ones.
PACK = {
    "DayBirds": (day_birds, True, ("peak", -4)),
    "NightCrickets": (night_crickets, True, ("rms", -24)),
    "Wind": (wind, True, ("rms", -21)),
    "Rain": (rain, True, ("rms", -19)),
    "Thunder": (thunder, False, ("peak", -1)),
    "Creek": (creek, True, ("rms", -21)),
    "StoreHum": (store_hum, True, ("rms", -23)),
    "DinerChatter": (diner_chatter, True, ("rms", -22)),
    "Horn": (horn, False, ("peak", -2)),
    "SoftHum": (soft_hum, True, ("rms", -20)),
    "Engine": (engine, True, ("rms", -18)),
    "Rustle": (rustle, True, ("peak", -4)),
    "StoreChime": (store_chime, False, ("peak", -3)),
    "Chicken": (chicken, False, ("peak", -3)),
    "CounterBell": (counter_bell, False, ("peak", -3)),
    "IceCreamTune": (ice_cream_tune, True, ("rms", -17)),
    "Owl": (owl, False, ("peak", -3)),
    "Tractor": (tractor, True, ("rms", -18)),
    "Mower": (mower, True, ("rms", -19)),
    "Jukebox": (jukebox, True, ("rms", -17)),
    "Door": (door, False, ("peak", -4)),
    "Sip": (sip, False, ("peak", -6)),
}


def level(x, how):
    kind, db = how
    target = 10 ** (db / 20)
    if kind == "rms":
        x = x * target / (np.sqrt(np.mean(x ** 2)) + 1e-12)
    else:
        x = x * target / (np.abs(x).max() + 1e-12)
    peak = np.abs(x).max()
    ceiling = 10 ** (-1 / 20)
    if peak > ceiling:
        # Round off the odd loud peak rather than turning the whole thing down.
        x = np.tanh(x / ceiling) * ceiling
    return x


def write_ogg(path, x):
    x = np.atleast_2d(x)
    pcm = (np.clip(x, -1, 1) * 32767).astype("<i2").T.copy()
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        wav_path = tmp.name
    try:
        with wave.open(wav_path, "wb") as w:
            w.setnchannels(x.shape[0])
            w.setsampwidth(2)
            w.setframerate(SR)
            w.writeframes(pcm.tobytes())
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", wav_path, "-c:a", "libvorbis", "-q:a", "5", path],
            check=True,
        )
    finally:
        os.remove(wav_path)


def spectrogram(x, width=360, height=90):
    mono = np.atleast_2d(x).mean(axis=0)
    hop = max(1, len(mono) // width)
    win = 2048
    frames = []
    for i in range(width):
        seg = mono[i * hop: i * hop + win]
        if len(seg) < win:
            seg = np.pad(seg, (0, win - len(seg)))
        frames.append(np.abs(np.fft.rfft(seg * np.hanning(win)))[: win // 2])
    spec = 20 * np.log10(np.array(frames).T + 1e-6)
    # Log-frequency rows, 40 Hz to 16 kHz.
    rows = np.geomspace(40, 16000, height)
    idx = np.clip((rows / (SR / 2) * (win // 2)).astype(int), 0, win // 2 - 1)
    spec = spec[idx][::-1]
    spec = np.clip((spec - spec.max() + 70) / 70, 0, 1)
    return (spec * 255).astype(np.uint8)


def main():
    os.makedirs(OUT, exist_ok=True)
    only = set(sys.argv[1:])
    pictures = []
    print(f"{'slot':<14} {'sec':>5} {'ch':>2} {'peak dB':>8} {'rms dB':>7}  loop seam")
    for slot, (make, looped, how) in PACK.items():
        if only and slot not in only:
            continue
        x = np.atleast_2d(make())
        if not looped:
            fade = int(0.03 * SR)
            x[:, -fade:] *= np.linspace(1, 0, fade)
        x = level(x, how)
        write_ogg(os.path.join(OUT, f"{slot}.ogg"), x)
        peak = 20 * np.log10(np.abs(x).max() + 1e-12)
        rms = 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
        seam = ""
        if looped:
            # How big the jump from the last sample back to the first is, next to a typical step.
            step = np.median(np.abs(np.diff(x, axis=1))) + 1e-12
            jump = np.abs(x[:, 0] - x[:, -1]).max()
            seam = f"{jump / step:5.1f}x a normal step"
        print(f"{slot:<14} {x.shape[1] / SR:5.1f} {x.shape[0]:>2} {peak:8.1f} {rms:7.1f}  {seam}")
        pictures.append((slot, spectrogram(x)))
    if pictures and not only:
        from PIL import Image, ImageDraw

        cols = 2
        w, h = 360, 90
        sheet = Image.new("RGB", (cols * (w + 20) + 20, ((len(pictures) + 1) // 2) * (h + 34) + 20), (24, 24, 28))
        d = ImageDraw.Draw(sheet)
        for i, (slot, img) in enumerate(pictures):
            x0 = 20 + (i % cols) * (w + 20)
            y0 = 20 + (i // cols) * (h + 34)
            d.text((x0, y0), slot, fill=(230, 226, 214))
            sheet.paste(Image.fromarray(img).convert("RGB"), (x0, y0 + 16))
        sheet.save(os.path.join(OUT, "spectrograms.png"))
    print(f"Wrote {len(pictures)} sounds to {OUT}")


if __name__ == "__main__":
    main()
