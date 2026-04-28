import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import CompareAiFeedbackBlock from '../CompareAiFeedbackBlock';
import { generateAnalyticalCompareFeedback } from '../../lib/compareFeedback';

const q1Answer = '소프라노(또는 메조소프라노) 성악, 플루트, 클라리넷, 바이올린, 첼로, 피아노로 구성된 실내악이에요.';
const q2Answer = '불안하고 몽환적이며 신비로운 분위기예요. 달빛 속 도취감과 공포가 뒤섞인 표현주의 특유의 감성을 담고 있어요.';
const helperHints = [
  '들리는 악기 이름을 생각나는 만큼 써보세요.',
  '목소리가 노래처럼 들리는지 말처럼 들리는지 써보세요.',
  '음악 분위기를 단어 2개로 써보세요. (예: 불안, 신비)'
];
const normalizeText = (value) => String(value || '').trim().replace(/\s+/g, ' ');
const compactText = (value) => normalizeText(value).replace(/\s+/g, '').replace(/[.,!?'"()\-]/g, '');
const hasAllKeywords = (text, keywords) => keywords.every((kw) => text.includes(kw));
const feedbackIndicatesAllCorrect = (text) => {
  const t = String(text || '').trim();
  if (!t) return false;
  const positive = /(완벽|모두\s*맞|전부\s*맞|정확|맞아떨어|좋은\s*선택)/;
  const negative = /(빠진|틀렸|수정|보완|다시|부족|헷갈|아쉬|다른\s*칸)/;
  return positive.test(t) && !negative.test(t);
};

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
  const [feedbackAllowsDirectCheck, setFeedbackAllowsDirectCheck] = useState(false);

  const canProceed = useMemo(() => q1.trim() && q2.trim(), [q1, q2]);
  const currentSnapshot = useMemo(() => JSON.stringify({ q1: q1.trim(), q2: q2.trim() }), [q1, q2]);
  const isAlreadyCorrect = useMemo(() => {
    if (!canProceed) return false;
    const q1Text = compactText(q1);
    const q2Text = compactText(q2);
    const q1Ok = hasAllKeywords(q1Text, ['소프라노', '플루트', '클라리넷', '바이올린', '첼로', '피아노']);
    const q2Ok = hasAllKeywords(q2Text, ['불안', '몽환', '신비']);
    return q1Ok && q2Ok;
  }, [canProceed, q1, q2]);
  const canOpenAnswer =
    canProceed && hasRequestedFeedback && (feedbackSnapshot !== currentSnapshot || isAlreadyCorrect || feedbackAllowsDirectCheck);

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
    setFeedbackAllowsDirectCheck(false);
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
        <CompareAiFeedbackBlock
          requestFn={requestFeedback}
          onRequested={onFeedbackRequested}
          onResult={(text) => setFeedbackAllowsDirectCheck(feedbackIndicatesAllCorrect(text))}
        />
        {hasRequestedFeedback && (isAlreadyCorrect || feedbackAllowsDirectCheck) ? (
          <div className="small-note" style={{ marginTop: 8 }}>좋아요! 현재 답안은 바로 정답 확인이 가능해요.</div>
        ) : null}
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
