// 머리: 머리형·피부 무늬·귀·얼굴(눈 7종·입 6종)·수염·머리카락 26종·볏(crest)·뿔·후광
import { darken, hex, lighten, luminance, mix, ramp, type RGBA, withAlpha } from '../color';
import type { HairStyle, LookSpec } from '../look';
import type { PixBuf } from '../pixbuf';
import { BONE, both, type Geo, HEAD_H, HEAD_HW, hashStr, OUTLINE_DARK, type Ramp, type Ramps, span, WHITE } from './common';

const BOUND_HI = hex('#7fe3ff');
const D = OUTLINE_DARK;

// =============================================================== 머리형
export function drawHeadShape(b: PixBuf, s: LookSpec, g: Geo, R: Ramps): void {
  const r = s.feat.skull ? BONE : R.kr;
  for (let i = 0; i < HEAD_H; i++) {
    const y = g.headTop + i;
    const k = HEAD_HW[i];
    span(b, k, y, r[2], g.ox);
    if (i >= 9) { b.set(16 - k + g.ox, y, r[1]); b.set(15 + k + g.ox, y, r[1]); }
    if (i >= 12) { b.set(17 - k + g.ox, y, r[1]); b.set(14 + k + g.ox, y, r[1]); }
  }
  b.set(10 + g.ox, g.headTop + 11, r[3]);
}

/** 버퍼 전체의 피부 픽셀에 무늬 (비늘·나무껍질·돌·금속·반점) */
export function applySkinPattern(b: PixBuf, s: LookSpec, g: Geo, R: Ramps): void {
  const p = s.feat.skinPattern;
  if (!p || p === 'stitches') return;
  const { kr } = R;
  const skin = new Set([kr[1], kr[2], kr[3]]);
  for (let y = 0; y < b.h; y++) {
    for (let x = 0; x < b.w; x++) {
      if (!skin.has(b.get(x, y))) continue;
      const lx = x - g.ox + 32;
      let n: RGBA = 0;
      switch (p) {
        case 'scales':
          if (y % 2 === 0 && (lx + (y >> 1)) % 2 === 0) n = kr[1];
          else if (y % 2 === 1 && (lx + (y >> 1)) % 4 === 1) n = kr[3];
          break;
        case 'bark': {
          const v = (lx * 2 + (y >> 2)) % 5;
          if (v === 0) n = kr[1];
          else if (v === 2 && y % 3 === 0) n = kr[0];
          break;
        }
        case 'stone': {
          const m = (Math.imul(lx, 73856093) ^ Math.imul(y, 19349663)) >>> 0;
          if (m % 13 === 0) n = kr[1];
          else if (m % 13 === 1) n = kr[3];
          break;
        }
        case 'metal':
          if (y % 4 === 0) n = kr[1];
          else if (y % 4 === 2 && lx % 5 === 0) n = kr[4];
          break;
        case 'spots': {
          const v = (lx * 7 + y * 13) % 19;
          if (v === 0 || v === 7) n = kr[1];
          break;
        }
      }
      if (n) b.set(x, y, n);
    }
  }
}

// =============================================================== 귀
const TOP_EARS = ['beast', 'cat', 'fox', 'rabbit', 'bear', 'wolf'];
const EAR_BLOCKERS = ['helm', 'greathelm', 'buckethelm', 'hood', 'horned', 'plaguemask', 'beehat'];

export function drawSideEars(b: PixBuf, s: LookSpec, g: Geo, R: Ramps): void {
  const e = s.feat.ears;
  const y = g.headTop;
  const kr = R.kr;
  const B = (x: number, yy: number, c: RGBA) => both(b, x, yy, c, g.ox);
  switch (e) {
    case 'human':
      B(7, y + 9, kr[2]); B(7, y + 10, kr[1]);
      break;
    case 'pointy':
      B(7, y + 9, kr[2]); B(7, y + 8, kr[2]); B(6, y + 8, kr[1]); B(6, y + 7, kr[1]);
      break;
    case 'long':
      for (let i = 0; i < 5; i++) { B(7 - i, y + 9 - i, kr[2]); B(7 - i, y + 10 - i, i === 0 ? kr[1] : kr[2]); }
      B(3, y + 4, kr[3]);
      break;
    case 'fin': {
      const f = ramp(s.skin[2]);
      for (let i = 0; i < 6; i++) { B(7 - (i % 2), y + 6 + i, f[1]); B(6 - (i % 2), y + 6 + i, i % 2 ? f[2] : f[3]); }
      B(5, y + 7, f[1]); B(5, y + 9, f[1]);
      break;
    }
  }
}

type EarRows = [number, number, number][]; // [dy, x0, x1] (왼쪽 귀 기준)

