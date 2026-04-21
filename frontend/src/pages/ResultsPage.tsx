import { useEffect, useState, useCallback } from 'react';
import { Trophy, RefreshCw, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import VoteChart from '@/components/results/VoteChart';
import ResultsTable from '@/components/results/ResultsTable';
import { getResults, getWinner } from '@/services/api';
import { useElection } from '@/hooks/useElection';
import type { Candidate } from '@/services/types';

export default function ResultsPage() {
  const { status, isLoading: statusLoading } = useElection();
  const [results, setResults] = useState<Candidate[]>([]);
  const [winner, setWinner] = useState<Candidate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchResults = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getResults();
      setResults(data);
    } catch {
      setResults([]);
    }

    try {
      const w = await getWinner();
      setWinner(w);
    } catch {
      setWinner(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const totalVotes = results.reduce((sum, c) => sum + c.voteCount, 0);

  if (statusLoading || isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Results</h1>
          <p className="text-muted-foreground">
            {status?.isEnded
              ? 'Final election results.'
              : 'Live vote count — results are updated in real time.'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchResults}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {status?.isEnded && winner && (
        <Card className="border-2 border-yellow-500/30 bg-yellow-50/50 dark:bg-yellow-950/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Winner</CardTitle>
                <CardDescription>The election has concluded</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{winner.name}</p>
                <p className="text-sm text-muted-foreground">{winner.manifesto}</p>
              </div>
              <Badge className="text-lg px-4 py-1" variant="secondary">
                {winner.voteCount} votes
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BarChart3 className="h-4 w-4" />
        <span>
          {totalVotes} total vote{totalVotes !== 1 ? 's' : ''} cast
        </span>
        {status && status.registeredVoterCount > 0 && (
          <Badge variant="outline" className="ml-2">
            {Math.round((totalVotes / status.registeredVoterCount) * 100)}% turnout
          </Badge>
        )}
      </div>

      {results.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              No results available yet. Votes will appear here once cast.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Vote Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <VoteChart candidates={results} />
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardHeader>
              <CardTitle>Detailed Results</CardTitle>
            </CardHeader>
            <CardContent>
              <ResultsTable candidates={results} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
