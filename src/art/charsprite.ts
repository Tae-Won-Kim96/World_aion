// 절차적 치비 픽셀 캐릭터 생성기 (32x40, 정면 3/4, 오른손에 무기)
// 레이어 순서: 날개 → 망토 → 뒷머리 → 꼬리 → 다리 → 몸통 → 왼팔/보조장비 → 머리 → 얼굴 → 수염
//            → 앞머리 → 모자 → 뿔/후광 → 오른팔/무기 → 외곽선 → 그림자

import { darken, desaturate, hex, lighten, mix, ramp, type RGBA, withAlpha } from './color';
import type { LookSpec } from './look';
import { PixBuf } from './pixbuf';

export const FRAME_W = 32;
export const FRAME_H = 40;
export type Pose = 'idle0' | 'idle1' | 'atk0' | 'atk1' | 'hurt';
export const POSES: Pose[] = ['idle0', 'idle1', 'atk0', 'atk1', 'hurt'];

type Ramp = [RGBA, RGBA, RGBA, RGBA, RGBA];

interface Geo {
  ox: number;        // 상체 좌우 기울기
  footY: number;
  legTop: number;
  torsoTop: number;
  headTop: number;
  tw: number;        // 몸통 반폭
  short: boolean;
  tall: boolean;
  grip: [number, number];
  angle: number;     // 무기 각도 (0=위, 시계방향)
  armPose: 'down' | 'up' | 'forward';
  eyes: 'open' | 'hurt';
  cast: boolean;     // 시전 빛
}

const HEAD_HW = [4, 6, 7, 7, 8, 8, 8, 8, 8, 8, 8, 7, 7, 6, 4];
const HEAD_H = HEAD_HW.length;

const OUTLINE_DARK = hex('#1a1020');
const WHITE = hex('#ffffff');
const METAL = ramp('#a9b2c3');
const DARKMETAL = ramp('#5d6475');
const GOLD = ramp('#e2b84a');
const WOOD = ramp('#8a5a33');
const LEATHER = ramp('#6b4a2f');
const PANTS = ramp('#3d3650');
const BONE = ramp('#e8e0c8');

function isCaster(w: string): boolean {
  return ['staff', 'wand', 'book', 'totem', 'flask'].includes(w);
}

function restAngle(w: string): number {
  switch (w) {
    case 'staff': case 'spear': case 'trident': case 'scythe': case 'totem': return 0;
    case 'greatsword': case 'greataxe': return 25;
    case 'dagger': case 'katar': return 35;
    case 'wand': return 20;
    default: return 18;
  }
}

function geometry(spec: LookSpec, pose: Pose): Geo {
  const short = spec.feat.height === 'short';
  const tall = spec.feat.height === 'tall';
  const bob = pose === 'idle1' ? 1 : 0;
  const ox = pose === 'atk0' ? -1 : pose === 'atk1' ? 2 : pose === 'hurt' ? -2 : 0;
  const footY = 38;
  const legLen = short ? 4 : tall ? 7 : 6;
  const torsoLen = short ? 7 : tall ? 10 : 9;
  const legTop = footY - legLen + 1;
  const torsoTop = legTop - torsoLen + bob;
  const headTop = torsoTop - HEAD_H + 2;
  const wide = ['dwarf', 'troll', 'orc'].includes(spec.race);
  const thin = ['imp', 'gnome', 'goblin', 'halfling'].includes(spec.race);
  const tw = wide ? 6 : thin ? 4 : 5;
  const rx = 16 + tw;
  let grip: [number, number] = [rx + 1 + ox, torsoTop + 7];
  let angle = restAngle(spec.weapon);
  let armPose: Geo['armPose'] = 'down';
  const caster = isCaster(spec.weapon);
  if (pose === 'atk0') {
    grip = [rx + 1 + ox, torsoTop - 1];
    angle = caster ? -8 : -40;
    armPose = 'up';
  } else if (pose === 'atk1') {
    grip = [rx + 4 + ox, torsoTop + 3];
    angle = caster ? 55 : 100;
    armPose = 'forward';
  } else if (pose === 'hurt') {
    grip = [rx + 1 + ox, torsoTop + 6];
    angle += 25;
  }
  if (spec.weapon === 'bow' || spec.weapon === 'crossbow') {
    if (pose === 'atk0' || pose === 'atk1') { grip = [rx + 3 + ox, torsoTop + 3]; armPose = 'forward'; }
    angle = 0;
  }
  return { ox, footY, legTop, torsoTop, headTop, tw, short, tall, grip, angle, armPose, eyes: pose === 'hurt' ? 'hurt' : 'open', cast: caster && (pose === 'atk0' || pose === 'atk1') };
}

/** 열 범위 [16-k, 15+k] */
function span(b: PixBuf, k: number, y: number, c: RGBA, ox = 0): void {
  b.hline(16 - k + ox, 15 + k + ox, y, c);
}

// =============================================================== 뒤 레이어

function drawWings(b: PixBuf, s: LookSpec, g: Geo): void {
  const kind = s.feat.wings;
  if (!kind || kind === 'none') return;
  const feather = kind === 'feather';
  const small = kind === 'small_bat';
  const r: Ramp = feather ? ramp('#f4f1ff') : ramp(small ? s.skin[1] : '#3a2a44');
  const widths = small ? [2, 3, 4, 4, 3, 2] : [3, 5, 6, 7, 8, 8, 7, 7, 6, 5, 4, 3, 2];
  const top = g.torsoTop - (small ? 3 : 6);
  const root = 16 - g.tw - 1 + g.ox;
  widths.forEach((w, i) => {
    const y = top + i;
    for (let j = 0; j < w; j++) {
      const x = root - j;
      let c = r[2];
      if (i > widths.length * 0.6) c = r[1];
      if (j === w - 1) c = r[1];
      if (feather && i % 3 === 2 && j > 1) c = r[1];
      if (feather && i < 2) c = r[3];
      if (!feather && j % 3 === 2) c = r[0]; // 박쥐 날개 뼈대
      b.set(x, y, c);
      b.set(31 - x + 2 * g.ox, y, c);
    }
  });
  if (!feather) {
    // 박쥐 날개 아래 가장자리를 물결 모양으로
    const by = top + widths.length;
    for (let j = 0; j < widths[widths.length - 1] + 2; j += 2) {
      b.clear(root - j, by - 1);
      b.clear(31 - (root - j) + 2 * g.ox, by - 1);
    }
  }
}

function drawCape(b: PixBuf, s: LookSpec, g: Geo): void {
  if (!s.cape) return;
  const r = ramp(s.cape);
  const k = g.tw + 2;
  for (let y = g.torsoTop + 1; y <= g.legTop + (g.short ? 2 : 4); y++) {
    span(b, k, y, y > g.legTop ? r[1] : r[2], g.ox);
    b.set(16 - k + g.ox, y, r[1]);
    b.set(15 + k + g.ox, y, r[0]);
  }
  // 아래 가장자리 지그재그
  const by = g.legTop + (g.short ? 2 : 4);
  for (let x = 16 - k; x <= 15 + k; x += 3) b.clear(x + g.ox, by);
}

