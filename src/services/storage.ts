import { ChatSession, ApiKeys, ModelConfigs, DEFAULT_CLAUDE_MODEL, DEFAULT_GEMINI_MODEL } from '../types';

export const STORAGE_KEYS = {
  ANTHROPIC: 'harness_anthropic_key',
  GEMINI: 'harness_gemini_key',
  TAVILY: 'harness_tavily_key',
  OPENAI: 'harness_openai_key',
  GROK: 'harness_grok_key',
  CLAUDE_MODEL: 'harness_claude_model',
  GEMINI_MODEL: 'harness_gemini_model',
  SESSIONS: 'harness_sessions',
  CURRENT_SESSION_ID: 'harness_current_session_id',
} as const;

let storageBlockedAlertTriggered = false;
let onStorageBlockedCallback: (() => void) | null = null;

export function registerStorageBlockedCallback(cb: () => void) {
  onStorageBlockedCallback = cb;
}

function handleStorageError(e: unknown) {
  console.warn('[Harness Storage] localStorage error caught:', e);
  if (!storageBlockedAlertTriggered) {
    storageBlockedAlertTriggered = true;
    if (onStorageBlockedCallback) {
      onStorageBlockedCallback();
    }
  }
}

export function loadApiKeys(): ApiKeys {
  try {
    return {
      anthropic: localStorage.getItem(STORAGE_KEYS.ANTHROPIC) || '',
      gemini: localStorage.getItem(STORAGE_KEYS.GEMINI) || '',
      tavily: localStorage.getItem(STORAGE_KEYS.TAVILY) || '',
      openai: localStorage.getItem(STORAGE_KEYS.OPENAI) || '',
      grok: localStorage.getItem(STORAGE_KEYS.GROK) || '',
    };
  } catch (e) {
    handleStorageError(e);
    return { anthropic: '', gemini: '', tavily: '', openai: '', grok: '' };
  }
}

export function saveApiKey(key: keyof ApiKeys, value: string) {
  try {
    const storageMap: Record<keyof ApiKeys, string> = {
      anthropic: STORAGE_KEYS.ANTHROPIC,
      gemini: STORAGE_KEYS.GEMINI,
      tavily: STORAGE_KEYS.TAVILY,
      openai: STORAGE_KEYS.OPENAI,
      grok: STORAGE_KEYS.GROK,
    };
    if (value.trim()) {
      localStorage.setItem(storageMap[key], value.trim());
    } else {
      localStorage.removeItem(storageMap[key]);
    }
  } catch (e) {
    handleStorageError(e);
  }
}

export function clearAllKeys() {
  try {
    localStorage.removeItem(STORAGE_KEYS.ANTHROPIC);
    localStorage.removeItem(STORAGE_KEYS.GEMINI);
    localStorage.removeItem(STORAGE_KEYS.TAVILY);
    localStorage.removeItem(STORAGE_KEYS.OPENAI);
    localStorage.removeItem(STORAGE_KEYS.GROK);
  } catch (e) {
    handleStorageError(e);
  }
}

export function loadModelConfigs(): ModelConfigs {
  try {
    return {
      claudeModel: localStorage.getItem(STORAGE_KEYS.CLAUDE_MODEL) || DEFAULT_CLAUDE_MODEL,
      geminiModel: localStorage.getItem(STORAGE_KEYS.GEMINI_MODEL) || DEFAULT_GEMINI_MODEL,
    };
  } catch (e) {
    handleStorageError(e);
    return {
      claudeModel: DEFAULT_CLAUDE_MODEL,
      geminiModel: DEFAULT_GEMINI_MODEL,
    };
  }
}

export function saveModelConfigs(configs: Partial<ModelConfigs>) {
  try {
    if (configs.claudeModel) {
      localStorage.setItem(STORAGE_KEYS.CLAUDE_MODEL, configs.claudeModel.trim());
    }
    if (configs.geminiModel) {
      localStorage.setItem(STORAGE_KEYS.GEMINI_MODEL, configs.geminiModel.trim());
    }
  } catch (e) {
    handleStorageError(e);
  }
}

export function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    handleStorageError(e);
    return [];
  }
}

export function saveSessions(sessions: ChatSession[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  } catch (e) {
    handleStorageError(e);
  }
}

export function loadCurrentSessionId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION_ID);
  } catch (e) {
    handleStorageError(e);
    return null;
  }
}

export function saveCurrentSessionId(id: string) {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION_ID, id);
  } catch (e) {
    handleStorageError(e);
  }
}
