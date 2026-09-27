import React, { useRef, useEffect, useState } from 'react';
import {
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  AlertTriangle,
  Bot,
  User,
  Info,
  Clock,
} from 'lucide-react';
import { Message, ModelProvider } from '../types';
import { SafeContentRenderer } from './SafeContentRenderer';

interface ChatThreadProps {
  messages: Message[];
  isLoading: boolean;
  activeProvider: ModelProvider;
  onRetry: (msgId: string) => void;
  onSelectPromptStarter: (text: string) => void;
  hasInput: boolean;
}

const STARTER_PROMPTS = [
  'Analyze postgres query bottlenecks',
  'Draft launch email to beta users',
  'Refactor auth middleware',
  'Summarize system architecture',
];

export const ChatThread: React.FC<ChatThreadProps> = ({
  messages,
  isLoading,
  activeProvider,
  onRetry,
  onSelectPromptStarter,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // If no messages yet, show Stitch Empty State
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="max-w-md w-full flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold font-mono tracking-tight text-zinc-100">
              Harness
            </h1>
            <span className="text-[10px] font-mono uppercase bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 px-1.5 py-0.5 rounded font-semibold tracking-wider">
              CORE
            </span>
          </div>

          <p className="text-xs text-zinc-400 font-mono mb-8">
            Grounded multi-model intelligence workspace
          </p>

          {/* Suggested workflows prompt starters */}
          <div className="w-full text-left">
            <div className="text-[10px] font-mono uppercase text-zinc-400 tracking-wider mb-2.5 text-center">
              Suggested workflows
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STARTER_PROMPTS.map((starter) => (
                <button
                  key={starter}
                  onClick={() => onSelectPromptStarter(starter)}
                  className="p-2.5 rounded-lg border border-[#202534] bg-[#121620] hover:bg-[#181d2a] hover:border-zinc-700 text-left text-xs font-mono text-zinc-300 hover:text-zinc-100 transition-all cursor-pointer group"
                >
                  <span className="text-cyan-400 mr-1.5 group-hover:translate-x-0.5 inline-block transition-transform">
                    →
                  </span>
                  {starter}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 scrollbar-thin">
      {messages.map((message) => {
        // System notice / Model switch / Trim notice
        if (message.role === 'notice') {
          return (
            <div
              key={message.id}
              className="flex items-center justify-center my-3"
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141822] border border-zinc-800 text-[11px] font-mono text-zinc-400">
                <Info className="w-3 h-3 text-cyan-400" />
                <span>{message.content}</span>
              </div>
            </div>
          );
        }

        // User message
        if (message.role === 'user') {
          return (
            <div key={message.id} className="flex justify-end">
              <div className="max-w-2xl rounded-xl bg-[#1b212f] border border-[#2b3346] px-4 py-3 text-zinc-100 shadow-lg">
                <div className="flex items-center justify-between gap-3 mb-1 text-[10.5px] font-mono text-zinc-400 border-b border-zinc-700/40 pb-1">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3 h-3 text-cyan-400" />
                    <span>USER</span>
                  </div>
                  <span>
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="text-sm font-sans text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </div>
              </div>
            </div>
          );
        }

        // Assistant message (or Error)
        const isError = message.isError;
        const isClaude = message.model?.toLowerCase().includes('claude');

        return (
          <div key={message.id} className="flex justify-start">
            <div
              className={`max-w-3xl w-full rounded-xl border p-4 shadow-xl transition-all ${
                isError
                  ? 'bg-rose-950/20 border-rose-900/60 text-rose-200'
                  : 'bg-[#11141c] border-[#222736] text-zinc-200'
              }`}
            >
              {/* Header: Model info, latency, actions */}
              <div className="flex items-center justify-between gap-2 pb-2 mb-3 border-b border-zinc-800/80 text-[11px] font-mono">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded font-medium ${
                      isClaude
                        ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                        : 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60'
                    }`}
                  >
                    <Bot className="w-3 h-3" />
                    <span>{message.model || (isClaude ? 'Claude 3.7' : 'Gemini 1.5')}</span>
                  </div>

                  {message.latencyMs !== undefined && (
                    <div className="flex items-center gap-1 text-zinc-400">
                      <Clock className="w-3 h-3" />
                      <span>{message.latencyMs}ms</span>
                    </div>
                  )}

                  {message.groundedMeta && (
                    <div className="hidden sm:flex items-center gap-1 text-[10px] text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                      <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                      <span>grounded</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {!isError && (
                    <button
                      onClick={() => handleCopy(message.id, message.content)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors cursor-pointer"
                      title="Copy response"
                    >
                      {copiedId === message.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-[10px] text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span className="text-[10px]">Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Content or Error state */}
              {isError ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5 text-rose-300 text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    <div>
                      <p className="font-mono text-xs font-semibold">{message.content}</p>
                      {message.error && (
                        <p className="text-xs text-rose-400/80 mt-1 font-mono">
                          {message.error}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() => onRetry(message.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-900/50 hover:bg-rose-900 text-rose-100 border border-rose-700/60 font-mono text-xs transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                  </div>
                </div>
              ) : (
                <SafeContentRenderer content={message.content} />
              )}
            </div>
          </div>
        );
      })}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-start">
          <div className="rounded-xl border border-zinc-800 bg-[#11141c] p-4 flex items-center gap-3 text-xs font-mono text-zinc-400">
            <span
              className={`w-2 h-2 rounded-full animate-ping ${
                activeProvider === 'claude' ? 'bg-amber-400' : 'bg-cyan-400'
              }`}
            />
            <span>
              Generating response with{' '}
              {activeProvider === 'claude' ? 'Claude' : 'Gemini'}...
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
