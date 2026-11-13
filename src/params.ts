import type { Control, Group, Params } from './types';

export const GROUPS: Group[] = ['crop', 'size', 'canvas', 'filter', 'mark', 'out', 'motion', 'deliv'];

export const GRAVITY = ['top-left', 'top', 'top-right', 'left', 'center', 'right', 'bottom-left', 'bottom', 'bottom-right'] as const;

export const FORMATS = ['auto', 'jpg', 'png', 'webp', 'gif', 'avif', 'jxl', 'pdf', 'svg'];

/** picturium's built-in defaults: a value equal to its default adds nothing to the URL. */
export const DEFAULTS: Params = {
  cropOn: false, cw: 0, ch: 0, car: 'auto', cg: 'center', cx: 0, cy: 0,
  w: 0, h: 0, ar: 'auto', arW: 16, arH: 10, fit: 'cover', g: 'center', dpr: '1', scale: 1, upsize: false, resample: 'lanczos3',
  padT: 0, padR: 0, padB: 0, padL: 0, padLink: true, extend: 'bg', bgNone: true, bg: '#11141a', rot: 'no', autorot: true,
  brightness: 1, contrast: 1, saturate: 1, hue: 0, grayscale: 0, sepia: 0, invert: 0, blur: 0, sharpen: 0, pixelate: 1,
  palOn: false, palDuo: true, palA: '#1b1f3b', palB: '#ffd633', palI: 1,
  wmMode: 'config', wmImage: '', wmText: '', wmAnchor: 'bottom-right', wmOpacity: 50, wmPad: 0, wmRot: 0, wmScale: 1,
  wmFont: 'Arial', wmSize: 12, wmColor: '#000000',
  f: 'auto', q: 'medium', qNum: 82, meta: [], limDim: '', limSize: '', dlOn: false, dl: '',
  dpi: '', page: '', t: '', style: '', animMode: 'source', frames: '', stride: '', rate: 'fps', fps: '12', timing: '80', loop: '',
  original: false, force: false, cache: '', fallback: '', sign: false,
};

/** The values each control owns; "Reset" clears exactly these, for the controls on show. */
export const KEYS: Record<Control, (keyof Params)[]> = {
  'crop.region': ['cropOn', 'cw', 'ch'], 'crop.ar': ['car'], 'crop.gravity': ['cg'], 'crop.offset': ['cx', 'cy'],
  'size.dimensions': ['w', 'h'], 'size.ar': ['ar', 'arW', 'arH'], 'size.fit': ['fit'], 'size.gravity': ['g'],
  'size.dpr': ['dpr'], 'size.scale': ['scale'], 'size.resample': ['resample'], 'size.upsize': ['upsize'],
  'canvas.pad': ['padT', 'padR', 'padB', 'padL', 'padLink'], 'canvas.extend': ['extend'], 'canvas.bg': ['bgNone', 'bg'],
  'canvas.rot': ['rot'], 'canvas.autorot': ['autorot'],
  'filter.brightness': ['brightness'], 'filter.contrast': ['contrast'], 'filter.saturate': ['saturate'], 'filter.hue': ['hue'],
  'filter.blur': ['blur'], 'filter.sharpen': ['sharpen'], 'filter.pixelate': ['pixelate'], 'filter.grayscale': ['grayscale'],
  'filter.sepia': ['sepia'], 'filter.invert': ['invert'], 'filter.palette': ['palOn', 'palDuo', 'palA', 'palB', 'palI'],
  'mark.source': ['wmMode', 'wmImage', 'wmText', 'wmFont', 'wmSize', 'wmColor'], 'mark.anchor': ['wmAnchor'],
  'mark.pad': ['wmPad'], 'mark.opacity': ['wmOpacity'], 'mark.rot': ['wmRot'], 'mark.scale': ['wmScale'],
  'out.format': ['f'], 'out.quality': ['q', 'qNum'], 'out.meta': ['meta'], 'out.limit': ['limDim', 'limSize'], 'out.download': ['dlOn', 'dl'],
  'motion.page': ['page'], 'motion.time': ['t'], 'motion.dpi': ['dpi'], 'motion.style': ['style'],
  'motion.anim': ['animMode', 'frames', 'stride', 'rate', 'fps', 'timing', 'loop'],
  'deliv.original': ['original'], 'deliv.force': ['force'], 'deliv.cache': ['cache'], 'deliv.fallback': ['fallback'], 'deliv.sign': ['sign'],
};
