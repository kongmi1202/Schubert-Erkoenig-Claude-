import { requestOpenAiText } from './openaiClient';
import { formatSbAtonalStudentResponse, getStep2ResponseFlags, SB_ATONAL_CARD_GOLD } from './step2Review';

const clean = (v) => (typeof v === 'string' ? v.trim() : '');
const hasText = (v) => clean(v).length > 0;

function buildSprechEssayFallback(normalTone, sprechTone, normalChecked, sprechChecked) {
  const parts = [];
  if (normalChecked && normalTone) parts.push(`송어(일반 성악): ${normalTone}`);
  if (sprechChecked && sprechTone) parts.push(`피에로(슈프레흐슈팀메): ${sprechTone}`);
  return parts.join(' / ');
}

const hyThemeLabels = {
  o1: '음이 크게 도약한다',
  o2: '음이 순차적으로 이어진다',
  o3: '리듬이 짧게 끊어진다',
  o4: '리듬이 길게 이어진다',
  o5: '밝고 활기차다',
  o6: '부드럽고 서정적이다'
};

const HANDEL_TONE_OPTS = {
  s1: ['음이 점점 높아진다', '음이 갑자기 낮아진다', '리듬이 빨라진다', '선율이 길게 이어진다'],
  s2: ['지루함을 준다', '강조와 확신을 표현한다', '슬픔을 나타낸다', '음악이 끝나는 느낌을 준다'],
  s3: ['음악이 갑자기 끝난다', '음이 매우 낮아진다', '선율이 끝없이 이어진다', '리듬이 점점 빨라진다']
};
const HANDEL_TONE_CORRECT_IDX = { s1: 0, s2: 1, s3: 2 };

const VV_SONNET_CORRECT = {
  'vv-c1': '음이 갑자기 강하고 빠르게 터진다',
  'vv-c2': '음이 짧고 강하게 반복된다'
};

const CP_FORM_CORRECT = { 'cp-f1': 'A', 'cp-f2': 'B', 'cp-f3': "A'" };
const CP_FEATURE_CORRECT = { 'cp-f1': '빠르고 강하다', 'cp-f2': '느리고 부드럽다', 'cp-f3': '빠르고 강하다' };
const CP_RHYTHM_CORRECT = { 'cp-rh-q': '4개씩', 'cp-lh-q': '3개씩', 'cp-poly-q': '복잡하고 긴장감이 있다' };

function makeEntry(label, studentResponse, correctAnswer = null, isCorrect = null) {
  const entry = {
    activity: label,
    studentResponse: clean(studentResponse)
  };
  if (correctAnswer != null && correctAnswer !== '') {
    entry.correctAnswer = clean(correctAnswer);
    entry.isCorrect = Boolean(isCorrect);
  }
  return entry;
}

