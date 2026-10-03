// 게임 전역 타입 정의

export type StatKey = 'hp' | 'atk' | 'mag' | 'def' | 'res' | 'spd' | 'mov' | 'crit';
export type Stats = Record<StatKey, number>;
export const STAT_KEYS: StatKey[] = ['hp', 'atk', 'mag', 'def', 'res', 'spd', 'mov', 'crit'];
export const STAT_NAMES: Record<StatKey, string> = {
  hp: '체력', atk: '공격', mag: '마력', def: '방어', res: '저항', spd: '속도', mov: '이동', crit: '치명',
};

export type Star = 1 | 2 | 3 | 4 | 5;
export type Gender = 'm' | 'f' | 'x';

export type FactionId =
  | 'radiance' | 'kingdom' | 'silverwood' | 'ironhold' | 'horde'
  | 'abyss' | 'infernal' | 'nightcourt' | 'guild' | 'wildlands';

export type Affinity = Partial<Record<FactionId, number>>;

export type RaceId =
  | 'divine' | 'angel' | 'demon' | 'elf' | 'darkelf' | 'dwarf' | 'gnome' | 'halfling'
  | 'imp' | 'human' | 'orc' | 'troll' | 'deepone' | 'beastkin'
  // 혈주 전용
  | 'dhampir'
  // 적 전용
  | 'skeleton' | 'ghoul' | 'goblin' | 'wraith';

export type Role = 'tank' | 'melee' | 'ranged' | 'caster' | 'healer' | 'support';

export type DamageKind = 'phys' | 'mag';
export type FxKind =
  | 'slash' | 'pierce' | 'blunt' | 'arrow' | 'bolt' | 'fire' | 'ice' | 'holy' | 'dark'
  | 'poison' | 'nature' | 'heal' | 'buff' | 'shout' | 'blood' | 'water' | 'gear' | 'music';

export type WeaponKind =
  | 'sword' | 'greatsword' | 'axe' | 'greataxe' | 'spear' | 'dagger' | 'bow' | 'crossbow'
  | 'staff' | 'wand' | 'mace' | 'hammer' | 'fist' | 'lute' | 'scythe' | 'totem' | 'flask'
  | 'katar' | 'trident' | 'book';
export type OffhandKind = 'none' | 'shield' | 'tower' | 'book' | 'orb' | 'dagger' | 'lantern';
export type HeadgearKind =
  | 'none' | 'helm' | 'greathelm' | 'wizard' | 'hood' | 'mitre' | 'circlet' | 'crown'
  | 'feather' | 'antlers' | 'bandana' | 'goggles' | 'tricorn' | 'witch' | 'skullcap'
  | 'veil' | 'horned' | 'straw' | 'cowboy';
export type OutfitKind =
  | 'plate' | 'chain' | 'leather' | 'robe' | 'vestment' | 'cloak' | 'tunic' | 'tribal'
  | 'gi' | 'dress' | 'coat' | 'rags' | 'bone';

export type StatusId =
  | 'bleed' | 'poison' | 'burn' | 'stun' | 'weak' | 'vuln' | 'guard' | 'taunt'
  | 'regen' | 'bless' | 'slow' | 'haste' | 'shield' | 'mark';

export interface StatusApply {
  id: StatusId;
  turns: number;
  chance?: number; // 0..1, 기본 1
  value?: number;  // 보호막량 등
}

export type SkillTarget = 'enemy' | 'ally' | 'self' | 'tile';

export interface SkillDef {
  id: string;
  name: string;
  desc: string;
  kind: 'phys' | 'mag' | 'heal' | 'buff' | 'debuff' | 'summon';
  target: SkillTarget;
  range: [number, number];
  area: number;      // 0 = 단일, n = 맨해튼 반경
  power: number;     // 피해/회복 배율
  cooldown: number;  // 턴
  status?: StatusApply[];
  selfStatus?: StatusApply[];
  lifesteal?: number;
  pierce?: number;   // 방어 무시 비율 0..1
  push?: number;     // 넉백 칸
  bonusVsTag?: { tag: string; mul: number };
  hpCost?: number;   // 시전자 최대체력 비율 소모
  charge?: number;   // 예고 공격: n턴 영창 후 지정 칸에 발동
  summon?: { def: string; count: number };
  fx: FxKind;
  projectile?: boolean;
}

export interface Effects {
  expMul: number;
  goldMul: number;
  healMul: number;      // 주는 치유량
  lifesteal: number;
  cheatDeath: number;   // 치명상 1회 버팀 횟수 (런 단위)
  nightVision: boolean; // 횃불 패널티 무시
  critDmg: number;      // 추가 치명 배율
  regen: number;        // 턴당 최대체력 비율
  firstStrike: boolean; // 전투 시작 시 CT 가산
  dmgVsTag: Record<string, number>;   // 해당 태그 대상에게 주는 피해 배율 가산
  dmgTakenTag: Record<string, number>; // 해당 태그 공격에서 받는 피해 배율 가산
  guardAura: number;    // 인접 아군 받는 피해 감소
  dmgMul: number;
  dmgTakenMul: number;
  lowHpRage: number;    // 체력 50% 이하일 때 피해 증가
  torchSaver: number;   // 횃불 소모 감소 비율
  shopDiscount: number;
  cowardice: number;    // 전투 시작 시 일정 확률로 둔화
  holyAttack: boolean;  // 공격이 '신성' 태그를 가짐
  surviveBonus: number; // 휴식 회복량 가산
}

