// v0.4 적 세력의 적·정예·보스. enemies.ts의 ENEMIES에 합쳐진다.
import type { HeadgearKind, OffhandKind, OutfitKind, RaceId, Stats, WeaponKind } from '../types';
import type { EnemyDef, PhaseDef } from './enemies';

type Look = { head?: HeadgearKind; outfit?: OutfitKind; weapon?: WeaponKind; offhand?: OffhandKind; palette?: [string, string]; skin?: [string, string, string] };
const lk = (weapon: WeaponKind, outfit: OutfitKind, head: HeadgearKind, palette: [string, string], offhand?: OffhandKind): Look => ({ weapon, outfit, head, palette, ...(offhand ? { offhand } : {}) });

function reg(id: string, name: string, race: RaceId, cls: string, skills: string[], tags: string[], look: Look, o: { mul?: Partial<Stats>; exp?: number; gold?: number; scale?: number } = {}): EnemyDef {
  return { id, name, race, cls, skills, tags, look, mul: o.mul ?? { hp: 0.8, atk: 0.88, mag: 0.88 }, exp: o.exp ?? 14, gold: o.gold ?? 11, ...(o.scale ? { scale: o.scale } : {}) };
}
function elite(id: string, name: string, race: RaceId, cls: string, skills: string[], tags: string[], look: Look, phase: PhaseDef, o: { mul?: Partial<Stats>; scale?: number } = {}): EnemyDef {
  return { id, name, race, cls, skills, tags, look, mul: o.mul ?? { hp: 1.35, atk: 1.0, mag: 1.0, def: 1.1 }, exp: 32, gold: 30, elite: true, scale: o.scale ?? 1.15, phases: [phase] };
}
function boss(id: string, name: string, title: string, race: RaceId, cls: string, skills: string[], tags: string[], look: Look, phases: PhaseDef[], o: { mul?: Partial<Stats>; scale?: number } = {}): EnemyDef {
  return { id, name, title, race, cls, skills, tags: [...tags, 'boss'], look, mul: o.mul ?? { hp: 3.7, atk: 1.05, mag: 1.05, def: 1.2, res: 1.25 }, exp: 110, gold: 140, boss: true, scale: o.scale ?? 1.55, phases };
}
const rage = (text: string): PhaseDef => ({ at: 0.5, text, selfStatus: [{ id: 'bless', turns: 3 }, { id: 'haste', turns: 2 }] });

