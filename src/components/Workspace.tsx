import { useProjectStore } from '@/store/projectStore';
import YouTubePlayer from './YouTubePlayer';
import InstructionComposer from './InstructionComposer';
import InstructionList from './InstructionList';
import TopBar from './TopBar';
import { useState, useRef, useEffect } from 'react';
import Timeline from './Timeline';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './ui/resizable';

export default function Workspace() {
  const { project, activeRole, currentVideoTime, videoPlaybackRate, setVideoPlaybackRate } = useProjectStore();
  
  const isReviewer = activeRole === 'reviewer';
  const isEditor = activeRole === 'editor';

  const videoUrl = isEditor
    ? project.edited_youtube_url || project.source_youtube_url
    : project.source_youtube_url;
  const videoDuration = Math.max(0, project.video_duration ?? 0);
  const clampedCurrent = Math.max(0, Math.min(currentVideoTime, videoDuration || currentVideoTime));

  return (
    <div className="flex flex-col h-screen bg-background">
      <TopBar />

      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={55} minSize={30}>
            <div className="flex flex-col h-full border-r border-border relative">
              {/* Video player - flex to fill available space */}
              <div className="flex-1 px-3 pt-3 min-h-0 relative">
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
                  />
                )}
                {isEditor && (
                  <Timeline
                    currentTime={clampedCurrent}
                    duration={videoDuration}
                    playbackRate={videoPlaybackRate}
                    onPlaybackRateChange={setVideoPlaybackRate}
                  />
                )}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={45} minSize={10}>
            <div className="h-full flex flex-col">
              <InstructionList />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
