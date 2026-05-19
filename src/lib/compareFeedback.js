import { extractTextFromResponse } from './finalEssayGenerator';

function getViteOpenAiKey() {
  const v = import.meta.env.VITE_OPENAI_API_KEY;
  if (typeof v !== 'string') return '';
  return v.trim();
}

const MSG_NO_KEY = `──
맞춤 AI 피드백은 브라우저 안에 들어 있는 \`VITE_OPENAI_API_KEY\`로만 동작해요.

· 로컬: 프로젝트 루트에 \`.env.local\`을 두고 \`VITE_OPENAI_API_KEY=sk-...\` 를 적은 뒤, 터미널에서 개발 서버를 완전히 끄고 다시 \`npm run dev\`로 실행하세요. (실행 중에 파일만 고치면 반영이 안 될 수 있어요.)
· 배포 사이트: GitHub Pages·Netlify 등에는 \`.env.local\`이 올라가지 않습니다. 호스트의 “Build environment variables”에 같은 이름으로 키를 넣고 **다시 빌드·배포**해야 합니다.`;

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
 * 1차 응답 후 「AI 맞춤형 피드백」을 받은 뒤 「정답 확인」 허용 여부(과제 기준 정오는 UI에서 판별한 값 사용).
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
OpenAI 요청 한도(HTTP 429)에 걸렸어요. 잠시 후 「AI 맞춤형 피드백 보기」를 다시 눌러 보세요. Free 등급은 분·일 제한이 작을 수 있어요. https://platform.openai.com/usage 에서 사용량을 확인하거나, 1~2분 뒤 재시도해 보세요.`;
  }
  return `──
OpenAI 요청이 실패했습니다${status ? ` (HTTP ${status})` : ''}. API 키가 맞는지, 결제·크레딧이 있는지 확인해 보세요. 브라우저에서 F12 → 네트워크 탭에서 \`api.openai.com\` 응답 본문을 보면 원인 힌트가 나오는 경우가 많아요.`;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function retryAfterMs(res) {
  const raw = res.headers.get('retry-after');
  if (!raw) return null;
  const sec = parseInt(raw, 10);
  if (Number.isFinite(sec)) return Math.min(Math.max(sec, 1), 60) * 1000;
  const retryDate = Date.parse(raw);
  if (Number.isFinite(retryDate)) return Math.min(Math.max(retryDate - Date.now(), 1000), 60_000);
  return null;
}

async function requestCompareFeedback(prompt, fallbackBody) {
  const apiKey = getViteOpenAiKey();
  if (!apiKey) return `${fallbackBody}\n\n${MSG_NO_KEY}`;

  const maxAttempts = 4;
  let lastStatus = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const res = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          input: prompt
        })
      });

      if (res.ok) {
        const json = await res.json();
        const text = extractTextFromResponse(json);
        const trimmed = text?.trim();
        if (!trimmed) return `${fallbackBody}\n\n${msgApiFailed()}`;
        return trimmed;
      }

      lastStatus = res.status;
      const retryable = res.status === 429 || res.status === 503;
      if (retryable && attempt < maxAttempts - 1) {
        const fromHeader = retryAfterMs(res);
        const backoff = fromHeader ?? Math.min(2500 * 2 ** attempt, 20_000);
        await sleep(backoff);
        continue;
      }

      return `${fallbackBody}\n\n${msgApiFailed(res.status)}`;
    } catch {
      if (attempt < maxAttempts - 1) {
        await sleep(Math.min(1500 * (attempt + 1), 8000));
        continue;
      }
      return `${fallbackBody}\n\n${msgApiFailed(lastStatus)}`;
    }
  }

  return `${fallbackBody}\n\n${msgApiFailed(429)}`;
}

