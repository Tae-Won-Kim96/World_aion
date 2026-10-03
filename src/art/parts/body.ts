// 몸통·다리·날개·꼬리·망토·팔·의상·무늬
import { darken, hex, lighten, mix, ramp, type RGBA, withAlpha } from '../color';
import type { LookSpec } from '../look';
import type { PixBuf } from '../pixbuf';
import { BONE, DARKMETAL, GOLD, type Geo, HEAD_H, LEATHER, PANTS, type Ramp, type Ramps, span } from './common';

// =============================================================== 날개
export function drawWings(b: PixBuf, s: LookSpec, g: Geo, R: Ramps): void {
  const kind = s.feat.wings;
  if (!kind || kind === 'none') return;
  const root = 16 - g.tw - 1 + g.ox;
  const mirror = (x: number, y: number, c: RGBA) => { b.set(x, y, c); b.set(31 - x + 2 * g.ox, y, c); };
  if (kind === 'butterfly') {
    const top = g.torsoTop - 6;
    // 날개는 보조색에서 색상을 돌린 밝은 색 + 머리색 무늬
    const Wg = ramp(lighten(R.A[2], 0.3));
    const H = R.hr;
    const edge = darken(R.A[2], 0.5);
    for (let i = 0; i < 9; i++) {
      const w = [2, 4, 6, 7, 7, 6, 5, 3, 2][i];
      for (let j = 0; j < w; j++) mirror(root - j, top + i, withAlpha(j === w - 1 || i === 0 ? edge : (i + j) % 3 === 0 ? H[3] : Wg[2], 225));
    }
    for (let i = 0; i < 5; i++) {
      const w = [3, 4, 4, 3, 2][i];
      for (let j = 0; j < w; j++) mirror(root - j, top + 10 + i, withAlpha(j === w - 1 ? edge : j === 1 ? H[2] : Wg[3], 225));
    }
    mirror(root - 3, top + 3, hex('#ffffff', 230)); mirror(root - 2, top + 11, hex('#ffffff', 230));
    return;
  }
  const feather = kind === 'feather' || kind === 'bird';
  const small = kind === 'small_bat';
  const r: Ramp = kind === 'bird' ? R.hr : feather ? ramp('#f4f1ff') : ramp(small ? s.skin[1] : '#3a2a44');
  const widths = small ? [2, 3, 4, 4, 3, 2] : [3, 5, 6, 7, 8, 8, 7, 7, 6, 5, 4, 3, 2];
  const top = g.torsoTop - (small ? 3 : 6);
  widths.forEach((w, i) => {
    for (let j = 0; j < w; j++) {
      let c = r[2];
      if (i > widths.length * 0.6) c = r[1];
      if (j === w - 1) c = r[1];
      if (feather && i % 3 === 2 && j > 1) c = r[1];
      if (kind === 'bird' && j % 2 === 1) c = r[3];
      if (feather && i < 2) c = r[3];
      if (!feather && j % 3 === 2) c = r[0];
      mirror(root - j, top + i, c);
    }
  });
  if (!feather) {
    const by = top + widths.length;
    for (let j = 0; j < widths[widths.length - 1] + 2; j += 2) { b.clear(root - j, by - 1); b.clear(31 - (root - j) + 2 * g.ox, by - 1); }
  }
}

// =============================================================== 망토
export function drawCape(b: PixBuf, s: LookSpec, g: Geo): void {
  if (!s.cape) return;
  const r = ramp(s.cape);
  const k = g.tw + 2;
  const bottom = g.legTop + (g.short ? 2 : 4);
  for (let y = g.torsoTop + 1; y <= bottom; y++) {
    span(b, k, y, y > g.legTop ? r[1] : r[2], g.ox);
    b.set(16 - k + g.ox, y, r[1]);
    b.set(15 + k + g.ox, y, r[0]);
  }
  for (let x = 16 - k; x <= 15 + k; x += 3) b.clear(x + g.ox, bottom);
}

