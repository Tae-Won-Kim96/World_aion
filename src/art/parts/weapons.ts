// 무기 31종 + 보조장비 12종
import { hex, lighten, ramp, type RGBA } from '../color';
import type { LookSpec } from '../look';
import type { PixBuf } from '../pixbuf';
import { type Geo, GOLD, hashStr, LEATHER, OUTLINE_DARK, type Ramps, WHITE } from './common';

function dirOf(angle: number): [number, number] {
  const a = (angle * Math.PI) / 180;
  return [Math.sin(a), -Math.cos(a)];
}

function shaft(b: PixBuf, gx: number, gy: number, angle: number, from: number, to: number, c: RGBA, thick = 1, c2?: RGBA): void {
  const [dx, dy] = dirOf(angle);
  b.line(gx + dx * from, gy + dy * from, gx + dx * to, gy + dy * to, c);
  if (thick >= 2) {
    const px = Math.round(-dy) || 0;
    const py = Math.round(dx) || 0;
    const ppx = Math.abs(px) + Math.abs(py) === 0 ? 1 : px;
    b.line(gx + dx * from + ppx, gy + dy * from + py, gx + dx * to + ppx, gy + dy * to + py, c2 ?? c);
  }
  if (thick >= 3) {
    const px = Math.round(dy) || 0;
    const py = Math.round(-dx) || 0;
    b.line(gx + dx * from + px, gy + dy * from + py, gx + dx * to + px, gy + dy * to + py, c2 ?? c);
  }
}

function at(gx: number, gy: number, angle: number, d: number, perp = 0): [number, number] {
  const [dx, dy] = dirOf(angle);
  return [Math.round(gx + dx * d + -dy * perp), Math.round(gy + dy * d + dx * perp)];
}

