import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import CandidateGrid from '@/components/candidates/CandidateGrid';
import { useElection } from '@/hooks/useElection';

export default function CandidatesPage() {
  const { candidates, status, isLoading } = useElection();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return candidates;
    const query = search.toLowerCase();
    return candidates.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.manifesto.toLowerCase().includes(query)
    );
  }, [candidates, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Candidates</h1>
        <p className="text-muted-foreground">
          View all registered candidates and their manifestos.
        </p>
      </div>

      {candidates.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search candidates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      <CandidateGrid
        candidates={filtered}
        isLoading={isLoading}
        showVotes={!!status?.isEnded}
      />

      {search && filtered.length === 0 && candidates.length > 0 && (
        <p className="text-center text-muted-foreground">
          No candidates match &ldquo;{search}&rdquo;
        </p>
      )}
    </div>
  );
}
