function buildFallbackEssay(data) {
  const isHandel = data.selectedSong === 'handel';
  const isHaydn = data.selectedSong === 'haydn';
  const isSchoenberg = data.selectedSong === 'schoenberg';
  const isVivaldi = data.selectedSong === 'vivaldi';
  const isChopin = data.selectedSong === 'chopin';
  const songTitle = isHandel
    ? '헨델의 <할렐루야>'
    : (isHaydn
      ? '하이든의 <종달새>'
      : (isSchoenberg
        ? '쇤베르크의 <달에 홀린 피에로>'
        : (isVivaldi
          ? '비발디의 <사계: 여름 3악장>'
          : (isChopin ? '쇼팽의 <환상 즉흥곡>' : '슈베르트의 <마왕>'))));
  const clean = (v) => (typeof v === 'string' ? v.trim() : '');
  const toLine = (v) => (clean(v) ? clean(v) : '입력 없음');
  const kw = data.selectedKeywords?.length ? data.selectedKeywords.join(', ') : '입력 없음';
  const colors = data.selectedColors?.length ? data.selectedColors.join(', ') : '입력 없음';
  const charsRaw = isChopin
    ? clean(data.analyticalCharacters?.[0] || '')
    : (data.analyticalCharacters?.filter((v) => clean(v)).join(', ') || '');
  const analyticalQ1 = isHandel ? toLine(data.handelLyricMeaning) : toLine(charsRaw);
  const analyticalQ2 = isHandel ? toLine(data.handelOperaDiff) : toLine(data.analyticalStory);
  const q1 = toLine(data.q1);
  const q2 = toLine(data.q2);
  const q3 = toLine(data.q3);
  const sensory = toLine(data.sensoryDesc);

  return `【감각적 감상】
나는 ${songTitle}을 들으며 ${kw}의 감정을 느꼈다고 기록했다. 선택한 색은 ${colors}이며, 감각적 감상 서술은 다음과 같다. ${sensory}.

【분석적 감상】
분석적 감상 Q1에 대해 나는 다음과 같이 기록했다. ${analyticalQ1}. 분석적 감상 Q2에 대해 나는 다음과 같이 기록했다. ${analyticalQ2}.

【심미적 감상】
분석 후 느낌의 변화는 다음과 같이 기록했다. ${q1}. 이 곡의 가치를 판단한 이유는 다음과 같이 기록했다. ${q2}. 오늘날 삶과의 연결은 다음과 같이 기록했다. ${q3}.`;
}

function hasMeaningfulStudentInput(data) {
  const clean = (v) => (typeof v === 'string' ? v.trim() : '');
  const hasText = (v) => clean(v).length > 0;
  const hasAnyTextInObject = (obj) => Object.values(obj || {}).some((v) => hasText(v));
  const hasAnyTextInNestedObject = (obj) => Object.values(obj || {}).some((v) => (
    typeof v === 'object' && v !== null ? hasAnyTextInObject(v) : hasText(v)
  ));

  return Boolean(
    (data.selectedKeywords || []).length
    || (data.selectedColors || []).length
    || hasText(data.sensoryDesc)
    || hasText(data.q1)
    || hasText(data.q2)
    || hasText(data.q3)
    || (data.analyticalCharacters || []).some((v) => hasText(v))
    || hasText(data.analyticalStory)
    || hasText(data.handelLyricMeaning)
    || hasText(data.handelOperaDiff)
    || hasAnyTextInNestedObject(data.voiceDesignState?.voiceDesign)
    || hasAnyTextInObject(data.pianoAnalysisState)
    || hasAnyTextInObject(data.sbSprechState)
    || hasAnyTextInObject(data.sbAtonalState)
    || hasAnyTextInObject(data.cpRhythmState?.selectedByGroup)
    || hasText(data.cpRhythmState?.polyDesc)
    || hasAnyTextInObject(data.cpFormState?.formAnswers)
    || hasAnyTextInObject(data.cpFormState?.featureById)
    || hasAnyTextInObject(data.hyTimbreState?.selectedByGrid)
    || hasAnyTextInObject(data.hyTimbreState?.roleByGrid)
    || hasAnyTextInObject(data.hyThemeState?.matchPlaced)
    || hasAnyTextInObject(data.vvSonnetState?.selectedById)
    || hasAnyTextInObject(data.vvConcertoState)
  );
}

export function extractTextFromResponse(json) {
  if (json?.output_text) return json.output_text;
  const texts = [];
  (json?.output || []).forEach((item) => {
    (item?.content || []).forEach((c) => {
      if (typeof c?.text === 'string') texts.push(c.text);
    });
  });
  return texts.join('\n').trim();
}

