import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createCandidate } from '@/services/api';
import { useElection } from '@/hooks/useElection';
import { toast } from 'sonner';

const candidateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  manifesto: z
    .string()
    .min(1, 'Manifesto is required')
    .max(1000, 'Manifesto cannot exceed 1000 characters'),
});

type CandidateFormData = z.infer<typeof candidateSchema>;

export default function AddCandidateForm() {
  const { refreshCandidates, refresh } = useElection();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema),
  });

  const onSubmit = async (data: CandidateFormData) => {
    try {
      const result = await createCandidate(data.name, data.manifesto);
      toast.success(`Candidate "${data.name}" added (ID: ${result.candidateId})`);
      reset();
      await refreshCandidates();
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add candidate';
      toast.error(msg);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Add Candidate
        </CardTitle>
        <CardDescription>
          Register a new candidate for the election.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Enter candidate name"
              {...register('name')}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p id="name-error" role="alert" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="manifesto">Manifesto</Label>
            <Textarea
              id="manifesto"
              placeholder="Enter the candidate's manifesto..."
              rows={4}
              {...register('manifesto')}
              aria-invalid={!!errors.manifesto}
              aria-describedby={errors.manifesto ? 'manifesto-error' : undefined}
            />
            {errors.manifesto && (
              <p
                id="manifesto-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {errors.manifesto.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Candidate
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
