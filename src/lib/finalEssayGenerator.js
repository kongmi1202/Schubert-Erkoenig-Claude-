function buildFallbackEssay(data) {
  const kw = data.selectedKeywords?.length ? data.selectedKeywords.join(', ') : '다양한 감정';
  const colors = data.selectedColors?.length ? data.selectedColors.join(', ') : '여러 색채';
  const chars = data.analyticalCharacters?.filter(Boolean).join(', ') || '해설자, 아버지, 아들, 마왕';
  const sensory = data.sensoryDesc?.trim() || '음악은 긴장감과 어두운 분위기를 강하게 전달했다.';
  const story = data.analyticalStory?.trim() || '폭풍우 치는 밤, 아버지가 아들을 안고 달리는 비극적 이야기로 이해했다.';
  const q1 = data.q1?.trim() || '음악의 감정을 더 분명하게 이해했다';
  const q2 = data.q2?.trim() || '분석 요소가 장면의 긴박함과 인물의 감정을 더 선명하게 들리게 했다';
  const q3 = data.q3?.trim() || '오늘날에도 불안과 위로의 감정을 떠올리게 해 삶과 연결된다고 느꼈다';

  return `나는 슈베르트의 <마왕>을 들으며 ${kw}의 감정을 느꼈고, 이를 ${colors} 색으로 표현했다. ${sensory}

이 곡의 줄거리는 ${story}이며, 주요 등장인물은 ${chars}라고 정리했다. 인물의 음색과 피아노 반주를 분석해 보니 처음에는 막연했던 느낌이 ${q1}는 생각으로 바뀌었다.

특히 ${q2}. 그래서 나는 이 음악이 단순히 옛날 작품이 아니라 오늘의 삶에도 의미가 있는 작품이라고 본다. ${q3}.`;
}

function extractTextFromResponse(json) {
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
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) return buildFallbackEssay(data);

  const prompt = `다음 학습 기록을 바탕으로 초등/중학생 눈높이의 자연스러운 한국어 감상문 3문단을 작성해줘.
- 1문단: 감각적 감상(느낌, 색, 키워드)
- 2문단: 분석적 감상(등장인물, 줄거리, 음색/반주/맥락 이해)
- 3문단: 심미적 감상(가치 판단, 오늘의 삶과 연결)
- 과장 없이 학생 1인칭 문체, 500자 내외.
- 입력에 없는 사실은 만들지 말 것.

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