function drawBackHair(b: PixBuf, s: LookSpec, g: Geo, hr: Ramp): void {
  const st = s.hairStyle;
  const y0 = g.headTop;
  const ox = g.ox;
  if (st === 'long' || st === 'hime') {
    const bottom = g.torsoTop + (g.short ? 5 : 8);
    for (let y = y0 + 3; y <= bottom; y++) {
      const k = y < y0 + 6 ? 9 : 9;
      span(b, k, y, y > bottom - 3 ? hr[1] : hr[2], ox);
    }
    for (let x = 16 - 9; x <= 15 + 9; x += 2) b.set(x + ox, bottom + 1, hr[1]);
  } else if (st === 'ponytail') {
    for (let i = 0; i < 12; i++) {
      const x = 23 + ox + Math.floor(i / 5);
      const w = i < 3 ? 3 : i < 9 ? 3 : 2;
      b.hline(x, x + w - 1, y0 + 3 + i, i > 8 ? hr[1] : hr[2]);
    }
  } else if (st === 'twintails') {
    for (let i = 0; i < 15; i++) {
      const w = i < 2 ? 2 : i < 12 ? 3 : 2;
      const y = y0 + 5 + i;
      const c = i > 11 ? hr[1] : i % 4 === 0 ? hr[3] : hr[2];
      b.hline(6 + ox - (i > 3 && i < 11 ? 1 : 0), 6 + ox + w - 1, y, c);
      b.hline(25 + ox - w + 1 + (i > 3 && i < 11 ? 1 : 0), 25 + ox, y, c);
    }
  } else if (st === 'bob') {
    for (let y = y0 + 3; y <= y0 + 13; y++) span(b, 9, y, y > y0 + 11 ? hr[1] : hr[2], ox);
  } else if (st === 'bun') {
    b.ellipse(15.5 + ox, y0 - 1, 2.5, 2, hr[2]);
    b.set(14 + ox, y0 - 2, hr[3]);
  } else if (st === 'braid') {
    for (let i = 0; i < 12; i++) {
      const y = y0 + 8 + i;
      b.hline(7 + ox, 8 + ox, y, i % 2 ? hr[1] : hr[2]);
    }
  }
}

function drawTail(b: PixBuf, s: LookSpec, g: Geo, hr: Ramp): void {
  const t = s.feat.tail;
  if (!t || t === 'none') return;
  const y = g.legTop - 1;
  if (t === 'devil') {
    const c = hex(s.race === 'imp' ? s.skin[1] : '#2a1a2a');
    const pts = [[20, y], [21, y + 1], [22, y + 1], [23, y + 2], [24, y + 3], [25, y + 3]];
    for (const [x, yy] of pts) b.set(x, yy, c);
    b.set(26, y + 2, c); b.set(26, y + 3, c); b.set(26, y + 4, c); b.set(27, y + 3, c); b.set(25, y + 2, c); b.set(25, y + 4, c);
  } else if (t === 'beast') {
    b.ellipse(22.5, y + 1, 2.5, 2.5, hr[2]);
    b.ellipse(24.5, y - 1, 1.5, 1.5, hr[3]);
    b.set(21, y + 3, hr[1]); b.set(22, y + 3, hr[1]);
  }
}

// =============================================================== 몸

function drawLegs(b: PixBuf, s: LookSpec, g: Geo, kr: Ramp): void {
  const { legTop, footY } = g;
  const o = s.outfit;
  let pants: Ramp = PANTS;
  let boots: Ramp = LEATHER;
  if (o === 'plate') { pants = METAL; boots = DARKMETAL; }
  else if (o === 'tribal' || o === 'rags') { pants = kr; boots = LEATHER; }
  else if (o === 'gi') { pants = ramp(s.main); boots = kr; }
  else if (o === 'tunic') { pants = ramp(s.accent); }
  else if (o === 'dress') { pants = ramp('#2a2433'); boots = ramp('#3a2430'); }
  if (o === 'bone') {
    for (const x of [13, 18]) {
      b.vline(x, legTop, footY - 1, BONE[2]);
      b.set(x, legTop + 2, BONE[3]);
    }
    b.hline(12, 14, footY, BONE[1]);
    b.hline(17, 19, footY, BONE[1]);
    return;
  }
  for (let y = legTop; y <= footY; y++) {
    const isBoot = y >= footY - 1;
    const r = isBoot ? boots : pants;
    b.hline(12, 14, y, r[2]);
    b.hline(17, 19, y, r[2]);
    b.set(14, y, r[1]);
    b.set(19, y, r[1]);
    if (isBoot) { b.set(11, footY, r[1]); b.set(20, footY, r[1]); b.set(12, y - 0, r[3]); }
  }
  b.set(12, legTop, pants[3]);
  b.set(17, legTop, pants[3]);
  if (o === 'tribal') { b.hline(12, 14, footY - 2, LEATHER[2]); b.hline(17, 19, footY - 2, LEATHER[2]); }
}

function torsoRows(g: Geo): number[] {
  const rows: number[] = [];
  for (let y = g.torsoTop; y < g.legTop; y++) rows.push(y);
  return rows;
}

