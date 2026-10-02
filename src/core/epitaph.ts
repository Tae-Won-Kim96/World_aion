import { CLASSES } from './data/classes';
import { HOUSES } from './data/houses';
import { Rng } from './rng';
import type { Character } from './types';

const BY_TRAIT: Record<string, string[]> = {
  coward: ['끝내 도망치지 못했다.', '처음으로 물러서지 않은 날이었다.'],
  brave: ['마지막까지 한 걸음도 물러서지 않았다.'],
  greedy: ['금화 주머니를 꼭 쥔 채 잠들다.'],
  devout: ['그토록 기도하던 신의 곁으로.'],
  zealot: ['믿음은 그를 구하지 못했다.'],
  lucky: ['운이 다한 날.'],
  genius: ['너무 일찍 져버린 별.'],
  drunkard: ['마지막 잔을 비우지 못했다.'],
  hothead: ['참았더라면 살았을까.'],
  noble: ['혈통도 칼날 앞에선 평등했다.'],
  veteran: ['백 번의 전투, 백한 번째 전투.'],
  survivor: ['살아남는 법을 알던 자, 여기 잠들다.'],
  merchant_blood: ['마지막 거래는 손해였다.'],
  outcast: ['돌아갈 곳 없던 자, 여기 묻히다.'],
  bloodthirsty: ['피를 탐하던 자, 피를 쏟고 잠들다.'],
};

const BY_ROLE: Record<string, string[]> = {
  tank: ['모두의 방패였던 자.', '그의 등 뒤에서 모두가 살았다.'],
  melee: ['칼끝에서 살고 칼끝에서 잠들다.', '마지막 일격은 빗나가지 않았다.'],
  ranged: ['마지막 화살을 쏘고 잠들다.', '멀리서 지키던 눈이 감겼다.'],
  caster: ['마지막 주문을 끝맺지 못했다.', '별을 읽던 눈이 감겼다.'],
  healer: ['남을 살리느라 자신을 잊은 자.', '모두를 치유했으나 자신은 치유하지 못했다.'],
  support: ['노래는 끝났지만 메아리는 남았다.', '곁을 지키던 자, 먼저 떠나다.'],
};

export function makeEpitaph(ch: Character, seed: number): string {
  const rng = new Rng(seed);
  const pool: string[] = [];
  for (const t of ch.traits) if (BY_TRAIT[t]) pool.push(...BY_TRAIT[t]);
  if (ch.house && HOUSES[ch.house]) pool.push(`${HOUSES[ch.house].name}의 이름을 지키다 잠들다.`);
  pool.push(...(BY_ROLE[CLASSES[ch.cls].role] ?? []));
  return rng.pick(pool);
}
