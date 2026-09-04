import { getApiKeySetupMessage, requestOpenAiText } from './openaiClient';
import {
  evaluateMawangOverviewQ1,
  evaluateMawangOverviewQ2,
  evaluateOverviewQuestion,
  gradeOverviewQ1,
  gradeOverviewQ2,
  getOverviewStudentQ1,
  getOverviewStudentQ2,
  includesAnyToken,
  MAWANG_Q1_ROLE_ALIASES,
  resolveMawangCharacterRole
} from './overviewGrading';
import { VOICE_DESIGN_FIELD_KEYS } from './voiceDesignAnswers';

const MSG_NO_KEY = getApiKeySetupMessage();

/**
 * Kulhavy & Stock(1989) 검증·정교화 + Shute(2008) 형성적 피드백 — 모든 맞춤형 AI 피드백 프롬프트에 공통 적용
 */
const FORMATIVE_AI_FEEDBACK_RULES_KO = `[피드백 설계 원칙 — 반드시 준수]

Kulhavy & Stock(1989)
· 검증(Verification): 과제 기준에 맞는지 먼저 판단한다. 응답 첫 줄은 반드시 아래 형식만 사용한다.
  검증: ✓  또는  검증: ✗
· 정교화(Elaboration): 검증 다음 줄부터, 관련 음악 개념을 이름으로 짚어 설명한다. (예: 음색, 리듬꼴, 음계·장단조, 선율, 반주, 성부, 음역, 형식, 반복 등)

Shute(2008)
① 학습자 인물 칭찬이 아니라 음악 과제·요소에 초점을 둔다. ("잘했어요", "훌륭해요" 등 개인 칭찬 중심 문장 금지)
② 음악 요소명과 개념을 구체적으로 직접 언급한다.
③ 간결하게: 검증 줄 포함, 정답(검증 ✓)일 때는 총 2~3문장, 오답(검증 ✗)일 때는 검증 다음 본문 1~2문장(힌트와 재시도 유도를 이 안에 담는다).
④ 문장은 초등학생도 이해할 수 있는 쉬운 말로 쓴다.
   - 어려운 말 대신 쉬운 말을 쓴다. (예: 정교화→쉽게 설명, 측면→부분, 추정→짐작)
   - 꼭 필요한 음악 용어는 한 번만 쓰고, 바로 쉬운 말을 덧붙인다. (예: 셈여림(소리의 세기), 템포(빠르기))
   - 한 문장은 10~20자 내외의 짧은 문장 중심으로 쓴다.

[오답 — 검증: ✗ 일 때]
· 모범 정답 문구, 정답 보기, 정답 단어·숫자를 본문에 절대 넣지 않는다.
· 시의 제목·장면 설명(예: 천둥·번개)을 빌려 정답 음악 행동을 암시하는 문장도 금지한다. ("~을 위해 강하고 빠른 음이 필요하다"처럼 과제 정답을 유추하게 만드는 서술 금지)
· 정답을 대신 말하는 표현도 금지한다. (예: "~이 필요합니다", "~해야 합니다", "더 세게·더 빠르게" 등 구체적 음악 행동 지시) 집중할 음악 요소의 이름(셈여림·빠르기·리듬꼴 등)만 제시한다.
· "틀렸습니다"만으로 끝내지 않는다.
· 다시 들을 때 집중할 음악적 포인트를 힌트로 넣는다.
· 마지막 문장은 반드시 "다시 들어보세요." 또는 "다시 생각해보세요." 중 하나로 끝낸다.

[정답 — 검증: ✓ 일 때]
· 음악 요소명을 반드시 포함한다.
· 개인 칭찬보다 음악 개념 설명에 비중을 둔다.`;

function wrapFormativePrompt(taskPrompt) {
  return `${FORMATIVE_AI_FEEDBACK_RULES_KO}

---

${taskPrompt}`;
}

/** 응답 첫 줄 검증 표기 — UI에서 「정답 확인」 게이트 등에 사용 */
export function feedbackIndicatesVerificationCorrect(text) {
  return /검증\s*[:：]\s*✓/.test(String(text || '').trim());
}

/** 명시적 ✗가 없을 때만, 구 형식 긍정 피드백을 폴백으로 인정 */
export function feedbackAllowsProceedAfterAi(text) {
  const raw = String(text || '').trim();
  if (!raw) return false;
  if (/검증\s*[:：]\s*✗/.test(raw)) return false;
  if (feedbackIndicatesVerificationCorrect(raw)) return true;
  const positive = /(완벽|모두\s*맞|전부\s*맞|정확|맞아떨어|좋은\s*선택)/;
  const negative = /(빠진|틀렸|수정|보완|부족|헷갈|아쉬|다른\s*칸)/;
  return positive.test(raw) && !negative.test(raw);
}

/**
 * 1차 응답 후 「피드백 보기」를 받은 뒤 「정답 확인」 허용 여부(과제 기준 정오는 UI에서 판별한 값 사용).
 * · 피드백 요청 시점에 정답이면 → 피드백 완료 후 응답이 그때와 같으면 바로 허용.
 * · 오답이면 → 피드백 본 뒤 응답이 그때와 달라졌을 때만 허용(2차 응답).
 * `responseAtFeedback` / `currentResponse`는 문자열·숫자 등 `===` 로 비교 가능한 값이면 된다.
 */
export function canOpenAnswerAfterFormativeAiGate({
  feedbackCompleted,
  wasCorrectWhenFeedbackRequested,
  responseAtFeedback,
  currentResponse
}) {
  if (!feedbackCompleted) return false;
  if (wasCorrectWhenFeedbackRequested) return currentResponse === responseAtFeedback;
  return currentResponse !== responseAtFeedback;
}

/** 보기 문자열 비교용(유니코드 정규형·앞뒤 공백) — UI 정오 판별과 동일 규칙으로 맞추려면 이걸 쓴다. */
export function normalizeFormativeChoice(s) {
  const t = String(s ?? '').trim();
  try {
    return t.normalize('NFC');
  } catch {
    return t;
  }
}

/**
 * 모델이 내부 참고와 달리 검증 줄을 잘못 출력하는 경우가 있어,
 * 피드백 첫 줄을 코드에서 판별한 객관적 정오(isCorrect)에 맞춘다.
 */
function syncFormativeAiVerificationLine(text, isCorrect) {
  const raw = String(text || '').trim();
  const verificationLine = isCorrect ? '검증: ✓' : '검증: ✗';
  if (!raw) return verificationLine;
  const lines = raw.split(/\r?\n/);
  const first = lines[0] ?? '';
  if (/검증\s*[:：]\s*[✓✗]/.test(first)) {
    lines[0] = verificationLine;
    return lines.join('\n');
  }
  return `${verificationLine}\n${raw}`;
}

const SAFE_OBJECTIVE_CORRECT_BODY =
  '맞았어요! 다시 들으면서 소리의 세기, 빠르기, 리듬 중 무엇이 그렇게 들렸는지 한 가지만 말해 보세요.';
const SAFE_OBJECTIVE_WRONG_BODY =
  '선택한 답이 정답과 달라요. 같은 부분을 다시 들으며 소리의 세기, 빠르기, 리듬이 어떻게 바뀌는지 들어 보세요. 다시 생각해보세요.';

/** 객관적 정오와 모델 검증/본문이 크게 엇갈릴 때 안전한 짧은 피드백으로 대체한다. */
function finalizeObjectiveChoiceAiFeedback(text, isCorrect) {
  const raw = String(text || '').trim();
  if (!raw) {
    return isCorrect ? `검증: ✓\n${SAFE_OBJECTIVE_CORRECT_BODY}` : `검증: ✗\n${SAFE_OBJECTIVE_WRONG_BODY}`;
  }
  const first = (raw.split(/\r?\n/)[0] || '').trim();
  const aiMarkedWrong = /검증\s*[:：]\s*✗/.test(first);
  const aiMarkedCorrect = /검증\s*[:：]\s*✓/.test(first);
  if (isCorrect && aiMarkedWrong) return `검증: ✓\n${SAFE_OBJECTIVE_CORRECT_BODY}`;
  if (!isCorrect && aiMarkedCorrect) return `검증: ✗\n${SAFE_OBJECTIVE_WRONG_BODY}`;
  return syncFormativeAiVerificationLine(raw, isCorrect);
}

function msgApiFailed(status) {
  if (status === 429) {
    return `──
OpenAI 요청 한도(HTTP 429)에 걸렸어요. 잠시 후 「피드백 보기」를 다시 눌러 보세요. Free 등급은 분·일 제한이 작을 수 있어요. https://platform.openai.com/usage 에서 사용량을 확인하거나, 1~2분 뒤 재시도해 보세요.`;
  }
  return `──
OpenAI 요청이 실패했습니다${status ? ` (HTTP ${status})` : ''}. API 키가 맞는지, 결제·크레딧이 있는지 확인해 보세요.`;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function requestCompareFeedback(prompt, fallbackBody) {
  const maxAttempts = 4;
  let lastStatus = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const text = await requestOpenAiText({
        model: 'gpt-4o-mini',
        input: prompt
      });
      const trimmed = text?.trim();
      if (!trimmed) return `${fallbackBody}\n\n${msgApiFailed()}`;
      return trimmed;
    } catch (err) {
      if (err?.noKey) return `${fallbackBody}\n\n${MSG_NO_KEY}`;

      lastStatus = err?.status || null;
      const retryable = lastStatus === 429 || lastStatus === 503;
      if (retryable && attempt < maxAttempts - 1) {
        const backoff = Math.min(2500 * 2 ** attempt, 20_000);
        await sleep(backoff);
        continue;
      }

      if (attempt < maxAttempts - 1 && !lastStatus) {
        await sleep(Math.min(1500 * (attempt + 1), 8000));
        continue;
      }

      return `${fallbackBody}\n\n${msgApiFailed(lastStatus)}`;
    }
  }

  return `${fallbackBody}\n\n${msgApiFailed(429)}`;
}

