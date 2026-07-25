// Date-boundary tests — SDD §11. This is where a silent off-by-one produces a
// wrong answer that looks entirely plausible, so these matter most.
import { describe, it, expect } from 'vitest';
import {
  day,
  getCurrentEvent,
  getNextEvent,
  getDaysUntil,
  getDaysLeft,
  isOngoing,
  isPast,
  getSemesterProgress,
} from './calendar';
import type { CalendarEvent, Semester } from './types';

const ev = (
  id: string,
  type: CalendarEvent['type'],
  start: string,
  end: string,
): CalendarEvent => ({ id, name: id, nameEn: id, type, start, end });

const events: CalendarEvent[] = [
  ev('midsem', 'break', '2025-11-22', '2025-11-30'),
  ev('classes2', 'class', '2025-12-01', '2026-01-16'),
  ev('revision', 'study_week', '2026-01-17', '2026-01-25'),
  ev('exam', 'exam', '2026-01-26', '2026-02-08'),
];

describe('date parsing is timezone-safe', () => {
  it('does not shift a day in UTC+8', () => {
    // The whole point: parseISO+startOfDay keeps the calendar date intact.
    expect(day('2026-03-16').getDate()).toBe(16);
    expect(day('2026-03-16').getMonth()).toBe(2); // March
  });
});

describe('getCurrentEvent', () => {
  it('finds an event on its inclusive start boundary', () => {
    expect(getCurrentEvent(events, day('2025-11-22'))?.id).toBe('midsem');
  });
  it('finds an event on its inclusive end boundary', () => {
    expect(getCurrentEvent(events, day('2025-11-30'))?.id).toBe('midsem');
  });
  it('returns null the day after an event ends', () => {
    expect(isOngoing(events[0], day('2025-12-01'))).toBe(false);
  });
  it('returns null in a gap between events', () => {
    const gapped = [ev('a', 'class', '2025-01-01', '2025-01-05'), ev('b', 'class', '2025-02-01', '2025-02-05')];
    expect(getCurrentEvent(gapped, day('2025-01-15'))).toBeNull();
  });
});

describe('getNextEvent', () => {
  it('picks the earliest event strictly after today', () => {
    expect(getNextEvent(events, day('2025-11-21'))?.id).toBe('midsem');
  });
  it('does NOT count an event starting today (that is "current", not "next")', () => {
    expect(getNextEvent(events, day('2025-11-22'))?.id).toBe('classes2');
  });
  it('filters by type', () => {
    expect(getNextEvent(events, day('2025-11-01'), ['exam'])?.id).toBe('exam');
  });
  it('returns null when nothing is upcoming', () => {
    expect(getNextEvent(events, day('2026-03-01'))).toBeNull();
  });
});

describe('getDaysUntil / getDaysLeft', () => {
  it('is 0 for an event starting today', () => {
    expect(getDaysUntil(events[0], day('2025-11-22'))).toBe(0);
  });
  it('counts whole calendar days to the start', () => {
    expect(getDaysUntil(events[3], day('2026-01-24'))).toBe(2);
  });
  it('counts inclusive days left on an ongoing event', () => {
    // 22nd through 30th inclusive: on the 28th, 2 days remain (29th, 30th).
    expect(getDaysLeft(events[0], day('2025-11-28'))).toBe(2);
  });
});

describe('isPast', () => {
  it('is true only after the inclusive end', () => {
    expect(isPast(events[0], day('2025-11-30'))).toBe(false);
    expect(isPast(events[0], day('2025-12-01'))).toBe(true);
  });
});

describe('getSemesterProgress', () => {
  const sem: Semester = {
    number: 1,
    label: 'S1',
    labelEn: 'S1',
    start: '2025-10-06',
    end: '2026-02-08',
    events: [],
  };
  it('clamps before/after to 0 and 1', () => {
    expect(getSemesterProgress(sem, day('2025-01-01'))).toBe(0);
    expect(getSemesterProgress(sem, day('2027-01-01'))).toBe(1);
  });
  it('is ~0.5 at the midpoint', () => {
    const p = getSemesterProgress(sem, day('2025-12-08'));
    expect(p).toBeGreaterThan(0.4);
    expect(p).toBeLessThan(0.6);
  });
});
