import { useLang } from '../hooks/useLang';
import { eventName, eventNote } from '../lib/i18n';
import { formatRange } from '../lib/format';
import { eventStyle } from '../lib/eventStyle';
import { downloadIcs } from '../lib/ics';
import type { CalendarEvent } from '../lib/types';

interface Props {
  event: CalendarEvent;
  past?: boolean;
  isToday?: boolean;
  showExport?: boolean;
}

export function EventCard({ event, past, isToday, showExport }: Props) {
  const { t, lang } = useLang();
  const style = eventStyle[event.type];
  const note = eventNote(event, lang);

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border bg-white p-3 ${
        past ? 'opacity-50' : ''
      } ${isToday ? 'border-brand ring-1 ring-brand' : 'border-slate-200'}`}
    >
      <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${style.dot}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-900">{eventName(event, lang)}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style.chip}`}>
            {t.eventType[event.type]}
          </span>
          {note && <span className="text-xs text-slate-500">· {note}</span>}
        </div>
        <div className="text-sm text-slate-600">{formatRange(event.start, event.end, lang)}</div>
      </div>
      {showExport && (
        <button
          onClick={() => downloadIcs([event], lang, `${event.id}.ics`)}
          aria-label={t.exportCalendar}
          title={t.exportCalendar}
          className="shrink-0 rounded-lg px-2 text-slate-400 hover:text-brand"
        >
          ⤓
        </button>
      )}
    </div>
  );
}