export function drawTopEars(b: PixBuf, s: LookSpec, g: Geo, R: Ramps): void {
  const e = s.feat.ears;
  if (!e || !TOP_EARS.includes(e) || EAR_BLOCKERS.includes(s.head)) return;
  const y = g.headTop;
  const ox = g.ox;
  const { hr, kr } = R;
  const pink = mix(kr[2], hex('#ff9ab0'), 0.5);
  const paint = (rows: EarRows, c: RGBA, mirror = true) => {
    for (const [dy, x0, x1] of rows) {
      for (let x = x0; x <= x1; x++) {
        b.set(x + ox, y + dy, c);
        if (mirror) b.set(31 - x + ox, y + dy, c);
      }
    }
  };
  switch (e) {
    case 'beast':
      paint([[1, 9, 12], [0, 9, 11], [-1, 9, 10], [-2, 9, 9]], hr[2]);
      paint([[0, 10, 10], [-1, 10, 10]], pink);
      break;
    case 'cat':
      paint([[1, 9, 12], [0, 9, 12], [-1, 9, 11], [-2, 9, 10], [-3, 9, 9]], hr[2]);
      paint([[-1, 9, 9], [-2, 9, 9], [-3, 9, 9]], hr[3]);
      paint([[1, 10, 11], [0, 10, 11], [-1, 10, 10]], pink);
      break;
    case 'fox':
      paint([[1, 8, 12], [0, 8, 12], [-1, 8, 11], [-2, 8, 10], [-3, 8, 9], [-4, 8, 8]], hr[2]);
      paint([[-3, 8, 9], [-4, 8, 8]], hr[0]);
      paint([[1, 9, 11], [0, 9, 10], [-1, 9, 9]], hex('#f6efe4'));
      break;
    case 'wolf':
      paint([[1, 8, 12], [0, 8, 11], [-1, 7, 10], [-2, 7, 9], [-3, 7, 8]], hr[1]);
      paint([[1, 9, 11], [0, 9, 10], [-1, 8, 9]], mix(hr[2], kr[2], 0.4));
      break;
    case 'bear':
      paint([[1, 8, 12], [0, 8, 12], [-1, 8, 12], [-2, 9, 11]], hr[2]);
      paint([[0, 9, 11], [-1, 10, 10]], hr[1]);
      break;
    case 'rabbit': {
      const floppy = (hashStr(s.key) & 3) === 0;
      const ear: EarRows = [];
      const inner: EarRows = [];
      for (let dy = 1; dy >= -7; dy--) { ear.push([dy, 10, 12]); if (dy <= 0 && dy >= -6) inner.push([dy, 11, 11]); }
      ear.push([-8, 11, 11]);
      paint(ear, hr[2], false);
      paint(inner, pink, false);
      if (floppy) {
        // 오른쪽 귀는 반쯤 꺾인다
        paint([[1, 19, 21], [0, 19, 21], [-1, 19, 21], [-2, 19, 21], [-3, 20, 23], [-2, 22, 24], [-1, 23, 24]], hr[2], false);
        paint([[0, 20, 20], [-1, 20, 20], [-2, 20, 20], [-3, 21, 22]], pink, false);
      } else {
        const r = ear.map(([dy, x0, x1]) => [dy, 31 - x1, 31 - x0] as [number, number, number]);
        paint(r, hr[2], false);
        paint(inner.map(([dy]) => [dy, 20, 20] as [number, number, number]), pink, false);
      }
      break;
    }
  }
}

// =============================================================== 얼굴
function drawEye(b: PixBuf, s: LookSpec, g: Geo, x: number, iris: RGBA, side: -1 | 1, glow: RGBA | null): void {
  const ox = g.ox;
  const e0 = g.headTop + 8;
  const P = (dx: number, dy: number, c: RGBA) => b.set(x + dx + ox, e0 + dy, c);
  const inner = side === -1 ? 1 : 0;
  const outer = 1 - inner;
  if (g.eyes === 'hurt') {
    if (side === -1) { P(0, 0, D); P(1, 1, D); P(0, 2, D); } else { P(1, 0, D); P(0, 1, D); P(1, 2, D); }
    return;
  }
  const hi = s.bound ? BOUND_HI : WHITE;
  if (glow) {
    P(0, 0, D); P(1, 0, D);
    P(0, 1, glow); P(1, 1, lighten(glow, 0.6));
    P(0, 2, glow); P(1, 2, glow);
    P(0, 3, darken(glow, 0.25)); P(1, 3, darken(glow, 0.25));
    return;
  }
  const deep = darken(iris, 0.45);
  const lite = lighten(iris, 0.3);
  const lash = s.gender === 'f';
  switch (s.eyeStyle) {
    case 'big': {
      const x0 = side === -1 ? -1 : 0;
      for (let i = 0; i < 3; i++) P(x0 + i, 0, D);
      P(x0, 1, deep); P(x0 + 1, 1, side === -1 ? hi : deep); P(x0 + 2, 1, side === -1 ? deep : hi);
      for (let i = 0; i < 3; i++) P(x0 + i, 2, iris);
      P(x0, 3, iris); P(x0 + 1, 3, lite); P(x0 + 2, 3, iris);
      if (lash) { const lx = side === -1 ? x0 - 1 : x0 + 3; P(lx, 0, D); P(lx, -1, D); }
      return;
    }
    case 'sleepy':
      P(0, 1, D); P(1, 1, D);
      P(0, 2, iris); P(1, 2, iris);
      P(outer, 3, lite); P(inner, 3, iris);
      return;
    case 'sharp':
      P(outer, 0, D);
      P(inner, 1, D); P(outer, 1, deep);
      P(0, 2, iris); P(1, 2, iris);
      P(outer, 3, lite);
      if (lash) P(outer + side, 0, D);
      return;
    case 'happy': {
      const x0 = side === -1 ? -1 : 0;
      P(x0, 2, D); P(x0 + 1, 1, D); P(x0 + 2, 2, D);
      return;
    }
    case 'dot':
      P(inner, 1, D); P(inner, 2, D);
      return;
    case 'slit':
      P(0, 0, D); P(1, 0, D);
      P(0, 1, lite); P(1, 1, lite);
      P(0, 2, iris); P(1, 2, iris);
      P(0, 3, iris); P(1, 3, iris);
      P(inner, 1, D); P(inner, 2, D); P(inner, 3, deep);
      return;
    default:
      P(0, 0, D); P(1, 0, D);
      P(0, 1, side === -1 ? deep : hi); P(1, 1, side === -1 ? hi : deep);
      P(0, 2, iris); P(1, 2, iris);
      P(0, 3, side === -1 ? lite : iris); P(1, 3, side === -1 ? iris : lite);
      if (lash) { P(outer + side, 0, D); P(outer + side, -1, D); }
  }
}

