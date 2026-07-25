# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Cuti UTeM** — an installable, offline-first PWA that tells UTeM students when their semester
breaks, study weeks, exams, and public holidays fall, filtered to their program level (Diploma /
Bachelor / Master), with no login and no network required. Bilingual UI (Bahasa Malaysia default,
English). Three views: Home (countdown), Kalendar (timeline), Tanya (AI chat). Deploy target:
`cuti.nathrah.uk` on Cloudflare Pages.

The full spec lives in `PRD.md` and `SDD.md` — but note **both are PDFs saved with a `.md`
extension** (Chromium print-to-PDF). Open them with a PDF reader / `pdfplumber`, not as text. This
`CLAUDE.md` is real Markdown.

## Commands

```bash
npm install          # first-time setup
npm run dev          # Vite dev server at :5173 — UI only, does NOT run the Function (chat errors here)
npm run build        # tsc -b && vite build → dist/ (Cloudflare Pages build command)
npm test             # Vitest (run once);  npm run test:watch to watch
npm run typecheck    # tsc -b --noEmit across app + node + functions projects
npm run validate:data # gate on data integrity — MUST pass in CI (see below)
```

- Run one test file: `npx vitest run src/lib/calendar.test.ts`
- **Testing the chat needs the Function running**, which needs a Gemini key. Locally:
  `npm run build` then `npx wrangler pages dev dist` (put the key in a gitignored `.dev.vars`).
  `npm run dev` alone cannot serve `/api/ask`.

## Architecture (the big picture)

Static SPA + **one** serverless function. No database, no server state. Calendar data is small
(tens of KB), identical for all users, changes twice a year — so it ships as **static JSON in
`public/data/`**, giving offline support for free. The *only* reason server code exists is that the
Gemini API key must never reach the client.

- `functions/api/ask.ts` — Cloudflare Pages Function. Receives `{question, program, session, today}`,
  **loads the session JSON server-side** from static assets (never trusts client-supplied calendar
  data — prevents prompt-injection of fake dates), sends only the requested program's calendar to
  Gemini, returns `{answer}`. Typed against `@cloudflare/workers-types` via its own
  `tsconfig.functions.json` (Worker libs, not DOM).
- `src/lib/` holds the real logic: `calendar.ts` (date math), `holidays.ts` (merge + long-weekend
  detection), `session.ts` (per-program view assembly), `i18n.ts` (typed string dictionary),
  `format.ts` (locale dates), `ics.ts`, `eventStyle.ts`, `types.ts`, `api.ts`.
- `src/hooks/` — React context providers: `useCalendar` (data loading), `useProgram`, `useLang`,
  `useOnline`. All four wrap `<App>` inside the Router in `main.tsx`.
- `src/components/` + `src/pages/` — presentational; `App.tsx` gates on program selection and hosts
  the bottom-tab nav.
- Data flow: fetch `/data/index.json` → pick session (URL `?s=` / selection / `current`) → fetch
  `{session}.json` + `holidays-my.json` in parallel → `buildProgramView` merges holidays as
  `type:'holiday'` events per semester and produces a flat sorted list → exposed via context.

## Data status

- `public/data/2025-2026.json`, `2026-2027.json` — real dates transcribed from UTeM's official
  Diploma & Bachelor calendars. **Diploma and Bachelor share identical dates**; both filled.
- **`master` is intentionally empty** in both files — UTeM publishes a *separate* postgraduate
  calendar that has not been sourced yet. `validate:data` warns (does not fail) on empty programs;
  the Home empty state (FR-2.5) covers it. Fill it when the postgraduate PDF is available.
- `holidays-my.json` — federal + Melaka holidays for the covered range. Dates still need a proofread
  against gazetted holidays (e.g. Deepavali 2026 was a self-contradictory date in the source PDF).
- `public/icons/*` are **placeholder** generated icons — replace before launch.

## Critical, easy-to-get-wrong constraints

- **Dates and timezone.** All dates are ISO `YYYY-MM-DD`, no times, no timezones; `end` is
  **inclusive** (a one-day event has `start === end`). Never do `new Date('2026-03-16')` — it parses
  as UTC and shifts a day backward in Malaysia (UTC+8). Always go through `day()` in `calendar.ts`
  (`parseISO` + `startOfDay`) and compare at local midnight. `format.ts` may use `parseISO` directly
  because it only formats, never compares. The date-boundary tests in `calendar.test.ts` matter most.
- **Home screen order:** `getCurrentEvent` first; only fall through to `getNextEvent` if it returns
  null (an in-progress event shows "X days left" for itself, FR-2.3). See `pages/Home.tsx`.
- **`nameEn` is required on every event and holiday.** English UI reads `nameEn` (falls back to
  `name` only as a runtime safety net). `validate:data` fails the build on missing/empty `name` or
  `nameEn`, and on `nameEn === name` for non-holidays (untranslated placeholder). A half-translated
  dataset is a data defect, not a soft warning.
- **i18n has no library.** `src/lib/i18n.ts` is a typed dictionary; `en` and `ms` are both checked
  against the `Dict` interface, so a missing key is a **compile error**. Count-dependent strings
  (`daysLeft`) are functions because Malay has no plural inflection and English does. Date formatting
  uses `date-fns` locales `ms` / `enGB` (there is no `en-MY`; `enGB` gives correct day-month order).
  `useLang` sets `document.documentElement.lang` on change.
- **AI language is exempt from the UI toggle** (FR-10.10). The chat frame uses the UI language, but
  the model mirrors whatever language the student wrote in — handled entirely in the prompt in
  `functions/api/ask.ts`, not UI state.
- **Gemini model ID is pinned** to `gemini-3.5-flash-lite` as a single `MODEL` constant in
  `functions/api/ask.ts`. Never use alias strings like `gemini-flash-latest` (hot-swapped → silent
  behavior change). Expect to bump ~annually.
- **Secrets:** `GEMINI_API_KEY` is a Cloudflare Pages env var read via `env` only — never in the repo
  or client bundle. Rate-limited by `CF-Connecting-IP` in KV (`RATE_LIMIT` binding, skipped if
  unbound). Rejects questions > 500 chars; validates `program`/`session` before use; returns generic
  errors, never the raw upstream error.
- **PWA update behavior:** `registerType: 'prompt'` (see `vite.config.ts`) so users get an explicit
  "new version, reload" affordance via `UpdatePrompt.tsx`. `/data/*.json` uses NetworkFirst with a
  3s timeout; `/api/*` is denylisted from the navigation fallback and never cached.

## Data model & shareable-URL params

Types in `src/lib/types.ts` are the source of truth (SDD §4): `SessionData` →
`programs: Record<ProgramLevel, ProgramCalendar>` → `Semester[]` → `CalendarEvent[]`.
`public/data/index.json` is the manifest read first. Invariants enforced by `validate:data`: events
sorted ascending by `start`, unique `id` per session file, all three `ProgramLevel` keys present,
events within their semester bounds, valid ISO dates with `end >= start`.

URL params override and persist to `localStorage` (sticky shared links): `?p=diploma|degree|master`,
`?lang=ms|en`, `?s={sessionId}`. `localStorage` keys: `cutiutem.program`, `cutiutem.lang`.

## Adding a new academic session (maintainer flow, twice a year)

Add one `public/data/{session}.json` (conforming to `SessionData`, all three program levels, both
`name` and `nameEn` per event, proofread twice against the official PDF), update `holidays-my.json`
for the new range, add the entry to `index.json` and bump `current` + `lastUpdated`, then run
`npm run validate:data` and commit. Validation is the guard against transcription errors — "wrong
date" is the #1 risk in the PRD.
