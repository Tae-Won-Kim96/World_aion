// 지형·세력 전용 사건: 해당 지형(또는 세력)의 던전에서만 나온다
import type { EventDef } from './events';

export const BIOME_EVENTS: EventDef[] = [
  {
    id: 'rat_nest', title: '쥐 둥지', weight: 8, biomes: ['sewer', 'mine'],
    text: '오물 더미 속에서 수백 개의 붉은 눈이 반짝인다. 둥지 깊은 곳에 반짝이는 것들이 쌓여 있다.',
    options: [
      {
        label: '쥐를 몰아낸다', req: { any: [{ cls: ['ratcatcher', 'pyromaniac', 'beastmaster'] }, { race: ['ratkin'] }] }, reqText: '쥐잡이·방화광·조련사',
        outcomes: [{ w: 1, text: '{actor}이(가) 능숙하게 쥐떼를 쫓아냈다. 둥지에는 잃어버린 물건이 가득했다.', fx: [{ gold: 70 }, { item: 1 }] }],
      },
      {
        label: '손을 넣어 뒤진다',
        outcomes: [
          { w: 50, text: '물린 자국과 함께 금화 몇 닢을 건졌다.', fx: [{ gold: 50 }, { hurt: 0.1, who: 'random' }] },
          { w: 35, text: '쥐떼가 들끓는다! 거대한 쥐가 둥지에서 기어나온다.', fx: [{ fight: 'battle' }, { gold: 60 }] },
          { w: 15, text: '{actor}이(가) 물린 상처가 곪기 시작했다.', fx: [{ addTrait: 'curse_frailty', who: 'random' }, { gold: 40 }] },
        ],
      },
      { label: '횃불로 태운다', outcomes: [{ w: 1, text: '기름을 부어 둥지를 태웠다. 길은 안전해졌지만 횃불이 줄었다.', fx: [{ torch: -15 }, { exp: 15, who: 'all' }] }] },
    ],
  },
  {
    id: 'dwarf_anvil', title: '드워프의 모루', weight: 8, biomes: ['forge', 'mine'],
    text: '용암 빛을 받아 붉게 달아오른 거대한 모루. 아직도 망치 소리가 메아리치는 듯하다.',
    options: [
      {
        label: '무기를 벼린다', req: { any: [{ race: ['dwarf', 'gnome', 'salamander'] }, { cls: ['runesmith', 'tinker'] }] }, reqText: '드워프·노움·샐러맨더 / 룬대장장이·기계공',
        outcomes: [{ w: 1, text: '{actor}의 망치질에 모루가 노래한다. 대장장이신의 가호가 깃들었다.', fx: [{ addTrait: 'bless_forge', who: 'actor' }, { item: 1 }] }],
      },
      {
        label: '광석을 캐 간다',
        outcomes: [
          { w: 70, text: '값나가는 광석을 한 자루 챙겼다.', fx: [{ gold: 80 }] },
          { w: 30, text: '튀어 오른 용암이 {actor}을(를) 덮쳤다.', fx: [{ hurt: 0.2, who: 'random' }, { gold: 50 }] },
        ],
      },
      { label: '지나친다', outcomes: [{ w: 1, text: '열기에 숨이 막힌다. 서둘러 지나쳤다.', fx: [] }] },
    ],
  },
  {
    id: 'frozen_explorer', title: '얼어붙은 탐험가', weight: 8, biomes: ['frost'],
    text: '얼음 속에 한 탐험가가 무언가를 움켜쥔 채 갇혀 있다. 표정이 아직도 생생하다.',
    options: [
      {
        label: '얼음을 깬다',
        outcomes: [
          { w: 60, text: '얼어붙은 손에서 쓸만한 장비를 빼냈다.', fx: [{ item: 1 }, { gold: 30 }] },
          { w: 25, text: '얼음이 깨지며 탐험가가 눈을 떴다. 그는 더 이상 사람이 아니었다.', fx: [{ fight: 'battle' }, { item: 1 }] },
          { w: 15, text: '살아 있었다! 녹아 깨어난 탐험가가 은혜를 갚겠다고 한다. (원정 후 합류)', fx: [{ recruit: 1 }] },
        ],
      },
      { label: '모닥불을 피운다', outcomes: [{ w: 1, text: '탐험가의 장비로 불을 피웠다. 몸이 녹는다.', fx: [{ torch: -10 }, { heal: 0.25, who: 'all' }] }] },
      { label: '명복을 빈다', outcomes: [{ w: 1, text: '눈보라가 기도를 삼켰다.', fx: [{ exp: 10, who: 'all' }] }] },
    ],
  },
  {
    id: 'glow_spores', title: '빛나는 포자 구름', weight: 8, biomes: ['fungal', 'swamp', 'forest'],
    text: '반딧불 같은 포자가 구름처럼 떠다닌다. 숨을 들이쉴 때마다 머릿속이 맑아지는 것 같다.',
    options: [
      {
        label: '포자와 교감한다', req: { any: [{ race: ['mushfolk', 'dryad'] }, { cls: ['druid', 'shaman'] }, { trait: ['nature_bond', 'photosynthesis'] }] }, reqText: '버섯족·드라이어드 / 드루이드·주술사 / 자연 친화',
        outcomes: [{ w: 1, text: '{actor}이(가) 균사의 기억을 읽어냈다. 모두가 무언가를 배웠다.', fx: [{ exp: 45, who: 'all' }] }],
      },
      {
        label: '깊이 들이마신다',
        outcomes: [
          { w: 45, text: '머리가 맑아진다! 감각이 날카로워졌다.', fx: [{ exp: 30, who: 'all' }] },
          { w: 35, text: '기침이 멈추지 않는다.', fx: [{ hurt: 0.1, who: 'all' }] },
          { w: 20, text: '{actor}의 귓가에 균사의 속삭임이 들리기 시작했다.', fx: [{ addTrait: 'curse_whispers', who: 'random' }, { exp: 20, who: 'all' }] },
        ],
      },
      { label: '숨을 참고 지나간다', outcomes: [{ w: 1, text: '돌아가느라 횃불을 조금 더 썼다.', fx: [{ torch: -8 }] }] },
    ],
  },
  {
    id: 'webbed_victim', title: '거미줄에 걸린 자', weight: 7, biomes: ['forest', 'mine', 'crypt'],
    text: '천장까지 이어진 거미줄 고치 하나가 꿈틀거린다. 안에서 희미한 신음이 새어 나온다.',
    options: [
      {
        label: '고치를 가른다',
        outcomes: [
          { w: 55, text: '고치 속 모험가가 살아 있었다! (원정 후 합류)', fx: [{ recruit: 1 }] },
          { w: 45, text: '고치를 가르자 거미 떼가 쏟아졌다!', fx: [{ fight: 'battle' }] },
        ],
      },
      {
        label: '불로 거미줄을 태운다', req: { any: [{ cls: ['pyromaniac', 'mage', 'elementalist'] }, { race: ['fire_spirit', 'salamander'] }] }, reqText: '방화광·마법사·원소술사 / 불의 정령·샐러맨더',
        outcomes: [{ w: 1, text: '{actor}의 불길이 거미줄을 삼켰다. 고치 속 모험가가 기어 나왔다. (원정 후 합류)', fx: [{ recruit: 1 }, { exp: 20, who: 'actor' }] }],
      },
      { label: '못 본 척한다', outcomes: [{ w: 1, text: '신음이 등 뒤에서 멎었다.', fx: [] }] },
    ],
  },
  {
    id: 'broken_automaton', title: '고장 난 자동인형', weight: 8, biomes: ['clock'], warbands: ['rust'],
    text: '반쯤 부서진 태엽 병사가 같은 말만 되풀이한다. "명령을… 기다린다… 명령을…"',
    options: [
      {
        label: '고쳐서 데려간다', req: { any: [{ cls: ['tinker', 'puppeteer'] }, { race: ['automaton', 'gnome'] }] }, reqText: '기계공·인형술사 / 자동인형·노움',
        outcomes: [{ w: 1, text: '{actor}이(가) 태엽을 감자 인형이 경례했다. "새 주인을… 등록했다." (원정 후 합류)', fx: [{ recruit: 1 }, { rep: 'ironhold', n: 4 }] }],
      },
      { label: '부품을 뜯어낸다', outcomes: [{ w: 1, text: '쓸만한 톱니와 금속판을 챙겼다.', fx: [{ gold: 70 }] }] },
      {
        label: '명령을 내린다',
        outcomes: [
          { w: 50, text: '"명령… 확인." 인형이 숨겨진 보급 상자를 열었다.', fx: [{ torch: 25 }, { item: 1 }] },
          { w: 50, text: '"침입자… 확인." 경보가 울린다!', fx: [{ fight: 'battle' }] },
        ],
      },
    ],
  },
  {
    id: 'oasis', title: '신기루 오아시스', weight: 8, biomes: ['desert'],
    text: '모래 언덕 너머로 야자수와 맑은 물웅덩이가 보인다. 진짜일까?',
    options: [
      {
        label: '물을 마신다',
        outcomes: [
          { w: 60, text: '진짜 물이다! 갈증이 가시고 상처가 아문다.', fx: [{ heal: 0.35, who: 'all' }] },
          { w: 40, text: '입에 들어온 건 뜨거운 모래였다. 신기루였다.', fx: [{ hurt: 0.1, who: 'all' }, { torch: -10 }] },
        ],
      },
      {
        label: '물길을 읽는다', req: { any: [{ cls: ['geomancer', 'astrologer', 'hunter'] }, { trait: ['keen_eye', 'survivor'] }] }, reqText: '지맥술사·점성술사·사냥꾼 / 예리한 눈·생존자',
        outcomes: [{ w: 1, text: '{actor}이(가) 진짜 수맥을 찾아냈다. 물통을 가득 채웠다.', fx: [{ heal: 0.4, who: 'all' }, { torch: 15 }] }],
      },
      { label: '지나친다', outcomes: [{ w: 1, text: '사막에서 믿을 것은 없다.', fx: [] }] },
    ],
  },
  {
    id: 'sand_tablet', title: '모래 속 석판', weight: 7, biomes: ['desert', 'crypt'],
    text: '모래바람이 걷히자 옛 왕조의 문자가 새겨진 석판이 드러났다.',
    options: [
      {
        label: '해독한다', req: { any: [{ trait: ['scholar', 'genius', 'sharp_mind'] }, { cls: ['astrologer', 'mage', 'necromancer'] }] }, reqText: '학자·천재·명석함 / 점성술사·마법사·강령술사',
        outcomes: [{ w: 1, text: '{actor}이(가) 잊힌 주문을 읽어냈다. 석판 뒤에 숨겨진 방이 열렸다.', fx: [{ exp: 30, who: 'all' }, { relic: true }] }],
      },
      { label: '떼어다 판다', outcomes: [{ w: 1, text: '무겁지만 값은 나가겠지.', fx: [{ gold: 60 }, { rep: 'guild', n: 2 }] }] },
      {
        label: '소리 내어 읽어본다',
        outcomes: [
          { w: 40, text: '알 수 없는 힘이 {actor}에게 깃들었다.', fx: [{ addTrait: 'bless_sun', who: 'random' }] },
          { w: 60, text: '모래가 솟구치며 무덤의 수호자가 깨어났다!', fx: [{ fight: 'elite' }, { gold: 60 }] },
        ],
      },
    ],
  },
  {
    id: 'wind_altar', title: '바람의 제단', weight: 8, biomes: ['sky'],
    text: '구름 위 부서진 제단에 깃털 장식이 바람에 흩날린다. 가장자리 아래는 끝없는 하늘이다.',
    options: [
      {
        label: '깃털을 바친다', req: { any: [{ race: ['birdfolk', 'angel', 'wind_spirit', 'pixie'] }, { tag: 'winged' }] }, reqText: '새인·천사·바람의 정령·픽시 / 날개',
        outcomes: [{ w: 1, text: '바람이 {actor}을(를) 감싸 안았다.', fx: [{ addTrait: 'bless_wind', who: 'actor' }, { essence: 1 }] }],
      },
      { label: '기도한다', outcomes: [{ w: 60, text: '시원한 바람이 상처를 씻어낸다.', fx: [{ heal: 0.25, who: 'all' }] }, { w: 40, text: '바람은 대답하지 않는다.', fx: [] }] },
      {
        label: '제단의 보석을 떼어낸다',
        outcomes: [
          { w: 55, text: '보석이 손 안에서 빛난다.', fx: [{ gold: 90 }] },
          { w: 45, text: '돌풍이 일며 {actor}이(가) 가장자리로 밀려났다!', fx: [{ hurt: 0.3, who: 'random' }, { gold: 40 }] },
        ],
      },
    ],
  },
  {
    id: 'fortune_teller', title: '점쟁이 천막', weight: 8, biomes: ['circus'], warbands: ['circus'],
    text: '찢어진 천막 안, 수정구 앞에 앉은 노파가 웃는다. "운명을 보고 싶나? 금화 50닢이면 되지."',
    options: [
      {
        label: '점을 본다 (금화 50)', req: { gold: 50 }, reqText: '금화 50',
        outcomes: [
          { w: 55, text: '"좋은 별이 보이는군." {actor}에게 행운이 깃들었다.', fx: [{ gold: -50 }, { addTrait: 'bless_fortune', who: 'random' }] },
          { w: 30, text: '"…불길하군." 노파는 금화를 돌려주지 않았다.', fx: [{ gold: -50 }, { addTrait: 'curse_misfortune', who: 'random' }] },
          { w: 15, text: '"너희가 찾는 것은 저 아래에 있다." 노파가 지도를 그려주었다.', fx: [{ gold: -50 }, { torch: 30 }, { relic: true }] },
        ],
      },
      {
        label: '속임수를 간파한다', req: { any: [{ cls: ['conartist', 'jester', 'rogue'] }, { trait: ['silver_tongue'] }] }, reqText: '사기꾼·광대·도적 / 달변',
        outcomes: [{ w: 1, text: '{actor}이(가) 수정구 밑의 거울을 찾아냈다. 노파는 입막음 값을 내놓았다.', fx: [{ gold: 80 }] }],
      },
      { label: '천막을 턴다', outcomes: [{ w: 1, text: '노파가 비명을 지르자 광대들이 몰려왔다!', fx: [{ fight: 'battle' }, { gold: 90 }] }] },
    ],
  },
  {
    id: 'freak_cage', title: '우리 속의 괴물', weight: 7, biomes: ['circus', 'manor'],
    text: '"세계 최고의 괴물!"이라 쓰인 우리 안에서 무언가가 슬픈 눈으로 이쪽을 본다.',
    options: [
      {
        label: '풀어준다',
        outcomes: [
          { w: 60, text: '우리 속 존재는 괴물이 아니라 갇혀 있던 이방인이었다. 그는 당신을 따르기로 했다. (원정 후 합류)', fx: [{ recruit: 1 }] },
          { w: 40, text: '진짜 괴물이었다!', fx: [{ fight: 'elite' }] },
        ],
      },
      { label: '구경값을 챙긴다', outcomes: [{ w: 1, text: '우리 옆 모금함에서 동전을 챙겼다. 뒷맛이 개운하지 않다.', fx: [{ gold: 45 }] }] },
      { label: '지나친다', outcomes: [{ w: 1, text: '울음소리가 천막 사이로 멀어진다.', fx: [] }] },
    ],
  },
  {
    id: 'crystal_vein', title: '수정 광맥', weight: 8, biomes: ['mine', 'fungal', 'rift'],
    text: '벽면 가득 수정이 박혀 있다. 그중 하나는 세계핵처럼 맥동한다.',
    options: [
      {
        label: '조심스럽게 캐낸다', req: { any: [{ race: ['dwarf', 'gnome', 'earth_spirit', 'gargoyle'] }, { cls: ['geomancer', 'runesmith'] }] }, reqText: '드워프·노움·대지의 정령·가고일 / 지맥술사·룬대장장이',
        outcomes: [{ w: 1, text: '{actor}이(가) 맥동하는 수정을 온전히 떼어냈다. 핵 조각이었다!', fx: [{ essence: 1 }, { gold: 40 }] }],
      },
      {
        label: '곡괭이를 휘두른다',
        outcomes: [
          { w: 45, text: '수정 몇 덩이를 캤다.', fx: [{ gold: 70 }] },
          { w: 30, text: '천장이 무너졌다!', fx: [{ hurt: 0.18, who: 'all' }, { gold: 30 }] },
          { w: 25, text: '수정이 깨지며 안에 갇혀 있던 것이 풀려났다!', fx: [{ fight: 'battle' }, { essence: 1 }] },
        ],
      },
      { label: '지나친다', outcomes: [{ w: 1, text: '맥동이 등 뒤에서 점점 희미해진다.', fx: [] }] },
    ],
  },
  {
    id: 'rift_whisper', title: '균열의 속삭임', weight: 8, biomes: ['rift'], warbands: ['rift'],
    text: '허공에 난 틈에서 목소리가 들린다. "결속자여… 너의 힘은 원래 우리 것이었다…"',
    options: [
      {
        label: '균열을 봉인한다', req: { any: [{ cls: ['exorcist', 'priest', 'paladin'] }, { trait: ['devout', 'holy_aura', 'strong_will'] }] }, reqText: '퇴마사·신관·성기사 / 독실함·성스러운 기운·강인한 의지',
        outcomes: [{ w: 1, text: '{actor}이(가) 틈을 닫았다. 주변의 공기가 가벼워졌다.', fx: [{ exp: 40, who: 'all' }, { torch: 20 }] }],
      },
      {
        label: '손을 뻗는다',
        outcomes: [
          { w: 60, text: '틈에서 핵 조각이 흘러나왔다. 그리고 무언가가 {actor}의 눈 속에 남았다.', fx: [{ essence: 2 }, { addTrait: 'curse_whispers', who: 'random' }] },
          { w: 40, text: '틈이 넓어지며 공허의 것들이 쏟아졌다!', fx: [{ fight: 'elite' }, { essence: 1 }] },
        ],
      },
      { label: '귀를 막고 지나간다', outcomes: [{ w: 1, text: '속삭임은 한참 동안 따라왔다.', fx: [{ torch: -10 }] }] },
    ],
  },
  {
    id: 'ghost_banquet', title: '유령의 만찬', weight: 8, biomes: ['manor'], warbands: ['night'],
    text: '긴 식탁 위에 김이 오르는 음식이 차려져 있다. 투명한 손님들이 일제히 이쪽을 돌아본다.',
    options: [
      {
        label: '함께 잔을 든다', req: { any: [{ race: ['vampire', 'ghost', 'revenant'] }, { trait: ['noble'] }, { vampire: true }] }, reqText: '뱀파이어·유령·망령 / 귀족 / 결속자',
        outcomes: [{ w: 1, text: '{actor}의 건배에 손님들이 미소 짓는다. 집주인이 답례로 상자를 내주었다.', fx: [{ essence: 1 }, { rep: 'nightcourt', n: 6 }] }],
      },
      {
        label: '음식을 먹는다',
        outcomes: [
          { w: 50, text: '놀랍도록 맛있다. 기운이 솟는다.', fx: [{ heal: 0.4, who: 'all' }] },
          { w: 50, text: '먹는 순간 재가 되었다. {actor}의 혀끝에 저주가 남았다.', fx: [{ addTrait: 'curse_dry', who: 'random' }] },
        ],
      },
      { label: '은식기를 챙긴다', outcomes: [{ w: 1, text: '손님들이 비명을 지르며 달려든다!', fx: [{ fight: 'battle' }, { gold: 100 }] }] },
    ],
  },
  {
    id: 'flooded_chest', title: '떠오른 상자', weight: 7, biomes: ['sunken', 'sewer', 'swamp'],
    text: '탁한 물 위로 쇠테를 두른 상자가 둥둥 떠 있다.',
    options: [
      {
        label: '헤엄쳐 가져온다', req: { any: [{ race: ['merfolk', 'deepone', 'frogfolk', 'water_spirit', 'lamia'] }, { trait: ['deep_song'] }] }, reqText: '인어·딥원·개구리족·물의 정령·라미아',
        outcomes: [{ w: 1, text: '{actor}이(가) 물속 깊은 곳의 상자까지 건져 왔다.', fx: [{ item: 2 }, { gold: 40 }] }],
      },
      {
        label: '갈고리로 끌어온다',
        outcomes: [
          { w: 60, text: '젖었지만 쓸만한 물건들이다.', fx: [{ item: 1 }] },
          { w: 40, text: '상자가 입을 벌렸다. 미믹이다!', fx: [{ fight: 'battle' }, { item: 1 }] },
        ],
      },
      { label: '그냥 둔다', outcomes: [{ w: 1, text: '상자는 천천히 가라앉았다.', fx: [] }] },
    ],
  },
  {
    id: 'toll_gate', title: '도적의 통행료', weight: 8, warbands: ['bandits'],
    text: '"여기서부턴 우리 땅이다. 통행료를 내든가, 목숨을 내든가."',
    options: [
      {
        label: '말로 구슬린다', req: { any: [{ cls: ['conartist', 'loanshark', 'bard'] }, { trait: ['silver_tongue', 'merchant_blood'] }] }, reqText: '사기꾼·고리대금업자·음유시인 / 달변·상인의 피',
        outcomes: [{ w: 1, text: '{actor}의 말솜씨에 도적들이 오히려 술값을 내놓았다.', fx: [{ gold: 40 }, { rep: 'underworld', n: 5 }] }],
      },
      {
        label: '통행료를 낸다 (금화 60)', req: { gold: 60 }, reqText: '금화 60',
        outcomes: [{ w: 1, text: '도적들은 금화를 세더니 길을 비켰다. 덤으로 지름길도 알려주었다.', fx: [{ gold: -60 }, { torch: 20 }, { rep: 'underworld', n: 2 }] }],
      },
      { label: '싸운다', outcomes: [{ w: 1, text: '"후회하게 될 거다!"', fx: [{ fight: 'battle' }, { gold: 70 }, { rep: 'underworld', n: -4 }] }] },
    ],
  },
  {
    id: 'inquisition', title: '심문 검문소', weight: 8, warbands: ['zealots'],
    text: '흰 망토의 심문관들이 길을 막았다. "세계핵의 냄새가 난다. 결속자를 내놓아라."',
    options: [
      {
        label: '신앙을 증명한다', req: { any: [{ cls: ['priest', 'paladin', 'exorcist'] }, { trait: ['devout', 'zealot'] }] }, reqText: '신관·성기사·퇴마사 / 독실함·광신',
        outcomes: [{ w: 1, text: '{actor}의 기도문에 심문관들이 머뭇거리다 길을 열었다.', fx: [{ rep: 'radiance', n: 5 }, { exp: 20, who: 'all' }] }],
      },
      {
        label: '뇌물을 준다 (금화 80)', req: { gold: 80 }, reqText: '금화 80',
        outcomes: [{ w: 1, text: '신앙도 금화 앞에서는 유연하다.', fx: [{ gold: -80 }] }],
      },
      {
        label: '정면으로 맞선다',
        outcomes: [{ w: 1, text: '"이단을 정화하라!"', fx: [{ fight: 'elite' }, { gold: 60 }, { rep: 'radiance', n: -5 }] }],
      },
    ],
  },
  {
    id: 'hunters_camp', title: '버려진 사냥꾼 야영지', weight: 7, warbands: ['beasts', 'frost'],
    text: '꺼진 모닥불 주위에 찢긴 천막과 발톱 자국. 사냥꾼들은 사냥감이 되었다.',
    options: [
      {
        label: '흔적을 쫓는다', req: { any: [{ cls: ['hunter', 'beastmaster', 'archer'] }, { race: ['wolfkin', 'beastkin', 'catkin'] }] }, reqText: '사냥꾼·조련사·궁수 / 늑대·수인·고양이족',
        outcomes: [{ w: 1, text: '{actor}이(가) 짐승들의 굴을 피해 가는 길을 찾았다. 사냥꾼들의 은닉처도.', fx: [{ torch: 20 }, { item: 1 }] }],
      },
      {
        label: '남은 보급품을 챙긴다',
        outcomes: [
          { w: 60, text: '말린 고기와 붕대가 남아 있었다.', fx: [{ heal: 0.2, who: 'all' }, { torch: 10 }] },
          { w: 40, text: '돌아온 짐승들이 으르렁거린다!', fx: [{ fight: 'battle' }] },
        ],
      },
      { label: '서둘러 떠난다', outcomes: [{ w: 1, text: '이곳에 오래 있을 이유는 없다.', fx: [] }] },
    ],
  },
];
