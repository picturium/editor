import cs from './cs';
import de from './de';
import en from './en';
import es from './es';
import sk from './sk';

export type Messages = typeof en;
export type MessageKey = keyof Messages;
export type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

export const LOCALES: Record<string, Messages> = { en, de, sk, cs, es };

const PLURAL = /^(zero|one|two|few|many|other):/;

/** Translator for `locale` ("sk", "de-AT", …); unknown languages read English. */
export function translator(locale: string | undefined, overrides?: Partial<Messages>) {
  const wanted = (locale || navigator.language || 'en').toLowerCase().split('-')[0];
  // a language without built-in copy is still honoured when the host brings its own
  const lang = wanted in LOCALES || overrides ? wanted : 'en';
  const dict: Messages = { ...en, ...LOCALES[lang], ...overrides };
  const rules = new Intl.PluralRules(lang);

  const t: Translate = (key, vars = {}) => {
    let text: string = dict[key] ?? key;
    if (PLURAL.test(text)) {
      const forms = Object.fromEntries(text.split('|').map((form) => form.split(/:(.*)/s).slice(0, 2)));
      text = forms[rules.select(Number(vars.n))] ?? forms.other ?? '';
    }
    return text.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ''));
  };

  return { t, lang };
}