function drawTorso(b: PixBuf, s: LookSpec, g: Geo, kr: Ramp): void {
  const M = ramp(s.main);
  const A = ramp(s.accent);
  const { tw, ox } = g;
  const rows = torsoRows(g);
  const o = s.outfit;
  const L = 16 - tw + ox;
  const R = 15 + tw + ox;
  const mid = (y: number) => y - g.torsoTop;

  const fill = (r: Ramp) => {
    for (const y of rows) {
      const k = mid(y) === 0 ? tw - 1 : tw;
      span(b, k, y, r[2], ox);
      b.set(16 - k + ox, y, r[3]);
      b.set(15 + k + ox, y, r[1]);
    }
  };

  switch (o) {
    case 'plate': {
      fill(METAL);
      for (const y of rows) if (mid(y) >= 2) b.hline(14 + ox, 17 + ox, y, M[2]);
      for (let y = g.torsoTop + 2; y <= g.legTop + 1; y++) { b.set(14 + ox, y, M[3]); b.set(17 + ox, y, M[1]); }
      b.hline(14 + ox, 17 + ox, g.legTop, M[1]); b.hline(14 + ox, 17 + ox, g.legTop + 1, M[1]);
      b.hline(L, R, g.legTop - 2, LEATHER[1]);
      b.set(15 + ox, g.legTop - 2, GOLD[3]); b.set(16 + ox, g.legTop - 2, GOLD[2]);
      // 견갑
      b.hline(L - 2, L + 1, g.torsoTop, METAL[3]); b.hline(L - 2, L + 1, g.torsoTop + 1, METAL[2]);
      b.hline(R - 1, R + 2, g.torsoTop, METAL[3]); b.hline(R - 1, R + 2, g.torsoTop + 1, METAL[1]);
      b.set(L - 2, g.torsoTop + 2, METAL[1]); b.set(R + 2, g.torsoTop + 2, METAL[0]);
      break;
    }
    case 'chain': {
      fill(METAL);
      for (const y of rows) for (let x = L; x <= R; x++) if ((x + y) % 2 === 0) b.set(x, y, METAL[1]);
      for (const y of rows) if (mid(y) >= 2) b.hline(13 + ox, 18 + ox, y, M[2]);
      for (let y = g.torsoTop + 2; y < g.legTop + 1; y++) { b.set(13 + ox, y, A[2]); b.set(18 + ox, y, A[2]); }
      b.hline(L, R, g.legTop - 2, LEATHER[2]);
      b.set(15 + ox, g.legTop - 2, GOLD[2]);
      break;
    }
    case 'leather': {
      fill(M);
      b.line(L + 1, g.torsoTop + 1, R - 1, g.legTop - 3, A[1]);
      b.hline(L, R, g.legTop - 2, LEATHER[0]);
      b.set(15 + ox, g.legTop - 2, GOLD[3]);
      b.hline(15 + ox, 16 + ox, g.torsoTop, kr[2]);
      break;
    }
    case 'robe': case 'vestment': {
      const R0 = o === 'vestment' ? ramp(s.main) : M;
      fill(R0);
      // 치마: 발끝까지
      for (let y = g.legTop; y < g.footY; y++) {
        const k = tw + Math.min(2, Math.floor((y - g.legTop) / 2));
        span(b, k, y, R0[2], Math.round(ox / 2));
        b.set(16 - k + Math.round(ox / 2), y, R0[3]);
        b.set(15 + k + Math.round(ox / 2), y, R0[1]);
      }
      span(b, tw + 2, g.footY - 1, A[2], Math.round(ox / 2));
      b.vline(15 + ox, g.torsoTop + 2, g.footY - 2, A[2]);
      b.vline(16 + ox, g.torsoTop + 2, g.footY - 2, A[1]);
      b.set(15 + ox, g.torsoTop, A[3]); b.set(16 + ox, g.torsoTop, A[3]);
      b.set(14 + ox, g.torsoTop + 1, A[2]); b.set(17 + ox, g.torsoTop + 1, A[2]);
      if (o === 'vestment') {
        b.vline(13 + ox, g.torsoTop + 1, g.footY - 2, GOLD[2]);
        b.vline(18 + ox, g.torsoTop + 1, g.footY - 2, GOLD[1]);
        b.vline(15 + ox, g.torsoTop + 3, g.torsoTop + 6, GOLD[3]);
        b.hline(14 + ox, 17 + ox, g.torsoTop + 4, GOLD[3]);
      }
      break;
    }
    case 'cloak': {
      fill(ramp(s.accent));
      b.hline(15 + ox, 16 + ox, g.torsoTop, kr[2]);
      b.hline(L, R, g.legTop - 2, LEATHER[1]);
      // 어깨를 덮는 망토
      for (const y of rows) {
        const d = mid(y);
        if (d > 6) continue;
        b.hline(L - 1, L + 1, y, d % 3 === 2 ? M[1] : M[2]);
        b.hline(R - 1, R + 1, y, M[1]);
      }
      b.hline(L, R, g.torsoTop, M[3]);
      b.set(15 + ox, g.torsoTop + 1, GOLD[2]);
      break;
    }
    case 'tunic': {
      fill(M);
      b.hline(15 + ox, 16 + ox, g.torsoTop, kr[2]); b.set(15 + ox, g.torsoTop + 1, kr[1]); b.set(16 + ox, g.torsoTop + 1, kr[1]);
      b.hline(L, R, g.legTop - 2, A[1]);
      b.hline(L, R, g.legTop - 1, M[1]);
      break;
    }
    case 'tribal': {
      fill(kr);
      b.line(L, g.torsoTop + 1, R, g.legTop - 2, LEATHER[1]);
      b.hline(L - 1, L + 2, g.torsoTop, ramp(s.accent)[3]); b.hline(L - 1, L + 2, g.torsoTop + 1, ramp(s.accent)[2]);
      b.set(L - 1, g.torsoTop + 2, ramp(s.accent)[1]);
      b.hline(L, R, g.legTop - 1, M[2]); b.hline(L + 1, R - 1, g.legTop, M[2]); b.hline(L + 2, R - 2, g.legTop + 1, M[1]);
      b.set(14 + ox, g.torsoTop + 4, kr[1]); b.set(17 + ox, g.torsoTop + 4, kr[1]);
      break;
    }
    case 'gi': {
      fill(M);
      b.line(13 + ox, g.torsoTop, 17 + ox, g.torsoTop + 4, M[1]);
      b.hline(15 + ox, 16 + ox, g.torsoTop, kr[2]); b.set(15 + ox, g.torsoTop + 1, kr[2]);
      b.hline(L, R, g.legTop - 2, A[0]); b.set(R - 1, g.legTop - 1, A[0]);
      break;
    }
    case 'dress': {
      fill(M);
      b.hline(L + 1, R - 1, g.torsoTop, A[3]);
      b.vline(15 + ox, g.torsoTop + 1, g.legTop - 2, A[2]);
      for (let y = g.legTop - 2; y < g.footY - 1; y++) {
        const k = tw + Math.min(3, Math.floor((y - g.legTop + 3) / 2));
        span(b, k, y, M[2], Math.round(ox / 2));
        b.set(16 - k + Math.round(ox / 2), y, M[3]);
        b.set(15 + k + Math.round(ox / 2), y, M[1]);
      }
      for (let x = 16 - tw - 3; x <= 15 + tw + 3; x++) b.set(x + Math.round(ox / 2), g.footY - 1, x % 2 ? A[3] : A[2]);
      break;
    }
    case 'coat': {
      fill(M);
      for (let y = g.legTop; y <= g.legTop + (g.short ? 1 : 3); y++) {
        b.hline(L, 14 + ox, y, M[2]); b.hline(17 + ox, R, y, M[1]);
      }
      b.vline(15 + ox, g.torsoTop, g.legTop - 1, A[2]);
      b.vline(16 + ox, g.torsoTop, g.legTop - 1, A[3]);
      b.set(14 + ox, g.torsoTop, M[3]); b.set(17 + ox, g.torsoTop, M[3]);
      b.set(14 + ox, g.torsoTop + 1, M[3]); b.set(17 + ox, g.torsoTop + 1, M[3]);
      for (let y = g.torsoTop + 3; y < g.legTop; y += 2) b.set(14 + ox, y, GOLD[2]);
      b.hline(L, R, g.legTop - 2, LEATHER[0]);
      break;
    }
    case 'rags': {
      fill(M);
      for (const y of rows) for (let x = L; x <= R; x++) if ((x * 7 + y * 3) % 11 === 0) b.set(x, y, kr[1]);
      for (let x = L; x <= R; x += 2) b.set(x, g.legTop, M[1]);
      break;
    }
    case 'bone': {
      b.vline(15 + ox, g.torsoTop, g.legTop, BONE[2]);
      b.vline(16 + ox, g.torsoTop, g.legTop, BONE[1]);
      for (let y = g.torsoTop + 1; y < g.legTop - 2; y += 2) {
        b.hline(L + 1, R - 1, y, BONE[2]);
        b.set(L + 1, y, BONE[3]);
        b.set(R - 1, y, BONE[1]);
      }
      b.hline(L + 1, R - 1, g.legTop - 1, BONE[1]);
      b.hline(L + 2, R - 2, g.legTop - 1, M[2]);
      b.hline(L + 2, R - 2, g.legTop, M[1]);
      break;
    }
  }
  // 목 아래 그림자
  b.over(15 + ox, g.headTop + HEAD_H, darken(b.get(15 + ox, g.headTop + HEAD_H) || kr[1], 0.25));
  b.over(16 + ox, g.headTop + HEAD_H, darken(b.get(16 + ox, g.headTop + HEAD_H) || kr[1], 0.25));
  if (s.cape) {
    const C = ramp(s.cape);
    b.set(L, g.torsoTop, C[3]); b.set(R, g.torsoTop, C[2]);
    b.set(L + 1, g.torsoTop, GOLD[2]); b.set(R - 1, g.torsoTop, GOLD[2]);
  }
}

function sleeveRamp(s: LookSpec, kr: Ramp): Ramp {
  switch (s.outfit) {
    case 'plate': case 'chain': return METAL;
    case 'tribal': case 'rags': return kr;
    case 'bone': return BONE;
    case 'cloak': return ramp(s.main);
    default: return ramp(s.main);
  }
}

function handRamp(s: LookSpec, kr: Ramp): Ramp {
  if (s.outfit === 'plate') return METAL;
  if (s.outfit === 'bone') return BONE;
  if (s.weapon === 'fist' && s.race !== 'skeleton') return ramp(s.accent);
  return kr;
}

function drawLeftArm(b: PixBuf, s: LookSpec, g: Geo, kr: Ramp): void {
  const sl = sleeveRamp(s, kr);
  const hd = handRamp(s, kr);
  const x0 = 16 - g.tw - 2 + g.ox;
  const thin = s.outfit === 'bone';
  for (let y = g.torsoTop + 1; y <= g.torsoTop + 6; y++) {
    if (thin) { b.set(x0 + 1, y, sl[2]); continue; }
    b.set(x0, y, sl[3]);
    b.set(x0 + 1, y, sl[2]);
  }
  if (s.outfit === 'robe' || s.outfit === 'vestment') {
    b.hline(x0 - 1, x0 + 1, g.torsoTop + 6, ramp(s.accent)[2]);
  }
  b.rect(x0, g.torsoTop + 7, 2, 2, hd[2]);
  b.set(x0, g.torsoTop + 8, hd[1]);
}

