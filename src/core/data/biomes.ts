// 지형: 생성 던전의 색·장애물·배경과 어울리는 적 세력
import type { ObstacleKind } from '../../art/tiles';
import type { BackdropStyle } from './dungeons';

export interface BiomeDef {
  id: string;
  name: string;
  nouns: string[];          // 던전 이름 명사
  desc: string;
  floor: [string, string, string];
  wall: string;
  accent: string;
  sky: [string, string];
  obstacles: ObstacleKind[];
  style: BackdropStyle;
  warbands: Record<string, number>; // 세력 → 가중치
}

export const BIOMES: Record<string, BiomeDef> = Object.fromEntries(
  ([
    { id: 'crypt', name: '묘역', nouns: ['묘역', '납골당', '지하 묘지', '무덤 회랑'], desc: '무너진 비석과 꺼지지 않는 촛불이 늘어선 곳.',
      floor: ['#4a4752', '#3a3742', '#5a5763'], wall: '#26232c', accent: '#8a6fd1', sky: ['#120f1a', '#2a2040'], obstacles: ['grave', 'pillar', 'bones', 'candle'], style: 'columns',
      warbands: { undead: 5, zealots: 2, night: 2, rift: 1, desert: 1 } },
    { id: 'sunken', name: '수몰 사원', nouns: ['수몰 사원', '잠긴 성소', '조수 동굴'], desc: '바닷물이 반쯤 들어찬 옛 사원.',
      floor: ['#2f5257', '#24434a', '#3b6468'], wall: '#14282d', accent: '#2ec4b6', sky: ['#06141c', '#0f3440'], obstacles: ['coral', 'pillar', 'rubble'], style: 'columns',
      warbands: { abyss: 5, sewer: 1, elemental: 1 } },
    { id: 'sewer', name: '하수도', nouns: ['하수도', '배수로', '지하 수로', '쓰레기장'], desc: '폐허의 오물이 모이는 축축한 굴.',
      floor: ['#3e4232', '#2e3226', '#4e523e'], wall: '#1a1c14', accent: '#a0a050', sky: ['#0c0e08', '#22261a'], obstacles: ['barrel', 'crate', 'rubble', 'bones'], style: 'pipes',
      warbands: { sewer: 5, bandits: 2, spore: 1 } },
    { id: 'forge', name: '용암 대장간', nouns: ['용암 대장간', '불의 용광로', '재의 공방'], desc: '꺼지지 않는 용암이 흐르는 드워프의 옛 공방.',
      floor: ['#4a2e2a', '#3a201c', '#5a3a32'], wall: '#1a0a08', accent: '#ff6a2a', sky: ['#1a0604', '#4a1408'], obstacles: ['lava', 'rubble', 'gear', 'stalagmite'], style: 'cave',
      warbands: { elemental: 3, rust: 2, dragon: 2, infernal: 2 } },
    { id: 'frost', name: '얼어붙은 봉우리', nouns: ['설산', '얼음 동굴', '서리 고개', '빙하 협곡'], desc: '숨결마저 얼어붙는 높은 산.',
      floor: ['#8a9aac', '#6a7a8c', '#aabacc'], wall: '#2a3a4a', accent: '#bff4ff', sky: ['#1a2a3a', '#6a8aaa'], obstacles: ['ice', 'stalagmite', 'rubble', 'tree'], style: 'peaks',
      warbands: { frost: 5, beasts: 2, elemental: 1 } },
    { id: 'fungal', name: '포자 동굴', nouns: ['포자 동굴', '버섯 숲', '균사 굴'], desc: '빛나는 버섯이 천장까지 자란 동굴.',
      floor: ['#3e3248', '#2e2438', '#4e4258'], wall: '#160e1c', accent: '#d0a0ff', sky: ['#0e0814', '#2a1a3a'], obstacles: ['mushroom', 'stalagmite', 'crystal'], style: 'cave',
      warbands: { spore: 5, sewer: 1, elemental: 1 } },
    { id: 'forest', name: '저주받은 숲', nouns: ['검은 숲', '저주받은 숲', '거미 숲', '고목 골짜기'], desc: '해가 들지 않는 뒤틀린 나무들의 숲.',
      floor: ['#2e3e2a', '#1e2e1a', '#3e4e3a'], wall: '#0a140a', accent: '#9adf5a', sky: ['#060c06', '#1a2a18'], obstacles: ['tree', 'mushroom', 'totem', 'web'], style: 'forest',
      warbands: { beasts: 3, spore: 2, night: 1, circus: 1, frost: 1 } },
    { id: 'clock', name: '시계탑 공장', nouns: ['시계탑', '태엽 공장', '증기 공방'], desc: '아직도 톱니가 돌아가는 옛 왕국의 공장.',
      floor: ['#4a4238', '#3a3228', '#5a5248'], wall: '#1e1a14', accent: '#d8b45a', sky: ['#14100a', '#3a2e1e'], obstacles: ['gear', 'crate', 'barrel', 'statue'], style: 'factory',
      warbands: { rust: 5, bandits: 1, circus: 1 } },
    { id: 'desert', name: '사막 유적', nouns: ['사막 유적', '모래 무덤', '태양 신전', '왕가의 계곡'], desc: '모래에 반쯤 묻힌 옛 왕조의 무덤.',
      floor: ['#a88a5a', '#8a6e44', '#c2a878'], wall: '#4a3a22', accent: '#ffd84a', sky: ['#3a2410', '#c88a4a'], obstacles: ['cactus', 'statue', 'rubble', 'bones'], style: 'dunes',
      warbands: { desert: 5, dragon: 1, bandits: 2 } },
    { id: 'sky', name: '부유 폐허', nouns: ['부유 폐허', '하늘 성채', '구름 회랑'], desc: '대붕괴 때 떠오른 채 내려오지 않는 섬.',
      floor: ['#8a94b0', '#6a7490', '#aab4d0'], wall: '#3a4460', accent: '#ffe680', sky: ['#3a5a8a', '#aac8f0'], obstacles: ['statue', 'pillar', 'crystal'], style: 'clouds',
      warbands: { zealots: 4, elemental: 2, beasts: 1 } },
    { id: 'circus', name: '광기의 서커스', nouns: ['서커스 천막', '유랑 극장', '광대의 무대'], desc: '음악이 멈추지 않는 찢어진 천막.',
      floor: ['#5a2a2a', '#4a1a1a', '#6a3a3a'], wall: '#1a0a0a', accent: '#f1c40f', sky: ['#1a0a10', '#4a1a2a'], obstacles: ['crate', 'barrel', 'cage', 'statue'], style: 'tent',
      warbands: { circus: 6, bandits: 1 } },
    { id: 'mine', name: '폐광', nouns: ['폐광', '수정 광산', '무너진 갱도'], desc: '수정이 박힌 채 버려진 깊은 광산.',
      floor: ['#4a3e34', '#3a2e24', '#5a4e44'], wall: '#1a120c', accent: '#7fe3ff', sky: ['#0c0806', '#2a1e14'], obstacles: ['crate', 'stalagmite', 'crystal', 'rubble'], style: 'cave',
      warbands: { sewer: 2, dragon: 3, rust: 1, frost: 1 } },
    { id: 'swamp', name: '늪지', nouns: ['늪지', '썩은 습지', '안개 늪'], desc: '발을 디딜 때마다 무언가가 빨아들이는 늪.',
      floor: ['#3a4434', '#2a3424', '#4a5444'], wall: '#121a10', accent: '#8ad08a', sky: ['#0a100a', '#2a3a2a'], obstacles: ['tree', 'mushroom', 'totem', 'bones'], style: 'forest',
      warbands: { abyss: 2, dragon: 2, spore: 2, beasts: 1 } },
    { id: 'rift', name: '대붕괴 균열', nouns: ['균열', '공허의 틈', '부서진 하늘'], desc: '세계가 갈라진 자리. 세계핵이 비명을 지른다.',
      floor: ['#2a2238', '#1a1428', '#3a3248'], wall: '#05030a', accent: '#8a4aff', sky: ['#05030a', '#2a1048'], obstacles: ['crystal', 'statue', 'rubble'], style: 'void',
      warbands: { rift: 5, infernal: 2, undead: 1 } },
    { id: 'manor', name: '무너진 저택', nouns: ['귀족 저택', '피의 성', '버려진 별장'], desc: '샹들리에가 아직 흔들리는 귀족의 저택.',
      floor: ['#4a2a32', '#3a1a22', '#5a3a42'], wall: '#1a0a10', accent: '#e8c0d0', sky: ['#10060a', '#3a1424'], obstacles: ['statue', 'candle', 'pillar', 'cage'], style: 'columns',
      warbands: { night: 4, circus: 1, bandits: 1, zealots: 1 } },
  ] as BiomeDef[]).map((b) => [b.id, b]),
);

export const BIOME_IDS = Object.keys(BIOMES);