async function requestCompareFeedbackMultimodal(userContentParts, fallbackBody) {
  const apiKey = getViteOpenAiKey();
  if (!apiKey) return `${fallbackBody}\n\n${MSG_NO_KEY}`;

  const maxAttempts = 4;
  let lastStatus = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const res = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          input: [{ role: 'user', content: userContentParts }]
        })
      });

      if (res.ok) {
        const json = await res.json();
        const text = extractTextFromResponse(json);
        const trimmed = text?.trim();
        if (!trimmed) return `${fallbackBody}\n\n${msgApiFailed()}`;
        return trimmed;
      }

      lastStatus = res.status;
      const retryable = res.status === 429 || res.status === 503;
      if (retryable && attempt < maxAttempts - 1) {
        const fromHeader = retryAfterMs(res);
        const backoff = fromHeader ?? Math.min(2500 * 2 ** attempt, 20_000);
        await sleep(backoff);
        continue;
      }

      return `${fallbackBody}\n\n${msgApiFailed(res.status)}`;
    } catch {
      if (attempt < maxAttempts - 1) {
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
  const keys = ['음높이', '음계', '리듬꼴', '음색'];
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
    ['음높이', '음계', '리듬꼴', '음색'].map((key) => ({
      인물: name,
      요소: key,
      학생: voiceDesign[name]?.[key] || '—',
      모범: answerKey[name]?.[key] ?? '—'
    }))
  );
  const allMatch = rows.length > 0 && rows.every((r) => r.학생 !== '—' && r.학생 === r.모범);
  const who = selectedChars.length > 1 ? '선택한 인물들' : `「${selectedChars[0] || ''}」`;

  const taskPrompt = `너는 음악 수업 선생님이야. 아래 표는 학생이 고른 인물의 음높이·음계·리듬꼴·음색 설계와 모범안이다. (대상: ${who})

내부 참고: 네 칸 모두 학생 값이 모범과 같으면 ${allMatch ? 'true (검증 ✓)' : 'false (검증은 불일치 시 ✗)'}.

규칙:
· 첫 줄: 검증: ✓ (네 요소 모두 모범과 일치) 또는 검증: ✗ (하나라도 다름 또는 미선택).
· 검증 ✓: 음높이·음계·리듬꼴·음색 중 무엇이 어떤 음악적 역할과 맞닿는지 2~3문장으로 정교화. 개인 칭찬 문장 금지.
· 검증 ✗: 모범 칸의 정확한 단어(예: "높음", "단조")를 쓰지 말 것. 어느 요소를 어떤 소리 특징으로 다시 들을지 힌트만. 마지막은 "다시 들어보세요." 또는 "다시 생각해보세요."

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
  const t1 = (theme1Ids || []).map((id) => HY_THEME_MATCH_OPT_LABELS[id]).filter(Boolean).join(', ') || '미배치';
  const t2 = (theme2Ids || []).map((id) => HY_THEME_MATCH_OPT_LABELS[id]).filter(Boolean).join(', ') || '미배치';
  return `제1주제 칸: ${t1}. 제2주제 칸: ${t2}. 선율·리듬꼴·느낌의 차이에 귀를 두고 두 음원을 번갈아 들으며, 각 칸에 넣은 문구가 같은 듣기에서 모였는지 점검해 보세요. 과제(칸 나누기)에만 초점을 두고, 칸을 바꿔 넣어 실험해 보아도 좋아요. 마지막은 반드시 "다시 들어보세요." 또는 "다시 생각해보세요."`;
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

function buildHyThemePart3Fallback(selectedDeg) {
  return `선택한 도수는 ${selectedDeg || '미선택'}이에요. 시작음과 목표음을 모두 포함해서 한 칸씩 손으로 짚어 보세요. 먼저 "몇 칸인지"를 적고, 그다음 보기 중 어떤 도수와 대응되는지 다시 고르면 훨씬 정확해져요.`;
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
    return '먼저 보기 중 하나를 고른 뒤 「AI 맞춤형 피드백 보기」를 눌러 주세요. 소네트 구절과 질문을 다시 읽고, 들린 셈여림·빠르기·리듬꼴 중 무엇이 가장 잘 드러나는지 골라보면 좋아요.';
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
    return '먼저 보기 중 하나를 고른 뒤 「AI 맞춤형 피드백 보기」를 눌러 주세요. 독주(바이올린 한 대)와 총주(현악 전체)가 번갈아 나오는지 영상을 다시 보며 확인해 보세요.';
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

function buildCpFormAbaDiscoveryFallback({ hasChoice, isCorrect }) {
  if (!hasChoice) {
    return '먼저 보기 중 하나를 고른 뒤 「AI 맞춤형 피드백 보기」를 눌러 주세요. 각 구간에서 셈여림(소리의 세기)과 빠르기가 어떻게 다른지 다시 들어보세요.';
  }
  if (isCorrect) {
    return 'ABA에서 가운데 구간은 앞쪽·뒤쪽과 달리 들리는 부분이에요. 쇼팽 곡에서 A·B·A\u2019를 이어 들으며 셈여림과 빠르기가 어떻게 달라지는지 짚어 보세요.';
  }
  return '선택한 보기가 질문과 잘 맞는지, 세 구간의 셈여림과 빠르기만 귀로 비교해 보세요. 다시 들어보세요.';
}

/**
 * 쇼팽 2-B ABA 형식 — 발견 질문(B구간이 왜 있는가) 형성적 피드백
 */
export async function generateCpFormAbaDiscoveryFeedback({
  question,
  userChoice,
  correctAnswer,
  choiceListText
}) {
  const trimmedNorm = normalizeFormativeChoice(userChoice);
  const hasChoice = Boolean(trimmedNorm);
  if (!hasChoice) return buildCpFormAbaDiscoveryFallback({ hasChoice: false, isCorrect: false });

  const isCorrect = trimmedNorm === normalizeFormativeChoice(correctAnswer);
  const fallback = buildCpFormAbaDiscoveryFallback({ hasChoice, isCorrect });

  const taskPrompt = `너는 초등·중학생 음악 감상 수업을 돕는 선생님이야. 쇼팽 <환상 즉흥곡>의 ABA 형식(구조) 활동의 마지막 발견 질문이다.

내부 참고(학생에게 정답 문구·오답 보기를 그대로 쓰지 말 것): 객관적 정오 = ${isCorrect ? '일치' : '불일치'}.

질문: ${question}
보기 목록(참고): ${choiceListText}
학생이 고른 보기: ${trimmedNorm}

규칙:
· 첫 줄: 검증: ✓ 또는 검증: ✗ — 내부 참고의 정오에 맞춘다.
· 검증 ✓: 형식·셈여림·빠르기·구간(A·B·A\u2019) 등 음악 개념으로 2~3문장 정교화. 보기 목록의 정답 문장이나 그 동의어(예: 대비, 서로 다른 느낌, 느낌의 차이를 나란히, 극적 대비 등)를 그대로 인용하거나 앞두고 설명하지 말 것. 개인 칭찬 금지.
· 검증 ✗(매우 중요): 정답 보기 문구·그 요지·한글 동의어를 본문에 절대 넣지 말 것. "B구간은 ~역할", "가운데 구간은 ~하기 위해"처럼 B의 목적·역할을 한 문장으로 설명하는 서술 금지. "대비""서로 다른 느낌""느낌을 나란히""극적으로 다르게" 같은 표현 금지. B가 A·A\u2019와 셈여림·빠르기 면에서 어떻게 들리는지 귀로만 다시 짚으라는 힌트 1문장만 허용. 마지막은 "다시 들어보세요." 또는 "다시 생각해보세요."`;

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
    return '먼저 폴리리듬이 이 곡의 분위기에 어떤 영향을 주는지 한두 문장으로 써본 뒤 「AI 맞춤형 피드백 보기」를 눌러 주세요.';
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