async function requestCompareFeedbackMultimodal(userContentParts, fallbackBody) {
  const maxAttempts = 4;
  let lastStatus = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const text = await requestOpenAiText({
        model: 'gpt-4o-mini',
        input: [{ role: 'user', content: userContentParts }]
      });
      const trimmed = text?.trim();
      if (!trimmed) return `${fallbackBody}\n\n${msgApiFailed()}`;
      return trimmed;
    } catch (err) {
      if (err?.noKey) return `${fallbackBody}\n\n${MSG_NO_KEY}`;

      lastStatus = err?.status || null;
      const retryable = lastStatus === 429 || lastStatus === 503;
      if (retryable && attempt < maxAttempts - 1) {
        const backoff = Math.min(2500 * 2 ** attempt, 20_000);
        await sleep(backoff);
        continue;
      }

      if (attempt < maxAttempts - 1 && !lastStatus) {
        await sleep(Math.min(1500 * (attempt + 1), 8000));
        continue;
      }

      return `${fallbackBody}\n\n${msgApiFailed(lastStatus)}`;
    }
  }

  return `${fallbackBody}\n\n${msgApiFailed(429)}`;
}

function normalizeList(str) {
  return str
    .split(/[,，、]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function userCharacterNameSet(userCharacterSlots, userCharsText) {
  if (Array.isArray(userCharacterSlots) && userCharacterSlots.length) {
    return new Set(userCharacterSlots.map((c) => String(c || '').trim()).filter(Boolean));
  }
  return new Set(normalizeList(userCharsText || ''));
}

/** Q1 빠진 역할 → 정답 이름 없이 듣기·역할 힌트만 */
const MAWANG_Q1_MISSING_HINTS = {
  해설자:
    '이야기를 밖에서 전하는 목소리(상황을 설명해 주는 역할)가 칸에 있는지, 영상을 다시 들으며 확인해 보세요.',
  아버지:
    '아이를 달래거나 안고 가는 어른 인물이 빠지지 않았는지, 대화가 오가는 장면을 다시 들어 보세요.',
  아들:
    '두려워하며 호소하는 아이 인물이 들어갔는지, 높은 목소리로 부르는 구간을 다시 짚어 보세요.',
  마왕:
    '달콤하게 설득하거나 유혹하는 신비한 인물이 빠지지 않았는지, 분위기 다른 구간을 비교해 들어 보세요.'
};

/** Q2 빠진 축 → 정답 키워드·모범 문장 없이 서사 힌트만 */
const MAWANG_Q2_MISSING_HINTS = {
  father:
    '누가 아이를 데리고 가는지(보호하는 어른)가 줄거리에 드러나는지 확인해 보세요.',
  son:
    '두려워하거나 호소하는 아이 인물이 줄거리에 드러나는지 확인해 보세요.',
  erlkonig:
    '아이와 어른 말고, 유혹하거나 말을 거는 또 다른 존재가 이야기에 있는지 생각해 보세요.',
  death:
    '이야기가 어떻게 끝나는지(결말)가 한 문장으로라도 드러나는지 점검해 보세요.'
};

function buildMawangQ1Body(q1, userCharacterSlots = []) {
  const slots = (userCharacterSlots || []).map((c) => String(c || '').trim()).filter(Boolean);
  const nonAttempt = slots.filter((s) => /^(모름|몰라|모르겠|잘\s*모르|글쎄|없음|모름입니다|\.+)$/i.test(s.replace(/\s/g, '')));

  if (q1.isCorrect) {
    return '등장인물 네 역할을 모두 잘 짚었어요. 예술가곡에서는 시의 인물마다 목소리·역할이 나뉘어 이야기의 분위기를 만듭니다.';
  }

  const parts = [];
  if (nonAttempt.length) {
    parts.push(
      `「${nonAttempt[0]}」처럼 비워 둔 칸이 있어요. 영상에서 들리는 네 목소리를 역할로 구분해 칸에 적어 보세요.`
    );
    parts.push(
      '힌트: 이야기를 전하는 목소리 / 달래는 어른 / 호소하는 아이 / 유혹하는 존재처럼, 목소리의 역할부터 먼저 나눠 보세요.'
    );
    parts.push('다시 생각해보세요.');
    return parts.join('\n');
  }

  parts.push('등장인물 칸을 다시 점검해 보세요.');
  if (q1.duplicateRole) {
    parts.push('같은 역할이 두 칸에 겹친 것 같아요. 네 칸에 서로 다른 역할이 하나씩 들어가는지 확인해 보세요.');
  }
  if (q1.unknownSlots.length) {
    parts.push(
      '적기 어려운 이름이 있다면, 영상에서 들리는 목소리의 역할(전하는 말 / 달래는 말 / 호소 / 유혹)로 먼저 구분해 보세요.'
    );
  }
  if (q1.missingRoles.length) {
    q1.missingRoles.forEach((role) => {
      const hint = MAWANG_Q1_MISSING_HINTS[role];
      if (hint) parts.push(hint);
    });
  } else if (!q1.duplicateRole && !q1.unknownSlots.length) {
    parts.push(
      '예: 영상만 들으며 “이야기를 전하는 목소리”와 “서로 대화하는 인물”을 손가락으로 세어 본 뒤 칸을 다시 채워 보세요.'
    );
  }
  parts.push('다시 생각해보세요.');
  return parts.join('\n');
}

function buildMawangQ2Body(q2, userStory) {
  if (q2.isCorrect) {
    return '줄거리에 핵심 흐름이 잘 드러나요. 예술가곡은 시의 처음·중간·끝 흐름이 음악의 긴장과 맞물립니다.';
  }
  if (!(userStory || '').trim()) {
    return '줄거리를 처음(배경)·중간(사건·갈등)·끝(결말) 순서로 한두 문장 이상 써 보세요. 다시 들어보세요.';
  }
  if ((userStory || '').trim().length <= 2) {
    return `입력이 너무 짧아요(현재: "${(userStory || '').trim()}"). 처음·중간·끝 순서로 한두 문장 이상, 영상에서 들은 흐름을 네 말로 적어 보세요. 다시 들어보세요.`;
  }
  const parts = ['줄거리를 조금 더 채워 보세요.'];
  q2.missingGroups.forEach((g) => {
    const hint = MAWANG_Q2_MISSING_HINTS[g.id];
    if (hint) parts.push(hint);
  });
  parts.push(
    '예: “언제·어디서 / 누가 무엇을 하는지 / 마지막에 어떻게 되는지” 세 칸으로 나눠 짧게 써 본 뒤 이어 붙여 보세요.'
  );
  parts.push('다시 들어보세요.');
  return parts.join('\n');
}

function buildMawangOverviewStructuredFeedback(userCharacterSlots, userStory, q1Body, q2Body) {
  const q1 = evaluateMawangOverviewQ1(userCharacterSlots);
  const q2 = evaluateMawangOverviewQ2(userStory);
  return {
    kind: 'overview-sections',
    isCorrect: q1.isCorrect && q2.isCorrect,
    summary: '개요 파악 Q1·Q2를 각각 점검했어요.',
    sections: [
      {
        id: 'q1',
        label: 'Q1 등장인물',
        focus: '역할 구분 · 시의 인물',
        tone: 'pitch',
        status: q1.isCorrect ? 'ok' : 'miss',
        verification: q1.isCorrect ? '검증: ✓' : '검증: ✗',
        body: q1Body || buildMawangQ1Body(q1, userCharacterSlots)
      },
      {
        id: 'q2',
        label: 'Q2 줄거리',
        focus: '처음 · 중간 · 끝',
        tone: 'scale',
        status: q2.isCorrect ? 'ok' : 'miss',
        verification: q2.isCorrect ? '검증: ✓' : '검증: ✗',
        body: q2Body || buildMawangQ2Body(q2, userStory)
      }
    ],
    footer: q1.isCorrect && q2.isCorrect
      ? ''
      : '정답 이름·모범 문장은 알려 주지 않아요. 힌트만 보고 다시 고쳐 보세요.'
  };
}

function parseMawangOverviewAiSections(text) {
  const raw = String(text || '').trim();
  if (!raw) return { q1Body: '', q2Body: '', ok: false };

  const stripVerification = (s) =>
    String(s || '')
      .replace(/^\s*검증\s*[:：]\s*[✓✗✔].*\n?/gm, '')
      .replace(/===Q[12]===/gi, '')
      .trim();

  // split 기반 파싱(정규식 lookahead 오류로 Q2가 Q1에 섞이던 문제 방지)
  const q1Token = raw.search(/===Q1===/i);
  const q2Token = raw.search(/===Q2===/i);
  if (q1Token < 0 || q2Token < 0 || q2Token <= q1Token) {
    return { q1Body: '', q2Body: '', ok: false };
  }

  const q1Body = stripVerification(raw.slice(q1Token + '===Q1==='.length, q2Token));
  const q2Body = stripVerification(raw.slice(q2Token + '===Q2==='.length));
  if (!q1Body || !q2Body || /===Q/i.test(q1Body) || /===Q/i.test(q2Body)) {
    return { q1Body: '', q2Body: '', ok: false };
  }
  return { q1Body, q2Body, ok: true };
}

/**
 * 마왕 개요 파악 Q1·Q2 — Kulhavy & Stock(1989) 검증·정교화 + Shute(2008) 형성적 피드백
 * @returns {Promise<{ kind: 'overview-sections', sections: Array, ... }>}
 */
export async function generateMawangOverviewFeedback({ userCharacterSlots, userStory }) {
  const q1 = evaluateMawangOverviewQ1(userCharacterSlots);
  const q2 = evaluateMawangOverviewQ2(userStory);
  const normalizedStory = (userStory || '').trim();
  const q1Fallback = buildMawangQ1Body(q1, userCharacterSlots);
  const q2Fallback = buildMawangQ2Body(q2, userStory);
  const fallback = buildMawangOverviewStructuredFeedback(
    userCharacterSlots,
    userStory,
    q1Fallback,
    q2Fallback
  );

  // 모름 등 미시도·미인식 칸이 있으면 AI 본문보다 고정 힌트가 더 안전
  const hasNonAttemptOrUnknown = q1.unknownSlots.length > 0
    || (userCharacterSlots || []).some((c) =>
      /^(모름|몰라|모르겠|잘\s*모르|글쎄|없음|\.+)$/i.test(String(c || '').trim().replace(/\s/g, ''))
    );

  if (normalizedStory.length <= 2 || hasNonAttemptOrUnknown) {
    return fallback;
  }

  const userCharsText = (userCharacterSlots || []).filter(Boolean).join(', ');
  const roleHints = Object.entries(MAWANG_Q1_ROLE_ALIASES)
    .map(([canonical, aliases]) => `${canonical}: ${aliases.join('/')}`)
    .join('; ');

  const taskPrompt = `너는 초등·중학생 음악 수업을 돕는 선생님이야. 슈베르트 <마왕> 개요 파악 피드백이다.

출력 형식(반드시 이 두 블록만, 검증 줄·다른 블록 표기 금지):
===Q1===
(Q1 본문만 1~3문장. Q2 내용·===Q2=== 표기를 절대 넣지 말 것)
===Q2===
(Q2 본문만 1~3문장. Q1 내용·===Q1=== 표기를 절대 넣지 말 것)

채점용 내부 참고(학생 출력 금지):
· Q1 허용 동의어: ${roleHints}
· Q1 정오: ${q1.isCorrect ? '맞음' : `틀림(중복=${q1.duplicateRole}, 미인식=${q1.unknownSlots.join('/') || '없음'})`}
· Q2 정오: ${q2.isCorrect ? '맞음' : '틀림'}
· 학생 Q1 해석: ${(userCharacterSlots || []).map((c) => `${c || '—'}→${resolveMawangCharacterRole(c) || '?'}`).join(', ')}

[정답 유출 금지]
· 정답 인물명·동의어(해설자/아버지/아들/마왕 등)를 본문에 쓰지 말 것.
· “빠진 인물은 OOO”, 모범 줄거리 문구 추가 지시 금지.
· 허용: 개념 설명, 듣기/쓰기 힌트, 절차 예시, 관련 개념(등장인물, 줄거리, 처음-중간-끝).
· 학생이 이미 쓴 단어만 짧게 인용 가능.

Q1이 맞으면 등장인물·역할 개념으로 짧게 정교화.
Q1이 틀리면 역할 구분 듣기 힌트만(이름 금지). 끝은 "다시 생각해보세요."
Q2가 맞으면 줄거리·분위기 개념으로 짧게 정교화.
Q2가 틀리면 처음-중간-끝 점검 힌트만. 끝은 "다시 들어보세요."

학생 Q1: ${userCharsText || '(없음)'}
학생 Q2: ${normalizedStory || '(없음)'}`;

  const aiText = await requestCompareFeedback(
    wrapFormativePrompt(taskPrompt),
    `===Q1===\n${q1Fallback}\n===Q2===\n${q2Fallback}`
  );
  const parsed = parseMawangOverviewAiSections(aiText);
  const pickBody = (aiBody, isCorrect, fallbackBody) => {
    const body = String(aiBody || '').trim();
    if (!body || !parsed.ok) return fallbackBody;
    if (/===Q/i.test(body)) return fallbackBody;
    if (isCorrect && /빠졌|부족|다시 생각|검증\s*[:：]\s*✗/.test(body)) return fallbackBody;
    if (!isCorrect && /(해설자|아버지|아들|마왕|내레이션|폭풍우 치는 밤)/.test(body)) {
      return fallbackBody;
    }
    return body;
  };
  return buildMawangOverviewStructuredFeedback(
    userCharacterSlots,
    userStory,
    pickBody(parsed.q1Body, q1.isCorrect, q1Fallback),
    pickBody(parsed.q2Body, q2.isCorrect, q2Fallback)
  );
}

const OVERVIEW_OPEN_AI_META = {
  'handel:q1': {
    workTitle: "헨델 <할렐루야>",
    questionTitle: '가사는 어떤 내용인가요?',
    listenHint: '가사에서 누구를 기리는지, 후렴이 어떤 내용을 전하는지',
    forbiddenWhenWrong: ['요한계시록', '성경']
  },
  'handel:q2': {
    workTitle: "헨델 <할렐루야>",
    questionTitle: '오페라와 어떤 차이가 있나요?',
    listenHint: '무대에서 배우가 의상·연기를 하는지, 합창과 연주만으로 내용을 전하는지',
    forbiddenWhenWrong: ['의상·연기 없음', '교회·콘서트홀']
  },
  'haydn:q2': {
    workTitle: "하이든 '종달새'",
    questionTitle: '어떤 동물을 떠올리게 하나요? 이유는 무엇인가요?',
    listenHint: '제1바이올린의 높고 가벼운 선율이 어떤 동물 소리처럼 들리는지',
    forbiddenWhenWrong: ['종달새']
  },
  'vivaldi:q1': {
    workTitle: '비발디 <사계> 여름 3악장',
    questionTitle: '소네트가 묘사하는 내용은 무엇인가요?',
    listenHint: '왼쪽 감상 가이드의 소네트를 다시 읽고, 날씨·장면이 어떻게 그려지는지',
    forbiddenWhenWrong: ['폭풍우', '우박']
  },
  'chopin:q2': {
    workTitle: '쇼팽 <환상 즉흥곡>',
    questionTitle: '전체 분위기와 느낌이 바뀌는 부분',
    listenHint: '앞부분과 중간부의 빠르기·세기·분위기가 같은지 다른지',
    forbiddenWhenWrong: ['격렬한 A', '서정적인 B']
  },
  'schoenberg:q2': {
    workTitle: '쇤베르크 <달에 홀린 피에로>',
    questionTitle: '전체적인 분위기는 어떤가요?',
    listenHint: '달빛 속 장면이 편안한지 긴장되는지, 느낌을 형용사로 적어 보았는지',
    forbiddenWhenWrong: ['표현주의', '몽환적이며 신비로운']
  }
};

function isOverviewOpenNonAttempt(text) {
  const t = String(text || '').trim();
  if (t.length <= 2) return true;
  return /^(모름|몰라|모르겠|잘\s*모르|글쎄|없음|\.+)$/i.test(t.replace(/\s/g, ''));
}

function overviewAiVerificationMatches(text, isCorrect) {
  const raw = String(text || '').trim();
  const hasOk = /검증\s*[:：]\s*✓/.test(raw);
  const hasNg = /검증\s*[:：]\s*✗/.test(raw);
  if (!hasOk && !hasNg) return false;
  return isCorrect ? hasOk && !hasNg : hasNg && !hasOk;
}

function overviewAiLeakedAnswer(aiText, studentText, forbiddenWhenWrong) {
  return (forbiddenWhenWrong || []).some((token) => {
    if (!token) return false;
    return includesAnyToken(aiText, [token]) && !includesAnyToken(studentText, [token]);
  });
}

/**
 * 개요 파악 서술형 — 학생 문장에 맞춘 형성적 AI 피드백
 * 실패·정답 유출 시 fallbackText(고정 힌트)를 반환한다.
 */
export async function generateOverviewOpenTextFeedback({ song, question, data, fallbackText }) {
  const meta = OVERVIEW_OPEN_AI_META[`${song}:${question}`];
  const fallback = String(fallbackText || '').trim()
    || '답을 조금 더 쓴 뒤 다시 눌러 주세요.';
  if (!meta) return fallback;

  const studentText = question === 'q1'
    ? getOverviewStudentQ1(song, data)
    : getOverviewStudentQ2(song, data);
  const trimmed = String(studentText || '').trim();
  if (isOverviewOpenNonAttempt(trimmed)) return fallback;

  const grouped = evaluateOverviewQuestion(song, question, data);
  const isCorrect = grouped ? grouped.isCorrect : (question === 'q1' ? gradeOverviewQ1(song, data) : gradeOverviewQ2(song, data)) === true;
  const missingHints = (grouped?.missingGroups || []).map((group) => group.hint).filter(Boolean);
  const forbidden = [
    ...(meta.forbiddenWhenWrong || []),
    ...((grouped?.missingGroups || []).flatMap((group) => group.keywords || []))
  ];

  const missingBlock = missingHints.length
    ? `빠진 내용 축(정답 단어·키워드는 쓰지 말 것. 아래 방향으로만 유도):\n${missingHints.map((hint) => `· ${hint}`).join('\n')}`
    : '빠진 축 없음.';

  const taskPrompt = `너는 초등·중학생 음악 수업을 돕는 선생님이야. ${meta.workTitle} 개요 파악 — 「${meta.questionTitle}」에 대한 형성적 피드백이다.

바로 위에 붙은 공통 블록 [피드백 설계 원칙]을 따른다. 다만 이 과제는 학생이 문장으로 쓴 답이므로, 학생 표현을 「」로 한 번 짧게 인용해도 된다.

학생 응답:
${trimmed}

내부 판정(학생 출력 금지): ${isCorrect ? '맞음 → 검증 ✓' : '틀림 → 검증 ✗'}
충족한 축: ${grouped ? `${grouped.matchedGroups.length}/${grouped.matchedGroups.length + grouped.missingGroups.length}` : '(해당 없음)'}
${missingBlock}
다시 들을 초점(정답 문장이 아님): ${meta.listenHint}

[정답 유출 금지]
· 오답일 때 다음을 본문에 쓰지 말 것: ${forbidden.join(', ') || '(해당 없음)'}
· "정답은 ○○", 모범 문장 통째 복사, "이렇게 써야 한다" 금지.
· 학생이 이미 쓴 단어만 인용 가능.

규칙:
· 첫 줄: 검증: ✓ 또는 검증: ✗ — 내부 판정과 일치.
· 검증 ✓: 학생 표현을 짧게 받은 뒤 관련 음악 개념으로 2~3문장 정교화.
· 검증 ✗: 학생 문장에서 부족한 축만 듣기·쓰기 힌트. 검증 다음 1~3문장. 마지막은 "다시 들어보세요." 또는 "다시 생각해보세요."`;

  const aiText = await requestCompareFeedback(wrapFormativePrompt(taskPrompt), fallback);
  const trimmedAi = String(aiText || '').trim();
  if (!trimmedAi) return fallback;
  if (!overviewAiVerificationMatches(trimmedAi, isCorrect)) return fallback;
  if (!isCorrect && overviewAiLeakedAnswer(trimmedAi, trimmed, forbidden)) return fallback;
  return trimmedAi;
}

function buildAnalyticalFallbackBody(userCharacterSlots, userCharsText, correctChars, userStory, q2Label = '줄거리 요약') {
  const userSet = userCharacterNameSet(userCharacterSlots, userCharsText);
  const correctSet = new Set(correctChars);
  const hits = [...correctSet].filter((c) => userSet.has(c)).length;
  const q1 =
    hits === correctSet.size
      ? '등장인물 네 명을 모두 잘 짚었어요.'
      : `모범에는 해설자·아버지·아들·마왕 네 명이 있어요. 지금 ${hits}명 정도가 겹쳐 보이니, 빠진 인물이 있는지 다시 확인보면 좋아요.`;
  const storyLen = (userStory || '').trim().length;
  const q2 = q2Label.includes('동물')
    ? (storyLen < 15
      ? '동물 이름과 이유를 함께 써보면 좋아요. 특히 "바이올린 가락이 종달새 울음을 연상시킨다"는 근거를 한 문장으로 적어보세요.'
      : '동물 이름만 맞는지보다, 이유에 "바이올린 가락(선율) → 종달새 울음 연상" 연결이 보이는지 점검해보세요.')
    : (storyLen < 30
      ? '줄거리는 폭풍 밤, 아버지와 아들, 마왕의 유혹, 그리고 안타까운 결말이 드러나도록 조금만 더 구체적으로 써보면 좋아요.'
      : '핵심 사건(밤·달림·마왕·결말)이 들어갔는지 스스로 체크해보고, 모범 해설과 비교해 문장만 다르고 내용은 같은지 살펴보세요.');
  return `${q1}\n\n${q2}`;
}

function buildAnalyticalShortInputFeedback(userStory, q2Label = '줄거리 요약') {
  const raw = (userStory || '').trim();
  if (q2Label.includes('동물')) {
    return `Q2 입력이 너무 짧아서(현재: "${raw || '(없음)'}") 동물+이유 비교 피드백을 정확히 만들기 어려워요.

동물 이름 1개와 이유 1문장을 함께 써보세요. 예: "바이올린 가락이 종달새 울음을 연상시킨다."`;
  }
  return `Q2 입력이 너무 짧아서(현재: "${raw || '(없음)'}") 줄거리 비교 피드백을 정확히 만들기 어려워요.

최소 1~2문장으로 핵심 사건(폭풍우 치는 밤, 아버지와 아들, 마왕의 유혹, 결말)을 넣어 다시 써보면 실제 입력에 맞춘 피드백을 줄 수 있어요.`;
}

export async function generateAnalyticalCompareFeedback({
  userCharacterSlots,
  userCharactersText,
  correctCharacters,
  userStory,
  correctStory,
  q2Label = '줄거리 요약',
  q2PromptGuide = '학생이 쓴 줄거리 요약이 모범 줄거리와 어떻게 맞는지 비교한다.'
}) {
  const fallbackBody = buildAnalyticalFallbackBody(
    userCharacterSlots,
    userCharactersText,
    correctCharacters,
    userStory,
    q2Label
  );
  const normalizedStory = (userStory || '').trim();
  // 한두 글자 입력("s" 등)일 때는 모델 추정을 막기 위해 즉시 사실 기반 안내를 반환합니다.
  if (normalizedStory.length <= 2) {
    return `${fallbackBody}\n\n${buildAnalyticalShortInputFeedback(normalizedStory, q2Label)}`;
  }
  const userSet = userCharacterNameSet(userCharacterSlots, userCharactersText);
  const correctSet = new Set(correctCharacters);
  const q1AllCorrect = [...correctSet].every((c) => userSet.has(c));

  const taskPrompt = `너는 음악 수업을 돕는 선생님이야. 초등·중학생 눈높이 한국어.

과제: 개요 파악 Q1(등장인물·요소 목록)과 Q2(${q2Label})를 모범과 비교해 형성적 피드백을 쓴다.
Q2 비교 초점: ${q2PromptGuide}

내부 참고(학생에게 그대로 밝히지 말 것): Q1 모범 목록과의 일치 여부 = ${q1AllCorrect ? '모든 항목 포함' : '누락 또는 불일치 있음'}.

규칙:
· 첫 줄은 반드시 검증: ✓ 또는 검증: ✗ 한 가지만. Q1·Q2를 종합해 과제 전체가 기준에 충분히 도달했으면 ✓, 아니면 ✗.
· 검증 ✓: Q1·Q2 각각에 대해 음악·서사 요소명을 들어 정교화(총 2~3문장). 모범 문장 복사 금지.
· 검증 ✗: 정답 인물명·정답 줄거리 문구를 쓰지 말 것. 빠진 요소나 줄거리의 어느 부분을 다시 짚을지 힌트만. 마지막은 "다시 들어보세요." 또는 "다시 생각해보세요."
· 학생이 쓴 단어를 짧게 인용해도 좋다. 추측 과장 금지.

학생 Q1: ${userCharactersText || '(없음)'}
모범 Q1: ${correctCharacters.join(', ')}

학생 Q2 (${q2Label}): ${(userStory || '').trim() || '(없음)'}
모범 Q2: ${correctStory}`;

  return requestCompareFeedback(wrapFormativePrompt(taskPrompt), fallbackBody);
}

function buildVoiceFallback(selectedChars, voiceDesign, answerKey) {
  const keys = VOICE_DESIGN_FIELD_KEYS;
  let total = 0;
  let match = 0;
  selectedChars.forEach((name) => {
    keys.forEach((k) => {
      total += 1;
      if (voiceDesign[name]?.[k] === answerKey[name]?.[k]) match += 1;
    });
  });
  return `선택한 인물 기준으로 ${total}칸 중 ${match}칸이 모범과 같아요. 다른 칸은 시의 분위기와 인물 성격을 떠올리며 다시 들어보면 좋아요.`;
}

export async function generateVoiceDesignCompareFeedback(selectedChars, voiceDesign, answerKey) {
  const fallback = buildVoiceFallback(selectedChars, voiceDesign, answerKey);
  const rows = selectedChars.flatMap((name) =>
    VOICE_DESIGN_FIELD_KEYS.map((key) => ({
      인물: name,
      요소: key,
      학생: voiceDesign[name]?.[key] || '—',
      모범: answerKey[name]?.[key] ?? '—'
    }))
  );
  const allMatch = rows.length > 0 && rows.every((r) => r.학생 !== '—' && r.학생 === r.모범);
  const who = selectedChars.length > 1 ? '선택한 인물들' : `「${selectedChars[0] || ''}」`;

  const taskPrompt = `너는 음악 수업 선생님이야. 아래 표는 학생이 고른 인물의 선율·음계·음색 설계와 모범안이다. (대상: ${who})

내부 참고: 세 칸 모두 학생 값이 모범과 같으면 ${allMatch ? 'true (검증 ✓)' : 'false (검증은 불일치 시 ✗)'}.

규칙:
· 첫 줄: 검증: ✓ (세 요소 모두 모범과 일치) 또는 검증: ✗ (하나라도 다름 또는 미선택).
· 검증 ✓: 선율·음계·음색 중 무엇이 어떤 음악적 역할과 맞닿는지 2~3문장으로 정교화. 개인 칭찬 문장 금지.
· 검증 ✗: 모범 칸의 정확한 단어(예: "낮고 부드러운 선율", "단조")를 쓰지 말 것. 어느 요소를 어떤 소리 특징으로 다시 들을지 힌트만. 마지막은 "다시 들어보세요." 또는 "다시 생각해보세요."

데이터(JSON): ${JSON.stringify(rows)}`;

  return finalizeObjectiveChoiceAiFeedback(
    await requestCompareFeedback(wrapFormativePrompt(taskPrompt), fallback),
    allMatch
  );
}

const PIANO_FALLBACK_BODY =
  '오른손 선은 빠르게 오르내리는 느낌(말발굽·긴장), 왼손 선은 느리고 묵직하게 반복되는 느낌(심장·압박)이 드러나는지 그림과 모범 악보를 나란히 보며 확인해보세요.';

export async function generatePianoCompareFeedback() {
  const taskPrompt = `슈베르트 가곡 <마왕> 피아노 반주 학습 맥락이다. 학생이 캔버스에 오른손·왼손 가락선을 그리고 모범 악보와 비교한다.

참고 음악 개념:
· 오른손: 빠르고 불규칙하게 오르내리는 셋잇단 느낌 → 질주·긴장감과 연결되는 리듬꼴·음역 특징.
· 왼손: 느리고 강하게 반복되는 베이스 → 낮은 음역의 반복 동기.

규칙:
· 첫 줄은 반드시 "검증: ✓" 또는 "검증: ✗" — 학생 그림이 위 두 손의 핵심(리듬꼴·음역 대비)을 시각화했는지 네가 추정해 판정한다. 애매하면 ✗.
· 이어서 2문장 이내로, 음악 요소명(리듬꼴, 음역, 반주)을 넣어 정교화한다. 개인 칭찬 금지.
· 모범 악보 문구를 베끼지 말 것.`;

  return requestCompareFeedback(wrapFormativePrompt(taskPrompt), PIANO_FALLBACK_BODY);
}

function buildTonePaintingFallback({ segmentTitle, selectedIndex }) {
  if (selectedIndex === null || selectedIndex === undefined) {
    return `${segmentTitle}에서 먼저 보기 중 하나를 선택한 뒤 AI 피드백을 받아보세요.`;
  }
  return `${segmentTitle}에서 다시 들어볼 포인트를 줄게요. 가사의 핵심 단어가 나올 때 음높이/반복/선율 흐름이 어떻게 바뀌는지 체크하고, 네 선택 이유를 한 문장으로 써보세요.`;
}

export async function generateTonePaintingCompareFeedback({
  segmentTitle,
  lyric,
  question,
  options,
  selectedIndex,
  correctIndex
}) {
  const fallback = buildTonePaintingFallback({
    segmentTitle,
    selectedIndex
  });
  if (selectedIndex === null || selectedIndex === undefined) {
    return fallback;
  }

  const studentAnswer = options[selectedIndex] || '선택 없음';
  const isCorrect =
    typeof correctIndex === 'number' &&
    correctIndex >= 0 &&
    selectedIndex === correctIndex;

  const taskPrompt = `너는 초등·중학생 음악 감상 수업을 돕는 선생님이야. 할렐루야 음화법(Tone Painting) 활동의 한 구간이다.

내부 참고(학생에게 정답 문구를 쓰지 말 것): 객관적 정오 = ${isCorrect ? '일치' : '불일치'}.

구간: ${segmentTitle}
가사: ${lyric}
질문: ${question}
학생이 고른 보기(참고): ${studentAnswer}

규칙:
· 첫 줄: 내부 참고에 따라 검증: ✓ 또는 검증: ✗.
· 검증 ✓: 음화법·선율·음역·리듬꼴·반복 등 요소명을 넣어 왜 이 선택이 가사와 연결되는지 2~3문장. 보기 문장을 그대로 베끼지 말 것. 개인 칭찬 금지.
· 검증 ✗: 다른 보기 문구·정답 내용을 절대 쓰지 말 것. 가사의 어느 음악적 특징(음 높낮이, 반복, 선율 길이 등)에 귀를 기울일지 힌트 1문장. 마지막은 "다시 들어보세요." 또는 "다시 생각해보세요."`;

  return finalizeObjectiveChoiceAiFeedback(
    await requestCompareFeedback(wrapFormativePrompt(taskPrompt), fallback),
    isCorrect
  );
}

const MELODY_HANDEL_FALLBACK = {
  harmony:
    '화성음악에서는 모양이 똑같은지보다 네 성부가 위아래로 함께 움직이는지(동시 진행)를 확인하면 충분해요. 시작·중간·끝에서 선들이 같은 방향으로 움직이는지만 체크해보세요.',
  poly:
    '다성음악에서는 모양 일치보다 베이스부터 소프라노까지 성부가 번갈아 움직이는지(교대 진행)를 확인하면 충분해요. 어느 성부가 먼저 시작하고 다음 성부가 어떻게 이어지는지 순서를 체크해보세요.'
};

function roughStrokeMetrics(dataUrl) {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('no document'));
      return;
    }
    const img = new Image();
    img.onload = () => {
      const w = 120;
      const h = Math.max(1, Math.round((img.height * w) / img.width));
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      if (!ctx) {
        reject(new Error('no canvas'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const d = ctx.getImageData(0, 0, w, h).data;
      let dark = 0;
      for (let i = 0; i < d.length; i += 4) {
        const brightness = (d[i] + d[i + 1] + d[i + 2]) / 3;
        if (brightness < 248) dark += 1;
      }
      resolve({ darkRatio: dark / (w * h) });
    };
    img.onerror = () => reject(new Error('image load'));
    img.src = dataUrl;
  });
}

function shrinkDataUrlForApi(dataUrl, maxW) {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('no document'));
      return;
    }
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, maxW / img.width);
      const w = Math.max(1, Math.round(img.width * ratio));
      const h = Math.max(1, Math.round(img.height * ratio));
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx = c.getContext('2d');
      if (!ctx) {
        reject(new Error('no canvas'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL('image/jpeg', 0.88));
    };
    img.onerror = () => reject(new Error('shrink load'));
    img.src = dataUrl;
  });
}

