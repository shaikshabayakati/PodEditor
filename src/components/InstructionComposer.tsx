import React, { useEffect, useRef, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Instruction, InstructionType } from '@/types/ehp';
import { formatTime, parseTime, INSTRUCTION_LABELS, INSTRUCTION_CATEGORIES } from '@/types/ehp';
import { Plus, Check } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Timeline from './Timeline';

interface InstructionComposerProps {
  currentTime?: number;
  duration?: number;
  playbackRate?: number;
  onPlaybackRateChange?: (rate: number) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.hasAttribute('data-notes-input')) return true;
  if (target.hasAttribute('data-text-edit')) return true;
  if (target.hasAttribute('data-timeline-input')) return false;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || target.isContentEditable;
}

export default function InstructionComposer({ 
  currentTime = 0, 
  duration = 0, 
  playbackRate = 1, 
  onPlaybackRateChange,
  showSettings,
  setShowSettings
}: InstructionComposerProps) {
  const { addInstruction, project, addAuditEntry, activeRole, currentVideoTime } = useProjectStore();
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [type, setType] = useState<InstructionType>('note');
  const [inputText, setInputText] = useState('');
  const [selectedSection, setSelectedSection] = useState<string | undefined>(undefined);
  const [typeOpen, setTypeOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isReviewer = activeRole === 'reviewer';

  const canSubmit = () => {
    if (!startTime.trim()) return false;
    const st = parseTime(startTime.trim());
    if (st === null) return false;
    if (endTime.trim() && parseTime(endTime.trim()) === null) return false;
    return true;
  };

  const handleSubmit = () => {
    const stStr = startTime.trim();
    if (!stStr) return;
    const st = parseTime(stStr);
    if (st === null) return;
    
    const etStr = endTime.trim();
    const et = etStr ? parseTime(etStr) ?? undefined : undefined;

    let finalType = type;
    let finalText = inputText.trim();

    if (type === 'chapter') {
      if (finalText.toLowerCase().includes('end')) {
        finalType = 'chapter';
        const title = finalText.replace(/end/i, '').trim();
        finalText = title ? `[END] ${title}` : '[END] Section';
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
      section: selectedSection,
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
    setSelectedSection(undefined);
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLElement).blur();
    }
  };

  useEffect(() => {
    if (!isReviewer) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const isTyping = isTypingTarget(event.target);
      
      // Global shortcuts (only if not typing)
      if (!isTyping) {
        // I for In-point (Start Time)
        if (event.key.toLowerCase() === 'i') {
          event.preventDefault();
          setStartTime(formatTime(Math.max(0, Math.floor(currentVideoTime))));
          return;
        }

        // O for Out-point (End Time)
        if (event.key.toLowerCase() === 'o') {
          event.preventDefault();
          setEndTime(formatTime(Math.max(0, Math.floor(currentVideoTime))));
          return;
        }

        // T or Q for Type/Section selection
        if (event.key.toLowerCase() === 't' || event.key.toLowerCase() === 'q') {
          event.preventDefault();
          setTypeOpen(true);
          return;
        }

        // Enter to focus notes if we have at least a start time
        if (event.key === 'Enter' && startTime) {
          event.preventDefault();
          inputRef.current?.focus();
          return;
        }
      }

      // Contextual Save: Ctrl+Enter or Cmd+Enter (always works if valid)
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        if (canSubmit()) {
          event.preventDefault();
          handleSubmit();
        }
        return;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [currentVideoTime, isReviewer, startTime, endTime, type, selectedSection, inputText, project.review_round]);

  const getTypeLabel = (t: InstructionType): string => {
    return INSTRUCTION_LABELS[t];
  };

  return (
    <div className="flex flex-col gap-2 p-4 bg-card rounded-lg border border-border">
      {/* Timeline with seek slider */}
      <Timeline
        currentTime={currentTime}
        duration={duration}
        playbackRate={playbackRate}
        onPlaybackRateChange={onPlaybackRateChange || (() => {})}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
      />

      {/* Start, End, Type - all in one row */}
      <div className="flex gap-2">
        <div className="flex-1 min-w-0">
          <Input
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Start (I)"
            className="bg-surface border-border font-mono text-sm h-10 w-full"
          />
        </div>
        <div className="flex-1 min-w-0">
          <Input
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="End (O)"
            className="bg-surface border-border font-mono text-sm h-10 w-full"
          />
        </div>
        <div className="flex-1 min-w-0">
          <Popover open={typeOpen} onOpenChange={setTypeOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="w-full bg-surface border border-border rounded px-2 text-sm text-foreground h-10 flex flex-col items-start justify-center hover:border-primary/50 overflow-hidden"
              >
                <span className="text-[10px] text-muted-foreground leading-none mb-0.5 uppercase tracking-wider">Type</span>
                <div className="flex items-center gap-1 w-full">
                  <span className="truncate flex-1 text-left">{getTypeLabel(type)}</span>
                  <span className="text-[10px] text-muted-foreground opacity-50 flex-shrink-0">Q</span>
                </div>
                </button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-64" align="end">
                <Command>
                <CommandInput placeholder="Search type or section... (Q)" />

                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup heading="Types">
                    {(Object.entries(INSTRUCTION_CATEGORIES) as [string, InstructionType[]][]).map(([category, types]) => (
                      <React.Fragment key={category}>
                        {types.map((t) => (
                          <CommandItem
                            key={t}
                            onSelect={() => {
                              setType(t);
                              setTypeOpen(false);
                            }}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span className="capitalize">{getTypeLabel(t)}</span>
                              <span className="text-[10px] text-muted-foreground opacity-50">({category})</span>
                            </div>
                            {type === t && <Check className="w-4 h-4 text-primary" />}
                          </CommandItem>
                        ))}
                      </React.Fragment>
                    ))}
                  </CommandGroup>
                  {project.sections.length > 0 && (
                    <>
                      <CommandSeparator />
                      <CommandGroup heading="Sections">
                        {project.sections.map((section) => (
                          <CommandItem
                            key={section}
                            onSelect={() => {
                              setSelectedSection(section);
                              setTypeOpen(false);
                            }}
                            className="flex items-center justify-between"
                          >
                            <span className="truncate">{section}</span>
                            {selectedSection === section && <Check className="w-4 h-4 text-primary" />}
                          </CommandItem>
                        ))}
                        <CommandItem
                          onSelect={() => {
                            setSelectedSection(undefined);
                            setTypeOpen(false);
                          }}
                          className="text-muted-foreground"
                        >
                          Clear Section
                        </CommandItem>
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Section indicator if selected */}
      {selectedSection && (
        <div className="flex items-center gap-2 px-2 py-1 bg-primary/10 rounded text-xs text-primary">
          <span className="font-semibold uppercase text-[10px]">Section:</span>
          <span className="truncate">{selectedSection}</span>
          <button 
            onClick={() => setSelectedSection(undefined)}
            className="ml-auto hover:text-primary/70"
          >
            ✕
          </button>
        </div>
      )}

      {/* Notes input */}
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
        Add <span className="text-[10px] opacity-60 ml-1 font-normal">^↵</span>
      </Button>
    </div>
  );
}
