// Data model — SDD §4. These types are the source of truth for the data files.

export type ProgramLevel = 'diploma' | 'degree' | 'master';
export type Lang = 'ms' | 'en';

export type EventType =
  | 'semester_start'
  | 'semester_end'
  | 'registration'
  | 'class'
  | 'break'
  | 'study_week'
  | 'exam'
  | 'holiday'
  | 'special';

export interface CalendarEvent {
  id: string; // stable slug, e.g. "s1-midsem-break"
  name: string; // Malay label, e.g. "Cuti Pertengahan Semester"
  nameEn: string; // English label — required
  type: EventType;
  start: string; // ISO date, YYYY-MM-DD, inclusive
  end: string; // ISO date, YYYY-MM-DD, inclusive
  note?: string; // Malay
  noteEn?: string; // English
}

export interface Semester {
  number: 1 | 2 | 3; // 3 = short/special semester
  label: string; // "Semester 2 2025/2026"
  labelEn: string;
  start: string;
  end: string;
  events: CalendarEvent[];
}

export interface ProgramCalendar {
  semesters: Semester[];
}

export interface SessionData {
  session: string; // "2025/2026"
  sourceUrl: string; // link to the official PDF
  lastUpdated: string; // ISO date
  programs: Record<ProgramLevel, ProgramCalendar>;
}

export interface SessionMeta {
  id: string;
  label: string; // language-neutral, e.g. "Sesi 2025/2026"
  file: string;
}

export interface SessionIndex {
  current: string;
  lastUpdated: string;
  sessions: SessionMeta[];
}

export interface PublicHoliday {
  name: string; // Malay
  nameEn: string; // English
  date: string; // ISO date
  scope: 'national' | 'melaka' | 'johor';
}
