// 파츠 쇼케이스: 각 파츠를 강제로 적용해 한 장에 그린다 (PREVIEW_OUT 설정 시에만)
import { test } from 'vitest';
import { generateCharacter } from '../../src/core/gen/character';
import { HAIR_STYLES, lookFromCharacter, type LookSpec } from '../../src/art/look';
import { drawFrame, FRAME_W, FRAME_H } from '../../src/art/charsprite';
import { PixBuf } from '../../src/art/pixbuf';
import { writePng } from './png';
import { hex } from '../../src/art/color';
import type { HeadgearKind, OffhandKind, OutfitKind, RaceLook, WeaponKind } from '../../src/core/types';

const OUT = process.env.PREVIEW_OUT ?? '/tmp';

function base(i: number): LookSpec {
  const ch = generateCharacter(9000 + i * 131, { now: 0, star: 3 });
  const l = lookFromCharacter(ch);
  return { ...l, key: `pv_${i}`, accessories: [], head: 'none', cape: null, feat: { ...l.feat, wings: 'none', tail: 'none', horns: 'none', halo: false, crest: undefined } };
}

function row(specs: LookSpec[]): PixBuf {
  const b = new PixBuf(specs.length * FRAME_W, FRAME_H);
  specs.forEach((s, i) => b.blit(drawFrame(s, 'idle0'), i * FRAME_W, 0));
  return b;
}

