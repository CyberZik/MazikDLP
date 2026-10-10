/**
 * MazikDLP API Client
 * Typed fetch wrapper — injects auth token, handles 401s.
 */

const BASE_URL = '/api/v1';

// ── Token storage ────────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

export function getRefreshToken(): string | null {
  return localStorage.getItem('refresh_token');
}

export function saveTokens(access: string, refresh: string) {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
}

export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('current_user');
}

export function saveUser(user: CurrentUser) {
  localStorage.setItem('current_user', JSON.stringify(user));
}

export function loadUser(): CurrentUser | null {
  try {
    const raw = localStorage.getItem('current_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface CurrentUser {
  user_id: string;
  org_id: string;
  email: string;
  name: string;
  role: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface RegisterResponse {
  user_id: string;
  email: string;
  name: string;
  role: string;
  org_id: string;
  org_name: string;
  tokens: TokenResponse;
}

export interface AuditLogEntry {
  id: string;
  org_id: string;
  user_id: string | null;
  action: string;
  platform: string | null;
  model: string | null;
  entities_detected: string[];
  policy_id: string | null;
  policy_name: string | null;
  decision: string | null;
  severity: string | null;
  response_time_ms: number | null;
  session_id: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface AuditLogStats {
  total_scans: number;
  total_blocks: number;
  total_masks: number;
  total_allows: number;
  total_alerts: number;
  top_entities: { entity_type: string; count: number }[];
  top_platforms: { platform: string; count: number }[];
}

export interface Policy {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  category: string | null;
  protection_level: string;
  action: string;
  data_types: string[] | null;
  user_groups: string[] | null;
  ai_platforms: string[] | null;
  ai_models: string[] | null;
  priority: number;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  org_id: string;
  email: string;
  name: string;
  role: string;
  department: string | null;
  team: string | null;
  status: string;
  mfa_enabled: boolean;
  extension_installed: boolean;
  extension_version: string | null;
  last_active: string | null;
  created_at: string;
}

export interface PaginatedMeta {
  page: number;
  per_page: number;
  total: number;
  pages: number;
}

export interface AIApp {
  id: string;
  org_id: string;
  name: string;
  vendor: string | null;
  website: string | null;
  status: string;
  risk_level: string | null;
  security_score: number | null;
  models: string[];
  compliance: string[];
}

export interface Pattern {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  entity_type: string;
  pattern_type: string;
  pattern: string;
  sensitivity: string;
  action: string;
  category: string | null;
  tags: string[];
  is_enabled: boolean;
  total_detections: number;
  version: number;
}

// ── Core fetch ───────────────────────────────────────────────────────────────

let _onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(fn: () => void) {
  _onUnauthorized = fn;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    _onUnauthorized?.();
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      // Backend wraps errors as { error: { message: "..." } } or { detail: "..." }
      message = body?.error?.message || body?.detail || body?.message || message;
    } catch { /* ignore */ }
    throw new Error(message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;

  return res.json();
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export const auth = {
  login: (email: string, password: string) =>
    request<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: {
    email: string;
    password: string;
    name: string;
    org_name: string;
    org_domain?: string;
  }) =>
    request<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: (refresh_token: string) =>
    request<void>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token }),
    }),

  refresh: (refresh_token: string) =>
    request<TokenResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token }),
    }),
};

// ── Analytics ─────────────────────────────────────────────────────────────────

export const analytics = {
  usage: (days = 7) =>
    request<{ data: { date: string; count: number }[]; period_days: number }>(
      `/analytics/usage?days=${days}`,
    ),

  security: (days = 30) =>
    request<{ data: Record<string, number>; period_days: number }>(
      `/analytics/security?days=${days}`,
    ),

  apps: (days = 30) =>
    request<{ data: { platform: string; count: number }[]; period_days: number }>(
      `/analytics/apps?days=${days}`,
    ),

  categories: (days = 30, platform?: string) => {
    const q = new URLSearchParams({ days: String(days) });
    if (platform) q.set('platform', platform);
    return request<{ status: string; data: { category: string; label: string; color: string; count: number }[]; period_days: number; platform_filter: string | null }>(
      `/analytics/categories?${q.toString()}`,
    );
  },
};

// ── Logs ──────────────────────────────────────────────────────────────────────

