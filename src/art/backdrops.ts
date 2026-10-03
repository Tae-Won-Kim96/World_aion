// 320x180 저해상도 배경 (4배 확대해서 1280x720)
import { darken, hex, lighten, mix, ramp, withAlpha } from './color';
import { PixBuf } from './pixbuf';
import { Rng } from '../core/rng';
import type { BackdropStyle } from '../core/data/dungeons';

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

export interface TownFacilities { forge: number; infirmary: number; memorial: number }

export function drawTownBackdrop(graves: number, fac: TownFacilities = { forge: 0, infirmary: 0, memorial: 0 }, seed = 7): PixBuf {
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
  // 성채 (재건 거점)
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
  drawFacilities(b, fac);
  // 안개
  for (let y = GROUND_Y - 8; y < GROUND_Y + 6; y++) {
    for (let x = 0; x < BG_W; x++) if ((x + y * 3) % 7 === 0) b.set(x, y, withAlpha(lighten(hex('#4a4070'), 0.2), 60));
  }
  return b;
}

function blend(b: PixBuf, x: number, y: number, c: number, t: number): void {
  x = Math.round(x); y = Math.round(y);
  if (x < 0 || y < 0 || x >= b.w || y >= b.h) return;
  b.set(x, y, mix(b.get(x, y), c, t));
}

function gear(b: PixBuf, cx: number, cy: number, r: number, c: number, hole: number): void {
  b.ellipse(cx, cy, r, r, c);
  const teeth = Math.max(6, Math.round(r * 0.8));
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * Math.PI * 2;
    b.rect(Math.round(cx + Math.cos(a) * (r + 1)) - 1, Math.round(cy + Math.sin(a) * (r + 1)) - 1, 3, 3, c);
  }
  b.ellipse(cx, cy, r * 0.35, r * 0.35, hole);
}

