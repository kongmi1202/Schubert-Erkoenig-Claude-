import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

const CARDS = [
  {
    icon: '🎨',
    title: '표현주의 시대',
    body: `20세기 초 표현주의는 사실적 묘사보다
인간 내면의 감정을 극단적으로 표현하는
예술 운동이에요. 회화·음악·문학 등
여러 분야에 걸쳐 나타났어요.`
  },
  {
    icon: '🎵',
    title: '쇤베르크',
    body: `쇤베르크(1874~1951)는 오스트리아 출신으로
조성 음악의 전통을 깨고 무조음악과
12음 기법을 개척했어요.
달에 홀린 피에로는 그의 대표작이에요.`
  },
  {
    icon: '🖼️',
    title: '뭉크와 칸딘스키',
    body: `노르웨이 화가 뭉크의 '절규'와
러시아 화가 칸딘스키의 추상화는
쇤베르크 음악과 같은 시대에
같은 표현주의 정신을 공유해요.`
  },
  {
    icon: '🌙',
    title: '달에 홀린 피에로',
    body: `1912년 발표된 이 작품은
알베르 지로의 시 21편에
쇤베르크가 곡을 붙인 멜로드라마예요.
슈프레흐슈팀메와 무조성으로
20세기 음악의 문을 열었어요.`
  }
];

function SbHistory({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const [artCommon, setArtCommon] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [flipped, setFlipped] = useState([false, false, false, false]);
  const [sbFlipped, setSbFlipped] = useState(0);

  function flipSB(cardEl, idx) {
    if (!cardEl.classList.contains('flipped')) {
      cardEl.classList.add('flipped');
      setFlipped((prev) => {
        const next = [...prev];
        next[idx] = true;
        return next;
      });
      setSbFlipped((prev) => {
        const nextCount = prev + 1;
        if (nextCount >= 4) setStageCompletion('history', true);
        return nextCount;
      });
    }
  }

  return (
    <div className="screen active" id="sb-history">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2-D · 분석적 감상 (쇤베르크)</div>
        <div className="s-title">역사 맥락</div>
      </div>

      <div className="body voice-body">
        <div className="sec">이미지 비교 섹션</div>
        <div className="art-compare">
          <div className="art-card">
            <div className="art-img-ph">
              <div style={{ fontSize: 34 }}>😱</div>
              <div>뭉크 '절규' 1893</div>
            </div>
            <div className="art-info">
              <div className="art-name">뭉크 '절규'</div>
              <div className="art-desc">에드바르 뭉크 · 1893</div>
            </div>
          </div>
          <div className="art-card">
            <div className="art-img-ph">
              <div style={{ fontSize: 34 }}>🎨</div>
              <div>쇤베르크 '붉은 시선' 1910</div>
            </div>
            <div className="art-info">
              <div className="art-name">쇤베르크 '붉은 시선'</div>
              <div className="art-desc">아놀드 쇤베르크 · 1910</div>
            </div>
          </div>
        </div>

        <div className="sec">느낌 서술</div>
        <div style={{ marginBottom: 8 }}>두 그림과 달에 홀린 피에로의 공통점은 무엇인가요?</div>
        <textarea
          id="sb-art-common"
          className="txt"
          value={artCommon}
          onChange={(e) => setArtCommon(e.target.value)}
          placeholder="세 작품의 공통된 느낌이나 표현 방식을 써보세요..."
        />
        <button type="button" className="ai-btn" onClick={() => setShowHint((prev) => !prev)}>✨ AI 도우미</button>
        <div className={`ai-bubble ${showHint ? 'show' : ''}`}>
          <div className="ai-bubble-label">예시</div>
          세 작품 모두 불안하고 혼란스러운
          <br />
          인간의 내면을 표현하고 있어요.
          <br />
          뭉크와 쇤베르크가 시각 예술에서
          <br />
          형태와 색채로 감정을 표현했듯이
          <br />
          쇤베르크는 음악에서 무조성과
          <br />
          슈프레흐슈팀메로 그 감정을 표현했어요.
        </div>

        <div className="sec">표현주의 핵심 카드</div>
        <div className="flip-grid">
          {CARDS.map((card, idx) => (
            <button
              key={card.title}
              type="button"
              className={`flip-card ${flipped[idx] ? 'flipped' : ''}`}
              onClick={(e) => flipSB(e.currentTarget, idx)}
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

        <div id="fb-sb-cards" className={`fb ${sbFlipped >= 4 ? 'show ok' : ''}`}>
          {sbFlipped >= 4 ? '✓ 4장을 모두 확인했어요!' : ''}
        </div>

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('pianoAnalysis')}>← 이전: sb-atonal</button>
          <button className="btn-p" onClick={() => go('aestheticPage')}>다음: 3단계(s3) →</button>
        </div>
      </div>
    </div>
  );
}

export default SbHistory;