async function fetchImageAsDataUrl(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error('model fetch');
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(new Error('read'));
    fr.readAsDataURL(blob);
  });
}

/**
 * 할렐루야 가락선(화성/다성) 활동: 학생 캔버스 저장본과 모범 이미지를 비교해 맞춤 피드백.
 * @param {'harmony'|'poly'} section
 * @param {string} userDrawingDataUrl canvas.toDataURL()
 */
export async function generateMelodyCanvasHandelFeedback(section, userDrawingDataUrl) {
  const fallback = section === 'harmony' ? MELODY_HANDEL_FALLBACK.harmony : MELODY_HANDEL_FALLBACK.poly;
  if (typeof userDrawingDataUrl !== 'string' || !userDrawingDataUrl.startsWith('data:')) {
    return `${fallback}\n\n먼저 캔버스에 그린 뒤 저장 버튼을 눌러주세요.`;
  }

  let metrics;
  try {
    metrics = await roughStrokeMetrics(userDrawingDataUrl);
  } catch {
    metrics = { darkRatio: 0.05 };
  }
  if (metrics.darkRatio < 0.006) {
    return `${fallback}\n\n지금 그림에는 가락선이 거의 보이지 않아요. 펜으로 선을 조금 더 그려 저장한 뒤 다시 눌러보세요.`;
  }

  const modelPath =
    section === 'harmony' ? '/assets/handel-model-hallelujah.png' : '/assets/handel-model-lord-reign.png';
  let modelDataUrl;
  try {
    modelDataUrl = await fetchImageAsDataUrl(modelPath);
  } catch {
    return `${fallback}\n\n모범 가락선 이미지를 불러오지 못했어요. 새로고침 후 다시 시도해 보세요.`;
  }

  let userSmall;
  let modelSmall;
  try {
    [userSmall, modelSmall] = await Promise.all([
      shrinkDataUrlForApi(userDrawingDataUrl, 720),
      shrinkDataUrlForApi(modelDataUrl, 720)
    ]);
  } catch {
    return `${fallback}\n\n이미지를 줄이는 중 문제가 생겼어요. 다시 저장한 뒤 시도해 보세요.`;
  }

  const contextLabel =
    section === 'harmony'
      ? '구간: 할렐루야 합창 전체(화성음악). 핵심은 네 성부의 동시 진행(함께 상하 이동) 인식이다.'
      : '구간: 또 주가 길이 다스리시리(다성음악). 핵심은 베이스→테너→알토→소프라노의 교대 진행 인식이다.';

  const taskPrompt = `너는 초등·중학생 음악 수업을 돕는 선생님이야.
${contextLabel}

아래에 순서대로 두 이미지가 첨부된다.
· 첫 번째: 학생이 캔버스에 그린 가락선.
· 두 번째: 수업용 모범 가락선.

규칙:
· 첫 줄: 학생 그림이 해당 음악 개념(화성=동시 진행 / 다성=교대 진행)을 드러내는지 추정해 검증: ✓ 또는 검증: ✗. 애매하면 ✗.
· 검증 ✓: 성부·동시 진행 또는 교대 진행 등 용어로 2~3문장 정교화. 선 그림 평가·미술 칭찬 금지.
· 검증 ✗: 모범 그림과 똑같이 그리라고 하지 말 것. 다시 볼 음악 개념 포인트만. 마지막은 "다시 들어보세요." 또는 "다시 생각해보세요."
· 한국어, 검증 줄 포함 짧게.

참고(내부용, 학생에게 말하지 말 것): 학생 그림 선 픽셀 비율 대략 ${(metrics.darkRatio * 100).toFixed(1)}%.`;

  const content = [
    { type: 'input_text', text: wrapFormativePrompt(taskPrompt) },
    { type: 'input_image', image_url: userSmall, detail: 'low' },
    { type: 'input_image', image_url: modelSmall, detail: 'low' }
  ];

  return requestCompareFeedbackMultimodal(content, fallback);
}