function drawMouth(b: PixBuf, s: LookSpec, g: Geo, kr: Ramp): void {
  const y = g.headTop;
  const ox = g.ox;
  const m = darken(kr[2], 0.45);
  const P = (x: number, yy: number, c: RGBA) => b.set(x + ox, y + yy, c);
  if (g.eyes === 'hurt') { P(15, 12, m); P(16, 12, m); P(15, 13, m); P(16, 13, m); return; }
  const lip = mix(m, hex('#c0405a'), 0.4);
  switch (s.mouth) {
    case 'smile': P(14, 12, m); P(15, 13, m); P(16, 13, m); P(17, 12, m); break;
    case 'frown': P(14, 13, m); P(15, 12, m); P(16, 12, m); P(17, 13, m); break;
    case 'open': P(15, 12, D); P(16, 12, D); P(15, 13, hex('#c0404a')); P(16, 13, hex('#a0303a')); break;
    case 'cat': P(13, 12, m); P(14, 13, m); P(15, 12, m); P(16, 12, m); P(17, 13, m); P(18, 12, m); break;
    case 'fang': P(15, 13, m); P(16, 13, m); P(16, 14, WHITE); break;
    default:
      if (s.gender === 'f') P(16, 13, lip);
      else { P(15, 13, m); P(16, 13, m); }
  }
}

export function drawFace(b: PixBuf, s: LookSpec, g: Geo, R: Ramps): void {
  const y = g.headTop;
  const ox = g.ox;
  const kr = R.kr;
  const e0 = y + 8;
  const P = (x: number, yy: number, c: RGBA) => b.set(x + ox, yy, c);
  if (s.feat.skull) {
    for (const x of [9, 20]) b.rect(x + ox, e0, 3, 3, hex('#1a1018'));
    const glow = hex(s.feat.glowEyes ?? (s.bound ? '#7fe3ff' : '#ff4a4a'));
    P(10, e0 + 1, glow); P(21, e0 + 1, glow);
    P(15, y + 11, hex('#1a1018')); P(16, y + 11, hex('#1a1018'));
    for (let x = 12; x <= 19; x++) P(x, y + 12, x % 2 ? BONE[3] : hex('#2a2030'));
    b.hline(12 + ox, 19 + ox, y + 13, BONE[1]);
    return;
  }
  const glow = s.feat.glowEyes ? hex(s.feat.glowEyes) : null;
  let iris = hex(s.eye);
  let iris2 = hex(s.eye2 ?? s.eye);
  if (s.bound) { iris = mix(iris, BOUND_HI, 0.3); iris2 = mix(iris2, BOUND_HI, 0.3); }
  drawEye(b, s, g, 10, iris, -1, glow);
  drawEye(b, s, g, 20, iris2, 1, glow);
  // 코·주둥이·부리
  if (s.feat.beak) {
    const K = ramp('#e8a43a');
    b.hline(14 + ox, 17 + ox, y + 11, K[3]); b.hline(14 + ox, 17 + ox, y + 12, K[2]);
    P(15, y + 13, K[1]); P(16, y + 13, K[1]); P(17, y + 12, K[1]);
  } else if (s.feat.snout || s.feat.muzzle) {
    b.ellipse(15.5 + ox, y + 12, 2.5, 1.5, kr[3]);
    P(15, y + 11, darken(kr[0], 0.3)); P(16, y + 11, darken(kr[0], 0.3)); P(15, y + 10, kr[1]);
  } else if (s.feat.bigNose) {
    P(15, y + 11, kr[1]); P(16, y + 11, kr[1]); P(15, y + 12, kr[1]); P(16, y + 12, kr[0]);
  }
  if (s.blush) { const c = mix(kr[2], hex('#ff6a8a'), 0.45); P(9, y + 12, c); P(22, y + 12, c); }
  if ((s.feat.freckles ?? 0) > 0.3) { P(12, y + 12, kr[1]); P(19, y + 12, kr[1]); P(13, y + 11, kr[1]); }
  if (s.feat.gills) for (let i = 0; i < 3; i++) { P(9, y + 11 + i, kr[0]); P(22, y + 11 + i, kr[0]); }
  if (!s.feat.beak) drawMouth(b, s, g, kr);
  if (s.feat.tusks) { P(13, y + 13, BONE[3]); P(13, y + 12, BONE[2]); P(18, y + 13, BONE[3]); P(18, y + 12, BONE[2]); }
  if (s.feat.fangs) { P(14, y + 14, WHITE); P(17, y + 14, WHITE); }
  if (s.feat.skinPattern === 'stitches') {
    const st = darken(kr[0], 0.4);
    for (let i = 0; i <= 9; i++) {
      const xx = 13 + Math.floor(i / 4);
      onSkin(b, R, xx + ox, y + 3 + i, st);
      if (i % 2 === 0) { onSkin(b, R, xx - 1 + ox, y + 3 + i, st); onSkin(b, R, xx + 1 + ox, y + 3 + i, st); }
    }
  }
}