// =============================================================== 꼬리
export function drawTail(b: PixBuf, s: LookSpec, g: Geo, R: Ramps): void {
  const t = s.feat.tail;
  if (!t || t === 'none') return;
  const y = g.legTop - 1;
  const hr = R.hr;
  switch (t) {
    case 'devil': {
      const c = hex(s.race === 'imp' ? s.skin[1] : '#2a1a2a');
      for (const [x, yy] of [[20, y], [21, y + 1], [22, y + 1], [23, y + 2], [24, y + 3], [25, y + 3], [26, y + 2], [26, y + 3], [26, y + 4], [27, y + 3], [25, y + 2], [25, y + 4]]) b.set(x, yy, c);
      break;
    }
    case 'beast':
      b.ellipse(22.5, y + 1, 2.5, 2.5, hr[2]); b.ellipse(24.5, y - 1, 1.5, 1.5, hr[3]); b.set(21, y + 3, hr[1]); b.set(22, y + 3, hr[1]);
      break;
    case 'fox':
      b.ellipse(23, y, 3.5, 3, hr[2]); b.ellipse(25.5, y - 3, 2.5, 2.5, hr[2]); b.ellipse(26.5, y - 5, 1.5, 1.5, hex('#f8f4ec'));
      b.set(21, y + 2, hr[1]); b.set(22, y + 3, hr[1]); b.set(24, y + 2, hr[1]);
      break;
    case 'cat':
      for (const [x, yy] of [[20, y + 1], [21, y + 1], [22, y], [23, y - 1], [24, y - 2], [24, y - 3], [25, y - 4], [25, y - 5]]) b.set(x, yy, hr[2]);
      b.set(26, y - 5, hr[3]);
      break;
    case 'rabbit':
      b.ellipse(21.5, y + 1, 1.5, 1.5, hex('#f4f0ec'));
      break;
    case 'lizard': {
      const S = ramp(s.skin[0]);
      for (let i = 0; i < 8; i++) {
        const x = 19 + i;
        const yy = y + 1 + Math.floor(i / 2);
        const w = Math.max(1, 3 - Math.floor(i / 3));
        for (let k = 0; k < w; k++) b.set(x, yy + k, i % 2 ? S[1] : S[2]);
      }
      break;
    }
    case 'bull': {
      const S = ramp(s.skin[1]);
      for (const [x, yy] of [[20, y], [21, y + 1], [22, y + 2], [23, y + 3], [24, y + 4]]) b.set(x, yy, S[2]);
      b.ellipse(25, y + 5, 1.2, 1.2, hr[1]);
      break;
    }
    case 'fish': {
      const S = ramp(s.skin[0]);
      b.line(20, y, 24, y + 3, S[2]); b.line(24, y + 3, 26, y + 1, S[3]); b.line(24, y + 3, 26, y + 5, S[3]);
      break;
    }
  }
}

// =============================================================== 다리
export function drawLegs(b: PixBuf, s: LookSpec, g: Geo, R: Ramps): void {
  const { legTop, footY } = g;
  const o = s.outfit;
  const kr = R.kr;
  if (s.feat.legs === 'fishtail') {
    const S = ramp(s.skin[0]);
    for (let y = legTop; y <= footY - 2; y++) {
      const k = Math.max(1, 4 - Math.floor((y - legTop) / 2));
      span(b, k, y, (y - legTop) % 2 ? S[1] : S[2]);
      b.set(16 - k, y, S[3]);
    }
    b.hline(11, 15, footY, S[3]); b.hline(16, 20, footY, S[3]); b.hline(12, 19, footY - 1, S[2]);
    return;
  }
  if (o === 'bone') {
    for (const x of [13, 18]) { b.vline(x, legTop, footY - 1, BONE[2]); b.set(x, legTop + 2, BONE[3]); }
    b.hline(12, 14, footY, BONE[1]); b.hline(17, 19, footY, BONE[1]);
    return;
  }
  let pants: Ramp = PANTS;
  let boots: Ramp = LEATHER;
  if (o === 'plate' || o === 'scale') { pants = o === 'plate' ? R.X : ramp(s.main); boots = DARKMETAL; }
  else if (o === 'tribal' || o === 'rags' || o === 'bandages') { pants = kr; boots = LEATHER; }
  else if (o === 'gi' || o === 'sash' || o === 'wrap') { pants = R.M; boots = kr; }
  else if (o === 'tunic' || o === 'overalls') { pants = o === 'overalls' ? R.M : R.A; }
  else if (o === 'suit' || o === 'cassock') { pants = ramp(darkCloth(s.main)); boots = ramp('#1a1418'); }
  else if (o === 'motley') { pants = R.M; }
  else if (o === 'dress') { pants = ramp('#2a2433'); boots = ramp('#3a2430'); }
  if (s.feat.legs === 'hooves') boots = ramp('#2a2024');
  for (let y = legTop; y <= footY; y++) {
    const isBoot = y >= footY - 1;
    const r = isBoot ? boots : pants;
    const rr = o === 'motley' && !isBoot ? R.A : r;
    b.hline(12, 14, y, r[2]);
    b.hline(17, 19, y, rr[2]);
    b.set(14, y, r[1]);
    b.set(19, y, rr[1]);
    if (isBoot) { b.set(11, footY, r[1]); b.set(20, footY, r[1]); b.set(12, y, r[3]); }
  }
  b.set(12, legTop, pants[3]);
  b.set(17, legTop, pants[3]);
  if (s.feat.legs === 'hooves') { b.set(13, footY, hex('#100c10')); b.set(18, footY, hex('#100c10')); }
  if (o === 'tribal') { b.hline(12, 14, footY - 2, LEATHER[2]); b.hline(17, 19, footY - 2, LEATHER[2]); }
  if (o === 'bandages') for (let y = legTop + 1; y < footY - 1; y += 2) { b.hline(12, 14, y, hex('#e8e0d0')); b.hline(17, 19, y, hex('#e8e0d0')); }
}

