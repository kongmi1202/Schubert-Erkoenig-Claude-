import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { generateFinalEssay } from '../../lib/finalEssayGenerator';
import { SONG_CONFIG } from '../../lib/songConfig';
import {
  formatSbAtonalStudentResponse,
  getStep2ResponseFlags,
  hasAnyStep2Response,
  SB_ATONAL_CARD_GOLD
} from '../../lib/step2Review';
import { gradeOverviewQ1, gradeOverviewQ2 } from '../../lib/overviewGrading';
import {
  formatPianoSceneCorrectAnswer,
  gradePianoLhScene,
  gradePianoRhScene
} from '../../lib/pianoSceneAnswers';
import { gradeMawangVoiceDesignRow } from '../../lib/voiceDesignAnswers';

const colorMap = {
  '짙은 보라': '#4c1d95',
  '어두운 붉은색': '#991b1b',
  '짙은 남색': '#1e3a8a',
  검정: '#374151',
  '어두운 황토': '#a16207',
  '어두운 초록': '#166534',
  갈색: '#92400e',
  자주: '#86198f'
};

const HY_THEME_MATCH_ID_TO_LABEL = {
  o1: '음이 크게 도약한다',
  o2: '음이 순차적으로 이어진다',
  o3: '리듬이 짧게 끊어진다',
  o4: '리듬이 길게 이어진다',
  o5: '밝고 활기차다',
  o6: '부드럽고 서정적이다'
};