function drawRightArm(b: PixBuf, s: LookSpec, g: Geo, kr: Ramp): void {
  const sl = sleeveRamp(s, kr);
  const hd = handRamp(s, kr);
  const x0 = 15 + g.tw + 1 + g.ox;
  const [gx, gy] = g.grip;
  const thin = s.outfit === 'bone';
  if (g.armPose === 'down') {
    for (let y = g.torsoTop + 1; y <= g.torsoTop + 6; y++) {
      if (!thin) b.set(x0, y, sl[2]);
      b.set(x0 + 1, y, sl[1]);
    }
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

// =============================================================== 머리

function drawHeadShape(b: PixBuf, s: LookSpec, g: Geo, kr: Ramp): void {
  const skull = !!s.feat.skull;
  const r = skull ? BONE : kr;
  for (let i = 0; i < HEAD_H; i++) {
    const y = g.headTop + i;
    const k = HEAD_HW[i];
    span(b, k, y, r[2], g.ox);
    if (i >= 9) { b.set(16 - k + g.ox, y, r[1]); b.set(15 + k + g.ox, y, r[1]); }
    if (i >= 12) { b.set(16 - k + 1 + g.ox, y, r[1]); b.set(15 + k - 1 + g.ox, y, r[1]); }
  }
  // 볼 하이라이트
  b.set(10 + g.ox, g.headTop + 11, r[3]);
}

function drawEars(b: PixBuf, s: LookSpec, g: Geo, kr: Ramp, hr: Ramp): void {
  const e = s.feat.ears;
  const y = g.headTop;
  const ox = g.ox;
  const both = (x: number, yy: number, c: RGBA) => { b.set(x + ox, yy, c); b.set(31 - x + ox, yy, c); };
  if (e === 'pointy') {
    both(7, y + 9, kr[2]); both(7, y + 8, kr[2]); both(6, y + 8, kr[1]); both(6, y + 7, kr[1]);
  } else if (e === 'long') {
    for (let i = 0; i < 5; i++) { both(7 - i, y + 9 - i, kr[2]); both(7 - i, y + 10 - i, i === 0 ? kr[1] : kr[2]); }
    both(3, y + 4, kr[3]);
  } else if (e === 'fin') {
    const f = ramp(s.skin[2]);
    for (let i = 0; i < 6; i++) { both(7 - (i % 2), y + 6 + i, f[1]); both(6 - (i % 2), y + 6 + i, i % 2 ? f[2] : f[3]); }
    both(5, y + 7, f[1]); both(5, y + 9, f[1]);
  } else if (e === 'beast') {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j <= 3 - i; j++) both(9 + j, y + 1 - i, hr[2]);
    }
    both(10, y, mix(kr[2], hex('#ff9ab0'), 0.5)); both(10, y - 1, mix(kr[2], hex('#ff9ab0'), 0.5));
  }
}

function drawFace(b: PixBuf, s: LookSpec, g: Geo, kr: Ramp): void {
  const y = g.headTop;
  const ox = g.ox;
  const e0 = y + 8;
  const dark = OUTLINE_DARK;
  if (s.feat.skull) {
    for (const x of [9, 20]) b.rect(x + ox, e0, 3, 3, hex('#1a1018'));
    const glow = hex(s.feat.glowEyes ?? '#ff4a4a');
    b.set(10 + ox, e0 + 1, glow); b.set(21 + ox, e0 + 1, glow);
    b.set(15 + ox, y + 11, hex('#1a1018')); b.set(16 + ox, y + 11, hex('#1a1018'));
    for (let x = 12; x <= 19; x++) b.set(x + ox, y + 12, x % 2 ? BONE[3] : hex('#2a2030'));
    b.hline(12 + ox, 19 + ox, y + 13, BONE[1]);
    return;
  }
  const glowHex = s.vampire ? '#ff2a4a' : s.feat.glowEyes;
  const iris = hex(s.vampire ? '#d01838' : s.eye);
  if (g.eyes === 'hurt') {
    b.set(10 + ox, e0, dark); b.set(11 + ox, e0 + 1, dark); b.set(10 + ox, e0 + 2, dark);
    b.set(21 + ox, e0, dark); b.set(20 + ox, e0 + 1, dark); b.set(21 + ox, e0 + 2, dark);
  } else if (glowHex) {
    const gl = hex(glowHex);
    for (const x of [10, 20]) {
      b.set(x + ox, e0, dark); b.set(x + 1 + ox, e0, dark);
      b.set(x + ox, e0 + 1, gl); b.set(x + 1 + ox, e0 + 1, lighten(gl, 0.6));
      b.set(x + ox, e0 + 2, gl); b.set(x + 1 + ox, e0 + 2, gl);
      b.set(x + ox, e0 + 3, darken(gl, 0.25)); b.set(x + 1 + ox, e0 + 3, darken(gl, 0.25));
    }
  } else {
    const deep = darken(iris, 0.45);
    for (const x of [10, 20]) {
      b.set(x + ox, e0, dark); b.set(x + 1 + ox, e0, dark);
      b.set(x + ox, e0 + 1, deep); b.set(x + 1 + ox, e0 + 1, WHITE);
      b.set(x + ox, e0 + 2, iris); b.set(x + 1 + ox, e0 + 2, iris);
      b.set(x + ox, e0 + 3, lighten(iris, 0.3)); b.set(x + 1 + ox, e0 + 3, iris);
    }
    if (s.gender === 'f') { b.set(9 + ox, e0, dark); b.set(22 + ox, e0, dark); b.set(9 + ox, e0 - 1, dark); b.set(22 + ox, e0 - 1, dark); }
  }
  // 코
  if (s.feat.bigNose) { b.set(15 + ox, y + 11, kr[1]); b.set(16 + ox, y + 11, kr[1]); b.set(15 + ox, y + 12, kr[1]); b.set(16 + ox, y + 12, kr[0]); }
  // 홍조
  if (s.blush) { b.set(9 + ox, y + 12, mix(kr[2], hex('#ff6a8a'), 0.45)); b.set(22 + ox, y + 12, mix(kr[2], hex('#ff6a8a'), 0.45)); }
  // 주근깨
  if ((s.feat.freckles ?? 0) > 0.3) { b.set(12 + ox, y + 12, kr[1]); b.set(19 + ox, y + 12, kr[1]); }
  // 아가미
  if (s.feat.gills) { for (let i = 0; i < 3; i++) { b.set(9 + ox, y + 11 + i, kr[0]); b.set(22 + ox, y + 11 + i, kr[0]); } }
  // 입
  const mouth = g.eyes === 'hurt' ? darken(kr[2], 0.6) : darken(kr[2], 0.45);
  if (g.eyes === 'hurt') { b.hline(15 + ox, 16 + ox, y + 12, mouth); b.hline(15 + ox, 16 + ox, y + 13, mouth); }
  else if (s.gender === 'f') b.set(16 + ox, y + 13, mix(mouth, hex('#c0405a'), 0.4));
  else b.hline(15 + ox, 16 + ox, y + 13, mouth);
  if (s.feat.tusks) { b.set(13 + ox, y + 13, BONE[3]); b.set(13 + ox, y + 12, BONE[2]); b.set(18 + ox, y + 13, BONE[3]); b.set(18 + ox, y + 12, BONE[2]); }
  if (s.vampire) { b.set(14 + ox, y + 14, WHITE); b.set(17 + ox, y + 14, WHITE); }
}

