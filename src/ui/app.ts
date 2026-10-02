import type Phaser from 'phaser';
import { store } from '../core/state';
import { clear, closeAllModals, uiRoot } from './dom';
import { renderRun } from './run';
import { renderTown } from './town';

export const app = {
  game: null as Phaser.Game | null,

  scene(key: string, data?: object): void {
    const g = this.game;
    if (!g) return;
    for (const s of g.scene.getScenes(true)) if (s.scene.key !== key) g.scene.stop(s.scene.key);
    g.scene.start(key, data);
  },

  route(): void {
    closeAllModals();
    const run = store.s.run;
    if (!run) {
      this.scene('town');
      renderTown();
      return;
    }
    if (run.phase === 'battle' && run.battle) {
      clear(uiRoot());
      this.scene('battle');
      return;
    }
    this.scene('dungeon', { dungeon: run.dungeon });
    renderRun();
  },
};

// 디버그/자동 테스트용
(globalThis as Record<string, unknown>).__app = app;
(globalThis as Record<string, unknown>).__store = store;
