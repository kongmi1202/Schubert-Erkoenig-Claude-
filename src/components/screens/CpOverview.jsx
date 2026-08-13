import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { getOverviewFixedFeedback } from '../../lib/fixedFormativeFeedback';
import { generateOverviewOpenTextFeedback } from '../../lib/compareFeedback';
import FormativeFeedbackBlock from '../FormativeFeedbackBlock';
import CompareAiFeedbackBlock from '../CompareAiFeedbackBlock';

const CP_OVERVIEW_Q2_HINT = '앞부분과 중간부에서 빠르기·세기·분위기가 어떻게 달라지는지 대비해서 적어 보세요.';

function CpOverview({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const analyticalCharacters = useAppStore((s) => s.analyticalCharacters);
  const analyticalStory = useAppStore((s) => s.analyticalStory);
  const setAnalyticalCharacter = useAppStore((s) => s.setAnalyticalCharacter);
  const setAnalyticalStory = useAppStore((s) => s.setAnalyticalStory);
  const q1 = analyticalCharacters?.[0] || '';
  const q2 = analyticalStory || '';

  const canOpenQ1 = useMemo(() => Boolean(q1.trim()), [q1]);
  const canOpenQ2 = useMemo(() => Boolean(q2.trim()), [q2]);
  const isAllFilled = canOpenQ1 && canOpenQ2;
  const overviewData = { analyticalCharacters, analyticalStory };

  return (
    <div className="screen active" id="cp-overview">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2 · 분석적 감상</div>
        <div className="s-title">분석적 감상</div>
        <div className="s-desc">목표: 음악 요소, 음악적 특징 및 구성을 분석하고 비교하여 음악이 어떻게 표현되고 구성되는지 파악해 보세요.</div>
      </div>

      <div className="body video-page-body">

        <div className="sec">1. 이 음악을 연주하는 악기는 무엇인가요?</div>
        <textarea
          id="cp-q1"
          className="txt"
          value={q1}
          onChange={(e) => setAnalyticalCharacter(0, e.target.value)}
          placeholder="악기 편성을 적어보세요."
        />
        <div className="compare-ai-feedback" style={{ marginTop: 8, marginBottom: 12 }}>
          <FormativeFeedbackBlock
            key={`cp-overview-q1-${q1.trim() || 'none'}`}
            disabled={!canOpenQ1}
            getFeedback={() => getOverviewFixedFeedback({ song: 'chopin', question: 'q1', data: overviewData })}
            onResult={() => setStageCompletion('analytical', true)}
          />
        </div>

        <div className="sec">2. 이 음악의 전체적인 분위기는 어떤가요? 곡을 들으며 느낌이 바뀌는 부분이 있었나요?</div>
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
        <div className="compare-ai-feedback" style={{ marginTop: 4, marginBottom: 12 }}>
          <CompareAiFeedbackBlock
            key={`cp-overview-q2-${q2.trim() || 'none'}`}
            disabled={!canOpenQ2}
            requestFn={() =>
              generateOverviewOpenTextFeedback({
                song: 'chopin',
                question: 'q2',
                data: overviewData,
                fallbackText: getOverviewFixedFeedback({ song: 'chopin', question: 'q2', data: overviewData })
              })
            }
            onResult={() => setStageCompletion('analytical', true)}
          />
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