test.skipIf(!process.env.PREVIEW_OUT)('preview parts', () => {
  const rows: PixBuf[] = [];
  rows.push(row(HAIR_STYLES.map((h, i) => ({ ...base(i), hairStyle: h }))));
  const heads: HeadgearKind[] = ['helm', 'greathelm', 'wizard', 'hood', 'mitre', 'circlet', 'crown', 'feather', 'antlers', 'bandana', 'goggles', 'tricorn', 'witch', 'skullcap', 'veil', 'horned', 'straw', 'cowboy', 'beret', 'tophat', 'plaguemask', 'jester', 'flowercrown', 'headband', 'turban', 'laurel', 'tiara', 'buckethelm', 'beehat'];
  rows.push(row(heads.map((h, i) => ({ ...base(i + 30), head: h }))));
  const outfits: OutfitKind[] = ['plate', 'chain', 'leather', 'robe', 'vestment', 'cloak', 'tunic', 'tribal', 'gi', 'dress', 'coat', 'rags', 'bone', 'apron', 'suit', 'labcoat', 'motley', 'wrap', 'scale', 'fur', 'bandages', 'overalls', 'sash', 'cassock'];
  rows.push(row(outfits.map((o, i) => ({ ...base(i + 60), outfit: o }))));
  const weapons: WeaponKind[] = ['sword', 'greatsword', 'axe', 'greataxe', 'spear', 'dagger', 'bow', 'crossbow', 'staff', 'wand', 'mace', 'hammer', 'fist', 'lute', 'scythe', 'totem', 'flask', 'katar', 'trident', 'book', 'syringe', 'cleaver', 'whip', 'shovel', 'bottle', 'parasol', 'puppet', 'smoker', 'sickle', 'chakram', 'musket'];
  rows.push(row(weapons.map((w, i) => ({ ...base(i + 90), weapon: w }))));
  const offs: OffhandKind[] = ['shield', 'tower', 'book', 'orb', 'dagger', 'lantern', 'torch', 'skull', 'bell', 'buckler', 'cage'];
  rows.push(row(offs.map((o, i) => ({ ...base(i + 130), offhand: o }))));
  const acc = ['scar', 'eyepatch', 'glasses', 'monocle', 'mask', 'facepaint', 'tattoo', 'earring', 'nosering', 'scarf', 'flower', 'bandage', 'pipe', 'beautymark', 'eyebags', 'stitches'] as LookSpec['accessories'];
  const eyes = ['normal', 'big', 'sleepy', 'sharp', 'happy', 'dot', 'slit'] as LookSpec['eyeStyle'][];
  const mouths = ['neutral', 'smile', 'frown', 'open', 'cat', 'fang'] as LookSpec['mouth'][];
  rows.push(row([
    ...acc.map((a, i) => ({ ...base(i + 150), hairStyle: 'short' as const, accessories: [a] })),
    ...eyes.map((e, i) => ({ ...base(i + 170), eyeStyle: e })),
    ...mouths.map((m, i) => ({ ...base(i + 180), mouth: m })),
  ]));
  const feats: Partial<RaceLook>[] = [
    { ears: 'cat' }, { ears: 'fox' }, { ears: 'wolf' }, { ears: 'bear' }, { ears: 'rabbit' }, { ears: 'beast' }, { ears: 'pointy' }, { ears: 'long' }, { ears: 'fin' },
    { horns: 'small' }, { horns: 'curl' }, { horns: 'large' }, { horns: 'bull' }, { horns: 'branch' },
    { crest: 'mushroom' }, { crest: 'flame' }, { crest: 'leaf' }, { crest: 'crystal' }, { crest: 'wisp', translucent: true }, { crest: 'feathers', beak: true },
    { skinPattern: 'scales', slitEyes: true }, { skinPattern: 'bark' }, { skinPattern: 'stone' }, { skinPattern: 'metal' }, { skinPattern: 'stitches' }, { skinPattern: 'spots' },
    { snout: true, ears: 'bear' }, { legs: 'fishtail', ears: 'fin' }, { legs: 'hooves', horns: 'bull' }, { height: 'tiny', wings: 'butterfly' },
    { wings: 'bird' }, { wings: 'bat', tail: 'devil' }, { tail: 'fox', ears: 'fox' }, { tail: 'cat', ears: 'cat' }, { tail: 'lizard' }, { tail: 'fish' }, { aura: '#ff6a2a', crest: 'flame' },
    { horns: 'antennae', wings: 'insect', manyEyes: true }, { legs: 'serpent', slitEyes: true }, { legs: 'ghost', translucent: true }, { oneEye: true, height: 'tall' }, { frogEyes: true }, { chestHead: true },
  ];
  rows.push(row(feats.map((f, i) => {
    const b0 = base(i + 200);
    const s: LookSpec = { ...b0, feat: { ...b0.feat, ...f } };
    if (f.crest === 'flame') s.hair = '#ff8a2a';
    if (f.crest === 'wisp') s.hair = '#7ad8ff';
    if (f.crest === 'leaf') s.hair = '#5aa04a';
    if (f.crest === 'crystal') s.hair = '#b48aff';
    if (f.crest === 'mushroom') s.hair = '#d04040';
    if (f.skinPattern === 'bark') s.skin = ['#8a6a4a', '#6a4a32', '#a88a6a'];
    if (f.skinPattern === 'stone') s.skin = ['#9a9aa4', '#72727c', '#babac4'];
    if (f.skinPattern === 'metal') s.skin = ['#b0b8c8', '#8890a0', '#d0d8e8'];
    if (f.skinPattern === 'scales') s.skin = ['#5aa06a', '#3a8050', '#7ac08a'];
    return s;
  })));
  const w = Math.max(...rows.map((r) => r.w));
  const out = new PixBuf(w, rows.length * FRAME_H);
  rows.forEach((r, i) => out.blit(r, 0, i * FRAME_H));
  writePng(`${OUT}/sprites_parts.png`, out.w, out.h, out.data, 3, hex('#2a2438'));
  // 확대본: 행마다 10칸씩 잘라서
  rows.forEach((r, ri) => {
    for (let c = 0; c * 10 * FRAME_W < r.w; c++) {
      const piece = new PixBuf(10 * FRAME_W, FRAME_H);
      for (let y = 0; y < FRAME_H; y++) for (let x = 0; x < 10 * FRAME_W; x++) piece.data[y * piece.w + x] = r.get(c * 10 * FRAME_W + x, y);
      writePng(`${OUT}/parts_${ri}_${c}.png`, piece.w, piece.h, piece.data, 5, hex('#2a2438'));
    }
  });
});

