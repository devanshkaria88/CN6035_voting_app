import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { deleteCandidate, updateCandidate } from '@/services/api';
import { useElection } from '@/hooks/useElection';
import type { Candidate } from '@/services/types';

const editSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  manifesto: z.string().min(1, 'Manifesto is required').max(1000),
});
type EditFormData = z.infer<typeof editSchema>;

interface CandidateAdminRowProps {
  candidate: Candidate;
  /** When true, the contract is locked and edit/delete are disabled. */
  electionLocked: boolean;
}

export default function CandidateAdminRow({
  candidate,
  electionLocked,
}: CandidateAdminRowProps) {
  const { refreshCandidates, refresh } = useElection();
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: candidate.name, manifesto: candidate.manifesto },
  });

  const handleSave = async (data: EditFormData) => {
    try {
      await updateCandidate(candidate.id, data.name, data.manifesto);
      toast.success(`Updated candidate "${data.name}"`);
      setEditOpen(false);
      await refreshCandidates();
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update candidate';
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCandidate(candidate.id);
      toast.success(`Removed candidate "${candidate.name}"`);
      setConfirmDelete(false);
      await refreshCandidates();
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to remove candidate';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-base">{candidate.name}</CardTitle>
            <Badge variant="secondary">ID #{candidate.id}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {candidate.manifesto}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                reset({ name: candidate.name, manifesto: candidate.manifesto });
                setEditOpen(true);
              }}
              disabled={electionLocked}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              disabled={electionLocked}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </Button>
          </div>
          {electionLocked && (
            <p className="text-xs text-muted-foreground">
              Editing is locked once the election starts.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit candidate</DialogTitle>
            <DialogDescription>
              Update the on-chain name and manifesto for candidate #{candidate.id}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleSave)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`edit-name-${candidate.id}`}>Full name</Label>
              <Input
                id={`edit-name-${candidate.id}`}
                {...register('name')}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-manifesto-${candidate.id}`}>Manifesto</Label>
              <Textarea
                id={`edit-manifesto-${candidate.id}`}
                rows={4}
                {...register('manifesto')}
                aria-invalid={!!errors.manifesto}
              />
              {errors.manifesto && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.manifesto.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this candidate?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes <strong>{candidate.name}</strong> from
              the on-chain candidate list. The contract uses swap-and-pop, so
              the last candidate's slot may be reassigned to ID&nbsp;#
              {candidate.id}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deleting}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove candidate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
