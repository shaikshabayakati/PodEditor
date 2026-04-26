import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { EHPProject, Instruction, UserRole, WorkflowState, AuditEntry, Tab } from '@/types/ehp';
import { createEmptyProject } from '@/types/ehp';

const STORAGE_KEY = 'ehp-project-store';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeImportedProject(value: unknown): EHPProject | null {
  if (!isRecord(value)) return null;

  const fallback = createEmptyProject();
  const schemaVersion = typeof value.schema_version === 'string' ? value.schema_version : '';
  const projectId = typeof value.project_id === 'string' ? value.project_id : '';

  if (!schemaVersion || !projectId) return null;

  const tabs: Tab[] = Array.isArray(value.tabs)
    ? (value.tabs as Tab[]).filter((t): t is Tab => isRecord(t) && typeof t.id === 'string' && typeof t.name === 'string')
    : fallback.tabs;
  const activeTabId = typeof value.active_tab_id === 'string' && tabs.some(t => t.id === value.active_tab_id)
    ? value.active_tab_id
    : tabs[0]?.id ?? fallback.active_tab_id;

  return {
    ...fallback,
    ...value,
    schema_version: schemaVersion,
    project_id: projectId,
    project_type: typeof value.project_type === 'string' ? value.project_type : fallback.project_type,
    project_title: typeof value.project_title === 'string' ? value.project_title : fallback.project_title,
    workflow_state:
      typeof value.workflow_state === 'string'
        ? (value.workflow_state as EHPProject['workflow_state'])
        : fallback.workflow_state,
    review_round: typeof value.review_round === 'number' ? value.review_round : fallback.review_round,
    ownership: isRecord(value.ownership)
      ? {
          reviewer_id:
            typeof value.ownership.reviewer_id === 'string'
              ? value.ownership.reviewer_id
              : fallback.ownership.reviewer_id,
          reviewer_name:
            typeof value.ownership.reviewer_name === 'string'
              ? value.ownership.reviewer_name
              : fallback.ownership.reviewer_name,
        }
      : fallback.ownership,
    source_youtube_url:
      typeof value.source_youtube_url === 'string'
        ? value.source_youtube_url
        : fallback.source_youtube_url,
    edited_youtube_url:
      typeof value.edited_youtube_url === 'string' ? value.edited_youtube_url : undefined,
    video_duration:
      typeof value.video_duration === 'number' && value.video_duration >= 0
        ? value.video_duration
        : undefined,
    sections: Array.isArray(value.sections)
      ? value.sections.filter((section): section is string => typeof section === 'string')
      : fallback.sections,
    instructions: Array.isArray(value.instructions)
      ? (value.instructions as Instruction[])
      : fallback.instructions,
    tabs,
    active_tab_id: activeTabId,
    dictionary: Array.isArray(value.dictionary)
      ? value.dictionary.filter((item): item is string => typeof item === 'string')
      : fallback.dictionary,
    audit_log: Array.isArray(value.audit_log)
      ? (value.audit_log as AuditEntry[])
      : fallback.audit_log,
  };
}

interface SeekRequest {
  seconds: number;
  autoplay: boolean;
  requestId: number;
}

interface ProjectStore {
  project: EHPProject;
  activeRole: UserRole;
  currentVideoTime: number;
  seekRequest: SeekRequest | null;
  videoPlaybackRate: number;
  setActiveRole: (role: UserRole) => void;
  setCurrentVideoTime: (seconds: number) => void;
  seekVideoTo: (seconds: number, autoplay?: boolean) => void;
  clearSeekRequest: () => void;
  setVideoPlaybackRate: (rate: number) => void;
  setProject: (project: EHPProject) => void;
  setSourceUrl: (url: string) => void;
  setEditedUrl: (url: string) => void;
  setProjectTitle: (title: string) => void;
  setVideoDuration: (d: number) => void;
  addInstruction: (instruction: Instruction) => void;
  updateInstruction: (id: string, updates: Partial<Instruction>) => void;
  removeInstruction: (id: string) => void;
  addTab: (name: string) => void;
  renameTab: (id: string, name: string) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  addInstructionToTab: (instructionId: string, tabId?: string) => void;
  removeInstructionFromTab: (instructionId: string, tabId?: string) => void;
  getActiveTabInstructions: () => Instruction[];
  setWorkflowState: (state: WorkflowState) => void;
  addAuditEntry: (entry: Omit<AuditEntry, 'timestamp'>) => void;
  addDictionaryPhrase: (phrase: string) => void;
  exportProject: () => string;
  importProject: (json: string) => boolean;
  resetProject: () => void;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      project: createEmptyProject(),
      activeRole: 'reviewer',
      currentVideoTime: 0,
      seekRequest: null,
      videoPlaybackRate: 1,

