export function extractTextFromResponse(json) {
  if (typeof json?.output_text === 'string') return json.output_text;
  const texts = [];
  (json?.output || []).forEach((item) => {
    (item?.content || []).forEach((contentItem) => {
      if (typeof contentItem?.text === 'string') texts.push(contentItem.text);
    });
  });
  return texts.join('\n').trim();
}

export function getOpenAiApiKey() {
  const key = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
  return typeof key === 'string' ? key.trim() : '';
}

export async function callOpenAiResponses({ model, input }) {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    const err = new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
    err.statusCode = 500;
    throw err;
  }

  const openAiRes = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({ model, input })
  });

  const json = await openAiRes.json();
  if (!openAiRes.ok) {
    const err = new Error(typeof json?.error?.message === 'string' ? json.error.message : 'OpenAI API 호출 실패');
    err.statusCode = openAiRes.status;
    err.payload = json;
    throw err;
  }

  return json;
}
