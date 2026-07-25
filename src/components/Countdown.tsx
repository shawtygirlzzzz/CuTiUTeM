import { useLang } from '../hooks/useLang';
import { eventName } from '../lib/i18n';
import { formatRange } from '../lib/format';
import { eventStyle } from '../lib/eventStyle';
import { getDaysLeft, getDaysUntil, isOngoing } from '../lib/calendar';
import type { CalendarEvent } from '../lib/types';

interface Props {
  event: CalendarEvent;
  today: Date;
}

/** The dominant home-screen element (SDD §8): big numeral, name, date range.
 * Shows "days left" for an in-progress event, else "days until". (FR-2.2/2.3) */
export function Countdown({ event, today }: Props) {
  const { t, lang } = useLang();
  const ongoing = isOngoing(event, today);
  const n = ongoing ? getDaysLeft(event, today) : getDaysUntil(event, today);
  const style = eventStyle[event.type];

  return (
    <div className="flex flex-col items-center rounded-3xl bg-white px-6 py-10 text-center shadow-sm">
      <span
        className={`mb-3 rounded-full px-3 py-1 text-sm font-semibold ${style.chip}`}
      >
        {ongoing ? t.inProgress : t.nextBreak}
      </span>
      <div className="font-display text-7xl font-extrabold leading-none text-brand">
        {n === 0 ? t.today : n}
      </div>
      {n !== 0 && (
        <div className="mt-1 text-lg font-medium text-slate-500">{t.daysLeft(n)}</div>
      )}
      <h2 className="mt-4 text-2xl font-bold text-slate-900">{eventName(event, lang)}</h2>
      <p className="mt-1 text-slate-600">{formatRange(event.start, event.end, lang)}</p>
    </div>
  );
}
