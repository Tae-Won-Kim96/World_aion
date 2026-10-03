// 타일, 장애물, 투사체, 이펙트, 묘비 등 환경 픽셀아트
import { darken, hex, lighten, mix, ramp, type RGBA, withAlpha } from './color';
import { PixBuf } from './pixbuf';
import { Rng } from '../core/rng';
import type { FxKind } from '../core/types';

export const TILE = 32;

/** 바닥 타일 4종 변형을 가로로 */
export function drawFloorTiles(colors: [string, string, string], seed: number): PixBuf {
  const b = new PixBuf(TILE * 4, TILE);
  const base = hex(colors[0]);
  const dark = hex(colors[1]);
  const light = hex(colors[2]);
  for (let v = 0; v < 4; v++) {
    const rng = new Rng(seed + v * 31);
    const ox = v * TILE;
    // 석판 2x2
    for (let y = 0; y < TILE; y++) {
      for (let x = 0; x < TILE; x++) {
        let c = base;
        const n = rng.next();
        if (n < 0.08) c = mix(base, dark, 0.5);
        else if (n > 0.95) c = mix(base, light, 0.4);
        b.set(ox + x, y, c);
      }
    }
    for (let i = 0; i < TILE; i++) {
      b.set(ox + i, 0, light);
      b.set(ox, i, light);
      b.set(ox + i, TILE - 1, dark);
      b.set(ox + TILE - 1, i, dark);
      if (v % 2 === 0) b.set(ox + i, 15, dark);
      if (v % 2 === 0 && i > 15) b.set(ox + 16, i, dark);
      if (v % 2 === 1 && i < 16) b.set(ox + 12, i, dark);
    }
    // 균열
    if (v === 3) {
      let x = 6, y = 6;
      for (let i = 0; i < 14; i++) {
        b.set(ox + x, y, darken(dark, 0.3));
        x += rng.int(0, 1);
        y += 1;
      }
    }
    // 이끼/물기 점
    for (let i = 0; i < 3; i++) b.set(ox + rng.int(3, 28), rng.int(3, 28), lighten(light, 0.2));
  }
  return b;
}

export type ObstacleKind =
  | 'grave' | 'pillar' | 'rubble' | 'coral' | 'bones' | 'candle'
  | 'crystal' | 'mushroom' | 'tree' | 'gear' | 'ice' | 'lava' | 'cactus' | 'crate' | 'barrel' | 'stalagmite' | 'totem' | 'statue' | 'web' | 'cage';

