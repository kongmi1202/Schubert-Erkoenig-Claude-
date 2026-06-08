import { extractTextFromResponse } from './openaiUtils';

const MSG_NO_KEY = `──
AI 기능을 쓰려면 OpenAI API 키가 필요해요.

· 로컬: 프로젝트 루트에 \`.env.local\` 파일을 만들고 \`OPENAI_API_KEY=sk-...\` 를 적은 뒤 개발 서버를 다시 실행하세요.
· 배포(Netlify): Site configuration → Environment variables에 \`OPENAI_API_KEY\`를 추가한 뒤 사이트를 다시 배포하세요.`;

export function getApiKeySetupMessage() {
  return MSG_NO_KEY;
}

async function parseApiError(res) {
  try {
    const json = await res.json();
    if (typeof json?.error === 'string') return json.error;
    if (typeof json?.error?.message === 'string') return json.error.message;
    return null;
  } catch {
    return null;
  }
}

export async function analyzeEmotionViaApi(text) {
  const res = await fetch('/api/analyze-emotion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });

  if (!res.ok) {
    const message = await parseApiError(res);
    if (res.status === 500 && message?.includes('OPENAI_API_KEY')) {
      throw new Error(MSG_NO_KEY);
    }
    throw new Error(message || `OpenAI 요청 실패 (HTTP ${res.status}). 잠시 후 다시 시도해주세요.`);
  }

  return res.json();
}

export async function callOpenAiResponsesViaApi({ model, input }) {
  const res = await fetch('/api/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, input })
  });

  if (!res.ok) {
    const message = await parseApiError(res);
    const err = new Error(message || `OpenAI 요청 실패 (HTTP ${res.status})`);
    err.status = res.status;
    if (res.status === 500 && message?.includes('OPENAI_API_KEY')) {
      err.noKey = true;
    }
    throw err;
  }

  return res.json();
}

export async function requestOpenAiText({ model, input }) {
  const json = await callOpenAiResponsesViaApi({ model, input });
  return extractTextFromResponse(json);
}
