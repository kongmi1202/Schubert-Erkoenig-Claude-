import { callOpenAiResponses } from './_shared.js';
import { jsonResponse, parseEventBody } from './_netlify.js';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method Not Allowed' });
  }

  const body = parseEventBody(event);
  const model = typeof body?.model === 'string' ? body.model.trim() : '';
  const input = body?.input;

  if (!model || input === undefined || input === null) {
    return jsonResponse(400, { error: 'model과 input이 필요합니다.' });
  }

  try {
    const json = await callOpenAiResponses({ model, input });
    return jsonResponse(200, json);
  } catch (err) {
    const status = err?.statusCode || 500;
    return jsonResponse(status, {
      error: err?.message || 'OpenAI API 호출 실패',
      details: err?.payload || null
    });
  }
}
