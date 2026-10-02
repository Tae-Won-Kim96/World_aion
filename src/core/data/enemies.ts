import type { HeadgearKind, OffhandKind, OutfitKind, RaceId, Stats, WeaponKind } from '../types';

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
    E({ id: 'cultist', name: '광신도', race: 'human', cls: 'warlock', mul: { hp: 0.75, mag: 0.85 }, skills: ['shadow_bolt'], tags: ['cult'],
      look: { weapon: 'wand', outfit: 'robe', head: 'hood', palette: ['#4a0f1a', '#c9a36b'] }, exp: 14, gold: 12 }),
    E({ id: 'wraith', name: '망령', race: 'wraith', cls: 'mage', mul: { hp: 0.7, mag: 0.85, res: 1.3 }, skills: ['curse_agony'], tags: ['undead', 'unholy'],
      look: { weapon: 'fist', outfit: 'robe', head: 'hood', palette: ['#26284a', '#7fe3ff'] }, exp: 14, gold: 6 }),
    E({ id: 'grave_robber', name: '도굴꾼', race: 'human', cls: 'rogue', mul: { hp: 0.75, atk: 0.85 }, skills: ['poison_blade'], tags: ['bandit'],
      look: { weapon: 'dagger', offhand: 'lantern', outfit: 'leather', head: 'bandana', palette: ['#5a4a3a', '#8a2a2a'] }, exp: 12, gold: 16 }),
    E({ id: 'bone_knight', name: '해골 기사', race: 'skeleton', cls: 'knight', mul: { hp: 1.25, atk: 1.0, def: 1.2 }, skills: ['shield_bash', 'bone_rattle'], tags: ['undead', 'unholy'],
      look: { weapon: 'greatsword', offhand: 'none', outfit: 'plate', head: 'greathelm', palette: ['#3a3d48', '#7a1a1a'] }, exp: 30, gold: 25, elite: true, scale: 1.1 }),
    E({ id: 'cult_priest', name: '광신 사제', race: 'human', cls: 'priest', mul: { hp: 1.1, mag: 1.0 }, skills: ['heal', 'shadow_bolt'], tags: ['cult'],
      look: { weapon: 'staff', offhand: 'book', outfit: 'vestment', head: 'mitre', palette: ['#3a0a14', '#d4a017'] }, exp: 30, gold: 35, elite: true }),
    E({ id: 'bishop', name: '타락한 주교 모르데인', race: 'skeleton', cls: 'necromancer', mul: { hp: 3.6, mag: 1.1, def: 1.25, res: 1.35 }, skills: ['bone_spear', 'dark_nova', 'drain_life'], tags: ['undead', 'unholy', 'boss'],
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
    E({ id: 'abyss_chanter', name: '심연 성가대원', race: 'deepone', cls: 'abyssal', mul: { hp: 0.8, mag: 0.9 }, skills: ['tidal_wave'], tags: ['abyssal', 'cult'],
      look: { weapon: 'staff', outfit: 'robe', head: 'veil', palette: ['#0f3a48', '#2ec4b6'] }, exp: 16, gold: 12 }),
    E({ id: 'deep_brute', name: '심해 거한', race: 'deepone', cls: 'berserker', mul: { hp: 1.5, atk: 1.1 }, skills: ['whirlwind'], tags: ['abyssal'],
      look: { weapon: 'greataxe', outfit: 'tribal', head: 'none', palette: ['#16505c', '#c9a36b'] }, exp: 34, gold: 30, elite: true, scale: 1.25 }),
    E({ id: 'high_priest', name: '심해 대사제 크툴락', race: 'deepone', cls: 'abyssal', mul: { hp: 3.8, mag: 1.1, res: 1.4, def: 1.2 }, skills: ['tidal_wave', 'abyss_gaze', 'drain_life'], tags: ['abyssal', 'boss'],
      look: { weapon: 'trident', outfit: 'robe', head: 'crown', palette: ['#0a2a3a', '#ffd84a'] }, exp: 110, gold: 150, boss: true, scale: 1.6 }),
  ].map((e) => [e.id, e]),
);
