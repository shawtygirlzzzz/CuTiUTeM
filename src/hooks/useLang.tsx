// Language context — SDD §5.5. Resolution order: URL ?lang= → localStorage →
// default 'ms'. A valid URL param is written back so shared links are sticky.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { strings, type Strings } from '../lib/i18n';
import type { Lang } from '../lib/types';

const KEY = 'cutiutem.lang';
const isLang = (v: unknown): v is Lang => v === 'ms' || v === 'en';

interface LangContextValue {
  lang: Lang;
  t: Strings;
  setLang: (l: Lang) => void;
}

const LangContext = createContext<LangContextValue | null>(null);

function resolveInitial(param: string | null): Lang {
  if (isLang(param)) return param;
  const stored = localStorage.getItem(KEY);
  if (isLang(stored)) return stored;
  return 'ms';
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [params] = useSearchParams();
  const [lang, setLang] = useState<Lang>(() => resolveInitial(params.get('lang')));

  // Adopt a valid URL param when it changes (shareable links).
  useEffect(() => {
    const p = params.get('lang');
    if (isLang(p)) setLang(p);
  }, [params]);

  // Persist + reflect on <html lang> for accessibility (FR-10.8).
  useEffect(() => {
    localStorage.setItem(KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LangContext.Provider value={{ lang, t: strings[lang], setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}
