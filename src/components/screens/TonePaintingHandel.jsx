import { useEffect, useMemo, useRef, useState } from 'react';
import ArtSongTakeaway from '../ArtSongTakeaway';
import { generateTonePaintingCompareFeedback } from '../../lib/compareFeedback';
import { useAppStore } from '../../store/useAppStore';

const SEGMENTS = [
  {
    id: 's1',
    title: '구간 1',
    start: 126,
    end: 171,
    lyric: 'King of Kings / 왕 중의 왕',
    question: '이 구절에서 음악은 어떻게 표현됐나요?',
    options: [
      '음이 점점 높아진다',
      '음이 갑자기 낮아진다',
      '리듬이 빨라진다',
      '선율이 길게 이어진다'
    ],
    answer: 0,
    feedback:
      '✓ 왕의 위대함을 점점 높아지는 음으로 표현했어요. 높은 음=위대함·권위를 나타내는 음화법이에요.'
  },
  {
    id: 's2',
    title: '구간 2',
    start: 0,
    end: 26,
    lyric: 'Hallelujah (반복) / 할렐루야',
    question: '이 구절에서 반복은 어떤 효과를 주나요?',
    options: [
      '지루함을 준다',
      '강조와 확신을 표현한다',
      '슬픔을 나타낸다',
      '음악이 끝나는 느낌을 준다'
    ],
    answer: 1,
    feedback:
      '✓ 같은 가사를 반복함으로써 강한 확신과 종교적 열망을 표현해요.'
  },
  {
    id: 's3',
    title: '구간 3',
    start: 191,
    end: 220,
    lyric: 'For ever and ever / 영원히 영원히',
    question: '영원함을 음악으로 어떻게 표현했나요?',
    options: [
      '음악이 갑자기 끝난다',
      '음이 매우 낮아진다',
      '선율이 끝없이 이어진다',
      '리듬이 점점 빨라진다'
    ],
    answer: 2,
    feedback:
      '✓ 영원함을 끊임없이 이어지는 선율로 묘사했어요.'
  }
];

const feedbackIndicatesAllCorrect = (text) => {
  const t = String(text || '').trim();
  if (!t) return false;
  const positive = /(완벽|모두\s*맞|전부\s*맞|정확|맞아떨어|좋은\s*선택)/;
  const negative = /(빠진|틀렸|수정|보완|다시|부족|헷갈|아쉬|다른\s*칸)/;
  return positive.test(t) && !negative.test(t);
};

