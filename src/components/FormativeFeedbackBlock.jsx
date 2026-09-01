import { useState } from 'react';

function VoiceSectionsFeedback({ data }) {
  return (
    <div className={`voice-fb-panel ${data.isCorrect ? 'is-correct' : 'is-wrong'}`}>
      <div className="voice-fb-verification">{data.verification}</div>
      <div className="voice-fb-summary">{data.summary}</div>
      <div className="voice-fb-sections">
        {data.sections.map((section) => (
          <article
            key={section.field}
            className={`voice-fb-card voice-fb-card--${section.tone} voice-fb-card--${section.status}`}
          >
            <header className="voice-fb-card-head">
              <div className="voice-fb-card-titles">
                <span className="voice-fb-card-label">[{section.label}]</span>
                <span className="voice-fb-card-focus">{section.focus}</span>
              </div>
              <span className={`voice-fb-card-badge ${section.status === 'ok' ? 'ok' : 'miss'}`}>
                {section.status === 'ok' ? '맞음' : '다시 보기'}
              </span>
            </header>
            <p className="voice-fb-card-note">
              {section.note}
              {section.status === 'ok' && section.studentPick ? (
                <span className="voice-fb-pick"> · 선택: {section.studentPick}</span>
              ) : null}
            </p>
            {section.status === 'miss' && section.hint ? (
              <div className="voice-fb-hint-box">
                <div className="voice-fb-hint-label">힌트</div>
                <p className="voice-fb-hint-text">{section.hint}</p>
                {section.example ? (
                  <>
                    <div className="voice-fb-hint-label">예시</div>
                    <p className="voice-fb-hint-text">{section.example}</p>
                  </>
                ) : null}
              </div>
            ) : null}
          </article>
        ))}
      </div>
      {data.footer ? <div className="voice-fb-footer">{data.footer}</div> : null}
    </div>
  );
}

export default function FormativeFeedbackBlock({
  getFeedback,
  onRequested,
  onResult,
  disabled = false
}) {
  const [payload, setPayload] = useState(null);

  const onClick = () => {
    const next = typeof getFeedback === 'function' ? getFeedback() : '';
    if (typeof onRequested === 'function') onRequested();
    setPayload(next);
    if (typeof onResult === 'function') onResult(next);
  };

  const isVoiceSections = payload && typeof payload === 'object' && payload.kind === 'voice-sections';
  const plainText =
    typeof payload === 'string'
      ? payload
      : payload && typeof payload === 'object' && payload.kind === 'plain'
        ? payload.text
        : '';

  return (
    <div className="compare-ai-feedback">
      <button type="button" className="btn-s" onClick={onClick} disabled={disabled}>
        피드백 보기
      </button>
      {isVoiceSections ? (
        <VoiceSectionsFeedback data={payload} />
      ) : plainText ? (
        <div className="fb show info compare-ai-text">{plainText}</div>
      ) : null}
    </div>
  );
}
