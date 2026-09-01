import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import ActivityEndFeedback from '../ActivityEndFeedback';
import { generateStage2ActivityFeedback } from '../../lib/formativeAiFeedback';

const FORM_CARDS = [
  { id: 'cp-f1', num: '구간 1', subtitle: '처음 30초' },
  { id: 'cp-f2', num: '구간 2', subtitle: '중간 부분' },
  { id: 'cp-f3', num: '구간 3', subtitle: '마지막 부분' }
];

const CHOPIN_VIDEO_ID = 'dHwhfpN--Bk';
const segmentRangeById = {
  'cp-f1': { start: 10, end: 70 },
  'cp-f2': { start: 76, end: 215 },
  'cp-f3': { start: 224, end: null }
};

const formCorrect = {
  'cp-f1': 'A',
  'cp-f2': 'B',
  'cp-f3': "A'"
};

const FEATURE_OPTS = ['빠르고 강하다', '느리고 부드럽다'];

const featureCorrect = {
  'cp-f1': '빠르고 강하다',
  'cp-f2': '느리고 부드럽다',
  'cp-f3': '빠르고 강하다'
};

function AbaDiagram() {
  return (
    <div className="cp-form-aba-diagram">
      <div className="cp-form-aba-diagram-grid">
        <div className="cp-form-aba-box">
          <div className="cp-form-aba-label">A</div>
          <div className="cp-form-aba-sub">빠르고</div>
          <div className="cp-form-aba-sub">강함</div>
          <div className="cp-form-aba-sub">(ff)</div>
        </div>
        <div className="cp-form-aba-arrow" aria-hidden="true">
          →
        </div>
        <div className="cp-form-aba-box cp-form-aba-b">
          <div className="cp-form-aba-label">B</div>
          <div className="cp-form-aba-sub">느리고</div>
          <div className="cp-form-aba-sub">부드러움</div>
          <div className="cp-form-aba-sub">(pp)</div>
        </div>
        <div className="cp-form-aba-arrow" aria-hidden="true">
          →
        </div>
        <div className="cp-form-aba-box">
          <div className="cp-form-aba-label">A&apos;</div>
          <div className="cp-form-aba-sub">빠르고</div>
          <div className="cp-form-aba-sub">강함</div>
          <div className="cp-form-aba-sub">(ff→pp)</div>
        </div>
        <div className="cp-form-aba-bracket">←────── ABA 형식 ──────→</div>
      </div>
      <div className="cp-form-aba-caption">이 구조를 ABA 형식이라고 해요.</div>
    </div>
  );
}

