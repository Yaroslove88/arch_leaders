/**
 * API клиент для работы с Leadership Architect API
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Auth types and interfaces
 */
export interface User {
  id: string;
  telegramUsername: string;
  role: string;
}

/**
 * Получить заголовки с токеном аутентификации
 */
function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

export interface Entry {
  id: string;
  type: string;
  source: string;
  text: string;
  participants?: string[];
  context_json?: any;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  entry_id: string;
  summary: string;
  insights_json: any[];
  focus_json: any[];
  themes: string[];
  patterns: string[];
  tensions: string[];
  ability_signals_json: any[];
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'micro' | 'weekly' | 'story' | 'in-person';
  status: 'active' | 'backlog' | 'done' | 'archived';
  steps: any[];
  criteria: any;
  reward?: any;
  linked_nodes: string[];
  tags?: string[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface Evidence {
  id: string;
  type: string;
  text: string;
  quest_id?: string;
  ability_node_id?: string;
  session_id?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface SemanticTree {
  tree_id: string;
  semantic_version: string;
  tree_revision: number;
  branches: any[];
  nodes: any[];
  edges: any[];
}

/**
 * Entries API
 */
export async function getEntries(params?: { type?: string; limit?: number }): Promise<{ entries: Entry[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.type) query.append('type', params.type);
  if (params?.limit) query.append('limit', params.limit.toString());

  const response = await fetch(`${API_URL}/entries?${query}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch entries');
  return response.json();
}

export async function getEntry(id: string): Promise<Entry> {
  const response = await fetch(`${API_URL}/entries/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch entry');
  return response.json();
}

export async function createEntry(data: {
  type: string;
  source: string;
  text: string;
  participants?: string[];
  context_json?: any;
  tags?: string[];
}): Promise<Entry> {
  const response = await fetch(`${API_URL}/entries`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create entry');
  return response.json();
}

/**
 * Sessions API
 */
export async function getSessions(params?: { status?: string }): Promise<{ sessions: Session[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);

  const response = await fetch(`${API_URL}/sessions?${query}`, {
    headers: getAuthHeaders(),
  });
  
  // Если не авторизован, возвращаем пустой массив вместо ошибки
  if (response.status === 401) {
    return { sessions: [], total: 0 };
  }
  
  if (!response.ok) throw new Error('Failed to fetch sessions');
  return response.json();
}

export async function getSession(id: string): Promise<Session> {
  const response = await fetch(`${API_URL}/sessions/${id}`);
  if (!response.ok) throw new Error('Failed to fetch session');
  return response.json();
}

/**
 * Quests API
 */
export async function getQuests(status?: string): Promise<{ quests: Quest[]; count: number }> {
  const query = new URLSearchParams();
  if (status) query.append('status', status);

  const response = await fetch(`${API_URL}/quests?${query}`, {
    headers: getAuthHeaders(),
  });
  
  // Если не авторизован, возвращаем пустой массив вместо ошибки
  if (response.status === 401) {
    return { quests: [], count: 0 };
  }
  
  if (!response.ok) throw new Error('Failed to fetch quests');
  return response.json();
}

export async function getQuest(id: string): Promise<Quest> {
  const response = await fetch(`${API_URL}/quests/${id}`);
  if (!response.ok) throw new Error('Failed to fetch quest');
  return response.json();
}

export async function createQuest(data: any): Promise<Quest> {
  const response = await fetch(`${API_URL}/quests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create quest');
  return response.json();
}

export async function completeQuest(id: string, evidenceId?: string): Promise<Quest> {
  const response = await fetch(`${API_URL}/quests/${id}/complete`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ evidence: evidenceId }),
  });
  if (!response.ok) throw new Error('Failed to complete quest');
  return response.json();
}

export async function activateQuest(id: string): Promise<Quest> {
  const response = await fetch(`${API_URL}/quests/${id}/activate`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to activate quest');
  return response.json();
}

export async function getCompletedQuestsByNode(nodeId: string): Promise<{ quests: Quest[]; count: number }> {
  const response = await fetch(`${API_URL}/quests/completed-by-node/${nodeId}`, {
    headers: getAuthHeaders(),
  });
  
  // Если не авторизован, возвращаем пустой массив вместо ошибки
  if (response.status === 401) {
    return { quests: [], count: 0 };
  }
  
  if (!response.ok) throw new Error('Failed to fetch completed quests by node');
  return response.json();
}

/**
 * Evidence API
 */
export async function getEvidence(params?: { quest_id?: string; ability_node_id?: string }): Promise<{ evidences: Evidence[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.quest_id) query.append('quest_id', params.quest_id);
  if (params?.ability_node_id) query.append('ability_node_id', params.ability_node_id);

  const response = await fetch(`${API_URL}/evidence?${query}`, {
    headers: getAuthHeaders(),
  });
  
  // Если не авторизован, возвращаем пустой массив вместо ошибки
  if (response.status === 401) {
    return { evidences: [], total: 0 };
  }
  
  if (!response.ok) throw new Error('Failed to fetch evidence');
  return response.json();
}

export async function createEvidence(data: {
  type: string;
  text: string;
  quest_id?: string;
  ability_node_id?: string;
  session_id?: string;
  tags?: string[];
}): Promise<Evidence> {
  const response = await fetch(`${API_URL}/evidence`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create evidence');
  return response.json();
}

/**
 * Tree API
 */
export async function getSemanticTree(): Promise<SemanticTree> {
  const response = await fetch(`${API_URL}/tree/semantic`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch semantic tree');
  return response.json();
}

/**
 * Ability State API - получение состояния узлов пользователя
 */
export interface NodeAbilityState {
  node_id: string;
  state: 'locked' | 'available' | 'active' | 'unlocked' | 'integrated';
  progress: number; // 0..1 (вычисляется на лету из xp_current / xp_required)
  relevance: number; // 0..1
  last_activity_date?: string; // дата последней активности
}

export async function getUserAbilityStates(userId?: string): Promise<Record<string, NodeAbilityState>> {
  const token = getToken();
  const headers = getAuthHeaders();
  
  const url = userId 
    ? `${API_URL}/ability/states?userId=${userId}`
    : `${API_URL}/ability/states`;
  
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error('Failed to fetch ability states');
  const data = await response.json();
  
  // Преобразуем массив в объект с ключами node_id
  const states: Record<string, NodeAbilityState> = {};
  if (Array.isArray(data)) {
    data.forEach((state: any) => {
      states[state.node_id] = {
        node_id: state.node_id,
        state: state.state,
        progress: Number(state.progress) || 0, // Вычисляется на лету из TreeSemantic
        relevance: Number(state.relevance) || 0,
        last_activity_date: state.last_activity_date,
      };
    });
  }
  return states;
}

/**
 * Achievements API
 */
export interface Achievement {
  id: string;
  type: 'bronze' | 'silver' | 'gold' | 'platinum';
  scope: 'node' | 'global';
  node_id?: string;
  title: string;
  description: string;
  threshold: number;
  icon?: string;
}

export interface UserAchievement {
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  node_id?: string;
}

export async function getUserAchievements(userId?: string): Promise<UserAchievement[]> {
  const token = getToken();
  const headers = getAuthHeaders();
  
  const url = userId 
    ? `${API_URL}/achievements/user/${userId}`
    : `${API_URL}/achievements/user/me`;
  
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error('Failed to fetch achievements');
  return response.json();
}

export async function getNodeAchievements(nodeId: string, userId?: string): Promise<Achievement[]> {
  const token = getToken();
  if (!token) {
    return []; // Если нет токена, возвращаем пустой массив
  }
  
  const headers = getAuthHeaders();
  
  const url = userId 
    ? `${API_URL}/achievements/node/${userId}/${nodeId}`
    : `${API_URL}/achievements/node/me/${nodeId}`;
  
  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      if (response.status === 401 || response.status === 404) {
        return []; // Не авторизован или не найдено - возвращаем пустой массив
      }
      throw new Error('Failed to fetch node achievements');
    }
    return response.json();
  } catch (error) {
    console.warn(`Failed to fetch achievements for node ${nodeId}:`, error);
    return []; // Возвращаем пустой массив при ошибке
  }
}

/**
 * Sync API
 */
export async function syncEntries(): Promise<any> {
  const response = await fetch(`${API_URL}/sync/entries`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to sync entries');
  return response.json();
}

export async function analyzeEntry(entryId: string): Promise<any> {
  const response = await fetch(`${API_URL}/sync/analyze/${entryId}`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to analyze entry');
  return response.json();
}

/**
 * Interactive Cases API
 */
/**
 * Interactive Case - Инициационная архитектура кейсов
 */
export interface InteractiveCase {
  // === META ===
  id: string;
  title: string;
  node_id?: string;
  branch_id?: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  maturity_level?: 'низкая' | 'средняя' | 'высокая';
  symbols?: string[];
  strategic_tags?: string[];
  pressure_level?: 'низкое' | 'среднее' | 'высокое';
  uncertainty?: 'низкая' | 'средняя' | 'высокая';
  subjectivity_load?: 'низкая' | 'средняя' | 'высокая';
  systemic_regress_risk?: 'низкий' | 'средний' | 'высокий';

  // === PORTAL ===
  portal?: {
    header_title: string;
    case_name: string;
    subtitle: string;
    marker_icons: string[];
    access_bar: string;
  };

  // === EVENT ===
  event?: {
    label: string;
    summary: string;
    urgency: 'низкая' | 'средняя' | 'высокая';
  };

  // === CONTEXT ===
  context: string; // Для обратной совместимости
  space_map?: {
    company: string;
    environment: string;
    constraints: string;
    people: string;
    mode: string;
  };

  // === FACTS & BACKGROUND ===
  facts?: {
    strict_facts: string;
  };
  background?: {
    story: string;
  };

  // === DILEMMA ===
  dilemma?: {
    question: string;
    ambiance?: string;
  };

  // === POSITIONS (новый формат) ===
  positions?: Array<{
    id: string;
    description: string;
    position_type: string;
    consequence: {
      immediate: string;
      second_order: string;
      systemic: string;
    };
    reflection_prompt?: string;
  }>;

  // === OPTIONS (старый формат для обратной совместимости) ===
  options: Array<{
    id: string;
    text: string;
    skill_used?: string;
    consequence: {
      immediate: string;
      second_order: string;
      systemic: string;
    };
    sm_impact?: Record<string, number>;
    hint?: string;
    warning?: string;
    explanation?: string;
  }>;

  // === INDICATORS ===
  indicators?: {
    trust?: 'low' | 'medium' | 'high';
    risk?: 'low' | 'medium' | 'high';
    time?: 'low' | 'medium' | 'critical';
    chaos?: 'low' | 'medium' | 'high';
    autonomy?: 'low' | 'medium' | 'high';
    maturity?: 'низкая' | 'средняя' | 'высокая';
    uncertainty?: 'низкая' | 'средняя' | 'высокая';
    subjectivity?: 'низкая' | 'средняя' | 'высокая';
    regress_risk?: 'низкий' | 'средний' | 'высокий';
  };

  // === PATTERN ===
  pattern?: {
    trigger: string;
    behavior: string;
    result: string;
  };

  // === REFLECTION ===
  reflection: {
    questions: string[];
    mirror?: Record<string, string>;
    key_insight?: string;
    after_choice_insights?: string[];
  };
}

export async function getCases(): Promise<{ cases: InteractiveCase[] }> {
  try {
    const response = await fetch(`${API_URL}/cases`);
    if (!response.ok) {
      console.error(`Failed to fetch cases: ${response.status} ${response.statusText}`);
      return { cases: [] };
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching cases:', error);
    return { cases: [] };
  }
}

export async function getCase(id: string): Promise<InteractiveCase> {
  const response = await fetch(`${API_URL}/cases/${id}`);
  if (!response.ok) throw new Error('Failed to fetch case');
  return response.json();
}

export async function getCasesByNode(nodeId: string): Promise<{ cases: InteractiveCase[] }> {
  const response = await fetch(`${API_URL}/cases/by-node/${nodeId}`);
  if (!response.ok) throw new Error('Failed to fetch cases by node');
  return response.json();
}

export async function getCasesByBranch(branchId: string): Promise<{ cases: InteractiveCase[] }> {
  const response = await fetch(`${API_URL}/cases/by-branch/${branchId}`);
  if (!response.ok) throw new Error('Failed to fetch cases by branch');
  return response.json();
}

export interface CaseAvailability {
  available: boolean;
  reason: string;
  requirements: {
    questsRequired: number;
    questsCompleted: number;
    progressRequired: number;
    currentProgress: number;
    nodeState: string;
  };
}

export async function getCaseAvailability(caseId: string): Promise<CaseAvailability> {
  try {
    const response = await fetch(`${API_URL}/cases/${caseId}/availability`);
    if (!response.ok) {
      throw new Error(`Failed to fetch case availability: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching case availability:', error);
    // Возвращаем недоступный кейс при ошибке
    return {
      available: false,
      reason: 'Не удалось проверить доступность кейса.',
      requirements: {
        questsRequired: 1,
        questsCompleted: 0,
        progressRequired: 0,
        currentProgress: 0,
        nodeState: 'unknown',
      },
    };
  }
}

export interface CaseProgress {
  solvedCases: string[];
  nodeProgress: Record<string, {
    solved: string[];
    progress: number;
  }>;
}

export interface CaseAttempt {
  caseId: string;
  selectedOption: string;
  timestamp: Date;
  skillUsed?: string;
  smImpact?: Record<string, number>;
  reflection?: string;
  isFirstAttempt: boolean;
}

export interface PatternAnalysis {
  totalAttempts: number;
  skillDistribution: Record<string, number>;
  mostUsedSkill: string;
  insight: string;
  recommendation?: string;
}

export async function markCaseAsSolved(
  caseId: string,
  selectedOption?: string,
  skillUsed?: string,
): Promise<{ success: boolean; message: string; xpEarned?: number }> {
  try {
    const response = await fetch(`${API_URL}/cases/${caseId}/solve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ selectedOption, skillUsed }),
    });
    if (!response.ok) {
      throw new Error(`Failed to mark case as solved: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error marking case as solved:', error);
    throw error;
  }
}

export async function getCaseProgress(): Promise<CaseProgress> {
  try {
    const response = await fetch(`${API_URL}/cases/progress`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      if (response.status === 401) {
        // Not authenticated - return empty progress
        return { solvedCases: [], nodeProgress: {} };
      }
      throw new Error(`Failed to fetch case progress: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching case progress:', error);
    // Return empty progress on error
    return {
      solvedCases: [],
      nodeProgress: {},
    };
  }
}

export async function saveCaseProgress(progress: CaseProgress): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_URL}/cases/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(progress),
    });
    if (!response.ok) {
      throw new Error(`Failed to save case progress: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error saving case progress:', error);
    throw error;
  }
}

export async function saveCaseAttempt(attempt: CaseAttempt): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_URL}/cases/attempts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...attempt,
        timestamp: attempt.timestamp.toISOString(),
      }),
    });
    if (!response.ok) {
      throw new Error(`Failed to save case attempt: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error saving case attempt:', error);
    throw error;
  }
}

export async function getPatternAnalysis(): Promise<PatternAnalysis> {
  try {
    const response = await fetch(`${API_URL}/cases/patterns`);
    if (!response.ok) {
      throw new Error(`Failed to fetch pattern analysis: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching pattern analysis:', error);
    return {
      totalAttempts: 0,
      skillDistribution: {},
      mostUsedSkill: '',
      insight: 'Не удалось загрузить анализ паттернов.',
    };
  }
}

// Retention/Streaks API
export interface UserRetention {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  activityDates: string[];
}

export async function recordActivity(
  userId: string,
  activityType: 'case' | 'quest' | 'entry' | 'trace' | 'any' = 'any'
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`${API_URL}/retention/activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, activityType }),
    });
    if (!response.ok) {
      throw new Error(`Failed to record activity: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error recording activity:', error);
    // Не прерываем выполнение при ошибке
    return { success: false, message: 'Failed to record activity' };
  }
}

export async function getUserRetention(userId: string): Promise<UserRetention> {
  try {
    const response = await fetch(`${API_URL}/retention/${userId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch retention: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching retention:', error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      activityDates: [],
    };
  }
}

export async function checkStreakRisk(userId: string): Promise<{
  isAtRisk: boolean;
  daysWithoutActivity: number;
  shouldRemind: boolean;
}> {
  try {
    const response = await fetch(`${API_URL}/retention/${userId}/risk`);
    if (!response.ok) {
      throw new Error(`Failed to check streak risk: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error checking streak risk:', error);
    return {
      isAtRisk: false,
      daysWithoutActivity: 0,
      shouldRemind: false,
    };
  }
}

// Support API
export interface StuckCase {
  caseId: string;
  caseTitle: string;
  minutesStuck: number;
  openedAt: string;
}

export interface StuckQuest {
  questId: string;
  questTitle: string;
  daysStuck: number;
  lastActivity?: string;
}

export async function recordCaseOpened(userId: string, caseId: string, caseTitle: string): Promise<void> {
  try {
    await fetch(`${API_URL}/support/case/opened`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, caseId, caseTitle }),
    });
  } catch (error) {
    console.error('Error recording case opened:', error);
  }
}

