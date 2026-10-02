import type { HouseDef, RaceId } from '../types';

// 네임드 가문/집단. 조건(종족·성급·직업·특성·상태)을 모두 만족해야만 소속될 수 있다.
// 조건 충족 시 chance 확률로 소속. 여러 개가 가능하면 legendary 우선, 그다음 무작위.

const ALL_BUT_HOLY: RaceId[] = ['demon', 'elf', 'darkelf', 'dwarf', 'gnome', 'halfling', 'imp', 'human', 'orc', 'troll', 'deepone', 'beastkin'];

export const HOUSES: Record<string, HouseDef> = Object.fromEntries(
  ([
    {
      id: 'halton', name: '할튼 기사단', short: '할튼', surname: '할튼', rarity: 'named', emblem: '⛨',
      desc: '왕국 서부를 지켜온 기사단. 단원은 서로의 방패가 되기를 맹세한다.',
      cond: { races: ['human'], minStar: 3, classes: ['knight', 'paladin', 'lancer', 'warrior'], anyTraits: ['oath', 'noble', 'brave', 'devout', 'veteran', 'tough', 'strong_will', 'iron_skin'] },
      chance: 1,
      perk: { name: '방패의 맹세', desc: '인접 아군이 받는 피해 -15%, 방어 +2', statMod: { def: 2 }, effects: { guardAura: 0.15 } },
      affinity: { kingdom: 2, radiance: 1 }, colors: ['#2f4fa8', '#e8d07a'], forbidVampire: true,
    },
    {
      id: 'medini', name: '메디니 가문', short: '메디니', surname: '메디니', rarity: 'named', emblem: '⚜',
      desc: '금화와 독으로 왕좌 뒤를 움직이는 상인 귀족 가문.',
      cond: { races: ['human', 'darkelf', 'halfling'], minStar: 3, anyTraits: ['merchant_blood', 'greedy', 'silver_tongue', 'noble'] },
      chance: 0.85,
      perk: { name: '금화의 혈맥', desc: '금화 +30%, 상점 20% 할인, 치명 +3', statMod: { crit: 3 }, effects: { goldMul: 1.3, shopDiscount: 0.2 } },
      affinity: { guild: 3, kingdom: -1 }, colors: ['#7a1f3d', '#d9b45a'],
    },
    {
      id: 'astra', name: '아스트라 성좌회', short: '아스트라', surname: '아스트라', rarity: 'named', emblem: '✶',
      desc: '별을 읽는 마법사들의 비밀 결사. 별이 허락한 자만 들인다.',
      cond: { races: ['elf', 'human', 'gnome', 'divine'], minStar: 4, classes: ['mage', 'elementalist', 'astrologer'] },
      chance: 1,
      perk: { name: '별의 계시', desc: '마력 +15%, 경험치 +10%', statMul: { mag: 1.15 }, effects: { expMul: 1.1 } },
      affinity: { kingdom: 1 }, colors: ['#23255e', '#a7c7ff'],
    },
    {
      id: 'valok', name: '발로크 씨족', short: '발로크', surname: '발로크', rarity: 'named', emblem: '⚒',
      desc: '무너진 요새에서 끝까지 버틴 드워프 씨족. 그들은 쓰러지지 않는다.',
      cond: { races: ['dwarf'], minStar: 2, classes: ['warrior', 'berserker', 'runesmith', 'tinker', 'knight'] },
      chance: 0.7,
      perk: { name: '불굴의 망치', desc: '원정마다 1회 죽음을 버팀, 방어 +2', statMod: { def: 2 }, effects: { cheatDeath: 1 } },
      affinity: { ironhold: 3 }, colors: ['#6b3b1f', '#c0c0c0'],
    },
    {
      id: 'shadowhand', name: '그림자 손', short: '그림자손', rarity: 'named', emblem: '✋',
      desc: '이름 없는 암살자 길드. 누구에게도 소속을 밝히지 않는다.',
      cond: { races: ALL_BUT_HOLY, minStar: 3, classes: ['rogue', 'assassin', 'wanderer'], noTraits: ['devout', 'zealot', 'oath'] },
      chance: 0.8,
      perk: { name: '첫 번째 칼날', desc: '전투 시작 시 선공, 치명 피해 +30%', effects: { firstStrike: true, critDmg: 0.3 } },
      affinity: { guild: 1, kingdom: -2 }, colors: ['#1e1e24', '#7d2bd1'],
    },
    {
      id: 'elaine', name: '성 일레인 수도회', short: '일레인', rarity: 'named', emblem: '✚',
      desc: '역병 속에서 성녀 일레인이 세운 수도회. 치유의 기적을 잇는다.',
      cond: { races: ['human', 'angel', 'halfling', 'dwarf', 'elf'], minStar: 3, classes: ['priest', 'monk', 'exorcist', 'paladin'], anyTraits: ['devout', 'zealot', 'oath'] },
      chance: 1,
      perk: { name: '성녀의 손길', desc: '주는 치유 +30%, 저항 +3', statMod: { res: 3 }, effects: { healMul: 1.3 } },
      affinity: { radiance: 3 }, colors: ['#f2f2f2', '#d4a017'], forbidVampire: true,
    },
    {
      id: 'bloodfang', name: '피송곳니 부족', short: '피송곳니', surname: '피송곳니', rarity: 'named', emblem: '⚔',
      desc: '황야에서 가장 사나운 전쟁 부족. 피를 볼수록 강해진다.',
      cond: { races: ['orc', 'troll', 'beastkin'], minStar: 2, classes: ['warrior', 'berserker', 'shaman', 'hunter'] },
      chance: 0.6,
      perk: { name: '피의 분노', desc: '체력 50% 이하일 때 피해 +30%, 공격 +2', statMod: { atk: 2 }, effects: { lowHpRage: 0.3 } },
      affinity: { horde: 3 }, colors: ['#5a1010', '#c9a36b'],
    },
    {
      id: 'dagon', name: '다곤의 자손', short: '다곤', surname: '다곤', rarity: 'named', emblem: '♆',
      desc: '심해 왕 다곤의 피를 이었다는 딥원 명가.',
      cond: { races: ['deepone'], minStar: 3 },
      chance: 0.8,
      perk: { name: '조수의 축복', desc: '턴마다 체력 5% 회복, 저항 +2', statMod: { res: 2 }, effects: { regen: 0.05 } },
      affinity: { abyss: 3, radiance: -2 }, colors: ['#0f4c5c', '#5ec4b6'],
    },
    {
      id: 'ashcrown', name: '잿빛 왕관 가문', short: '잿빛왕관', surname: '바알로스', rarity: 'legendary', emblem: '♛',
      desc: '지옥 군주 바알로스의 직계 혈통. 피와 계약으로 다스린다.',
      cond: { races: ['demon', 'imp'], minStar: 4 },
      chance: 1,
      perk: { name: '지옥 군주의 핏줄', desc: '흡혈 15%, 공격·마력 +10%', statMul: { atk: 1.1, mag: 1.1 }, effects: { lifesteal: 0.15 } },
      affinity: { infernal: 3, radiance: -2 }, colors: ['#3b0a0a', '#ff6a00'],
    },
    {
      id: 'seraph', name: '천상의 날개단', short: '천상', rarity: 'legendary', emblem: '☀',
      desc: '천상의 정예 수호대. 지상에 내려온 자는 손에 꼽는다.',
      cond: { races: ['angel', 'divine'], minStar: 5 },
      chance: 1,
      perk: { name: '천상의 수호', desc: '인접 아군 피해 -10%, 1회 죽음을 버팀, 저항 +4', statMod: { res: 4 }, effects: { guardAura: 0.1, cheatDeath: 1 } },
      affinity: { radiance: 3 }, colors: ['#ffffff', '#ffd84a'], forbidVampire: true,
    },
    {
      id: 'verdant', name: '녹음의 서약', short: '녹음', rarity: 'named', emblem: '❦',
      desc: '숲을 지키기로 맹세한 순찰자들.',
      cond: { races: ['elf', 'halfling', 'beastkin', 'gnome'], minStar: 2, classes: ['druid', 'hunter', 'archer', 'shaman'] },
      chance: 0.6,
      perk: { name: '숲길', desc: '이동 +1, 턴마다 체력 2% 회복', statMod: { mov: 1 }, effects: { regen: 0.02 } },
      affinity: { silverwood: 2, wildlands: 2 }, colors: ['#2f6b2f', '#b5e07a'],
    },
    {
      id: 'cogwright', name: '노움 톱니조합', short: '톱니조합', rarity: 'named', emblem: '⚙',
      desc: '대륙의 모든 태엽 장치 뒤에 있는 노움 장인 조합.',
      cond: { races: ['gnome'], minStar: 2, classes: ['tinker', 'alchemist', 'runesmith'] },
      chance: 0.8,
      perk: { name: '정밀 공학', desc: '치명 +5, 마력 +10%, 횃불 소모 -20%', statMod: { crit: 5 }, statMul: { mag: 1.1 }, effects: { torchSaver: 0.2 } },
      affinity: { ironhold: 2, guild: 1 }, colors: ['#7a5a2a', '#4fd1c5'],
    },
    {
      id: 'crimson', name: '진홍의 혈맹', short: '진홍', rarity: 'legendary', emblem: '❧',
      desc: '혈주의 송곳니를 받은 자 중, 피가 맞는 자만 초대받는 밤의 귀족 결사.',
      cond: { minStar: 3, vampire: true },
      chance: 1,
      perk: { name: '밤의 귀족', desc: '흡혈 10%, 속도 +10%, 밤눈', statMul: { spd: 1.1 }, effects: { lifesteal: 0.1, nightVision: true } },
      affinity: { nightcourt: 3 }, colors: ['#5c0020', '#16161c'],
    },
  ] as HouseDef[]).map((h) => [h.id, h]),
);

export function house(id: string): HouseDef {
  const h = HOUSES[id];
  if (!h) throw new Error(`unknown house ${id}`);
  return h;
}