function darkCloth(c: string): string {
  const v = hex(c);
  return `#${((darken(v, 0.45) >>> 8) & 0xffffff).toString(16).padStart(6, '0')}`;
}

// =============================================================== 몸통 (의상)
export function drawTorso(b: PixBuf, s: LookSpec, g: Geo, R: Ramps): void {
  const { M, A, T, kr } = R;
  const { tw, ox } = g;
  const rows: number[] = [];
  for (let y = g.torsoTop; y < g.legTop; y++) rows.push(y);
  const o = s.outfit;
  const L = 16 - tw + ox;
  const Rx = 15 + tw + ox;
  const mid = (y: number) => y - g.torsoTop;
  const hox = Math.round(ox / 2);
  const fill = (r: Ramp) => {
    for (const y of rows) {
      const k = mid(y) === 0 ? tw - 1 : tw;
      span(b, k, y, r[2], ox);
      b.set(16 - k + ox, y, r[3]);
      b.set(15 + k + ox, y, r[1]);
    }
  };
  const skirt = (r: Ramp, from: number, to: number, grow: number, hem: Ramp) => {
    for (let y = from; y < to; y++) {
      const k = tw + Math.min(grow, Math.floor((y - from) / 2));
      span(b, k, y, r[2], hox);
      b.set(16 - k + hox, y, r[3]);
      b.set(15 + k + hox, y, r[1]);
    }
    span(b, tw + grow, to - 1, hem[2], hox);
  };
  const belt = (c: RGBA, buckle: RGBA | null = GOLD[3]) => {
    b.hline(L, Rx, g.legTop - 2, c);
    if (buckle) b.set(15 + ox, g.legTop - 2, buckle);
  };

  switch (o) {
    case 'plate': {
      fill(R.X);
      for (const y of rows) if (mid(y) >= 2) b.hline(14 + ox, 17 + ox, y, M[2]);
      for (let y = g.torsoTop + 2; y <= g.legTop + 1; y++) { b.set(14 + ox, y, M[3]); b.set(17 + ox, y, M[1]); }
      b.hline(14 + ox, 17 + ox, g.legTop, M[1]); b.hline(14 + ox, 17 + ox, g.legTop + 1, M[1]);
      belt(LEATHER[1]);
      b.hline(L - 2, L + 1, g.torsoTop, R.X[3]); b.hline(L - 2, L + 1, g.torsoTop + 1, R.X[2]);
      b.hline(Rx - 1, Rx + 2, g.torsoTop, R.X[3]); b.hline(Rx - 1, Rx + 2, g.torsoTop + 1, R.X[1]);
      b.set(L - 2, g.torsoTop + 2, R.X[1]); b.set(Rx + 2, g.torsoTop + 2, R.X[0]);
      break;
    }
    case 'chain': {
      fill(R.X);
      for (const y of rows) for (let x = L; x <= Rx; x++) if ((x + y) % 2 === 0) b.set(x, y, R.X[1]);
      for (const y of rows) if (mid(y) >= 2) b.hline(13 + ox, 18 + ox, y, M[2]);
      for (let y = g.torsoTop + 2; y < g.legTop + 1; y++) { b.set(13 + ox, y, A[2]); b.set(18 + ox, y, A[2]); }
      belt(LEATHER[2]);
      break;
    }
    case 'scale': {
      fill(M);
      for (const y of rows) for (let x = L; x <= Rx; x++) if ((x + (y % 2) * 1) % 2 === 0) b.set(x, y, y % 2 ? M[1] : M[3]);
      belt(LEATHER[1], T[3]);
      b.hline(L - 1, L + 1, g.torsoTop, M[3]); b.hline(Rx - 1, Rx + 1, g.torsoTop, M[3]);
      break;
    }
    case 'leather': {
      fill(M);
      b.line(L + 1, g.torsoTop + 1, Rx - 1, g.legTop - 3, A[1]);
      belt(LEATHER[0]);
      b.hline(15 + ox, 16 + ox, g.torsoTop, kr[2]);
      break;
    }
    case 'robe': case 'vestment': case 'cassock': {
      fill(M);
      skirt(M, g.legTop, g.footY, 2, o === 'cassock' ? M : A);
      if (o === 'cassock') {
        for (let y = g.torsoTop + 2; y < g.footY - 1; y += 2) b.set(15 + ox, y, T[3]);
        b.hline(14 + ox, 17 + ox, g.torsoTop, hex('#f2f0e8'));
        break;
      }
      b.vline(15 + ox, g.torsoTop + 2, g.footY - 2, A[2]);
      b.vline(16 + ox, g.torsoTop + 2, g.footY - 2, A[1]);
      b.set(15 + ox, g.torsoTop, A[3]); b.set(16 + ox, g.torsoTop, A[3]);
      b.set(14 + ox, g.torsoTop + 1, A[2]); b.set(17 + ox, g.torsoTop + 1, A[2]);
      if (o === 'vestment') {
        b.vline(13 + ox, g.torsoTop + 1, g.footY - 2, GOLD[2]); b.vline(18 + ox, g.torsoTop + 1, g.footY - 2, GOLD[1]);
        b.vline(15 + ox, g.torsoTop + 3, g.torsoTop + 6, GOLD[3]); b.hline(14 + ox, 17 + ox, g.torsoTop + 4, GOLD[3]);
      }
      break;
    }
    case 'cloak': {
      fill(A);
      b.hline(15 + ox, 16 + ox, g.torsoTop, kr[2]);
      belt(LEATHER[1], null);
      for (const y of rows) {
        const d = mid(y);
        if (d > 6) continue;
        b.hline(L - 1, L + 1, y, d % 3 === 2 ? M[1] : M[2]);
        b.hline(Rx - 1, Rx + 1, y, M[1]);
      }
      b.hline(L, Rx, g.torsoTop, M[3]);
      b.set(15 + ox, g.torsoTop + 1, GOLD[2]);
      break;
    }
    case 'tunic': {
      fill(M);
      b.hline(15 + ox, 16 + ox, g.torsoTop, kr[2]); b.set(15 + ox, g.torsoTop + 1, kr[1]); b.set(16 + ox, g.torsoTop + 1, kr[1]);
      belt(A[1], null);
      b.hline(L, Rx, g.legTop - 1, M[1]);
      break;
    }
    case 'tribal': {
      fill(kr);
      b.line(L, g.torsoTop + 1, Rx, g.legTop - 2, LEATHER[1]);
      b.hline(L - 1, L + 2, g.torsoTop, A[3]); b.hline(L - 1, L + 2, g.torsoTop + 1, A[2]); b.set(L - 1, g.torsoTop + 2, A[1]);
      b.hline(L, Rx, g.legTop - 1, M[2]); b.hline(L + 1, Rx - 1, g.legTop, M[2]); b.hline(L + 2, Rx - 2, g.legTop + 1, M[1]);
      b.set(14 + ox, g.torsoTop + 4, kr[1]); b.set(17 + ox, g.torsoTop + 4, kr[1]);
      break;
    }
    case 'gi': case 'wrap': {
      fill(M);
      b.line(13 + ox, g.torsoTop, 17 + ox, g.torsoTop + 4, o === 'wrap' ? A[2] : M[1]);
      b.hline(15 + ox, 16 + ox, g.torsoTop, kr[2]); b.set(15 + ox, g.torsoTop + 1, kr[2]);
      if (o === 'wrap') { b.hline(L, Rx, g.legTop - 3, A[1]); b.hline(L, Rx, g.legTop - 2, A[2]); b.set(Rx + 1, g.legTop - 1, A[1]); b.set(Rx + 1, g.legTop, A[1]); }
      else { belt(A[0], null); b.set(Rx - 1, g.legTop - 1, A[0]); }
      break;
    }
    case 'dress': {
      fill(M);
      b.hline(L + 1, Rx - 1, g.torsoTop, A[3]);
      b.vline(15 + ox, g.torsoTop + 1, g.legTop - 2, A[2]);
      skirt(M, g.legTop - 2, g.footY - 1, 3, A);
      for (let x = 16 - tw - 3; x <= 15 + tw + 3; x++) b.set(x + hox, g.footY - 1, x % 2 ? A[3] : A[2]);
      break;
    }
    case 'coat': case 'labcoat': {
      const C = o === 'labcoat' ? ramp('#e8eef2') : M;
      fill(C);
      for (let y = g.legTop; y <= g.legTop + (g.short ? 1 : 3); y++) { b.hline(L, 14 + ox, y, C[2]); b.hline(17 + ox, Rx, y, C[1]); }
      b.vline(15 + ox, g.torsoTop, g.legTop - 1, o === 'labcoat' ? M[2] : A[2]);
      b.vline(16 + ox, g.torsoTop, g.legTop - 1, o === 'labcoat' ? M[3] : A[3]);
      b.set(14 + ox, g.torsoTop, C[3]); b.set(17 + ox, g.torsoTop, C[3]); b.set(14 + ox, g.torsoTop + 1, C[3]); b.set(17 + ox, g.torsoTop + 1, C[3]);
      if (o === 'labcoat') { b.hline(L + 1, L + 2, g.legTop - 3, C[1]); b.set(Rx - 1, g.torsoTop + 3, A[2]); }
      else { for (let y = g.torsoTop + 3; y < g.legTop; y += 2) b.set(14 + ox, y, T[3]); belt(LEATHER[0], null); }
      break;
    }
    case 'suit': {
      fill(M);
      b.vline(15 + ox, g.torsoTop, g.legTop - 1, hex('#f2f0e8'));
      b.vline(16 + ox, g.torsoTop, g.legTop - 1, hex('#f2f0e8'));
      b.vline(16 + ox, g.torsoTop + 1, g.torsoTop + 5, A[2]); b.set(15 + ox, g.torsoTop + 1, A[1]);
      b.set(14 + ox, g.torsoTop + 1, M[3]); b.set(17 + ox, g.torsoTop + 1, M[3]); b.set(14 + ox, g.torsoTop + 2, M[3]); b.set(17 + ox, g.torsoTop + 2, M[3]);
      b.set(14 + ox, g.legTop - 3, T[3]);
      break;
    }
    case 'motley': {
      fill(M);
      for (const y of rows) for (let x = L; x <= Rx; x++) if (((x - L) >> 1) % 2 === ((y - g.torsoTop) >> 1) % 2) b.set(x, y, A[2]);
      for (let x = L; x <= Rx; x += 2) b.set(x, g.legTop - 1, T[3]);
      break;
    }
    case 'fur': {
      fill(M);
      for (const y of rows) for (let x = L; x <= Rx; x++) if ((x * 3 + y * 5) % 7 === 0) b.set(x, y, M[3]);
      for (let x = L - 1; x <= Rx + 1; x++) b.set(x, g.torsoTop + ((x % 2) ? 0 : 1), M[4]);
      for (let x = L; x <= Rx; x += 2) b.set(x, g.legTop, M[1]);
      break;
    }
    case 'bandages': {
      fill(kr);
      for (const y of rows) if ((y - g.torsoTop) % 2 === 0) b.line(L, y, Rx, y + 1, hex('#ece4d4'));
      b.set(L + 2, g.torsoTop + 3, hex('#9a2a2a'));
      break;
    }
    case 'overalls': {
      fill(A);
      for (let y = g.torsoTop + 3; y < g.legTop; y++) b.hline(13 + ox, 18 + ox, y, M[2]);
      b.vline(13 + ox, g.torsoTop, g.torsoTop + 3, M[1]); b.vline(18 + ox, g.torsoTop, g.torsoTop + 3, M[1]);
      b.hline(L, Rx, g.legTop - 1, M[2]);
      b.set(13 + ox, g.torsoTop + 3, T[3]); b.set(18 + ox, g.torsoTop + 3, T[3]);
      break;
    }
    case 'apron': {
      fill(A);
      for (let y = g.torsoTop + 2; y < g.legTop + 3; y++) b.hline(13 + ox, 18 + ox, y, M[2]);
      b.set(13 + ox, g.torsoTop + 1, M[1]); b.set(18 + ox, g.torsoTop + 1, M[1]);
      b.hline(L, Rx, g.legTop - 3, M[1]);
      b.set(14 + ox, g.torsoTop + 5, hex('#7a1a1a')); b.set(17 + ox, g.legTop - 1, hex('#7a1a1a')); b.set(16 + ox, g.legTop + 1, hex('#5a1414'));
      break;
    }
    case 'sash': {
      fill(kr);
      b.hline(L, Rx, g.torsoTop, M[2]); b.hline(L, Rx, g.torsoTop + 1, M[2]); b.hline(L, Rx, g.torsoTop + 2, M[1]);
      b.hline(L, Rx, g.legTop - 2, A[2]); b.hline(L, Rx, g.legTop - 1, A[1]);
      b.set(Rx + 1, g.legTop - 1, A[2]); b.set(Rx + 2, g.legTop, A[2]); b.set(Rx + 2, g.legTop + 1, A[1]);
      break;
    }
    case 'rags': {
      fill(M);
      for (const y of rows) for (let x = L; x <= Rx; x++) if ((x * 7 + y * 3) % 11 === 0) b.set(x, y, kr[1]);
      for (let x = L; x <= Rx; x += 2) b.set(x, g.legTop, M[1]);
      break;
    }
    case 'bone': {
      b.vline(15 + ox, g.torsoTop, g.legTop, BONE[2]); b.vline(16 + ox, g.torsoTop, g.legTop, BONE[1]);
      for (let y = g.torsoTop + 1; y < g.legTop - 2; y += 2) { b.hline(L + 1, Rx - 1, y, BONE[2]); b.set(L + 1, y, BONE[3]); b.set(Rx - 1, y, BONE[1]); }
      b.hline(L + 1, Rx - 1, g.legTop - 1, BONE[1]); b.hline(L + 2, Rx - 2, g.legTop - 1, M[2]); b.hline(L + 2, Rx - 2, g.legTop, M[1]);
      break;
    }
  }
  applyPattern(b, s, g, R);
  // 목 아래 그림자
  for (const x of [15, 16]) {
    const c = b.get(x + ox, g.headTop + HEAD_H);
    if (c) b.set(x + ox, g.headTop + HEAD_H, darken(c, 0.25));
  }
  if (s.cape) {
    const C = ramp(s.cape);
    b.set(L, g.torsoTop, C[3]); b.set(Rx, g.torsoTop, C[2]); b.set(L + 1, g.torsoTop, GOLD[2]); b.set(Rx - 1, g.torsoTop, GOLD[2]);
  }
  if (s.bound) {
    // 세계핵의 문양
    const c = hex('#7fe3ff');
    b.set(15 + ox, g.torsoTop + 3, c); b.set(16 + ox, g.torsoTop + 3, lighten(c, 0.5)); b.set(15 + ox, g.torsoTop + 4, darken(c, 0.2)); b.set(16 + ox, g.torsoTop + 4, c);
  }
}

