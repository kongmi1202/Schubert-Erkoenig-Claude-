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
  const prompt = `다음 학습 기록을 바탕으로 한국어 최종 감상문을 작성해줘.

절대 규칙:
1) 반드시 학습 기록(JSON)에 실제로 들어 있는 사용자 입력만 사용한다.
2) 입력에 없는 사실·평가·해석을 절대 추가하지 않는다.
3) 값이 비어 있으면 "입력 없음"으로 그대로 표기한다.
4) 모든 문장은 "~다." 형태의 포멀한 문체로 끝낸다.
5) 결과는 하나의 감상문이며, 아래 3문단을 반드시 구분해 작성한다.
   - [감각적 감상]
   - [분석적 감상] (${analyticalFocus})
   - [심미적 감상]
6) 문장 수는 각 문단 2~4문장으로 한다.
7) selectedSong이 handel이면 헨델 할렐루야, haydn이면 하이든 종달새, schoenberg이면 쇤베르크 달에 홀린 피에로, vivaldi이면 비발디 사계 여름 3악장, chopin이면 쇼팽 환상 즉흥곡, 그 외는 슈베르트 마왕 기준으로 작성한다.

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

