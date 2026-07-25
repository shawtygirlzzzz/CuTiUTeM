import { useRef, useState } from 'react';
import { useLang } from '../hooks/useLang';
import { useOnline } from '../hooks/useOnline';
import { useProgram } from '../hooks/useProgram';
import { useCalendar } from '../hooks/useCalendar';
import { askAssistant } from '../lib/api';
import { todayISO } from '../lib/calendar';
import { format } from 'date-fns';

interface Turn {
  role: 'user' | 'assistant';
  text: string;
}

// Suggested starters shown when the transcript is empty (FR-7.7). Deliberately
// bilingual/Manglish — the model mirrors whatever the student types (FR-7.4).
const SUGGESTIONS = ['Bila cuti raya?', 'When is my next exam?', 'Cuti panjang bulan depan ada tak?'];

export function ChatPanel() {
  const { t } = useLang();
  const online = useOnline();
  const { program } = useProgram();
  const { session, sessionId } = useCalendar();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const send = async (question: string) => {
    const q = question.trim();
    if (!q || busy || !program || !session || !sessionId) return;
    setTurns((prev) => [...prev, { role: 'user', text: q }]);
    setInput('');
    setBusy(true);
    abortRef.current = new AbortController();
    try {
      const answer = await askAssistant(
        {
          question: q,
          program,
          session: sessionId,
          today: format(todayISO(), 'yyyy-MM-dd'),
        },
        abortRef.current.signal,
      );
      setTurns((prev) => [...prev, { role: 'assistant', text: answer }]);
    } catch {
      setTurns((prev) => [...prev, { role: 'assistant', text: t.askError }]);
    } finally {
      setBusy(false);
    }
  };

  if (!online) {
    return (
      <div className="rounded-xl bg-white p-6 text-center text-slate-600">{t.offlineAsk}</div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3">
        {turns.length === 0 ? (
          <div className="rounded-xl bg-white p-4">
            <p className="mb-3 text-sm text-slate-500">{t.askEmptyHint}</p>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 hover:border-brand"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          turns.map((turn, i) => (
            <div
              key={i}
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                turn.role === 'user'
                  ? 'self-end bg-brand text-white'
                  : 'self-start bg-white text-slate-800'
              }`}
            >
              {turn.text}
            </div>
          ))
        )}
        {busy && <div className="self-start text-sm text-slate-400">{t.thinking}</div>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="sticky bottom-16 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          placeholder={t.askPlaceholder}
          className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm focus:border-brand focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {t.send}
        </button>
      </form>
    </div>
  );
}