function drawBeard(b: PixBuf, s: LookSpec, g: Geo, hr: Ramp): void {
  if (!s.beard) return;
  const y = g.headTop;
  const ox = g.ox;
  for (let i = 12; i <= 14; i++) {
    const k = HEAD_HW[i];
    span(b, k, y + i, hr[2], ox);
    b.set(16 - k + ox, y + i, hr[1]); b.set(15 + k + ox, y + i, hr[1]);
  }
  b.hline(14 + ox, 17 + ox, y + 13, darken(hr[2], 0.5));
  b.hline(12 + ox, 19 + ox, y + 12, hr[3]);
  for (let j = 1; j <= 4; j++) {
    const k = Math.max(2, 5 - j);
    span(b, k, y + 14 + j, j === 4 ? hr[1] : hr[2], ox);
  }
}

function drawFrontHair(b: PixBuf, s: LookSpec, g: Geo, hr: Ramp, kr: Ramp): void {
  const st = s.hairStyle;
  const y = g.headTop;
  const ox = g.ox;
  if (st === 'bald') {
    b.set(11 + ox, y + 2, kr[3]); b.set(12 + ox, y + 1, kr[3]);
    return;
  }
  if (st === 'mohawk') {
    for (let i = -3; i <= 6; i++) b.hline(14 + ox, 17 + ox, y + i, i < 0 ? hr[3] : hr[2]);
    for (let i = 1; i <= 5; i++) { b.set(9 + ox, y + i + 2, kr[1]); b.set(22 + ox, y + i + 2, kr[1]); }
    return;
  }
  // 캡 (모자가 없으면 정수리 볼륨 한 줄 추가)
  if (['none', 'circlet', 'bandana', 'goggles', 'antlers'].includes(s.head)) {
    span(b, 5, y - 1, hr[2], ox);
    b.set(11 + ox, y - 1, hr[1]); b.set(20 + ox, y - 1, hr[1]);
  }
  for (let i = 0; i <= 6; i++) {
    const k = HEAD_HW[i] + (i >= 1 ? 1 : 0);
    span(b, k, y + i, hr[2], ox);
    b.set(16 - k + ox, y + i, hr[1]);
    b.set(15 + k + ox, y + i, hr[1]);
  }
  // 하이라이트 (천사의 고리)
  b.hline(11 + ox, 13 + ox, y + 2, hr[3]); b.set(12 + ox, y + 1, hr[4]); b.hline(18 + ox, 19 + ox, y + 2, hr[3]);
  // 앞머리
  const bangsPattern: Record<string, number[]> = {
    short: [2, 1, 2, 1, 1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 1, 2],
    spiky: [2, 1, 3, 1, 2, 1, 3, 1, 1, 3, 1, 2, 1, 3, 1, 2],
    long: [3, 2, 2, 1, 2, 1, 1, 2, 2, 1, 1, 2, 1, 2, 2, 3],
    ponytail: [2, 2, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 2, 2],
    twintails: [3, 2, 2, 1, 2, 2, 1, 1, 1, 1, 2, 2, 1, 2, 2, 3],
    bob: [4, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 4],
    messy: [2, 0, 3, 1, 2, 0, 2, 3, 1, 2, 0, 3, 1, 2, 0, 2],
    bun: [2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 1, 2],
    hime: [5, 4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 4, 5],
    swept: [3, 3, 3, 2, 2, 2, 1, 1, 1, 0, 0, 0, 1, 1, 2, 2],
    braid: [2, 1, 2, 2, 1, 1, 1, 2, 1, 1, 1, 2, 2, 1, 2, 2],
  };
  const pat = bangsPattern[st] ?? bangsPattern.short;
  for (let j = 0; j < 16; j++) {
    const x = 8 + j + ox;
    const len = pat[j];
    for (let d = 0; d < len; d++) b.set(x, y + 7 + d, d === len - 1 ? hr[1] : hr[2]);
  }
  // 옆머리
  const side = st === 'bob' || st === 'hime' ? 13 : st === 'long' || st === 'twintails' || st === 'braid' ? 11 : st === 'swept' || st === 'spiky' ? 8 : 9;
  for (let i = 7; i <= side; i++) {
    b.set(8 + ox, y + i, hr[2]); b.set(7 + ox, y + i, hr[1]);
    b.set(23 + ox, y + i, hr[2]); b.set(24 + ox, y + i, hr[1]);
    if (st === 'hime' || st === 'bob') { b.set(9 + ox, y + i, hr[2]); b.set(22 + ox, y + i, hr[2]); }
  }
  if (st === 'spiky') {
    for (const x of [9, 12, 15, 18, 21]) {
      b.set(x + ox, y - 1, hr[2]); b.set(x + 1 + ox, y - 1, hr[2]); b.set(x + ox, y - 2, hr[3]);
    }
  }
  if (st === 'messy') {
    b.set(10 + ox, y - 1, hr[2]); b.set(19 + ox, y - 1, hr[2]); b.set(20 + ox, y - 2, hr[2]); b.set(6 + ox, y + 5, hr[1]); b.set(25 + ox, y + 4, hr[1]);
  }
  if (st === 'twintails') {
    const A = ramp(s.accent);
    b.rect(6 + ox, y + 4, 2, 2, A[2]); b.rect(24 + ox, y + 4, 2, 2, A[2]);
  }
  if (st === 'ponytail') {
    b.rect(22 + ox, y + 3, 2, 2, ramp(s.accent)[2]);
  }
  if (st === 'swept') { b.set(23 + ox, y + 1, hr[3]); b.set(24 + ox, y + 2, hr[2]); }
}

// =============================================================== 모자

