import { useMemo, useRef, useState } from 'react';
import ArtSongTakeaway from '../ArtSongTakeaway';
import { useAppStore } from '../../store/useAppStore';

const SEGMENT_AUDIO = {
  s1: '/audio/hallelujah-segment-1.mp3',
  s2: '/audio/hallelujah-segment-2.mp3',
  s3: '/audio/hallelujah-segment-3.mp3'
};

const QUESTIONS = [
  {
    id: 's1',
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

function TonePaintingHandel({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const audioRefs = useRef({
    s1: null,
    s2: null,
    s3: null
  });

  const [playingId, setPlayingId] = useState('');
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

  const stopOthers = (exceptId) => {
    Object.entries(audioRefs.current).forEach(([id, el]) => {
      if (!el) return;
      if (id !== exceptId) el.pause();
    });
  };

  const togglePlay = async (id) => {
    const el = audioRefs.current[id];
    if (!el) return;
    if (playingId === id) {
      el.pause();
      setPlayingId('');
      return;
    }
    stopOthers(id);
    try {
      await el.play();
      setPlayingId(id);
    } catch {
      setPlayingId('');
    }
  };

  const allAnswered = useMemo(
    () => QUESTIONS.every((q) => selected[q.id] !== null),
    [selected]
  );
  const allCorrect = useMemo(
    () => QUESTIONS.every((q) => selected[q.id] === q.answer),
    [selected]
  );

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

        {QUESTIONS.map((q, idx) => {
          const picked = selected[q.id];
          const isCorrect = picked === q.answer;
          const canOpen = picked !== null;
          return (
            <section key={q.id} style={{ marginBottom: 18 }}>
              <div className="sec">구간 {idx + 1}</div>
              <div className="review-card" style={{ marginBottom: 10 }}>
                <div className="review-section-title">가사</div>
                <div className="review-item" style={{ marginBottom: 10 }}>{q.lyric}</div>

                <audio
                  ref={(el) => {
                    audioRefs.current[q.id] = el;
                  }}
                  src={SEGMENT_AUDIO[q.id]}
                  preload="metadata"
                  onEnded={() => setPlayingId((prev) => (prev === q.id ? '' : prev))}
                />
                <button
                  type="button"
                  className="btn-s"
                  onClick={() => togglePlay(q.id)}
                  style={{ marginBottom: 14 }}
                >
                  {playingId === q.id ? '❚❚ 오디오 일시정지' : '▶ 오디오 재생'}
                </button>

                <div className="review-section-title">{q.question}</div>
                <div className="vd-opts" style={{ marginTop: 10 }}>
                  {q.options.map((opt, i) => (
                    <button
                      key={opt}
                      type="button"
                      className={`vd-opt ${picked === i ? 'sel' : ''}`}
                      onClick={() => setSelected((prev) => ({ ...prev, [q.id]: i }))}
                    >
                      {picked === i ? '● ' : '○ '}
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {canOpen ? (
                <button
                  type="button"
                  className="answer-check-toggle"
                  onClick={() => setOpen((prev) => ({ ...prev, [q.id]: !prev[q.id] }))}
                  aria-expanded={open[q.id]}
                >
                  <span className="answer-check-toggle-label">정답 확인하기</span>
                  <span className="answer-check-toggle-chevron" aria-hidden="true">
                    {open[q.id] ? '▲' : '▼'}
                  </span>
                </button>
              ) : null}

              <div className={`answer-compare-slide ${open[q.id] ? 'open' : ''}`}>
                <div className="answer-compare-inner">
                  <div className={`fb show ${isCorrect ? 'ok' : 'info'}`}>{q.feedback}</div>
                </div>
              </div>
            </section>
          );
        })}

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
