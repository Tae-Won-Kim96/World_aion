// 액세서리 16종: 얼굴(흉터·안대·안경·외알안경·복면·페이스페인트·문신·코걸이·반창고·파이프·점·다크서클·꿰맨자국)
//               목(목도리) · 머리장식(꽃·귀걸이)
import { darken, hex, mix, type RGBA, withAlpha } from '../color';
import type { LookSpec } from '../look';
import type { PixBuf } from '../pixbuf';
import { type Geo, GOLD, hashStr, LEATHER, OUTLINE_DARK, type Ramps } from './common';
import { onSkin } from './head';

const has = (s: LookSpec, a: string) => (s.accessories as string[]).includes(a);

/** 목도리: 몸통 다음, 머리 전에 */
export function drawScarf(b: PixBuf, s: LookSpec, g: Geo, R: Ramps): void {
  if (!has(s, 'scarf')) return;
  const { A, T } = R;
  const ox = g.ox;
  const y = g.torsoTop;
  for (let x = 16 - g.tw + 1; x <= 15 + g.tw - 1; x++) { b.set(x + ox, y, A[2]); b.set(x + ox, y + 1, (x & 1) ? A[1] : A[2]); }
  b.set(16 - g.tw + 1 + ox, y, A[3]);
  // 늘어진 끝
  for (let i = 2; i <= 6; i++) { b.set(13 + ox, y + i, i % 2 ? A[1] : A[2]); b.set(12 + ox, y + i, A[2]); }
  b.set(12 + ox, y + 7, T[3]); b.set(13 + ox, y + 7, T[2]);
}

