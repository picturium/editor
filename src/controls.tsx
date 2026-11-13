import type { ComponentChildren } from 'preact';
import { useId } from 'preact/hooks';
import type { Translate } from './i18n';
import { GRAVITY } from './params';
import type { Feature, Group, Params } from './types';

/** What every control needs: the values, a way to change them, copy and feature switches. */
export interface Ctx {
  p: Params;
  /** Change values. `tok` names the URL parameter that flashes in the dock. */
  set: (patch: Partial<Params>, tok?: string) => void;
  reset: (group: Group) => void;
  t: Translate;
  num: (v: number) => string;
  on: (feature: Feature) => boolean;
  formats: string[];
  canSign: boolean;
  /** Source size in pixels, 0 until the source has loaded. */
  sw: number;
  sh: number;
}

type KeysOf<T> = { [K in keyof Params]: Params[K] extends T ? K : never }[keyof Params];
type Opt = string | [value: string, label: string];
interface Bound<K> { c: Ctx; k: K; tok: string; also?: Partial<Params> }

const one = (k: keyof Params, v: Params[keyof Params]) => ({ [k]: v }) as Partial<Params>;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function Grp({ label, hint, val, wide, id, children }: {
  label: string; hint?: string; val?: string; wide?: boolean; id?: string; children?: ComponentChildren;
}) {
  return (
    <div class={'pe-grp' + (wide ? ' pe-wide' : '')}>
      <div class="pe-gh">
        {id ? <label class="pe-lab" for={id}>{label}</label> : <span class="pe-lab">{label}</span>}
        {hint && <span class="pe-key">{hint}</span>}
        {val != null && <span class="pe-val">{val}</span>}
      </div>
      {children}
    </div>
  );
}

export function Slider({ c, k, tok, label, min, max, step, unit = '', hint = k, spectrum }: Bound<KeysOf<number>> & {
  label: string; min: number; max: number; step: number; unit?: string; hint?: string; spectrum?: boolean;
}) {
  const id = useId();
  const v = c.p[k];
  const frac = clamp((v - min) / (max - min), 0, 1).toFixed(4);
  return (
    <div class="pe-row">
      <div class="pe-gh">
        <label class="pe-lab" for={id}>{label}</label>
        <span class="pe-key">{hint}</span>
        <output class="pe-val">{c.num(v) + unit}</output>
      </div>
      <div class={'pe-range' + (spectrum ? ' spectrum' : '')}>
        <span class="pe-range-track"><span class="pe-range-fill" style={{ width: `calc(7px + (100% - 14px) * ${frac})` }} /></span>
        <input id={id} type="range" min={min} max={max} step={step} value={v}
          onInput={(e) => c.set(one(k, Number(e.currentTarget.value)), tok)} />
      </div>
    </div>
  );
}

export function Seg({ c, k, tok, also, opts, aria, mod = '' }: Bound<KeysOf<string>> & { opts: Opt[]; aria: string; mod?: string }) {
  return (
    <div class={'pe-seg ' + mod} role="group" aria-label={aria}>
      {opts.map((o) => {
        const [val, label] = typeof o === 'string' ? [o, o] : o;
        const on = c.p[k] === val;
        return (
          <button type="button" key={val} class={on ? 'on' : ''} aria-pressed={on} onClick={() => c.set({ ...one(k, val), ...also }, tok)}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** Nine-point gravity pad. */
export function Pad({ c, k, tok, also, aria }: Bound<KeysOf<string>> & { aria: string }) {
  return (
    <div class="pe-pad" role="group" aria-label={aria}>
      {GRAVITY.map((g) => (
        <button type="button" key={g} class={c.p[k] === g ? 'on' : ''} aria-label={c.t(`grav.${g}`)} aria-pressed={c.p[k] === g}
          onClick={() => c.set({ ...one(k, g), ...also }, tok)} />
      ))}
    </div>
  );
}

interface FieldProps { pre?: string; unit?: string; aria?: string; ph?: string; id?: string; min?: number; max?: number }

/** Whole-number field; an empty field is 0, which every numeric value treats as "not set". */
export function Num({ c, k, tok, also, pre, unit, aria, ph, id, min, max }: Bound<KeysOf<number>> & FieldProps) {
  return (
    <label class="pe-field">
      {pre && <span class="pre">{pre}</span>}
      <input id={id} type="number" min={min} max={max} placeholder={ph} aria-label={aria} value={c.p[k] || ''}
        onInput={(e) => c.set({ ...one(k, Math.max(min ?? -Infinity, Math.round(Number(e.currentTarget.value)) || 0)), ...also }, tok)} />
      {unit && <span class="u">{unit}</span>}
    </label>
  );
}

export function Txt({ c, k, tok, also, pre, unit, aria, ph, id, min, max, type = 'text' }: Bound<KeysOf<string>> & FieldProps & { type?: 'text' | 'number' }) {
  return (
    <label class="pe-field">
      {pre && <span class="pre">{pre}</span>}
      <input id={id} type={type as 'text'} min={min} max={max} spellcheck={false} placeholder={ph} aria-label={aria} value={c.p[k]}
        onInput={(e) => c.set({ ...one(k, e.currentTarget.value), ...also }, tok)} />
      {unit && <span class="u">{unit}</span>}
    </label>
  );
}

/** `also` is applied only when the switch turns on. */
export function Switch({ c, k, tok, also, label, hint = '' }: Bound<KeysOf<boolean>> & { label: string; hint?: string }) {
  const on = c.p[k];
  return (
    <button type="button" role="switch" aria-checked={on} class={'pe-swrow' + (on ? ' on' : '')}
      onClick={() => c.set({ ...one(k, !on), ...(on ? null : also) }, tok)}>
      <span class="pe-lab">{label}</span><span class="pe-key">{hint}</span><span class="pe-sw" />
    </button>
  );
}

/** Swatch plus free text: picturium takes any CSS colour, the swatch only speaks hex. */
export function Color({ c, k, tok, also, label }: Bound<KeysOf<string>> & { label: string }) {
  const v = c.p[k];
  const set = (e: { currentTarget: HTMLInputElement }) => c.set({ ...one(k, e.currentTarget.value), ...also }, tok);
  return (
    <div class="pe-inline">
      <input class="pe-color" type="color" value={/^#[0-9a-f]{6}$/i.test(v) ? v : '#000000'} onInput={set} aria-label={label} />
      <label class="pe-field" style="flex: 1">
        <input type="text" spellcheck={false} value={v} onInput={set} aria-label={`${label}, ${c.t('common.value')}`} />
      </label>
    </div>
  );
}
