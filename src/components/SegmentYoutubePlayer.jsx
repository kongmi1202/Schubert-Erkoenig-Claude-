import { useEffect, useRef } from 'react';

let ytApiPromise = null;

export function loadYouTubeIframeApi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prev === 'function') prev();
      resolve(window.YT);
    };
    document.body.appendChild(script);
  });
  return ytApiPromise;
}

/**
 * YouTube IFrame API: start/end(초) 구간만 재생. 끝나면 시작 시점으로 되감고 멈춤 → 다시 재생 시 같은 구간만 재생.
 */
export function SegmentYoutubePlayer({
  videoId,
  start,
  end,
  title,
  replaySignal,
  onPlayerReady,
  onPlaying
}) {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const lastReplayRef = useRef(replaySignal);
  const onPlayerReadyRef = useRef(onPlayerReady);
  const onPlayingRef = useRef(onPlaying);
  onPlayerReadyRef.current = onPlayerReady;
  onPlayingRef.current = onPlaying;

  useEffect(() => {
    let mounted = true;
    loadYouTubeIframeApi().then((YT) => {
      if (!mounted || !hostRef.current) return;
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      playerRef.current = new YT.Player(hostRef.current, {
        width: '100%',
        height: '100%',
        videoId,
        playerVars: {
          start,
          end,
          rel: 0,
          playsinline: 1,
          modestbranding: 1,
          controls: 1
        },
        events: {
          onReady: (event) => {
            onPlayerReadyRef.current?.(event.target);
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.PLAYING) {
              onPlayingRef.current?.();
            }
            if (event.data === YT.PlayerState.ENDED) {
              event.target.seekTo(start, true);
              event.target.pauseVideo();
            }
          }
        }
      });
    });
    return () => {
      mounted = false;
      onPlayerReadyRef.current?.(null);
      if (playerRef.current?.destroy) playerRef.current.destroy();
      playerRef.current = null;
    };
  }, [videoId, start, end]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    if (replaySignal === lastReplayRef.current) return;
    lastReplayRef.current = replaySignal;
    if (typeof player.seekTo === 'function') {
      player.seekTo(start, true);
      player.playVideo();
    }
  }, [replaySignal, start]);

  return (
    <div className="video-wrap" style={{ marginBottom: 0 }}>
      <div ref={hostRef} title={title} style={{ position: 'absolute', inset: 0 }} />
    </div>
  );
}
