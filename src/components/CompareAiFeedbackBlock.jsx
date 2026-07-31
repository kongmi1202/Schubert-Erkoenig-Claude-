import { useState } from 'react';

function OverviewSectionsFeedback({ data }) {
  return (
    <div className={`overview-fb-panel ${data.isCorrect ? 'is-correct' : 'is-wrong'}`}>
      <div className="overview-fb-summary">{data.summary}</div>
      <div className="overview-fb-sections">
        {data.sections.map((section) => (
          <article
            key={section.id}
            className={`overview-fb-card overview-fb-card--${section.tone} overview-fb-card--${section.status}`}
          >
            <header className="overview-fb-card-head">
              <div className="overview-fb-card-titles">
                <span className="overview-fb-card-label">{section.label}</span>
                <span className="overview-fb-card-focus">{section.focus}</span>
              </div>
              <span className={`overview-fb-card-badge ${section.status === 'ok' ? 'ok' : 'miss'}`}>
                {section.verification}
              </span>
            </header>
            <p className="overview-fb-card-body">{section.body}</p>
          </article>
        ))}
      </div>
      {data.footer ? <div className="overview-fb-footer">{data.footer}</div> : null}
    </div>
  );
}

export default function CompareAiFeedbackBlock({ requestFn, onRequested, onResult, disabled = false }) {
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    setLoading(true);
    try {
      if (typeof onRequested === 'function') onRequested();
      const next = await requestFn();
      setPayload(next);
      if (typeof onResult === 'function') onResult(next);
    } finally {
      setLoading(false);
    }
  };

  const isOverview = payload && typeof payload === 'object' && payload.kind === 'overview-sections';
  const plainText = typeof payload === 'string' ? payload : '';

  return (
    <div className="compare-ai-feedback">
      <button type="button" className="btn-s" onClick={onClick} disabled={loading || disabled}>
        {loading ? '피드백 생성 중…' : 'AI 맞춤형 피드백 보기'}
      </button>
      {isOverview ? (
        <OverviewSectionsFeedback data={payload} />
      ) : plainText ? (
        <div className="fb show info compare-ai-text">{plainText}</div>
      ) : null}
    </div>
  );
}
