// src/services/api.ts
import { Platform } from 'react-native';

const API_ROOT = process.env.EXPO_PUBLIC_API_URL
  ?? (Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000');

const BASE_URL = API_ROOT.endsWith('/api/v1')
  ? API_ROOT
  : `${API_ROOT.replace(/\/$/, '')}/api/v1`;

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Network error' }));
    const detail = typeof err.detail === 'string'
      ? err.detail
      : Array.isArray(err.detail)
        ? err.detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(', ')
        : null;
    throw new Error(detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TripWallet {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  status: 'COLLECTING' | 'ACTIVE' | 'CLOSED';
  total_contributed: number;
  total_expenses: number;
  remaining_balance: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface TripMember {
  id: string;
  trip_id: string;
  user_id: string;
  role: 'ADMIN' | 'MEMBER';
  contributed_amount: number;
  refunded_amount: number;
  joined_at: string;
}

export interface TripExpense {
  id: string;
  trip_id: string;
  recorded_by: string;
  amount: number;
  currency: string;
  description: string;
  category: string | null;
  created_at: string;
}

export interface GroupWallet {
  id: string;
  name: string;
  description: string | null;
  currency: string;
  status: 'OPEN' | 'DEPLOYING' | 'CLOSED';
  target_amount: number;
  total_contributed: number;
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'ADMIN' | 'MEMBER';
  contributed_amount: number;
  ownership_bps: number;
  joined_at: string;
}

export interface LedgerEntry {
  id: string;
  user_id: string;
  entry_type: 'CREDIT' | 'DEBIT';
  amount: number;
  currency: string;
  reference_type: string;
  reference_id: string;
  status: string;
  description: string | null;
  created_at: string;
}

export interface RAGIngestResponse {
  document_id: string;
  chunk_count: number;
  char_count: number;
  metadata: Record<string, unknown>;
}

export interface RAGQueryResponse {
  simple_explanation: string;
  clause_reference: string | null;
  confidence_level: 'High' | 'Medium' | 'Low';
  fallback: string | null;
}

export interface DemoBootstrapResponse {
  current_user_id: string;
  trip_id: string;
  group_id: string;
}

// ─── Trip Wallet API ──────────────────────────────────────────────────────────

export const TripAPI = {
  get: (id: string) => request<TripWallet>(`/wallets/trips/${id}`),

  create: (body: { name: string; description?: string; currency: string; created_by: string }) =>
    request<TripWallet>('/wallets/trips', { method: 'POST', body: JSON.stringify(body) }),

  activate: (id: string, requested_by: string) =>
    request<TripWallet>(`/wallets/trips/${id}/activate`, {
      method: 'POST',
      body: JSON.stringify({ requested_by }),
    }),

  close: (id: string) =>
    request(`/wallets/trips/${id}/close`, { method: 'POST' }),

  members: (id: string) => request<TripMember[]>(`/wallets/trips/${id}/members`),

  join: (id: string, user_id: string) =>
    request<TripMember>(`/wallets/trips/${id}/members`, {
      method: 'POST',
      body: JSON.stringify({ user_id }),
    }),

  contribute: (id: string, user_id: string, amount: number) =>
    request(`/wallets/trips/${id}/contribute`, {
      method: 'POST',
      body: JSON.stringify({ user_id, amount }),
    }),

  expenses: (id: string) => request<TripExpense[]>(`/wallets/trips/${id}/expenses`),

  addExpense: (id: string, body: { recorded_by: string; amount: number; description: string; category?: string }) =>
    request<TripExpense>(`/wallets/trips/${id}/expenses`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

// ─── Group Wallet API ─────────────────────────────────────────────────────────

export const GroupAPI = {
  get: (id: string) => request<GroupWallet>(`/wallets/groups/${id}`),

  create: (body: { name: string; currency: string; created_by: string; target_amount?: number }) =>
    request<GroupWallet>('/wallets/groups', { method: 'POST', body: JSON.stringify(body) }),

  members: (id: string) => request<GroupMember[]>(`/wallets/groups/${id}/members`),

  contribute: (id: string, user_id: string, amount: number) =>
    request(`/wallets/groups/${id}/contribute`, {
      method: 'POST',
      body: JSON.stringify({ user_id, amount }),
    }),

  join: (id: string, user_id: string) =>
    request<GroupMember>(`/wallets/groups/${id}/members`, {
      method: 'POST',
      body: JSON.stringify({ user_id }),
    }),
};

// ─── Insurance RAG API ────────────────────────────────────────────────────────

export const InsuranceAPI = {
  ingest: async (pdfUri: string, fileName: string): Promise<RAGIngestResponse> => {
    const formData = new FormData();
    formData.append('file', {
      uri: pdfUri,
      name: fileName,
      type: 'application/pdf',
    } as unknown as Blob);

    const res = await fetch(`${BASE_URL}/insurance/documents`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  },

  query: (question: string, document_id?: string): Promise<RAGQueryResponse> =>
    request<RAGQueryResponse>('/insurance/query', {
      method: 'POST',
      body: JSON.stringify({ question, document_id }),
    }),

  listDocuments: () => request<RAGIngestResponse[]>('/insurance/documents'),
};

export const BootstrapAPI = {
  ensureDemoData: () => request<DemoBootstrapResponse>('/bootstrap/demo', { method: 'POST' }),
};
