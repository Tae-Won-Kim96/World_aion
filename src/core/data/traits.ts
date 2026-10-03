import type { TraitDef } from '../types';

const T = (t: TraitDef) => t;

export const TRAITS: Record<string, TraitDef> = Object.fromEntries(
  [
    // ================= 특성 (긍정) =================
    T({ id: 'iron_skin', name: '강철 피부', kind: 'trait', polarity: 1, weight: 10, desc: '방어 +3', statMod: { def: 3 } }),
    T({ id: 'swift', name: '날렵함', kind: 'trait', polarity: 1, weight: 10, desc: '속도 +2', statMod: { spd: 2 } }),
    T({ id: 'genius', name: '천재', kind: 'trait', polarity: 1, weight: 6, desc: '경험치 +30%', effects: { expMul: 1.3 }, exclusive: ['dim'] }),
    T({ id: 'lucky', name: '행운아', kind: 'trait', polarity: 1, weight: 8, desc: '치명 +6', statMod: { crit: 6 }, exclusive: ['clumsy'] }),
    T({ id: 'oath', name: '맹세', kind: 'trait', polarity: 1, weight: 6, desc: '기사의 맹세를 지킨다. 방어·저항 +1, 왕국·교단 호감', statMod: { def: 1, res: 1 }, affinity: { kingdom: 1, radiance: 1 }, tags: ['knightly'] }),
    T({ id: 'devout', name: '독실함', kind: 'trait', polarity: 1, weight: 7, desc: '주는 치유 +20%, 교단 호감 +2', effects: { healMul: 1.2 }, affinity: { radiance: 2, infernal: -1 }, notRaces: ['demon', 'imp'], exclusive: ['heretic'] }),
    T({ id: 'scholar', name: '박식함', kind: 'trait', polarity: 1, weight: 9, desc: '마력 +3', statMod: { mag: 3 } }),
    T({ id: 'noble', name: '귀족 혈통', kind: 'trait', polarity: 1, weight: 5, desc: '금화 +10%, 왕국 호감 +2', effects: { goldMul: 1.1 }, affinity: { kingdom: 2 }, minStar: 2, exclusive: ['outcast'] }),
    T({ id: 'veteran', name: '백전노장', kind: 'trait', polarity: 1, weight: 7, desc: '체력 +8, 공격 +1', statMod: { hp: 8, atk: 1 } }),
    T({ id: 'strong_will', name: '강철 정신', kind: 'trait', polarity: 1, weight: 9, desc: '저항 +3', statMod: { res: 3 } }),
    T({ id: 'night_eyes', name: '밤눈', kind: 'trait', polarity: 1, weight: 6, desc: '어둠(횃불 부족) 패널티 무시', effects: { nightVision: true } }),
    T({ id: 'brave', name: '용맹', kind: 'trait', polarity: 1, weight: 8, desc: '공격 +2', statMod: { atk: 2 }, exclusive: ['coward'] }),
    T({ id: 'tough', name: '강골', kind: 'trait', polarity: 1, weight: 9, desc: '체력 +10', statMod: { hp: 10 }, exclusive: ['frail'] }),
    T({ id: 'keen_eye', name: '매의 눈', kind: 'trait', polarity: 1, weight: 8, desc: '치명 +4, 치명 피해 +20%', statMod: { crit: 4 }, effects: { critDmg: 0.2 } }),
    T({ id: 'nature_bond', name: '자연 친화', kind: 'trait', polarity: 1, weight: 6, desc: '턴마다 체력 2% 회복, 은빛숲 호감', effects: { regen: 0.02 }, affinity: { silverwood: 2, wildlands: 1 } }),
    T({ id: 'merchant_blood', name: '장사꾼 기질', kind: 'trait', polarity: 1, weight: 5, desc: '금화 +25%, 상점 15% 할인', effects: { goldMul: 1.25, shopDiscount: 0.15 }, affinity: { guild: 2 } }),
    T({ id: 'camper', name: '야영 전문가', kind: 'trait', polarity: 1, weight: 6, desc: '횃불 소모 -25%, 휴식 회복 +10%', effects: { torchSaver: 0.25, surviveBonus: 0.1 } }),
    T({ id: 'survivor', name: '생존자', kind: 'trait', polarity: 1, weight: 6, desc: '체력 +4, 휴식 회복 +15%', statMod: { hp: 4 }, effects: { surviveBonus: 0.15 } }),
    T({ id: 'deep_song', name: '심해의 노래', kind: 'trait', polarity: 1, weight: 10, desc: '저항 +2, 심연 호감 +2', statMod: { res: 2 }, affinity: { abyss: 2 }, races: ['deepone', 'merfolk'] }),
    T({ id: 'stone_blood', name: '돌의 피', kind: 'trait', polarity: 1, weight: 10, desc: '방어 +2, 저항 +1', statMod: { def: 2, res: 1 }, races: ['dwarf', 'gnome', 'kobold', 'earth_spirit'] }),
    T({ id: 'fey_touched', name: '요정의 손길', kind: 'trait', polarity: 1, weight: 10, desc: '마력 +2, 치명 +2', statMod: { mag: 2, crit: 2 }, races: ['elf', 'halfling', 'gnome', 'darkelf', 'pixie', 'satyr', 'dryad', 'foxkin'] }),
    T({ id: 'warborn', name: '전장 태생', kind: 'trait', polarity: 1, weight: 10, desc: '공격 +3', statMod: { atk: 3 }, races: ['orc', 'troll', 'beastkin', 'wolfkin', 'halfogre', 'minotaur', 'goblin'] }),
    T({ id: 'silver_tongue', name: '은빛 혀', kind: 'trait', polarity: 1, weight: 6, desc: '말솜씨가 좋다. 상인·왕국 호감, 상점 10% 할인', effects: { shopDiscount: 0.1 }, affinity: { guild: 1, kingdom: 1 } }),
    T({ id: 'ambidextrous', name: '양손잡이', kind: 'trait', polarity: 1, weight: 7, desc: '공격 +1, 치명 +3', statMod: { atk: 1, crit: 3 } }),
    T({ id: 'undead_slayer', name: '퇴마의 혈통', kind: 'trait', polarity: 1, weight: 5, desc: '불경한 적에게 피해 +30%', effects: { dmgVsTag: { unholy: 0.3 } }, notRaces: ['demon', 'imp'] }),
    T({ id: 'sharp_mind', name: '명석함', kind: 'trait', polarity: 1, weight: 6, desc: '경험치 +15%, 마력 +1', statMod: { mag: 1 }, effects: { expMul: 1.15 }, exclusive: ['dim'] }),
    T({ id: 'longstrider', name: '긴 다리', kind: 'trait', polarity: 1, weight: 4, desc: '이동 +1', statMod: { mov: 1 }, notRaces: ['dwarf', 'gnome', 'halfling', 'imp'] }),
    T({ id: 'holy_aura', name: '성스러운 기운', kind: 'trait', polarity: 1, weight: 10, desc: '공격이 신성 속성을 띤다', effects: { holyAttack: true }, races: ['angel', 'divine'] }),
    T({ id: 'gallows_humor', name: '교수대 유머', kind: 'trait', polarity: 1, weight: 6, desc: '죽음 앞에서도 농담을 한다. 저항 +2, 휴식 회복 +10%', statMod: { res: 2 }, effects: { surviveBonus: 0.1 } }),
    T({ id: 'spirit_sight', name: '영안', kind: 'trait', polarity: 1, weight: 5, desc: '보이지 않는 것이 보인다. 정령·불경한 적에게 피해 +15%, 밤눈', effects: { dmgVsTag: { spirit: 0.15, unholy: 0.15 }, nightVision: true } }),
    T({ id: 'feline_grace', name: '고양이 같은 몸놀림', kind: 'trait', polarity: 1, weight: 10, desc: '속도 +1, 치명 +3', statMod: { spd: 1, crit: 3 }, races: ['catkin', 'foxkin', 'rabbitkin', 'wolfkin', 'beastkin'] }),
    T({ id: 'thick_hide', name: '두꺼운 가죽', kind: 'trait', polarity: 1, weight: 10, desc: '방어 +3', statMod: { def: 3 }, races: ['bearkin', 'minotaur', 'halfogre', 'lizardfolk', 'troll', 'dragonkin'] }),
    T({ id: 'elemental_core', name: '원소의 심장', kind: 'trait', polarity: 1, weight: 10, desc: '저항 +2, 턴마다 체력 2% 회복', statMod: { res: 2 }, effects: { regen: 0.02 }, affinity: { primal: 1 }, races: ['fire_spirit', 'water_spirit', 'earth_spirit', 'wind_spirit'] }),
    T({ id: 'photosynthesis', name: '광합성', kind: 'trait', polarity: 1, weight: 10, desc: '햇빛 한 줌이면 충분하다. 체력 +6, 휴식 회복 +20%', statMod: { hp: 6 }, effects: { surviveBonus: 0.2 }, races: ['dryad', 'mushfolk'] }),
    T({ id: 'gear_heart', name: '태엽 심장', kind: 'trait', polarity: 1, weight: 10, desc: '방어 +2, 치명 +2', statMod: { def: 2, crit: 2 }, races: ['automaton'] }),
    T({ id: 'hellfire', name: '지옥불 핏줄', kind: 'trait', polarity: 1, weight: 10, desc: '피해 +8%', effects: { dmgMul: 1.08 }, affinity: { infernal: 1 }, races: ['demon', 'imp'] }),

    // ================= 특성 (부정/양면) =================
    T({ id: 'coward', name: '겁쟁이', kind: 'trait', polarity: -1, weight: 6, desc: '속도 +1, 전투 시작 시 35% 확률로 둔화', statMod: { spd: 1 }, effects: { cowardice: 0.35 }, exclusive: ['brave'] }),
    T({ id: 'frail', name: '허약', kind: 'trait', polarity: -1, weight: 6, desc: '체력 -8', statMod: { hp: -8 }, exclusive: ['tough'] }),
    T({ id: 'greedy', name: '탐욕', kind: 'trait', polarity: 0, weight: 6, desc: '금화 +15%, 왕국·교단 호감 -1', effects: { goldMul: 1.15 }, affinity: { guild: 1, kingdom: -1, radiance: -1 } }),
    T({ id: 'zealot', name: '광신', kind: 'trait', polarity: 0, weight: 4, desc: '치유 +10%, 교단 +3, 이교 세력 극도로 혐오', effects: { healMul: 1.1 }, affinity: { radiance: 3, infernal: -3, nightcourt: -3, abyss: -2 }, notRaces: ['demon', 'imp', 'deepone'], exclusive: ['heretic'] }),
    T({ id: 'clumsy', name: '덜렁이', kind: 'trait', polarity: -1, weight: 6, desc: '치명 -4', statMod: { crit: -4 }, exclusive: ['lucky'] }),
    T({ id: 'glass_jaw', name: '유리턱', kind: 'trait', polarity: -1, weight: 6, desc: '방어 -2', statMod: { def: -2 } }),
    T({ id: 'sluggish', name: '굼뜸', kind: 'trait', polarity: -1, weight: 6, desc: '속도 -2', statMod: { spd: -2 }, exclusive: ['swift'] }),
    T({ id: 'hothead', name: '다혈질', kind: 'trait', polarity: 0, weight: 7, desc: '공격 +2, 방어 -2', statMod: { atk: 2, def: -2 } }),
    T({ id: 'drunkard', name: '술고래', kind: 'trait', polarity: 0, weight: 6, desc: '체력 +4, 저항 -2', statMod: { hp: 4, res: -2 } }),
    T({ id: 'claustrophobic', name: '폐소공포증', kind: 'trait', polarity: -1, weight: 5, desc: '던전에서 주는 피해 -8%', effects: { dmgMul: 0.92 } }),
    T({ id: 'dim', name: '둔재', kind: 'trait', polarity: -1, weight: 5, desc: '경험치 -20%', effects: { expMul: 0.8 }, exclusive: ['genius', 'sharp_mind'] }),
    T({ id: 'bloodthirsty', name: '피에 굶주림', kind: 'trait', polarity: 0, weight: 5, desc: '흡혈 5%, 밤의 궁정 호감, 교단 반감', effects: { lifesteal: 0.05 }, affinity: { nightcourt: 1, radiance: -1 } }),
    T({ id: 'outcast', name: '추방자', kind: 'trait', polarity: 0, weight: 5, desc: '왕국에서 추방됨. 왕국 -2, 밤의 궁정 +1', affinity: { kingdom: -2, guild: -1, nightcourt: 1 }, exclusive: ['noble'] }),
    T({ id: 'heretic', name: '이단자', kind: 'trait', polarity: 0, weight: 5, desc: '교단 -3, 지옥문 +1, 마력 +1', statMod: { mag: 1 }, affinity: { radiance: -3, infernal: 1 }, exclusive: ['devout', 'zealot'] }),
    T({ id: 'orc_grudge', name: '오크 원한', kind: 'trait', polarity: 0, weight: 5, desc: '오크에게 가족을 잃었다. 대부족 -3, 핏빛황야 적에게 피해 +10%', affinity: { horde: -3 }, effects: { dmgVsTag: { brute: 0.1 } }, races: ['human', 'dwarf', 'elf', 'halfling'] }),
    T({ id: 'elf_grudge', name: '숲의 원한', kind: 'trait', polarity: 0, weight: 5, desc: '엘프를 증오한다. 은빛숲 -3', affinity: { silverwood: -3 }, races: ['orc', 'troll', 'darkelf', 'dwarf'] }),

    T({ id: 'addict', name: '중독자', kind: 'trait', polarity: 0, weight: 5, desc: '무언가에 늘 취해 있다. 체력 50% 이하일 때 피해 +10%, 저항 -2', statMod: { res: -2 }, effects: { lowHpRage: 0.1 }, affinity: { underworld: 1 }, notRaces: ['automaton'] }),
    T({ id: 'hoarder', name: '수집벽', kind: 'trait', polarity: 0, weight: 5, desc: '반짝이는 건 일단 줍는다. 금화 +10%, 속도 -1', statMod: { spd: -1 }, effects: { goldMul: 1.1 } }),
    T({ id: 'insomniac', name: '불면증', kind: 'trait', polarity: 0, weight: 5, desc: '잠들지 못한다. 밤눈, 휴식 회복 -15%', effects: { nightVision: true, surviveBonus: -0.15 } }),
    T({ id: 'sadist', name: '가학 성향', kind: 'trait', polarity: 0, weight: 4, desc: '약한 상대를 괴롭히는 데 재능이 있다. 빈사의 적에게 피해 +15%, 교단 -1', effects: { dmgVsTag: { wounded: 0.15 } }, affinity: { radiance: -1, underworld: 1 } }),
    T({ id: 'hypochondriac', name: '건강염려증', kind: 'trait', polarity: 0, weight: 5, desc: '늘 아프다고 한다. 방어 +1, 전투 시작 시 20% 확률로 둔화', statMod: { def: 1 }, effects: { cowardice: 0.2 } }),
    T({ id: 'grave_chill', name: '무덤의 한기', kind: 'trait', polarity: 0, weight: 10, desc: '저항 +2, 신성 피해 +15%', statMod: { res: 2 }, effects: { dmgTakenTag: { holy: 0.15 } }, races: ['revenant', 'shade'] }),

    // ================= 저주 =================
    T({ id: 'curse_misfortune', name: '불운의 저주', kind: 'curse', polarity: -1, weight: 8, desc: '치명 -5, 금화 -15%', statMod: { crit: -5 }, effects: { goldMul: 0.85 } }),
    T({ id: 'curse_frailty', name: '쇠약의 저주', kind: 'curse', polarity: -1, weight: 8, desc: '최대 체력 -15%', statMul: { hp: 0.85 } }),
    T({ id: 'curse_bloodthirst', name: '피의 갈증', kind: 'curse', polarity: 0, weight: 6, desc: '흡혈 10%, 신성 피해 +30%', effects: { lifesteal: 0.1, dmgTakenTag: { holy: 0.3 } }, affinity: { nightcourt: 1 } }),
    T({ id: 'curse_moon', name: '달의 광기', kind: 'curse', polarity: 0, weight: 6, desc: '공격 +3, 저항 -3', statMod: { atk: 3, res: -3 } }),
    T({ id: 'curse_whispers', name: '망자의 속삭임', kind: 'curse', polarity: 0, weight: 6, desc: '마력 +2, 저항 -3', statMod: { mag: 2, res: -3 }, affinity: { abyss: 1 } }),
    T({ id: 'curse_traitor', name: '배신자의 낙인', kind: 'curse', polarity: -1, weight: 5, desc: '왕국 -2, 교단 -1, 상인 -1', affinity: { kingdom: -2, radiance: -1, guild: -1 } }),
    T({ id: 'curse_short', name: '단명', kind: 'curse', polarity: 0, weight: 5, desc: '경험치 +20%, 최대 체력 -10%', effects: { expMul: 1.2 }, statMul: { hp: 0.9 } }),
    T({ id: 'curse_lead', name: '납의 저주', kind: 'curse', polarity: -1, weight: 6, desc: '속도 -3', statMod: { spd: -3 } }),
    T({ id: 'curse_brittle', name: '부서지는 뼈', kind: 'curse', polarity: -1, weight: 6, desc: '방어 -3', statMod: { def: -3 } }),
    T({ id: 'curse_beast', name: '짐승의 저주', kind: 'curse', polarity: 0, weight: 5, desc: '공격 +2, 마력 -3', statMod: { atk: 2, mag: -3 }, affinity: { wildlands: 1 } }),
    T({ id: 'curse_debt', name: '지옥의 빚', kind: 'curse', polarity: 0, weight: 5, desc: '금화 -20%, 지옥문 호감 +2', effects: { goldMul: 0.8 }, affinity: { infernal: 2 } }),
    T({ id: 'curse_sun', name: '태양의 저주', kind: 'curse', polarity: 0, weight: 5, desc: '신성 피해 +25%, 밤눈', effects: { dmgTakenTag: { holy: 0.25 }, nightVision: true } }),
    T({ id: 'curse_dry', name: '메마름', kind: 'curse', polarity: -1, weight: 8, desc: '물을 떠난 비늘이 갈라진다. 체력 -6', statMod: { hp: -6 }, races: ['deepone', 'merfolk'] }),

    // ================= 가호 =================
    T({ id: 'bless_sun', name: '태양신 솔라의 가호', kind: 'blessing', polarity: 1, weight: 6, desc: '공격이 신성 속성, 불경한 적에게 +20%', effects: { holyAttack: true, dmgVsTag: { unholy: 0.2 } }, affinity: { radiance: 2 }, notRaces: ['demon', 'imp'] }),
    T({ id: 'bless_sea', name: '바다신 넬레우스의 가호', kind: 'blessing', polarity: 1, weight: 5, desc: '저항 +3, 턴마다 체력 3% 회복', statMod: { res: 3 }, effects: { regen: 0.03 }, affinity: { abyss: 1 } }),
    T({ id: 'bless_forest', name: '숲의 어머니의 가호', kind: 'blessing', polarity: 1, weight: 6, desc: '턴마다 체력 3% 회복, 은빛숲 호감 +2', effects: { regen: 0.03 }, affinity: { silverwood: 2 } }),
    T({ id: 'bless_war', name: '전쟁신 가론의 가호', kind: 'blessing', polarity: 1, weight: 7, desc: '공격 +3, 치명 +3', statMod: { atk: 3, crit: 3 } }),
    T({ id: 'bless_death', name: '사신 모르의 가호', kind: 'blessing', polarity: 1, weight: 4, desc: '원정마다 한 번, 죽음을 거부하고 체력 1로 버틴다', effects: { cheatDeath: 1 } }),
    T({ id: 'bless_fortune', name: '행운의 여신 티케의 가호', kind: 'blessing', polarity: 1, weight: 6, desc: '금화 +30%, 치명 +3', statMod: { crit: 3 }, effects: { goldMul: 1.3 } }),
    T({ id: 'bless_forge', name: '대장장이신 브론의 가호', kind: 'blessing', polarity: 1, weight: 6, desc: '방어 +3, 저항 +1, 철망치 호감 +2', statMod: { def: 3, res: 1 }, affinity: { ironhold: 2 } }),
    T({ id: 'bless_moon', name: '달의 여신 셀레네의 가호', kind: 'blessing', polarity: 1, weight: 5, desc: '밤눈, 속도 +2, 밤의 궁정 호감 +1', statMod: { spd: 2 }, effects: { nightVision: true }, affinity: { nightcourt: 1 } }),
    T({ id: 'bless_wind', name: '바람의 가호', kind: 'blessing', polarity: 1, weight: 4, desc: '이동 +1, 속도 +1', statMod: { mov: 1, spd: 1 } }),
    T({ id: 'bless_wisdom', name: '지혜신 아우라의 가호', kind: 'blessing', polarity: 1, weight: 6, desc: '마력 +3, 경험치 +15%', statMod: { mag: 3 }, effects: { expMul: 1.15 } }),
    T({ id: 'bless_hearth', name: '화로의 가호', kind: 'blessing', polarity: 1, weight: 6, desc: '체력 +6, 휴식 회복 +25%', statMod: { hp: 6 }, effects: { surviveBonus: 0.25 } }),
    T({ id: 'bless_blood', name: '피의 군주의 가호', kind: 'blessing', polarity: 1, weight: 4, desc: '흡혈 10%, 밤의 궁정 +2, 교단 -2', effects: { lifesteal: 0.1 }, affinity: { nightcourt: 2, radiance: -2 }, notRaces: ['angel', 'divine'] }),
  ].map((t) => [t.id, t]),
);

export function trait(id: string): TraitDef {
  const t = TRAITS[id];
  if (!t) throw new Error(`unknown trait ${id}`);
  return t;
}

export const TRAIT_LIST = Object.values(TRAITS).filter((t) => t.kind === 'trait');
export const CURSE_LIST = Object.values(TRAITS).filter((t) => t.kind === 'curse');
export const BLESSING_LIST = Object.values(TRAITS).filter((t) => t.kind === 'blessing');
