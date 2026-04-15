import { useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

const HY_CARDS = [
  {
    id: 'hy-c1',
    front: '🎼 고전주의 시대',
    back: `18세기 고전주의 시대는 바로크의 복잡함에서 벗어나
균형·명료함·형식미를 추구한 시기예요.
소나타 형식, 교향곡, 현악 4중주 등이 이 시대에 발전했습니다.`
  },
  {
    id: 'hy-c2',
    front: '🎹 하이든',
    back: `하이든(1732~1809)은 오스트리아 출신으로
'교향곡의 아버지', '현악 4중주의 아버지'로 불려요.
에스테르하지 궁정에서 30년간 봉직하며
100곡 이상의 교향곡을 작곡했습니다.`
  },
  {
    id: 'hy-c3',
    front: '🐦 종달새',
    back: `현악 4중주 67번 '종달새'는 1악장 시작 부분에서
제1바이올린이 높고 맑게 노래하는 선율이
종달새 소리를 연상시켜 붙여진 별명이에요.
하이든 만년의 걸작이에요.`
  },
  {
    id: 'hy-c4',
    front: '🎵 소나타 형식',
    back: `고전주의 기악의 핵심 형식으로
제시부(두 주제 제시) → 발전부(주제 변형·발전)
→ 재현부(주제 반복)로 구성돼요.
두 주제의 대비와 조성 변화가 핵심이에요.`
  }
];

function HistoryCardsHaydn({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const [flipped, setFlipped] = useState([]);
  const [fbText, setFbText] = useState('');
  const [fbClassName, setFbClassName] = useState('fb');
  const hyFlipped = useRef(0);

  function flipHy(cardId) {
    if (flipped.includes(cardId)) return;
    const next = [...flipped, cardId];
    setFlipped(next);
    hyFlipped.current += 1;
    if (hyFlipped.current >= 4) {
      setFbText('✓ 4장을 모두 확인했어요!');
      setFbClassName('fb show ok');
    }
  }

  const allChecked = useMemo(() => flipped.length >= 4, [flipped]);

  return (
    <div className="screen active">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2-D · 분석적 감상 (하이든)</div>
        <div className="s-title">역사적 맥락 카드</div>
        <div className="s-desc">카드를 클릭해 앞뒤를 확인해보세요.</div>
      </div>
      <div className="body voice-body">
        <div className="flip-grid">
          {HY_CARDS.map((card) => (
            <button
              key={card.id}
              type="button"
              className={`flip-card ${flipped.includes(card.id) ? 'flipped' : ''}`}
              onClick={() => flipHy(card.id)}
              aria-pressed={flipped.includes(card.id)}
            >
              <div className="flip-inner">
                <div className="flip-front">
                  <div className="flip-title">{card.front}</div>
                  <div className="flip-hint">클릭해서 뒤집기</div>
                </div>
                <div className="flip-back">
                  <div className="flip-body" style={{ whiteSpace: 'pre-line' }}>{card.back}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div id="fb-hy-cards" className={fbClassName}>{fbText}</div>

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

export default HistoryCardsHaydn;
