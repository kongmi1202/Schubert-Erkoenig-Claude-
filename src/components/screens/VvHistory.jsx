import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

const CARDS = [
  {
    icon: '🎼',
    title: '바로크 시대',
    body: `17~18세기 바로크 시대는 화려하고
장식적인 음악이 발전한 시기예요.
대위법, 통주저음, 협주곡 등
바로크 특유의 음악 형식이
이 시대에 꽃을 피웠습니다.`
  },
  {
    icon: '🎻',
    title: '비발디',
    body: `비발디(1678~1741)는 이탈리아 베네치아 출신으로
'빨간 머리 사제'라는 별명을 가졌어요.
500곡 이상의 협주곡을 작곡했으며
사계는 그의 대표작이에요.`
  },
  {
    icon: '🌸',
    title: '사계',
    body: `사계(Le Quattro Stagioni)는
1725년 출판된 바이올린 협주곡 모음이에요.
봄·여름·가을·겨울 각 계절을
소네트와 함께 음악으로 묘사한
표제음악의 걸작이에요.`
  },
  {
    icon: '🎵',
    title: '바이올린 협주곡',
    body: `협주곡은 독주 악기와 오케스트라가
함께 연주하는 형식이에요.
바이올린 협주곡은 바이올린 독주자가
현악 그룹과 대화하며 연주해요.
리토르넬로 형식이 핵심 구조예요.`
  }
];

function VvHistory({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const [flipped, setFlipped] = useState([false, false, false, false]);
  const [vvFlipped, setVvFlipped] = useState(0);

  function flipVV(cardEl, idx) {
    if (!cardEl.classList.contains('flipped')) {
      cardEl.classList.add('flipped');
      setFlipped((prev) => {
        const next = [...prev];
        next[idx] = true;
        return next;
      });
      setVvFlipped((prev) => {
        const nextCount = prev + 1;
        if (nextCount >= 4) setStageCompletion('history', true);
        return nextCount;
      });
    }
  }

  return (
    <div className="screen active" id="vv-history">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2-D · 분석적 감상 (비발디)</div>
        <div className="s-title">역사 맥락</div>
      </div>

      <div className="body voice-body">
        <div className="sec">바로크 핵심 카드</div>
        <div className="flip-grid">
          {CARDS.map((card, idx) => (
            <button
              key={card.title}
              type="button"
              className={`flip-card ${flipped[idx] ? 'flipped' : ''}`}
              onClick={(e) => flipVV(e.currentTarget, idx)}
            >
              <div className="flip-inner">
                <div className="flip-front">
                  <div className="flip-icon">{card.icon}</div>
                  <div className="flip-title">{card.title}</div>
                  <div className="flip-hint">클릭해서 뒤집기</div>
                </div>
                <div className="flip-back">
                  <div className="flip-body">{card.body}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div id="fb-vv-cards" className={`fb ${vvFlipped >= 4 ? 'show ok' : ''}`}>
          {vvFlipped >= 4 ? '✓ 4장을 모두 확인했어요!' : ''}
        </div>

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('pianoAnalysis')}>← 이전: vv-concerto</button>
          <button className="btn-p" onClick={() => go('aestheticPage')}>다음: 3단계(s3) →</button>
        </div>
      </div>
    </div>
  );
}

export default VvHistory;
