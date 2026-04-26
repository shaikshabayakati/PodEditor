import { useProjectStore } from '@/store/projectStore';
import YouTubePlayer from './YouTubePlayer';
import InstructionComposer from './InstructionComposer';
import InstructionList from './InstructionList';
import TopBar from './TopBar';
import { Input } from '@/components/ui/input';
import { Video, Settings, CheckCircle, Clock, PlayCircle, XCircle, Link2 } from 'lucide-react';
import { formatTime } from '@/types/ehp';
import { useMemo, useState, useRef, useEffect } from 'react';
import type { ExecutionStatus } from '@/types/ehp';

const STATUS_CONFIG: Record<ExecutionStatus, { label: string; icon: React.ReactNode; color: string }> = {
  todo: { label: 'To Do', icon: <Clock className="w-3 h-3" />, color: 'text-muted-foreground' },
  in_progress: { label: 'In Progress', icon: <PlayCircle className="w-3 h-3" />, color: 'text-info' },
  done: { label: 'Done', icon: <CheckCircle className="w-3 h-3" />, color: 'text-success' },
  blocked: { label: 'Blocked', icon: <XCircle className="w-3 h-3" />, color: 'text-blocked' },
};

export default function Workspace() {
  const { project, activeRole, currentVideoTime, seekVideoTo, setEditedUrl, videoPlaybackRate, setVideoPlaybackRate } = useProjectStore();
  const [showSettings, setShowSettings] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(55);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const isReviewer = activeRole === 'reviewer';
  const isEditor = activeRole === 'editor';
  const showEditorPanel = isEditor && project.workflow_state !== 'draft';

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftPanelWidth(Math.min(90, Math.max(30, newWidth)));
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const videoUrl = isEditor
    ? project.edited_youtube_url || project.source_youtube_url
    : project.source_youtube_url;
  const videoDuration = Math.max(0, project.video_duration ?? 0);
  const clampedCurrent = Math.max(0, Math.min(currentVideoTime, videoDuration || currentVideoTime));

  const editorStats = useMemo(() => {
    const stats: Record<ExecutionStatus, number> = { todo: 0, in_progress: 0, done: 0, blocked: 0 };
    project.instructions.forEach((inst) => {
      stats[inst.execution_status]++;
    });
    return stats;
  }, [project.instructions]);

  const progressPercent = project.instructions.length > 0
    ? Math.round((editorStats.done / project.instructions.length) * 100)
    : 0;

  return (
    <div className="flex flex-col h-screen bg-background">
      <TopBar />

      <div className="flex-1 flex overflow-hidden" ref={containerRef}>
        {/* Left panel */}
        <div style={{ width: `${leftPanelWidth}%` }} className="flex flex-col border-r border-border">
          {/* Timeline - compact */}
          <div className="px-3 pt-2 pb-1 flex-shrink-0">
            <div className="rounded border border-border bg-surface px-2 py-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>{formatTime(Math.floor(clampedCurrent))}</span>
                <div className="flex items-center gap-1">
                  <span className="text-primary font-medium">{videoPlaybackRate}x</span>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-0.5 hover:bg-accent rounded"
                  >
                    <Settings className="w-3 h-3" />
                  </button>
                </div>
                <span>{formatTime(Math.floor(videoDuration))}</span>
              </div>
              {showSettings && (
                <div className="mt-1 flex gap-1">
                  {[0.5, 1, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setVideoPlaybackRate(rate)}
                      className={`px-1.5 py-0.5 text-[10px] rounded ${
                        videoPlaybackRate === rate
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-accent hover:bg-accent/80'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
              <input
                type="range"
                min={0}
                max={videoDuration > 0 ? videoDuration : 1}
                step={0.1}
                value={videoDuration > 0 ? clampedCurrent : 0}
                onChange={(e) => seekVideoTo(Number(e.target.value), false)}
                disabled={videoDuration <= 0}
                data-timeline-input
                className="h-1 w-full cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Video timeline"
              />
            </div>
          </div>

          {/* Video player - flex to fill available space */}
          <div className="flex-1 px-3 min-h-0">
            <YouTubePlayer url={videoUrl} className="h-full w-full" />
          </div>

          {/* Bottom: Composer (reviewer) or editor panel */}
          <div className="px-4 py-3 flex-shrink-0">
            {isReviewer && <InstructionComposer />}
            {showEditorPanel && (
<div className="space-y-2">
                {/* Progress Overview */}
                <div className="bg-card border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-foreground">Execution Progress</h3>
                    <span className="text-sm font-medium text-primary">{progressPercent}%</span>
                  </div>
                  <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-success transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    {(Object.keys(STATUS_CONFIG) as ExecutionStatus[]).map((status) => (
                      <div key={status} className="flex items-center gap-1">
                        <span className={STATUS_CONFIG[status].color}>{STATUS_CONFIG[status].icon}</span>
                        <span className="text-muted-foreground">
                          {STATUS_CONFIG[status].label}: <span className="font-medium text-foreground">{editorStats[status]}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Revised Video Link */}
                <div className="bg-card border border-border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Link2 className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Revised Video</h3>
                  </div>
                  <Input
                    value={project.edited_youtube_url || ''}
                    onChange={(e) => setEditedUrl(e.target.value)}
                    placeholder="Paste revised YouTube URL when complete"
                    className="bg-surface border-border text-sm h-8"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resizer handle */}
        <div
          className="w-1 cursor-col-resize hover:bg-primary/50 transition-colors flex-shrink-0"
          onMouseDown={(e) => {
            e.preventDefault();
            isDragging.current = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
          }}
        />

        {/* Right panel: instruction list */}
        <div className="flex-1 flex flex-col">
          <InstructionList />
        </div>
      </div>
    </div>
  );
}
