// 모자 30종
import { darken, hex, mix, ramp, type RGBA, withAlpha } from '../color';
import type { LookSpec } from '../look';
import type { PixBuf } from '../pixbuf';
import { BONE, GOLD, type Geo, HEAD_H, HEAD_HW, hashStr, LEATHER, OUTLINE_DARK, type Ramp, type Ramps, span } from './common';

/** 얼굴을 완전히 가리는 모자 (얼굴·앞머리 생략) */
export function coversFace(head: string): boolean {
  return head === 'greathelm';
}

export function drawHeadgear(b: PixBuf, s: LookSpec, g: Geo, R: Ramps): void {
  const y = g.headTop;
  const ox = g.ox;
  const { M, A, X } = R;
  const capRows = (from: number, to: number, r: Ramp, extra = 1) => {
    for (let i = from; i <= to; i++) {
      const k = HEAD_HW[Math.max(0, i)] + (i >= 2 ? extra : 0);
      span(b, k, y + i, r[2], ox);
      b.set(16 - k + ox, y + i, r[3]);
      b.set(15 + k + ox, y + i, r[1]);
    }
  };
  const P = (x: number, yy: number, c: RGBA) => b.set(x + ox, y + yy, c);
  switch (s.head) {
    case 'none': return;
    case 'helm': {
      capRows(0, 6, X);
      span(b, 9, y + 6, X[1], ox);
      b.hline(12 + ox, 13 + ox, y + 2, X[4]);
      b.vline(15 + ox, y + 6, y + 9, X[1]); b.vline(16 + ox, y + 6, y + 9, X[0]);
      for (let i = -3; i <= 0; i++) b.hline(15 + ox, 16 + ox, y + i, i === -3 ? M[3] : M[2]);
      P(17, -2, M[1]); P(18, -1, M[1]);
      break;
    }
    case 'greathelm': {
      for (let i = 0; i < HEAD_H; i++) {
        const k = HEAD_HW[i] + (i >= 2 && i <= 11 ? 1 : 0);
        span(b, k, y + i, X[2], ox);
        b.set(16 - k + ox, y + i, X[3]);
        b.set(15 + k + ox, y + i, X[1]);
      }
      b.hline(9 + ox, 22 + ox, y + 8, OUTLINE_DARK);
      b.hline(10 + ox, 21 + ox, y + 9, X[0]);
      b.vline(15 + ox, y + 1, y + 13, X[3]);
      for (const x of [12, 14, 17, 19]) P(x, 11, X[0]);
      b.hline(11 + ox, 13 + ox, y + 2, X[4]);
      for (let i = -3; i <= 0; i++) { P(15, i, M[2]); P(16, i, M[1]); P(17, i + 1, M[2]); }
      break;
    }
    case 'wizard': case 'witch': {
      const brimK = s.head === 'witch' ? 12 : 11;
      span(b, brimK, y + 5, M[1], ox);
      span(b, brimK - 1, y + 4, M[2], ox);
      span(b, 8, y + 3, A[2], ox);
      const h = s.head === 'witch' ? 10 : 9;
      for (let i = 0; i < h; i++) {
        const k = Math.max(1, Math.round(7 - i * 0.7));
        const bend = i > h - 4 ? i - (h - 4) : 0;
        span(b, k, y + 2 - i, i % 4 === 0 ? M[3] : M[2], ox + bend);
        b.set(15 + k + ox + bend, y + 2 - i, M[1]);
      }
      const tipX = 16 + ox + 4;
      b.set(tipX, y + 2 - h, M[1]);
      if (s.head === 'wizard') { P(13, 0, GOLD[3]); P(12, -1, GOLD[2]); P(14, -1, GOLD[2]); }
      else b.set(tipX + 1, y + 3 - h, M[1]);
      break;
    }
    case 'hood': {
      const H = ['robe', 'cloak', 'cassock'].includes(s.outfit) ? M : A;
      for (let i = -1; i < HEAD_H; i++) {
        const k = HEAD_HW[Math.max(0, Math.min(HEAD_H - 1, i))] + 1;
        const yy = y + i;
        if (i <= 6) span(b, k, yy, H[2], ox);
        else { b.hline(16 - k + ox, 18 - k + ox, yy, H[2]); b.hline(13 + k + ox, 15 + k + ox, yy, H[1]); }
        b.set(16 - k + ox, yy, H[3]); b.set(15 + k + ox, yy, H[1]);
      }
      span(b, 7, y + 6, H[1], ox);
      b.hline(12 + ox, 14 + ox, y + 1, H[3]);
      break;
    }
    case 'mitre': {
      for (let i = 0; i < 9; i++) span(b, Math.max(2, 6 - Math.floor(i / 2)), y + 3 - i, i % 3 === 0 ? M[3] : M[2], ox);
      b.vline(15 + ox, y - 5, y + 3, GOLD[2]); b.vline(16 + ox, y - 5, y + 3, GOLD[1]);
      b.hline(13 + ox, 18 + ox, y - 1, GOLD[2]);
      span(b, 7, y + 4, GOLD[2], ox);
      break;
    }
    case 'circlet': {
      span(b, 9, y + 5, GOLD[2], ox);
      P(8, 5, GOLD[1]); P(23, 5, GOLD[1]);
      P(15, 5, A[3]); P(16, 5, A[2]); P(15, 4, GOLD[3]); P(16, 4, GOLD[3]);
      break;
    }
    case 'crown': {
      span(b, 8, y + 3, GOLD[2], ox); span(b, 8, y + 4, GOLD[1], ox);
      for (const x of [9, 12, 15, 19, 22]) {
        P(x, 2, GOLD[2]); P(x, 1, GOLD[3]);
        if (x === 15) { P(16, 2, GOLD[2]); P(16, 1, GOLD[3]); P(15, 0, GOLD[4]); P(16, 0, GOLD[3]); }
      }
      P(12, 3, hex('#d0304a')); P(19, 3, hex('#3a8ad0')); P(15, 3, hex('#3ad07a'));
      break;
    }
    case 'feather': {
      for (let i = 0; i <= 3; i++) span(b, 6 + Math.min(i, 2), y + i, i === 0 ? M[3] : M[2], ox - 1);
      span(b, 9, y + 4, M[1], ox - 1);
      for (let i = 0; i < 7; i++) { P(20 + Math.floor(i / 2), 2 - i, A[2]); P(21 + Math.floor(i / 2), 2 - i, A[3]); }
      break;
    }
    case 'antlers': {
      const c = ramp('#c9a87a');
      const branch = (sx: number, dir: number) => {
        b.line(sx + ox, y + 2, sx - 3 * dir + ox, y - 5, c[2]);
        b.line(sx - dir + ox, y - 1, sx - 4 * dir + ox, y - 2, c[2]);
        b.line(sx - 2 * dir + ox, y - 4, sx - dir + ox, y - 7, c[3]);
      };
      branch(10, 1); branch(21, -1);
      span(b, 8, y + 4, ramp('#4a7a3a')[2], ox);
      P(11, 3, hex('#e05a6a')); P(20, 3, hex('#e0c05a'));
      break;
    }
    case 'bandana': {
      span(b, 9, y + 4, A[2], ox); span(b, 9, y + 5, A[1], ox);
      P(24, 5, A[2]); P(25, 6, A[2]); P(25, 7, A[1]); P(26, 8, A[1]);
      break;
    }
    case 'goggles': {
      span(b, 9, y + 4, LEATHER[1], ox);
      for (const x of [11, 18]) { b.rect(x + ox, y + 3, 3, 3, GOLD[1]); P(x + 1, 4, hex('#9fe8ff')); P(x, 3, GOLD[3]); }
      break;
    }
    case 'tricorn': {
      span(b, 11, y + 4, M[1], ox);
      for (let i = 0; i <= 3; i++) span(b, 8 - Math.floor(i / 2), y + 3 - i, M[2], ox);
      P(5, 3, M[2]); P(26, 3, M[2]);
      span(b, 11, y + 5, GOLD[2], ox);
      P(15, 1, A[3]);
      break;
    }
    case 'skullcap': {
      for (let i = -3; i <= 3; i++) span(b, Math.min(8, 5 + Math.abs(i < 0 ? 3 + i : 3)), y + i, BONE[2], ox);
      b.rect(12 + ox, y, 2, 2, hex('#1a1018')); b.rect(18 + ox, y, 2, 2, hex('#1a1018'));
      P(10, -4, BONE[3]); P(21, -4, BONE[3]); P(9, -5, BONE[3]); P(22, -5, BONE[3]);
      span(b, 9, y + 4, BONE[1], ox);
      break;
    }
    case 'veil': {
      capRows(0, 5, M, 1);
      for (let i = 6; i <= 15; i++) { b.hline(6 + ox, 8 + ox, y + i, M[2]); b.hline(23 + ox, 25 + ox, y + i, M[1]); }
      span(b, 9, y + 5, A[2], ox);
      P(15, 4, A[3]);
      break;
    }
    case 'horned': {
      capRows(0, 5, X);
      span(b, 9, y + 5, GOLD[1], ox);
      const horn = (x: number, dir: number) => {
        P(x, 3, BONE[2]); P(x - dir, 2, BONE[2]); P(x - 2 * dir, 1, BONE[2]);
        P(x - 2 * dir, 0, BONE[3]); P(x - 2 * dir, -1, BONE[3]); P(x - dir, -2, BONE[4]);
      };
      horn(7, 1); horn(24, -1);
      break;
    }
    case 'straw': case 'cowboy': {
      const H = s.head === 'straw' ? ramp('#d9b56a') : ramp('#7a5030');
      const brim = s.head === 'straw' ? 13 : 12;
      span(b, brim, y + 5, H[1], ox); span(b, brim - 1, y + 4, H[2], ox);
      if (s.head === 'cowboy') { b.set(16 - brim + ox, y + 3, H[2]); b.set(15 + brim + ox, y + 3, H[1]); }
      for (let i = 0; i <= 3; i++) span(b, 7, y + i, i === 0 ? H[3] : H[2], ox);
      if (s.head === 'cowboy') b.hline(15 + ox, 16 + ox, y, H[1]);
      span(b, 7, y + 3, A[2], ox);
      if (s.head === 'cowboy') P(16, 3, GOLD[3]);
      break;
    }
    // ----------------------------------------------------------- 신규 11종
    case 'beret': {
      for (let i = 0; i <= 3; i++) span(b, [6, 8, 9, 9][i], y + i, i === 0 ? A[3] : A[2], ox - 1);
      span(b, 8, y + 4, A[1], ox - 1);
      P(15, -1, A[1]); P(14, -1, A[2]);
      P(6, 4, A[1]); P(5, 5, A[1]);
      break;
    }
    case 'tophat': {
      const H = ramp(mix(hex('#24202c'), hex(s.main), 0.15));
      span(b, 11, y + 4, H[1], ox); span(b, 10, y + 3, H[2], ox);
      for (let i = -6; i <= 2; i++) {
        span(b, 6, y + i, H[2], ox);
        P(10, i, H[3]); P(21, i, H[1]);
      }
      span(b, 6, y + 1, A[2], ox); span(b, 6, y + 2, A[1], ox);
      P(11, -5, H[4]); P(11, -4, H[3]);
      break;
    }
    case 'plaguemask': {
      const L = ramp('#6a5444');
      // 넓은 챙 모자
      span(b, 12, y + 4, ramp('#1e1a20')[1], ox);
      for (let i = 0; i <= 3; i++) span(b, 7, y + i, ramp('#1e1a20')[2], ox);
      span(b, 7, y + 3, L[3], ox);
      // 가죽 가면 + 유리알 + 부리
      for (let i = 5; i <= 13; i++) span(b, HEAD_HW[i], y + i, L[2], ox);
      for (const x of [10, 19]) { b.rect(x + ox, y + 7, 3, 3, hex('#d8c070')); P(x, 7, hex('#fff2b0')); P(x + 2, 9, darken(hex('#d8c070'), 0.3)); }
      for (let i = 0; i < 9; i++) {
        const w = Math.max(1, 3 - Math.floor(i / 3));
        for (let j = 0; j < w; j++) P(16 + i, 11 + j + Math.floor(i / 3), j === 0 ? L[3] : L[1]);
      }
      P(25, 14, L[0]);
      break;
    }
    case 'jester': {
      for (let i = 0; i <= 4; i++) {
        const k = HEAD_HW[i] + (i >= 1 ? 1 : 0);
        b.hline(16 - k + ox, 15 + ox, y + i, M[2]);
        b.hline(16 + ox, 15 + k + ox, y + i, A[2]);
      }
      span(b, 9, y + 5, GOLD[1], ox);
      // 늘어진 두 갈래
      const lp: [number, number][] = [[8, 0], [6, -1], [4, -1], [3, 0], [2, 2], [2, 3]];
      lp.forEach(([x, yy], i) => { P(x, yy, M[i % 2 ? 1 : 2]); P(x + 1, yy, M[2]); });
      lp.forEach(([x, yy], i) => { P(31 - x, yy, A[i % 2 ? 1 : 2]); P(30 - x, yy, A[2]); });
      P(2, 4, GOLD[3]); P(29, 4, GOLD[3]); P(2, 5, GOLD[1]); P(29, 5, GOLD[1]);
      break;
    }
    case 'flowercrown': {
      const leaf = ramp('#5a9a4a');
      span(b, 9, y + 4, leaf[2], ox);
      const cols = [hex('#ff8ab0'), hex('#fff2a0'), hex('#a0c8ff'), hex('#ffffff'), hex(s.accent)];
      [8, 11, 14, 17, 20, 23].forEach((x, i) => {
        const c = cols[(i + (hashStr(s.key) % 5)) % 5];
        P(x, 3, c); P(x + 1, 4, c); P(x - 1, 4, c); P(x, 5, c); P(x, 4, hex('#ffd04a'));
      });
      break;
    }
    case 'headband': {
      span(b, 9, y + 5, A[2], ox);
      P(8, 5, A[1]); P(15, 5, A[3]); P(16, 5, A[3]);
      P(6, 6, A[2]); P(5, 7, A[1]); P(6, 8, A[1]); P(4, 8, A[2]);
      break;
    }
    case 'turban': {
      for (let i = -4; i <= 5; i++) {
        const k = i < -2 ? 5 + (i + 4) * 2 : i <= 3 ? 9 : 9 - (i - 3);
        for (let x = 16 - k; x <= 15 + k; x++) {
          const stripe = ((x + i * 2 + 64) % 5) < 2;
          b.set(x + ox, y + i, stripe ? M[1] : M[2]);
        }
        b.set(16 - k + ox, y + i, M[3]);
      }
      P(15, 2, A[3]); P(16, 2, A[2]); P(15, 3, A[2]); P(16, 3, A[1]);
      P(16, 1, GOLD[3]); P(17, 0, hex('#f4f0e8')); P(17, -1, hex('#f4f0e8')); P(18, -2, hex('#e0dcd0'));
      break;
    }
    case 'laurel': {
      const Lr = s.star >= 4 ? GOLD : ramp('#6aa04a');
      for (let i = 0; i < 5; i++) {
        P(8 + i, 5 - Math.floor(i / 2), Lr[2]); P(8 + i, 4 - Math.floor(i / 2), Lr[3]);
        P(23 - i, 5 - Math.floor(i / 2), Lr[1]); P(23 - i, 4 - Math.floor(i / 2), Lr[2]);
      }
      break;
    }
    case 'tiara': {
      span(b, 8, y + 5, GOLD[2], ox);
      P(15, 4, GOLD[3]); P(16, 4, GOLD[3]); P(15, 3, GOLD[2]); P(16, 3, GOLD[2]);
      P(15, 2, A[3]); P(16, 2, A[2]); P(15, 1, GOLD[4]);
      P(12, 4, GOLD[3]); P(19, 4, GOLD[3]);
      break;
    }
    case 'buckethelm': {
      const Bk = ramp('#8a8f98');
      for (let i = -4; i <= 6; i++) {
        const k = 7 + Math.floor((i + 4) / 4);
        span(b, k, y + i, Bk[2], ox);
        b.set(16 - k + ox, y + i, Bk[3]); b.set(15 + k + ox, y + i, Bk[1]);
      }
      span(b, 10, y + 7, Bk[1], ox);
      b.hline(10 + ox, 21 + ox, y - 4, Bk[3]);
      P(12, -1, Bk[0]); P(13, 0, Bk[0]); P(19, 2, Bk[4]); P(20, 2, Bk[3]);
      // 손잡이
      b.line(7 + ox, y + 1, 9 + ox, y - 6, Bk[0]); b.line(24 + ox, y + 1, 22 + ox, y - 6, Bk[0]); b.hline(10 + ox, 21 + ox, y - 7, Bk[0]);
      break;
    }
    case 'beehat': {
      const H = ramp('#e0cf9a');
      span(b, 12, y + 4, H[1], ox); span(b, 11, y + 3, H[2], ox);
      for (let i = 0; i <= 2; i++) span(b, 7, y + i, i === 0 ? H[3] : H[2], ox);
      const net = withAlpha(hex('#2a2a2a'), 80);
      for (let i = 5; i <= 15; i++) {
        const k = i < 14 ? 10 : 10 - (i - 13);
        for (let x = 16 - k; x <= 15 + k; x++) {
          if (x === 16 - k || x === 15 + k) b.set(x + ox, y + i, withAlpha(hex('#3a3a3a'), 170));
          else if (i % 2 === 0 && x % 2 === 0) b.set(x + ox, y + i, mix(b.get(x + ox, y + i) || hex('#2a2438'), net, 0.5) | 0xff);
        }
      }
      b.hline(6 + ox, 25 + ox, y + 5, withAlpha(hex('#3a3a3a'), 210));
      break;
    }
  }
}