/** 피부 위에만 칠하기 (눈·입은 건드리지 않는다) */
export function onSkin(b: PixBuf, R: Ramps, x: number, y: number, c: RGBA): void {
  const v = b.get(x, y);
  if (v === R.kr[1] || v === R.kr[2] || v === R.kr[3] || v === R.kr[0]) b.set(x, y, c);
}

// =============================================================== 수염 (4종)
export function drawBeard(b: PixBuf, s: LookSpec, g: Geo, R: Ramps): void {
  if (!s.beard) return;
  const y = g.headTop;
  const ox = g.ox;
  const hr = R.hr;
  const kind = hashStr(s.key + 'beard') % 4;
  if (kind === 1) {
    // 염소수염
    b.hline(14 + ox, 17 + ox, y + 14, hr[2]); b.hline(15 + ox, 16 + ox, y + 15, hr[2]); b.set(15 + ox, y + 16, hr[1]);
    b.hline(14 + ox, 17 + ox, y + 12, hr[2]);
    return;
  }
  if (kind === 2) {
    // 콧수염
    b.hline(13 + ox, 18 + ox, y + 12, hr[2]); b.set(12 + ox, y + 13, hr[1]); b.set(19 + ox, y + 13, hr[1]);
    return;
  }
  if (kind === 3) {
    // 구레나룻
    for (let i = 8; i <= 13; i++) { b.hline(8 + ox, 9 + ox, y + i, hr[2]); b.hline(22 + ox, 23 + ox, y + i, hr[1]); }
    b.hline(10 + ox, 11 + ox, y + 13, hr[2]); b.hline(20 + ox, 21 + ox, y + 13, hr[1]);
    return;
  }
  for (let i = 12; i <= 14; i++) {
    const k = HEAD_HW[i];
    span(b, k, y + i, hr[2], ox);
    b.set(16 - k + ox, y + i, hr[1]); b.set(15 + k + ox, y + i, hr[1]);
  }
  b.hline(14 + ox, 17 + ox, y + 13, darken(hr[2], 0.5));
  b.hline(12 + ox, 19 + ox, y + 12, hr[3]);
  for (let j = 1; j <= 4; j++) span(b, Math.max(2, 5 - j), y + 14 + j, j === 4 ? hr[1] : hr[2], ox);
}

// =============================================================== 머리카락
const BANGS: Record<HairStyle, number[]> = {
  short: [2, 1, 2, 1, 1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 1, 2],
  spiky: [2, 1, 3, 1, 2, 1, 3, 1, 1, 3, 1, 2, 1, 3, 1, 2],
  long: [3, 2, 2, 1, 2, 1, 1, 2, 2, 1, 1, 2, 1, 2, 2, 3],
  ponytail: [2, 2, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 2, 2],
  twintails: [3, 2, 2, 1, 2, 2, 1, 1, 1, 1, 2, 2, 1, 2, 2, 3],
  bob: [4, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 4],
  messy: [2, 0, 3, 1, 2, 0, 2, 3, 1, 2, 0, 3, 1, 2, 0, 2],
  bun: [2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2],
  mohawk: [],
  bald: [],
  hime: [5, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 4, 5],
  swept: [3, 3, 3, 2, 2, 2, 1, 1, 1, 0, 0, 0, 1, 1, 2, 2],
  braid: [2, 1, 2, 2, 1, 1, 1, 2, 1, 1, 1, 2, 2, 1, 2, 2],
  afro: [2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2],
  curly: [3, 2, 2, 2, 1, 2, 1, 2, 2, 1, 2, 1, 2, 2, 2, 3],
  wavy: [3, 3, 2, 2, 3, 2, 1, 1, 2, 1, 2, 3, 2, 2, 3, 3],
  sidepony: [3, 3, 2, 2, 2, 1, 1, 1, 1, 1, 1, 0, 0, 1, 2, 2],
  dreads: [3, 1, 2, 1, 2, 1, 3, 1, 1, 3, 1, 2, 1, 2, 1, 3],
  undercut: [0, 0, 1, 2, 3, 3, 3, 3, 2, 2, 1, 1, 0, 0, 0, 0],
  odango: [3, 2, 2, 1, 1, 2, 1, 1, 1, 1, 2, 1, 1, 2, 2, 3],
  longbraid: [3, 2, 2, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 2, 2, 3],
  shaggy: [3, 1, 2, 2, 1, 3, 2, 1, 3, 1, 2, 3, 1, 2, 3, 2],
  parted: [3, 3, 2, 2, 2, 1, 1, 0, 0, 1, 1, 2, 2, 2, 3, 3],
  drills: [4, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 4],
  topknot: [1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1],
  wolfcut: [3, 1, 2, 2, 1, 2, 1, 3, 2, 1, 3, 1, 2, 2, 1, 3],
};
const SIDE: Record<HairStyle, number> = {
  short: 9, spiky: 8, long: 11, ponytail: 9, twintails: 11, bob: 13, messy: 9, bun: 9, mohawk: 0, bald: 0,
  hime: 13, swept: 8, braid: 11, afro: 12, curly: 11, wavy: 12, sidepony: 10, dreads: 13, undercut: 0,
  odango: 10, longbraid: 11, shaggy: 11, parted: 10, drills: 12, topknot: 8, wolfcut: 12,
};
const EYE_COLS = new Set([1, 2, 3, 12, 13, 14]);
const OPEN_TOP = ['none', 'circlet', 'bandana', 'goggles', 'antlers', 'headband', 'flowercrown', 'laurel', 'tiara'];