export function drawObstacle(kind: ObstacleKind, accent: string): PixBuf {
  const b = new PixBuf(32, 40);
  const S = ramp('#8a8796');
  const A = ramp(accent);
  switch (kind) {
    case 'grave': {
      for (let y = 14; y <= 36; y++) {
        const k = y < 18 ? [3, 5, 6, 7][y - 14] : 7;
        b.hline(16 - k, 15 + k, y, S[2]);
        b.set(16 - k, y, S[3]);
        b.set(15 + k, y, S[1]);
      }
      b.vline(15, 20, 28, S[0]); b.vline(16, 20, 28, S[0]);
      b.hline(12, 19, 23, S[0]);
      b.hline(8, 23, 36, darken(S[1], 0.2));
      b.set(11, 33, hex('#5a8a4a')); b.set(12, 34, hex('#5a8a4a')); b.set(20, 34, hex('#5a8a4a'));
      break;
    }
    case 'pillar': {
      for (let y = 6; y <= 37; y++) {
        b.hline(10, 21, y, S[2]);
        b.set(10, y, S[3]); b.set(11, y, S[3]); b.set(20, y, S[1]); b.set(21, y, S[1]);
        if (y % 2 === 0) b.set(15, y, S[1]);
      }
      b.hline(8, 23, 5, S[3]); b.hline(8, 23, 6, S[2]); b.hline(8, 23, 37, S[1]); b.hline(8, 23, 36, S[2]);
      b.set(14, 14, S[0]); b.set(15, 15, S[0]); b.set(15, 16, S[0]); b.set(16, 17, S[0]);
      break;
    }
    case 'rubble': {
      b.ellipse(12, 32, 5, 4, S[2]); b.ellipse(20, 33, 4, 3, S[1]); b.ellipse(16, 28, 4, 3, S[3]);
      b.set(14, 26, S[4]); b.set(11, 30, S[3]);
      break;
    }
    case 'coral': {
      const C = ramp('#e0607a');
      b.line(16, 37, 16, 18, C[2]); b.line(16, 28, 10, 20, C[2]); b.line(16, 25, 22, 16, C[3]); b.line(12, 22, 9, 15, C[1]);
      b.line(15, 37, 15, 22, C[1]);
      for (const [x, y] of [[10, 20], [22, 16], [9, 15], [16, 18]]) b.ellipse(x, y, 1, 1, C[4]);
      b.ellipse(16, 37, 5, 1, hex('#3a4a4a'));
      break;
    }
    case 'bones': {
      const B = ramp('#e8e0c8');
      b.line(9, 34, 22, 31, B[2]); b.line(10, 30, 21, 35, B[1]);
      b.ellipse(16, 29, 3, 3, B[2]); b.rect(15, 29, 1, 1, hex('#1a1018')); b.rect(17, 29, 1, 1, hex('#1a1018'));
      b.set(8, 34, B[3]); b.set(23, 31, B[3]);
      break;
    }
    case 'candle': {
      for (const [x, h] of [[11, 8], [16, 12], [21, 6]] as [number, number][]) {
        b.rect(x - 1, 37 - h, 3, h, hex('#e8dcc0'));
        b.set(x + 1, 37 - h, hex('#c8bca0'));
        b.set(x, 36 - h, A[3]); b.set(x, 35 - h, hex('#ffe680')); b.set(x, 34 - h, withAlpha(hex('#fff6c0'), 200));
      }
      b.hline(8, 24, 37, hex('#6a5a4a'));
      break;
    }
    case 'crystal': {
      for (const [x, h, w] of [[16, 22, 4], [10, 13, 3], [22, 11, 3]] as [number, number, number][]) {
        for (let j = 0; j < h; j++) {
          const k = j < 4 ? Math.round((j / 4) * w) : w;
          b.hline(x - k, x + k, 15 + (22 - h) + j, A[2]);
          b.set(x - k, 15 + (22 - h) + j, A[4]); b.set(x + k, 15 + (22 - h) + j, A[1]);
        }
        b.vline(x, 18 + (22 - h), 36, A[3]);
      }
      b.ellipse(16, 37, 9, 1.5, darken(A[0], 0.3));
      break;
    }
    case 'mushroom': {
      const M = ramp(mix(A[2], hex('#c04a6a'), 0.5));
      b.rect(14, 24, 4, 13, hex('#e8dcc0')); b.vline(17, 24, 36, hex('#c8bca0'));
      for (let j = 0; j < 8; j++) { const k = [5, 8, 10, 11, 11, 10, 9, 7][j]; b.hline(16 - k, 15 + k, 16 + j, j < 2 ? M[3] : M[2]); }
      for (const [x, y] of [[11, 19], [18, 18], [22, 21], [14, 21]]) b.set(x, y, hex('#fff6e0'));
      b.rect(7, 31, 2, 6, hex('#e8dcc0')); b.ellipse(8, 30, 3, 2, M[1]);
      b.rect(23, 33, 2, 4, hex('#e8dcc0')); b.ellipse(24, 32, 2.5, 1.5, M[2]);
      break;
    }
    case 'tree': {
      const T = ramp('#4a3424');
      const L = ramp(mix(hex('#2e4a2a'), A[1], 0.25));
      b.rect(14, 20, 5, 17, T[2]); b.vline(14, 20, 36, T[3]); b.vline(18, 20, 36, T[1]);
      b.line(14, 36, 10, 38, T[1]); b.line(18, 36, 22, 38, T[1]);
      b.line(15, 24, 9, 17, T[2]); b.line(18, 22, 23, 15, T[2]);
      b.ellipse(16, 10, 10, 8, L[1]); b.ellipse(10, 14, 6, 5, L[2]); b.ellipse(22, 13, 6, 5, L[2]); b.ellipse(15, 7, 6, 4, L[3]);
      b.set(12, 6, L[4]); b.set(20, 9, L[4]);
      break;
    }
    case 'gear': {
      const G = ramp('#a88a4a');
      b.ellipse(16, 24, 9, 9, G[2]);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        b.rect(Math.round(16 + Math.cos(a) * 10) - 1, Math.round(24 + Math.sin(a) * 10) - 1, 3, 3, G[2]);
      }
      b.ellipse(16, 24, 6, 6, G[1]); b.ellipse(16, 24, 3, 3, G[3]); b.ellipse(16, 24, 1.5, 1.5, hex('#1a1410'));
      b.ellipse(13, 21, 2, 1, G[4]);
      b.rect(10, 34, 12, 3, ramp('#5a5048')[1]);
      break;
    }
    case 'ice': {
      const I = ramp('#9ad8ff');
      for (let y = 12; y <= 36; y++) {
        const k = Math.min(9, Math.round((y - 12) * 0.5) + 2);
        b.hline(16 - k, 15 + k, y, (y + Math.floor(y / 3)) % 7 === 0 ? I[3] : I[2]);
        b.set(16 - k, y, I[4]); b.set(15 + k, y, I[1]);
      }
      b.line(12, 16, 9, 26, I[4]); b.line(19, 18, 22, 30, I[3]);
      b.ellipse(16, 37, 10, 1.5, I[0]);
      break;
    }
    case 'lava': {
      const R = ramp('#3a2a28');
      const Lv = ramp('#ff6a2a');
      b.ellipse(16, 33, 12, 5, R[2]); b.ellipse(16, 33, 9, 3.5, Lv[2]); b.ellipse(15, 32, 6, 2, Lv[3]); b.ellipse(14, 32, 2, 1, hex('#ffe680'));
      b.set(12, 28, withAlpha(Lv[3], 200)); b.set(19, 26, withAlpha(Lv[3], 160)); b.set(16, 24, withAlpha(hex('#8a8090'), 140));
      b.ellipse(6, 34, 3, 2, R[1]); b.ellipse(26, 35, 3, 2, R[1]);
      break;
    }
    case 'cactus': {
      const C = ramp('#4a8a4a');
      b.rect(14, 12, 5, 25, C[2]); b.vline(14, 12, 36, C[3]); b.vline(18, 12, 36, C[1]); b.hline(15, 17, 11, C[2]);
      b.rect(8, 20, 3, 8, C[2]); b.hline(8, 14, 27, C[2]); b.vline(8, 20, 27, C[3]);
      b.rect(21, 16, 3, 8, C[2]); b.hline(18, 23, 23, C[2]); b.vline(23, 16, 23, C[1]);
      for (let y = 14; y < 36; y += 4) { b.set(13, y, hex('#e8dcc0')); b.set(19, y + 2, hex('#e8dcc0')); }
      b.set(16, 10, hex('#ff7aa0')); b.ellipse(16, 37, 7, 1.5, hex('#8a6e44'));
      break;
    }
    case 'crate': {
      const W = ramp('#8a6a3a');
      b.rect(7, 20, 18, 17, W[2]);
      b.hline(7, 24, 20, W[3]); b.hline(7, 24, 36, W[1]); b.vline(7, 20, 36, W[3]); b.vline(24, 20, 36, W[1]);
      b.hline(7, 24, 28, W[1]); b.line(8, 21, 23, 35, W[1]); b.line(8, 22, 22, 35, W[3]);
      b.rect(12, 12, 10, 8, W[2]); b.hline(12, 21, 12, W[3]); b.vline(21, 12, 19, W[1]); b.hline(12, 21, 16, W[1]);
      break;
    }
    case 'barrel': {
      const W = ramp('#7a5030');
      for (let y = 16; y <= 37; y++) {
        const k = 6 + Math.round(Math.sin(((y - 16) / 21) * Math.PI) * 2);
        b.hline(16 - k, 15 + k, y, W[2]); b.set(16 - k, y, W[3]); b.set(15 + k, y, W[1]);
      }
      for (const y of [19, 26, 34]) b.hline(8, 23, y, hex('#4a4a52'));
      b.ellipse(16, 16, 6, 1.5, W[3]); b.ellipse(16, 16, 4, 1, W[1]);
      b.set(18, 30, mix(W[2], A[2], 0.6)); b.set(18, 31, mix(W[2], A[2], 0.6));
      break;
    }
    case 'stalagmite': {
      for (const [x, h, w] of [[16, 26, 6], [9, 14, 3], [24, 18, 4]] as [number, number, number][]) {
        for (let j = 0; j < h; j++) {
          const k = Math.round(w * (j / h));
          b.hline(x - k, x + k, 37 - h + j, S[2]);
          b.set(x - k, 37 - h + j, S[3]); b.set(x + k, 37 - h + j, S[1]);
        }
      }
      b.set(16, 13, withAlpha(A[3], 200));
      break;
    }
    case 'totem': {
      const W = ramp('#6a4a2a');
      b.rect(12, 8, 8, 29, W[2]); b.vline(12, 8, 36, W[3]); b.vline(19, 8, 36, W[1]);
      for (const y of [10, 20, 29]) {
        b.rect(13, y + 1, 2, 2, A[3]); b.rect(17, y + 1, 2, 2, A[3]);
        b.hline(13, 18, y + 5, W[0]); b.hline(11, 20, y + 7, W[1]);
      }
      b.line(11, 9, 6, 6, W[2]); b.line(20, 9, 25, 6, W[2]); b.set(16, 6, hex('#e8e0c8')); b.set(15, 7, hex('#e8e0c8')); b.set(17, 7, hex('#e8e0c8'));
      break;
    }
    case 'statue': {
      b.rect(9, 32, 14, 5, S[1]); b.hline(9, 22, 32, S[3]);
      b.rect(12, 18, 8, 14, S[2]); b.vline(12, 18, 31, S[3]); b.vline(19, 18, 31, S[1]);
      b.ellipse(16, 13, 4, 4, S[2]); b.set(14, 12, S[0]); b.set(17, 12, S[0]);
      b.line(12, 20, 8, 26, S[2]); b.line(19, 20, 24, 16, S[2]); b.vline(25, 6, 22, S[3]);
      b.line(13, 26, 18, 30, S[1]); // 금
      b.set(10, 33, hex('#5a8a4a')); b.set(21, 34, hex('#5a8a4a'));
      break;
    }
    case 'web': {
      const Wb = withAlpha(hex('#e8e8f0'), 200);
      const cx = 16, cy = 22;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        b.line(cx, cy, cx + Math.cos(a) * 14, cy + Math.sin(a) * 14, Wb);
      }
      for (const r of [4, 8, 12]) for (let a = 0; a < 360; a += 12) b.set(cx + Math.cos((a * Math.PI) / 180) * r, cy + Math.sin((a * Math.PI) / 180) * r, Wb);
      b.ellipse(19, 19, 2, 2, hex('#1a1418')); b.set(18, 18, A[3]);
      break;
    }
    case 'cage': {
      const I = ramp('#5a5a66');
      for (let a = 0; a < 360; a += 8) b.set(16 + Math.cos((a * Math.PI) / 180) * 9, 12 + Math.sin((a * Math.PI) / 180) * 3, I[1]);
      for (let x = 8; x <= 24; x += 4) b.vline(x, 12, 36, x < 16 ? I[3] : I[2]);
      b.hline(7, 25, 36, I[1]); b.hline(7, 25, 24, I[2]);
      b.vline(16, 4, 9, I[2]); b.set(16, 3, I[3]);
      b.ellipse(15, 33, 3, 2, hex('#e8e0c8')); b.set(14, 32, hex('#1a1018'));
      break;
    }
  }
  b.outline(0.7);
  return b;
}

