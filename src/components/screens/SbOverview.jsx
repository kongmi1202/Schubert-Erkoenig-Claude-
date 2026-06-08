import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import SensoryStage1Review from '../SensoryStage1Review';

const q1Answer = '소프라노(또는 메조소프라노) 성악, 플루트, 클라리넷, 바이올린, 첼로, 피아노로 구성된 실내악이에요.';
const q2Answer =
  '불안하고 몽환적이며 신비로운 분위기예요. 달빛 속 도취감과 공포가 뒤섞인 표현주의 특유의 감성을 담고 있어요.';
const SB_OVERVIEW_Q1_WRITING_TIP =
  '음악에서 들리는 악기 이름(또는 연주 형태)과 성악가의 목소리 파트를 써보세요.';
const SB_OVERVIEW_Q2_WRITING_TIP =
  '처음 들었을 때 느낀 분위기와 감정을 구체적인 형용사로 써보세요.';

function SbOverview({ go }) {
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
    <div className="screen active" id="sb-overview">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2-A · 분석적 감상 (쇤베르크)</div>
        <div className="s-title">개요 파악</div>
      </div>

      <div className="body video-page-body">
        <SensoryStage1Review ids={{ keywordsId: 'rv-kw-sb', sensoryDescId: 'rv-desc-sb' }} />

        <div className="sec">해설 영상</div>
        <div className="video-wrap" style={{ marginBottom: 20 }}>
          <iframe
            src="https://www.youtube.com/embed/wEW4mxAbank"
            title="쇤베르크 달에 홀린 피에로 개요 영상"
            allowFullScreen
          />
        </div>

        <div className="sec">Q1. 이 음악을 연주하는 악기들(또는 연주 형태)과 성악가의 성종(성부)은?</div>
        <textarea
          className="txt"
          value={q1}
          onChange={(e) => setAnalyticalCharacter(0, e.target.value)}
          placeholder="악기 편성과 목소리 형태를 적어보세요."
        />
        <div className="small-note" style={{ marginTop: 8, marginBottom: 10, lineHeight: 1.55 }}>
          작성 TIP: {SB_OVERVIEW_Q1_WRITING_TIP}
        </div>
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
            <div className="fb show info">정답: {q1Answer}</div>
          </div>
        </div>

        <div className="sec">Q2. 이 음악의 전체적인 분위기는 어떤가요?</div>
        <textarea
          className="txt"
          value={q2}
          onChange={(e) => setAnalyticalStory(e.target.value)}
          placeholder="음악을 들으며 느낀 분위기를 적어보세요."
        />
        <div className="small-note" style={{ marginTop: 8, marginBottom: 10, lineHeight: 1.55 }}>
          작성 TIP: {SB_OVERVIEW_Q2_WRITING_TIP}
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
            <div className="fb show info">정답: {q2Answer}</div>
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
            다음: sb-sprech →
          </button>
        </div>
      </div>
    </div>
  );
}

export default SbOverview;
