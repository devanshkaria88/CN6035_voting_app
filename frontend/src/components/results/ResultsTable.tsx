import { Trophy } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Candidate } from '@/services/types';

interface ResultsTableProps {
  candidates: Candidate[];
}

export default function ResultsTable({ candidates }: ResultsTableProps) {
  const sorted = [...candidates].sort((a, b) => b.voteCount - a.voteCount);
  const totalVotes = sorted.reduce((sum, c) => sum + c.voteCount, 0);

  return (
    <Table>
      <TableCaption>Election results ranked by vote count</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Rank</TableHead>
          <TableHead>Candidate</TableHead>
          <TableHead className="text-right">Votes</TableHead>
          <TableHead className="text-right">Share</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((candidate, index) => {
          const share =
            totalVotes > 0
              ? ((candidate.voteCount / totalVotes) * 100).toFixed(1)
              : '0.0';
          return (
            <TableRow key={candidate.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {index === 0 && candidate.voteCount > 0 && (
                    <Trophy className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="font-medium">#{index + 1}</span>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <span className="font-medium">{candidate.name}</span>
                  {index === 0 && candidate.voteCount > 0 && (
                    <Badge className="ml-2" variant="secondary">
                      Leader
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right font-mono">
                {candidate.voteCount}
              </TableCell>
              <TableCell className="text-right font-mono">{share}%</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
