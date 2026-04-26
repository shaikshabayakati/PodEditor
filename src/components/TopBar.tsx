import { useProjectStore } from '@/store/projectStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Upload, Eye, Pencil } from 'lucide-react';
import type { UserRole } from '@/types/ehp';
import { useRef, useEffect } from 'react';
import { toast } from 'sonner';

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || target.isContentEditable;
}

const ROLE_LABELS: Record<UserRole, { label: string; icon: React.ReactNode }> = {
  reviewer: { label: 'Reviewer', icon: <Pencil className="w-3.5 h-3.5" /> },
  editor: { label: 'Editor', icon: <Eye className="w-3.5 h-3.5" /> },
};

export default function TopBar() {
  const {
    project, activeRole, setActiveRole, setProjectTitle,
    exportProject, importProject,
  } = useProjectStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const json = exportProject();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.project_title.replace(/\s+/g, '_')}.ehp`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Project exported');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (importProject(text)) {
        toast.success('Project imported');
      } else {
        toast.error('Invalid .ehp file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleExport();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project.project_title, exportProject]);

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-card border-b border-border">
      {/* Title */}
      <Input
        value={project.project_title}
        onChange={(e) => setProjectTitle(e.target.value)}
        className="bg-transparent border-none text-base font-semibold w-48 h-8 px-1 focus-visible:ring-1"
      />

      <div className="flex-1" />

      {/* Role switcher */}
      <div className="flex items-center bg-surface rounded-lg p-0.5 gap-0.5">
        {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
          <button
            key={role}
            onClick={() => setActiveRole(role)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeRole === role
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {ROLE_LABELS[role].icon}
            {ROLE_LABELS[role].label}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <input ref={fileInputRef} type="file" accept=".ehp" className="hidden" onChange={handleImport} />
        <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} title="Import .ehp">
          <Upload className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleExport} title="Export .ehp">
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
