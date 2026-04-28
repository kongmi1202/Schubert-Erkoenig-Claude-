import { useState } from 'react';

export default function CompareAiFeedbackBlock({ requestFn, onRequested, onResult }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    setLoading(true);
    try {
      if (typeof onRequested === 'function') onRequested();
      const t = await requestFn();
      const nextText = typeof t === 'string' ? t : '';
      setText(nextText);
      if (typeof onResult === 'function') onResult(nextText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="compare-ai-feedback">
      <button type="button" className="btn-s" onClick={onClick} disabled={loading}>
        {loading ? '피드백 생성 중…' : 'AI 맞춤 피드백 받기'}
      </button>
      {text ? <div className="fb show info compare-ai-text">{text}</div> : null}
    </div>
  );
}
