import type { JSX } from 'preact';
import { useId } from 'preact/hooks';
import { Color, type Ctx, Grp, Num, Pad, Seg, Slider, Switch, Txt } from './controls';
import { cropRatio } from './crop';
import type { MessageKey, Translate } from './i18n';
import { GRAVITY } from './params';
import type { Group } from './types';

type Panel = (props: { c: Ctx }) => JSX.Element;
type OptKey = MessageKey extends infer K ? (K extends `opt.${infer Name}` ? Name : never) : never;

// The URL speaks picturium (`fit=cover`); the buttons speak the user's language.
const named = (t: Translate, ...values: OptKey[]): [string, string][] => values.map((v) => [v, t(`opt.${v}`)]);

/** Readable name of a gravity or anchor value. */
const place = (t: Translate, v: string) =>
  (GRAVITY as readonly string[]).includes(v) ? t(`grav.${v}` as MessageKey) : v === 'repeat' ? t('mark.repeat') : t(`opt.${v}` as MessageKey);

const FORMAT_NAME: Record<string, string> = { webp: 'WebP', jxl: 'JPEG XL' };
const META_NAME: Record<string, MessageKey> = { icc: 'meta.icc', exif: 'meta.exif', other: 'meta.other', gainmap: 'meta.gainmap', all: 'meta.all' };

function Crop({ c }: { c: Ctx }) {
  const { t, p } = c;
  const also = { cropOn: true };
  // switching the crop on with nothing set starts from a centred region that is worth dragging
  const start = !p.cw && !p.ch && p.car === 'auto' && c.sw ? { cw: Math.round(c.sw * 0.8), ch: Math.round(c.sh * 0.8) } : undefined;
  // the server ignores `ar` once both sides are given, so picking a ratio reshapes the region to it
  const shaped: Ctx = {
    ...c,
    set: (patch, tok) => {
      const ratio = cropRatio(patch.car ?? 'auto');
      if (ratio && (p.cw || p.ch) && c.sw) {
        const w = Math.min(p.cw || c.sw, Math.round(c.sh * ratio));
        Object.assign(patch, { cw: w, ch: Math.round(w / ratio) });
      }
      c.set(patch, tok);
    },
  };
  return (
    <>
      <Switch c={c} k="cropOn" tok="crop" also={start} label={t('crop.on')} hint="crop" />
      {c.on('crop.region') && (
        <Grp label={t('crop.region')} hint="w, h">
          <div class="pe-2">
            <Num c={c} k="cw" tok="crop" also={also} pre={t('field.w')} unit="px" min={0} ph={t('ph.full')} aria={t('crop.w')} />
            <Num c={c} k="ch" tok="crop" also={also} pre={t('field.h')} unit="px" min={0} ph={t('ph.full')} aria={t('crop.h')} />
          </div>
        </Grp>
      )}
      {c.on('crop.ar') && (
        <Grp label={t('common.ar')} hint="ar">
          <Seg c={shaped} k="car" tok="crop" also={also} opts={[...named(t, 'auto', 'square'), ['video', '16:9']]} aria={t('common.ar')} mod="wrap" />
        </Grp>
      )}
      {c.on('crop.gravity') && (
        <Grp label={t('common.gravity')} hint="g" val={place(t, p.cg)}>
          <div class="pe-grav">
            <Pad c={c} k="cg" tok="crop" also={also} aria={t('common.gravity')} />
            <Seg c={c} k="cg" tok="crop" also={also} opts={named(t, 'attention', 'entropy')} aria={t('common.smart')} mod="col" />
          </div>
        </Grp>
      )}
      {c.on('crop.offset') && (
        <Grp label={t('crop.offset')} hint="x, y">
          <div class="pe-2">
            <Num c={c} k="cx" tok="crop" also={also} pre="X" unit="px" ph="0" aria={t('crop.x')} />
            <Num c={c} k="cy" tok="crop" also={also} pre="Y" unit="px" ph="0" aria={t('crop.y')} />
          </div>
        </Grp>
      )}
      <p class="pe-hint pe-wide">{t('crop.hint')}</p>
    </>
  );
}

