import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import CompareAiFeedbackBlock from '../CompareAiFeedbackBlock';
import ArtSongTakeaway from '../ArtSongTakeaway';
import VvSonnetYoutubeAudio from '../VvSonnetYoutubeAudio';
import { generateStage2ActivityFeedback } from '../../lib/formativeAiFeedback';

const SEGMENTS = {
  tonal: {
    videoId: 'ZNHHeGwwC3Y',
    start: 13,
    end: 45
  },
  atonal: {
    videoId: '-FUySRVF75k',
    start: 4,
    end: 28
  }
};

const MATCH_CARDS = [
  '조성이 있다',
  '조성이 없다',
  '편안하고 안정적',
  '낯설고 긴장감',
  '음들이 따로 논다.',
  '음들이 서로 잘 어울린다.'
];

function SbAtonal({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const sbAtonalState = useAppStore((s) => s.sbAtonalState);
  const setSbAtonalState = useAppStore((s) => s.setSbAtonalState);
  const [playing, setPlaying] = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  const [placedCards, setPlacedCards] = useState(() => (
    sbAtonalState?.placedCards || { tonal: [], atonal: [] }
  ));
  const [fbDone, setFbDone] = useState(false);
  const [audioReady, setAudioReady] = useState({ tonal: false, atonal: false });
  const tonalPlayerRef = useRef(null);
  const atonalPlayerRef = useRef(null);

  const usedCards = [...placedCards.tonal, ...placedCards.atonal];
  const canCheck = usedCards.length === MATCH_CARDS.length;

  const matchSnapshot = useMemo(
    () =>
      JSON.stringify({
        tonal: [...placedCards.tonal].sort(),
        atonal: [...placedCards.atonal].sort()
      }),
    [placedCards]
  );

  useEffect(() => {
    const summary = canCheck
      ? `송어: ${placedCards.tonal.join(', ')} / 피에로: ${placedCards.atonal.join(', ')}`
      : '';
    setSbAtonalState({ placedCards, selectedChoice: summary });
  }, [placedCards, canCheck, setSbAtonalState]);

  const resetAfterPlacementChange = () => {
    setFbDone(false);
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

  const playAudio = (kind) => {
    const current = kind === 'tonal' ? tonalPlayerRef.current : atonalPlayerRef.current;
    const other = kind === 'tonal' ? atonalPlayerRef.current : tonalPlayerRef.current;
    if (!current?.isReady?.()) return;

    if (playing === kind) {
      current.pause();
      setPlaying('');
      return;
    }

    other?.pause?.();
    other?.stop?.();
    current.play();
    setPlaying(kind);
  };

  return (
    <div className="screen active" id="sb-atonal">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2 · 분석적 감상</div>
        <div className="s-title">분석적 감상</div>
        <div className="s-desc">목표: 음악 요소, 음악적 특징 및 구성을 분석하여 음악이 어떻게 표현되고 구성되는지 파악해 보세요.</div>
      </div>

      <div className="body voice-body">
        <div className="sec">
          4. 두 곡을 들으며 아래 카드 중 알맞은 것을 각 곡 칸에 넣어보세요.
        </div>
        <VvSonnetYoutubeAudio
          ref={tonalPlayerRef}
          videoId={SEGMENTS.tonal.videoId}
          start={SEGMENTS.tonal.start}
          end={SEGMENTS.tonal.end}
          onReady={() => setAudioReady((prev) => ({ ...prev, tonal: true }))}
          onPlaybackStateChange={(isPlaying) => {
            setPlaying((prev) => (isPlaying ? 'tonal' : prev === 'tonal' ? '' : prev));
          }}
        />
        <VvSonnetYoutubeAudio
          ref={atonalPlayerRef}
          videoId={SEGMENTS.atonal.videoId}
          start={SEGMENTS.atonal.start}
          end={SEGMENTS.atonal.end}
          onReady={() => setAudioReady((prev) => ({ ...prev, atonal: true }))}
          onPlaybackStateChange={(isPlaying) => {
            setPlaying((prev) => (isPlaying ? 'atonal' : prev === 'atonal' ? '' : prev));
          }}
        />
        <div className="sb-atonal-activity">
        <div className="compare-listen" style={{ marginBottom: 14 }}>
          <div className="cl-card tonal">
            <div className="cl-label" style={{ fontSize: 16, fontWeight: 700, color: '#9fd0ff' }}>슈베르트 "송어"</div>
            <button
              id="sb-tonal-aud"
              type="button"
              className="btn-s"
              disabled={!audioReady.tonal}
              onClick={() => playAudio('tonal')}
            >
              {playing === 'tonal' ? '❚❚ 일시정지' : '▶ 재생'}
            </button>
          </div>
          <div className="cl-card atonal">
            <div className="cl-label" style={{ fontSize: 16, fontWeight: 700, color: '#f5c76a' }}>달에 홀린 피에로 중 "달에 취하여"</div>
            <button
              id="sb-atonal-aud"
              type="button"
              className="btn-s"
              disabled={!audioReady.atonal}
              onClick={() => playAudio('atonal')}
            >
              {playing === 'atonal' ? '❚❚ 일시정지' : '▶ 재생'}
            </button>
          </div>
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
        </div>

        <CompareAiFeedbackBlock
          key={`sb-atonal-ai-${matchSnapshot}`}
          requestFn={() =>
            generateStage2ActivityFeedback('sb-atonal', {
              tonalCards: placedCards.tonal,
              atonalCards: placedCards.atonal
            })
          }
          onResult={() => {
            setFbDone(true);
            setStageCompletion('piano', true);
          }}
        />
        {!canCheck ? (
          <div className="small-note" style={{ marginTop: 8, marginBottom: 8 }}>
            여섯 장의 카드를 모두 칸에 넣어 주세요.
          </div>
        ) : null}

        {fbDone ? (
          <ArtSongTakeaway
            eyebrow="② 달에 홀린 피에로의 특징 2"
            title="무조성 음악"
            description="무조성 음악은 중심음이 분명하지 않아 음이 떠다니는 듯 들립니다. 표현주의는 겉으로 보이는 아름다움보다 인간 내면의 불안·공포·혼란을 극단적으로 드러내는 것을 목표로 해요. 무조성은 조성 음악의 안정감을 깨뜨리며 이러한 감정을 음악으로 표현하는 핵심 수단이 됩니다."
          />
        ) : null}

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('voiceDesign')}>← 이전: sb-sprech</button>
          <button className="btn-p" onClick={() => { setStageCompletion('piano', true); go('historyCards'); }}>다음: 역사 맥락 →</button>
        </div>
      </div>
    </div>
  );
}

export default SbAtonal;