const HY_THEME_MATCH_OPT_LABELS = {
  o1: '음이 크게 도약한다',
  o2: '음이 순차적으로 이어진다',
  o3: '리듬이 짧게 끊어진다',
  o4: '리듬이 길게 이어진다',
  o5: '밝고 활기차다',
  o6: '부드럽고 서정적이다'
};

function hyThemeMatchColumnOk(placedIds, correctSet, wrongSet) {
  if (!Array.isArray(placedIds) || placedIds.length === 0) return false;
  const hasCorrect = placedIds.some((id) => correctSet.has(id));
  const hasWrong = placedIds.some((id) => wrongSet.has(id));
  return hasCorrect && !hasWrong;
}

function buildHyThemeMatchFallback({ theme1Ids, theme2Ids }) {
  const t1 = theme1Ids || [];
  const t2 = theme2Ids || [];
  const t1WrongIds = t1.filter((id) => ['o2', 'o4', 'o6'].includes(id));
  const t2WrongIds = t2.filter((id) => ['o1', 'o3', 'o5'].includes(id));
  const parts = [];
  const used = new Set();

  if (t1WrongIds.includes('o2') && t2WrongIds.includes('o1')) {
    parts.push('제1주제 칸에 「음이 순차적으로 이어진다」, 제2주제 칸에 「음이 크게 도약한다」를 넣었어요. 두 클립을 번갈아 들으며, 어느 쪽이 음이 멀리 뛰고 어느 쪽이 옆 음으로 이어지는지 선율의 움직임만 비교해 보세요.');
    used.add('o2');
    used.add('o1');
  }
  if (t1WrongIds.includes('o4') && t2WrongIds.includes('o3')) {
    parts.push('제1주제 칸에 「리듬이 길게 이어진다」, 제2주제 칸에 「리듬이 짧게 끊어진다」를 넣었어요. 두 클립을 번갈아 들으며, 어느 쪽 리듬이 짧게 톡톡이고 어느 쪽이 길게 흐르는지 리듬꼴만 비교해 보세요.');
    used.add('o4');
    used.add('o3');
  }
  if (t1WrongIds.includes('o6') && t2WrongIds.includes('o5')) {
    parts.push('제1주제 칸에 「부드럽고 서정적이다」, 제2주제 칸에 「밝고 활기차다」를 넣었어요. 두 클립을 번갈아 들으며, 어느 쪽이 가볍고 또렷하고 어느 쪽이 잔잔한지 분위기만 비교해 보세요.');
    used.add('o6');
    used.add('o5');
  }

  t1WrongIds.forEach((id) => {
    if (used.has(id)) return;
    const label = HY_THEME_MATCH_OPT_LABELS[id];
    if (id === 'o2') {
      parts.push(`제1주제 칸에 「${label}」를 넣었어요. 순차 진행은 음이 옆 칸으로 살살 걸어가듯 들릴 때 잘 맞아요. 제1주제 클립만 다시 들으며, 음과 음 사이가 가까운지 멀리 뛰어오르는지 선율의 움직임만 비교해 보세요.`);
    } else if (id === 'o4') {
      parts.push(`제1주제 칸에 「${label}」를 넣었어요. 긴 리듬은 음이 늘어지며 흐를 때 잘 맞아요. 제1주제 클립만 다시 들으며, 리듬이 길게 흐르는지 짧게 톡톡 끊어지는지 리듬꼴만 비교해 보세요.`);
    } else if (id === 'o6') {
      parts.push(`제1주제 칸에 「${label}」를 넣었어요. 서정적인 느낌은 노래하듯 잔잔할 때 잘 맞아요. 제1주제 클립만 다시 들으며, 느낌이 잔잔한지 가볍고 또렷한지 분위기만 비교해 보세요.`);
    }
  });
  t2WrongIds.forEach((id) => {
    if (used.has(id)) return;
    const label = HY_THEME_MATCH_OPT_LABELS[id];
    if (id === 'o1') {
      parts.push(`제2주제 칸에 「${label}」를 넣었어요. 도약은 음이 멀리 뛰어오를 때 잘 맞아요. 제2주제 클립만 다시 들으며, 음과 음 사이가 멀리 뛰는지 옆 음으로 이어지는지 선율의 움직임만 비교해 보세요.`);
    } else if (id === 'o3') {
      parts.push(`제2주제 칸에 「${label}」를 넣었어요. 짧은 리듬은 톡톡 끊어질 때 잘 맞아요. 제2주제 클립만 다시 들으며, 리듬이 짧게 끊기는지 길게 흐르는지 리듬꼴만 비교해 보세요.`);
    } else if (id === 'o5') {
      parts.push(`제2주제 칸에 「${label}」를 넣었어요. 활기찬 느낌은 가볍고 또렷할 때 잘 맞아요. 제2주제 클립만 다시 들으며, 느낌이 또렷한지 잔잔한지 분위기만 비교해 보세요.`);
    }
  });

  if (!parts.length) {
    return '두 주제를 번갈아 들으며 선율의 움직임·리듬꼴·느낌이 같은 칸에 모였는지 점검해 보세요. 다시 들어보세요.';
  }
  return `${parts.slice(0, 2).join('\n')}\n다시 들어보세요.`;
}

