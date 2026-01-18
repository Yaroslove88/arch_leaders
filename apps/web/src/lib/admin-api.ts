/**
 * API клиент для админ-панели
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const ADMIN_TOKEN_STORAGE_KEY = 'admin_token';

function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
}

/**
 * Получить заголовки с токеном аутентификации
 */
function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Админ-эндпоинты требуют токен из `/admin/v1/auth/login`.
  // Для fail-safe совместимости оставляем fallback на `auth_token`,
  // но при наличии — всегда используем `admin_token`.
  const token =
    typeof window !== 'undefined'
      ? (getAdminToken() || localStorage.getItem('auth_token'))
      : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'operator' | 'analyst';
  created_at: string;
  last_login_at?: string;
}

export interface User {
  id: string;
  telegramUsername: string;
  email?: string;
  role: string;
  status: 'active' | 'blocked' | 'deleted';
  created_at: string;
  last_seen_at?: string;
}

export interface User360 {
  user: User;
  stats: {
    entries_count: number;
    sessions_count: number;
    quests_active: number;
    quests_completed: number;
    abilities_unlocked: number;
  };
}

export interface Entry {
  id: string;
  userId: string;
  type: string;
  source: string;
  title?: string;
  content_raw?: string;
  content_masked?: string;
  is_sensitive: boolean;
  created_at: string;
}

export interface Session {
  id: string;
  userId: string;
  entry_id: string;
  status: string;
  summary?: string;
  created_at: string;
  completed_at?: string;
}

export interface Quest {
  id: string;
  userId: string;
  title: string;
  type: string;
  status: string;
  created_at: string;
}

export interface Job {
  id: string;
  job_type: string;
  status: string;
  user_id?: string;
  created_at: string;
  started_at?: string;
  finished_at?: string;
}

export interface AuditLog {
  id: string;
  admin_user_id: string;
  action: string;
  target_type: string;
  target_id: string;
  reason?: string;
  metadata?: any;
  created_at: string;
}

// Auth
export async function adminLogin(telegramUsername: string, password: string) {
  const response = await fetch(`${API_URL}/admin/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telegramUsername, password }),
  });
  if (!response.ok) throw new Error('Login failed');
  return response.json();
}

export async function getAdminMe(): Promise<AdminUser> {
  const response = await fetch(`${API_URL}/admin/v1/auth/me`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch admin user');
  return response.json();
}

// Users
export async function getAdminUsers(params?: {
  q?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ users: User[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.q) query.append('q', params.q);
  if (params?.status) query.append('status', params.status);
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.offset) query.append('offset', params.offset.toString());

  const response = await fetch(`${API_URL}/admin/v1/users?${query}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}

export async function getUser360(userId: string): Promise<User360> {
  const response = await fetch(`${API_URL}/admin/v1/users/${userId}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch user 360');
  return response.json();
}

export async function updateUser(userId: string, data: { status?: string; note?: string }, reason: string) {
  const response = await fetch(`${API_URL}/admin/v1/users/${userId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ ...data, reason }),
  });
  if (!response.ok) throw new Error('Failed to update user');
  return response.json();
}

// Entries
export async function getUserEntries(userId: string, params?: {
  type?: string;
  source?: string;
  limit?: number;
  offset?: number;
}): Promise<{ entries: Entry[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.type) query.append('type', params.type);
  if (params?.source) query.append('source', params.source);
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.offset) query.append('offset', params.offset.toString());

  const response = await fetch(`${API_URL}/admin/v1/users/${userId}/entries?${query}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch entries');
  return response.json();
}

export async function getEntry(entryId: string, view: 'masked' | 'full', reason?: string): Promise<Entry> {
  const query = new URLSearchParams();
  query.append('view', view);
  if (reason) query.append('reason', reason);

  const response = await fetch(`${API_URL}/admin/v1/entries/${entryId}?${query}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch entry');
  return response.json();
}

// Sessions
export async function getUserSessions(userId: string, params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ sessions: Session[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.offset) query.append('offset', params.offset.toString());

  const response = await fetch(`${API_URL}/admin/v1/users/${userId}/sessions?${query}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch sessions');
  return response.json();
}

// Quests
export async function getUserQuests(userId: string, params?: {
  status?: string;
  type?: string;
  limit?: number;
  offset?: number;
}): Promise<{ quests: Quest[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.type) query.append('type', params.type);
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.offset) query.append('offset', params.offset.toString());

  const response = await fetch(`${API_URL}/admin/v1/users/${userId}/quests?${query}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch quests');
  return response.json();
}

// Jobs
export async function getJobs(params?: {
  status?: string;
  job_type?: string;
  limit?: number;
  offset?: number;
}): Promise<{ jobs: Job[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.job_type) query.append('job_type', params.job_type);
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.offset) query.append('offset', params.offset.toString());

  const response = await fetch(`${API_URL}/admin/v1/jobs?${query}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch jobs');
  return response.json();
}

// Audit
export async function getAuditLog(params?: {
  admin_user_id?: string;
  action?: string;
  target_type?: string;
  limit?: number;
  offset?: number;
}): Promise<{ logs: AuditLog[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.admin_user_id) query.append('admin_user_id', params.admin_user_id);
  if (params?.action) query.append('action', params.action);
  if (params?.target_type) query.append('target_type', params.target_type);
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.offset) query.append('offset', params.offset.toString());

  const response = await fetch(`${API_URL}/admin/v1/audit-log?${query}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch audit log');
  return response.json();
}