const FX_COLORS: Record<FxKind, string> = {
  slash: '#ffffff', pierce: '#e8f0ff', blunt: '#ffe8b0', arrow: '#c8a070', bolt: '#9ad8ff', fire: '#ff8a3a',
  ice: '#bff0ff', holy: '#ffe680', dark: '#a05aff', poison: '#8ae05a', nature: '#6ad05a', heal: '#7affa0',
  buff: '#ffd45a', shout: '#ff6a4a', blood: '#e0203a', water: '#4ac8e8', gear: '#d0b070', music: '#ff9ad8',
};

export function fxColor(fx: FxKind): string {
  return FX_COLORS[fx] ?? '#ffffff';
}

/** 투사체 12x12 */
export function drawProjectile(fx: FxKind): PixBuf {
  const b = new PixBuf(12, 12);
  const c = hex(fxColor(fx));
  const R = ramp(c);
  if (fx === 'arrow' || fx === 'pierce') {
    b.hline(1, 8, 6, hex('#8a5a33'));
    b.set(9, 6, hex('#d8dde8')); b.set(10, 6, hex('#ffffff')); b.set(9, 5, hex('#a9b2c3')); b.set(9, 7, hex('#a9b2c3'));
    b.set(1, 5, hex('#e8e8e8')); b.set(2, 5, hex('#e8e8e8')); b.set(1, 7, hex('#e8e8e8')); b.set(2, 7, hex('#e8e8e8'));
    return b;
  }
  if (fx === 'music') {
    b.vline(7, 2, 8, R[2]); b.ellipse(5.5, 8.5, 1.5, 1, R[2]); b.set(8, 2, R[3]); b.set(9, 3, R[3]);
    return b;
  }
  b.ellipse(6, 6, 3, 3, R[1]);
  b.ellipse(6, 6, 2, 2, R[2]);
  b.ellipse(5.5, 5.5, 1, 1, R[4]);
  b.set(1, 6, withAlpha(R[2], 160)); b.set(2, 5, withAlpha(R[3], 200)); b.set(2, 7, withAlpha(R[2], 160));
  return b;
}

