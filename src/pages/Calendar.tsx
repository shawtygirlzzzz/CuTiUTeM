import { useLang } from '../hooks/useLang';
import { useProgram } from '../hooks/useProgram';
import { useCalendar } from '../hooks/useCalendar';
import { Timeline } from '../components/Timeline';
import { SessionSelect } from '../components/SessionSelect';
import { downloadIcs } from '../lib/ics';
import { todayISO } from '../lib/calendar';

export function Calendar() {
  const { t, lang } = useLang();
  const { program } = useProgram();
  const { viewFor, isHistorical } = useCalendar();
  const today = todayISO();
  const view = program ? viewFor(program) : null;

  if (!view) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <SessionSelect />
        <button
          onClick={() => downloadIcs(view.allEvents, lang, 'cuti-utem.ics')}
          className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white"
        >
          {t.exportAll}
        </button>
      </div>

      {isHistorical && (
        <div
          role="status"
          className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-900"
        >
          {t.historicalBanner}
        </div>
      )}

      {view.semesters.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-slate-600">
          {t.noUpcoming}
        </div>
      ) : (
        <Timeline view={view} today={today} />
      )}
    </div>
  );
}