export function drawDungeonBackdrop(skyTop: string, skyBottom: string, floor: string, accent: string, seed = 3, style: BackdropStyle = 'columns'): PixBuf {
  const b = new PixBuf(BG_W, BG_H);
  const rng = new Rng(seed);
  sky(b, skyTop, skyBottom, BG_H);
  const black = hex('#000000');
  const sil = mix(hex(skyTop), black, 0.3);       // 가까운 실루엣
  const far = mix(hex(skyBottom), hex(skyTop), 0.55); // 먼 실루엣
  const acc = hex(accent);
  const floorY = BG_H - 26;
  switch (style) {
    case 'columns':
      for (let i = 0; i < 7; i++) {
        const x = 10 + i * 48 + rng.int(-6, 6);
        const w = rng.int(10, 16);
        b.rect(x, 20, w, BG_H - 20, sil);
        b.rect(x - 2, 20, w + 4, 4, sil);
        b.rect(x - 2, BG_H - 30, w + 4, 4, sil);
      }
      break;
    case 'cave': {
      // 먼 동굴 벽 + 종유석/석순
      for (let x = 0; x < BG_W; x++) {
        const top = 14 + Math.round(Math.sin(x * 0.07 + seed) * 6 + Math.sin(x * 0.23) * 3);
        for (let y = 0; y < top; y++) b.set(x, y, sil);
        const back = floorY - 30 + Math.round(Math.sin(x * 0.05 + 1) * 8);
        for (let y = back; y < floorY; y++) b.set(x, y, far);
      }
      for (let i = 0; i < 16; i++) {
        const x = rng.int(0, BG_W - 1);
        const len = rng.int(12, 46);
        const w = rng.int(3, 7);
        for (let j = 0; j < len; j++) { const k = Math.round(w * (1 - j / len)); b.hline(x - k, x + k, 12 + j, sil); }
      }
      for (let i = 0; i < 10; i++) {
        const x = rng.int(0, BG_W - 1);
        const len = rng.int(10, 34);
        const w = rng.int(3, 6);
        for (let j = 0; j < len; j++) { const k = Math.round(w * (1 - j / len)); b.hline(x - k, x + k, floorY - j, sil); }
      }
      // 빛나는 결정·용암 줄기
      for (let i = 0; i < 6; i++) {
        const x = rng.int(4, BG_W - 4);
        const y = rng.int(30, floorY - 20);
        b.set(x, y, acc); b.set(x, y - 1, withAlpha(acc, 180)); b.set(x + 1, y, withAlpha(acc, 140));
      }
      break;
    }
    case 'forest': {
      for (let x = 0; x < BG_W; x++) {
        const h = floorY - 40 + Math.round(Math.sin(x * 0.09 + seed) * 6 + Math.sin(x * 0.31) * 4);
        for (let y = h; y < floorY; y++) b.set(x, y, far);
      }
      for (let i = 0; i < 9; i++) {
        const x = 8 + i * 36 + rng.int(-8, 8);
        const w = rng.int(4, 8);
        b.rect(x, 0, w, floorY, sil);
        // 뿌리
        b.line(x, floorY - 1, x - 6, floorY + 2, sil); b.line(x + w - 1, floorY - 1, x + w + 5, floorY + 2, sil);
        // 뒤틀린 가지
        for (let k = 0; k < 3; k++) {
          const y0 = rng.int(20, 90);
          const dir = rng.chance(0.5) ? -1 : 1;
          const len = rng.int(10, 22);
          const sx = dir < 0 ? x : x + w - 1;
          b.line(sx, y0, sx + dir * len, y0 - rng.int(6, 14), sil);
          b.line(sx, y0 + 1, sx + dir * len, y0 - rng.int(4, 12), sil);
        }
      }
      // 우거진 수관
      for (let i = 0; i < 26; i++) b.ellipse(rng.int(0, BG_W), rng.int(-4, 14), rng.int(10, 20), rng.int(6, 12), sil);
      // 덩굴
      for (let i = 0; i < 14; i++) { const x = rng.int(0, BG_W - 1); b.vline(x, 10, 10 + rng.int(10, 40), sil); }
      break;
    }
    case 'pipes': {
      const pipe = mix(sil, hex(floor), 0.2);
      const hi = lighten(pipe, 0.15);
      for (let i = 0; i < 4; i++) {
        const y = 18 + i * 26 + rng.int(-4, 4);
        const t = rng.int(5, 9);
        b.rect(0, y, BG_W, t, pipe); b.hline(0, BG_W, y, hi);
        for (let x = rng.int(10, 40); x < BG_W; x += rng.int(40, 70)) b.rect(x, y - 1, 4, t + 2, darken(pipe, 0.25));
      }
      for (let i = 0; i < 6; i++) {
        const x = rng.int(0, BG_W - 10);
        const t = rng.int(6, 10);
        b.rect(x, 0, t, floorY, pipe); b.vline(x, 0, floorY, hi);
        b.rect(x - 1, rng.int(40, 100), t + 2, 4, darken(pipe, 0.25));
      }
      // 배수구 아치와 떨어지는 물방울
      for (let i = 0; i < 3; i++) {
        const cx = 50 + i * 110 + rng.int(-10, 10);
        b.ellipse(cx, floorY - 2, 16, 14, darken(sil, 0.4));
        for (let y = floorY - 14; y < floorY; y += 3) b.set(cx + rng.int(-6, 6), y, withAlpha(acc, 150));
      }
      for (let i = 0; i < 20; i++) { const x = rng.int(0, BG_W - 1); const y = rng.int(20, floorY - 4); b.vline(x, y, y + 1, withAlpha(acc, 120)); }
      break;
    }
    case 'peaks': {
      const snow = mix(hex('#ffffff'), hex(skyBottom), 0.2);
      for (let layer = 0; layer < 2; layer++) {
        const c = layer === 0 ? far : sil;
        const top = layer === 0 ? 40 : 78;
        const amp = layer === 0 ? 46 : 40;
        const f = layer === 0 ? 0.021 : 0.034;
        for (let x = 0; x < BG_W; x++) {
          // |sin| 의 뾰족한 골을 뒤집어 봉우리로 쓴다
          const h = top + Math.round(Math.abs(Math.sin(x * f + seed + layer * 1.7)) * amp + Math.sin(x * 0.27 + layer) * 1.5);
          for (let y = h; y < floorY; y++) b.set(x, y, c);
          const cap = Math.max(0, 9 - Math.round((h - top) * 0.6)) + (x % 3 === 0 ? 1 : 0);
          for (let y = h; y < h + cap; y++) b.set(x, y, mix(c, snow, layer === 0 ? 0.45 : 0.7));
        }
      }
      for (let i = 0; i < 70; i++) b.set(rng.int(0, BG_W - 1), rng.int(0, floorY), withAlpha(snow, rng.int(120, 220)));
      break;
    }
    case 'factory': {
      for (let i = 0; i < 5; i++) {
        const x = 10 + i * 66 + rng.int(-6, 6);
        const w = rng.int(12, 20);
        const top = rng.int(10, 50);
        b.rect(x, top, w, floorY - top, sil);
        b.rect(x - 2, top, w + 4, 3, darken(sil, 0.2));
        for (let k = 0; k < 4; k++) blend(b, x + w / 2 + rng.int(-3, 3), top - 3 - k * 4, hex('#9a9090'), 0.4 - k * 0.08);
      }
      for (let i = 0; i < 6; i++) {
        const r = rng.int(8, 18);
        gear(b, rng.int(r, BG_W - r), rng.int(30, floorY - r), r, far, hex(skyTop));
      }
      for (let x = 0; x < BG_W; x += 4) b.set(x, 40 + Math.round(Math.sin(x * 0.1) * 2), sil); // 전선
      break;
    }
    case 'dunes': {
      b.ellipse(250, 40, 18, 18, mix(acc, hex('#ffffff'), 0.4));
      for (let a = 0; a < 360; a += 8) blend(b, 250 + Math.cos((a * Math.PI) / 180) * 24, 40 + Math.sin((a * Math.PI) / 180) * 24, acc, 0.4);
      // 피라미드
      for (let p = 0; p < 2; p++) {
        const cx = 70 + p * 90 + rng.int(-10, 10);
        const h = 40 - p * 12;
        for (let j = 0; j < h; j++) b.hline(cx - j, cx + j, floorY - 26 - h + j + 10, j % 6 === 0 ? darken(far, 0.1) : far);
      }
      for (let layer = 0; layer < 2; layer++) {
        const c = layer === 0 ? mix(far, hex(floor), 0.3) : mix(sil, hex(floor), 0.4);
        for (let x = 0; x < BG_W; x++) {
          const h = floorY - 20 + layer * 10 + Math.round(Math.sin(x * (0.03 + layer * 0.02) + seed + layer) * 7);
          for (let y = h; y < floorY; y++) b.set(x, y, c);
        }
      }
      break;
    }
    case 'clouds': {
      const cloud = mix(hex('#ffffff'), hex(skyBottom), 0.25);
      for (let i = 0; i < 12; i++) {
        const cx = rng.int(0, BG_W);
        const cy = rng.int(20, 110);
        for (let k = 0; k < 4; k++) b.ellipse(cx + k * 9 - 13, cy + (k % 2) * 2, rng.int(8, 13), rng.int(4, 7), withAlpha(cloud, 200));
      }
      // 떠 있는 섬과 부서진 기둥
      const rock = mix(sil, hex(floor), 0.35);
      const grass = mix(acc, hex(floor), 0.5);
      for (let i = 0; i < 4; i++) {
        const cx = 40 + i * 80 + rng.int(-12, 12);
        const cy = rng.int(60, 104);
        const w = rng.int(18, 30);
        for (let x = cx - w; x <= cx + w; x++) {
          const edge = 1 - Math.abs(x - cx) / w;
          const depth = Math.round(4 + edge * rng.int(8, 16));
          for (let y = cy; y < cy + depth; y++) b.set(x, y, y < cy + 2 ? grass : (x + y) % 5 === 0 ? darken(rock, 0.2) : rock);
        }
        for (const c of [-0.5, 0.35]) {
          const px = Math.round(cx + c * w);
          const h = rng.int(8, 22);
          b.rect(px - 2, cy - h, 5, h, sil); b.rect(px - 3, cy - 2, 7, 2, sil);
          b.set(px - 2, cy - h - 1, sil); b.set(px, cy - h - 2, sil); // 부러진 끝
        }
      }
      break;
    }
    case 'tent': {
      const s1 = mix(acc, black, 0.55);
      const s2 = mix(hex(skyBottom), black, 0.4);
      for (let y = 0; y < floorY; y++) {
        const k = y / floorY;
        for (let x = 0; x < BG_W; x++) {
          const rel = (x - BG_W / 2) / (0.25 + k * 0.75);
          if (Math.floor((rel + 1000) / 20) % 2 === 0) blend(b, x, y, s1, 0.4);
          else blend(b, x, y, s2, 0.35);
        }
      }
      // 장식 깃발 줄
      for (let row = 0; row < 2; row++) {
        const y0 = 26 + row * 22;
        for (let x = 0; x < BG_W; x += 12) {
          const y = y0 + Math.round(Math.sin((x / BG_W) * Math.PI * 2) * 4);
          const c = [acc, hex('#c0392b'), hex('#2e86de')][(x / 12 + row) % 3];
          for (let j = 0; j < 5; j++) b.hline(x + j, x + 8 - j, y + j, mix(c, black, 0.3));
        }
      }
      // 무대 조명
      for (let i = 0; i < 2; i++) {
        const cx = 90 + i * 140;
        for (let y = 0; y < floorY; y++) { const w = y * 0.35; for (let x = cx - w; x <= cx + w; x++) if ((x + y) % 2 === 0) blend(b, x, y, acc, 0.08); }
      }
      break;
    }
    case 'void': {
      for (let i = 0; i < 120; i++) b.set(rng.int(0, BG_W - 1), rng.int(0, floorY), withAlpha(hex('#ffffff'), rng.int(60, 200)));
      // 갈라진 균열
      for (let i = 0; i < 5; i++) {
        let x = rng.int(0, BG_W);
        let y = rng.int(0, 40);
        for (let s = 0; s < 18; s++) {
          const nx = x + rng.int(-8, 8);
          const ny = y + rng.int(4, 9);
          b.line(x, y, nx, ny, acc);
          b.line(x + 1, y, nx + 1, ny, withAlpha(lighten(acc, 0.4), 160));
          x = nx; y = ny;
          if (y > floorY) break;
        }
      }
      // 떠다니는 파편
      for (let i = 0; i < 14; i++) {
        const cx = rng.int(0, BG_W);
        const cy = rng.int(10, floorY - 10);
        const r = rng.int(2, 6);
        for (let j = 0; j < r * 2; j++) { const k = Math.round(r - Math.abs(r - j)); b.hline(cx - k, cx + k, cy - r + j, sil); }
        b.set(cx, cy - r, acc);
      }
      break;
    }
  }
  // 바닥
  const F = ramp(floor);
  for (let y = floorY; y < BG_H; y++) for (let x = 0; x < BG_W; x++) b.set(x, y, (x + y) % 9 === 0 ? F[1] : darken(F[2], 0.4));
  // 떠도는 빛
  for (let i = 0; i < 30; i++) b.set(rng.int(0, BG_W - 1), rng.int(10, BG_H - 30), withAlpha(acc, rng.int(60, 160)));
  return b;
}

