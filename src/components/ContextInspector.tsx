import React, { useState, useRef } from 'react';
import {
  X,
  FileText,
  Mail,
  Globe,
  Upload,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Send,
  Loader2,
} from 'lucide-react';
import { DocumentContext, EmailContext, ModelProvider } from '../types';
import { processUploadedFile, processDocumentText } from '../utils/documentUtils';
import { draftEmailWithModel } from '../services/aiAdapters';

interface ContextInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'document' | 'email' | 'search';
  setActiveTab: (tab: 'document' | 'email' | 'search') => void;
  documentContext: DocumentContext | null | undefined;
  onAttachDocument: (doc: DocumentContext | null) => void;
  emailContext: EmailContext | null | undefined;
  onUpdateEmailContext: (ctx: EmailContext | null) => void;
  isSearchEnabled: boolean;
  onToggleSearch: () => void;
  hasTavilyKey: boolean;
  claudeKey: string;
  geminiKey: string;
  claudeModel: string;
  geminiModel: string;
}

export const ContextInspector: React.FC<ContextInspectorProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  documentContext,
  onAttachDocument,
  emailContext,
  onUpdateEmailContext,
  isSearchEnabled,
  onToggleSearch,
  hasTavilyKey,
  claudeKey,
  geminiKey,
  claudeModel,
  geminiModel,
}) => {
  // Document state
  const [pasteDocText, setPasteDocText] = useState('');
  const [pasteDocName, setPasteDocName] = useState('pasted_document.md');
  const [docError, setDocError] = useState<string | null>(null);
  const [docWarning, setDocWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Email helper state
  const [rawEmail, setRawEmail] = useState(emailContext?.rawEmail || '');
  const [emailInstruction, setEmailInstruction] = useState(
    emailContext?.instruction || 'Write a polite, professional reply.'
  );
  const [draftReply, setDraftReply] = useState(emailContext?.lastDraftReply || '');
  const [emailModel, setEmailModel] = useState<ModelProvider>('claude');
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [copiedDraft, setCopiedDraft] = useState(false);

  if (!isOpen) return null;

  // Handle file drop/upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setDocError(null);
    setDocWarning(null);

    const file = files[0];
    const result = await processUploadedFile(file);

    if (result.error) {
      setDocError(result.error);
      return;
    }

    if (result.warning) {
      setDocWarning(result.warning);
    }

    if (result.doc) {
      onAttachDocument(result.doc);
    }
  };

  const handlePasteDocumentSubmit = () => {
    if (!pasteDocText.trim()) return;
    setDocError(null);
    setDocWarning(null);

    const result = processDocumentText(pasteDocName || 'pasted_document.md', pasteDocText);
    if (result.warning) {
      setDocWarning(result.warning);
    }
    if (result.doc) {
      onAttachDocument(result.doc);
      setPasteDocText('');
    }
  };

  const handleEjectDocument = () => {
    onAttachDocument(null);
    setDocWarning(null);
    setDocError(null);
  };

  // Handle email draft generation
  const handleGenerateDraft = async () => {
    if (!rawEmail.trim()) {
      setDraftError('Please paste an email message first.');
      return;
    }

    const key = emailModel === 'claude' ? claudeKey : geminiKey;
    const model = emailModel === 'claude' ? claudeModel : geminiModel;

    if (!key || !key.trim()) {
      setDraftError(
        `No ${emailModel === 'claude' ? 'Claude' : 'Gemini'} API key set. Please add it in Settings.`
      );
      return;
    }

    setIsDrafting(true);
    setDraftError(null);

    try {
      const res = await draftEmailWithModel({
        provider: emailModel,
        apiKey: key,
        modelName: model,
        rawEmail,
        instruction: emailInstruction,
      });

      setDraftReply(res.draft);
      onUpdateEmailContext({
        rawEmail,
        instruction: emailInstruction,
        lastDraftReply: res.draft,
        modelUsed: emailModel,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Draft generation failed';
      setDraftError(msg);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleCopyDraft = () => {
    if (!draftReply) return;
    navigator.clipboard.writeText(draftReply);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 1800);
  };

  const handleClearEmailContext = () => {
    setRawEmail('');
    setDraftReply('');
    onUpdateEmailContext(null);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-[#0e1117] border-l border-[#202534] shadow-2xl flex flex-col select-none">
      {/* Header */}
      <div className="p-4 border-b border-[#1c212d] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-mono font-semibold tracking-wider text-zinc-100 uppercase">
            CONTEXT INSPECTOR
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1c212d] bg-[#0a0c10] text-xs font-mono">
        <button
          onClick={() => setActiveTab('document')}
          className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'document'
              ? 'border-cyan-400 text-cyan-300 bg-[#121620]'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>DOCUMENT</span>
          {documentContext && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 ml-1" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('email')}
          className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'email'
              ? 'border-cyan-400 text-cyan-300 bg-[#121620]'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>EMAIL_IN</span>
          {emailContext && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 ml-1" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
            activeTab === 'search'
              ? 'border-cyan-400 text-cyan-300 bg-[#121620]'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>GROUNDING</span>
          {isSearchEnabled && hasTavilyKey && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1" />
          )}
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin space-y-4">
        {/* DOCUMENT TAB */}
        {activeTab === 'document' && (
          <div className="space-y-4 text-xs font-mono">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 bg-[#121622] p-2.5 rounded-lg border border-zinc-800/80 text-[11px]">
              <div>
                <span className="text-zinc-400 block text-[10px]">TOKEN_BUDGET</span>
                <span className="text-zinc-200 font-semibold">
                  {documentContext ? documentContext.estimatedTokens.toLocaleString() : '0'} / 200,000
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px]">RAW_CHARS</span>
                <span className="text-zinc-200 font-semibold">
                  {documentContext ? documentContext.charCount.toLocaleString() : '0'}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[10px]">ENCODING</span>
                <span className="text-cyan-400 font-semibold">cl100k</span>
              </div>
            </div>

            {/* Error & Warning Banners */}
            {docError && (
              <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{docError}</span>
              </div>
            )}

            {docWarning && (
              <div className="p-2.5 rounded bg-amber-950/40 border border-amber-800 text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{docWarning}</span>
              </div>
            )}

            {/* Attached File Preview Card */}
            {documentContext ? (
              <div className="rounded-lg border border-cyan-800/60 bg-[#121620] overflow-hidden">
                <div className="p-2.5 bg-[#171d2b] border-b border-cyan-900/60 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="text-xs font-semibold text-zinc-100 truncate">
                      {documentContext.name}
                    </span>
                    {documentContext.truncated && (
                      <span className="text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/50">
                        Truncated
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleEjectDocument}
                    className="px-2 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-200 border border-rose-800 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    [EJECT]
                  </button>
                </div>

                {/* Numbered-line preview */}
                <div className="p-3 max-h-56 overflow-y-auto text-[11px] leading-relaxed text-zinc-300 font-mono bg-[#090b0e] scrollbar-thin">
                  {documentContext.content
                    .split('\n')
                    .slice(0, 50)
                    .map((line, idx) => (
                      <div key={idx} className="flex gap-3">
                        <span className="text-zinc-600 select-none w-6 text-right shrink-0">
                          {idx + 1}
                        </span>
                        <span className="break-all whitespace-pre-wrap">{line || ' '}</span>
                      </div>
                    ))}
                  {documentContext.rawLineCount > 50 && (
                    <div className="text-zinc-500 italic mt-2 text-center text-[10px]">
                      ... {documentContext.rawLineCount - 50} more lines in context window
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Drop zone / Upload */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileUpload(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className="p-6 border-2 border-dashed border-zinc-800 hover:border-cyan-500/60 rounded-xl bg-[#11141c] hover:bg-[#141822] text-center transition-all cursor-pointer group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.markdown"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
              <Upload className="w-6 h-6 text-zinc-400 group-hover:text-cyan-400 mx-auto mb-2 transition-colors" />
              <div className="text-xs font-semibold text-zinc-200 mb-1">
                + SWAP / ATTACH FILE
              </div>
              <div className="text-[11px] text-zinc-400">
                Drop .md or .txt file here (max ~15k words)
              </div>
            </div>

            {/* Paste document text alternative */}
            <div className="pt-2 border-t border-zinc-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase text-zinc-400 font-semibold">
                  Or paste document text
                </span>
                <input
                  type="text"
                  value={pasteDocName}
                  onChange={(e) => setPasteDocName(e.target.value)}
                  placeholder="filename.md"
                  className="bg-[#141822] border border-zinc-800 rounded px-2 py-0.5 text-[11px] text-zinc-300 w-36 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <textarea
                value={pasteDocText}
                onChange={(e) => setPasteDocText(e.target.value)}
                placeholder="Paste raw markdown or text content here to inject into model context..."
                className="w-full h-24 p-2 bg-[#0d0f14] border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500 scrollbar-thin"
              />
              <button
                type="button"
                onClick={handlePasteDocumentSubmit}
                disabled={!pasteDocText.trim()}
                className="mt-2 w-full py-1.5 rounded-md bg-[#191e2b] hover:bg-[#202737] text-cyan-300 border border-cyan-800/60 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Attach Pasted Document to Context
              </button>
            </div>
          </div>
        )}

        {/* EMAIL TAB */}
        {activeTab === 'email' && (
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-[#121622] border border-zinc-800 text-[11px] text-zinc-300 leading-relaxed">
              <span className="text-cyan-400 font-semibold block mb-0.5">Email Draft Helper</span>
              Paste an email thread and your response intention. Pure text in, text out (no OAuth or Gmail API required).
            </div>

            {draftError && (
              <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{draftError}</span>
              </div>
            )}

            {/* Email input */}
            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400 font-semibold uppercase">
                Raw Email Thread:
              </label>
              <textarea
                value={rawEmail}
                onChange={(e) => setRawEmail(e.target.value)}
                placeholder="Paste incoming email text here (e.g. from client, partner, or colleague)..."
                className="w-full h-28 p-2.5 bg-[#0d0f14] border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500 scrollbar-thin"
              />
            </div>

            {/* Instruction */}
            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400 font-semibold uppercase">
                Instruction / Intent:
              </label>
              <input
                type="text"
                value={emailInstruction}
                onChange={(e) => setEmailInstruction(e.target.value)}
                placeholder="e.g. 'write a polite decline', 'schedule meeting for next Tuesday'..."
                className="w-full p-2 bg-[#0d0f14] border border-zinc-800 rounded-lg text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Model chooser & action button */}
            <div className="flex items-center gap-2">
              <select
                value={emailModel}
                onChange={(e) => setEmailModel(e.target.value as ModelProvider)}
                className="bg-[#141822] border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-200 focus:outline-none"
              >
                <option value="claude">Claude 3.7</option>
                <option value="gemini">Gemini 1.5</option>
              </select>

              <button
                type="button"
                onClick={handleGenerateDraft}
                disabled={isDrafting || !rawEmail.trim()}
                className="flex-1 py-1.5 px-3 rounded bg-cyan-600 hover:bg-cyan-500 text-zinc-950 font-semibold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isDrafting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Drafting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Generate Draft Reply</span>
                  </>
                )}
              </button>
            </div>

            {/* Generated Reply Card */}
            {draftReply && (
              <div className="mt-4 rounded-lg border border-cyan-800/80 bg-[#121620] overflow-hidden">
                <div className="p-2 bg-[#171d2b] border-b border-cyan-900/60 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-cyan-300">
                    Draft Reply Generated
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyDraft}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10.5px] transition-colors cursor-pointer"
                    >
                      {copiedDraft ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Reply</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleClearEmailContext}
                      className="p-1 text-zinc-400 hover:text-rose-400 rounded cursor-pointer"
                      title="Clear email context"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="p-3 max-h-52 overflow-y-auto text-xs leading-relaxed text-zinc-200 whitespace-pre-wrap bg-[#090b0e] scrollbar-thin">
                  {draftReply}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SEARCH / GROUNDING TAB */}
        {activeTab === 'search' && (
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 rounded-lg bg-[#121622] border border-zinc-800 text-[11px] text-zinc-300 leading-relaxed">
              <span className="text-emerald-400 font-semibold block mb-0.5">
                Tavily Live Web Grounding
              </span>
              When enabled, your query is sent to Tavily Search (POST https://api.tavily.com/search).
              The top 3 live web snippets are automatically extracted and prepended to your prompt.
            </div>

            {/* Key Status */}
            <div className="p-3 rounded-lg border border-zinc-800 bg-[#0d0f14] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Tavily API Key:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    hasTavilyKey
                      ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                      : 'bg-rose-950/60 text-rose-400 border border-rose-800'
                  }`}
                >
                  {hasTavilyKey ? 'Configured' : 'Missing'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80">
                <span className="text-zinc-400">Search Grounding Status:</span>
                <button
                  type="button"
                  disabled={!hasTavilyKey}
                  onClick={onToggleSearch}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                    !hasTavilyKey
                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      : isSearchEnabled
                      ? 'bg-emerald-600 text-zinc-950 hover:bg-emerald-500 cursor-pointer'
                      : 'bg-[#181d28] text-zinc-300 hover:bg-[#202736] border border-zinc-700 cursor-pointer'
                  }`}
                >
                  {isSearchEnabled && hasTavilyKey ? 'Enabled (ON)' : 'Disabled (OFF)'}
                </button>
              </div>
            </div>

            {!hasTavilyKey && (
              <div className="p-2.5 rounded bg-amber-950/30 border border-amber-800/60 text-amber-300 text-xs">
                ⚠️ Tavily API key is not configured. Please open Settings (⚙) and add your Tavily key to enable web grounding.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