export interface TraitDef {
  id: string;
  name: string;
  desc: string;
  kind: 'trait' | 'curse' | 'blessing';
  polarity: 1 | 0 | -1;
  weight: number;
  statMod?: Partial<Stats>;
  statMul?: Partial<Stats>;
  affinity?: Affinity;
  effects?: Partial<Effects>;
  races?: RaceId[];
  notRaces?: RaceId[];
  classes?: string[];
  tags?: string[];
  exclusive?: string[];
  minStar?: number;
}

export interface RaceLook {
  skin: string[][];          // 피부 팔레트 후보 [base, shade, light]
  hairColors?: string[];     // 머리색 후보(없으면 공용)
  eyeColors?: string[];
  ears?: 'human' | 'pointy' | 'long' | 'fin' | 'beast' | 'none';
  horns?: 'none' | 'small' | 'curl' | 'large';
  wings?: 'none' | 'feather' | 'bat' | 'small_bat';
  halo?: boolean;
  tail?: 'none' | 'devil' | 'beast' | 'fish';
  tusks?: boolean;
  bigNose?: boolean;
  beardChance?: number;
  height?: 'short' | 'normal' | 'tall';
  bald?: boolean;
  skull?: boolean;           // 해골 얼굴
  glowEyes?: string;         // 빛나는 눈 색
  gills?: boolean;
  freckles?: number;
  muzzle?: boolean;
}

export interface RaceDef {
  id: RaceId;
  name: string;
  desc: string;
  weight: number;   // 모집 가중치 (0 = 모집 불가)
  minStar: Star;
  statMod: Partial<Stats>;
  affinity: Affinity;
  canTurn: boolean;
  turnNote?: string;
  tags: string[];
  look: RaceLook;
  classBias?: Record<string, number>;
  genders?: Gender[];
  effects?: Partial<Effects>;
}

export interface ClassDef {
  id: string;
  name: string;
  desc: string;
  role: Role;
  base: Stats;
  growth: Partial<Stats>;
  attack: { name: string; kind: DamageKind; range: [number, number]; fx: FxKind; projectile?: boolean };
  skills: string[]; // 스킬 풀 (캐릭터는 2개 습득)
  gear: {
    weapon: WeaponKind[];
    offhand?: OffhandKind[];
    head: HeadgearKind[];
    outfit: OutfitKind[];
    palette?: string[][]; // 의상 팔레트 후보
  };
  affinity: Affinity;
  weight: number;
  races?: RaceId[];     // 제한 (없으면 전체)
  notRaces?: RaceId[];
  tags?: string[];
}

export interface HouseCond {
  races?: RaceId[];
  minStar: number;
  classes?: string[];
  anyTraits?: string[];
  noTraits?: string[];
  vampire?: boolean;
  blessing?: boolean; // 가호 보유 필수
}

export interface HouseDef {
  id: string;
  name: string;      // 할튼 기사단
  short: string;     // 할튼
  desc: string;
  surname?: string;  // 이름에 붙는 성
  cond: HouseCond;
  chance: number;    // 조건 충족 시 소속 확률
  perk: { name: string; desc: string; statMod?: Partial<Stats>; statMul?: Partial<Stats>; effects?: Partial<Effects> };
  affinity: Affinity;
  colors: [string, string]; // 가문색 (의상에 반영)
  emblem: string;           // 표시용 문자
  forbidVampire?: boolean;  // 흡혈 시 파문
  rarity: 'named' | 'legendary';
}

export interface FactionDef {
  id: FactionId;
  name: string;
  desc: string;
  color: string;
}

export type GearSlot = 'weapon' | 'armor' | 'trinket';
export type Rarity = 1 | 2 | 3 | 4;

export interface Item {
  id: string;
  seed: number;
  slot: GearSlot;
  base: string;
  rarity: Rarity;
  name: string;
  ilvl: number;
  stats: Partial<Stats>;
  affixes: string[];
  unique?: string;
}

export interface Character {
  id: string;
  seed: number;
  given: string;
  surname: string;
  epithet?: string;
  gender: Gender;
  race: RaceId;
  cls: string;
  star: Star;
  level: number;
  exp: number;
  traits: string[];
  curses: string[];
  blessings: string[];
  house?: string;
  skills: string[];
  roll: Partial<Stats>;   // 개체값 (생성 시 결정)
  vampire: boolean;
  turnedAtLevel?: number;
  dormant: number;        // 뱀파이어 휴면(남은 원정 수)
  kills: number;
  runs: number;
  createdAt: number;
  cheatDeathUsed?: boolean;
  gear?: Partial<Record<GearSlot, Item>>;
  isLord?: boolean;
}

export interface Grave {
  char: Character;
  diedAt: number;
  cause: string;
  where: string;
  epitaph: string;
  runNo: number;
}

export function addStats(into: Partial<Stats>, add: Partial<Stats> | undefined): Partial<Stats> {
  if (!add) return into;
  for (const k of STAT_KEYS) if (add[k]) into[k] = (into[k] ?? 0) + add[k]!;
  return into;
}

export function emptyStats(): Stats {
  return { hp: 0, atk: 0, mag: 0, def: 0, res: 0, spd: 0, mov: 0, crit: 0 };
}

export function defaultEffects(): Effects {
  return {
    expMul: 1, goldMul: 1, healMul: 1, lifesteal: 0, cheatDeath: 0, nightVision: false,
    critDmg: 0, regen: 0, firstStrike: false, dmgVsTag: {}, dmgTakenTag: {}, guardAura: 0,
    dmgMul: 1, dmgTakenMul: 1, lowHpRage: 0, torchSaver: 0, shopDiscount: 0, cowardice: 0,
    holyAttack: false, surviveBonus: 0,
  };
}
