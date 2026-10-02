import type Phaser from 'phaser';

export function idleAnim(scene: Phaser.Scene, texKey: string, rate = 2): string {
  const k = `${texKey}_idle`;
  if (!scene.anims.exists(k)) {
    scene.anims.create({ key: k, frames: [{ key: texKey, frame: 0 }, { key: texKey, frame: 1 }], frameRate: rate, repeat: -1 });
  }
  return k;
}

export function fxAnim(scene: Phaser.Scene, texKey: string, n: number, rate = 16): string {
  const k = `${texKey}_play`;
  if (!scene.anims.exists(k)) {
    scene.anims.create({ key: k, frames: Array.from({ length: n }, (_, i) => ({ key: texKey, frame: i })), frameRate: rate, repeat: 0 });
  }
  return k;
}
