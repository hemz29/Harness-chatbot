import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface SafeContentRendererProps {
  content: string;
}

export const SafeContentRenderer: React.FC<SafeContentRendererProps> = ({ content }) => {
  // Split content by code blocks ```...```
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 font-sans text-sm leading-relaxed text-zinc-200">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).split('\n');
          const language = lines[0]?.trim() || '';
          const code = (language ? lines.slice(1) : lines).join('\n').replace(/^\n+|\n+$/g, '');

          return <CodeBlock key={index} code={code} language={language} />;
        }

        // Render standard paragraphs and lists
        const paragraphs = part.split(/\n\n+/);
        return (
          <React.Fragment key={index}>
            {paragraphs.map((para, pIdx) => {
              const trimmed = para.trim();
              if (!trimmed) return null;

              // Check if bullet list
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
                const listItems = trimmed.split('\n');
                return (
                  <ul key={pIdx} className="my-2 space-y-1 pl-5 list-disc marker:text-zinc-500">
                    {listItems.map((li, liIdx) => {
                      const cleanLi = li.replace(/^[-*]\s+|\d+\.\s+/, '');
                      return (
                        <li key={liIdx}>
                          <FormattedInline text={cleanLi} />
                        </li>
                      );
                    })}
                  </ul>
                );
              }

              // Check if blockquote
              if (trimmed.startsWith('>')) {
                const quoteText = trimmed.replace(/^>\s?/gm, '');
                return (
                  <blockquote
                    key={pIdx}
                    className="border-l-2 border-cyan-500/60 bg-zinc-900/40 pl-3 py-1 text-zinc-400 italic my-2"
                  >
                    <FormattedInline text={quoteText} />
                  </blockquote>
                );
              }

              return (
                <p key={pIdx} className="whitespace-pre-line text-zinc-300">
                  <FormattedInline text={trimmed} />
                </p>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const FormattedInline: React.FC<{ text: string }> = ({ text }) => {
  // Regex to match inline code `...`, bold **...**, italic *...*
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return (
    <>
      {tokens.map((token, i) => {
        if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
          return (
            <code
              key={i}
              className="rounded bg-zinc-800/80 px-1.5 py-0.5 font-mono text-[12.5px] text-cyan-300 border border-zinc-700/50"
            >
              {token.slice(1, -1)}
            </code>
          );
        }
        if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
          return (
            <strong key={i} className="font-semibold text-zinc-100">
              {token.slice(2, -2)}
            </strong>
          );
        }
        if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
          return (
            <em key={i} className="italic text-zinc-200">
              {token.slice(1, -1)}
            </em>
          );
        }
        return <span key={i}>{token}</span>;
      })}
    </>
  );
};

const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="relative my-3 overflow-hidden rounded-md border border-zinc-800 bg-[#090b0e]">
      <div className="flex items-center justify-between border-b border-zinc-800/80 bg-[#12151b] px-3 py-1.5 text-xs text-zinc-400">
        <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1.5 rounded px-2 py-0.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[11px] text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-3 text-xs leading-relaxed text-zinc-300 font-mono scrollbar-thin">
        <pre>{code}</pre>
      </div>
    </div>
  );
};
