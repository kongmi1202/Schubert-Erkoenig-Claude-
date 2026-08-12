import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { getSbSprechFixedFeedback } from '../../lib/fixedFormativeFeedback';
import FormativeFeedbackBlock from '../FormativeFeedbackBlock';

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

const SLIDER_SPEAK_FULL_MAX = 20;
const SLIDER_SPEAK_NEAR_MAX = 40;
const SLIDER_CENTER_MAX = 59;
const SLIDER_SING_NEAR_MAX = 79;

const TONE_SPEAK_FULL = '완전히 말하기';
const TONE_SPEAK_NEAR = '말하기에 가까워요';
const TONE_CENTER = '정중앙이예요';
const TONE_SING_NEAR = '노래하기에 가까워요';
const TONE_SING_FULL = '완전히 노래하기';

const getSliderToneText = (value) => {
  if (value <= SLIDER_SPEAK_FULL_MAX) return TONE_SPEAK_FULL;
  if (value <= SLIDER_SPEAK_NEAR_MAX) return TONE_SPEAK_NEAR;
  if (value <= SLIDER_CENTER_MAX) return TONE_CENTER;
  if (value <= SLIDER_SING_NEAR_MAX) return TONE_SING_NEAR;
  return TONE_SING_FULL;
};

const isNormalVocalCorrect = (value) => getSliderToneText(value) === TONE_SING_FULL;

const isSprechstimmeCorrect = (value) => getSliderToneText(value) === TONE_SPEAK_NEAR;

const SLIDER_DEFAULT = 50;
const SPRECH_CORRECT_SUMMARY = '송어(일반 성악): 완전히 노래하기 / 피에로(슈프레흐슈팀메): 말하기에 가까워요';

function buildSprechStudentSummary(normalValue, sprechValue, normalChecked, sprechChecked) {
  const parts = [];
  if (normalChecked) parts.push(`송어(일반 성악): ${getSliderToneText(normalValue)}`);
  if (sprechChecked) parts.push(`피에로(슈프레흐슈팀메): ${getSliderToneText(sprechValue)}`);
  return parts.join(' / ');
}

function SbSprech({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const savedSprech = useAppStore((s) => s.sbSprechState);
  const setSbSprechState = useAppStore((s) => s.setSbSprechState);
  const [playing, setPlaying] = useState('');
  const [normalValue, setNormalValue] = useState(() => savedSprech?.normalValue ?? SLIDER_DEFAULT);
  const [sprechValue, setSprechValue] = useState(() => savedSprech?.sprechValue ?? SLIDER_DEFAULT);
  const [normalChecked, setNormalChecked] = useState(() => Boolean(savedSprech?.normalChecked));
  const [sprechChecked, setSprechChecked] = useState(() => Boolean(savedSprech?.sprechChecked));
  const [bothCorrect, setBothCorrect] = useState(false);
  const currentSegmentRef = useRef('');
  const ytHostRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const endWatcherRef = useRef(null);

  const normalIsCorrect = isNormalVocalCorrect(normalValue);
  const sprechIsCorrect = isSprechstimmeCorrect(sprechValue);
  const canCheckNormal = normalValue !== SLIDER_DEFAULT;
  const canCheckSprech = sprechValue !== SLIDER_DEFAULT;
  const hasCheckedAll = normalChecked && sprechChecked;

  useEffect(() => {
    setBothCorrect(normalChecked && sprechChecked && normalIsCorrect && sprechIsCorrect);
  }, [normalChecked, sprechChecked, normalIsCorrect, sprechIsCorrect]);

  useEffect(() => {
    const studentSummary = buildSprechStudentSummary(
      normalValue, sprechValue, normalChecked, sprechChecked
    );
    setSbSprechState({
      normalValue,
      sprechValue,
      normalTone: getSliderToneText(normalValue),
      sprechTone: getSliderToneText(sprechValue),
      normalChecked,
      sprechChecked,
      bothCorrect,
      selectedChoice: studentSummary || (bothCorrect ? SPRECH_CORRECT_SUMMARY : '')
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
        <div className="s-eyebrow">STAGE 2 · 분석적 감상</div>
        <div className="s-title">분석적 감상</div>
        <div className="s-desc">목표: 음악 요소, 음악적 특징 및 구성을 분석하고 비교하여 음악이 어떻게 표현되고 구성되는지 파악해 보세요.</div>
      </div>

      <div className="body voice-body">
        <div
          ref={ytHostRef}
          aria-hidden="true"
          style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}
        />
        <div className="sec">
          3. 두 구간을 들으며 말하기와 노래하기 중 어느 쪽에 더 가까운지 슬라이더를 움직여보세요.
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
            <div className="compare-ai-feedback" style={{ marginTop: 12 }}>
              <FormativeFeedbackBlock
                key={`sb-sprech-normal-fb-${normalValue}`}
                disabled={!canCheckNormal}
                getFeedback={() =>
                  getSbSprechFixedFeedback({
                    kind: 'normal',
                    hasMoved: canCheckNormal,
                    isCorrect: normalIsCorrect
                  })
                }
                onResult={() => {
                  setNormalChecked(true);
                  setStageCompletion('voice', true);
                }}
              />
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
            <div className="compare-ai-feedback" style={{ marginTop: 12 }}>
              <FormativeFeedbackBlock
                key={`sb-sprech-sprech-fb-${sprechValue}`}
                disabled={!canCheckSprech}
                getFeedback={() =>
                  getSbSprechFixedFeedback({
                    kind: 'sprech',
                    hasMoved: canCheckSprech,
                    isCorrect: sprechIsCorrect
                  })
                }
                onResult={() => {
                  setSprechChecked(true);
                  setStageCompletion('voice', true);
                }}
              />
            </div>
          </div>
        </div>

        {hasCheckedAll ? (
          <div className="review-card" style={{ marginBottom: 12 }}>
            <div className="review-item" style={{ marginBottom: 8 }}>일반 성악 &nbsp;&nbsp;&nbsp;────────── 🎵</div>
            <div className="review-item" style={{ marginBottom: 12 }}>슈프레흐슈팀메 🗣️ ────────</div>
            <div className="small-note">
              {bothCorrect ? (
                <>
                  두 구간의 차이가 보이나요?
                  <br />
                  일반 성악은 「완전히 노래하기」,
                  <br />
                  슈프레흐슈팀메는 「말하기에 가까워요」
                  <br />
                  로 맞췄어요.
                </>
              ) : (
                <>
                  아직 두 구간 모두 맞지 않아요.
                  <br />
                  각 구간을 다시 듣고 슬라이더를 조정한 뒤
                  <br />
                  피드백 보기를 눌러 보세요.
                </>
              )}
            </div>
            {bothCorrect ? <div className="small-note" style={{ marginTop: 8, color: '#9be3ba' }}>두 구간 모두 정확해요.</div> : null}
          </div>
        ) : null}

        {hasCheckedAll && bothCorrect ? (
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
          <button className="btn-p" onClick={() => { setStageCompletion('voice', true); go('pianoAnalysis'); }}>다음: sb-atonal →</button>
        </div>
      </div>
    </div>
  );
}

export default SbSprech;
