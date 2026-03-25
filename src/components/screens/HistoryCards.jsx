import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

const cards = [
  {
    id: 'fc1',
    icon: '🎼',
    title: '낭만 시대',
    body: '낭만 시대는 사람의 마음과 감정을 중요하게 본 시대예요. 그래서 마왕 음악도 무섭고 떨리는 느낌을 아주 생생하게 들려줘요.'
  },
  {
    id: 'fc2',
    icon: '🎹',
    title: '슈베르트',
    body: '슈베르트는 오스트리아 작곡가예요. 노래와 피아노를 멋지게 섞어 가곡을 많이 만들었고, 마왕도 그중 아주 유명한 곡이에요.'
  },
  {
    id: 'fc3',
    icon: '📖',
    title: '괴테',
    body: "괴테는 독일의 유명한 시인이에요. 슈베르트는 괴테의 시 '마왕'을 읽고, 그 이야기를 음악으로 바꾸어 만들었어요."
  },
  {
    id: 'fc4',
    icon: '🎵',
    title: '예술가곡',
    body: '예술가곡은 시에 멜로디를 붙인 노래예요. 노래하는 목소리와 피아노가 함께 이야기를 들려주는 특별한 음악이에요.'
  }
];

function HistoryCards({ go }) {
  const flippedCards = useAppStore((s) => s.flippedCards);
  const flipHistoryCard = useAppStore((s) => s.flipHistoryCard);
  const [allDone, setAllDone] = useState(false);

  useEffect(() => {
    setAllDone(flippedCards.length >= 4);
  }, [flippedCards]);

  return (
    <div className="screen active"><div className="stage-header"><div className="s-eyebrow">STAGE 2-D · 사회·역사적 맥락</div><div className="s-title">카드를 뒤집어 내용을 확인하세요</div></div>
      <div className="body">
        <div className="flip-grid">
          {cards.map((c) => (
            <button key={c.id} className={`flip-card ${flippedCards.includes(c.id) ? 'flipped' : ''}`} onClick={() => flipHistoryCard(c.id)}>
              <div className="flip-inner">
                <div className="flip-front">
                  <div className="flip-icon">{c.icon}</div>
                  <div className="flip-title">{c.title}</div>
                  <div className="flip-hint">클릭해서 뒤집기</div>
                </div>
                <div className="flip-back"><div className="flip-body">{c.body}</div></div>
              </div>
            </button>
          ))}
        </div>
        <div className={`fb ${allDone ? 'show ok' : ''}`}>✓ 4장을 모두 확인했어요! 다음 단계로 이동하세요.</div>
        {!allDone ? <div className="small-note">카드 4장을 모두 뒤집어야 다음 단계로 넘어갈 수 있어요.</div> : null}
        <div className="btn-row">
          <button className="btn-s" onClick={() => go('pianoAnalysis')}>← 이전</button>
          <button className="btn-p" disabled={!allDone} onClick={() => go('aestheticPage')} style={!allDone ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}>다음 단계 →</button>
        </div>
      </div>
    </div>
  );
}

export default HistoryCards;
