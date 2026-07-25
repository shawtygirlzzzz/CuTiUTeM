import { useLang } from '../hooks/useLang';
import { EventCard } from './EventCard';
import { isPast, isOngoing, getSemesterProgress } from '../lib/calendar';
import type { ProgramView } from '../lib/session';

interface Props {
  view: ProgramView;
  today: Date;
}

/** Vertical chronological list grouped by semester (FR-3.1), colour-coded,
 * with today's position marked and past events de-emphasized (FR-3.2/3.3/3.4). */
export function Timeline({ view, today }: Props) {
  const { lang } = useLang();

  return (
    <div className="flex flex-col gap-6">
      {view.semesters.map((sem) => {
        const label = lang === 'en' ? sem.labelEn : sem.label;
        const progress = getSemesterProgress(sem, today);
        const active = progress > 0 && progress < 1;
        return (
          <section key={sem.label}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                {label}
              </h3>
              {active && (
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full bg-brand" style={{ width: `${progress * 100}%` }} />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {sem.events.map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  past={isPast(e, today)}
                  isToday={isOngoing(e, today)}
                  showExport
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
