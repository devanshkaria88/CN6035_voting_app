import { useForm } from 'react-hook-form';
import { z } from 'zod/v4';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { registerVoter } from '@/services/api';
import { useElection } from '@/hooks/useElection';
import { toast } from 'sonner';

const voterSchema = z.object({
  address: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format'),
});

type VoterFormData = z.infer<typeof voterSchema>;

export default function RegisterVoterForm() {
  const { refresh } = useElection();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VoterFormData>({
    resolver: zodResolver(voterSchema),
  });

  const onSubmit = async (data: VoterFormData) => {
    try {
      await registerVoter(data.address);
      toast.success('Voter registered successfully');
      reset();
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to register voter';
      toast.error(msg);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Register Voter
        </CardTitle>
        <CardDescription>
          Register a single wallet address as an eligible voter.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="voter-address">Wallet Address</Label>
            <Input
              id="voter-address"
              placeholder="0x..."
              {...register('address')}
              aria-invalid={!!errors.address}
              aria-describedby={errors.address ? 'voter-address-error' : undefined}
            />
            {errors.address && (
              <p
                id="voter-address-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {errors.address.message}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Register Voter
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
