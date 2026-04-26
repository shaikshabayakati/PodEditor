import { useProjectStore } from '@/store/projectStore';
import type { Instruction, ExecutionStatus, ReviewStatus } from '@/types/ehp';
import { INSTRUCTION_LABELS, formatTime, isRangeBased, parseTime } from '@/types/ehp';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Clock, ArrowRight, Flag, MessageSquare, Check, X, AlertTriangle, Pencil, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

const STATUS_COLORS: Record<ExecutionStatus, string> = {
  todo: 'bg-muted text-muted-foreground',
  in_progress: 'bg-info/20 text-info',
  done: 'bg-success/20 text-success',
  blocked: 'bg-blocked/20 text-blocked',
};

const REVIEW_COLORS: Record<ReviewStatus, string> = {
  not_reviewed: 'bg-muted text-muted-foreground',
  approved: 'bg-success/20 text-success',
  needs_revision: 'bg-warning/20 text-warning',
};

const TYPE_COLORS: Record<string, string> = {
  delete: 'border-l-blocked',
  image: 'border-l-warning',
  text: 'border-l-info',
  note: 'border-l-muted-foreground',
  chapter: 'border-l-primary',
};

interface InstructionCardProps {
  instruction: Instruction;
}

export default function InstructionCard({ instruction: inst }: InstructionCardProps) {
  const { activeRole, updateInstruction, removeInstruction, addAuditEntry, seekVideoTo } = useProjectStore();
  const [expanded, setExpanded] = useState(false);
  const [isReviewerEditing, setIsReviewerEditing] = useState(false);
  const [editStartTime, setEditStartTime] = useState(formatTime(inst.start_time));
  const [editEndTime, setEditEndTime] = useState(inst.end_time != null ? formatTime(inst.end_time) : '');
  const [editDestinationTime, setEditDestinationTime] = useState(
    inst.destination_start_time != null ? formatTime(inst.destination_start_time) : ''
  );
  const [editInputText, setEditInputText] = useState(inst.input_text || '');
  const [editError, setEditError] = useState('');

  const borderColor = TYPE_COLORS[inst.type] || 'border-l-primary';
  const isEditor = activeRole === 'editor';
  const isReviewer = activeRole === 'reviewer';

  const cycleStatus = () => {
    if (!isEditor) return;
    const order: ExecutionStatus[] = ['todo', 'in_progress', 'done', 'blocked'];
    const next = order[(order.indexOf(inst.execution_status) + 1) % order.length];
    updateInstruction(inst.id, { execution_status: next });
    addAuditEntry({ role: 'editor', action: `execution_marked_${next}`, entry_id: inst.id });
  };

  const toggleDone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditor) return;
    const newStatus = inst.execution_status === 'done' ? 'todo' : 'done';
    updateInstruction(inst.id, { execution_status: newStatus });
    addAuditEntry({ role: 'editor', action: `execution_marked_${newStatus}`, entry_id: inst.id });
  };

  const jumpToTime = (e: React.MouseEvent<HTMLElement>, seconds: number) => {
    e.stopPropagation();
    seekVideoTo(seconds, true);
  };

  const beginReviewerEdit = () => {
    setEditStartTime(formatTime(inst.start_time));
    setEditEndTime(inst.end_time != null ? formatTime(inst.end_time) : '');
    setEditDestinationTime(inst.destination_start_time != null ? formatTime(inst.destination_start_time) : '');
    setEditInputText(inst.input_text || '');
    setEditError('');
    setIsReviewerEditing(true);
  };

  const saveReviewerEdit = () => {
    const parsedStart = parseTime(editStartTime);
    if (parsedStart == null) {
      setEditError('Start time is invalid. Use mm:ss or hh:mm:ss.');
      return;
    }

    let parsedEnd: number | undefined;
    if (editEndTime.trim()) {
      const v = parseTime(editEndTime);
      if (v == null) {
        setEditError('End time is invalid. Use mm:ss or hh:mm:ss.');
        return;
      }
      parsedEnd = v;
    }

    if (isRangeBased(inst.type) && parsedEnd == null) {
      setEditError('End time is required for this instruction type.');
      return;
    }

    if (parsedEnd != null && parsedEnd < parsedStart) {
      setEditError('End time must be greater than or equal to start time.');
      return;
    }

    let parsedDestination: number | undefined;
    if (inst.type === 'reorder') {
      const v = parseTime(editDestinationTime);
      if (v == null) {
        setEditError('Move-to time is required for reorder.');
        return;
      }
      parsedDestination = v;
    }

    updateInstruction(inst.id, {
      start_time: parsedStart,
      end_time: parsedEnd,
      destination_start_time: parsedDestination,
      input_text: editInputText,
    });
    addAuditEntry({ role: 'reviewer', action: 'instruction_edited', entry_id: inst.id });
    setEditError('');
    setIsReviewerEditing(false);
  };

