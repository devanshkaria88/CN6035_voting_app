import { useState } from 'react';
import { Play, Square, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { startElection, endElection } from '@/services/api';
import { useElection } from '@/hooks/useElection';
import { toast } from 'sonner';
import type { ElectionStatus } from '@/services/types';

interface ElectionControlsProps {
  status: ElectionStatus;
}

export default function ElectionControls({ status }: ElectionControlsProps) {
  const [confirmAction, setConfirmAction] = useState<'start' | 'end' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { refresh } = useElection();

  const handleAction = async () => {
    if (!confirmAction) return;
    setIsProcessing(true);

    try {
      if (confirmAction === 'start') {
        await startElection();
        toast.success('Election has been started');
      } else {
        const result = await endElection();
        toast.success(
          `Election ended. Winner: ${result.winner.name} with ${result.winner.voteCount} votes`
        );
      }
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      toast.error(msg);
    } finally {
      setIsProcessing(false);
      setConfirmAction(null);
    }
  };

  const statusLabel = status.isEnded
    ? 'Ended'
    : status.isStarted
      ? 'Active'
      : 'Not Started';

  const statusVariant = status.isEnded
    ? 'destructive'
    : status.isStarted
      ? 'default'
      : 'secondary';

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Election Status</CardTitle>
              <CardDescription>Manage the election lifecycle</CardDescription>
            </div>
            <Badge variant={statusVariant as 'default' | 'destructive' | 'secondary'}>
              {statusLabel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-lg border p-3">
              <p className="text-2xl font-bold">{status.candidateCount}</p>
              <p className="text-xs text-muted-foreground">Candidates</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-2xl font-bold">{status.registeredVoterCount}</p>
              <p className="text-xs text-muted-foreground">Voters</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-2xl font-bold">{status.totalVotes}</p>
              <p className="text-xs text-muted-foreground">Votes Cast</p>
            </div>
          </div>

          <div className="flex gap-2">
            {!status.isStarted && !status.isEnded && (
              <Button
                onClick={() => setConfirmAction('start')}
                disabled={isProcessing}
                className="flex-1"
              >
                <Play className="mr-2 h-4 w-4" />
                Start Election
              </Button>
            )}
            {status.isStarted && !status.isEnded && (
              <Button
                variant="destructive"
                onClick={() => setConfirmAction('end')}
                disabled={isProcessing}
                className="flex-1"
              >
                <Square className="mr-2 h-4 w-4" />
                End Election
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmAction(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              {confirmAction === 'start' ? 'Start Election?' : 'End Election?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === 'start'
                ? 'Once started, you cannot add more candidates or register new voters. The voting period will begin immediately.'
                : 'This will permanently close voting. The winner will be determined and no more votes can be cast.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={isProcessing}
              className={
                confirmAction === 'end'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
              }
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirmAction === 'start' ? 'Start' : 'End'} Election
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
