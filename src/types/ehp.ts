export type InstructionType =
  | 'delete' | 'reorder' | 'chapter'
  | 'text' | 'big_text' | 'small_text' | 'chapter_heading'
  | 'single_screen' | 'double_screen' | 'change'
  | 'image' | 'footage'
  | 'note';

export type ClipType = 'reel_candidate' | 'teaser_candidate' | 'interesting_moment';

export const INSTRUCTION_TYPES: InstructionType[] = ['note', 'delete', 'image', 'text', 'chapter'];

export type ExecutionStatus = 'todo' | 'in_progress' | 'done' | 'blocked';
export type ReviewStatus = 'not_reviewed' | 'approved' | 'needs_revision';

export type WorkflowState =
  | 'draft' | 'sent_to_editor' | 'editor_in_progress'
  | 'revision_requested' | 'approved_complete';

export type UserRole = 'reviewer' | 'editor';

export interface Instruction {
  id: string;
  type: InstructionType;
  start_time: number; // seconds
  end_time?: number;
  destination_start_time?: number; // for reorder
  input_text: string;
  clip_type?: ClipType;
  clip_note?: string;
  section?: string;
  execution_status: ExecutionStatus;
  review_status: ReviewStatus;
  editor_note?: string;
  clarification_flag?: boolean;
  actual_implemented_start?: number;
  actual_implemented_end?: number;
  round: number;
  created_at: string;
}

export interface AuditEntry {
  timestamp: string;
  role: UserRole;
  action: string;
  entry_id?: string;
}

export interface Tab {
  id: string;
  name: string;
  instruction_ids: string[];
}

export interface EHPProject {
  schema_version: string;
  project_type: string;
  project_id: string;
  project_title: string;
  workflow_state: WorkflowState;
  review_round: number;
  ownership: {
    reviewer_id: string;
    reviewer_name: string;
  };
  source_youtube_url: string;
  edited_youtube_url?: string;
  video_duration?: number;
  sections: string[];
  instructions: Instruction[];
  tabs: Tab[];
  active_tab_id: string;
  dictionary: string[];
  audit_log: AuditEntry[];
}

export const INSTRUCTION_LABELS: Record<InstructionType, string> = {
  delete: 'Delete',
  reorder: 'Reorder',
  chapter: 'Chapter',
  text: 'Text',
  big_text: 'Big Text',
  small_text: 'Small Text',
  chapter_heading: 'Chapter Heading',
  single_screen: 'Single Screen',
  double_screen: 'Double Screen',
  change: 'Change',
  image: 'Image',
  footage: 'Footage',
  note: 'Note',
};

export const INSTRUCTION_CATEGORIES = {
  structural: ['delete', 'reorder', 'chapter'] as InstructionType[],
  on_screen: ['text', 'big_text', 'small_text', 'chapter_heading'] as InstructionType[],
  visual: ['single_screen', 'double_screen', 'change'] as InstructionType[],
  asset: ['image', 'footage'] as InstructionType[],
  general: ['note'] as InstructionType[],
};

export const RANGE_BASED_TYPES: InstructionType[] = ['delete', 'reorder', 'chapter'];

export function isRangeBased(type: InstructionType): boolean {
  return RANGE_BASED_TYPES.includes(type);
}

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function parseTime(str: string): number | null {
  const parts = str.split(':').map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return null;
}

export function createEmptyProject(): EHPProject {
  const defaultTabId = crypto.randomUUID();
  return {
    schema_version: '1.0.0',
    project_type: 'edit_handoff',
    project_id: crypto.randomUUID(),
    project_title: 'Untitled Project',
    workflow_state: 'draft',
    review_round: 1,
    ownership: { reviewer_id: 'local', reviewer_name: 'Reviewer' },
    source_youtube_url: '',
    sections: [],
    instructions: [],
    tabs: [{ id: defaultTabId, name: 'Main', instruction_ids: [] }],
    active_tab_id: defaultTabId,
    dictionary: [
      'Remove repetition', 'Tighten this section', 'Add b-roll',
      'Insert graph link', 'Speed up', 'Add transition',
      'Cut dead air', 'Emphasize this point',
    ],
    audit_log: [],
  };
}
