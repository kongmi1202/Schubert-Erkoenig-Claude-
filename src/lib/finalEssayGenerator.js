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
  const kw = data.selectedKeywords?.length ? data.selectedKeywords.join(', ') : '다양한 감정';
  const colors = data.selectedColors?.length ? data.selectedColors.join(', ') : '여러 색채';
  const charsRaw = isChopin
    ? (data.analyticalCharacters?.[0]?.trim() || '')
    : (data.analyticalCharacters?.filter(Boolean).join(', ') || '');
  const chars = isHandel
    ? (data.handelLyricMeaning?.trim() || '할렐루야 후렴을 중심으로 신의 위대함을 찬양하는 내용')
    : (charsRaw || (isHaydn
      ? '제1바이올린, 제2바이올린, 비올라, 첼로'
      : (isSchoenberg
        ? '소프라노(또는 메조소프라노), 플루트, 클라리넷, 바이올린, 첼로, 피아노'
        : (isVivaldi
          ? '바이올린 독주, 현악 그룹, 폭풍우 장면 묘사'
          : (isChopin ? '피아노 독주, 오른손 선율, 왼손 반주' : '해설자, 아버지, 아들, 마왕')))));
  const sensory = data.sensoryDesc?.trim() || (isHandel
    ? '음악은 밝고 장엄한 분위기를 강하게 전달했다.'
    : (isHaydn
      ? '음악은 맑고 경쾌하면서도 서정적인 분위기를 함께 전달했다.'
      : (isSchoenberg
        ? '음악은 불안하고 몽환적인 분위기를 강하게 전달했다.'
        : (isVivaldi
          ? '음악은 격렬하고 긴박한 폭풍우 분위기를 강하게 전달했다.'
          : (isChopin
            ? '음악은 빠르고 격렬한 흐름과 느리고 서정적인 흐름이 번갈아 전달되었다.'
            : '음악은 긴장감과 어두운 분위기를 강하게 전달했다.')))));
  const story = isHandel
    ? (data.handelOperaDiff?.trim() || '오페라와 달리 연기 없이 합창과 관현악으로 종교적 내용을 전하는 오라토리오의 특징을 확인했다.')
    : (data.analyticalStory?.trim() || (isHaydn
      ? '두 주제의 가락과 리듬꼴, 조성 대비를 통해 소나타 형식의 구조를 이해했다.'
      : (isSchoenberg
        ? '슈프레흐슈팀메와 무조성이 만들어내는 불안정한 음향이 표현주의 감정을 드러낸다고 이해했다.'
        : (isVivaldi
          ? '소네트의 구절이 셈여림과 빠르기, 음색으로 구체적으로 묘사된다는 점을 이해했다.'
          : (isChopin
            ? 'A-B-A\' 구조와 폴리리듬(오른손 4박, 왼손 3박)의 대비가 곡의 긴장과 서정을 만든다고 이해했다.'
            : '폭풍우 치는 밤, 아버지가 아들을 안고 달리는 비극적 이야기로 이해했다.')))));
  const q1 = data.q1?.trim() || '음악의 감정을 더 분명하게 이해했다';
  const q2 = data.q2?.trim() || '분석 요소가 장면의 긴박함과 인물의 감정을 더 선명하게 들리게 했다';
  const q3 = data.q3?.trim() || '오늘날에도 불안과 위로의 감정을 떠올리게 해 삶과 연결된다고 느꼈다';

  const analysisLine = isHandel
    ? `가사와 작품 형식을 ${chars}, ${story}로 정리했다.`
    : (isHaydn
      ? `현악 4중주의 역할을 ${chars}로 정리하고, ${story}`
      : (isSchoenberg
        ? `작품의 편성을 ${chars}로 정리하고, ${story}`
        : (isVivaldi
          ? `작품의 핵심 요소를 ${chars}로 정리하고, ${story}`
          : (isChopin
            ? `작품의 악기 편성과 리듬 구조를 ${chars}로 정리하고, ${story}`
            : `이 곡의 줄거리는 ${story}이며, 주요 등장인물은 ${chars}라고 정리했다.`))));
  const reflectionBridge = isHandel
    ? '음화법과 가락선, 역사적 맥락을 함께 살펴보니'
    : (isHaydn
      ? '두 주제의 가락선과 조성 차이를 살펴보니'
      : (isSchoenberg
        ? '슈프레흐슈팀메와 무조성, 역사적 맥락을 함께 살펴보니'
        : (isVivaldi
          ? '소네트와 협주곡 구조, 역사적 맥락을 함께 살펴보니'
          : (isChopin
            ? 'ABA 형식과 폴리리듬을 함께 살펴보니'
            : '인물의 음색과 피아노 반주를 분석해 보니'))));

  return `나는 ${songTitle}을 들으며 ${kw}의 감정을 느꼈고, 이를 ${colors} 색으로 표현했다. ${sensory}

분석 단계에서 ${analysisLine} ${reflectionBridge} 처음에는 막연했던 느낌이 ${q1}는 생각으로 바뀌었다.

특히 ${q2}. 그래서 나는 이 음악이 단순히 옛날 작품이 아니라 오늘의 삶에도 의미가 있는 작품이라고 본다. ${q3}.`;
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
  const apiKey = typeof import.meta.env.VITE_OPENAI_API_KEY === 'string'
    ? import.meta.env.VITE_OPENAI_API_KEY.trim()
    : '';
  if (!apiKey) return buildFallbackEssay(data);

  const prompt = `다음 학습 기록을 바탕으로 초등/중학생 눈높이의 자연스러운 한국어 감상문 3문단을 작성해줘.
- 1문단: 감각적 감상(느낌, 색, 키워드)
- 2문단: 분석적 감상(등장인물, 줄거리, 음색/반주/맥락 이해)
- 3문단: 심미적 감상(가치 판단, 오늘의 삶과 연결)
- 과장 없이 학생 1인칭 문체, 500자 내외.
- 입력에 없는 사실은 만들지 말 것.
- selectedSong이 handel이면 헨델 할렐루야, haydn이면 하이든 종달새, schoenberg이면 쇤베르크 달에 홀린 피에로, vivaldi이면 비발디 사계 여름 3악장, chopin이면 쇼팽 환상 즉흥곡, 그 외는 슈베르트 마왕 기준으로 작성할 것.

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

