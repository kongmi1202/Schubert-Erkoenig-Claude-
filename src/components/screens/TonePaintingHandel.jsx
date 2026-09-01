import { useEffect, useMemo, useRef, useState } from 'react';
import ArtSongTakeaway from '../ArtSongTakeaway';
import ActivityEndFeedback from '../ActivityEndFeedback';
import { generateStage2ActivityFeedback } from '../../lib/formativeAiFeedback';
import { useAppStore } from '../../store/useAppStore';

const SEGMENTS = [
  {
    id: 's1',
    title: '3-1.',
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
    title: '3-2.',
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
    title: '3-3.',
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
  const tonePaintingHandelState = useAppStore((s) => s.tonePaintingHandelState);
  const setTonePaintingHandelState = useAppStore((s) => s.setTonePaintingHandelState);
  const [activeSegmentId, setActiveSegmentId] = useState('s1');
  const [segmentReplaySignal, setSegmentReplaySignal] = useState(0);
  const [selected, setSelected] = useState(() => tonePaintingHandelState?.selected || {
    s1: null,
    s2: null,
    s3: null
  });
  const [activityFbDone, setActivityFbDone] = useState(false);
  const activeSegment = SEGMENTS.find((s) => s.id === activeSegmentId) || SEGMENTS[0];

  const allAnswered = useMemo(
    () => SEGMENTS.every((q) => selected[q.id] !== null),
    [selected]
  );
  const canProceed = allAnswered && activityFbDone;
  useEffect(() => {
    setTonePaintingHandelState({ selected });
  }, [selected, setTonePaintingHandelState]);

  return (
    <div className="screen active">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2 · 분석적 감상</div>
        <div className="s-title">분석적 감상</div>
        <div className="s-desc">목표: 음악 요소, 음악적 특징 및 구성을 분석하고 비교하여 음악이 어떻게 표현되고 구성되는지 파악해 보세요.</div>
      </div>

      <div className="body voice-body">
        <div className="sec">3. 이 곡은 음 화법(Tone Painting)을 사용하여 가사의 의미를 음악으로 직접 묘사했어요. 각 구간에서 가사를 음악으로 어떻게 표현했는지 살펴 보세요.</div>

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
            <div className="tone-lyric-label">가사</div>
            <div className="tone-lyric-text" style={{ marginBottom: 10 }}>{activeSegment.lyric}</div>

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

            <div className="tone-q-label">질문</div>
            <div className="tone-q-text">{activeSegment.question}</div>
            <div className="vd-opts tone-options" style={{ marginTop: 10 }}>
              {activeSegment.options.map((opt, i) => (
                <button
                  key={opt}
                  type="button"
                  className={`vd-opt tone-option ${selected[activeSegment.id] === i ? 'sel' : ''}`}
                  onClick={() => {
                    if (selected[activeSegment.id] === i) return;
                    setActivityFbDone(false);
                    setSelected((prev) => ({ ...prev, [activeSegment.id]: i }));
                  }}
                >
                  {selected[activeSegment.id] === i ? '● ' : '○ '}
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </section>

        <ActivityEndFeedback
          className="tone-ai-feedback"
          style={{ marginTop: 12, marginBottom: 12 }}
          key={`tone-activity-fb-${JSON.stringify(selected)}`}
          requestFn={() => generateStage2ActivityFeedback('tone-painting', { segments: SEGMENTS, selected })}
          onResult={() => setActivityFbDone(true)}
        />

        {allAnswered ? (
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
            disabled={!canProceed}
            style={!canProceed ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
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
