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
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch users (${response.status})`);
  }
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

// Subscriptions
export interface UserSubscription {
  plan: 'free' | 'basic' | 'premium';
  expires_at: string | null;
}

export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  const response = await fetch(`${API_URL}/admin/v1/users/${userId}/subscription`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch subscription');
  return response.json();
}

export async function updateUserSubscription(
  userId: string,
  data: { plan: 'free' | 'basic' | 'premium'; expires_at?: string; reason: string }
): Promise<{ user: User; old_plan: string; new_plan: string }> {
  const response = await fetch(`${API_URL}/admin/v1/users/${userId}/subscription`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to update subscription');
  }
  return response.json();
}

// Reset User Data
export type ResetScope = 'progress' | 'tree' | 'all';

export interface ResetUserDataResult {
  userId: string;
  scope: ResetScope;
  deleted: Record<string, number>;
  timestamp: string;
}

export async function resetUserData(
  userId: string,
  data: { scope: ResetScope; reason: string }
): Promise<ResetUserDataResult> {
  const response = await fetch(`${API_URL}/admin/v1/users/${userId}/reset`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to reset user data');
  }
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
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch jobs (${response.status})`);
  }
  return response.json();
}

// Analytics
export interface AnalyticsOverview {
  totalUsers: number;
  activeUsers7d: number;
  activeUsers30d: number;
  totalEntries: number;
  totalSessions: number;
  totalQuests: number;
  completedQuests: number;
  totalEvidence: number;
}

export interface DailyStats {
  date: string;
  entries_count: number;
  sessions_succeeded: number;
  quests_completed: number;
  evidences_count: number;
  new_users: number;
}

export interface UserActivityStats {
  user_id: string;
  telegramUsername: string;
  entries_7d: number;
  entries_30d: number;
  quests_completed_30d: number;
  last_entry_at: string | null;
}

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const response = await fetch(`${API_URL}/admin/v1/analytics/overview`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    // Fallback to basic stats if endpoint doesn't exist
    const usersData = await getAdminUsers({ limit: 1 });
    const jobsData = await getJobs({ limit: 1 });
    return {
      totalUsers: usersData.total,
      activeUsers7d: 0,
      activeUsers30d: 0,
      totalEntries: 0,
      totalSessions: 0,
      totalQuests: 0,
      completedQuests: 0,
      totalEvidence: 0,
    };
  }
  return response.json();
}

export async function getDailyStats(days: number = 30): Promise<DailyStats[]> {
  const response = await fetch(`${API_URL}/admin/v1/analytics/daily?days=${days}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    // Return empty array if endpoint doesn't exist
    return [];
  }
  return response.json();
}

export async function getTopActiveUsers(limit: number = 10): Promise<UserActivityStats[]> {
  const response = await fetch(`${API_URL}/admin/v1/analytics/top-users?limit=${limit}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    return [];
  }
  return response.json();
}

// Prompts
export interface Prompt {
  prompt_id: string;
  version: number;
  status: 'draft' | 'active' | 'deprecated';
  purpose: string;
  template: string;
  schema?: any;
  created_at: string;
  created_by_admin?: string;
}

export interface ConfigSet {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'deprecated';
  created_at: string;
  versions?: ConfigVersion[];
}

export interface ConfigVersion {
  id: string;
  config_set_id: string;
  version: number;
  payload: any;
  comment?: string;
  created_at: string;
  activated_at?: string;
}

export interface LlmRun {
  id: string;
  session_id?: string;
  stage: string;
  prompt_id?: string;
  prompt_version?: number;
  model?: string;
  status: 'succeeded' | 'failed';
  tokens_in?: number;
  tokens_out?: number;
  latency_ms?: number;
  created_at: string;
}

export async function getPrompts(): Promise<Prompt[]> {
  const response = await fetch(`${API_URL}/admin/v1/prompts`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) return [];
  return response.json();
}

export async function getPromptVersions(promptId: string): Promise<Prompt[]> {
  const response = await fetch(`${API_URL}/admin/v1/prompts/${promptId}/versions`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) return [];
  return response.json();
}

export async function createPromptVersion(
  promptId: string,
  data: { template: string; purpose: string; schema?: Record<string, unknown> }
): Promise<Prompt> {
  const response = await fetch(`${API_URL}/admin/v1/prompts/${promptId}/versions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create prompt version');
  }
  return response.json();
}

export async function activatePrompt(
  promptId: string,
  version: number,
  reason: string
): Promise<Prompt> {
  const response = await fetch(`${API_URL}/admin/v1/prompts/${promptId}/activate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ version, reason }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to activate prompt');
  }
  return response.json();
}

export async function getConfigSets(): Promise<ConfigSet[]> {
  const response = await fetch(`${API_URL}/admin/v1/config-sets`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) return [];
  return response.json();
}

export async function getConfigVersions(configSetId: string): Promise<ConfigVersion[]> {
  const response = await fetch(`${API_URL}/admin/v1/config-sets/${configSetId}/versions`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) return [];
  return response.json();
}

export async function createConfigVersion(
  configSetId: string,
  data: { payload: Record<string, unknown>; comment?: string }
): Promise<ConfigVersion> {
  const response = await fetch(`${API_URL}/admin/v1/config-sets/${configSetId}/versions`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create config version');
  }
  return response.json();
}

export async function activateConfigVersion(
  configSetId: string,
  version: number,
  reason: string
): Promise<ConfigVersion> {
  const response = await fetch(`${API_URL}/admin/v1/config-sets/${configSetId}/activate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ version, reason }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to activate config version');
  }
  return response.json();
}

export async function getLlmRuns(params?: {
  session_id?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ runs: LlmRun[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.session_id) query.append('session_id', params.session_id);
  if (params?.status) query.append('status', params.status);
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.offset) query.append('offset', params.offset.toString());

  const response = await fetch(`${API_URL}/admin/v1/prompts/llm-runs?${query}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) return { runs: [], total: 0 };
  const data = await response.json();
  // Ensure we always return the expected structure
  return {
    runs: Array.isArray(data?.runs) ? data.runs : [],
    total: typeof data?.total === 'number' ? data.total : 0,
  };
}

// Settings
export interface SystemSettings {
  llm: {
    default_provider: string;
    openai_configured: boolean;
    anthropic_configured: boolean;
  };
  telegram: {
    bot_configured: boolean;
    webhook_url: string | null;
  };
  features: {
    tree_auto_sync_disabled: boolean;
  };
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  key_masked: string;
  provider: string;
  created_at: string;
  last_used_at?: string;
}

export async function getSystemSettings(): Promise<SystemSettings> {
  const response = await fetch(`${API_URL}/admin/v1/settings`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to fetch system settings');
  }
  return response.json();
}

export async function getApiKeys(): Promise<ApiKeyInfo[]> {
  const response = await fetch(`${API_URL}/admin/v1/settings/api-keys`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    return [];
  }
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
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to fetch audit log (${response.status})`);
  }
  return response.json();
}

