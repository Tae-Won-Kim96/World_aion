import type { FactionId, RaceId, Role } from '../types';

// 파티 조건: 조건을 만족한 동료가 '행동자'가 된다 ({actor})
export type Cond =
  | { race: RaceId[] }
  | { cls: string[] }
  | { trait: string[] }
  | { house: string[] }
  | { vampire: true }
  | { mortal: true }
  | { tag: string }
  | { role: Role[] }
  | { curse: true }
  | { affinity: FactionId; min: number }
  | { gold: number }
  | { any: Cond[] };

export type Who = 'actor' | 'random' | 'all';

export type Fx =
  | { gold: number }
  | { torch: number }
  | { essence: number }
  | { heal: number; who?: Who }
  | { hurt: number; who?: Who }
  | { addTrait: 'curse' | 'blessing' | string; who?: Who }
  | { removeCurse: true; who?: Who }
  | { rep: FactionId; n: number }
  | { exp: number; who?: Who }
  | { fight: 'battle' | 'elite' }
  | { recruit: number }
  | { item: number }
  | { relic: true };

export interface Outcome {
  w: number;
  text: string;
  fx: Fx[];
  bonus?: { cond: Cond; add: number }[];
}

export interface EventOption {
  label: string;
  req?: Cond;
  reqText?: string;
  outcomes: Outcome[];
}

export interface EventDef {
  id: string;
  title: string;
  text: string;
  weight: number;
  options: EventOption[];
}

const UNHOLY: Cond = { any: [{ vampire: true }, { tag: 'unholy' }] };

