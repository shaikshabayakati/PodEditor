import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Upload, ArrowRight, PlayCircle, FolderOpen, CheckCircle2, Keyboard, Clapperboard, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useProjectStore } from '@/store/projectStore';

export default function LandingPage() {
  const navigate = useNavigate();
  const { setSourceUrl, importProject, resetProject } = useProjectStore();
  const [url, setUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const features = [
    {
      title: 'Timestamped Direction Board',
      description: 'Capture precise edit instructions while watching the source video, with start/end timing and context notes.',
      icon: <Clapperboard className="w-4 h-4" />,
    },
    {
      title: 'Fast Keyboard-First Workflow',
      description: 'Use quick shortcuts for play/pause, mark timestamps, and save instructions without breaking review flow.',
      icon: <Keyboard className="w-4 h-4" />,
    },
    {
      title: 'Shareable Project Files',
      description: 'Export and import .ehp files to hand off cleanly between reviewer and editor across revisions.',
      icon: <FolderOpen className="w-4 h-4" />,
    },
  ];

  const steps = [
    {
      title: 'Load Your Source',
      description: 'Paste a YouTube URL to begin a new review session in seconds.',
      icon: <PlayCircle className="w-4 h-4" />,
    },
    {
      title: 'Annotate With Precision',
      description: 'Mark timestamps, choose instruction type, and add clear editor-facing notes.',
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      title: 'Handoff And Validate',
      description: 'Track instruction status, iterate with comments, and close the revision loop.',
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
  ];

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
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-20 h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-1/4 -right-24 h-[20rem] w-[20rem] rounded-full bg-info/20 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/3 h-[22rem] w-[22rem] rounded-full bg-warning/15 blur-3xl" />
      </div>

      <main className="relative px-6 py-16 sm:py-24">
        <section className="mx-auto max-w-7xl rounded-2xl border border-border/70 bg-card/70 backdrop-blur-sm p-8 sm:p-12">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 sm:gap-14 items-start">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 text-primary text-sm uppercase tracking-wider font-semibold">
                Video Review Workflow
              </span>
              <h1 className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] text-foreground">
                Edit Handoff
                <span className="block text-primary">Without the Chaos</span>
              </h1>
              <p className="mt-5 text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                A focused workspace for reviewers and editors to collaborate on cut decisions, timestamped notes, and revision loops in one place.
              </p>

              <div className="mt-8 grid sm:grid-cols-3 gap-4">
                {steps.map((step, idx) => (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + idx * 0.08, duration: 0.35 }}
                    className="rounded-xl border border-border bg-surface/70 p-5"
                  >
                    <div className="flex items-center gap-2.5 text-primary text-sm font-semibold uppercase tracking-wider">
                      {step.icon}
                      Step {idx + 1}
                    </div>
                    <p className="mt-2 text-lg font-medium text-foreground">{step.title}</p>
                    <p className="mt-1.5 text-base text-muted-foreground leading-relaxed">{step.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.45 }}
              className="rounded-2xl border border-border bg-background/70 p-6 sm:p-8"
            >
              <h2 className="text-2xl font-semibold text-foreground">Start A Session</h2>
              <p className="text-base text-muted-foreground mt-2">
                Paste a YouTube link to create a fresh workspace, or import an existing handoff file.
              </p>

              <div className="mt-6 space-y-3">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="bg-surface border-border h-14 text-lg"
                  onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                />
                <Button onClick={handleStart} disabled={!url.trim()} className="w-full h-14 gap-3 text-lg">
                  Open Workspace <ArrowRight className="w-5 h-5" />
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t border-border/80">
                <input ref={fileInputRef} type="file" accept=".ehp" className="hidden" onChange={handleImport} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2.5 rounded-lg border border-dashed border-border px-4 py-4 text-base text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                >
                  <Upload className="w-5 h-5" /> Import .ehp Project
                </button>
              </div>

              <div className="mt-6 rounded-xl border border-border bg-surface/50 p-5">
                <p className="text-sm uppercase tracking-wider text-muted-foreground font-semibold">Quick Tips</p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-base text-foreground">
                  <span className="rounded-lg bg-background px-4 py-2.5 border border-border font-medium">P: Mark Time</span>
                  <span className="rounded-lg bg-background px-4 py-2.5 border border-border font-medium">S: Save Note</span>
                  <span className="rounded-lg bg-background px-4 py-2.5 border border-border font-medium">N: Focus Notes</span>
                  <span className="rounded-lg bg-background px-4 py-2.5 border border-border font-medium">Space: Play/Pause</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl mt-10 grid md:grid-cols-3 gap-5">
          {features.map((feature, idx) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + idx * 0.08, duration: 0.35 }}
              className="rounded-2xl border border-border/80 bg-card/70 p-6"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/15 text-primary">
                {feature.icon}
              </div>
              <h3 className="mt-4 text-xl font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-base text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.article>
          ))}
        </section>
      </main>
    </div>
  );
}
