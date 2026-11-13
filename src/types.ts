import type { Messages } from './i18n';

export type Group = 'crop' | 'size' | 'canvas' | 'filter' | 'mark' | 'out' | 'motion' | 'deliv';

/** Everything the panels edit. Zero and the empty string mean "not set". */
export interface Params {
  cropOn: boolean; cw: number; ch: number; car: string; cg: string; cx: number; cy: number;
  w: number; h: number; ar: string; arW: number; arH: number; fit: string; g: string;
  dpr: string; scale: number; upsize: boolean; resample: string;
  padT: number; padR: number; padB: number; padL: number; padLink: boolean;
  extend: string; bgNone: boolean; bg: string; rot: string; autorot: boolean;
  brightness: number; contrast: number; saturate: number; hue: number; grayscale: number;
  sepia: number; invert: number; blur: number; sharpen: number; pixelate: number;
  palOn: boolean; palDuo: boolean; palA: string; palB: string; palI: number;
  wmMode: string; wmImage: string; wmText: string; wmAnchor: string; wmOpacity: number;
  wmPad: number; wmRot: number; wmScale: number; wmFont: string; wmSize: number; wmColor: string;
  f: string; q: string; qNum: number; meta: string[]; limDim: string; limSize: string;
  dlOn: boolean; dl: string;
  dpi: string; page: string; t: string; style: string; animMode: string; frames: string;
  stride: string; rate: string; fps: string; timing: string; loop: string;
  original: boolean; force: boolean; cache: string; fallback: string; sign: boolean;
}

/** A single control inside a group; the keys it owns are listed in params.ts. */
export type Control =
  | 'crop.region' | 'crop.ar' | 'crop.gravity' | 'crop.offset'
  | 'size.dimensions' | 'size.ar' | 'size.fit' | 'size.gravity' | 'size.dpr' | 'size.scale' | 'size.resample' | 'size.upsize'
  | 'canvas.pad' | 'canvas.extend' | 'canvas.bg' | 'canvas.rot' | 'canvas.autorot'
  | 'filter.brightness' | 'filter.contrast' | 'filter.saturate' | 'filter.hue' | 'filter.blur' | 'filter.sharpen'
  | 'filter.pixelate' | 'filter.grayscale' | 'filter.sepia' | 'filter.invert' | 'filter.palette'
  | 'mark.source' | 'mark.anchor' | 'mark.pad' | 'mark.opacity' | 'mark.rot' | 'mark.scale'
  | 'out.format' | 'out.quality' | 'out.meta' | 'out.limit' | 'out.download'
  | 'motion.page' | 'motion.time' | 'motion.dpi' | 'motion.style' | 'motion.anim'
  | 'deliv.original' | 'deliv.force' | 'deliv.cache' | 'deliv.fallback' | 'deliv.sign';

/**
 * Something an admin can switch off: a whole group, one control, or a piece of chrome.
 * `theme` is the light/dark toggle, `url` the URL preview in the dock, `copy` the copy
 * button, `compare` the before/after slider, `source` the source path in the top bar.
 */
export type Feature = Group | Control | 'theme' | 'url' | 'copy' | 'compare' | 'source';

export interface EditorOptions {
  /** Base URL of the picturium server, e.g. `https://media.example.com`. */
  server: string;
  /** Path of the source file under the server's data directory. */
  source: string;
  /** `en`, `de`, `sk`, `cs` or `es`. Defaults to the browser language, then English. */
  locale?: string;
  /** Replace individual strings of the active locale, or supply a whole new one. */
  messages?: Partial<Messages>;
  /** `auto` follows the operating system. Disable the `theme` feature to lock it. */
  theme?: 'dark' | 'light' | 'auto';
  /** Image URL of the logo, or `false` for none. */
  logo?: string | false;
  /** Text next to the logo, or `false` for none. Defaults to the translated "Editor". */
  title?: string | false;
  /** Groups, controls and chrome to hide. Hidden controls keep their `initial` value. */
  disable?: Feature[];
  /** Print picturium's parameter names (`w, h`, `fit`…) next to the labels, for people who write URLs by hand. Default false. */
  keys?: boolean;
  /** Output formats on offer, in order. */
  formats?: string[];
  /** Values the server applies on its own (its config.toml); they are left out of the URL. */
  defaults?: Partial<Params>;
  /** Values the editor opens with. */
  initial?: Partial<Params>;
  /** Group the editor opens on. */
  section?: Group;
  /** Milliseconds a value has to rest before a preview is requested. Default 250. */
  previewDelay?: number;
  /**
   * Signs a URL. Receives exactly what picturium signs, `path?query` without the
   * token, and returns the hex HMAC. The "Sign the URL" switch needs this.
   */
  sign?: (payload: string) => string | Promise<string>;
  /** "Use image" was pressed. Without it the button is not shown. */
  onUse?: (url: string, params: Params) => void;
  /** The close button was pressed. Without it the button is not shown. */
  onClose?: () => void;
  /** The URL changed (unsigned). */
  onChange?: (url: string, params: Params) => void;
}

export interface Editor {
  /** The current URL, without a signature. */
  url(): string;
  /** Change options in place; the edited values are kept. */
  update(options: Partial<EditorOptions>): void;
  destroy(): void;
}