/** 주색 천 위에만 무늬를 입힌다 */
function applyPattern(b: PixBuf, s: LookSpec, g: Geo, R: Ramps): void {
  if (s.pattern === 'none' || ['plate', 'chain', 'scale', 'bone', 'bandages', 'tribal', 'motley'].includes(s.outfit)) return;
  const { M, A, T } = R;
  const cloth = new Set([M[1], M[2], M[3]]);
  const x0 = 16 - g.tw - 3 + g.ox;
  const x1 = 15 + g.tw + 3 + g.ox;
  for (let y = g.torsoTop + 1; y < g.footY; y++) {
    for (let x = x0; x <= x1; x++) {
      if (!cloth.has(b.get(x, y))) continue;
      let c: RGBA | 0 = 0;
      switch (s.pattern) {
        case 'stripes': if ((y - g.torsoTop) % 3 === 0) c = A[1]; break;
        case 'vstripes': if (x % 3 === 0) c = A[2]; break;
        case 'checker': if (((x >> 1) + (y >> 1)) % 2) c = M[0]; break;
        case 'diamond': if ((x + y) % 4 === 0 || (x - y + 64) % 4 === 0) c = A[2]; break;
        case 'dots': if (x % 3 === 1 && y % 3 === 1) c = T[3]; break;
        case 'band': if (y === g.torsoTop + 3 || y === g.legTop - 3 || y === g.footY - 2) c = T[2]; break;
      }
      if (c) b.set(x, y, c);
    }
  }
}