function Size({ c }: { c: Ctx }) {
  const { t, p } = c;
  return (
    <>
      {c.on('size.dimensions') && (
        <Grp label={t('size.dimensions')} hint="w, h">
          <div class="pe-2">
            <Num c={c} k="w" tok="w" pre={t('field.w')} unit="px" min={0} max={65535} ph={t('ph.auto')} aria={t('size.w')} />
            <Num c={c} k="h" tok="h" pre={t('field.h')} unit="px" min={0} max={65535} ph={t('ph.auto')} aria={t('size.h')} />
          </div>
        </Grp>
      )}
      {c.on('size.ar') && (
        <Grp label={t('common.ar')} hint="ar">
          <Seg c={c} k="ar" tok="ar" opts={[...named(t, 'auto', 'square'), ['video', '16:9'], ...named(t, 'custom')]} aria={t('common.ar')} mod="wrap" />
          {p.ar === 'custom' && (
            <div class="pe-2">
              <Num c={c} k="arW" tok="ar" unit={t('size.wide')} min={1} aria={t('size.arW')} />
              <Num c={c} k="arH" tok="ar" unit={t('size.tall')} min={1} aria={t('size.arH')} />
            </div>
          )}
        </Grp>
      )}
      {c.on('size.fit') && (
        <Grp label={t('size.fit')} hint="fit">
          <Seg c={c} k="fit" tok="fit" opts={named(t, 'cover', 'contain', 'force')} aria={t('size.fit')} mod="wrap" />
        </Grp>
      )}
      {c.on('size.gravity') && (
        <Grp label={t('common.gravity')} hint="g" val={place(t, p.g)}>
          <div class="pe-grav">
            <Pad c={c} k="g" tok="g" aria={t('common.gravity')} />
            <Seg c={c} k="g" tok="g" opts={named(t, 'attention', 'entropy')} aria={t('common.smart')} mod="col" />
          </div>
        </Grp>
      )}
      {c.on('size.dpr') && (
        <Grp label={t('size.dpr')} hint="dpr">
          <Seg c={c} k="dpr" tok="dpr" opts={[['1', '1×'], ['1.5', '1.5×'], ['2', '2×'], ['3', '3×']]} aria={t('size.dpr')} />
        </Grp>
      )}
      {c.on('size.scale') && (
        <div class="pe-rows">
          <Slider c={c} k="scale" tok="scale" label={t('size.scale')} min={0.1} max={3} step={0.05} unit="×" />
        </div>
      )}
      {c.on('size.resample') && (
        <Grp label={t('size.resample')} hint="resample" wide>
          <Seg c={c} k="resample" tok="resample" opts={[...named(t, 'nearest', 'linear', 'cubic'), ['lanczos2', 'Lanczos 2'], ['lanczos3', 'Lanczos 3']]} aria={t('size.resample')} mod="wrap" />
        </Grp>
      )}
      {c.on('size.upsize') && <Switch c={c} k="upsize" tok="upsize" label={t('size.upsize')} hint="upsize" />}
    </>
  );
}

function Canvas({ c }: { c: Ctx }) {
  const { t, p } = c;
  const even = p.padT === p.padB && p.padL === p.padR && p.padT === p.padL;
  const side = (k: 'padT' | 'padR' | 'padB' | 'padL', pre: string) => (
    <label class="pe-field">
      <span class="pre">{pre}</span>
      <input type="number" min="0" placeholder="0" aria-label={t(`canvas.${k}`)} value={p[k] || ''}
        onInput={(e) => {
          const v = Math.max(0, Math.round(Number(e.currentTarget.value)) || 0);
          c.set(p.padLink ? { padT: v, padR: v, padB: v, padL: v } : { [k]: v }, 'pad');
        }} />
    </label>
  );
  return (
    <>
      {c.on('canvas.pad') && (
        <Grp label={t('canvas.pad')} hint="pad" val={even ? p.padT + ' px' : [p.padT, p.padR, p.padB, p.padL].join(', ')} wide>
          <div class="pe-2">{side('padT', t('field.top'))}{side('padR', t('field.right'))}{side('padB', t('field.bottom'))}{side('padL', t('field.left'))}</div>
          <Switch c={c} k="padLink" tok="pad" also={{ padR: p.padT, padB: p.padT, padL: p.padT }} label={t('canvas.padLink')} />
        </Grp>
      )}
      {c.on('canvas.extend') && (
        <Grp label={t('canvas.extend')} hint="extend">
          <Seg c={c} k="extend" tok="extend" opts={[['bg', t('opt.background')], ...named(t, 'copy', 'repeat', 'mirror')]} aria={t('canvas.extend')} mod="wrap" />
        </Grp>
      )}
      {c.on('canvas.bg') && (
        <Grp label={t('canvas.bg')} hint="bg">
          <Switch c={c} k="bgNone" tok="bg" label={t('canvas.bgNone')} />
          <Color c={c} k="bg" tok="bg" also={{ bgNone: false }} label={t('canvas.bg')} />
          <p class="pe-hint">{t('canvas.bgHint')}</p>
        </Grp>
      )}
      {c.on('canvas.rot') && (
        <Grp label={t('canvas.rot')} hint="rot">
          <Seg c={c} k="rot" tok="rot" opts={[['no', t('opt.none')], ['90', '90°'], ['180', '180°'], ['270', '270°']]} aria={t('canvas.rot')} />
        </Grp>
      )}
      {c.on('canvas.autorot') && <Switch c={c} k="autorot" tok="autorot" label={t('canvas.autorot')} hint="autorot" />}
    </>
  );
}

