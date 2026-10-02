import { channels, darken, type RGBA } from './color';

/** 아주 작은 픽셀 버퍼. 캔버스 없이 그리고 나중에 ImageData로 변환한다. */
export class PixBuf {
  readonly data: Uint32Array;

  constructor(readonly w: number, readonly h: number) {
    this.data = new Uint32Array(w * h);
  }

  get(x: number, y: number): RGBA {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.data[y * this.w + x];
  }

  set(x: number, y: number, c: RGBA): void {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || c === 0) return;
    this.data[y * this.w + x] = c;
  }

  /** 이미 칠해진 곳에만 칠하기 (음영 덧칠용) */
  over(x: number, y: number, c: RGBA): void {
    if (this.get(Math.round(x), Math.round(y)) !== 0) this.set(x, y, c);
  }

  clear(x: number, y: number): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.data[y * this.w + x] = 0;
  }

  rect(x: number, y: number, w: number, h: number, c: RGBA): void {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }

  hline(x0: number, x1: number, y: number, c: RGBA): void {
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.set(x, y, c);
  }

  vline(x: number, y0: number, y1: number, c: RGBA): void {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) this.set(x, y, c);
  }

  line(x0: number, y0: number, x1: number, y1: number, c: RGBA): void {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, c: RGBA): void {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x - cx) / (rx + 0.35);
        const ny = (y - cy) / (ry + 0.35);
        if (nx * nx + ny * ny <= 1) this.set(x, y, c);
      }
    }
  }

  /** 수평 대칭 (중심선 = (w-1)/2) */
  sym(x: number, y: number, c: RGBA): void {
    this.set(x, y, c);
    this.set(this.w - 1 - x, y, c);
  }

  symRect(x: number, y: number, w: number, h: number, c: RGBA): void {
    this.rect(x, y, w, h, c);
    this.rect(this.w - x - w, y, w, h, c);
  }

  /** 다른 버퍼를 (dx,dy) 오프셋으로 합성 */
  blit(src: PixBuf, dx: number, dy: number): void {
    for (let y = 0; y < src.h; y++) {
      for (let x = 0; x < src.w; x++) {
        const c = src.data[y * src.w + x];
        if (c !== 0) this.set(x + dx, y + dy, c);
      }
    }
  }

  /** 선택적 외곽선: 인접 픽셀 색을 어둡게 한 색으로 테두리 */
  outline(strength = 0.72, diagonal = false): void {
    const src = this.data.slice();
    const at = (x: number, y: number) => (x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : src[y * this.w + x]);
    const n4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const n8 = [...n4, [1, 1], [-1, 1], [1, -1], [-1, -1]];
    const ns = diagonal ? n8 : n4;
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (src[y * this.w + x] !== 0) continue;
        let best = 0;
        let bestL = 2;
        for (const [ox, oy] of ns) {
          const c = at(x + ox, y + oy);
          if (c === 0 || (c & 255) < 200) continue;
          const [r, g, b] = channels(c);
          const l = r + g + b;
          if (l < bestL || best === 0) { best = c; bestL = l; }
        }
        if (best !== 0) this.data[y * this.w + x] = darken(best, strength) | 0xff;
      }
    }
  }

  toImageData(): ImageData {
    const img = new ImageData(this.w, this.h);
    for (let i = 0; i < this.data.length; i++) {
      const [r, g, b, a] = channels(this.data[i]);
      img.data[i * 4] = r;
      img.data[i * 4 + 1] = g;
      img.data[i * 4 + 2] = b;
      img.data[i * 4 + 3] = a;
    }
    return img;
  }

  flipX(): PixBuf {
    const out = new PixBuf(this.w, this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) out.data[y * this.w + (this.w - 1 - x)] = this.data[y * this.w + x];
    return out;
  }
}