      setActiveRole: (role) => set({ activeRole: role }),
      setCurrentVideoTime: (seconds) => set({ currentVideoTime: seconds }),
      seekVideoTo: (seconds, autoplay = true) =>
        set((s) => ({
          seekRequest: {
            seconds: Math.max(0, seconds),
            autoplay,
            requestId: (s.seekRequest?.requestId ?? 0) + 1,
          },
        })),
      clearSeekRequest: () => set({ seekRequest: null }),
      setVideoPlaybackRate: (rate) => set({ videoPlaybackRate: rate }),
      setProject: (project) => set({ project }),
      setSourceUrl: (url) =>
        set((s) => ({ project: { ...s.project, source_youtube_url: url } })),
      setEditedUrl: (url) =>
        set((s) => ({ project: { ...s.project, edited_youtube_url: url } })),
      setProjectTitle: (title) =>
        set((s) => ({ project: { ...s.project, project_title: title } })),
      setVideoDuration: (d) =>
        set((s) => ({ project: { ...s.project, video_duration: d } })),
      addInstruction: (instruction) =>
        set((s) => {
          const p = {
            ...s.project,
            instructions: [...s.project.instructions, instruction],
            tabs: s.project.tabs.map((t) =>
              t.id === s.project.active_tab_id
                ? { ...t, instruction_ids: [...t.instruction_ids, instruction.id] }
                : t
            ),
          };
          return { project: p };
        }),
      updateInstruction: (id, updates) =>
        set((s) => ({
          project: {
            ...s.project,
            instructions: s.project.instructions.map((i) =>
              i.id === id ? { ...i, ...updates } : i
            ),
          },
        })),
      removeInstruction: (id) =>
        set((s) => ({
          project: {
            ...s.project,
            instructions: s.project.instructions.filter((i) => i.id !== id),
            tabs: s.project.tabs.map((t) => ({
              ...t,
              instruction_ids: t.instruction_ids.filter((iid) => iid !== id),
            })),
          },
        })),
      addTab: (name) =>
        set((s) => {
          const newTab: Tab = { id: crypto.randomUUID(), name, instruction_ids: [] };
          return { project: { ...s.project, tabs: [...s.project.tabs, newTab], active_tab_id: newTab.id } };
        }),
      renameTab: (id, name) =>
        set((s) => ({
          project: {
            ...s.project,
            tabs: s.project.tabs.map((t) => (t.id === id ? { ...t, name } : t)),
          },
        })),
      removeTab: (id) =>
        set((s) => {
          if (s.project.tabs.length <= 1) return s;
          const newTabs = s.project.tabs.filter((t) => t.id !== id);
          const newActiveId = s.project.active_tab_id === id ? newTabs[0].id : s.project.active_tab_id;
          return { project: { ...s.project, tabs: newTabs, active_tab_id: newActiveId } };
        }),
      setActiveTab: (id) =>
        set((s) => ({ project: { ...s.project, active_tab_id: id } })),
      addInstructionToTab: (instructionId, tabId) =>
        set((s) => {
          const targetTabId = tabId ?? s.project.active_tab_id;
          return {
            project: {
              ...s.project,
              tabs: s.project.tabs.map((t) =>
                t.id === targetTabId && !t.instruction_ids.includes(instructionId)
                  ? { ...t, instruction_ids: [...t.instruction_ids, instructionId] }
                  : t
              ),
            },
          };
        }),
      removeInstructionFromTab: (instructionId, tabId) =>
        set((s) => {
          const targetTabId = tabId ?? s.project.active_tab_id;
          return {
            project: {
              ...s.project,
              tabs: s.project.tabs.map((t) =>
                t.id === targetTabId
                  ? { ...t, instruction_ids: t.instruction_ids.filter((id) => id !== instructionId) }
                  : t
              ),
            },
          };
        }),
      getActiveTabInstructions: () => {
        const s = get();
        const activeTab = s.project.tabs.find((t) => t.id === s.project.active_tab_id);
        if (!activeTab) return s.project.instructions;
        return activeTab.instruction_ids
          .map((id) => s.project.instructions.find((i) => i.id === id))
          .filter((i): i is Instruction => i !== undefined);
      },
      setWorkflowState: (state) =>
        set((s) => ({ project: { ...s.project, workflow_state: state } })),
      addAuditEntry: (entry) =>
        set((s) => ({
          project: {
            ...s.project,
            audit_log: [...s.project.audit_log, { ...entry, timestamp: new Date().toISOString() }],
          },
        })),
      addDictionaryPhrase: (phrase) =>
        set((s) => ({
          project: {
            ...s.project,
            dictionary: s.project.dictionary.includes(phrase)
              ? s.project.dictionary
              : [...s.project.dictionary, phrase],
          },
        })),
      exportProject: () => {
        const p = get().project;
        return JSON.stringify(p, null, 2);
      },
      importProject: (json) => {
        try {
          const parsed = JSON.parse(json) as unknown;
          const project = normalizeImportedProject(parsed);
          if (!project) return false;
          set({ project });
          return true;
        } catch {
          return false;
        }
      },
      resetProject: () => set({ project: createEmptyProject(), activeRole: 'reviewer' }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        project: state.project,
        activeRole: state.activeRole,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<ProjectStore>;
        const normalizedProject = normalizeImportedProject(persisted.project);

        return {
          ...currentState,
          ...persisted,
          project: normalizedProject ?? currentState.project,
          activeRole: persisted.activeRole ?? currentState.activeRole,
          currentVideoTime: currentState.currentVideoTime,
          seekRequest: null,
        };
      },
    }
  )
);