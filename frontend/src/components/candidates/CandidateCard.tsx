import { User } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Candidate } from '@/services/types';

interface CandidateCardProps {
  candidate: Candidate;
  showVotes?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: number) => void;
}

export default function CandidateCard({
  candidate,
  showVotes = false,
  selectable = false,
  selected = false,
  onSelect,
}: CandidateCardProps) {
  return (
    <Card
      className={cn(
        'transition-all',
        selectable && 'cursor-pointer hover:border-primary/50 hover:shadow-md',
        selected && 'border-primary ring-2 ring-primary/20'
      )}
      onClick={selectable ? () => onSelect?.(candidate.id) : undefined}
      role={selectable ? 'radio' : undefined}
      aria-checked={selectable ? selected : undefined}
      tabIndex={selectable ? 0 : undefined}
      onKeyDown={
        selectable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect?.(candidate.id);
              }
            }
          : undefined
      }
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{candidate.name}</CardTitle>
              <CardDescription className="text-xs">
                Candidate #{candidate.id}
              </CardDescription>
            </div>
          </div>
          {showVotes && (
            <Badge variant="secondary">{candidate.voteCount} votes</Badge>
          )}
          {selectable && selected && (
            <Badge className="bg-primary text-primary-foreground">Selected</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {candidate.manifesto}
        </p>
      </CardContent>
    </Card>
  );
}
