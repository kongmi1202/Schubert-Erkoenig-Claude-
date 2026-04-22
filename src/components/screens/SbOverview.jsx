import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import CompareAiFeedbackBlock from '../CompareAiFeedbackBlock';
import { generateAnalyticalCompareFeedback } from '../../lib/compareFeedback';

const q1Answer = '소프라노(또는 메조소프라노) 성악, 플루트, 클라리넷, 바이올린, 첼로, 피아노로 구성된 실내악이에요.';
const q2Answer = '불안하고 몽환적이며 신비로운 분위기예요. 달빛 속 도취감과 공포가 뒤섞인 표현주의 특유의 감성을 담고 있어요.';
const helperHints = [
  '악기 이름과 목소리 형태를 먼저 나열한 뒤, 편성 특징을 한 문장으로 정리해보세요.',
  '분위기를 적을 때는 감정 단어 2~3개와 이유(음색, 리듬, 선율)를 함께 써보세요.',
  '달빛, 도취, 불안 같은 핵심 이미지를 넣어 표현주의적 느낌을 설명해보세요.'
];

function SbOverview({ go }) {
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
  const [hasRequestedFeedback, setHasRequestedFeedback] = useState(false);
  const [feedbackSnapshot, setFeedbackSnapshot] = useState('');

  const canProceed = useMemo(() => q1.trim() && q2.trim(), [q1, q2]);
  const currentSnapshot = useMemo(() => JSON.stringify({ q1: q1.trim(), q2: q2.trim() }), [q1, q2]);
  const canOpenAnswer = canProceed && hasRequestedFeedback && feedbackSnapshot !== currentSnapshot;

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
  const requestFeedback = () =>
    generateAnalyticalCompareFeedback({
      userCharacterSlots: [],
      userCharactersText: q1,
      correctCharacters: ['소프라노(또는 메조소프라노)', '플루트', '클라리넷', '바이올린', '첼로', '피아노'],
      userStory: q2,
      correctStory: q2Answer
    });
  const onFeedbackRequested = () => {
    setHasRequestedFeedback(true);
    setFeedbackSnapshot(currentSnapshot);
    setQ1Open(false);
    setQ2Open(false);
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
        <CompareAiFeedbackBlock requestFn={requestFeedback} onRequested={onFeedbackRequested} />
        <button
          type="button"
          className="answer-check-toggle"
          onClick={() => setQ1Open((prev) => !prev)}
          aria-expanded={q1Open}
          disabled={!canOpenAnswer}
          style={!canOpenAnswer ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
        >
          <span className="answer-check-toggle-label">{canOpenAnswer ? '정답 확인하기' : '피드백 반영 후 정답 확인하기'}</span>
          <span className="answer-check-toggle-chevron" aria-hidden="true">{q1Open ? '▲' : '▼'}</span>
        </button>
        <div className={`answer-compare-slide ${q1Open ? 'open' : ''}`}>
          <div className="answer-compare-inner">
            <div className="fb show info">정답: {q1Answer}</div>
          </div>
        </div>

        <div className="sec">Q2. 이 음악의 전체적인 분위기는 어떤가요?</div>
        <textarea
          className="txt"
          value={q2}
          onChange={(e) => setQ2(e.target.value)}
          placeholder="전체적인 분위기를 자유롭게 적어보세요."
        />
        <button type="button" className="ai-btn" onClick={() => showHint(false)}>✨ 참고 예시 보기</button>
        <div className={`ai-bubble ${showQ2Hint ? 'show' : ''}`}>
          <div className="ai-bubble-label">참고 예시 (정답 아님 · 그대로 복사 금지)</div>
          {q2Hint}
        </div>
        <button
          type="button"
          className="answer-check-toggle"
          onClick={() => setQ2Open((prev) => !prev)}
          aria-expanded={q2Open}
          disabled={!canOpenAnswer}
          style={!canOpenAnswer ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
        >
          <span className="answer-check-toggle-label">{canOpenAnswer ? '정답 확인하기' : '피드백 반영 후 정답 확인하기'}</span>
          <span className="answer-check-toggle-chevron" aria-hidden="true">{q2Open ? '▲' : '▼'}</span>
        </button>
        <div className={`answer-compare-slide ${q2Open ? 'open' : ''}`}>
          <div className="answer-compare-inner">
            <div className="fb show info">정답: {q2Answer}</div>
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
