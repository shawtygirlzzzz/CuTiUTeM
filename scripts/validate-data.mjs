#!/usr/bin/env node
// Data validation — SDD §10. Runs in CI and fails the build on: malformed
// dates, end < start, missing program keys, duplicate event ids, events outside
// their semester bounds, missing/empty name or nameEn, or nameEn identical to
// name (which almost always signals an untranslated placeholder). Zero deps.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data');
const PROGRAMS = ['diploma', 'degree', 'master'];
const EVENT_TYPES = new Set([
  'semester_start', 'semester_end', 'registration', 'class', 'break',
  'study_week', 'exam', 'holiday', 'special',
]);
const SCOPES = new Set(['national', 'melaka', 'johor']);

const errors = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const isValidDate = (s) => {
  if (!ISO.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};
const read = (name) => JSON.parse(readFileSync(join(DATA, name), 'utf-8'));

// Master may legitimately be empty until its separate calendar is transcribed;
// warn (don't fail) so the build stays green while the rest ships.
const warnings = [];

function checkEvent(file, ctx, e, seenIds, bounds) {
  const where = `${ctx} event "${e.id ?? '(no id)'}"`;
  if (!e.id) err(file, `${where}: missing id`);
  else if (seenIds.has(e.id)) err(file, `${where}: duplicate id`);
  else seenIds.add(e.id);

  if (!e.name || !String(e.name).trim()) err(file, `${where}: empty "name"`);
  if (!e.nameEn || !String(e.nameEn).trim()) err(file, `${where}: empty "nameEn"`);
  if (e.name && e.nameEn && e.name === e.nameEn && e.type !== 'holiday') {
    err(file, `${where}: nameEn identical to name (untranslated placeholder?)`);
  }
  if (!EVENT_TYPES.has(e.type)) err(file, `${where}: unknown type "${e.type}"`);
  if (!isValidDate(e.start)) err(file, `${where}: bad start "${e.start}"`);
  if (!isValidDate(e.end)) err(file, `${where}: bad end "${e.end}"`);
  if (isValidDate(e.start) && isValidDate(e.end) && e.end < e.start) {
    err(file, `${where}: end (${e.end}) before start (${e.start})`);
  }
  if (bounds && isValidDate(e.start) && isValidDate(e.end)) {
    if (e.start < bounds.start || e.end > bounds.end) {
      err(file, `${where}: outside semester bounds [${bounds.start}, ${bounds.end}]`);
    }
  }
}

function checkSession(file) {
  const data = read(file);
  if (!data.session) err(file, 'missing "session"');
  if (!isValidDate(data.lastUpdated)) err(file, `bad lastUpdated "${data.lastUpdated}"`);
  if (!data.programs) return err(file, 'missing "programs"');

  for (const p of PROGRAMS) {
    if (!(p in data.programs)) err(file, `missing program key "${p}"`);
  }
  for (const [prog, cal] of Object.entries(data.programs)) {
    const seenIds = new Set();
    if (!cal || !Array.isArray(cal.semesters)) {
      err(file, `program "${prog}": missing semesters array`);
      continue;
    }
    if (cal.semesters.length === 0) {
      warnings.push(`${file}: program "${prog}" has no semesters (empty calendar)`);
    }
    for (const s of cal.semesters) {
      const ctx = `program "${prog}" / ${s.labelEn ?? s.label ?? 'semester'}`;
      if (![1, 2, 3].includes(s.number)) err(file, `${ctx}: bad semester number`);
      if (!isValidDate(s.start) || !isValidDate(s.end)) err(file, `${ctx}: bad semester dates`);
      const events = [...(s.events ?? [])];
      for (const e of events) checkEvent(file, ctx, e, seenIds, { start: s.start, end: s.end });
      // Events must be sorted ascending by start (SDD §4.3).
      const sorted = [...events].sort((a, b) => a.start.localeCompare(b.start));
      if (JSON.stringify(events.map((e) => e.id)) !== JSON.stringify(sorted.map((e) => e.id))) {
        err(file, `${ctx}: events not sorted ascending by start`);
      }
    }
  }
}

function checkHolidays(file) {
  const list = read(file);
  if (!Array.isArray(list)) return err(file, 'must be an array');
  list.forEach((h, i) => {
    const where = `holiday[${i}] (${h.date ?? '?'})`;
    if (!h.name || !String(h.name).trim()) err(file, `${where}: empty name`);
    if (!h.nameEn || !String(h.nameEn).trim()) err(file, `${where}: empty nameEn`);
    if (!isValidDate(h.date)) err(file, `${where}: bad date`);
    if (!SCOPES.has(h.scope)) err(file, `${where}: bad scope "${h.scope}"`);
  });
}

function checkIndex(file) {
  const idx = read(file);
  if (!idx.current) err(file, 'missing "current"');
  if (!Array.isArray(idx.sessions) || idx.sessions.length === 0) {
    return err(file, 'missing/empty sessions');
  }
  const ids = idx.sessions.map((s) => s.id);
  if (!ids.includes(idx.current)) err(file, `current "${idx.current}" not in sessions`);
  const files = new Set(readdirSync(DATA));
  for (const s of idx.sessions) {
    if (!s.id || !s.label || !s.file) err(file, `session entry missing fields: ${JSON.stringify(s)}`);
    else if (!files.has(s.file)) err(file, `session file "${s.file}" does not exist`);
  }
}

checkIndex('index.json');
checkHolidays('holidays-my.json');
for (const f of readdirSync(DATA)) {
  if (f === 'index.json' || f === 'holidays-my.json' || !f.endsWith('.json')) continue;
  checkSession(f);
}

for (const w of warnings) console.warn(`\x1b[33mwarn\x1b[0m  ${w}`);
if (errors.length) {
  console.error(`\n\x1b[31m✗ ${errors.length} data error(s):\x1b[0m`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`\x1b[32m✓ data valid\x1b[0m (${warnings.length} warning(s))`);
