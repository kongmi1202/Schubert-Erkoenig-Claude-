import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

const CARDS = [
  {
    icon: '🎼',
    front: '낭만주의 시대',
    back: `19세기 낭만주의 시대는 개인의 감정과
내면세계를 표현하는 것을 중시했어요.
화려한 피아노 기법과 극적인
감정 표현이 발전한 시기예요.`
  },
  {
    icon: '🎹',
    front: '쇼팽',
    back: `쇼팽(1810~1849)은 폴란드 출신으로
'피아노의 시인'이라 불려요.
피아노 독주곡을 주로 작곡했으며
마주르카·녹턴·발라드·즉흥곡 등
다양한 장르를 남겼어요.`
  },
  {
    icon: '🌟',
    front: '환상 즉흥곡',
    back: `쇼팽이 생전에 출판을 거부한 곡이에요.
사후 1855년에 출판되었으며
'환상(Fantasie)'이라는 이름은
자유롭고 즉흥적인 느낌을 담아요.
실제로는 ABA 형식의 엄격한 구조예요.`
  },
  {
    icon: '🎵',
    front: '즉흥곡',
    back: `즉흥곡(Impromptu)은 즉흥적인 느낌을
주는 짧은 피아노 소품이에요.
실제로 즉흥 연주가 아니라
미리 작곡된 곡이지만
자유롭고 자연스러운 느낌을 특징으로 해요.`
  }
];

function CpHistory({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const [flipped, setFlipped] = useState([false, false, false, false]);
  const [cpFlipped, setCpFlipped] = useState(0);

  function flipCP(card, idx) {
    if (!card.classList.contains('flipped')) {
      card.classList.add('flipped');
      setFlipped((prev) => {
        const next = [...prev];
        next[idx] = true;
        return next;
      });
      setCpFlipped((prev) => {
        const nextCount = prev + 1;
        if (nextCount >= 4) setStageCompletion('history', true);
        return nextCount;
      });
    }
  }

  return (
    <div className="screen active" id="cp-history">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2-D · 분석적 감상 (쇼팽)</div>
        <div className="s-title">역사 맥락</div>
      </div>

      <div className="body voice-body">
        <div className="sec">표현 카드</div>
        <div className="flip-grid">
          {CARDS.map((card, idx) => (
            <button
              key={card.front}
              type="button"
              className={`flip-card ${flipped[idx] ? 'flipped' : ''}`}
              onClick={(e) => flipCP(e.currentTarget, idx)}
            >
              <div className="flip-inner">
                <div className="flip-front">
                  <div className="flip-icon">{card.icon}</div>
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

        <div id="fb-cp-cards" className={`fb ${cpFlipped >= 4 ? 'show ok' : ''}`}>
          {cpFlipped >= 4 ? '✓ 4장을 모두 확인했어요!' : ''}
        </div>

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('pianoAnalysis')}>← 이전: cp-rhythm</button>
          <button className="btn-p" onClick={() => go('aestheticPage')}>다음: 3단계(s3) →</button>
        </div>
      </div>
    </div>
  );
}

export default CpHistory;
