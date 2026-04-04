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

function msgApiFailed(status) {
  return `──
OpenAI 요청이 실패했습니다${status ? ` (HTTP ${status})` : ''}. API 키가 맞는지, 결제·크레딧이 있는지 확인해 보세요. 브라우저에서 F12 → 네트워크 탭에서 \`api.openai.com\` 응답 본문을 보면 원인 힌트가 나오는 경우가 많아요.`;
}

async function requestCompareFeedback(prompt, fallbackBody) {
  const apiKey = getViteOpenAiKey();
  if (!apiKey) return `${fallbackBody}\n\n${MSG_NO_KEY}`;

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
    if (!res.ok) {
      return `${fallbackBody}\n\n${msgApiFailed(res.status)}`;
    }
    const json = await res.json();
    const text = extractTextFromResponse(json);
    const trimmed = text?.trim();
    if (!trimmed) return `${fallbackBody}\n\n${msgApiFailed()}`;
    return trimmed;
  } catch {
    return `${fallbackBody}\n\n${msgApiFailed()}`;
  }
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

function buildAnalyticalFallbackBody(userCharacterSlots, userCharsText, correctChars, userStory) {
  const userSet = userCharacterNameSet(userCharacterSlots, userCharsText);
  const correctSet = new Set(correctChars);
  const hits = [...correctSet].filter((c) => userSet.has(c)).length;
  const q1 =
    hits === correctSet.size
      ? '등장인물 네 명을 모두 잘 짚었어요.'
      : `모범에는 해설자·아버지·아들·마왕 네 명이 있어요. 지금 ${hits}명 정도가 겹쳐 보이니, 빠진 인물이 있는지 다시 확인보면 좋아요.`;
  const storyLen = (userStory || '').trim().length;
  const q2 =
    storyLen < 30
      ? '줄거리는 폭풍 밤, 아버지와 아들, 마왕의 유혹, 그리고 안타까운 결말이 드러나도록 조금만 더 구체적으로 써보면 좋아요.'
      : '핵심 사건(밤·달림·마왕·결말)이 들어갔는지 스스로 체크해보고, 모범 해설과 비교해 문장만 다르고 내용은 같은지 살펴보세요.';
  return `${q1}\n\n${q2}`;
}

export async function generateAnalyticalCompareFeedback({
  userCharacterSlots,
  userCharactersText,
  correctCharacters,
  userStory,
  correctStory
}) {
  const fallbackBody = buildAnalyticalFallbackBody(
    userCharacterSlots,
    userCharactersText,
    correctCharacters,
    userStory
  );
  const prompt = `너는 음악 수업을 돕는 선생님이야. 초등·중학생 눈높이로 짧고 따뜻하게 말해줘.

Q1. 학생이 적은 등장인물 목록과 모범 목록을 비교해서, 빠진 인물·헷갈릴 수 있는 점·잘한 점을 2~3문장으로.
Q2. 학생이 쓴 줄거리 요약과 모범 줄거리를 비교해서, 빠진 핵심 사건이나 순서·감정 표현에서 좋은 점을 2~3문장으로.

규칙:
- 모범 문장을 그대로 복사하지 말고 비교 관점으로 설명할 것.
- 총 120~220자 내외 한국어.
- 과장 칭찬은 피하고 구체적으로.

학생 Q1 (등장인물): ${userCharactersText || '(없음)'}
모범 Q1: ${correctCharacters.join(', ')}

학생 Q2 (줄거리): ${(userStory || '').trim() || '(없음)'}
모범 Q2: ${correctStory}`;

  return requestCompareFeedback(prompt, fallbackBody);
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
  const who = selectedChars.length > 1 ? '선택한 인물들' : `「${selectedChars[0] || ''}」`;
  const prompt = `너는 음악 수업 선생님이야. 아래 표는 학생이 고른 인물의 음높이·음계·리듬꼴·음색 설계와 모범안이야. (대상: ${who})

학생 눈높이로 3~5문장 한국어로:
- 어떤 칸이 특히 잘 맞았는지, 어떤 칸에서 음악적 이유로 다르게 들릴 수 있는지 짧게 짚어줘.
- 틀렸다고 단정하지 말고 "이렇게 들을 수도 있어요" 식으로 격려해줘.
- 모범 문장을 그대로 반복하지 말 것.

데이터(JSON): ${JSON.stringify(rows)}`;

  return requestCompareFeedback(prompt, fallback);
}

const PIANO_FALLBACK_BODY =
  '오른손 선은 빠르게 오르내리는 느낌(말발굽·긴장), 왼손 선은 느리고 묵직하게 반복되는 느낌(심장·압박)이 드러나는지 그림과 모범 악보를 나란히 보며 확인해보세요.';

export async function generatePianoCompareFeedback() {
  const prompt = `슈베르트 가곡 <마왕> 피아노 반주 학습 맥락이야. 학생이 캔버스에 오른손·왼손 가락선을 그리고 모범 악보 이미지와 눈으로 비교한다고 가정해.

모범 해설 요지:
- 오른손: 빠르고 불규칙하게 오르내리는 셋잇단 느낌 → 말발굽·질주 같은 긴장감.
- 왼손: 느리고 강하게 반복되는 베이스 → 심장 박동·쫓기는 느낌.

학생이 스스로 비교할 때 쓸 질문 3가지와 격려 1~2문장을 초등·중학생 눈높이 한국어로, 총 100~200자 내외로 적어줘.`;

  return requestCompareFeedback(prompt, PIANO_FALLBACK_BODY);
}
