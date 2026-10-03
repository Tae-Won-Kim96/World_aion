// 유물: 원정 동안만 유지되는 파티 전체 효과
export interface RelicDef { id: string; name: string; desc: string; color: string }

export const RELICS: Record<string, RelicDef> = Object.fromEntries(
  ([
    { id: 'bloody_grail', name: '피 묻은 성배', desc: '아군이 적을 처치하면 체력 10% 회복', color: '#c0203a' },
    { id: 'silver_lantern', name: '은빛 등불', desc: '횃불 소모 -30%', color: '#d8e0f0' },
    { id: 'ward_crest', name: '수호의 문장', desc: '전투 시작 시 아군 전원에게 보호막', color: '#6ab0ff' },
    { id: 'war_drum', name: '전쟁의 북', desc: '전투 시작 시 아군 전원 축복 2턴', color: '#e07a3a' },
    { id: 'wind_feather', name: '바람의 깃털', desc: '전투 시작 시 아군 전원 가속 2턴, 행동 게이지 +20', color: '#9af0d0' },
    { id: 'watchful_eye', name: '경계의 눈', desc: '기습당하지 않는다', color: '#ffd45a' },
    { id: 'golden_scale', name: '황금 저울', desc: '금화 획득 +25%', color: '#f2c45a' },
    { id: 'camp_kit', name: '야영 도구', desc: '야영지 회복량 +25%', color: '#a07a4a' },
    { id: 'finger_bone', name: '성자의 손가락뼈', desc: '아군이 적을 처치하면 8% 확률로 핵 조각 +1', color: '#e8e0c8' },
    { id: 'thorn_mail', name: '가시 갑옷 조각', desc: '근접 공격을 받으면 받은 피해의 20%를 돌려준다', color: '#8a9a6a' },
    { id: 'iron_boots', name: '철갑 장화', desc: '아군 이동 +1', color: '#a9b2c3' },
    { id: 'holy_vial', name: '성수병', desc: '아군이 받는 지속 피해(출혈·중독·화상) -50%', color: '#bff0ff' },
    { id: 'black_contract', name: '검은 계약서', desc: '아군 피해 +15%, 받는 피해 +10%', color: '#5a2a6a' },
    { id: 'wolf_fang', name: '늑대 이빨 목걸이', desc: '아군 치명 +8', color: '#f0e8d8' },
  ] as RelicDef[]).map((r) => [r.id, r]),
);

export const RELIC_IDS = Object.keys(RELICS);
