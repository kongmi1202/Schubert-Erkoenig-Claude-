import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import OverviewAnswerCheckBlock from '../OverviewAnswerCheckBlock';

function AnalyticalOverviewHandel({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const q1Text = useAppStore((s) => s.handelLyricMeaning);
  const q2Text = useAppStore((s) => s.handelOperaDiff);
  const setQ1Text = useAppStore((s) => s.setHandelLyricMeaning);
  const setQ2Text = useAppStore((s) => s.setHandelOperaDiff);
  const q1WritingHint = '가사에서 누구를 찬양하는지와 어떤 내용인지 한 문장으로 써보세요.';
  const q2WritingHint = '이 곡의 장르는 오라토리오예요. 오페라와 이 곡의 차이를 주제(가사 내용), 무대 연출, 의상, 연기 등에서 비교해 보세요.';

  const canOpenQ1 = useMemo(() => q1Text.trim().length > 0, [q1Text]);
  const canOpenQ2 = useMemo(() => q2Text.trim().length > 0, [q2Text]);
  const canProceed = canOpenQ1 && canOpenQ2;
  const overviewData = { handelLyricMeaning: q1Text, handelOperaDiff: q2Text };
  const overviewResponseKey = useMemo(
    () => `${q1Text.trim()}|${q2Text.trim()}`,
    [q1Text, q2Text]
  );

  return (
    <div className="screen active">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2 · 분석적 감상</div>
        <div className="s-title">분석적 감상</div>
        <div className="s-desc">목표: 음악 요소, 음악적 특징 및 구성을 분석하고 비교하여 음악이 어떻게 표현되고 구성되는지 파악해 보세요.</div>
      </div>

      <div className="body">

        <div className="sec">1. 이 음악의 가사는 어떤 내용인가요?</div>
        <textarea
          className="txt"
          value={q1Text}
          onChange={(e) => setQ1Text(e.target.value)}
          placeholder="할렐루야의 가사 내용을 써보세요..."
        />
        <div className="small-note">작성 힌트: {q1WritingHint}</div>

        <div className="sec">2. 이 음악은 오페라와 어떤 차이가 있나요?</div>
        <textarea
          className="txt"
          value={q2Text}
          onChange={(e) => setQ2Text(e.target.value)}
          placeholder="오페라와의 차이를 써보세요..."
        />
        <div className="small-note">작성 힌트: {q2WritingHint}</div>

        {canProceed ? (
          <OverviewAnswerCheckBlock
            key={overviewResponseKey}
            song="handel"
            data={overviewData}
            onResult={() => setStageCompletion('analytical', true)}
          />
        ) : null}

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
