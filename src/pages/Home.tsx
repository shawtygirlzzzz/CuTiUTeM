import { useLang } from '../hooks/useLang';
import { useProgram } from '../hooks/useProgram';
import { useCalendar } from '../hooks/useCalendar';
import { Countdown } from '../components/Countdown';
import { EventCard } from '../components/EventCard';
import { getCurrentEvent, getNextEvent, todayISO } from '../lib/calendar';

/** Countdown home screen (FR-2). getCurrentEvent first; fall through to
 * getNextEvent only if nothing is ongoing (FR-2.3). */
export function Home() {
  const { t } = useLang();
  const { program } = useProgram();
  const { viewFor } = useCalendar();
  const today = todayISO();
  const view = program ? viewFor(program) : null;

  if (!view) return null;

  const events = view.allEvents;
  const current = getCurrentEvent(events, today);
  const primary = current ?? getNextEvent(events, today);

  // Empty state when today falls outside all loaded sessions (FR-2.5).
  if (!primary) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center">
        <p className="text-lg font-medium text-slate-700">{t.noUpcoming}</p>
        <p className="mt-1 text-sm text-slate-500">{t.switchSession}</p>
      </div>
    );
  }

  // Two "coming up" events after the primary one (FR-2.4).
  const comingUp = getUpcomingAfter(events, primary, today, 2);

  return (
    <div className="flex flex-col gap-6">
      <Countdown event={primary} today={today} />
      {comingUp.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            {t.comingUp}
          </h2>
          <div className="flex flex-col gap-2">
            {comingUp.map((e) => (
              <EventCard key={e.id} event={e} showExport />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

import type { CalendarEvent } from '../lib/types';
import { day } from '../lib/calendar';

function getUpcomingAfter(
  events: CalendarEvent[],
  primary: CalendarEvent,
  today: Date,
  count: number,
): CalendarEvent[] {
  const threshold = Math.max(day(primary.start).getTime(), today.getTime());
  return events
    .filter((e) => e.id !== primary.id && day(e.start).getTime() >= threshold)
    .sort((a, b) => day(a.start).getTime() - day(b.start).getTime())
    .slice(0, count);
}
