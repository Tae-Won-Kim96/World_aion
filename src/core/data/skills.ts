import type { SkillDef } from '../types';

// 대상 규칙
//  enemy : 사거리 내 적 1명 (area>0 이면 그 주변 적에게도)
//  ally  : 사거리 내 아군 1명 (range 최소 0 이면 자신 포함)
//  self  : 시전자 중심. area>0 이면 피해/약화는 주변 적, 치유/강화는 주변 아군
//  tile  : 사거리 내 임의 칸 중심 범위
// 'wounded' 태그 = 체력 50% 미만, 'unholy' 태그 = 언데드/악마류

const S = (s: SkillDef) => s;

export const SKILLS: Record<string, SkillDef> = Object.fromEntries(
  [
    // ---- 방어/근접 ----
    S({ id: 'shield_bash', name: '방패 강타', desc: '방패로 후려쳐 기절시킨다.', kind: 'phys', target: 'enemy', range: [1, 1], area: 0, power: 0.8, cooldown: 3, status: [{ id: 'stun', turns: 1, chance: 0.6 }], fx: 'blunt' }),
    S({ id: 'provoke', name: '도발', desc: '적의 시선을 끌고 방어 태세를 취한다.', kind: 'buff', target: 'self', range: [0, 0], area: 0, power: 0, cooldown: 4, selfStatus: [{ id: 'taunt', turns: 2 }, { id: 'guard', turns: 2 }], fx: 'shout' }),
    S({ id: 'guardian', name: '수호', desc: '인접한 아군을 지켜 받는 피해를 줄인다.', kind: 'buff', target: 'ally', range: [1, 1], area: 0, power: 0, cooldown: 3, status: [{ id: 'guard', turns: 2 }], fx: 'buff' }),
    S({ id: 'holy_strike', name: '신성 일격', desc: '빛을 실은 일격. 불경한 존재에게 강하다.', kind: 'phys', target: 'enemy', range: [1, 1], area: 0, power: 1.3, cooldown: 2, bonusVsTag: { tag: 'unholy', mul: 1.5 }, fx: 'holy' }),
    S({ id: 'lay_on_hands', name: '안수', desc: '손을 얹어 상처를 치유한다.', kind: 'heal', target: 'ally', range: [0, 1], area: 0, power: 1.8, cooldown: 4, fx: 'heal' }),
    S({ id: 'cleave', name: '회전베기', desc: '주변의 모든 적을 벤다.', kind: 'phys', target: 'self', range: [0, 0], area: 1, power: 0.9, cooldown: 3, fx: 'slash' }),
    S({ id: 'war_cry', name: '함성', desc: '주변 아군의 공격력을 끌어올린다.', kind: 'buff', target: 'self', range: [0, 0], area: 2, power: 0, cooldown: 4, status: [{ id: 'bless', turns: 2 }], fx: 'shout' }),
    S({ id: 'execute', name: '처형', desc: '빈사의 적에게 치명적인 일격.', kind: 'phys', target: 'enemy', range: [1, 1], area: 0, power: 1.0, cooldown: 3, bonusVsTag: { tag: 'wounded', mul: 1.9 }, fx: 'slash' }),
    S({ id: 'whirlwind', name: '광란의 회전', desc: '무방비 상태로 주변을 난도질한다.', kind: 'phys', target: 'self', range: [0, 0], area: 1, power: 1.15, cooldown: 3, selfStatus: [{ id: 'vuln', turns: 1 }], fx: 'slash' }),
    S({ id: 'blood_frenzy', name: '피의 광란', desc: '적의 피로 상처를 메운다.', kind: 'phys', target: 'enemy', range: [1, 1], area: 0, power: 1.2, cooldown: 3, lifesteal: 0.5, fx: 'blood' }),
    S({ id: 'rage', name: '분노', desc: '분노로 힘과 속도를 끌어올린다.', kind: 'buff', target: 'self', range: [0, 0], area: 0, power: 0, cooldown: 5, selfStatus: [{ id: 'bless', turns: 3 }, { id: 'haste', turns: 2 }], fx: 'shout' }),
    S({ id: 'lunge', name: '찌르기', desc: '두 칸 앞까지 꿰뚫는 찌르기.', kind: 'phys', target: 'enemy', range: [1, 2], area: 0, power: 1.15, cooldown: 2, pierce: 0.3, fx: 'pierce' }),
    S({ id: 'flurry', name: '연속 베기', desc: '눈에 보이지 않는 연격.', kind: 'phys', target: 'enemy', range: [1, 1], area: 0, power: 1.6, cooldown: 3, fx: 'slash' }),
    S({ id: 'iaido', name: '발도', desc: '한 번의 칼집 소리, 한 번의 죽음.', kind: 'phys', target: 'enemy', range: [1, 1], area: 0, power: 1.9, cooldown: 4, pierce: 0.2, fx: 'slash' }),
    S({ id: 'spear_thrust', name: '관통 찌르기', desc: '갑옷을 꿰뚫는 찌르기.', kind: 'phys', target: 'enemy', range: [1, 2], area: 0, power: 1.1, cooldown: 2, pierce: 0.5, fx: 'pierce' }),
    S({ id: 'sweep', name: '휩쓸기', desc: '창대로 넓게 휩쓴다.', kind: 'phys', target: 'tile', range: [1, 2], area: 1, power: 0.8, cooldown: 3, fx: 'slash' }),
    S({ id: 'brace', name: '창벽', desc: '창을 세워 진형을 굳힌다.', kind: 'buff', target: 'self', range: [0, 0], area: 0, power: 0, cooldown: 4, selfStatus: [{ id: 'guard', turns: 2 }, { id: 'taunt', turns: 1 }], fx: 'buff' }),
    S({ id: 'quick_slash', name: '재빠른 베기', desc: '베고 나서 몸을 가볍게 한다.', kind: 'phys', target: 'enemy', range: [1, 1], area: 0, power: 1.1, cooldown: 2, selfStatus: [{ id: 'haste', turns: 1 }], fx: 'slash' }),
    S({ id: 'second_wind', name: '재정비', desc: '숨을 고르고 상처를 동여맨다.', kind: 'heal', target: 'self', range: [0, 0], area: 0, power: 1.5, cooldown: 4, fx: 'heal' }),
    S({ id: 'throw_knife', name: '단검 투척', desc: '멀리 있는 적에게 단검을 던진다.', kind: 'phys', target: 'enemy', range: [2, 4], area: 0, power: 0.85, cooldown: 2, fx: 'pierce', projectile: true }),
    S({ id: 'palm_strike', name: '장타', desc: '기를 실은 장풍으로 밀쳐낸다.', kind: 'phys', target: 'enemy', range: [1, 1], area: 0, power: 1.2, cooldown: 2, push: 1, fx: 'blunt' }),
    S({ id: 'inner_peace', name: '내면의 평화', desc: '호흡을 가다듬어 회복한다.', kind: 'buff', target: 'self', range: [0, 0], area: 0, power: 0, cooldown: 4, selfStatus: [{ id: 'regen', turns: 3 }, { id: 'guard', turns: 1 }], fx: 'buff' }),
    S({ id: 'rune_strike', name: '룬 강타', desc: '룬이 새겨진 망치로 내려친다.', kind: 'phys', target: 'enemy', range: [1, 1], area: 0, power: 1.25, cooldown: 2, selfStatus: [{ id: 'guard', turns: 1 }], fx: 'blunt' }),
    S({ id: 'rune_ward', name: '수호 룬', desc: '아군에게 보호막 룬을 새긴다.', kind: 'buff', target: 'ally', range: [0, 3], area: 0, power: 0, cooldown: 3, status: [{ id: 'shield', turns: 3, value: 2.2 }], fx: 'gear' }),

    // ---- 도적/궁수 ----
    S({ id: 'backstab', name: '기습', desc: '급소를 노린 일격.', kind: 'phys', target: 'enemy', range: [1, 1], area: 0, power: 1.6, cooldown: 3, pierce: 0.5, fx: 'pierce' }),
    S({ id: 'poison_blade', name: '독날', desc: '독을 바른 칼날.', kind: 'phys', target: 'enemy', range: [1, 1], area: 0, power: 0.8, cooldown: 3, status: [{ id: 'poison', turns: 3 }], fx: 'poison' }),
    S({ id: 'smoke_bomb', name: '연막탄', desc: '연막으로 적을 약화·둔화시킨다.', kind: 'debuff', target: 'tile', range: [1, 3], area: 1, power: 0, cooldown: 4, status: [{ id: 'weak', turns: 2 }, { id: 'slow', turns: 2 }], fx: 'dark', projectile: true }),
    S({ id: 'assassinate', name: '암살', desc: '숨통을 끊는 일격.', kind: 'phys', target: 'enemy', range: [1, 1], area: 0, power: 2.2, cooldown: 4, bonusVsTag: { tag: 'wounded', mul: 1.4 }, fx: 'pierce' }),
    S({ id: 'mark_target', name: '표적 지정', desc: '적의 약점을 드러낸다.', kind: 'debuff', target: 'enemy', range: [1, 5], area: 0, power: 0, cooldown: 3, status: [{ id: 'mark', turns: 3 }], fx: 'arrow' }),
    S({ id: 'power_shot', name: '강사', desc: '시위를 끝까지 당겨 쏜다.', kind: 'phys', target: 'enemy', range: [2, 6], area: 0, power: 1.5, cooldown: 3, fx: 'arrow', projectile: true }),
    S({ id: 'volley', name: '화살비', desc: '하늘에서 화살이 쏟아진다.', kind: 'phys', target: 'tile', range: [2, 6], area: 1, power: 0.7, cooldown: 3, fx: 'arrow' }),
    S({ id: 'snare_trap', name: '올가미', desc: '적의 발을 묶는다.', kind: 'phys', target: 'enemy', range: [1, 4], area: 0, power: 0.4, cooldown: 4, status: [{ id: 'stun', turns: 1, chance: 0.7 }], fx: 'nature' }),
    S({ id: 'crippling_shot', name: '다리 쏘기', desc: '다리를 노려 발을 늦춘다.', kind: 'phys', target: 'enemy', range: [2, 5], area: 0, power: 0.9, cooldown: 2, status: [{ id: 'slow', turns: 2 }], fx: 'arrow', projectile: true }),
    S({ id: 'silver_bolt', name: '은 화살', desc: '은촉 화살. 불경한 존재를 꿰뚫는다.', kind: 'phys', target: 'enemy', range: [2, 5], area: 0, power: 1.15, cooldown: 2, bonusVsTag: { tag: 'unholy', mul: 1.7 }, fx: 'arrow', projectile: true }),
    S({ id: 'stake', name: '말뚝 박기', desc: '심장을 향한 말뚝.', kind: 'phys', target: 'enemy', range: [1, 1], area: 0, power: 1.6, cooldown: 3, pierce: 0.5, bonusVsTag: { tag: 'unholy', mul: 1.5 }, fx: 'pierce' }),

    // ---- 마법 ----
    S({ id: 'arcane_missile', name: '비전 화살', desc: '정확한 마력의 화살.', kind: 'mag', target: 'enemy', range: [1, 6], area: 0, power: 1.25, cooldown: 2, fx: 'bolt', projectile: true }),
    S({ id: 'frost_bolt', name: '서리 화살', desc: '맞은 적을 얼려 느리게 한다.', kind: 'mag', target: 'enemy', range: [1, 5], area: 0, power: 1.1, cooldown: 2, status: [{ id: 'slow', turns: 2 }], fx: 'ice', projectile: true }),
    S({ id: 'fireball', name: '화염구', desc: '폭발하는 불덩이.', kind: 'mag', target: 'tile', range: [2, 5], area: 1, power: 1.1, cooldown: 3, status: [{ id: 'burn', turns: 2, chance: 0.5 }], fx: 'fire', projectile: true }),
    S({ id: 'lightning', name: '연쇄 번개', desc: '번개가 적 사이를 튄다.', kind: 'mag', target: 'tile', range: [1, 5], area: 1, power: 1.0, cooldown: 3, status: [{ id: 'stun', turns: 1, chance: 0.25 }], fx: 'bolt' }),
    S({ id: 'meteor', name: '유성 낙하', desc: '하늘에서 불타는 돌을 떨어뜨린다.', kind: 'mag', target: 'tile', range: [2, 6], area: 2, power: 1.0, cooldown: 5, status: [{ id: 'burn', turns: 2, chance: 0.4 }], fx: 'fire' }),
    S({ id: 'shadow_bolt', name: '암흑 화살', desc: '맞은 자의 힘을 빼앗는다.', kind: 'mag', target: 'enemy', range: [1, 5], area: 0, power: 1.3, cooldown: 2, status: [{ id: 'weak', turns: 2 }], fx: 'dark', projectile: true }),
    S({ id: 'curse_agony', name: '고통의 저주', desc: '서서히 썩어가는 저주.', kind: 'debuff', target: 'enemy', range: [1, 5], area: 0, power: 0.3, cooldown: 3, status: [{ id: 'poison', turns: 3 }, { id: 'vuln', turns: 2 }], fx: 'dark' }),
    S({ id: 'drain_life', name: '생명 흡수', desc: '적의 생명을 빨아들인다.', kind: 'mag', target: 'enemy', range: [1, 4], area: 0, power: 1.0, cooldown: 2, lifesteal: 0.8, fx: 'blood' }),
    S({ id: 'bone_spear', name: '뼈창', desc: '땅에서 뼈의 창이 솟는다.', kind: 'mag', target: 'enemy', range: [1, 4], area: 0, power: 1.2, cooldown: 2, pierce: 0.4, fx: 'dark' }),
    S({ id: 'corpse_burst', name: '시체 폭발', desc: '죽음의 기운을 터뜨린다.', kind: 'mag', target: 'tile', range: [1, 4], area: 1, power: 1.05, cooldown: 4, fx: 'dark' }),
    S({ id: 'blood_lance', name: '피의 창', desc: '자신의 피로 창을 빚는다.', kind: 'mag', target: 'enemy', range: [1, 5], area: 0, power: 1.8, cooldown: 2, hpCost: 0.1, fx: 'blood', projectile: true }),
    S({ id: 'hemorrhage', name: '출혈의 저주', desc: '혈관을 찢어 피를 흘리게 한다.', kind: 'debuff', target: 'tile', range: [1, 4], area: 1, power: 0.5, cooldown: 3, hpCost: 0.06, status: [{ id: 'bleed', turns: 3 }], fx: 'blood' }),
    S({ id: 'star_fall', name: '별똥별', desc: '별빛이 적을 내리친다.', kind: 'mag', target: 'tile', range: [2, 6], area: 1, power: 1.0, cooldown: 3, fx: 'holy' }),
    S({ id: 'fate_mark', name: '운명의 낙인', desc: '별이 정한 죽음을 새긴다.', kind: 'debuff', target: 'enemy', range: [1, 6], area: 0, power: 0, cooldown: 3, status: [{ id: 'mark', turns: 3 }, { id: 'slow', turns: 1 }], fx: 'holy' }),
    S({ id: 'tidal_wave', name: '해일', desc: '심해의 물결이 적을 밀어낸다.', kind: 'mag', target: 'tile', range: [1, 4], area: 1, power: 1.0, cooldown: 3, push: 1, fx: 'water' }),
    S({ id: 'abyss_gaze', name: '심연의 응시', desc: '옛 신의 눈이 적을 얼어붙게 한다.', kind: 'debuff', target: 'enemy', range: [1, 5], area: 0, power: 0.4, cooldown: 4, status: [{ id: 'stun', turns: 1, chance: 0.5 }, { id: 'vuln', turns: 2 }], fx: 'dark' }),
    S({ id: 'spirit_bolt', name: '정령 화살', desc: '조상의 정령을 날린다.', kind: 'mag', target: 'enemy', range: [1, 5], area: 0, power: 1.1, cooldown: 2, fx: 'nature', projectile: true }),
    S({ id: 'hex', name: '주술', desc: '적을 약화·둔화시키는 주술.', kind: 'debuff', target: 'enemy', range: [1, 4], area: 0, power: 0.2, cooldown: 3, status: [{ id: 'weak', turns: 2 }, { id: 'slow', turns: 2 }], fx: 'dark' }),
    S({ id: 'totem_ward', name: '수호 토템', desc: '주변 아군을 지키는 토템을 세운다.', kind: 'buff', target: 'self', range: [0, 0], area: 2, power: 0, cooldown: 4, status: [{ id: 'guard', turns: 2 }], fx: 'nature' }),
    S({ id: 'thorns', name: '가시덩굴', desc: '땅에서 가시덩굴이 솟는다.', kind: 'mag', target: 'tile', range: [1, 4], area: 1, power: 0.75, cooldown: 3, status: [{ id: 'slow', turns: 2 }], fx: 'nature' }),

    // ---- 치유/지원 ----
    S({ id: 'heal', name: '치유', desc: '아군 하나를 치유한다.', kind: 'heal', target: 'ally', range: [0, 4], area: 0, power: 1.4, cooldown: 2, fx: 'heal' }),
    S({ id: 'mass_heal', name: '광역 치유', desc: '주변 아군을 모두 치유한다.', kind: 'heal', target: 'self', range: [0, 0], area: 2, power: 0.85, cooldown: 4, fx: 'heal' }),
    S({ id: 'blessing', name: '축복', desc: '아군에게 축복과 보호막을 내린다.', kind: 'buff', target: 'ally', range: [0, 4], area: 0, power: 0, cooldown: 3, status: [{ id: 'bless', turns: 3 }, { id: 'shield', turns: 3, value: 1.5 }], fx: 'holy' }),
    S({ id: 'smite', name: '징벌', desc: '하늘의 빛으로 내려친다.', kind: 'mag', target: 'enemy', range: [1, 4], area: 0, power: 1.15, cooldown: 2, bonusVsTag: { tag: 'unholy', mul: 1.6 }, fx: 'holy' }),
    S({ id: 'purge', name: '정화의 빛', desc: '불경한 것을 태우는 빛의 폭발.', kind: 'mag', target: 'tile', range: [1, 4], area: 1, power: 0.9, cooldown: 4, bonusVsTag: { tag: 'unholy', mul: 1.8 }, fx: 'holy' }),
    S({ id: 'banish', name: '퇴마', desc: '악령을 몰아내는 주문.', kind: 'mag', target: 'enemy', range: [1, 4], area: 0, power: 1.35, cooldown: 2, bonusVsTag: { tag: 'unholy', mul: 2.0 }, fx: 'holy' }),
    S({ id: 'sacred_seal', name: '성스러운 봉인', desc: '적을 봉인해 움직이지 못하게 한다.', kind: 'debuff', target: 'enemy', range: [1, 3], area: 0, power: 0.3, cooldown: 4, status: [{ id: 'stun', turns: 1, chance: 0.8 }], fx: 'holy' }),
    S({ id: 'rejuvenate', name: '회춘', desc: '서서히 생명력을 되살린다.', kind: 'heal', target: 'ally', range: [0, 4], area: 0, power: 0.7, cooldown: 2, status: [{ id: 'regen', turns: 3 }], fx: 'nature' }),
    S({ id: 'war_song', name: '전투의 노래', desc: '용기를 북돋는 노래.', kind: 'buff', target: 'self', range: [0, 0], area: 2, power: 0, cooldown: 4, status: [{ id: 'bless', turns: 2 }], fx: 'music' }),
    S({ id: 'lullaby', name: '자장가', desc: '적을 잠재우는 선율.', kind: 'debuff', target: 'tile', range: [1, 4], area: 1, power: 0, cooldown: 5, status: [{ id: 'stun', turns: 1, chance: 0.5 }], fx: 'music' }),
    S({ id: 'inspire', name: '영감', desc: '아군의 발걸음을 가볍게 한다.', kind: 'buff', target: 'ally', range: [0, 4], area: 0, power: 0, cooldown: 3, status: [{ id: 'haste', turns: 2 }, { id: 'regen', turns: 2 }], fx: 'music' }),
    S({ id: 'acid_flask', name: '산성 플라스크', desc: '갑옷을 녹이는 산을 던진다.', kind: 'mag', target: 'tile', range: [1, 4], area: 1, power: 0.75, cooldown: 3, status: [{ id: 'poison', turns: 2 }, { id: 'vuln', turns: 2 }], fx: 'poison', projectile: true }),
    S({ id: 'fire_flask', name: '화염병', desc: '불붙은 병을 던진다.', kind: 'mag', target: 'tile', range: [1, 4], area: 1, power: 0.9, cooldown: 3, status: [{ id: 'burn', turns: 2 }], fx: 'fire', projectile: true }),
    S({ id: 'healing_mist', name: '치유 안개', desc: '치유 물약을 안개로 퍼뜨린다.', kind: 'heal', target: 'tile', range: [0, 4], area: 1, power: 0.9, cooldown: 3, fx: 'heal', projectile: true }),
    S({ id: 'flame_jet', name: '화염 분사', desc: '장치에서 불길을 뿜는다.', kind: 'mag', target: 'tile', range: [1, 2], area: 1, power: 1.0, cooldown: 3, status: [{ id: 'burn', turns: 2, chance: 0.6 }], fx: 'fire' }),
    S({ id: 'gear_shield', name: '방어 장치', desc: '아군에게 기계식 방패를 씌운다.', kind: 'buff', target: 'ally', range: [0, 3], area: 0, power: 0, cooldown: 3, status: [{ id: 'shield', turns: 3, value: 2.0 }], fx: 'gear' }),

    // ---- 적 전용 ----
    S({ id: 'bone_rattle', name: '뼈 울림', desc: '주변 망자들을 격동시킨다.', kind: 'buff', target: 'self', range: [0, 0], area: 2, power: 0, cooldown: 4, status: [{ id: 'bless', turns: 2 }], fx: 'dark' }),
    S({ id: 'grave_claw', name: '무덤 손톱', desc: '썩은 손톱이 살을 찢는다.', kind: 'phys', target: 'enemy', range: [1, 1], area: 0, power: 1.1, cooldown: 2, status: [{ id: 'bleed', turns: 2 }], fx: 'slash' }),
    S({ id: 'dark_nova', name: '암흑 폭발', desc: '주위에 죽음의 파동을 터뜨린다.', kind: 'mag', target: 'self', range: [0, 0], area: 2, power: 0.9, cooldown: 3, status: [{ id: 'weak', turns: 2 }], fx: 'dark' }),
  ].map((s) => [s.id, s]),
);

export function skill(id: string): SkillDef {
  const s = SKILLS[id];
  if (!s) throw new Error(`unknown skill ${id}`);
  return s;
}
