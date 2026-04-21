import { useState } from 'react';
import { Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { registerVotersBatch } from '@/services/api';
import { useElection } from '@/hooks/useElection';
import { toast } from 'sonner';

const ETH_ADDR_RE = /^0x[a-fA-F0-9]{40}$/;

export default function BatchRegisterForm() {
  const [addresses, setAddresses] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { refresh } = useElection();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const lines = addresses
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setValidationError('Please enter at least one address.');
      return;
    }

    const invalid = lines.filter((l) => !ETH_ADDR_RE.test(l));
    if (invalid.length > 0) {
      setValidationError(
        `Invalid address${invalid.length > 1 ? 'es' : ''}: ${invalid.slice(0, 3).join(', ')}${invalid.length > 3 ? '...' : ''}`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerVotersBatch(lines);
      toast.success(`${result.registeredCount} voter(s) registered successfully`);
      setAddresses('');
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Batch registration failed';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Batch Register Voters
        </CardTitle>
        <CardDescription>
          Paste multiple wallet addresses, one per line.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="batch-addresses">Wallet Addresses</Label>
            <Textarea
              id="batch-addresses"
              placeholder={`0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18\n0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199`}
              rows={6}
              value={addresses}
              onChange={(e) => {
                setAddresses(e.target.value);
                setValidationError(null);
              }}
              aria-invalid={!!validationError}
              aria-describedby={validationError ? 'batch-error' : undefined}
            />
            {validationError && (
              <p id="batch-error" role="alert" className="text-sm text-destructive">
                {validationError}
              </p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Register All
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