export async function generateFinalEssay(data) {
  if (!hasMeaningfulStudentInput(data)) {
    return '아직 입력한 감상 내용이 없어서 최종 감상문을 만들 수 없었다.\n\n먼저 각 단계에서 느낌, 분석, 생각을 한 줄씩이라도 입력한 뒤 다시 만들어 보려고 생각했다.\n\n입력을 채운 다음에는 내가 쓴 내용을 바탕으로 최종 감상문을 완성할 수 있었다.';
  }

  const apiKey = typeof import.meta.env.VITE_OPENAI_API_KEY === 'string'
    ? import.meta.env.VITE_OPENAI_API_KEY.trim()
    : '';
  if (!apiKey) return buildFallbackEssay(data);

  const analyticalFocus = data.selectedSong === 'handel'
    ? '가사 의미, 오페라/오라토리오 차이'
    : (data.selectedSong === 'haydn'
      ? '현악 4중주 구성, 종달새 주제 인식'
      : (data.selectedSong === 'schoenberg'
        ? '편성, 표현주의 분위기(슈프레흐슈팀메·무조성)'
        : (data.selectedSong === 'vivaldi'
          ? '장면 묘사, 폭풍우 분위기'
          : (data.selectedSong === 'chopin'
            ? '피아노 독주, A/B 구간 분위기 대비'
            : '등장인물, 줄거리, 음색/반주/맥락 이해'))));
  const prompt = `당신은 중학생의 음악 감상문 작성을 도와주는 보조 도구입니다.
다음 학습 기록(JSON)만 근거로 한국어 최종 감상문을 작성하세요.
곡/활동 맥락 참고: ${analyticalFocus}

[문체 규칙]
- 중학생이 직접 쓴 것처럼 자연스럽고 쉬운 문장으로 쓴다.
- 음악 용어를 쓰더라도 쉬운 말로 풀어 쓴다.
- 문장은 짧고 명확하게 쓴다. (한 문장에 한 가지 내용)
- "~느껴졌다", "~생각했다", "~알게 되었다", "~들렸다" 같은 1인칭 표현을 사용한다.

[구조 규칙]
- 총 3단락으로 쓴다.
- 1단락은 감각적 감상, 2단락은 분석적 감상, 3단락은 심미적 감상 내용을 담는다.
- 단락 제목(예: "감각적 감상:")은 쓰지 않는다.
- 단락 사이에는 자연스러운 연결어를 사용한다.
  예: "음악을 더 자세히 들어보니", "이렇게 분석하고 나서"
- 단순 나열이 아니라 흐름 있게 서술한다.

[내용 규칙]
- 학생이 입력한 내용만 반영한다.
- JSON에 없는 내용은 추가하거나 과장하지 않는다.
- 학생이 선택한 키워드, 색상, 분석 결과를 문장 속에 자연스럽게 녹인다.
- 분석 결과를 쓸 때는 "~라는 것을 알게 되었다" 형태를 포함해 서술한다.
- 값이 비어 있으면 그 항목은 억지로 보강하지 말고 자연스럽게 생략한다.

[오답 처리 규칙]
- 학생의 오답 응답이 확인되면 "처음에는 ~라고 생각했지만 실제로는 ~이다"처럼 쓴다.
- "틀렸다", "오답이다" 같은 직접 표현은 쓰지 않는다.
- 학생이 스스로 배움을 얻은 것처럼 자연스럽게 표현한다.
- 정답 내용은 반드시 포함한다.
- 예시 표현: "~인 줄 알았는데 ~였다", "~라고 생각했지만 분석해보니 ~라는 것을 알게 되었다", "~로 들렸는데 실제로는 ~을 표현한 것이었다"

[정답 처리 규칙]
- 정답인 내용은 "~라는 것을 알 수 있었다", "~임을 느꼈다" 형태로 서술한다.

[금지사항]
- 과도한 감탄사("정말!", "너무나!")를 쓰지 않는다.
- 어른스러운 문어체/과장된 표현을 쓰지 않는다.
- 학생이 입력하지 않은 내용을 추가하지 않는다.
- 단락 제목을 표시하지 않는다.

출력 형식:
- 감상문 본문만 출력한다.
- 정확히 3단락으로 출력하고, 단락 사이에는 빈 줄 1개를 둔다.

학습 기록(JSON):
${JSON.stringify(data, null, 2)}`;

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

    if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
    const json = await res.json();
    const text = extractTextFromResponse(json);
    return text || buildFallbackEssay(data);
  } catch (_err) {
    return buildFallbackEssay(data);
  }
}

