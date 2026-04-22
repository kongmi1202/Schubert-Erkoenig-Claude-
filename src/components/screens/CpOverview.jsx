import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

function CpOverview({ go }) {
  const selectedKeywords = useAppStore((s) => s.selectedKeywords);
  const sensoryDesc = useAppStore((s) => s.sensoryDesc);
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const analyticalCharacters = useAppStore((s) => s.analyticalCharacters);
  const analyticalStory = useAppStore((s) => s.analyticalStory);
  const setAnalyticalCharacter = useAppStore((s) => s.setAnalyticalCharacter);
  const setAnalyticalStory = useAppStore((s) => s.setAnalyticalStory);
  const q1 = analyticalCharacters?.[0] || '';
  const q2 = analyticalStory || '';
  const [showQ1Hint, setShowQ1Hint] = useState(false);
  const [showQ2Hint, setShowQ2Hint] = useState(false);
  const [q1Open, setQ1Open] = useState(false);
  const [q2Open, setQ2Open] = useState(false);

  const canProceed = useMemo(() => q1.trim() && q2.trim(), [q1, q2]);
  const q1Example = `연주 인원이 많은지, 한 악기만 들리는지 먼저 체크해보세요.
선율·반주가 한 악기 안에서 함께 들리는지도 근거가 됩니다.
답안은 "무슨 악기 + 어떤 편성" 순서로 써보세요.`;
  const q2Example = `처음 20초와 중간 구간의 분위기 단어를 각각 2개씩 적어보세요.
빠르기·세기·선율 밀도가 언제 바뀌는지 표시하면 좋아요.
느낌이 바뀌는 시점을 한 문장으로 연결해보세요.`;

  return (
    <div className="screen active" id="cp-overview">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2-A · 분석적 감상 (쇼팽)</div>
        <div className="s-title">개요 파악</div>
      </div>

      <div className="body video-page-body">
        <div className="sec">1단계 감각적 감상 결과</div>
        <div className="review-card" style={{ marginBottom: 18 }}>
          <div className="review-grid">
            <div>
              <div className="review-section-title">감성 키워드</div>
              <div id="rv-kw-cp" className="review-item">{selectedKeywords.join(', ') || '선택 없음'}</div>
            </div>
            <div>
              <div className="review-section-title">서술</div>
              <div id="rv-desc-cp" className="review-item">{sensoryDesc || '서술 없음'}</div>
            </div>
          </div>
        </div>

        <div className="sec">영상</div>
        <div className="video-wrap" style={{ marginBottom: 20 }}>
          <iframe
            src="https://www.youtube.com/embed/c4iAsoMRNEY"
            title="쇼팽 환상 즉흥곡 개요 영상"
            allowFullScreen
          />
        </div>

        <div className="sec">Q1. 이 음악을 연주하는 악기는 무엇인가요?</div>
        <textarea
          id="cp-q1"
          className="txt"
          value={q1}
          onChange={(e) => setAnalyticalCharacter(0, e.target.value)}
          placeholder="악기 편성을 적어보세요."
        />
        <button type="button" className="ai-btn" onClick={() => setShowQ1Hint((prev) => !prev)}>✨ 참고 예시 보기</button>
        <div className={`ai-bubble ${showQ1Hint ? 'show' : ''}`}>
          <div className="ai-bubble-label">참고 예시 (정답 아님 · 그대로 복사 금지)</div>
          {q1Example}
        </div>
        <button
          type="button"
          className="answer-check-toggle"
          onClick={() => setQ1Open((prev) => !prev)}
          aria-expanded={q1Open}
          disabled={!q1.trim()}
          style={!q1.trim() ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
        >
          <span className="answer-check-toggle-label">정답 확인하기</span>
          <span className="answer-check-toggle-chevron" aria-hidden="true">{q1Open ? '▲' : '▼'}</span>
        </button>
        <div className={`answer-compare-slide ${q1Open ? 'open' : ''}`}>
          <div className="answer-compare-inner">
            <div className="fb show info">
              피아노 독주예요.
              <br />
              오케스트라나 다른 악기 없이
              <br />
              피아노 한 대가 모든 것을 표현해요.
            </div>
          </div>
        </div>

        <div className="sec">Q2. 이 음악의 전체적인 분위기는 어떤가요? 곡을 들으며 느낌이 바뀌는 부분이 있었나요?</div>
        <textarea
          id="cp-q2"
          className="txt"
          value={q2}
          onChange={(e) => setAnalyticalStory(e.target.value)}
          placeholder="분위기 변화와 느낌 전환 지점을 적어보세요."
        />
        <button type="button" className="ai-btn" onClick={() => setShowQ2Hint((prev) => !prev)}>✨ 참고 예시 보기</button>
        <div className={`ai-bubble ${showQ2Hint ? 'show' : ''}`}>
          <div className="ai-bubble-label">참고 예시 (정답 아님 · 그대로 복사 금지)</div>
          {q2Example}
        </div>
        <button
          type="button"
          className="answer-check-toggle"
          onClick={() => setQ2Open((prev) => !prev)}
          aria-expanded={q2Open}
          disabled={!q2.trim()}
          style={!q2.trim() ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
        >
          <span className="answer-check-toggle-label">정답 확인하기</span>
          <span className="answer-check-toggle-chevron" aria-hidden="true">{q2Open ? '▲' : '▼'}</span>
        </button>
        <div className={`answer-compare-slide ${q2Open ? 'open' : ''}`}>
          <div className="answer-compare-inner">
            <div className="fb show info">
              이 곡은 빠르고 격렬한 부분과
              <br />
              느리고 서정적인 부분이 교차해요.
              <br />
              이런 대비가 이 곡의 핵심이에요.
              <br />
              다음 활동에서 이 구조를 분석해봐요!
            </div>
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
            다음: cp-form →
          </button>
        </div>
      </div>
    </div>
  );
}

export default CpOverview;
