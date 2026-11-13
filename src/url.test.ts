import { expect, test } from 'vitest';
import { cropRect, rectToCrop } from './crop';
import { DEFAULTS as d } from './params';
import { origin, previewQuery, query, sourceQuery, tokens } from './url';

const q = (patch: object) => query(tokens({ ...d, ...patch }, d, 2560));

test('defaults add nothing to the URL', () => {
  expect(q({})).toBe('');
});

test('each group writes its parameters in pipeline order', () => {
  expect(q({
    w: 900, h: 600, g: 'attention', contrast: 1.1, saturate: 1.2,
    wmMode: 'image', wmImage: 'brand/mark.png', wmOpacity: 70, wmPad: 24, wmScale: 0.5, f: 'avif', q: 'high',
  })).toBe('w=900&h=600&g=attention&filter=contrast:1.1|saturate:1.2&watermark=image:brand/mark.png|opacity:70|pad:24|scale:0.5&f=avif&q=high');
});

test('sub-parameters and odd values', () => {
  expect(q({ cropOn: true })).toBe('crop=w:2560');
  expect(q({ cropOn: true, car: 'square', cx: -5 })).toBe('crop=ar:square|x:-5');
  expect(q({ padT: 4, padB: 4, padL: 8, padR: 8 })).toBe('pad=4,8');
  expect(q({ bgNone: false, bg: '#ff0000' })).toBe('bg=ff0000');
  expect(q({ palOn: true })).toBe('filter=palette:1b1f3b,ffd633,1');
  expect(q({ wmMode: 'text', wmText: 'a b&c' })).toBe('watermark=text:a%20b%26c');
  expect(q({ wmMode: 'text' })).toBe('');
  expect(q({ autorot: false, upsize: true })).toBe('upsize=true&autorot=false');
  expect(q({ style: 'path { fill: red }' })).toBe('style=cGF0aCB7IGZpbGw6IHJlZCB9');
});

test('server defaults are left out, and written when the value differs', () => {
  const server = { ...d, fit: 'contain', upsize: true };
  expect(query(tokens({ ...server }, server))).toBe('');
  expect(query(tokens({ ...server, fit: 'cover', upsize: false }, server))).toBe('fit=cover&upsize=false');
});

test('original drops every transform', () => {
  expect(q({ original: true, w: 100, force: true })).toBe('original=true&force=true');
});

test('previews are uncached and skip cache-only parameters', () => {
  const toks = tokens({ ...d, w: 100, rot: '90', force: true, cache: 'v2', dlOn: true }, d);
  expect(previewQuery(toks)).toBe('w=100&rot=90&nocache=true');
  expect(sourceQuery(toks)).toBe('rot=90&f=webp&nocache=true');
  expect(origin('http://x/', '/a b/č.jpg')).toBe('http://x/a%20b/%C4%8D.jpg');
});

test('the crop region matches the server', () => {
  expect(cropRect({ ...d, cw: 1000, ch: 600 }, 4000, 3000)).toEqual({ l: 1500, t: 1200, w: 1000, h: 600 });
  expect(cropRect({ ...d, car: 'square' }, 4000, 3000)).toEqual({ l: 500, t: 0, w: 3000, h: 3000 });
  expect(cropRect({ ...d, cw: 1000, cg: 'bottom-right', cx: 50 }, 4000, 3000)).toEqual({ l: 3000, t: 0, w: 1000, h: 3000 });
  const r = { l: 10, t: 20, w: 300, h: 200 };
  const back = { ...d, ...rectToCrop(r, { ...d, cg: 'attention' }, 4000, 3000) };
  expect(back.cg).toBe('center');
  expect(cropRect(back, 4000, 3000)).toEqual(r);
});
