import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ShieldCheck,
  Sparkles,
  Vote as VoteIcon,
  Wallet,
  Loader2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { listDemoAccounts } from '@/services/api';
import type { DemoAccountsResponse, DemoRole } from '@/services/types';

function shorten(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { connect, signInAsDemo, isAuthenticated, isAdmin, isConnecting } =
    useAuth();

  const initialRole: DemoRole =
    searchParams.get('role') === 'admin' ? 'admin' : 'voter';

  const [role, setRole] = useState<DemoRole>(initialRole);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccountsResponse | null>(
    null
  );
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [voterIndex, setVoterIndex] = useState(0);
  const [pendingDemo, setPendingDemo] = useState(false);

  useEffect(() => {
    let mounted = true;
    listDemoAccounts()
      .then((accounts) => {
        if (!mounted) return;
        setDemoAccounts(accounts);
      })
      .catch(() => setDemoAccounts(null))
      .finally(() => mounted && setDemoLoaded(true));
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    navigate(isAdmin ? '/admin' : '/vote', { replace: true });
  }, [isAuthenticated, isAdmin, navigate]);

  const handleTabChange = (value: string) => {
    const next = value === 'admin' ? 'admin' : 'voter';
    setRole(next);
    const params = new URLSearchParams(searchParams);
    params.set('role', next);
    setSearchParams(params, { replace: true });
  };

  const handleDemo = async () => {
    setPendingDemo(true);
    try {
      await signInAsDemo(role, role === 'voter' ? voterIndex : undefined);
      toast.success(
        role === 'admin'
          ? 'Signed in as demo admin.'
          : `Signed in as demo voter #${voterIndex + 1}.`
      );
    } catch {
      // signInAsDemo already shows its own error toast.
    } finally {
      setPendingDemo(false);
    }
  };

  const handleConnect = async () => {
    await connect();
  };

  const demoEnabled = !!demoAccounts;
  const voters = demoAccounts?.voters ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-10">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Sign in</h1>
        <p className="text-muted-foreground">
          Choose how you want to access ClassRep&nbsp;Vote. Voters and admins
          have separate entry points to keep their workflows clear.
        </p>
      </div>

      <Tabs value={role} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="voter" className="gap-2">
            <VoteIcon className="h-4 w-4" />
            Voter
          </TabsTrigger>
          <TabsTrigger value="admin" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Admin
          </TabsTrigger>
        </TabsList>

        <TabsContent value="voter">
          <RoleCard
            title="Sign in as a Voter"
            description="Cast your ballot using a registered wallet address. The admin must register your wallet before the election starts."
            icon={<VoteIcon className="h-5 w-5" />}
            primaryLabel="Connect Wallet"
            onPrimary={handleConnect}
            isPending={isConnecting}
            secondaryLabel={
              demoEnabled
                ? `Sign in as Demo Voter #${voterIndex + 1}`
                : undefined
            }
            onSecondary={demoEnabled ? handleDemo : undefined}
            isSecondaryPending={pendingDemo}
            secondaryHint={
              demoEnabled
                ? `Address: ${voters[voterIndex] ? shorten(voters[voterIndex].address) : '—'}`
                : 'Demo login is disabled on this server.'
            }
            extra={
              demoEnabled && voters.length > 1 ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Pick a demo voter
                  </label>
                  <Select
                    value={String(voterIndex)}
                    onValueChange={(v) => setVoterIndex(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {voters.map((v, i) => (
                        <SelectItem key={v.address} value={String(i)}>
                          Voter #{i + 1} — {shorten(v.address)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null
            }
          />
        </TabsContent>

        <TabsContent value="admin">
          <RoleCard
            title="Sign in as the Admin"
            description="Add candidates, register voters, and start or end the election. Only the wallet that deployed the contract can authenticate as admin."
            icon={<ShieldCheck className="h-5 w-5" />}
            primaryLabel="Connect Admin Wallet"
            onPrimary={handleConnect}
            isPending={isConnecting}
            secondaryLabel={demoEnabled ? 'Sign in as Demo Admin' : undefined}
            onSecondary={demoEnabled ? handleDemo : undefined}
            isSecondaryPending={pendingDemo}
            secondaryHint={
              demoEnabled
                ? `Address: ${demoAccounts?.admin ? shorten(demoAccounts.admin.address) : '—'}`
                : 'Demo login is disabled on this server.'
            }
          />
        </TabsContent>
      </Tabs>

      {demoLoaded && !demoEnabled && (
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertTitle>Demo login is disabled</AlertTitle>
          <AlertDescription>
            Set <code>ENABLE_DEMO_LOGIN=true</code> in the backend{' '}
            <code>.env</code> (and seed at least one Hardhat account) to enable
            the in-app demo accounts.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

interface RoleCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  isPending: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  isSecondaryPending?: boolean;
  secondaryHint?: string;
  extra?: React.ReactNode;
}

function RoleCard({
  title,
  description,
  icon,
  primaryLabel,
  onPrimary,
  isPending,
  secondaryLabel,
  onSecondary,
  isSecondaryPending,
  secondaryHint,
  extra,
}: RoleCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            {icon}
          </div>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <Button
          size="lg"
          className="w-full"
          onClick={onPrimary}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wallet className="mr-2 h-4 w-4" />
          )}
          {primaryLabel}
        </Button>

        {onSecondary && (
          <>
            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs uppercase tracking-wide text-muted-foreground">
                or
              </span>
            </div>

            {extra}

            <div className="space-y-2">
              <Button
                size="lg"
                variant="outline"
                className="w-full"
                onClick={onSecondary}
                disabled={isSecondaryPending}
              >
                {isSecondaryPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {secondaryLabel}
              </Button>
              {secondaryHint && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{secondaryHint}</span>
                  <Badge variant="secondary">Demo</Badge>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