function formatHyThemePlacedFinal(ids) {
  if (!Array.isArray(ids) || !ids.length) return '없음';
  return ids.map((id) => HY_THEME_MATCH_ID_TO_LABEL[id] || id).join(', ');
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function includesAnyToken(value, tokens) {
  const text = normalizeText(value);
  return tokens.some((token) => text.includes(normalizeText(token)));
}

function hasAllItems(actual, expected) {
  const actualSet = new Set((actual || []).filter(Boolean));
  return expected.every((item) => actualSet.has(item));
}

function arraysEqualAsSet(actual, expected) {
  if (!Array.isArray(actual) || actual.length !== expected.length) return false;
  return hasAllItems(actual, expected);
}

/**
 * 전체 필수 문항을 모수(100%)로 둔다.
 * 미응답·오답은 모두 오답. 모든 문항에 응답했고 정답률 90%↑이면 상,
 * 60~89% 중, 60% 미만 하. (미응답이 하나라도 있으면 상 불가)
 */
function gradeFromFullSetAccuracy(correctCount, totalCount, answeredCount) {
  if (!totalCount) return '하';
  const ratio = (correctCount / totalCount) * 100;
  const allAnswered = answeredCount >= totalCount;
  if (allAnswered && ratio >= 90) return '상';
  if (ratio >= 60) return '중';
  return '하';
}

function summarizeChecks(checks) {
  const total = checks.length;
  const answered = checks.filter((c) => c.answered).length;
  const correct = checks.filter((c) => c.correct).length;
  return {
    total,
    answered,
    correct,
    grade: gradeFromFullSetAccuracy(correct, total, answered)
  };
}

/** answered + isCorrect(객관) / 서술형은 answered면 정답 처리 */
function pushCheck(checks, answered, isCorrect = answered) {
  const didAnswer = Boolean(answered);
  checks.push({
    answered: didAnswer,
    correct: didAnswer && Boolean(isCorrect)
  });
}

function resolveMawangVoiceTargets(voiceDesignState, step2Flags) {
  const selected = (voiceDesignState?.selectedChars || []).filter(Boolean);
  if (selected.length >= 2) return selected.slice(0, 2);
  const filled = ['해설자', '아버지', '아들', '마왕'].filter((name) => step2Flags[`voice${name}`]);
  const pool = [...new Set([...selected, ...filled, '해설자', '아버지', '아들', '마왕'])];
  return pool.slice(0, 2);
}

function FinalCard({ go }) {
  const {
    student, selectedKeywords, selectedColors, sensoryDesc, sensoryArtifacts,
    emotionResult, emotionSummary, flippedCards, flippedHistoryCardsBySong,
    selectedSong, analyticalCharacters, analyticalStory, handelLyricMeaning, handelOperaDiff, q2, q3, q2Type,
    tonePaintingHandelState, melodyCanvasHandelState, hyTimbreState, hyThemeState,
    vvSonnetState, vvConcertoState, cpFormState, cpRhythmState, sbSprechState, sbAtonalState,
    voiceDesignState, pianoAnalysisState
  } = useAppStore();
  const isHandel = selectedSong === 'handel';
  const isHaydn = selectedSong === 'haydn';
  const isSchoenberg = selectedSong === 'schoenberg';
  const isVivaldi = selectedSong === 'vivaldi';
  const isChopin = selectedSong === 'chopin';
  const isMawang = !isHandel && !isHaydn && !isSchoenberg && !isVivaldi && !isChopin;
  const songSubtitle = isHandel ? 'Hallelujah Chorus, Handel 1741' : (isHaydn ? 'String Quartet No.67, Haydn 1790' : (isSchoenberg ? 'Pierrot Lunaire, Schoenberg 1912' : (isVivaldi ? 'Summer, Vivaldi 1725' : (isChopin ? 'Fantaisie-Impromptu Op.66, Chopin 1835' : 'Der Erlkönig, Schubert 1815'))));
  const songLabel = selectedSong === 'handel'
    ? '할렐루야 (헨델)'
    : (selectedSong === 'mawang'
      ? '마왕 (슈베르트)'
      : (selectedSong === 'haydn'
        ? '종달새 (하이든)'
        : (selectedSong === 'vivaldi'
          ? '여름 (비발디)'
        : (selectedSong === 'chopin'
          ? '환상 즉흥곡 (쇼팽)'
        : (selectedSong === 'schoenberg'
          ? '달에 홀린 피에로 (쇤베르크)'
          : '—')))));
  const analyticalQ1Label = isHandel
    ? '1 가사 내용'
    : (isHaydn ? '1 악기 구성' : (isSchoenberg ? '1 편성' : (isVivaldi ? '1 장면 묘사' : (isChopin ? '1 악기 편성' : '1 등장인물'))));
  const analyticalQ2Label = isHandel
    ? '2 오페라와의 차이'
    : (isHaydn ? '2 떠오르는 동물' : (isSchoenberg ? '2 분위기' : (isVivaldi ? '2 분위기' : (isChopin ? '2 분위기 변화' : '2 줄거리'))));
  const showAnalyticalQ2 = !isVivaldi;
  const analyticalAnswerCharacters = ['해설자', '아버지', '아들', '마왕'];
  const analyticalAnswerStory = '폭풍우 치는 밤, 아버지가 아픈 아들을 가슴에 안고 집으로 달려간다. 아들은 마왕의 유혹을 두려워하지만 아버지는 이를 부정한다. 집에 도착했을 때 아들은 이미 죽어 있다.';
  const handelAnswerQ1 = '성경(요한계시록)을 바탕으로 한 종교적 내용이에요. 할렐루야, King of Kings 등 신의 위대함을 찬양하는 내용이 중심입니다.';
  const handelAnswerQ2 = '오페라와 달리 오라토리오는 무대 연기·의상 없이 합창과 관현악으로 종교적 내용을 전달해요.';
  const haydnAnswerQ1 = ['제1바이올린', '제2바이올린', '비올라', '첼로'];
  const haydnAnswerQ2 = '종달새';
  const schoenbergAnswerQ1 = ['소프라노(또는 메조소프라노)', '플루트', '클라리넷', '바이올린', '첼로', '피아노'];
  const schoenbergAnswerQ2 = '불안하고 몽환적이며 신비로운 분위기예요. 달빛 속 도취감과 공포가 뒤섞인 표현주의 특유의 감성을 담고 있어요.';
  const vivaldiAnswerQ1 = ['여름 폭풍우 장면', '지친 목동과 양떼', '갑작스러운 번개와 천둥', '우박으로 이삭이 쓸려감'];
  const vivaldiAnswerQ2 = '격렬하고 긴박한 폭풍우의 분위기예요. 빠른 템포와 강한 셈여림으로 폭풍우의 긴박함과 공포가 생생하게 전달돼요.';
  const chopinAnswerQ1 = '피아노 독주예요. 다른 악기 없이 피아노 한 대가 선율과 반주를 모두 표현해요.';
  const chopinAnswerQ2 = '빠르고 격렬한 A구간과 느리고 서정적인 B구간이 대비되어, 곡의 분위기가 극적으로 바뀌어요.';
  const handelToneSegments = [
    { id: 's1', title: '3-1.', answer: '음이 점점 높아진다' },
    { id: 's2', title: '3-2.', answer: '강조와 확신을 표현한다' },
    { id: 's3', title: '3-3.', answer: '선율이 끝없이 이어진다' }
  ];
  const handelToneOptionsById = {
    s1: ['음이 점점 높아진다', '음이 갑자기 낮아진다', '리듬이 빨라진다', '선율이 길게 이어진다'],
    s2: ['지루함을 준다', '강조와 확신을 표현한다', '슬픔을 나타낸다', '음악이 끝나는 느낌을 준다'],
    s3: ['음악이 갑자기 끝난다', '음이 매우 낮아진다', '선율이 끝없이 이어진다', '리듬이 점점 빨라진다']
  };
  const hyTimbreCorrectInstr = { 'ig-1': '바이올린', 'ig-2': '비올라', 'ig-3': '첼로' };
  const hyTimbreCorrectRole = { 'ig-1': '주선율', 'ig-2': '중성부', 'ig-3': '베이스' };
  const vvSonnetCorrect = { 'vv-c1': '음이 갑자기 강하고 빠르게 터진다', 'vv-c2': '음이 짧고 강하게 반복된다' };
  const cpFormCorrect = { 'cp-f1': 'A', 'cp-f2': 'B', 'cp-f3': "A'" };
  const cpFeatureCorrect = { 'cp-f1': '빠르고 강하다', 'cp-f2': '느리고 부드럽다', 'cp-f3': '빠르고 강하다' };
  const cpRhythmCorrect = { 'cp-rh-q': '4개씩', 'cp-lh-q': '3개씩', 'cp-poly-q': '오른손 4박과 왼손 3박이 동시에 진행된다' };
  const step2State = useMemo(() => ({
    analyticalCharacters,
    analyticalStory,
    handelLyricMeaning,
    handelOperaDiff,
    tonePaintingHandelState,
    melodyCanvasHandelState,
    hyTimbreState,
    hyThemeState,
    vvSonnetState,
    vvConcertoState,
    cpFormState,
    cpRhythmState,
    sbSprechState,
    sbAtonalState,
    voiceDesignState,
    pianoAnalysisState
  }), [
    analyticalCharacters, analyticalStory, handelLyricMeaning, handelOperaDiff,
    tonePaintingHandelState, melodyCanvasHandelState, hyTimbreState, hyThemeState,
    vvSonnetState, vvConcertoState, cpFormState, cpRhythmState, sbSprechState, sbAtonalState,
    voiceDesignState, pianoAnalysisState
  ]);
  const step2Flags = useMemo(
    () => getStep2ResponseFlags(selectedSong, step2State),
    [selectedSong, step2State]
  );
  const hasStep2Content = useMemo(
    () => hasAnyStep2Response(selectedSong, step2State),
    [selectedSong, step2State]
  );
  const studentLine = useMemo(() => `${student?.id || ''} ${student?.name || ''}`.trim(), [student]);
  const essayTitle = (SONG_CONFIG[selectedSong] || SONG_CONFIG.mawang)?.essayTitle || "슈베르트 '마왕' 감상문";
  const finalEssayText = useAppStore((s) => s.finalEssayText);
  const isGeneratingEssay = useAppStore((s) => s.isGeneratingEssay);
  const setFinalEssayText = useAppStore((s) => s.setFinalEssayText);
  const setIsGeneratingEssay = useAppStore((s) => s.setIsGeneratingEssay);
  const essayParagraphs = useMemo(
    () => (finalEssayText ? finalEssayText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) : []),
    [finalEssayText]
  );
  const [summaryCollapsed, setSummaryCollapsed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const apply = () => setSummaryCollapsed(mq.matches);
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, []);
  const evaluation = useMemo(() => {
    const t = (v) => (v || '').trim();

    const analyticalQ1 = isHandel ? handelLyricMeaning : analyticalCharacters.filter((c) => t(c).length > 0).join(', ');
    const analyticalQ2 = isHandel ? handelOperaDiff : analyticalStory;

    const hasAnyInput = (
      selectedKeywords.length > 0
      || selectedColors.length > 0
      || t(sensoryDesc).length > 0
      || t(analyticalQ1).length > 0
      || t(analyticalQ2).length > 0
      || hasAnyStep2Response(selectedSong, step2State)
      || t(q2).length > 0
      || t(q3).length > 0
      || Boolean(q2Type)
    );

    if (!hasAnyInput) {
      return {
        ungraded: true,
        items: [],
        feedback: '미채점 상태입니다. 1~3단계 입력을 완료하면 단계별 등급과 코멘트가 표시됩니다.'
      };
    }

    // —— 1단계: 필수 문항(키워드/색/서술) 전부 모수 ——
    const stage1Checks = [];
    pushCheck(stage1Checks, selectedKeywords.length > 0);
    pushCheck(stage1Checks, selectedColors.length >= 2);
    pushCheck(stage1Checks, t(sensoryDesc).length > 0);
    const stage1Summary = summarizeChecks(stage1Checks);
    const gradeStage1 = stage1Summary.grade;

    // —— 2단계: 곡별 필수 문항 전부 모수 (미응답·오답=오답) ——
    const stage2Checks = [];
    const overviewState = {
      analyticalCharacters,
      analyticalStory,
      handelLyricMeaning,
      handelOperaDiff
    };

    if (isHandel) {
      pushCheck(stage2Checks, step2Flags.overviewQ1, gradeOverviewQ1('handel', overviewState));
      pushCheck(stage2Checks, step2Flags.overviewQ2, gradeOverviewQ2('handel', overviewState));
      pushCheck(stage2Checks, step2Flags.toneS1, (tonePaintingHandelState?.selected?.s1 ?? null) === 0);
      pushCheck(stage2Checks, step2Flags.toneS2, (tonePaintingHandelState?.selected?.s2 ?? null) === 1);
      pushCheck(stage2Checks, step2Flags.toneS3, (tonePaintingHandelState?.selected?.s3 ?? null) === 2);
      pushCheck(stage2Checks, step2Flags.melodyHarmony);
      pushCheck(stage2Checks, step2Flags.melodyPoly);
    } else if (isHaydn) {
      pushCheck(stage2Checks, step2Flags.overviewQ1, gradeOverviewQ1('haydn', overviewState));
      pushCheck(stage2Checks, step2Flags.overviewQ2, gradeOverviewQ2('haydn', overviewState));
      pushCheck(stage2Checks, step2Flags.timbreIg1, hyTimbreState?.selectedByGrid?.['ig-1'] === hyTimbreCorrectInstr['ig-1'] && hyTimbreState?.roleByGrid?.['ig-1'] === hyTimbreCorrectRole['ig-1']);
      pushCheck(stage2Checks, step2Flags.timbreIg2, hyTimbreState?.selectedByGrid?.['ig-2'] === hyTimbreCorrectInstr['ig-2'] && hyTimbreState?.roleByGrid?.['ig-2'] === hyTimbreCorrectRole['ig-2']);
      pushCheck(stage2Checks, step2Flags.timbreIg3, hyTimbreState?.selectedByGrid?.['ig-3'] === hyTimbreCorrectInstr['ig-3'] && hyTimbreState?.roleByGrid?.['ig-3'] === hyTimbreCorrectRole['ig-3']);
      pushCheck(stage2Checks, step2Flags.theme1, arraysEqualAsSet(hyThemeState?.matchPlaced?.theme1 || [], ['o1', 'o3', 'o5']));
      pushCheck(stage2Checks, step2Flags.theme2, arraysEqualAsSet(hyThemeState?.matchPlaced?.theme2 || [], ['o2', 'o4', 'o6']));
      pushCheck(stage2Checks, step2Flags.themeDeg, normalizeText(hyThemeState?.selectedDeg) === '5도');
    } else if (isVivaldi) {
      pushCheck(stage2Checks, step2Flags.overviewQ1, gradeOverviewQ1('vivaldi', overviewState));
      pushCheck(stage2Checks, step2Flags.sonnetC1, vvSonnetState?.selectedById?.['vv-c1'] === vvSonnetCorrect['vv-c1']);
      pushCheck(stage2Checks, step2Flags.sonnetC2, vvSonnetState?.selectedById?.['vv-c2'] === vvSonnetCorrect['vv-c2']);
      pushCheck(stage2Checks, step2Flags.concertoDiscovery, vvConcertoState?.discoveryChoice === '독주와 총주가 번갈아 나온다');
    } else if (isChopin) {
      pushCheck(stage2Checks, step2Flags.overviewQ1, gradeOverviewQ1('chopin', overviewState));
      pushCheck(stage2Checks, step2Flags.overviewQ2, gradeOverviewQ2('chopin', overviewState));
      pushCheck(stage2Checks, step2Flags.formF1, cpFormState?.formAnswers?.['cp-f1'] === cpFormCorrect['cp-f1']);
      pushCheck(stage2Checks, step2Flags.formF2, cpFormState?.formAnswers?.['cp-f2'] === cpFormCorrect['cp-f2']);
      pushCheck(stage2Checks, step2Flags.formF3, cpFormState?.formAnswers?.['cp-f3'] === cpFormCorrect['cp-f3']);
      pushCheck(stage2Checks, step2Flags.featureF1, cpFormState?.featureById?.['cp-f1'] === cpFeatureCorrect['cp-f1']);
      pushCheck(stage2Checks, step2Flags.featureF2, cpFormState?.featureById?.['cp-f2'] === cpFeatureCorrect['cp-f2']);
      pushCheck(stage2Checks, step2Flags.featureF3, cpFormState?.featureById?.['cp-f3'] === cpFeatureCorrect['cp-f3']);
      pushCheck(stage2Checks, step2Flags.formDiscovery, cpFormState?.discoveryChoice === '서로 다른 느낌을 대비시키기 위해');
      pushCheck(stage2Checks, step2Flags.rhythmRh, cpRhythmState?.selectedByGroup?.['cp-rh-q'] === cpRhythmCorrect['cp-rh-q']);
      pushCheck(stage2Checks, step2Flags.rhythmLh, cpRhythmState?.selectedByGroup?.['cp-lh-q'] === cpRhythmCorrect['cp-lh-q']);
      pushCheck(stage2Checks, step2Flags.rhythmPoly, cpRhythmState?.selectedByGroup?.['cp-poly-q'] === cpRhythmCorrect['cp-poly-q']);
    } else if (isSchoenberg) {
      pushCheck(stage2Checks, step2Flags.overviewQ1, gradeOverviewQ1('schoenberg', overviewState));
      pushCheck(stage2Checks, step2Flags.overviewQ2, gradeOverviewQ2('schoenberg', overviewState));
      pushCheck(stage2Checks, step2Flags.sprech, sbSprechState?.bothCorrect === true || Boolean(sbSprechState?.selectedChoice));
      pushCheck(
        stage2Checks,
        step2Flags.atonalCards || step2Flags.atonalChoice,
        arraysEqualAsSet(sbAtonalState?.placedCards?.tonal || [], ['조성 음악', '편안하고 안정적', '음들이 서로 잘 어울린다.'])
          && arraysEqualAsSet(sbAtonalState?.placedCards?.atonal || [], ['무조성 음악', '낯설고 긴장감', '음들이 따로 논다.'])
      );
    } else {
      pushCheck(stage2Checks, step2Flags.overviewQ1, gradeOverviewQ1('mawang', overviewState));
      pushCheck(stage2Checks, step2Flags.overviewQ2, gradeOverviewQ2('mawang', overviewState));
      const voiceDesign = voiceDesignState?.voiceDesign || {};
      resolveMawangVoiceTargets(voiceDesignState, step2Flags).forEach((name) => {
        pushCheck(stage2Checks, step2Flags[`voice${name}`], gradeMawangVoiceDesignRow(name, voiceDesign[name]));
      });
      pushCheck(stage2Checks, step2Flags.pianoRhScene, gradePianoRhScene(pianoAnalysisState?.rhScene));
      pushCheck(stage2Checks, step2Flags.pianoLhScene, gradePianoLhScene(pianoAnalysisState?.lhScene));
    }

    const stage2Summary = summarizeChecks(stage2Checks);
    const gradeStage2 = stage2Summary.grade;

    // —— 3단계: Q1~Q2 전부 모수 (서술형: 응답=정답, 미응답=오답) ——
    const stage3Checks = [];
    pushCheck(stage3Checks, Boolean(q2Type) && t(q2).length > 0);
    pushCheck(stage3Checks, t(q3).length > 0);
    const stage3Summary = summarizeChecks(stage3Checks);
    const gradeStage3 = stage3Summary.grade;

    const stageComment = (grade, stage) => {
      if (stage === 1) {
        if (grade === '상') return '필수 문항을 모두 응답했고, 키워드·색·서술이 잘 채워졌습니다.';
        if (grade === '중') return '일부 문항이 비어 있거나 부족합니다. 키워드·색·서술을 보완해 보세요.';
        return '감각적 감상 필수 문항 응답이 많이 비어 있습니다. 키워드/색/서술을 채워 보세요.';
      }
      if (stage === 2) {
        if (grade === '상') return '모든 분석 문항에 응답했고 정답률이 높습니다.';
        if (grade === '중') return '일부 미응답·오답이 있습니다. 빠진 문항과 틀린 답을 점검해 보세요.';
        return '분석 문항의 미응답·오답이 많습니다. 2단계 활동을 다시 확인해 보세요.';
      }
      if (grade === '상') return '심미적 감상 Q1~Q2를 모두 작성했습니다.';
      if (grade === '중') return '일부 문항이 비어 있습니다. Q1~Q2를 모두 쓰면 상이 됩니다.';
      return '심미적 감상 문항이 많이 비어 있습니다. Q1~Q2를 채워 보세요.';
    };

    const items = [
      { label: '1단계 감각적 감상', grade: gradeStage1, comment: stageComment(gradeStage1, 1) },
      { label: '2단계 분석적 감상', grade: gradeStage2, comment: stageComment(gradeStage2, 2) },
      { label: '3단계 심미적 감상', grade: gradeStage3, comment: stageComment(gradeStage3, 3) }
    ];
    const stageLabelMap = {
      '1단계 감각적 감상': '감각적 감상',
      '2단계 분석적 감상': '분석적 감상',
      '3단계 심미적 감상': '심미적 감상'
    };
    const highItems = items.filter((item) => item.grade === '상');
    const nonHighItems = items.filter((item) => item.grade !== '상');

    let feedback = '';
    if (highItems.length === 3) {
      feedback = '세 단계 모두 훌륭하게 완성했어요!';
    } else if (highItems.length === 2) {
      feedback = `${stageLabelMap[nonHighItems[0].label]} 부분을 조금 더 채워보면 완벽해요!`;
    } else if (highItems.length === 1) {
      feedback = `${stageLabelMap[highItems[0].label]}은 잘 됐어요. 나머지 단계도 더 자세히 써볼까요?`;
    } else {
      feedback = '각 단계에서 더 자세히 입력할수록 감상 실력이 쑥쑥 늘어요. 다시 도전해보세요!';
    }

    return { ungraded: false, items, feedback };
  }, [
    selectedKeywords, selectedColors, sensoryDesc, sensoryArtifacts,
    isHandel, isHaydn, isSchoenberg, isVivaldi, isChopin, selectedSong,
    handelLyricMeaning, handelOperaDiff, analyticalCharacters, analyticalStory,
    tonePaintingHandelState, hyTimbreState, hyThemeState, vvSonnetState, vvConcertoState,
    cpFormState, cpRhythmState, sbSprechState, sbAtonalState, voiceDesignState, pianoAnalysisState,
    step2Flags, step2State, q2, q3, q2Type
  ]);

  const onGenerateEssay = async () => {
    setIsGeneratingEssay(true);
    const text = await generateFinalEssay({
      student,
      selectedSong,
      selectedKeywords,
      selectedColors,
      sensoryDesc,
      sensoryArtifacts,
      emotionResult,
      emotionSummary,
      flippedCards,
      flippedHistoryCardsBySong,
      analyticalCharacters,
      analyticalStory,
      handelLyricMeaning,
      handelOperaDiff,
      tonePaintingHandelState,
      melodyCanvasHandelState,
      hyTimbreState,
      hyThemeState,
      vvSonnetState,
      vvConcertoState,
      cpFormState,
      cpRhythmState,
      sbSprechState,
      sbAtonalState,
      voiceDesignState,
      pianoAnalysisState,
      q2,
      q3,
      q2Type
    });
    setFinalEssayText(text);
    setIsGeneratingEssay(false);
  };
  const stageGrades = useMemo(() => {
    if (evaluation.ungraded) {
      return {
        stage1: '미채점',
        stage2: '미채점',
        stage3: '미채점'
      };
    }
    const gradeByLabel = Object.fromEntries(evaluation.items.map((item) => [item.label, item.grade]));
    return {
      stage1: gradeByLabel['1단계 감각적 감상'] || '미채점',
      stage2: gradeByLabel['2단계 분석적 감상'] || '미채점',
      stage3: gradeByLabel['3단계 심미적 감상'] || '미채점'
    };
  }, [evaluation]);
  const gradeBadgeBaseStyle = {
    marginLeft: 8,
    padding: '2px 8px',
    borderRadius: 999,
    fontSize: 11
  };
  const getGradeBadgeStyle = (grade) => {
    if (grade === '상') {
      return {
        ...gradeBadgeBaseStyle,
        border: '1px solid rgba(34,197,94,0.55)',
        background: 'rgba(34,197,94,0.16)',
        color: '#86efac'
      };
    }
    if (grade === '중') {
      return {
        ...gradeBadgeBaseStyle,
        border: '1px solid rgba(251,191,36,0.55)',
        background: 'rgba(251,191,36,0.16)',
        color: '#fcd34d'
      };
    }
    if (grade === '하') {
      return {
        ...gradeBadgeBaseStyle,
        border: '1px solid rgba(248,113,113,0.55)',
        background: 'rgba(248,113,113,0.16)',
        color: '#fca5a5'
      };
    }
    return {
      ...gradeBadgeBaseStyle,
      border: '1px solid var(--border2)',
      background: 'var(--surface2)',
      color: 'var(--purple-light)'
    };
  };

  return (
    <div className={`stage-workspace ${summaryCollapsed ? 'listening-collapsed' : ''}`}>
      <aside className={`listening-panel ${summaryCollapsed ? 'is-collapsed' : ''}`} aria-label="나의 감상 여정 되돌아보기">
        <button
          type="button"
          className="listening-panel-toggle"
          onClick={() => setSummaryCollapsed((v) => !v)}
          aria-expanded={!summaryCollapsed}
        >
          <span className="listening-panel-toggle-title">
            {summaryCollapsed ? '나의 감상 여정 되돌아보기 펼치기' : '나의 감상 여정 되돌아보기'}
          </span>
          <span className="listening-panel-toggle-chevron" aria-hidden="true">
            {summaryCollapsed ? '▼' : '▲'}
          </span>
        </button>
        <div className="listening-panel-body final-summary-panel-body">
        <div className="summary-card final-summary-card">
          <div className="summary-ey">✦ 나의 감상 여정 되돌아보기 · {songSubtitle}</div>
          <div className="summary-row"><div className="summary-key">학생</div><div className="summary-val">{studentLine || '—'}</div></div>
          <div className="summary-row"><div className="summary-key">악곡</div><div className="summary-val">{songLabel}</div></div>
          <div className="summary-div"></div>
          <div className="summary-ey">① 감각적 감상 <span style={getGradeBadgeStyle(stageGrades.stage1)}>등급 {stageGrades.stage1}</span></div>
          <div className="chip-row">{selectedKeywords.length ? selectedKeywords.map((k) => <span key={k} className="review-chip">{k}</span>) : <span className="review-empty">키워드 없음</span>}</div>
          <div className="swatch-row">{selectedColors.length ? selectedColors.map((c) => <span key={c} className="review-swatch" title={c} style={{ background: colorMap[c] || '#555' }} />) : <span className="review-empty">색상 없음</span>}</div>
          <div className="fb show info">{sensoryDesc || '서술 없음'}</div>

          <div className="summary-div"></div>
          <div className="summary-ey">② 분석적 감상</div>
          {!hasStep2Content ? (
            <div className="fb show info" style={{ marginBottom: 12 }}>
              2단계에서 완료한 활동이 있으면 여기에 표시됩니다.
            </div>
          ) : null}
          {hasStep2Content ? (
            <>
          {step2Flags.overviewQ1 ? (
          <div className="cmp-mini-grid">
            <div>
              <div className="small-note">{analyticalQ1Label} · 내 답변</div>
              {isHandel ? (
                <div className="fb show info">{handelLyricMeaning || '없음'}</div>
              ) : isHaydn ? (
                <div className="chip-row">{analyticalCharacters.filter(Boolean).length ? analyticalCharacters.filter(Boolean).map((c) => <span key={c} className="review-chip">{c}</span>) : <span className="review-empty">없음</span>}</div>
              ) : isSchoenberg ? (
                <div className="chip-row">{analyticalCharacters.filter(Boolean).length ? analyticalCharacters.filter(Boolean).map((c) => <span key={c} className="review-chip">{c}</span>) : <span className="review-empty">없음</span>}</div>
              ) : isVivaldi ? (
                <div className="chip-row">{analyticalCharacters.filter(Boolean).length ? analyticalCharacters.filter(Boolean).map((c) => <span key={c} className="review-chip">{c}</span>) : <span className="review-empty">없음</span>}</div>
              ) : isChopin ? (
                <div className="fb show info">{analyticalCharacters?.[0] || '없음'}</div>
              ) : (
                <div className="chip-row">{analyticalCharacters.filter(Boolean).length ? analyticalCharacters.filter(Boolean).map((c) => <span key={c} className="review-chip">{c}</span>) : <span className="review-empty">없음</span>}</div>
              )}
            </div>
            <div>
              <div className="small-note">{analyticalQ1Label} · 정답 <span style={getGradeBadgeStyle(stageGrades.stage2)}>등급 {stageGrades.stage2}</span></div>
              {isHandel ? (
                <div className="fb show gold">{handelAnswerQ1}</div>
              ) : isHaydn ? (
                <div className="chip-row">{haydnAnswerQ1.map((c) => <span key={c} className="review-chip answer">{c}</span>)}</div>
              ) : isSchoenberg ? (
                <div className="chip-row">{schoenbergAnswerQ1.map((c) => <span key={c} className="review-chip answer">{c}</span>)}</div>
              ) : isVivaldi ? (
                <div className="chip-row">{vivaldiAnswerQ1.map((c) => <span key={c} className="review-chip answer">{c}</span>)}</div>
              ) : isChopin ? (
                <div className="fb show gold">{chopinAnswerQ1}</div>
              ) : (
                <div className="chip-row">{analyticalAnswerCharacters.map((c) => <span key={c} className="review-chip answer">{c}</span>)}</div>
              )}
            </div>
          </div>
          ) : null}
          {showAnalyticalQ2 && step2Flags.overviewQ2 ? (
            <div className="cmp-mini-grid">
              <div><div className="small-note">{analyticalQ2Label} · 내 답변</div><div className="fb show info">{isHandel ? (handelOperaDiff || '없음') : (analyticalStory || '없음')}</div></div>
              <div><div className="small-note">{analyticalQ2Label} · 정답</div><div className="fb show gold">{isHandel ? handelAnswerQ2 : (isHaydn ? haydnAnswerQ2 : (isSchoenberg ? schoenbergAnswerQ2 : (isVivaldi ? vivaldiAnswerQ2 : (isChopin ? chopinAnswerQ2 : analyticalAnswerStory))))}</div></div>
            </div>
          ) : null}
          {isHandel ? (
            <>
              {(step2Flags.toneS1 || step2Flags.toneS2 || step2Flags.toneS3) ? (
              <div className="cmp-mini-grid">
                <div>
                  <div className="small-note">2-B 음화법 · 내 답변</div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {handelToneSegments.map((seg) => {
                      if (!step2Flags[`tone${seg.id.charAt(0).toUpperCase()}${seg.id.slice(1)}`]) return null;
                      return (
                      <div key={seg.id} className="fb show info" style={{ marginBottom: 0 }}>
                        {seg.title}: {tonePaintingHandelState?.selected?.[seg.id] === null
                          ? '없음'
                          : (handelToneOptionsById[seg.id]?.[tonePaintingHandelState.selected[seg.id]] || '없음')}
                      </div>
                    );})}
                  </div>
                </div>
                <div>
                  <div className="small-note">2-B 음화법 · 정답</div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {handelToneSegments.map((seg) => {
                      if (!step2Flags[`tone${seg.id.charAt(0).toUpperCase()}${seg.id.slice(1)}`]) return null;
                      return (
                      <div key={seg.id} className="fb show gold" style={{ marginBottom: 0 }}>
                        {seg.title}: {seg.answer}
                      </div>
                    );})}
                  </div>
                </div>
              </div>
              ) : null}
              {step2Flags.melodyHarmony ? (
              <div className="cmp-mini-grid">
                <div>
                  <div className="small-note">2-C 화성음악 · 내 가락선</div>
                  {melodyCanvasHandelState?.savedPreview?.harmony
                    ? <img src={melodyCanvasHandelState.savedPreview.harmony} alt="화성음악 내가 그린 가락선" className="score-image-inline" />
                    : <div className="review-empty">없음</div>}
                </div>
                <div>
                  <div className="small-note">2-C 화성음악 · 개념 예시</div>
                  <img src="/assets/handel-model-hallelujah.png" alt="화성음악 개념 예시 가락선" className="score-image-inline" />
                </div>
              </div>
              ) : null}
              {step2Flags.melodyPoly ? (
              <div className="cmp-mini-grid">
                <div>
                  <div className="small-note">2-C 다성음악 · 내 가락선</div>
                  {melodyCanvasHandelState?.savedPreview?.poly
                    ? <img src={melodyCanvasHandelState.savedPreview.poly} alt="다성음악 내가 그린 가락선" className="score-image-inline" />
                    : <div className="review-empty">없음</div>}
                </div>
                <div>
                  <div className="small-note">2-C 다성음악 · 개념 예시</div>
                  <img src="/assets/handel-model-lord-reign.png" alt="다성음악 개념 예시 가락선" className="score-image-inline" />
                </div>
              </div>
              ) : null}
            </>
          ) : null}
          {isHaydn ? (
            <>
              {step2Flags.timbreIg1 ? (
              <div className="cmp-mini-grid">
                <div className="fb show info">
                  2-B 구간1: {hyTimbreState?.selectedByGrid?.['ig-1'] || '없음'} · 역할 {hyTimbreState?.roleByGrid?.['ig-1'] || '없음'}
                </div>
                <div className="fb show gold">정답: {hyTimbreCorrectInstr['ig-1']} · {hyTimbreCorrectRole['ig-1']}</div>
              </div>
              ) : null}
              {step2Flags.timbreIg2 ? (
              <div className="cmp-mini-grid">
                <div className="fb show info">
                  2-B 구간2: {hyTimbreState?.selectedByGrid?.['ig-2'] || '없음'} · 역할 {hyTimbreState?.roleByGrid?.['ig-2'] || '없음'}
                </div>
                <div className="fb show gold">정답: {hyTimbreCorrectInstr['ig-2']} · {hyTimbreCorrectRole['ig-2']}</div>
              </div>
              ) : null}
              {step2Flags.timbreIg3 ? (
              <div className="cmp-mini-grid">
                <div className="fb show info">
                  2-B 구간3: {hyTimbreState?.selectedByGrid?.['ig-3'] || '없음'} · 역할 {hyTimbreState?.roleByGrid?.['ig-3'] || '없음'}
                </div>
                <div className="fb show gold">정답: {hyTimbreCorrectInstr['ig-3']} · {hyTimbreCorrectRole['ig-3']}</div>
              </div>
              ) : null}
              {step2Flags.theme1 ? (
              <div className="cmp-mini-grid">
                <div className="fb show info">2-C 제1주제 칸: {formatHyThemePlacedFinal(hyThemeState?.matchPlaced?.theme1)}</div>
                <div className="fb show gold">정답: 음이 크게 도약한다, 리듬이 짧게 끊어진다, 밝고 활기차다</div>
              </div>
              ) : null}
              {step2Flags.theme2 ? (
              <div className="cmp-mini-grid">
                <div className="fb show info">2-C 제2주제 칸: {formatHyThemePlacedFinal(hyThemeState?.matchPlaced?.theme2)}</div>
                <div className="fb show gold">정답: 음이 순차적으로 이어진다, 리듬이 길게 이어진다, 부드럽고 서정적이다</div>
              </div>
              ) : null}
              {step2Flags.themeDeg ? (
              <div className="cmp-mini-grid">
                <div className="fb show info">2-C 도수 선택: {hyThemeState?.selectedDeg || '없음'}</div>
                <div className="fb show gold">정답: 5도</div>
              </div>
              ) : null}
            </>
          ) : null}
          {isVivaldi ? (
            <>
              {step2Flags.sonnetC1 ? (
              <div className="cmp-mini-grid">
                <div className="fb show info">2-B 구간1: {vvSonnetState?.selectedById?.['vv-c1'] || '없음'}</div>
                <div className="fb show gold">정답: {vvSonnetCorrect['vv-c1']}</div>
              </div>
              ) : null}
              {step2Flags.sonnetC2 ? (
              <div className="cmp-mini-grid">
                <div className="fb show info">2-B 구간2: {vvSonnetState?.selectedById?.['vv-c2'] || '없음'}</div>
                <div className="fb show gold">정답: {vvSonnetCorrect['vv-c2']}</div>
              </div>
              ) : null}
              {step2Flags.concertoTally ? (
              <div className="cmp-mini-grid">
                <div className="fb show info">
                  2-C 독주·총주 탭: 독주 {vvConcertoState?.soloCount ?? 0}회 · 총주 {vvConcertoState?.tuttiCount ?? 0}회
                </div>
              </div>
              ) : null}
              {step2Flags.concertoDiscovery ? (
              <div className="cmp-mini-grid">
                <div className="fb show info">2-C 발견 질문: {vvConcertoState?.discoveryChoice || '없음'}</div>
                <div className="fb show gold">정답: 독주와 총주가 번갈아 나온다</div>
              </div>
              ) : null}
            </>
          ) : null}
          {isChopin ? (
            <>
              {step2Flags.formF1 ? (
              <div className="cmp-mini-grid">
                <div className="fb show info">2-B 구간1: {cpFormState?.formAnswers?.['cp-f1'] || '없음'}</div>
                <div className="fb show gold">정답: {cpFormCorrect['cp-f1']}</div>
              </div>
              ) : null}
              {step2Flags.formF2 ? (
              <div className="cmp-mini-grid">
                <div className="fb show info">2-B 구간2: {cpFormState?.formAnswers?.['cp-f2'] || '없음'}</div>
                <div className="fb show gold">정답: {cpFormCorrect['cp-f2']}</div>
              </div>
              ) : null}
              {step2Flags.formF3 ? (
              <div className="cmp-mini-grid">
                <div className="fb show info">2-B 구간3: {cpFormState?.formAnswers?.['cp-f3'] || '없음'}</div>
                <div className="fb show gold">정답: {cpFormCorrect['cp-f3']}</div>
              </div>
              ) : null}
              {step2Flags.featureF1 ? (
              <div className="cmp-mini-grid">
                <div className="fb show info">2-B 구간1 특징: {cpFormState?.featureById?.['cp-f1'] || '없음'}</div>
                <div className="fb show gold">정답: {cpFeatureCorrect['cp-f1']}</div>
              </div>
              ) : null}
              {step2Flags.featureF2 ? (
              <div className="cmp-mini-grid">
                <div className="fb show info">2-B 구간2 특징: {cpFormState?.featureById?.['cp-f2'] || '없음'}</div>
                <div className="fb show gold">정답: {cpFeatureCorrect['cp-f2']}</div>
              </div>
              ) : null}
              {step2Flags.featureF3 ? (
              <div className="cmp-mini-grid">
                <div className="fb show info">2-B 구간3 특징: {cpFormState?.featureById?.['cp-f3'] || '없음'}</div>
                <div className="fb show gold">정답: {cpFeatureCorrect['cp-f3']}</div>
              </div>
              ) : null}
              {step2Flags.formDiscovery ? (
              <div className="cmp-mini-grid">
                <div className="fb show info">2-B ABA 발견 질문: {cpFormState?.discoveryChoice || '없음'}</div>
                <div className="fb show gold">정답: 서로 다른 느낌을 대비시키기 위해</div>
              </div>
              ) : null}
              {step2Flags.rhythmRh ? (
              <div className="cmp-mini-grid">
                <div className="fb show info">2-C 오른손 묶음: {cpRhythmState?.selectedByGroup?.['cp-rh-q'] || '없음'}</div>
                <div className="fb show gold">정답: {cpRhythmCorrect['cp-rh-q']}</div>
              </div>
              ) : null}
              {step2Flags.rhythmLh ? (
              <div className="cmp-mini-grid">
                <div className="fb show info">2-C 왼손 묶음: {cpRhythmState?.selectedByGroup?.['cp-lh-q'] || '없음'}</div>
                <div className="fb show gold">정답: {cpRhythmCorrect['cp-lh-q']}</div>
              </div>
              ) : null}
              {step2Flags.rhythmPoly ? (
              <div className="cmp-mini-grid">
                <div className="fb show info">2-C 양손 리듬 겹침: {cpRhythmState?.selectedByGroup?.['cp-poly-q'] || '없음'}</div>
                <div className="fb show gold">정답: {cpRhythmCorrect['cp-poly-q']}</div>
              </div>
              ) : null}
            </>
          ) : null}
          {isSchoenberg ? (
            <>
              {step2Flags.sprech ? (
              <div className="cmp-mini-grid">
                <div className="fb show info">2-B 선택: {sbSprechState?.selectedChoice || '없음'}</div>
                <div className="fb show gold">정답: 송어(일반 성악) 완전히 노래하기 / 피에로(슈프레흐슈팀메) 말하기에 가까워요</div>
              </div>
              ) : null}
              {(step2Flags.atonalCards || step2Flags.atonalChoice) ? (
              <div className="cmp-mini-grid">
                <div className="fb show info">2-C 카드 배치: {formatSbAtonalStudentResponse(sbAtonalState) || '없음'}</div>
                <div className="fb show gold">정답: {SB_ATONAL_CARD_GOLD}</div>
              </div>
              ) : null}
            </>
          ) : null}
          {isMawang ? (
            <>
              {(['해설자', '아버지', '아들', '마왕'].some((n) => step2Flags[`voice${n}`])) ? (
              <div className="cmp-mini-grid">
                <div className="fb show info">
                  2-B 음색 설계: {['해설자', '아버지', '아들', '마왕'].filter((n) => step2Flags[`voice${n}`]).join(', ')} 응답 완료
                </div>
                <div className="fb show gold">정답: 인물별 선율·음계·음색 비교표 참고</div>
              </div>
              ) : null}
              {(step2Flags.pianoRhScene || step2Flags.pianoLhScene) ? (
              <div className="cmp-mini-grid">
                <div className="fb show info">
                  2-C 피아노 반주: {step2Flags.pianoRhScene ? `오른손 ${pianoAnalysisState?.rhScene || '—'}` : ''}{step2Flags.pianoRhScene && step2Flags.pianoLhScene ? ' · ' : ''}{step2Flags.pianoLhScene ? `왼손 ${pianoAnalysisState?.lhScene || '—'}` : ''}
                </div>
                <div className="fb show gold">정답: {formatPianoSceneCorrectAnswer({
                  rh: step2Flags.pianoRhScene,
                  lh: step2Flags.pianoLhScene
                })}</div>
              </div>
              ) : null}
            </>
          ) : null}
            </>
          ) : null}

          <div className="summary-div"></div>
          <div className="summary-ey">③ 심미적 감상 <span style={getGradeBadgeStyle(stageGrades.stage3)}>등급 {stageGrades.stage3}</span></div>
          <div className="summary-row"><div className="summary-key">가치 평가</div><div className="summary-val">{(q2Type && q2) ? `[${q2Type}] ${q2}` : (q2 || '—')}</div></div>
          <div className="summary-row"><div className="summary-key">삶 연결</div><div className="summary-val">{q3 || '—'}</div></div>
          <div className="fb show gold" style={{ marginTop: 10 }}>
            💬 {evaluation.feedback}
          </div>
        </div>
        </div>
      </aside>

      <div className="stage-workspace-main">
        <div className="screen active">
          <div className="stage-header">
            <div className="s-eyebrow">완성 · 최종 감상문</div>
            <div className="s-title">최종 감상</div>
            <div className="s-desc">내가 1~3단계(감각적·분석적·심미적 감상)에서 입력한 내용을 바탕으로 최종 감상문을 만들어 보세요.</div>
          </div>
          <div className="body voice-body">
            <div className="summary-card">
              <div className="summary-row">
                <div className="summary-key">생성</div>
                <button className="btn-p" onClick={onGenerateEssay} disabled={isGeneratingEssay}>
                  {isGeneratingEssay ? '생성 중...' : '최종 감상문 만들기'}
                </button>
              </div>
              <div className="summary-div"></div>
              <div className="final-essay-card">
                <div className="final-essay-title">{essayTitle}</div>
                <div className="final-essay-student">{studentLine || '학번 이름 미입력'}</div>
                <div className="final-essay-divider" />
                <div className="final-essay-body">
                  {essayParagraphs.length ? (
                    essayParagraphs.map((paragraph, idx) => (
                      <p key={`essay-p-${idx}`}>{paragraph}</p>
                    ))
                  ) : (
                    <p>버튼을 누르면 학생 입력만을 바탕으로 최종 감상문이 생성됩니다.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="btn-row final-actions">
              <button className="btn-s" onClick={() => go('aestheticPage')}>← 다시 수정</button>
              <button className="btn-s" onClick={() => go('studentInfo')}>처음으로</button>
              <button className="btn-p" onClick={() => window.print()}>📄 PDF 저장</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FinalCard;
