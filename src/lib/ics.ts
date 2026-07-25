// Client-side ICS generation — SDD §4 (FR-6). All-day events only; no
// timezone-dependent times (FR-6.3). Event titles are localized (FR-10.9).
import { createEvents, type EventAttributes } from 'ics';
import { addDays, parseISO } from 'date-fns';
import { eventName } from './i18n';
import type { CalendarEvent, Lang } from './types';

// ics all-day events treat `end` as EXCLUSIVE, so add one day to our inclusive end.
const toDateArray = (iso: string): [number, number, number] => {
  const d = parseISO(iso);
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()];
};

function toAttributes(event: CalendarEvent, lang: Lang): EventAttributes {
  return {
    title: eventName(event, lang),
    start: toDateArray(event.start),
    end: toDateArray(addDays(parseISO(event.end), 1).toISOString().slice(0, 10)),
    calName: 'Cuti UTeM',
    productId: 'cuti-utem',
    uid: `${event.id}@cuti.nathrah.uk`,
  };
}

/** Build an .ics string for one or many events. Returns null on failure. */
export function buildIcs(events: CalendarEvent[], lang: Lang): string | null {
  const { error, value } = createEvents(events.map((e) => toAttributes(e, lang)));
  if (error || !value) return null;
  return value;
}

/** Trigger a client-side download of the given events as a .ics file. */
export function downloadIcs(
  events: CalendarEvent[],
  lang: Lang,
  filename = 'cuti-utem.ics',
): void {
  const ics = buildIcs(events, lang);
  if (!ics) return;
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
