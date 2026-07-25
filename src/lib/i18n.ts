// Internationalization — SDD §5.5. No i18n library: a typed dictionary gives
// compile-time safety (a missing English key is a compile error) at zero
// bundle cost. Count-dependent strings are functions because Malay has no
// plural inflection and English does.
import { ms, enGB } from 'date-fns/locale';
import type { CalendarEvent, EventType, Lang } from './types';

// The shape of one language's dictionary. `en` and `ms` are both checked
// against it, so a key present in one but missing in the other fails the build.
interface Dict {
  appName: string;
  home: string;
  calendar: string;
  ask: string;
  nextBreak: string;
  daysLeft: (n: number) => string;
  today: string;
  inProgress: string;
  comingUp: string;
  selectProgram: string;
  diploma: string;
  degree: string;
  master: string;
  changeProgram: string;
  askPlaceholder: string;
  askEmptyHint: string;
  offline: string;
  offlineAsk: string;
  historicalBanner: string;
  lastUpdated: string;
  officialSource: string;
  disclaimer: string;
  exportCalendar: string;
  exportAll: string;
  historical: string;
  current: string;
  noUpcoming: string;
  switchSession: string;
  send: string;
  thinking: string;
  askError: string;
  updateAvailable: string;
  reload: string;
  longWeekend: string;
  eventType: Record<EventType, string>;
}

export const strings = {
  ms: {
    appName: 'Cuti UTeM',
    home: 'Utama',
    calendar: 'Kalendar',
    ask: 'Tanya',
    nextBreak: 'Cuti seterusnya',
    daysLeft: (n: number) => `${n} hari lagi`,
    today: 'Hari ini',
    inProgress: 'Sedang berlangsung',
    comingUp: 'Akan datang',
    selectProgram: 'Pilih peringkat pengajian',
    diploma: 'Diploma',
    degree: 'Sarjana Muda',
    master: 'Sarjana',
    changeProgram: 'Tukar program',
    askPlaceholder: 'Tanya apa-apa tentang kalendar…',
    askEmptyHint: 'Cuba tanya soalan ini:',
    offline: 'Tiada sambungan internet',
    offlineAsk: 'Ciri Tanya memerlukan sambungan internet. Ciri lain masih berfungsi.',
    historicalBanner: 'Anda sedang melihat sesi lepas',
    lastUpdated: 'Dikemas kini',
    officialSource: 'Kalendar rasmi UTeM',
    disclaimer: 'Kalendar rasmi UTeM adalah rujukan muktamad.',
    exportCalendar: 'Muat turun ke kalendar',
    exportAll: 'Muat turun semua',
    historical: 'Sesi lepas',
    current: 'Sesi semasa',
    noUpcoming: 'Tiada acara akan datang dalam sesi ini.',
    switchSession: 'Tukar sesi untuk melihat tarikh lain.',
    send: 'Hantar',
    thinking: 'Sedang berfikir…',
    askError: 'Maaf, ada masalah. Cuba lagi.',
    updateAvailable: 'Versi baharu tersedia',
    reload: 'Muat semula',
    longWeekend: 'Peluang cuti panjang',
    eventType: {
      semester_start: 'Mula semester',
      semester_end: 'Tamat semester',
      registration: 'Pendaftaran',
      class: 'Kuliah',
      break: 'Cuti',
      study_week: 'Minggu Ulangkaji',
      exam: 'Peperiksaan',
      holiday: 'Cuti umum',
      special: 'Khas',
    },
  },
  en: {
    appName: 'Cuti UTeM',
    home: 'Home',
    calendar: 'Calendar',
    ask: 'Ask',
    nextBreak: 'Next break',
    daysLeft: (n: number) => `${n} day${n === 1 ? '' : 's'} left`,
    today: 'Today',
    inProgress: 'In progress',
    comingUp: 'Coming up',
    selectProgram: 'Select your program level',
    diploma: 'Diploma',
    degree: 'Bachelor',
    master: 'Master',
    changeProgram: 'Change program',
    askPlaceholder: 'Ask anything about the calendar…',
    askEmptyHint: 'Try asking:',
    offline: 'No internet connection',
    offlineAsk: 'Ask needs an internet connection. Everything else still works.',
    historicalBanner: 'You are viewing a past session',
    lastUpdated: 'Last updated',
    officialSource: 'Official UTeM calendar',
    disclaimer: 'The official UTeM calendar is authoritative.',
    exportCalendar: 'Export to calendar',
    exportAll: 'Export all',
    historical: 'Past session',
    current: 'Current session',
    noUpcoming: 'No upcoming events in this session.',
    switchSession: 'Switch session to see other dates.',
    send: 'Send',
    thinking: 'Thinking…',
    askError: 'Sorry, something went wrong. Try again.',
    updateAvailable: 'A new version is available',
    reload: 'Reload',
    longWeekend: 'Long weekend opportunity',
    eventType: {
      semester_start: 'Semester start',
      semester_end: 'Semester end',
      registration: 'Registration',
      class: 'Classes',
      break: 'Break',
      study_week: 'Study Week',
      exam: 'Exam',
      holiday: 'Public holiday',
      special: 'Special',
    },
  },
} as const satisfies Record<Lang, Dict>;

export type Strings = (typeof strings)[Lang];

export const dateFnsLocale = { ms, en: enGB } as const;

// Resolve an event's display name for the active language. The fallback to
// `name` is a runtime safety net only; validate:data prevents it ever firing
// in committed data (SDD §5.5).
export const eventName = (e: CalendarEvent, lang: Lang): string =>
  lang === 'en' ? e.nameEn || e.name : e.name;

export const eventNote = (e: CalendarEvent, lang: Lang): string | undefined =>
  lang === 'en' ? e.noteEn ?? e.note : e.note;