/** 2단계 활동별 학생 응답 + 정답 비교를 감상문 생성용으로 정리합니다. */
export function buildStep2EssayEntries(data) {
  const song = data.selectedSong;
  const flags = getStep2ResponseFlags(song, data);
  const entries = [];

  const push = (key, label, studentResponse, correctAnswer = null, isCorrect = null) => {
    if (!flags[key]) return;
    const text = typeof studentResponse === 'string' ? clean(studentResponse) : studentResponse;
    if (!text) return;
    entries.push(makeEntry(label, text, correctAnswer, isCorrect));
  };

  if (song === 'handel') {
    push('overviewQ1', '개요 Q1 가사 내용', data.handelLyricMeaning);
    push('overviewQ2', '개요 Q2 오페라와의 차이', data.handelOperaDiff);
    const selected = data.tonePaintingHandelState?.selected || {};
    ['s1', 's2', 's3'].forEach((id, idx) => {
      const flagKey = `toneS${idx + 1}`;
      const pick = selected[id];
      if (pick === null || pick === undefined) return;
      const studentText = HANDEL_TONE_OPTS[id][pick] || String(pick);
      const correctIdx = HANDEL_TONE_CORRECT_IDX[id];
      const correctText = HANDEL_TONE_OPTS[id][correctIdx];
      push(flagKey, `음화법 ${idx + 1}구간`, studentText, correctText, pick === correctIdx);
    });
    if (flags.melodyHarmony) {
      entries.push(makeEntry('화성음악 가락선 그리기', '가락선을 직접 그려 보았다.'));
    }
    if (flags.melodyPoly) {
      entries.push(makeEntry('다성음악 가락선 그리기', '가락선을 직접 그려 보았다.'));
    }
    return entries;
  }

  if (song === 'haydn') {
    push('overviewQ1', '개요 Q1 악기 구성', (data.analyticalCharacters || []).filter(hasText).join(', '));
    push('overviewQ2', '개요 Q2 떠오르는 동물', data.analyticalStory, '종달새', normalizeText(data.analyticalStory) === '종달새');
    const timbre = data.hyTimbreState || {};
    const hyTimbreCorrectInstr = { 'ig-1': '바이올린', 'ig-2': '비올라', 'ig-3': '첼로' };
    const hyTimbreCorrectRole = { 'ig-1': '주선율', 'ig-2': '중성부', 'ig-3': '베이스' };
    ['ig-1', 'ig-2', 'ig-3'].forEach((gridId, idx) => {
      const flagKey = `timbreIg${idx + 1}`;
      const instr = timbre.selectedByGrid?.[gridId];
      const role = timbre.roleByGrid?.[gridId];
      if (!flags[flagKey]) return;
      const studentText = `${instr || ''} · 역할 ${role || ''}`;
      const correctText = `${hyTimbreCorrectInstr[gridId]} · ${hyTimbreCorrectRole[gridId]}`;
      push(flagKey, `현악 4중주 구간${idx + 1}`, studentText, correctText,
        instr === hyTimbreCorrectInstr[gridId] && role === hyTimbreCorrectRole[gridId]);
    });
    const theme = data.hyThemeState || {};
    const theme1Correct = '음이 크게 도약한다, 리듬이 짧게 끊어진다, 밝고 활기차다';
    const theme2Correct = '음이 순차적으로 이어진다, 리듬이 길게 이어진다, 부드럽고 서정적이다';
    if (flags.theme1) {
      const labels = (theme.matchPlaced?.theme1 || []).map((id) => hyThemeLabels[id] || id).join(', ');
      entries.push(makeEntry('제1주제 특징 배치', labels, theme1Correct,
        arraysEqualAsSet(theme.matchPlaced?.theme1, ['o1', 'o3', 'o5'])));
    }
    if (flags.theme2) {
      const labels = (theme.matchPlaced?.theme2 || []).map((id) => hyThemeLabels[id] || id).join(', ');
      entries.push(makeEntry('제2주제 특징 배치', labels, theme2Correct,
        arraysEqualAsSet(theme.matchPlaced?.theme2, ['o2', 'o4', 'o6'])));
    }
    push('themeDeg', '도수 맞추기', theme.selectedDeg, '5도', normalizeText(theme.selectedDeg) === '5도');
    return entries;
  }

  if (song === 'schoenberg') {
    push('overviewQ1', '개요 Q1 편성', data.analyticalCharacters?.[0]);
    push('overviewQ2', '개요 Q2 분위기', data.analyticalStory);
    const sprech = data.sbSprechState || {};
    if (sprech.normalChecked || sprech.sprechChecked || hasText(sprech.selectedChoice)) {
      const studentText = sprech.selectedChoice
        || buildSprechEssayFallback(sprech.normalTone, sprech.sprechTone, sprech.normalChecked, sprech.sprechChecked);
      entries.push(makeEntry(
        '슈프레흐슈팀메 활동',
        studentText,
        '송어(일반 성악): 완전히 노래하기 / 피에로(슈프레흐슈팀메): 말하기에 가까워요',
        Boolean(sprech.bothCorrect)
      ));
    }
    if (flags.atonalCards || flags.atonalChoice) {
      const studentText = formatSbAtonalStudentResponse(data.sbAtonalState);
      const placed = data.sbAtonalState?.placedCards;
      const tonalOk = ['조성 음악', '편안하고 안정적', '음들이 서로 잘 어울린다.'].every((c) =>
        (placed?.tonal || []).includes(c));
      const atonalOk = ['무조성 음악', '낯설고 긴장감', '음들이 따로 논다.'].every((c) =>
        (placed?.atonal || []).includes(c));
      entries.push(makeEntry(
        '무조성 카드 배치',
        studentText,
        SB_ATONAL_CARD_GOLD,
        tonalOk && atonalOk
      ));
    }
    return entries;
  }

  if (song === 'vivaldi') {
    push('overviewQ1', '개요 Q1 장면 묘사', data.analyticalCharacters?.[0] || (data.analyticalCharacters || []).filter(hasText).join(', '));
    const sonnet = data.vvSonnetState?.selectedById || {};
    push('sonnetC1', '소네트 구간1', sonnet['vv-c1'], VV_SONNET_CORRECT['vv-c1'],
      clean(sonnet['vv-c1']) === VV_SONNET_CORRECT['vv-c1']);
    push('sonnetC2', '소네트 구간2', sonnet['vv-c2'], VV_SONNET_CORRECT['vv-c2'],
      clean(sonnet['vv-c2']) === VV_SONNET_CORRECT['vv-c2']);
    const conc = data.vvConcertoState || {};
    if (flags.concertoTally) {
      entries.push(makeEntry('협주곡 독주·총주 탐색',
        `독주 ${conc.soloCount ?? 0}회, 총주 ${conc.tuttiCount ?? 0}회 체크함`));
    }
    push('concertoDiscovery', '협주곡 발견 질문', conc.discoveryChoice, '독주와 총주가 번갈아 나온다',
      clean(conc.discoveryChoice) === '독주와 총주가 번갈아 나온다');
    return entries;
  }

  if (song === 'chopin') {
    push('overviewQ1', '개요 Q1 악기 편성', data.analyticalCharacters?.[0]);
    push('overviewQ2', '개요 Q2 분위기 변화', data.analyticalStory);
    const form = data.cpFormState || {};
    push('formF1', 'ABA 구간1 형식', form.formAnswers?.['cp-f1'], CP_FORM_CORRECT['cp-f1'],
      form.formAnswers?.['cp-f1'] === CP_FORM_CORRECT['cp-f1']);
    push('formF2', 'ABA 구간2 형식', form.formAnswers?.['cp-f2'], CP_FORM_CORRECT['cp-f2'],
      form.formAnswers?.['cp-f2'] === CP_FORM_CORRECT['cp-f2']);
    push('formF3', 'ABA 구간3 형식', form.formAnswers?.['cp-f3'], CP_FORM_CORRECT['cp-f3'],
      form.formAnswers?.['cp-f3'] === CP_FORM_CORRECT['cp-f3']);
    push('featureF1', '구간1 음악적 특징', form.featureById?.['cp-f1'], CP_FEATURE_CORRECT['cp-f1'],
      form.featureById?.['cp-f1'] === CP_FEATURE_CORRECT['cp-f1']);
    push('featureF2', '구간2 음악적 특징', form.featureById?.['cp-f2'], CP_FEATURE_CORRECT['cp-f2'],
      form.featureById?.['cp-f2'] === CP_FEATURE_CORRECT['cp-f2']);
    push('featureF3', '구간3 음악적 특징', form.featureById?.['cp-f3'], CP_FEATURE_CORRECT['cp-f3'],
      form.featureById?.['cp-f3'] === CP_FEATURE_CORRECT['cp-f3']);
    push('formDiscovery', 'ABA 발견 질문', form.discoveryChoice, '서로 다른 느낌을 대비시키기 위해',
      clean(form.discoveryChoice) === '서로 다른 느낌을 대비시키기 위해');
    const rhythm = data.cpRhythmState?.selectedByGroup || {};
    push('rhythmRh', '폴리리듬 오른손', rhythm['cp-rh-q'], CP_RHYTHM_CORRECT['cp-rh-q'],
      rhythm['cp-rh-q'] === CP_RHYTHM_CORRECT['cp-rh-q']);
    push('rhythmLh', '폴리리듬 왼손', rhythm['cp-lh-q'], CP_RHYTHM_CORRECT['cp-lh-q'],
      rhythm['cp-lh-q'] === CP_RHYTHM_CORRECT['cp-lh-q']);
    push('rhythmPoly', '폴리리듬 양손 느낌', rhythm['cp-poly-q'], CP_RHYTHM_CORRECT['cp-poly-q'],
      rhythm['cp-poly-q'] === CP_RHYTHM_CORRECT['cp-poly-q']);
    if (hasText(data.cpRhythmState?.polyDesc)) {
      entries.push(makeEntry('폴리리듬 서술', clean(data.cpRhythmState.polyDesc)));
    }
    return entries;
  }

  push('overviewQ1', '개요 Q1 등장인물', (data.analyticalCharacters || []).filter(hasText).join(', '));
  push('overviewQ2', '개요 Q2 줄거리', data.analyticalStory);
  const voiceDesign = data.voiceDesignState?.voiceDesign || {};
  const voiceAnswerKey = {
    해설자: { 음높이: '중간', 음계: '단조', 리듬꼴: '김', 음색: '두꺼움' },
    아버지: { 음높이: '낮음', 음계: '단조', 리듬꼴: '김', 음색: '두꺼움' },
    아들: { 음높이: '높음', 음계: '단조', 리듬꼴: '짧음', 음색: '얇음' },
    마왕: { 음높이: '중간', 음계: '장조', 리듬꼴: '김', 음색: '중간' }
  };
  ['해설자', '아버지', '아들', '마왕'].forEach((name) => {
    const row = voiceDesign[name] || {};
    if (!flags[`voice${name}`]) return;
    const studentText = `음높이 ${row.음높이 || '—'}, 음계 ${row.음계 || '—'}, 리듬꼴 ${row.리듬꼴 || '—'}, 음색 ${row.음색 || '—'}`;
    const ans = voiceAnswerKey[name];
    const correctText = `음높이 ${ans.음높이}, 음계 ${ans.음계}, 리듬꼴 ${ans.리듬꼴}, 음색 ${ans.음색}`;
    const isCorrect = ['음높이', '음계', '리듬꼴', '음색'].every((k) => clean(row[k]) === ans[k]);
    entries.push(makeEntry(`${name} 음색 설계`, studentText, correctText, isCorrect));
  });
  const piano = data.pianoAnalysisState || {};
  if (flags.pianoRhScene || flags.pianoLhScene) {
    entries.push(makeEntry('피아노 반주 장면 선택',
      [
        flags.pianoRhScene ? `오른손: ${piano.rhScene}` : '',
        flags.pianoLhScene ? `왼손: ${piano.lhScene}` : ''
      ].filter(Boolean).join(' · '),
      '오른손: 말발굽/질주 · 왼손: 심장 박동/긴박감'));
  }
  if (flags.pianoRhDrawing || flags.pianoLhDrawing) {
    entries.push(makeEntry('피아노 가락선 그리기', '오른손·왼손 가락선을 직접 그려 보았다.'));
  }
  return entries;
}

