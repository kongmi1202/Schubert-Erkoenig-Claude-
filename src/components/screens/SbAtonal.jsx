import { useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

const AUDIO_SRC = {
  tonal: '/audio/sb-tonal-aud.mp3',
  atonal: '/audio/sb-atonal-aud.mp3'
};

const CHOICES = [
  '편안하고 안정적이다',
  '불안하고 예측할 수 없다',
  '밝고 경쾌하다',
  '슬프지만 아름답다'
];
const CORRECT_CHOICE = '불안하고 예측할 수 없다';

function SbAtonal({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const [playing, setPlaying] = useState('');
  const [feelTonal, setFeelTonal] = useState('');
  const [feelAtonal, setFeelAtonal] = useState('');
  const [selectedChoice, setSelectedChoice] = useState('');
  const [answerOpen, setAnswerOpen] = useState(false);
  const tonalRef = useRef(null);
  const atonalRef = useRef(null);

  const canCheck = useMemo(
    () => !!selectedChoice && feelTonal.trim() && feelAtonal.trim(),
    [selectedChoice, feelTonal, feelAtonal]
  );
  const isCorrect = selectedChoice === CORRECT_CHOICE;

  const playAudio = async (kind) => {
    const current = kind === 'tonal' ? tonalRef.current : atonalRef.current;
    const other = kind === 'tonal' ? atonalRef.current : tonalRef.current;
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
    <div className="screen active" id="sb-atonal">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2-C · 분석적 감상 (쇤베르크)</div>
        <div className="s-title">무조성</div>
        <div className="s-desc">음악 요소: 음계</div>
      </div>

      <div className="body voice-body">
        <div className="sec">비교 듣기</div>
        <audio id="sb-tonal-source" ref={tonalRef} src={AUDIO_SRC.tonal} preload="metadata" onEnded={() => setPlaying((p) => (p === 'tonal' ? '' : p))} />
        <audio id="sb-atonal-source" ref={atonalRef} src={AUDIO_SRC.atonal} preload="metadata" onEnded={() => setPlaying((p) => (p === 'atonal' ? '' : p))} />
        <div className="compare-listen">
          <div className="cl-card tonal">
            <div className="cl-label">마왕 첫 구간</div>
            <button id="sb-tonal-aud" type="button" className="btn-s" onClick={() => playAudio('tonal')}>
              {playing === 'tonal' ? '❚❚ 일시정지' : '▶ 재생'}
            </button>
          </div>
          <div className="cl-card atonal">
            <div className="cl-label">달에 홀린 피에로 중 "달에 취하여"</div>
            <button id="sb-atonal-aud" type="button" className="btn-s" onClick={() => playAudio('atonal')}>
              {playing === 'atonal' ? '❚❚ 일시정지' : '▶ 재생'}
            </button>
          </div>
        </div>

        <div className="sec">각각 느낌 서술</div>
        <div className="feel-grid-h">
          <div className="feel-card-h fc1">
            <div className="feel-title-h">마왕을 들은 느낌</div>
            <textarea
              id="sb-feel-tonal"
              className="txt"
              value={feelTonal}
              onChange={(e) => setFeelTonal(e.target.value)}
              placeholder="마왕 구간을 들은 느낌을 써보세요..."
            />
          </div>
          <div className="feel-card-h fc2">
            <div className="feel-title-h">달에 홀린 피에로를 들은 느낌</div>
            <textarea
              id="sb-feel-atonal"
              className="txt"
              value={feelAtonal}
              onChange={(e) => setFeelAtonal(e.target.value)}
              placeholder="달에 홀린 피에로를 들은 느낌을 써보세요..."
            />
          </div>
        </div>

        <div className="sec">차이점 객관식</div>
        <div className="review-card">
          <div style={{ marginBottom: 12 }}>달에 홀린 피에로는 마왕과 비교해 어떤 느낌인가요?</div>
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
            setStageCompletion('piano', true);
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
              정답: 불안하고 예측할 수 없다
              <br />
              달에 홀린 피에로는 무조성 음악이예요. 무조성 음악은 으뜸음이 없어서 다음 음이 어디로 향할지 예측할 수 없어요.
              <br />
              이 불안정함이 바로 표현주의 음악이
              <br />
              추구하는 감정 표현이에요.
            </div>
          </div>
        </div>

        <div className="feat-card">
          <div className="feat-num">FEATURE</div>
          <div className="feat-title">표현주의 음악의 특징</div>
          <div className="feat-body">
            내면의 불안과 공포를 음악으로 표현한다
            <br />
            표현주의는 겉으로 보이는 아름다움보다
            <br />
            인간 내면의 불안·공포·혼란을
            <br />
            극단적으로 드러내는 것을 목표로 해요.
            <br />
            무조성은 조성 음악의 안정감을 깨뜨리며
            <br />
            이러한 감정을 음악으로 표현하는
            <br />
            핵심 수단이 됩니다.
          </div>
        </div>

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('voiceDesign')}>← 이전: sb-sprech</button>
          <button className="btn-p" onClick={() => go('historyCards')}>다음: sb-history →</button>
        </div>
      </div>
    </div>
  );
}

export default SbAtonal;
