import type { Candidate } from '@/services/types';

interface VoteChartProps {
  candidates: Candidate[];
}

const BAR_COLORS = [
  'bg-chart-1',
  'bg-chart-2',
  'bg-chart-3',
  'bg-chart-4',
  'bg-chart-5',
];

export default function VoteChart({ candidates }: VoteChartProps) {
  const maxVotes = Math.max(...candidates.map((c) => c.voteCount), 1);

  return (
    <div className="space-y-4">
      {candidates.map((candidate, index) => {
        const pct = (candidate.voteCount / maxVotes) * 100;
        return (
          <div key={candidate.id} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{candidate.name}</span>
              <span className="text-muted-foreground">
                {candidate.voteCount} vote{candidate.voteCount !== 1 ? 's' : ''}
              </span>
            </div>
            <div
              className="h-6 w-full overflow-hidden rounded-full bg-secondary"
              role="progressbar"
              aria-valuenow={candidate.voteCount}
              aria-valuemin={0}
              aria-valuemax={maxVotes}
              aria-label={`${candidate.name}: ${candidate.voteCount} votes`}
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${BAR_COLORS[index % BAR_COLORS.length]}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