const isChapterStart = inst.type === 'chapter' && !inst.input_text.includes('[END]');
  const isChapterEnd = inst.type === 'chapter' && inst.input_text.includes('[END]');
  const chapterLabel = inst.input_text.replace('[END]', '').trim() || 'Section';
  const [isEditingChapter, setIsEditingChapter] = useState(false);
  const [editChapterText, setEditChapterText] = useState(chapterLabel);

  const saveChapterEdit = () => {
    updateInstruction(inst.id, { input_text: editChapterText });
    setIsEditingChapter(false);
  };

  if (isChapterStart) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="px-3 py-2 rounded-lg border border-primary/30 bg-primary/10"
      >
        {isEditingChapter && isReviewer ? (
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold bg-primary text-primary-foreground">
              Chapter
            </span>
            <Input
              value={editChapterText}
              onChange={(e) => setEditChapterText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveChapterEdit();
                if (e.key === 'Escape') setIsEditingChapter(false);
              }}
              className="flex-1 h-7 text-sm"
              autoFocus
            />
            <button
              onClick={saveChapterEdit}
              className="p-1 hover:bg-primary/20 rounded text-primary"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={() => setIsEditingChapter(false)}
              className="p-1 hover:bg-destructive/20 rounded text-destructive"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold bg-primary text-primary-foreground">
              Chapter
            </span>
            <p 
              className="text-sm font-medium text-foreground truncate cursor-pointer hover:underline"
              onClick={() => isReviewer && setIsEditingChapter(true)}
            >{chapterLabel}</p>
            <span className="text-xs font-mono text-muted-foreground">[{formatTime(inst.start_time)}]</span>
            {isReviewer && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeInstruction(inst.id);
                }}
                className="ml-auto p-1 hover:bg-destructive/20 rounded text-destructive"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </motion.div>
    );
  }

  if (isChapterEnd) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="px-3 py-2 rounded-lg border border-border bg-surface"
      >
        {isEditingChapter && isReviewer ? (
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold bg-muted text-muted-foreground">
              Chapter End
            </span>
            <Input
              value={editChapterText}
              onChange={(e) => setEditChapterText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveChapterEdit();
                if (e.key === 'Escape') setIsEditingChapter(false);
              }}
              className="flex-1 h-7 text-sm"
              autoFocus
            />
            <button
              onClick={saveChapterEdit}
              className="p-1 hover:bg-primary/20 rounded text-primary"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={() => setIsEditingChapter(false)}
              className="p-1 hover:bg-destructive/20 rounded text-destructive"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold bg-muted text-muted-foreground">
              Chapter End
            </span>
            <p 
              className="text-sm truncate cursor-pointer hover:underline"
              onClick={() => isReviewer && setIsEditingChapter(true)}
            >{chapterLabel}</p>
            <span className="text-xs font-mono text-muted-foreground">[{formatTime(inst.start_time)}]</span>
            {isReviewer && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeInstruction(inst.id);
                }}
                className="ml-auto p-1 hover:bg-destructive/20 rounded text-destructive"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </motion.div>
    );
  }

  return (
        <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`bg-card border border-border rounded-lg overflow-hidden border-l-2 ${borderColor}`}
    >
      <div
        className="p-3 cursor-pointer hover:bg-surface-hover transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-2">
          {isEditor && (
            <button
              onClick={toggleDone}
              className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                inst.execution_status === 'done'
                  ? 'bg-success border-success text-white'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              {inst.execution_status === 'done' && <CheckCircle2 className="w-3.5 h-3.5" />}
            </button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-primary">
                {INSTRUCTION_LABELS[inst.type]}
              </span>
              {inst.clip_type && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-subtle text-primary">
                  {inst.clip_type === 'reel_candidate' ? '🎬' : inst.clip_type === 'teaser_candidate' ? '📢' : '⭐'}
                </span>
              )}
              {inst.clarification_flag && (
                <AlertTriangle className="w-3 h-3 text-warning" />
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
              <Clock className="w-3 h-3" />
              <button
                onClick={(e) => jumpToTime(e, inst.start_time)}
                className="hover:text-primary transition-colors"
                title="Jump to timestamp"
              >
                {formatTime(inst.start_time)}
              </button>
              {inst.end_time != null && (
                <>
                  <ArrowRight className="w-3 h-3" />
                  <button
                    onClick={(e) => jumpToTime(e, inst.end_time!)}
                    className="hover:text-primary transition-colors"
                    title="Jump to timestamp"
                  >
                    {formatTime(inst.end_time)}
                  </button>
                </>
              )}
              {inst.destination_start_time != null && (
                <button
                  onClick={(e) => jumpToTime(e, inst.destination_start_time!)}
                  className="text-info ml-1 hover:text-primary transition-colors"
                  title="Jump to timestamp"
                >
                  → {formatTime(inst.destination_start_time)}
                </button>
              )}
            </div>
            {inst.input_text && (
              <p className="text-sm text-foreground mt-1.5 truncate">{inst.input_text}</p>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-0 space-y-2 border-t border-border">
              {/* Editor note */}
              {isEditor && (
                <div className="mt-2">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                    <MessageSquare className="w-3 h-3 inline mr-1" />Editor Note
                  </label>
                  <Input
                    value={inst.editor_note || ''}
                    onChange={(e) => updateInstruction(inst.id, { editor_note: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Add note..."
                    className="bg-surface border-border text-sm h-8"
                  />
                </div>
              )}

              {/* Editor: clarification flag */}
              {isEditor && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateInstruction(inst.id, { clarification_flag: !inst.clarification_flag });
                  }}
                  className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors ${
                    inst.clarification_flag ? 'bg-warning/20 text-warning' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Flag className="w-3 h-3" />
                  {inst.clarification_flag ? 'Clarification needed' : 'Flag for clarification'}
                </button>
              )}

              {/* Reviewer: edit/remove */}
              {isReviewer && (
                <>
                  {isReviewerEditing && (
                    <div className="mt-2 space-y-2 p-2 rounded border border-border bg-surface/40">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Start</label>
                          <Input
                            value={editStartTime}
                            onChange={(e) => setEditStartTime(e.target.value)}
                            placeholder="0:00"
                            className="bg-background border-border font-mono text-sm h-8"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                            End {isRangeBased(inst.type) ? '' : '(optional)'}
                          </label>
                          <Input
                            value={editEndTime}
                            onChange={(e) => setEditEndTime(e.target.value)}
                            placeholder="0:00"
                            className="bg-background border-border font-mono text-sm h-8"
                          />
                        </div>
                        {inst.type === 'reorder' && (
                          <div>
                            <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Move to</label>
                            <Input
                              value={editDestinationTime}
                              onChange={(e) => setEditDestinationTime(e.target.value)}
                              placeholder="0:00"
                              className="bg-background border-border font-mono text-sm h-8"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">
                          Notes / Directions
                        </label>
                        <Input
                          data-text-edit
                          value={editInputText}
                          onChange={(e) => setEditInputText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              e.stopPropagation();
                              saveReviewerEdit();
                            }
                          }}
                          placeholder="Add or update directions..."
                          className="bg-background border-border text-sm h-8"
                        />
                      </div>

                      {editError && <p className="text-xs text-warning">{editError}</p>}

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            saveReviewerEdit();
                          }}
                          className="px-2 py-1 text-xs rounded border border-border hover:bg-surface"
                        >
                          Save
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsReviewerEditing(false);
                            setEditError('');
                          }}
                          className="px-2 py-1 text-xs rounded border border-border hover:bg-surface"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isReviewerEditing) {
                          setIsReviewerEditing(false);
                          setEditError('');
                          return;
                        }
                        beginReviewerEdit();
                      }}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="w-3 h-3" /> {isReviewerEditing ? 'Close Edit' : 'Edit'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeInstruction(inst.id); }}
                      className="flex items-center gap-1 text-xs text-blocked hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Remove
                    </button>
                  </div>
                </>
              )}

{inst.editor_note && !isEditor && (
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-[10px] uppercase tracking-wider">Editor: </span>{inst.editor_note}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
