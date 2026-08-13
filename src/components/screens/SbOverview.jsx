import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { getOverviewFixedFeedback } from '../../lib/fixedFormativeFeedback';
import { generateOverviewOpenTextFeedback } from '../../lib/compareFeedback';
import FormativeFeedbackBlock from '../FormativeFeedbackBlock';
import CompareAiFeedbackBlock from '../CompareAiFeedbackBlock';

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

  const canOpenQ1 = useMemo(() => Boolean(q1.trim()), [q1]);
  const canOpenQ2 = useMemo(() => Boolean(q2.trim()), [q2]);
  const isAllFilled = canOpenQ1 && canOpenQ2;
  const overviewData = { analyticalCharacters, analyticalStory };

  return (
    <div className="screen active" id="sb-overview">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2 · 분석적 감상</div>
        <div className="s-title">분석적 감상</div>
        <div className="s-desc">목표: 음악 요소, 음악적 특징 및 구성을 분석하고 비교하여 음악이 어떻게 표현되고 구성되는지 파악해 보세요.</div>
      </div>

      <div className="body video-page-body">

        <div className="sec">1. 이 음악을 연주하는 악기들(또는 연주 형태)과 성악가의 성종(성부)은?</div>
        <textarea
          className="txt"
          value={q1}
          onChange={(e) => setAnalyticalCharacter(0, e.target.value)}
          placeholder="악기 편성과 목소리 형태를 적어보세요."
        />
        <div className="small-note" style={{ marginTop: 8, marginBottom: 10, lineHeight: 1.55 }}>
          작성 TIP: {SB_OVERVIEW_Q1_WRITING_TIP}
        </div>
        <div className="compare-ai-feedback" style={{ marginTop: 4, marginBottom: 12 }}>
          <FormativeFeedbackBlock
            key={`sb-overview-q1-${q1.trim() || 'none'}`}
            disabled={!canOpenQ1}
            getFeedback={() => getOverviewFixedFeedback({ song: 'schoenberg', question: 'q1', data: overviewData })}
            onResult={() => setStageCompletion('analytical', true)}
          />
        </div>

        <div className="sec">2. 이 음악의 전체적인 분위기는 어떤가요?</div>
        <textarea
          className="txt"
          value={q2}
          onChange={(e) => setAnalyticalStory(e.target.value)}
          placeholder="음악을 들으며 느낀 분위기를 적어보세요."
        />
        <div className="small-note" style={{ marginTop: 8, marginBottom: 10, lineHeight: 1.55 }}>
          작성 TIP: {SB_OVERVIEW_Q2_WRITING_TIP}
        </div>
        <div className="compare-ai-feedback" style={{ marginTop: 4, marginBottom: 12 }}>
          <CompareAiFeedbackBlock
            key={`sb-overview-q2-${q2.trim() || 'none'}`}
            disabled={!canOpenQ2}
            requestFn={() =>
              generateOverviewOpenTextFeedback({
                song: 'schoenberg',
                question: 'q2',
                data: overviewData,
                fallbackText: getOverviewFixedFeedback({ song: 'schoenberg', question: 'q2', data: overviewData })
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
            다음: sb-sprech →
          </button>
        </div>
      </div>
    </div>
  );
}

export default SbOverview;
