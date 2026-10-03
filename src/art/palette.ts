// 절차적 색 생성: HSL 색 조화 규칙 + 종족별 피부 범위
import type { Rng } from '../core/rng';

export function hsl(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function toHsl(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? ((g - b) / d + (g < b ? 6 : 0)) * 60 : max === g ? ((b - r) / d + 2) * 60 : ((r - g) / d + 4) * 60;
  return [h, s, l];
}

export type HslRange = { h: [number, number]; s: [number, number]; l: [number, number] };

export function inRange(rng: Rng, r: HslRange): string {
  const h = r.h[0] <= r.h[1] ? rng.float(r.h[0], r.h[1]) : rng.float(r.h[0], r.h[1] + 360);
  return hsl(h, rng.float(r.s[0], r.s[1]), rng.float(r.l[0], r.l[1]));
}

/** 기본색 하나에서 [기본, 그림자, 밝음] (그림자는 보라 쪽, 밝음은 노란 쪽으로 색상 이동) */
export function skinTriad(base: string): [string, string, string] {
  const [h, s, l] = toHsl(base);
  const shadeH = h > 60 && h < 240 ? h + 12 : h - 10;
  return [base, hsl(shadeH, Math.min(1, s * 1.05), l * 0.8), hsl(h + 4, s * 0.9, Math.min(0.97, l + (1 - l) * 0.35))];
}

// 사람 피부 톤 곡선 (0 = 아주 밝음, 1 = 아주 어두움)
const TONE_ANCHORS: [number, number, number][] = [
  [28, 0.62, 0.9], [26, 0.6, 0.82], [27, 0.55, 0.72], [25, 0.48, 0.6], [22, 0.45, 0.47], [20, 0.42, 0.34], [18, 0.38, 0.24],
];

export function humanTone(rng: Rng, range: [number, number] = [0, 1]): string {
  const t = rng.float(range[0], range[1]) * (TONE_ANCHORS.length - 1);
  const i = Math.min(TONE_ANCHORS.length - 2, Math.floor(t));
  const f = t - i;
  const a = TONE_ANCHORS[i];
  const b = TONE_ANCHORS[i + 1];
  return hsl(a[0] + (b[0] - a[0]) * f + rng.float(-4, 4), a[1] + (b[1] - a[1]) * f + rng.float(-0.05, 0.05), a[2] + (b[2] - a[2]) * f + rng.float(-0.02, 0.02));
}

/** 목록 색을 살짝 흔들기 */
export function jitter(rng: Rng, hex: string, dh = 10, ds = 0.08, dl = 0.06): string {
  const [h, s, l] = toHsl(hex);
  return hsl(h + rng.float(-dh, dh), s + rng.float(-ds, ds), l + rng.float(-dl, dl));
}

const NATURAL_HAIR = [
  '#14100f', '#2b2028', '#3b2a22', '#5a3825', '#6e4529', '#8a5a2b', '#a0522d', '#b03a2e', '#c8642a', '#e07a2e',
  '#d9a35a', '#d9b25a', '#e8cf8a', '#f0e2a8', '#e8e8f0', '#b8b8c4', '#8a8a96', '#5a5a66',
];

export function randomHair(rng: Rng, explicit?: string[]): string {
  if (explicit?.length && rng.chance(0.55)) return jitter(rng, rng.pick(explicit), 8, 0.06, 0.05);
  if (rng.chance(0.55)) return jitter(rng, rng.pick(NATURAL_HAIR), 6, 0.05, 0.04);
  return hsl(rng.float(0, 360), rng.float(0.35, 0.85), rng.float(0.32, 0.78));
}

export function randomEye(rng: Rng, explicit?: string[]): string {
  if (explicit?.length && rng.chance(0.7)) return jitter(rng, rng.pick(explicit), 8, 0.05, 0.05);
  return hsl(rng.float(0, 360), rng.float(0.5, 0.9), rng.float(0.38, 0.6));
}

export type Scheme = 'complementary' | 'analogous' | 'triadic' | 'split' | 'mono' | 'neutral';
const METAL_TRIMS = ['#e2b84a', '#c0c8d8', '#b87333', '#1a1a22', '#f2f0e8'];

/** 의상 3색 [주색, 보조색, 테두리] — anchor가 있으면 그 색상 근처에서 시작 */
export function outfitColors(rng: Rng, anchor?: string): { main: string; accent: string; trim: string; scheme: Scheme } {
  const scheme = rng.pick<Scheme>(['complementary', 'analogous', 'triadic', 'split', 'mono', 'neutral', 'analogous', 'complementary']);
  let h: number;
  let s: number;
  let l: number;
  if (anchor && rng.chance(0.5)) {
    const a = toHsl(anchor);
    h = a[0] + rng.float(-25, 25);
    s = Math.max(0.05, a[1] + rng.float(-0.15, 0.15));
    l = Math.max(0.15, Math.min(0.85, a[2] + rng.float(-0.12, 0.12)));
  } else {
    h = rng.float(0, 360);
    s = rng.float(0.2, 0.75);
    l = rng.float(0.22, 0.62);
  }
  const main = hsl(h, s, l);
  let accent: string;
  switch (scheme) {
    case 'complementary': accent = hsl(h + 180, Math.min(1, s + 0.15), Math.min(0.75, l + 0.12)); break;
    case 'analogous': accent = hsl(h + rng.pick([-35, 35]), s, Math.min(0.8, l + 0.18)); break;
    case 'triadic': accent = hsl(h + 120, s, l + 0.08); break;
    case 'split': accent = hsl(h + 150 + rng.float(0, 60), s, l + 0.1); break;
    case 'mono': accent = hsl(h, s * 0.8, Math.min(0.85, l + 0.28)); break;
    default: {
      // 무채색 의상 + 선명한 포인트
      const grey = hsl(h, rng.float(0.02, 0.12), l);
      return { main: grey, accent: hsl(rng.float(0, 360), rng.float(0.6, 0.9), rng.float(0.45, 0.6)), trim: rng.pick(METAL_TRIMS), scheme };
    }
  }
  const trim = rng.chance(0.55) ? rng.pick(METAL_TRIMS) : hsl(h + 180, 0.3, rng.chance(0.5) ? 0.15 : 0.85);
  return { main, accent, trim, scheme };
}
