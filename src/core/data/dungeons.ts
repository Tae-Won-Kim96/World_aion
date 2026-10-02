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
    obstacles: ('grave' | 'pillar' | 'rubble' | 'coral' | 'bones' | 'candle')[];
    sky: [string, string];
  };
}

export const DUNGEONS: Record<string, DungeonDef> = {
  necropolis: {
    id: 'necropolis', name: '잿빛 묘역', floors: 7, tier: 0,
    desc: '교단이 버린 대성당 아래의 묘역. 타락한 주교가 망자를 일으키고 있다.',
    enemies: ['skel_warrior', 'skel_archer', 'ghoul', 'cultist', 'wraith', 'grave_robber'],
    elites: ['bone_knight', 'cult_priest'],
    boss: 'bishop',
    theme: {
      floor: ['#4a4752', '#3a3742', '#5a5763'], wall: '#26232c', accent: '#8a6fd1',
      obstacles: ['grave', 'pillar', 'bones', 'candle', 'rubble'], sky: ['#120f1a', '#2a2040'],
    },
  },
  sunken: {
    id: 'sunken', name: '가라앉은 사원', floors: 8, tier: 1, unlockAfter: 'necropolis',
    desc: '해안 절벽 아래 반쯤 잠긴 사원. 심해의 성가가 밤마다 들려온다.',
    enemies: ['deep_spawn', 'drowned', 'goblin_raider', 'goblin_shaman', 'abyss_chanter'],
    elites: ['deep_brute'],
    boss: 'high_priest',
    theme: {
      floor: ['#2f5257', '#24434a', '#3b6468'], wall: '#14282d', accent: '#2ec4b6',
      obstacles: ['coral', 'pillar', 'rubble', 'bones'], sky: ['#06141c', '#0f3440'],
    },
  },
};
