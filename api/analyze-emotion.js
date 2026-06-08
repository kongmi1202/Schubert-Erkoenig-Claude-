import { callOpenAiResponses, extractTextFromResponse } from './_shared.js';
import { jsonResponse, parseEventBody } from './_netlify.js';

const EMOTION_KEYS = ['happiness', 'sadness', 'anger', 'fear', 'disgust', 'surprise'];

function normalizeEmotionScores(raw) {
  const scores = {};
  let total = 0;

  EMOTION_KEYS.forEach((key) => {
    const value = Number(raw?.[key]);
    const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
    scores[key] = safe;
    total += safe;
  });

  if (total <= 0) {
    const even = Math.floor(100 / EMOTION_KEYS.length);
    let remainder = 100 - even * EMOTION_KEYS.length;
    EMOTION_KEYS.forEach((key) => {
      scores[key] = even + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder -= 1;
    });
    return scores;
  }

  const normalized = {};
  let running = 0;
  EMOTION_KEYS.forEach((key, index) => {
    if (index === EMOTION_KEYS.length - 1) {
      normalized[key] = 100 - running;
      return;
    }
    const scaled = Math.round((scores[key] / total) * 100);
    normalized[key] = scaled;
    running += scaled;
  });
  return normalized;
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method Not Allowed' });
  }

  const body = parseEventBody(event);
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  if (text.length < 10) {
    return jsonResponse(400, { error: '더 자세하게 써주세요.' });
  }

  const systemPrompt = `당신은 음악 감상 텍스트를 분석하여 감정을 분류하는 전문가입니다.
입력된 텍스트를 읽고 아래 6가지 감정의 비율을 분석하세요.
반드시 JSON 형식으로만 응답하세요.
다른 텍스트는 절대 포함하지 마세요.
6가지 감정 비율의 합은 반드시 100이어야 합니다.`;

  const userPrompt = `다음 음악 감상 서술에서 느껴지는 감정을 분석해주세요: ${text}

응답 형식:
{
  "happiness": 숫자,
  "sadness": 숫자,
  "anger": 숫자,
  "fear": 숫자,
  "disgust": 숫자,
  "surprise": 숫자,
  "summary": "한 문장 요약 (한국어)"
}`;

  try {
    const json = await callOpenAiResponses({
      model: 'gpt-4o-mini',
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });

    const rawText = extractTextFromResponse(json);
    const parsed = JSON.parse(rawText);
    const emotions = normalizeEmotionScores(parsed);
    const summary = typeof parsed?.summary === 'string' ? parsed.summary.trim() : '';

    return jsonResponse(200, {
      emotions,
      summary
    });
  } catch (err) {
    const status = err?.statusCode || 500;
    return jsonResponse(status, {
      error: err?.message || '감정 분석 중 오류가 발생했습니다.'
    });
  }
}
