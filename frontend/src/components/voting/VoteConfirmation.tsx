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
import type { Candidate } from '@/services/types';

interface VoteConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidate: Candidate | null;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export default function VoteConfirmation({
  open,
  onOpenChange,
  candidate,
  onConfirm,
  isSubmitting,
}: VoteConfirmationProps) {
  if (!candidate) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Your Vote</AlertDialogTitle>
          <AlertDialogDescription>
            You are about to cast your vote for{' '}
            <span className="font-semibold text-foreground">{candidate.name}</span>.
            This action cannot be undone. Your vote will be recorded on the blockchain
            permanently.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Confirm Vote'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