function normalizeText(v) {
  return clean(v).replace(/\s+/g, '');
}

function arraysEqualAsSet(a, b) {
  const sa = new Set((a || []).filter(Boolean));
  const sb = new Set((b || []).filter(Boolean));
  if (sa.size !== sb.size) return false;
  for (const x of sa) if (!sb.has(x)) return false;
  return true;
}

function countInputLevel(payload) {
  const s1 = Boolean(
    payload.stage1.keywords.length
    || payload.stage1.colors.length
    || payload.stage1.sensoryDesc
    || Object.values(payload.stage1.sensoryArtifacts || {}).some((v) => (
      Array.isArray(v) ? v.length > 0 : hasText(v)
    ))
  );
  const s2Count = payload.stage2.activities.length;
  const s3 = Boolean(payload.stage3.q1 || payload.stage3.q2 || payload.stage3.q3);
  const filledStages = (s1 ? 1 : 0) + (s2Count > 0 ? 1 : 0) + (s3 ? 1 : 0);
  let suggestedMaxChars = 120;
  let suggestedParagraphs = 1;
  if (filledStages >= 2 || s2Count >= 3) {
    suggestedMaxChars = 280;
    suggestedParagraphs = 3;
  } else if (filledStages >= 1 || s2Count >= 1) {
    suggestedMaxChars = 180;
    suggestedParagraphs = 2;
  }
  return { stage1Provided: s1, stage2ActivityCount: s2Count, stage3Provided: s3, filledStages, suggestedMaxChars, suggestedParagraphs };
}