export async function recordCaseChoice(userId: string, caseId: string): Promise<void> {
  try {
    await fetch(`${API_URL}/support/case/choice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, caseId }),
    });
  } catch (error) {
    console.error('Error recording case choice:', error);
  }
}

export async function getStuckItems(userId: string): Promise<{
  stuckCases: StuckCase[];
  stuckQuests: StuckQuest[];
}> {
  try {
    const response = await fetch(`${API_URL}/support/${userId}/stuck`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Failed to get stuck items: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error getting stuck items:', error);
    return { stuckCases: [], stuckQuests: [] };
  }
}

/**
 * Builds API
 */
export interface Build {
  build_id: string;
  name: string;
  icon: string;
  fantasy: string;
  description: string;
  entry_conditions: {
    required_nodes: string[];
    optional_nodes?: string[];
    behavioral_patterns?: Record<string, any>;
    min_required_count?: number;
  };
  bonuses: Record<string, any>;
  hidden_costs: Record<string, any>;
  exit_conditions: Record<string, any>;
  color: string;
}

export interface BuildStatus {
  build_id: string;
  name: string;
  icon: string;
  is_active: boolean;
  activation_percentage: number;
  matched_conditions: string[];
  missing_conditions: string[];
  bonuses_active: boolean;
  risks_active: boolean;
}

export async function getBuilds(): Promise<{ builds: Build[] }> {
  const response = await fetch(`${API_URL}/builds`);
  if (!response.ok) throw new Error('Failed to fetch builds');
  return response.json();
}

export async function getBuild(buildId: string): Promise<Build> {
  const response = await fetch(`${API_URL}/builds/${buildId}`);
  if (!response.ok) throw new Error('Failed to fetch build');
  return response.json();
}

export async function getCurrentBuild(): Promise<BuildStatus[]> {
  const response = await fetch(`${API_URL}/builds/current`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch current build');
  return response.json();
}

export async function getBuildsByNode(nodeId: string): Promise<{ builds: Build[] }> {
  const response = await fetch(`${API_URL}/builds/by-node/${nodeId}`);
  if (!response.ok) throw new Error('Failed to fetch builds by node');
  return response.json();
}

/**
 * Auth API
 */
export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface RegisterDto {
  telegramUsername: string;
  password: string;
}

export interface LoginDto {
  telegramUsername: string;
  password: string;
}

export async function register(data: RegisterDto): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to register' }));
    throw new Error(error.message || 'Failed to register');
  }
  return response.json();
}

export async function login(data: LoginDto): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to login' }));
    throw new Error(error.message || 'Failed to login');
  }
  return response.json();
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('auth_token');
  } catch {
    return null;
  }
}

/**
 * Admin API
 */
const ADMIN_API_URL = `${API_URL}/admin/v1`;

export interface AdminUser {
  id: string;
  email: string | null;
  telegramUsername: string | null;
  status: string;
  role: string;
  created_at: string;
  last_seen_at: string | null;
  _count?: {
    entries: number;
    quests: number;
    sessions: number;
  };
}

export interface AdminOverviewStats {
  totalUsers: number;
  activeUsers: number;
  totalQuests: number;
  activeQuests: number;
  totalSessions: number;
  succeededSessions: number;
  totalEntries: number;
  recentActivity: any[];
}

export async function getAdminUsers(params?: {
  q?: string;
  status?: string;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}): Promise<AdminUser[]> {
  const query = new URLSearchParams();
  if (params?.q) query.append('q', params.q);
  if (params?.status) query.append('status', params.status);
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.sort) query.append('sort', params.sort);
  if (params?.order) query.append('order', params.order);

  const response = await fetch(`${ADMIN_API_URL}/users?${query}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch admin users');
  return response.json();
}

export async function getAdminUserById(userId: string): Promise<AdminUser> {
  const response = await fetch(`${ADMIN_API_URL}/users/${userId}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch admin user');
  return response.json();
}

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  // Пока используем агрегацию на клиенте, позже можно добавить отдельный endpoint
  const [users, quests, sessions, entries] = await Promise.all([
    getAdminUsers({ limit: 1000 }),
    getQuests(),
    getSessions(),
    getEntries({ limit: 1000 }),
  ]);

  return {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    totalQuests: quests.count || 0,
    activeQuests: quests.quests.filter(q => q.status === 'active').length,
    totalSessions: sessions.total || 0,
    succeededSessions: sessions.sessions.filter(s => s.status === 'succeeded').length,
    totalEntries: entries.total || 0,
    recentActivity: [],
  };
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', token);
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface UserWithDate extends User {
  created_at?: string;
}

export async function changePassword(data: ChangePasswordDto): Promise<{ message: string }> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/auth/change-password`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to change password' }));
    throw new Error(error.message || 'Failed to change password');
  }

  return response.json();
}

export async function getAllUsers(): Promise<UserWithDate[]> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/auth/users`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to get users' }));
    throw new Error(error.message || 'Failed to get users');
  }

  return response.json();
}

export async function updateUserRole(userId: string, role: string): Promise<{ message: string; user: UserWithDate }> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/auth/users/${userId}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ role }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update user role' }));
    throw new Error(error.message || 'Failed to update user role');
  }

  return response.json();
}

export async function deleteUser(userId: string): Promise<{ message: string }> {
  const token = getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_URL}/auth/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to delete user' }));
    throw new Error(error.message || 'Failed to delete user');
  }

  return response.json();
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('auth_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function setUser(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_user', JSON.stringify(user));
}

export function removeUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_user');
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return getToken() !== null;
}

/**
 * Nodes API
 */
export interface NodeDescription {
  name: string;
  full_description: string;
  practical_meaning: string;
  examples: string[];
  integration_levels: Record<string, string>;
}

export async function getNodeDescriptions(): Promise<{ descriptions: Record<string, NodeDescription> }> {
  try {
    const response = await fetch(`${API_URL}/nodes/descriptions`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      // Если не авторизован или другие ошибки, возвращаем пустой объект
      if (response.status === 401) {
        console.warn('Not authenticated, returning empty node descriptions');
        return { descriptions: {} };
      }
      console.error(`Failed to get node descriptions: ${response.status} ${response.statusText}`);
      return { descriptions: {} };
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching node descriptions:', error);
    return { descriptions: {} };
  }
}

export async function getNodeDescription(nodeId: string): Promise<NodeDescription> {
  try {
    const response = await fetch(`${API_URL}/nodes/descriptions/${nodeId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Description for node ${nodeId} not found`);
      }
      if (response.status === 401) {
        throw new Error('Not authenticated');
      }
      throw new Error(`Failed to get node description: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Error fetching node description for ${nodeId}:`, error);
    throw error;
  }
}

