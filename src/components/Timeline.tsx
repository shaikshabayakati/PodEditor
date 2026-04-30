import React from 'react';
import { Settings } from 'lucide-react';
import { formatTime } from '@/types/ehp';
import { useProjectStore } from '@/store/projectStore';

interface TimelineProps {
  currentTime: number;
  duration: number;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
}

export default function Timeline({
  currentTime,
  duration,
  playbackRate,
  onPlaybackRateChange,
}: TimelineProps) {
  const { seekVideoTo } = useProjectStore();

  return (
    <div className="rounded border border-border bg-surface px-2 py-1">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
        <span>{formatTime(Math.floor(currentTime))}</span>
        <div className="flex items-center gap-1">
          <span className="text-primary font-medium">{playbackRate}x</span>
        </div>
        <span>{formatTime(Math.floor(duration))}</span>
      </div>
      <input
        type="range"
        min={0}
        max={duration > 0 ? duration : 1}
        step={0.1}
        value={duration > 0 ? currentTime : 0}
        onChange={(e) => seekVideoTo(Number(e.target.value), false)}
        disabled={duration <= 0}
        data-timeline-input
        className="h-1 w-full cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-40"
        aria-label="Video timeline"
      />
    </div>
  );
}
