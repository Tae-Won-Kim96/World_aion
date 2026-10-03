import { CLASSES } from '../core/data/classes';
import type { EnemyDef } from '../core/data/enemies';
import { HOUSES } from '../core/data/houses';
import { RACES } from '../core/data/races';
import { mixSeed, Rng } from '../core/rng';
import type { Character, Gender, HeadgearKind, OffhandKind, OutfitKind, RaceId, RaceLook, WeaponKind } from '../core/types';
import { humanTone, inRange, jitter, outfitColors, randomEye, randomHair, skinTriad } from './palette';

export type HairStyle =
  | 'short' | 'spiky' | 'long' | 'ponytail' | 'twintails' | 'bob' | 'messy' | 'bun' | 'mohawk'
  | 'bald' | 'hime' | 'swept' | 'braid'
  | 'afro' | 'curly' | 'wavy' | 'sidepony' | 'dreads' | 'undercut' | 'odango' | 'longbraid'
  | 'shaggy' | 'parted' | 'drills' | 'topknot' | 'wolfcut';
export type EyeStyle = 'normal' | 'big' | 'sleepy' | 'sharp' | 'happy' | 'dot' | 'slit';
export type MouthStyle = 'neutral' | 'smile' | 'frown' | 'open' | 'cat' | 'fang';
export type Pattern = 'none' | 'stripes' | 'vstripes' | 'checker' | 'diamond' | 'dots' | 'band';
export type Accessory =
  | 'scar' | 'eyepatch' | 'glasses' | 'monocle' | 'mask' | 'facepaint' | 'tattoo' | 'earring'
  | 'nosering' | 'scarf' | 'flower' | 'bandage' | 'pipe' | 'beautymark' | 'eyebags' | 'stitches';
export type Build = 'slim' | 'normal' | 'broad';

export interface LookSpec {
  key: string;
  race: RaceId;
  gender: Gender;
  skin: [string, string, string];
  hair: string;
  hairStyle: HairStyle;
  eye: string;
  eye2?: string;
  eyeStyle: EyeStyle;
  mouth: MouthStyle;
  outfit: OutfitKind;
  main: string;
  accent: string;
  trim: string;
  pattern: Pattern;
  head: HeadgearKind;
  weapon: WeaponKind;
  offhand: OffhandKind;
  cape: string | null;
  accessories: Accessory[];
  feat: RaceLook;
  beard: boolean;
  blush: boolean;
  bound: boolean;
  build: Build;
  scale: number;
  star: number;
  metal: string;     // 갑옷·날붙이 금속색
  wood: string;      // 자루·활 나무색
  emblem?: string;
}

export const HAIR_STYLES: HairStyle[] = [
  'short', 'spiky', 'long', 'ponytail', 'twintails', 'bob', 'messy', 'bun', 'mohawk', 'bald', 'hime', 'swept', 'braid',
  'afro', 'curly', 'wavy', 'sidepony', 'dreads', 'undercut', 'odango', 'longbraid', 'shaggy', 'parted', 'drills', 'topknot', 'wolfcut',
];
export const ACCESSORIES: Accessory[] = [
  'scar', 'eyepatch', 'glasses', 'monocle', 'mask', 'facepaint', 'tattoo', 'earring',
  'nosering', 'scarf', 'flower', 'bandage', 'pipe', 'beautymark', 'eyebags', 'stitches',
];

const HAIR_W: Record<Gender, Partial<Record<HairStyle, number>>> = {
  f: { long: 10, ponytail: 8, twintails: 7, bob: 8, hime: 6, bun: 5, braid: 5, messy: 4, wavy: 8, sidepony: 6, odango: 4, longbraid: 5, curly: 5, drills: 3, parted: 5, afro: 3, wolfcut: 3, shaggy: 2, short: 3, dreads: 2, topknot: 2 },
  m: { short: 10, spiky: 7, messy: 7, swept: 7, ponytail: 3, long: 3, bald: 4, undercut: 7, curly: 4, afro: 3, dreads: 3, shaggy: 5, parted: 5, wolfcut: 4, topknot: 3, mohawk: 2, braid: 2 },
  x: { short: 5, messy: 5, bob: 5, swept: 4, long: 4, ponytail: 4, shaggy: 5, wolfcut: 5, undercut: 4, curly: 3, parted: 3, sidepony: 3, bald: 2, afro: 2, dreads: 2 },
};

function pickHairStyle(rng: Rng, gender: Gender, race: RaceId): HairStyle {
  if (['orc', 'troll', 'halfogre', 'minotaur'].includes(race) && rng.chance(0.35)) return rng.pick<HairStyle>(['mohawk', 'topknot', 'bald']);
  const w = HAIR_W[gender];
  return rng.weighted(HAIR_STYLES, (s) => w[s] ?? 0.4);
}

