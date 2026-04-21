import { Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import CandidateCard from './CandidateCard';
import type { Candidate } from '@/services/types';

interface CandidateGridProps {
  candidates: Candidate[];
  isLoading?: boolean;
  showVotes?: boolean;
  selectable?: boolean;
  selectedId?: number | null;
  onSelect?: (id: number) => void;
}

export default function CandidateGrid({
  candidates,
  isLoading = false,
  showVotes = false,
  selectable = false,
  selectedId = null,
  onSelect,
}: CandidateGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <h3 className="text-lg font-medium">No candidates yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Candidates will appear here once they are registered.
        </p>
      </div>
    );
  }

  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      role={selectable ? 'radiogroup' : undefined}
    >
      {candidates.map((candidate) => (
        <CandidateCard
          key={candidate.id}
          candidate={candidate}
          showVotes={showVotes}
          selectable={selectable}
          selected={selectedId === candidate.id}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