function drawHeadgear(b: PixBuf, s: LookSpec, g: Geo, hr: Ramp): void {
  const y = g.headTop;
  const ox = g.ox;
  const M = ramp(s.main);
  const A = ramp(s.accent);
  const capRows = (from: number, to: number, r: Ramp, extra = 1) => {
    for (let i = from; i <= to; i++) {
      const k = HEAD_HW[Math.max(0, i)] + (i >= 2 ? extra : 0);
      span(b, k, y + i, r[2], ox);
      b.set(16 - k + ox, y + i, r[3]);
      b.set(15 + k + ox, y + i, r[1]);
    }
  };
  switch (s.head) {
    case 'none': return;
    case 'helm': {
      capRows(0, 6, METAL);
      span(b, 9, y + 6, METAL[1], ox);
      b.hline(12 + ox, 13 + ox, y + 2, METAL[4]);
      b.vline(15 + ox, y + 6, y + 9, METAL[1]); b.vline(16 + ox, y + 6, y + 9, METAL[0]);
      for (let i = -3; i <= 0; i++) b.hline(15 + ox, 16 + ox, y + i, i === -3 ? M[3] : M[2]);
      b.set(17 + ox, y - 2, M[1]); b.set(18 + ox, y - 1, M[1]);
      break;
    }
    case 'greathelm': {
      for (let i = 0; i < HEAD_H; i++) {
        const k = HEAD_HW[i] + (i >= 2 && i <= 11 ? 1 : 0);
        span(b, k, y + i, METAL[2], ox);
        b.set(16 - k + ox, y + i, METAL[3]);
        b.set(15 + k + ox, y + i, METAL[1]);
      }
      b.hline(9 + ox, 22 + ox, y + 8, OUTLINE_DARK);
      b.hline(10 + ox, 21 + ox, y + 9, METAL[0]);
      b.vline(15 + ox, y + 1, y + 13, METAL[3]);
      for (const x of [12, 14, 17, 19]) b.set(x + ox, y + 11, METAL[0]);
      b.hline(11 + ox, 13 + ox, y + 2, METAL[4]);
      for (let i = -3; i <= 0; i++) { b.set(15 + ox, y + i, M[2]); b.set(16 + ox, y + i, M[1]); b.set(17 + ox, y + i + 1, M[2]); }
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
        const bend = i > h - 4 ? (i - (h - 4)) : 0;
        span(b, k, y + 2 - i, i % 4 === 0 ? M[3] : M[2], ox + bend);
        b.set(15 + k + ox + bend, y + 2 - i, M[1]);
      }
      const tipX = 16 + ox + 4;
      b.set(tipX, y + 2 - h, M[1]);
      if (s.head === 'wizard') { b.set(13 + ox, y, GOLD[3]); b.set(12 + ox, y - 1, GOLD[2]); b.set(14 + ox, y - 1, GOLD[2]); }
      else { b.set(tipX + 1, y + 3 - h, M[1]); }
      break;
    }
    case 'hood': {
      const H = ramp(s.outfit === 'robe' || s.outfit === 'cloak' ? s.main : s.accent);
      for (let i = -1; i < HEAD_H; i++) {
        const k = HEAD_HW[Math.max(0, Math.min(HEAD_H - 1, i))] + 1;
        const yy = y + i;
        if (i <= 6) { span(b, k, yy, H[2], ox); }
        else { b.hline(16 - k + ox, 16 - k + 2 + ox, yy, H[2]); b.hline(15 + k - 2 + ox, 15 + k + ox, yy, H[1]); }
        b.set(16 - k + ox, yy, H[3]); b.set(15 + k + ox, yy, H[1]);
      }
      span(b, 7, y + 6, H[1], ox);
      b.hline(12 + ox, 14 + ox, y + 1, H[3]);
      break;
    }
    case 'mitre': {
      for (let i = 0; i < 9; i++) {
        const k = Math.max(2, 6 - Math.floor(i / 2));
        span(b, k, y + 3 - i, i % 3 === 0 ? M[3] : M[2], ox);
      }
      b.vline(15 + ox, y - 5, y + 3, GOLD[2]); b.vline(16 + ox, y - 5, y + 3, GOLD[1]);
      b.hline(13 + ox, 18 + ox, y - 1, GOLD[2]);
      span(b, 7, y + 4, GOLD[2], ox);
      break;
    }
    case 'circlet': {
      span(b, 9, y + 5, GOLD[2], ox);
      b.set(8 + ox, y + 5, GOLD[1]); b.set(23 + ox, y + 5, GOLD[1]);
      b.set(15 + ox, y + 5, A[3]); b.set(16 + ox, y + 5, A[2]); b.set(15 + ox, y + 4, GOLD[3]); b.set(16 + ox, y + 4, GOLD[3]);
      break;
    }
    case 'crown': {
      span(b, 8, y + 3, GOLD[2], ox); span(b, 8, y + 4, GOLD[1], ox);
      for (const x of [9, 12, 15, 19, 22]) {
        b.set(x + ox, y + 2, GOLD[2]); b.set(x + ox, y + 1, GOLD[3]);
        if (x === 15) { b.set(16 + ox, y + 2, GOLD[2]); b.set(16 + ox, y + 1, GOLD[3]); b.set(15 + ox, y, GOLD[4]); b.set(16 + ox, y, GOLD[3]); }
      }
      b.set(12 + ox, y + 3, hex('#d0304a')); b.set(19 + ox, y + 3, hex('#3a8ad0')); b.set(15 + ox, y + 3, hex('#3ad07a'));
      break;
    }
    case 'feather': {
      for (let i = 0; i <= 3; i++) span(b, 6 + Math.min(i, 2), y + i, i === 0 ? M[3] : M[2], ox - 1);
      span(b, 9, y + 4, M[1], ox - 1);
      for (let i = 0; i < 7; i++) { b.set(20 + ox + Math.floor(i / 2), y + 2 - i, A[2]); b.set(21 + ox + Math.floor(i / 2), y + 2 - i, A[3]); }
      break;
    }
    case 'antlers': {
      const c = ramp('#c9a87a');
      const branch = (sx: number, dir: number) => {
        b.line(sx + ox, y + 2, sx - 3 * dir + ox, y - 5, c[2]);
        b.line(sx - 1 * dir + ox, y - 1, sx - 4 * dir + ox, y - 2, c[2]);
        b.line(sx - 2 * dir + ox, y - 4, sx - 1 * dir + ox, y - 7, c[3]);
      };
      branch(10, 1); branch(21, -1);
      span(b, 8, y + 4, ramp('#4a7a3a')[2], ox);
      b.set(11 + ox, y + 3, hex('#e05a6a')); b.set(20 + ox, y + 3, hex('#e0c05a'));
      break;
    }
    case 'bandana': {
      span(b, 9, y + 4, A[2], ox); span(b, 9, y + 5, A[1], ox);
      b.set(24 + ox, y + 5, A[2]); b.set(25 + ox, y + 6, A[2]); b.set(25 + ox, y + 7, A[1]); b.set(26 + ox, y + 8, A[1]);
      break;
    }
    case 'goggles': {
      span(b, 9, y + 4, LEATHER[1], ox);
      for (const x of [11, 18]) {
        b.rect(x + ox, y + 3, 3, 3, GOLD[1]);
        b.set(x + 1 + ox, y + 4, hex('#9fe8ff'));
        b.set(x + ox, y + 3, GOLD[3]);
      }
      break;
    }
    case 'tricorn': {
      span(b, 11, y + 4, M[1], ox);
      for (let i = 0; i <= 3; i++) span(b, 8 - Math.floor(i / 2), y + 3 - i, M[2], ox);
      b.set(5 + ox, y + 3, M[2]); b.set(26 + ox, y + 3, M[2]);
      span(b, 11, y + 5, GOLD[2], ox);
      b.set(15 + ox, y + 1, A[3]);
      break;
    }
    case 'skullcap': {
      for (let i = -3; i <= 3; i++) span(b, Math.min(8, 5 + Math.abs(i < 0 ? 3 + i : 3)), y + i, BONE[2], ox);
      b.rect(12 + ox, y, 2, 2, hex('#1a1018')); b.rect(18 + ox, y, 2, 2, hex('#1a1018'));
      b.set(10 + ox, y - 4, BONE[3]); b.set(21 + ox, y - 4, BONE[3]); b.set(9 + ox, y - 5, BONE[3]); b.set(22 + ox, y - 5, BONE[3]);
      span(b, 9, y + 4, BONE[1], ox);
      break;
    }
    case 'veil': {
      capRows(0, 5, M, 1);
      for (let i = 6; i <= 15; i++) { b.hline(6 + ox, 8 + ox, y + i, M[2]); b.hline(23 + ox, 25 + ox, y + i, M[1]); }
      span(b, 9, y + 5, A[2], ox);
      b.set(15 + ox, y + 4, A[3]);
      break;
    }
    case 'horned': {
      capRows(0, 5, METAL);
      span(b, 9, y + 5, GOLD[1], ox);
      const horn = (x: number, dir: number) => {
        b.set(x + ox, y + 3, BONE[2]); b.set(x - dir + ox, y + 2, BONE[2]); b.set(x - 2 * dir + ox, y + 1, BONE[2]);
        b.set(x - 2 * dir + ox, y, BONE[3]); b.set(x - 2 * dir + ox, y - 1, BONE[3]); b.set(x - dir + ox, y - 2, BONE[4]);
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
      if (s.head === 'cowboy') { b.hline(15 + ox, 16 + ox, y, H[1]); }
      span(b, 7, y + 3, A[2], ox);
      if (s.head === 'cowboy') b.set(16 + ox, y + 3, GOLD[3]);
      break;
    }
  }
  void hr;
}