/**
 * 하이든 '종달새' 주제 비교 — 보기 카드 매칭(두 주제 특징) 형성적 피드백
 */
export async function generateHyThemeMatchFeedback({ theme1Ids, theme2Ids }) {
  const fallback = buildHyThemeMatchFallback({ theme1Ids, theme2Ids });
  const t1Correct = new Set(['o1', 'o3', 'o5']);
  const t1Wrong = new Set(['o2', 'o4', 'o6']);
  const t2Correct = new Set(['o2', 'o4', 'o6']);
  const t2Wrong = new Set(['o1', 'o3', 'o5']);
  const col1Ok = hyThemeMatchColumnOk(theme1Ids, t1Correct, t1Wrong);
  const col2Ok = hyThemeMatchColumnOk(theme2Ids, t2Correct, t2Wrong);
  const bothOk = col1Ok && col2Ok;

  const list1 = (theme1Ids || []).map((id) => HY_THEME_MATCH_OPT_LABELS[id] || id).join(' / ') || '(없음)';
  const list2 = (theme2Ids || []).map((id) => HY_THEME_MATCH_OPT_LABELS[id] || id).join(' / ') || '(없음)';

  const taskPrompt = `너는 초등·중학생 음악 수업을 돕는 선생님이야. 하이든 '종달새' 주제 비교 — 두 주제의 특징 보기 카드 매칭에 대한 형성적 피드백이다.

바로 위에 붙은 공통 블록 [피드백 설계 원칙](Kulhavy & Stock 1989의 검증·정교화, Shute 2008의 형성적 피드백)을 **반드시** 따른다. (검증 줄 → 정교화, 과제·음악 요소 중심, 개인 칭찬 중심 금지, 음악 요소명 구체 언급, 길이·쉬운 말 규칙 등)

학생 배치(참고):
· 제1주제 칸에 넣은 보기: ${list1}
· 제2주제 칸에 넣은 보기: ${list2}

내부 판정용(학생에게 출력·암시 금지): 과제 기준 충족 = ${bothOk ? '일치' : '불일치'}.

[이 과제만의 추가 제한 — 공통 원칙과 겹치면 아래를 우선해 답안 유출을 막는다]
· 정교화에서 **화면의 보기 여섯 문장**을 인용·복붙·한두 단어만 바꾼 요약으로 쓰지 말 것. (학생이 칸에 넣은 문구도 본문에서 반복하지 말 것.)
· "어느 보기가 어느 주제" "이 칸에는 ~가 와야" 식의 정답·조합 암시 금지.
· 두 클립의 음악적 차이를 **보기 카드와 같은 말로** 한 번에 짝지어 설명하지 말 것. (한 클립은 A특징·다른 클립은 B특징처럼 정답 쌍을 드러내는 식의 대비 서술 금지.)
· Kulhavy의 정교화와 Shute ②를 지키려면, **선율·리듬꼴·느낌의 대비(악상)** 같은 **음악 요소 이름**으로만 짚을 것. "어디에 귀를 둘지" "칸과 듣기를 어떻게 맞출지" 같은 **듣기·과제 행동**을 정교화에 담을 것.

규칙(공통 블록의 문장 수·마침 규칙을 그대로 적용):
· 첫 줄: 검증: ✓ 또는 검증: ✗ — 내부 판정과 일치.
· 검증 ✓: 검증 줄 포함 총 2~3문장. 음악 요소명을 넣어 정교화하되, 위 [추가 제한]을 지킬 것. 마지막 문장은 공통 블록의 정답일 때 관례에 맞게 짧게 마무리(필요 시 "다음 단계로 넘어가 보세요." 정도만, 과제 맥락 유지).
· 검증 ✗: 검증 다음 본문 1~2문장. 음악 요소명으로 다시 들을 **초점**만 제시하고, 위 [추가 제한]을 지킬 것. 마지막 문장은 반드시 "다시 들어보세요." 또는 "다시 생각해보세요."`;

  return requestCompareFeedback(wrapFormativePrompt(taskPrompt), fallback);
}

