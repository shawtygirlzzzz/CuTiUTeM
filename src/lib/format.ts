// Locale-aware date formatting — FR-10.5. Uses date-fns locales (ms / enGB);
// never hand-roll month names. parseISO is safe here because we only format
// (no cross-day comparison).
import { format, parseISO } from 'date-fns';
import { dateFnsLocale } from './i18n';
import type { Lang } from './types';

export function formatDate(iso: string, lang: Lang): string {
  return format(parseISO(iso), 'd MMM yyyy', { locale: dateFnsLocale[lang] });
}

export function formatDay(iso: string, lang: Lang): string {
  return format(parseISO(iso), 'EEE, d MMM', { locale: dateFnsLocale[lang] });
}

/** "6 – 19 Jul 2026" style range; collapses single-day events to one date. */
export function formatRange(start: string, end: string, lang: Lang): string {
  if (start === end) return formatDate(start, lang);
  const s = parseISO(start);
  const e = parseISO(end);
  const loc = { locale: dateFnsLocale[lang] };
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  const sameYear = s.getFullYear() === e.getFullYear();
  if (sameMonth) {
    return `${format(s, 'd', loc)} – ${format(e, 'd MMM yyyy', loc)}`;
  }
  if (sameYear) {
    return `${format(s, 'd MMM', loc)} – ${format(e, 'd MMM yyyy', loc)}`;
  }
  return `${format(s, 'd MMM yyyy', loc)} – ${format(e, 'd MMM yyyy', loc)}`;
}
