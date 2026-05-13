import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import SensoryStage1Review from '../SensoryStage1Review';

const HANDEL_ANSWER_Q1 =
  '성경(요한계시록)을 바탕으로 한 종교적 내용이에요. 할렐루야, King of Kings 등 신의 위대함을 찬양하는 내용이 중심입니다.';

const HANDEL_COMPARE_ROWS = [
  { key: '가사내용', opera: '사랑·영웅 이야기', oratorio: '종교적 내용' },
  { key: '무대·연기', opera: '의상·연기 있음', oratorio: '의상·연기 없음' },
  { key: '공연장소', opera: '오페라 극장', oratorio: '교회·콘서트홀' }
];

function AnalyticalOverviewHandel({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const q1Text = useAppStore((s) => s.handelLyricMeaning);
  const q2Text = useAppStore((s) => s.handelOperaDiff);
  const setQ1Text = useAppStore((s) => s.setHandelLyricMeaning);
  const setQ2Text = useAppStore((s) => s.setHandelOperaDiff);
  const [q1Open, setQ1Open] = useState(false);
  const [q2Open, setQ2Open] = useState(false);
  const q1WritingHint = '가사에서 누구를 찬양하는지와 어떤 내용인지 한 문장으로 써보세요.';
  const q2WritingHint = '이 곡의 장르는 오라토리오예요. 오페라와 이 곡의 차이를 주제(가사 내용), 무대 연출, 의상, 연기 등에서 비교해 보세요.';

  const canOpenQ1Answer = useMemo(() => q1Text.trim().length > 0, [q1Text]);
  const canOpenQ2Answer = useMemo(() => q2Text.trim().length > 0, [q2Text]);
  const canProceed = canOpenQ1Answer && canOpenQ2Answer;
  const canOpenAnswer = canProceed;

  return (
    <div className="screen active">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2-A · 분석적 감상 (할렐루야)</div>
        <div className="s-title">전체적인 개요 파악</div>
      </div>

      <div className="body">
        <SensoryStage1Review />

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
        <div className="small-note">작성 힌트: {q1WritingHint}</div>
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
        <div className="small-note">작성 힌트: {q2WritingHint}</div>
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