function drawHornsHalo(b: PixBuf, s: LookSpec, g: Geo): void {
  const y = g.headTop;
  const ox = g.ox;
  const h = s.feat.horns;
  if (h && h !== 'none' && !['greathelm', 'helm', 'horned'].includes(s.head)) {
    const c = s.race === 'imp' ? ramp('#5a1a1a') : ramp('#2e2638');
    if (h === 'small') {
      for (const x of [11, 20]) { b.set(x + ox, y + 1, c[2]); b.set(x + ox, y, c[3]); b.set(x + (x < 16 ? -1 : 1) + ox, y - 1, c[3]); }
    } else {
      const horn = (x: number, dir: number) => {
        b.set(x + ox, y + 2, c[2]); b.set(x + ox, y + 1, c[2]); b.set(x - dir + ox, y + 1, c[2]);
        b.set(x - dir + ox, y, c[2]); b.set(x - 2 * dir + ox, y - 1, c[3]); b.set(x - 2 * dir + ox, y - 2, c[3]);
        b.set(x - 3 * dir + ox, y - 3, c[3]); b.set(x - 2 * dir + ox, y - 4, c[4]);
        b.set(x - dir + ox, y - 1, c[1]);
      };
      horn(9, 1); horn(22, -1);
    }
  }
  if (s.feat.halo) {
    const hy = y - 3 + (s.head !== 'none' && s.head !== 'circlet' ? -3 : 0);
    const c = hex('#ffe680');
    const cl = hex('#fff8d0');
    b.hline(13 + ox, 18 + ox, hy - 1, cl);
    b.set(11 + ox, hy, c); b.set(12 + ox, hy, c); b.set(19 + ox, hy, c); b.set(20 + ox, hy, c);
    b.hline(13 + ox, 18 + ox, hy + 1, c);
  }
}

// =============================================================== 무기

function dirOf(angle: number): [number, number] {
  const a = (angle * Math.PI) / 180;
  return [Math.sin(a), -Math.cos(a)];
}

function shaft(b: PixBuf, gx: number, gy: number, angle: number, from: number, to: number, c: RGBA, thick = 1, c2?: RGBA): void {
  const [dx, dy] = dirOf(angle);
  b.line(gx + dx * from, gy + dy * from, gx + dx * to, gy + dy * to, c);
  if (thick >= 2) {
    const px = Math.round(-dy) || 0;
    const py = Math.round(dx) || 0;
    const ppx = Math.abs(px) + Math.abs(py) === 0 ? 1 : px;
    b.line(gx + dx * from + ppx, gy + dy * from + py, gx + dx * to + ppx, gy + dy * to + py, c2 ?? c);
  }
  if (thick >= 3) {
    const px = Math.round(dy) || 0;
    const py = Math.round(-dx) || 0;
    b.line(gx + dx * from + px, gy + dy * from + py, gx + dx * to + px, gy + dy * to + py, c2 ?? c);
  }
}

function at(gx: number, gy: number, angle: number, d: number, perp = 0): [number, number] {
  const [dx, dy] = dirOf(angle);
  return [Math.round(gx + dx * d + -dy * perp), Math.round(gy + dy * d + dx * perp)];
}

function drawWeapon(b: PixBuf, s: LookSpec, g: Geo): void {
  const [gx, gy] = g.grip;
  const a = g.angle;
  const A = ramp(s.accent);
  const w = s.weapon;
  const glowC = hex(s.vampire ? '#ff3a5a' : s.accent);
  switch (w) {
    case 'sword': case 'greatsword': {
      const len = w === 'sword' ? 9 : 12;
      shaft(b, gx, gy, a, -2, 0, WOOD[1]);
      const [c1x, c1y] = at(gx, gy, a, 1, -2);
      const [c2x, c2y] = at(gx, gy, a, 1, 2);
      b.line(c1x, c1y, c2x, c2y, GOLD[2]);
      shaft(b, gx, gy, a, 2, len, METAL[3], w === 'sword' ? 2 : 3, METAL[1]);
      const [tx, ty] = at(gx, gy, a, len + 1);
      b.set(tx, ty, METAL[4]);
      break;
    }
    case 'axe': case 'greataxe': {
      const len = w === 'axe' ? 9 : 12;
      shaft(b, gx, gy, a, -2, len, WOOD[2]);
      for (let d = len - 3; d <= len; d++) {
        for (let p = 1; p <= (d === len - 3 || d === len ? 2 : 3); p++) {
          const [x, y] = at(gx, gy, a, d, p);
          b.set(x, y, p === 3 ? METAL[4] : METAL[2]);
          if (w === 'greataxe') { const [x2, y2] = at(gx, gy, a, d, -p); b.set(x2, y2, p === 3 ? METAL[4] : METAL[1]); }
        }
      }
      break;
    }
    case 'spear': case 'trident': {
      shaft(b, gx, gy, a, -6, 10, WOOD[2]);
      if (w === 'spear') {
        for (let d = 11; d <= 13; d++) { const [x, y] = at(gx, gy, a, d); b.set(x, y, METAL[3]); }
        const [x1, y1] = at(gx, gy, a, 11, -1); const [x2, y2] = at(gx, gy, a, 11, 1);
        b.set(x1, y1, METAL[2]); b.set(x2, y2, METAL[1]);
        const [rx, ry] = at(gx, gy, a, 10, 1); b.set(rx, ry, A[2]);
      } else {
        const [l1x, l1y] = at(gx, gy, a, 10, -2); const [l2x, l2y] = at(gx, gy, a, 10, 2);
        b.line(l1x, l1y, l2x, l2y, GOLD[2]);
        for (const p of [-2, 0, 2]) for (let d = 11; d <= 13; d++) { const [x, y] = at(gx, gy, a, d, p); b.set(x, y, d === 13 ? GOLD[4] : GOLD[3]); }
      }
      break;
    }
    case 'dagger': case 'katar': {
      shaft(b, gx, gy, a, -1, 0, LEATHER[2]);
      shaft(b, gx, gy, a, 1, w === 'dagger' ? 4 : 3, METAL[3], w === 'katar' ? 2 : 1, METAL[2]);
      break;
    }
    case 'staff': case 'totem': {
      shaft(b, gx, gy, a, -6, 9, WOOD[2]);
      const [hx, hy] = at(gx, gy, a, 11);
      if (w === 'staff') {
        b.ellipse(hx, hy, 1.5, 1.5, A[2]);
        b.set(hx - 1, hy - 1, A[4]);
        const [r1x, r1y] = at(gx, gy, a, 9, -1); const [r2x, r2y] = at(gx, gy, a, 9, 1);
        b.set(r1x, r1y, WOOD[1]); b.set(r2x, r2y, WOOD[1]);
      } else {
        b.rect(hx - 1, hy - 1, 3, 3, ramp('#c97a3a')[2]);
        b.set(hx - 1, hy, OUTLINE_DARK); b.set(hx + 1, hy, OUTLINE_DARK);
        b.set(hx - 2, hy - 2, A[3]); b.set(hx + 2, hy - 2, A[2]);
      }
      if (g.cast) { b.set(hx, hy - 3, withAlpha(lighten(glowC, 0.6), 255)); b.set(hx - 2, hy - 1, lighten(glowC, 0.5)); b.set(hx + 2, hy - 1, lighten(glowC, 0.5)); }
      break;
    }
    case 'wand': {
      shaft(b, gx, gy, a, -1, 5, hex('#3a2a2a'));
      const [hx, hy] = at(gx, gy, a, 6);
      b.set(hx, hy, A[3]); b.set(hx + 1, hy, A[2]); b.set(hx, hy - 1, A[4]);
      if (g.cast) { b.set(hx + 2, hy - 2, lighten(glowC, 0.6)); b.set(hx - 1, hy - 2, lighten(glowC, 0.4)); }
      break;
    }
    case 'mace': case 'hammer': {
      shaft(b, gx, gy, a, -2, 6, WOOD[2]);
      const [hx, hy] = at(gx, gy, a, 8);
      if (w === 'mace') {
        b.rect(hx - 1, hy - 1, 3, 3, METAL[2]); b.set(hx - 1, hy - 1, METAL[4]);
        b.set(hx, hy - 2, METAL[3]); b.set(hx - 2, hy, METAL[3]); b.set(hx + 2, hy, METAL[1]); b.set(hx, hy + 2, METAL[1]);
      } else {
        for (let p = -2; p <= 2; p++) for (let d = 7; d <= 9; d++) { const [x, y] = at(gx, gy, a, d, p); b.set(x, y, d === 7 ? METAL[1] : METAL[2]); }
        const [x, y] = at(gx, gy, a, 9, -2); b.set(x, y, METAL[4]);
        const [rx, ry] = at(gx, gy, a, 8, 0); b.set(rx, ry, A[3]);
      }
      break;
    }
    case 'scythe': {
      shaft(b, gx, gy, a, -6, 10, hex('#3a2a30'));
      for (let i = 0; i < 7; i++) {
        const [x, y] = at(gx, gy, a, 10 - Math.floor(i * i / 12), -1 - i);
        b.set(x, y, METAL[3]);
        const [x2, y2] = at(gx, gy, a, 9 - Math.floor(i * i / 12), -1 - i);
        if (i < 5) b.set(x2, y2, METAL[1]);
      }
      break;
    }
    case 'flask': {
      const lq = ramp(s.accent);
      b.rect(gx - 1, gy - 4, 3, 3, hex('#cfe8ff'));
      b.rect(gx - 1, gy - 3, 3, 2, lq[2]);
      b.set(gx - 1, gy - 4, WHITE);
      b.set(gx, gy - 5, LEATHER[2]);
      break;
    }
    case 'lute': {
      const W = ramp('#b07a3a');
      b.ellipse(gx - 2, gy - 1, 2.5, 2, W[2]);
      b.set(gx - 2, gy - 1, OUTLINE_DARK);
      b.line(gx, gy - 2, gx + 4, gy - 7, W[1]);
      b.set(gx + 4, gy - 8, W[3]); b.set(gx + 5, gy - 8, W[3]);
      break;
    }
    case 'book': {
      b.rect(gx - 2, gy - 4, 5, 4, hex('#f4ecd8'));
      b.vline(gx, gy - 4, gy - 1, A[1]);
      b.hline(gx - 2, gx + 2, gy, A[2]);
      b.set(gx - 1, gy - 3, hex('#8a7a6a')); b.set(gx + 1, gy - 2, hex('#8a7a6a'));
      if (g.cast) { b.set(gx, gy - 6, lighten(glowC, 0.6)); b.set(gx - 2, gy - 6, lighten(glowC, 0.4)); b.set(gx + 2, gy - 7, lighten(glowC, 0.5)); }
      break;
    }
    case 'bow': {
      const pulled = g.armPose === 'forward' && g.grip[0] > 16 + g.tw + 2;
      for (let i = -7; i <= 6; i++) {
        const bulge = Math.round(2.2 * Math.cos((i / 7) * (Math.PI / 2)));
        b.set(gx + bulge, gy + i, i === -7 || i === 6 ? WOOD[3] : WOOD[2]);
      }
      const sx = pulled ? gx - 3 : gx - 1;
      b.line(gx, gy - 7, sx, gy, hex('#e8e8e8'));
      b.line(sx, gy, gx, gy + 6, hex('#e8e8e8'));
      if (pulled) { b.hline(sx, gx + 5, gy, WOOD[3]); b.set(gx + 5, gy, METAL[4]); b.set(gx + 4, gy - 1, METAL[3]); }
      break;
    }
    case 'crossbow': {
      b.hline(gx - 3, gx + 5, gy, WOOD[2]);
      b.hline(gx - 3, gx - 1, gy + 1, WOOD[1]);
      for (let i = -3; i <= 3; i++) b.set(gx + 4 - Math.abs(i) / 2, gy + i, METAL[2]);
      b.line(gx + 3, gy - 3, gx + 1, gy, hex('#e8e8e8'));
      b.line(gx + 1, gy, gx + 3, gy + 3, hex('#e8e8e8'));
      b.set(gx + 6, gy, METAL[4]);
      break;
    }
    case 'fist': default:
      break;
  }
}

