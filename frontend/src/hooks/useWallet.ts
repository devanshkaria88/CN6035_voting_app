import { useAuth } from '@/context/AuthContext';

export function useWallet() {
  const auth = useAuth();

  const shortenAddress = (address: string) =>
    `${address.slice(0, 6)}...${address.slice(-4)}`;

  return {
    ...auth,
    displayAddress: auth.address ? shortenAddress(auth.address) : null,
    shortenAddress,
  };
}