function prepareEssayPayload(data) {
  const step2Activities = buildStep2EssayEntries(data);
  const payload = {
    student: data.student,
    selectedSong: data.selectedSong,
    stage1: {
      keywords: data.selectedKeywords || [],
      colors: data.selectedColors || [],
      sensoryDesc: clean(data.sensoryDesc),
      sensoryArtifacts: data.sensoryArtifacts
    },
    stage2: { activities: step2Activities },
    stage3: {
      q1: clean(data.q1),
      q2: clean(data.q2),
      q3: clean(data.q3),
      q2Type: clean(data.q2Type)
    }
  };
  payload.inputLevel = countInputLevel(payload);
  return payload;
}

const WRONG_ANSWER_ESSAY_EXAMPLE = `처음 마왕을 들었을 때 아버지의 목소리가 가장 높고 긴장감 있게 느껴졌다. 하지만 실제로는 마왕의 목소리가 부드럽고 낮은 음색으로 아이를 유혹하는 장면이었다는 것을 알게 되었다. 다시 들어보니 각 인물의 목소리가 전혀 다른 감정을 담고 있다는 것이 훨씬 선명하게 들렸다.`;

function formatWrongAnswerReflection(item) {
  const student = item.studentResponse;
  const correct = item.correctAnswer;
  return [
    `처음에는 ${student}라고 느껴졌다.`,
    `하지만 실제로는 ${correct}라는 것을 알게 되었다.`,
    '다시 들어보니 그 차이가 음악 속에서 훨씬 선명하게 들렸다.'
  ].join(' ');
}

