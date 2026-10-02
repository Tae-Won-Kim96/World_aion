// 생성된 픽셀 버퍼 → 캔버스/데이터URL/Phaser 텍스처 캐시
import { drawSheet, FRAME_H, FRAME_W, POSES } from './charsprite';
import type { LookSpec } from './look';
import type { PixBuf } from './pixbuf';

const canvasCache = new Map<string, HTMLCanvasElement>();
const urlCache = new Map<string, string>();

export function bufToCanvas(buf: PixBuf): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = buf.w;
  c.height = buf.h;
  c.getContext('2d')!.putImageData(buf.toImageData(), 0, 0);
  return c;
}

export function sheetCanvas(spec: LookSpec): HTMLCanvasElement {
  let c = canvasCache.get(spec.key);
  if (!c) {
    c = bufToCanvas(drawSheet(spec));
    canvasCache.set(spec.key, c);
  }
  return c;
}

export function sheetUrl(spec: LookSpec): string {
  let u = urlCache.get(spec.key);
  if (!u) {
    u = sheetCanvas(spec).toDataURL();
    urlCache.set(spec.key, u);
  }
  return u;
}

/** DOM용 애니메이션 스프라이트 (idle 2프레임) */
export function spriteEl(spec: LookSpec, scale = 3, opts: { still?: boolean; className?: string } = {}): HTMLDivElement {
  const d = document.createElement('div');
  d.className = `spr${opts.still ? '' : ' spr-anim'}${opts.className ? ' ' + opts.className : ''}`;
  d.style.setProperty('--s', String(scale));
  d.style.backgroundImage = `url(${sheetUrl(spec)})`;
  d.style.animationDelay = `${-Math.random() * 1.2}s`;
  return d;
}

export function bufUrl(key: string, make: () => PixBuf): string {
  let u = urlCache.get(key);
  if (!u) {
    u = bufToCanvas(make()).toDataURL();
    urlCache.set(key, u);
  }
  return u;
}

interface TexLike {
  exists(key: string): boolean;
  addCanvas(key: string, c: HTMLCanvasElement): { add(name: number | string, src: number, x: number, y: number, w: number, h: number): unknown } | null;
}

/** Phaser 텍스처로 등록. 프레임 0..4 = POSES */
export function ensureSheetTexture(textures: TexLike, spec: LookSpec): string {
  const key = spec.key;
  if (!textures.exists(key)) {
    const tex = textures.addCanvas(key, sheetCanvas(spec));
    if (tex) POSES.forEach((_, i) => tex.add(i, 0, i * FRAME_W, 0, FRAME_W, FRAME_H));
  }
  return key;
}

export function ensureBufTexture(textures: TexLike, key: string, make: () => PixBuf, frames?: { w: number; h: number; n: number }): string {
  if (!textures.exists(key)) {
    const c = bufToCanvas(make());
    const tex = textures.addCanvas(key, c);
    if (tex && frames) for (let i = 0; i < frames.n; i++) tex.add(i, 0, i * frames.w, 0, frames.w, frames.h);
  }
  return key;
}
