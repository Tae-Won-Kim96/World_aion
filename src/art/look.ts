import { CLASSES } from '../core/data/classes';
import type { EnemyDef } from '../core/data/enemies';
import { HOUSES } from '../core/data/houses';
import { COMMON_EYES, COMMON_HAIR, RACES } from '../core/data/races';
import { mixSeed, Rng } from '../core/rng';
import type { Character, Gender, HeadgearKind, OffhandKind, OutfitKind, RaceId, RaceLook, WeaponKind } from '../core/types';

export type HairStyle =
  | 'short' | 'spiky' | 'long' | 'ponytail' | 'twintails' | 'bob' | 'messy' | 'bun' | 'mohawk'
  | 'bald' | 'hime' | 'swept' | 'braid';

export interface LookSpec {
  key: string;
  race: RaceId;
  gender: Gender;
  skin: [string, string, string];
  hair: string;
  hairStyle: HairStyle;
  eye: string;
  outfit: OutfitKind;
  main: string;
  accent: string;
  head: HeadgearKind;
  weapon: WeaponKind;
  offhand: OffhandKind;
  cape: string | null;
  feat: RaceLook;
  beard: boolean;
  blush: boolean;
  vampire: boolean;
  scale: number;
  emblem?: string;
}

const FEM_STYLES: HairStyle[] = ['long', 'ponytail', 'twintails', 'bob', 'hime', 'bun', 'braid', 'messy'];
const MASC_STYLES: HairStyle[] = ['short', 'spiky', 'messy', 'swept', 'ponytail', 'long', 'bald'];
const NEUTRAL_STYLES: HairStyle[] = ['short', 'messy', 'bob', 'swept', 'long', 'ponytail'];

function pickHairStyle(rng: Rng, gender: Gender, race: RaceId): HairStyle {
  if (race === 'orc' && rng.chance(0.35)) return 'mohawk';
  if (race === 'troll' && rng.chance(0.4)) return 'mohawk';
  const pool = gender === 'f' ? FEM_STYLES : gender === 'm' ? MASC_STYLES : NEUTRAL_STYLES;
  return rng.pick(pool);
}

export function lookFromCharacter(ch: Character): LookSpec {
  const rng = new Rng(mixSeed(ch.seed, 'look'));
  const race = RACES[ch.race];
  const c = CLASSES[ch.cls];
  const feat = race.look;
  const skin = rng.pick(feat.skin) as [string, string, string];
  const hair = rng.pick(feat.hairColors ?? COMMON_HAIR);
  const eye = rng.pick(feat.eyeColors ?? COMMON_EYES);
  let hairStyle: HairStyle = feat.bald ? 'bald' : pickHairStyle(rng, ch.gender, ch.race);
  if (ch.race === 'deepone' && rng.chance(0.4)) hairStyle = 'messy';
  const pal = rng.pick(c.gear.palette ?? [['#6a6a7a', '#c9a36b']]);
  let [main, accent] = pal;
  const house = ch.house ? HOUSES[ch.house] : undefined;
  if (house) [main, accent] = house.colors;
  const beard = ch.gender === 'm' && rng.chance(feat.beardChance ?? 0);
  let head = rng.pick(c.gear.head);
  // 머리가 화려하면 모자를 덜 씌운다
  if (head !== 'none' && rng.chance(0.18)) head = 'none';
  const weapon = rng.pick(c.gear.weapon);
  const offhand: OffhandKind = rng.pick<OffhandKind>(c.gear.offhand ?? ['none']);
  const outfit = rng.pick(c.gear.outfit);
  const cape = house ? house.colors[0] : ch.star >= 4 && rng.chance(0.5) ? accent : ch.vampire ? '#5c0020' : null;

  return {
    key: `ch_${ch.seed.toString(36)}_${ch.vampire ? 'v' : 'h'}_${ch.house ?? ''}`,
    race: ch.race, gender: ch.gender, skin, hair, hairStyle, eye, outfit, main, accent, head, weapon, offhand,
    cape, feat, beard, blush: ch.gender !== 'm' && rng.chance(0.6), vampire: ch.vampire, scale: feat.height === 'tall' ? 1.05 : 1,
    emblem: house?.emblem,
  };
}

export function lookFromEnemy(def: EnemyDef, seed: number): LookSpec {
  const rng = new Rng(mixSeed(seed, def.id));
  const race = RACES[def.race];
  const c = CLASSES[def.cls];
  const feat = race.look;
  const gender: Gender = rng.chance(0.5) ? 'm' : 'f';
  return {
    key: `en_${def.id}_${seed % 4}`,
    race: def.race, gender,
    skin: def.look.skin ?? (rng.pick(feat.skin) as [string, string, string]),
    hair: rng.pick(feat.hairColors ?? COMMON_HAIR),
    hairStyle: feat.bald ? 'bald' : pickHairStyle(rng, gender, def.race),
    eye: rng.pick(feat.eyeColors ?? COMMON_EYES),
    outfit: def.look.outfit ?? rng.pick(c.gear.outfit),
    main: def.look.palette?.[0] ?? '#5a5a6a',
    accent: def.look.palette?.[1] ?? '#a0a0a0',
    head: def.look.head ?? rng.pick(c.gear.head),
    weapon: def.look.weapon ?? rng.pick(c.gear.weapon),
    offhand: def.look.offhand ?? rng.pick<OffhandKind>(c.gear.offhand ?? ['none']),
    cape: def.boss ? def.look.palette?.[0] ?? null : null,
    feat, beard: false, blush: false, vampire: false, scale: def.scale ?? 1,
  };
}
