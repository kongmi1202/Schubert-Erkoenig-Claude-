import { useState } from 'react';
import { parseAestheticFeedbackText, parseStage2FeedbackText } from '../lib/formativeAiFeedback';
import { formatMarkDisplay } from '../lib/formative/markLabels';

function markTone(mark) {
  if (mark === '✓') return 'ok';
  if (mark === '△') return 'partial';
  return 'miss';
}

function MatchCardChips({ cards }) {
  if (!cards?.length) {
    return <span className="stage2-match-empty">아직 없음</span>;
  }
  return (
    <div className="stage2-match-chips">
      {cards.map((card) => {
        const label = typeof card === 'string' ? card : card.label;
        const status = typeof card === 'string' ? '' : card.status;
        return (
          <span
            key={label}
            className={`stage2-match-chip${status ? ` stage2-match-chip--${status}` : ''}`}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}

function HyThemeMatchSection({ data }) {
  const col1Header = data.col1Header || '제1주제 칸';
  const col2Header = data.col2Header || '제2주제 칸';
  return (
    <div className="stage2-match-block">
      {data.intro ? <p className="stage2-match-intro">{data.intro}</p> : null}
      <div className="stage2-match-table-wrap">
        <table className="stage2-match-table">
          <thead>
            <tr>
              <th scope="col">구분</th>
              <th scope="col">{col1Header}</th>
              <th scope="col">{col2Header}</th>
              <th scope="col">판정</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => {
              const rowStatus = row.status || (row.needsWork ? 'miss' : 'ok');
              return (
                <tr key={row.dim} className={row.needsWork ? 'is-focus' : 'is-ok'}>
                  <th scope="row">
                    <div className="stage2-match-dim">
                      <span>{row.dim}</span>
                      {row.focus ? <span className="stage2-match-dim-focus">{row.focus}</span> : null}
                    </div>
                  </th>
                  <td>
                    <MatchCardChips cards={row.theme1Cards || row.theme1} />
                    {row.t1Status === 'empty' ? (
                      <div className="stage2-match-cell-note">이 칸에 해당 구분 카드가 없어요</div>
                    ) : null}
                  </td>
                  <td>
                    <MatchCardChips cards={row.theme2Cards || row.theme2} />
                    {row.t2Status === 'empty' ? (
                      <div className="stage2-match-cell-note">이 칸에 해당 구분 카드가 없어요</div>
                    ) : null}
                  </td>
                  <td>
                    <span className={`stage2-match-badge ${rowStatus === 'ok' ? 'ok' : 'miss'}`}>
                      {rowStatus === 'ok' ? '맞음' : '다시 보기'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {data.hints?.length ? (
        <div className="stage2-match-hints">
          <div className="stage2-match-hints-title">다시 들어볼 것</div>
          <ul>
            {data.hints.map((hint) => (
              <li key={hint.dim}>
                <div className="stage2-match-hint-head">
                  <strong>{hint.dim}</strong>
                  {hint.note ? <span className="stage2-match-hint-note">{hint.note}</span> : null}
                </div>
                <p className="stage2-match-hint-text">{hint.text}</p>
                {hint.example ? (
                  <p className="stage2-match-hint-example">
                    <span className="stage2-match-hint-example-label">예시</span>
                    {hint.example}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {data.fallbackNote ? <p className="stage2-match-note">{data.fallbackNote}</p> : null}
      {data.footer ? <p className="stage2-match-footer">{data.footer}</p> : null}
    </div>
  );
}

function VoiceSectionsBlock({ data }) {
  return (
    <div className={`voice-fb-panel ${data.isCorrect ? 'is-correct' : 'is-wrong'}`}>
      {data.summary ? <div className="voice-fb-summary">{data.summary}</div> : null}
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

function SliderItemBlock({ data }) {
  const status = data.isCorrect ? 'ok' : 'miss';
  return (
    <article className={`voice-fb-card voice-fb-card--pitch voice-fb-card--${status}`}>
      <header className="voice-fb-card-head">
        <div className="voice-fb-card-titles">
          <span className="voice-fb-card-label">내 슬라이더</span>
          <span className="voice-fb-card-focus">{data.studentPick || '—'}</span>
        </div>
        <span className={`voice-fb-card-badge ${status}`}>
          {data.isCorrect ? '맞음' : '다시 보기'}
        </span>
      </header>
      <p className="voice-fb-card-note" style={{ whiteSpace: 'pre-wrap' }}>
        {data.body}
      </p>
    </article>
  );
}

function Stage2SectionsFeedback({ data }) {
  const tone = markTone(data.mark);
  return (
    <div className={`fb show compare-ai-text stage2-fb-panel stage2-fb-panel--${tone}`}>
      <div className={`stage2-fb-verification stage2-fb-verification--${tone}`}>
        검증: {formatMarkDisplay(data.mark)}
      </div>
      <div className="stage2-fb-body">
        {data.sections.map((section, index) => (
          <div key={`${section.label || index}-${section.kind}`} className="stage2-fb-section">
            {section.label ? <div className="stage2-fb-item-label">{section.label}</div> : null}
            {section.kind === 'hy-theme-match' ? (
              <HyThemeMatchSection data={section} />
            ) : section.kind === 'voice-sections' ? (
              <VoiceSectionsBlock data={section} />
            ) : section.kind === 'slider-item' ? (
              <SliderItemBlock data={section} />
            ) : (
              <div className="stage2-fb-section-body" style={{ whiteSpace: 'pre-wrap' }}>
                {section.body}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderStage2Body(body) {
  const text = String(body || '').trim();
  if (!text) return null;
  const sections = text.split(/\n(?=(?:\d+-\d+|\d+)\.\s)/);
  return sections.map((section, index) => {
    const trimmed = section.trim();
    if (!trimmed) return null;
    const lines = trimmed.split('\n');
    const hasItemLabel = /^(?:\d+-\d+|\d+)\.\s/.test(lines[0] || '');
    const label = hasItemLabel ? lines[0] : '';
    const rest = (hasItemLabel ? lines.slice(1) : lines).join('\n').trim();
    return (
      <div key={`${index}-${label || 'main'}`} className={hasItemLabel ? 'stage2-fb-section' : ''}>
        {label ? <div className="stage2-fb-item-label">{label}</div> : null}
        {rest ? (
          <div className="stage2-fb-section-body" style={{ whiteSpace: 'pre-wrap' }}>
            {rest}
          </div>
        ) : null}
      </div>
    );
  });
}

function Stage2PlainFeedback({ text }) {
  const parsed = parseStage2FeedbackText(text);
  if (!parsed) {
    return (
      <div className="fb show info compare-ai-text" style={{ whiteSpace: 'pre-wrap' }}>
        {text}
      </div>
    );
  }

  const tone = markTone(parsed.mark);

  return (
    <div className={`fb show compare-ai-text stage2-fb-panel stage2-fb-panel--${tone}`}>
      <div className={`stage2-fb-verification stage2-fb-verification--${tone}`}>
        검증: {formatMarkDisplay(parsed.mark)}
      </div>
      <div className="stage2-fb-body">{renderStage2Body(parsed.body)}</div>
    </div>
  );
}

function Stage3PlainFeedback({ text, mark }) {
  const tone = markTone(mark);
  const bodyText = text.replace(
    /📍\s*현재 나의 수준\s*[:：]\s*[✓△✗](?:\s+[^\n]*)?\s*\n?/,
    ''
  ).trim();

  return (
    <div className={`fb show compare-ai-text stage3-fb-panel stage3-fb-panel--${tone}`}>
      <div className={`stage3-fb-level stage3-fb-level--${tone}`}>
        📍 현재 나의 수준: {formatMarkDisplay(mark)}
      </div>
      <div className="stage3-fb-body" style={{ whiteSpace: 'pre-wrap' }}>
        {bodyText}
      </div>
    </div>
  );
}

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
  const isStage2Sections = payload && typeof payload === 'object' && payload.kind === 'stage2-sections';
  const plainText = typeof payload === 'string' ? payload : '';
  const stage2Parsed = plainText ? parseStage2FeedbackText(plainText) : null;
  const stage3Parsed = plainText && !stage2Parsed ? parseAestheticFeedbackText(plainText) : null;

  return (
    <div className="compare-ai-feedback">
      <div className="compare-ai-feedback-head">활동 피드백</div>
      <button type="button" className="btn-feedback" onClick={onClick} disabled={loading || disabled}>
        {loading ? '피드백 생성 중…' : '피드백 보기'}
      </button>
      {isOverview ? (
        <OverviewSectionsFeedback data={payload} />
      ) : isStage2Sections ? (
        <Stage2SectionsFeedback data={payload} />
      ) : stage2Parsed ? (
        <Stage2PlainFeedback text={plainText} />
      ) : stage3Parsed ? (
        <Stage3PlainFeedback text={plainText} mark={stage3Parsed.mark} />
      ) : plainText ? (
        <div className="fb show info compare-ai-text" style={{ whiteSpace: 'pre-wrap' }}>{plainText}</div>
      ) : null}
    </div>
  );
}
