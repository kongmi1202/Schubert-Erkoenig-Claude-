import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import CompareAiFeedbackBlock from '../CompareAiFeedbackBlock';
import { generateAnalyticalCompareFeedback } from '../../lib/compareFeedback';

const helperHints = [
  '시에 나온 장면(번개, 천둥, 우박) 중 들린 것을 써보세요.',
  '이 음악이 빠른지 느린지 먼저 써보세요.',
  '폭풍우처럼 무섭게 느껴졌는지 한 줄로 써보세요.'
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
  const [hasRequestedFeedback, setHasRequestedFeedback] = useState(false);
  const [feedbackSnapshot, setFeedbackSnapshot] = useState('');
  const [feedbackAllowsDirectCheck, setFeedbackAllowsDirectCheck] = useState(false);

  const canProceed = useMemo(() => q1.trim() && q2.trim(), [q1, q2]);
  const currentSnapshot = useMemo(() => JSON.stringify({ q1: q1.trim(), q2: q2.trim() }), [q1, q2]);
  const isAlreadyCorrect = useMemo(() => {
    if (!canProceed) return false;
    const q1Text = compactText(q1);
    const q2Text = compactText(q2);
    const q1Ok = hasAllKeywords(q1Text, ['폭풍', '번개', '천둥', '우박']);
    const q2Ok = hasAllKeywords(q2Text, ['격렬', '긴박', '폭풍']);
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
      correctCharacters: ['여름 폭풍우 장면', '지친 목동과 양떼', '갑작스러운 번개와 천둥', '우박으로 이삭이 쓸려감'],
      userStory: q2,
      correctStory: '격렬하고 긴박한 폭풍우의 분위기예요. 빠른 템포와 강한 셈여림으로 폭풍우의 긴박함과 공포가 생생하게 전달돼요.'
    });
  const onFeedbackRequested = () => {
    setHasRequestedFeedback(true);
    setFeedbackSnapshot(currentSnapshot);
    setFeedbackAllowsDirectCheck(false);
    setQ1Open(false);
    setQ2Open(false);
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
            아, 그러나 그의 두려움은 얼마나 정당한가!
            <br />
            하늘은 천둥 치고 번개 번뜩이며,
            <br />
            쏟아지는 우박은 자라나는 곡식의 이삭과
            <br />
            기세등등하게 피어있던 꽃들을 꺾어버린다.
          </div>
        </div>

        <div className="sec">Q1. 여름 3악장에서 묘사하는 내용은 무엇인가요?</div>
        <textarea
          id="vv-q1"
          className="txt"
          value={q1}
          onChange={(e) => setQ1(e.target.value)}
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