/** 거점 시설: 0단계는 폐허, 단계가 오를수록 커진다 */
function drawFacilities(b: PixBuf, fac: TownFacilities): void {
  const G = GROUND_Y;
  const stone = ramp('#4a4258');
  const wood = ramp('#5a3e2a');
  const fire = hex('#ff9a3a');
  // ---- 대장간
  const fx = 148; // 성채 오른쪽에 붙은 별채
  if (fac.forge === 0) {
    for (let i = 0; i < 9; i++) b.hline(fx + i, fx + 30 - i, G - 1 - Math.floor(i / 2), i % 2 ? stone[1] : stone[0]);
    b.set(fx + 12, G - 6, stone[2]); b.set(fx + 20, G - 4, stone[2]);
  } else {
    const w = fac.forge >= 2 ? 34 : 26;
    const x0 = fx;
    b.rect(x0, G - 20, w, 20, stone[1]);
    for (let i = 0; i < 8; i++) b.hline(x0 - 2 + i, x0 + w + 1 - i, G - 20 - i, wood[1]);
    b.rect(x0 + 4, G - 34, 5, 16, stone[0]); // 굴뚝
    b.rect(x0 + 10, G - 10, 8, 10, hex('#1a0f0a'));
    b.rect(x0 + 11, G - 8, 6, 8, fire); b.hline(x0 + 11, x0 + 16, G - 8, hex('#ffd45a'));
    for (let i = 0; i < 4; i++) b.set(x0 + 6 + (i % 2), G - 37 - i * 3, withAlpha(hex('#8a8498'), 160 - i * 30)); // 연기
    if (fac.forge >= 2) { b.rect(x0 + 24, G - 5, 6, 3, stone[3]); b.rect(x0 + 26, G - 2, 2, 2, stone[0]); } // 모루
    if (fac.forge >= 3) {
      b.rect(x0 + w - 7, G - 38, 4, 18, stone[0]);
      b.vline(x0 + w + 3, G - 36, G - 20, wood[0]);
      b.rect(x0 + w + 4, G - 36, 6, 8, hex('#a83a2a')); b.set(x0 + w + 6, G - 33, hex('#ffd45a'));
    }
  }
  // ---- 치유소 (성채와 묘지 사이)
  const ix = 190;
  if (fac.infirmary === 0) {
    b.line(ix, G - 1, ix + 8, G - 12, wood[1]); b.line(ix + 18, G - 1, ix + 12, G - 9, wood[1]);
    b.hline(ix + 2, ix + 16, G - 1, hex('#8a8070'));
  } else if (fac.infirmary < 3) {
    const cloth = ramp('#d8d0c0');
    for (let i = 0; i < 14; i++) b.hline(ix + 10 - Math.floor(i * 0.75), ix + 10 + Math.floor(i * 0.75), G - 14 + i, i % 3 === 0 ? cloth[1] : cloth[2]);
    b.vline(ix + 10, G - 16, G - 1, wood[0]);
    b.rect(ix + 8, G - 5, 5, 5, hex('#2a2030'));
    b.hline(ix + 8, ix + 12, G - 10, hex('#c02a3a')); b.vline(ix + 10, G - 12, G - 8, hex('#c02a3a'));
    if (fac.infirmary >= 2) { b.vline(ix + 21, G - 12, G - 1, wood[0]); b.rect(ix + 20, G - 15, 3, 3, hex('#ffd45a')); }
  } else {
    b.rect(ix, G - 18, 22, 18, ramp('#8a7a6a')[2]);
    for (let i = 0; i < 7; i++) b.hline(ix - 2 + i, ix + 23 - i, G - 18 - i, wood[1]);
    b.rect(ix + 8, G - 8, 6, 8, hex('#2a2030'));
    b.rect(ix + 3, G - 14, 4, 4, hex('#ffcf6a')); b.rect(ix + 15, G - 14, 4, 4, hex('#ffcf6a'));
    b.hline(ix + 9, ix + 13, G - 22, hex('#c02a3a')); b.vline(ix + 11, G - 24, G - 20, hex('#c02a3a'));
  }
  // ---- 추모비 (묘지 안쪽)
  const mx = 262;
  if (fac.memorial === 0) {
    b.rect(mx - 4, G - 4, 9, 4, stone[1]); b.set(mx - 2, G - 6, stone[2]);
  } else {
    const hgt = [0, 14, 22, 30][fac.memorial];
    const S = ramp('#9a96b0');
    b.rect(mx - 6, G - 3, 13, 3, S[1]);
    for (let i = 0; i < hgt; i++) {
      const k = 3 - Math.floor((i / hgt) * 2);
      b.hline(mx - k, mx + k, G - 3 - i, i % 5 === 0 ? S[3] : S[2]);
      b.set(mx + k, G - 3 - i, S[1]);
    }
    b.set(mx, G - 3 - hgt, S[4]);
    if (fac.memorial >= 2) {
      const fy = G - 5 - hgt;
      b.set(mx, fy, hex('#7fe3ff')); b.set(mx, fy - 1, hex('#bff4ff')); b.set(mx - 1, fy, withAlpha(hex('#7fe3ff'), 160)); b.set(mx + 1, fy, withAlpha(hex('#7fe3ff'), 160));
    }
    if (fac.memorial >= 3) {
      for (let a = 0; a < 360; a += 30) {
        const x = mx + Math.cos((a * Math.PI) / 180) * 9;
        const y = G - 3 - hgt * 0.6 + Math.sin((a * Math.PI) / 180) * 5;
        b.set(x, y, withAlpha(hex('#7fe3ff'), 110));
      }
    }
  }
}
