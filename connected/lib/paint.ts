// Paint's pixel helpers, kept apart from the component so tests can run them.

export function hexToRgba(hex: string): [number, number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

/** Scanline flood fill from (x, y) with `color`. Returns false if nothing changed. */
export function floodFill(img: { width: number; height: number; data: Uint8ClampedArray }, x: number, y: number, color: [number, number, number, number], tolerance = 24): boolean {
  const { width: w, height: h, data } = img;
  const i0 = (y * w + x) * 4;
  const target = [data[i0], data[i0 + 1], data[i0 + 2], data[i0 + 3]];
  if (target.every((v, k) => Math.abs(v - color[k]) <= 2)) return false;
  const match = (i: number) => Math.abs(data[i] - target[0]) <= tolerance && Math.abs(data[i + 1] - target[1]) <= tolerance && Math.abs(data[i + 2] - target[2]) <= tolerance && Math.abs(data[i + 3] - target[3]) <= tolerance;
  const seen = new Uint8Array(w * h);
  const stack = [x, y];
  while (stack.length) {
    const cy = stack.pop()!;
    let cx = stack.pop()!;
    while (cx >= 0 && !seen[cy * w + cx] && match((cy * w + cx) * 4)) cx--;
    cx++;
    let up = false;
    let down = false;
    while (cx < w && !seen[cy * w + cx] && match((cy * w + cx) * 4)) {
      const p = cy * w + cx;
      seen[p] = 1;
      data.set(color, p * 4);
      if (cy > 0) {
        const m = !seen[p - w] && match((p - w) * 4);
        if (m && !up) stack.push(cx, cy - 1);
        up = m;
      }
      if (cy < h - 1) {
        const m = !seen[p + w] && match((p + w) * 4);
        if (m && !down) stack.push(cx, cy + 1);
        down = m;
      }
      cx++;
    }
  }
  return true;
}
