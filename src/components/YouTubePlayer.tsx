import { useEffect, useMemo, useRef } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { formatTime, parseTime } from '@/types/ehp';

interface YouTubePlayerProps {
  url: string;
  className?: string;
}

interface YTPlayerInstance {
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  getPlayerState: () => number;
  setPlaybackRate: (rate: number) => void;
  getPlaybackRate: () => number;
}

interface YTPlayerNamespace {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars?: Record<string, number>;
      events?: {
        onReady?: () => void;
        onStateChange?: (event: { data: number }) => void;
        onError?: (event: { data: number }) => void;
      };
    }
  ) => YTPlayerInstance;
}

declare global {
  interface Window {
    YT?: YTPlayerNamespace;
    onYouTubeIframeAPIReady?: () => void;
    __ytApiReadyPromise?: Promise<void>;
  }
}

function loadYouTubeIframeApi(): Promise<void> {
  if (window.YT?.Player) {
    return Promise.resolve();
    
  }

  if (window.__ytApiReadyPromise) {
    return window.__ytApiReadyPromise;
  }

  window.__ytApiReadyPromise = new Promise<void>((resolve) => {
    window.onYouTubeIframeAPIReady = () => resolve();
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.body.appendChild(script);
  });

  return window.__ytApiReadyPromise;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.hasAttribute('data-notes-input')) return true;
  if (target.hasAttribute('data-text-edit')) return true;
  if (target.hasAttribute('data-timeline-input')) return false;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || target.isContentEditable;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export default function YouTubePlayer({ url, className = '' }: YouTubePlayerProps) {
  const setCurrentVideoTime = useProjectStore((s) => s.setCurrentVideoTime);
  const setVideoDuration = useProjectStore((s) => s.setVideoDuration);
  const seekRequest = useProjectStore((s) => s.seekRequest);
  const clearSeekRequest = useProjectStore((s) => s.clearSeekRequest);
  const seekVideoTo = useProjectStore((s) => s.seekVideoTo);
  const currentVideoTime = useProjectStore((s) => s.currentVideoTime);
  const setVideoPlaybackRate = useProjectStore((s) => s.setVideoPlaybackRate);
  const videoPlaybackRate = useProjectStore((s) => s.videoPlaybackRate);
  const startTimeRef = useRef('');
  const endTimeRef = useRef('');
  const inputTextRef = useRef('');
  const videoId = useMemo(() => extractYouTubeId(url), [url]);
  const playerHostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const knownDurationRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;

    if (!videoId || !playerHostRef.current) {
      setCurrentVideoTime(0);
      setVideoDuration(0);
      knownDurationRef.current = 0;
      return;
    }

    setVideoDuration(0);
    knownDurationRef.current = 0;

    loadYouTubeIframeApi().then(() => {
      if (cancelled || !playerHostRef.current || !window.YT?.Player) return;

      try {
        playerRef.current = new window.YT.Player(playerHostRef.current, {
          videoId,
          playerVars: {
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            enablejsapi: 1,
            controls: 0, // Set to 0 to completely hide the native UI
            disablekb: 1, // Disable native keyboard controls
            fs: 0,
            iv_load_policy: 3,
            origin: window.location.origin,
          },
          events: {
            onReady: () => {
              const tryPlay = () => {
                if (playerRef.current) {
                  try {
                    playerRef.current.setVolume(100);
                    playerRef.current.unMute();
                    playerRef.current.playVideo();
                  } catch (e) {
                    console.error('Error playing video:', e);
                  }
                }
              };
              tryPlay();
              setTimeout(tryPlay, 500);
              setTimeout(tryPlay, 1500);
              timer = setInterval(() => {
                try {
                  const current = playerRef.current?.getCurrentTime() ?? 0;
                  setCurrentVideoTime(current);

                  const duration = playerRef.current?.getDuration() ?? 0;
                  if (duration > 0 && Math.abs(duration - knownDurationRef.current) > 0.25) {
                    knownDurationRef.current = duration;
                    setVideoDuration(duration);
                  }
                } catch (e) {
                  console.error('Error updating player state:', e);
                }
              }, 200);
            },
            onStateChange: (event: { data: number }) => {
              if (event.data === window.YT?.PlayerState?.PLAYING && playerRef.current) {
                try {
                  playerRef.current.setVolume(100);
                  playerRef.current.unMute();
                } catch (e) {
                  console.error('Error setting volume:', e);
                }
              }
            },
            onError: (event: { data: number }) => {
              console.error('YouTube Player Error:', event.data);
            },
          },
        });
      } catch (e) {
        console.error('Failed to initialize YouTube player:', e);
      }
    });

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      setCurrentVideoTime(0);
      playerRef.current?.destroy();
      playerRef.current = null;
      if (playerHostRef.current) {
        playerHostRef.current.innerHTML = '';
      }
    };
  }, [setCurrentVideoTime, setVideoDuration, videoId]);

  useEffect(() => {
    if (!seekRequest || !playerRef.current) return;

    playerRef.current.seekTo(seekRequest.seconds, true);
    if (seekRequest.autoplay) {
      playerRef.current.playVideo();
    }
    clearSeekRequest();
  }, [clearSeekRequest, seekRequest]);

  useEffect(() => {
    if (!playerRef.current) return;
    if (!playerRef.current.setPlaybackRate) return;
    const existingRate = playerRef.current.getPlaybackRate();
    if (Math.abs(existingRate - videoPlaybackRate) > 0.01) {
      playerRef.current.setPlaybackRate(videoPlaybackRate);
    }
  }, [videoPlaybackRate]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isTypingTarget(e.target)) {
        e.preventDefault();
        if (playerRef.current) {
          const state = playerRef.current.getPlayerState();
          if (state === 1 || state === 3) {
            playerRef.current.pauseVideo();
          } else {
            playerRef.current.playVideo();
          }
        }
      } else if (e.key.toLowerCase() === 'p' && !isTypingTarget(e.target)) {
        // Pauses the video if playing, then InstructionComposer will log the time
        if (playerRef.current) {
          const state = playerRef.current.getPlayerState();
          if (state === 1 || state === 3) {
            playerRef.current.pauseVideo();
          }
        }
      } else if (e.key.toLowerCase() === 'n' && !isTypingTarget(e.target)) {
        // Focus the notes input field
        const notesInput = document.querySelector('[data-notes-input]') as HTMLInputElement | null;
        if (notesInput) {
          notesInput.focus();
          e.preventDefault();
        }
      } else if (e.key.toLowerCase() === 'j' && !isTypingTarget(e.target)) {
        e.preventDefault();
        const newTime = Math.max(0, (currentVideoTime || playerRef.current?.getCurrentTime() || 0) - 5);
        seekVideoTo(newTime, false);
      } else if (e.key.toLowerCase() === 'k' && !isTypingTarget(e.target)) {
        e.preventDefault();
        if (playerRef.current) {
          const state = playerRef.current.getPlayerState();
          if (state === 1 || state === 3) {
            playerRef.current.pauseVideo();
          } else {
            playerRef.current.playVideo();
          }
        }
      } else if (e.key.toLowerCase() === 'l' && !isTypingTarget(e.target)) {
        e.preventDefault();
        const newTime = (currentVideoTime || playerRef.current?.getCurrentTime() || 0) + 5;
        seekVideoTo(newTime, false);
      } else if (e.shiftKey && e.key === 'ArrowRight' && !isTypingTarget(e.target)) {
        e.preventDefault();
        const nextRate = Math.min(2, videoPlaybackRate + 0.5);
        setVideoPlaybackRate(nextRate);
      } else if (e.shiftKey && e.key === 'ArrowLeft' && !isTypingTarget(e.target)) {
        e.preventDefault();
        const prevRate = Math.max(0.5, videoPlaybackRate - 0.5);
        setVideoPlaybackRate(prevRate);
      } else if (e.key === 'ArrowRight' && !isTypingTarget(e.target)) {
        e.preventDefault();
        const newTime = (currentVideoTime || playerRef.current?.getCurrentTime() || 0) + 10;
        seekVideoTo(newTime, false);
      } else if (e.key === 'ArrowLeft' && !isTypingTarget(e.target)) {
        e.preventDefault();
        const newTime = Math.max(0, (currentVideoTime || playerRef.current?.getCurrentTime() || 0) - 10);
        seekVideoTo(newTime, false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [seekVideoTo, currentVideoTime, videoPlaybackRate, setVideoPlaybackRate]);

  if (!videoId) {
    return (
      <div className={`flex items-center justify-center bg-surface rounded-lg border border-border ${className}`}>
        <p className="text-muted-foreground text-sm">Paste a YouTube URL to begin</p>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-lg border border-border group flex ${className}`}>
      <div ref={playerHostRef} className="absolute inset-0 h-full w-full pointer-events-none" />
      <div 
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          if (playerRef.current) {
            const state = playerRef.current.getPlayerState();
            if (state === 1 || state === 3) {
              playerRef.current.pauseVideo();
            } else {
              playerRef.current.playVideo();
            }
          }
        }}
      />
    </div>
  );
}
