import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

function VvOverview({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const setAnalyticalCharacter = useAppStore((s) => s.setAnalyticalCharacter);
  const storedQ1 = useAppStore((s) => s.analyticalCharacters?.[0] || '');
  const [q1, setQ1] = useState(storedQ1);
  /** 마지막으로 「내 응답 저장」한 텍스트(트림). 이것과 현재 입력이 같을 때만 정답 확인 가능 */
  const [q1Saved, setQ1Saved] = useState('');
  const [q1Open, setQ1Open] = useState(false);

  const canProceed = useMemo(() => q1.trim(), [q1]);
  const canOpenAnswer = useMemo(
    () => Boolean(q1.trim()) && q1.trim() === q1Saved,
    [q1, q1Saved]
  );

  useEffect(() => {
    if (!canOpenAnswer && q1Open) setQ1Open(false);
  }, [canOpenAnswer, q1Open]);

  const saveMyResponse = () => {
    const t = q1.trim();
    if (!t) return;
    setAnalyticalCharacter(0, t);
    setQ1Saved(t);
  };

  return (
    <div className="screen active" id="vv-overview">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2 · 분석적 감상</div>
        <div className="s-title">분석적 감상</div>
        <div className="s-desc">목표: 음악 요소, 음악적 특징 및 구성을 분석하고 비교하여 음악이 어떻게 표현되고 구성되는지 파악해 보세요.</div>
      </div>

      <div className="body video-page-body">

        <div className="sec">1. 여름 3악장에서 묘사하는 내용은 무엇인가요?</div>
        <textarea
          id="vv-q1"
          className="txt"
          value={q1}
          onChange={(e) => setQ1(e.target.value)}
        />
        <div className="btn-row" style={{ marginTop: 8, marginBottom: 8 }}>
          <button type="button" className="btn-p" disabled={!q1.trim()} onClick={saveMyResponse}>
            내 응답 저장
          </button>
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

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('sensoryPage')}>← 이전</button>
          <button
            className="btn-p"
            disabled={!canProceed}
            style={!canProceed ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            onClick={() => {
              const t = q1.trim();
              if (t) setAnalyticalCharacter(0, t);
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