function drawOffhand(b: PixBuf, s: LookSpec, g: Geo): void {
  const lx = 16 - g.tw - 2 + g.ox;
  const ly = g.torsoTop + 7;
  const M = ramp(s.main);
  const A = ramp(s.accent);
  switch (s.offhand) {
    case 'shield': case 'tower': {
      const big = s.offhand === 'tower';
      const top = g.torsoTop + (big ? 1 : 2);
      const h = big ? 10 : 8;
      for (let i = 0; i < h; i++) {
        const half = i < h - 3 ? 3 : 3 - (i - (h - 4));
        const cx = lx;
        b.hline(cx - half, cx + half - (big ? 0 : 1), top + i, i === 0 ? A[3] : M[2]);
        b.set(cx - half, top + i, A[2]);
        b.set(cx + half - (big ? 0 : 1), top + i, A[1]);
      }
      b.vline(lx, top + 2, top + h - 3, A[3]);
      b.hline(lx - 1, lx + 1, top + 3, A[3]);
      if (s.emblem) b.set(lx, top + 3, GOLD[4]);
      break;
    }
    case 'book': {
      b.rect(lx - 1, ly - 2, 3, 4, A[2]);
      b.vline(lx + 1, ly - 2, ly + 1, hex('#f4ecd8'));
      b.set(lx - 1, ly - 2, A[3]);
      break;
    }
    case 'orb': {
      const c = ramp(s.accent);
      b.ellipse(lx, g.torsoTop + 2, 1.5, 1.5, c[2]);
      b.set(lx - 1, g.torsoTop + 1, c[4]);
      b.set(lx + 2, g.torsoTop - 1, withAlpha(c[4], 255));
      break;
    }
    case 'dagger': {
      b.vline(lx, ly + 2, ly + 4, METAL[3]);
      b.set(lx + 1, ly + 2, METAL[1]);
      break;
    }
    case 'lantern': {
      b.vline(lx, ly + 1, ly + 2, hex('#3a3a3a'));
      b.rect(lx - 1, ly + 3, 3, 3, hex('#ffd45a'));
      b.set(lx, ly + 4, hex('#fff6c0'));
      b.hline(lx - 1, lx + 1, ly + 6, hex('#3a3a3a'));
      break;
    }
    case 'none': default:
      break;
  }
}

// =============================================================== 합성

export function drawFrame(spec: LookSpec, pose: Pose): PixBuf {
  const b = new PixBuf(FRAME_W, FRAME_H);
  const g = geometry(spec, pose);
  let skin = spec.skin.map((h) => hex(h)) as RGBA[];
  if (spec.vampire) skin = skin.map((c) => lighten(desaturate(c, 0.45), 0.18));
  const kr: Ramp = [darken(skin[1], 0.35), skin[1], skin[0], skin[2], lighten(skin[2], 0.4)];
  const hr = ramp(spec.hair);

  drawWings(b, spec, g);
  drawCape(b, spec, g);
  if (spec.head !== 'greathelm') drawBackHair(b, spec, g, hr);
  drawTail(b, spec, g, hr);
  drawLegs(b, spec, g, kr);
  drawTorso(b, spec, g, kr);
  drawLeftArm(b, spec, g, kr);
  drawOffhand(b, spec, g);
  drawHeadShape(b, spec, g, kr);
  drawEars(b, spec, g, kr, hr);
  if (spec.head !== 'greathelm') {
    drawFace(b, spec, g, kr);
    drawBeard(b, spec, g, hr);
    if (!['hood', 'veil'].includes(spec.head) || spec.hairStyle !== 'bald') drawFrontHair(b, spec, g, hr, kr);
  }
  drawHeadgear(b, spec, g, hr);
  drawHornsHalo(b, spec, g);
  drawRightArm(b, spec, g, kr);
  drawWeapon(b, spec, g);

  b.outline(0.7);
  // 발밑 그림자
  const sh = hex('#000000', 70);
  for (let x = 10; x <= 21; x++) if (b.get(x, 39) === 0) b.set(x, 39, sh);
  return b;
}

/** 5프레임 가로 스프라이트시트 */
export function drawSheet(spec: LookSpec): PixBuf {
  const sheet = new PixBuf(FRAME_W * POSES.length, FRAME_H);
  POSES.forEach((p, i) => sheet.blit(drawFrame(spec, p), i * FRAME_W, 0));
  return sheet;
}
