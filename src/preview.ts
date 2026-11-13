import { useEffect, useRef, useState } from 'preact/hooks';

export interface Shot { key: string; src: string; w: number; h: number; type: string; size: number }
/** `status` is the HTTP status, 0 when the server cannot be reached, -1 when the answer is not an image. */
export class Failure { constructor(public status: number, public message: string) {} }
export interface ImageState { img: Shot | null; loading: boolean; error: Failure | null; runs: number }
export type Sign = (payload: string) => string | Promise<string>;

// what an <img> would ask for, so `f=auto` previews the format a page would get
const ACCEPT = 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8';

async function load(url: string, payload: string, signal: AbortSignal, sign?: Sign): Promise<Shot> {
  const full = sign ? url + '&token=' + encodeURIComponent(await sign(payload)) : url;
  let res: Response;
  try {
    // no-store on both ends: the server skips its cache (`nocache`), the browser keeps nothing either
    res = await fetch(full, { signal, cache: 'no-store', headers: { Accept: ACCEPT } });
  } catch (e) {
    throw signal.aborted ? e : new Failure(0, '');
  }
  if (!res.ok) {
    const plain = res.headers.get('content-type')?.startsWith('text/plain');
    throw new Failure(res.status, plain ? (await res.text()).slice(0, 240) : '');
  }
  const blob = await res.blob();
  if (!blob.type.startsWith('image/')) throw new Failure(-1, blob.type);
  const src = URL.createObjectURL(blob);
  const image = new Image();
  image.src = src;
  try {
    await image.decode();
  } catch {
    URL.revokeObjectURL(src);
    throw new Failure(-1, blob.type);
  }
  return { key: url, src, w: image.naturalWidth, h: image.naturalHeight, type: blob.type, size: blob.size };
}

/**
 * Renders `url` once it has rested for `delay` ms and keeps the last good image on
 * screen meanwhile. A newer URL aborts the request in flight, so dragging a slider
 * costs one render at the end, not one per step. `null` pauses without dropping the image.
 */
export function useImage(url: string | null, payload: string, delay: number, sign?: Sign): ImageState {
  const [state, setState] = useState<ImageState>({ img: null, loading: false, error: null, runs: 0 });
  const shown = useRef('');

  useEffect(() => {
    if (!url) return;
    if (url === shown.current) {
      setState((s) => (s.error ? { ...s, error: null } : s));
      return;
    }
    const abort = new AbortController();
    const timer = setTimeout(async () => {
      setState((s) => ({ ...s, loading: true, runs: s.runs + 1 }));
      try {
        const img = await load(url, payload, abort.signal, sign);
        if (abort.signal.aborted) return URL.revokeObjectURL(img.src);
        shown.current = url;
        setState((s) => ({ img, loading: false, error: null, runs: s.runs }));
      } catch (e) {
        if (abort.signal.aborted) return;
        shown.current = '';
        setState((s) => ({ ...s, loading: false, error: e instanceof Failure ? e : new Failure(0, '') }));
      }
    }, delay);
    return () => {
      clearTimeout(timer);
      abort.abort();
      setState((s) => (s.loading ? { ...s, loading: false } : s));
    };
  }, [url, !!sign]);

  // free the previous blob once its replacement is on screen
  const src = state.img?.src;
  useEffect(() => () => { if (src) URL.revokeObjectURL(src); }, [src]);

  return state;
}
