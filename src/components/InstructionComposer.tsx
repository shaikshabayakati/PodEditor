import { useEffect, useRef, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Instruction, InstructionType } from '@/types/ehp';
import { formatTime, parseTime, INSTRUCTION_LABELS } from '@/types/ehp';
import { Plus } from 'lucide-react';

const TYPE_OPTIONS: InstructionType[] = [
  'delete', 'image', 'text', 'note', 'chapter'
];

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.hasAttribute('data-notes-input')) return true;
  if (target.hasAttribute('data-text-edit')) return true;
  if (target.hasAttribute('data-timeline-input')) return false;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || target.isContentEditable;
}

export default function InstructionComposer() {
  const { addInstruction, project, addAuditEntry, activeRole, currentVideoTime } = useProjectStore();
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [type, setType] = useState<InstructionType>('note');
  const [inputText, setInputText] = useState('');
  const [typeOpen, setTypeOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const typeSelectRef = useRef<HTMLButtonElement>(null);
  const isReviewer = activeRole === 'reviewer';

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isReviewer) return;
      if (isTypingTarget(event.target)) return;

      if (event.key.toLowerCase() === 'p') {
        event.preventDefault();
        const stamp = formatTime(Math.max(0, Math.floor(currentVideoTime)));
        if (!startTime || endTime) {
          setStartTime(stamp);
          setEndTime('');
          return;
        }
        setEndTime(stamp);
        return;
      }

      if (event.key.toLowerCase() === 't') {
        event.preventDefault();
        setTypeOpen(true);
        return;
      }

      if (typeOpen) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          const currentIdx = TYPE_OPTIONS.indexOf(type);
          const nextIdx = (currentIdx + 1) % TYPE_OPTIONS.length;
          setType(TYPE_OPTIONS[nextIdx]);
          return;
        }
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          const currentIdx = TYPE_OPTIONS.indexOf(type);
          const prevIdx = (currentIdx - 1 + TYPE_OPTIONS.length) % TYPE_OPTIONS.length;
          setType(TYPE_OPTIONS[prevIdx]);
          return;
        }
        if (event.key === 'Enter') {
          event.preventDefault();
          setTypeOpen(false);
          return;
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          setTypeOpen(false);
          return;
        }
        return;
      }

      if (event.key.toLowerCase() === 's') {
        if (!startTime.trim()) return;
        const st = parseTime(startTime.trim());
        if (st === null) return;
        event.preventDefault();

        const et = endTime.trim() ? parseTime(endTime.trim()) ?? undefined : undefined;
        let finalText = inputText.trim();
        let finalType = type;

        if (type === 'chapter' && finalText.toLowerCase().includes('end')) {
          finalType = 'chapter';
          finalText = `[END] ${finalText.replace(/end/i, '').trim()}` || 'Section';
        } else if (type === 'chapter') {
          finalText = finalText || 'Section';
        }

        const instruction: Instruction = {
          id: crypto.randomUUID(),
          type: finalType,
          start_time: st,
          end_time: et,
          input_text: finalText,
          execution_status: 'todo',
          review_status: 'not_reviewed',
          round: project.review_round,
          created_at: new Date().toISOString(),
        };

        addInstruction(instruction);
        addAuditEntry({ role: 'reviewer', action: 'instruction_added', entry_id: instruction.id });

        setStartTime('');
        setEndTime('');
        setInputText('');
        return;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [currentVideoTime, endTime, isReviewer, startTime, inputText, project.review_round, addInstruction, addAuditEntry, type, typeOpen]);

  const canSubmit = () => {
    if (!startTime.trim()) return false;
    const st = parseTime(startTime.trim());
    if (st === null) return false;
    if (endTime.trim() && parseTime(endTime.trim()) === null) return false;
    return true;
  };

  const handleSubmit = () => {
    if (!canSubmit()) return;
    const st = parseTime(startTime.trim())!;
    const et = endTime.trim() ? parseTime(endTime.trim()) ?? undefined : undefined;

    let finalType = type;
    let finalText = inputText.trim();

    if (type === 'chapter') {
      if (finalText.toLowerCase().includes('end')) {
        finalType = 'chapter';
        finalText = `[END] ${finalText.replace(/end/i, '').trim()}` || 'Section';
      } else {
        finalText = finalText || 'Section';
      }
    }

    const instruction: Instruction = {
      id: crypto.randomUUID(),
      type: finalType,
      start_time: st,
      end_time: et,
      input_text: finalText,
      execution_status: 'todo',
      review_status: 'not_reviewed',
      round: project.review_round,
      created_at: new Date().toISOString(),
    };

    addInstruction(instruction);
    addAuditEntry({ role: 'reviewer', action: 'instruction_added', entry_id: instruction.id });

    setStartTime('');
    setEndTime('');
    setInputText('');
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLElement).blur();
    }
  };

  const getTypeLabel = (t: InstructionType): string => {
    switch (t) {
      case 'chapter': return 'Chapter';
      default: return INSTRUCTION_LABELS[t];
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4 bg-card rounded-lg border border-border">
      {/* Start, End, Type - all in one row */}
      <div className="flex gap-2">
        <div className="flex-1 min-w-0">
          <Input
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Start"
            className="bg-surface border-border font-mono text-sm h-10 w-full"
          />
        </div>
        <div className="flex-1 min-w-0">
          <Input
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="End"
            className="bg-surface border-border font-mono text-sm h-10 w-full"
          />
        </div>
        <div className="flex-1 min-w-0">
          {typeOpen ? (
            <div className="w-full bg-surface border border-primary rounded px-2 text-sm text-foreground h-10 flex items-center justify-between">
              <span>{getTypeLabel(type)}</span>
              <span className="text-[10px] text-muted-foreground">↑↓</span>
            </div>
          ) : (
            <button
              ref={typeSelectRef}
              type="button"
              data-type-select
              onClick={() => setTypeOpen(true)}
              className="w-full bg-surface border border-border rounded px-2 text-sm text-foreground h-10 flex items-center justify-between hover:border-primary/50"
            >
              <span>{getTypeLabel(type)}</span>
              <span className="text-[10px] text-muted-foreground">T</span>
            </button>
          )}
        </div>
      </div>

      {/* Notes input - plain text box, no shortcuts */}
      <Input
        ref={inputRef}
        data-notes-input
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={handleInputKeyDown}
        placeholder="Enter instruction notes..."
        className="bg-surface border-border text-sm h-10"
      />

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!canSubmit()}
        className="w-full gap-1"
        size="sm"
      >
        <Plus className="w-3.5 h-3.5" />
        Add
      </Button>
    </div>
  );
}