function formatActivityForFallback(item) {
  if (item.isCorrect === false && item.correctAnswer) {
    return formatWrongAnswerReflection(item);
  }
  return item.studentResponse;
}

function buildFallbackEssay(data) {
  const payload = prepareEssayPayload(data);
  const { inputLevel } = payload;
  const song = data.selectedSong;
  const songTitle = {
    handel: '헨델의 <할렐루야>',
    haydn: '하이든의 <종달새>',
    schoenberg: '쇤베르크의 <달에 홀린 피에로>',
    vivaldi: '비발디의 <사계: 여름 3악장>',
    chopin: '쇼팽의 <환상 즉흥곡>'
  }[song] || '슈베르트의 <마왕>';

  const parts = [];
  const s1 = payload.stage1;
  if (inputLevel.stage1Provided) {
    const kw = s1.keywords.join(', ');
    const colors = s1.colors.join(', ');
    parts.push([
      `나는 ${songTitle}을 들으며`,
      kw ? `${kw} 같은 느낌이 들었다.` : '',
      colors ? `색은 ${colors}로 떠올랐다.` : '',
      s1.sensoryDesc || ''
    ].filter(Boolean).join(' '));
  }

  if (payload.stage2.activities.length) {
    parts.push(payload.stage2.activities.map(formatActivityForFallback).join(' '));
  }

  const s3 = payload.stage3;
  if (inputLevel.stage3Provided) {
    parts.push([
      '이렇게 분석하고 나서',
      s3.q1 || '',
      s3.q2 || '',
      s3.q3 || ''
    ].filter(Boolean).join(' '));
  } else if (!inputLevel.stage1Provided && payload.stage2.activities.length) {
    parts.push('앞으로 다른 활동도 더보면서 이 곡을 더 깊이 이해해 보고 싶다.');
  }

  if (!parts.length) {
    return '아직 입력한 감상 내용이 없어서 최종 감상문을 만들 수 없었다.';
  }
  return parts.join('\n\n').trim();
}

