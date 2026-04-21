import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {
  getElectionStatus,
  getCandidates,
  getResults,
  getWinner,
} from '@/services/api';
import type { Candidate, ElectionStatus } from '@/services/types';

interface ElectionState {
  status: ElectionStatus | null;
  candidates: Candidate[];
  results: Candidate[];
  winner: Candidate | null;
  isLoading: boolean;
  error: string | null;
}

interface ElectionContextValue extends ElectionState {
  refresh: () => Promise<void>;
  refreshCandidates: () => Promise<void>;
  refreshResults: () => Promise<void>;
}

const ElectionContext = createContext<ElectionContextValue | null>(null);

export function ElectionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ElectionState>({
    status: null,
    candidates: [],
    results: [],
    winner: null,
    isLoading: true,
    error: null,
  });

  const fetchStatus = useCallback(async () => {
    try {
      const status = await getElectionStatus();
      setState((prev) => ({ ...prev, status, error: null }));
      return status;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch election status';
      setState((prev) => ({ ...prev, error: msg }));
      return null;
    }
  }, []);

  const refreshCandidates = useCallback(async () => {
    try {
      const candidates = await getCandidates();
      setState((prev) => ({ ...prev, candidates }));
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
    }
  }, []);

  const refreshResults = useCallback(async () => {
    try {
      const results = await getResults();
      setState((prev) => ({ ...prev, results }));
    } catch (err) {
      console.error('Failed to fetch results:', err);
    }

    try {
      const winner = await getWinner();
      setState((prev) => ({ ...prev, winner }));
    } catch {
      setState((prev) => ({ ...prev, winner: null }));
    }
  }, []);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    const status = await fetchStatus();
    await refreshCandidates();
    if (status?.isEnded) {
      await refreshResults();
    }
    setState((prev) => ({ ...prev, isLoading: false }));
  }, [fetchStatus, refreshCandidates, refreshResults]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ElectionContext.Provider
      value={{ ...state, refresh, refreshCandidates, refreshResults }}
    >
      {children}
    </ElectionContext.Provider>
  );
}

export function useElectionContext() {
  const context = useContext(ElectionContext);
  if (!context) {
    throw new Error('useElectionContext must be used within an ElectionProvider');
  }
  return context;
}
