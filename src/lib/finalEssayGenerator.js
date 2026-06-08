import { requestOpenAiText } from './openaiClient';

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
  const toLine = (v) => clean(v);
  const kw = data.selectedKeywords?.length ? data.selectedKeywords.join(', ') : '';
  const colors = data.selectedColors?.length ? data.selectedColors.join(', ') : '';
  const charsRaw = isChopin
    ? clean(data.analyticalCharacters?.[0] || '')
    : (data.analyticalCharacters?.filter((v) => clean(v)).join(', ') || '');
  const analyticalQ1 = isHandel ? toLine(data.handelLyricMeaning) : toLine(charsRaw);
  const analyticalQ2 = isHandel ? toLine(data.handelOperaDiff) : toLine(data.analyticalStory);
  const q1 = toLine(data.q1);
  const q2 = toLine(data.q2);
  const q3 = toLine(data.q3);
  const sensory = toLine(data.sensoryDesc);

  const p1Parts = [
    `나는 ${songTitle}을 들으며`,
    kw ? `${kw} 같은 느낌이 들었다.` : '느낌을 기록했다.',
    colors ? `색은 ${colors}로 떠올랐다.` : '',
    sensory ? `${sensory}` : ''
  ].filter(Boolean);

  const p2Parts = [
    '음악을 더 자세히 들어보니',
    analyticalQ1 ? `${analyticalQ1}` : '',
    analyticalQ2 ? `${analyticalQ2}` : '',
    (analyticalQ1 || analyticalQ2) ? '라는 점을 알게 되었다.' : ''
  ].filter(Boolean);

  const p3Parts = [
    '이렇게 분석하고 나서',
    q1 ? `${q1}` : '',
    q2 ? `${q2}` : '',
    q3 ? `${q3}` : '',
    (q1 || q2 || q3) ? '라고 생각했다.' : '내 생각을 더 정리해 보려고 했다.'
  ].filter(Boolean);

  return `${p1Parts.join(' ')}\n\n${p2Parts.join(' ')}\n\n${p3Parts.join(' ')}`.trim();
}

function normalizeEssayOutput(text) {
  const clean = (text || '')
    .replace(/^\s*[\[\【](감각적 감상|분석적 감상|심미적 감상)[\]\】]\s*$/gim, '')
    .replace(/^\s*(감각적 감상|분석적 감상|심미적 감상)\s*[:：]\s*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return clean;
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

export { extractTextFromResponse } from './openaiUtils';

export async function generateFinalEssay(data) {
  if (!hasMeaningfulStudentInput(data)) {
    return '아직 입력한 감상 내용이 없어서 최종 감상문을 만들 수 없었다.\n\n먼저 각 단계에서 느낌, 분석, 생각을 한 줄씩이라도 입력한 뒤 다시 만들어 보려고 생각했다.\n\n입력을 채운 다음에는 내가 쓴 내용을 바탕으로 최종 감상문을 완성할 수 있었다.';
  }

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
  const systemPrompt = `당신은 중학생의 음악 감상 내용을 바탕으로 
자연스러운 감상문을 작성하는 도우미입니다.
다음 규칙을 반드시 지켜주세요.
- 1인칭(나는)으로 작성
- 중학생 수준의 자연스러운 문체
- 감각적→분석적→심미적 순서로 내용을 녹여내되
  단락 제목(감각적 감상, 분석적 감상 등)은 절대 표시하지 않음
- 전체 3단락, 200~300자 내외
- 학생이 입력하지 않은 항목은 언급하지 않음
- 오답이 있었던 경우 '~인 줄 알았는데 ~였다' 형태로 자연스럽게 녹임
- 데이터를 나열하지 말고 하나의 흐르는 글로 완성할 것`;

  const userPrompt = `다음 학습 기록(JSON)만 근거로 최종 감상문을 작성해 주세요.
곡/활동 맥락 참고: ${analyticalFocus}

학습 기록(JSON):
${JSON.stringify(data, null, 2)}`;

  try {
    const text = normalizeEssayOutput(await requestOpenAiText({
      model: 'gpt-4o-mini',
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    }));
    return text || buildFallbackEssay(data);
  } catch (_err) {
    return buildFallbackEssay(data);
  }
}

