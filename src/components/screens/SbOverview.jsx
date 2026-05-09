import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

const q1Answer = '소프라노(또는 메조소프라노) 성악, 플루트, 클라리넷, 바이올린, 첼로, 피아노로 구성된 실내악이에요.';
const helperHints = [
  '들리는 악기 이름을 생각나는 만큼 써보세요.',
  '목소리가 노래처럼 들리는지 말처럼 들리는지 써보세요.',
  '음악 분위기를 단어 2개로 써보세요. (예: 불안, 신비)'
];
function SbOverview({ go }) {
  const selectedKeywords = useAppStore((s) => s.selectedKeywords);
  const sensoryDesc = useAppStore((s) => s.sensoryDesc);
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const [q1, setQ1] = useState('');
  const [showQ1Hint, setShowQ1Hint] = useState(false);
  const [q1Open, setQ1Open] = useState(false);
  const [q1Hint, setQ1Hint] = useState(helperHints[0]);

  const canProceed = useMemo(() => q1.trim(), [q1]);
  const canOpenAnswer = canProceed;

  const showHint = (forQ1) => {
    const next = helperHints[Math.floor(Math.random() * helperHints.length)];
    if (forQ1) {
      setQ1Hint(next);
      setShowQ1Hint(true);
    }
  };
  return (
    <div className="screen active" id="sb-overview">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2-A · 분석적 감상 (쇤베르크)</div>
        <div className="s-title">개요 파악</div>
      </div>

      <div className="body video-page-body">
        <div className="sec">1단계 감각적 감상 결과</div>
        <div className="review-card" style={{ marginBottom: 18 }}>
          <div className="review-grid">
            <div>
              <div className="review-section-title">감성 키워드</div>
              <div id="rv-kw-sb" className="review-item">{selectedKeywords.join(', ') || '선택 없음'}</div>
            </div>
            <div>
              <div className="review-section-title">서술</div>
              <div id="rv-desc-sb" className="review-item">{sensoryDesc || '서술 없음'}</div>
            </div>
          </div>
        </div>

        <div className="sec">해설 영상</div>
        <div className="video-wrap" style={{ marginBottom: 20 }}>
          <iframe
            src="https://www.youtube.com/embed/wEW4mxAbank"
            title="쇤베르크 달에 홀린 피에로 개요 영상"
            allowFullScreen
          />
        </div>

        <div className="sec">Q1. 이 음악을 연주하는 악기와 목소리 형태는?</div>
        <textarea
          className="txt"
          value={q1}
          onChange={(e) => setQ1(e.target.value)}
          placeholder="악기 편성과 목소리 형태를 적어보세요."
        />
        <button type="button" className="ai-btn" onClick={() => showHint(true)}>✨ 참고 예시 보기</button>
        <div className={`ai-bubble ${showQ1Hint ? 'show' : ''}`}>
          <div className="ai-bubble-label">참고 예시 (정답 아님 · 그대로 복사 금지)</div>
          {q1Hint}
        </div>
        <button
          type="button"
          className="answer-check-toggle"
          onClick={() => setQ1Open((prev) => !prev)}
          aria-expanded={q1Open}
          disabled={!canOpenAnswer}
          style={!canOpenAnswer ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
        >
          <span className="answer-check-toggle-label">정답 확인하기</span>
          <span className="answer-check-toggle-chevron" aria-hidden="true">{q1Open ? '▲' : '▼'}</span>
        </button>
        <div className={`answer-compare-slide ${q1Open ? 'open' : ''}`}>
          <div className="answer-compare-inner">
            <div className="fb show info">정답: {q1Answer}</div>
          </div>
        </div>

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('sensoryPage')}>← 이전</button>
          <button
            className="btn-p"
            disabled={!canProceed}
            style={!canProceed ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            onClick={() => {
              setStageCompletion('analytical', true);
              go('voiceDesign');
            }}
          >
            다음: sb-sprech →
          </button>
        </div>
      </div>
    </div>
  );
}

export default SbOverview;
