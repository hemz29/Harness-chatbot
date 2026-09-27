/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { StatusRow } from './components/StatusRow';
import { FooterStatusBar } from './components/FooterStatusBar';
import { PromptInput } from './components/PromptInput';
import { ChatThread } from './components/ChatThread';
import { ContextInspector } from './components/ContextInspector';
import { SettingsModal } from './components/SettingsModal';
import {
  ChatSession,
  Message,
  ApiKeys,
  ModelConfigs,
  ModelProvider,
  DocumentContext,
  EmailContext,
  SearchResultItem,
} from './types';
import {
  loadApiKeys,
  saveApiKey,
  clearAllKeys,
  loadModelConfigs,
  saveModelConfigs,
  loadSessions,
  saveSessions,
  loadCurrentSessionId,
  saveCurrentSessionId,
  registerStorageBlockedCallback,
} from './services/storage';
import { callClaude, callGemini } from './services/aiAdapters';
import { searchTavily } from './services/tavily';
import { AlertCircle, X } from 'lucide-react';

function createNewSessionObj(): ChatSession {
  const now = Date.now();
  return {
    id: `sess_${now}_${Math.random().toString(36).substring(2, 7)}`,
    title: 'New session',
    createdAt: now,
    updatedAt: now,
    messages: [],
    documentContext: null,
    emailContext: null,
    searchEnabled: false,
    lastUsedModel: undefined,
  };
}

