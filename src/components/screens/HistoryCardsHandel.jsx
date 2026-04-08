import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

const cards = [
  {
    id: 'baroque',
    front: '🎼 바로크 시대',
    back:
      '17~18세기 바로크 시대는 교회와 왕실이 음악의 최대 후원자였던 시기예요. 웅장하고 화려한 음악이 발전했으며 오라토리오도 이때 크게 발전했습니다.'
  },
  {
    id: 'handel',
    front: '🎹 헨델',
    back:
      '헨델(1685~1759)은 독일 태생으로 영국에서 활동했어요. 오페라로 큰 성공을 거뒀다가 파산 위기 후 오라토리오로 전환해 메시아로 재기했습니다.'
  },
  {
    id: 'standing',
    front: '👑 기립 전통',
    back:
      '1743년 런던 공연에서 조지 2세가 할렐루야 합창에 감동해 일어섰고, 신하들도 따라 일어섰다는 이야기가 전해져요. 이것이 오늘날 기립 전통의 유래예요.'
  },
  {
    id: 'oratorio',
    front: '🎵 오라토리오',
    back:
      '종교적 내용의 대규모 성악 작품으로, 무대 의상이나 연기 없이 연주해요. 오페라와 달리 종교적 이야기를 음악으로만 표현합니다.'
  }
];

function HistoryCardsHandel({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const [flipped, setFlipped] = useState([]);

  const flip = (id) => {
    setFlipped((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const allChecked = useMemo(() => flipped.length === cards.length, [flipped]);

  return (
    <div className="screen active">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2-D · 분석적 감상 (할렐루야)</div>
        <div className="s-title">역사적 맥락 카드</div>
        <div className="s-desc">카드를 클릭(탭)해 앞뒤를 확인해보세요.</div>
      </div>
      <div className="body voice-body">
        <div className="flip-grid">
          {cards.map((card) => (
            <button
              key={card.id}
              type="button"
              className={`flip-card ${flipped.includes(card.id) ? 'flipped' : ''}`}
              onClick={() => flip(card.id)}
              aria-pressed={flipped.includes(card.id)}
            >
              <div className="flip-inner">
                <div className="flip-front">
                  <div className="flip-title">{card.front}</div>
                  <div className="flip-hint">클릭해서 뒤집기</div>
                </div>
                <div className="flip-back">
                  <div className="flip-body">{card.back}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {allChecked ? <div className="fb show ok">✓ 4장을 모두 확인했어요!</div> : null}

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('pianoAnalysis')}>← 이전</button>
          <button
            className="btn-p"
            disabled={!allChecked}
            style={!allChecked ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            onClick={() => {
              setStageCompletion('history', true);
              go('aestheticPage');
            }}
          >
            3단계로 이동 →
          </button>
        </div>
      </div>
    </div>
  );
}

export default HistoryCardsHandel;
