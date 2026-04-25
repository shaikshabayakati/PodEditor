import { useEffect, useRef, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Instruction, InstructionType } from '@/types/ehp';
import { formatTime, parseTime } from '@/types/ehp';
import { Plus, Clock } from 'lucide-react';

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.hasAttribute('data-notes-input')) return true;
  if (target.hasAttribute('data-text-edit')) return true;
  const tag = target.tagName.toLowerCase();
  if (tag === 'input') return false;
  return target.isContentEditable || tag === 'textarea' || tag === 'select' || tag === 'button';
}

export default function InstructionComposer() {
  const { addInstruction, project, addAuditEntry, activeRole, currentVideoTime } = useProjectStore();
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
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
    };

    const handleSShortcut = () => {
      if (!startTime.trim() || !inputText.trim()) return;
      const st = parseTime(startTime.trim());
      if (!st) return;

      const et = endTime.trim() ? parseTime(endTime.trim()) ?? undefined : undefined;
      let noteText = inputText.trim();

      let type: InstructionType = 'note';
      const words = noteText.split(/\s+/);
      const cmd = words[0]?.toLowerCase();
      
      const shorthands: Record<string, InstructionType> = {
        'd': 'delete',
        'i': 'image',
        't': 'text',
        'b': 'big_text',
        's': 'small_text',
        'c': 'chapter',
        'ch': 'change',
        'h': 'chapter_heading',
        'f': 'footage',
        'r': 'reorder',
        'n': 'note'
      };

      if (cmd && shorthands[cmd]) {
        type = shorthands[cmd];
        noteText = noteText.substring(cmd.length).trim() || type.charAt(0).toUpperCase() + type.slice(1);
      }

      const instruction: any = {
        id: crypto.randomUUID(),
        type,
        start_time: st,
        end_time: et,
        input_text: noteText,
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
    };

    window.addEventListener('app:s-shortcut', handleSShortcut);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('app:s-shortcut', handleSShortcut);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [currentVideoTime, endTime, isReviewer, startTime, inputText, project.review_round, addInstruction, addAuditEntry]);

  const canSubmit = () => {
    if (!startTime.trim()) return false;
    const st = parseTime(startTime.trim());
    if (st === null) return false;
    if (endTime.trim() && parseTime(endTime.trim()) === null) return false;
    return inputText.trim().length > 0;
  };

  const handleSubmit = () => {
    if (!canSubmit()) return;
    const st = parseTime(startTime.trim())!;
    const et = endTime.trim() ? parseTime(endTime.trim()) ?? undefined : undefined;
    let noteText = inputText.trim();

    let type: InstructionType = 'note';
    const words = noteText.split(/\s+/);
    const cmd = words[0]?.toLowerCase();
    
    const shorthands: Record<string, InstructionType> = {
      'd': 'delete',
      'i': 'image',
      't': 'text',
      'b': 'big_text',
      's': 'small_text',
      'c': 'chapter',
      'ch': 'change',
      'h': 'chapter_heading',
      'f': 'footage',
      'r': 'reorder',
      'n': 'note'
    };

    if (cmd && shorthands[cmd]) {
      type = shorthands[cmd];
      noteText = noteText.substring(cmd.length).trim() || type.charAt(0).toUpperCase() + type.slice(1);
    }

    const instruction: Instruction = {
      id: crypto.randomUUID(),
      type,
      start_time: st,
      end_time: et,
      input_text: noteText,
      execution_status: 'todo',
      review_status: 'not_reviewed',
      round: project.review_round,
      created_at: new Date().toISOString(),
    };

    addInstruction(instruction);
    addAuditEntry({ role: 'reviewer', action: 'instruction_added', entry_id: instruction.id });

    // Reset
    setStartTime('');
    setEndTime('');
    setInputText('');
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-card rounded-lg border border-border">
      {/* Time inputs */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">
            <Clock className="w-3 h-3 inline mr-1" />Start
          </label>
          <Input
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            placeholder="0:00"
            className="bg-surface border-border font-mono text-sm h-8"
          />
        </div>
        <div className="flex-1">
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 block">
            End (opt)
          </label>
          <Input
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            placeholder="0:00"
            className="bg-surface border-border font-mono text-sm h-8"
          />
        </div>
      </div>

      {/* Notes input */}
      <Input
        ref={inputRef}
        data-notes-input
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
            return;
          }
        }}
        placeholder="Add note..."
        className="bg-surface border-border text-sm h-9"
      />

      <p className="text-[11px] text-muted-foreground">P start/end, S save, Enter exit, N focus, ←→ seek, Space play/pause.</p>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!canSubmit()}
        className="w-full gap-2"
        size="sm"
      >
        <Plus className="w-4 h-4" />
        Add Instruction
      </Button>
    </div>
  );
}
