import { useState } from 'react';

export default function CompareAiFeedbackBlock({ requestFn }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    setLoading(true);
    try {
      const t = await requestFn();
      setText(typeof t === 'string' ? t : '');
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
