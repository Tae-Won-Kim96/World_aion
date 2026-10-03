import type { Effects, GearSlot, Stats } from '../types';

export interface ItemBase {
  id: string;
  name: string;
  slot: GearSlot;
  stats: Partial<Stats>;
}

export interface AffixDef {
  id: string;
  name: string;   // 접두어
  short: string;  // 접미 표기
  slots: GearSlot[];
  statMod?: Partial<Stats>;
  effects?: Partial<Effects>;
  desc: string;
  weight: number;
}

export interface UniqueDef {
  id: string;
  name: string;
  base: string;
  desc: string;
  statMod?: Partial<Stats>;
  effects?: Partial<Effects>;
  dropFrom?: string; // 이 보스가 우선 떨어뜨림
}

export const RARITY_NAMES = ['', '일반', '고급', '희귀', '전설'] as const;
export const RARITY_COLORS = ['', '#c8c4d4', '#6ab0ff', '#d07aff', '#ffb84a'] as const;
export const SLOT_NAMES: Record<GearSlot, string> = { weapon: '무기', armor: '갑옷', trinket: '장신구' };

export const ITEM_BASES: Record<string, ItemBase> = Object.fromEntries(
  ([
    { id: 'sword', name: '장검', slot: 'weapon', stats: { atk: 2 } },
    { id: 'axe', name: '전투도끼', slot: 'weapon', stats: { atk: 3, crit: -1 } },
    { id: 'spear', name: '장창', slot: 'weapon', stats: { atk: 2, def: 1 } },
    { id: 'dagger', name: '단검', slot: 'weapon', stats: { atk: 1, crit: 4, spd: 1 } },
    { id: 'bow', name: '장궁', slot: 'weapon', stats: { atk: 2, crit: 2 } },
    { id: 'staff', name: '마법 지팡이', slot: 'weapon', stats: { mag: 3 } },
    { id: 'wand', name: '완드', slot: 'weapon', stats: { mag: 2, spd: 1 } },
    { id: 'tome', name: '마도서', slot: 'weapon', stats: { mag: 2, res: 1 } },
    { id: 'mace', name: '철퇴', slot: 'weapon', stats: { atk: 2, mag: 1 } },
    { id: 'plate', name: '판금 갑옷', slot: 'armor', stats: { def: 4, hp: 6, spd: -1 } },
    { id: 'chain', name: '사슬 갑옷', slot: 'armor', stats: { def: 3, hp: 4 } },
    { id: 'leather', name: '가죽 갑옷', slot: 'armor', stats: { def: 2, spd: 1 } },
    { id: 'robe', name: '비단 로브', slot: 'armor', stats: { res: 3, mag: 1 } },
    { id: 'cloak', name: '여행자 망토', slot: 'armor', stats: { def: 1, res: 1, spd: 1 } },
    { id: 'ring', name: '반지', slot: 'trinket', stats: { crit: 3 } },
    { id: 'amulet', name: '부적', slot: 'trinket', stats: { res: 2, hp: 4 } },
    { id: 'necklace', name: '목걸이', slot: 'trinket', stats: { mag: 1, atk: 1 } },
    { id: 'reliquary', name: '성물', slot: 'trinket', stats: { res: 2, def: 1 } },
    { id: 'fangcharm', name: '송곳니 장신구', slot: 'trinket', stats: { atk: 1, spd: 1 } },
  ] as ItemBase[]).map((b) => [b.id, b]),
);

