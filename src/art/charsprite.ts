// 절차적 치비 픽셀 캐릭터 생성기 (32x40, 정면 3/4, 오른손에 무기)
// 레이어: 날개 → 망토 → 뒷머리 → 꼬리 → 다리 → 몸통 → 목도리 → 왼팔/보조장비 → 머리 → 피부무늬 → 옆귀
//        → 얼굴 → 얼굴 액세서리 → 수염 → 앞머리/볏 → 윗귀 → 모자 → 뿔/후광 → 머리장식 → 오른팔/무기
//        → 외곽선 → 오라 → 반투명 → 그림자
import { darken, desaturate, hex, lighten, mix, ramp, type RGBA, withAlpha } from './color';
import type { LookSpec } from './look';
import { PixBuf } from './pixbuf';
import { drawFaceAccessories, drawOrnaments, drawScarf } from './parts/accessory';
import { drawCape, drawLeftArm, drawLegs, drawRightArm, drawSerpentCoil, drawTail, drawTorso, drawWings } from './parts/body';
import { FRAME_H, FRAME_W, geometry, type Pose, POSES, type Ramp, type Ramps } from './parts/common';
import { applySkinPattern, drawBackHair, drawBeard, drawChestHead, drawFace, drawFrontHair, drawHeadShape, drawHornsHalo, drawSideEars, drawTopEars } from './parts/head';
import { coversFace, drawHeadgear } from './parts/headgear';
import { drawOffhand, drawWeapon } from './parts/weapons';

export { FRAME_H, FRAME_W, POSES };
export type { Pose };

function makeRamps(spec: LookSpec): Ramps {
  let skin = spec.skin.map((h) => hex(h)) as RGBA[];
  // 세계핵과 결속한 자는 피부가 약간 창백하고 차가워진다
  if (spec.bound) skin = skin.map((c) => mix(lighten(desaturate(c, 0.2), 0.05), hex('#bfeff5'), 0.06));
  const kr: Ramp = [darken(skin[1], 0.35), skin[1], skin[0], skin[2], lighten(skin[2], 0.4)];
  return {
    kr,
    hr: ramp(spec.hair),
    M: ramp(spec.main),
    A: ramp(spec.accent),
    T: ramp(spec.trim),
    X: ramp(spec.metal ?? '#a9b2c3'),
    W: ramp(spec.wood ?? '#8a5a33'),
  };
}

/** 바깥쪽 1픽셀 발광 */
function glowRing(b: PixBuf, color: RGBA): void {
  const src = b.data.slice();
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= b.w || y >= b.h ? 0 : src[y * b.w + x]);
  for (let y = 0; y < b.h - 1; y++) {
    for (let x = 0; x < b.w; x++) {
      if (src[y * b.w + x] !== 0) continue;
      if (at(x + 1, y) || at(x - 1, y) || at(x, y + 1) || at(x, y - 1)) b.data[y * b.w + x] = withAlpha(color, 120);
    }
  }
}

export function drawFrame(spec: LookSpec, pose: Pose): PixBuf {
  const b = new PixBuf(FRAME_W, FRAME_H);
  const g = geometry(spec, pose);
  const R = makeRamps(spec);
  const hideFace = coversFace(spec.head);

  drawWings(b, spec, g, R);
  drawCape(b, spec, g);
  if (!hideFace) drawBackHair(b, spec, g, R);
  drawTail(b, spec, g, R);
  drawLegs(b, spec, g, R);
  drawTorso(b, spec, g, R);
  drawSerpentCoil(b, spec, g);
  drawScarf(b, spec, g, R);
  drawLeftArm(b, spec, g, R);
  drawOffhand(b, spec, g, R);
  if (spec.feat.chestHead) {
    applySkinPattern(b, spec, g, R);
    drawChestHead(b, spec, g, R);
  } else {
    drawHeadShape(b, spec, g, R);
    applySkinPattern(b, spec, g, R);
    drawSideEars(b, spec, g, R);
    if (!hideFace) {
      drawFace(b, spec, g, R);
      drawFaceAccessories(b, spec, g, R);
      drawBeard(b, spec, g, R);
      drawFrontHair(b, spec, g, R);
    }
    drawTopEars(b, spec, g, R);
    drawHeadgear(b, spec, g, R);
    drawHornsHalo(b, spec, g);
    drawOrnaments(b, spec, g, R);
  }
  drawRightArm(b, spec, g, R);
  drawWeapon(b, spec, g, R);

  b.outline(0.7);
  if (spec.feat.aura) glowRing(b, hex(spec.feat.aura));
  if (spec.feat.translucent) {
    for (let i = 0; i < b.data.length; i++) {
      const c = b.data[i];
      if (c !== 0) b.data[i] = withAlpha(c, Math.min(c & 255, 190));
    }
  }
  // 발밑 그림자
  const sh = hex('#000000', 70);
  for (let x = 10; x <= 21; x++) if (b.get(x, 39) === 0) b.set(x, 39, sh);
  return b;
}

/** 5프레임 가로 스프라이트시트 */
export function drawSheet(spec: LookSpec): PixBuf {
  const sheet = new PixBuf(FRAME_W * POSES.length, FRAME_H);
  POSES.forEach((p, i) => sheet.blit(drawFrame(spec, p), i * FRAME_W, 0));
  return sheet;
}
