const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8'
};

export function parseEventBody(event) {
  if (!event?.body) return {};
  if (typeof event.body === 'object') return event.body;
  try {
    return JSON.parse(event.body);
  } catch {
    return {};
  }
}

export function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify(payload)
  };
}

export function createDevEvent(method, body) {
  return {
    httpMethod: method,
    body: JSON.stringify(body ?? {})
  };
}

export async function sendNetlifyHandler(handler, req, res, body) {
  const result = await handler(createDevEvent(req.method, body));
  res.statusCode = result?.statusCode || 500;
  Object.entries(result?.headers || JSON_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  res.end(result?.body || JSON.stringify({ error: 'API 처리 중 오류가 발생했습니다.' }));
}
