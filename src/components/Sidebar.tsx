import React from 'react';
import {
  Plus,
  Settings,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  Terminal,
} from 'lucide-react';
import { ChatSession } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onOpenSettings: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onOpenSettings,
  isCollapsed,
  onToggleCollapse,
}) => {
  if (isCollapsed) {
    return (
      <aside className="flex flex-col items-center justify-between border-r border-[#202531] bg-[#0c0e12] py-3 px-2 w-14 shrink-0 transition-all select-none">
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            title="Expand Sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
          <button
            onClick={onNewSession}
            className="p-1.5 rounded bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700 transition-colors"
            title="New Session (⌘K)"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-[260px] shrink-0 border-r border-[#202531] bg-[#0c0e12] flex flex-col justify-between select-none">
      {/* Top Header */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between px-3.5 py-3 border-b border-[#1c202a]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Terminal className="w-3.5 h-3.5" />
            </div>
            <span className="font-mono text-sm font-semibold tracking-wider text-zinc-100 uppercase">
              Harness
            </span>
          </div>
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* New Session Button */}
        <div className="p-3">
          <button
            onClick={onNewSession}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-[#161a23] border border-zinc-800/80 text-xs font-medium text-zinc-200 hover:bg-[#1e2330] hover:border-zinc-700 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>+ New session</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 bg-zinc-800/80 border border-zinc-700/60 rounded">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Sessions Section */}
        <div className="px-3 pt-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 px-1 mb-2 font-semibold">
            SESSIONS
          </div>

          <div className="space-y-1 max-h-[calc(100vh-220px)] overflow-y-auto pr-1 scrollbar-thin">
            {sessions.length === 0 ? (
              <div className="px-2 py-4 text-center text-xs text-zinc-400 font-mono">
                No active sessions
              </div>
            ) : (
              sessions.map((session) => {
                const isActive = session.id === currentSessionId;
                return (
                  <div
                    key={session.id}
                    onClick={() => onSelectSession(session.id)}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#181d28] text-zinc-100 font-medium border border-zinc-800/70'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#12161f]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-1">
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                      )}
                      <span className="truncate text-[12.5px] leading-tight">
                        {session.title || 'Untitled session'}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-400 hover:bg-zinc-800/50 rounded transition-all shrink-0"
                      title="Delete session"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Settings Link */}
      <div className="p-3 border-t border-[#1c202a]">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs text-zinc-400 hover:text-zinc-200 hover:bg-[#161a23] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-3.5 h-3.5 text-zinc-400" />
            <span>⚙ Settings</span>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono">Ctrl+,</span>
        </button>
      </div>
    </aside>
  );
};