function sbAtonalColumnOk(placedCards, correctSet, wrongSet) {
  if (!Array.isArray(placedCards) || placedCards.length === 0) return false;
  const hasCorrect = placedCards.some((card) => correctSet.has(card));
  const hasWrong = placedCards.some((card) => wrongSet.has(card));
  return hasCorrect && !hasWrong;
}

function buildSbAtonalMatchFallback({ tonalCards, atonalCards }) {
  const tonal = tonalCards || [];
  const atonal = atonalCards || [];
  const tonalWrong = tonal.filter((card) => ['조성이 없다', '낯설고 긴장감', '음들이 따로 논다.'].includes(card));
  const atonalWrong = atonal.filter((card) => ['조성이 있다', '편안하고 안정적', '음들이 서로 잘 어울린다.'].includes(card));
  const parts = [];

  tonalWrong.forEach((card) => {
    if (card === '조성이 없다') {
      parts.push('송어 칸의 「조성이 없다」를 다시 들어 보세요. 송어의 음들이 중심음 없이 떠다니는지, 편안하게 한곳으로 모이는지 조성감만 비교해 보세요.');
    } else if (card === '낯설고 긴장감') {
      parts.push('송어 칸의 「낯설고 긴장감」을 다시 들어 보세요. 송어가 낯설고 긴장되는지, 편안하고 안정적인지 분위기만 비교해 보세요.');
    } else if (card === '음들이 따로 논다.') {
      parts.push('송어 칸의 「음들이 따로 논다.」를 다시 들어 보세요. 송어의 음들이 서로 겉도는지, 잘 어울려 붙는지 화음의 느낌을 비교해 보세요.');
    }
  });
  atonalWrong.forEach((card) => {
    if (card === '조성이 있다') {
      parts.push('피에로 칸의 「조성이 있다」를 다시 들어 보세요. 피에로의 음들이 편안하게 한곳으로 모이는지, 중심음 없이 떠다니는지 조성감만 비교해 보세요.');
    } else if (card === '편안하고 안정적') {
      parts.push('피에로 칸의 「편안하고 안정적」을 다시 들어 보세요. 피에로가 편안하고 안정적인지, 낯설고 긴장되는지 분위기만 비교해 보세요.');
    } else if (card === '음들이 서로 잘 어울린다.') {
      parts.push('피에로 칸의 「음들이 서로 잘 어울린다.」를 다시 들어 보세요. 피에로의 음들이 잘 어울려 붙는지, 서로 겉도는지 화음의 느낌을 비교해 보세요.');
    }
  });

  if (!parts.length) {
    return '두 곡을 번갈아 들으며 안정감·긴장감, 음의 어울림이 같은 칸에 모였는지 점검해 보세요. 다시 들어보세요.';
  }
  return `${parts.slice(0, 2).join('\n')}\n다시 들어보세요.`;
}

