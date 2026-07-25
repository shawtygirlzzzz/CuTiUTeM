// Client for the AI assistant endpoint — SDD §6. The client sends only the
// question and identifiers; the Worker loads the calendar JSON server-side, so
// a client cannot inject a fabricated calendar (SDD §6.1).
import type { ProgramLevel } from './types';

export interface AskRequest {
  question: string;
  program: ProgramLevel;
  session: string;
  today: string; // YYYY-MM-DD
}

export async function askAssistant(req: AskRequest, signal?: AbortSignal): Promise<string> {
  const res = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
    signal,
  });
  if (!res.ok) {
    throw new Error(`Assistant request failed: ${res.status}`);
  }
  const data = (await res.json()) as { answer?: string };
  if (!data.answer) throw new Error('Empty answer');
  return data.answer;
}
