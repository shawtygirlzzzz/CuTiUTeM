import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { useState } from 'react';
import { useLang } from './hooks/useLang';
import { useProgram } from './hooks/useProgram';
import { useCalendar } from './hooks/useCalendar';
import { LangToggle } from './components/LangToggle';
import { ProgramPicker } from './components/ProgramPicker';
import { OfflineBanner } from './components/OfflineBanner';
import { UpdatePrompt } from './components/UpdatePrompt';
import { Home } from './pages/Home';
import { Calendar } from './pages/Calendar';
import { Ask } from './pages/Ask';

export default function App() {
  const { t } = useLang();
  const { program } = useProgram();
  const { loading, error, retry, session } = useCalendar();
  const [pickerOpen, setPickerOpen] = useState(false);

  // First launch: no program selected yet → full-screen picker (FR-1.1).
  if (!program || pickerOpen) {
    return <ProgramPicker onDone={() => setPickerOpen(false)} />;
  }

  const programLabel = t[program];

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col">
      <OfflineBanner />

      <header className="flex items-center justify-between gap-2 px-4 py-3">
        <button
          onClick={() => setPickerOpen(true)}
          className="rounded-full bg-brand/10 px-3 py-1.5 text-sm font-semibold text-brand"
          title={t.changeProgram}
        >
          {programLabel} ▾
        </button>
        <LangToggle />
      </header>

      <main className="flex-1 px-4 pb-24">
        {error ? (
          <div className="rounded-2xl bg-white p-8 text-center">
            <p className="text-slate-700">⚠️</p>
            <button
              onClick={retry}
              className="mt-3 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white"
            >
              {t.reload}
            </button>
          </div>
        ) : loading && !session ? (
          <div className="py-20 text-center text-slate-400">…</div>
        ) : (
          <>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/ask" element={<Ask />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {session && (
              <footer className="mt-8 space-y-1 text-center text-xs text-slate-400">
                <p>
                  {t.lastUpdated}: {session.lastUpdated}
                </p>
                <a
                  href={session.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  {t.officialSource}
                </a>
                <p>{t.disclaimer}</p>
              </footer>
            )}
          </>
        )}
      </main>

      <UpdatePrompt />
      <BottomNav />
    </div>
  );
}

function BottomNav() {
  const { t } = useLang();
  const tabs = [
    { to: '/', label: t.home, icon: '🏠' },
    { to: '/calendar', label: t.calendar, icon: '🗓️' },
    { to: '/ask', label: t.ask, icon: '💬' },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md justify-around border-t border-slate-200 bg-white/95 backdrop-blur">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
              isActive ? 'text-brand' : 'text-slate-500'
            }`
          }
        >
          <span aria-hidden className="text-lg">
            {tab.icon}
          </span>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
