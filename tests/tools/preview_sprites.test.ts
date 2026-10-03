import { test } from 'vitest';
import { generateCharacter } from '../../src/core/gen/character';
import { lookFromCharacter, lookFromEnemy } from '../../src/art/look';
import { drawFrame, drawSheet, FRAME_W, FRAME_H } from '../../src/art/charsprite';
import { PixBuf } from '../../src/art/pixbuf';
import { ENEMIES } from '../../src/core/data/enemies';
import { writePng } from './png';
import { hex } from '../../src/art/color';

const OUT = process.env.PREVIEW_OUT ?? '/tmp';

test.skipIf(!process.env.PREVIEW_OUT)('preview sprites', () => {
  const cols = 10, rows = 4;
  const sheet = new PixBuf(cols * FRAME_W, rows * FRAME_H);
  for (let i = 0; i < cols * rows; i++) {
    const ch = generateCharacter(1000 + i * 7777, { now: 0, star: (1 + (i % 5)) as 1 });
    sheet.blit(drawFrame(lookFromCharacter(ch), 'idle0'), (i % cols) * FRAME_W, Math.floor(i / cols) * FRAME_H);
  }
  writePng(`${OUT}/sprites_chars.png`, sheet.w, sheet.h, sheet.data, 4, hex('#2a2438'));

  const ens = Object.values(ENEMIES);
  const COLS = 20;
  const es = new PixBuf(COLS * FRAME_W, Math.ceil(ens.length / COLS) * FRAME_H);
  ens.forEach((e, i) => es.blit(drawFrame(lookFromEnemy(e, 3), 'idle0'), (i % COLS) * FRAME_W, Math.floor(i / COLS) * FRAME_H));
  writePng(`${OUT}/sprites_enemies.png`, es.w, es.h, es.data, 2, hex('#2a2438'));

  const ch = generateCharacter(424242, { now: 0, star: 4 });
  const sh = drawSheet(lookFromCharacter(ch));
  writePng(`${OUT}/sprites_anim.png`, sh.w, sh.h, sh.data, 6, hex('#2a2438'));
});