/** 타격 이펙트 4프레임 (32x32 각) */
export function drawHitFx(fx: FxKind): PixBuf {
  const N = 4;
  const b = new PixBuf(32 * N, 32);
  const c = hex(fxColor(fx));
  const R = ramp(c);
  for (let f = 0; f < N; f++) {
    const ox = f * 32;
    const t = (f + 1) / N;
    if (fx === 'slash' || fx === 'pierce' || fx === 'blood') {
      const r = 6 + f * 3;
      for (let a = -60; a <= 60; a += 6) {
        const rad = ((a - 30 + f * 15) * Math.PI) / 180;
        const x = 16 + Math.cos(rad) * r;
        const y = 16 + Math.sin(rad) * r;
        b.set(ox + x, y, f < 2 ? R[4] : R[2]);
        b.set(ox + x - 1, y, f < 2 ? R[2] : R[1]);
      }
    } else if (fx === 'heal' || fx === 'buff' || fx === 'holy' || fx === 'nature' || fx === 'music' || fx === 'shout') {
      for (let i = 0; i < 6; i++) {
        const x = 6 + ((i * 7) % 20);
        const y = 26 - f * 5 - (i % 3) * 3;
        b.set(ox + x, y, R[3]); b.set(ox + x, y - 1, R[4]);
        if (fx === 'heal') { b.set(ox + x - 1, y, R[2]); b.set(ox + x + 1, y, R[2]); }
      }
      if (fx === 'holy') b.vline(ox + 16, 0, Math.round(30 * t), withAlpha(R[4], 220));
    } else {
      const r = 3 + f * 3;
      const ring = (rr: number, col: RGBA) => {
        for (let a = 0; a < 360; a += 10) {
          const rad = (a * Math.PI) / 180;
          b.set(ox + 16 + Math.cos(rad) * rr, 16 + Math.sin(rad) * rr, col);
        }
      };
      if (f < 2) b.ellipse(ox + 16, 16, r - 1, r - 1, withAlpha(R[3], 230));
      ring(r, R[2]);
      if (f > 0) ring(r + 2, withAlpha(R[1], 180));
      for (let i = 0; i < 4; i++) {
        const rad = ((i * 90 + f * 20) * Math.PI) / 180;
        b.set(ox + 16 + Math.cos(rad) * (r + 4), 16 + Math.sin(rad) * (r + 4), R[4]);
      }
    }
  }
  return b;
}

