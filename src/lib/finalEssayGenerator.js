import { requestOpenAiText } from './openaiClient';
import { getFlippedHistoryCardIds, getFlippedHistoryCardsForSong } from './historyCards';
import {
  arraysEqualAsSet,
  getOverviewReferenceQ1,
  getOverviewReferenceQ2,
  getOverviewStudentQ1,
  getOverviewStudentQ2,
  gradeOverviewQ1,
  gradeOverviewQ2,
  hasOverviewQ2,
  normalizeOverviewText
} from './overviewGrading';
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

const EMOTION_LABELS = {
  sadness: '슬픔',
  fear: '공포',
  anger: '분노',
  happiness: '기쁨',
  surprise: '놀라움',
  disgust: '혐오'
};

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

function trimEmotionAnalysis(emotionResult, emotionSummary) {
  if (!emotionResult && !hasText(emotionSummary)) return null;
  const out = {};
  if (emotionResult && typeof emotionResult === 'object') {
    const scores = Object.entries(EMOTION_LABELS)
      .map(([key, label]) => {
        const value = Number(emotionResult[key]);
        return Number.isFinite(value) ? `${label} ${value}%` : '';
      })
      .filter(Boolean);
    if (scores.length) out.scores = scores.join(', ');
  }
  if (hasText(emotionSummary)) out.summary = clean(emotionSummary);
  return Object.keys(out).length ? out : null;
}

