import { useState } from 'react';
import { buildOverviewAnswerReveal } from '../lib/overviewAnswerCheck';

export default function OverviewAnswerCheckBlock({
  song,
  data,
  disabled = false,
  onResult
}) {
  const [revealed, setRevealed] = useState(false);
  const items = revealed ? buildOverviewAnswerReveal(song, data) : [];

  const onClick = () => {
    setRevealed(true);
    if (typeof onResult === 'function') onResult();
  };

  return (
    <div className="compare-ai-feedback" style={{ marginTop: 16, marginBottom: 12 }}>
      <button type="button" className="btn-s" onClick={onClick} disabled={disabled}>
        정답 확인하기
      </button>
      {revealed && items.length ? (
        <div className="overview-answer-reveal">
          {items.map((item) => (
            <div key={item.id} style={{ marginTop: 16 }}>
              <div className="sec">{item.title}</div>
              <div className="review-card">
                <div className="review-grid">
                  <div>
                    <div className="review-section-title">내 답변</div>
                    <div className="review-item" style={{ whiteSpace: 'pre-wrap' }}>
                      {item.student}
                    </div>
                  </div>
                  <div>
                    <div className="review-section-title">정답</div>
                    <div className="review-item" style={{ whiteSpace: 'pre-wrap' }}>
                      {item.reference}
                    </div>
                  </div>
                </div>
                {item.isCorrect === true ? (
                  <div className="fb show ok" style={{ marginTop: 10 }}>
                    잘 맞췄어요.
                  </div>
                ) : item.isCorrect === false ? (
                  <div className="fb show" style={{ marginTop: 10 }}>
                    일부가 다를 수 있어요. 정답과 비교해 보세요.
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
