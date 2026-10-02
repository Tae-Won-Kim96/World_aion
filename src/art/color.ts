// 색 유틸리티: 0xRRGGBBAA 정수 표현

export type RGBA = number;

export function hex(h: string, a = 255): RGBA {
  let s = h.replace('#', '');
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  const n = parseInt(s.slice(0, 6), 16);
  return ((n << 8) | (a & 255)) >>> 0;
}

export function rgba(r: number, g: number, b: number, a = 255): RGBA {
  return (((r & 255) << 24) | ((g & 255) << 16) | ((b & 255) << 8) | (a & 255)) >>> 0;
}

export function channels(c: RGBA): [number, number, number, number] {
  return [(c >>> 24) & 255, (c >>> 16) & 255, (c >>> 8) & 255, c & 255];
}

export function toCss(c: RGBA): string {
  const [r, g, b, a] = channels(c);
  return `rgba(${r},${g},${b},${(a / 255).toFixed(3)})`;
}

export function toHex(c: RGBA): string {
  const [r, g, b] = channels(c);
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

export function mix(a: RGBA, b: RGBA, t: number): RGBA {
  const ca = channels(a);
  const cb = channels(b);
  return rgba(
    Math.round(ca[0] + (cb[0] - ca[0]) * t),
    Math.round(ca[1] + (cb[1] - ca[1]) * t),
    Math.round(ca[2] + (cb[2] - ca[2]) * t),
    Math.round(ca[3] + (cb[3] - ca[3]) * t),
  );
}

/** 그림자 쪽은 약간 푸른/보라 톤으로 (픽셀아트 hue-shift) */
export function darken(c: RGBA, t: number): RGBA {
  return mix(c, rgba(24, 16, 48, (c & 255)), t);
}

/** 밝은 쪽은 약간 노란 톤으로 */
export function lighten(c: RGBA, t: number): RGBA {
  return mix(c, rgba(255, 248, 220, (c & 255)), t);
}

export function withAlpha(c: RGBA, a: number): RGBA {
  return ((c & 0xffffff00) | (a & 255)) >>> 0;
}

/** [가장 어두움, 어두움, 기본, 밝음, 하이라이트] */
export function ramp(base: string | RGBA): [RGBA, RGBA, RGBA, RGBA, RGBA] {
  const c = typeof base === 'string' ? hex(base) : base;
  return [darken(c, 0.55), darken(c, 0.3), c, lighten(c, 0.28), lighten(c, 0.55)];
}

export function luminance(c: RGBA): number {
  const [r, g, b] = channels(c);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function desaturate(c: RGBA, t: number): RGBA {
  const [r, g, b, a] = channels(c);
  const l = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  return mix(c, rgba(l, l, l, a), t);
}