const TONE = [['brightness', 0, 2, 0.05], ['contrast', 0, 2, 0.05], ['saturate', 0, 2, 0.05], ['hue', 0, 360, 5]] as const;
const EFFECTS = [['blur', 0, 20, 1], ['sharpen', 0, 10, 0.5], ['pixelate', 1, 40, 1], ['grayscale', 0, 1, 0.05], ['sepia', 0, 1, 0.05], ['invert', 0, 1, 0.05]] as const;

function Filter({ c }: { c: Ctx }) {
  const { t, p } = c;
  const sliders = (list: typeof TONE | typeof EFFECTS) =>
    list.filter(([k]) => c.on(`filter.${k}`)).map(([k, min, max, step]) => (
      <Slider key={k} c={c} k={k} tok="filter" label={t(`filter.${k}`)} min={min} max={max} step={step}
        unit={k === 'hue' ? '°' : ''} spectrum={k === 'hue'} />
    ));
  const effects = sliders(EFFECTS);
  return (
    <>
      <div class="pe-rows">{sliders(TONE)}</div>
      {effects.length > 0 && <h3 class="pe-sub">{t('filter.effects')}</h3>}
      <div class="pe-rows">{effects}</div>
      {c.on('filter.palette') && (
        <>
          <h3 class="pe-sub">{t('filter.palette')}</h3>
          <Switch c={c} k="palOn" tok="filter" label={t('filter.palOn')} hint="palette" />
          {p.palOn && (
            <>
              <Switch c={c} k="palDuo" tok="filter" label={t('filter.palDuo')} />
              <Grp label={t('filter.shadows')}><Color c={c} k="palA" tok="filter" label={t('filter.shadows')} /></Grp>
              {p.palDuo && <Grp label={t('filter.highlights')}><Color c={c} k="palB" tok="filter" label={t('filter.highlights')} /></Grp>}
              <div class="pe-rows">
                <Slider c={c} k="palI" tok="filter" label={t('filter.intensity')} min={0} max={1} step={0.05} hint="" />
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}

function Mark({ c }: { c: Ctx }) {
  const { t, p } = c;
  const id = useId();
  const drawn = p.wmMode === 'image' || p.wmMode === 'text';
  return (
    <>
      {c.on('mark.source') && (
        <>
          <Grp label={t('mark.source')} hint="watermark" wide>
            <Seg c={c} k="wmMode" tok="watermark" aria={t('mark.source')} mod="wrap"
              opts={[['config', t('mark.config')], ['off', t('mark.off')], ['image', t('mark.image')], ['text', t('mark.text')]]} />
          </Grp>
          {p.wmMode === 'image' && (
            <Grp label={t('mark.imagePath')} hint="image" id={id} wide>
              <Txt c={c} k="wmImage" tok="watermark" id={id} ph={t('mark.imagePh')} />
            </Grp>
          )}
          {p.wmMode === 'text' && (
            <>
              <Grp label={t('mark.text')} hint="text" id={id} wide>
                <Txt c={c} k="wmText" tok="watermark" id={id} />
              </Grp>
              <Grp label={t('mark.font')} hint="font, size">
                <div class="pe-2">
                  <Txt c={c} k="wmFont" tok="watermark" aria={t('mark.fontFamily')} />
                  <Num c={c} k="wmSize" tok="watermark" unit="px" min={1} aria={t('mark.fontSize')} />
                </div>
              </Grp>
              <Grp label={t('mark.color')} hint="color"><Color c={c} k="wmColor" tok="watermark" label={t('mark.color')} /></Grp>
            </>
          )}
        </>
      )}
      {drawn && (
        <>
          {c.on('mark.anchor') && (
            <Grp label={t('mark.anchor')} hint="anchor" val={place(t, p.wmAnchor)}>
              <div class="pe-grav">
                <Pad c={c} k="wmAnchor" tok="watermark" aria={t('mark.anchor')} />
                <Seg c={c} k="wmAnchor" tok="watermark" opts={[['repeat', t('mark.repeat')]]} aria={t('mark.repeat')} mod="col" />
              </div>
            </Grp>
          )}
          {c.on('mark.pad') && (
            <Grp label={t('mark.pad')} hint="pad" id={id + 'p'}>
              <Num c={c} k="wmPad" tok="watermark" id={id + 'p'} unit="px" min={0} ph={t('ph.config')} />
              <p class="pe-hint">{t('mark.padHint')}</p>
            </Grp>
          )}
          <div class="pe-rows">
            {c.on('mark.opacity') && <Slider c={c} k="wmOpacity" tok="watermark" label={t('mark.opacity')} min={0} max={100} step={1} unit="%" hint="opacity" />}
            {c.on('mark.rot') && <Slider c={c} k="wmRot" tok="watermark" label={t('mark.rot')} min={-180} max={180} step={5} unit="°" hint="rot" />}
            {c.on('mark.scale') && <Slider c={c} k="wmScale" tok="watermark" label={t('mark.scale')} min={0.05} max={2} step={0.05} unit="×" hint="scale" />}
          </div>
        </>
      )}
      {p.wmMode === 'off' && <p class="pe-note pe-wide">{t('mark.noteOff')}</p>}
      {p.wmMode === 'config' && <p class="pe-note pe-wide">{t('mark.noteConfig')}</p>}
    </>
  );
}

const META = ['icc', 'exif', 'xmp', 'iptc', 'other', 'gainmap', 'all'];

function Out({ c }: { c: Ctx }) {
  const { t, p } = c;
  const id = useId();
  const meta = (k: string) => (META_NAME[k] ? t(META_NAME[k]) : k.toUpperCase());
  // `all` stands alone; picking anything else drops it
  const toggle = (k: string) => {
    const rest = p.meta.filter((m) => m !== k && m !== 'all');
    c.set({ meta: p.meta.includes(k) ? rest : k === 'all' ? ['all'] : [...rest, k] }, 'meta');
  };
  return (
    <>
      {c.on('out.format') && (
        <Grp label={t('out.format')} hint="f" wide>
          <Seg c={c} k="f" tok="f" aria={t('out.format')} mod="wrap"
            opts={c.formats.map((f) => [f, f === 'auto' ? t('opt.auto') : (FORMAT_NAME[f] ?? f.toUpperCase())])} />
          {c.formats.includes('auto') && <p class="pe-hint">{t('out.formatHint')}</p>}
        </Grp>
      )}
      {c.on('out.quality') && (
        <Grp label={t('out.quality')} hint="q" wide>
          <Seg c={c} k="q" tok="q" opts={[...named(t, 'auto', 'low', 'medium', 'high', 'maximum'), ['custom', t('out.qCustom')]]} aria={t('out.quality')} mod="wrap" />
          {p.q === 'custom' && (
            <div class="pe-rows">
              <Slider c={c} k="qNum" tok="q" label={t('out.qValue')} min={1} max={100} step={1} hint={t('out.qRange')} />
            </div>
          )}
        </Grp>
      )}
      {c.on('out.meta') && (
        <Grp label={t('out.meta')} hint="meta" val={p.meta.map(meta).join(', ') || t('opt.none')} wide>
          <div class="pe-chips" role="group" aria-label={t('out.meta')}>
            {META.map((k) => (
              <button type="button" key={k} class={'pe-chip' + (p.meta.includes(k) ? ' on' : '')} aria-pressed={p.meta.includes(k)} onClick={() => toggle(k)}>{meta(k)}</button>
            ))}
          </div>
        </Grp>
      )}
      {c.on('out.limit') && (
        <>
          <h3 class="pe-sub">{t('out.limits')}</h3>
          <Grp label={t('out.limDim')} hint="limit dimension" id={id + 'd'}>
            <Txt c={c} k="limDim" tok="limit" id={id + 'd'} ph={t('out.limDimPh')} />
          </Grp>
          <Grp label={t('out.limSize')} hint="limit size" id={id + 's'}>
            <Txt c={c} k="limSize" tok="limit" id={id + 's'} ph={t('out.limSizePh')} />
          </Grp>
        </>
      )}
      {c.on('out.download') && (
        <>
          <h3 class="pe-sub">{t('out.download')}</h3>
          <Switch c={c} k="dlOn" tok="download" label={t('out.dlOn')} hint="download" />
          {p.dlOn && (
            <Grp label={t('out.dlName')} id={id + 'n'}>
              <Txt c={c} k="dl" tok="download" id={id + 'n'} />
            </Grp>
          )}
        </>
      )}
    </>
  );
}

function Motion({ c }: { c: Ctx }) {
  const { t, p } = c;
  const id = useId();
  return (
    <>
      {c.on('motion.page') && (
        <Grp label={t('motion.page')} hint="page" id={id + 'p'}>
          <Txt c={c} k="page" tok="page" id={id + 'p'} ph={t('motion.pagePh')} />
        </Grp>
      )}
      {c.on('motion.time') && (
        <Grp label={t('motion.time')} hint="t" id={id + 't'}>
          <Txt c={c} k="t" tok="t" id={id + 't'} ph={t('motion.timePh')} />
        </Grp>
      )}
      {c.on('motion.dpi') && (
        <Grp label={t('motion.dpi')} hint="dpi" id={id + 'd'}>
          <Txt c={c} k="dpi" tok="dpi" id={id + 'd'} type="number" min={1} max={3000} ph={t('ph.auto')} unit="dpi" />
        </Grp>
      )}
      {c.on('motion.style') && (
        <Grp label={t('motion.style')} hint="style" id={id + 's'} wide>
          <label class="pe-field area">
            <textarea id={id + 's'} spellcheck={false} placeholder="path { fill: #2bd4f0 }" value={p.style}
              onInput={(e) => c.set({ style: e.currentTarget.value }, 'style')} />
          </label>
          <p class="pe-hint">{t('motion.styleHint')}</p>
        </Grp>
      )}
      {c.on('motion.anim') && (
        <>
          <h3 class="pe-sub">{t('motion.animation')}</h3>
          <Grp label={t('motion.frames')} hint="anim" wide>
            <Seg c={c} k="animMode" tok="anim" aria={t('motion.animation')} mod="wrap"
              opts={[['source', t('motion.asSource')], ['off', t('motion.still')], ['custom', t('motion.custom')]]} />
          </Grp>
          {p.animMode === 'custom' && (
            <>
              <Grp label={t('motion.length')} hint="frames, stride">
                <div class="pe-2">
                  <Txt c={c} k="frames" tok="anim" type="number" min={1} ph={t('ph.all')} unit={t('motion.framesUnit')} aria={t('motion.count')} />
                  <Txt c={c} k="stride" tok="anim" type="number" min={1} ph="1" pre={t('motion.every')} aria={t('motion.stride')} />
                </div>
              </Grp>
              <Grp label={t('motion.speed')} hint="fps, timing">
                <Seg c={c} k="rate" tok="anim" opts={[['fps', t('motion.fps')], ['timing', t('motion.delay')]]} aria={t('motion.speedUnit')} />
                {p.rate === 'fps'
                  ? <Txt c={c} k="fps" tok="anim" type="number" min={1} ph={t('ph.source')} unit="fps" aria={t('motion.fps')} />
                  : <Txt c={c} k="timing" tok="anim" type="number" min={5} max={5000} ph={t('ph.source')} unit="ms" aria={t('motion.delayMs')} />}
              </Grp>
              <Grp label={t('motion.loop')} hint="loop" id={id + 'l'}>
                <Txt c={c} k="loop" tok="anim" id={id + 'l'} type="number" min={0} ph={t('ph.source')} unit={t('motion.forever')} />
              </Grp>
            </>
          )}
        </>
      )}
    </>
  );
}

function Deliv({ c }: { c: Ctx }) {
  const { t } = c;
  const id = useId();
  return (
    <>
      {c.on('deliv.original') && <Switch c={c} k="original" tok="original" label={t('deliv.original')} hint="original" />}
      {c.on('deliv.force') && <Switch c={c} k="force" tok="force" label={t('deliv.force')} hint="force" />}
      {c.on('deliv.cache') && (
        <Grp label={t('deliv.cache')} hint="cache" id={id + 'c'}>
          <Txt c={c} k="cache" tok="cache" id={id + 'c'} ph="v2" />
          <p class="pe-hint">{t('deliv.cacheHint')}</p>
        </Grp>
      )}
      {c.on('deliv.fallback') && (
        <Grp label={t('deliv.fallback')} hint="fallback" id={id + 'f'}>
          <Txt c={c} k="fallback" tok="fallback" id={id + 'f'} ph="placeholders/missing.png" />
          <p class="pe-hint">{t('deliv.fallbackHint')}</p>
        </Grp>
      )}
      {c.on('deliv.sign') && c.canSign && (
        <>
          <h3 class="pe-sub">{t('deliv.signature')}</h3>
          <Switch c={c} k="sign" tok="token" label={t('deliv.sign')} hint="token" />
          <p class="pe-note pe-wide">{t('deliv.signNote')}</p>
        </>
      )}
    </>
  );
}

export const PANELS: Record<Group, Panel> = { crop: Crop, size: Size, canvas: Canvas, filter: Filter, mark: Mark, out: Out, motion: Motion, deliv: Deliv };