export const EVENTS: EventDef[] = [
  {
    id: 'shrine', title: '무너진 성소', weight: 10,
    text: '금이 간 솔라 여신상 앞에 촛불 하나가 아직 꺼지지 않고 타고 있다.',
    options: [
      {
        label: '기도한다',
        outcomes: [
          { w: 40, text: '따스한 빛이 {actor}을(를) 감싼다. 가호가 깃들었다.', fx: [{ addTrait: 'blessing', who: 'random' }], bonus: [{ cond: { any: [{ trait: ['devout', 'zealot'] }, { role: ['healer'] }] }, add: 40 }] },
          { w: 40, text: '아무 일도 일어나지 않았다. 촛불만 흔들릴 뿐.', fx: [] },
          { w: 10, text: '여신상의 눈에서 피눈물이 흐른다. {actor}에게 저주가 내려앉았다.', fx: [{ addTrait: 'curse', who: 'random' }], bonus: [{ cond: UNHOLY, add: 50 }] },
        ],
      },
      {
        label: '헌금함을 턴다',
        outcomes: [
          { w: 75, text: '동전 몇 닢이 쏟아진다. 교단이 알면 좋아하진 않겠지.', fx: [{ gold: 45 }, { rep: 'radiance', n: -5 }] },
          { w: 25, text: '손이 닿는 순간 불운이 스며들었다.', fx: [{ gold: 45 }, { addTrait: 'curse_misfortune', who: 'random' }, { rep: 'radiance', n: -5 }] },
        ],
      },
      { label: '지나친다', outcomes: [{ w: 1, text: '당신들은 조용히 성소를 떠났다.', fx: [] }] },
    ],
  },
  {
    id: 'templar', title: '길 잃은 성당 기사', weight: 8,
    text: '부상당한 성광 교단 기사가 벽에 기대 앉아 있다. "…혹시, 물 한 모금만…"',
    options: [
      {
        label: '치료해준다', req: { role: ['healer'] }, reqText: '치유 직업',
        outcomes: [{ w: 1, text: '{actor}의 손길에 기사가 일어선다. "빛이 그대와 함께하길." 그는 지갑을 내밀었다.', fx: [{ gold: 35 }, { rep: 'radiance', n: 8 }] }],
      },
      {
        label: '말을 건다',
        outcomes: [
          { w: 60, text: '기사는 지름길과 기름을 나눠주었다.', fx: [{ torch: 20 }, { rep: 'radiance', n: 3 }] },
          { w: 0, text: '기사는 일행의 송곳니와 뿔을 보더니 비명을 지르며 달아났다. 교단에 소문이 퍼질 것이다.', fx: [{ rep: 'radiance', n: -6 }], bonus: [{ cond: UNHOLY, add: 200 }] },
        ],
      },
      {
        label: '장비를 빼앗는다',
        outcomes: [{ w: 1, text: '저항할 힘도 없는 기사에게서 금화와 장비를 챙겼다.', fx: [{ gold: 70 }, { rep: 'radiance', n: -12 }, { rep: 'kingdom', n: -3 }] }],
      },
    ],
  },
  {
    id: 'deep_song', title: '심해의 노래', weight: 7,
    text: '벽 틈에서 물소리와 함께 낮고 긴 노래가 흘러나온다. 듣고 있으면 머리가 멍해진다.',
    options: [
      {
        label: '함께 노래한다', req: { any: [{ race: ['deepone'] }, { trait: ['deep_song'] }, { cls: ['abyssal'] }] }, reqText: '딥원 / 심해의 노래 / 심연술사',
        outcomes: [{ w: 1, text: '{actor}의 노래에 물결이 화답한다. 바다신의 가호가 깃들었다.', fx: [{ addTrait: 'bless_sea', who: 'actor' }, { rep: 'abyss', n: 8 }] }],
      },
      {
        label: '귀 기울인다',
        outcomes: [
          { w: 50, text: '노래 속에서 오래된 지식을 얻었다.', fx: [{ exp: 30, who: 'all' }] },
          { w: 50, text: '{actor}이(가) 노래에 사로잡혔다. 망자의 속삭임이 들리기 시작한다.', fx: [{ addTrait: 'curse_whispers', who: 'random' }], bonus: [{ cond: { trait: ['strong_will'] }, add: -40 }] },
        ],
      },
      { label: '귀를 막는다', outcomes: [{ w: 1, text: '노래가 멀어진다.', fx: [] }] },
    ],
  },
  {
    id: 'caravan', title: '메디니 상단', weight: 8,
    text: '황금 백합 문장을 단 마차가 멈춰 있다. 메디니 가문의 상단이다. "필요한 게 있으신가?"',
    options: [
      {
        label: '가문의 이름을 댄다', req: { house: ['medini'] }, reqText: '메디니 가문',
        outcomes: [{ w: 1, text: '"오, {actor} 님!" 상단주는 기름과 금화를 아낌없이 내주었다.', fx: [{ torch: 40 }, { gold: 60 }, { rep: 'guild', n: 5 }] }],
      },
      {
        label: '횃불 기름을 산다 (금화 30)', req: { gold: 30 }, reqText: '금화 30',
        outcomes: [{ w: 1, text: '비싸지만 품질은 확실하다.', fx: [{ gold: -30 }, { torch: 35 }, { rep: 'guild', n: 2 }] }],
      },
      {
        label: '약탈한다',
        outcomes: [{ w: 1, text: '호위병들이 칼을 뽑았다!', fx: [{ fight: 'battle' }, { gold: 120 }, { rep: 'guild', n: -15 }, { rep: 'kingdom', n: -4 }] }],
      },
      { label: '지나친다', outcomes: [{ w: 1, text: '상단주는 아쉬운 듯 손을 흔들었다.', fx: [] }] },
    ],
  },
  {
    id: 'armory', title: '버려진 무기고', weight: 8,
    text: '녹슨 무기와 부서진 갑옷이 산처럼 쌓여 있다.',
    options: [
      {
        label: '손질한다', req: { any: [{ race: ['dwarf', 'gnome'] }, { cls: ['runesmith', 'tinker'] }] }, reqText: '드워프·노움 / 룬대장장이·기계공',
        outcomes: [
          { w: 50, text: '{actor}의 손에서 고철이 명검으로 바뀐다. 대장장이신이 미소 짓는다.', fx: [{ addTrait: 'bless_forge', who: 'actor' }] },
          { w: 50, text: '{actor}이(가) 쓸만한 부품을 골라 팔 수 있게 정리했다.', fx: [{ gold: 70 }, { exp: 20, who: 'all' }] },
        ],
      },
      {
        label: '뒤진다',
        outcomes: [
          { w: 60, text: '쓸만한 장비와 값나가는 물건을 찾았다.', fx: [{ gold: 25 }, { item: 1 }] },
          { w: 40, text: '녹슨 칼날에 {actor}이(가) 베였다.', fx: [{ hurt: 0.15, who: 'random' }, { gold: 10 }] },
        ],
      },
      { label: '지나친다', outcomes: [{ w: 1, text: '시간 낭비다.', fx: [] }] },
    ],
  },
  {
    id: 'blood_altar', title: '피의 제단', weight: 7,
    text: '검붉은 제단이 심장처럼 맥동한다. 피를 바치면 무언가를 돌려줄 것 같다.',
    options: [
      {
        label: '뱀파이어가 마신다', req: { vampire: true }, reqText: '뱀파이어',
        outcomes: [{ w: 1, text: '{actor}이(가) 제단의 피를 들이켰다. 힘이 차오른다.', fx: [{ heal: 0.6, who: 'actor' }, { essence: 1 }, { rep: 'nightcourt', n: 5 }] }],
      },
      {
        label: '피를 바친다',
        outcomes: [{ w: 1, text: '{actor}의 피가 제단에 스며들고, 붉은 정수가 맺혔다.', fx: [{ hurt: 0.25, who: 'random' }, { essence: 1 }] }],
      },
      {
        label: '제단을 부순다', req: { any: [{ role: ['healer'] }, { cls: ['exorcist', 'paladin'] }, { trait: ['devout', 'zealot'] }] }, reqText: '치유 직업 / 퇴마사·성기사 / 독실함',
        outcomes: [{ w: 1, text: '{actor}이(가) 제단을 정화했다. 주변이 밝아진다.', fx: [{ torch: 25 }, { rep: 'radiance', n: 8 }, { rep: 'nightcourt', n: -4 }] }],
      },
    ],
  },
  {
    id: 'caged', title: '갇힌 모험가', weight: 7,
    text: '녹슨 철창 속에 누군가 웅크리고 있다. "꺼, 꺼내줘… 뭐든 할게!"',
    options: [
      {
        label: '풀어준다',
        outcomes: [
          { w: 70, text: '구출된 모험가가 당신의 휘하에 들어왔다! (원정 후 합류)', fx: [{ recruit: 1 }] },
          { w: 30, text: '함정이었다! 철창 뒤에서 적들이 튀어나온다.', fx: [{ fight: 'battle' }] },
        ],
      },
      { label: '무시한다', outcomes: [{ w: 1, text: '등 뒤로 흐느끼는 소리가 멀어진다.', fx: [] }] },
    ],
  },
  {
    id: 'mushrooms', title: '기묘한 버섯', weight: 7,
    text: '푸르스름하게 빛나는 버섯 군락이 동굴 벽을 덮고 있다.',
    options: [
      {
        label: '감별한다', req: { any: [{ cls: ['druid', 'alchemist', 'witch'] }, { race: ['gnome', 'elf'] }] }, reqText: '드루이드·연금술사·마녀 / 노움·엘프',
        outcomes: [{ w: 1, text: '{actor}이(가) 약효가 있는 버섯만 골라냈다.', fx: [{ heal: 0.4, who: 'all' }] }],
      },
      {
        label: '먹어본다',
        outcomes: [
          { w: 50, text: '의외로 맛있고 기운이 난다!', fx: [{ heal: 0.3, who: 'all' }] },
          { w: 30, text: '배가 뒤틀린다. 모두 구역질을 한다.', fx: [{ hurt: 0.12, who: 'all' }] },
          { w: 20, text: '{actor}의 눈빛이 이상해졌다…', fx: [{ addTrait: 'curse_beast', who: 'random' }] },
        ],
      },
      { label: '지나친다', outcomes: [{ w: 1, text: '현명한 선택이다.', fx: [] }] },
    ],
  },
  {
    id: 'imp_deal', title: '임프의 거래', weight: 6,
    text: '작은 임프가 계약서를 흔들며 낄낄댄다. "저주 하나만 받아주면 금화 듬뿍! 아니면 저주를 사줄 수도 있지!"',
    options: [
      {
        label: '저주를 넘긴다 (금화 50)', req: { curse: true }, reqText: '저주 보유',
        outcomes: [{ w: 1, text: '임프가 {actor}의 저주를 빨아들였다. "거래 성립!"', fx: [{ removeCurse: true, who: 'actor' }, { gold: -50 }, { rep: 'infernal', n: 3 }] }],
      },
      {
        label: '계약서에 서명한다',
        outcomes: [{ w: 1, text: '금화가 쏟아지고, {actor}의 그림자가 일그러졌다.', fx: [{ gold: 150 }, { addTrait: 'curse', who: 'random' }, { rep: 'infernal', n: 5 }] }],
      },
      { label: '쫓아낸다', outcomes: [{ w: 1, text: '임프는 혀를 내밀고 사라졌다.', fx: [{ rep: 'infernal', n: -3 }] }] },
    ],
  },
  {
    id: 'warband', title: '오크 전투 부대', weight: 6,
    text: '북소리. 핏빛황야 대부족의 전투 부대가 통로를 막아섰다.',
    options: [
      {
        label: '부족의 말로 인사한다', req: { any: [{ race: ['orc', 'troll'] }, { affinity: 'horde', min: 3 }] }, reqText: '오크·트롤 / 대부족 호감 3+',
        outcomes: [{ w: 1, text: '{actor}의 인사에 전사들이 무기를 내렸다. 그들은 횃불을 나눠주었다.', fx: [{ torch: 20 }, { rep: 'horde', n: 8 }] }],
      },
      {
        label: '통행료를 낸다 (금화 60)', req: { gold: 60 }, reqText: '금화 60',
        outcomes: [{ w: 1, text: '전사들은 금화를 세더니 길을 비켜주었다.', fx: [{ gold: -60 }, { rep: 'horde', n: 2 }] }],
      },
      {
        label: '싸운다',
        outcomes: [{ w: 1, text: '"피를 원하는가!" 전투가 시작된다!', fx: [{ fight: 'elite' }, { rep: 'horde', n: -6 }, { gold: 60 }] }],
      },
    ],
  },
  {
    id: 'elf_patrol', title: '은빛숲 순찰대', weight: 6,
    text: '어둠 속에서 은빛 화살촉들이 일행을 겨눈다. "멈춰라, 침입자."',
    options: [
      {
        label: '엘프어로 답한다', req: { any: [{ race: ['elf'] }, { affinity: 'silverwood', min: 3 }] }, reqText: '엘프 / 은빛숲 호감 3+',
        outcomes: [{ w: 1, text: '{actor}의 답에 순찰대가 활을 내렸다. 그들은 상처를 치료해주었다.', fx: [{ heal: 0.3, who: 'all' }, { rep: 'silverwood', n: 8 }] }],
      },
      {
        label: '사정을 설명한다',
        outcomes: [
          { w: 60, text: '순찰대는 미심쩍어하면서도 길을 알려주었다.', fx: [{ torch: 10 }] },
          { w: 0, text: '"오크와 함께 다니는 놈들이군!" 화살이 날아왔다.', fx: [{ hurt: 0.2, who: 'random' }, { rep: 'silverwood', n: -5 }], bonus: [{ cond: { race: ['orc', 'troll'] }, add: 150 }] },
        ],
      },
      { label: '물러난다', outcomes: [{ w: 1, text: '돌아가는 길에 횃불을 조금 더 썼다.', fx: [{ torch: -10 }] }] },
    ],
  },
  {
    id: 'tomb', title: '봉인된 석관', weight: 8,
    text: '희미하게 빛나는 문양이 새겨진 석관. 봉인이 약해져 있다.',
    options: [
      {
        label: '봉인을 강화한다', req: { any: [{ role: ['healer'] }, { cls: ['exorcist', 'paladin'] }] }, reqText: '치유 직업 / 퇴마사·성기사',
        outcomes: [{ w: 1, text: '{actor}의 기도로 봉인이 되살아났다.', fx: [{ exp: 30, who: 'all' }, { rep: 'radiance', n: 5 }] }],
      },
      {
        label: '연다',
        outcomes: [
          { w: 50, text: '부장품이 가득하다!', fx: [{ gold: 80 }, { item: 2 }] },
          { w: 50, text: '관 속의 망자가 눈을 떴다!', fx: [{ fight: 'battle' }, { gold: 80 }] },
        ],
      },
      { label: '지나친다', outcomes: [{ w: 1, text: '죽은 자는 잠들게 두자.', fx: [] }] },
    ],
  },
  {
    id: 'reliquary_box', title: '잊힌 성물함', weight: 6,
    text: '먼지 쌓인 제단 위에 자물쇠가 채워진 작은 함이 놓여 있다. 안에서 무언가가 희미하게 빛난다.',
    options: [
      {
        label: '기도를 올린 뒤 연다', req: { any: [{ role: ['healer'] }, { trait: ['devout', 'zealot'] }, { cls: ['exorcist', 'paladin'] }] }, reqText: '치유 직업 / 독실함 / 퇴마사·성기사',
        outcomes: [{ w: 1, text: '{actor}의 기도에 자물쇠가 저절로 풀렸다.', fx: [{ relic: true }] }],
      },
      {
        label: '자물쇠를 부순다',
        outcomes: [
          { w: 65, text: '함 속에서 오래된 유물이 나왔다!', fx: [{ relic: true }] },
          { w: 35, text: '함을 여는 순간 검은 연기가 {actor}을(를) 감쌌다.', fx: [{ addTrait: 'curse', who: 'random' }, { gold: 30 }] },
        ],
      },
      { label: '그냥 둔다', outcomes: [{ w: 1, text: '건드리지 않는 편이 나을지도.', fx: [] }] },
    ],
  },
  {
    id: 'envoy', title: '밤의 궁정 사절', weight: 5,
    text: '검은 망토의 사절이 정중히 고개를 숙인다. "혈주님의 귀환 소식은 궁정에도 닿았습니다."',
    options: [
      {
        label: '환대를 받는다', req: { vampire: true }, reqText: '파티에 뱀파이어',
        outcomes: [{ w: 1, text: '사절은 {actor}에게 피의 정수가 든 잔을 바쳤다.', fx: [{ essence: 1 }, { rep: 'nightcourt', n: 8 }] }],
      },
      {
        label: '정보를 산다 (금화 40)', req: { gold: 40 }, reqText: '금화 40',
        outcomes: [{ w: 1, text: '사절은 다음 층의 함정 위치를 알려주었다.', fx: [{ gold: -40 }, { torch: 30 }, { rep: 'nightcourt', n: 3 }] }],
      },
      { label: '거절한다', outcomes: [{ w: 1, text: '"아쉽군요. 궁정은 기억할 겁니다."', fx: [{ rep: 'nightcourt', n: -5 }, { rep: 'radiance', n: 2 }] }] },
    ],
  },
];