let ytApiPromise = null;
function loadYouTubeIframeApi() {
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

function SegmentYoutubePlayer({ videoId, start, end, title, replaySignal }) {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const lastReplayRef = useRef(replaySignal);

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
          onStateChange: (event) => {
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

function TonePaintingHandel({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const [activeSegmentId, setActiveSegmentId] = useState('s1');
  const [segmentReplaySignal, setSegmentReplaySignal] = useState(0);
  const [selected, setSelected] = useState({
    s1: null,
    s2: null,
    s3: null
  });
  const [open, setOpen] = useState({
    s1: false,
    s2: false,
    s3: false
  });
  const [aiFeedback, setAiFeedback] = useState({
    s1: '',
    s2: '',
    s3: ''
  });
  const [hasRequestedFeedback, setHasRequestedFeedback] = useState({
    s1: false,
    s2: false,
    s3: false
  });
  const [feedbackSnapshot, setFeedbackSnapshot] = useState({
    s1: null,
    s2: null,
    s3: null
  });
  const [feedbackAllowsDirectCheck, setFeedbackAllowsDirectCheck] = useState({
    s1: false,
    s2: false,
    s3: false
  });
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const activeSegment = SEGMENTS.find((s) => s.id === activeSegmentId) || SEGMENTS[0];

  const allAnswered = useMemo(
    () => SEGMENTS.every((q) => selected[q.id] !== null),
    [selected]
  );
  const allCorrect = useMemo(
    () => SEGMENTS.every((q) => selected[q.id] === q.answer),
    [selected]
  );
  const requestToneFeedback = () =>
    generateTonePaintingCompareFeedback({
      segmentTitle: activeSegment.title,
      lyric: activeSegment.lyric,
      question: activeSegment.question,
      options: activeSegment.options,
      selectedIndex: selected[activeSegment.id]
    });
  const canShowAnswerCheck = selected[activeSegment.id] !== null;
  const isAlreadyCorrect = selected[activeSegment.id] === activeSegment.answer;
  const canOpenAnswerCheck =
    canShowAnswerCheck &&
    hasRequestedFeedback[activeSegment.id] &&
    (
      feedbackSnapshot[activeSegment.id] !== selected[activeSegment.id] ||
      isAlreadyCorrect ||
      feedbackAllowsDirectCheck[activeSegment.id]
    );
  const handleRequestFeedback = async () => {
    if (loadingFeedback) return;
    const segmentId = activeSegment.id;
    const currentSelected = selected[segmentId];
    setHasRequestedFeedback((prev) => ({ ...prev, [segmentId]: true }));
    setFeedbackSnapshot((prev) => ({ ...prev, [segmentId]: currentSelected }));
    setFeedbackAllowsDirectCheck((prev) => ({ ...prev, [segmentId]: false }));
    setLoadingFeedback(true);
    try {
      const text = await requestToneFeedback();
      const nextText = typeof text === 'string' ? text : '';
      setAiFeedback((prev) => ({ ...prev, [segmentId]: nextText }));
      setFeedbackAllowsDirectCheck((prev) => ({
        ...prev,
        [segmentId]: feedbackIndicatesAllCorrect(nextText)
      }));
    } catch (error) {
      const detail = error instanceof Error && error.message ? ` (${error.message})` : '';
      setAiFeedback((prev) => ({
        ...prev,
        [segmentId]: `피드백을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.${detail}`
      }));
    } finally {
      setLoadingFeedback(false);
    }
  };

  return (
    <div className="screen active">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2-B · 분석적 감상 (할렐루야)</div>
        <div className="s-title">음화법(Tone Painting) 찾기</div>
      </div>

      <div className="body voice-body">
        <div className="fb show info" style={{ marginBottom: 16 }}>
          음화법(Tone Painting)이란? 가사의 의미를 음악으로 직접 묘사하는 기법이에요.
          활동 후에 직접 발견해보세요!
        </div>

        <div className="sec">구간 목차</div>
        <div className="char-tabs" style={{ marginBottom: 12 }}>
          {SEGMENTS.map((segment) => (
            <button
              key={segment.id}
              type="button"
              className={`char-tab ${activeSegmentId === segment.id ? 'active' : ''}`}
              onClick={() => setActiveSegmentId(segment.id)}
            >
              {segment.title}
            </button>
          ))}
        </div>

        <section style={{ marginBottom: 18 }}>
          <div className="sec">{activeSegment.title}</div>
          <div className="review-card" style={{ marginBottom: 10 }}>
            <div className="review-section-title">가사</div>
            <div className="review-item" style={{ marginBottom: 10 }}>{activeSegment.lyric}</div>

            <div className="audio-bar voice-audio-bar" style={{ display: 'block' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                <div className="aud-title-sm">영상 구간 듣기</div>
                <button
                  type="button"
                  className="btn-s"
                  onClick={() => setSegmentReplaySignal((k) => k + 1)}
                >
                  다시 재생
                </button>
              </div>
              <SegmentYoutubePlayer
                videoId="rQ3q54AicNo"
                start={activeSegment.start}
                end={activeSegment.end}
                title={`${activeSegment.title} 영상`}
                replaySignal={segmentReplaySignal}
              />
            </div>

            <div className="review-section-title">{activeSegment.question}</div>
            <div className="vd-opts" style={{ marginTop: 10 }}>
              {activeSegment.options.map((opt, i) => (
                <button
                  key={opt}
                  type="button"
                  className={`vd-opt ${selected[activeSegment.id] === i ? 'sel' : ''}`}
                  onClick={() => setSelected((prev) => ({ ...prev, [activeSegment.id]: i }))}
                >
                  {selected[activeSegment.id] === i ? '● ' : '○ '}
                  {opt}
                </button>
              ))}
            </div>
            <div className="compare-ai-feedback" style={{ marginTop: 12 }}>
              <button type="button" className="btn-s" onClick={handleRequestFeedback} disabled={loadingFeedback}>
                {loadingFeedback ? '피드백 생성 중…' : 'AI 맞춤 피드백 받기'}
              </button>
              {aiFeedback[activeSegment.id] ? (
                <div className="fb show info compare-ai-text">{aiFeedback[activeSegment.id]}</div>
              ) : null}
            </div>
          </div>

          {canShowAnswerCheck ? (
            <button
              type="button"
              className="answer-check-toggle"
              onClick={() => setOpen((prev) => ({ ...prev, [activeSegment.id]: !prev[activeSegment.id] }))}
              aria-expanded={open[activeSegment.id]}
              disabled={!canOpenAnswerCheck}
              style={!canOpenAnswerCheck ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            >
              <span className="answer-check-toggle-label">
                {canOpenAnswerCheck ? '정답 확인하기' : '피드백 반영 후 정답 확인하기'}
              </span>
              <span className="answer-check-toggle-chevron" aria-hidden="true">
                {open[activeSegment.id] ? '▲' : '▼'}
              </span>
            </button>
          ) : null}
          {hasRequestedFeedback[activeSegment.id] &&
          (isAlreadyCorrect || feedbackAllowsDirectCheck[activeSegment.id]) ? (
            <div className="small-note" style={{ marginTop: 8 }}>
              좋아요! 현재 입력이 이미 정답과 일치해서 바로 확인할 수 있어요.
            </div>
          ) : null}

          <div className={`answer-compare-slide ${open[activeSegment.id] ? 'open' : ''}`}>
            <div className="answer-compare-inner">
              <div className={`fb show ${selected[activeSegment.id] === activeSegment.answer ? 'ok' : 'info'}`}>
                {activeSegment.feedback}
              </div>
            </div>
          </div>
        </section>

        {allCorrect ? (
          <ArtSongTakeaway
            eyebrow="오라토리오의 첫 번째 특징"
            title="종교적인 내용을 담는다"
            description="성경이나 종교적 시를 가사로 사용해요. 가사의 의미를 음악으로 직접 표현하는 음화법이 오라토리오에서 자주 쓰이는 이유도 여기에 있어요."
          />
        ) : null}

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('analyticalOverview')}>← 이전</button>
          <button
            className="btn-p"
            disabled={!allAnswered}
            style={!allAnswered ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            onClick={() => {
              setStageCompletion('voice', true);
              go('pianoAnalysis');
            }}
          >
            다음 단계 →
          </button>
        </div>
      </div>
    </div>
  );
}

export default TonePaintingHandel;
