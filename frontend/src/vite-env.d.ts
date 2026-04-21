/// <reference types="vite/client" />

interface EthereumProvider {
  isMetaMask?: boolean;
  isTrust?: boolean;
  isCoinbaseWallet?: boolean;
  /** EIP-5749 / legacy multi-wallet aggregation. */
  providers?: EthereumProvider[];
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
}

interface Window {
  ethereum?: EthereumProvider;
}
