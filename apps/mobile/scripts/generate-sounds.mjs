// Generates BuildBrief's interaction sounds as small WAV files, using the same
// notes as the website's sound effects. Run: node scripts/generate-sounds.mjs
// Loudness: each sound is normalised and gently soft-clipped so it plays
// clearly even on phone speakers; volume is then adjustable in Settings.
import fs from "node:fs";
import path from "node:path";

const RATE = 44100;
const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5, E6 = 1318.5, G6 = 1568;

const SOUNDS = {
  tap: [{ f: 880, at: 0, dur: 0.07, wave: "triangle", g: 0.7 }],
  copy: [
    { f: 1175, at: 0, dur: 0.05, wave: "triangle", g: 0.6 },
    { f: 1568, at: 0.06, dur: 0.07, wave: "triangle", g: 0.6 },
  ],
  start: [{ f: 320, at: 0, dur: 0.3, wave: "triangle", g: 0.9, slide: 760 }],
  success: [
    { f: E5, at: 0, dur: 0.12, wave: "triangle" },
    { f: G5, at: 0.09, dur: 0.18, wave: "triangle" },
  ],
  complete: [
    { f: C5, at: 0, dur: 0.14, wave: "triangle" },
    { f: E5, at: 0.09, dur: 0.14, wave: "triangle" },
    { f: G5, at: 0.18, dur: 0.14, wave: "triangle" },
    { f: C6, at: 0.27, dur: 0.4, wave: "triangle" },
  ],
  fanfare: [
    { f: G5, at: 0, dur: 0.12, wave: "triangle" },
    { f: C6, at: 0.1, dur: 0.12, wave: "triangle" },
    { f: E6, at: 0.2, dur: 0.12, wave: "triangle" },
    { f: G6, at: 0.3, dur: 0.5, wave: "triangle", g: 0.8 },
    { f: C6, at: 0.3, dur: 0.5, wave: "sine", g: 0.6 },
    { f: E6, at: 0.3, dur: 0.5, wave: "sine", g: 0.5 },
  ],
  error: [
    { f: 392, at: 0, dur: 0.16, wave: "triangle", g: 0.9 },
    { f: 294, at: 0.14, dur: 0.26, wave: "triangle", g: 0.9 },
  ],
};

function osc(wave, phase) {
  const p = phase - Math.floor(phase);
  if (wave === "sine") return Math.sin(2 * Math.PI * p);
  return 1 - 4 * Math.abs(p - 0.5); // triangle
}

function render(notes) {
  const length = Math.ceil((Math.max(...notes.map((n) => n.at + n.dur)) + 0.05) * RATE);
  const out = new Float32Array(length);
  for (const n of notes) {
    const start = Math.floor(n.at * RATE);
    const total = Math.floor(n.dur * RATE);
    let phase = 0;
    for (let i = 0; i < total && start + i < length; i++) {
      const t = i / RATE;
      const freq = n.slide ? n.f * Math.pow(n.slide / n.f, i / total) : n.f;
      phase += freq / RATE;
      const attack = Math.min(1, t / 0.012);
      const release = Math.pow(0.0001, i / total); // exponential decay
      out[start + i] += osc(n.wave, phase) * (n.g ?? 1) * attack * release;
    }
  }
  // Normalise, then soft-clip for loudness without harsh distortion.
  let peak = 0;
  for (const v of out) peak = Math.max(peak, Math.abs(v));
  const drive = 2.2 / (peak || 1);
  const norm = Math.tanh(2.2);
  for (let i = 0; i < out.length; i++) out[i] = (Math.tanh(out[i] * drive) / norm) * 0.97;
  return out;
}

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((v, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), i * 2));
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

const dir = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "assets", "sounds");
fs.mkdirSync(dir, { recursive: true });
for (const [name, notes] of Object.entries(SOUNDS)) {
  fs.writeFileSync(path.join(dir, `${name}.wav`), wav(render(notes)));
}
console.log("Wrote", Object.keys(SOUNDS).length, "sounds to", dir);
