import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import VotingForm from '@/components/voting/VotingForm';
import { useAuth } from '@/context/AuthContext';
import { useElection } from '@/hooks/useElection';
import { getVoterStatus, getCandidate } from '@/services/api';
import type { Voter, Candidate } from '@/services/types';

export default function VotePage() {
  const {
    isConnected,
    address,
    isCorrectNetwork,
    switchNetwork,
    isDemo,
  } = useAuth();
  const { candidates, status, isLoading: electionLoading } = useElection();

  const [voter, setVoter] = useState<Voter | null>(null);
  const [votedCandidate, setVotedCandidate] = useState<Candidate | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const checkVoterStatus = useCallback(async () => {
    if (!address) return;
    setIsCheckingStatus(true);
    try {
      const voterData = await getVoterStatus(address);
      setVoter(voterData);
      if (voterData.hasVoted && voterData.votedCandidateId !== null) {
        try {
          const candidate = await getCandidate(voterData.votedCandidateId);
          setVotedCandidate(candidate);
        } catch {
          setVotedCandidate(null);
        }
      }
    } catch {
      setVoter(null);
    } finally {
      setIsCheckingStatus(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      checkVoterStatus();
    }
  }, [isConnected, address, checkVoterStatus]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Card className="max-w-md text-center">
          <CardHeader>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Wallet className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="mt-4">Sign in to vote</CardTitle>
            <CardDescription>
              Connect a registered wallet, or use a seeded demo voter account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" className="w-full" render={<Link to="/login?role=voter" />}>
              <Wallet className="mr-2 h-4 w-4" />
              Go to sign-in
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Demo sessions don't talk to the wallet, so the network check is moot.
  if (!isDemo && !isCorrectNetwork) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Wrong Network</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>Please switch your wallet to the expected network to continue.</p>
            <Button onClick={switchNetwork} variant="outline" size="sm">
              Switch network
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (electionLoading || isCheckingStatus) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      </div>
    );
  }

  if (!status?.isStarted) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Vote</h1>
        <Alert>
          <XCircle className="h-5 w-5" />
          <AlertTitle>Voting Not Open</AlertTitle>
          <AlertDescription>
            {status?.isEnded
              ? 'The election has ended. Check the results page for the outcome.'
              : 'The election has not started yet. Please check back later.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!voter?.isRegistered) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Vote</h1>
        <Alert variant="destructive">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Not Eligible</AlertTitle>
          <AlertDescription>
            Your wallet address is not registered as an eligible voter. Please
            contact the election administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (voter.hasVoted) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Vote</h1>
        <Alert className="border-green-500/30 bg-green-50 dark:bg-green-950/20">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <AlertTitle>Vote Already Cast</AlertTitle>
          <AlertDescription>
            You have already voted
            {votedCandidate && (
              <>
                {' '}
                for{' '}
                <span className="font-semibold">{votedCandidate.name}</span>
              </>
            )}
            . Thank you for participating!
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cast Your Vote</h1>
        <p className="text-muted-foreground">
          Select a candidate below and confirm your choice. This action is
          permanent and recorded on the blockchain.
        </p>
      </div>

      {candidates.length === 0 ? (
        <Alert>
          <Loader2 className="h-5 w-5" />
          <AlertTitle>No Candidates</AlertTitle>
          <AlertDescription>
            There are no candidates to vote for yet.
          </AlertDescription>
        </Alert>
      ) : (
        <VotingForm candidates={candidates} />
      )}
    </div>
  );
}