/** 얼굴 액세서리: 얼굴 다음, 앞머리 전에 */
export function drawFaceAccessories(b: PixBuf, s: LookSpec, g: Geo, R: Ramps): void {
  if (s.feat.skull) return;
  const y = g.headTop;
  const ox = g.ox;
  const { kr, A } = R;
  const P = (x: number, yy: number, c: RGBA) => b.set(x + ox, y + yy, c);
  const S = (x: number, yy: number, c: RGBA) => onSkin(b, R, x + ox, y + yy, c);
  const h = hashStr(s.key + 'acc');
  const flip = h & 1; // 좌우
  const fx = (x: number) => (flip ? 31 - x : x);
  for (const a of s.accessories) {
    switch (a) {
      case 'scar': {
        const c = mix(kr[1], hex('#b04050'), 0.45);
        for (let i = 0; i < 6; i++) S(fx(19 + Math.floor(i / 2)), 6 + i, c);
        break;
      }
      case 'eyepatch': {
        const x0 = flip ? 19 : 9;
        b.rect(x0 + ox, y + 8, 4, 3, OUTLINE_DARK);
        P(x0 + 1, 8, hex('#3a3040'));
        b.line(x0 + (flip ? 3 : 0) + ox, y + 8, (flip ? 24 : 7) + ox, y + 4, OUTLINE_DARK);
        b.line(x0 + (flip ? 0 : 3) + ox, y + 8, (flip ? 18 : 13) + ox, y + 5, OUTLINE_DARK);
        break;
      }
      case 'glasses': {
        const F = h & 2 ? hex('#2a2030') : GOLD[1];
        const lens = withAlpha(hex('#e8f4ff'), 90);
        for (const x0 of [9, 19]) {
          b.hline(x0 + ox, x0 + 3 + ox, y + 7, F); b.hline(x0 + ox, x0 + 3 + ox, y + 11, F);
          b.vline(x0 + ox, y + 7, y + 11, F); b.vline(x0 + 3 + ox, y + 7, y + 11, F);
          for (let yy = 8; yy <= 10; yy++) for (let xx = x0 + 1; xx <= x0 + 2; xx++) if (!b.get(xx + ox, y + yy)) P(xx, yy, lens);
        }
        b.hline(13 + ox, 18 + ox, y + 8, F);
        break;
      }
      case 'monocle': {
        const x0 = flip ? 9 : 19;
        b.hline(x0 + ox, x0 + 3 + ox, y + 7, GOLD[2]); b.hline(x0 + ox, x0 + 3 + ox, y + 12, GOLD[1]);
        b.vline(x0 + ox, y + 8, y + 11, GOLD[2]); b.vline(x0 + 3 + ox, y + 8, y + 11, GOLD[1]);
        P(x0 + 2, 8, hex('#ffffff', 200));
        for (let i = 1; i <= 4; i++) P(x0 + (flip ? 0 : 3) + (flip ? -1 : 1) * Math.floor(i / 3), 12 + i, GOLD[1]);
        break;
      }
      case 'mask': {
        const C = A;
        for (let yy = 11; yy <= 14; yy++) {
          const k = yy >= 13 ? 7 - (yy - 13) : 8;
          for (let x = 16 - k; x <= 15 + k; x++) P(x, yy, yy === 11 ? C[3] : C[2]);
        }
        P(9, 12, C[1]); P(22, 12, C[1]);
        break;
      }
      case 'facepaint': {
        const c = h & 4 ? hex('#e8e8f0') : (h & 8 ? hex('#c02a3a') : A[3]);
        for (const x of [10, 21]) { S(x, 5, c); S(x, 6, c); S(x, 12, c); S(x, 13, c); }
        if (h & 16) { S(15, 4, c); S(16, 4, c); S(15, 5, c); S(16, 5, c); }
        break;
      }
      case 'tattoo': {
        const c = mix(kr[1], hex('#2a4a8a'), 0.6);
        S(fx(21), 10, c); S(fx(22), 11, c); S(fx(21), 12, c); S(fx(22), 13, c); S(fx(20), 13, c);
        break;
      }
      case 'nosering':
        P(16, 12, GOLD[3]);
        break;
      case 'bandage': {
        const c = hex('#f0d8b8');
        if (h & 2) {
          // 이마 붕대
          for (let x = 9; x <= 22; x++) S(x, 5, x % 3 ? c : darken(c, 0.15));
          S(20, 4, hex('#c04040'));
        } else {
          const x0 = fx(19);
          S(x0, 11, c); S(x0 + 1, 11, c); S(x0 + 2, 11, c); S(x0, 12, c); S(x0 + 1, 12, darken(c, 0.2)); S(x0 + 2, 12, c);
          S(x0 + 1, 11, darken(c, 0.15));
        }
        break;
      }
      case 'pipe': {
        P(17, 13, LEATHER[1]); P(18, 13, LEATHER[2]); P(19, 13, LEATHER[2]);
        P(20, 12, LEATHER[1]); P(21, 12, LEATHER[2]); P(20, 11, LEATHER[3]); P(21, 11, LEATHER[2]);
        P(21, 9, hex('#d8d8e0', 150)); P(22, 8, hex('#d8d8e0', 110)); P(21, 7, hex('#d8d8e0', 80));
        break;
      }
      case 'beautymark':
        S(fx(20), 12, darken(kr[1], 0.5));
        break;
      case 'eyebags': {
        const c = mix(kr[1], hex('#5a3a7a'), 0.4);
        for (const x of [10, 11, 20, 21]) S(x, 12, c);
        break;
      }
      case 'stitches': {
        const c = darken(kr[0], 0.3);
        for (let i = 0; i < 6; i++) { S(fx(9 + i), 12 + (i % 2), c); if (i % 2 === 0) S(fx(9 + i), 11, c); }
        break;
      }
    }
  }
}

/** 머리 장식: 앞머리·모자 다음 */
export function drawOrnaments(b: PixBuf, s: LookSpec, g: Geo, R: Ramps): void {
  const y = g.headTop;
  const ox = g.ox;
  const h = hashStr(s.key + 'orn');
  if (has(s, 'flower') && !['greathelm', 'helm', 'buckethelm', 'plaguemask'].includes(s.head)) {
    const petal = [hex('#ff8ab0'), hex('#fff2a0'), hex('#a0c8ff'), hex('#ffffff'), hex('#ff6a4a')][h % 5];
    const x = h & 8 ? 9 : 21;
    b.set(x + ox, y + 2, petal); b.set(x + 1 + ox, y + 3, petal); b.set(x - 1 + ox, y + 3, petal); b.set(x + ox, y + 4, petal);
    b.set(x + ox, y + 3, hex('#ffd04a'));
  }
  if (has(s, 'earring') && !['greathelm', 'hood', 'veil'].includes(s.head)) {
    const c = h & 2 ? GOLD[3] : hex('#c0d8ff');
    b.set(7 + ox, y + 11, c);
    if (h & 4) b.set(7 + ox, y + 12, R.A[3]);
    if (h & 16) b.set(24 + ox, y + 11, c);
  }
}
