import { useLang } from '../hooks/useLang';

/** MS / EN segmented toggle. Sits in the header beside the program chip. */
export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex overflow-hidden rounded-full border border-slate-300 text-sm"
    >
      {(['ms', 'en'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`px-3 py-1 font-medium uppercase transition-colors ${
            lang === l ? 'bg-brand text-white' : 'bg-white text-slate-600'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
