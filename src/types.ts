export type ModelProvider = 'claude' | 'gemini';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'notice';
  content: string;
  model?: string;
  timestamp: number;
  isError?: boolean;
  error?: string;
  latencyMs?: number;
  tokensEstimated?: number;
  groundedMeta?: {
    docName?: string;
    hasSearch?: boolean;
    searchCount?: number;
    hasEmail?: boolean;
  };
}

export interface DocumentContext {
  name: string;
  content: string;
  charCount: number;
  estimatedTokens: number;
  truncated?: boolean;
  rawLineCount: number;
}

export interface EmailContext {
  rawEmail: string;
  instruction: string;
  lastDraftReply?: string;
  modelUsed?: string;
}

export interface SearchResultItem {
  title: string;
  url: string;
  content: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  documentContext?: DocumentContext | null;
  emailContext?: EmailContext | null;
  searchEnabled?: boolean;
  lastUsedModel?: ModelProvider;
}

export interface ApiKeys {
  anthropic: string;
  gemini: string;
  tavily: string;
  openai: string;
  grok: string;
}

export interface ModelConfigs {
  claudeModel: string;
  geminiModel: string;
}

export const DEFAULT_CLAUDE_MODEL = 'claude-3-7-sonnet-20250219';
export const DEFAULT_GEMINI_MODEL = 'gemini-1.5-pro';

export const MAX_DOCUMENT_WORDS = 15000;
export const MAX_HISTORY_MESSAGES = 24;