// 특정 조합 확대: PREVIEW_ZOOM='[{"i":209,"feat":{"horns":"curl"}},{"i":3,"spec":{"head":"turban"}}]'
test.skipIf(!process.env.PREVIEW_OUT || !process.env.PREVIEW_ZOOM)('preview zoom', () => {
  const list = JSON.parse(process.env.PREVIEW_ZOOM!) as { i: number; feat?: Partial<RaceLook>; spec?: Partial<LookSpec> }[];
  const specs = list.map(({ i, feat, spec }) => { const b0 = base(i); return { ...b0, ...spec, feat: { ...b0.feat, ...feat } } as LookSpec; });
  const b = new PixBuf(specs.length * FRAME_W, FRAME_H);
  specs.forEach((s, k) => b.blit(drawFrame(s, 'idle0'), k * FRAME_W, 0));
  writePng(`${OUT}/zoom.png`, b.w, b.h, b.data, 8, hex('#2a2438'));
});

// 종족별 견본 (종족마다 2명)
test.skipIf(!process.env.PREVIEW_OUT)('preview races', async () => {
  const { PLAYABLE_RACES } = await import('../../src/core/data/races');
  const races = PLAYABLE_RACES.map((r) => r.id);
  for (let c = 0; c * 10 < races.length; c++) {
    const chunk = races.slice(c * 10, c * 10 + 10);
    const b = new PixBuf(10 * FRAME_W, 2 * FRAME_H);
    chunk.forEach((r, i) => {
      for (let k = 0; k < 2; k++) {
        const ch = generateCharacter(3000 + i * 97 + k * 31 + c * 7, { now: 0, race: r, star: 4 });
        b.blit(drawFrame(lookFromCharacter(ch), 'idle0'), i * FRAME_W, k * FRAME_H);
      }
    });
    writePng(`${OUT}/races_${c}.png`, b.w, b.h, b.data, 5, hex('#2a2438'));
  }
  // 전 종족 한 장 (종족당 1명, 10열)
  const rows = Math.ceil(races.length / 10);
  const all = new PixBuf(10 * FRAME_W, rows * FRAME_H);
  races.forEach((r, i) => {
    const ch = generateCharacter(5100 + i * 37, { now: 0, race: r, star: 4 });
    all.blit(drawFrame(lookFromCharacter(ch), 'idle0'), (i % 10) * FRAME_W, Math.floor(i / 10) * FRAME_H);
  });
  writePng(`${OUT}/races_all.png`, all.w, all.h, all.data, 3, hex('#2a2438'));
});

// 지형 견본: 장애물 전부 + 배경 스타일별 한 장씩
test.skipIf(!process.env.PREVIEW_OUT)('preview env', async () => {
  const { drawObstacle } = await import('../../src/art/tiles');
  const { drawDungeonBackdrop, BG_W, BG_H } = await import('../../src/art/backdrops');
  const { BIOMES } = await import('../../src/core/data/biomes');
  const kinds = ['grave', 'pillar', 'rubble', 'coral', 'bones', 'candle', 'crystal', 'mushroom', 'tree', 'gear', 'ice', 'lava', 'cactus', 'crate', 'barrel', 'stalagmite', 'totem', 'statue', 'web', 'cage'] as const;
  const ob = new PixBuf(kinds.length * 32, 40);
  kinds.forEach((k, i) => ob.blit(drawObstacle(k, '#7fe3ff'), i * 32, 0));
  writePng(`${OUT}/obstacles.png`, ob.w, ob.h, ob.data, 4, hex('#3a3442'));
  const biomes = Object.values(BIOMES);
  const cols = 3;
  const sheet = new PixBuf(cols * BG_W, Math.ceil(biomes.length / cols) * BG_H);
  biomes.forEach((bm, i) => sheet.blit(drawDungeonBackdrop(bm.sky[0], bm.sky[1], bm.floor[0], bm.accent, i * 7 + 3, bm.style), (i % cols) * BG_W, Math.floor(i / cols) * BG_H));
  writePng(`${OUT}/backdrops.png`, sheet.w, sheet.h, sheet.data, 1, hex('#000000'));
});
