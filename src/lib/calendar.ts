// Date computation — SDD §5.1.
//
// CRITICAL: never construct a Date from a bare ISO string. `new Date('2026-03-16')`
// parses as UTC midnight and shifts a day backward in Malaysia (UTC+8). Always
// parseISO + startOfDay and compare at local midnight.
import { parseISO, startOfDay, differenceInCalendarDays } from 'date-fns';
import type { CalendarEvent, Semester } from './types';

/** Local-midnight Date for an ISO YYYY-MM-DD string. */
export const day = (iso: string): Date => startOfDay(parseISO(iso));

/** Local-midnight Date for "now" — the single source of "today". */
export const todayISO = (now: Date = new Date()): Date => startOfDay(now);

/** Is `today` within [event.start, event.end] inclusive? */
export function isOngoing(event: CalendarEvent, today: Date): boolean {
  const t = today.getTime();
  return t >= day(event.start).getTime() && t <= day(event.end).getTime();
}

/**
 * The event currently in progress, if any. When several overlap (e.g. a holiday
 * inside a break), the one that started earliest wins so the countdown shows the
 * larger containing period.
 */
export function getCurrentEvent(
  events: CalendarEvent[],
  today: Date,
): CalendarEvent | null {
  const ongoing = events
    .filter((e) => isOngoing(e, today))
    .sort((a, b) => day(a.start).getTime() - day(b.start).getTime());
  return ongoing[0] ?? null;
}

/**
 * Earliest event whose start is strictly after today, optionally filtered by
 * type. Assumes/does not require pre-sorted input.
 */
export function getNextEvent(
  events: CalendarEvent[],
  today: Date,
  types?: CalendarEvent['type'][],
): CalendarEvent | null {
  const t = today.getTime();
  const upcoming = events
    .filter((e) => day(e.start).getTime() > t)
    .filter((e) => !types || types.includes(e.type))
    .sort((a, b) => day(a.start).getTime() - day(b.start).getTime());
  return upcoming[0] ?? null;
}

/** Whole calendar days from today to the event's start (0 if it starts today). */
export function getDaysUntil(event: CalendarEvent, today: Date): number {
  return differenceInCalendarDays(day(event.start), today);
}

/** Days remaining until an ongoing event ends (inclusive). */
export function getDaysLeft(event: CalendarEvent, today: Date): number {
  return differenceInCalendarDays(day(event.end), today);
}

/** 0..1 position of today within a semester, for the timeline marker. */
export function getSemesterProgress(semester: Semester, today: Date): number {
  const start = day(semester.start).getTime();
  const end = day(semester.end).getTime();
  if (end <= start) return 0;
  const p = (today.getTime() - start) / (end - start);
  return Math.min(1, Math.max(0, p));
}

/** Is today after this event's end? (for de-emphasizing past events) */
export function isPast(event: CalendarEvent, today: Date): boolean {
  return day(event.end).getTime() < today.getTime();
}