export function drawBackHair(b: PixBuf, s: LookSpec, g: Geo, R: Ramps): void {
  if (s.feat.crest) return;
  const st = s.hairStyle;
  const y0 = g.headTop;
  const ox = g.ox;
  const hr = R.hr;
  const A = R.A;
  const longBottom = g.torsoTop + (g.short ? 5 : 8);
  const curtain = (bottom: number, k: number, jag = 0, wave = false) => {
    for (let y = y0 + 3; y <= bottom; y++) {
      const kk = wave ? k + ((y >> 1) % 2) : k;
      span(b, kk, y, y > bottom - 3 ? hr[1] : hr[2], ox);
    }
    if (jag) {
      for (let x = 16 - k; x <= 15 + k; x++) {
        if ((x * 5) % 3 === 0) for (let j = 1; j <= jag; j++) b.set(x + ox, bottom + j, hr[1]);
      }
    } else {
      for (let x = 16 - k; x <= 15 + k; x += 2) b.set(x + ox, bottom + 1, hr[1]);
    }
  };
  switch (st) {
    case 'long': case 'hime': curtain(longBottom, 9); break;
    case 'wavy': curtain(longBottom + 1, 9, 0, true); break;
    case 'curly':
      curtain(y0 + 13, 10, 1);
      for (let y = y0 + 4; y <= y0 + 13; y += 3) { b.set(7 + ox, y, hr[3]); b.set(24 + ox, y + 1, hr[3]); }
      break;
    case 'afro':
      b.ellipse(15.5 + ox, y0 + 4, 11, 8, hr[1]);
      b.ellipse(15.5 + ox, y0 + 3, 10, 7, hr[2]);
      break;
    case 'bob': curtain(y0 + 12, 9); break;
    case 'wolfcut': curtain(y0 + 12, 9, 2); break;
    case 'shaggy': curtain(y0 + 10, 9, 2); break;
    case 'messy': case 'parted': curtain(y0 + 10, 9); break;
    case 'ponytail':
      for (let i = 0; i < 12; i++) {
        const x = 23 + ox + Math.floor(i / 5);
        b.hline(x, x + (i < 9 ? 2 : 1), y0 + 3 + i, i > 8 ? hr[1] : hr[2]);
      }
      break;
    case 'sidepony':
      for (let i = 0; i < 14; i++) {
        const x = 5 + ox - (i > 3 && i < 10 ? 1 : 0);
        b.hline(x, x + (i < 11 ? 3 : 2), y0 + 4 + i, i > 10 ? hr[1] : i % 4 === 1 ? hr[3] : hr[2]);
      }
      break;
    case 'twintails':
      for (let i = 0; i < 15; i++) {
        const w = i < 2 ? 2 : i < 12 ? 3 : 2;
        const y = y0 + 5 + i;
        const c = i > 11 ? hr[1] : i % 4 === 0 ? hr[3] : hr[2];
        const bulge = i > 3 && i < 11 ? 1 : 0;
        b.hline(6 + ox - bulge, 6 + ox + w - 1, y, c);
        b.hline(25 + ox - w + 1 + bulge, 25 + ox, y, c);
      }
      break;
    case 'drills':
      curtain(y0 + 9, 9);
      for (let i = 0; i < 13; i++) {
        const w = i < 10 ? 3 : i < 12 ? 2 : 1;
        for (let j = 0; j < w; j++) {
          const c = (i + j) % 3 === 0 ? hr[1] : (i + j) % 3 === 1 ? hr[3] : hr[2];
          b.set(5 + j + ox, y0 + 6 + i, c);
          b.set(26 - j + ox, y0 + 6 + i, c);
        }
      }
      break;
    case 'bun':
      b.ellipse(15.5 + ox, y0 - 1, 2.5, 2, hr[2]);
      b.set(14 + ox, y0 - 2, hr[3]);
      break;
    case 'topknot':
      b.ellipse(15.5 + ox, y0 - 3, 1.5, 1.5, hr[2]);
      b.set(15 + ox, y0 - 4, hr[3]);
      b.hline(15 + ox, 16 + ox, y0 - 1, A[2]);
      break;
    case 'braid':
      for (let i = 0; i < 12; i++) b.hline(7 + ox, 8 + ox, y0 + 8 + i, i % 2 ? hr[1] : hr[2]);
      b.hline(7 + ox, 8 + ox, y0 + 20, A[2]);
      break;
    case 'longbraid':
      curtain(y0 + 9, 9);
      for (let i = 0; i < 16; i++) {
        const y = y0 + 9 + i;
        if (y > g.footY - 4) break;
        b.hline(23 + ox, 24 + ox, y, i % 2 ? hr[1] : hr[2]);
        b.set(22 + ox + (i % 2), y, hr[3]);
      }
      b.hline(22 + ox, 24 + ox, Math.min(g.footY - 4, y0 + 25), A[2]);
      break;
    case 'dreads': {
      const h = hashStr(s.key + 'dread');
      for (let x = 7; x <= 24; x += 2) {
        const len = 8 + ((h >> (x % 16)) & 3) + (g.short ? 0 : 3);
        for (let i = 0; i < len; i++) b.set(x + ox, y0 + 4 + i, i % 3 === 2 ? hr[1] : hr[2]);
        if ((h >> x) & 1) b.set(x + ox, y0 + 4 + len - 2, A[3]);
      }
      break;
    }
    case 'odango': curtain(y0 + 9, 9); break;
  }
}

