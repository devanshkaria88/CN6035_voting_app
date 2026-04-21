import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';
import { EXPECTED_NETWORK } from '@/services/types';

export function NetworkBadge() {
  const { isConnected, isCorrectNetwork, switchNetwork } = useWallet();

  if (!isConnected) return null;

  if (isCorrectNetwork) {
    return (
      <Badge variant="outline" className="gap-1 border-green-500/30 text-green-600">
        <CheckCircle2 className="h-3 w-3" />
        {EXPECTED_NETWORK.chainName}
      </Badge>
    );
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={switchNetwork}
      className="gap-1 text-xs"
    >
      <AlertTriangle className="h-3 w-3" />
      Wrong Network
    </Button>
  );
}
