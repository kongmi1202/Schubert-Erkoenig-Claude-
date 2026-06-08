import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import CompareAiFeedbackBlock from '../CompareAiFeedbackBlock';
import { canOpenAnswerAfterFormativeAiGate, generateSbAtonalMatchFeedback } from '../../lib/compareFeedback';

const AUDIO_SRC = {
  tonal: '/audio/sb-tonal-aud.mp3',
  atonal: '/audio/sb-atonal-aud.mp3'
};

const MATCH_CARDS = [
  '조성 음악',
  '무조성 음악',
  '편안하고 안정적',
  '낯설고 긴장감',
  '음들이 따로 논다.',
  '음들이 서로 잘 어울린다.'
];

const TONAL_ANSWERS = new Set(['조성 음악', '편안하고 안정적', '음들이 서로 잘 어울린다.']);
const ATONAL_ANSWERS = new Set(['무조성 음악', '낯설고 긴장감', '음들이 따로 논다.']);

function columnOk(placed, correctSet, wrongSet) {
  if (!Array.isArray(placed) || placed.length === 0) return false;
  const hasCorrect = placed.some((card) => correctSet.has(card));
  const hasWrong = placed.some((card) => wrongSet.has(card));
  return hasCorrect && !hasWrong;
}

function SbAtonal({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const sbAtonalState = useAppStore((s) => s.sbAtonalState);
  const setSbAtonalState = useAppStore((s) => s.setSbAtonalState);
  const [playing, setPlaying] = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  const [placedCards, setPlacedCards] = useState(() => (
    sbAtonalState?.placedCards || { tonal: [], atonal: [] }
  ));
  const [answerOpen, setAnswerOpen] = useState(false);
  const [answerChecked, setAnswerChecked] = useState(false);
  const [matchAiGate, setMatchAiGate] = useState(null);
  const tonalRef = useRef(null);
  const atonalRef = useRef(null);

  const usedCards = [...placedCards.tonal, ...placedCards.atonal];
  const canCheck = usedCards.length === MATCH_CARDS.length;
  const tonalColOk = columnOk(placedCards.tonal, TONAL_ANSWERS, ATONAL_ANSWERS);
  const atonalColOk = columnOk(placedCards.atonal, ATONAL_ANSWERS, TONAL_ANSWERS);
  const isCorrect = canCheck && tonalColOk && atonalColOk;

  const matchSnapshot = useMemo(
    () =>
      JSON.stringify({
        tonal: [...placedCards.tonal].sort(),
        atonal: [...placedCards.atonal].sort()
      }),
    [placedCards]
  );

  const canOpenAnswerCheck =
    canCheck &&
    matchAiGate?.feedbackCompleted &&
    canOpenAnswerAfterFormativeAiGate({
      feedbackCompleted: matchAiGate.feedbackCompleted,
      wasCorrectWhenFeedbackRequested: matchAiGate.wasCorrectWhenFeedbackRequested,
      responseAtFeedback: matchAiGate.responseAtFeedback,
      currentResponse: matchSnapshot
    });

  useEffect(() => {
    const summary = canCheck
      ? `송어: ${placedCards.tonal.join(', ')} / 피에로: ${placedCards.atonal.join(', ')}`
      : '';
    setSbAtonalState({ placedCards, selectedChoice: summary });
  }, [placedCards, canCheck, setSbAtonalState]);

  const resetAfterPlacementChange = () => {
    setMatchAiGate(null);
    setAnswerOpen(false);
    setAnswerChecked(false);
  };

  const placeCard = (slot) => {
    if (!selectedCard) return;
    if (usedCards.includes(selectedCard)) return;
    setPlacedCards((prev) => ({ ...prev, [slot]: [...prev[slot], selectedCard] }));
    setSelectedCard('');
    resetAfterPlacementChange();
  };

  const removeCard = (slot, card) => {
    setPlacedCards((prev) => ({ ...prev, [slot]: prev[slot].filter((item) => item !== card) }));
    resetAfterPlacementChange();
  };

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

  const checkAnswer = () => {
    if (!canOpenAnswerCheck) return;
    setAnswerChecked(true);
    setAnswerOpen((prev) => !prev);
    setStageCompletion('piano', true);
  };

  return (
    <div className="screen active" id="sb-atonal">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2-C · 분석적 감상 (쇤베르크)</div>
        <div className="s-title">무조성</div>
        <div className="s-desc">음악 요소: 음계</div>
      </div>

      <div className="body voice-body">
        <div className="sec">1) 비교 듣기</div>
        <audio id="sb-tonal-source" ref={tonalRef} src={AUDIO_SRC.tonal} preload="metadata" onEnded={() => setPlaying((p) => (p === 'tonal' ? '' : p))} />
        <audio id="sb-atonal-source" ref={atonalRef} src={AUDIO_SRC.atonal} preload="metadata" onEnded={() => setPlaying((p) => (p === 'atonal' ? '' : p))} />
        <div className="compare-listen" style={{ marginBottom: 18 }}>
          <div className="cl-card tonal">
            <div className="cl-label" style={{ fontSize: 16, fontWeight: 700, color: '#9fd0ff' }}>슈베르트 "송어"</div>
            <button id="sb-tonal-aud" type="button" className="btn-s" onClick={() => playAudio('tonal')}>
              {playing === 'tonal' ? '❚❚ 일시정지' : '▶ 재생'}
            </button>
          </div>
          <div className="cl-card atonal">
            <div className="cl-label" style={{ fontSize: 16, fontWeight: 700, color: '#f5c76a' }}>달에 홀린 피에로 중 "달에 취하여"</div>
            <button id="sb-atonal-aud" type="button" className="btn-s" onClick={() => playAudio('atonal')}>
              {playing === 'atonal' ? '❚❚ 일시정지' : '▶ 재생'}
            </button>
          </div>
        </div>

        <div className="sec">2) 카드 선택</div>
        <div className="fb show info" style={{ marginBottom: 12, whiteSpace: 'pre-line', borderLeft: '4px solid #8b5cf6' }}>
          {`💡 두 곡을 들으며 아래 카드 중 알맞은 것을
각 곡 칸에 넣어보세요.`}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          {MATCH_CARDS.map((card) => {
            const exhausted = usedCards.includes(card);
            const isSel = selectedCard === card;
            return (
              <button
                key={card}
                type="button"
                onClick={() => setSelectedCard(card)}
                disabled={exhausted}
                style={{
                  border: '1px solid var(--border)',
                  background: isSel ? 'rgba(139, 92, 246, 0.25)' : 'rgba(16, 16, 30, 0.9)',
                  padding: '14px 14px',
                  fontSize: 15,
                  fontWeight: 700,
                  borderRadius: 8,
                  cursor: exhausted ? 'not-allowed' : 'pointer',
                  opacity: exhausted ? 0.45 : 1,
                  color: isSel ? '#d8c0ff' : '#f3f4ff',
                  borderColor: isSel ? '#8b5cf6' : 'var(--border)'
                }}
              >
                {card}
              </button>
            );
          })}
        </div>

        <div className="sec" style={{ marginTop: 4 }}>3) 곡 칸에 배치</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => placeCard('tonal')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                placeCard('tonal');
              }
            }}
            style={{
              minHeight: 120,
              border: '1px solid var(--border)',
              borderLeft: '4px solid #4a7fc1',
              borderRadius: 8,
              background: 'rgba(74, 127, 193, 0.08)',
              padding: 12,
              cursor: 'pointer'
            }}
          >
            <div style={{ fontWeight: 700, color: '#9fd0ff', fontSize: 16, marginBottom: 8 }}>슈베르트 "송어"</div>
            {placedCards.tonal.length === 0 ? (
              <div style={{ color: 'var(--text-faint)', fontSize: 12, textAlign: 'center', marginTop: 28 }}>
                카드를 선택한 후 탭하세요
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {placedCards.tonal.map((card) => (
                  <button
                    key={`tonal-${card}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCard('tonal', card);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 10px',
                      background: 'var(--surface2)',
                      border: '1px solid var(--border2)',
                      borderRadius: 4,
                      color: 'var(--text)',
                      fontSize: 11
                    }}
                  >
                    {card} ✕
                  </button>
                ))}
              </div>
            )}
          </div>

          <div
            role="button"
            tabIndex={0}
            onClick={() => placeCard('atonal')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                placeCard('atonal');
              }
            }}
            style={{
              minHeight: 120,
              border: '1px solid var(--border)',
              borderLeft: '4px solid #c4922a',
              borderRadius: 8,
              background: 'rgba(196, 146, 42, 0.08)',
              padding: 12,
              cursor: 'pointer'
            }}
          >
            <div style={{ fontWeight: 700, color: '#f5c76a', fontSize: 16, marginBottom: 8 }}>달에 홀린 피에로</div>
            {placedCards.atonal.length === 0 ? (
              <div style={{ color: 'var(--text-faint)', fontSize: 12, textAlign: 'center', marginTop: 28 }}>
                카드를 선택한 후 탭하세요
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {placedCards.atonal.map((card) => (
                  <button
                    key={`atonal-${card}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeCard('atonal', card);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 10px',
                      background: 'var(--surface2)',
                      border: '1px solid var(--border2)',
                      borderRadius: 4,
                      color: 'var(--text)',
                      fontSize: 11
                    }}
                  >
                    {card} ✕
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <CompareAiFeedbackBlock
          key={`sb-atonal-ai-${matchSnapshot}`}
          disabled={!canCheck}
          requestFn={() =>
            generateSbAtonalMatchFeedback({
              tonalCards: placedCards.tonal,
              atonalCards: placedCards.atonal
            })
          }
          onRequested={() => {
            setMatchAiGate({
              feedbackCompleted: false,
              responseAtFeedback: matchSnapshot,
              wasCorrectWhenFeedbackRequested: isCorrect
            });
            setAnswerOpen(false);
          }}
          onResult={() => {
            setMatchAiGate((g) => (g ? { ...g, feedbackCompleted: true } : g));
          }}
        />
        {!canCheck ? (
          <div className="small-note" style={{ marginTop: 8, marginBottom: 8 }}>
            여섯 장의 카드를 모두 칸에 넣어 주세요.
          </div>
        ) : null}

        <button
          type="button"
          className="answer-check-toggle"
          onClick={checkAnswer}
          aria-expanded={answerOpen}
          disabled={!canOpenAnswerCheck}
          style={!canOpenAnswerCheck ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
        >
          <span className="answer-check-toggle-label">
            {canOpenAnswerCheck ? '정답 확인하기' : '피드백 반영 후 정답 확인하기'}
          </span>
          <span className="answer-check-toggle-chevron" aria-hidden="true">{answerOpen ? '▲' : '▼'}</span>
        </button>
        {matchAiGate?.feedbackCompleted &&
        matchAiGate.wasCorrectWhenFeedbackRequested &&
        matchSnapshot === matchAiGate.responseAtFeedback ? (
          <div className="small-note" style={{ marginTop: 8 }}>
            좋아요! 현재 배치가 정답과 일치해서 바로 확인할 수 있어요.
          </div>
        ) : null}
        <div className={`answer-compare-slide ${answerOpen ? 'open' : ''}`}>
          <div className="answer-compare-inner">
            {answerChecked && isCorrect ? (
              <div className="fb show ok">
                ✓ 맞아요! 송어는 조성 음악이라 음들이 서로 어울리고 안정적으로 들려요.
                <br />
                달에 홀린 피에로는 무조성 음악이라 낯설고 긴장감 있는 느낌이 나타나요.
              </div>
            ) : answerChecked ? (
              <div className="fb show ng">
                ✗ 아직 일부 카드가 맞지 않아요.
                <br />
                두 곡을 다시 듣고, 안정적으로 어울리는 느낌인지
                <br />
                낯설고 긴장된 느낌인지 기준으로 다시 배치해 보세요.
              </div>
            ) : null}
          </div>
        </div>

        {canCheck && isCorrect ? (
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
        ) : null}

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('voiceDesign')}>← 이전: sb-sprech</button>
          <button className="btn-p" onClick={() => go('historyCards')}>다음: sb-history →</button>
        </div>
      </div>
    </div>
  );
}

export default SbAtonal;
