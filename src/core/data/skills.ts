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

    // ---- 마약쟁이 ----
    S({ id: 'overdose', name: '과다 투여', desc: '용량은 감으로 맞춘다. 축복·가속, 대신 체력을 깎는다.', kind: 'buff', target: 'self', range: [0, 0], area: 0, power: 0, cooldown: 4, hpCost: 0.12, selfStatus: [{ id: 'bless', turns: 3 }, { id: 'haste', turns: 2 }], fx: 'poison' }),
    S({ id: 'shared_needle', name: '주사 돌려쓰기', desc: '나눠 쓰면 기쁨도 두 배. 병도 두 배. (가속·축복 + 중독)', kind: 'buff', target: 'ally', range: [1, 2], area: 0, power: 0, cooldown: 3, status: [{ id: 'haste', turns: 2 }, { id: 'bless', turns: 2 }, { id: 'poison', turns: 2 }], fx: 'poison' }),
    S({ id: 'withdrawal_rage', name: '금단 증상', desc: '약이 떨어졌다. 누군가 대가를 치른다.', kind: 'phys', target: 'enemy', range: [1, 1], area: 0, power: 1.55, cooldown: 3, selfStatus: [{ id: 'vuln', turns: 1 }], fx: 'blunt' }),
    // ---- 고문기술자 ----
    S({ id: 'thumbscrew', name: '손톱 뽑기', desc: '질문은 하나, 손톱은 열 개. 출혈·약화.', kind: 'phys', target: 'enemy', range: [1, 1], area: 0, power: 0.7, cooldown: 3, status: [{ id: 'bleed', turns: 3 }, { id: 'weak', turns: 2 }], fx: 'pierce' }),
    S({ id: 'confession', name: '자백 강요', desc: '아무 말이나 해도 된다. 어차피 안 믿는다. 표식·취약, 낮은 확률로 기절.', kind: 'debuff', target: 'enemy', range: [1, 2], area: 0, power: 0, cooldown: 4, status: [{ id: 'mark', turns: 3 }, { id: 'vuln', turns: 2 }, { id: 'stun', turns: 1, chance: 0.3 }], fx: 'dark' }),
    S({ id: 'salt_wound', name: '상처에 소금', desc: '피 흘리는 적에게 특히 아프다.', kind: 'phys', target: 'enemy', range: [1, 2], area: 0, power: 1.0, cooldown: 2, bonusVsTag: { tag: 'bleeding', mul: 1.9 }, fx: 'slash' }),
    // ---- 광대 ----
    S({ id: 'joke_of_doom', name: '죽음의 농담', desc: '아무도 웃지 않았다. 그래서 다쳤다. 약화.', kind: 'mag', target: 'enemy', range: [1, 4], area: 0, power: 1.15, cooldown: 2, status: [{ id: 'weak', turns: 2 }], fx: 'music' }),
    S({ id: 'juggle_knives', name: '칼 저글링', desc: '가끔은 관객석으로 떨어진다.', kind: 'phys', target: 'tile', range: [1, 3], area: 1, power: 0.7, cooldown: 3, fx: 'pierce', projectile: true }),
    S({ id: 'wild_card', name: '와일드 카드', desc: '무엇이 나올지 광대도 모른다. 무작위 나쁜 상태 하나.', kind: 'debuff', target: 'enemy', range: [1, 4], area: 0, power: 0.3, cooldown: 3, randomStatus: [{ id: 'stun', turns: 1 }, { id: 'weak', turns: 2 }, { id: 'slow', turns: 2 }, { id: 'vuln', turns: 2 }, { id: 'burn', turns: 2 }, { id: 'poison', turns: 3 }, { id: 'mark', turns: 3 }], fx: 'music' }),
    // ---- 고리대금업자 ----
    S({ id: 'collect_debt', name: '빚 독촉', desc: '원금은 몸으로, 이자는 금화로. 적중 시 금화, 처치 시 큰 금화.', kind: 'phys', target: 'enemy', range: [1, 1], area: 0, power: 1.15, cooldown: 2, goldOnHit: 4, goldOnKill: 20, fx: 'blunt' }),
    S({ id: 'compound_interest', name: '복리', desc: '갚을수록 불어난다. 긴 중독·표식.', kind: 'debuff', target: 'enemy', range: [1, 4], area: 0, power: 0.2, cooldown: 3, status: [{ id: 'poison', turns: 4 }, { id: 'mark', turns: 2 }], fx: 'dark' }),
    S({ id: 'hire_thug', name: '해결사 고용', desc: '대신 때려줄 사람은 언제나 있다. 해결사를 부른다.', kind: 'summon', target: 'self', range: [0, 0], area: 0, power: 0, cooldown: 6, summon: { def: 'thug', count: 1 }, fx: 'shout' }),
    // ---- 역병의사 ----
    S({ id: 'bloodletting', name: '사혈', desc: '나쁜 피를 뺀다. 좋은 피도 조금. 크게 치유하고 잠깐 출혈.', kind: 'heal', target: 'ally', range: [0, 3], area: 0, power: 1.7, cooldown: 2, status: [{ id: 'bleed', turns: 1 }], fx: 'blood' }),
    S({ id: 'miasma', name: '역병 안개', desc: '썩은 공기가 퍼진다. 중독·약화.', kind: 'debuff', target: 'tile', range: [1, 4], area: 1, power: 0.3, cooldown: 3, status: [{ id: 'poison', turns: 3 }, { id: 'weak', turns: 2 }], fx: 'poison', projectile: true }),
    S({ id: 'quarantine', name: '격리', desc: '몸에 붙은 나쁜 것을 모두 떼어내고 보호한다.', kind: 'buff', target: 'ally', range: [0, 3], area: 0, power: 0, cooldown: 3, cleanse: true, status: [{ id: 'guard', turns: 1 }], fx: 'heal' }),
    // ---- 주정뱅이 ----
    S({ id: 'bottle_smash', name: '병나발', desc: '마시던 병으로 머리를 깬다. 기절 확률.', kind: 'phys', target: 'enemy', range: [1, 1], area: 0, power: 1.2, cooldown: 2, status: [{ id: 'stun', turns: 1, chance: 0.35 }], fx: 'blunt' }),
    S({ id: 'liquid_courage', name: '술기운', desc: '한 잔이면 용감해지고, 두 잔이면 걷지 못한다. 축복·재생, 둔화.', kind: 'buff', target: 'self', range: [0, 0], area: 0, power: 0, cooldown: 4, selfStatus: [{ id: 'bless', turns: 3 }, { id: 'regen', turns: 2 }, { id: 'slow', turns: 1 }], fx: 'buff' }),
    S({ id: 'drunken_breath', name: '화주 뿜기', desc: '독한 술에 불을 붙여 뿜는다.', kind: 'mag', target: 'tile', range: [1, 2], area: 1, power: 0.95, cooldown: 3, status: [{ id: 'burn', turns: 2, chance: 0.7 }], fx: 'fire' }),
    // ---- 백정 ----
    S({ id: 'hack', name: '토막내기', desc: '뼈째로 내려친다. 출혈.', kind: 'phys', target: 'enemy', range: [1, 1], area: 0, power: 1.3, cooldown: 2, status: [{ id: 'bleed', turns: 2 }], fx: 'slash' }),
    S({ id: 'meat_hook', name: '갈고리', desc: '멀리 있는 고기는 당겨온다.', kind: 'phys', target: 'enemy', range: [2, 3], area: 0, power: 0.8, cooldown: 3, pull: 2, fx: 'pierce', projectile: true }),
    S({ id: 'snack_break', name: '간식 시간', desc: '남은 고기가 있다. 무슨 고기인지는 묻지 마라.', kind: 'heal', target: 'self', range: [0, 0], area: 0, power: 1.6, cooldown: 4, fx: 'heal' }),
    // ---- 무덤지기 ----
    S({ id: 'shovel_smack', name: '삽질', desc: '삽의 평평한 면으로. 기절 확률.', kind: 'phys', target: 'enemy', range: [1, 1], area: 0, power: 1.1, cooldown: 2, status: [{ id: 'stun', turns: 1, chance: 0.3 }], fx: 'blunt' }),
    S({ id: 'dig_grave', name: '미리 파둔 무덤', desc: '치수는 이미 재 두었다. 표식·둔화.', kind: 'debuff', target: 'enemy', range: [1, 4], area: 0, power: 0, cooldown: 3, status: [{ id: 'mark', turns: 3 }, { id: 'slow', turns: 2 }], fx: 'dark' }),
    S({ id: 'raise_help', name: '일꾼 깨우기', desc: '무덤에서 일손을 빌린다. 해골 일꾼을 부른다.', kind: 'summon', target: 'self', range: [0, 0], area: 0, power: 0, cooldown: 6, summon: { def: 'skel_worker', count: 1 }, fx: 'dark' }),
    // ---- 인형술사 ----
    S({ id: 'string_pull', name: '실 당기기', desc: '보이지 않는 실로 적을 끌어온다. 둔화.', kind: 'mag', target: 'enemy', range: [2, 4], area: 0, power: 0.8, cooldown: 3, pull: 2, status: [{ id: 'slow', turns: 1 }], fx: 'dark' }),
    S({ id: 'puppet_dance', name: '꼭두각시 춤', desc: '적의 팔다리를 제멋대로 움직인다. 기절 확률·약화.', kind: 'debuff', target: 'enemy', range: [1, 4], area: 0, power: 0.2, cooldown: 4, status: [{ id: 'stun', turns: 1, chance: 0.5 }, { id: 'weak', turns: 2 }], fx: 'music' }),
    S({ id: 'make_puppet', name: '인형 만들기', desc: '꼭두각시 인형을 세워 대신 맞게 한다.', kind: 'summon', target: 'self', range: [0, 0], area: 0, power: 0, cooldown: 5, summon: { def: 'puppet_doll', count: 1 }, fx: 'gear' }),
    // ---- 처형인 ----
    S({ id: 'headsman_swing', name: '참수', desc: '목은 하나, 실수는 없다. 빈사의 적에게 치명적.', kind: 'phys', target: 'enemy', range: [1, 1], area: 0, power: 1.9, cooldown: 4, bonusVsTag: { tag: 'wounded', mul: 1.6 }, fx: 'slash' }),
    S({ id: 'last_words', name: '유언 듣기', desc: '할 말이 있으면 지금 해라. 표식·취약.', kind: 'debuff', target: 'enemy', range: [1, 3], area: 0, power: 0, cooldown: 3, status: [{ id: 'mark', turns: 3 }, { id: 'vuln', turns: 2 }], fx: 'dark' }),
    // ---- 넝마주이 ----
    S({ id: 'junk_toss', name: '고물 투척', desc: '뭐가 날아갈지는 가방에 달렸다. 무작위 상태.', kind: 'phys', target: 'enemy', range: [2, 4], area: 0, power: 0.9, cooldown: 2, randomStatus: [{ id: 'slow', turns: 2 }, { id: 'weak', turns: 2 }, { id: 'stun', turns: 1 }, { id: 'bleed', turns: 2 }], fx: 'blunt', projectile: true }),
    S({ id: 'scrap_armor', name: '고철 갑옷', desc: '주운 고철을 몸에 두른다. 보호막·방어.', kind: 'buff', target: 'self', range: [0, 0], area: 0, power: 0, cooldown: 4, selfStatus: [{ id: 'shield', turns: 3, value: 2.0 }, { id: 'guard', turns: 1 }], fx: 'gear' }),
    S({ id: 'scrounge', name: '뒤지기', desc: '전장은 노다지다. 금화를 줍고 숨을 고른다.', kind: 'buff', target: 'self', range: [0, 0], area: 0, power: 0, cooldown: 4, goldGain: 8, selfStatus: [{ id: 'regen', turns: 2 }], fx: 'buff' }),
    // ---- 사기꾼 ----
    S({ id: 'switcheroo', name: '바꿔치기', desc: '방금까지 거기 있던 건 내가 아니었다. 적과 자리를 바꾼다.', kind: 'debuff', target: 'enemy', range: [1, 4], area: 0, power: 0, cooldown: 4, swap: true, status: [{ id: 'weak', turns: 1 }], fx: 'buff' }),
    S({ id: 'sweet_talk', name: '감언이설', desc: '듣다 보면 싸울 마음이 사라진다. 약화·둔화.', kind: 'debuff', target: 'tile', range: [1, 3], area: 1, power: 0, cooldown: 4, status: [{ id: 'weak', turns: 2 }, { id: 'slow', turns: 1 }], fx: 'music' }),
    S({ id: 'pickpocket', name: '소매치기', desc: '찌르는 척 지갑을 턴다. 적중 시 금화.', kind: 'phys', target: 'enemy', range: [1, 1], area: 0, power: 0.85, cooldown: 2, goldOnHit: 6, fx: 'pierce' }),
    // ---- 쥐잡이 ----
    S({ id: 'rat_swarm', name: '쥐떼 풀기', desc: '주머니에서 쥐가 쏟아진다. 쥐떼를 부른다.', kind: 'summon', target: 'self', range: [0, 0], area: 0, power: 0, cooldown: 5, summon: { def: 'rat_swarm', count: 2 }, fx: 'nature' }),
    S({ id: 'poison_bait', name: '독 미끼', desc: '쥐약은 쥐만 먹는 게 아니다.', kind: 'debuff', target: 'tile', range: [1, 4], area: 1, power: 0.25, cooldown: 3, status: [{ id: 'poison', turns: 3 }], fx: 'poison', projectile: true }),
    S({ id: 'trap_snap', name: '쥐덫', desc: '덥석. 기절 확률.', kind: 'phys', target: 'enemy', range: [1, 3], area: 0, power: 0.6, cooldown: 4, status: [{ id: 'stun', turns: 1, chance: 0.6 }], fx: 'pierce' }),
    // ---- 사이비 교주 ----
    S({ id: 'tithe', name: '십일조', desc: '신은 피를 좋아하신다. 아마도. 아군의 체력을 바쳐 축복·가속.', kind: 'buff', target: 'ally', range: [1, 3], area: 0, power: 0, cooldown: 3, sacrifice: 0.15, status: [{ id: 'bless', turns: 3 }, { id: 'haste', turns: 2 }], fx: 'blood' }),
    S({ id: 'doomsday_sermon', name: '종말 설교', desc: '끝이 온다. 헌금은 미리. 주변 적 약화·둔화.', kind: 'debuff', target: 'self', range: [0, 0], area: 2, power: 0.3, cooldown: 4, status: [{ id: 'weak', turns: 2 }, { id: 'slow', turns: 1 }], fx: 'dark' }),
    S({ id: 'false_miracle', name: '가짜 기적', desc: '기적은 연출이다. 상처가 낫는 건 진짜다.', kind: 'heal', target: 'ally', range: [0, 4], area: 0, power: 1.3, cooldown: 2, status: [{ id: 'regen', turns: 1 }], fx: 'holy' }),
    // ---- 방화광 ----
    S({ id: 'inferno', name: '대화재', desc: '조금 타는 건 예술의 일부. 넓게 불태우고 자신도 그을린다.', kind: 'mag', target: 'tile', range: [2, 4], area: 2, power: 0.8, cooldown: 5, hpCost: 0.05, status: [{ id: 'burn', turns: 3 }], fx: 'fire' }),
    S({ id: 'fan_flames', name: '불길 키우기', desc: '타고 있는 적에게 기름을 붓는다.', kind: 'mag', target: 'enemy', range: [1, 4], area: 0, power: 0.9, cooldown: 2, bonusVsTag: { tag: 'burning', mul: 2.0 }, fx: 'fire', projectile: true }),
    // ---- 곡쟁이 ----
    S({ id: 'wail', name: '곡소리', desc: '삯은 미리 받았다. 주변 적 약화.', kind: 'debuff', target: 'self', range: [0, 0], area: 2, power: 0.25, cooldown: 3, status: [{ id: 'weak', turns: 2 }], fx: 'music' }),
    S({ id: 'eulogy', name: '추도사', desc: '아직 살아 있는 자들을 위한 추도사. 주변 아군 축복·재생.', kind: 'buff', target: 'self', range: [0, 0], area: 2, power: 0, cooldown: 4, status: [{ id: 'bless', turns: 2 }, { id: 'regen', turns: 2 }], fx: 'holy' }),
    S({ id: 'grief_strike', name: '원통함', desc: '쌓인 슬픔을 쏟아낸다. 빈사의 적에게 강하다.', kind: 'mag', target: 'enemy', range: [1, 4], area: 0, power: 1.1, cooldown: 2, bonusVsTag: { tag: 'wounded', mul: 1.4 }, fx: 'dark' }),
    // ---- 총잡이 ----
    S({ id: 'aimed_shot', name: '조준 사격', desc: '숨을 멈추고 쏜다. 아주 먼 거리, 방어 일부 무시.', kind: 'phys', target: 'enemy', range: [3, 7], area: 0, power: 1.7, cooldown: 3, pierce: 0.3, fx: 'arrow', projectile: true }),
    S({ id: 'buckshot', name: '산탄', desc: '가까운 범위에 납탄을 흩뿌린다.', kind: 'phys', target: 'tile', range: [1, 3], area: 1, power: 0.8, cooldown: 3, fx: 'blunt' }),
    S({ id: 'reload', name: '재장전', desc: '화약을 다지고 숨을 고른다. 가속·축복.', kind: 'buff', target: 'self', range: [0, 0], area: 0, power: 0, cooldown: 4, selfStatus: [{ id: 'haste', turns: 1 }, { id: 'bless', turns: 2 }], fx: 'gear' }),
    // ---- 검무희 ----
    S({ id: 'ring_toss', name: '원반 투척', desc: '돌아오는 칼날 원반.', kind: 'phys', target: 'enemy', range: [1, 4], area: 0, power: 1.0, cooldown: 2, pierce: 0.2, fx: 'slash', projectile: true }),
    S({ id: 'blade_waltz', name: '칼날 왈츠', desc: '주변을 돌며 베고 박자를 탄다.', kind: 'phys', target: 'self', range: [0, 0], area: 1, power: 1.0, cooldown: 3, selfStatus: [{ id: 'haste', turns: 1 }], fx: 'slash' }),
    S({ id: 'dazzle', name: '현혹', desc: '번쩍이는 칼날로 눈을 홀린다. 둔화·약화.', kind: 'debuff', target: 'tile', range: [1, 3], area: 1, power: 0, cooldown: 4, status: [{ id: 'slow', turns: 2 }, { id: 'weak', turns: 1 }], fx: 'buff' }),
    // ---- 조련사 ----
    S({ id: 'whip_crack', name: '채찍질', desc: '채찍 소리에 짐승도 사람도 움찔한다. 둔화.', kind: 'phys', target: 'enemy', range: [1, 2], area: 0, power: 1.0, cooldown: 2, status: [{ id: 'slow', turns: 1 }], fx: 'slash' }),
    S({ id: 'call_beast', name: '야수 호출', desc: '길들인 늑대를 부른다.', kind: 'summon', target: 'self', range: [0, 0], area: 0, power: 0, cooldown: 5, summon: { def: 'tamed_wolf', count: 1 }, fx: 'nature' }),
    S({ id: 'pack_howl', name: '무리의 울부짖음', desc: '무리를 깨운다. 주변 아군 축복·가속.', kind: 'buff', target: 'self', range: [0, 0], area: 2, power: 0, cooldown: 4, status: [{ id: 'bless', turns: 2 }, { id: 'haste', turns: 1 }], fx: 'shout' }),
    // ---- 마검사 ----
    S({ id: 'arcane_edge', name: '마력 검', desc: '마력을 칼날에 실어 벤다. 마력으로 피해.', kind: 'mag', target: 'enemy', range: [1, 1], area: 0, power: 1.45, cooldown: 2, fx: 'bolt' }),
    S({ id: 'blink_strike', name: '섬광 찌르기', desc: '빛처럼 뻗는 찌르기.', kind: 'phys', target: 'enemy', range: [1, 3], area: 0, power: 1.1, cooldown: 3, pierce: 0.2, fx: 'pierce' }),
    S({ id: 'spell_parry', name: '마법 막기', desc: '검에 방어 주문을 두른다. 보호막·방어.', kind: 'buff', target: 'self', range: [0, 0], area: 0, power: 0, cooldown: 4, selfStatus: [{ id: 'shield', turns: 3, value: 1.8 }, { id: 'guard', turns: 1 }], fx: 'bolt' }),
    // ---- 지맥술사 ----
    S({ id: 'earth_spike', name: '땅가시', desc: '발밑에서 돌가시가 솟는다. 기절 확률.', kind: 'mag', target: 'enemy', range: [1, 4], area: 0, power: 1.2, cooldown: 2, status: [{ id: 'stun', turns: 1, chance: 0.25 }], fx: 'nature' }),
    S({ id: 'quake', name: '지진', desc: '땅이 흔들린다. 넓은 범위 둔화.', kind: 'mag', target: 'tile', range: [1, 4], area: 2, power: 0.7, cooldown: 4, status: [{ id: 'slow', turns: 2 }], fx: 'blunt' }),
    S({ id: 'stone_skin', name: '돌피부', desc: '아군의 피부를 돌처럼 굳힌다. 보호막·방어.', kind: 'buff', target: 'ally', range: [0, 3], area: 0, power: 0, cooldown: 3, status: [{ id: 'shield', turns: 3, value: 2.2 }, { id: 'guard', turns: 1 }], fx: 'gear' }),
    // ---- 결투가 ----
    S({ id: 'fleche', name: '플레시', desc: '달려들며 찌른다. 방어 일부 무시.', kind: 'phys', target: 'enemy', range: [1, 2], area: 0, power: 1.3, cooldown: 2, pierce: 0.3, fx: 'pierce' }),
    S({ id: 'riposte', name: '반격 자세', desc: '받아넘길 준비를 한다. 방어·축복.', kind: 'buff', target: 'self', range: [0, 0], area: 0, power: 0, cooldown: 3, selfStatus: [{ id: 'guard', turns: 2 }, { id: 'bless', turns: 1 }], fx: 'slash' }),
    S({ id: 'challenge', name: '결투 신청', desc: '장갑을 던진다. 적에게 표식, 자신은 도발.', kind: 'debuff', target: 'enemy', range: [1, 4], area: 0, power: 0, cooldown: 4, status: [{ id: 'mark', turns: 3 }], selfStatus: [{ id: 'taunt', turns: 2 }], fx: 'shout' }),

    // ---- 지휘관 ----
    S({ id: 'core_strike', name: '핵의 일격', desc: '세계핵의 빛을 실어 베고, 그 힘으로 상처를 메운다.', kind: 'phys', target: 'enemy', range: [1, 1], area: 0, power: 1.3, cooldown: 2, lifesteal: 0.4, fx: 'holy' }),
    S({ id: 'rally', name: '지휘', desc: '주변 아군을 고무해 축복과 가속을 건다.', kind: 'buff', target: 'self', range: [0, 0], area: 2, power: 0, cooldown: 4, status: [{ id: 'bless', turns: 2 }, { id: 'haste', turns: 1 }], fx: 'shout' }),

    // ---- 적 전용 ----
    S({ id: 'unholy_requiem', name: '망자의 진혼곡', desc: '한 턴 동안 영창한 뒤, 표시된 범위를 죽음의 노래로 휩쓴다.', kind: 'mag', target: 'tile', range: [1, 6], area: 2, power: 1.9, cooldown: 4, charge: 1, status: [{ id: 'weak', turns: 2 }], fx: 'dark' }),
    S({ id: 'abyssal_tide', name: '심연의 대해일', desc: '한 턴 동안 물을 끌어모은 뒤, 표시된 범위를 덮친다.', kind: 'mag', target: 'tile', range: [1, 6], area: 2, power: 1.7, cooldown: 4, charge: 1, push: 1, fx: 'water' }),
    S({ id: 'crushing_blow', name: '분쇄 일격', desc: '한 턴 동안 힘을 모아, 표시된 칸을 내려친다.', kind: 'phys', target: 'tile', range: [1, 1], area: 0, power: 2.3, cooldown: 4, charge: 1, fx: 'blunt' }),
    S({ id: 'raise_dead', name: '망자 소생', desc: '해골 병사를 일으킨다.', kind: 'summon', target: 'self', range: [0, 0], area: 0, power: 0, cooldown: 5, summon: { def: 'skel_warrior', count: 2 }, fx: 'dark' }),
    S({ id: 'call_deep', name: '심해의 부름', desc: '심해 척후를 불러낸다.', kind: 'summon', target: 'self', range: [0, 0], area: 0, power: 0, cooldown: 5, summon: { def: 'deep_spawn', count: 2 }, fx: 'water' }),
    S({ id: 'call_faithful', name: '신도 소집', desc: '광신도를 불러낸다.', kind: 'summon', target: 'self', range: [0, 0], area: 0, power: 0, cooldown: 6, summon: { def: 'cultist', count: 1 }, fx: 'dark' }),
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
