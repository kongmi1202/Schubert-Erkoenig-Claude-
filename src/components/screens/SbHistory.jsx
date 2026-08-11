import { useEffect, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';

const CARDS = [
  {
    id: 'sb-c1',
    icon: '🎨',
    title: '표현주의 시대',
    body: `20세기 초 표현주의는 사실적 묘사보다
인간 내면의 감정을 극단적으로 표현하는
예술 운동이에요. 회화·음악·문학 등
여러 분야에 걸쳐 나타났어요.`
  },
  {
    id: 'sb-c2',
    icon: '🎵',
    title: '쇤베르크',
    body: `쇤베르크(1874~1951)는 오스트리아 출신으로
조성 음악의 전통을 깨고 무조음악과
12음 기법을 개척했어요.
달에 홀린 피에로는 그의 대표작이에요.`
  },
  {
    id: 'sb-c3',
    icon: '🖼️',
    title: '뭉크와 칸딘스키',
    body: `노르웨이 화가 뭉크의 '절규'와
러시아 화가 칸딘스키의 추상화는
쇤베르크 음악과 같은 시대에
같은 표현주의 정신을 공유해요.`
  },
  {
    id: 'sb-c4',
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
  const selectedSong = useAppStore((s) => s.selectedSong);
  const flippedHistoryCardsBySong = useAppStore((s) => s.flippedHistoryCardsBySong);
  const flipHistoryCard = useAppStore((s) => s.flipHistoryCard);
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const flippedIds = flippedHistoryCardsBySong[selectedSong] || [];
  const allChecked = useMemo(() => flippedIds.length >= CARDS.length, [flippedIds]);

  useEffect(() => {
    if (allChecked) setStageCompletion('history', true);
  }, [allChecked, setStageCompletion]);

  return (
    <div className="screen active" id="sb-history">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 3 · 심미적 감상</div>
        <div className="s-title">심미적 감상</div>
        <div className="s-desc">목표: 음악의 다양한 요소들을 바탕으로 음악의 가치를 평가해 보세요.</div>
      </div>

      <div className="body voice-body">
        <div className="sec">1. 카드를 뒤집어 이 곡의 사회역사적 맥락을 알아보세요.</div>
        <div className="flip-grid">
          {CARDS.map((card) => (
            <button
              key={card.id}
              type="button"
              className={`flip-card ${flippedIds.includes(card.id) ? 'flipped' : ''}`}
              onClick={() => flipHistoryCard(card.id)}
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

        <div id="fb-sb-cards" className={`fb ${allChecked ? 'show ok' : ''}`}>
          {allChecked ? '✓ 4장을 모두 확인했어요!' : ''}
        </div>

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('pianoAnalysis')}>← 이전: sb-atonal</button>
          <button className="btn-p" onClick={() => { setStageCompletion('history', true); go('aestheticPage'); }}>다음: 가치 판단 →</button>
        </div>
      </div>
    </div>
  );
}

export default SbHistory;
