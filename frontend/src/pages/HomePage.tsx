import { Link } from 'react-router-dom';
import {
  Vote,
  Users,
  BarChart3,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
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
import { useElection } from '@/hooks/useElection';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { status, isLoading } = useElection();
  const { isConnected, isAdmin } = useAuth();

  const statusConfig = status?.isEnded
    ? {
        label: 'Ended',
        icon: XCircle,
        variant: 'destructive' as const,
        description: 'The election has concluded. View the results below.',
        color: 'text-red-600',
      }
    : status?.isStarted
      ? {
          label: 'Voting Active',
          icon: CheckCircle2,
          variant: 'default' as const,
          description: 'The election is currently open for voting.',
          color: 'text-green-600',
        }
      : {
          label: 'Not Started',
          icon: Clock,
          variant: 'secondary' as const,
          description:
            'The election has not started yet. Candidates and voters are being registered.',
          color: 'text-muted-foreground',
        };

  return (
    <div className="space-y-12">
      <section className="space-y-6 pt-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Vote className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            ClassRep Vote
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            A decentralised class representative voting system powered by
            Ethereum smart contracts. Transparent, secure, and tamper-proof.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {!isConnected ? (
            <>
              <Button size="lg" render={<Link to="/login?role=voter" />}>
                <Vote className="mr-2 h-4 w-4" />
                I'm a Voter
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                render={<Link to="/login?role=admin" />}
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                I'm an Admin
              </Button>
            </>
          ) : (
            <>
              <Button size="lg" render={<Link to="/vote" />}>
                Cast Your Vote
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" render={<Link to="/candidates" />}>
                View Candidates
              </Button>
              {isAdmin && (
                <Button
                  size="lg"
                  variant="secondary"
                  render={<Link to="/admin" />}
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Admin Dashboard
                </Button>
              )}
            </>
          )}
        </div>
      </section>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : (
        status && (
          <>
            <Card className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Election Status</CardTitle>
                  <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                </div>
                <CardDescription>{statusConfig.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <statusConfig.icon className={`h-5 w-5 ${statusConfig.color}`} />
                  <span className={`text-sm font-medium ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Candidates
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{status.candidateCount}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    Registered Voters
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {status.registeredVoterCount}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Votes Cast</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{status.totalVotes}</p>
                  {status.registeredVoterCount > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {Math.round(
                        (status.totalVotes / status.registeredVoterCount) * 100
                      )}
                      % turnout
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )
      )}
    </div>
  );
}
