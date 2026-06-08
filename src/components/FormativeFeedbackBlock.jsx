import { useState } from 'react';

export default function FormativeFeedbackBlock({
  getFeedback,
  onRequested,
  onResult,
  disabled = false
}) {
  const [text, setText] = useState('');

  const onClick = () => {
    const nextText = typeof getFeedback === 'function' ? getFeedback() : '';
    const safe = typeof nextText === 'string' ? nextText : '';
    if (typeof onRequested === 'function') onRequested();
    setText(safe);
    if (typeof onResult === 'function') onResult(safe);
  };

  return (
    <div className="compare-ai-feedback">
      <button type="button" className="btn-s" onClick={onClick} disabled={disabled}>
        피드백 보기
      </button>
      {text ? <div className="fb show info compare-ai-text">{text}</div> : null}
    </div>
  );
}
