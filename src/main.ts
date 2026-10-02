import g11 from 'galmuri/dist/Galmuri11.woff2?url';
import g11b from 'galmuri/dist/Galmuri11-Bold.woff2?url';
import './ui/style.css';
import Phaser from 'phaser';
import { BattleScene } from './scenes/BattleScene';
import { DungeonScene } from './scenes/DungeonScene';
import { TownScene } from './scenes/TownScene';
import { app } from './ui/app';

const W = 1280;
const H = 720;

function fit(): void {
  const el = document.getElementById('app')!;
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  el.style.transform = `translate(${Math.round((window.innerWidth - W * s) / 2)}px, ${Math.round((window.innerHeight - H * s) / 2)}px) scale(${s})`;
  app.game?.scale.refresh();
}

async function boot(): Promise<void> {
  fit();
  window.addEventListener('resize', fit);
  try {
    const faces = [new FontFace('Galmuri11', `url(${g11})`, { weight: '400' }), new FontFace('Galmuri11', `url(${g11b})`, { weight: '700' })];
    await Promise.all(faces.map(async (f) => document.fonts.add(await f.load())));
  } catch {
    /* 폰트 로드 실패 시 기본 글꼴 */
  }
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: W,
    height: H,
    backgroundColor: '#000000',
    pixelArt: true,
    scale: { mode: Phaser.Scale.NONE },
    scene: [TownScene, DungeonScene, BattleScene],
    banner: false,
  } as Phaser.Types.Core.GameConfig);
  app.game = game;
  game.events.once('ready', () => {
    fit();
    app.route();
  });
}

void boot();
