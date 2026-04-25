import { useProjectStore } from '@/store/projectStore';
import InstructionCard from './InstructionCard';
import { useState } from 'react';
import { Filter, List } from 'lucide-react';
import type { InstructionType, ExecutionStatus } from '@/types/ehp';
import { INSTRUCTION_LABELS } from '@/types/ehp';

export default function InstructionList() {
  const { project } = useProjectStore();
  const [filterType, setFilterType] = useState<InstructionType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ExecutionStatus | 'all'>('all');

  const filtered = project.instructions.filter((i) => {
    if (filterType !== 'all' && i.type !== filterType) return false;
    if (filterStatus !== 'all' && i.execution_status !== filterStatus) return false;
    return true;
  });

  const types = [...new Set(project.instructions.map((i) => i.type))];

  return (
    <div className="flex flex-col h-full">
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
            {project.instructions.length === 0 ? 'No instructions yet' : 'No matching instructions'}
          </div>
        ) : (
          filtered.map((inst) => (
            <InstructionCard key={inst.id} instruction={inst} />
          ))
        )}
      </div>
    </div>
  );
}