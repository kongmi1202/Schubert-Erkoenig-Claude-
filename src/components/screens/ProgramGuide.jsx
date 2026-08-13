const STAGES = [
  {
    num: '①',
    title: '감각적 감상',
    icon: '👂',
    color: 'crimson',
    goal: '느끼기',
    items: ['키워드·색', '감정 분석']
  },
  {
    num: '②',
    title: '분석적 감상',
    icon: '🔎',
    color: 'purple',
    goal: '분석하기',
    items: ['음악의 구성', '음악 요소 1·2']
  },
  {
    num: '③',
    title: '심미적 감상',
    icon: '💎',
    color: 'gold',
    goal: '가치 판단',
    items: ['역사 맥락', '가치·삶 연결']
  }
];

function FlowArrow() {
  return (
    <div className="pg-flow-arrow pg-flow-arrow--h" aria-hidden="true">
      <span className="pg-flow-arrow-line" />
      <span className="pg-flow-arrow-head">→</span>
    </div>
  );
}

function StageCard({ stage }) {
  return (
    <article className={`pg-stage-card pg-stage-card--${stage.color}`}>
      <div className="pg-stage-num">{stage.num}</div>
      <div className="pg-stage-icon" aria-hidden="true">{stage.icon}</div>
      <div className="pg-stage-title">{stage.title}</div>
      <div className="pg-stage-goal">{stage.goal}</div>
      <ul className="pg-stage-items">
        {stage.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

function ProgramGuide({ go }) {
  return (
    <div className="screen active" id="program-guide">
      <div className="stage-header">
        <div className="s-eyebrow">PROGRAM GUIDE</div>
        <div className="s-title">이 프로그램은 이렇게 진행돼요</div>
        <div className="s-desc">
          음악을 느끼고 → 분석하고 → 가치를 판단하는 3단계 감상 여정이에요.
        </div>
      </div>

      <div className="body program-guide-body">
        <div className="pg-flow-scroll">
          <div className="pg-flow pg-flow--horizontal">
            <div className="pg-flow-node pg-flow-node--start">
              <span className="pg-flow-icon" aria-hidden="true">🎵</span>
              <span className="pg-flow-label">악곡 선택</span>
              <span className="pg-flow-sub">6곡 중 1곡</span>
            </div>

            <FlowArrow />

            {STAGES.map((stage, index) => (
              <div key={stage.num} className="pg-flow-step">
                <StageCard stage={stage} />
                {index < STAGES.length - 1 ? <FlowArrow /> : null}
              </div>
            ))}

            <FlowArrow />

            <div className="pg-flow-node pg-flow-node--end">
              <span className="pg-flow-icon" aria-hidden="true">✦</span>
              <span className="pg-flow-label">최종 감상문</span>
              <span className="pg-flow-sub">AI 완성</span>
            </div>
          </div>
        </div>

        <div className="btn-row">
          <button type="button" className="btn-s" onClick={() => go('intro')}>
            ← 이전
          </button>
          <button type="button" className="btn-p" onClick={() => go('studentInfo')}>
            다음: 정보 입력 →
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProgramGuide;
