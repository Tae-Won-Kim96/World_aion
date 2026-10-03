// 거점 시설: 대장간·치유소·추모비. levels[i] = (i+1)단계로 짓는 비용
export type FacilityId = 'forge' | 'infirmary' | 'memorial';

export interface FacilityDef {
  id: FacilityId;
  name: string;
  icon: string;
  desc: string;
  levels: { gold: number; shards: number; desc: string }[];
}

export const FACILITIES: Record<FacilityId, FacilityDef> = {
  forge: {
    id: 'forge', name: '대장간', icon: '⚒',
    desc: '무너진 성채의 용광로에 다시 불을 지핀다. 장비를 강화하고, 분해할 때 더 많은 금화를 건진다.',
    levels: [
      { gold: 300, shards: 0, desc: '장비 강화 +3까지 · 분해 금화 +20%' },
      { gold: 900, shards: 3, desc: '장비 강화 +6까지 · 접두사 재련 · 분해 금화 +40%' },
      { gold: 2200, shards: 8, desc: '장비 강화 +10까지 · 분해 금화 +60%' },
    ],
  },
  infirmary: {
    id: 'infirmary', name: '치유소', icon: '✚',
    desc: '역병의 시대에 버려진 수도원 병동. 저주를 걷어 내고, 몸과 마음의 병을 다스린다.',
    levels: [
      { gold: 300, shards: 0, desc: '저주 정화' },
      { gold: 900, shards: 3, desc: '부정적인 특성 치료' },
      { gold: 2200, shards: 8, desc: '세계핵 휴면 단축 (결속자·지휘관)' },
    ],
  },
  memorial: {
    id: 'memorial', name: '추모비', icon: '⛫',
    desc: '공을 세우고 쓰러진 영웅만 이름을 새길 수 있다. 그 유지는 같은 종족·직업·소속의 동료에게 이어진다.',
    levels: [
      { gold: 500, shards: 0, desc: '영웅 1명 봉안' },
      { gold: 1500, shards: 5, desc: '영웅 2명 봉안' },
      { gold: 4000, shards: 12, desc: '영웅 4명 봉안 · 소생 의식' },
    ],
  },
};

export const FACILITY_IDS = Object.keys(FACILITIES) as FacilityId[];