export function drawWeapon(b: PixBuf, s: LookSpec, g: Geo, R: Ramps): void {
  const [gx, gy] = g.grip;
  const a = g.angle;
  const { A, X, W } = R;
  const glowC = s.bound ? hex('#7fe3ff') : A[2];
  const dot = (d: number, p: number, c: RGBA) => { const [x, y] = at(gx, gy, a, d, p); b.set(x, y, c); };
  switch (s.weapon) {
    case 'sword': case 'greatsword': {
      const len = s.weapon === 'sword' ? 9 : 12;
      shaft(b, gx, gy, a, -2, 0, W[1]);
      const [c1x, c1y] = at(gx, gy, a, 1, -2);
      const [c2x, c2y] = at(gx, gy, a, 1, 2);
      b.line(c1x, c1y, c2x, c2y, GOLD[2]);
      shaft(b, gx, gy, a, 2, len, X[3], s.weapon === 'sword' ? 2 : 3, X[1]);
      dot(len + 1, 0, X[4]);
      break;
    }
    case 'axe': case 'greataxe': {
      const len = s.weapon === 'axe' ? 9 : 12;
      shaft(b, gx, gy, a, -2, len, W[2]);
      for (let d = len - 3; d <= len; d++) {
        for (let p = 1; p <= (d === len - 3 || d === len ? 2 : 3); p++) {
          dot(d, p, p === 3 ? X[4] : X[2]);
          if (s.weapon === 'greataxe') dot(d, -p, p === 3 ? X[4] : X[1]);
        }
      }
      break;
    }
    case 'spear': case 'trident': {
      shaft(b, gx, gy, a, -6, 10, W[2]);
      if (s.weapon === 'spear') {
        for (let d = 11; d <= 13; d++) dot(d, 0, X[3]);
        dot(11, -1, X[2]); dot(11, 1, X[1]); dot(10, 1, A[2]);
      } else {
        const [l1x, l1y] = at(gx, gy, a, 10, -2); const [l2x, l2y] = at(gx, gy, a, 10, 2);
        b.line(l1x, l1y, l2x, l2y, GOLD[2]);
        for (const p of [-2, 0, 2]) for (let d = 11; d <= 13; d++) dot(d, p, d === 13 ? GOLD[4] : GOLD[3]);
      }
      break;
    }
    case 'dagger': case 'katar':
      shaft(b, gx, gy, a, -1, 0, LEATHER[2]);
      shaft(b, gx, gy, a, 1, s.weapon === 'dagger' ? 4 : 3, X[3], s.weapon === 'katar' ? 2 : 1, X[2]);
      break;
    case 'staff': case 'totem': {
      shaft(b, gx, gy, a, -6, 9, W[2]);
      const [hx, hy] = at(gx, gy, a, 11);
      if (s.weapon === 'staff') {
        b.ellipse(hx, hy, 1.5, 1.5, A[2]);
        b.set(hx - 1, hy - 1, A[4]);
        dot(9, -1, W[1]); dot(9, 1, W[1]);
      } else {
        b.rect(hx - 1, hy - 1, 3, 3, ramp('#c97a3a')[2]);
        b.set(hx - 1, hy, OUTLINE_DARK); b.set(hx + 1, hy, OUTLINE_DARK);
        b.set(hx - 2, hy - 2, A[3]); b.set(hx + 2, hy - 2, A[2]);
      }
      if (g.cast) { b.set(hx, hy - 3, lighten(glowC, 0.6)); b.set(hx - 2, hy - 1, lighten(glowC, 0.5)); b.set(hx + 2, hy - 1, lighten(glowC, 0.5)); }
      break;
    }
    case 'wand': {
      shaft(b, gx, gy, a, -1, 5, hex('#3a2a2a'));
      const [hx, hy] = at(gx, gy, a, 6);
      b.set(hx, hy, A[3]); b.set(hx + 1, hy, A[2]); b.set(hx, hy - 1, A[4]);
      if (g.cast) { b.set(hx + 2, hy - 2, lighten(glowC, 0.6)); b.set(hx - 1, hy - 2, lighten(glowC, 0.4)); }
      break;
    }
    case 'mace': case 'hammer': {
      shaft(b, gx, gy, a, -2, 6, W[2]);
      const [hx, hy] = at(gx, gy, a, 8);
      if (s.weapon === 'mace') {
        b.rect(hx - 1, hy - 1, 3, 3, X[2]); b.set(hx - 1, hy - 1, X[4]);
        b.set(hx, hy - 2, X[3]); b.set(hx - 2, hy, X[3]); b.set(hx + 2, hy, X[1]); b.set(hx, hy + 2, X[1]);
      } else {
        for (let p = -2; p <= 2; p++) for (let d = 7; d <= 9; d++) dot(d, p, d === 7 ? X[1] : X[2]);
        dot(9, -2, X[4]); dot(8, 0, A[3]);
      }
      break;
    }
    case 'scythe': {
      shaft(b, gx, gy, a, -6, 10, hex('#3a2a30'));
      for (let i = 0; i < 7; i++) {
        dot(10 - Math.floor((i * i) / 12), -1 - i, X[3]);
        if (i < 5) dot(9 - Math.floor((i * i) / 12), -1 - i, X[1]);
      }
      break;
    }
    case 'flask': {
      b.rect(gx - 1, gy - 4, 3, 3, hex('#cfe8ff'));
      b.rect(gx - 1, gy - 3, 3, 2, A[2]);
      b.set(gx - 1, gy - 4, WHITE);
      b.set(gx, gy - 5, LEATHER[2]);
      if (g.cast) { b.set(gx + 1, gy - 7, lighten(glowC, 0.5)); b.set(gx - 1, gy - 8, lighten(glowC, 0.3)); }
      break;
    }
    case 'lute': {
      const L = ramp('#b07a3a');
      b.ellipse(gx - 2, gy - 1, 2.5, 2, L[2]);
      b.set(gx - 2, gy - 1, OUTLINE_DARK);
      b.line(gx, gy - 2, gx + 4, gy - 7, L[1]);
      b.set(gx + 4, gy - 8, L[3]); b.set(gx + 5, gy - 8, L[3]);
      break;
    }
    case 'book': {
      b.rect(gx - 2, gy - 4, 5, 4, hex('#f4ecd8'));
      b.vline(gx, gy - 4, gy - 1, A[1]);
      b.hline(gx - 2, gx + 2, gy, A[2]);
      b.set(gx - 1, gy - 3, hex('#8a7a6a')); b.set(gx + 1, gy - 2, hex('#8a7a6a'));
      if (g.cast) { b.set(gx, gy - 6, lighten(glowC, 0.6)); b.set(gx - 2, gy - 6, lighten(glowC, 0.4)); b.set(gx + 2, gy - 7, lighten(glowC, 0.5)); }
      break;
    }
    case 'bow': {
      const pulled = g.armPose === 'forward' && g.grip[0] > 16 + g.tw + 2;
      for (let i = -7; i <= 6; i++) {
        const bulge = Math.round(2.2 * Math.cos((i / 7) * (Math.PI / 2)));
        b.set(gx + bulge, gy + i, i === -7 || i === 6 ? W[3] : W[2]);
      }
      const sx = pulled ? gx - 3 : gx - 1;
      b.line(gx, gy - 7, sx, gy, hex('#e8e8e8'));
      b.line(sx, gy, gx, gy + 6, hex('#e8e8e8'));
      if (pulled) { b.hline(sx, gx + 5, gy, W[3]); b.set(gx + 5, gy, X[4]); b.set(gx + 4, gy - 1, X[3]); }
      break;
    }
    case 'crossbow': {
      b.hline(gx - 3, gx + 5, gy, W[2]);
      b.hline(gx - 3, gx - 1, gy + 1, W[1]);
      for (let i = -3; i <= 3; i++) b.set(gx + 4 - Math.abs(i) / 2, gy + i, X[2]);
      b.line(gx + 3, gy - 3, gx + 1, gy, hex('#e8e8e8'));
      b.line(gx + 1, gy, gx + 3, gy + 3, hex('#e8e8e8'));
      b.set(gx + 6, gy, X[4]);
      break;
    }
    // ----------------------------------------------------------- 신규 11종
    case 'syringe': {
      const glass = hex('#d8eef8');
      const liquid = ramp(s.bound ? '#7fe3ff' : '#7adf5a');
      shaft(b, gx, gy, a, -2, -1, X[1]);
      dot(-2, -1, X[2]); dot(-2, 1, X[2]);
      for (let d = 0; d <= 5; d++) { dot(d, 0, d < 4 ? liquid[2] : glass); dot(d, 1, d < 3 ? liquid[1] : glass); dot(d, -1, glass); }
      dot(1, -1, WHITE);
      shaft(b, gx, gy, a, 6, 9, X[3]);
      break;
    }
    case 'cleaver': {
      shaft(b, gx, gy, a, -1, 1, W[1]);
      for (let d = 2; d <= 7; d++) for (let p = 0; p <= 3; p++) dot(d, p, p === 3 ? X[4] : d === 7 ? X[3] : X[2]);
      dot(6, 1, OUTLINE_DARK);
      dot(4, 2, hex('#8a2a2a'));
      break;
    }
    case 'whip': {
      shaft(b, gx, gy, a, -1, 2, LEATHER[1]);
      const lash = LEATHER[2];
      const extended = g.armPose === 'forward';
      let x = at(gx, gy, a, 3)[0];
      let y = at(gx, gy, a, 3)[1];
      let ang = a;
      for (let i = 0; i < 12; i++) {
        ang += extended ? 0 : 14;
        const [dx, dy] = dirOf(ang);
        x += dx; y += dy;
        b.set(Math.round(x), Math.round(y), i === 11 ? A[3] : lash);
      }
      break;
    }
    case 'shovel': {
      shaft(b, gx, gy, a, -5, 8, W[2]);
      dot(-6, -1, W[1]); dot(-6, 0, W[1]); dot(-6, 1, W[1]);
      for (let d = 9; d <= 12; d++) for (let p = -1; p <= 1; p++) dot(d, p, p === -1 ? X[3] : X[2]);
      dot(13, 0, X[2]);
      break;
    }
    case 'bottle': {
      const gl = ramp(['#3a7a3a', '#7a4a2a', '#4a5a8a'][hashStr(s.key) % 3]);
      b.rect(gx - 1, gy - 4, 3, 4, gl[2]);
      b.set(gx - 1, gy - 4, gl[4]); b.set(gx - 1, gy - 3, gl[3]);
      b.vline(gx, gy - 7, gy - 5, gl[1]);
      b.set(gx, gy - 8, LEATHER[3]);
      b.hline(gx - 1, gx + 1, gy - 2, hex('#e8dcc0'));
      break;
    }
    case 'parasol': {
      shaft(b, gx, gy, a, -3, 10, hex('#2a2030'));
      dot(-4, 1, hex('#2a2030'));
      for (let p = -5; p <= 5; p++) {
        const top = 12 - Math.floor((p * p) / 6);
        for (let d = 9; d <= top; d++) dot(d, p, (p + 6) % 4 < 2 ? A[2] : R.M[2]);
        dot(9, p, (p & 1) ? A[1] : R.T[3]);
      }
      dot(13, 0, GOLD[3]);
      break;
    }
    case 'puppet': {
      const bar = W[2];
      b.hline(gx - 2, gx + 2, gy - 1, bar); b.vline(gx, gy - 3, gy + 1, bar);
      const lift = g.armPose === 'up' ? -3 : 0;
      const px = gx + 1;
      const py = gy + 5 + lift;
      const str = hex('#e8e8e8', 160);
      b.line(gx - 2, gy - 1, px - 1, py, str); b.line(gx + 2, gy - 1, px + 1, py, str);
      const doll = ramp('#f0dcc0');
      b.rect(px - 1, py, 2, 2, doll[2]); b.set(px - 1, py, OUTLINE_DARK);
      b.rect(px - 1, py + 2, 3, 3, A[2]); b.set(px + 1, py + 2, A[1]);
      b.set(px - 1, py + 5, doll[1]); b.set(px + 1, py + 5, doll[1]);
      b.set(px - 2, py + 3, doll[2]); b.set(px + 2, py + 3, doll[2]);
      break;
    }
    case 'smoker': {
      shaft(b, gx, gy, a, -1, 7, W[0]);
      const [hx, hy] = at(gx, gy, a, 8);
      b.rect(hx - 1, hy - 1, 2, 2, X[2]); b.set(hx - 1, hy - 1, X[4]);
      const smoke = g.cast ? lighten(glowC, 0.4) : hex('#c8c8d0');
      b.set(hx, hy - 3, (smoke & 0xffffff00) | 170);
      b.set(hx + 1, hy - 5, (smoke & 0xffffff00) | 130);
      b.set(hx - 1, hy - 6, (smoke & 0xffffff00) | 100);
      if (g.cast) { b.set(hx + 2, hy - 4, smoke); b.set(hx - 2, hy - 3, smoke); }
      break;
    }
    case 'sickle': {
      shaft(b, gx, gy, a, -1, 3, W[2]);
      const arc: [number, number][] = [[4, 0], [5, 0], [6, -1], [7, -1], [7, -2], [7, -3], [6, -4], [5, -4]];
      arc.forEach(([d, p], i) => { dot(d, p, i > 5 ? X[4] : X[3]); if (i < 6) dot(d, p + 1, X[1]); });
      break;
    }
    case 'chakram': {
      const [cx, cy] = at(gx, gy, a, 3);
      for (let t = 0; t < 16; t++) {
        const th = (t / 16) * Math.PI * 2;
        b.set(Math.round(cx + Math.cos(th) * 3), Math.round(cy + Math.sin(th) * 3), t % 4 === 0 ? X[4] : X[2]);
      }
      b.set(cx - 2, cy, GOLD[2]); b.set(cx + 2, cy, GOLD[2]); b.set(cx, cy - 2, GOLD[3]); b.set(cx, cy + 2, GOLD[1]);
      break;
    }
    case 'musket': {
      shaft(b, gx, gy, a, -4, 0, W[2], 2, W[1]);
      shaft(b, gx, gy, a, 1, 5, W[2]);
      shaft(b, gx, gy, a, 1, 12, R.X[1]);
      dot(12, 0, R.X[3]);
      dot(1, 1, GOLD[2]);
      if (g.armPose === 'forward') { dot(14, 0, hex('#fff2a0')); dot(15, -1, hex('#ffb04a')); dot(15, 1, hex('#ffb04a')); dot(16, 0, hex('#ff7a3a')); }
      break;
    }
    case 'fist': default:
      break;
  }
}

