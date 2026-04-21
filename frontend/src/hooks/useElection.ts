import { useElectionContext } from '@/context/ElectionContext';

export function useElection() {
  return useElectionContext();
}
