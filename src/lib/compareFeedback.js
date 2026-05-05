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
  if (status === 429) {
    return `──
OpenAI 요청 한도(HTTP 429)에 걸렸어요. 잠시 후 「AI 맞춤 피드백 받기」를 다시 눌러 보세요. Free 등급은 분·일 제한이 작을 수 있어요. https://platform.openai.com/usage 에서 사용량을 확인하거나, 1~2분 뒤 재시도해 보세요.`;
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
  const prompt = `너는 음악 수업을 돕는 선생님이야. 초등·중학생 눈높이로 짧고 따뜻하게 말해줘.

Q1. 학생이 적은 등장인물 목록과 모범 목록을 비교해서, 빠진 인물·헷갈릴 수 있는 점·잘한 점을 2~3문장으로.
Q2. ${q2PromptGuide} 학생 답변과 모범 답변을 비교해 2~3문장으로.

규칙:
- 모범 문장을 그대로 복사하지 말고 비교 관점으로 설명할 것.
- 총 120~220자 내외 한국어.
- 과장 칭찬은 피하고 구체적으로.
- 학생 입력에 없는 내용(감정, 사건, 인물 반응)을 추측해서 쓰지 말 것.
- 학생 입력이 짧거나 불충분하면 "입력이 짧아 판단이 어렵다"라고 명시할 것.
- 가능하면 학생이 실제로 쓴 단어를 짧게 인용해 근거를 보여줄 것.

학생 Q1 (등장인물): ${userCharactersText || '(없음)'}
모범 Q1: ${correctCharacters.join(', ')}

학생 Q2 (${q2Label}): ${(userStory || '').trim() || '(없음)'}
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
  selectedIndex
}) {
  const fallback = buildTonePaintingFallback({
    segmentTitle,
    selectedIndex
  });
  if (selectedIndex === null || selectedIndex === undefined) {
    return fallback;
  }

  const studentAnswer = options[selectedIndex] || '선택 없음';
  const prompt = `너는 초등학생 음악 감상 수업을 돕는 선생님이야.
아래는 할렐루야 음화법 활동의 한 구간이야. 정답 여부를 판단하지 말고, 학생이 스스로 답을 점검하도록 힌트형 피드백을 3~4문장으로 줘.

규칙:
- 정답/오답, 모범답, 맞다/틀리다 같은 표현을 절대 쓰지 말 것.
- 보기 문구를 그대로 정답처럼 반복하지 말 것.
- "가사 단어-음높이 변화-반복 느낌-선율 지속" 중 2개 이상을 체크 포인트로 제시할 것.
- 마지막 문장은 반드시 "네가 고른 이유를 한 문장으로 써보자"로 끝낼 것.
- 너무 길게 쓰지 말고 80~160자 한국어.

구간: ${segmentTitle}
가사: ${lyric}
질문: ${question}
학생 선택(참고용): ${studentAnswer}`;

  return requestCompareFeedback(prompt, fallback);
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

  const promptText = `너는 초등·중학생 음악 수업을 돕는 선생님이야.
${contextLabel}

아래에 내가 순서대로 두 장의 그림을 첨부했어.
- 첫 번째 첨부 이미지: 학생이 캔버스에 손으로 그린 가락선.
- 두 번째 첨부 이미지: 수업용 모범 가락선 그림.

규칙:
- "정답이다/틀렸다/맞았다"처럼 단정하지 말고, 학생이 스스로 다시 보며 고칠 수 있게 힌트만 준다.
- 선의 모양 일치/그림체 평가는 하지 말고, 오직 음악 개념 인식만 본다.
- 화성음악이면 "여러 성부가 동시에 같은 방향으로 움직이는가"를 중심으로 2가지 이상 점검 포인트를 준다.
- 다성음악이면 "성부가 번갈아 들어오며 이어지는가"를 중심으로 2가지 이상 점검 포인트를 준다.
- 마지막 문장은 반드시 "모양이 달라도 개념이 보이면 충분해." 로 끝낸다.
- 한국어, 170~320자 내외, 친근한 말투.

참고(내부용, 학생에게 말하지 말 것): 학생 그림에서 선으로 추정되는 픽셀 비율 대략 ${(metrics.darkRatio * 100).toFixed(1)}%.`;

  const content = [
    { type: 'input_text', text: promptText },
    { type: 'input_image', image_url: userSmall, detail: 'low' },
    { type: 'input_image', image_url: modelSmall, detail: 'low' }
  ];

  return requestCompareFeedbackMultimodal(content, fallback);
}

function buildHyThemePart2Fallback({ feelT1, feelT2, toneT1, toneT2 }) {
  const a = (feelT1 || '').trim() || '제1주제 느낌 미입력';
  const b = (feelT2 || '').trim() || '제2주제 느낌 미입력';
  return `제1주제 느낌(${a})과 제2주제 느낌(${b})을 비교해, 각 문장에서 잘 잡은 표현 1개와 더 구체화할 표현 1개를 찾아 보세요. 제1주제는 도약/경쾌, 제2주제는 순차/부드러운 흐름 근거를 한 줄씩 덧붙이면 느낌 설명의 설득력이 더 좋아져요. 지금 선택은 제1주제 ${toneT1 || '미선택'}, 제2주제 ${toneT2 || '미선택'}이니, 선택 근거도 함께 점검해 보세요.`;
}

export async function generateHyThemePart2Feedback({ feelT1, feelT2, toneT1, toneT2 }) {
  const fallback = buildHyThemePart2Fallback({ feelT1, feelT2, toneT1, toneT2 });
  const prompt = `너는 초등·중학생 음악 수업을 돕는 선생님이야.
하이든 '종달새' 주제 비교 활동의 파트 2(느낌 표현 + 장단조 선택) 피드백을 작성해줘.

학생 입력:
- 제1주제 느낌: ${(feelT1 || '').trim() || '(없음)'}
- 제2주제 느낌: ${(feelT2 || '').trim() || '(없음)'}
- 제1주제 장단조 선택: ${toneT1 || '(없음)'}
- 제2주제 장단조 선택: ${toneT2 || '(없음)'}

규칙:
- 하이브리드 방식(부분 공개 + 유도형)으로 3~4문장.
- 첫 문장은 현재 답안을 "방향은 좋아" 또는 "한 번 더 점검해보자" 수준으로만 진단할 것.
- 정답(장조/단조)을 직접 말하지 말 것.
- "정답", "오답", "맞다", "틀리다", "둘 다 장조" 같은 표현 금지.
- 학생이 쓴 느낌 문장에서 제1·제2 각각 1개 이상 표현을 짧게 인용해 평가할 것.
- 느낌 문장 평가를 반드시 포함할 것: "잘한 점 1개 + 보완점 1개"를 제1·제2 각각에 대해 제시.
- 가락 힌트 1개(도약/순차) + 리듬 힌트 1개(짧고 경쾌/부드럽게 연결)를 반드시 넣을 것.
- 마지막 전 문장은 반드시 "그래서 네가 고른 장·단조 근거를 각 주제마다 한 줄씩 덧붙여 보자." 로 끝낼 것.
- 마지막 문장은 "다시 들으며 가락의 움직임과 리듬을 한 번 더 비교해 보자." 로 끝낼 것.`;
  return requestCompareFeedback(prompt, fallback);
}

function buildHyThemePart3Fallback(selectedDeg) {
  return `선택한 도수는 ${selectedDeg || '미선택'}이에요. 시작음과 목표음을 모두 포함해서 한 칸씩 손으로 짚어 보세요. 먼저 "몇 칸인지"를 적고, 그다음 보기 중 어떤 도수와 대응되는지 다시 고르면 훨씬 정확해져요.`;
}

export async function generateHyThemePart3Feedback({ selectedDeg }) {
  const fallback = buildHyThemePart3Fallback(selectedDeg);
  const prompt = `너는 초등·중학생 음악 수업 선생님이야.
하이든 '종달새' 주제 비교 활동의 파트 3(도수 맞추기) 피드백을 작성해줘.

학생 선택: ${selectedDeg || '(없음)'}

규칙:
- 하이브리드 방식(부분 공개 + 유도형)으로 2~3문장.
- 첫 문장은 현재 선택에 대해 "방향은 좋아" 또는 "한 번 더 세어보자" 수준 진단만 제공할 것.
- 정답 도수 숫자를 직접 말하지 말 것.
- "정답", "오답", "맞다", "틀리다", "5도" 같은 단정/직답 표현 금지.
- 반드시 "시작음과 목표음을 포함해 세기" 힌트를 넣고, 마지막에 학생이 다시 고르도록 유도할 것.
- 마지막 문장은 "건반 위에서 직접 손으로 세어 보면 더 정확해진다." 로 끝낼 것.`;
  return requestCompareFeedback(prompt, fallback);
}