/**
 * 쇤베르크 — 조성 vs 무조성 카드 매칭 형성적 피드백
 */
export async function generateSbAtonalMatchFeedback({ tonalCards, atonalCards }) {
  const fallback = buildSbAtonalMatchFallback({ tonalCards, atonalCards });
  const tonalCorrect = new Set(['조성이 있다', '편안하고 안정적', '음들이 서로 잘 어울린다.']);
  const tonalWrong = new Set(['조성이 없다', '낯설고 긴장감', '음들이 따로 논다.']);
  const atonalCorrect = new Set(['조성이 없다', '낯설고 긴장감', '음들이 따로 논다.']);
  const atonalWrong = new Set(['조성이 있다', '편안하고 안정적', '음들이 서로 잘 어울린다.']);
  const colTonalOk = sbAtonalColumnOk(tonalCards, tonalCorrect, tonalWrong);
  const colAtonalOk = sbAtonalColumnOk(atonalCards, atonalCorrect, atonalWrong);
  const bothOk = colTonalOk && colAtonalOk;

  const listTonal = (tonalCards || []).join(' / ') || '(없음)';
  const listAtonal = (atonalCards || []).join(' / ') || '(없음)';

  const taskPrompt = `너는 초등·중학생 음악 수업을 돕는 선생님이야. 쇤베르크 <달에 홀린 피에로> 무조성 활동 — 슈베르트 "송어"(조성)와 피에로(무조성) 비교 카드 매칭에 대한 형성적 피드백이다.

바로 위에 붙은 공통 블록 [피드백 설계 원칙](Kulhavy & Stock 1989의 검증·정교화, Shute 2008의 형성적 피드백)을 **반드시** 따른다.

학생 배치(참고):
· 송어(조성) 칸: ${listTonal}
· 피에로(무조성) 칸: ${listAtonal}

내부 판정용(학생에게 출력·암시 금지): 과제 기준 충족 = ${bothOk ? '일치' : '불일치'}.

[이 과제만의 추가 제한]
· 정교화에서 **화면의 보기 여섯 문장**을 인용·복붙하지 말 것. (학생이 칸에 넣은 문구도 본문에서 반복하지 말 것.)
· "어느 보기가 어느 곡" "이 칸에는 ~가 와야" 식의 정답·조합 암시 금지.
· 두 곡의 차이를 **보기 카드와 같은 말로** 한 번에 짝지어 설명하지 말 것.
· **음계·조성·무조성·안정감·긴장감·음의 어울림** 같은 **음악 요소 이름**으로만 짚을 것. "어디에 귀를 둘지" "칸과 듣기를 어떻게 맞출지" 같은 **듣기·과제 행동**을 정교화에 담을 것.

규칙:
· 첫 줄: 검증: ✓ 또는 검증: ✗ — 내부 판정과 일치.
· 검증 ✓: 검증 줄 포함 총 2~3문장. 위 [추가 제한]을 지킬 것.
· 검증 ✗: 검증 다음 본문 1~2문장. 위 [추가 제한]을 지킬 것. 마지막 문장은 반드시 "다시 들어보세요." 또는 "다시 생각해보세요."`;

  return requestCompareFeedback(wrapFormativePrompt(taskPrompt), fallback);
}

function buildHyThemePart3Fallback(selectedDeg) {
  if (selectedDeg === '3도') {
    return '「3도」를 골랐어요. 3도는 시작음에서 가까운 이웃처럼 느껴지는 간격이에요. 건반에서 G(솔)와 D(레)를 함께 누른 뒤, 두 음이 바로 옆처럼 가까운지 그 사이에 흰 건반이 더 있는지 한 칸씩 세어 보세요. 다시 생각해보세요.';
  }
  if (selectedDeg === '8도') {
    return '「8도」를 골랐어요. 8도는 한 옥타브, 같은 음이름의 위·아래처럼 느껴지는 간격이에요. 건반에서 G와 D의 음이름이 같은지 다른지 글자를 보고, 그 사이를 한 칸씩 세어 보세요. 다시 생각해보세요.';
  }
  return '시작음 G와 목표음 D를 건반에서 함께 누른 뒤, 그 사이를 한 칸씩 세어 보세요. 다시 생각해보세요.';
}

export async function generateHyThemePart3Feedback({ selectedDeg }) {
  const fallback = buildHyThemePart3Fallback(selectedDeg);
  const degOk = selectedDeg === '5도';

  const taskPrompt = `너는 초등·중학생 음악 수업 선생님이야. 하이든 '종달새' 주제 비교 — 도수 맞추기에 대한 형성적 피드백.

학생 선택: ${selectedDeg || '(없음)'}

내부 참고(학생에게 정답 숫자·도수를 쓰지 말 것): 과제 기준과의 일치 = ${degOk ? '일치' : '불일치'}.

규칙:
· 첫 줄: 검증: ✓ 또는 검증: ✗.
· 검증 ✓: 조성·도성·선율 관계 등 음악 개념 용어로 2~3문장 정교화. "5도" 같은 정답 수를 본문에 반복하지 말 것.
· 검증 ✗: 정답 도수·숫자·보기 문구를 쓰지 말 것. 시작음·목표음을 포함해 건반에서 세는 방법만 힌트. 마지막은 "다시 들어보세요." 또는 "다시 생각해보세요."`;

  return finalizeObjectiveChoiceAiFeedback(
    await requestCompareFeedback(wrapFormativePrompt(taskPrompt), fallback),
    degOk
  );
}

function buildVvSonnetFallback({ hasChoice }) {
  if (!hasChoice) {
    return '먼저 보기 중 하나를 고른 뒤 「피드백 보기」를 눌러 주세요. 소네트 구절과 질문을 다시 읽고, 들린 셈여림·빠르기·리듬꼴 중 무엇이 가장 잘 드러나는지 골라보면 좋아요.';
  }
  return '표제음악에서는 시의 장면과 음악의 셈여림·빠르기·리듬꼴이 서로 맞물려요. 같은 구간을 다시 들으며, 갑자기 세진 부분과 잔잔한 부분이 어디인지 귀로만 짚어보세요.';
}

/**
 * 비발디 사계 여름 — 소네트(표제음악) 객관식 선택에 대한 형성적 피드백
 */
