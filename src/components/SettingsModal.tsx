import React, { useState } from 'react';
import {
  X,
  KeyRound,
  ShieldAlert,
  Cpu,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import { ApiKeys, ModelConfigs, DEFAULT_CLAUDE_MODEL, DEFAULT_GEMINI_MODEL } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: ApiKeys;
  onSaveKey: (key: keyof ApiKeys, value: string) => void;
  onClearAllKeys: () => void;
  modelConfigs: ModelConfigs;
  onSaveModelConfigs: (configs: Partial<ModelConfigs>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKeys,
  onSaveKey,
  onClearAllKeys,
  modelConfigs,
  onSaveModelConfigs,
}) => {
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [showGemini, setShowGemini] = useState(false);
  const [showTavily, setShowTavily] = useState(false);
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [showGrok, setShowGrok] = useState(false);

  // Clear confirmation dialog state
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [savedNotification, setSavedNotification] = useState(false);

  if (!isOpen) return null;

  const handleKeyChange = (key: keyof ApiKeys, val: string) => {
    onSaveKey(key, val);
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 1500);
  };

  const handleClearConfirmed = () => {
    onClearAllKeys();
    setShowClearConfirm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#272e3f] bg-[#0e1117] shadow-2xl overflow-hidden font-mono">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1f2533] flex items-center justify-between bg-[#121620]">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold tracking-wider text-zinc-100 uppercase">
              Harness Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-6 scrollbar-thin text-xs">
          {/* Note on security */}
          <div className="p-3 rounded-lg bg-[#141824] border border-cyan-900/50 text-[11px] text-zinc-300 leading-relaxed">
            <span className="text-cyan-400 font-semibold block mb-0.5">
              Client-Only Local Persistence
            </span>
            All credentials are saved strictly in your browser&apos;s <code className="text-cyan-300">localStorage</code>.
            No server proxies, no telemetry, no build-time secret injection.
          </div>

          {/* Active Keys Section */}
          <div className="space-y-4">
            <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold border-b border-zinc-800 pb-1">
              Active Provider Keys (v1)
            </div>

            {/* Anthropic Key */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-zinc-300 font-medium">Anthropic API Key (Claude):</label>
                <span className="text-[10px] text-zinc-500 font-mono">harness_anthropic_key</span>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showAnthropic ? 'text' : 'password'}
                  value={apiKeys.anthropic}
                  onChange={(e) => handleKeyChange('anthropic', e.target.value)}
                  placeholder="sk-ant-api03-..."
                  className="w-full bg-[#12151e] border border-zinc-800 rounded-lg px-3 py-2 pr-10 text-zinc-200 focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowAnthropic(!showAnthropic)}
                  className="absolute right-3 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                >
                  {showAnthropic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Gemini Key */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-zinc-300 font-medium">Google Gemini API Key:</label>
                <span className="text-[10px] text-zinc-500 font-mono">harness_gemini_key</span>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showGemini ? 'text' : 'password'}
                  value={apiKeys.gemini}
                  onChange={(e) => handleKeyChange('gemini', e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full bg-[#12151e] border border-zinc-800 rounded-lg px-3 py-2 pr-10 text-zinc-200 focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowGemini(!showGemini)}
                  className="absolute right-3 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                >
                  {showGemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Tavily Search Key */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-zinc-300 font-medium">Tavily Web Search API Key:</label>
                <span className="text-[10px] text-zinc-500 font-mono">harness_tavily_key</span>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showTavily ? 'text' : 'password'}
                  value={apiKeys.tavily}
                  onChange={(e) => handleKeyChange('tavily', e.target.value)}
                  placeholder="tvly-..."
                  className="w-full bg-[#12151e] border border-zinc-800 rounded-lg px-3 py-2 pr-10 text-zinc-200 focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowTavily(!showTavily)}
                  className="absolute right-3 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                >
                  {showTavily ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Model Identifiers Configuration */}
          <div className="space-y-3 pt-2 border-t border-zinc-800/80">
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Configured Model Identifiers</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-zinc-400 text-[11px]">Claude Model ID:</label>
                <input
                  type="text"
                  value={modelConfigs.claudeModel}
                  onChange={(e) => onSaveModelConfigs({ claudeModel: e.target.value })}
                  placeholder={DEFAULT_CLAUDE_MODEL}
                  className="w-full bg-[#12151e] border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 text-[11px] focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 text-[11px]">Gemini Model ID:</label>
                <input
                  type="text"
                  value={modelConfigs.geminiModel}
                  onChange={(e) => onSaveModelConfigs({ geminiModel: e.target.value })}
                  placeholder={DEFAULT_GEMINI_MODEL}
                  className="w-full bg-[#12151e] border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 text-[11px] focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Coming Soon Keys (OpenAI & Grok) */}
          <div className="space-y-3 pt-2 border-t border-zinc-800/80 opacity-70">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
              <span>Deferred Providers (v2)</span>
              <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                Coming soon
              </span>
            </div>

            {/* OpenAI Key */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-zinc-400">OpenAI API Key (Coming soon):</label>
                <span className="text-[10px] text-zinc-600 font-mono">harness_openai_key</span>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showOpenAI ? 'text' : 'password'}
                  value={apiKeys.openai}
                  onChange={(e) => handleKeyChange('openai', e.target.value)}
                  placeholder="sk-proj-... (saved locally, deferred in v1)"
                  className="w-full bg-[#0d0f15] border border-zinc-800/80 rounded-lg px-3 py-1.5 pr-10 text-zinc-400 text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenAI(!showOpenAI)}
                  className="absolute right-3 text-zinc-600 hover:text-zinc-400 cursor-pointer"
                >
                  {showOpenAI ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Grok Key */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-zinc-400">xAI Grok API Key (Coming soon):</label>
                <span className="text-[10px] text-zinc-600 font-mono">harness_grok_key</span>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showGrok ? 'text' : 'password'}
                  value={apiKeys.grok}
                  onChange={(e) => handleKeyChange('grok', e.target.value)}
                  placeholder="xai-... (saved locally, deferred in v1)"
                  className="w-full bg-[#0d0f15] border border-zinc-800/80 rounded-lg px-3 py-1.5 pr-10 text-zinc-400 text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowGrok(!showGrok)}
                  className="absolute right-3 text-zinc-600 hover:text-zinc-400 cursor-pointer"
                >
                  {showGrok ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Destructive Action: Clear all keys */}
          <div className="pt-3 border-t border-zinc-800/80">
            {showClearConfirm ? (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800 space-y-2">
                <div className="flex items-center gap-2 text-rose-300 font-semibold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Are you sure you want to clear all stored keys?</span>
                </div>
                <p className="text-[11px] text-rose-300/80">
                  This will remove your Anthropic, Gemini, Tavily, OpenAI, and Grok keys from this browser&apos;s localStorage.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleClearConfirmed}
                    className="px-3 py-1 bg-rose-700 hover:bg-rose-600 text-white rounded font-medium text-xs cursor-pointer"
                  >
                    Yes, Clear All Keys
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded font-medium text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Clear all stored keys</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1f2533] bg-[#0c0e14] flex items-center justify-between">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            {savedNotification && (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Saved to localStorage</span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-semibold text-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
