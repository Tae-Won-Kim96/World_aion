import type { HeadgearKind, OffhandKind, OutfitKind, RaceId, Stats, StatusApply, WeaponKind } from '../types';

/** 체력이 at 비율 이하로 떨어지면 1회 발동 */
export interface PhaseDef {
  at: number;
  text: string;
  summon?: { def: string; count: number };
  selfStatus?: StatusApply[];
  addSkills?: string[];
  heal?: number;
}

export interface EnemyDef {
  id: string;
  name: string;
  race: RaceId;
  cls: string;
  mul: Partial<Stats>;
  skills: string[];
  tags: string[];
  look: {
    head?: HeadgearKind;
    outfit?: OutfitKind;
    weapon?: WeaponKind;
    offhand?: OffhandKind;
    palette?: [string, string];
    skin?: [string, string, string];
  };
  exp: number;
  gold: number;
  elite?: boolean;
  boss?: boolean;
  scale?: number;
  phases?: PhaseDef[];
}

const E = (e: EnemyDef) => e;

export const ENEMIES: Record<string, EnemyDef> = Object.fromEntries(
  [
    // ===== 잿빛 묘역 =====
    E({ id: 'skel_warrior', name: '해골 병사', race: 'skeleton', cls: 'warrior', mul: { hp: 0.75, atk: 0.85 }, skills: ['shield_bash'], tags: ['undead', 'unholy'],
      look: { weapon: 'sword', offhand: 'shield', outfit: 'bone', head: 'none', palette: ['#6b4a2f', '#8a2a2a'] }, exp: 12, gold: 7 }),
    E({ id: 'skel_archer', name: '해골 궁수', race: 'skeleton', cls: 'archer', mul: { hp: 0.7, atk: 0.85 }, skills: ['crippling_shot'], tags: ['undead', 'unholy'],
      look: { weapon: 'bow', outfit: 'bone', head: 'hood', palette: ['#4a4e57', '#6b4a2f'] }, exp: 12, gold: 7 }),
    E({ id: 'ghoul', name: '구울', race: 'ghoul', cls: 'berserker', mul: { hp: 0.8, atk: 0.8, spd: 1.05 }, skills: ['grave_claw'], tags: ['undead', 'unholy'],
      look: { weapon: 'fist', outfit: 'rags', head: 'none', palette: ['#5a5446', '#3a362c'] }, exp: 13, gold: 5 }),
    E({ id: 'cultist', name: '광신도', race: 'human', cls: 'warlock', mul: { hp: 0.75, mag: 0.85 }, skills: ['shadow_bolt'], tags: ['cult', 'rift'],
      look: { weapon: 'wand', outfit: 'robe', head: 'hood', palette: ['#4a0f1a', '#c9a36b'] }, exp: 14, gold: 12 }),
    E({ id: 'wraith', name: '망령', race: 'wraith', cls: 'mage', mul: { hp: 0.7, mag: 0.85, res: 1.3 }, skills: ['curse_agony'], tags: ['undead', 'unholy', 'rift'],
      look: { weapon: 'fist', outfit: 'robe', head: 'hood', palette: ['#26284a', '#7fe3ff'] }, exp: 14, gold: 6 }),
    E({ id: 'grave_robber', name: '도굴꾼', race: 'human', cls: 'rogue', mul: { hp: 0.75, atk: 0.85 }, skills: ['poison_blade'], tags: ['bandit'],
      look: { weapon: 'dagger', offhand: 'lantern', outfit: 'leather', head: 'bandana', palette: ['#5a4a3a', '#8a2a2a'] }, exp: 12, gold: 16 }),
    E({ id: 'bone_knight', name: '해골 기사', race: 'skeleton', cls: 'knight', mul: { hp: 1.25, atk: 1.0, def: 1.2 }, skills: ['crushing_blow', 'bone_rattle'], tags: ['undead', 'unholy'],
      look: { weapon: 'greatsword', offhand: 'none', outfit: 'plate', head: 'greathelm', palette: ['#3a3d48', '#7a1a1a'] }, exp: 30, gold: 25, elite: true, scale: 1.1,
      phases: [{ at: 0.5, text: '해골 기사의 투구 속에서 붉은 불길이 타오른다!', selfStatus: [{ id: 'bless', turns: 4 }, { id: 'guard', turns: 2 }] }] }),
    E({ id: 'cult_priest', name: '광신 사제', race: 'human', cls: 'priest', mul: { hp: 1.1, mag: 1.0 }, skills: ['heal', 'shadow_bolt', 'call_faithful'], tags: ['cult', 'rift'],
      look: { weapon: 'staff', offhand: 'book', outfit: 'vestment', head: 'mitre', palette: ['#3a0a14', '#d4a017'] }, exp: 30, gold: 35, elite: true,
      phases: [{ at: 0.5, text: '"신도들이여, 나를 지켜라!"', summon: { def: 'cultist', count: 1 } }] }),
    E({ id: 'bishop', name: '타락한 주교 모르데인', race: 'skeleton', cls: 'necromancer', mul: { hp: 3.6, mag: 1.1, def: 1.25, res: 1.35 }, skills: ['bone_spear', 'dark_nova', 'drain_life', 'unholy_requiem'], tags: ['undead', 'unholy', 'boss', 'rift'],
      phases: [{ at: 0.5, text: '주교가 지팡이를 들어 올리자 무덤들이 열린다!', summon: { def: 'skel_warrior', count: 2 }, selfStatus: [{ id: 'haste', turns: 3 }], addSkills: ['raise_dead'] }],
      look: { weapon: 'staff', offhand: 'none', outfit: 'vestment', head: 'mitre', palette: ['#2a1a3a', '#c9a227'] }, exp: 90, gold: 120, boss: true, scale: 1.5 }),

    // ===== 가라앉은 사원 =====
    E({ id: 'deep_spawn', name: '심해 척후', race: 'deepone', cls: 'lancer', mul: { hp: 0.85, atk: 0.9 }, skills: ['spear_thrust'], tags: ['abyssal'],
      look: { weapon: 'trident', outfit: 'rags', head: 'none', palette: ['#16505c', '#5ec4b6'] }, exp: 16, gold: 9 }),
    E({ id: 'drowned', name: '익사체', race: 'ghoul', cls: 'berserker', mul: { hp: 0.9, atk: 0.85 }, skills: ['grave_claw'], tags: ['undead', 'unholy'],
      look: { weapon: 'fist', outfit: 'rags', head: 'none', palette: ['#2a4a5a', '#1a2a3a'], skin: ['#7a9aa6', '#56707c', '#9ab9c4'] }, exp: 15, gold: 6 }),
    E({ id: 'goblin_raider', name: '고블린 약탈자', race: 'goblin', cls: 'rogue', mul: { hp: 0.7, atk: 0.85, spd: 1.1 }, skills: ['throw_knife'], tags: ['beast'],
      look: { weapon: 'dagger', outfit: 'leather', head: 'bandana', palette: ['#6b4a2f', '#b02e2e'] }, exp: 14, gold: 14 }),
    E({ id: 'goblin_shaman', name: '고블린 주술사', race: 'goblin', cls: 'shaman', mul: { hp: 0.75, mag: 0.9 }, skills: ['hex', 'spirit_bolt'], tags: ['beast'],
      look: { weapon: 'totem', outfit: 'tribal', head: 'skullcap', palette: ['#7a5a2a', '#e07a2e'] }, exp: 16, gold: 12 }),
    E({ id: 'abyss_chanter', name: '심연 성가대원', race: 'deepone', cls: 'abyssal', mul: { hp: 0.8, mag: 0.9 }, skills: ['tidal_wave'], tags: ['abyssal', 'cult', 'rift'],
      look: { weapon: 'staff', outfit: 'robe', head: 'veil', palette: ['#0f3a48', '#2ec4b6'] }, exp: 16, gold: 12 }),
    E({ id: 'deep_brute', name: '심해 거한', race: 'deepone', cls: 'berserker', mul: { hp: 1.5, atk: 1.1 }, skills: ['whirlwind', 'crushing_blow'], tags: ['abyssal'],
      look: { weapon: 'greataxe', outfit: 'tribal', head: 'none', palette: ['#16505c', '#c9a36b'] }, exp: 34, gold: 30, elite: true, scale: 1.25,
      phases: [{ at: 0.5, text: '심해 거한이 포효하며 비늘을 곤두세운다!', selfStatus: [{ id: 'bless', turns: 3 }, { id: 'haste', turns: 2 }] }] }),
    E({ id: 'high_priest', name: '심해 대사제 크툴락', race: 'deepone', cls: 'abyssal', mul: { hp: 3.8, mag: 1.1, res: 1.4, def: 1.2 }, skills: ['tidal_wave', 'abyss_gaze', 'drain_life', 'abyssal_tide'], tags: ['abyssal', 'boss', 'rift'],
      phases: [{ at: 0.5, text: '크툴락이 심해의 이름을 부르짖는다!', summon: { def: 'deep_spawn', count: 2 }, selfStatus: [{ id: 'regen', turns: 4 }], addSkills: ['call_deep'] }],
      look: { weapon: 'trident', outfit: 'robe', head: 'crown', palette: ['#0a2a3a', '#ffd84a'] }, exp: 110, gold: 150, boss: true, scale: 1.6 }),

    // ===== 떠돌이 위협 (여러 던전) =====
    E({ id: 'rat_pack', name: '하수도 쥐떼', race: 'ratkin', cls: 'rogue', mul: { hp: 0.45, atk: 0.75, spd: 1.2 }, skills: ['grave_claw'], tags: ['beast', 'vermin'],
      look: { weapon: 'fist', outfit: 'rags', head: 'none', palette: ['#4a4038', '#6a5a4a'] }, exp: 8, gold: 3, scale: 0.85 }),
    E({ id: 'feral_junkie', name: '약에 취한 약탈자', race: 'human', cls: 'junkie', mul: { hp: 0.8, atk: 0.9 }, skills: ['withdrawal_rage', 'overdose'], tags: ['bandit'],
      look: { weapon: 'syringe', outfit: 'rags', head: 'bandana', palette: ['#5a5446', '#8a3a6a'] }, exp: 14, gold: 14 }),
    E({ id: 'stitched_brute', name: '꿰맨 거한', race: 'revenant', cls: 'butcher', mul: { hp: 1.4, atk: 1.05, def: 1.1 }, skills: ['hack', 'meat_hook', 'snack_break'], tags: ['undead', 'unholy'],
      look: { weapon: 'cleaver', outfit: 'apron', head: 'none', palette: ['#e8e0d0', '#7a1a1a'] }, exp: 32, gold: 28, elite: true, scale: 1.2,
      phases: [{ at: 0.4, text: '꿰맨 실밥이 터지며 거한이 날뛴다!', selfStatus: [{ id: 'bless', turns: 3 }] }] }),

    // ===== 아군 소환수 (경험치·금화 없음) =====
    E({ id: 'thug', name: '고용된 해결사', race: 'halfogre', cls: 'warrior', mul: { hp: 0.6, atk: 0.8 }, skills: ['cleave'], tags: ['summon'],
      look: { weapon: 'mace', outfit: 'leather', head: 'bandana', palette: ['#3a3a44', '#8a2a2a'] }, exp: 0, gold: 0 }),
    E({ id: 'skel_worker', name: '해골 일꾼', race: 'skeleton', cls: 'gravedigger', mul: { hp: 0.6, atk: 0.8 }, skills: ['shovel_smack'], tags: ['undead', 'summon'],
      look: { weapon: 'shovel', outfit: 'bone', head: 'straw', palette: ['#6b4a2f', '#5a5a66'] }, exp: 0, gold: 0 }),
    E({ id: 'puppet_doll', name: '꼭두각시', race: 'automaton', cls: 'knight', mul: { hp: 0.55, atk: 0.6, def: 1.2 }, skills: ['provoke'], tags: ['construct', 'summon'],
      look: { weapon: 'sword', offhand: 'buckler', outfit: 'motley', head: 'jester', palette: ['#b5446e', '#f1c40f'] }, exp: 0, gold: 0, scale: 0.85 }),
    E({ id: 'rat_swarm', name: '쥐떼', race: 'ratkin', cls: 'rogue', mul: { hp: 0.35, atk: 0.6, spd: 1.2 }, skills: ['grave_claw'], tags: ['beast', 'summon'],
      look: { weapon: 'fist', outfit: 'rags', head: 'none', palette: ['#4a4038', '#6a5a4a'] }, exp: 0, gold: 0, scale: 0.8 }),
    E({ id: 'tamed_wolf', name: '길들인 늑대', race: 'wolfkin', cls: 'berserker', mul: { hp: 0.6, atk: 0.85, spd: 1.15 }, skills: ['blood_frenzy'], tags: ['beast', 'summon'],
      look: { weapon: 'fist', outfit: 'fur', head: 'none', palette: ['#6a6a72', '#3a3a44'] }, exp: 0, gold: 0 }),
  ].map((e) => [e.id, e]),
);
