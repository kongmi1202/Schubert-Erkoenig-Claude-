const hasText = (v) => typeof v === 'string' && v.trim().length > 0;

export const STEP2_LOCKED_ANSWER_MSG = '2단계에서 이 활동을 완료하면 정답이 공개됩니다.';

function hasVoiceCharResponse(voiceDesign, name) {
  const row = voiceDesign?.[name] || {};
  return ['음높이', '음계', '리듬꼴', '음색'].some((k) => hasText(row[k]));
}

/** 곡별 2단계 활동·문항별 학생 응답 여부 */
export function getStep2ResponseFlags(selectedSong, state) {
  if (!state) return {};

  const chars = state.analyticalCharacters || [];

  if (selectedSong === 'handel') {
    const sel = state.tonePaintingHandelState?.selected || {};
    const preview = state.melodyCanvasHandelState?.savedPreview || {};
    return {
      overviewQ1: hasText(state.handelLyricMeaning),
      overviewQ2: hasText(state.handelOperaDiff),
      toneS1: sel.s1 !== null && sel.s1 !== undefined,
      toneS2: sel.s2 !== null && sel.s2 !== undefined,
      toneS3: sel.s3 !== null && sel.s3 !== undefined,
      melodyHarmony: hasText(preview.harmony),
      melodyPoly: hasText(preview.poly)
    };
  }

  if (selectedSong === 'haydn') {
    const timbre = state.hyTimbreState || {};
    const theme = state.hyThemeState || {};
    return {
      overviewQ1: chars.some(hasText),
      overviewQ2: hasText(state.analyticalStory),
      timbreIg1: hasText(timbre.selectedByGrid?.['ig-1']) && hasText(timbre.roleByGrid?.['ig-1']),
      timbreIg2: hasText(timbre.selectedByGrid?.['ig-2']) && hasText(timbre.roleByGrid?.['ig-2']),
      timbreIg3: hasText(timbre.selectedByGrid?.['ig-3']) && hasText(timbre.roleByGrid?.['ig-3']),
      theme1: (theme.matchPlaced?.theme1?.length ?? 0) > 0,
      theme2: (theme.matchPlaced?.theme2?.length ?? 0) > 0,
      themeDeg: hasText(theme.selectedDeg)
    };
  }

  if (selectedSong === 'schoenberg') {
    const atonal = state.sbAtonalState?.placedCards;
    return {
      overviewQ1: hasText(chars[0]),
      overviewQ2: hasText(state.analyticalStory),
      sprech: hasText(state.sbSprechState?.selectedChoice),
      atonalCards: (atonal?.tonal?.length ?? 0) > 0 || (atonal?.atonal?.length ?? 0) > 0,
      atonalChoice: hasText(state.sbAtonalState?.selectedChoice),
      atonalFeel: hasText(state.sbAtonalState?.feelTonal) || hasText(state.sbAtonalState?.feelAtonal)
    };
  }

  if (selectedSong === 'vivaldi') {
    const sonnet = state.vvSonnetState?.selectedById || {};
    const concerto = state.vvConcertoState || {};
    return {
      overviewQ1: chars.some(hasText),
      sonnetC1: hasText(sonnet['vv-c1']),
      sonnetC2: hasText(sonnet['vv-c2']),
      concertoTally: (concerto.soloCount ?? 0) > 0 || (concerto.tuttiCount ?? 0) > 0,
      concertoDiscovery: hasText(concerto.discoveryChoice)
    };
  }

  if (selectedSong === 'chopin') {
    const form = state.cpFormState || {};
    const rhythm = state.cpRhythmState || {};
    return {
      overviewQ1: hasText(chars[0]),
      overviewQ2: hasText(state.analyticalStory),
      formF1: hasText(form.formAnswers?.['cp-f1']),
      formF2: hasText(form.formAnswers?.['cp-f2']),
      formF3: hasText(form.formAnswers?.['cp-f3']),
      featureF1: hasText(form.featureById?.['cp-f1']),
      featureF2: hasText(form.featureById?.['cp-f2']),
      featureF3: hasText(form.featureById?.['cp-f3']),
      formDiscovery: hasText(form.discoveryChoice),
      rhythmRh: hasText(rhythm.selectedByGroup?.['cp-rh-q']),
      rhythmLh: hasText(rhythm.selectedByGroup?.['cp-lh-q']),
      rhythmPoly: hasText(rhythm.selectedByGroup?.['cp-poly-q'])
    };
  }

  const voiceDesign = state.voiceDesignState?.voiceDesign || {};
  const piano = state.pianoAnalysisState || {};
  return {
    overviewQ1: chars.some(hasText),
    overviewQ2: hasText(state.analyticalStory),
    voice해설자: hasVoiceCharResponse(voiceDesign, '해설자'),
    voice아버지: hasVoiceCharResponse(voiceDesign, '아버지'),
    voice아들: hasVoiceCharResponse(voiceDesign, '아들'),
    voice마왕: hasVoiceCharResponse(voiceDesign, '마왕'),
    pianoRhScene: hasText(piano.rhScene),
    pianoLhScene: hasText(piano.lhScene),
    pianoRhDrawing: hasText(piano.savedPreview?.rh),
    pianoLhDrawing: hasText(piano.savedPreview?.lh)
  };
}

export function hasAnyStep2Response(selectedSong, state) {
  const flags = getStep2ResponseFlags(selectedSong, state);
  return Object.values(flags).some(Boolean);
}

export function isStage2Complete(stageCompletion) {
  return Boolean(
    stageCompletion?.analytical
    && stageCompletion?.voice
    && stageCompletion?.piano
    && stageCompletion?.history
  );
}

/** @deprecated 응답 데이터 기반 per-activity 게이트를 사용하세요 */
export function hasStep2ReviewData(selectedSong, state) {
  return hasAnyStep2Response(selectedSong, state);
}

/** @deprecated getStep2ResponseFlags / hasAnyStep2Response 사용 */
export function canRevealStep2Review(stageCompletion, selectedSong, state) {
  return hasAnyStep2Response(selectedSong, state);
}
