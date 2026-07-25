import { useCalendar } from '../hooks/useCalendar';
import { useLang } from '../hooks/useLang';

/** Session dropdown (FR-4.1), populated from index.json, defaulting to current. */
export function SessionSelect() {
  const { index, sessionId, setSessionId } = useCalendar();
  const { t } = useLang();
  if (!index) return null;

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">{t.calendar}</span>
      <select
        value={sessionId ?? index.current}
        onChange={(e) => setSessionId(e.target.value)}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 font-medium text-slate-800"
      >
        {index.sessions.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
            {s.id === index.current ? ` · ${t.current}` : ''}
          </option>
        ))}
      </select>
    </label>
  );
}
