import type { Params } from './types';

export interface Rect { l: number; t: number; w: number; h: number }

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export const cropRatio = (car: string) => (car === 'square' ? 1 : car === 'video' ? 16 / 9 : 0);

/** Top-left corner a gravity gives a w × h box inside sw × sh. Smart gravities sit at the centre. */
export function gravityOrigin(g: string, sw: number, sh: number, w: number, h: number): [number, number] {
  const rx = Math.max(0, sw - w);
  const ry = Math.max(0, sh - h);
  return [
    /left/.test(g) ? 0 : /right/.test(g) ? rx : Math.trunc(rx / 2),
    /top/.test(g) ? 0 : /bottom/.test(g) ? ry : Math.trunc(ry / 2),
  ];
}

/** The region picturium cuts, in source pixels. Mirrors `calculate_crop_rectangle` on the server. */
export function cropRect(p: Params, sw: number, sh: number): Rect {
  const ratio = cropRatio(p.car);
  let w: number;
  let h: number;
  if (p.cw && p.ch) { w = p.cw; h = p.ch; }
  else if (p.cw) { w = p.cw; h = ratio ? Math.round(w / ratio) : sh; }
  else if (p.ch) { h = p.ch; w = ratio ? Math.round(h * ratio) : sw; }
  else if (ratio) { [w, h] = sw / sh > ratio ? [Math.round(sh * ratio), sh] : [sw, Math.round(sw / ratio)]; }
  else { w = sw; h = sh; }
  w = clamp(w, 1, sw);
  h = clamp(h, 1, sh);
  const [x, y] = gravityOrigin(p.cg, sw, sh, w, h);
  return { l: clamp(x + p.cx, 0, sw - w), t: clamp(y + p.cy, 0, sh - h), w, h };
}

/** The crop values that place `r`; a smart gravity cannot hold a position, so it gives way to the centre. */
export function rectToCrop(r: Rect, p: Params, sw: number, sh: number): Partial<Params> {
  const cg = p.cg === 'attention' || p.cg === 'entropy' ? 'center' : p.cg;
  const [x, y] = gravityOrigin(cg, sw, sh, r.w, r.h);
  return { cropOn: true, cw: r.w, ch: r.h, cg, cx: r.l - x, cy: r.t - y };
}
