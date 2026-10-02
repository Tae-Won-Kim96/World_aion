import { describe, expect, test } from 'vitest';
import { DUNGEONS } from '../src/core/data/dungeons';
import { generateMap } from '../src/core/dungeon';

describe('던전 지도', () => {
  test('모든 노드는 입구에서 도달 가능하고 보스로 이어진다', () => {
    for (const d of Object.values(DUNGEONS)) {
      for (let seed = 1; seed < 200; seed++) {
        const nodes = generateMap(d, seed);
        const byId = new Map(nodes.map((n) => [n.id, n]));
        const seen = new Set<string>();
        const q = nodes.filter((n) => n.layer === 0).map((n) => n.id);
        q.forEach((id) => seen.add(id));
        while (q.length) {
          const n = byId.get(q.shift()!)!;
          for (const m of n.next) if (!seen.has(m)) { seen.add(m); q.push(m); }
        }
        expect(seen.size).toBe(nodes.length);
        for (const n of nodes) if (n.kind !== 'boss') expect(n.next.length).toBeGreaterThan(0);
        expect(nodes.filter((n) => n.kind === 'boss')).toHaveLength(1);
        expect(nodes.filter((n) => n.layer === d.floors - 1).every((n) => n.kind === 'rest')).toBe(true);
      }
    }
  });
});
