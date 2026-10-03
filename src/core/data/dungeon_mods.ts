// 던전 변이: 난이도와 보상을 함께 바꾼다
import type { DungeonFx } from './dungeons';

export interface DungeonModDef {
  id: string;
  name: string;
  desc: string;
  good: boolean;            // 플레이어에게 이로운가 (표시 색)
  minRisk: number;
  fx: Partial<DungeonFx>;
  floors?: number;
  mixed?: boolean;          // 두 번째 세력을 섞는다
  extraEnemies?: string[];  // 이 변이가 섞어 넣는 적
}

export const DUNGEON_MODS: Record<string, DungeonModDef> = Object.fromEntries(
  ([
    { id: 'fog', name: '짙은 안개', desc: '횃불이 1.5배 빨리 줄지만 전리품이 20% 는다.', good: false, minRisk: 1, fx: { torchMul: 1.5, goldMul: 1.2 } },
    { id: 'bloodmoon', name: '붉은 달', desc: '적의 피해가 15% 늘고, 금화가 30% 는다.', good: false, minRisk: 3, fx: { enemyDmgMul: 1.15, goldMul: 1.3 } },
    { id: 'bounty', name: '풍요', desc: '금화가 40% 는다.', good: true, minRisk: 1, fx: { goldMul: 1.4 } },
    { id: 'elite_den', name: '정예 소굴', desc: '정예가 훨씬 자주 나오고, 정예를 쓰러뜨리면 핵 조각을 하나 더 준다.', good: false, minRisk: 2, fx: { eliteW: 2.5, eliteEssence: 1 } },
    { id: 'long_road', name: '긴 길', desc: '층이 2개 늘고, 경험치가 15% 는다.', good: false, minRisk: 1, fx: { expMul: 1.15 }, floors: 2 },
    { id: 'short_road', name: '지름길', desc: '층이 2개 줄어든다.', good: true, minRisk: 1, fx: {}, floors: -2 },
    { id: 'mixed', name: '혼성 세력', desc: '다른 세력의 적이 섞여 나온다.', good: false, minRisk: 2, fx: { goldMul: 1.1 }, mixed: true },
    { id: 'traps', name: '함정 투성이', desc: '전투가 시작될 때마다 아군이 최대 체력의 6%를 잃는다. 경험치 +10%.', good: false, minRisk: 2, fx: { trapPct: 0.06, expMul: 1.1 } },
    { id: 'sanctuary', name: '성역', desc: '야영지가 자주 나오고 휴식 회복량이 20% 는다.', good: true, minRisk: 1, fx: { restW: 2, restHeal: 0.2 } },
    { id: 'vault', name: '보물 창고', desc: '보물 방이 훨씬 자주 나온다. 보물 상자 흉내를 내는 미믹도 섞여 있다.', good: true, minRisk: 1, fx: { treasureW: 2.5 }, extraEnemies: ['treasure_mimic'] },
    { id: 'ambush', name: '매복지', desc: '기습 확률이 15% 오른다. 금화 +15%.', good: false, minRisk: 2, fx: { ambushAdd: 0.15, goldMul: 1.15 } },
    { id: 'cursed', name: '저주받은 땅', desc: '보물을 열면 30% 확률로 저주가 깃든다. 보스는 핵 조각을 하나 더 준다.', good: false, minRisk: 3, fx: { curseOnTreasure: 0.3, bossEssence: 1 } },
    { id: 'veteran', name: '노련한 적군', desc: '적이 한 단계 강하다. 금화·경험치 +20%.', good: false, minRisk: 4, fx: { levelAdd: 1, goldMul: 1.2, expMul: 1.2 } },
  ] as DungeonModDef[]).map((m) => [m.id, m]),
);

export const DUNGEON_MOD_IDS = Object.keys(DUNGEON_MODS);
