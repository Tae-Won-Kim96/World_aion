import {
  type Action, actionReady, actionsOf, affectedUnits, type BattleState, type BEvent, dangerTiles, dist, estimateDamage,
  hasStatus, moveUnit, performAction, reachableTiles, resolvePending, targetTiles, type Unit,
} from './battle';

export interface Plan {
  move: { x: number; y: number } | null;
  action: { a: Action; x: number; y: number } | null;
  score: number;
}

function scoreAction(st: BattleState, u: Unit, a: Action, tx: number, ty: number): number {
  const s = a.skill;
  if (s.kind === 'summon') {
    const mine = st.units.filter((v) => v.alive && v.side === u.side).length;
    return mine < 6 ? 28 : -1;
  }
  const targets = affectedUnits(st, u, a, tx, ty);
  if (!targets.length) return -1;
  let score = 0;
  const taunters = st.units.filter((v) => v.alive && v.side !== u.side && hasStatus(v, 'taunt'));
  for (const t of targets) {
    if (s.kind === 'phys' || s.kind === 'mag' || (s.kind === 'debuff' && s.power > 0)) {
      const d = estimateDamage(st, u, t, s);
      score += Math.min(d, t.hp);
      if (d >= t.hp) score += t.boss ? 60 : 35;
      score += (1 - t.hp / t.maxHp) * 8;
      if (t.role === 'healer') score += 4;
      if (taunters.length && !taunters.includes(t)) score -= 25;
    }
    if (s.kind === 'heal') {
      const missing = t.maxHp - t.hp;
      if (missing < t.maxHp * 0.2) { score -= 5; continue; }
      score += Math.min(missing, Math.max(u.stats.mag, u.stats.atk * 0.6) * s.power) * 1.3;
      if (t.hp < t.maxHp * 0.35) score += 15;
    }
    for (const sa of s.status ?? []) {
      if (hasStatus(t, sa.id)) continue;
      const p = sa.chance ?? 1;
      score += (sa.id === 'stun' ? 14 : sa.id === 'shield' ? 10 : 6) * p;
    }
  }
  if (s.kind === 'buff' && s.target === 'self' && s.area === 0) {
    const threatened = st.units.some((v) => v.alive && v.side !== u.side && dist(v, u) <= 2);
    score += threatened ? 9 : 2;
    for (const sa of s.selfStatus ?? []) if (hasStatus(u, sa.id)) score -= 8;
  }
  if (s.hpCost) score -= u.hp < u.maxHp * 0.3 ? 30 : 4;
  // 예고 공격은 피할 수 있으므로 할인, 단 여럿을 노리면 가산
  if (s.charge) score = score * 0.7 + (targets.length >= 2 ? 10 : 0);
  // 기본 공격보다 스킬을 약간 선호 (쿨다운 활용)
  if (!a.isAttack) score += 1;
  return score;
}

function positionScore(st: BattleState, u: Unit): number {
  const foes = st.units.filter((v) => v.alive && v.side !== u.side);
  if (!foes.length) return 0;
  const nearest = Math.min(...foes.map((f) => dist(f, u)));
  const ranged = u.attack.range[1] >= 3;
  if (ranged || u.role === 'healer') {
    let sc = -Math.abs(nearest - 3) * 0.8;
    if (nearest <= 1) sc -= 6;
    return sc;
  }
  return -nearest * 1.2;
}

/** 이동 + 행동 계획 (아군 자동전투에도 사용) */
export function planTurn(st: BattleState, u: Unit): Plan {
  const ox = u.x;
  const oy = u.y;
  const tiles = reachableTiles(st, u);
  const actions = actionsOf(u).filter((a) => actionReady(u, a));
  const danger = new Set(dangerTiles(st, u.side).map((t) => `${t.x},${t.y}`));
  let best: Plan = { move: null, action: null, score: -Infinity };
  for (const tile of tiles) {
    u.x = tile.x;
    u.y = tile.y;
    const pos = positionScore(st, u);
    const hazard = danger.has(`${tile.x},${tile.y}`) ? -45 : 0;
    if (pos + hazard > best.score) best = { move: { x: tile.x, y: tile.y }, action: null, score: pos + hazard };
    for (const a of actions) {
      for (const t of targetTiles(st, u, a)) {
        const sc = scoreAction(st, u, a, t.x, t.y);
        if (sc <= 0) continue;
        const total = sc + pos * 0.3 + hazard - tile.d * 0.05;
        if (total > best.score) best = { move: { x: tile.x, y: tile.y }, action: { a, x: t.x, y: t.y }, score: total };
      }
    }
  }
  u.x = ox;
  u.y = oy;
  if (best.move && best.move.x === ox && best.move.y === oy) best.move = null;
  return best;
}

/** AI 한 턴 (시뮬레이션/테스트용): 예고 공격 발동 또는 이동+행동 */
export function aiTakeTurn(st: BattleState, u: Unit): BEvent[] {
  const pend = resolvePending(st, u);
  if (pend) return pend;
  const p = planTurn(st, u);
  if (p.move) moveUnit(st, u, p.move.x, p.move.y);
  return p.action && u.alive ? performAction(st, u, p.action.a, p.action.x, p.action.y) : [];
}
