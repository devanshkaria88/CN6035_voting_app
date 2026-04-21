import axios from 'axios';
import type {
  ApiResponse,
  Candidate,
  Voter,
  ElectionStatus,
  AuthNonceResponse,
  AuthVerifyResponse,
  AddCandidateResponse,
  RegisterVoterResponse,
  BatchRegisterResponse,
  ElectionActionResponse,
  EndElectionResponse,
  VoteTransactionData,
  ContractInfo,
  VoterRecord,
  DemoAccountsResponse,
  DemoRole,
} from './types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem('auth_token');
}

api.interceptors.request.use((config) => {
  const token = authToken ?? getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.data) {
      const apiError = error.response.data as {
        success: false;
        error: { code: string; message: string; details?: Record<string, unknown> };
      };
      const err = new Error(apiError.error?.message ?? 'An error occurred');
      (err as Error & { code: string }).code = apiError.error?.code ?? 'UNKNOWN';
      (err as Error & { status: number }).status = error.response.status;
      throw err;
    }
    throw error;
  }
);

export async function getElectionStatus(): Promise<ElectionStatus> {
  const { data } = await api.get<ApiResponse<ElectionStatus>>('/election/status');
  return data.data;
}

export async function getCandidates(): Promise<Candidate[]> {
  const { data } = await api.get<ApiResponse<{ candidates: Candidate[] }>>('/candidates');
  return data.data.candidates;
}

export async function getCandidate(id: number): Promise<Candidate> {
  const { data } = await api.get<ApiResponse<{ candidate: Candidate }>>(`/candidates/${id}`);
  return data.data.candidate;
}

export async function createCandidate(
  name: string,
  manifesto: string
): Promise<AddCandidateResponse> {
  const { data } = await api.post<ApiResponse<AddCandidateResponse>>('/candidates', {
    name,
    manifesto,
  });
  return data.data;
}

export async function updateCandidate(
  id: number,
  name: string,
  manifesto: string
): Promise<{ transactionHash: string }> {
  const { data } = await api.patch<ApiResponse<{ transactionHash: string }>>(
    `/candidates/${id}`,
    { name, manifesto }
  );
  return data.data;
}

export async function deleteCandidate(
  id: number
): Promise<{ transactionHash: string }> {
  const { data } = await api.delete<ApiResponse<{ transactionHash: string }>>(
    `/candidates/${id}`
  );
  return data.data;
}

export async function getVoterStatus(address: string): Promise<Voter> {
  const { data } = await api.get<ApiResponse<Voter>>(`/voters/${address}`);
  return data.data;
}

export async function listVoters(): Promise<VoterRecord[]> {
  const { data } = await api.get<
    ApiResponse<{ voters: VoterRecord[]; total: number }>
  >('/voters');
  return data.data.voters;
}

export async function registerVoter(address: string): Promise<RegisterVoterResponse> {
  const { data } = await api.post<ApiResponse<RegisterVoterResponse>>('/voters/register', {
    address,
  });
  return data.data;
}

export async function registerVotersBatch(
  addresses: string[]
): Promise<BatchRegisterResponse> {
  const { data } = await api.post<ApiResponse<BatchRegisterResponse>>(
    '/voters/register-batch',
    { addresses }
  );
  return data.data;
}

export async function submitVote(candidateId: number): Promise<VoteTransactionData> {
  const { data } = await api.post<ApiResponse<VoteTransactionData>>('/voters/vote', {
    candidateId,
  });
  return data.data;
}

export async function startElection(): Promise<ElectionActionResponse> {
  const { data } = await api.post<ApiResponse<ElectionActionResponse>>('/election/start');
  return data.data;
}

export async function endElection(): Promise<EndElectionResponse> {
  const { data } = await api.post<ApiResponse<EndElectionResponse>>('/election/end');
  return data.data;
}

export async function getResults(): Promise<Candidate[]> {
  const { data } = await api.get<ApiResponse<{ candidates: Candidate[] }>>(
    '/election/results'
  );
  return data.data.candidates;
}

export async function getWinner(): Promise<Candidate> {
  const { data } = await api.get<ApiResponse<{ winner: Candidate }>>('/election/winner');
  return data.data.winner;
}

export async function getNonce(address: string): Promise<AuthNonceResponse> {
  const { data } = await api.post<ApiResponse<AuthNonceResponse>>('/auth/nonce', {
    address,
  });
  return data.data;
}

export async function verifySignature(
  address: string,
  signature: string
): Promise<AuthVerifyResponse> {
  const { data } = await api.post<ApiResponse<AuthVerifyResponse>>('/auth/verify', {
    address,
    signature,
  });
  return data.data;
}

export async function listDemoAccounts(): Promise<DemoAccountsResponse | null> {
  try {
    const { data } = await api.get<ApiResponse<DemoAccountsResponse>>(
      '/auth/demo-accounts'
    );
    return data.data;
  } catch (error) {
    const err = error as { status?: number };
    if (err.status === 404) return null;
    throw error;
  }
}

export async function demoLogin(
  role: DemoRole,
  index?: number
): Promise<AuthVerifyResponse> {
  const { data } = await api.post<ApiResponse<AuthVerifyResponse>>('/auth/demo', {
    role,
    ...(typeof index === 'number' ? { index } : {}),
  });
  return data.data;
}

export async function getContractAddress(): Promise<ContractInfo> {
  const { data } = await api.get<ApiResponse<ContractInfo>>('/contract/address');
  return data.data;
}

export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  const { data } = await api.get<ApiResponse<{ status: string; timestamp: string }>>(
    '/health'
  );
  return data.data;
}
