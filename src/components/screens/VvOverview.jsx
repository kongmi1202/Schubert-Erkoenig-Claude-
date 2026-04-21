import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

const helperHints = [
  '소네트에 나온 장면(번개, 천둥, 우박)을 먼저 키워드로 적고 문장으로 연결해보세요.',
  '분위기는 속도(빠름/느림), 셈여림(강함/약함), 감정 단어를 함께 쓰면 더 좋아요.',
  '음악을 들으며 떠오른 장면을 영화 한 컷처럼 묘사해보세요.'
];

function VvOverview({ go }) {
  const selectedKeywords = useAppStore((s) => s.selectedKeywords);
  const sensoryDesc = useAppStore((s) => s.sensoryDesc);
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [showQ1Hint, setShowQ1Hint] = useState(false);
  const [showQ2Hint, setShowQ2Hint] = useState(false);
  const [q1Open, setQ1Open] = useState(false);
  const [q2Open, setQ2Open] = useState(false);
  const [q1Hint, setQ1Hint] = useState(helperHints[0]);
  const [q2Hint, setQ2Hint] = useState(helperHints[1]);

  const canProceed = useMemo(() => q1.trim() && q2.trim(), [q1, q2]);

  const showHint = (forQ1) => {
    const next = helperHints[Math.floor(Math.random() * helperHints.length)];
    if (forQ1) {
      setQ1Hint(next);
      setShowQ1Hint(true);
    } else {
      setQ2Hint(next);
      setShowQ2Hint(true);
    }
  };

  return (
    <div className="screen active" id="vv-overview">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2-A · 분석적 감상 (비발디)</div>
        <div className="s-title">개요 파악</div>
      </div>

      <div className="body video-page-body">
        <div className="sec">1단계 감각적 감상 결과</div>
        <div className="review-card" style={{ marginBottom: 18 }}>
          <div className="review-grid">
            <div>
              <div className="review-section-title">감성 키워드</div>
              <div id="rv-kw-vv" className="review-item">{selectedKeywords.join(', ') || '선택 없음'}</div>
            </div>
            <div>
              <div className="review-section-title">서술</div>
              <div id="rv-desc-vv" className="review-item">{sensoryDesc || '서술 없음'}</div>
            </div>
          </div>
        </div>

        <div className="sec">영상</div>
        <div className="video-wrap" style={{ marginBottom: 20 }}>
          <iframe
            src="https://www.youtube.com/embed/5XRSiC3CV7I"
            title="비발디 사계 여름 3악장 개요 영상"
            allowFullScreen
          />
        </div>

        <div className="sec">소네트</div>
        <div className="sonnet-item">
          <div className="sonnet-quote">
            번개와 천둥이 치니
            <br />
            지친 몸은 쉬지도 못하고,
            <br />
            파리와 등에 떼가 사납게 덤벼든다!
            <br />
            아, 그의 두려움이 너무도 사실이었으니
            <br />
            하늘이 천둥치고 번개가 번쩍이며
            <br />
            우박이 익은 이삭을 모두 쓸어버린다.
          </div>
        </div>

        <div className="sec">Q1. 여름 3악장에서 묘사하는 내용은 무엇인가요?</div>
        <textarea
          id="vv-q1"
          className="txt"
          value={q1}
          onChange={(e) => setQ1(e.target.value)}
        />
        <button type="button" className="ai-btn" onClick={() => showHint(true)}>✨ AI 도우미</button>
        <div className={`ai-bubble ${showQ1Hint ? 'show' : ''}`}>
          <div className="ai-bubble-label">생각 힌트</div>
          {q1Hint}
        </div>
        <button
          type="button"
          className="answer-check-toggle"
          onClick={() => setQ1Open((prev) => !prev)}
          aria-expanded={q1Open}
        >
          <span className="answer-check-toggle-label">정답 확인하기</span>
          <span className="answer-check-toggle-chevron" aria-hidden="true">{q1Open ? '▲' : '▼'}</span>
        </button>
        <div className={`answer-compare-slide ${q1Open ? 'open' : ''}`}>
          <div className="answer-compare-inner">
            <div className="fb show info">
              여름 폭풍우의 장면을 묘사하고 있어요.
              <br />
              타오르는 태양 아래 지친 목동과 양떼,
              <br />
              갑작스러운 폭풍과 번개, 우박으로
              <br />
              이삭이 쓸려가는 장면을 담고 있어요.
            </div>
          </div>
        </div>

        <div className="sec">Q2. 이 음악의 전체적인 분위기는 어떤가요?</div>
        <textarea
          id="vv-q2"
          className="txt"
          value={q2}
          onChange={(e) => setQ2(e.target.value)}
        />
        <button type="button" className="ai-btn" onClick={() => showHint(false)}>✨ AI 도우미</button>
        <div className={`ai-bubble ${showQ2Hint ? 'show' : ''}`}>
          <div className="ai-bubble-label">생각 힌트</div>
          {q2Hint}
        </div>
        <button
          type="button"
          className="answer-check-toggle"
          onClick={() => setQ2Open((prev) => !prev)}
          aria-expanded={q2Open}
        >
          <span className="answer-check-toggle-label">정답 확인하기</span>
          <span className="answer-check-toggle-chevron" aria-hidden="true">{q2Open ? '▲' : '▼'}</span>
        </button>
        <div className={`answer-compare-slide ${q2Open ? 'open' : ''}`}>
          <div className="answer-compare-inner">
            <div className="fb show info">
              격렬하고 긴박한 폭풍우의 분위기예요.
              <br />
              빠른 템포와 강한 셈여림으로
              <br />
              폭풍우의 긴박함과 공포가 생생하게 전달돼요.
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
            다음: vv-sonnet →
          </button>
        </div>
      </div>
    </div>
  );
}

export default VvOverview;
