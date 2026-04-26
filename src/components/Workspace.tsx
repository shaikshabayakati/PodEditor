import { useProjectStore } from '@/store/projectStore';
import YouTubePlayer from './YouTubePlayer';
import InstructionComposer from './InstructionComposer';
import InstructionList from './InstructionList';
import TopBar from './TopBar';
import { useState, useRef, useEffect } from 'react';
import Timeline from './Timeline';

export default function Workspace() {
  const { project, activeRole, currentVideoTime, videoPlaybackRate, setVideoPlaybackRate } = useProjectStore();
  const [showSettings, setShowSettings] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(55);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const isReviewer = activeRole === 'reviewer';
  const isEditor = activeRole === 'editor';

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

  return (
    <div className="flex flex-col h-screen bg-background">
      <TopBar />

      <div className="flex-1 flex overflow-hidden" ref={containerRef}>
        {/* Left panel */}
        <div style={{ width: `${leftPanelWidth}%` }} className="flex flex-col border-r border-border">
          {/* Video player - flex to fill available space */}
          <div className="flex-1 px-3 pt-3 min-h-0">
            <YouTubePlayer url={videoUrl} className="h-full w-full" />
          </div>

          {/* Bottom: Composer (reviewer) or editor panel */}
          <div className="px-4 py-3 flex-shrink-0">
            {isReviewer && (
              <InstructionComposer
                currentTime={clampedCurrent}
                duration={videoDuration}
                playbackRate={videoPlaybackRate}
                onPlaybackRateChange={setVideoPlaybackRate}
                showSettings={showSettings}
                setShowSettings={setShowSettings}
              />
            )}
            {isEditor && (
              <Timeline
                currentTime={clampedCurrent}
                duration={videoDuration}
                playbackRate={videoPlaybackRate}
                onPlaybackRateChange={setVideoPlaybackRate}
                showSettings={showSettings}
                setShowSettings={setShowSettings}
              />
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
