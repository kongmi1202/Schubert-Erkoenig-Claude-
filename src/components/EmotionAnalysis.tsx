import { useEffect, useMemo, useState } from 'react';
import { analyzeEmotionViaApi } from '../lib/openaiClient';
import { useAppStore } from '../store/useAppStore';

interface EmotionAnalysisProps {
  text: string;
  triggerKey?: number;
  hideButton?: boolean;
}

type EmotionKey = 'sadness' | 'fear' | 'anger' | 'happiness' | 'surprise' | 'disgust';

type EmotionResult = {
  emotions: Record<EmotionKey, number>;
  summary: string;
};

type EmotionRaw = Partial<Record<EmotionKey, number>> & { summary?: string };

const EMOTIONS: Array<{ key: EmotionKey; label: string; emoji: string; color: string }> = [
  { key: 'sadness', label: '슬픔', emoji: '😢', color: '#6b9fd4' },
  { key: 'fear', label: '공포', emoji: '😨', color: '#a78bfa' },
  { key: 'anger', label: '분노', emoji: '😠', color: '#f87171' },
  { key: 'happiness', label: '기쁨', emoji: '😊', color: '#fbbf24' },
  { key: 'surprise', label: '놀라움', emoji: '😮', color: '#34d399' },
  { key: 'disgust', label: '혐오', emoji: '😒', color: '#94a3b8' }
];

function normalizeEmotionScores(raw: EmotionRaw): Record<EmotionKey, number> {
  const keys: EmotionKey[] = ['happiness', 'sadness', 'anger', 'fear', 'disgust', 'surprise'];
  const scores = {} as Record<EmotionKey, number>;
  let total = 0;

  keys.forEach((key) => {
    const value = Number(raw?.[key]);
    const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
    scores[key] = safe;
    total += safe;
  });

  if (total <= 0) {
    const even = Math.floor(100 / keys.length);
    let remainder = 100 - even * keys.length;
    keys.forEach((key) => {
      scores[key] = even + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder -= 1;
    });
    return scores;
  }

  const normalized = {} as Record<EmotionKey, number>;
  let running = 0;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      normalized[key] = 100 - running;
      return;
    }
    const scaled = Math.round((scores[key] / total) * 100);
    normalized[key] = scaled;
    running += scaled;
  });
  return normalized;
}

export default function EmotionAnalysis({ text, triggerKey, hideButton = false }: EmotionAnalysisProps) {
  const [result, setResult] = useState<EmotionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sortedEmotions = useMemo(() => {
    if (!result) return [];
    return [...EMOTIONS].sort(
      (a, b) => (result.emotions?.[b.key] ?? 0) - (result.emotions?.[a.key] ?? 0)
    );
  }, [result]);

  const analyzeEmotion = async () => {
    if (!text || text.trim().length < 10) {
      setError('느낌을 조금 더 자세하게 써주세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const json = await analyzeEmotionViaApi(text);
      const data: EmotionResult = {
        emotions: normalizeEmotionScores(json.emotions as EmotionRaw),
        summary: typeof json?.summary === 'string' ? json.summary.trim() : ''
      };
      if (!data.summary) {
        data.summary = '입력한 글에서 여러 감정이 함께 나타났어요.';
      }
      if (!data.emotions) {
        setError('감정 분석 결과를 만들지 못했어요. 다시 시도해주세요.');
        return;
      }
      setResult(data);
      useAppStore.setState({
        emotionResult: data.emotions,
        emotionSummary: data.summary
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '분석 중 오류가 발생했어요. 다시 시도해주세요.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const topKey = sortedEmotions[0]?.key;

  useEffect(() => {
    if (typeof triggerKey !== 'number') return;
    if (triggerKey <= 0) return;
    void analyzeEmotion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerKey]);

  return (
    <div className="review-card" style={{ marginTop: 12 }}>
      {!hideButton ? (
        <button type="button" className="btn-p" onClick={analyzeEmotion} disabled={loading}>
          {loading ? '분석 중...' : '📊 이 곡에서 느낀 나의 감정 분석하기'}
        </button>
      ) : null}

      {loading ? (
        <div className="small-note" style={{ marginTop: 10 }}>
          <span style={{ marginRight: 8 }}>⏳</span>
          AI가 감정을 분석하고 있어요...
        </div>
      ) : null}

      {error ? <div className="fb show ng" style={{ marginTop: 10 }}>{error}</div> : null}

      {result ? (
        <div style={{ marginTop: 14 }}>
          <div className="sec">나의 감정 분석</div>
          <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
            {sortedEmotions.map((emotion) => {
              const value = result.emotions?.[emotion.key] ?? 0;
              const isTop = emotion.key === topKey;
              return (
                <div
                  key={emotion.key}
                  style={{
                    border: isTop ? '1px solid var(--purple-light)' : '1px solid var(--border)',
                    background: isTop ? 'var(--surface2)' : 'var(--surface)',
                    padding: '8px 10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                    <span>{emotion.emoji} {emotion.label}</span>
                    <strong>{value}%</strong>
                  </div>
                  <div style={{ height: 8, background: 'var(--bg3)' }}>
                    <div
                      style={{
                        width: `${Math.max(0, Math.min(100, value))}%`,
                        height: '100%',
                        background: emotion.color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="fb show info">💬 {result.summary}</div>
          <button
            type="button"
            className="btn-s"
            style={{ marginTop: 10 }}
            onClick={() => setResult(null)}
          >
            다시 분석하기
          </button>
        </div>
      ) : null}
    </div>
  );
}
