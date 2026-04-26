import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Upload, ArrowRight, Clapperboard, MousePointer2, Clock, MessageSquare, Users, FileJson, Settings2, Play, FastForward, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useProjectStore } from '@/store/projectStore';

export default function LandingPage() {
  const navigate = useNavigate();
  const { setSourceUrl, importProject, resetProject } = useProjectStore();
  const [url, setUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleStart = () => {
    if (!url.trim()) return;
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

  const painPoints = [
    'Switching between video player and notes',
    'Notes that don\'t match the frame',
    'Replaying clips to understand feedback',
    'Scattered instructions everywhere',
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Clapperboard className="w-6 h-6 text-primary" />
          <span className="text-lg font-semibold">EditFlow</span>
        </div>
    
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <button 
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="hover:text-foreground cursor-pointer transition-colors"
          >
            Features
          </button>
          <button 
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            className="hover:text-foreground cursor-pointer transition-colors"
          >
            How it Works
          </button>
        </nav>
      </header>

      <main className="px-6 py-16 sm:py-24">
        {/* Hero section */}
        <section className="mx-auto max-w-3xl text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-6">
              Review videos in one place
              <br />
              <span className="text-primary">no switching, no confusion</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto mb-10">
              Add timestamps, drop pointers, and leave clear edit instructions 
              directly on the video — all in a single workspace.
            </p>

            {/* Quick start form */}
            <div className="max-w-lg mx-auto mb-8">
              <div className="flex gap-2">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste YouTube URL..."
                  className="bg-surface border-border h-12 text-base"
                  onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                />
                <Button onClick={handleStart} disabled={!url.trim()} className="h-12 px-6 gap-2">
                  Start Review <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <Upload className="w-4 h-4" />
                Import .ehp file
              </button>
              <span className="text-border">•</span>
              <span className="text-muted-foreground">No account required</span>
              <input ref={fileInputRef} type="file" accept=".ehp" className="hidden" onChange={handleImport} />
            </div>
          </motion.div>
        </section>

        {/* Problem section */}
        <section className="mx-auto max-w-2xl mb-20">
          <h2 className="text-lg font-medium text-center mb-6">Stop losing context mid-edit</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {painPoints.map((pain) => (
              <div key={pain} className="flex items-center gap-2 p-3 rounded-lg bg-surface/50 text-sm text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive" />
                {pain}
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mx-auto max-w-3xl mb-20">
          <h2 className="text-2xl font-semibold text-center mb-10">One workspace, no switching</h2>
          <div className="flex flex-col gap-4">
            {[
              { 
                num: '1', 
                title: 'Review in-place', 
                desc: 'Watch the video, click anywhere, and add timestamped instructions instantly.',
                icon: <Play className="w-5 h-5" />
              },
              { 
                num: '2', 
                title: 'Everything stays connected', 
                desc: 'Notes, pointers, and timestamps stay attached to the exact moment.',
                icon: <MessageSquare className="w-5 h-5" />
              },
              { 
                num: '3', 
                title: 'Editor executes clearly', 
                desc: 'No guessing, no jumping between tools — just follow the instructions.',
                icon: <Users className="w-5 h-5" />
              },
            ].map((step, idx) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.1, duration: 0.4 }}
                className="flex items-center gap-4 p-5 rounded-xl border border-border bg-surface/50"
              >
                <span className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  {step.num}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-primary">{step.icon}</span>
                    <h3 className="font-medium text-foreground">{step.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
                {idx < 2 && <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto opacity-40" />}
              </motion.div>
            ))}
          </div>
        </section>

        {/* Features grid */}
        <section id="features" className="mx-auto max-w-5xl mb-20">
          <h2 className="text-2xl font-semibold text-center mb-12">Features built for flow</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: 'Click to timestamp',
                description: 'Click anywhere on the video and add a note instantly. Time is captured automatically.',
                icon: <MousePointer2 className="w-5 h-5" />,
              },
              {
                title: 'Keyboard-first',
                description: 'Keep your hands on the keys. P marks time, S saves, Space plays—all without clicking.',
                icon: <FastForward className="w-5 h-5" />,
              },
              {
                title: 'Visual timeline',
                description: 'See markers for every instruction. Click to jump to that exact moment.',
                icon: <Clock className="w-5 h-5" />,
              },
              {
                title: 'Organized tabs',
                description: 'Group instructions by scene, round, or category. Like worksheets for your review.',
                icon: <FileJson className="w-5 h-5" />,
              },
              {
                title: 'Status tracking',
                description: 'Track every instruction. Know what\'s done, what\'s pending.',
                icon: <Settings2 className="w-5 h-5" />,
              },
              {
                title: 'Portable files',
                description: 'Export as .ehp file. Send to your editor. No accounts, no sync.',
                icon: <Upload className="w-5 h-5" />,
              },
            ].map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.05, duration: 0.4 }}
                className="p-5 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3">
                  {feature.icon}
                </div>
                <h3 className="font-medium text-foreground mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Who it's for */}
        <section className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-semibold mb-4">Who it&apos;s for</h2>
          <p className="text-muted-foreground mb-4">
            If you&apos;ve ever paused a video to write notes somewhere else — 
            this is for you.
          </p>
          <p className="text-sm text-muted-foreground">
            Creators tired of reviewing over notes apps. Editors dealing with unclear feedback. 
            Teams working on long-form videos.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        <p>Built for video reviewers and editors who value their time.</p>
      </footer>
    </div>
  );
}