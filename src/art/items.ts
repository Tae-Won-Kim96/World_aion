// 장비·유물 아이콘 (16x16)
import { RARITY_COLORS } from '../core/data/items';
import { RELICS } from '../core/data/relics';
import { hex, ramp } from './color';
import { PixBuf } from './pixbuf';

const METAL = ramp('#b9c2d3');
const WOOD = ramp('#8a5a33');
const GOLD = ramp('#e2b84a');
const LEATHER = ramp('#7a5236');

function frame(b: PixBuf, rarity: number): void {
  const c = hex(RARITY_COLORS[rarity] ?? '#888888', 120);
  for (let i = 0; i < 16; i++) {
    if (i % 2 === 0) { b.set(i, 15, c); b.set(15, i, c); }
  }
}

export function drawItemIcon(base: string, rarity: number): PixBuf {
  const b = new PixBuf(16, 16);
  const R = ramp(RARITY_COLORS[rarity] ?? '#c8c4d4');
  switch (base) {
    case 'sword': b.line(4, 11, 12, 3, METAL[3]); b.line(5, 11, 13, 3, METAL[1]); b.line(2, 10, 6, 14, GOLD[2]); b.line(3, 13, 1, 15, WOOD[1]); break;
    case 'axe': b.line(3, 14, 11, 4, WOOD[2]); b.rect(9, 2, 4, 5, METAL[2]); b.vline(13, 2, 6, METAL[4]); break;
    case 'spear': b.line(2, 14, 12, 4, WOOD[2]); b.rect(12, 2, 2, 2, METAL[3]); b.set(14, 1, METAL[4]); b.set(11, 3, METAL[2]); break;
    case 'dagger': b.line(6, 10, 11, 5, METAL[3]); b.line(4, 9, 7, 12, GOLD[2]); b.line(5, 11, 3, 13, LEATHER[2]); break;
    case 'bow': for (let i = -6; i <= 6; i++) b.set(7 + Math.round(3 * Math.cos((i / 6) * 1.5)), 8 + i, WOOD[2]); b.vline(6, 2, 14, hex('#e8e8e8')); break;
    case 'staff': b.line(4, 14, 10, 4, WOOD[2]); b.ellipse(11, 3, 2, 2, R[2]); b.set(10, 2, R[4]); break;
    case 'wand': b.line(5, 12, 10, 5, hex('#3a2a2a')); b.set(11, 4, R[3]); b.set(12, 3, R[4]); b.set(12, 5, R[2]); b.set(10, 3, R[2]); break;
    case 'tome': b.rect(3, 3, 10, 10, R[1]); b.rect(4, 4, 8, 8, R[2]); b.vline(4, 3, 12, R[0]); b.rect(7, 6, 3, 3, GOLD[3]); break;
    case 'mace': b.line(4, 13, 9, 6, WOOD[2]); b.rect(9, 3, 4, 4, METAL[2]); b.set(11, 2, METAL[4]); b.set(13, 4, METAL[3]); b.set(8, 4, METAL[3]); break;
    case 'plate': b.rect(4, 3, 8, 10, METAL[2]); b.rect(2, 3, 3, 3, METAL[3]); b.rect(11, 3, 3, 3, METAL[1]); b.vline(8, 4, 12, METAL[0]); b.hline(5, 10, 9, R[2]); break;
    case 'chain': b.rect(4, 3, 8, 10, METAL[2]); for (let y = 3; y < 13; y++) for (let x = 4; x < 12; x++) if ((x + y) % 2) b.set(x, y, METAL[1]); b.hline(4, 11, 10, LEATHER[1]); break;
    case 'leather': b.rect(4, 3, 8, 10, LEATHER[2]); b.line(4, 4, 11, 11, LEATHER[0]); b.hline(4, 11, 10, LEATHER[0]); b.set(8, 10, GOLD[3]); break;
    case 'robe': for (let y = 3; y < 14; y++) { const k = 3 + Math.floor((y - 3) / 3); b.hline(8 - k, 7 + k, y, R[2]); } b.vline(7, 4, 13, GOLD[2]); break;
    case 'cloak': for (let y = 3; y < 14; y++) { const k = 2 + Math.floor((y - 3) / 2); b.hline(8 - k, 7 + k, y, ramp('#6a5a4a')[2]); } b.hline(5, 10, 3, R[3]); b.set(7, 4, GOLD[3]); break;
    case 'ring': b.ellipse(8, 9, 4, 4, GOLD[2]); b.ellipse(8, 9, 2, 2, 0); for (let y = 7; y <= 11; y++) for (let x = 6; x <= 10; x++) if ((x - 8) ** 2 + (y - 9) ** 2 <= 4) b.clear(x, y); b.ellipse(8, 4, 1.5, 1.5, R[3]); break;
    case 'amulet': b.line(3, 2, 8, 8, GOLD[1]); b.line(13, 2, 8, 8, GOLD[1]); b.ellipse(8, 10, 3, 3, R[2]); b.set(7, 9, R[4]); break;
    case 'necklace': for (let i = 0; i < 9; i++) b.set(4 + i, 4 + Math.round(Math.sin((i / 8) * Math.PI) * 5), GOLD[2]); b.rect(7, 10, 3, 3, R[2]); break;
    case 'reliquary': b.rect(4, 5, 8, 8, GOLD[1]); b.rect(5, 6, 6, 6, GOLD[2]); b.vline(8, 3, 11, R[3]); b.hline(6, 10, 6, R[3]); break;
    case 'fangcharm': b.line(3, 3, 8, 6, LEATHER[2]); b.line(13, 3, 8, 6, LEATHER[2]); for (let i = 0; i < 6; i++) b.hline(7 - Math.floor((5 - i) / 2), 8 + Math.floor((5 - i) / 2), 7 + i, hex('#f0e8d8')); break;
    default: b.ellipse(8, 8, 4, 4, R[2]);
  }
  b.outline(0.7);
  frame(b, rarity);
  return b;
}

