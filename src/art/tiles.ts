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

export type ObstacleKind = 'grave' | 'pillar' | 'rubble' | 'coral' | 'bones' | 'candle';

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
