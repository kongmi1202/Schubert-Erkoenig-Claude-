import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import CompareAiFeedbackBlock from '../CompareAiFeedbackBlock';
import { generateAnalyticalCompareFeedback } from '../../lib/compareFeedback';

const HANDEL_ANSWER_Q1 =
  '성경(요한계시록)을 바탕으로 한 종교적 내용이에요. 할렐루야, King of Kings 등 신의 위대함을 찬양하는 내용이 중심입니다.';

const HANDEL_COMPARE_ROWS = [
  { key: '가사내용', opera: '사랑·영웅 이야기', oratorio: '종교적 내용' },
  { key: '무대·연기', opera: '의상·연기 있음', oratorio: '의상·연기 없음' },
  { key: '공연장소', opera: '오페라 극장', oratorio: '교회·콘서트홀' }
];
const HANDEL_Q1_HINTS = [
  '가사에 반복되는 핵심 단어를 먼저 찾아보고, 그 단어가 어떤 대상을 높이는지 적어보세요.',
  '이 곡이 사랑 이야기인지, 종교적 찬양인지 먼저 분류한 뒤 근거 단어를 1~2개 붙여보세요.',
  '합창이 커지는 부분에서 전달되는 메시지가 무엇인지 한 문장으로 정리해보세요.',
  '답안은 "무엇을 노래하는가 + 왜 그렇게 들리는가" 두 문장 구조로 써보세요.'
];
const HANDEL_Q2_HINTS = [
  '비교 기준을 먼저 정해보세요: 무대 연기 유무, 가사 주제, 공연 형태 중 2가지만 골라도 충분해요.',
  '오페라/오라토리오를 각각 한 단어로 요약하고, 왜 그렇게 요약했는지 근거를 붙여보세요.',
  '눈으로 보는 요소(연기·의상)와 귀로 듣는 요소(합창·관현악)를 나눠 비교하면 정리가 쉬워요.',
  '답안은 "오페라는 ___, 오라토리오는 ___"처럼 대응 구조로 쓰면 명확해져요.'
];

function pickRandom(items, prevValue) {
  if (!items.length) return '';
  if (items.length === 1) return items[0];
  let next = items[Math.floor(Math.random() * items.length)];
  while (next === prevValue) {
    next = items[Math.floor(Math.random() * items.length)];
  }
  return next;
}

