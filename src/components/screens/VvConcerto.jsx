import { useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

const AUDIO_SRC = {
  1: '/audio/vv-co1.mp3',
  2: '/audio/vv-co2.mp3',
  3: '/audio/vv-co3.mp3'
};

const vvAnswers = { 1: 'solo', 2: 'tutti', 3: 'solo' };

function VvConcerto({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const [vvSegment, setVvSegment] = useState(1);
  const [vvScore, setVvScore] = useState(0);
  const [vvSelected, setVvSelected] = useState(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [soloState, setSoloState] = useState('');
  const [tuttiState, setTuttiState] = useState('');
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  const currentAudioId = `vv-co${vvSegment}`;
  const canCheck = !!vvSelected && !isChecked && !isFinished;
  const correctRole = vvAnswers[vvSegment];
  const currentDot = vvSegment - 1;

  const segmentFeedback = useMemo(() => ({
    1: '✓ 바이올린 독주 — 혼자서 화려하게 연주해요',
    2: '✓ 현악 그룹 — 힘차게 전체가 함께 연주해요',
    3: '✓ 바이올린 독주 + 현악 그룹 — 독주자와 그룹이 대화하며 연주해요'
  }), []);

  function resetCardState() {
    setSoloState('');
    setTuttiState('');
    setVvSelected(null);
    setIsChecked(false);
  }

  function selectConcertoRole(role) {
    if (isChecked || isFinished) return;
    setVvSelected(role);
    setSoloState(role === 'solo' ? 'selected-solo' : '');
    setTuttiState(role === 'tutti' ? 'selected-tutti' : '');
  }

  function nextSegment() {
    setVvSegment((prev) => prev + 1);
    resetCardState();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
    }
  }

  function checkConcerto() {
    if (!vvSelected || isChecked || isFinished) return;

    const isCorrect = vvSelected === correctRole;
    setIsChecked(true);

    if (isCorrect) {
      setVvScore((prev) => prev + 1);
      if (correctRole === 'solo') setSoloState('correct');
      if (correctRole === 'tutti') setTuttiState('correct');
    } else {
      if (vvSelected === 'solo') setSoloState('incorrect');
      if (vvSelected === 'tutti') setTuttiState('incorrect');
      if (correctRole === 'solo') setSoloState('correct');
      if (correctRole === 'tutti') setTuttiState('correct');
    }

    if (vvSegment >= 3) {
      setIsFinished(true);
      setStageCompletion('piano', true);
      return;
    }

    window.setTimeout(() => {
      nextSegment();
    }, 700);
  }

  const togglePlay = async () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
      return;
    }
    try {
      await el.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  };

  return (
    <div className="screen active" id="vv-concerto">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2-C · 분석적 감상 (비발디)</div>
        <div className="s-title">바이올린 협주곡</div>
        <div className="s-desc">음악 요소: 음색</div>
      </div>

      <div className="body voice-body">
        <div className="concerto-cards">
          <button
            type="button"
            className={`concerto-role solo ${soloState}`}
            onClick={() => selectConcertoRole('solo')}
            disabled={isFinished}
          >
            <div className="concerto-role-icon">🎻</div>
            <div className="concerto-role-name">바이올린 독주</div>
            <div className="concerto-role-desc">혼자서 주선율을 연주해요</div>
          </button>
          <button
            type="button"
            className={`concerto-role tutti ${tuttiState}`}
            onClick={() => selectConcertoRole('tutti')}
            disabled={isFinished}
          >
            <div className="concerto-role-icon">🎼</div>
            <div className="concerto-role-name">현악 그룹</div>
            <div className="concerto-role-desc">여러 악기가 함께 연주해요</div>
          </button>
        </div>

        <div className="segment-progress">
          {[0, 1, 2].map((idx) => (
            <span
              key={idx}
              className={`seg-dot ${idx < currentDot ? 'active' : ''} ${idx === currentDot ? 'current' : ''}`}
            />
          ))}
        </div>

        {!isFinished ? (
          <>
            <div className="sec">구간별 활동</div>
            <div className="review-card" style={{ marginBottom: 14 }}>
              <div style={{ marginBottom: 10 }}>구간 {vvSegment} / 3</div>
              <audio
                id={currentAudioId}
                ref={audioRef}
                src={AUDIO_SRC[vvSegment]}
                preload="metadata"
                onEnded={() => setPlaying(false)}
              />
              <button id={currentAudioId} type="button" className="btn-s" onClick={togglePlay}>
                {playing ? '❚❚ 일시정지' : '▶ 재생'}
              </button>
            </div>
            <button
              type="button"
              className="answer-check-toggle"
              onClick={checkConcerto}
              disabled={!canCheck}
              style={!canCheck ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            >
              <span className="answer-check-toggle-label">확인하기</span>
              <span className="answer-check-toggle-chevron" aria-hidden="true">✓</span>
            </button>
            <div className="small-note" style={{ marginTop: 8 }}>
              {vvSegment === 3 ? '구간3은 독주자와 그룹이 대화하듯 주고받는 흐름에 집중해보세요.' : '카드를 선택한 뒤 확인하기를 눌러주세요.'}
            </div>
          </>
        ) : (
          <>
            <div className="score-result">
              <div className="score-num">{vvScore} / 3</div>
              <div className="score-label">정답</div>
            </div>
            <div className="fb show ok">{segmentFeedback[1]}</div>
            <div className="fb show ok">{segmentFeedback[2]}</div>
            <div className="fb show ok">{segmentFeedback[3]}</div>
          </>
        )}

        <div className="feat-card">
          <div className="feat-num">FEATURE</div>
          <div className="feat-title">사계의 주요 특징 ②: 바이올린 협주곡</div>
          <div className="feat-body">
            독주자와 그룹이 대화하며 연주한다
            <br />
            바이올린 협주곡에서 독주 바이올린과
            <br />
            현악 그룹은 번갈아가며 주고받아요.
            <br />
            이 형식을 리토르넬로(ritornello)라고 하며
            <br />
            바로크 협주곡의 핵심 구조예요.
          </div>
        </div>

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('voiceDesign')}>← 이전: vv-sonnet</button>
          <button className="btn-p" onClick={() => go('historyCards')}>다음: vv-history →</button>
        </div>
      </div>
    </div>
  );
}

export default VvConcerto;
