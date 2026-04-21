import { Wallet, LogOut, Loader2, Copy, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/hooks/useWallet';
import { NetworkBadge } from './NetworkBadge';

export default function WalletButton() {
  const {
    isConnected,
    isConnecting,
    address,
    displayAddress,
    isAdmin,
    isDemo,
    demoVoterIndex,
    connect,
    disconnect,
  } = useWallet();

  if (!isConnected) {
    return (
      <Button onClick={connect} disabled={isConnecting} size="sm">
        {isConnecting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="mr-2 h-4 w-4" />
        )}
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    );
  }

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      toast.success('Address copied to clipboard');
    } catch {
      toast.error('Could not copy address');
    }
  };

  const sessionLabel = isDemo
    ? isAdmin
      ? 'Demo Admin session'
      : `Demo Voter #${(demoVoterIndex ?? 0) + 1} session`
    : isAdmin
      ? 'Admin wallet'
      : 'Wallet';

  const signOutLabel = isDemo ? 'End demo session' : 'Disconnect wallet';

  return (
    <div className="flex items-center gap-2">
      <NetworkBadge />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label={`${sessionLabel}. Open account menu.`}
              className="inline-flex h-7 items-center gap-2 rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium text-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50"
            />
          }
        >
          {isDemo ? (
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Wallet className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          <span>{displayAddress}</span>
          {isAdmin && (
            <Badge variant="secondary" className="ml-1 text-[0.65rem]">
              Admin
            </Badge>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{sessionLabel}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={copyAddress}>
              <Copy className="mr-2 h-4 w-4" />
              Copy full address
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={disconnect}
              className="text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {signOutLabel}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
