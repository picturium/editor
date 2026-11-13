import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource-variable/space-grotesk';
import '@fontsource/vt323';
import './editor.css';
import { render } from 'preact';
import { EditorView } from './Editor';
import type { Editor, EditorOptions } from './types';

export type { Messages } from './i18n';
export { LOCALES } from './i18n';
export { DEFAULTS, FORMATS, GROUPS } from './params';
export type { Control, Editor, EditorOptions, Feature, Group, Params } from './types';

/**
 * Mounts the editor into `target`. The editor fills the element and lays itself out
 * from the element's size (desktop, tablet and phone layouts), so give it a height.
 */
export function createEditor(target: HTMLElement, options: EditorOptions): Editor {
  let current = options;
  const api = { url: '' };
  const draw = () => render(<EditorView o={current} api={api} />, target);
  draw();
  return {
    url: () => api.url,
    update(next) { current = { ...current, ...next }; draw(); },
    destroy() { render(null, target); },
  };
}
