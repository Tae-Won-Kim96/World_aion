// 320x180 저해상도 배경 (4배 확대해서 1280x720)
import { darken, hex, lighten, mix, ramp, withAlpha } from './color';
import { PixBuf } from './pixbuf';
import { Rng } from '../core/rng';

export const BG_W = 320;
export const BG_H = 180;
export const GROUND_Y = 142;

function sky(b: PixBuf, top: string, bottom: string, horizon: number): void {
  const t = hex(top);
  const bt = hex(bottom);
  for (let y = 0; y < horizon; y++) {
    const k = y / horizon;
    for (let x = 0; x < b.w; x++) {
      // 4단계 밴드 + 디더링
      const band = Math.floor(k * 6) / 6;
      const next = Math.min(1, band + 1 / 6);
      const frac = k * 6 - Math.floor(k * 6);
      const useNext = frac > 0.5 && (x + y) % 2 === 0;
      b.set(x, y, mix(t, bt, useNext ? next : band));
    }
  }
}

export function drawTownBackdrop(graves: number, seed = 7): PixBuf {
  const b = new PixBuf(BG_W, BG_H);
  const rng = new Rng(seed);
  sky(b, '#07060f', '#2c2148', GROUND_Y);
  // 별
  for (let i = 0; i < 90; i++) {
    const x = rng.int(0, BG_W - 1);
    const y = rng.int(0, GROUND_Y - 40);
    b.set(x, y, rng.chance(0.2) ? hex('#ffffff') : hex('#8a84b0'));
  }
  // 달
  b.ellipse(262, 34, 13, 13, hex('#f4ecc8'));
  b.ellipse(258, 31, 3, 2, hex('#dcd2a8'));
  b.ellipse(267, 39, 2, 2, hex('#dcd2a8'));
  b.ellipse(266, 28, 1.5, 1.5, hex('#dcd2a8'));
  for (let a = 0; a < 360; a += 6) {
    const r = 17;
    const x = 262 + Math.cos((a * Math.PI) / 180) * r;
    const y = 34 + Math.sin((a * Math.PI) / 180) * r;
    if ((a / 6) % 2 === 0) b.set(x, y, withAlpha(hex('#f4ecc8'), 90));
  }
  // 먼 산
  for (let x = 0; x < BG_W; x++) {
    const h1 = 100 + Math.round(Math.sin(x * 0.03) * 8 + Math.sin(x * 0.11) * 3);
    for (let y = h1; y < GROUND_Y; y++) b.set(x, y, hex('#1c1630'));
    const h2 = 118 + Math.round(Math.sin(x * 0.05 + 2) * 6 + Math.sin(x * 0.17) * 2);
    for (let y = h2; y < GROUND_Y; y++) b.set(x, y, hex('#161126'));
  }
  // 저택
  const W = ramp('#2a2236');
  const lit = hex('#ffcf6a');
  const litD = hex('#d08a3a');
  const mx = 70;
  b.rect(mx, 78, 110, GROUND_Y - 78, W[1]);
  for (let i = 0; i < 26; i++) b.hline(mx - 6 + i, mx + 116 - i, 78 - i, W[0]); // 지붕
  b.rect(mx - 20, 60, 26, GROUND_Y - 60, W[2]); // 탑
  for (let i = 0; i < 22; i++) b.hline(mx - 22 + Math.floor(i / 1.6), mx + 8 - Math.floor(i / 1.6), 60 - i, W[0]);
  b.vline(mx - 7, 24, 38, W[0]);
  b.set(mx - 6, 25, hex('#8a1a3a')); b.set(mx - 5, 26, hex('#8a1a3a')); b.set(mx - 6, 27, hex('#8a1a3a'));
  b.rect(mx + 120 - 16, 64, 20, 14, W[1]);
  // 창문
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 6; col++) {
      const x = mx + 8 + col * 17;
      const y = 86 + row * 16;
      const on = rng.chance(0.55);
      b.rect(x, y, 6, 9, on ? lit : hex('#141020'));
      if (on) { b.rect(x, y + 6, 6, 3, litD); b.vline(x + 3, y, y + 8, W[0]); }
    }
  }
  for (let row = 0; row < 3; row++) {
    const on = row !== 1;
    b.rect(mx - 12, 70 + row * 18, 8, 10, on ? lit : hex('#141020'));
  }
  b.rect(mx + 48, GROUND_Y - 22, 14, 22, hex('#120c18'));
  b.ellipse(mx + 55, GROUND_Y - 22, 7, 4, hex('#120c18'));
  b.set(mx + 59, GROUND_Y - 11, hex('#c9a227'));
  // 땅
  const G = ramp('#1f1a2c');
  for (let y = GROUND_Y; y < BG_H; y++) {
    for (let x = 0; x < BG_W; x++) {
      let c = G[2];
      if ((x * 13 + y * 7) % 23 === 0) c = G[3];
      if ((x * 5 + y * 11) % 31 === 0) c = G[1];
      b.set(x, y, c);
    }
  }
  for (let x = 0; x < BG_W; x += 2) if (rng.chance(0.6)) b.set(x, GROUND_Y - 1, hex('#2a3a2a'));
  // 길
  for (let y = GROUND_Y; y < BG_H; y++) {
    const w = 8 + (y - GROUND_Y) * 1.4;
    const cx = mx + 55 + (y - GROUND_Y) * 0.6;
    b.hline(Math.round(cx - w / 2), Math.round(cx + w / 2), y, mix(G[2], hex('#4a3a3a'), 0.4));
  }
  // 묘지 울타리 + 묘비
  const fx0 = 214;
  const fx1 = 314;
  b.hline(fx0, fx1, GROUND_Y - 6, hex('#3a3448'));
  b.hline(fx0, fx1, GROUND_Y - 11, hex('#3a3448'));
  for (let x = fx0; x <= fx1; x += 5) { b.vline(x, GROUND_Y - 14, GROUND_Y, hex('#4a4458')); b.set(x, GROUND_Y - 15, hex('#6a6478')); }
  // 고목
  const T = hex('#1a1424');
  b.vline(300, GROUND_Y - 44, GROUND_Y, T); b.vline(301, GROUND_Y - 40, GROUND_Y, T);
  b.line(300, GROUND_Y - 30, 290, GROUND_Y - 44, T); b.line(301, GROUND_Y - 36, 312, GROUND_Y - 50, T); b.line(296, GROUND_Y - 38, 292, GROUND_Y - 52, T);
  const S = ramp('#8a86a0');
  const n = Math.min(graves, 18);
  for (let i = 0; i < n; i++) {
    const col = i % 6;
    const row = Math.floor(i / 6);
    const x = fx0 + 10 + col * 14 + (row % 2) * 6;
    const y = GROUND_Y + 6 + row * 10;
    b.rect(x - 3, y - 7, 7, 8, S[2]);
    b.hline(x - 2, x + 2, y - 8, S[2]);
    b.set(x - 3, y - 7, S[3]); b.vline(x + 3, y - 7, y, S[1]);
    b.vline(x, y - 6, y - 3, S[0]); b.hline(x - 1, x + 1, y - 5, S[0]);
    b.hline(x - 4, x + 4, y + 1, darken(G[2], 0.3));
  }
  if (graves === 0) {
    b.set(fx0 + 50, GROUND_Y + 10, hex('#4a6a4a'));
  }
  // 안개
  for (let y = GROUND_Y - 8; y < GROUND_Y + 6; y++) {
    for (let x = 0; x < BG_W; x++) if ((x + y * 3) % 7 === 0) b.set(x, y, withAlpha(lighten(hex('#4a4070'), 0.2), 60));
  }
  return b;
}

export function drawDungeonBackdrop(skyTop: string, skyBottom: string, floor: string, accent: string, seed = 3): PixBuf {
  const b = new PixBuf(BG_W, BG_H);
  const rng = new Rng(seed);
  sky(b, skyTop, skyBottom, BG_H);
  // 기둥 실루엣
  for (let i = 0; i < 7; i++) {
    const x = 10 + i * 48 + rng.int(-6, 6);
    const w = rng.int(10, 16);
    const c = mix(hex(skyTop), hex('#000000'), 0.3);
    b.rect(x, 20, w, BG_H - 20, c);
    b.rect(x - 2, 20, w + 4, 4, c);
    b.rect(x - 2, BG_H - 30, w + 4, 4, c);
  }
  // 바닥
  const F = ramp(floor);
  for (let y = BG_H - 26; y < BG_H; y++) for (let x = 0; x < BG_W; x++) b.set(x, y, (x + y) % 9 === 0 ? F[1] : darken(F[2], 0.4));
  // 떠도는 빛
  for (let i = 0; i < 30; i++) b.set(rng.int(0, BG_W - 1), rng.int(10, BG_H - 30), withAlpha(hex(accent), rng.int(60, 160)));
  return b;
}
