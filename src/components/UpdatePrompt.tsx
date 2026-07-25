import { useRegisterSW } from 'virtual:pwa-register/react';
import { useLang } from '../hooks/useLang';

/** "New version available, reload" affordance (FR-8.5). registerType is
 * 'prompt', so the SW waits for the user instead of refreshing unexpectedly. */
export function UpdatePrompt() {
  const { t } = useLang();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-sm rounded-xl bg-slate-900 px-4 py-3 text-white shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm">{t.updateAvailable}</span>
        <div className="flex gap-2">
          <button
            onClick={() => updateServiceWorker(true)}
            className="rounded-lg bg-brand px-3 py-1 text-sm font-semibold"
          >
            {t.reload}
          </button>
          <button
            onClick={() => setNeedRefresh(false)}
            aria-label="Dismiss"
            className="px-2 text-slate-400"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
