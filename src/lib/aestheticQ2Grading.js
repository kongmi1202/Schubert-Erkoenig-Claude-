import { requestOpenAiText } from './openaiClient';
import {
  AESTHETIC_Q2_RUBRIC_KO,
  Q2_SCORE_PROMPTS,
  markFromAestheticQ2Score,
  parseRubricScoresJson
} from './aestheticRubric';

const Q2_SCORE_JSON_FORMAT = {
  type: 'json_schema',
  name: 'aesthetic_q2_score',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      score: { type: 'integer', enum: [0, 1, 2] }
    },
    required: ['score'],
    additionalProperties: false
  }
};

const SCORE_PROMPT_RULES = `[채점 지침]
· 위 판정 준거만 사용. V1·V2로 나누지 말고 score 하나만 부여.
· 학생이 선택한 음악 요소와 서술형 응답을 비교하여 판단하라.
· 고정 키워드 목록을 만들지 말 것.
· 응답은 JSON만: {"score":0|1|2}`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function scoreAestheticQ2WithAi({ q2Type, q2Label, q2 }) {
  const text = String(q2 || '').trim();
  const prompt = `${AESTHETIC_Q2_RUBRIC_KO}

${SCORE_PROMPT_RULES}

고른 음악 요소: ${q2Label || q2Type}
학생 답변(이유): ${text}`;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const raw = await requestOpenAiText({
        model: 'gpt-4o-mini',
        input: prompt,
        textFormat: Q2_SCORE_JSON_FORMAT
      });
      const parsed = parseRubricScoresJson(raw, ['score']);
      if (parsed) return parsed.score;
    } catch {
      // retry
    }
    if (attempt < 2) await sleep(1000 * (attempt + 1));
  }

  return null;
}

export function evaluateAestheticQ2FromScore(score) {
  const s = score;
  const mark = markFromAestheticQ2Score(s);
  return {
    score: s,
    mark,
    pathPrompt: Q2_SCORE_PROMPTS[s] ?? Q2_SCORE_PROMPTS[0]
  };
}

export function evaluateAestheticQ2Preflight({ q2Type, q2 }) {
  const text = String(q2 || '').trim();
  if (!q2Type || text.length < 8) {
    return evaluateAestheticQ2FromScore(0);
  }
  return null;
}

export async function evaluateAestheticQ2({ q2Type, q2Label, q2 }) {
  const preflight = evaluateAestheticQ2Preflight({ q2Type, q2 });
  if (preflight) return preflight;

  const score = await scoreAestheticQ2WithAi({ q2Type, q2Label, q2 });
  if (score === null) return evaluateAestheticQ2FromScore(0);
  return evaluateAestheticQ2FromScore(score);
}

export { markFromAestheticQ2Score };
