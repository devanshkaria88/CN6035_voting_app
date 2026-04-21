import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {
  getNonce,
  verifySignature,
  setAuthToken,
  getStoredToken,
  getVoterStatus,
  demoLogin,
} from '@/services/api';
import {
  EXPECTED_CHAIN_ID,
  EXPECTED_NETWORK,
  type DemoRole,
} from '@/services/types';
import { getEthereumProvider } from '@/lib/ethereum';

const DEMO_SESSION_KEY = 'auth_demo_session';

interface StoredDemoSession {
  role: DemoRole;
  address: string;
  index?: number;
}

/**
 * Classifies an error thrown by an EIP-1193 provider so we can show a
 * helpful toast instead of the generic "Unexpected error" that Trust
 * Wallet's evmAsk.js returns when its wallet picker is dismissed.
 */
function describeWalletError(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return typeof error === 'string' ? error : 'Failed to connect wallet';
  }
  const err = error as { code?: number; message?: string };
  if (err.code === 4001) return 'Connection request was rejected.';
  if (err.code === -32002) {
    return (
      'A wallet request is already pending. Open the MetaMask ' +
      'extension, approve or reject the existing prompt, then try again.'
    );
  }
  if (err.message && /evmAsk|selectExtension|unexpected error/i.test(err.message)) {
    return (
      'Another wallet extension (likely Trust Wallet) intercepted the ' +
      'request. Disable Trust Wallet/Coinbase/Brave wallets in ' +
      'chrome://extensions, or set MetaMask as your default wallet in its ' +
      'Settings → Experimental, then retry.'
    );
  }
  return err.message || 'Failed to connect wallet';
}

interface AuthState {
  address: string | null;
  isConnected: boolean;
  isAdmin: boolean;
  isRegisteredVoter: boolean;
  isAuthenticated: boolean;
  chainId: string | null;
  isCorrectNetwork: boolean;
  isConnecting: boolean;
  /** True when the current session was created via the demo login endpoint. */
  isDemo: boolean;
  /** Voter index used when isDemo + role === 'voter'. */
  demoVoterIndex: number | null;
}

