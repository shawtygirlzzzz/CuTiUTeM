// Data loading — SDD §5.4.
// 1. Fetch /data/index.json  2. Determine target session (URL ?s= / selection /
// current)  3. Fetch the session file + holidays-my.json in parallel  4. Merge,
// sort, expose via context. Fetch failure falls back to the SW cache; if both
// fail we surface an error with a retry.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import { buildProgramView, type ProgramView } from '../lib/session';
import type {
  ProgramLevel,
  PublicHoliday,
  SessionData,
  SessionIndex,
} from '../lib/types';

interface CalendarContextValue {
  loading: boolean;
  error: boolean;
  retry: () => void;
  index: SessionIndex | null;
  sessionId: string | null;
  setSessionId: (id: string) => void;
  session: SessionData | null;
  isHistorical: boolean;
  viewFor: (program: ProgramLevel) => ProgramView | null;
}

const CalendarContext = createContext<CalendarContextValue | null>(null);

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return (await res.json()) as T;
}

export function CalendarProvider({ children }: { children: ReactNode }) {
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [index, setIndex] = useState<SessionIndex | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [holidays, setHolidays] = useState<PublicHoliday[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  const urlSession = params.get('s');

  // Load the index once (or on retry).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    (async () => {
      try {
        const [idx, hol] = await Promise.all([
          getJson<SessionIndex>('/data/index.json'),
          getJson<PublicHoliday[]>('/data/holidays-my.json'),
        ]);
        if (cancelled) return;
        setIndex(idx);
        setHolidays(hol);
        const wanted =
          (urlSession && idx.sessions.some((s) => s.id === urlSession) && urlSession) ||
          idx.current;
        setSessionId(wanted);
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey, urlSession]);

  // Load the selected session file whenever the id changes.
  useEffect(() => {
    if (!index || !sessionId) return;
    const meta = index.sessions.find((s) => s.id === sessionId);
    if (!meta) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await getJson<SessionData>(`/data/${meta.file}`);
        if (cancelled) return;
        setSession(data);
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [index, sessionId]);

  const retry = useCallback(() => setReloadKey((k) => k + 1), []);

  const viewFor = useCallback(
    (program: ProgramLevel): ProgramView | null =>
      session ? buildProgramView(session, holidays, program) : null,
    [session, holidays],
  );

  const value = useMemo<CalendarContextValue>(
    () => ({
      loading,
      error,
      retry,
      index,
      sessionId,
      setSessionId,
      session,
      isHistorical: !!index && !!sessionId && sessionId !== index.current,
      viewFor,
    }),
    [loading, error, retry, index, sessionId, session, viewFor],
  );

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}

export function useCalendar(): CalendarContextValue {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error('useCalendar must be used within CalendarProvider');
  return ctx;
}
