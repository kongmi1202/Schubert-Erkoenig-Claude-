import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

const HANDEL_ANSWER_Q1 =
  '성경(요한계시록)을 바탕으로 한 종교적 내용이에요. 할렐루야, King of Kings 등 신의 위대함을 찬양하는 내용이 중심입니다.';

const HANDEL_COMPARE_ROWS = [
  { key: '가사내용', opera: '사랑·영웅 이야기', oratorio: '종교적 내용' },
  { key: '무대·연기', opera: '의상·연기 있음', oratorio: '의상·연기 없음' },
  { key: '공연장소', opera: '오페라 극장', oratorio: '교회·콘서트홀' }
];

function extractTextFromResponse(json) {
  if (json?.output_text) return json.output_text;
  const texts = [];
  (json?.output || []).forEach((item) => {
    (item?.content || []).forEach((c) => {
      if (typeof c?.text === 'string') texts.push(c.text);
    });
  });
  return texts.join('\n').trim();
}

async function generateHandelExample(questionLabel, userInput) {
  const apiKey = typeof import.meta.env.VITE_OPENAI_API_KEY === 'string'
    ? import.meta.env.VITE_OPENAI_API_KEY.trim()
    : '';
  if (!apiKey) {
    if (questionLabel === 'Q1') {
      return '예시) 이 곡은 성경 내용을 바탕으로 하며, "할렐루야"를 반복해 신의 위대함을 찬양하는 종교적 메시지를 전달해요.';
    }
    return '예시) 오페라는 무대 연기·의상이 있는 극음악이고, 오라토리오는 연기 없이 합창과 관현악으로 종교적 내용을 전해요.';
  }

  const prompt = `너는 중학생 음악 수업 도우미야.
질문: ${questionLabel}
학생의 현재 입력: ${userInput?.trim() || '(없음)'}

요구사항:
- 학생이 참고할 "예시 답안" 1개만 한국어로 작성.
- 1~2문장, 50~90자.
- 너무 어려운 용어는 피하고, 사실만 간단히.
- 질문에서 벗어나지 말 것.`;

  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        input: prompt
      })
    });
    if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
    const json = await res.json();
    const text = extractTextFromResponse(json);
    return text || '예시를 만들지 못했어요. 한 번 더 눌러 주세요.';
  } catch {
    return '예시 생성이 잠시 불안정해요. 잠시 후 다시 시도해 주세요.';
  }
}

function AnalyticalOverviewHandel({ go }) {
  const selectedKeywords = useAppStore((s) => s.selectedKeywords);
  const sensoryDesc = useAppStore((s) => s.sensoryDesc);
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);

  const [q1Text, setQ1Text] = useState('');
  const [q2Text, setQ2Text] = useState('');
  const [q1Open, setQ1Open] = useState(false);
  const [q2Open, setQ2Open] = useState(false);
  const [q1Example, setQ1Example] = useState('');
  const [q2Example, setQ2Example] = useState('');
  const [q1Loading, setQ1Loading] = useState(false);
  const [q2Loading, setQ2Loading] = useState(false);

  const canOpenQ1Answer = useMemo(() => q1Text.trim().length > 0, [q1Text]);
  const canOpenQ2Answer = useMemo(() => q2Text.trim().length > 0, [q2Text]);
  const canProceed = canOpenQ1Answer && canOpenQ2Answer;

  const onQ1Example = async () => {
    setQ1Loading(true);
    const text = await generateHandelExample('Q1', q1Text);
    setQ1Example(text);
    setQ1Loading(false);
  };

  const onQ2Example = async () => {
    setQ2Loading(true);
    const text = await generateHandelExample('Q2', q2Text);
    setQ2Example(text);
    setQ2Loading(false);
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
          <iframe src="https://www.youtube.com/embed/usfiAsWR4qU" title="할렐루야 해설 영상" allowFullScreen />
        </div>

        <div className="sec">Q1. 이 음악의 가사는 어떤 내용인가요?</div>
        <textarea
          className="txt"
          value={q1Text}
          onChange={(e) => setQ1Text(e.target.value)}
          placeholder="할렐루야의 가사 내용을 써보세요..."
        />
        <button type="button" className="ai-btn" onClick={onQ1Example} disabled={q1Loading}>
          {q1Loading ? '예시 생성 중…' : '✨ AI 도우미 예시'}
        </button>
        {q1Example ? (
          <div className="ai-bubble show">
            <div className="ai-bubble-label">AI 예시 문장 (참고용)</div>
            {q1Example}
          </div>
        ) : null}

        {canOpenQ1Answer ? (
          <button type="button" className="answer-check-toggle" onClick={() => setQ1Open((v) => !v)} aria-expanded={q1Open}>
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
        <button type="button" className="ai-btn" onClick={onQ2Example} disabled={q2Loading}>
          {q2Loading ? '예시 생성 중…' : '✨ AI 도우미 예시'}
        </button>
        {q2Example ? (
          <div className="ai-bubble show">
            <div className="ai-bubble-label">AI 예시 문장 (참고용)</div>
            {q2Example}
          </div>
        ) : null}

        {canOpenQ2Answer ? (
          <button type="button" className="answer-check-toggle" onClick={() => setQ2Open((v) => !v)} aria-expanded={q2Open}>
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
