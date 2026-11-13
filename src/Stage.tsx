import { useEffect, useRef, useState } from 'preact/hooks';
import type { Ctx } from './controls';
import { cropRatio, cropRect, type Rect } from './crop';
import { ICON } from './icons';
import type { Failure, ImageState } from './preview';

type Handle = 'move' | 'tl' | 'tr' | 'bl' | 'br';

const MIN = 16; // smallest region a drag can make, in source pixels
const pct = (v: number) => Math.round(v * 10000) / 100 + '%';
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function Stage({ c, mode, out, src, lang, compare, onCompare, explain, onCrop }: {
  c: Ctx;
  /** `crop` and `original` show the source; `output` shows what the URL renders. */
  mode: 'crop' | 'original' | 'output';
  out: ImageState;
  src: ImageState;
  lang: string;
  compare: boolean;
  onCompare: (on: boolean) => void;
  explain: (failure: Failure) => string;
  onCrop: (rect: Rect) => void;
}) {
  const { t, p, sw, sh } = c;
  const view = mode === 'output' ? out : src;
  const img = view.img;
  const frame = useRef<HTMLDivElement>(null);
  const [split, setSplit] = useState(50);
  const [dragging, setDragging] = useState(false);

  // the band crosses at least once, then keeps going until the response is in
  const [scan, setScan] = useState(false);
  useEffect(() => { if (view.loading) setScan(true); }, [view.loading]);

  const rect = mode === 'crop' && img && sw ? cropRect(p, sw, sh) : null;
  const comparing = mode === 'output' && compare && !!img && !!src.img;
  const fw = img?.w || 900;
  const fh = img?.h || 600;

  const drag = (e: PointerEvent, handle: Handle) => {
    if (!rect || !frame.current) return;
    e.preventDefault();
    e.stopPropagation();
    const el = e.currentTarget as HTMLElement;
    const box = frame.current.getBoundingClientRect();
    const kx = sw / box.width;
    const ky = sh / box.height;
    const ratio = cropRatio(p.car);
    const { clientX: x0, clientY: y0 } = e;
    el.setPointerCapture(e.pointerId);
    setDragging(true);

    const move = (ev: PointerEvent) => {
      const dx = Math.round((ev.clientX - x0) * kx);
      const dy = Math.round((ev.clientY - y0) * ky);
      let { l, t: top, w, h } = rect;
      if (handle === 'move') {
        l = clamp(l + dx, 0, sw - w);
        top = clamp(top + dy, 0, sh - h);
      } else {
        // the corner opposite the handle stays put
        let r = l + w;
        let b = top + h;
        if (handle[1] === 'l') l = clamp(l + dx, 0, r - MIN); else r = clamp(r + dx, l + MIN, sw);
        if (handle[0] === 't') top = clamp(top + dy, 0, b - MIN); else b = clamp(b + dy, top + MIN, sh);
        w = r - l;
        h = b - top;
        if (ratio) {
          const room = handle[0] === 't' ? b : sh - top;
          h = Math.round(w / ratio);
          if (h > room) { h = room; w = Math.round(h * ratio); }
          if (handle[1] === 'l') l = r - w;
          if (handle[0] === 't') top = b - h;
        }
      }
      onCrop({ l, t: top, w, h });
    };
    const end = () => {
      setDragging(false);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', end);
      el.removeEventListener('pointercancel', end);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  };

  let main = '—';
  let sub = '';
  if (rect) {
    main = `${rect.w} × ${rect.h}`;
    sub = t('stage.region', { w: sw, h: sh });
  } else if (mode === 'original' && sw) {
    main = `${sw} × ${sh}`;
    sub = t('stage.unchanged');
  } else if (mode === 'output' && img) {
    const big = img.size >= 1e6;
    const size = new Intl.NumberFormat(lang, { style: 'unit', unit: big ? 'megabyte' : 'kilobyte', maximumFractionDigits: big ? 2 : 1 });
    main = `${img.w} × ${img.h}`;
    sub = [t('stage.px'), img.type.replace('image/', '').replace('+xml', ''), size.format(img.size / (big ? 1e6 : 1e3))].join(', ');
  }

  return (
    <section class="pe-stage" aria-label={t('stage.label')} aria-busy={view.loading}>
      <div ref={frame}
        class={'pe-frame' + (mode === 'crop' ? ' cropping' : '') + (img ? ' checker' : '') + (view.error ? ' stale' : '')}
        style={{
          width: `min(calc(100cqw - var(--sp-x)), calc((100cqh - var(--sp-y)) * ${(fw / fh).toFixed(4)}), ${fw}px)`,
          aspectRatio: `${fw} / ${fh}`,
        }}>
        {src.img && <img class="pe-out" hidden={mode === 'output'} src={src.img.src} alt={t('stage.altSource')} draggable={false} />}
        {out.img && <img class="pe-out" hidden={mode !== 'output'} src={out.img.src} alt={t('stage.alt')} draggable={false} />}
        {rect && (
          <div class={'pe-crop' + (dragging ? ' drag' : '')} aria-hidden="true" onPointerDown={(e) => drag(e, 'move')}
            style={{ left: pct(rect.l / sw), top: pct(rect.t / sh), width: pct(rect.w / sw), height: pct(rect.h / sh) }}>
            {(['tl', 'tr', 'bl', 'br'] as const).map((h) => <span key={h} class={'pe-crop-h ' + h} onPointerDown={(e) => drag(e, h)} />)}
            <span class="pe-crop-dim">{t('stage.cropAt', { w: rect.w, h: rect.h, x: rect.l, y: rect.t })}</span>
          </div>
        )}
        {comparing && (
          <>
            <img class="pe-before" src={src.img!.src} alt={t('stage.original')} draggable={false} style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }} />
            <span class="pe-split-line" aria-hidden="true" style={{ left: split + '%' }}><span /></span>
            <span class="pe-tag l">{t('stage.original')}</span>
            <span class="pe-tag r">{t('stage.output')}</span>
            <input class="pe-split" type="range" min="0" max="100" step="1" value={split} aria-label={t('stage.split')}
              onInput={(e) => setSplit(Number(e.currentTarget.value))} />
          </>
        )}
        <span class={'pe-scan' + (scan ? ' run' : '')} aria-hidden="true" onAnimationIteration={() => { if (!view.loading) setScan(false); }} />
        {view.error && <div class="pe-err" role="alert"><p>{explain(view.error)}</p></div>}
      </div>
      <div class="pe-stage-bar">
        <div class="pe-dims"><b>{main}</b><span>{sub}</span></div>
        {c.on('compare') && (
          <button type="button" class={'pe-toggle' + (comparing ? ' on' : '')} aria-pressed={comparing} disabled={mode !== 'output'} onClick={() => onCompare(!compare)}>
            {ICON.compare}
            <span>{t('stage.compare')}</span>
          </button>
        )}
      </div>
    </section>
  );
}
