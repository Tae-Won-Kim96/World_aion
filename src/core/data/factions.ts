import type { FactionDef, FactionId } from '../types';

export const FACTIONS: Record<FactionId, FactionDef> = {
  radiance: { id: 'radiance', name: '성광 교단', color: '#f4d35e', desc: '빛의 신 솔라를 섬기는 교단. 언데드·악마·흡혈귀를 증오하고, 세계핵의 결속을 신성모독으로 여긴다.' },
  kingdom: { id: 'kingdom', name: '아르덴 왕국', color: '#4f7cff', desc: '인간 왕국과 그에 충성하는 기사가문들.' },
  silverwood: { id: 'silverwood', name: '은빛숲 연합', color: '#7bd389', desc: '엘프와 숲의 수호자들이 맺은 오래된 연합.' },
  ironhold: { id: 'ironhold', name: '철망치 씨족연합', color: '#c08552', desc: '드워프와 노움의 산악 씨족들. 금속과 계약을 중시한다.' },
  horde: { id: 'horde', name: '핏빛황야 대부족', color: '#d1495b', desc: '오크와 트롤의 부족 연합. 힘이 곧 법이다.' },
  abyss: { id: 'abyss', name: '심연의 성가대', color: '#2ec4b6', desc: '바다 밑 옛 신을 노래하는 딥원과 광신도들.' },
  infernal: { id: 'infernal', name: '지옥문 계약단', color: '#ff6b35', desc: '악마·임프·흑마법사의 계약 결사.' },
  nightcourt: { id: 'nightcourt', name: '밤의 궁정', color: '#b5179e', desc: '대붕괴 이후 밤을 지배하게 된 흡혈귀 귀족들의 궁정.' },
  guild: { id: 'guild', name: '금화 상인길드', color: '#e9c46a', desc: '돈이면 무엇이든 거래하는 대륙 최대의 상단.' },
  wildlands: { id: 'wildlands', name: '거친들 수렵부족', color: '#a7c957', desc: '수인과 사냥꾼들의 자유 부족.' },
  primal: { id: 'primal', name: '원소의 성소', color: '#ff9f43', desc: '대붕괴 때 풀려난 정령들이 모여 세운 성소. 세계핵을 제 몸의 일부로 여긴다.' },
  underworld: { id: 'underworld', name: '뒷골목 조합', color: '#8e8e8e', desc: '폐허의 하수도와 암시장을 쥔 조합. 마약, 빚, 장례까지 무엇이든 취급한다.' },
};

export const FACTION_IDS = Object.keys(FACTIONS) as FactionId[];

// 진영 상성 (대칭). +는 우호, -는 적대. 범위 -3..+3
const REL: [FactionId, FactionId, number][] = [
  ['radiance', 'infernal', -3], ['radiance', 'nightcourt', -3], ['radiance', 'abyss', -2],
  ['radiance', 'kingdom', 2], ['radiance', 'horde', -1],
  ['kingdom', 'horde', -2], ['kingdom', 'guild', 1], ['kingdom', 'ironhold', 1], ['kingdom', 'nightcourt', -1],
  ['kingdom', 'wildlands', -1],
  ['silverwood', 'horde', -2], ['silverwood', 'ironhold', -1], ['silverwood', 'wildlands', 2],
  ['silverwood', 'infernal', -2], ['silverwood', 'guild', -1],
  ['ironhold', 'horde', -2], ['ironhold', 'guild', 2], ['ironhold', 'abyss', -1],
  ['horde', 'wildlands', 1],
  ['abyss', 'nightcourt', 1], ['abyss', 'infernal', -1], ['abyss', 'wildlands', -1], ['abyss', 'silverwood', -1],
  ['infernal', 'nightcourt', 1], ['infernal', 'guild', 1],
  ['nightcourt', 'guild', 1],
  ['wildlands', 'guild', -1],
  ['primal', 'silverwood', 2], ['primal', 'abyss', -1], ['primal', 'ironhold', -1], ['primal', 'infernal', -2],
  ['primal', 'wildlands', 1], ['primal', 'underworld', -1],
  ['underworld', 'guild', 1], ['underworld', 'kingdom', -2], ['underworld', 'radiance', -2], ['underworld', 'nightcourt', 1],
  ['underworld', 'horde', 1],
];

const relMap = new Map<string, number>();
for (const [a, b, v] of REL) {
  relMap.set(`${a}|${b}`, v);
  relMap.set(`${b}|${a}`, v);
}

export function factionRelation(a: FactionId, b: FactionId): number {
  if (a === b) return 3;
  return relMap.get(`${a}|${b}`) ?? 0;
}
