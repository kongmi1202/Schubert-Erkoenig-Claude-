import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

const HANDEL_ANSWER_Q1 =
  '성경(요한계시록)을 바탕으로 한 종교적 내용이에요. 할렐루야, King of Kings 등 신의 위대함을 찬양하는 내용이 중심입니다.';

const HANDEL_COMPARE_ROWS = [
  { key: '가사내용', opera: '사랑·영웅 이야기', oratorio: '종교적 내용' },
  { key: '무대·연기', opera: '의상·연기 있음', oratorio: '의상·연기 없음' },
  { key: '공연장소', opera: '오페라 극장', oratorio: '교회·콘서트홀' }
];
const HANDEL_Q1_HINTS = [
  '가사에 자주 나오는 단어를 1~2개 써보세요.',
  '이 노래가 누구를 찬양하는지 써보세요.',
  '종교 노래처럼 느껴진 이유를 한 줄로 써보세요.',
  '"무엇을 노래하나요?"에 먼저 답해보세요.'
];
const HANDEL_Q2_HINTS = [
  '오페라는 연기가 있고, 오라토리오는 없는지 비교해보세요.',
  '옷/무대/장소 차이 중 1가지만 골라 써도 좋아요.',
  '"오페라는 __, 오라토리오는 __" 형식으로 써보세요.',
  '가사 내용 차이(이야기/종교)도 함께 써보세요.'
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
  const emotionResult = useAppStore((s) => s.emotionResult);
  const emotionSummary = useAppStore((s) => s.emotionSummary);
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

  const canOpenQ1Answer = useMemo(() => q1Text.trim().length > 0, [q1Text]);
  const canOpenQ2Answer = useMemo(() => q2Text.trim().length > 0, [q2Text]);
  const canProceed = canOpenQ1Answer && canOpenQ2Answer;
  const emotionRows = useMemo(
    () =>
      emotionResult
        ? [
            { key: 'sadness', label: '슬픔', emoji: '😢', value: Number(emotionResult.sadness) || 0 },
            { key: 'fear', label: '공포', emoji: '😨', value: Number(emotionResult.fear) || 0 },
            { key: 'anger', label: '분노', emoji: '😠', value: Number(emotionResult.anger) || 0 },
            { key: 'happiness', label: '기쁨', emoji: '😊', value: Number(emotionResult.happiness) || 0 },
            { key: 'surprise', label: '놀라움', emoji: '😮', value: Number(emotionResult.surprise) || 0 },
            { key: 'disgust', label: '혐오', emoji: '😒', value: Number(emotionResult.disgust) || 0 }
          ].sort((a, b) => b.value - a.value)
        : [],
    [emotionResult]
  );
  const canOpenAnswer = canProceed;

  const onQ1Example = () => {
    setQ1Example((prev) => pickRandom(HANDEL_Q1_HINTS, prev));
    setShowQ1Example(true);
  };

  const onQ2Example = () => {
    setQ2Example((prev) => pickRandom(HANDEL_Q2_HINTS, prev));
    setShowQ2Example(true);
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
          <div style={{ marginTop: 10 }}>
            <div className="review-section-title">감정 분석 결과</div>
            <div className="review-item">
              {emotionRows.length
                ? emotionRows.map((item) => `${item.emoji} ${item.label} ${item.value}%`).join(' · ')
                : '분석 없음'}
            </div>
            <div className="small-note">{emotionSummary || '요약 없음'}</div>
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
        {canOpenQ1Answer ? (
          <button
            type="button"
            className="answer-check-toggle"
            onClick={() => setQ1Open((v) => !v)}
            aria-expanded={q1Open}
            disabled={!canOpenAnswer}
            style={!canOpenAnswer ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          >
            <span className="answer-check-toggle-label">정답 확인하기</span>
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
            <span className="answer-check-toggle-label">정답 확인하기</span>
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