export default function App() {
  // Persistence state
  const [apiKeys, setApiKeys] = useState<ApiKeys>(() => loadApiKeys());
  const [modelConfigs, setModelConfigs] = useState<ModelConfigs>(() => loadModelConfigs());
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const loaded = loadSessions();
    if (loaded.length > 0) return loaded;
    return [createNewSessionObj()];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    const savedId = loadCurrentSessionId();
    const existing = sessions.find((s) => s.id === savedId);
    if (existing) return existing.id;
    return sessions[0]?.id || '';
  });

  // UI Panels state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isContextInspectorOpen, setIsContextInspectorOpen] = useState(false);
  const [contextTab, setContextTab] = useState<'document' | 'email' | 'search'>('document');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [storageBlockedNotice, setStorageBlockedNotice] = useState(false);

  // Active chat state
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeProvider, setActiveProvider] = useState<ModelProvider>('claude');

  // Status metrics
  const [lastCallStatus, setLastCallStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);

  // Register storage blocked listener
  useEffect(() => {
    registerStorageBlockedCallback(() => {
      setStorageBlockedNotice(true);
    });
  }, []);

  // Save sessions on change
  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  // Save current session ID on change
  useEffect(() => {
    if (currentSessionId) {
      saveCurrentSessionId(currentSessionId);
    }
  }, [currentSessionId]);

  // Global keyboard shortcuts (⌘K / Ctrl+K for new session, Ctrl+, for settings)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleCreateNewSession();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setIsSettingsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Active session helper
  const currentSession = useMemo(() => {
    return sessions.find((s) => s.id === currentSessionId) || sessions[0] || null;
  }, [sessions, currentSessionId]);

  // Update current session helper
  const updateCurrentSession = useCallback(
    (updater: (session: ChatSession) => ChatSession) => {
      setSessions((prev) =>
        prev.map((s) => (s.id === currentSessionId ? updater(s) : s))
      );
    },
    [currentSessionId]
  );

  // New session creation
  const handleCreateNewSession = () => {
    const newSess = createNewSessionObj();
    setSessions((prev) => [newSess, ...prev]);
    setCurrentSessionId(newSess.id);
    setInput('');
  };

  // Delete session
  const handleDeleteSession = (id: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        const fresh = createNewSessionObj();
        setCurrentSessionId(fresh.id);
        return [fresh];
      }
      if (currentSessionId === id) {
        setCurrentSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  // Save an API key
  const handleSaveApiKey = (key: keyof ApiKeys, value: string) => {
    saveApiKey(key, value);
    setApiKeys((prev) => ({ ...prev, [key]: value }));
  };

  // Clear all stored keys
  const handleClearAllKeys = () => {
    clearAllKeys();
    setApiKeys({
      anthropic: '',
      gemini: '',
      tavily: '',
      openai: '',
      grok: '',
    });
  };

  // Save model configs
  const handleSaveModelConfigs = (configs: Partial<ModelConfigs>) => {
    saveModelConfigs(configs);
    setModelConfigs((prev) => ({ ...prev, ...configs }));
  };

  // Toggle web search on/off for current session
  const handleToggleSearch = () => {
    if (!apiKeys.tavily) return;
    updateCurrentSession((s) => ({
      ...s,
      searchEnabled: !s.searchEnabled,
      updatedAt: Date.now(),
    }));
  };

  // Attach document to current session
  const handleAttachDocument = (doc: DocumentContext | null) => {
    updateCurrentSession((s) => ({
      ...s,
      documentContext: doc,
      updatedAt: Date.now(),
    }));
  };

  // Update email context in current session
  const handleUpdateEmailContext = (ctx: EmailContext | null) => {
    updateCurrentSession((s) => ({
      ...s,
      emailContext: ctx,
      updatedAt: Date.now(),
    }));
  };

  // Send message flow
  const handleSendMessage = async (provider: ModelProvider) => {
    const textToSend = input.trim();
    if (!textToSend || isLoading) return;

    const apiKey = provider === 'claude' ? apiKeys.anthropic : apiKeys.gemini;
    const modelName = provider === 'claude' ? modelConfigs.claudeModel : modelConfigs.geminiModel;

    if (!apiKey) {
      setIsSettingsOpen(true);
      return;
    }

    setActiveProvider(provider);
    setIsLoading(true);

    const userMessageId = `msg_${Date.now()}_u`;
    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    // Check if user switched model mid-conversation
    const injectedNotices: Message[] = [];
    if (
      currentSession?.lastUsedModel &&
      currentSession.lastUsedModel !== provider &&
      currentSession.messages.length > 0
    ) {
      injectedNotices.push({
        id: `notice_switch_${Date.now()}`,
        role: 'notice',
        content: `Switched to ${provider === 'claude' ? 'Claude' : 'Gemini'}`,
        timestamp: Date.now(),
      });
    }

    // Determine session title if this is the first message
    const isFirstUserMessage =
      (currentSession?.messages.filter((m) => m.role === 'user').length || 0) === 0;
    const updatedTitle = isFirstUserMessage
      ? textToSend.slice(0, 38).trim() + (textToSend.length > 38 ? '...' : '')
      : currentSession?.title || 'Session';

    // Clear input early so user can continue
    setInput('');

    // Pre-append user message and notices to session
    const currentMessages = currentSession ? currentSession.messages : [];
    const baseUpdatedMessages = [...currentMessages, ...injectedNotices, userMessage];

    updateCurrentSession((s) => ({
      ...s,
      title: updatedTitle,
      messages: baseUpdatedMessages,
      lastUsedModel: provider,
      updatedAt: Date.now(),
    }));

    // Optional Tavily Search
    let searchResults: SearchResultItem[] | undefined = undefined;
    if (currentSession?.searchEnabled && apiKeys.tavily) {
      try {
        searchResults = await searchTavily(apiKeys.tavily, textToSend);
      } catch (searchErr) {
        console.warn('[Harness] Tavily search error:', searchErr);
      }
    }

    // Call Model Adapter
    try {
      const responseResult =
        provider === 'claude'
          ? await callClaude({
              apiKey,
              modelName,
              messages: baseUpdatedMessages,
              documentContext: currentSession?.documentContext,
              emailContext: currentSession?.emailContext,
              searchResults,
            })
          : await callGemini({
              apiKey,
              modelName,
              messages: baseUpdatedMessages,
              documentContext: currentSession?.documentContext,
              emailContext: currentSession?.emailContext,
              searchResults,
            });

      setLastCallStatus('success');
      setLastLatencyMs(responseResult.latencyMs);

      const additionalNotices: Message[] = [];
      if (responseResult.trimmedHistory) {
        additionalNotices.push({
          id: `notice_trim_${Date.now()}`,
          role: 'notice',
          content: 'Earlier messages trimmed to fit.',
          timestamp: Date.now(),
        });
      }

      const assistantMessage: Message = {
        id: `msg_${Date.now()}_a`,
        role: 'assistant',
        content: responseResult.text,
        model: provider === 'claude' ? 'Claude 3.7' : 'Gemini 1.5',
        timestamp: Date.now(),
        latencyMs: responseResult.latencyMs,
        groundedMeta: {
          docName: currentSession?.documentContext?.name,
          hasSearch: !!searchResults && searchResults.length > 0,
          searchCount: searchResults?.length,
          hasEmail: !!currentSession?.emailContext?.rawEmail,
        },
      };

      updateCurrentSession((s) => ({
        ...s,
        messages: [...s.messages, ...additionalNotices, assistantMessage],
        updatedAt: Date.now(),
      }));
    } catch (err: unknown) {
      setLastCallStatus('error');
      const errMessage = err instanceof Error ? err.message : 'Unknown model error';

      // Insert error card message with retry option
      const errorAssistantMessage: Message = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content: errMessage,
        isError: true,
        model: provider === 'claude' ? 'Claude 3.7' : 'Gemini 1.5',
        timestamp: Date.now(),
      };

      updateCurrentSession((s) => ({
        ...s,
        messages: [...s.messages, errorAssistantMessage],
        updatedAt: Date.now(),
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Retry an errored message
  const handleRetry = (errorMsgId: string) => {
    if (!currentSession) return;
    const msgs = currentSession.messages;
    const errorIdx = msgs.findIndex((m) => m.id === errorMsgId);
    if (errorIdx === -1) return;

    // Find the closest preceding user message
    let userMsgToRetry: Message | null = null;
    for (let i = errorIdx - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        userMsgToRetry = msgs[i];
        break;
      }
    }

    if (!userMsgToRetry) return;

    // Remove the error card from the list
    updateCurrentSession((s) => ({
      ...s,
      messages: s.messages.filter((m) => m.id !== errorMsgId),
    }));

    // Populate the input and re-trigger send
    setInput(userMsgToRetry.content);
  };

  // Open context drawer to a specific tab
  const handleOpenContextTab = (tab: 'document' | 'email' | 'search') => {
    setContextTab(tab);
    setIsContextInspectorOpen(true);
  };

  // Count active context sources
  const activeContextCount = useMemo(() => {
    let count = 0;
    if (currentSession?.documentContext) count += 1;
    if (currentSession?.emailContext?.rawEmail) count += 1;
    if (currentSession?.searchEnabled && apiKeys.tavily) count += 1;
    return count;
  }, [currentSession, apiKeys.tavily]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0c10] text-zinc-100 font-sans">
      {/* Storage Blocked Warning Banner */}
      {storageBlockedNotice && (
        <div className="fixed top-0 inset-x-0 z-50 bg-amber-600/90 text-zinc-950 px-4 py-2 text-xs font-mono flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Your browser is blocking local storage — sessions won&apos;t be saved this visit.
            </span>
          </div>
          <button
            onClick={() => setStorageBlockedNotice(false)}
            className="p-1 hover:bg-amber-700/50 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Left Sidebar */}
      <Sidebar
        sessions={sessions}
        currentSessionId={currentSession?.id || null}
        onSelectSession={(id) => setCurrentSessionId(id)}
        onNewSession={handleCreateNewSession}
        onDeleteSession={handleDeleteSession}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Top Bar */}
        <TopBar
          title={currentSession?.title || 'New session'}
          contextCount={activeContextCount}
          onOpenContext={() => {
            setContextTab('document');
            setIsContextInspectorOpen(true);
          }}
        />

        {/* Status Row */}
        <StatusRow
          lastCallStatus={lastCallStatus}
          lastLatencyMs={lastLatencyMs}
          modelConfigs={modelConfigs}
          hasDocument={!!currentSession?.documentContext}
          hasEmail={!!currentSession?.emailContext?.rawEmail}
          hasSearch={!!currentSession?.searchEnabled && !!apiKeys.tavily}
          activeModel={activeProvider}
        />

        {/* Chat / Empty Area */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          <ChatThread
            messages={currentSession?.messages || []}
            isLoading={isLoading}
            activeProvider={activeProvider}
            onRetry={handleRetry}
            onSelectPromptStarter={(text) => setInput(text)}
            hasInput={input.trim().length > 0}
          />

          {/* Bottom Docked Input Box */}
          <div className="p-4 md:px-8 max-w-4xl w-full mx-auto shrink-0">
            <PromptInput
              input={input}
              setInput={setInput}
              onSend={handleSendMessage}
              isLoading={isLoading}
              activeProvider={activeProvider}
              hasClaudeKey={!!apiKeys.anthropic}
              hasGeminiKey={!!apiKeys.gemini}
              hasTavilyKey={!!apiKeys.tavily}
              isSearchEnabled={!!currentSession?.searchEnabled}
              onToggleSearch={handleToggleSearch}
              hasDocument={!!currentSession?.documentContext}
              hasEmail={!!currentSession?.emailContext?.rawEmail}
              onOpenContextTab={handleOpenContextTab}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          </div>
        </div>

        {/* Footer Status Bar */}
        <FooterStatusBar />
      </div>

      {/* Context Inspector Drawer */}
      <ContextInspector
        isOpen={isContextInspectorOpen}
        onClose={() => setIsContextInspectorOpen(false)}
        activeTab={contextTab}
        setActiveTab={setContextTab}
        documentContext={currentSession?.documentContext}
        onAttachDocument={handleAttachDocument}
        emailContext={currentSession?.emailContext}
        onUpdateEmailContext={handleUpdateEmailContext}
        isSearchEnabled={!!currentSession?.searchEnabled}
        onToggleSearch={handleToggleSearch}
        hasTavilyKey={!!apiKeys.tavily}
        claudeKey={apiKeys.anthropic}
        geminiKey={apiKeys.gemini}
        claudeModel={modelConfigs.claudeModel}
        geminiModel={modelConfigs.geminiModel}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKeys={apiKeys}
        onSaveKey={handleSaveApiKey}
        onClearAllKeys={handleClearAllKeys}
        modelConfigs={modelConfigs}
        onSaveModelConfigs={handleSaveModelConfigs}
      />
    </div>
  );
}
