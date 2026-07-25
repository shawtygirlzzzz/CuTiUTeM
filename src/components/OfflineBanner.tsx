import { useOnline } from '../hooks/useOnline';
import { useLang } from '../hooks/useLang';

/** Thin banner shown when the network is unavailable (FR-8.4). */
export function OfflineBanner() {
  const online = useOnline();
  const { t } = useLang();
  if (online) return null;
  return (
    <div
      role="status"
      className="bg-amber-500 px-4 py-1.5 text-center text-sm font-medium text-amber-950"
    >
      {t.offline}
    </div>
  );
}