const EYE_W: Record<EyeStyle, number> = { normal: 30, big: 18, sleepy: 12, sharp: 15, happy: 5, dot: 6, slit: 0 };
const MOUTH_W: Record<MouthStyle, number> = { neutral: 35, smile: 25, frown: 12, open: 8, cat: 6, fang: 3 };
const PATTERN_W: Record<Pattern, number> = { none: 40, stripes: 12, vstripes: 10, checker: 8, diamond: 8, dots: 8, band: 14 };
const ACC_W: Record<Accessory, number> = {
  scar: 9, eyepatch: 3, glasses: 6, monocle: 2, mask: 3, facepaint: 5, tattoo: 6, earring: 8,
  nosering: 3, scarf: 7, flower: 4, bandage: 4, pipe: 2, beautymark: 5, eyebags: 4, stitches: 2,
};
const ACC_SLOT: Partial<Record<Accessory, string>> = { eyepatch: 'eye', glasses: 'eye', monocle: 'eye', mask: 'mouth', pipe: 'mouth' };

/** 직업별 액세서리 성향 */
const CLASS_ACC: Record<string, Partial<Record<Accessory, number>>> = {
  junkie: { eyebags: 40, scar: 10 }, torturer: { mask: 30, scar: 10 }, jester: { facepaint: 40, nosering: 6 },
  loanshark: { monocle: 25, pipe: 10 }, plaguedoc: { glasses: 6 }, mage: { glasses: 10 }, astrologer: { glasses: 10 },
  alchemist: { glasses: 14, bandage: 6 }, rogue: { scar: 14, eyepatch: 8, mask: 8 }, assassin: { mask: 20, scar: 10 },
  warrior: { scar: 18, bandage: 8 }, berserker: { scar: 22, facepaint: 14 }, shaman: { facepaint: 20, tattoo: 10 },
  druid: { flower: 18, tattoo: 6 }, bard: { flower: 8, earring: 10 }, drunkard: { nosering: 4, eyebags: 18 },
  butcher: { scar: 14, bandage: 10 }, gravedigger: { eyebags: 12, scarf: 10 }, puppeteer: { stitches: 14, monocle: 6 },
  executioner: { mask: 22, scar: 12 }, scavenger: { bandage: 18, scarf: 14 }, conartist: { monocle: 12, beautymark: 10 },
};

const METALS: [string, number][] = [['#a9b2c3', 50], ['#6a6f80', 15], ['#c48a4a', 12], ['#d4dae6', 12], ['#d8b45a', 3], ['#7a90c0', 6], ['#8a6a8a', 2]];
const WOODS: [string, number][] = [['#8a5a33', 50], ['#5a3a28', 25], ['#b08a5a', 20], ['#3a2a2a', 5]];

const WILD_OUTFITS: OutfitKind[] = ['tunic', 'coat', 'cloak', 'leather', 'rags', 'wrap', 'fur', 'overalls', 'sash'];
const WILD_HEADS: HeadgearKind[] = ['beret', 'headband', 'bandana', 'hood', 'flowercrown', 'tophat', 'turban', 'laurel'];

function pickAccessories(rng: Rng, cls: string, feat: RaceLook): Accessory[] {
  const n = rng.weighted([0, 1, 2, 3], (k) => [45, 38, 14, 3][k]);
  const bias = CLASS_ACC[cls] ?? {};
  const out: Accessory[] = [];
  const usedSlots = new Set<string>();
  for (let i = 0; i < n + (Object.keys(bias).length && rng.chance(0.5) ? 1 : 0); i++) {
    const pool = ACCESSORIES.filter((a) => !out.includes(a) && !(ACC_SLOT[a] && usedSlots.has(ACC_SLOT[a]!)) && !(a === 'flower' && feat.crest));
    if (!pool.length) break;
    const a = rng.weighted(pool, (x) => ACC_W[x] + (bias[x] ?? 0) * (i === 0 ? 1 : 0.4));
    out.push(a);
    if (ACC_SLOT[a]) usedSlots.add(ACC_SLOT[a]!);
  }
  return out;
}

function pickSkin(rng: Rng, feat: RaceLook): [string, string, string] {
  if (feat.skinGen) return skinTriad(inRange(rng, feat.skinGen));
  if (feat.skinTone) return skinTriad(humanTone(rng, feat.skinTone));
  const list = feat.skin?.length ? feat.skin : [['#f6d0b1']];
  const base = rng.pick(list)[0];
  return skinTriad(rng.chance(0.5) ? base : jitter(rng, base, 8, 0.06, 0.05));
}

interface LookInput {
  rng: Rng;
  key: string;
  race: RaceId;
  cls: string;
  gender: Gender;
  star: number;
  house?: string;
  bound: boolean;
  isLord?: boolean;
}