function buildHistoryEssayEntries(data) {
  const song = data.selectedSong;
  if (!song) return [];
  const flipped = getFlippedHistoryCardIds(
    song,
    data.flippedHistoryCardsBySong,
    data.flippedCards
  );
  if (!flipped.length) return [];
  const cards = getFlippedHistoryCardsForSong(song, flipped);
  if (!cards.length) return [];
  return cards.map((card) => makeEntry(`역사 맥락: ${card.title}`, card.body));
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

  const pushOverview = (q1Label, q2Label) => {
    if (flags.overviewQ1) {
      const studentQ1 = getOverviewStudentQ1(song, data);
      if (studentQ1) {
        const gradeQ1 = gradeOverviewQ1(song, data);
        entries.push(makeEntry(
          q1Label,
          studentQ1,
          getOverviewReferenceQ1(song),
          gradeQ1 === null ? true : gradeQ1
        ));
      }
    }
    if (hasOverviewQ2(song) && flags.overviewQ2) {
      const studentQ2 = getOverviewStudentQ2(song, data);
      if (studentQ2) {
        const gradeQ2 = gradeOverviewQ2(song, data);
        entries.push(makeEntry(
          q2Label,
          studentQ2,
          getOverviewReferenceQ2(song),
          gradeQ2 === null ? true : gradeQ2
        ));
      }
    }
  };

  if (song === 'handel') {
    pushOverview('개요 Q1 가사 내용', '개요 Q2 오페라와의 차이');
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
    pushOverview('개요 Q1 악기 구성', '개요 Q2 떠오르는 동물');
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
    push('themeDeg', '도수 맞추기', theme.selectedDeg, '5도', normalizeOverviewText(theme.selectedDeg) === '5도');
    return entries;
  }

  if (song === 'schoenberg') {
    pushOverview('개요 Q1 편성', '개요 Q2 분위기');
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
    pushOverview('개요 Q1 장면 묘사', '개요 Q2 분위기');
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
    pushOverview('개요 Q1 악기 편성', '개요 Q2 분위기 변화');
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

  pushOverview('개요 Q1 등장인물', '개요 Q2 줄거리');
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

function trimSensoryArtifacts(artifacts) {
  if (!artifacts) return null;
  const out = {};
  if (artifacts.selectedActivities?.length) out.selectedActivities = artifacts.selectedActivities;
  if (artifacts.pePhoto) out.pePhoto = true;
  if (hasText(artifacts.peAnswer)) out.peAnswer = clean(artifacts.peAnswer);
  if (artifacts.scienceSelected?.length) out.scienceSelected = artifacts.scienceSelected;
  if (hasText(artifacts.scienceAnswer)) out.scienceAnswer = clean(artifacts.scienceAnswer);
  if (hasText(artifacts.mapAddress)) out.mapAddress = clean(artifacts.mapAddress);
  if (hasText(artifacts.mapAnswer)) out.mapAnswer = clean(artifacts.mapAnswer);
  if (artifacts.mathDrawing) out.mathDrawing = true;
  if (hasText(artifacts.mathAnswer)) out.mathAnswer = clean(artifacts.mathAnswer);
  return Object.keys(out).length ? out : null;
}

function trimStage1(raw) {
  const out = {};
  if (raw.keywords?.length) out.keywords = raw.keywords;
  if (raw.colors?.length) out.colors = raw.colors;
  if (hasText(raw.sensoryDesc)) out.sensoryDesc = clean(raw.sensoryDesc);
  const artifacts = trimSensoryArtifacts(raw.sensoryArtifacts);
  if (artifacts) out.sensoryArtifacts = artifacts;
  return Object.keys(out).length ? out : null;
}

function trimStage3(raw) {
  const out = {};
  if (hasText(raw.q1)) out.q1 = clean(raw.q1);
  if (hasText(raw.q2)) out.q2 = clean(raw.q2);
  if (hasText(raw.q3)) out.q3 = clean(raw.q3);
  if (hasText(raw.q2Type)) out.q2Type = clean(raw.q2Type);
  return Object.keys(out).length ? out : null;
}

function countParagraphItems(paragraphs) {
  let paragraph1ItemCount = 0;
  const sensory = paragraphs.sensory;
  if (sensory) {
    if (sensory.keywords?.length) paragraph1ItemCount += 1;
    if (sensory.colors?.length) paragraph1ItemCount += 1;
    if (sensory.sensoryDesc) paragraph1ItemCount += 1;
    if (sensory.emotionAnalysis) paragraph1ItemCount += 1;
    const a = sensory.sensoryArtifacts;
    if (a) {
      if (a.peAnswer || a.pePhoto) paragraph1ItemCount += 1;
      if (a.scienceSelected?.length || a.scienceAnswer) paragraph1ItemCount += 1;
      if (a.mapAddress || a.mapAnswer) paragraph1ItemCount += 1;
      if (a.mathAnswer || a.mathDrawing) paragraph1ItemCount += 1;
    }
  }
  const paragraph2ItemCount = paragraphs.analyticalMusicElements?.activities?.length ?? 0;
  const paragraph3ItemCount = paragraphs.analyticalHistoryContext?.activities?.length ?? 0;
  let paragraph4ItemCount = 0;
  const aesthetic = paragraphs.aesthetic;
  if (aesthetic) {
    if (aesthetic.q1) paragraph4ItemCount += 1;
    if (aesthetic.q2) paragraph4ItemCount += 1;
    if (aesthetic.q3) paragraph4ItemCount += 1;
  }
  return {
    paragraph1ItemCount,
    paragraph2ItemCount,
    paragraph3ItemCount,
    paragraph4ItemCount,
    responseCount: paragraph1ItemCount + paragraph2ItemCount + paragraph3ItemCount + paragraph4ItemCount
  };
}

function countInputLevel(paragraphs) {
  const activeParagraphs = [];
  if (paragraphs.sensory) activeParagraphs.push(1);
  if (paragraphs.analyticalMusicElements?.activities?.length) activeParagraphs.push(2);
  if (paragraphs.analyticalHistoryContext?.activities?.length) activeParagraphs.push(3);
  if (paragraphs.aesthetic) activeParagraphs.push(4);

  const counts = countParagraphItems(paragraphs);

  return {
    ...counts,
    activeParagraphs,
    activeParagraphCount: activeParagraphs.length
  };
}

function buildParagraph1Sensory(data) {
  const base = trimStage1({
    keywords: data.selectedKeywords || [],
    colors: data.selectedColors || [],
    sensoryDesc: data.sensoryDesc,
    sensoryArtifacts: data.sensoryArtifacts
  });
  const emotionAnalysis = trimEmotionAnalysis(data.emotionResult, data.emotionSummary);
  if (!base && !emotionAnalysis) return null;
  return { ...(base || {}), ...(emotionAnalysis ? { emotionAnalysis } : {}) };
}

function prepareEssayPayload(data) {
  const musicActivities = buildStep2EssayEntries(data);
  const historyActivities = buildHistoryEssayEntries(data);

  const paragraphs = {};
  const sensory = buildParagraph1Sensory(data);
  if (sensory) paragraphs.sensory = sensory;
  if (musicActivities.length) {
    paragraphs.analyticalMusicElements = { activities: musicActivities };
  }
  if (historyActivities.length) {
    paragraphs.analyticalHistoryContext = { activities: historyActivities };
  }
  const aesthetic = trimStage3({
    q1: data.q1,
    q2: data.q2,
    q3: data.q3,
    q2Type: data.q2Type
  });
  if (aesthetic) paragraphs.aesthetic = aesthetic;

  const payload = {
    student: data.student,
    selectedSong: data.selectedSong,
    paragraphs
  };
  payload.inputLevel = countInputLevel(paragraphs);
  return payload;
}

const WRONG_ANSWER_ESSAY_EXAMPLE = `처음 마왕을 들었을 때 아버지의 목소리가 가장 높고 긴장감 있게 느껴졌다. 하지만 실제로는 마왕의 목소리가 부드럽고 낮은 음색으로 아이를 유혹하는 장면이었다는 것을 알게 되었다. 이를 통해 각 인물의 목소리가 전혀 다른 감정을 담고 있다는 것을 새롭게 이해하게 되었다.`;

function formatWrongAnswerReflection(item) {
  const student = item.studentResponse;
  const correct = item.correctAnswer;
  return [
    `처음에는 ${student}라고 느껴졌다.`,
    `하지만 실제로는 ${correct}라는 것을 알게 되었다.`,
    '이를 통해 그 차이가 음악 속에서 어떤 의미인지 새롭게 이해하게 되었다.'
  ].join(' ');
}

function formatActivityForFallback(item) {
  if (item.isCorrect === false && item.correctAnswer) {
    return formatWrongAnswerReflection(item);
  }
  return item.studentResponse;
}

function buildSensoryFallbackParagraph(sensory) {
  const kw = (sensory.keywords || []).join(', ');
  const colors = (sensory.colors || []).join(', ');
  const artifactBits = [];
  const a = sensory.sensoryArtifacts;
  if (a?.scienceSelected?.length) artifactBits.push(a.scienceSelected.join(', '));
  if (a?.scienceAnswer) artifactBits.push(a.scienceAnswer);
  if (a?.peAnswer) artifactBits.push(a.peAnswer);
  if (a?.mapAnswer) artifactBits.push(a.mapAnswer);
  if (a?.mathAnswer) artifactBits.push(a.mathAnswer);
  const emotionBits = [];
  if (sensory.emotionAnalysis?.scores) emotionBits.push(sensory.emotionAnalysis.scores);
  if (sensory.emotionAnalysis?.summary) emotionBits.push(sensory.emotionAnalysis.summary);
  return [
    kw ? `${kw} 같은 느낌이 들었다.` : '',
    colors ? `색은 ${colors}로 떠올랐다.` : '',
    sensory.sensoryDesc || '',
    artifactBits.join(' '),
    emotionBits.join(' ')
  ].filter(Boolean).join(' ');
}

function buildFallbackEssay(data) {
  const payload = prepareEssayPayload(data);
  const { paragraphs } = payload;
  const parts = [];

  if (paragraphs.sensory) {
    const text = buildSensoryFallbackParagraph(paragraphs.sensory);
    if (text) parts.push(text);
  }
  if (paragraphs.analyticalMusicElements?.activities?.length) {
    parts.push(paragraphs.analyticalMusicElements.activities.map(formatActivityForFallback).join(' '));
  }
  if (paragraphs.analyticalHistoryContext?.activities?.length) {
    parts.push(paragraphs.analyticalHistoryContext.activities.map(formatActivityForFallback).join(' '));
  }
  if (paragraphs.aesthetic) {
    const { q1, q2, q3 } = paragraphs.aesthetic;
    parts.push([q1, q2, q3].filter(Boolean).join(' '));
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
  return prepareEssayPayload(data).inputLevel.responseCount > 0;
}

export { extractTextFromResponse } from './openaiUtils';

export async function generateFinalEssay(data) {
  if (!hasMeaningfulStudentInput(data)) {
    return '아직 입력한 감상 내용이 없어서 최종 감상문을 만들 수 없었다.\n\n먼저 각 단계에서 느낌, 분석, 생각을 한 줄씩이라도 입력한 뒤 다시 만들어 보려고 생각했다.\n\n입력을 채운 다음에는 내가 쓴 내용을 바탕으로 최종 감상문을 완성할 수 있었다.';
  }

  const payload = prepareEssayPayload(data);
  const { inputLevel } = payload;

  const systemPrompt = `당신은 중학생의 음악 감상 내용만 바탕으로 최종 감상문을 작성하는 도우미입니다.

[단락 구성 — 반드시 준수]
아래 순서대로, JSON.paragraphs에 있는 단락만 작성. 없는 단락은 통째로 생략.
1단락 paragraphs.sensory — 감각적 감상: 키워드·색상·서술·emotionAnalysis(감정분석)·sensoryArtifacts(연결 활동)
2단락 paragraphs.analyticalMusicElements — 분석적 감상(음악 요소): activities (개요파악·음색·가락선·음화법·형식 등)
3단락 paragraphs.analyticalHistoryContext — 분석적 감상(사회·역사 맥락): activities
  (각 activity의 studentResponse에 카드 본문이 담겨 있음. 제목·키워드만 나열하지 말고 본문 내용을 목록 형식이 아닌 자연스러운 문장으로 녹일 것)
4단락 paragraphs.aesthetic — 심미적 감상: q1·q2·q3 (있는 문항만)

[핵심]
- JSON에 없는 단락·필드·활동은 한 글자도 쓰지 말 것
- 단락 제목(「감각적 감상」 등)을 본문에 쓰지 말 것
- 각 단락 분량은 그 단락 안 항목 수에 맞게 자연스럽게 (항목 1개면 2~3문장, 많으면 길게)
- 입력이 적을 때 불필요하게 늘이지 말 것

[2단계 activities — 2·3단락 공통]
- activities 배열에 있는 항목만 다룰 것
- isCorrect가 true이거나 없으면: studentResponse를 자연스럽게 녹일 것 ('맞췄다' 등 정답 여부 언급 금지)
- isCorrect가 false이면 활동마다:
  ① 처음 느낌(studentResponse) → ② "하지만 실제로는 ~알게 되었다"(correctAnswer) → ③ "이를 통해 ~를 새롭게 이해하게 되었다"
  '틀렸다', '오답', '잘못', '맞췄다' 금지

[오답 서술 모범 예시]
${WRONG_ANSWER_ESSAY_EXAMPLE}

[문체]
- 1인칭(나는), 중학생 수준, 자연스럽게
- 주어진 JSON 밖 내용 금지`;

  const userPrompt = `아래 JSON의 paragraphs에 있는 학생 응답만으로 최종 감상문을 작성하세요.
작성할 단락: ${inputLevel.activeParagraphs.join('단락, ')}단락 (총 ${inputLevel.activeParagraphCount}개)
- 1단락 항목 ${inputLevel.paragraph1ItemCount}개, 2단락 ${inputLevel.paragraph2ItemCount}개, 3단락 ${inputLevel.paragraph3ItemCount}개, 4단락 ${inputLevel.paragraph4ItemCount}개
- 없는 단락은 생략. 있는 단락만 순서대로 이어 쓸 것.

${JSON.stringify(payload, null, 2)}`;

  try {
    const text = normalizeEssayOutput(await requestOpenAiText({
      model: 'gpt-4o',
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
