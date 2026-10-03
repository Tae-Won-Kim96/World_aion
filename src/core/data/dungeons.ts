import type { ObstacleKind } from '../../art/tiles';

export type BackdropStyle = 'columns' | 'cave' | 'forest' | 'pipes' | 'peaks' | 'factory' | 'dunes' | 'clouds' | 'tent' | 'void';

/** 던전 변이 효과 (고정 던전은 기본값) */
export interface DungeonFx {
  torchMul: number;
  goldMul: number;
  expMul: number;
  enemyDmgMul: number;
  levelAdd: number;
  ambushAdd: number;
  eliteW: number;
  restW: number;
  treasureW: number;
  restHeal: number;
  eliteEssence: number;
  bossEssence: number;
  trapPct: number;
  curseOnTreasure: number;
}

export const DEFAULT_FX: DungeonFx = {
  torchMul: 1, goldMul: 1, expMul: 1, enemyDmgMul: 1, levelAdd: 0, ambushAdd: 0, eliteW: 1, restW: 1, treasureW: 1,
  restHeal: 0, eliteEssence: 0, bossEssence: 0, trapPct: 0, curseOnTreasure: 0,
};

export interface DungeonDef {
  id: string;
  name: string;
  desc: string;
  floors: number;
  tier: number;
  enemies: string[];
  elites: string[];
  boss: string;
  unlockAfter?: string;
  theme: {
    floor: [string, string, string]; // 바닥 타일 기본/어두움/밝음
    wall: string;
    accent: string;
    obstacles: ObstacleKind[];
    sky: [string, string];
    style?: BackdropStyle;
  };
  risk: number;          // 위험도 1~10
  lvl?: number;          // 적 레벨 가산 (없으면 tier × 3)
  generated?: boolean;
  biome?: string;
  warband?: string;
  mods?: string[];
  bossName?: string;
  fx?: DungeonFx;
}

export function levelBase(d: DungeonDef): number {
  return d.lvl ?? d.tier * 3;
}

export const DUNGEONS: Record<string, DungeonDef> = {
  necropolis: {
    id: 'necropolis', name: '잿빛 묘역', floors: 7, tier: 0, risk: 1, biome: 'crypt', warband: 'undead',
    desc: '교단이 버린 대성당 아래의 묘역. 타락한 주교가 망자를 일으키고 있다.',
    enemies: ['skel_warrior', 'skel_archer', 'ghoul', 'cultist', 'wraith', 'grave_robber', 'rat_pack', 'feral_junkie'],
    elites: ['bone_knight', 'cult_priest', 'stitched_brute'],
    boss: 'bishop',
    theme: {
      floor: ['#4a4752', '#3a3742', '#5a5763'], wall: '#26232c', accent: '#8a6fd1',
      obstacles: ['grave', 'pillar', 'bones', 'candle', 'rubble'], sky: ['#120f1a', '#2a2040'],
    },
  },
  sunken: {
    id: 'sunken', name: '가라앉은 사원', floors: 8, tier: 1, risk: 3, unlockAfter: 'necropolis', biome: 'sunken', warband: 'abyss',
    desc: '해안 절벽 아래 반쯤 잠긴 사원. 심해의 성가가 밤마다 들려온다.',
    enemies: ['deep_spawn', 'drowned', 'goblin_raider', 'goblin_shaman', 'abyss_chanter', 'rat_pack'],
    elites: ['deep_brute'],
    boss: 'high_priest',
    theme: {
      floor: ['#2f5257', '#24434a', '#3b6468'], wall: '#14282d', accent: '#2ec4b6',
      obstacles: ['coral', 'pillar', 'rubble', 'bones'], sky: ['#06141c', '#0f3440'],
    },
  },
};