function normalizeEssayOutput(text) {
  return (text || '')
    .replace(/^\s*[\[\【](감각적 감상|분석적 감상|심미적 감상)[\]\】]\s*$/gim, '')
    .replace(/^\s*(감각적 감상|분석적 감상|심미적 감상)\s*[:：]\s*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function hasMeaningfulStudentInput(data) {
  return buildStep2EssayEntries(data).length > 0
    || (data.selectedKeywords || []).length > 0
    || (data.selectedColors || []).length > 0
    || hasText(data.sensoryDesc)
    || hasText(data.q1)
    || hasText(data.q2)
    || hasText(data.q3);
}

export { extractTextFromResponse } from './openaiUtils';

export async function generateFinalEssay(data) {
  if (!hasMeaningfulStudentInput(data)) {
    return '아직 입력한 감상 내용이 없어서 최종 감상문을 만들 수 없었다.\n\n먼저 각 단계에서 느낌, 분석, 생각을 한 줄씩이라도 입력한 뒤 다시 만들어 보려고 생각했다.\n\n입력을 채운 다음에는 내가 쓴 내용을 바탕으로 최종 감상문을 완성할 수 있었다.';
  }

  const payload = prepareEssayPayload(data);
  const { inputLevel } = payload;

  const systemPrompt = `당신은 중학생의 음악 감상 내용만 바탕으로 짧은 감상문을 작성하는 도우미입니다.

[분량 — 반드시 준수]
- inputLevel.suggestedMaxChars자 이내, 단락 ${inputLevel.suggestedParagraphs}개 이하
- 입력이 적으면 짧게(80~150자). 입력이 많을 때만 250자 안팎까지
- 학생이 쓰지 않은 단계·활동은 절대 지어내지 말 것
- stage1이 비어 있으면 감각적 묘사(키워드·색·느낌)를 새로 만들지 말 것
- stage3이 비어 있으면 심미적 평가 문단을 길게 쓰지 말 것

[2단계 분석 활동 — 반드시 준수]
- stage2.activities 배열에 있는 항목만 언급
- isCorrect가 true이거나 isCorrect가 없으면: studentResponse를 그대로 자연스럽게 녹일 것
  ('맞췄다', '정답이다', '옳게 짚었다' 등 정답 여부는 절대 언급하지 말 것)
- isCorrect가 false이면: 아래 세 흐름을 자연스러운 산문으로 이어 쓸 것 (기계적 나열 금지)
  ① 처음 느낌 — studentResponse를 학생의 첫인상처럼 서술
  ② "하지만 실제로는 ~라는 것을 알게 되었다" — correctAnswer 반영
  ③ "다시 들어보니 ~" — 음악을 다시 들으며 깨달은 구체적 발견
  '틀렸다', '오답', '잘못', '맞췄다' 등 직접적 평가 표현 금지
- correctAnswer는 isCorrect가 false일 때만 사용

[오답 서술 모범 예시 — 문체·흐름만 참고, 내용은 학생 데이터에 맞출 것]
${WRONG_ANSWER_ESSAY_EXAMPLE}

[문체]
- 1인칭(나는), 중학생 수준, 자연스럽게
- 단락 제목(감각적 감상 등) 금지
- 나열·과장·추가 해석 금지. 주어진 JSON 밖 내용 금지`;

  const userPrompt = `아래 JSON만 근거로 최종 감상문을 작성하세요.
최대 ${inputLevel.suggestedMaxChars}자, ${inputLevel.suggestedParagraphs}단락 이하.
- isCorrect=true: 학생 응답을 그대로 쓰되, 맞췄다는 말은 하지 마세요.
- isCorrect=false: 모범 예시처럼 「처음 느낌 → 하지만 실제로는 ~알게 되었다 → 다시 들어보니 ~」 흐름의 자연스러운 산문으로 쓰세요.
  '틀렸다', '오답', '잘못', '맞췄다' 표현은 금지입니다.

${JSON.stringify(payload, null, 2)}`;

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
