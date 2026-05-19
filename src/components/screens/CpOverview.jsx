import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import SensoryStage1Review from '../SensoryStage1Review';

const CP_OVERVIEW_Q2_HINT = '앞부분과 중간부에서 빠르기·세기·분위기가 어떻게 달라지는지 대비해서 적어 보세요.';

function CpOverview({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const analyticalCharacters = useAppStore((s) => s.analyticalCharacters);
  const analyticalStory = useAppStore((s) => s.analyticalStory);
  const setAnalyticalCharacter = useAppStore((s) => s.setAnalyticalCharacter);
  const setAnalyticalStory = useAppStore((s) => s.setAnalyticalStory);
  const q1 = analyticalCharacters?.[0] || '';
  const q2 = analyticalStory || '';
  const [q1Open, setQ1Open] = useState(false);
  const [q2Open, setQ2Open] = useState(false);

  const isAllFilled = useMemo(() => Boolean(q1.trim() && q2.trim()), [q1, q2]);

  useEffect(() => {
    if (!isAllFilled) {
      setQ1Open(false);
      setQ2Open(false);
    }
  }, [isAllFilled]);

  return (
    <div className="screen active" id="cp-overview">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2-A · 분석적 감상 (쇼팽)</div>
        <div className="s-title">개요 파악</div>
      </div>

      <div className="body video-page-body">
        <SensoryStage1Review ids={{ keywordsId: 'rv-kw-cp', sensoryDescId: 'rv-desc-cp' }} />

        <div className="sec">영상</div>
        <div className="video-wrap" style={{ marginBottom: 20 }}>
          <iframe
            src="https://www.youtube.com/embed/c4iAsoMRNEY"
            title="쇼팽 환상 즉흥곡 개요 영상"
            allowFullScreen
          />
        </div>

        <div className="sec">Q1. 이 음악을 연주하는 악기는 무엇인가요?</div>
        <textarea
          id="cp-q1"
          className="txt"
          value={q1}
          onChange={(e) => setAnalyticalCharacter(0, e.target.value)}
          placeholder="악기 편성을 적어보세요."
        />
        {isAllFilled ? (
          <button
            type="button"
            className="answer-check-toggle"
            onClick={() => setQ1Open((prev) => !prev)}
            aria-expanded={q1Open}
          >
            <span className="answer-check-toggle-label">정답 확인하기</span>
            <span className="answer-check-toggle-chevron" aria-hidden="true">{q1Open ? '▲' : '▼'}</span>
          </button>
        ) : null}
        <div className={`answer-compare-slide ${isAllFilled && q1Open ? 'open' : ''}`}>
          <div className="answer-compare-inner">
            <div className="fb show info">
              피아노 독주예요.
              <br />
              오케스트라나 다른 악기 없이
              <br />
              피아노 한 대가 모든 것을 표현해요.
            </div>
          </div>
        </div>

        <div className="sec">Q2. 이 음악의 전체적인 분위기는 어떤가요? 곡을 들으며 느낌이 바뀌는 부분이 있었나요?</div>
        <textarea
          id="cp-q2"
          className="txt"
          value={q2}
          onChange={(e) => setAnalyticalStory(e.target.value)}
          placeholder="분위기 변화와 느낌 전환 지점을 적어보세요."
        />
        <div className="small-note" style={{ marginTop: 8, marginBottom: 10, lineHeight: 1.55 }}>
          작성 힌트: {CP_OVERVIEW_Q2_HINT}
        </div>
        {isAllFilled ? (
          <button
            type="button"
            className="answer-check-toggle"
            onClick={() => setQ2Open((prev) => !prev)}
            aria-expanded={q2Open}
          >
            <span className="answer-check-toggle-label">정답 확인하기</span>
            <span className="answer-check-toggle-chevron" aria-hidden="true">{q2Open ? '▲' : '▼'}</span>
          </button>
        ) : null}
        <div className={`answer-compare-slide ${isAllFilled && q2Open ? 'open' : ''}`}>
          <div className="answer-compare-inner">
            <div className="fb show info">
              이 곡은 빠르고 격렬한 부분과
              <br />
              느리고 서정적인 부분이 교차해요.
              <br />
              이런 대비가 이 곡의 핵심이에요.
              <br />
              다음 활동에서 이 구조를 분석해봐요!
            </div>
          </div>
        </div>

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('sensoryPage')}>← 이전</button>
          <button
            className="btn-p"
            disabled={!isAllFilled}
            style={!isAllFilled ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            onClick={() => {
              setStageCompletion('analytical', true);
              go('voiceDesign');
            }}
          >
            다음: cp-form →
          </button>
        </div>
      </div>
    </div>
  );
}

export default CpOverview;
