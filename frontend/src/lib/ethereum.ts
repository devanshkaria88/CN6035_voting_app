/**
 * Resolves the preferred EIP-1193 provider.
 *
 * When a user has multiple wallet extensions installed (MetaMask, Trust
 * Wallet, Coinbase Wallet, Brave, etc.) several of them inject an aggregator
 * at `window.ethereum` that exposes a `providers` array and prompts the user
 * to pick which wallet should answer each request. Trust Wallet's
 * `evmAsk.js` in particular throws a generic "Unexpected error" when that
 * picker is dismissed, which is the cause of the infinite spinner we
 * otherwise see on `Connect Wallet`.
 *
 * To keep the flow deterministic we always prefer MetaMask when it is
 * available and fall back to the first injected provider otherwise.
 */
export function getEthereumProvider(): EthereumProvider | null {
  if (typeof window === 'undefined') return null;
  const root = window.ethereum;
  if (!root) return null;

  if (Array.isArray(root.providers) && root.providers.length > 0) {
    const mm = root.providers.find((p) => p.isMetaMask && !p.isTrust);
    if (mm) return mm;
    return root.providers[0];
  }

  return root;
}

export function hasEthereumProvider(): boolean {
  return getEthereumProvider() !== null;
}