export function drawTombstone(): PixBuf {
  const b = new PixBuf(32, 40);
  const S = ramp('#9a96a8');
  for (let y = 18; y <= 36; y++) {
    const k = y < 21 ? [2, 4, 5][y - 18] : 5;
    b.hline(16 - k, 15 + k, y, S[2]);
    b.set(16 - k, y, S[3]);
    b.set(15 + k, y, S[1]);
  }
  b.vline(15, 22, 30, S[0]); b.vline(16, 22, 30, S[0]); b.hline(13, 18, 25, S[0]);
  b.ellipse(16, 37, 8, 1.5, hex('#4a3a2a'));
  b.outline(0.7);
  return b;
}

export function drawCoffin(): PixBuf {
  const b = new PixBuf(32, 40);
  const W = ramp('#4a2a3a');
  for (let y = 16; y <= 37; y++) {
    const k = y < 20 ? 3 + (y - 16) : y < 24 ? 7 : Math.max(3, 7 - Math.floor((y - 24) / 4));
    b.hline(16 - k, 15 + k, y, W[2]);
    b.set(16 - k, y, W[3]); b.set(15 + k, y, W[1]);
  }
  b.vline(15, 20, 30, hex('#c9a227')); b.hline(13, 18, 23, hex('#c9a227'));
  b.outline(0.7);
  return b;
}