export function drawFrontHair(b: PixBuf, s: LookSpec, g: Geo, R: Ramps): void {
  if (s.feat.crest) { drawCrest(b, s, g, R); return; }
  const st = s.hairStyle;
  const y = g.headTop;
  const ox = g.ox;
  const { hr, kr, A } = R;
  const stubble = mix(kr[2], hr[1], 0.35);
  if (st === 'bald') {
    b.set(11 + ox, y + 2, kr[3]); b.set(12 + ox, y + 1, kr[3]);
    return;
  }
  if (st === 'mohawk') {
    for (let i = -3; i <= 6; i++) b.hline(14 + ox, 17 + ox, y + i, i < 0 ? hr[3] : hr[2]);
    for (let i = 1; i <= 5; i++) { b.set(9 + ox, y + i + 2, stubble); b.set(22 + ox, y + i + 2, stubble); }
    return;
  }
  // 정수리 볼륨
  if (OPEN_TOP.includes(s.head)) {
    span(b, 5, y - 1, hr[2], ox);
    b.set(11 + ox, y - 1, hr[1]); b.set(20 + ox, y - 1, hr[1]);
  }
  if (st === 'afro') {
    b.ellipse(15.5 + ox, y + 2, 10, 5.5, hr[2]);
    for (const [x, yy] of [[9, -2], [13, -3], [18, -3], [22, -1], [7, 2], [24, 3]]) b.set(x + ox, y + yy, hr[3]);
  } else {
    for (let i = 0; i <= 6; i++) {
      const k = HEAD_HW[i] + (i >= 1 ? 1 : 0);
      span(b, k, y + i, hr[2], ox);
      b.set(16 - k + ox, y + i, hr[1]);
      b.set(15 + k + ox, y + i, hr[1]);
    }
  }
  // 하이라이트
  b.hline(11 + ox, 13 + ox, y + 2, hr[3]); b.set(12 + ox, y + 1, hr[4]); b.hline(18 + ox, 19 + ox, y + 2, hr[3]);
  // 앞머리
  const pat = BANGS[st];
  for (let j = 0; j < 16; j++) {
    const len = EYE_COLS.has(j) ? Math.min(2, pat[j]) : pat[j];
    for (let d = 0; d < len; d++) b.set(8 + j + ox, y + 7 + d, d === len - 1 ? hr[1] : hr[2]);
  }
  // 옆머리
  const side = SIDE[st];
  for (let i = 7; i <= side; i++) {
    const wv = st === 'wavy' && (i >> 1) % 2 ? 1 : 0;
    b.set(8 + ox - wv, y + i, hr[2]); b.set(7 + ox - wv, y + i, hr[1]);
    b.set(23 + ox + wv, y + i, hr[2]); b.set(24 + ox + wv, y + i, hr[1]);
    if (st === 'hime' || st === 'bob' || st === 'drills') { b.set(9 + ox, y + i, hr[2]); b.set(22 + ox, y + i, hr[2]); }
  }
  switch (st) {
    case 'spiky':
      for (const x of [9, 12, 15, 18, 21]) { b.set(x + ox, y - 1, hr[2]); b.set(x + 1 + ox, y - 1, hr[2]); b.set(x + ox, y - 2, hr[3]); }
      break;
    case 'messy': case 'wolfcut':
      b.set(10 + ox, y - 1, hr[2]); b.set(19 + ox, y - 1, hr[2]); b.set(20 + ox, y - 2, hr[2]); b.set(6 + ox, y + 5, hr[1]); b.set(25 + ox, y + 4, hr[1]);
      if (st === 'wolfcut') { b.set(6 + ox, y + 10, hr[1]); b.set(25 + ox, y + 11, hr[1]); }
      break;
    case 'shaggy':
      for (const x of [9, 13, 17, 21]) b.set(x + ox, y - 1, hr[2]);
      b.set(6 + ox, y + 8, hr[1]); b.set(25 + ox, y + 9, hr[1]);
      break;
    case 'curly':
      for (let x = 8; x <= 23; x += 2) b.set(x + ox, y - 1 + ((x >> 1) % 2), hr[2]);
      for (const [x, yy] of [[10, 4], [14, 1], [20, 4], [17, 5]]) b.set(x + ox, y + yy, hr[3]);
      break;
    case 'twintails':
      b.rect(6 + ox, y + 4, 2, 2, A[2]); b.rect(24 + ox, y + 4, 2, 2, A[2]);
      break;
    case 'ponytail':
      b.rect(22 + ox, y + 3, 2, 2, A[2]);
      break;
    case 'sidepony':
      b.rect(7 + ox, y + 3, 2, 2, A[2]);
      break;
    case 'swept':
      b.set(23 + ox, y + 1, hr[3]); b.set(24 + ox, y + 2, hr[2]);
      break;
    case 'undercut':
      for (let i = 3; i <= 9; i++) { b.hline(8 + ox, 9 + ox, y + i, stubble); b.hline(22 + ox, 23 + ox, y + i, stubble); }
      b.set(7 + ox, y + 9, kr[2]); b.set(24 + ox, y + 9, kr[2]);
      b.hline(13 + ox, 17 + ox, y - 2, hr[2]); b.set(12 + ox, y - 1, hr[3]);
      break;
    case 'parted':
      b.vline(16 + ox, y, y + 2, hr[1]);
      break;
    case 'topknot':
      for (const x of [12, 15, 19]) b.vline(x + ox, y + 1, y + 5, hr[1]);
      break;
    case 'odango':
      for (const cx of [9.5, 21.5]) { b.ellipse(cx + ox, y - 1, 2, 2, hr[2]); b.set(Math.floor(cx) + ox, y - 2, hr[3]); }
      b.set(11 + ox, y + 1, A[2]); b.set(20 + ox, y + 1, A[2]);
      break;
    case 'dreads':
      for (const x of [8, 23]) for (let i = 7; i <= 13; i += 3) b.set(x + ox, y + i, A[3]);
      break;
  }
}

