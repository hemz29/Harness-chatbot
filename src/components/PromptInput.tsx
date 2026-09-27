import React, { useRef, useEffect } from 'react';
import {
  FileText,
  Mail,
  Globe,
  Mic,
  KeyRound,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { ModelProvider } from '../types';

interface PromptInputProps {
  input: string;
  setInput: (val: string) => void;
  onSend: (provider: ModelProvider) => void;
  isLoading: boolean;
  activeProvider: ModelProvider;
  hasClaudeKey: boolean;
  hasGeminiKey: boolean;
  hasTavilyKey: boolean;
  isSearchEnabled: boolean;
  onToggleSearch: () => void;
  hasDocument: boolean;
  hasEmail: boolean;
  onOpenContextTab: (tab: 'document' | 'email' | 'search') => void;
  onOpenSettings: () => void;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  input,
  setInput,
  onSend,
  isLoading,
  activeProvider,
  hasClaudeKey,
  hasGeminiKey,
  hasTavilyKey,
  isSearchEnabled,
  onToggleSearch,
  hasDocument,
  hasEmail,
  onOpenContextTab,
  onOpenSettings,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        Math.max(textareaRef.current.scrollHeight, 72),
        220
      )}px`;
    }
  }, [input]);

  const hasText = input.trim().length > 0;
  const canSendClaude = hasText && hasClaudeKey && !isLoading;
  const canSendGemini = hasText && hasGeminiKey && !isLoading;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (activeProvider === 'claude' && canSendClaude) {
        onSend('claude');
      } else if (activeProvider === 'gemini' && canSendGemini) {
        onSend('gemini');
      } else if (canSendClaude) {
        onSend('claude');
      } else if (canSendGemini) {
        onSend('gemini');
      }
    }
  };

  return (
    <div className="w-full rounded-xl border border-[#232838] bg-[#11141c] p-3 shadow-2xl relative transition-all focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/30">
      {/* Top area: Textarea + non-functional mic */}
      <div className="relative flex items-start gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything, run a multi-model comparative query, or drop code..."
          className="w-full resize-none bg-transparent font-sans text-sm text-zinc-100 placeholder:text-zinc-400 focus:outline-none scrollbar-thin"
          rows={2}
          disabled={isLoading}
        />
        <div
          className="text-zinc-600 p-1 cursor-not-allowed select-none"
          title="Voice input (Coming soon)"
        >
          <Mic className="w-4 h-4 opacity-40" />
        </div>
      </div>

      {/* Toggle Chip Row */}
      <div className="mt-2.5 pt-2.5 border-t border-[#1b202c] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        {/* Left: context toggles */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Document Chip */}
          <button
            type="button"
            onClick={() => onOpenContextTab('document')}
            className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors cursor-pointer ${
              hasDocument
                ? 'bg-cyan-950/60 border-cyan-700/80 text-cyan-300'
                : 'bg-[#161a24] border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-[#1c2230]'
            }`}
            title="Inspect attached document context"
          >
            <FileText className="w-3 h-3 text-cyan-400" />
            <span>{hasDocument ? '📄 Document (1)' : '📄 + Document'}</span>
          </button>

          {/* Email Thread Chip */}
          <button
            type="button"
            onClick={() => onOpenContextTab('email')}
            className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors cursor-pointer ${
              hasEmail
                ? 'bg-cyan-950/60 border-cyan-700/80 text-cyan-300'
                : 'bg-[#161a24] border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-[#1c2230]'
            }`}
            title="Inspect email draft & context"
          >
            <Mail className="w-3 h-3 text-cyan-400" />
            <span>{hasEmail ? '✉ Email Context' : '✉ + Email thread'}</span>
          </button>

          {/* Web Search Toggle */}
          <div className="relative group">
            <button
              type="button"
              disabled={!hasTavilyKey}
              onClick={onToggleSearch}
              className={`flex items-center gap-1.5 px-2 py-1 rounded border transition-colors ${
                !hasTavilyKey
                  ? 'bg-zinc-900/40 border-zinc-800/50 text-zinc-600 cursor-not-allowed opacity-60'
                  : isSearchEnabled
                  ? 'bg-emerald-950/40 border-emerald-700/80 text-emerald-300 cursor-pointer'
                  : 'bg-[#161a24] border-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer'
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>
                🔍 Web search: {isSearchEnabled && hasTavilyKey ? 'ON' : 'OFF'}
              </span>
            </button>
            {!hasTavilyKey && (
              <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover:block z-30 w-52 p-2 text-[11px] font-mono text-amber-200 bg-zinc-900 border border-zinc-700 rounded shadow-xl">
                Add a Tavily key in Settings to enable live search grounding.
              </div>
            )}
          </div>
        </div>

        {/* Right side labels */}
        <div className="flex items-center gap-3 text-zinc-400 text-[11px]">
          <span>max_tokens: 4096</span>
          <span className="hidden sm:inline-block">Enter ↵</span>
        </div>
      </div>

      {/* Action / Send Buttons Row */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1b202c]">
        {/* Inline warning if keys are missing */}
        <div className="flex items-center gap-2">
          {(!hasClaudeKey || !hasGeminiKey) && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400/90 font-mono">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>
                {!hasClaudeKey && !hasGeminiKey
                  ? 'Add your API keys in Settings'
                  : !hasClaudeKey
                  ? 'Claude key missing'
                  : 'Gemini key missing'}
              </span>
              <button
                type="button"
                onClick={onOpenSettings}
                className="ml-1 underline text-amber-300 hover:text-amber-100 cursor-pointer"
              >
                Settings
              </button>
            </div>
          )}
        </div>

        {/* Two Send Action Buttons */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Claude Button */}
          <button
            type="button"
            disabled={!canSendClaude}
            onClick={() => onSend('claude')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs font-medium transition-all ${
              canSendClaude
                ? 'bg-amber-600 hover:bg-amber-500 text-zinc-950 shadow-md shadow-amber-950/30 cursor-pointer active:scale-95'
                : 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/50 cursor-not-allowed'
            }`}
            title={
              !hasClaudeKey
                ? 'Add your Anthropic API key in Settings'
                : !hasText
                ? 'Type a message to send'
                : 'Run with Claude 3.7'
            }
          >
            {isLoading && activeProvider === 'claude' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-300" />
            )}
            <span>● Run with Claude 3.7</span>
          </button>

          {/* Gemini Button */}
          <button
            type="button"
            disabled={!canSendGemini}
            onClick={() => onSend('gemini')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono text-xs font-medium transition-all ${
              canSendGemini
                ? 'bg-cyan-600 hover:bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-950/30 cursor-pointer active:scale-95'
                : 'bg-zinc-800/60 text-zinc-400 border border-zinc-700/50 cursor-not-allowed'
            }`}
            title={
              !hasGeminiKey
                ? 'Add your Gemini API key in Settings'
                : !hasText
                ? 'Type a message to send'
                : 'Run with Gemini 1.5'
            }
          >
            {isLoading && activeProvider === 'gemini' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-cyan-300" />
            )}
            <span>● Run with Gemini 1.5</span>
          </button>
        </div>
      </div>
    </div>
  );
};
