import { useProjectStore } from '@/store/projectStore';
import YouTubePlayer from './YouTubePlayer';
import InstructionComposer from './InstructionComposer';
import InstructionList from './InstructionList';
import TopBar from './TopBar';
import { Input } from '@/components/ui/input';
import { Video, Settings, CheckCircle, Clock, PlayCircle, XCircle, Link2 } from 'lucide-react';
import { formatTime } from '@/types/ehp';
import { useMemo, useState } from 'react';
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

  const isReviewer = activeRole === 'reviewer';
  const isEditor = activeRole === 'editor';
  const showEditorPanel = isEditor && project.workflow_state !== 'draft';

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

      <div className="flex-1 flex overflow-hidden">
        {/* Left panel (stacked) */}
        <div className="w-[55%] flex flex-col border-r border-border">
          {/* Timeline */}
          <div className="px-4 pt-3 pb-2">
            <div className="rounded-lg border border-border bg-surface px-3 py-2">
              <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span>{formatTime(Math.floor(clampedCurrent))}</span>
                <div className="flex items-center gap-2">
                  <span className="text-primary font-medium">{videoPlaybackRate}x</span>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-1 hover:bg-accent rounded"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span>{formatTime(Math.floor(videoDuration))}</span>
              </div>
              {showSettings && (
                <div className="mb-2 space-y-2">
                  <div className="flex gap-1 flex-wrap">
                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setVideoPlaybackRate(rate)}
                        className={`px-2 py-1 text-xs rounded ${
                          videoPlaybackRate === rate
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-accent hover:bg-accent/80'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Speed controls video playback rate. YouTube auto-adjusts quality.</div>
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
                className="h-1 w-full cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Video timeline"
              />
            </div>
          </div>

          {/* Video player */}
          <div className="px-4 pb-3 flex-shrink-0">
            <YouTubePlayer url={videoUrl} className="aspect-video" />
          </div>

          {/* Bottom: Composer (reviewer) or editor panel */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {isReviewer && <InstructionComposer />}
            {showEditorPanel && (
              <div className="space-y-3">
                {/* Progress Overview */}
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-foreground">Execution Progress</h3>
                    <span className="text-sm font-medium text-primary">{progressPercent}%</span>
                  </div>
                  <div className="h-2 bg-surface rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-success transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    {(Object.keys(STATUS_CONFIG) as ExecutionStatus[]).map((status) => (
                      <div key={status} className="flex items-center gap-1.5">
                        <span className={STATUS_CONFIG[status].color}>{STATUS_CONFIG[status].icon}</span>
                        <span className="text-xs text-muted-foreground">
                          {STATUS_CONFIG[status].label}: <span className="font-medium text-foreground">{editorStats[status]}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Revised Video Link */}
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Link2 className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Revised Video</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Paste the final revised YouTube URL when editing is complete.
                  </p>
                  <Input
                    value={project.edited_youtube_url || ''}
                    onChange={(e) => setEditedUrl(e.target.value)}
                    placeholder="Paste revised YouTube URL..."
                    className="bg-surface border-border text-sm h-9"
                  />
                </div>

                {/* Quick Actions */}
                <div className="bg-card border border-border rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Instructions Guide</h3>
                  <div className="text-xs text-muted-foreground space-y-2">
                    <p>• Click on any instruction to update its status</p>
                    <p>• Add actual timestamps where edits were applied</p>
                    <p>• Use editor notes to provide feedback</p>
                    <p>• Flag unclear instructions as blocked</p>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>

        {/* Right panel: instruction list */}
        <div className="flex-1 flex flex-col">
          <InstructionList />
        </div>
      </div>
    </div>
  );
}