// =============================================================== 팔
function sleeveRamp(s: LookSpec, R: Ramps): Ramp {
  switch (s.outfit) {
    case 'plate': case 'chain': return R.X;
    case 'tribal': case 'rags': case 'sash': case 'bandages': return R.kr;
    case 'bone': return BONE;
    case 'labcoat': return ramp('#e8eef2');
    case 'overalls': case 'apron': return R.A;
    default: return R.M;
  }
}

function handRamp(s: LookSpec, R: Ramps): Ramp {
  if (s.outfit === 'plate') return R.X;
  if (s.outfit === 'bone') return BONE;
  if (s.weapon === 'fist' && s.race !== 'skeleton') return R.A;
  return R.kr;
}

export function drawLeftArm(b: PixBuf, s: LookSpec, g: Geo, R: Ramps): void {
  const sl = sleeveRamp(s, R);
  const hd = handRamp(s, R);
  const x0 = 16 - g.tw - 2 + g.ox;
  const thin = s.outfit === 'bone';
  for (let y = g.torsoTop + 1; y <= g.torsoTop + 6; y++) {
    if (thin) { b.set(x0 + 1, y, sl[2]); continue; }
    b.set(x0, y, sl[3]);
    b.set(x0 + 1, y, sl[2]);
  }
  if (s.outfit === 'bandages') { b.set(x0, g.torsoTop + 3, hex('#ece4d4')); b.set(x0 + 1, g.torsoTop + 5, hex('#ece4d4')); }
  if (['robe', 'vestment', 'wrap', 'cassock'].includes(s.outfit)) b.hline(x0 - 1, x0 + 1, g.torsoTop + 6, R.A[2]);
  b.rect(x0, g.torsoTop + 7, 2, 2, hd[2]);
  b.set(x0, g.torsoTop + 8, hd[1]);
}

export function drawRightArm(b: PixBuf, s: LookSpec, g: Geo, R: Ramps): void {
  const sl = sleeveRamp(s, R);
  const hd = handRamp(s, R);
  const x0 = 15 + g.tw + 1 + g.ox;
  const [gx, gy] = g.grip;
  const thin = s.outfit === 'bone';
  if (g.armPose === 'down') {
    for (let y = g.torsoTop + 1; y <= g.torsoTop + 6; y++) { if (!thin) b.set(x0, y, sl[2]); b.set(x0 + 1, y, sl[1]); }
  } else if (g.armPose === 'up') {
    b.line(x0, g.torsoTop + 2, gx, gy + 1, sl[2]);
    if (!thin) b.line(x0 + 1, g.torsoTop + 2, gx + 1, gy + 1, sl[1]);
  } else {
    b.line(x0, g.torsoTop + 2, gx - 1, gy, sl[2]);
    if (!thin) b.line(x0, g.torsoTop + 3, gx - 1, gy + 1, sl[1]);
  }
  b.rect(gx - 1, gy, 2, 2, hd[2]);
  b.set(gx, gy + 1, hd[1]);
}

export { mix };
