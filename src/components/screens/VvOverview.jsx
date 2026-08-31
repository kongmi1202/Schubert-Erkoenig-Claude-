import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import OverviewAnswerCheckBlock from '../OverviewAnswerCheckBlock';

function VvOverview({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const setAnalyticalCharacter = useAppStore((s) => s.setAnalyticalCharacter);
  const q1 = useAppStore((s) => s.analyticalCharacters?.[0] || '');
  const analyticalCharacters = useAppStore((s) => s.analyticalCharacters);

  const canProceed = useMemo(() => Boolean(q1.trim()), [q1]);
  const overviewData = { analyticalCharacters };
  const overviewResponseKey = useMemo(() => q1.trim(), [q1]);

  return (
    <div className="screen active" id="vv-overview">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2 · 분석적 감상</div>
        <div className="s-title">분석적 감상</div>
        <div className="s-desc">목표: 음악 요소, 음악적 특징 및 구성을 분석하고 비교하여 음악이 어떻게 표현되고 구성되는지 파악해 보세요.</div>
      </div>

      <div className="body video-page-body">

        <div className="sec">소네트 설명</div>
        <div className="sonnet-item">
          <div className="sonnet-quote">
            소네트(Sonnet)는 14행으로 된 짧은 정형시예요.
            <br />
            비발디의 &lt;사계&gt;는 봄·여름·가을·겨울마다 소네트를 붙여 두고,
            <br />
            그 시의 장면을 음악으로 그려 낸 표제음악이에요.
            <br />
            왼쪽 감상 가이드에서 이 곡(여름 3악장)의 소네트 내용을 확인해 보세요.
          </div>
        </div>

        <div className="sec">1. 소네트를 보고, 이 곡에서 묘사하는 내용이 무엇인지 적어보세요.</div>
        <textarea
          id="vv-q1"
          className="txt"
          value={q1}
          onChange={(e) => setAnalyticalCharacter(0, e.target.value)}
        />

        {canProceed ? (
          <OverviewAnswerCheckBlock
            key={overviewResponseKey}
            song="vivaldi"
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
