import React from 'react';
import { Settings } from 'lucide-react';
import { formatTime } from '@/types/ehp';
import { useProjectStore } from '@/store/projectStore';

interface TimelineProps {
  currentTime: number;
  duration: number;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
}

export default function Timeline({
  currentTime,
  duration,
  playbackRate,
  onPlaybackRateChange,
  showSettings,
  setShowSettings,
}: TimelineProps) {
  const { seekVideoTo } = useProjectStore();

  return (
    <div className="rounded border border-border bg-surface px-2 py-1">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
        <span>{formatTime(Math.floor(currentTime))}</span>
        <div className="flex items-center gap-1">
          <span className="text-primary font-medium">{playbackRate}x</span>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-0.5 hover:bg-accent rounded"
          >
            <Settings className="w-3 h-3" />
          </button>
        </div>
        <span>{formatTime(Math.floor(duration))}</span>
      </div>
      {showSettings && (
        <div className="mb-1 flex gap-1">
          {[0.5, 1, 1.5, 2].map((rate) => (
            <button
              key={rate}
              onClick={() => onPlaybackRateChange?.(rate)}
              className={`px-1.5 py-0.5 text-[10px] rounded ${
                playbackRate === rate
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
