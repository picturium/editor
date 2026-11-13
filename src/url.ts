import type { Group, Params } from './types';

export interface Token { grp: Group; k: string; v: string; show?: string }

// percent-encode, but leave the separators picturium's sub-parameters are written with
const enc = (v: string | number) => encodeURIComponent(String(v)).replace(/%(3A|7C|2C|2F)/g, decodeURIComponent);
const num = (v: number) => String(Math.round(v * 100) / 100);
const hex = (c: string) => c.replace(/^#/, '');
const base64 = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s)));

const FILTERS: [keyof Params, number][] = [
  ['brightness', 1], ['contrast', 1], ['saturate', 1], ['hue', 0], ['grayscale', 0],
  ['sepia', 0], ['invert', 0], ['blur', 0], ['sharpen', 0], ['pixelate', 1],
];

/** The query parameters `p` asks for. `d` holds the server defaults, `sw` the source width. */
export function tokens(p: Params, d: Params, sw = 0): Token[] {
  const out: Token[] = [];
  const add = (grp: Group, k: string, v: string | number, show?: string) => { out.push({ grp, k, v: enc(v), show }); };

  if (p.original) {
    add('deliv', 'original', 'true');
  } else {
    if (p.cropOn) {
      const c: string[] = [];
      if (p.cw) c.push('w:' + p.cw);
      if (p.ch) c.push('h:' + p.ch);
      if (p.car !== 'auto') c.push('ar:' + p.car);
      if (p.cg !== d.cg) c.push('g:' + p.cg);
      if (p.cx) c.push('x:' + p.cx);
      if (p.cy) c.push('y:' + p.cy);
      // the server wants one of w, h or ar
      if (!p.cw && !p.ch && p.car === 'auto' && sw) c.unshift('w:' + sw);
      if (p.cw || p.ch || p.car !== 'auto' || sw) add('crop', 'crop', c.join('|'));
    }

    if (p.w) add('size', 'w', p.w);
    if (p.h) add('size', 'h', p.h);
    if (p.ar === 'square' || p.ar === 'video') add('size', 'ar', p.ar);
    if (p.ar === 'custom') add('size', 'ar', (p.arW || 1) + '/' + (p.arH || 1));
    if (p.fit !== d.fit) add('size', 'fit', p.fit);
    if (p.g !== d.g) add('size', 'g', p.g);
    if (p.dpr !== '1') add('size', 'dpr', p.dpr);
    if (p.scale !== 1) add('size', 'scale', num(p.scale));
    if (p.upsize !== d.upsize) add('size', 'upsize', String(p.upsize));
    if (p.resample !== d.resample) add('size', 'resample', p.resample);

    if (p.padT || p.padR || p.padB || p.padL) {
      const even = p.padT === p.padB && p.padL === p.padR;
      add('canvas', 'pad', even ? (p.padT === p.padL ? p.padT : p.padT + ',' + p.padR) : [p.padT, p.padR, p.padB, p.padL].join(','));
    }
    if (p.extend !== d.extend) add('canvas', 'extend', p.extend);
    if (!p.bgNone) add('canvas', 'bg', hex(p.bg));
    if (p.rot !== 'no') add('canvas', 'rot', p.rot);
    if (p.autorot !== d.autorot) add('canvas', 'autorot', String(p.autorot));

    const f = FILTERS.filter(([k, off]) => p[k] !== off).map(([k]) => k + ':' + num(p[k] as number));
    // the intensity is always written: without it the server reads an all-digit hex colour as the intensity
    if (p.palOn) f.push('palette:' + hex(p.palA) + (p.palDuo ? ',' + hex(p.palB) : '') + ',' + num(p.palI));
    if (f.length) add('filter', 'filter', f.join('|'));

    if (p.wmMode === 'off') add('mark', 'watermark', 'false');
    const image = p.wmMode === 'image' && p.wmImage;
    const text = p.wmMode === 'text' && p.wmText;
    if (image || text) {
      const m = [image ? 'image:' + p.wmImage : 'text:' + p.wmText];
      if (text) {
        if (p.wmFont !== d.wmFont) m.push('font:' + p.wmFont);
        if (p.wmSize !== d.wmSize) m.push('size:' + p.wmSize);
        if (p.wmColor !== d.wmColor) m.push('color:' + hex(p.wmColor));
      }
      if (p.wmAnchor !== d.wmAnchor) m.push('anchor:' + p.wmAnchor);
      if (p.wmOpacity !== d.wmOpacity) m.push('opacity:' + p.wmOpacity);
      if (p.wmPad) m.push('pad:' + p.wmPad);
      if (p.wmRot) m.push('rot:' + p.wmRot);
      if (image && p.wmScale !== 1) m.push('scale:' + num(p.wmScale));
      add('mark', 'watermark', m.join('|'));
    }

    if (p.f !== d.f) add('out', 'f', p.f);
    if (p.q === 'custom') add('out', 'q', p.qNum);
    else if (p.q !== d.q) add('out', 'q', p.q);
    if (p.meta.length) add('out', 'meta', p.meta.join(','));
    const lim: string[] = [];
    if (p.limDim) lim.push('dimension:' + p.limDim);
    if (p.limSize) lim.push('size:' + p.limSize);
    if (lim.length) add('out', 'limit', lim.join('|'));
    if (p.dlOn) add('out', 'download', p.dl || 'image');

    if (p.dpi) add('motion', 'dpi', p.dpi);
    if (p.style) {
      const b64 = base64(p.style);
      add('motion', 'style', b64, b64.length > 28 ? b64.slice(0, 28) + '…' : undefined);
    }
    if (p.page) add('motion', 'page', p.page);
    if (p.t) add('motion', 't', p.t);
    if (p.animMode === 'off') add('motion', 'anim', 'off');
    if (p.animMode === 'custom') {
      const an: string[] = [];
      if (p.frames) an.push('frames:' + p.frames);
      if (p.rate === 'fps' && p.fps) an.push('fps:' + p.fps);
      if (p.rate === 'timing' && p.timing) an.push('timing:' + p.timing);
      if (p.loop !== '') an.push('loop:' + p.loop);
      if (p.stride) an.push('stride:' + p.stride);
      if (an.length) add('motion', 'anim', an.join('|'));
    }
  }
  if (p.force) add('deliv', 'force', 'true');
  if (p.cache) add('deliv', 'cache', p.cache);
  if (p.fallback) add('deliv', 'fallback', p.fallback);
  return out;
}

export const query = (toks: Token[]) => toks.map((t) => t.k + '=' + t.v).join('&');

/** `server/path` with the path percent-encoded segment by segment. */
export const origin = (server: string, source: string) =>
  server.replace(/\/+$/, '') + '/' + source.replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/');

// A preview is a one-off render: `nocache` keeps it out of the server cache, and the
// parameters that only steer caching or the download header have nothing to show.
const PREVIEW_SKIP = ['force', 'cache', 'download'];
export const previewQuery = (toks: Token[]) =>
  [...toks.filter((t) => !PREVIEW_SKIP.includes(t.k)).map((t) => t.k + '=' + t.v), 'nocache=true'].join('&');

/** The source as the crop sees it: loaded, oriented and rotated, nothing else. */
const SOURCE_KEEP = ['rot', 'autorot', 'dpi', 'style', 'page', 't'];
export const sourceQuery = (toks: Token[]) =>
  [...toks.filter((t) => SOURCE_KEEP.includes(t.k)).map((t) => t.k + '=' + t.v), 'f=webp', 'nocache=true'].join('&');