export async function generateVvSonnetCompareFeedback({
  quoteKr,
  question,
  choices,
  userChoice,
  correctAnswer
}) {
  const trimmedNorm = normalizeFormativeChoice(userChoice);
  const correctNorm = normalizeFormativeChoice(correctAnswer);
  const hasChoice = Boolean(trimmedNorm);
  const fallback = buildVvSonnetFallback({ hasChoice });
  if (!hasChoice) return fallback;

  const isCorrect = trimmedNorm === correctNorm;
  const choiceList = Array.isArray(choices) ? choices.join(' / ') : '';

  const taskPrompt = `너는 초등·중학생 음악 감상 수업을 돕는 선생님이야. 비발디 <사계> 여름악장의 소네트(표제음악) 활동이다.

내부 참고(학생에게 정답 문구·오답 보기를 그대로 쓰지 말 것): 객관적 정오 = ${isCorrect ? '일치' : '불일치'}.

소네트 구절(한국어): ${quoteKr}
질문: ${question}
보기 목록(참고): ${choiceList}
학생이 고른 보기: ${trimmedNorm}

규칙:
· 첫 줄: 검증: ✓ 또는 검증: ✗ — 내부 참고의 정오에 맞춘다.
· 검증 ✓: 표제음악·셈여림·빠르기·리듬꼴·음형·스트카토 등에서 과제와 연결되는 요소명을 넣어 2~3문장 정교화. 학생 보기 문장을 그대로 베끼지 말 것. 개인 칭찬 금지.
· 검증 ✗: 다른 보기 문구·정답 문장을 절대 쓰지 말 것. 시 구절의 상황(폭풍·번개 등)을 빌려 "이런 음이 필요하다" 식으로 정답을 암시하지 말 것. 다시 들을 때 셈여림(음의 강약)·속도(템포)·리듬(리듬꼴) 중 어디에 귀를 기울일지 요소 이름만 힌트로 1문장에 담을 것. 마지막은 "다시 들어보세요." 또는 "다시 생각해보세요."`;

  return finalizeObjectiveChoiceAiFeedback(
    await requestCompareFeedback(wrapFormativePrompt(taskPrompt), fallback),
    isCorrect
  );
}

function buildVvConcertoFallback({ hasChoice }) {
  if (!hasChoice) {
    return '먼저 보기 중 하나를 고른 뒤 「피드백 보기」를 눌러 주세요. 독주(바이올린 한 대)와 총주(현악 전체)가 번갈아 나오는지 영상을 다시 보며 확인해 보세요.';
  }
  return '바이올린 협주곡에서는 독주와 총주의 음색·밀도 대비가 중요해요. 영상에서 화려한 솔로 구간과 풀 앙상블 구간이 어떻게 바뀌는지 귀로만 비교해 보세요.';
}

/**
 * 비발디 사계 여름 — 바이올린 협주(독주·총주) 발견 질문에 대한 형성적 피드백
 */
export async function generateVvConcertoCompareFeedback({
  soloCount,
  tuttiCount,
  question,
  userChoice,
  correctAnswer
}) {
  const trimmedNorm = normalizeFormativeChoice(userChoice);
  const hasChoice = Boolean(trimmedNorm);
  const fallback = buildVvConcertoFallback({ hasChoice });
  if (!hasChoice) return fallback;

  const isCorrect = trimmedNorm === normalizeFormativeChoice(correctAnswer);
  const s = Number(soloCount) || 0;
  const t = Number(tuttiCount) || 0;

  const taskPrompt = `너는 초등·중학생 음악 감상 수업을 돕는 선생님이야. 비발디 <사계> 여름악장의 바이올린 협주곡(독주와 총주) 활동이다.

내부 참고(학생에게 정답 문구·오답 보기를 그대로 쓰지 말 것): 객관적 정오 = ${isCorrect ? '일치' : '불일치'}.

학생이 탭한 횟수(참고): 바이올린 독주 ${s}회, 현악 그룹(총주) ${t}회
질문: ${question}
학생이 고른 보기: ${trimmedNorm}

규칙:
· 첫 줄: 검증: ✓ 또는 검증: ✗ — 내부 참고의 정오에 맞춘다.
· 검증 ✓: 독주·총주·음색·밀도·리토르넬로(구조 이름만 필요할 때 한 번) 등 음악 개념으로 2~3문장 정교화. 탭 횟수는 귀 기울인 흔적으로만 가볍게 언급해도 된다. 개인 칭찬 금지.
· 검증 ✗: 다른 보기·정답 문구를 쓰지 말 것. 독주와 총주를 귀로 구분하는 힌트 1문장. 마지막은 "다시 들어보세요." 또는 "다시 생각해보세요."`;

  return finalizeObjectiveChoiceAiFeedback(
    await requestCompareFeedback(wrapFormativePrompt(taskPrompt), fallback),
    isCorrect
  );
}

function isCpRhythmPolyMoodNonAttempt(text) {
  const t = String(text ?? '').trim();
  if (t.length < 8) return true;
  if (/^(몰라|모르겠|잘\s*모르|글쎄|모름|pass|\.+)$/i.test(t.replace(/\s/g, ''))) return true;
  if (/^(몰라|모르겠|잘\s*모르|글쎄)/i.test(t) && t.length <= 24) return true;
  return false;
}

function buildCpRhythmPolyMoodFallback({ hasInput, isNonAttempt = false }) {
  if (!hasInput) {
    return '먼저 폴리리듬이 이 곡의 분위기에 어떤 영향을 주는지 한두 문장으로 써본 뒤 「피드백 보기」를 눌러 주세요.';
  }
  if (isNonAttempt) {
    return `검증: ✗
오른손만, 왼손만, 양손을 합친 소리를 차례로 다시 들어보세요. 손마다 리듬이 같게 들리는지 다른지 귀에 집중한 뒤, 그 차이가 곡 분위기에 어떤 느낌을 주는지 한 문장으로 써보세요. 다시 생각해보세요.`;
  }
  return `검증: ✗
앞에서 고른 양손 느낌과 지금 쓴 문장이 이어지는지 확인해 보세요. «폴리리듬»과 «분위기»를 연결하는 말을 네 생각으로 한 문장 더 써 보세요. 다시 들어보세요.`;
}

/**
 * 쇼팽 2-C 폴리리듬 — 분위기 영향 서술형 형성적 피드백
 */
export async function generateCpRhythmPolyMoodFeedback({
  userText,
  selectedRhGrouping = '',
  selectedLhGrouping = '',
  selectedBothFeel = ''
}) {
  const trimmed = String(userText ?? '').trim();
  if (trimmed.length < 5) {
    return buildCpRhythmPolyMoodFallback({ hasInput: false });
  }
  if (isCpRhythmPolyMoodNonAttempt(trimmed)) {
    return buildCpRhythmPolyMoodFallback({ hasInput: true, isNonAttempt: true });
  }

  const fallback = buildCpRhythmPolyMoodFallback({ hasInput: true });
  const taskPrompt = `너는 초등·중학생 음악 감상 수업을 돕는 선생님이야. 쇼팽 <환상 즉흥곡> 2-C 폴리리듬 활동의 마지막 서술 질문이다.

질문: 폴리리듬이 이 곡의 분위기에 어떤 영향을 준다고 생각하나요?

학생이 앞에서 고른 내용(참고):
· 오른손 음표 묶음: ${selectedRhGrouping || '(아직 없음)'}
· 왼손 음표 묶음: ${selectedLhGrouping || '(아직 없음)'}
· 양손이 함께 연주될 때 느낌: ${selectedBothFeel || '(아직 없음)'}

내부 참고(학생에게 절대 그대로 쓰지 말 것 — 판정용만): 폴리리듬은 두 손의 박자가 겹치며 복잡·긴장·추진·불안정 같은 분위기와 연결될 수 있다. 학생이 스스로 그 연결을 1문장 이상 썼으면 ✓.

학생 서술:
${trimmed}

규칙:
· 첫 줄: 검증: ✓ 또는 검증: ✗ — 폴리리듬과 분위기(느낌)를 학생 말로 연결했으면 ✓, 거의 없거나 «몰라»류면 ✗.
· 검증 ✓(정교화): 학생이 쓴 표현을 짧게 인용·반영한 뒤, 폴리리듬·리듬꼴·분위기 등 음악 요소명으로 2~3문장 정교화해도 된다. 학생이 쓰지 않은 느낌 단어(긴장감·추진력·불안정·복잡 등)나 폴리리듬이 두 손의 박자가 겹친다는 설명을 덧붙여도 된다. 다만 모범 해설 문장을 통째로 베끼지 말 것. 개인 칭찬 금지.
· 검증 ✗(매우 중요 — 답 유도, 정답 풀이 금지): 폴리리듬이 무엇인지 정의하거나 설명하지 말 것. 4박·3박·셋잇단·16분음표 등 구체 수치·박자 설명 금지. «긴장감», «추진력», «불안정», «복잡» 등 기대 분위기 단어를 본문에 넣지 말 것. «~때문에 ~가 생긴다»처럼 정답 결론을 대신 말하지 말 것.
· 검증 ✗에서 할 일: (1) 다시 들을 포인트 질문 1개 — 예: 손마다 리듬이 같게 들리는지, 겹칠 때 분위기가 어떻게 느껴지는지 (정답 단어 없이). (2) 앞에서 고른 양손 느낌과 이어 쓰라는 짧은 안내 1문장. 마지막은 반드시 «다시 들어보세요.» 또는 «다시 생각해보세요.»`;

  return requestCompareFeedback(wrapFormativePrompt(taskPrompt), fallback);
}
