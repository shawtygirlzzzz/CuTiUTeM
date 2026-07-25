import { useLang } from '../hooks/useLang';
import { useProgram } from '../hooks/useProgram';
import type { ProgramLevel } from '../lib/types';

/** Full-screen first-launch picker (FR-1.1). Also reachable from the header
 * chip to change program later. */
export function ProgramPicker({ onDone }: { onDone?: () => void }) {
  const { t } = useLang();
  const { setProgram } = useProgram();

  const choose = (p: ProgramLevel) => {
    setProgram(p);
    onDone?.();
  };

  const options: { level: ProgramLevel; label: string }[] = [
    { level: 'diploma', label: t.diploma },
    { level: 'degree', label: t.degree },
    { level: 'master', label: t.master },
  ];

  return (
    <div className="flex min-h-screen flex-col justify-center gap-6 px-6 py-10">
      <div>
        <h1 className="font-display text-3xl font-bold text-brand">{t.appName}</h1>
        <p className="mt-2 text-lg text-slate-600">{t.selectProgram}</p>
      </div>
      <div className="flex flex-col gap-3">
        {options.map(({ level, label }) => (
          <button
            key={level}
            onClick={() => choose(level)}
            className="w-full rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 text-left text-lg font-semibold text-slate-800 transition-colors hover:border-brand hover:bg-brand/5 active:scale-[0.99]"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
