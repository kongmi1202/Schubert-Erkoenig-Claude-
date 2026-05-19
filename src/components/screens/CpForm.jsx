import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import CompareAiFeedbackBlock from '../CompareAiFeedbackBlock';
import {
  canOpenAnswerAfterFormativeAiGate,
  generateCpFormAbaDiscoveryFeedback,
  normalizeFormativeChoice
} from '../../lib/compareFeedback';

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

const CP_FORM_DISCOVERY_Q = 'cp-form-aba-discovery';
const CP_FORM_DISCOVERY_CORRECT = '서로 다른 느낌을 대비시키기 위해';
const CP_FORM_DISCOVERY_CHOICES = [
  '곡을 더 길게 만들기 위해',
  CP_FORM_DISCOVERY_CORRECT,
  '연주자가 쉬기 위해'
];

const DISCOVERY_FEEDBACK_OK = `맞아요! ABA 형식에서 가운데 B구간은
앞뒤 A·A'와 다른 셈여림과 속도로
느낌을 나란히 보여 주는 역할을 해요.`;

const DISCOVERY_FEEDBACK_NG = `선택한 보기를
질문과 다시 맞춰 보세요.
세 구간의 셈여림과 빠르기를
귀로만 비교해 보세요.`;

function segmentCompareBody(cardId, labelOk, featureOk) {
  if (!labelOk) {
    return '이 구간의 라벨과 맞지 않아요. 빠르기와 셈여림이 어떤지 다시 들어보세요.';
  }
  if (!featureOk) {
    return '이 구간의 특징과 맞지 않아요. 음악이 빠른지 느린지, 강한지 부드러운지 다시 들어보세요.';
  }
  if (cardId === 'cp-f1') {
    return '맞아요! A구간은 빠르고 강한 셈여림(ff)으로 긴장감과 에너지를 만들어요.';
  }
  if (cardId === 'cp-f2') {
    return '맞아요! B구간은 느리고 부드러운 셈여림(pp)으로 A구간과 극적으로 대비돼요.';
  }
  return "맞아요! A'구간은 처음처럼 빠르고 강하게 돌아오지만 마지막에 조용히 마무리돼요.";
}

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
  const [segmentUiById, setSegmentUiById] = useState(() => ({
    'cp-f1': { revealed: false, open: false },
    'cp-f2': { revealed: false, open: false },
    'cp-f3': { revealed: false, open: false }
  }));

  const [discoveryChoice, setDiscoveryChoice] = useState(() => cpFormState?.discoveryChoice || '');
  const [discoveryQuizResult, setDiscoveryQuizResult] = useState(() => cpFormState?.discoveryQuizResult || '');
  const [discoveryAnsOpen, setDiscoveryAnsOpen] = useState(false);
  const [discoveryAiGate, setDiscoveryAiGate] = useState(null);

  const [currentSegmentId, setCurrentSegmentId] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const currentSegmentRef = useRef('');
  const ytHostRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const endWatcherRef = useRef(null);

  function selFormLabel(_el, cardId, label) {
    setFormAnswers((prev) => ({ ...prev, [cardId]: label }));
    setSegmentUiById((prev) => ({
      ...prev,
      [cardId]: { revealed: false, open: false }
    }));
  }

  function selFeature(cardId, value) {
    setFeatureById((prev) => ({ ...prev, [cardId]: value }));
    setSegmentUiById((prev) => ({
      ...prev,
      [cardId]: { revealed: false, open: false }
    }));
  }

  function checkSegment(cardId) {
    const label = formAnswers[cardId];
    const feat = featureById[cardId];
    if (!label || !feat) return;
    setSegmentUiById((prev) => {
      const cur = prev[cardId] || { revealed: false, open: false };
      if (!cur.revealed) {
        return { ...prev, [cardId]: { revealed: true, open: true } };
      }
      return { ...prev, [cardId]: { ...cur, open: !cur.open } };
    });
  }

  function pickDiscovery(choice) {
    setDiscoveryChoice(choice);
    setDiscoveryAiGate(null);
    setDiscoveryQuizResult('');
    setDiscoveryAnsOpen(false);
  }

  function checkDiscoveryAnswer() {
    if (!discoveryChoice) return;
    const ok =
      normalizeFormativeChoice(discoveryChoice) === normalizeFormativeChoice(CP_FORM_DISCOVERY_CORRECT);
    setDiscoveryQuizResult(ok ? 'ok' : 'ng');
    setDiscoveryAnsOpen((prev) => !prev);
    setStageCompletion('voice', true);
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

  const allSegmentsRevealed = useMemo(
    () => FORM_CARDS.every((c) => segmentUiById[c.id]?.revealed),
    [segmentUiById]
  );

  const canOpenDiscoveryAnswerCheck =
    !!discoveryChoice &&
    discoveryAiGate?.feedbackCompleted &&
    canOpenAnswerAfterFormativeAiGate({
      feedbackCompleted: discoveryAiGate.feedbackCompleted,
      wasCorrectWhenFeedbackRequested: discoveryAiGate.wasCorrectWhenFeedbackRequested,
      responseAtFeedback: discoveryAiGate.responseAtFeedback,
      currentResponse: discoveryChoice
    });

  const discoveryCorrect =
    normalizeFormativeChoice(discoveryChoice) === normalizeFormativeChoice(CP_FORM_DISCOVERY_CORRECT);

  const canProceed =
    allSegmentsRevealed && discoveryCorrect && discoveryQuizResult === 'ok';

  const choiceListText = CP_FORM_DISCOVERY_CHOICES.join(' / ');

  useEffect(() => {
    setCpFormState({
      formAnswers,
      featureById,
      discoveryChoice,
      discoveryQuizResult
    });
  }, [formAnswers, featureById, discoveryChoice, discoveryQuizResult, setCpFormState]);

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
        <div className="s-eyebrow">STAGE 2-B · 분석적 감상 (쇼팽)</div>
        <div className="s-title">ABA 형식</div>
        <div className="s-desc">음악 요소: 형식</div>
      </div>

      <div className="body voice-body">
        <div
          ref={ytHostRef}
          aria-hidden="true"
          style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}
        />
        <div className="fb show info">
          💡 음악은 여러 구간으로 나뉘어요.
          <br />
          각 구간을 듣고 A, B, A&apos; 중 어떤 이름을 붙여야 할지 맞춰보세요!
        </div>

        <div className="form-puzzle-grid">
          {FORM_CARDS.map((card, zoneIndex) => {
            const zone = zoneIndex + 1;
            const picked = formAnswers[card.id];
            const featPick = featureById[card.id];
            const ui = segmentUiById[card.id] || { revealed: false, open: false };
            const { revealed, open } = ui;
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
                  <div className="cp-form-segment-block-title">② A · B · A&apos; 이름 맞추기</div>
                  <div className="form-puzzle-label-opts">
                  {['A', 'B', "A'"].map((label) => {
                    const isSelected = picked === label;
                    const selClass = isSelected ? (label === 'A' ? 'sel-A' : label === 'B' ? 'sel-B' : 'sel-Ap') : '';
                    const resultClass =
                      revealed && isSelected ? (picked === formCorrect[card.id] ? 'ok' : 'ng') : '';
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
                    if (revealed && isSel) cls += featureOk ? ' ok' : ' ng';
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

                <button
                  type="button"
                  className="answer-check-toggle"
                  style={{ marginTop: 12 }}
                  onClick={() => checkSegment(card.id)}
                  aria-expanded={open}
                  disabled={!segReady}
                  id={`cp-form-seg-check-${card.id}`}
                >
                  <span className="answer-check-toggle-label">정답 확인하기</span>
                  <span className="answer-check-toggle-chevron" aria-hidden="true">
                    {open ? '▲' : '▼'}
                  </span>
                </button>
                <div className={`answer-compare-slide ${open ? 'open' : ''}`}>
                  <div className="answer-compare-inner">
                    {revealed ? (
                      <div
                        className={`fb show ${labelOk && featureOk ? 'ok' : 'ng'}`}
                        style={{ whiteSpace: 'pre-line' }}
                      >
                        {segmentCompareBody(card.id, labelOk, featureOk)}
                      </div>
                    ) : null}
                  </div>
                </div>
                </div>
              </div>
            );
          })}
        </div>

        {allSegmentsRevealed ? (
          <>
            <div className="sec" style={{ marginTop: 22 }}>
              형식의 의미를 찾아보세요
            </div>
            <div className="small-note" style={{ marginBottom: 10, lineHeight: 1.65 }}>
              ABA 형식에서 B구간은
              <br />
              왜 존재할까요?
            </div>
            <div id={CP_FORM_DISCOVERY_Q} className="choice-list" style={{ marginBottom: 10 }}>
              {CP_FORM_DISCOVERY_CHOICES.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  className={`choice-item ${discoveryChoice === choice ? 'selected' : ''}`}
                  onClick={() => pickDiscovery(choice)}
                >
                  {discoveryChoice === choice ? '●' : '○'} {choice}
                </button>
              ))}
            </div>

            <div className="compare-ai-feedback" style={{ marginTop: 4, marginBottom: 12 }}>
              <CompareAiFeedbackBlock
                key={`cp-form-aba-ai-${discoveryChoice || 'none'}`}
                disabled={!discoveryChoice}
                requestFn={() =>
                  generateCpFormAbaDiscoveryFeedback({
                    question: 'ABA 형식에서 B구간은 왜 존재할까요?',
                    userChoice: discoveryChoice || '',
                    correctAnswer: CP_FORM_DISCOVERY_CORRECT,
                    choiceListText
                  })
                }
                onRequested={() => {
                  setDiscoveryAiGate({
                    feedbackCompleted: false,
                    responseAtFeedback: discoveryChoice,
                    wasCorrectWhenFeedbackRequested:
                      normalizeFormativeChoice(discoveryChoice) ===
                      normalizeFormativeChoice(CP_FORM_DISCOVERY_CORRECT)
                  });
                }}
                onResult={() => {
                  setDiscoveryAiGate((g) => (g ? { ...g, feedbackCompleted: true } : g));
                }}
              />
            </div>

            <button
              id="cp-form-discovery-check-btn"
              type="button"
              className="answer-check-toggle"
              onClick={() => checkDiscoveryAnswer()}
              aria-expanded={discoveryAnsOpen}
              disabled={!canOpenDiscoveryAnswerCheck}
              style={!canOpenDiscoveryAnswerCheck ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            >
              <span className="answer-check-toggle-label">
                {canOpenDiscoveryAnswerCheck ? '정답 확인하기' : '피드백 반영 후 정답 확인하기'}
              </span>
              <span className="answer-check-toggle-chevron" aria-hidden="true">
                {discoveryAnsOpen ? '▲' : '▼'}
              </span>
            </button>
            <div
              id="cp-form-discovery-check-body"
              className={`answer-compare-slide ${discoveryAnsOpen ? 'open' : ''}`}
            >
              <div className="answer-compare-inner">
                {discoveryQuizResult ? (
                  <>
                    <div
                      className={`fb show ${discoveryQuizResult === 'ok' ? 'ok' : 'ng'}`}
                      style={{ whiteSpace: 'pre-line' }}
                    >
                      {discoveryQuizResult === 'ok' ? DISCOVERY_FEEDBACK_OK : DISCOVERY_FEEDBACK_NG}
                    </div>
                    {discoveryQuizResult === 'ok' ? <AbaDiagram /> : null}
                  </>
                ) : null}
              </div>
            </div>
          </>
        ) : null}

        {allSegmentsRevealed ? (
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