export const logs = {
  list: (params?: {
    page?: number;
    per_page?: number;
    user_id?: string;
    action?: string;
    platform?: string;
    date_from?: string;
    date_to?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.per_page) q.set('per_page', String(params.per_page));
    if (params?.user_id) q.set('user_id', params.user_id);
    if (params?.action) q.set('action', params.action);
    if (params?.platform) q.set('platform', params.platform);
    if (params?.date_from) q.set('date_from', params.date_from);
    if (params?.date_to) q.set('date_to', params.date_to);
    return request<{ status: string; data: AuditLogEntry[]; meta: PaginatedMeta }>(
      `/logs?${q.toString()}`,
    );
  },

  stats: () => request<AuditLogStats>('/logs/stats'),

  export: (params?: { action?: string; platform?: string; date_from?: string; date_to?: string }) => {
    const q = new URLSearchParams();
    if (params?.action) q.set('action', params.action);
    if (params?.platform) q.set('platform', params.platform);
    if (params?.date_from) q.set('date_from', params.date_from);
    if (params?.date_to) q.set('date_to', params.date_to);
    const token = getAccessToken();
    return fetch(`/api/v1/logs/export?${q.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
};

// ── Policies ──────────────────────────────────────────────────────────────────

export const policies = {
  list: (status?: string) => {
    const q = status ? `?status=${status}` : '';
    return request<Policy[]>(`/policies${q}`);
  },

  get: (id: string) => request<Policy>(`/policies/${id}`),

  create: (payload: Partial<Policy>) =>
    request<Policy>('/policies', { method: 'POST', body: JSON.stringify(payload) }),

  update: (id: string, payload: Partial<Policy>) =>
    request<Policy>(`/policies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    request<void>(`/policies/${id}`, { method: 'DELETE' }),
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const users = {
  list: (params?: { page?: number; per_page?: number; status?: string; role?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.per_page) q.set('per_page', String(params.per_page));
    if (params?.status) q.set('status', params.status);
    if (params?.role) q.set('role', params.role);
    if (params?.search) q.set('search', params.search);
    return request<{ data: User[]; meta: PaginatedMeta }>(`/users?${q.toString()}`);
  },

  get: (id: string) => request<User>(`/users/${id}`),

  update: (id: string, payload: Partial<User>) =>
    request<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  setRole: (id: string, role: string) =>
    request<User>(`/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),

  create: (payload: { email: string; name: string; password: string; role?: string; department?: string; team?: string }) =>
    request<User>('/users', { method: 'POST', body: JSON.stringify(payload) }),

  delete: (id: string) =>
    request<void>(`/users/${id}`, { method: 'DELETE' }),
};

// ── AI Apps ───────────────────────────────────────────────────────────────────

export const aiApps = {
  list: () => request<AIApp[]>('/ai-apps'),
  create: (payload: Partial<AIApp>) =>
    request<AIApp>('/ai-apps', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: Partial<AIApp>) =>
    request<AIApp>(`/ai-apps/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  setStatus: (id: string, status: string) =>
    request<AIApp>(`/ai-apps/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  delete: (id: string) => request<void>(`/ai-apps/${id}`, { method: 'DELETE' }),
};

// ── Custom Patterns ───────────────────────────────────────────────────────────

export const patterns = {
  list: () => request<Pattern[]>('/patterns'),
  create: (payload: {
    name: string; description?: string; entity_type: string;
    pattern_type: string; pattern: string; flags?: string;
    sensitivity: string; action: string; category?: string;
    examples_positive?: string[]; examples_negative?: string[]; is_enabled?: boolean;
  }) => request<Pattern>('/patterns', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id: string, payload: Partial<Pattern>) =>
    request<Pattern>(`/patterns/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  delete: (id: string) => request<void>(`/patterns/${id}`, { method: 'DELETE' }),
  testDirect: (patternStr: string, patternType: string, testText: string, flags?: string) =>
    request<{ matches: { match: string; start: number; end: number }[]; match_count: number; valid: boolean; error?: string }>(
      '/patterns/test',
      { method: 'POST', body: JSON.stringify({ pattern: patternStr, pattern_type: patternType, test_text: testText, flags }) }
    ),
};

// ── Settings ──────────────────────────────────────────────────────────────────

export const settingsApi = {
  get: () => request<{ status: string; data: Record<string, unknown> }>('/settings'),
  update: (data: Record<string, unknown>) =>
    request<{ status: string; data: Record<string, unknown> }>('/settings', {
      method: 'PUT',
      body: JSON.stringify({ settings: data }),
    }),
};

export interface ApiKeyRecord {
  id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
  plaintext_key?: string;
}

export const apiKeys = {
  list: () => request<ApiKeyRecord[]>('/api-keys'),
  create: (name: string, expires_at?: string) =>
    request<ApiKeyRecord>('/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name, expires_at }),
    }),
  revoke: (id: string) => request<void>(`/api-keys/${id}`, { method: 'DELETE' }),
  rotate: (id: string) => request<ApiKeyRecord>(`/api-keys/${id}/rotate`, { method: 'POST' }),
};

// ── Scan ──────────────────────────────────────────────────────────────────────

export const scan = {
  scan: (text: string, platform?: string) =>
    request<{
      action: string;
      message: string | null;
      masked_text: string;
      session_id: string | null;
      entities_detected: { entity_type: string; start: number; end: number; score: number; text: string; detector: string }[];
      policy_matched: string | null;
    }>('/scan', { method: 'POST', body: JSON.stringify({ text, platform }) }),

  detectTest: (text: string) =>
    request<{
      entities: { entity_type: string; start: number; end: number; score: number; text: string; detector: string }[];
      count: number;
      entity_types: string[];
    }>('/detect/test', { method: 'POST', body: JSON.stringify({ text }) }),

  restore: (masked_text: string, session_id: string) =>
    request<{ original_text: string }>('/restore', {
      method: 'POST',
      body: JSON.stringify({ masked_text, session_id }),
    }),
};