function CpForm({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const cpFormState = useAppStore((s) => s.cpFormState);
  const setCpFormState = useAppStore((s) => s.setCpFormState);

  const [formAnswers, setFormAnswers] = useState(() => cpFormState?.formAnswers || {});
  const [featureById, setFeatureById] = useState(() => cpFormState?.featureById || {});
  const [activityFbDone, setActivityFbDone] = useState(false);

  const [currentSegmentId, setCurrentSegmentId] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const currentSegmentRef = useRef('');
  const ytHostRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const endWatcherRef = useRef(null);

  function selFormLabel(_el, cardId, label) {
    setFormAnswers((prev) => ({ ...prev, [cardId]: label }));
    setActivityFbDone(false);
  }

  function selFeature(cardId, value) {
    setFeatureById((prev) => ({ ...prev, [cardId]: value }));
    setActivityFbDone(false);
  }

  const stopWatcher = () => {
    if (endWatcherRef.current) {
      window.clearInterval(endWatcherRef.current);
      endWatcherRef.current = null;
    }
  };

  const stopSegmentPlayback = (segmentId) => {
    const player = ytPlayerRef.current;
    if (!player || !segmentRangeById[segmentId]) return;
    const range = segmentRangeById[segmentId];
    stopWatcher();
    if (typeof player.pauseVideo === 'function') player.pauseVideo();
    if (typeof player.seekTo === 'function') player.seekTo(range.start, true);
    setCurrentSegmentId(segmentId);
    setIsPlaying(false);
  };

  const playSegment = (segmentId) => {
    const player = ytPlayerRef.current;
    if (!player || !segmentRangeById[segmentId]) return;
    const range = segmentRangeById[segmentId];
    if (currentSegmentId === segmentId && isPlaying) {
      if (typeof player.pauseVideo === 'function') player.pauseVideo();
      setIsPlaying(false);
      return;
    }
    if (currentSegmentId === segmentId && !isPlaying) {
      if (typeof player.playVideo === 'function') player.playVideo();
      setIsPlaying(true);
      return;
    }
    stopWatcher();
    if (typeof player.seekTo === 'function') player.seekTo(range.start, true);
    if (typeof player.playVideo === 'function') player.playVideo();
    setCurrentSegmentId(segmentId);
    setIsPlaying(true);
  };

  const allSegmentsAnswered = useMemo(
    () => FORM_CARDS.every((c) => formAnswers[c.id] && featureById[c.id]),
    [formAnswers, featureById]
  );

  const canProceed = allSegmentsAnswered && activityFbDone;

  useEffect(() => {
    setCpFormState({
      formAnswers,
      featureById
    });
  }, [formAnswers, featureById, setCpFormState]);

  useEffect(() => {
    currentSegmentRef.current = currentSegmentId;
  }, [currentSegmentId]);

  useEffect(() => {
    let cancelled = false;
    const createPlayer = () => {
      if (cancelled || !ytHostRef.current || ytPlayerRef.current) return;
      if (!window.YT || !window.YT.Player) return;
      ytPlayerRef.current = new window.YT.Player(ytHostRef.current, {
        width: 0,
        height: 0,
        videoId: CHOPIN_VIDEO_ID,
        playerVars: {
          controls: 0,
          disablekb: 1,
          playsinline: 1,
          rel: 0,
          modestbranding: 1
        },
        events: {
          onStateChange: (event) => {
            const state = window.YT?.PlayerState;
            if (!state) return;
            if (event.data === state.PLAYING) {
              stopWatcher();
              endWatcherRef.current = window.setInterval(() => {
                const segId = currentSegmentRef.current;
                if (!segId) return;
                const range = segmentRangeById[segId];
                if (!range || typeof range.end !== 'number') return;
                const player = ytPlayerRef.current;
                if (!player || typeof player.getCurrentTime !== 'function') return;
                if (player.getCurrentTime() >= range.end) {
                  stopSegmentPlayback(segId);
                }
              }, 200);
            } else if (event.data === state.PAUSED || event.data === state.ENDED) {
              stopWatcher();
              setIsPlaying(false);
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
    <div className="screen active" id="cp-form">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2 · 분석적 감상</div>
        <div className="s-title">분석적 감상</div>
        <div className="s-desc">목표: 음악 요소, 음악적 특징 및 구성을 분석하여 음악이 어떻게 표현되고 구성되는지 파악해 보세요.</div>
      </div>

      <div className="body voice-body">
        <div
          ref={ytHostRef}
          aria-hidden="true"
          style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}
        />
        <div className="sec">3. 이 곡은 총 3개의 구간으로 나뉘어요. 각 구간을 듣고 A, B, A&apos; 중 어떤 이름을 붙여야 할지 맞춰보세요.</div>

        <div className="form-puzzle-grid">
          {FORM_CARDS.map((card, zoneIndex) => {
            const zone = zoneIndex + 1;
            const picked = formAnswers[card.id];
            const featPick = featureById[card.id];
            const fbDone = activityFbDone;
            const labelOk = picked === formCorrect[card.id];
            const featureOk = featPick === featureCorrect[card.id];
            const segReady = Boolean(picked && featPick);

            return (
              <div key={card.id} className={`form-puzzle-card cp-form-zone cp-form-zone--${zone}`}>
                <div className="cp-form-zone-header">
                  <span className="cp-form-zone-num">{card.num}</span>
                  <span className="cp-form-zone-part">{card.subtitle}</span>
                </div>
                <div className="cp-form-zone-body">
                <div className="cp-form-segment-block cp-form-segment-play">
                  <div className="cp-form-segment-block-title">① 구간 듣기</div>
                  <div className="cp-form-segment-play-row">
                  <div className="cp-form-segment-play-btns">
                    <button id={card.id} type="button" className="btn-s" onClick={() => playSegment(card.id)}>
                      {currentSegmentId === card.id && isPlaying ? '❚❚ 일시정지' : '▶ 재생'}
                    </button>
                    <button type="button" className="btn-s" onClick={() => stopSegmentPlayback(card.id)}>
                      ■ 정지
                    </button>
                  </div>
                  </div>
                </div>

                <div className="cp-form-segment-block cp-form-segment-labels">
                  <div className="cp-form-segment-block-title">
                    ② A · B · A&apos; 이름 맞추기
                    <span className="tip-wrap" tabIndex={0} aria-label="구간 이름 안내">
                      <span className="q-mini" aria-hidden="true">?</span>
                      <span className="tip-bubble tip-bubble--form-labels">
                        A: 첫 번째 구간
                        <br />
                        B: A와 다른 구간
                        <br />
                        A&apos;: A와 비슷한 구간
                      </span>
                    </span>
                  </div>
                  <div className="form-puzzle-label-opts">
                  {['A', 'B', "A'"].map((label) => {
                    const isSelected = picked === label;
                    const selClass = isSelected ? (label === 'A' ? 'sel-A' : label === 'B' ? 'sel-B' : 'sel-Ap') : '';
                    const resultClass =
                      fbDone && isSelected ? (picked === formCorrect[card.id] ? 'ok' : 'ng') : '';
                    return (
                      <button
                        key={`${card.id}-${label}`}
                        type="button"
                        className={`form-label-opt ${selClass} ${resultClass}`.trim()}
                        onClick={(e) => selFormLabel(e.currentTarget, card.id, label)}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                </div>

                <div className="cp-form-segment-block cp-form-segment-features">
                  <div className="cp-form-segment-block-title">③ 이 구간의 특징은 무엇인가요?</div>
                  <div className="cp-form-feature-opts">
                  {FEATURE_OPTS.map((opt) => {
                    const isSel = featPick === opt;
                    let cls = 'choice-btn';
                    if (fbDone && isSel) cls += featureOk ? ' ok' : ' ng';
                    else if (isSel) cls += ' sel';
                    return (
                      <button
                        key={`${card.id}-${opt}`}
                        type="button"
                        className={cls.trim()}
                        onClick={() => selFeature(card.id, opt)}
                      >
                        {isSel ? '●' : '○'} {opt}
                      </button>
                    );
                  })}
                </div>
                </div>

                {!segReady ? (
                  <div className="cp-form-segment-required" role="status">
                    라벨과 특징을 모두 선택해 주세요
                  </div>
                ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <ActivityEndFeedback
          style={{ marginTop: 4, marginBottom: 12 }}
          key={`cp-form-activity-fb-${JSON.stringify({ formAnswers, featureById })}`}
          requestFn={() =>
            generateStage2ActivityFeedback('cp-form', { formAnswers, featureById })
          }
          onResult={() => {
            setActivityFbDone(true);
            setStageCompletion('voice', true);
          }}
        />

        {canProceed ? (
          <>
            <AbaDiagram />
            <div className="feat-card">
            <div className="feat-num">FEATURE</div>
            <div className="feat-title">환상 즉흥곡의 특징 ①</div>
            <div className="feat-body">
              감정의 극적인 대비를 음악으로 표현한다
              <br />
              ABA 형식에서 A의 격렬함과
              <br />
              B의 서정성이 극적으로 대비돼요.
              <br />
              낭만주의 음악은 이처럼
              <br />
              감정의 변화와 대비를
              <br />
              음악 형식으로 구현해요.
            </div>
          </div>
          </>
        ) : null}

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('analyticalOverview')}>
            ← 이전: cp-overview
          </button>
          <button
            className="btn-p"
            disabled={!canProceed}
            style={!canProceed ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            onClick={() => {
              setStageCompletion('voice', true);
              go('pianoAnalysis');
            }}
          >
            다음: cp-rhythm →
          </button>
        </div>
      </div>
    </div>
  );
}

export default CpForm;
