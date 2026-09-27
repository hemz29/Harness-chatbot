import React from 'react';

export const FooterStatusBar: React.FC = () => {
  return (
    <footer className="h-7 border-t border-[#1a1f2b] bg-[#090b0e] px-4 flex items-center justify-between text-[11px] font-mono text-zinc-400 shrink-0 select-none">
      <div className="flex items-center gap-2">
        <span>Harness v0.9.4 · Multi-model orchestration engine · e2e local state</span>
      </div>
      <div className="flex items-center gap-2 text-zinc-400">
        <span>🔒 Zero telemetry · Context window: 200k · ⌘K palette</span>
      </div>
    </footer>
  );
};