// =============================================================== 볏 (머리카락 대신)
function drawCrest(b: PixBuf, s: LookSpec, g: Geo, R: Ramps): void {
  const y = g.headTop;
  const ox = g.ox;
  const H = R.hr;
  const phase = g.headTop & 1;
  switch (s.feat.crest) {
    case 'mushroom': {
      const ks = [5, 8, 10, 11, 11, 11, 11, 10, 9];
      ks.forEach((k, i) => {
        const yy = y - 4 + i;
        span(b, k, yy, i < 2 ? H[3] : H[2], ox);
        b.set(16 - k + ox, yy, H[3]); b.set(15 + k + ox, yy, H[1]);
      });
      span(b, 9, y + 5, darken(H[1], 0.2), ox);
      for (let x = 8; x <= 23; x += 2) b.set(x + ox, y + 5, H[0]);
      const spot = hex('#f8f0e0');
      for (const [x, yy] of [[11, -2], [12, -2], [11, -1], [18, -3], [19, -3], [21, 0], [22, 0], [14, 1], [7, 2], [24, 2]]) b.set(x + ox, y + yy, spot);
      break;
    }
    case 'flame': case 'wisp': {
      const wisp = s.feat.crest === 'wisp';
      const F = H;
      for (let i = 0; i <= 5; i++) span(b, HEAD_HW[i] + (i ? 1 : 0), y + i, wisp ? withAlpha(F[2], 200) : F[2], ox);
      const heights = [3, 5, 4, 7, 5, 8, 6, 9, 7, 8, 5, 7, 4, 6, 3, 2];
      for (let j = 0; j < 16; j++) {
        const h = heights[(j + phase * 5) % 16];
        for (let d = 0; d < h; d++) {
          const lean = wisp ? -Math.floor(d / 3) : 0;
          const c = d < h * 0.4 ? F[2] : d < h * 0.75 ? F[3] : F[4];
          b.set(8 + j + ox + lean, y + 3 - d, wisp ? withAlpha(c, 170 + d * 6) : c);
        }
      }
      if (!wisp) { b.hline(13 + ox, 18 + ox, y + 1, lighten(F[4], 0.5)); b.hline(14 + ox, 17 + ox, y, F[4]); }
      break;
    }
    case 'leaf': {
      for (let i = 0; i <= 6; i++) {
        const k = HEAD_HW[i] + (i >= 1 ? 1 : 0);
        span(b, k, y + i, H[2], ox);
        b.set(16 - k + ox, y + i, H[1]); b.set(15 + k + ox, y + i, H[1]);
      }
      for (let j = 0; j < 16; j++) { const len = [2, 1, 2, 2, 1, 1, 2, 1, 1, 2, 1, 1, 2, 2, 1, 2][j]; for (let d = 0; d < len; d++) b.set(8 + j + ox, y + 7 + d, H[d === len - 1 ? 1 : 2]); }
      const leaf = (x: number, yy: number, dx: number) => {
        b.set(x + ox, yy, H[3]); b.set(x + dx + ox, yy - 1, H[2]); b.set(x + ox, yy - 1, H[3]); b.set(x + dx + ox, yy - 2, H[4]);
      };
      leaf(8, y + 2, -1); leaf(23, y + 2, 1); leaf(12, y - 1, -1); leaf(19, y - 1, 1); leaf(15, y - 2, 0);
      for (let i = 7; i <= 11; i++) { b.set(7 + ox, y + i, H[1]); b.set(24 + ox, y + i, H[1]); }
      if (hashStr(s.key) & 1) { const f = hex('#ff8ab0'); b.set(20 + ox, y + 2, f); b.set(21 + ox, y + 2, f); b.set(20 + ox, y + 1, hex('#fff2a0')); }
      break;
    }
    case 'crystal': {
      for (let i = 0; i <= 6; i++) span(b, HEAD_HW[i] + (i >= 1 ? 1 : 0), y + i, H[1], ox);
      for (let j = 0; j < 16; j++) if (j % 3 !== 1) b.set(8 + j + ox, y + 7, H[1]);
      const shard = (x: number, h: number, lean: number) => {
        for (let d = 0; d < h; d++) {
          const xx = x + Math.round((lean * d) / h) + ox;
          b.set(xx, y + 2 - d, H[3]);
          b.set(xx + 1, y + 2 - d, d === h - 1 ? H[4] : H[2]);
        }
        b.set(x + ox, y + 2 - Math.floor(h / 2), WHITE);
      };
      shard(9, 4, -2); shard(12, 6, -1); shard(15, 8, 0); shard(19, 5, 1); shard(22, 3, 2);
      break;
    }
    case 'feathers': {
      for (let i = 0; i <= 6; i++) {
        const k = HEAD_HW[i] + (i >= 1 ? 1 : 0);
        span(b, k, y + i, H[2], ox);
        b.set(15 + k + ox, y + i, H[1]);
      }
      for (let j = 0; j < 16; j++) b.set(8 + j + ox, y + 7, j % 2 ? H[1] : H[2]);
      const tips: [number, number][] = [[9, -3], [12, -6], [16, -7], [20, -6], [23, -3]];
      for (const [tx, ty] of tips) {
        b.line(16 + ox, y + 2, tx + ox, y + ty, H[2]);
        b.line(16 + ox, y + 3, tx + ox + (tx < 16 ? 1 : -1), y + ty + 1, H[3]);
        b.set(tx + ox, y + ty, R.A[2]);
      }
      break;
    }
  }
}

