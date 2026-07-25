// Semantic event-type colors (SDD §8), as static Tailwind class strings so the
// JIT compiler keeps them. All pairings meet AA contrast.
import type { EventType } from './types';

export interface EventStyle {
  bar: string; // solid accent (timeline rail, countdown)
  chip: string; // label pill (bg + text)
  dot: string; // timeline node
}

export const eventStyle: Record<EventType, EventStyle> = {
  break: { bar: 'bg-green-600', chip: 'bg-green-100 text-green-800', dot: 'bg-green-600' },
  holiday: { bar: 'bg-teal-600', chip: 'bg-teal-100 text-teal-800', dot: 'bg-teal-600' },
  study_week: { bar: 'bg-amber-500', chip: 'bg-amber-100 text-amber-900', dot: 'bg-amber-500' },
  exam: { bar: 'bg-red-600', chip: 'bg-red-100 text-red-800', dot: 'bg-red-600' },
  semester_start: { bar: 'bg-slate-500', chip: 'bg-slate-200 text-slate-800', dot: 'bg-slate-500' },
  semester_end: { bar: 'bg-slate-500', chip: 'bg-slate-200 text-slate-800', dot: 'bg-slate-500' },
  registration: { bar: 'bg-slate-500', chip: 'bg-slate-200 text-slate-800', dot: 'bg-slate-500' },
  class: { bar: 'bg-slate-400', chip: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400' },
  special: { bar: 'bg-violet-600', chip: 'bg-violet-100 text-violet-800', dot: 'bg-violet-600' },
};