function AnalyticalOverviewHandel({ go }) {
  const selectedKeywords = useAppStore((s) => s.selectedKeywords);
  const sensoryDesc = useAppStore((s) => s.sensoryDesc);
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const q1Text = useAppStore((s) => s.handelLyricMeaning);
  const q2Text = useAppStore((s) => s.handelOperaDiff);
  const setQ1Text = useAppStore((s) => s.setHandelLyricMeaning);
  const setQ2Text = useAppStore((s) => s.setHandelOperaDiff);
  const [q1Open, setQ1Open] = useState(false);
  const [q2Open, setQ2Open] = useState(false);
  const [q1Example, setQ1Example] = useState(HANDEL_Q1_HINTS[0]);
  const [q2Example, setQ2Example] = useState(HANDEL_Q2_HINTS[0]);
  const [showQ1Example, setShowQ1Example] = useState(false);
  const [showQ2Example, setShowQ2Example] = useState(false);
  const [hasRequestedFeedback, setHasRequestedFeedback] = useState(false);
  const [feedbackSnapshot, setFeedbackSnapshot] = useState('');

  const canOpenQ1Answer = useMemo(() => q1Text.trim().length > 0, [q1Text]);
  const canOpenQ2Answer = useMemo(() => q2Text.trim().length > 0, [q2Text]);
  const canProceed = canOpenQ1Answer && canOpenQ2Answer;
  const currentSnapshot = useMemo(() => JSON.stringify({ q1: q1Text.trim(), q2: q2Text.trim() }), [q1Text, q2Text]);
  const canOpenAnswer = canProceed && hasRequestedFeedback && feedbackSnapshot !== currentSnapshot;

  const onQ1Example = () => {
    setQ1Example((prev) => pickRandom(HANDEL_Q1_HINTS, prev));
    setShowQ1Example(true);
  };

  const onQ2Example = () => {
    setQ2Example((prev) => pickRandom(HANDEL_Q2_HINTS, prev));
    setShowQ2Example(true);
  };
  const requestFeedback = () =>
    generateAnalyticalCompareFeedback({
      userCharacterSlots: [],
      userCharactersText: q1Text,
      correctCharacters: ['성경(요한계시록)', '할렐루야 반복', '신의 위대함 찬양'],
      userStory: q2Text,
      correctStory: HANDEL_COMPARE_ROWS.map((row) => `${row.key}: ${row.opera} / ${row.oratorio}`).join(', ')
    });
  const onFeedbackRequested = () => {
    setHasRequestedFeedback(true);
    setFeedbackSnapshot(currentSnapshot);
    setQ1Open(false);
    setQ2Open(false);
  };

  return (
    <div className="screen active">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2-A · 분석적 감상 (할렐루야)</div>
        <div className="s-title">전체적인 개요 파악</div>
      </div>

      <div className="body">
        <div className="sec">1단계 감각적 감상 결과</div>
        <div className="review-card" style={{ marginBottom: 14 }}>
          <div className="review-grid">
            <div>
              <div className="review-section-title">감성 키워드</div>
              <div className="review-item">{selectedKeywords.join(', ') || '선택 없음'}</div>
            </div>
            <div>
              <div className="review-section-title">서술</div>
              <div className="review-item">{sensoryDesc || '서술 없음'}</div>
            </div>
          </div>
        </div>

        <div className="sec">할렐루야 해설 영상</div>
        <div className="video-wrap">
          <iframe src="https://www.youtube.com/embed/hIQ37oUDNYg" title="할렐루야 해설 영상" allowFullScreen />
        </div>

        <div className="sec">Q1. 이 음악의 가사는 어떤 내용인가요?</div>
        <textarea
          className="txt"
          value={q1Text}
          onChange={(e) => setQ1Text(e.target.value)}
          placeholder="할렐루야의 가사 내용을 써보세요..."
        />
        <button type="button" className="ai-btn" onClick={onQ1Example}>
          ✨ 참고 예시 보기
        </button>
        <div className="small-note">버튼을 다시 누르면 예시가 랜덤으로 바뀝니다.</div>
        {showQ1Example ? (
          <div className="ai-bubble show">
            <div className="ai-bubble-label">참고 예시 (정답 아님 · 그대로 복사 금지)</div>
            {q1Example}
          </div>
        ) : null}
        <CompareAiFeedbackBlock requestFn={requestFeedback} onRequested={onFeedbackRequested} />

        {canOpenQ1Answer ? (
          <button
            type="button"
            className="answer-check-toggle"
            onClick={() => setQ1Open((v) => !v)}
            aria-expanded={q1Open}
            disabled={!canOpenAnswer}
            style={!canOpenAnswer ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          >
            <span className="answer-check-toggle-label">{canOpenAnswer ? '정답 확인하기' : '피드백 반영 후 정답 확인하기'}</span>
            <span className="answer-check-toggle-chevron" aria-hidden="true">{q1Open ? '▲' : '▼'}</span>
          </button>
        ) : null}
        <div className={`answer-compare-slide ${q1Open ? 'open' : ''}`}>
          <div className="answer-compare-inner">
            <div className="review-card">
              <div className="review-section-title">Q1 정답</div>
              <div className="review-item">{HANDEL_ANSWER_Q1}</div>
            </div>
          </div>
        </div>

        <div className="sec">Q2. 이 음악은 오페라와 어떤 차이가 있나요?</div>
        <textarea
          className="txt"
          value={q2Text}
          onChange={(e) => setQ2Text(e.target.value)}
          placeholder="오페라와의 차이를 써보세요..."
        />
        <button type="button" className="ai-btn" onClick={onQ2Example}>
          ✨ 참고 예시 보기
        </button>
        <div className="small-note">버튼을 다시 누르면 예시가 랜덤으로 바뀝니다.</div>
        {showQ2Example ? (
          <div className="ai-bubble show">
            <div className="ai-bubble-label">참고 예시 (정답 아님 · 그대로 복사 금지)</div>
            {q2Example}
          </div>
        ) : null}

        {canOpenQ2Answer ? (
          <button
            type="button"
            className="answer-check-toggle"
            onClick={() => setQ2Open((v) => !v)}
            aria-expanded={q2Open}
            disabled={!canOpenAnswer}
            style={!canOpenAnswer ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          >
            <span className="answer-check-toggle-label">{canOpenAnswer ? '정답 확인하기' : '피드백 반영 후 정답 확인하기'}</span>
            <span className="answer-check-toggle-chevron" aria-hidden="true">{q2Open ? '▲' : '▼'}</span>
          </button>
        ) : null}
        <div className={`answer-compare-slide ${q2Open ? 'open' : ''}`}>
          <div className="answer-compare-inner">
            <div className="review-card">
              <div className="review-section-title">오페라 vs 오라토리오</div>
              <table className="cmp-table">
                <thead>
                  <tr>
                    <th>항목</th>
                    <th>오페라</th>
                    <th>오라토리오</th>
                  </tr>
                </thead>
                <tbody>
                  {HANDEL_COMPARE_ROWS.map((row) => (
                    <tr key={row.key}>
                      <td className="row-label">{row.key}</td>
                      <td>{row.opera}</td>
                      <td>{row.oratorio}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            다음 단계 →
          </button>
        </div>
      </div>
    </div>
  );
}

export default AnalyticalOverviewHandel;