export const EXT_ENEMIES: EnemyDef[] = [
  // ===== 공용 함정 =====
  reg('treasure_mimic', '보물 상자?', 'mimic', 'warrior', ['devour'], ['construct', 'mimic'], lk('fist', 'leather', 'none', ['#5a2a1a', '#e2b84a']), { mul: { hp: 0.85, atk: 0.95, def: 1.2 }, exp: 22, gold: 60 }),
  reg('green_slime', '슬라임', 'slime', 'berserker', ['acid_spit'], ['slime'], lk('fist', 'rags', 'none', ['#3a8a4a', '#8af0aa']), { mul: { hp: 0.9, atk: 0.75, def: 0.6, res: 1.4 }, exp: 11, gold: 6, scale: 0.9 }),
  reg('slime_blob', '작은 슬라임', 'slime', 'berserker', ['acid_spit'], ['slime'], lk('fist', 'rags', 'none', ['#3a8a4a', '#8af0aa']), { mul: { hp: 0.45, atk: 0.6 }, exp: 4, gold: 2, scale: 0.75 }),
  reg('cave_spider', '동굴 거미족', 'insectkin', 'rogue', ['web_shot', 'poison_blade'], ['beast', 'insect'], lk('dagger', 'leather', 'none', ['#2a2a30', '#8a2a2a']), { mul: { hp: 0.75, atk: 0.9, spd: 1.1 } }),

  // ===== 망자의 군세 (undead) =====
  reg('bone_mage', '해골 마법사', 'skeleton', 'necromancer', ['bone_spear'], ['undead', 'unholy'], lk('staff', 'bone', 'hood', ['#3a3448', '#7fe3ff'])),
  reg('grave_hound', '무덤 사냥개', 'skeleton', 'berserker', ['grave_claw'], ['undead', 'unholy', 'beast'], lk('fist', 'bone', 'none', ['#3a3448', '#8a2a2a']), { mul: { hp: 0.7, atk: 0.9, spd: 1.15 }, scale: 0.9 }),
  boss('lich_lord', '리치 군주', '리치 군주', 'skeleton', 'necromancer', ['bone_spear', 'dark_nova', 'soul_harvest'], ['undead', 'unholy', 'rift'], lk('scythe', 'robe', 'crown', ['#1a1a2a', '#7fe3ff']),
    [{ at: 0.5, text: '리치의 성물함이 빛나며 망자들이 일어선다!', summon: { def: 'skel_warrior', count: 2 }, addSkills: ['raise_dead'], selfStatus: [{ id: 'shield', turns: 3, value: 3 }] }]),

  // ===== 심연의 성가대 (abyss) =====
  reg('siren', '세이렌', 'merfolk', 'bard', ['lullaby', 'war_song'], ['abyssal'], lk('lute', 'dress', 'none', ['#1a5a7a', '#9ae0e8'])),
  reg('brine_witch', '소금물 마녀', 'deepone', 'witch', ['hex', 'curse_agony'], ['abyssal', 'cult'], lk('wand', 'rags', 'witch', ['#0f3a48', '#5ec4b6'])),
  elite('leviathan_spawn', '레비아탄의 새끼', 'deepone', 'lancer', ['spear_thrust', 'tidal_wave', 'sweep'], ['abyssal'], lk('trident', 'scale', 'none', ['#0a3a4a', '#c9a36b']), rage('레비아탄의 새끼가 아가미를 펄럭이며 포효한다!'), { scale: 1.3 }),
  boss('drowned_queen', '익사한 여왕', '익사한 여왕', 'merfolk', 'abyssal', ['tidal_wave', 'lullaby', 'abyssal_tide'], ['abyssal', 'cult'], lk('trident', 'dress', 'crown', ['#0a2a3a', '#9ae0e8']),
    [{ at: 0.5, text: '"내 성가대여, 노래하라!" 세이렌들이 물속에서 떠오른다.', summon: { def: 'siren', count: 2 }, selfStatus: [{ id: 'regen', turns: 4 }] }]),

  // ===== 쥐왕의 하수도 (sewer) =====
  reg('kobold_trapper', '코볼트 덫꾼', 'kobold', 'ratcatcher', ['trap_snap', 'poison_bait'], ['beast'], lk('crossbow', 'leather', 'bandana', ['#5a4a2a', '#c0c040'], 'cage')),
  reg('sewer_junkie', '하수도 약쟁이', 'goblin', 'junkie', ['withdrawal_rage', 'shared_needle'], ['bandit'], lk('syringe', 'rags', 'none', ['#4a4a3a', '#8a3a6a'])),
  elite('rat_ogre', '쥐 오거', 'halfogre', 'butcher', ['hack', 'meat_hook', 'snack_break'], ['brute'], lk('cleaver', 'apron', 'none', ['#e0d8c8', '#7a1a1a']), rage('쥐 오거가 앞치마를 찢으며 날뛴다!'), { scale: 1.3, mul: { hp: 1.5, atk: 1.05 } }),
  elite('plague_bearer', '역병 운반자', 'ratkin', 'plaguedoc', ['miasma', 'bloodletting', 'quarantine'], ['beast', 'vermin'], lk('syringe', 'cloak', 'plaguemask', ['#2a2a24', '#8a8a3a']), { at: 0.5, text: '역병 운반자가 썩은 주머니를 터뜨린다!', summon: { def: 'rat_pack', count: 2 } }, { scale: 1.1 }),
  boss('rat_king', '쥐왕', '쥐왕', 'ratkin', 'ratcatcher', ['poison_bait', 'trap_snap', 'plague_tide'], ['beast', 'vermin'], lk('sickle', 'fur', 'crown', ['#4a3a2a', '#e2b84a'], 'cage'),
    [{ at: 0.5, text: '"내 백성들아! 짓밟아라!" 하수도 전체가 찍찍거린다.', summon: { def: 'rat_pack', count: 2 }, addSkills: ['call_rats'] }], { scale: 1.4 }),
  boss('sewer_baron', '하수도 남작', '하수도 남작', 'goblin', 'loanshark', ['collect_debt', 'hire_thug', 'compound_interest'], ['bandit'], lk('mace', 'suit', 'tophat', ['#2a2a1a', '#e2b84a']),
    [{ at: 0.5, text: '"계약 위반이다! 추심원들, 일해라!"', summon: { def: 'thug', count: 2 }, addSkills: ['plague_tide'] }], { scale: 1.4 }),

  // ===== 폭주한 정령 (elemental) =====
  reg('ember_wisp', '불씨 정령', 'fire_spirit', 'elementalist', ['fire_flask'], ['spirit', 'elemental', 'fire'], lk('staff', 'robe', 'none', ['#7a1a0a', '#ffb04a']), { mul: { hp: 0.7, mag: 0.9 } }),
  reg('tide_wisp', '물결 정령', 'water_spirit', 'mage', ['frost_bolt'], ['spirit', 'elemental'], lk('wand', 'robe', 'none', ['#1a4a6a', '#9ae0e8'])),
  reg('gale_wisp', '돌개바람 정령', 'wind_spirit', 'archer', ['crippling_shot'], ['spirit', 'elemental'], lk('bow', 'tunic', 'none', ['#4a8a7a', '#e8fff8']), { mul: { hp: 0.7, atk: 0.9, spd: 1.15 } }),
  reg('stone_wisp', '바위 정령', 'earth_spirit', 'knight', ['shield_bash'], ['spirit', 'elemental', 'stone'], lk('hammer', 'plate', 'none', ['#4a3a2a', '#9adf5a'], 'shield'), { mul: { hp: 1.0, atk: 0.85, def: 1.3 } }),
  reg('mad_salamander', '광폭한 불도마뱀', 'salamander', 'berserker', ['blood_frenzy'], ['reptile', 'fire'], lk('axe', 'tribal', 'none', ['#7a2a0a', '#ffb04a'])),
  elite('magma_golem', '용암 골렘', 'earth_spirit', 'runesmith', ['rune_strike', 'quake', 'crushing_blow'], ['spirit', 'elemental', 'stone', 'fire'], lk('hammer', 'plate', 'none', ['#3a1a0a', '#ff6a2a']), rage('골렘의 틈새로 용암이 뿜어져 나온다!'), { scale: 1.35, mul: { hp: 1.6, atk: 1.05, def: 1.3 } }),
  elite('storm_caller', '폭풍 소환자', 'wind_spirit', 'elementalist', ['lightning', 'meteor'], ['spirit', 'elemental'], lk('staff', 'robe', 'circlet', ['#2a3a6a', '#bff4ff']), { at: 0.5, text: '하늘이 어두워지며 번개가 갈라진다!', selfStatus: [{ id: 'haste', turns: 3 }] }),
  boss('primordial_flame', '태초의 불꽃', '태초의 불꽃', 'fire_spirit', 'elementalist', ['fireball', 'meteor', 'solar_flare'], ['spirit', 'elemental', 'fire'], lk('staff', 'robe', 'none', ['#5a0a0a', '#fff2a0']),
    [{ at: 0.5, text: '태초의 불꽃이 갈라지며 작은 불씨들이 흩어진다!', summon: { def: 'ember_wisp', count: 2 } }], { mul: { hp: 3.2, mag: 0.88, def: 1.1, res: 1.15 } }),
  boss('tide_sovereign', '조수의 군주', '조수의 군주', 'water_spirit', 'abyssal', ['tidal_wave', 'frost_bolt', 'abyssal_tide'], ['spirit', 'elemental'], lk('trident', 'robe', 'crown', ['#0a2a4a', '#bff4ff']),
    [{ at: 0.5, text: '조수의 군주가 밀물을 부른다!', heal: 0.15, selfStatus: [{ id: 'regen', turns: 4 }], addSkills: ['frost_nova'] }]),

  // ===== 야수 약탈단 (beasts) =====
  reg('wolf_raider', '늑대 약탈자', 'wolfkin', 'warrior', ['cleave'], ['beast'], lk('axe', 'fur', 'none', ['#5a4a3a', '#8a2a2a'])),
  reg('bear_mauler', '곰 난폭자', 'bearkin', 'berserker', ['blood_frenzy'], ['beast', 'large'], lk('fist', 'fur', 'none', ['#4a3a2a', '#c9a36b']), { mul: { hp: 1.0, atk: 0.9 } }),
  reg('cat_stalker', '묘인 추적자', 'catkin', 'assassin', ['backstab'], ['beast'], lk('katar', 'leather', 'hood', ['#2a2a30', '#9adf5a']), { mul: { hp: 0.7, atk: 0.9, spd: 1.1 } }),
  reg('hawk_scout', '매 정찰병', 'birdfolk', 'archer', ['power_shot'], ['beast', 'winged'], lk('bow', 'tunic', 'feather', ['#5a4a2a', '#e8cf8a'])),
  reg('boar_shaman', '멧돼지 주술사', 'beastkin', 'shaman', ['spirit_bolt', 'totem_ward'], ['beast'], lk('totem', 'tribal', 'skullcap', ['#5a3a1a', '#e07a2e'])),
  elite('minotaur_charger', '돌격 미노타우로스', 'minotaur', 'berserker', ['whirlwind', 'stampede'], ['beast', 'large', 'brute'], lk('greataxe', 'tribal', 'none', ['#4a2a1a', '#c9a36b']), rage('미노타우로스가 콧김을 내뿜으며 앞발을 구른다!'), { scale: 1.35, mul: { hp: 1.5, atk: 1.1 } }),
  elite('pack_alpha', '무리의 우두머리', 'wolfkin', 'beastmaster', ['whip_crack', 'call_beast', 'pack_howl'], ['beast'], lk('whip', 'fur', 'feather', ['#3a3a44', '#c8d0e0']), { at: 0.5, text: '"우리를 불러라!" 늑대 울음이 메아리친다.', summon: { def: 'wolf_raider', count: 1 } }),
  boss('beast_king', '야수왕', '야수왕', 'wolfkin', 'berserker', ['whirlwind', 'feral_roar', 'blood_frenzy'], ['beast'], lk('greataxe', 'fur', 'antlers', ['#3a2a1a', '#e2b84a']),
    [{ at: 0.5, text: '야수왕이 달을 향해 울부짖는다. 무리가 답한다!', summon: { def: 'wolf_raider', count: 1 }, selfStatus: [{ id: 'bless', turns: 3 }] }], { mul: { hp: 3.3, atk: 0.95, def: 1.1, res: 1.15, spd: 0.8 } }),
  boss('great_minotaur', '미궁의 주인', '미궁의 주인', 'minotaur', 'warrior', ['cleave', 'crushing_blow', 'stampede'], ['beast', 'large', 'brute'], lk('greataxe', 'plate', 'horned', ['#2a1a1a', '#c9a36b']),
    [rage('"길을 잃은 건 너희다!" 미궁의 주인이 피투성이 뿔을 치켜든다.')], { scale: 1.7, mul: { hp: 4.0, atk: 1.15, def: 1.25, res: 1.1 } }),

  // ===== 지옥문 계약단 (infernal) =====
  reg('imp_trickster', '장난꾸러기 임프', 'imp', 'rogue', ['throw_knife'], ['infernal', 'unholy'], lk('dagger', 'rags', 'none', ['#5a1a1a', '#ffb04a']), { mul: { hp: 0.6, atk: 0.85, spd: 1.15 }, exp: 9, gold: 6, scale: 0.85 }),
  reg('hell_brute', '지옥 야수병', 'demon', 'warrior', ['cleave'], ['infernal', 'unholy'], lk('axe', 'scale', 'horned', ['#3a0a0a', '#ff6a00'])),
  reg('contract_warlock', '계약 흑마법사', 'demon', 'warlock', ['shadow_bolt', 'curse_agony'], ['infernal', 'unholy', 'cult'], lk('staff', 'robe', 'hood', ['#2a0a1a', '#ff6a00'], 'book')),
  reg('hellhound', '지옥견', 'demon', 'berserker', ['grave_claw', 'blood_frenzy'], ['infernal', 'unholy', 'beast', 'fire'], lk('fist', 'fur', 'none', ['#2a0a0a', '#ff6a2a']), { mul: { hp: 0.75, atk: 0.95, spd: 1.15 } }),
  elite('pit_fiend', '구덩이 악마', 'demon', 'knight', ['shield_bash', 'crushing_blow', 'provoke'], ['infernal', 'unholy'], lk('greatsword', 'plate', 'horned', ['#2a0a0a', '#ff4a2a']), rage('구덩이 악마의 몸에서 유황 불길이 치솟는다!'), { scale: 1.35, mul: { hp: 1.55, atk: 1.05, def: 1.25 } }),
  elite('succubus', '서큐버스', 'demon', 'witch', ['hex', 'drain_life', 'sweet_talk'], ['infernal', 'unholy'], lk('wand', 'dress', 'none', ['#5a0a3a', '#ff8ab0']), { at: 0.5, text: '"어머, 벌써 지쳤니?"', heal: 0.15 }),
  boss('arch_devil', '대악마', '대악마', 'demon', 'warlock', ['shadow_bolt', 'dark_nova', 'hellfire_rain'], ['infernal', 'unholy'], lk('staff', 'robe', 'horned', ['#1a0505', '#ff6a00'], 'orb'),
    [{ at: 0.5, text: '지옥문이 활짝 열린다! 임프들이 쏟아져 나온다.', summon: { def: 'imp_trickster', count: 2 }, addSkills: ['call_imps'] }]),
  boss('hell_collector', '지옥의 수금원', '지옥의 수금원', 'demon', 'loanshark', ['collect_debt', 'compound_interest', 'hire_thug'], ['infernal', 'unholy'], lk('mace', 'suit', 'tophat', ['#1a0a0a', '#e2b84a']),
    [{ at: 0.5, text: '"계약서 제7조. 영혼은 이자로 받는다."', selfStatus: [{ id: 'bless', turns: 3 }], addSkills: ['hellfire_rain', 'call_imps'] }]),

  // ===== 녹슨 군단 (rust) =====
  reg('clock_soldier', '태엽 병사', 'automaton', 'knight', ['shield_bash'], ['construct'], lk('sword', 'plate', 'helm', ['#5a4a2a', '#d8b45a'], 'shield'), { mul: { hp: 0.9, atk: 0.85, def: 1.2 } }),
  reg('clock_gunner', '태엽 사수', 'automaton', 'gunner', ['aimed_shot'], ['construct'], lk('musket', 'coat', 'tricorn', ['#4a4a3a', '#d8b45a'])),
  reg('scrap_tinker', '고철 기술자', 'gnome', 'tinker', ['flame_jet', 'gear_shield'], ['civil'], lk('crossbow', 'overalls', 'goggles', ['#5a4a2a', '#4fd1c5'])),
  reg('saw_drone', '톱날 인형', 'automaton', 'berserker', ['whirlwind'], ['construct'], lk('cleaver', 'chain', 'buckethelm', ['#6a6a72', '#c04040']), { mul: { hp: 0.75, atk: 0.95 } }),
  elite('siege_golem', '공성 골렘', 'automaton', 'runesmith', ['crushing_blow', 'rune_ward', 'gear_barrage'], ['construct'], lk('hammer', 'plate', 'greathelm', ['#3a3a44', '#ffb04a']), rage('공성 골렘의 증기 기관이 붉게 달아오른다!'), { scale: 1.4, mul: { hp: 1.6, atk: 1.05, def: 1.35 } }),
  elite('artillery_unit', '포병 기체', 'automaton', 'gunner', ['buckshot', 'aimed_shot', 'reload'], ['construct'], lk('musket', 'coat', 'helm', ['#2a3a5a', '#c0c8d8']), { at: 0.5, text: '포병 기체가 탄약을 재장전한다!', selfStatus: [{ id: 'haste', turns: 3 }] }),
  boss('clockwork_king', '태엽왕', '태엽왕', 'automaton', 'knight', ['crushing_blow', 'gear_shield', 'gear_barrage'], ['construct'], lk('greatsword', 'plate', 'crown', ['#3a2a1a', '#e2b84a'], 'tower'),
    [{ at: 0.5, text: '"정각이다. 전군 기동." 태엽 병사들이 깨어난다.', summon: { def: 'clock_soldier', count: 2 }, addSkills: ['call_clockwork'] }]),
  boss('mad_inventor', '미친 발명가', '미친 발명가', 'gnome', 'tinker', ['flame_jet', 'overclock', 'gear_barrage'], ['civil'], lk('crossbow', 'labcoat', 'goggles', ['#3a3a44', '#4fd1c5']),
    [{ at: 0.5, text: '"내 걸작을 보아라!" 거대한 꼭두각시가 덜컹거리며 일어선다.', summon: { def: 'saw_drone', count: 2 }, selfStatus: [{ id: 'shield', turns: 3, value: 2.5 }] }], { scale: 1.4 }),

  // ===== 포자 교단 (spore) =====
  reg('spore_acolyte', '포자 신도', 'mushfolk', 'cultist', ['doomsday_sermon', 'false_miracle'], ['plant', 'cult'], lk('book', 'robe', 'hood', ['#5a2a4a', '#f0e0c0'])),
  reg('rot_dryad', '썩은 드라이어드', 'dryad', 'druid', ['thorns'], ['plant', 'fey'], lk('staff', 'tribal', 'none', ['#3a2a1a', '#8a8a3a'])),
  reg('mad_plaguedoc', '미친 역병의사', 'human', 'plaguedoc', ['miasma'], ['civil'], lk('syringe', 'coat', 'plaguemask', ['#1a1a1a', '#8a8a3a'])),
  reg('fungal_thrall', '균사 노예', 'mushfolk', 'berserker', ['grave_claw'], ['plant'], lk('fist', 'rags', 'none', ['#4a3a3a', '#a04a6a']), { mul: { hp: 0.7, atk: 0.85 }, exp: 8, gold: 4 }),
  reg('spore_junkie', '포자 중독자', 'mushfolk', 'junkie', ['withdrawal_rage'], ['plant'], lk('smoker', 'rags', 'none', ['#4a3a4a', '#d0a0ff'])),
  elite('fungal_colossus', '균사 거인', 'mushfolk', 'warrior', ['crushing_blow', 'cleave', 'spore_burst'], ['plant', 'large'], lk('greataxe', 'fur', 'none', ['#4a2a3a', '#d04060']), rage('거인의 갓에서 포자 구름이 피어오른다!'), { scale: 1.4, mul: { hp: 1.6, atk: 1.05 } }),
  elite('rot_treant', '썩은 고목', 'dryad', 'knight', ['thorns', 'provoke', 'guardian'], ['plant', 'fey'], lk('hammer', 'bandages', 'none', ['#3a2a1a', '#5a7a3a'], 'shield'), { at: 0.5, text: '고목의 가지에서 썩은 수액이 흐른다.', heal: 0.2 }, { scale: 1.3 }),
  boss('mother_spore', '포자의 어머니', '포자의 어머니', 'mushfolk', 'druid', ['thorns', 'rejuvenate', 'spore_burst'], ['plant', 'cult'], lk('staff', 'robe', 'flowercrown', ['#5a1a3a', '#f0e0c0']),
    [{ at: 0.5, text: '"내 아이들아, 깨어나라." 땅에서 균사 노예들이 기어 나온다.', summon: { def: 'fungal_thrall', count: 2 }, addSkills: ['call_spores'] }]),
  boss('plague_saint', '역병 성자', '역병 성자', 'human', 'plaguedoc', ['miasma', 'bloodletting', 'plague_tide'], ['civil', 'cult'], lk('syringe', 'cassock', 'plaguemask', ['#1a1a1a', '#c9a227']),
    [{ at: 0.5, text: '"치료는 계속된다!" 신도들이 성자를 감싼다.', summon: { def: 'spore_acolyte', count: 2 }, selfStatus: [{ id: 'regen', turns: 4 }] }]),

  // ===== 밤의 궁정 (night) =====
  reg('vampire_thrall', '흡혈귀 하수인', 'vampire', 'swordsman', ['lunge'], ['unholy', 'vampire'], lk('sword', 'coat', 'none', ['#2a0a1a', '#c9a36b'])),
  reg('blood_maiden', '피의 시녀', 'vampire', 'bloodmage', ['blood_lance'], ['unholy', 'vampire'], lk('wand', 'dress', 'none', ['#3a0a1a', '#ff8ab0'])),
  reg('shade_stalker', '그림자 추적자', 'shade', 'assassin', ['backstab'], ['shadow', 'spirit'], lk('katar', 'leather', 'hood', ['#1a1a2a', '#8a6aff']), { mul: { hp: 0.7, atk: 0.92, spd: 1.1 } }),
  reg('revenant_guard', '망자 근위병', 'revenant', 'knight', ['shield_bash'], ['undead', 'unholy'], lk('sword', 'plate', 'helm', ['#2a2a3a', '#8a1a3a'], 'shield'), { mul: { hp: 1.0, atk: 0.85, def: 1.2 } }),
  reg('bat_swarm', '박쥐 떼', 'imp', 'rogue', ['grave_claw'], ['beast', 'unholy'], lk('fist', 'rags', 'none', ['#2a1a2a', '#8a1a3a']), { mul: { hp: 0.45, atk: 0.75, spd: 1.25 }, exp: 6, gold: 3, scale: 0.75 }),
  elite('vampire_knight', '흡혈 기사', 'vampire', 'knight', ['crushing_blow', 'blood_frenzy', 'provoke'], ['unholy', 'vampire'], lk('greatsword', 'plate', 'greathelm', ['#1a0a0a', '#c02a3a']), rage('흡혈 기사의 투구 틈으로 붉은 안개가 새어 나온다!'), { scale: 1.3 }),
  elite('night_countess', '밤의 백작부인', 'vampire', 'witch', ['hex', 'drain_life', 'hemorrhage'], ['unholy', 'vampire'], lk('wand', 'dress', 'tiara', ['#3a0a2a', '#e8c0d0']), { at: 0.5, text: '백작부인이 박쥐 떼로 흩어졌다 다시 모인다.', summon: { def: 'bat_swarm', count: 2 }, heal: 0.15 }),
  boss('night_queen', '밤의 여왕', '밤의 여왕', 'vampire', 'bloodmage', ['blood_lance', 'hemorrhage', 'crimson_eclipse'], ['unholy', 'vampire'], lk('wand', 'dress', 'crown', ['#1a0510', '#ff3a5a']),
    [{ at: 0.5, text: '"무릎 꿇어라. 밤은 영원하다." 하수인들이 어둠에서 걸어 나온다.', summon: { def: 'vampire_thrall', count: 2 }, addSkills: ['call_bats'] }]),
  boss('old_count', '늙은 백작', '늙은 백작', 'vampire', 'swordsman', ['lunge', 'blood_frenzy', 'crimson_eclipse'], ['unholy', 'vampire'], lk('greatsword', 'suit', 'none', ['#1a0a0a', '#e8e8f0']),
    [{ at: 0.5, text: '늙은 백작이 망토를 펼치자 박쥐 떼가 쏟아진다.', summon: { def: 'bat_swarm', count: 2 } }], { mul: { hp: 3.5, atk: 0.95, def: 1.15, res: 1.2, spd: 0.8 } }),

  // ===== 용의 둥지 (dragon) =====
  reg('kobold_spearman', '코볼트 창병', 'kobold', 'lancer', ['spear_thrust'], ['reptile'], lk('spear', 'leather', 'none', ['#7a3a1a', '#e2b84a']), { mul: { hp: 0.7, atk: 0.85 }, exp: 10, gold: 8 }),
  reg('kobold_slinger', '코볼트 투척병', 'kobold', 'scavenger', ['junk_toss'], ['reptile'], lk('bottle', 'rags', 'buckethelm', ['#6a4a2a', '#c0c040']), { mul: { hp: 0.65, atk: 0.85 }, exp: 10, gold: 8 }),
  reg('lizard_hunter', '리자드맨 사냥꾼', 'lizardfolk', 'hunter', ['snare_trap'], ['reptile'], lk('crossbow', 'leather', 'none', ['#3a5a2a', '#e8c84a'])),
  reg('drake_cultist', '용 숭배자', 'lizardfolk', 'shaman', ['hex', 'spirit_bolt'], ['reptile', 'cult'], lk('totem', 'tribal', 'skullcap', ['#5a1a1a', '#e8c84a'])),
  reg('young_drakeling', '어린 용인', 'dragonkin', 'berserker', ['blood_frenzy'], ['reptile', 'draconic'], lk('axe', 'scale', 'none', ['#5a1a0a', '#ffb04a']), { mul: { hp: 0.9, atk: 0.92 } }),
  elite('drake_rider', '용기병', 'dragonkin', 'lancer', ['spear_thrust', 'sweep', 'brace'], ['reptile', 'draconic'], lk('spear', 'plate', 'helm', ['#3a1a1a', '#ffb04a'], 'shield'), rage('용기병의 창끝에서 불꽃이 인다!'), { scale: 1.3 }),
  elite('dragon_priest', '용의 사제', 'dragonkin', 'elementalist', ['fireball', 'meteor'], ['reptile', 'draconic', 'cult'], lk('staff', 'vestment', 'mitre', ['#5a0a0a', '#e2b84a']), { at: 0.5, text: '"위대한 용이시여!" 사제가 불꽃을 두른다.', selfStatus: [{ id: 'shield', turns: 3, value: 2.5 }] }),
  boss('elder_drake', '고룡', '고룡', 'dragonkin', 'berserker', ['whirlwind', 'crushing_blow', 'dragon_breath'], ['reptile', 'draconic'], lk('greataxe', 'scale', 'crown', ['#3a0a0a', '#ffd84a']),
    [rage('고룡이 날개를 펴자 둥지 전체가 흔들린다!'), { at: 0.25, text: '고룡의 비늘 틈이 붉게 달아오른다.', addSkills: ['solar_flare'] }], { scale: 1.75, mul: { hp: 4.1, atk: 1.1, mag: 1.1, def: 1.3, res: 1.2 } }),
  boss('kobold_king', '코볼트 왕', '코볼트 왕', 'kobold', 'scavenger', ['junk_toss', 'scrap_armor'], ['reptile'], lk('shovel', 'fur', 'crown', ['#7a3a1a', '#e2b84a']),
    [{ at: 0.5, text: '"내 보물에 손대지 마!" 코볼트들이 굴에서 쏟아진다.', summon: { def: 'kobold_spearman', count: 2 }, addSkills: ['call_kobolds'] }], { scale: 1.3, mul: { hp: 3.3, atk: 0.95, def: 1.2, res: 1.1, spd: 0.8 } }),

  // ===== 광신 성기사단 (zealots) =====
  reg('zealot_knight', '광신 기사', 'human', 'paladin', ['holy_strike'], ['civil', 'holy_order'], lk('mace', 'plate', 'helm', ['#e8e8f0', '#d4a017'], 'shield'), { mul: { hp: 0.95, atk: 0.88, def: 1.1 } }),
  reg('inquisitor', '이단 심문관', 'human', 'torturer', ['confession', 'thumbscrew'], ['civil', 'holy_order'], lk('whip', 'cassock', 'hood', ['#2a2a2a', '#d4a017'])),
  reg('flagellant', '고행자', 'human', 'berserker', ['blood_frenzy'], ['civil', 'holy_order'], lk('whip', 'bandages', 'none', ['#e8e0d0', '#8a1a1a'])),
  reg('zealot_priest', '광신 신관', 'human', 'priest', ['smite', 'heal'], ['civil', 'holy_order'], lk('staff', 'vestment', 'mitre', ['#f2f2f2', '#d4a017'], 'book')),
  reg('exorcist_hunter', '퇴마 사냥꾼', 'human', 'exorcist', ['banish'], ['civil', 'holy_order'], lk('book', 'coat', 'tricorn', ['#2a2a3a', '#ffe680'], 'lantern')),
  elite('grand_inquisitor', '대심문관 보좌', 'human', 'exorcist', ['sacred_seal', 'purge', 'banish'], ['civil', 'holy_order'], lk('mace', 'vestment', 'mitre', ['#1a1a1a', '#ffd84a'], 'lantern'), { at: 0.5, text: '"이단을 불태워라!"', selfStatus: [{ id: 'bless', turns: 3 }] }),
  elite('templar_champion', '성전 투사', 'human', 'knight', ['shield_bash', 'guardian', 'holy_strike'], ['civil', 'holy_order'], lk('sword', 'plate', 'greathelm', ['#e8e8f0', '#b02e2e'], 'tower'), rage('성전 투사가 방패를 두드리며 기도문을 외친다!'), { scale: 1.25 }),
  boss('fallen_seraph', '타락한 세라프', '타락한 세라프', 'angel', 'paladin', ['smite', 'mass_heal', 'judgment'], ['holy', 'winged', 'holy_order'], lk('greatsword', 'plate', 'circlet', ['#e8e0c0', '#ffd84a'], 'shield'),
    [{ at: 0.5, text: '세라프의 날개가 검게 물든다. "모두 정화하리라."', selfStatus: [{ id: 'bless', turns: 4 }, { id: 'shield', turns: 3, value: 3 }], addSkills: ['purge'] }]),
  boss('high_inquisitor', '대심문관', '대심문관', 'human', 'torturer', ['confession', 'salt_wound', 'judgment'], ['civil', 'holy_order'], lk('whip', 'cassock', 'mitre', ['#1a1a1a', '#d4a017']),
    [{ at: 0.5, text: '"고백할 시간이다." 광신 기사들이 문을 걸어 잠근다.', summon: { def: 'zealot_knight', count: 2 }, addSkills: ['call_zealots'] }]),

  // ===== 공포의 유랑 서커스 (circus) =====
  reg('mad_clown', '미친 광대', 'human', 'jester', ['joke_of_doom'], ['civil', 'circus'], lk('dagger', 'motley', 'jester', ['#c0392b', '#f1c40f'], 'bell')),
  reg('knife_thrower', '칼 던지는 묘인', 'catkin', 'bladedancer', ['ring_toss'], ['beast', 'circus'], lk('chakram', 'sash', 'headband', ['#7a1a3a', '#f1c40f'])),
  reg('strongman', '괴력의 사나이', 'halfogre', 'warrior', ['cleave'], ['brute', 'circus'], lk('hammer', 'sash', 'none', ['#b5446e', '#f6e3c5']), { mul: { hp: 1.05, atk: 0.92 } }),
  reg('puppet_aide', '인형 조수', 'human', 'puppeteer', ['string_pull'], ['civil', 'circus'], lk('puppet', 'suit', 'beret', ['#6a2c70', '#f08a5d'])),
  reg('fire_eater', '불 먹는 광대', 'human', 'pyromaniac', ['drunken_breath'], ['civil', 'circus'], lk('flask', 'motley', 'none', ['#c0392b', '#ff9a3a'], 'torch')),
  elite('acrobat_killer', '곡예사 살인마', 'catkin', 'assassin', ['backstab', 'assassinate', 'smoke_bomb'], ['beast', 'circus'], lk('katar', 'motley', 'jester', ['#2a1a3a', '#ff6a8a']), { at: 0.5, text: '곡예사가 공중제비를 돌며 사라진다!', selfStatus: [{ id: 'haste', turns: 3 }] }),
  elite('giant_puppet', '거대 꼭두각시', 'automaton', 'knight', ['provoke', 'crushing_blow', 'shield_bash'], ['construct', 'circus'], lk('mace', 'motley', 'jester', ['#b5446e', '#f1c40f'], 'buckler'), rage('끊어진 줄이 다시 이어진다. 꼭두각시가 미친 듯이 춤춘다!'), { scale: 1.45, mul: { hp: 1.6, atk: 1.0, def: 1.3 } }),
  boss('ringmaster', '단장', '단장', 'human', 'puppeteer', ['puppet_dance', 'make_puppet', 'grand_finale'], ['civil', 'circus'], lk('puppet', 'suit', 'tophat', ['#7a0a1a', '#e2b84a']),
    [{ at: 0.5, text: '"신사 숙녀 여러분! 2막을 시작합니다!"', summon: { def: 'mad_clown', count: 2 } }]),
  boss('laughing_jester', '웃는 광대', '웃는 광대', 'human', 'jester', ['wild_card', 'juggle_knives', 'grand_finale'], ['civil', 'circus'], lk('dagger', 'motley', 'jester', ['#2a0a2a', '#f1c40f'], 'bell'),
    [{ at: 0.5, text: '하하하하하하! 웃음소리가 천막을 가득 채운다.', summon: { def: 'mad_clown', count: 2 } }]),

  // ===== 도적 연합 (bandits) =====
  reg('cutthroat', '칼잡이', 'human', 'rogue', ['poison_blade'], ['bandit'], lk('dagger', 'leather', 'bandana', ['#3a2a1a', '#8a2a2a'], 'dagger'), { mul: { hp: 0.72, atk: 0.82 } }),
  reg('bandit_archer', '도적 궁수', 'halfling', 'archer', ['crippling_shot'], ['bandit'], lk('bow', 'tunic', 'hood', ['#3a4a2a', '#c9a36b']), { mul: { hp: 0.72, atk: 0.82 } }),
  reg('debt_thug', '빚쟁이 해결사', 'halfogre', 'warrior', ['cleave'], ['bandit', 'brute'], lk('mace', 'leather', 'none', ['#2a2a30', '#8a2a2a']), { mul: { hp: 0.85, atk: 0.85 } }),
  reg('deserter_gunner', '탈영병 사수', 'human', 'gunner', ['aimed_shot'], ['bandit'], lk('musket', 'coat', 'tricorn', ['#3a3a4a', '#8a2a2a']), { mul: { hp: 0.72, atk: 0.8 } }),
  elite('bandit_captain', '도적 두목', 'human', 'swordsman', ['flurry', 'war_cry', 'lunge'], ['bandit'], lk('greatsword', 'coat', 'tricorn', ['#2a1a1a', '#e2b84a']), { at: 0.5, text: '"얘들아! 하나도 남기지 마!"', summon: { def: 'cutthroat', count: 1 } }),
  elite('headsman', '망나니', 'human', 'executioner', ['headsman_swing', 'execute', 'last_words'], ['bandit'], lk('greataxe', 'leather', 'hood', ['#1a1a1a', '#8a1a1a']), rage('망나니가 도끼날을 혀로 핥는다.'), { scale: 1.2 }),
  boss('bandit_king', '도적왕', '도적왕', 'human', 'rogue', ['backstab', 'smoke_bomb', 'throw_knife'], ['bandit'], lk('dagger', 'coat', 'crown', ['#1a1a1a', '#e2b84a'], 'dagger'),
    [{ at: 0.5, text: '"나를 잡았다고 생각했나?" 그림자에서 칼잡이들이 튀어나온다.', summon: { def: 'cutthroat', count: 1 }, addSkills: ['ambush_order'] }], { mul: { hp: 3.4, atk: 0.85, def: 1.1, res: 1.15, spd: 0.8 } }),
  boss('loan_baron', '고리대금 남작', '고리대금 남작', 'goblin', 'loanshark', ['collect_debt', 'compound_interest', 'hire_thug'], ['bandit'], lk('mace', 'suit', 'tophat', ['#1a2a1a', '#e2b84a']),
    [{ at: 0.5, text: '"이자는 오늘부로 두 배다!"', summon: { def: 'thug', count: 2 } }], { scale: 1.4, mul: { hp: 3.4, atk: 0.95, mag: 0.95, def: 1.1, res: 1.15 } }),

  // ===== 균열의 군세 (rift) =====
  reg('void_spawn', '공허 새끼', 'voidspawn', 'berserker', ['grave_claw'], ['rift', 'void', 'unholy'], lk('fist', 'rags', 'none', ['#1a0a2a', '#8a4aff']), { mul: { hp: 0.7, atk: 0.9 }, exp: 10, gold: 6 }),
  reg('void_eye', '공허의 눈', 'voidspawn', 'mage', ['abyss_gaze', 'shadow_bolt'], ['rift', 'void', 'unholy'], lk('fist', 'robe', 'none', ['#1a0a2a', '#c8a8ff'])),
  reg('rift_shade', '균열 그림자', 'shade', 'warlock', ['shadow_bolt'], ['rift', 'shadow'], lk('wand', 'robe', 'hood', ['#0a0a1a', '#8a4aff'])),
  elite('rift_horror', '균열의 공포', 'voidspawn', 'berserker', ['whirlwind', 'string_pull', 'devour'], ['rift', 'void', 'unholy'], lk('fist', 'rags', 'none', ['#0a0518', '#8a4aff']), rage('균열의 공포가 공간을 찢으며 몸을 부풀린다!'), { scale: 1.4, mul: { hp: 1.55, atk: 1.1 } }),
  elite('shard_golem', '핵 파편 골렘', 'earth_spirit', 'knight', ['crushing_blow', 'provoke', 'rune_ward'], ['rift', 'stone'], lk('hammer', 'plate', 'none', ['#1a2a3a', '#7fe3ff'], 'shield'), { at: 0.5, text: '골렘 속 세계핵 파편이 불안정하게 깜빡인다.', selfStatus: [{ id: 'shield', turns: 3, value: 3 }] }, { scale: 1.35 }),
  boss('rift_maw', '균열의 아가리', '균열의 아가리', 'voidspawn', 'abyssal', ['abyss_gaze', 'devour', 'void_collapse'], ['rift', 'void', 'unholy'], lk('fist', 'robe', 'none', ['#05030a', '#8a4aff']),
    [{ at: 0.5, text: '아가리가 더 크게 벌어진다. 무언가가 기어 나온다.', summon: { def: 'void_spawn', count: 3 }, addSkills: ['call_void'] }], { scale: 1.7 }),
  boss('fallen_commander', '타락한 지휘관', '타락한 지휘관', 'corebearer', 'commander', ['core_strike', 'rally', 'void_collapse'], ['rift'], lk('greatsword', 'coat', 'none', ['#1a0a2a', '#8a4aff']),
    [{ at: 0.5, text: '"나도 한때는… 세계를 다시 세우려 했다." 균열이 그를 감싼다.', summon: { def: 'void_spawn', count: 2 }, selfStatus: [{ id: 'bless', turns: 4 }], addSkills: ['soul_harvest'] }], { scale: 1.4 }),

  // ===== 서리 부족 (frost) =====
  reg('yeti_brute', '예티 야수병', 'yeti', 'berserker', ['blood_frenzy'], ['beast', 'large'], lk('fist', 'fur', 'none', ['#c8d0dc', '#3a6fd8']), { mul: { hp: 1.0, atk: 0.92 } }),
  reg('frost_witch', '서리 마녀', 'human', 'witch', ['frost_bolt', 'hex'], ['civil'], lk('wand', 'dress', 'witch', ['#1a3a5a', '#bff4ff'])),
  reg('ice_wolf', '서리 늑대', 'wolfkin', 'berserker', ['grave_claw'], ['beast'], lk('fist', 'fur', 'none', ['#c8d0e0', '#7fe3ff']), { mul: { hp: 0.65, atk: 0.85, spd: 1.15 }, exp: 9, gold: 5 }),
  reg('snow_hunter', '설원 사냥꾼', 'yeti', 'hunter', ['snare_trap', 'power_shot'], ['beast'], lk('bow', 'fur', 'hood', ['#e0e8f0', '#5a3825'])),
  reg('frost_shaman', '서리 주술사', 'yeti', 'shaman', ['hex', 'totem_ward'], ['beast'], lk('totem', 'fur', 'antlers', ['#c8d0dc', '#3a6fd8'])),
  elite('frost_giant', '서리 거인', 'yeti', 'warrior', ['crushing_blow', 'cleave', 'frost_nova'], ['beast', 'large'], lk('greataxe', 'fur', 'horned', ['#a8c0d8', '#1a3a5a']), rage('서리 거인의 숨결에 공기가 얼어붙는다!'), { scale: 1.45, mul: { hp: 1.65, atk: 1.05 } }),
  elite('ice_wraith', '얼음 망령', 'ghost', 'mage', ['frost_bolt', 'frost_nova'], ['undead', 'spirit', 'unholy'], lk('fist', 'robe', 'hood', ['#3a5a7a', '#bff4ff']), { at: 0.5, text: '망령이 눈보라 속으로 흩어졌다 다시 모인다.', heal: 0.2 }),
  boss('winter_matron', '겨울 노파', '겨울 노파', 'human', 'witch', ['frost_bolt', 'hex', 'blizzard'], ['civil'], lk('staff', 'cloak', 'witch', ['#1a2a4a', '#e8f8ff']),
    [{ at: 0.5, text: '"추위가 너희를 재워 줄 거란다."', summon: { def: 'ice_wolf', count: 1 }, addSkills: ['frost_nova'] }], { mul: { hp: 3.4, mag: 0.9, def: 1.1, res: 1.2 } }),
  boss('yeti_chieftain', '예티 족장', '예티 족장', 'yeti', 'berserker', ['rage', 'crushing_blow', 'war_cry'], ['beast', 'large'], lk('greataxe', 'fur', 'crown', ['#e0e8f0', '#3a6fd8']),
    [rage('족장이 가슴을 두드리며 포효한다! 눈사태가 일어난다.'), { at: 0.3, text: '족장이 얼음을 깨물어 상처를 얼린다.', heal: 0.15, addSkills: ['blizzard'] }], { scale: 1.7, mul: { hp: 4.0, atk: 1.15, def: 1.2, res: 1.15 } }),

  // ===== 사막 망령 (desert) =====
  reg('sand_mummy', '모래 미라', 'revenant', 'warrior', ['grave_claw'], ['undead', 'unholy'], lk('fist', 'bandages', 'none', ['#e8dcc0', '#c9a227']), { mul: { hp: 0.85, atk: 0.85 } }),
  reg('scorpion_kin', '전갈족', 'insectkin', 'assassin', ['poison_blade', 'backstab'], ['beast', 'insect'], lk('katar', 'leather', 'none', ['#7a5a2a', '#2a1a1a'])),
  reg('sand_witch', '모래 마녀', 'human', 'witch', ['hex', 'curse_agony'], ['civil'], lk('staff', 'wrap', 'turban', ['#c2a878', '#7a4a2a'])),
  reg('dune_raider', '모래 약탈자', 'lizardfolk', 'wanderer', ['quick_slash'], ['reptile', 'bandit'], lk('sword', 'wrap', 'turban', ['#c2a878', '#8a2a2a'])),
  reg('tomb_cultist', '무덤 신도', 'human', 'cultist', ['doomsday_sermon'], ['civil', 'cult'], lk('book', 'robe', 'hood', ['#5a4a2a', '#c9a227'], 'skull')),
  elite('tomb_guardian', '무덤 수호상', 'gargoyle', 'knight', ['shield_bash', 'guardian', 'crushing_blow'], ['construct', 'stone'], lk('spear', 'plate', 'none', ['#8a7a5a', '#c9a227'], 'tower'), { at: 0.5, text: '수호상의 눈에서 붉은 빛이 번뜩인다.', selfStatus: [{ id: 'guard', turns: 3 }, { id: 'bless', turns: 3 }] }, { scale: 1.35 }),
  elite('cursed_priest', '저주받은 사제', 'revenant', 'necromancer', ['bone_spear', 'curse_agony', 'raise_dead'], ['undead', 'unholy'], lk('staff', 'bandages', 'mitre', ['#e8dcc0', '#c9a227']), { at: 0.5, text: '"파라오를 위하여!"', summon: { def: 'sand_mummy', count: 2 } }),
  boss('sand_pharaoh', '모래의 파라오', '모래의 파라오', 'revenant', 'necromancer', ['bone_spear', 'curse_agony', 'sandstorm'], ['undead', 'unholy'], lk('staff', 'bandages', 'crown', ['#e8dcc0', '#ffd84a']),
    [{ at: 0.5, text: '파라오가 지팡이를 들자 모래 속에서 미라들이 일어선다!', summon: { def: 'sand_mummy', count: 3 }, addSkills: ['call_mummies'] }]),
  boss('great_scorpion', '거대 전갈', '거대 전갈', 'insectkin', 'assassin', ['assassinate', 'poison_blade', 'crushing_blow'], ['beast', 'insect'], lk('katar', 'scale', 'none', ['#5a3a1a', '#1a1010']),
    [rage('거대 전갈이 독침을 높이 치켜든다!'), { at: 0.3, text: '전갈의 껍질이 갈라지며 독액이 흐른다.', addSkills: ['plague_tide'] }], { scale: 1.65 }),
];
