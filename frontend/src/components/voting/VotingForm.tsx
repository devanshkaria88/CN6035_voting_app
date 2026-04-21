import { useState } from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import CandidateGrid from '@/components/candidates/CandidateGrid';
import VoteConfirmation from './VoteConfirmation';
import { submitVote } from '@/services/api';
import { useElection } from '@/hooks/useElection';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import type { Candidate } from '@/services/types';
import { EXPECTED_NETWORK } from '@/services/types';
import { getEthereumProvider } from '@/lib/ethereum';

interface VotingFormProps {
  candidates: Candidate[];
}

type VoteStatus =
  | 'idle'
  | 'confirming'
  | 'submitting'
  | 'sending'
  | 'mining'
  | 'success'
  | 'error';

interface TransactionReceipt {
  blockNumber: string;
  status: string;
  transactionHash: string;
}

/**
 * Polls eth_getTransactionReceipt until a receipt with a non-null status is
 * returned, or until the timeout is reached. Returns null on timeout.
 */
async function waitForReceipt(
  hash: string,
  maxAttempts = 60,
  intervalMs = 2000
): Promise<TransactionReceipt | null> {
  const ethereum = getEthereumProvider();
  if (!ethereum) return null;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const receipt = (await ethereum.request({
        method: 'eth_getTransactionReceipt',
        params: [hash],
      })) as TransactionReceipt | null;
      if (receipt && receipt.blockNumber) return receipt;
    } catch {
      /* ignore transient RPC errors */
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return null;
}

export default function VotingForm({ candidates }: VotingFormProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [voteStatus, setVoteStatus] = useState<VoteStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { refresh } = useElection();
  const { isDemo } = useAuth();

  const selectedCandidate =
    selectedId !== null ? candidates.find((c) => c.id === selectedId) ?? null : null;

  const handleVoteClick = () => {
    if (selectedId === null) {
      toast.error('Please select a candidate before voting.');
      return;
    }
    setVoteStatus('confirming');
  };

  const handleConfirm = async () => {
    if (selectedId === null) return;
    setVoteStatus('submitting');

    try {
      const txData = await submitVote(selectedId);

      // Demo flow: backend already broadcast the transaction with its own
      // signer, so we just record the resulting hash and succeed.
      if (isDemo || txData.transactionHash) {
        const hash = txData.transactionHash ?? null;
        setTxHash(hash);
        setVoteStatus('success');
        toast.success('Your demo vote has been recorded on-chain!');
        await refresh();
        return;
      }

      setVoteStatus('sending');

      const ethereum = getEthereumProvider();
      if (!ethereum) throw new Error('MetaMask not available');

      const accounts = (await ethereum.request({
        method: 'eth_accounts',
      })) as string[];

      const hash = (await ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: accounts[0],
            to: txData.to,
            data: txData.data,
          },
        ],
      })) as string;

      setTxHash(hash);
      setVoteStatus('mining');
      toast.info('Transaction submitted. Waiting for confirmation...');

      const receipt = await waitForReceipt(hash);
      if (receipt && receipt.status === '0x1') {
        setVoteStatus('success');
        toast.success('Your vote has been confirmed on-chain!');
      } else if (receipt && receipt.status === '0x0') {
        throw new Error('Transaction reverted on-chain');
      } else {
        setVoteStatus('success');
        toast.warning(
          'Transaction submitted but confirmation timed out. Check the explorer for status.'
        );
      }
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Vote submission failed';
      setErrorMessage(msg);
      setVoteStatus('error');
      toast.error(msg);
    }
  };

  if (voteStatus === 'success') {
    return (
      <Alert className="border-green-500/30 bg-green-50 dark:bg-green-950/20">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <AlertTitle>Vote Submitted!</AlertTitle>
        <AlertDescription>
          Your vote for{' '}
          <span className="font-semibold">{selectedCandidate?.name}</span> has been
          recorded on the blockchain.
          {txHash &&
            (EXPECTED_NETWORK.blockExplorerUrls?.[0] ? (
              <a
                href={`${EXPECTED_NETWORK.blockExplorerUrls[0]}/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block text-xs text-muted-foreground underline hover:text-foreground"
              >
                View transaction: {txHash.slice(0, 10)}…{txHash.slice(-8)}
              </a>
            ) : (
              <span className="mt-2 block text-xs text-muted-foreground">
                Transaction hash: {txHash.slice(0, 10)}…{txHash.slice(-8)}
              </span>
            ))}
        </AlertDescription>
      </Alert>
    );
  }

  if (voteStatus === 'error') {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <XCircle className="h-5 w-5" />
          <AlertTitle>Vote Failed</AlertTitle>
          <AlertDescription>
            {errorMessage ?? 'An unexpected error occurred.'}
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => {
            setVoteStatus('idle');
            setErrorMessage(null);
          }}
        >
          Try Again
        </Button>
      </div>
    );
  }

  const isProcessing =
    voteStatus === 'submitting' ||
    voteStatus === 'sending' ||
    voteStatus === 'mining';

  const statusCopy: Record<'submitting' | 'sending' | 'mining', { title: string; body: string }> =
    {
      submitting: {
        title: 'Preparing transaction...',
        body: isDemo
          ? 'Backend is signing on behalf of your demo voter.'
          : 'Communicating with the backend.',
      },
      sending: {
        title: 'Waiting for wallet confirmation...',
        body: 'Please confirm the transaction in MetaMask.',
      },
      mining: {
        title: 'Waiting for on-chain confirmation...',
        body: 'Polling the network for the transaction receipt.',
      },
    };

  return (
    <div className="space-y-6">
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {isProcessing
          ? statusCopy[voteStatus as 'submitting' | 'sending' | 'mining'].title
          : ''}
      </div>
      {isProcessing && (
        <Alert>
          <Loader2 className="h-5 w-5 animate-spin" />
          <AlertTitle>
            {statusCopy[voteStatus as 'submitting' | 'sending' | 'mining'].title}
          </AlertTitle>
          <AlertDescription>
            {statusCopy[voteStatus as 'submitting' | 'sending' | 'mining'].body}
          </AlertDescription>
        </Alert>
      )}

      <CandidateGrid
        candidates={candidates}
        selectable={!isProcessing}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleVoteClick}
          disabled={selectedId === null || isProcessing}
        >
          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Cast Vote
        </Button>
      </div>

      <VoteConfirmation
        open={voteStatus === 'confirming'}
        onOpenChange={(open) => {
          if (!open) setVoteStatus('idle');
        }}
        candidate={selectedCandidate}
        onConfirm={handleConfirm}
        isSubmitting={false}
      />
    </div>
  );
}
