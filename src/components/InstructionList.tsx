import { useProjectStore } from '@/store/projectStore';
import InstructionCard from './InstructionCard';
import { useState, useRef } from 'react';
import { Filter, List, Plus, X, Pencil } from 'lucide-react';
import type { InstructionType, ExecutionStatus } from '@/types/ehp';
import { INSTRUCTION_LABELS } from '@/types/ehp';

export default function InstructionList() {
  const { project, getActiveTabInstructions, addTab, renameTab, removeTab, setActiveTab } = useProjectStore();
  const [filterType, setFilterType] = useState<InstructionType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ExecutionStatus | 'all'>('all');
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  const tabInstructions = getActiveTabInstructions();

  const filtered = tabInstructions.filter((i) => {
    if (filterType !== 'all' && i.type !== filterType) return false;
    if (filterStatus !== 'all' && i.execution_status !== filterStatus) return false;
    return true;
  });

  const types = [...new Set(project.instructions.map((i) => i.type))];

  const handleAddTab = () => {
    addTab('New Tab');
  };

  const handleStartRename = (tabId: string, currentName: string) => {
    setEditingTabId(tabId);
    setEditingName(currentName);
    setTimeout(() => editInputRef.current?.select(), 0);
  };

  const handleSaveRename = () => {
    if (editingTabId && editingName.trim()) {
      renameTab(editingTabId, editingName.trim());
    }
    setEditingTabId(null);
  };

  const handleRemoveTab = (tabId: string) => {
    if (project.tabs.length > 1) {
      removeTab(tabId);
    }
  };

  return (
    <div className="flex flex-col h-full">
{/* Tab bar */}
      <div className="flex items-center gap-1 p-2 border-b border-border overflow-x-auto flex-shrink-0">
        {project.tabs.map((tab) => (
          <div
            key={tab.id}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer flex-shrink-0 ${
              tab.id === project.active_tab_id
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {editingTabId === tab.id ? (
              <input
                ref={editInputRef}
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={handleSaveRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveRename();
                  if (e.key === 'Escape') setEditingTabId(null);
                }}
                className="bg-transparent border-none outline-none w-16 text-xs"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  handleStartRename(tab.id, tab.name);
                }}
              >
                {tab.name}
              </span>
            )}
            {project.tabs.length > 1 && !editingTabId && (
              <X
                className="w-3 h-3 opacity-50 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTab(tab.id);
                }}
              />
            )}
          </div>
        ))}
        <button
          onClick={handleAddTab}
          className="p-1 rounded hover:bg-surface text-muted-foreground"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 p-3 border-b border-border">
        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as InstructionType | 'all')}
          className="bg-surface border border-border rounded px-2 py-1 text-xs text-foreground"
        >
          <option value="all">All types</option>
          {types.map((t) => (
            <option key={t} value={t}>{INSTRUCTION_LABELS[t]}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as ExecutionStatus | 'all')}
          className="bg-surface border border-border rounded px-2 py-1 text-xs text-foreground"
        >
          <option value="all">All statuses</option>
          <option value="todo">Todo</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
          <option value="blocked">Blocked</option>
        </select>
        <span className="ml-auto text-xs text-muted-foreground">
          <List className="w-3 h-3 inline mr-1" />
          {filtered.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            {tabInstructions.length === 0 ? 'No instructions yet' : 'No matching instructions'}
          </div>
        ) : (
          filtered.map((inst) => (
            <InstructionCard key={inst.id} instruction={inst} />
          ))
        )}
      </div>

      {/* Shortcuts row */}
      <div className="flex flex-wrap gap-x-3 gap-y-2 px-3 py-3 border-t border-border text-[10px] text-muted-foreground bg-card/50">
        <div className="flex gap-1.5 items-center">
          <kbd className="px-1 py-0.5 bg-surface border border-border rounded font-mono">S</kbd> Start
        </div>
        <div className="flex gap-1.5 items-center">
          <kbd className="px-1 py-0.5 bg-surface border border-border rounded font-mono">D</kbd> End
        </div>
        <div className="flex gap-1.5 items-center">
          <kbd className="px-1 py-0.5 bg-surface border border-border rounded font-mono">M</kbd> Mark
        </div>
        <div className="flex gap-1.5 items-center">
          <kbd className="px-1 py-0.5 bg-surface border border-border rounded font-mono">T</kbd> Type
        </div>
        <div className="flex gap-1.5 items-center">
          <kbd className="px-1 py-0.5 bg-surface border border-border rounded font-mono">N</kbd> Notes
        </div>
        <div className="flex gap-1.5 items-center">
          <kbd className="px-1 py-0.5 bg-surface border border-border rounded font-mono">Ctrl</kbd>+<kbd className="px-1 py-0.5 bg-surface border border-border rounded font-mono">Enter</kbd> Save
        </div>
        <div className="flex gap-1.5 items-center">
          <kbd className="px-1 py-0.5 bg-surface border border-border rounded font-mono">Space</kbd> / <kbd className="px-1 py-0.5 bg-surface border border-border rounded font-mono">K</kbd> Play
        </div>
        <div className="flex gap-1.5 items-center">
          <kbd className="px-1 py-0.5 bg-surface border border-border rounded font-mono">←→</kbd> ±10s
        </div>
        <div className="flex gap-1.5 items-center">
          <kbd className="px-1 py-0.5 bg-surface border border-border rounded font-mono">J</kbd> / <kbd className="px-1 py-0.5 bg-surface border border-border rounded font-mono">L</kbd> ±5s
        </div>
        <div className="flex gap-1.5 items-center">
          <kbd className="px-1 py-0.5 bg-surface border border-border rounded font-mono">Shift</kbd>+<kbd className="px-1 py-0.5 bg-surface border border-border rounded font-mono">←→</kbd> Speed
        </div>
      </div>
    </div>
  );
}