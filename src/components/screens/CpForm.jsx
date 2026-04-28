import { useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

const FORM_CARDS = [
  { id: 'cp-f1', num: '구간 1', subtitle: '처음 30초' },
  { id: 'cp-f2', num: '구간 2', subtitle: '중간 부분' },
  { id: 'cp-f3', num: '구간 3', subtitle: '마지막 부분' }
];

const formCorrect = {
  'cp-f1': 'A',
  'cp-f2': 'B',
  'cp-f3': "A'"
};

function CpForm({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const [formAnswers, setFormAnswers] = useState({});
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [playingId, setPlayingId] = useState('');
  const audioRefs = useRef({
    'cp-f1': null,
    'cp-f2': null,
    'cp-f3': null
  });

  function selFormLabel(_el, cardId, label) {
    setFormAnswers((prev) => ({ ...prev, [cardId]: label }));
    setChecked(false);
  }

  function checkForm(_btnId, _bodyId) {
    setChecked(true);
    setOpen((prev) => !prev);
    setStageCompletion('voice', true);
  }

  const stopOthers = (exceptId) => {
    Object.entries(audioRefs.current).forEach(([id, el]) => {
      if (!el) return;
      if (id !== exceptId) el.pause();
    });
  };

  const togglePlay = async (audioId) => {
    const el = audioRefs.current[audioId];
    if (!el) return;
    if (playingId === audioId) {
      el.pause();
      setPlayingId('');
      return;
    }
    stopOthers(audioId);
    try {
      await el.play();
      setPlayingId(audioId);
    } catch {
      setPlayingId('');
    }
  };

  const allSelected = useMemo(
    () => FORM_CARDS.every((card) => typeof formAnswers[card.id] === 'string'),
    [formAnswers]
  );
  const canProceed = allSelected && desc.trim().length > 0;
  const hintText = `A구간과 B구간 중 어디가 더 빠르게 들리나요?
어느 구간이 더 부드럽게 느껴지나요?
두 구간의 느낌 차이를 한 문장으로 써볼까요?`;

  return (
    <div className="screen active" id="cp-form">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2-B · 분석적 감상 (쇼팽)</div>
        <div className="s-title">ABA 형식</div>
        <div className="s-desc">음악 요소: 형식</div>
      </div>

      <div className="body voice-body">
        <div className="fb show info">
          💡 음악은 여러 구간으로 나뉘어요.
          <br />
          각 구간을 듣고 어떤 이름을
          <br />
          붙여야 할지 맞춰보세요!
        </div>

        <div className="form-puzzle-grid">
          {FORM_CARDS.map((card) => {
            const picked = formAnswers[card.id];
            return (
              <div key={card.id} className="form-puzzle-card">
                <audio
                  ref={(el) => {
                    audioRefs.current[card.id] = el;
                  }}
                  src={`/audio/${card.id}.mp3`}
                  preload="metadata"
                  onEnded={() => setPlayingId((prev) => (prev === card.id ? '' : prev))}
                />
                <div className="form-puzzle-top">
                  <div className="form-puzzle-num">{card.num}</div>
                  <button id={card.id} type="button" className="btn-s" onClick={() => togglePlay(card.id)}>
                    {playingId === card.id ? '❚❚ 일시정지' : '▶ 재생'}
                  </button>
                  <div className="small-note">{card.subtitle}</div>
                </div>
                <div className="form-puzzle-label-opts">
                  {['A', 'B', "A'"].map((label) => {
                    const isSelected = picked === label;
                    const selClass = isSelected ? (label === 'A' ? 'sel-A' : (label === 'B' ? 'sel-B' : 'sel-Ap')) : '';
                    const resultClass = checked && isSelected ? (picked === formCorrect[card.id] ? 'ok' : 'ng') : '';
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
            );
          })}
        </div>

        <button
          type="button"
          className="answer-check-toggle"
          onClick={() => checkForm('cp-form-check-btn', 'cp-form-check-body')}
          aria-expanded={open}
          disabled={!allSelected}
          style={!allSelected ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
        >
          <span className="answer-check-toggle-label">정답 확인하기</span>
          <span className="answer-check-toggle-chevron" aria-hidden="true">{open ? '▲' : '▼'}</span>
        </button>
        <div id="cp-form-check-body" className={`answer-compare-slide ${open ? 'open' : ''}`}>
          <div className="answer-compare-inner">
            <div className="fb show info">
              구간1 → A (빠르고 격렬함)
              <br />
              구간2 → B (느리고 서정적)
              <br />
              구간3 → A' (다시 격렬하게, 마지막은 조용히)
            </div>
            <div className="fb show gold">
              이 구조를 ABA 형식이라고 해요.
              <br />
              A-B-A'에서 마지막 A'는
              <br />
              처음 A와 비슷하지만
              <br />
              조금 변형되어 돌아와요.
            </div>
          </div>
        </div>

        <div className="sec">B구간이 A구간과 다르게 느껴지는 이유는 무엇인가요?</div>
        <textarea
          id="cp-form-desc"
          className="txt"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="A와 B의 분위기·속도·셈여림 차이를 중심으로 적어보세요."
        />
        <button type="button" className="ai-btn" onClick={() => setShowHint((prev) => !prev)}>✨ 참고 예시 보기</button>
        <div className={`ai-bubble ${showHint ? 'show' : ''}`}>
          <div className="ai-bubble-label">참고 예시 (정답 아님 · 그대로 복사 금지)</div>
          {hintText}
        </div>

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

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('analyticalOverview')}>← 이전: cp-overview</button>
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