interface AuthContextValue extends AuthState {
  /** Alias for `address`, matches PRD naming. */
  walletAddress: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
  signInAsDemo: (role: DemoRole, index?: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    address: null,
    isConnected: false,
    isAdmin: false,
    isRegisteredVoter: false,
    isAuthenticated: false,
    chainId: null,
    isCorrectNetwork: false,
    isConnecting: false,
    isDemo: false,
    demoVoterIndex: null,
  });

  const checkVoterStatus = useCallback(async (address: string) => {
    try {
      const voter = await getVoterStatus(address);
      setState((prev) => ({ ...prev, isRegisteredVoter: voter.isRegistered }));
    } catch {
      setState((prev) => ({ ...prev, isRegisteredVoter: false }));
    }
  }, []);

  const authenticate = useCallback(
    async (address: string) => {
      try {
        const { message } = await getNonce(address);
        const ethereum = getEthereumProvider();
        if (!ethereum) throw new Error('MetaMask not available');

        const signature = (await ethereum.request({
          method: 'personal_sign',
          params: [message, address],
        })) as string;

        const result = await verifySignature(address, signature);
        setAuthToken(result.token);

        setState((prev) => ({
          ...prev,
          isAdmin: result.role === 'admin',
          isAuthenticated: true,
        }));

        await checkVoterStatus(address);
      } catch (error) {
        console.error('Authentication failed:', error);
        setAuthToken(null);
        setState((prev) => ({
          ...prev,
          isAdmin: false,
          isAuthenticated: false,
          isRegisteredVoter: false,
        }));
      }
    },
    [checkVoterStatus]
  );

  const updateChainId = useCallback((chainId: string) => {
    setState((prev) => ({
      ...prev,
      chainId,
      isCorrectNetwork: chainId.toLowerCase() === EXPECTED_CHAIN_ID,
    }));
  }, []);

  const connect = useCallback(async () => {
    const ethereum = getEthereumProvider();
    if (!ethereum) {
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true }));

    const withTimeout = <T,>(promise: Promise<T>, ms: number, label: string) =>
      Promise.race<T>([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  `${label} timed out after ${ms / 1000}s. The wallet ` +
                    `popup may be hidden behind another window, or the ` +
                    `extension's service worker may be asleep. Click the ` +
                    `MetaMask icon in your browser toolbar, approve any ` +
                    `pending request, then try again.`
                )
              ),
            ms
          )
        ),
      ]);

    try {
      const accounts = (await withTimeout(
        ethereum.request({ method: 'eth_requestAccounts' }) as Promise<string[]>,
        60_000,
        'Wallet connection'
      )) as string[];
      const address = accounts[0];

      const chainId = (await withTimeout(
        ethereum.request({ method: 'eth_chainId' }) as Promise<string>,
        10_000,
        'Chain lookup'
      )) as string;

      setState((prev) => ({
        ...prev,
        address,
        isConnected: true,
        chainId,
        isCorrectNetwork: chainId.toLowerCase() === EXPECTED_CHAIN_ID,
        isConnecting: false,
      }));

      await authenticate(address);
    } catch (error) {
      console.error('Connection failed:', error);
      const message = describeWalletError(error);
      try {
        const { toast } = await import('sonner');
        toast.error(message);
      } catch {
        /* sonner not available, ignore */
      }
      setState((prev) => ({ ...prev, isConnecting: false }));
    }
  }, [authenticate]);

  const disconnect = useCallback(() => {
    setAuthToken(null);
    localStorage.removeItem(DEMO_SESSION_KEY);
    setState({
      address: null,
      isConnected: false,
      isAdmin: false,
      isRegisteredVoter: false,
      isAuthenticated: false,
      chainId: null,
      isCorrectNetwork: false,
      isConnecting: false,
      isDemo: false,
      demoVoterIndex: null,
    });
  }, []);

  const signInAsDemo = useCallback(
    async (role: DemoRole, index = 0) => {
      try {
        setState((prev) => ({ ...prev, isConnecting: true }));
        const result = await demoLogin(role, role === 'voter' ? index : undefined);
        setAuthToken(result.token);

        const session: StoredDemoSession = {
          role,
          address: result.address,
          ...(role === 'voter' ? { index } : {}),
        };
        localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));

        let isRegisteredVoter = false;
        if (role === 'voter') {
          try {
            const voter = await getVoterStatus(result.address);
            isRegisteredVoter = voter.isRegistered;
          } catch {
            isRegisteredVoter = false;
          }
        }

        setState((prev) => ({
          ...prev,
          address: result.address,
          isConnected: true,
          isAuthenticated: true,
          isAdmin: role === 'admin',
          isRegisteredVoter,
          isDemo: true,
          demoVoterIndex: role === 'voter' ? index : null,
          isConnecting: false,
          // Demo sessions are always "on the right network" because the
          // backend signs against its own configured RPC.
          isCorrectNetwork: true,
        }));
      } catch (error) {
        console.error('Demo login failed:', error);
        const err = error as { message?: string };
        try {
          const { toast } = await import('sonner');
          toast.error(err.message || 'Demo login failed');
        } catch {
          /* sonner not available */
        }
        setState((prev) => ({ ...prev, isConnecting: false }));
        throw error;
      }
    },
    []
  );

  const switchNetwork = useCallback(async () => {
    const ethereum = getEthereumProvider();
    if (!ethereum) return;

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: EXPECTED_CHAIN_ID }],
      });
    } catch (error) {
      const switchError = error as { code: number };
      if (switchError.code === 4902) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [EXPECTED_NETWORK],
        });
      }
    }
  }, []);

  useEffect(() => {
    // Restore a stored demo session first; demo sessions don't need a wallet.
    const token = getStoredToken();
    const rawDemo = localStorage.getItem(DEMO_SESSION_KEY);
    if (token && rawDemo) {
      try {
        const session = JSON.parse(rawDemo) as StoredDemoSession;
        setAuthToken(token);
        setState((prev) => ({
          ...prev,
          address: session.address,
          isConnected: true,
          isAuthenticated: true,
          isAdmin: session.role === 'admin',
          isDemo: true,
          demoVoterIndex: session.role === 'voter' ? (session.index ?? 0) : null,
          isCorrectNetwork: true,
        }));
        if (session.role === 'voter') {
          getVoterStatus(session.address)
            .then((voter) =>
              setState((prev) => ({
                ...prev,
                isRegisteredVoter: voter.isRegistered,
              }))
            )
            .catch(() => {
              /* Best-effort hydration only. */
            });
        }
      } catch {
        localStorage.removeItem(DEMO_SESSION_KEY);
      }
    }

    const ethereum = getEthereumProvider();
    if (!ethereum) return;

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (accounts.length === 0) {
        disconnect();
      } else {
        const newAddress = accounts[0];
        setState((prev) => ({ ...prev, address: newAddress }));
        authenticate(newAddress);
      }
    };

    const handleChainChanged = (...args: unknown[]) => {
      const chainId = args[0] as string;
      updateChainId(chainId);
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    if (token && !rawDemo) {
      setAuthToken(token);
      ethereum
        .request({ method: 'eth_accounts' })
        .then((accounts) => {
          const accs = accounts as string[];
          if (accs.length > 0) {
            const addr = accs[0];
            setState((prev) => ({ ...prev, address: addr, isConnected: true }));
            ethereum.request({ method: 'eth_chainId' }).then((chainId) => {
              updateChainId(chainId as string);
            });
            authenticate(addr);
          }
        })
        .catch(console.error);
    }

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [authenticate, disconnect, updateChainId]);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        walletAddress: state.address,
        connect,
        disconnect,
        switchNetwork,
        signInAsDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
