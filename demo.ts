// Development host page. Everything an integrator passes to createEditor() can be
// tried from the query string:
//   ?server=http://localhost:20045&source=mars.jpg&locale=sk&theme=light
//   &disable=motion,deliv.force,url&formats=auto,webp,avif&logo=/my-logo.svg&keys&secret=dev-secret
import { createEditor, type EditorOptions, type Feature } from './src/index';

const qs = new URLSearchParams(location.search);
const list = (name: string) => qs.get(name)?.split(',').filter(Boolean);
const secret = qs.get('secret');

// Signing in the browser is for this demo only: a real page asks its own backend,
// because whoever holds the secret can mint any URL.
async function hmac(payload: string): Promise<string> {
  const text = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', text.encode(secret!), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, text.encode(payload));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const logo = qs.get('logo');

createEditor(document.getElementById('editor')!, {
  server: qs.get('server') ?? 'http://localhost:20045',
  source: qs.get('source') ?? 'mars.jpg',
  locale: qs.get('locale') ?? undefined,
  theme: (qs.get('theme') as EditorOptions['theme']) ?? 'auto',
  logo: logo === 'none' ? false : logo ?? undefined,
  disable: list('disable') as Feature[] | undefined,
  formats: list('formats'),
  keys: qs.has('keys'),
  initial: qs.has('blank') ? undefined : { w: 900, h: 600, g: 'attention', contrast: 1.1, saturate: 1.2, f: 'avif', q: 'high' },
  sign: secret ? hmac : undefined,
  onUse: (url) => console.info('use', url),
  onClose: () => console.info('close'),
});