export function drawRelicIcon(id: string): PixBuf {
  const b = new PixBuf(16, 16);
  const R = ramp(RELICS[id]?.color ?? '#cccccc');
  switch (id) {
    case 'bloody_grail': b.rect(4, 3, 8, 5, GOLD[2]); b.rect(5, 4, 6, 2, hex('#c0203a')); b.vline(7, 8, 11, GOLD[1]); b.vline(8, 8, 11, GOLD[1]); b.hline(5, 10, 12, GOLD[2]); break;
    case 'silver_lantern': b.rect(5, 4, 6, 8, R[1]); b.rect(6, 5, 4, 6, hex('#ffe680')); b.hline(5, 10, 3, R[3]); b.vline(7, 1, 3, R[0]); b.hline(5, 10, 12, R[0]); break;
    case 'ward_crest': for (let y = 2; y < 14; y++) { const k = y < 9 ? 5 : 5 - (y - 8); b.hline(8 - k, 7 + k, y, R[2]); } b.vline(7, 4, 10, GOLD[3]); b.hline(5, 10, 6, GOLD[3]); break;
    case 'war_drum': b.ellipse(8, 9, 5, 4, R[2]); b.ellipse(8, 7, 5, 2, hex('#f0e0c0')); b.line(3, 2, 6, 6, WOOD[2]); b.line(13, 2, 10, 6, WOOD[2]); break;
    case 'wind_feather': b.line(4, 13, 12, 2, R[1]); for (let i = 0; i < 8; i++) { b.set(5 + i, 11 - i, R[3]); b.set(6 + i, 12 - i, R[2]); } break;
    case 'watchful_eye': b.ellipse(8, 8, 6, 3, hex('#f8f4e8')); b.ellipse(8, 8, 2.5, 2.5, R[2]); b.ellipse(8, 8, 1, 1, hex('#1a1018')); break;
    case 'golden_scale': b.vline(8, 2, 13, GOLD[1]); b.hline(3, 13, 4, GOLD[2]); b.ellipse(4, 9, 2, 1, GOLD[3]); b.ellipse(12, 9, 2, 1, GOLD[3]); b.line(3, 5, 4, 8, GOLD[1]); b.line(13, 5, 12, 8, GOLD[1]); b.hline(5, 11, 13, GOLD[2]); break;
    case 'camp_kit': for (let y = 4; y < 13; y++) { const k = Math.floor((y - 3) * 0.7); b.hline(8 - k, 7 + k, y, R[2]); } b.vline(8, 7, 12, hex('#3a2a1a')); b.hline(2, 13, 13, WOOD[1]); break;
    case 'finger_bone': b.line(5, 12, 10, 3, R[2]); b.line(6, 12, 11, 3, R[3]); b.ellipse(5, 12, 1.5, 1.5, R[3]); b.ellipse(11, 3, 1.5, 1.5, R[3]); break;
    case 'thorn_mail': b.rect(4, 4, 8, 9, R[2]); for (const [x, y] of [[3, 5], [12, 6], [3, 9], [12, 10], [6, 3], [10, 3]]) b.set(x, y, R[4]); b.vline(8, 5, 12, R[0]); break;
    case 'iron_boots': b.rect(4, 3, 4, 8, R[2]); b.rect(4, 10, 8, 3, R[1]); b.rect(9, 5, 3, 5, R[3]); break;
    case 'holy_vial': b.rect(6, 2, 4, 2, WOOD[2]); b.ellipse(8, 9, 4, 4, hex('#e8f8ff')); b.ellipse(8, 10, 3, 2.5, R[2]); b.set(7, 8, hex('#ffffff')); break;
    case 'black_contract': b.rect(3, 2, 10, 12, hex('#e8dcc0')); for (let y = 4; y < 11; y += 2) b.hline(5, 11, y, hex('#5a4a4a')); b.ellipse(10, 12, 2, 2, hex('#a0203a')); break;
    case 'wolf_fang': b.line(3, 3, 8, 7, LEATHER[2]); b.line(13, 3, 8, 7, LEATHER[2]); for (let i = 0; i < 6; i++) b.hline(7 - Math.floor((5 - i) / 2), 8 + Math.floor((5 - i) / 2), 8 + i, R[3]); break;
    default: b.ellipse(8, 8, 5, 5, R[2]);
  }
  b.outline(0.7);
  return b;
}
