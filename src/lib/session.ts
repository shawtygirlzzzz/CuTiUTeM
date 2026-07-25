// Assemble a per-program view of a session: holidays merged into each semester
// and a flat, sorted event list for the countdown. SDD §5.4.
import { holidaysToEvents } from './holidays';
import { day } from './calendar';
import type {
  CalendarEvent,
  ProgramLevel,
  PublicHoliday,
  SessionData,
  Semester,
} from './types';

export interface ProgramView {
  semesters: Semester[]; // holidays merged in, events sorted
  allEvents: CalendarEvent[]; // flat, sorted ascending by start
}

const byStart = (a: CalendarEvent, b: CalendarEvent) =>
  day(a.start).getTime() - day(b.start).getTime();

export function buildProgramView(
  session: SessionData,
  holidays: PublicHoliday[],
  program: ProgramLevel,
): ProgramView {
  const cal = session.programs[program];
  const semesters: Semester[] = (cal?.semesters ?? []).map((s) => {
    const holidayEvents = holidaysToEvents(holidays, s.start, s.end);
    return { ...s, events: [...s.events, ...holidayEvents].sort(byStart) };
  });

  const allEvents = semesters.flatMap((s) => s.events).sort(byStart);
  return { semesters, allEvents };
}
