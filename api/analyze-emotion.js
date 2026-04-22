const EMOTION_KEYS = ['happiness', 'sadness', 'anger', 'fear', 'disgust', 'surprise'];

function extractTextFromResponse(json) {
  if (typeof json?.output_text === 'string') return json.output_text;
  const texts = [];
  (json?.output || []).forEach((item) => {
    (item?.content || []).forEach((contentItem) => {
      if (typeof contentItem?.text === 'string') texts.push(contentItem.text);
    });
  });
  return texts.join('\n').trim();
}

function normalizeEmotionScores(raw) {
  const scores = {};
  let total = 0;

  EMOTION_KEYS.forEach((key) => {
    const value = Number(raw?.[key]);
    const safe = Number.isFinite(value) ? Math.max(0, value) : 0;
    scores[key] = safe;
    total += safe;
  });

  // Model can occasionally drift from 100; normalize deterministically.
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

function parseBody(req) {
  if (req?.body && typeof req.body === 'object') return req.body;
  if (typeof req?.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const body = parseBody(req);
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  if (text.length < 10) {
    return res.status(400).json({ error: '더 자세하게 써주세요.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY가 설정되지 않았습니다.' });
  }

  const systemPrompt = `당신은 음악 감상 텍스트를 분석하여
감정을 분류하는 전문가입니다.
입력된 텍스트를 읽고
아래 6가지 감정의 비율을 분석하세요.
반드시 JSON 형식으로만 응답하세요.
다른 텍스트는 절대 포함하지 마세요.
6가지 감정 비율의 합은 반드시 100이어야 합니다.`;

  const userPrompt = `다음 음악 감상 서술에서 느껴지는
감정을 분석해주세요: ${text}

응답 형식:
{
  happiness: 숫자,
  sadness: 숫자,
  anger: 숫자,
  fear: 숫자,
  disgust: 숫자,
  surprise: 숫자,
  summary: '한 문장 요약 (한국어)'
}`;

  try {
    const openAiRes = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        input: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!openAiRes.ok) {
      const errorText = await openAiRes.text();
      return res.status(openAiRes.status).json({ error: errorText || 'OpenAI API 호출 실패' });
    }

    const json = await openAiRes.json();
    const rawText = extractTextFromResponse(json);
    const parsed = JSON.parse(rawText);
    const emotions = normalizeEmotionScores(parsed);
    const summary = typeof parsed?.summary === 'string' ? parsed.summary.trim() : '';

    return res.status(200).json({
      emotions,
      summary
    });
  } catch (err) {
    return res.status(500).json({
      error: err?.message || '감정 분석 중 오류가 발생했습니다.'
    });
  }
}
