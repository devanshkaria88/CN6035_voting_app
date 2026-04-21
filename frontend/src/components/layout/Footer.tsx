import { Vote } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Separator className="mb-6" />
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Vote className="h-4 w-4" />
            <span>ClassRep Vote &mdash; Decentralised Class Representative Voting</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Powered by Ethereum Sepolia TestNet
          </p>
        </div>
      </div>
    </footer>
  );
}
