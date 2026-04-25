import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Upload, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useProjectStore } from '@/store/projectStore';

const STATE_LABELS: Record<string, string> = {
  draft: 'Draft',
  sent_to_editor: 'Sent',
  editor_in_progress: 'Editing',
  revision_requested: 'Revision',
  approved_complete: 'Done',
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { setSourceUrl, importProject, resetProject } = useProjectStore();
  const [url, setUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStart = () => {
    if (!url.trim()) return;
    // Start a fresh project to avoid carrying over previously imported state.
    resetProject();
    setSourceUrl(url.trim());
    navigate('/workspace');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (importProject(text)) {
        toast.success('Project imported');
        navigate('/workspace');
      } else {
        toast.error('Invalid .ehp file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main content */}
      <main className="flex flex-col items-center px-4 pt-16 sm:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
            Edit Handoff <span className="text-primary">Pro</span>
          </h1>
          <p className="text-muted-foreground mt-3 text-sm max-w-md mx-auto">
            Review videos, hand off editing instructions, and validate revised cuts — all in one clean workflow.
          </p>
        </motion.div>

        {/* URL input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="w-full max-w-lg"
        >
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube URL"
              className="bg-surface border-border h-12 text-base flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            />
            <Button onClick={handleStart} disabled={!url.trim()} className="h-12 px-6 gap-2">
              Start <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex justify-center mt-4">
            <input ref={fileInputRef} type="file" accept=".ehp" className="hidden" onChange={handleImport} />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Upload className="w-3.5 h-3.5" /> Import Project File (.ehp)
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