function buildLook(i: LookInput): LookSpec {
  const { rng } = i;
  const race = RACES[i.race];
  const c = CLASSES[i.cls];
  const feat = race.look;
  const skin = pickSkin(rng, feat);
  const hair = feat.hairGen ? inRange(rng, feat.hairGen) : randomHair(rng, feat.hairColors);
  const eye = randomEye(rng, feat.eyeColors);
  const eye2 = rng.chance(0.04) ? randomEye(rng) : undefined;
  const hairStyle: HairStyle = feat.bald ? 'bald' : pickHairStyle(rng, i.gender, i.race);
  const eyeStyle: EyeStyle = feat.forceEye ?? (feat.slitEyes ? 'slit' : rng.weighted(Object.keys(EYE_W) as EyeStyle[], (e) => EYE_W[e]));
  const mouth: MouthStyle = feat.fangs ? 'fang' : rng.weighted(Object.keys(MOUTH_W) as MouthStyle[], (m) => MOUTH_W[m] + (m === 'cat' && ['catkin', 'foxkin'].includes(i.race) ? 20 : 0));
  const build: Build = rng.weighted<Build>(['slim', 'normal', 'broad'], (b) => (b === 'broad' ? (c.role === 'tank' ? 45 : 18) : b === 'slim' ? (c.role === 'caster' ? 40 : 28) : 50));
  const house = i.house ? HOUSES[i.house] : undefined;
  const col = outfitColors(rng, c.gear.palette?.[0]?.[0]);
  let { main, accent } = col;
  let trim = col.trim;
  if (house) { [main, accent] = house.colors; trim = '#e2b84a'; }
  const pattern: Pattern = rng.weighted(Object.keys(PATTERN_W) as Pattern[], (p) => PATTERN_W[p]);
  let outfit = rng.pick(c.gear.outfit);
  if (rng.chance(0.12)) outfit = rng.pick(WILD_OUTFITS);
  let head = rng.pick(c.gear.head);
  if (head !== 'none' && rng.chance(0.18)) head = 'none';
  else if (rng.chance(0.1)) head = rng.pick(WILD_HEADS);
  if (feat.crest && ['wizard', 'witch', 'tophat', 'turban'].includes(head) && rng.chance(0.6)) head = 'none';
  const weapon = rng.pick(c.gear.weapon);
  const metal = jitter(rng, rng.weighted(METALS, (m) => m[1] + (m[0] === '#d8b45a' && i.star >= 4 ? 8 : 0))[0], 4, 0.04, 0.03);
  const wood = jitter(rng, rng.weighted(WOODS, (w) => w[1])[0], 5, 0.05, 0.04);
  const offhand: OffhandKind = rng.pick<OffhandKind>(c.gear.offhand ?? ['none']);
  let cape = house ? house.colors[0] : i.star >= 4 && rng.chance(0.5) ? accent : null;
  if (i.bound && !cape) cape = '#1f5a6a';
  if (i.isLord) { cape = '#1f3a5a'; head = 'none'; }
  return {
    key: i.key, race: i.race, gender: i.gender, skin, hair, hairStyle, eye, eye2, eyeStyle, mouth,
    outfit, main, accent, trim, pattern, head, weapon, offhand, cape,
    accessories: i.isLord ? [] : pickAccessories(rng, i.cls, feat),
    feat, beard: i.gender === 'm' && rng.chance(feat.beardChance ?? 0), blush: rng.chance(i.gender === 'f' ? 0.6 : 0.15),
    bound: i.bound, build, scale: feat.height === 'tall' ? 1.05 : 1, star: i.star, metal, wood, emblem: house?.emblem,
  };
}

export function lookFromCharacter(ch: Character): LookSpec {
  return buildLook({
    rng: new Rng(mixSeed(ch.seed, 'look3')),
    key: `ch_${ch.seed.toString(36)}_${ch.vampire ? 'b' : 'm'}_${ch.house ?? ''}`,
    race: ch.race, cls: ch.cls, gender: ch.gender, star: ch.star, house: ch.house, bound: ch.vampire, isLord: ch.isLord,
  });
}

export function lookFromEnemy(def: EnemyDef, seed: number): LookSpec {
  const rng = new Rng(mixSeed(seed, def.id));
  const look = buildLook({ rng, key: `en_${def.id}_${seed % 6}`, race: def.race, cls: def.cls, gender: rng.chance(0.5) ? 'm' : 'f', star: 1, bound: false });
  if (def.look.skin) look.skin = def.look.skin;
  if (def.look.outfit) look.outfit = def.look.outfit;
  if (def.look.palette) { look.main = def.look.palette[0]; look.accent = def.look.palette[1]; look.pattern = 'none'; }
  if (def.look.head) look.head = def.look.head;
  if (def.look.weapon) look.weapon = def.look.weapon;
  if (def.look.offhand) look.offhand = def.look.offhand;
  look.cape = def.boss ? def.look.palette?.[0] ?? null : null;
  look.accessories = look.accessories.filter((a) => a !== 'flower');
  look.scale = def.scale ?? 1;
  return look;
}
