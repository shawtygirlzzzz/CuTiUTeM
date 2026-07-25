// Holiday merging + long-weekend detection — SDD §5.2.
//
// Holidays live in a separate file because they follow the Gregorian/Islamic
// calendars, not the academic one. At load time we filter to the active
// session's span and inject them as CalendarEvents of type 'holiday'.
import {
  addDays,
  eachDayOfInterval,
  format,
  getDay,
  isWithinInterval,
} from 'date-fns';
import { day } from './calendar';
import type { CalendarEvent, PublicHoliday } from './types';

const scopeLabel: Record<PublicHoliday['scope'], { name: string; nameEn: string }> = {
  national: { name: 'Kebangsaan', nameEn: 'National' },
  melaka: { name: 'Melaka', nameEn: 'Melaka' },
  johor: { name: 'Johor', nameEn: 'Johor' },
};

/** Holidays that fall within [start, end] inclusive, as calendar events. */
export function holidaysToEvents(
  holidays: PublicHoliday[],
  start: string,
  end: string,
): CalendarEvent[] {
  const lo = day(start);
  const hi = day(end);
  return holidays
    .filter((h) => isWithinInterval(day(h.date), { start: lo, end: hi }))
    .map((h) => ({
      id: `holiday-${h.date}-${h.scope}`,
      name: h.name,
      nameEn: h.nameEn,
      type: 'holiday' as const,
      start: h.date,
      end: h.date,
      // Label the scope where it differs from national (FR-5.2).
      note: h.scope === 'national' ? undefined : scopeLabel[h.scope].name,
      noteEn: h.scope === 'national' ? undefined : scopeLabel[h.scope].nameEn,
    }));
}

export interface LongWeekend {
  start: string;
  end: string;
  length: number;
}

const isWeekend = (d: Date): boolean => {
  const dow = getDay(d); // 0 = Sun, 6 = Sat
  return dow === 0 || dow === 6;
};

/**
 * Long-weekend detection (FR-5.3): build the set of all non-class dates
 * (weekends + holidays + breaks) within [start, end], then report every run of
 * 3+ consecutive such days.
 */
export function findLongWeekends(
  events: CalendarEvent[],
  start: string,
  end: string,
): LongWeekend[] {
  const offTypes = new Set<CalendarEvent['type']>(['break', 'holiday', 'study_week']);
  const offDates = new Set<string>();

  for (const e of events) {
    if (!offTypes.has(e.type)) continue;
    for (const d of eachDayOfInterval({ start: day(e.start), end: day(e.end) })) {
      offDates.add(format(d, 'yyyy-MM-dd'));
    }
  }

  const runs: LongWeekend[] = [];
  let runStart: Date | null = null;
  let prev: Date | null = null;

  const span = eachDayOfInterval({ start: day(start), end: day(end) });
  const flush = (last: Date) => {
    if (!runStart) return;
    const length = eachDayOfInterval({ start: runStart, end: last }).length;
    if (length >= 3) {
      runs.push({
        start: format(runStart, 'yyyy-MM-dd'),
        end: format(last, 'yyyy-MM-dd'),
        length,
      });
    }
    runStart = null;
  };

  for (const d of span) {
    const off = isWeekend(d) || offDates.has(format(d, 'yyyy-MM-dd'));
    if (off) {
      if (!runStart) runStart = d;
    } else if (prev) {
      flush(prev);
    }
    prev = d;
  }
  if (prev) flush(prev);

  return runs;
}

// Re-export for callers that build an off-by-one guard around run edges.
export const nextDay = (iso: string): string =>
  format(addDays(day(iso), 1), 'yyyy-MM-dd');