export const AFFIXES: Record<string, AffixDef> = Object.fromEntries(
  ([
    { id: 'vampiric', name: '흡혈의', short: '흡혈', slots: ['weapon', 'trinket'], effects: { lifesteal: 0.05 }, desc: '흡혈 5%', weight: 6 },
    { id: 'stalwart', name: '불굴의', short: '불굴', slots: ['armor', 'trinket'], statMod: { hp: 8 }, desc: '체력 +8', weight: 10 },
    { id: 'swift', name: '날랜', short: '신속', slots: ['weapon', 'armor', 'trinket'], statMod: { spd: 2 }, desc: '속도 +2', weight: 8 },
    { id: 'keen', name: '예리한', short: '예리', slots: ['weapon', 'trinket'], statMod: { crit: 4 }, desc: '치명 +4', weight: 9 },
    { id: 'sage', name: '현자의', short: '현자', slots: ['weapon', 'armor', 'trinket'], statMod: { mag: 2 }, desc: '마력 +2', weight: 9 },
    { id: 'giant', name: '거인의', short: '거인', slots: ['weapon', 'armor', 'trinket'], statMod: { atk: 2 }, desc: '공격 +2', weight: 9 },
    { id: 'guardian', name: '수호자의', short: '수호', slots: ['armor'], effects: { guardAura: 0.05 }, desc: '인접 아군 받는 피해 -5%', weight: 5 },
    { id: 'regen', name: '재생의', short: '재생', slots: ['armor', 'trinket'], effects: { regen: 0.02 }, desc: '턴마다 체력 2% 회복', weight: 6 },
    { id: 'holy', name: '성스러운', short: '신성', slots: ['weapon'], effects: { dmgVsTag: { unholy: 0.15 } }, desc: '불경한 적에게 피해 +15%', weight: 6 },
    { id: 'greedy', name: '탐욕의', short: '탐욕', slots: ['trinket'], effects: { goldMul: 1.1 }, desc: '금화 +10%', weight: 5 },
    { id: 'night', name: '밤의', short: '밤', slots: ['armor', 'trinket'], effects: { nightVision: true }, desc: '밤눈', weight: 4 },
    { id: 'scholar', name: '학자의', short: '학자', slots: ['trinket'], effects: { expMul: 1.1 }, desc: '경험치 +10%', weight: 5 },
    { id: 'sturdy', name: '견고한', short: '견고', slots: ['armor'], statMod: { def: 2 }, desc: '방어 +2', weight: 9 },
    { id: 'warded', name: '결계의', short: '결계', slots: ['armor', 'trinket'], statMod: { res: 2 }, desc: '저항 +2', weight: 9 },
    { id: 'deadly', name: '치명적인', short: '치명', slots: ['weapon'], effects: { critDmg: 0.2 }, desc: '치명 피해 +20%', weight: 6 },
    { id: 'torch', name: '횃불지기의', short: '횃불', slots: ['trinket'], effects: { torchSaver: 0.15 }, desc: '횃불 소모 -15%', weight: 4 },
    { id: 'abyss', name: '심해 사냥꾼의', short: '심해', slots: ['weapon'], effects: { dmgVsTag: { abyssal: 0.15 } }, desc: '심연의 적에게 피해 +15%', weight: 5 },
    { id: 'beast', name: '사냥꾼의', short: '사냥', slots: ['weapon'], effects: { dmgVsTag: { beast: 0.15 } }, desc: '야수에게 피해 +15%', weight: 5 },
  ] as AffixDef[]).map((a) => [a.id, a]),
);

export const UNIQUES: Record<string, UniqueDef> = Object.fromEntries(
  ([
    { id: 'mordane_mitre', name: '모르데인의 주교관', base: 'reliquary', desc: '마력 +4, 불경한 적에게 피해 +30%', statMod: { mag: 4 }, effects: { dmgVsTag: { unholy: 0.3 } }, dropFrom: 'bishop' },
    { id: 'abyss_pearl', name: '심연의 진주', base: 'amulet', desc: '저항 +4, 턴마다 체력 5% 회복', statMod: { res: 4 }, effects: { regen: 0.05 }, dropFrom: 'high_priest' },
    { id: 'halton_aegis', name: '할튼의 맹세방패', base: 'plate', desc: '방어 +5, 인접 아군 받는 피해 -12%', statMod: { def: 5 }, effects: { guardAura: 0.12 } },
    { id: 'tyche_die', name: '티케의 주사위', base: 'ring', desc: '치명 +10, 금화 +25%', statMod: { crit: 10 }, effects: { goldMul: 1.25 } },
    { id: 'reaper_glass', name: '사신의 모래시계', base: 'necklace', desc: '원정마다 한 번 죽음을 거부한다', effects: { cheatDeath: 1 } },
    { id: 'crimson_fang', name: '진홍의 송곳니', base: 'dagger', desc: '공격 +5, 흡혈 15%', statMod: { atk: 5 }, effects: { lifesteal: 0.15 } },
    { id: 'stormcaller', name: '폭풍부름 지팡이', base: 'staff', desc: '마력 +6, 치명 +5', statMod: { mag: 6, crit: 5 } },
  ] as UniqueDef[]).map((u) => [u.id, u]),
);