export function drawOffhand(b: PixBuf, s: LookSpec, g: Geo, R: Ramps): void {
  const lx = 16 - g.tw - 2 + g.ox;
  const ly = g.torsoTop + 7;
  const { M, A, X } = R;
  switch (s.offhand) {
    case 'shield': case 'tower': {
      const big = s.offhand === 'tower';
      const top = g.torsoTop + (big ? 1 : 2);
      const h = big ? 10 : 8;
      for (let i = 0; i < h; i++) {
        const half = i < h - 3 ? 3 : 3 - (i - (h - 4));
        b.hline(lx - half, lx + half - (big ? 0 : 1), top + i, i === 0 ? A[3] : M[2]);
        b.set(lx - half, top + i, A[2]);
        b.set(lx + half - (big ? 0 : 1), top + i, A[1]);
      }
      b.vline(lx, top + 2, top + h - 3, A[3]);
      b.hline(lx - 1, lx + 1, top + 3, A[3]);
      if (s.emblem) b.set(lx, top + 3, GOLD[4]);
      break;
    }
    case 'buckler': {
      b.ellipse(lx, ly - 1, 2.5, 2.5, X[2]);
      b.ellipse(lx, ly - 1, 1, 1, A[2]);
      b.set(lx - 1, ly - 3, X[4]); b.set(lx, ly - 1, GOLD[3]);
      break;
    }
    case 'book':
      b.rect(lx - 1, ly - 2, 3, 4, A[2]);
      b.vline(lx + 1, ly - 2, ly + 1, hex('#f4ecd8'));
      b.set(lx - 1, ly - 2, A[3]);
      break;
    case 'orb':
      b.ellipse(lx, g.torsoTop + 2, 1.5, 1.5, A[2]);
      b.set(lx - 1, g.torsoTop + 1, A[4]);
      b.set(lx + 2, g.torsoTop - 1, A[4]);
      break;
    case 'dagger':
      b.vline(lx, ly + 2, ly + 4, X[3]);
      b.set(lx + 1, ly + 2, X[1]);
      break;
    case 'lantern':
      b.vline(lx, ly + 1, ly + 2, hex('#3a3a3a'));
      b.rect(lx - 1, ly + 3, 3, 3, hex('#ffd45a'));
      b.set(lx, ly + 4, hex('#fff6c0'));
      b.hline(lx - 1, lx + 1, ly + 6, hex('#3a3a3a'));
      break;
    case 'torch': {
      b.vline(lx, ly - 4, ly + 1, R.W[2]);
      const ph = g.headTop & 1;
      b.set(lx, ly - 5, hex('#ffd45a')); b.set(lx - 1 + ph, ly - 6, hex('#ff9a3a')); b.set(lx, ly - 7, hex('#ff6a2a', 200));
      b.set(lx + 1 - ph, ly - 5, hex('#ff9a3a'));
      break;
    }
    case 'skull': {
      const B = ramp('#e8e0c8');
      b.rect(lx - 1, ly - 2, 3, 3, B[2]); b.hline(lx - 1, lx + 1, ly + 1, B[1]);
      b.set(lx - 1, ly - 1, OUTLINE_DARK); b.set(lx + 1, ly - 1, OUTLINE_DARK);
      if (g.cast) { b.set(lx - 1, ly - 1, A[3]); b.set(lx + 1, ly - 1, A[3]); }
      break;
    }
    case 'bell':
      b.vline(lx, ly, ly + 1, LEATHER[2]);
      b.hline(lx - 1, lx + 1, ly + 2, GOLD[2]); b.hline(lx - 2, lx + 2, ly + 3, GOLD[2]); b.hline(lx - 2, lx + 2, ly + 4, GOLD[1]);
      b.set(lx, ly + 5, GOLD[3]); b.set(lx - 1, ly + 2, GOLD[4]);
      break;
    case 'cage': {
      const C = ramp('#b08a3a');
      for (let yy = ly + 1; yy <= ly + 5; yy++) for (const xx of [lx - 2, lx, lx + 2]) b.set(xx, yy, C[2]);
      b.hline(lx - 2, lx + 2, ly + 1, C[3]); b.hline(lx - 2, lx + 2, ly + 5, C[1]); b.set(lx, ly, C[2]);
      b.set(lx + 1, ly + 3, hex('#ffe04a')); b.set(lx - 1, ly + 3, hex('#ffe04a'));
      break;
    }
    case 'none': default:
      break;
  }
}
