export interface Candidate {
  id: number;
  name: string;
  manifesto: string;
  voteCount: number;
}

/**
 * Candidate with derived percentage (used by Results page leaderboard).
 */
export interface CandidateResult extends Candidate {
  percentage: number;
  rank: number;
}

/**
 * Body shape POSTed to /api/v1/voters/vote.
 */
export interface VoteRequest {
  candidateId: number;
}

/**
 * Body shape POSTed to /api/v1/voters/register.
 */
export interface RegisterVoterRequest {
  address: string;
}

/**
 * Body shape POSTed to /api/v1/voters/register-batch.
 */
export interface BatchRegisterRequest {
  addresses: string[];
}

/**
 * Body shape POSTed to /api/v1/candidates.
 */
export interface AddCandidateRequest {
  name: string;
  manifesto: string;
}

/**
 * Voter row returned by GET /api/v1/voters (admin).
 */
export interface VoterRecord {
  address: string;
  isRegistered: boolean;
  hasVoted: boolean;
  votedCandidateId: number | null;
  registeredAt?: number;
}

export interface Voter {
  address: string;
  isRegistered: boolean;
  hasVoted: boolean;
  votedCandidateId: number | null;
}

export interface ElectionStatus {
  isStarted: boolean;
  isEnded: boolean;
  candidateCount: number;
  registeredVoterCount: number;
  totalVotes: number;
}

export interface AuthNonceResponse {
  nonce: string;
  message: string;
}

export interface AuthVerifyResponse {
  token: string;
  address: string;
  role: 'admin' | 'voter';
  isDemo?: boolean;
}

export type DemoRole = 'admin' | 'voter';

export interface DemoAccount {
  index?: number;
  address: string;
}

export interface DemoAccountsResponse {
  admin: DemoAccount | null;
  voters: DemoAccount[];
}

export interface VoteTransactionData {
  to?: string;
  data?: string;
  /** Returned by demo flow when the backend has already broadcast the tx. */
  transactionHash?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface AddCandidateResponse {
  transactionHash: string;
  candidateId: number;
}

export interface RegisterVoterResponse {
  transactionHash: string;
}

export interface BatchRegisterResponse {
  transactionHash: string;
  registeredCount: number;
}

export interface ElectionActionResponse {
  transactionHash: string;
}

export interface EndElectionResponse {
  transactionHash: string;
  winner: Candidate;
}

export interface ContractInfo {
  address: string;
}

export const SEPOLIA_CHAIN_ID = '0xaa36a7';
export const SEPOLIA_CHAIN_ID_DECIMAL = 11155111;

export const SEPOLIA_NETWORK = {
  chainId: SEPOLIA_CHAIN_ID,
  chainName: 'Sepolia TestNet',
  nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://rpc.sepolia.org'],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
};

/**
 * Local Hardhat node config (chainId 31337). Useful during development.
 */
export const HARDHAT_CHAIN_ID = '0x7a69';
export const HARDHAT_NETWORK = {
  chainId: HARDHAT_CHAIN_ID,
  chainName: 'Hardhat Localhost',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['http://127.0.0.1:8545'],
  blockExplorerUrls: [] as string[],
};

/**
 * Resolve the expected network from VITE_EXPECTED_CHAIN_ID (defaults to
 * Sepolia). Set VITE_EXPECTED_CHAIN_ID=0x7a69 in `.env.local` to point the
 * frontend at a local Hardhat node.
 */
const rawExpectedChainId =
  (import.meta.env.VITE_EXPECTED_CHAIN_ID as string | undefined) ??
  SEPOLIA_CHAIN_ID;
export const EXPECTED_CHAIN_ID = rawExpectedChainId.toLowerCase();
export const EXPECTED_NETWORK =
  EXPECTED_CHAIN_ID === HARDHAT_CHAIN_ID.toLowerCase()
    ? HARDHAT_NETWORK
    : SEPOLIA_NETWORK;