/** 던전 노드 아이콘 16x16 */
export function drawNodeIcon(kind: string): PixBuf {
  const b = new PixBuf(16, 16);
  const col: Record<string, string> = { battle: '#d0d0d8', elite: '#ff7a5a', event: '#ffd45a', rest: '#ff9a3a', treasure: '#e9c46a', boss: '#ff3a5a', start: '#8ad0ff', shop: '#7ad0a0' };
  const R = ramp(col[kind] ?? '#ffffff');
  switch (kind) {
    case 'battle': b.line(3, 12, 12, 3, R[3]); b.line(4, 12, 13, 3, R[2]); b.line(3, 3, 12, 12, R[3]); b.line(4, 3, 13, 12, R[2]); b.hline(2, 5, 10, hex('#8a5a33')); b.hline(10, 13, 10, hex('#8a5a33')); break;
    case 'elite': b.ellipse(8, 7, 5, 5, R[2]); b.rect(5, 6, 2, 2, hex('#1a1018')); b.rect(9, 6, 2, 2, hex('#1a1018')); b.hline(5, 10, 11, R[1]); b.set(3, 2, R[3]); b.set(12, 2, R[3]); break;
    case 'event': b.rect(6, 2, 4, 8, R[2]); b.rect(6, 12, 4, 3, R[2]); b.set(6, 2, R[4]); break;
    case 'rest': b.line(3, 13, 12, 13, hex('#8a5a33')); b.ellipse(8, 9, 3, 4, R[2]); b.ellipse(8, 10, 1.5, 2, hex('#ffe680')); break;
    case 'treasure': b.rect(2, 6, 12, 8, hex('#8a5a33')); b.rect(2, 6, 12, 3, R[2]); b.rect(7, 8, 2, 3, R[4]); break;
    case 'boss': b.ellipse(8, 8, 6, 6, R[1]); b.rect(4, 6, 3, 3, hex('#ffe680')); b.rect(9, 6, 3, 3, hex('#ffe680')); for (let x = 3; x <= 12; x += 2) b.set(x, 12, hex('#ffffff')); b.set(2, 1, R[3]); b.set(13, 1, R[3]); b.set(3, 2, R[3]); b.set(12, 2, R[3]); break;
    case 'shop': b.ellipse(8, 9, 5, 5, R[2]); b.vline(8, 4, 14, R[4]); b.hline(6, 10, 7, R[4]); b.hline(6, 10, 11, R[4]); break;
    default: b.ellipse(8, 8, 4, 4, R[2]); b.ellipse(8, 8, 2, 2, R[4]);
  }
  b.outline(0.7);
  return b;
}

export function drawStar(on: boolean): PixBuf {
  const b = new PixBuf(9, 9);
  const c = on ? ramp('#ffd45a') : ramp('#4a4458');
  const rows = ['....#....', '...###...', '#########', '.#######.', '..#####..', '.###.###.', '.##...##.', '#.......#', '.........'];
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '#') b.set(x, y, y < 3 ? c[3] : c[2]); }));
  b.set(4, 1, c[4]);
  return b;
}
