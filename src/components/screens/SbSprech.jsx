import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

const AUDIO_SRC = {
  normal: '/audio/sb-normal.mp3',
  sprech: '/audio/sb-sprech-aud.mp3'
};

const CHOICES = [
  '음이 정확하게 유지되며 아름답게 울린다',
  '음에 도달한 직후 바로 올라가거나 내려간다',
  '반주 악기 없이 목소리만 사용한다',
  '매우 빠른 리듬으로 연주된다'
];
const CORRECT_CHOICE = '음에 도달한 직후 바로 올라가거나 내려간다';

function SbSprech({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const sbSprechState = useAppStore((s) => s.sbSprechState);
  const setSbSprechState = useAppStore((s) => s.setSbSprechState);
  const [playing, setPlaying] = useState('');
  const [selectedChoice, setSelectedChoice] = useState(() => sbSprechState?.selectedChoice || '');
  const [answerOpen, setAnswerOpen] = useState(false);
  const normalRef = useRef(null);
  const sprechRef = useRef(null);

  const canCheck = useMemo(() => !!selectedChoice, [selectedChoice]);
  const isCorrect = selectedChoice === CORRECT_CHOICE;

  useEffect(() => {
    setSbSprechState({ selectedChoice });
  }, [selectedChoice, setSbSprechState]);

  const playAudio = async (kind) => {
    const current = kind === 'normal' ? normalRef.current : sprechRef.current;
    const other = kind === 'normal' ? sprechRef.current : normalRef.current;
    if (!current) return;

    if (playing === kind) {
      current.pause();
      setPlaying('');
      return;
    }

    if (other) other.pause();
    try {
      await current.play();
      setPlaying(kind);
    } catch {
      setPlaying('');
    }
  };

  return (
    <div className="screen active" id="sb-sprech">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2-B · 분석적 감상 (쇤베르크)</div>
        <div className="s-title">슈프레흐슈팀메</div>
        <div className="s-desc">음악 요소: 음색</div>
      </div>

      <div className="body voice-body">
        <div className="sec">비교 듣기</div>
        <audio id="sb-normal-audio" ref={normalRef} src={AUDIO_SRC.normal} preload="metadata" onEnded={() => setPlaying((p) => (p === 'normal' ? '' : p))} />
        <audio id="sb-sprech-audio" ref={sprechRef} src={AUDIO_SRC.sprech} preload="metadata" onEnded={() => setPlaying((p) => (p === 'sprech' ? '' : p))} />
        <div className="compare-listen">
          <div className="cl-card tonal">
            <div className="cl-label">일반 성악 구간</div>
            <button id="sb-normal" type="button" className="btn-s" onClick={() => playAudio('normal')}>
              {playing === 'normal' ? '❚❚ 일시정지' : '▶ 재생'}
            </button>
          </div>
          <div className="cl-card atonal">
            <div className="cl-label">달에 홀린 피에로 구간</div>
            <button id="sb-sprech-aud" type="button" className="btn-s" onClick={() => playAudio('sprech')}>
              {playing === 'sprech' ? '❚❚ 일시정지' : '▶ 재생'}
            </button>
          </div>
        </div>

        <div className="sec">차이점 객관식</div>
        <div className="review-card">
          <div style={{ marginBottom: 12 }}>달에 홀린 피에로 창법과 일반 성악의 가장 큰 차이점은?</div>
          <div className="choice-list">
            {CHOICES.map((choice) => (
              <button
                key={choice}
                type="button"
                className={`choice-item ${selectedChoice === choice ? 'selected' : ''}`}
                onClick={() => setSelectedChoice(choice)}
              >
                {selectedChoice === choice ? '●' : '○'} {choice}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="answer-check-toggle"
          onClick={() => {
            if (!canCheck) return;
            setAnswerOpen((prev) => !prev);
            setStageCompletion('voice', true);
          }}
          aria-expanded={answerOpen}
          disabled={!canCheck}
          style={!canCheck ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
        >
          <span className="answer-check-toggle-label">정답 확인하기</span>
          <span className="answer-check-toggle-chevron" aria-hidden="true">{answerOpen ? '▲' : '▼'}</span>
        </button>
        <div className={`answer-compare-slide ${answerOpen ? 'open' : ''}`}>
          <div className="answer-compare-inner">
            <div className={`fb show ${isCorrect ? 'ok' : 'info'}`}>
              정답: 음에 도달한 직후 바로 올라가거나 내려간다
              <br />
              달에 홀린 피에로의 창법은 슈프레흐슈팀메(Sprechstimme)라고 해요. 정확한 음정을 버리고
              <br />
              말과 노래의 경계에 있는 소리를 만들어요.
              <br />
              이 낯설고 불안한 음색이 달에 취하여의
              <br />
              몽환적 분위기를 만드는 핵심이에요.
            </div>
          </div>
        </div>

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

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('analyticalOverview')}>← 이전: sb-overview</button>
          <button className="btn-p" onClick={() => go('pianoAnalysis')}>다음: sb-atonal →</button>
        </div>
      </div>
    </div>
  );
}

export default SbSprech;
