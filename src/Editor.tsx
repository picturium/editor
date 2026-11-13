import { useEffect, useMemo, useState } from 'preact/hooks';
import logo from './assets/picturium.png';
import type { Ctx } from './controls';
import { rectToCrop } from './crop';
import { translator } from './i18n';
import { GROUP_ICON, ICON } from './icons';
import { PANELS } from './panels';
import { DEFAULTS, FORMATS, GROUPS, KEYS } from './params';
import { type Failure, useImage } from './preview';
import { Stage } from './Stage';
import type { Control, EditorOptions, Feature, Group, Params } from './types';
import { origin, previewQuery, query, sourceQuery, type Token, tokens } from './url';

type Theme = 'dark' | 'light';

const systemTheme = (): Theme => (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
const pickTheme = (theme: EditorOptions['theme']): Theme => (theme === 'dark' || theme === 'light' ? theme : systemTheme());
const stem = (path: string) => path.split('/').pop()!.replace(/\.[^.]+$/, '');

export function EditorView({ o, api }: { o: EditorOptions; api: { url: string } }) {
  const { t, lang } = useMemo(() => translator(o.locale, o.messages), [o.locale, o.messages]);
  const format = useMemo(() => new Intl.NumberFormat(lang, { maximumFractionDigits: 2 }), [lang]);
  const d = useMemo<Params>(() => ({ ...DEFAULTS, dl: stem(o.source), ...o.defaults }), [o.source, o.defaults]);

  const [p, setP] = useState<Params>(() => ({ ...d, ...o.initial }));
  const [section, setSection] = useState<Group>(o.section ?? 'size');
  const [theme, setTheme] = useState<Theme>(() => pickTheme(o.theme));
  const [flash, setFlash] = useState({ tok: '', n: 0 });
  const [compare, setCompare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sig, setSig] = useState({ payload: '', token: '' });

  useEffect(() => setTheme(pickTheme(o.theme)), [o.theme]);

  const off = new Set<Feature>(o.disable);
  const on = (f: Feature) => !off.has(f) && !off.has(f.split('.')[0] as Feature);
  const groups = GROUPS.filter(on);
  const current = groups.includes(section) ? section : groups[0];
  const delay = o.previewDelay ?? 250;
  const signing = p.sign && !!o.sign;

  const set = (patch: Partial<Params>, tok = '') => {
    setP((prev) => ({ ...prev, ...patch }));
    setFlash((f) => ({ tok, n: f.n + 1 }));
  };
  // back to the server defaults, but only for the controls this user can see
  const reset = (group: Group) => {
    const keys = (Object.keys(KEYS) as Control[]).filter((ctl) => ctl.startsWith(group + '.') && on(ctl)).flatMap((ctl) => KEYS[ctl]);
    set(Object.fromEntries(keys.map((k) => [k, d[k]])));
  };

  // ── the URL ──
  const path = o.source.replace(/^\/+/, '');
  const base = origin(o.server, path);
  const sourceToks = tokens(p, d);
  const sq = sourceQuery(sourceToks);
  const src = useImage(base + '?' + sq, path + '?' + sq, delay, signing ? o.sign : undefined);
  // crop coordinates are in source pixels, whichever way the view is turned
  const turned = /[?&]rot=(90|270)/.test(src.img?.key ?? '');
  const sw = (turned ? src.img?.h : src.img?.w) ?? 0;
  const sh = (turned ? src.img?.w : src.img?.h) ?? 0;

  const toks = tokens(p, d, sw);
  const q = query(toks);
  const url = base + (q ? '?' + q : '');
  const payload = path + (q ? '?' + q : '');
  api.url = url;

  const mode = p.original ? 'original' : current === 'crop' ? 'crop' : 'output';
  const pq = previewQuery(toks);
  const out = useImage(mode === 'output' ? base + '?' + pq : null, path + '?' + pq, delay, signing ? o.sign : undefined);

  useEffect(() => { o.onChange?.(url, p); }, [url]);

  // the token shown in the dock; Copy and Use sign again so they never hand out a stale one
  useEffect(() => {
    if (!signing) return;
    let live = true;
    const timer = setTimeout(async () => {
      try {
        const token = await o.sign!(payload);
        if (live) setSig({ payload, token });
      } catch { /* the preview reports a failing signature */ }
    }, delay);
    return () => { live = false; clearTimeout(timer); };
  }, [signing, payload]);

  const signed = async () => (signing ? url + (q ? '&' : '?') + 'token=' + encodeURIComponent(await o.sign!(payload)) : url);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(await signed());
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard blocked by the host page */ }
  };

  const explain = (f: Failure) =>
    f.status === 0 ? t('err.network', { server: o.server })
      : f.status === -1 ? t('err.document')
        : f.status === 403 ? t('err.signature')
          : f.status === 404 ? t('err.missing', { path })
            : f.status === 503 ? t('err.busy')
              : f.status < 500 ? t('err.params', { message: f.message || f.status })
                : t('err.server');

  const c: Ctx = {
    p, set, reset, t, on, sw, sh,
    num: (v) => format.format(v),
    formats: o.formats ?? FORMATS,
    canSign: !!o.sign,
  };

  const token = signing ? (sig.payload === payload ? sig.token : '…') : '';
  const shown: Token[] = token
    ? [...toks, { grp: 'deliv', k: 'token', v: token, show: token.length > 16 ? token.slice(0, 16) + '…' : token }]
    : toks;
  const length = url.length + (token.length > 1 ? token.length + 7 : 0);
  const title = o.title === false ? '' : (o.title ?? t('top.editor'));
  const kind = path.includes('.') ? path.split('.').pop()!.toUpperCase() : '';
  const Panel = current && PANELS[current];
  const runs = out.runs + src.runs;

  return (
    <div class="pe-host">
      <div class={`pe pe-${theme}` + (o.keys ? '' : ' pe-nokeys')} lang={lang}>
        <header class="pe-top">
          {o.logo !== false && <img class="pe-logo" src={o.logo || logo} alt={o.logo ? '' : 'picturium'} />}
          {title && <span class="pe-top-name">{title}</span>}
          {on('source') ? (
            <div class="pe-src">
              {ICON.image}
              <span class="pe-src-path">{path}</span>
              {sw > 0 && <span class="pe-src-meta">{sw} × {sh} {kind}</span>}
            </div>
          ) : <span class="pe-top-gap" />}
          <div class="pe-top-actions">
            {on('theme') && (
              <button type="button" class="pe-icon-btn" aria-label={t(theme === 'dark' ? 'top.toLight' : 'top.toDark')}
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? ICON.sun : ICON.moon}
              </button>
            )}
            {o.onClose && <button type="button" class="pe-icon-btn" aria-label={t('top.close')} onClick={o.onClose}>{ICON.close}</button>}
          </div>
        </header>

        <nav class="pe-rail" aria-label={t('rail.label')}>
          {groups.map((g) => (
            <button type="button" key={g} class={`pe-nav g-${g}` + (g === current ? ' on' : '')} aria-pressed={g === current} onClick={() => setSection(g)}>
              <span class={'pe-px' + (toks.some((tk) => tk.grp === g) ? ' lit' : '')} />
              {GROUP_ICON[g]}
              <span>{t(`nav.${g}`)}</span>
            </button>
          ))}
        </nav>

        <Stage c={c} mode={mode} out={out} src={src} lang={lang} compare={compare} onCompare={setCompare} explain={explain}
          onCrop={(rect) => set(rectToCrop(rect, p, sw, sh), 'crop')} />

        <aside class={'pe-panel g-' + current} aria-label={t('panel.label')}>
          {Panel && (
            <>
              <div class="pe-ph">
                <div><h2>{t(`${current}.title`)}</h2><p>{t(`${current}.desc`)}</p></div>
                <button type="button" class="pe-link" onClick={() => reset(current)}>{t('panel.reset')}</button>
              </div>
              <div class="pe-pb" key={current}><Panel c={c} /></div>
            </>
          )}
        </aside>

        {(on('url') || on('copy') || o.onUse) && (
          <footer class="pe-url">
            <span key={runs} class={'pe-load' + (runs ? ' run' : '')} aria-hidden="true" />
            {on('url') && (
              <div class="pe-url-code" role="group" aria-label={t('url.label')}>
                <span class="pe-origin">{base.slice(0, base.length - encodeURI(path).length)}<b>{path}</b></span>
                {shown.map((tk, i) => {
                  const hot = flash.n > 0 && tk.k === flash.tok;
                  return (
                    // a new key restarts the flash on the parameter that just changed
                    <span class="pe-tw" key={tk.k + (hot ? flash.n : '')}>
                      <span class="pe-sepc">{i ? '&' : '?'}</span>
                      <button type="button" class={`pe-tok g-${tk.grp}` + (tk.grp === current ? ' cur' : '') + (hot ? ' hot' : '')}
                        title={t('url.open', { group: t(`${tk.grp}.title`) })} disabled={!groups.includes(tk.grp)} onClick={() => setSection(tk.grp)}>
                        <span class="k">{tk.k}</span><span class="eq">=</span><span class="v">{tk.show ?? tk.v}</span>
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
            <div class="pe-url-side">
              {on('url') && <span class="pe-stat">{t('url.params', { n: shown.length })}, {t('url.chars', { n: length })}</span>}
              {on('copy') && (
                <button type="button" class={'pe-btn' + (copied ? ' ok' : '')} onClick={copy}>
                  {ICON.copy}
                  <span>{t(copied ? 'url.copied' : 'url.copy')}</span>
                </button>
              )}
              {o.onUse && <button type="button" class="pe-btn primary" onClick={async () => o.onUse!(await signed(), p)}>{t('url.use')}</button>}
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}
