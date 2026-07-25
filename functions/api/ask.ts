// AI assistant endpoint — SDD §6. Cloudflare Pages Function.
//
// Why server-side: the Gemini key must never reach the client (FR-7.6), and the
// calendar JSON is loaded here from the same origin rather than trusted from the
// client, so a client cannot inject a fabricated calendar (SDD §6.1).

// Pin the exact stable model string. Never use an alias like
// 'gemini-flash-latest' — aliases are hot-swapped on release and would silently
// change behavior in production (SDD §6.5). Bump this ~annually.
const MODEL = 'gemini-3.5-flash-lite';

const PROGRAMS = new Set(['diploma', 'degree', 'master']);
const MAX_QUESTION_LEN = 500;
const RATE_LIMIT = 20; // requests
const RATE_WINDOW_S = 60 * 60; // per hour, by IP (SDD §6.3)

interface Env {
  GEMINI_API_KEY: string;
  RATE_LIMIT?: KVNamespace;
  ASSETS: Fetcher;
}

interface AskBody {
  question?: unknown;
  program?: unknown;
  session?: unknown;
  today?: unknown;
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const SYSTEM = (today: string, program: string) =>
  `You are a helpful assistant for UTeM students. Answer only from the academic ` +
  `calendar and public holidays JSON provided (academicCalendar + publicHolidays). ` +
  `Today's date is ${today}. The student is in the ${program} ` +
  `program. Reply in the same language mix the student used — Malay, English, or both. ` +
  `Match their register: casual questions get casual answers. Be brief and ` +
  `conversational. Reply in plain text — no Markdown (no **, #, or bullet symbols). ` +
  `If the calendar does not contain the answer, say you do not have ` +
  `that information and suggest checking the official UTeM calendar. Never invent dates.`;

async function rateLimited(env: Env, ip: string): Promise<boolean> {
  if (!env.RATE_LIMIT) return false; // KV not bound (e.g. local dev) → skip
  const key = `rl:${ip}`;
  const current = parseInt((await env.RATE_LIMIT.get(key)) ?? '0', 10);
  if (current >= RATE_LIMIT) return true;
  await env.RATE_LIMIT.put(key, String(current + 1), { expirationTtl: RATE_WINDOW_S });
  return false;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  let body: AskBody;
  try {
    body = (await request.json()) as AskBody;
  } catch {
    return json({ error: 'Bad request' }, 400);
  }

  const { question, program, session, today } = body;

  // Validate inputs against known values before use (SDD §6.3).
  if (typeof question !== 'string' || !question.trim() || question.length > MAX_QUESTION_LEN) {
    return json({ error: 'Invalid question' }, 400);
  }
  if (typeof program !== 'string' || !PROGRAMS.has(program)) {
    return json({ error: 'Invalid program' }, 400);
  }
  if (typeof session !== 'string' || !/^[0-9]{4}-[0-9]{4}$/.test(session)) {
    return json({ error: 'Invalid session' }, 400);
  }
  if (typeof today !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(today)) {
    return json({ error: 'Invalid date' }, 400);
  }

  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  if (await rateLimited(env, ip)) {
    return json({ error: 'Rate limit exceeded. Try again later.' }, 429);
  }

  // Load the calendar + public holidays server-side from static assets, so a
  // client can't inject fabricated data (SDD §6.1). Holidays live in a separate
  // file (SDD §5.2), but the assistant needs them to answer questions like
  // "bila cuti raya?" (PRD US-5), so we merge them into the payload here.
  let calendarJson: string;
  try {
    const origin = new URL(request.url);
    const [sesRes, holRes] = await Promise.all([
      env.ASSETS.fetch(new Request(new URL(`/data/${session}.json`, origin).toString())),
      env.ASSETS.fetch(new Request(new URL('/data/holidays-my.json', origin).toString())),
    ]);
    if (!sesRes.ok) return json({ error: 'Calendar not found' }, 404);

    const data = (await sesRes.json()) as {
      programs?: Record<string, { semesters?: { start: string; end: string }[] }>;
    };
    const programCal = data.programs?.[program];

    // Filter holidays to the program's date span so the model doesn't cite a
    // holiday from an unrelated session. ISO YYYY-MM-DD compares lexically.
    let publicHolidays: unknown[] = [];
    if (holRes.ok) {
      const all = (await holRes.json()) as { date: string }[];
      const sems = programCal?.semesters ?? [];
      if (sems.length > 0) {
        const lo = sems.map((s) => s.start).sort()[0];
        const hi = sems.map((s) => s.end).sort().at(-1)!;
        publicHolidays = all.filter((h) => h.date >= lo && h.date <= hi);
      } else {
        publicHolidays = all;
      }
    }

    // Both name + nameEn are retained so the model can answer in either
    // language (SDD §6.2).
    calendarJson = JSON.stringify({ academicCalendar: programCal ?? {}, publicHolidays });
  } catch {
    return json({ error: 'Calendar unavailable' }, 502);
  }

  const geminiUrl =
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent` +
    `?key=${env.GEMINI_API_KEY}`;

  try {
    const res = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM(today, program) }] },
        contents: [
          {
            role: 'user',
            parts: [{ text: `Calendar JSON:\n${calendarJson}\n\nQuestion: ${question}` }],
          },
        ],
        generationConfig: { temperature: 0.2 },
      }),
    });

    if (!res.ok) {
      // Never surface the raw upstream error (SDD §6.3).
      return json({ error: 'Assistant temporarily unavailable' }, 502);
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!answer) return json({ error: 'No answer' }, 502);

    return json({ answer });
  } catch {
    return json({ error: 'Assistant temporarily unavailable' }, 502);
  }
};
