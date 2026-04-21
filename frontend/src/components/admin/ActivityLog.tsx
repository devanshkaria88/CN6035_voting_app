import { useMemo } from 'react';
import {
  UserPlus,
  Vote as VoteIcon,
  Megaphone,
  Trophy,
  PlayCircle,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useElection } from '@/hooks/useElection';

interface ActivityEntry {
  id: string;
  icon: typeof VoteIcon;
  label: string;
  detail: string;
  timestamp: string;
}

/**
 * Lightweight activity feed reconstructed from the current election status.
 * It does not stream live blockchain events; instead it summarises what's
 * deducible from the on-chain status snapshot the admin already loads.
 */
export default function ActivityLog() {
  const { status, candidates } = useElection();

  const entries = useMemo<ActivityEntry[]>(() => {
    if (!status) return [];

    const list: ActivityEntry[] = [];

    if (status.candidateCount > 0) {
      list.push({
        id: 'candidates',
        icon: Megaphone,
        label: 'Candidates registered',
        detail: `${status.candidateCount} candidate${status.candidateCount === 1 ? '' : 's'} on-chain`,
        timestamp: 'Pre-election',
      });
    }
    if (status.registeredVoterCount > 0) {
      list.push({
        id: 'voters',
        icon: UserPlus,
        label: 'Voters registered',
        detail: `${status.registeredVoterCount} eligible voter${
          status.registeredVoterCount === 1 ? '' : 's'
        }`,
        timestamp: 'Pre-election',
      });
    }
    if (status.isStarted) {
      list.push({
        id: 'started',
        icon: PlayCircle,
        label: 'Election started',
        detail: 'Voting opened to registered voters',
        timestamp: 'Live',
      });
    }
    if (status.totalVotes > 0) {
      list.push({
        id: 'votes',
        icon: VoteIcon,
        label: 'Votes cast',
        detail: `${status.totalVotes} of ${status.registeredVoterCount} ballot${
          status.totalVotes === 1 ? '' : 's'
        }`,
        timestamp: 'Live',
      });
    }
    if (status.isEnded) {
      const winner = [...candidates].sort((a, b) => b.voteCount - a.voteCount)[0];
      list.push({
        id: 'ended',
        icon: Trophy,
        label: 'Election ended',
        detail: winner
          ? `Winner: ${winner.name} (${winner.voteCount} votes)`
          : 'Final results recorded',
        timestamp: 'Final',
      });
    }
    return list.reverse();
  }, [status, candidates]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          On-chain milestones for the current election
        </CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ol className="space-y-4">
            {entries.map((entry) => {
              const Icon = entry.icon;
              return (
                <li key={entry.id} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </span>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{entry.label}</p>
                      <Badge variant="outline" className="text-xs">
                        {entry.timestamp}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{entry.detail}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
