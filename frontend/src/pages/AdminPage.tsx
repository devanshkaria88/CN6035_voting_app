import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Copy, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ElectionControls from '@/components/admin/ElectionControls';
import AddCandidateForm from '@/components/admin/AddCandidateForm';
import RegisterVoterForm from '@/components/admin/RegisterVoterForm';
import BatchRegisterForm from '@/components/admin/BatchRegisterForm';
import VotersTable from '@/components/admin/VotersTable';
import ActivityLog from '@/components/admin/ActivityLog';
import CandidateAdminRow from '@/components/admin/CandidateAdminRow';
import { useAuth } from '@/context/AuthContext';
import { useElection } from '@/hooks/useElection';
import { getContractAddress } from '@/services/api';
import { EXPECTED_CHAIN_ID, EXPECTED_NETWORK } from '@/services/types';

export default function AdminPage() {
  const { isAdmin, isConnected, isAuthenticated } = useAuth();
  const { status, candidates, isLoading } = useElection();
  const navigate = useNavigate();

  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchContractAddress = useCallback(async () => {
    try {
      const data = await getContractAddress();
      setContractAddress(data.address);
    } catch {
      setContractAddress(null);
    }
  }, []);

  useEffect(() => {
    fetchContractAddress();
  }, [fetchContractAddress]);

  useEffect(() => {
    if (isConnected && isAuthenticated && !isAdmin) {
      navigate('/', { replace: true });
    }
  }, [isConnected, isAuthenticated, isAdmin, navigate]);

  const handleCopy = async () => {
    if (!contractAddress) return;
    await navigator.clipboard.writeText(contractAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isConnected || !isAuthenticated) {
    return (
      <div className="py-20 text-center">
        <Alert className="mx-auto max-w-md">
          <Shield className="h-5 w-5" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please connect your wallet and authenticate to access the admin
            dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="py-20 text-center">
        <Alert variant="destructive" className="mx-auto max-w-md">
          <Shield className="h-5 w-5" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            Only the contract admin can access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading || !status) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage the election, candidates, and voters.
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="voters">Voters</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ElectionControls status={status} />
          <ActivityLog />
        </TabsContent>

        <TabsContent value="candidates" className="space-y-6">
          {!status.isStarted && !status.isEnded && <AddCandidateForm />}
          {status.isStarted && (
            <Alert>
              <AlertTitle>Registration Closed</AlertTitle>
              <AlertDescription>
                The election has started. No more candidates can be added.
              </AlertDescription>
            </Alert>
          )}

          <div>
            <h3 className="mb-4 text-lg font-semibold">
              Registered Candidates ({candidates.length})
            </h3>
            {candidates.length === 0 ? (
              <p className="text-muted-foreground">No candidates registered yet.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {candidates.map((c) => (
                  <CandidateAdminRow
                    key={c.id}
                    candidate={c}
                    electionLocked={status.isStarted || status.isEnded}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="voters" className="space-y-6">
          {!status.isStarted && !status.isEnded ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <RegisterVoterForm />
              <BatchRegisterForm />
            </div>
          ) : (
            <Alert>
              <AlertTitle>
                {status.isEnded ? 'Election Ended' : 'Registration Closed'}
              </AlertTitle>
              <AlertDescription>
                {status.isEnded
                  ? 'The election has ended. Voter registration is no longer available.'
                  : 'The election has started. No more voters can be registered.'}
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Voter Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold">
                    {status.registeredVoterCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Registered</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold">{status.totalVotes}</p>
                  <p className="text-xs text-muted-foreground">Voted</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-2xl font-bold">
                    {status.registeredVoterCount - status.totalVotes}
                  </p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registered Voters</CardTitle>
              <CardDescription>
                Reconstructed from on-chain VoterRegistered events.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VotersTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contract Information</CardTitle>
              <CardDescription>
                Details about the deployed smart contract
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Contract Address</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm font-mono break-all">
                    {contractAddress ?? 'Loading...'}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    disabled={!contractAddress}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Network</p>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{EXPECTED_NETWORK.chainName}</Badge>
                  <span className="text-xs text-muted-foreground">
                    Chain ID: {parseInt(EXPECTED_CHAIN_ID, 16)}
                  </span>
                </div>
              </div>

              {contractAddress &&
                contractAddress !== 'Not configured' &&
                EXPECTED_NETWORK.blockExplorerUrls?.[0] && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Block explorer</p>
                    <a
                      href={`${EXPECTED_NETWORK.blockExplorerUrls[0]}/address/${contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View contract on explorer
                    </a>
                  </div>
                )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
