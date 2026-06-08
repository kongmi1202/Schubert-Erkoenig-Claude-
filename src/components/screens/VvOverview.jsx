import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import SensoryStage1Review from '../SensoryStage1Review';

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
        <div className="s-eyebrow">STAGE 2-A · 분석적 감상 (비발디)</div>
        <div className="s-title">개요 파악</div>
      </div>

      <div className="body video-page-body">
        <SensoryStage1Review ids={{ keywordsId: 'rv-kw-vv', sensoryDescId: 'rv-desc-vv' }} />

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
