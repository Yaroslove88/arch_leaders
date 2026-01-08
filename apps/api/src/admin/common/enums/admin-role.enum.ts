export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  OPERATOR = 'operator',
  ANALYST = 'analyst',
}

export enum AdminAction {
  // User actions
  VIEW_USER = 'view_user',
  UPDATE_USER_STATUS = 'update_user_status',
  VIEW_FULL_ENTRY = 'view_full_entry',
  VIEW_MASKED_ENTRY = 'view_masked_entry',
  
  // Entry actions
  RERUN_ANALYSIS = 'rerun_analysis',
  MARK_SENSITIVE = 'mark_sensitive',
  
  // Quest actions
  OVERRIDE_QUEST = 'override_quest',
  REGENERATE_QUESTS = 'regenerate_quests',
  
  // Config actions
  UPDATE_CONFIG = 'update_config',
  ACTIVATE_CONFIG = 'activate_config',
  
  // Prompt actions
  UPDATE_PROMPT = 'update_prompt',
  ACTIVATE_PROMPT = 'activate_prompt',
  
  // System actions
  RECOMPUTE_USER_STATE = 'recompute_user_state',
  UNDO_CHANGE = 'undo_change',
  
  // Job actions
  RETRY_JOB = 'retry_job',
  CANCEL_JOB = 'cancel_job',
}

export enum TargetType {
  USER = 'user',
  ENTRY = 'entry',
  SESSION = 'session',
  QUEST = 'quest',
  NODE = 'node',
  CONFIG = 'config',
  PROMPT = 'prompt',
  JOB = 'job',
}