// =============================================================== 뿔·후광
export function drawHornsHalo(b: PixBuf, s: LookSpec, g: Geo): void {
  const y = g.headTop;
  const ox = g.ox;
  const h = s.feat.horns;
  if (h && h !== 'none' && !['greathelm', 'helm', 'horned', 'buckethelm'].includes(s.head)) {
    // 머리색과 대비되는 뿔 색
    const lightHair = luminance(hex(s.hair)) > 0.45;
    let c = s.race === 'imp' ? ramp('#7a2a2a') : lightHair ? ramp('#3a2e48') : ramp('#cbbfa4');
    if (h === 'bull' || h === 'curl') c = lightHair ? ramp('#6a5a48') : ramp('#d8ccb0');
    if (h === 'branch') c = ramp('#7a5a3a');
    const B = (x: number, yy: number, col: RGBA) => both(b, x, yy, col, ox);
    switch (h) {
      case 'small':
        for (const [x, yy, k] of [[11, 1, 2], [12, 1, 1], [11, 0, 2], [12, 0, 2], [11, -1, 3], [10, -2, 4]] as [number, number, number][]) B(x, y + yy, c[k]);
        break;
      case 'curl':
        for (const [x, yy, k] of [[9, 2, 2], [8, 2, 2], [7, 3, 2], [6, 4, 3], [6, 5, 2], [6, 6, 2], [7, 7, 1], [8, 7, 1], [8, 6, 3], [7, 2, 3], [5, 5, 1]] as [number, number, number][]) B(x, y + yy, c[k]);
        break;
      case 'bull':
        for (const [x, yy, k] of [[9, 3, 2], [8, 3, 2], [7, 3, 2], [6, 2, 3], [5, 2, 2], [5, 1, 3], [4, 0, 3], [4, -1, 4]] as [number, number, number][]) B(x, y + yy, c[k]);
        B(8, y + 4, c[1]); B(7, y + 4, c[1]);
        break;
      case 'branch': {
        const leaf = hex('#6ab04a');
        B(10, y + 1, c[2]); B(10, y, c[2]); B(9, y - 1, c[2]); B(9, y - 2, c[3]); B(8, y - 3, c[3]); B(10, y - 2, c[2]); B(11, y - 3, c[3]);
        B(8, y - 4, leaf); B(11, y - 4, leaf); B(7, y - 3, leaf);
        break;
      }
      default: {
        const horn = (x: number, dir: number) => {
          b.set(x + ox, y + 2, c[2]); b.set(x + ox, y + 1, c[2]); b.set(x - dir + ox, y + 1, c[2]);
          b.set(x - dir + ox, y, c[2]); b.set(x - 2 * dir + ox, y - 1, c[3]); b.set(x - 2 * dir + ox, y - 2, c[3]);
          b.set(x - 3 * dir + ox, y - 3, c[3]); b.set(x - 2 * dir + ox, y - 4, c[4]);
          b.set(x - dir + ox, y - 1, c[1]);
        };
        horn(9, 1); horn(22, -1);
      }
    }
  }
  if (s.feat.halo) {
    const hy = y - 3 + (s.head !== 'none' && !['circlet', 'tiara', 'headband', 'laurel', 'flowercrown'].includes(s.head) ? -3 : 0);
    const c = s.bound ? hex('#9ff0ff') : hex('#ffe680');
    const cl = s.bound ? hex('#e0fbff') : hex('#fff8d0');
    b.hline(13 + ox, 18 + ox, hy - 1, cl);
    b.set(11 + ox, hy, c); b.set(12 + ox, hy, c); b.set(19 + ox, hy, c); b.set(20 + ox, hy, c);
    b.hline(13 + ox, 18 + ox, hy + 1, c);
  }
}
