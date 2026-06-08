import { callOpenAiResponses, parseBody } from './_shared.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const body = parseBody(req);
  const model = typeof body?.model === 'string' ? body.model.trim() : '';
  const input = body?.input;

  if (!model || input === undefined || input === null) {
    return res.status(400).json({ error: 'model과 input이 필요합니다.' });
  }

  try {
    const json = await callOpenAiResponses({ model, input });
    return res.status(200).json(json);
  } catch (err) {
    const status = err?.statusCode || 500;
    return res.status(status).json({
      error: err?.message || 'OpenAI API 호출 실패',
      details: err?.payload || null
    });
  }
}
