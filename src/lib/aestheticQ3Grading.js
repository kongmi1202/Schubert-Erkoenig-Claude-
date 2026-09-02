import { requestOpenAiText } from './openaiClient';
import {
  AESTHETIC_Q3_RUBRIC_KO,
  Q3_SCORE_PROMPTS,
  markFromAestheticQ3Score,
  parseRubricScoresJson
} from './aestheticRubric';

const Q3_SCORE_JSON_FORMAT = {
  type: 'json_schema',
  name: 'aesthetic_q3_score',
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
· 위 판정 준거만 사용. V3·V2로 나누지 말고 score 하나만 부여.
· 2번에서 선택한 요소·설명한 특징과 3번 판단을 비교하여 판단하라.
· 긍정·부정 평가 모두 충족 가능. 판단의 방향은 채점에 영향 없음.
· 고정 키워드 목록을 만들지 말 것.
· 응답은 JSON만: {"score":0|1|2}`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function scoreAestheticQ3WithAi({ q2Type, q2Label, q2, q3 }) {
  const q2Text = String(q2 || '').trim();
  const q3Text = String(q3 || '').trim();
  const prompt = `${AESTHETIC_Q3_RUBRIC_KO}

${SCORE_PROMPT_RULES}

2번에서 고른 음악 요소: ${q2Label || q2Type}
2번 답변: ${q2Text}
3번 답변: ${q3Text}`;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const raw = await requestOpenAiText({
        model: 'gpt-4o-mini',
        input: prompt,
        textFormat: Q3_SCORE_JSON_FORMAT
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

export function evaluateAestheticQ3FromScore(score) {
  const s = score;
  const mark = markFromAestheticQ3Score(s);
  return {
    score: s,
    mark,
    pathPrompt: Q3_SCORE_PROMPTS[s] ?? Q3_SCORE_PROMPTS[0],
    needsQ2: false
  };
}

export function evaluateAestheticQ3Preflight({ q2Type, q2, q3 }) {
  const q2Text = String(q2 || '').trim();
  const q3Text = String(q3 || '').trim();

  if (!q2Type || q2Text.length < 8) {
    return {
      ...evaluateAestheticQ3FromScore(0),
      guide: '2번 문항(음악 요소 선택과 이유)을 먼저 완성한 뒤 피드백 보기를 눌러 주세요.',
      pathPrompt: '2번 미완료 안내만 제공.',
      needsQ2: true
    };
  }

  if (q3Text.length < 8) {
    return {
      ...evaluateAestheticQ3FromScore(0),
      guide: '3번에 곡 전체 평가를 먼저 적은 뒤 피드백 보기를 눌러 주세요.',
      pathPrompt: '3번 미작성 안내만 제공.',
      needsQ2: false
    };
  }

  return null;
}

export async function evaluateAestheticQ3({ q2Type, q2Label, q2, q3 }) {
  const preflight = evaluateAestheticQ3Preflight({ q2Type, q2, q3 });
  if (preflight) return preflight;

  const score = await scoreAestheticQ3WithAi({ q2Type, q2Label, q2, q3 });
  if (score === null) return evaluateAestheticQ3FromScore(0);
  return evaluateAestheticQ3FromScore(score);
}

export { markFromAestheticQ3Score };
