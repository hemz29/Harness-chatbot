import React from 'react';
import { Sparkles, Globe, FileText, Mail } from 'lucide-react';
import { ModelConfigs } from '../types';

interface StatusRowProps {
  lastCallStatus: 'idle' | 'success' | 'error';
  lastLatencyMs: number | null;
  modelConfigs: ModelConfigs;
  hasDocument: boolean;
  hasEmail: boolean;
  hasSearch: boolean;
  activeModel?: 'claude' | 'gemini';
}

export const StatusRow: React.FC<StatusRowProps> = ({
  lastCallStatus,
  lastLatencyMs,
  modelConfigs,
  hasDocument,
  hasEmail,
  hasSearch,
  activeModel = 'claude',
}) => {
  const isGrounded = hasDocument || hasEmail || hasSearch;
  const isOnline = lastCallStatus !== 'error';

  return (
    <div className="flex flex-wrap items-center justify-between border-b border-[#1a1f2b] bg-[#090b0e] px-4 py-1.5 text-[11px] font-mono text-zinc-400 select-none">
      {/* Left side: Gateway & Latency */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span className={isOnline ? 'text-zinc-300 font-medium' : 'text-rose-400 font-medium'}>
            {isOnline ? 'GATEWAY ONLINE' : 'GATEWAY ERROR'}
          </span>
        </div>

        <div className="flex items-center gap-1 text-zinc-400">
          <span>latency:</span>
          <span className="text-zinc-300">
            {lastLatencyMs !== null ? `${lastLatencyMs}ms` : '—'}
          </span>
        </div>
      </div>

      {/* Right side: Model chips & Grounded pill */}
      <div className="flex items-center gap-2">
        {/* Model chips */}
        <div className="flex items-center gap-1 bg-[#12161f] border border-zinc-800 rounded px-1.5 py-0.5 text-[10px]">
          <span
            className={`px-1.5 py-0.5 rounded transition-colors ${
              activeModel === 'claude'
                ? 'bg-amber-950/40 text-amber-300 font-medium'
                : 'text-zinc-400'
            }`}
          >
            {modelConfigs.claudeModel}
          </span>
          <span className="text-zinc-600">/</span>
          <span
            className={`px-1.5 py-0.5 rounded transition-colors ${
              activeModel === 'gemini'
                ? 'bg-blue-950/40 text-blue-300 font-medium'
                : 'text-zinc-400'
            }`}
          >
            {modelConfigs.geminiModel}
          </span>
        </div>

        {/* Grounded pill */}
        <div
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10.5px] ${
            isGrounded
              ? 'bg-cyan-950/40 border-cyan-800/80 text-cyan-300'
              : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400'
          }`}
        >
          <Sparkles className={`w-3 h-3 ${isGrounded ? 'text-cyan-400' : 'text-zinc-400'}`} />
          <span>{isGrounded ? 'grounded: active' : 'grounded: off'}</span>
          {isGrounded && (
            <div className="flex items-center gap-1 ml-0.5 pl-1 border-l border-cyan-800/50">
              {hasDocument && (
                <span title="Document attached" className="flex items-center">
                  <FileText className="w-2.5 h-2.5 text-cyan-300" />
                </span>
              )}
              {hasEmail && (
                <span title="Email context attached" className="flex items-center">
                  <Mail className="w-2.5 h-2.5 text-cyan-300" />
                </span>
              )}
              {hasSearch && (
                <span title="Web search active" className="flex items-center">
                  <Globe className="w-2.5 h-2.5 text-cyan-300" />
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
