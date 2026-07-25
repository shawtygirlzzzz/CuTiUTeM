// Program context — SDD §5.3. Resolution order: URL ?p= → localStorage → null
// (show the picker). A valid URL param is persisted so the link is sticky.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ProgramLevel } from '../lib/types';

const KEY = 'cutiutem.program';

// URL uses ?p=diploma|degree|master directly (matches ProgramLevel).
const isProgram = (v: unknown): v is ProgramLevel =>
  v === 'diploma' || v === 'degree' || v === 'master';

interface ProgramContextValue {
  program: ProgramLevel | null;
  setProgram: (p: ProgramLevel) => void;
}

const ProgramContext = createContext<ProgramContextValue | null>(null);

function resolveInitial(param: string | null): ProgramLevel | null {
  if (isProgram(param)) return param;
  const stored = localStorage.getItem(KEY);
  if (isProgram(stored)) return stored;
  return null;
}

export function ProgramProvider({ children }: { children: ReactNode }) {
  const [params] = useSearchParams();
  const [program, setProgram] = useState<ProgramLevel | null>(() =>
    resolveInitial(params.get('p')),
  );

  useEffect(() => {
    const p = params.get('p');
    if (isProgram(p)) setProgram(p);
  }, [params]);

  useEffect(() => {
    if (program) localStorage.setItem(KEY, program);
  }, [program]);

  return (
    <ProgramContext.Provider value={{ program, setProgram }}>
      {children}
    </ProgramContext.Provider>
  );
}

export function useProgram(): ProgramContextValue {
  const ctx = useContext(ProgramContext);
  if (!ctx) throw new Error('useProgram must be used within ProgramProvider');
  return ctx;
}
