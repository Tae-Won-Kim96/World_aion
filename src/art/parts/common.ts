// 스프라이트 파츠 공용: 프레임, 램프, 기하
import { hex, ramp, type RGBA } from '../color';
import type { LookSpec } from '../look';
import type { PixBuf } from '../pixbuf';

export const FRAME_W = 32;
export const FRAME_H = 40;
export type Pose = 'idle0' | 'idle1' | 'atk0' | 'atk1' | 'hurt';
export const POSES: Pose[] = ['idle0', 'idle1', 'atk0', 'atk1', 'hurt'];

export type Ramp = [RGBA, RGBA, RGBA, RGBA, RGBA];

export interface Geo {
  ox: number;        // 상체 좌우 기울기
  footY: number;
  legTop: number;
  torsoTop: number;
  headTop: number;
  tw: number;        // 몸통 반폭
  short: boolean;
  tall: boolean;
  tiny: boolean;
  grip: [number, number];
  angle: number;     // 무기 각도 (0=위, 시계방향)
  armPose: 'down' | 'up' | 'forward';
  eyes: 'open' | 'hurt';
  cast: boolean;     // 시전 빛
}

export interface Ramps {
  kr: Ramp;  // 피부
  hr: Ramp;  // 머리
  M: Ramp;   // 의상 주색
  A: Ramp;   // 보조색
  T: Ramp;   // 테두리
  X: Ramp;   // 금속 (갑옷·날붙이)
  W: Ramp;   // 나무 (자루·활)
}

export const HEAD_HW = [4, 6, 7, 7, 8, 8, 8, 8, 8, 8, 8, 7, 7, 6, 4];
export const HEAD_H = HEAD_HW.length;

export const OUTLINE_DARK = hex('#1a1020');
export const WHITE = hex('#ffffff');
export const METAL = ramp('#a9b2c3');
export const DARKMETAL = ramp('#5d6475');
export const GOLD = ramp('#e2b84a');
export const WOOD = ramp('#8a5a33');
export const LEATHER = ramp('#6b4a2f');
export const PANTS = ramp('#3d3650');
export const BONE = ramp('#e8e0c8');

/** 열 범위 [16-k, 15+k] */
export function span(b: PixBuf, k: number, y: number, c: RGBA, ox = 0): void {
  b.hline(16 - k + ox, 15 + k + ox, y, c);
}

export function both(b: PixBuf, x: number, y: number, c: RGBA, ox = 0): void {
  b.set(x + ox, y, c);
  b.set(31 - x + ox, y, c);
}

/** 문자열 → 32비트 해시 (시드 없이 결정적인 소소한 변주용) */
export function hashStr(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function isCaster(w: string): boolean {
  return ['staff', 'wand', 'book', 'totem', 'flask', 'smoker', 'puppet'].includes(w);
}

function restAngle(w: string): number {
  switch (w) {
    case 'staff': case 'spear': case 'trident': case 'scythe': case 'totem': case 'shovel': case 'parasol': case 'musket': return 0;
    case 'greatsword': case 'greataxe': return 25;
    case 'dagger': case 'katar': case 'syringe': case 'sickle': return 35;
    case 'wand': case 'whip': return 20;
    default: return 18;
  }
}

export function geometry(spec: LookSpec, pose: Pose): Geo {
  const h = spec.feat.height;
  const tiny = h === 'tiny';
  const short = h === 'short' || tiny;
  const tall = h === 'tall';
  const bob = pose === 'idle1' ? 1 : 0;
  const ox = pose === 'atk0' ? -1 : pose === 'atk1' ? 2 : pose === 'hurt' ? -2 : 0;
  const footY = 38;
  const legLen = tiny ? 3 : short ? 4 : tall ? 7 : 6;
  const torsoLen = tiny ? 6 : short ? 7 : tall ? 10 : 9;
  const legTop = footY - legLen + 1;
  const torsoTop = legTop - torsoLen + bob;
  const headTop = torsoTop - HEAD_H + 2;
  const wide = ['dwarf', 'troll', 'orc', 'halfogre', 'minotaur', 'bearkin', 'earth_spirit'].includes(spec.race);
  const thin = ['imp', 'gnome', 'goblin', 'halfling', 'pixie', 'kobold'].includes(spec.race);
  let tw = wide ? 6 : thin ? 4 : 5;
  if (!wide && !thin) tw += spec.build === 'broad' ? 1 : spec.build === 'slim' ? -1 : 0;
  tw = Math.max(4, Math.min(6, tw));
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
  if (spec.weapon === 'bow' || spec.weapon === 'crossbow' || spec.weapon === 'musket') {
    if (pose === 'atk0' || pose === 'atk1') { grip = [rx + 3 + ox, torsoTop + 3]; armPose = 'forward'; }
    angle = spec.weapon === 'musket' && (pose === 'atk0' || pose === 'atk1') ? 90 : 0;
  }
  return {
    ox, footY, legTop, torsoTop, headTop, tw, short, tall, tiny, grip, angle, armPose,
    eyes: pose === 'hurt' ? 'hurt' : 'open', cast: caster && (pose === 'atk0' || pose === 'atk1'),
  };
}
