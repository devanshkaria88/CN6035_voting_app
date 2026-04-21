import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, CheckCircle2, Clock, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { listVoters } from '@/services/api';
import type { VoterRecord } from '@/services/types';
import { toast } from 'sonner';

function shorten(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function toCsv(rows: VoterRecord[]): string {
  const header = ['address', 'isRegistered', 'hasVoted', 'votedCandidateId'];
  const body = rows.map((r) =>
    [r.address, r.isRegistered, r.hasVoted, r.votedCandidateId ?? ''].join(',')
  );
  return [header.join(','), ...body].join('\n');
}

export default function VotersTable() {
  const [voters, setVoters] = useState<VoterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listVoters();
      setVoters(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load voters';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleExport = () => {
    const csv = toCsv(voters);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voters-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Voters CSV exported');
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not load voters</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {voters.length} registered voter{voters.length === 1 ? '' : 's'}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={voters.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {voters.length === 0 ? (
        <p className="rounded-md border p-6 text-center text-sm text-muted-foreground">
          No voters registered yet.
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Voted Candidate</TableHead>
                <TableHead className="text-right">Registered (block)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {voters.map((v) => (
                <TableRow key={v.address}>
                  <TableCell className="font-mono text-xs">{shorten(v.address)}</TableCell>
                  <TableCell>
                    {v.hasVoted ? (
                      <Badge variant="default">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Voted
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {v.hasVoted && v.votedCandidateId !== null
                      ? `#${v.votedCandidateId}`
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {v.registeredAt ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
