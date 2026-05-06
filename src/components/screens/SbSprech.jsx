import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

const SEGMENTS = {
  normal: {
    videoId: 'ZNHHeGwwC3Y',
    start: 13,
    end: 45
  },
  sprech: {
    videoId: '-FUySRVF75k',
    start: 4,
    end: 28
  }
};

const getSliderToneText = (value) => {
  if (value <= 20) return '완전히 말하기에 가까워요';
  if (value <= 40) return '말하기에 가까워요';
  if (value <= 59) return '정중앙이에요';
  if (value <= 79) return '노래하기에 가까워요';
  return '완전히 노래하기에 가까워요';
};

function SbSprech({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const setSbSprechState = useAppStore((s) => s.setSbSprechState);
  const [playing, setPlaying] = useState('');
  const [normalValue, setNormalValue] = useState(50);
  const [sprechValue, setSprechValue] = useState(50);
  const [normalChecked, setNormalChecked] = useState(false);
  const [sprechChecked, setSprechChecked] = useState(false);
  const [bothCorrect, setBothCorrect] = useState(false);
  const [normalOpen, setNormalOpen] = useState(false);
  const [sprechOpen, setSprechOpen] = useState(false);
  const currentSegmentRef = useRef('');
  const ytHostRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const endWatcherRef = useRef(null);

  const normalIsCorrect = normalValue >= 60;
  const sprechIsCorrect = sprechValue <= 40;
  const hasCheckedAll = normalChecked && sprechChecked;

  useEffect(() => {
    setBothCorrect(normalChecked && sprechChecked && normalIsCorrect && sprechIsCorrect);
  }, [normalChecked, sprechChecked, normalIsCorrect, sprechIsCorrect]);

  useEffect(() => {
    const summary = bothCorrect
      ? '일반 성악은 노래하기, 슈프레흐슈팀메는 말하기에 가깝다'
      : '';
    setSbSprechState({
      normalValue,
      sprechValue,
      normalChecked,
      sprechChecked,
      bothCorrect,
      selectedChoice: summary
    });
  }, [normalValue, sprechValue, normalChecked, sprechChecked, bothCorrect, setSbSprechState]);

  const stopWatcher = () => {
    if (endWatcherRef.current) {
      window.clearInterval(endWatcherRef.current);
      endWatcherRef.current = null;
    }
  };

  const stopSegment = (kind) => {
    const player = ytPlayerRef.current;
    if (!player || !SEGMENTS[kind]) return;
    stopWatcher();
    if (typeof player.pauseVideo === 'function') player.pauseVideo();
    if (typeof player.seekTo === 'function') player.seekTo(SEGMENTS[kind].start, true);
    currentSegmentRef.current = kind;
    setPlaying('');
  };

  const playAudio = (kind) => {
    const player = ytPlayerRef.current;
    const segment = SEGMENTS[kind];
    if (!player || !segment) return;
    if (playing === kind) {
      if (typeof player.pauseVideo === 'function') player.pauseVideo();
      setPlaying('');
      return;
    }

    if (currentSegmentRef.current === kind) {
      if (typeof player.playVideo === 'function') player.playVideo();
      setPlaying(kind);
      return;
    }

    stopWatcher();
    if (typeof player.loadVideoById === 'function') {
      const endSeconds = typeof segment.end === 'number' ? segment.end : undefined;
      player.loadVideoById({
        videoId: segment.videoId,
        startSeconds: segment.start,
        endSeconds
      });
    } else if (typeof player.cueVideoById === 'function') {
      const endSeconds = typeof segment.end === 'number' ? segment.end : undefined;
      player.cueVideoById({
        videoId: segment.videoId,
        startSeconds: segment.start,
        endSeconds
      });
      if (typeof player.playVideo === 'function') player.playVideo();
    }
    currentSegmentRef.current = kind;
    setPlaying(kind);
  };

  useEffect(() => {
    let cancelled = false;
    const createPlayer = () => {
      if (cancelled || !ytHostRef.current || ytPlayerRef.current) return;
      if (!window.YT || !window.YT.Player) return;
      ytPlayerRef.current = new window.YT.Player(ytHostRef.current, {
        width: 0,
        height: 0,
        videoId: SEGMENTS.normal.videoId,
        playerVars: {
          controls: 0,
          disablekb: 1,
          playsinline: 1,
          rel: 0,
          modestbranding: 1
        },
        events: {
          onReady: (event) => {
            event.target.cueVideoById({
              videoId: SEGMENTS.normal.videoId,
              startSeconds: SEGMENTS.normal.start,
              endSeconds: SEGMENTS.normal.end
            });
            if (typeof event.target.mute === 'function') {
              event.target.mute();
              event.target.unMute();
            }
          },
          onStateChange: (event) => {
            const state = window.YT?.PlayerState;
            if (!state) return;
            if (event.data === state.PLAYING) {
              stopWatcher();
              endWatcherRef.current = window.setInterval(() => {
                const segmentId = currentSegmentRef.current;
                if (!segmentId) return;
                const segment = SEGMENTS[segmentId];
                if (!segment || typeof segment.end !== 'number') return;
                const player = ytPlayerRef.current;
                if (!player || typeof player.getCurrentTime !== 'function') return;
                if (player.getCurrentTime() >= segment.end) {
                  stopSegment(segmentId);
                }
              }, 200);
            } else if (event.data === state.PAUSED || event.data === state.ENDED) {
              stopWatcher();
              setPlaying('');
            }
          }
        }
      });
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevReady === 'function') prevReady();
        createPlayer();
      };
      if (!document.getElementById('youtube-iframe-api')) {
        const script = document.createElement('script');
        script.id = 'youtube-iframe-api';
        script.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      stopWatcher();
      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
        ytPlayerRef.current.destroy();
      }
      ytPlayerRef.current = null;
    };
  }, []);

  return (
    <div className="screen active" id="sb-sprech">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2-B · 분석적 감상 (쇤베르크)</div>
        <div className="s-title">슈프레흐슈팀메</div>
        <div className="s-desc">음악 요소: 음색</div>
      </div>

      <div className="body voice-body">
        <div
          ref={ytHostRef}
          aria-hidden="true"
          style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}
        />
        <div className="sec">비교 듣기</div>
        <div className="fb show info">
          💡 두 구간을 들으며 말하기와
          <br />
          노래하기 중 어느 쪽에 더 가까운지
          <br />
          슬라이더를 움직여보세요!
        </div>
        <div className="compare-listen">
          <div className="cl-card tonal">
            <div className="cl-label">구간 1 — 일반 성악</div>
            <div className="small-note" style={{ marginBottom: 10 }}>슈베르트 &lt;송어&gt;</div>
            <button id="sb-normal" type="button" className="btn-s" onClick={() => playAudio('normal')}>
              {playing === 'normal' ? '❚❚ 일시정지' : '▶ 재생'}
            </button>
            <div className="sb-slider-wrap">
              <div className="sb-slider-ends">
                <span className="sb-speak-label">🗣️ 말하기</span>
                <span className="sb-sing-label">🎵 노래하기</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={normalValue}
                onChange={(e) => {
                  setNormalValue(Number(e.target.value));
                  setNormalChecked(false);
                }}
                className="sb-tone-slider"
                style={{ '--slider-value': `${normalValue}%` }}
              />
              <div className="sb-slider-state">{getSliderToneText(normalValue)}</div>
            </div>
            <button
              id="ans-sp-normal-btn"
              type="button"
              className="answer-check-toggle"
              onClick={() => {
                setNormalChecked(true);
                setNormalOpen((prev) => !prev);
                setStageCompletion('voice', true);
              }}
              aria-expanded={normalOpen}
            >
              <span className="answer-check-toggle-label">정답 확인하기</span>
              <span className="answer-check-toggle-chevron" aria-hidden="true">{normalOpen ? '▲' : '▼'}</span>
            </button>
            <div id="ans-sp-normal-body" className={`answer-compare-slide ${normalOpen ? 'open' : ''}`}>
              <div className="answer-compare-inner">
                {normalIsCorrect ? (
                  <div className="fb show ok">
                    ✓ 맞아요! 일반 성악은 음을 정확하게
                    <br />
                    유지하며 노래해요. 음이 흔들리지 않고
                    <br />
                    그대로 이어지는 것이 일반 성악의 특징이에요.
                  </div>
                ) : (
                  <div className="fb show ng">
                    ✗ 다시 들어보세요! 일반 성악에서
                    <br />
                    음이 어떻게 유지되는지 집중해서
                    <br />
                    들어보세요.
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="cl-card atonal">
            <div className="cl-label">구간 2 — 슈프레흐슈팀메</div>
            <div className="small-note" style={{ marginBottom: 10 }}>달에 홀린 피에로</div>
            <button id="sb-sprech-aud" type="button" className="btn-s" onClick={() => playAudio('sprech')}>
              {playing === 'sprech' ? '❚❚ 일시정지' : '▶ 재생'}
            </button>
            <div className="sb-slider-wrap">
              <div className="sb-slider-ends">
                <span className="sb-speak-label">🗣️ 말하기</span>
                <span className="sb-sing-label">🎵 노래하기</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sprechValue}
                onChange={(e) => {
                  setSprechValue(Number(e.target.value));
                  setSprechChecked(false);
                }}
                className="sb-tone-slider"
                style={{ '--slider-value': `${sprechValue}%` }}
              />
              <div className="sb-slider-state">{getSliderToneText(sprechValue)}</div>
            </div>
            <button
              id="ans-sp-sprech-btn"
              type="button"
              className="answer-check-toggle"
              onClick={() => {
                setSprechChecked(true);
                setSprechOpen((prev) => !prev);
                setStageCompletion('voice', true);
              }}
              aria-expanded={sprechOpen}
            >
              <span className="answer-check-toggle-label">정답 확인하기</span>
              <span className="answer-check-toggle-chevron" aria-hidden="true">{sprechOpen ? '▲' : '▼'}</span>
            </button>
            <div id="ans-sp-sprech-body" className={`answer-compare-slide ${sprechOpen ? 'open' : ''}`}>
              <div className="answer-compare-inner">
                {sprechIsCorrect ? (
                  <div className="fb show ok">
                    ✓ 맞아요! 슈프레흐슈팀메는 음에 닿을락 말락 말하기에 더 가까워요.
                    <br />
                    말과 노래의 경계를 허무는 기법이에요.
                  </div>
                ) : (
                  <div className="fb show ng">
                    ✗ 다시 들어보세요! 음이 정확하게
                    <br />
                    유지되는지, 아니면 바로 변하는지
                    <br />
                    집중해서 들어보세요.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {hasCheckedAll ? (
          <div className="review-card" style={{ marginBottom: 12 }}>
            <div className="review-item" style={{ marginBottom: 8 }}>일반 성악 &nbsp;&nbsp;&nbsp;────────── 🎵</div>
            <div className="review-item" style={{ marginBottom: 12 }}>슈프레흐슈팀메 🗣️ ────────</div>
            <div className="small-note">
              두 구간의 차이가 보이나요?
              <br />
              일반 성악은 노래하기에,
              <br />
              슈프레흐슈팀메는 말하기에
              <br />
              더 가까웠어요.
            </div>
            {bothCorrect ? <div className="small-note" style={{ marginTop: 8, color: '#9be3ba' }}>두 구간 모두 정확해요.</div> : null}
          </div>
        ) : null}

        {hasCheckedAll ? (
          <div className="feat-card">
            <div className="feat-num">FEATURE</div>
            <div className="feat-title">달에 홀린 피에로의 특징</div>
            <div className="feat-body">
              슈프레흐슈팀메(Sprechstimme) — 말과 노래의 경계를 허문다
              <br />
              쇤베르크는 이 작품에서 성악가에게
              <br />
              전통적인 아름다운 음색 대신
              <br />
              말하듯 노래하는 슈프레흐슈팀메를 요구해요.
              <br />
              이 낯선 음색이 표현주의 특유의
              <br />
              불안하고 몽환적인 분위기를 만들어냅니다.
            </div>
          </div>
        ) : null}

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('analyticalOverview')}>← 이전: sb-overview</button>
          <button className="btn-p" onClick={() => go('pianoAnalysis')}>다음: sb-atonal →</button>
        </div>
      </div>
    </div>
  );
}

export default SbSprech;
