import React from 'react';
import { Layers } from 'lucide-react';

interface TopBarProps {
  title: string;
  contextCount: number;
  onOpenContext: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  contextCount,
  onOpenContext,
}) => {
  return (
    <header className="h-12 border-b border-[#202531] bg-[#0d1016] px-4 flex items-center justify-between shrink-0 select-none">
      <div className="flex items-center gap-2.5 min-w-0">
        <h1 className="text-xs font-semibold text-zinc-100 truncate max-w-sm font-mono tracking-tight">
          {title || 'Untitled session'}
        </h1>
        <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900/80 px-1.5 py-0.5 rounded border border-zinc-800">
          workspace
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onOpenContext}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
            contextCount > 0
              ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-800/60 hover:bg-cyan-900/50'
              : 'bg-[#151922] text-zinc-400 border border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800/80'
          }`}
          title="Inspect and attach context"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>▤ Context ({contextCount})</span>
        </button>
      </div>
    </header>
  );
};
