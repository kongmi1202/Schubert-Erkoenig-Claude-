import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { loadYouTubeIframeApi } from './SegmentYoutubePlayer';

/**
 * 표제음악(소네트)용: 화면 밖에서 YouTube 구간만 재생(소리 중심).
 * ref: { play(), pause(), stop(), isReady() }
 */
const VvSonnetYoutubeAudio = forwardRef(function VvSonnetYoutubeAudio(
  { videoId, start, end, onReady, onPlaybackStateChange },
  ref
) {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const clampTimerRef = useRef(null);
  const onPlaybackStateChangeRef = useRef(onPlaybackStateChange);
  const onReadyRef = useRef(onReady);
  onPlaybackStateChangeRef.current = onPlaybackStateChange;
  onReadyRef.current = onReady;

  const clearClamp = () => {
    if (clampTimerRef.current) {
      window.clearInterval(clampTimerRef.current);
      clampTimerRef.current = null;
    }
  };

  const startClamp = (player) => {
    clearClamp();
    clampTimerRef.current = window.setInterval(() => {
      if (!player || typeof player.getCurrentTime !== 'function') return;
      const t = player.getCurrentTime();
      if (t >= end - 0.25) {
        player.pauseVideo();
        player.seekTo(start, true);
        onPlaybackStateChangeRef.current?.(false);
      }
    }, 250);
  };

  useImperativeHandle(ref, () => ({
    play: () => {
      const p = playerRef.current;
      if (!p || typeof p.seekTo !== 'function') return;
      const t = typeof p.getCurrentTime === 'function' ? p.getCurrentTime() : start;
      if (typeof t === 'number' && (t < start - 0.05 || t >= end - 0.35)) {
        p.seekTo(start, true);
      }
      p.playVideo();
    },
    pause: () => {
      playerRef.current?.pauseVideo?.();
    },
    stop: () => {
      const p = playerRef.current;
      if (!p || typeof p.seekTo !== 'function') return;
      p.pauseVideo();
      p.seekTo(start, true);
    },
    isReady: () => !!(playerRef.current && typeof playerRef.current.seekTo === 'function')
  }));

  useEffect(() => {
    let mounted = true;
    loadYouTubeIframeApi().then((YT) => {
      if (!mounted || !hostRef.current) return;
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      playerRef.current = new YT.Player(hostRef.current, {
        width: '320',
        height: '180',
        videoId,
        playerVars: {
          start,
          end,
          rel: 0,
          playsinline: 1,
          modestbranding: 1,
          controls: 0
        },
        events: {
          onReady: (event) => {
            event.target.seekTo(start, true);
            event.target.pauseVideo();
            onReadyRef.current?.();
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) {
              onPlaybackStateChangeRef.current?.(true);
              startClamp(event.target);
            } else {
              clearClamp();
              if (
                event.data === YT.PlayerState.PAUSED ||
                event.data === YT.PlayerState.ENDED
              ) {
                onPlaybackStateChangeRef.current?.(false);
              }
            }
            if (event.data === YT.PlayerState.ENDED) {
              clearClamp();
              event.target.seekTo(start, true);
              event.target.pauseVideo();
            }
          }
        }
      });
    });
    return () => {
      mounted = false;
      clearClamp();
      if (playerRef.current?.destroy) playerRef.current.destroy();
      playerRef.current = null;
    };
  }, [videoId, start, end]);

  return (
    <div className="vv-sonnet-yt-sr-only" aria-hidden="true">
      <div ref={hostRef} />
    </div>
  );
});

export default VvSonnetYoutubeAudio;
