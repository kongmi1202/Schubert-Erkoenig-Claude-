/** 마왕 2-B 음색 설계 — 채점·표시 공통 (리듬꼴 제외) */
export const VOICE_DESIGN_FIELD_KEYS = ['선율', '음계', '음색'];

export const VOICE_TIMBRE_OPTIONS = ['두꺼움', '얇음'];

/** 인물별 선율 선택지(정답 1 + 오답 2). 캐릭터 이름 미포함 */
export const MAWANG_MELODY_OPTIONS_BY_CHAR = {
  해설자: [
    { value: '장면을 담담히 전하는 선율', hint: '이야기 전달', icon: 'narrate', correct: true },
    { value: '한자리에 머무는 답답한 선율', hint: '제자리 반복', icon: 'stuck' },
    { value: '달콤하고 화려한 선율', hint: '밝고 유혹적', icon: 'ornate' }
  ],
  아버지: [
    { value: '낮고 부드러운 선율', hint: '달래는 목소리', icon: 'softLow', correct: true },
    { value: '높고 날카로운 선율', hint: '날카로운 호소', icon: 'sharpHigh' },
    { value: '달콤하고 화려한 선율', hint: '밝고 유혹적', icon: 'ornate' }
  ],
  아들: [
    { value: '한자리에 머무는 답답한 선율', hint: '제자리 반복', icon: 'stuck', correct: true },
    { value: '낮고 부드러운 선율', hint: '달래는 목소리', icon: 'softLow' },
    { value: '밝고 경쾌하게 뛰어오르는 선율', hint: '가벼운 도약', icon: 'bounce' }
  ],
  마왕: [
    { value: '달콤하고 화려한 선율', hint: '밝고 유혹적', icon: 'ornate', correct: true },
    { value: '낮고 무거운 선율', hint: '묵직한 저음', icon: 'heavyLow' },
    { value: '한자리에 머무는 답답한 선율', hint: '제자리 반복', icon: 'stuck' }
  ]
};

export const MAWANG_VOICE_ANSWER_KEY = {
  해설자: {
    선율: '장면을 담담히 전하는 선율',
    음계: '단조',
    음색: '두꺼움'
  },
  아버지: {
    선율: '낮고 부드러운 선율',
    음계: '장조',
    음색: '두꺼움'
  },
  아들: {
    선율: '한자리에 머무는 답답한 선율',
    음계: '단조',
    음색: '얇음'
  },
  마왕: {
    선율: '달콤하고 화려한 선율',
    음계: '장조',
    음색: '얇음'
  }
};

export function getMawangMelodyOptions(characterName) {
  return MAWANG_MELODY_OPTIONS_BY_CHAR[characterName] || [];
}

export function createEmptyVoiceDesignRow() {
  return { 선율: '', 음계: '', 음색: '' };
}

export function createEmptyMawangVoiceDesign() {
  return {
    해설자: createEmptyVoiceDesignRow(),
    아버지: createEmptyVoiceDesignRow(),
    아들: createEmptyVoiceDesignRow(),
    마왕: createEmptyVoiceDesignRow()
  };
}

/** 예전 저장본(음높이)도 읽히도록 정규화 */
export function normalizeVoiceDesignRow(row) {
  if (!row || typeof row !== 'object') return createEmptyVoiceDesignRow();
  return {
    선율: row.선율 || '',
    음계: row.음계 || '',
    음색: row.음색 || ''
  };
}

export function normalizeMawangVoiceDesign(voiceDesign) {
  const empty = createEmptyMawangVoiceDesign();
  if (!voiceDesign || typeof voiceDesign !== 'object') return empty;
  return {
    해설자: normalizeVoiceDesignRow(voiceDesign.해설자),
    아버지: normalizeVoiceDesignRow(voiceDesign.아버지),
    아들: normalizeVoiceDesignRow(voiceDesign.아들),
    마왕: normalizeVoiceDesignRow(voiceDesign.마왕)
  };
}

export function isVoiceDesignRowFilled(row) {
  const normalized = normalizeVoiceDesignRow(row);
  return VOICE_DESIGN_FIELD_KEYS.every((k) => Boolean(normalized[k]));
}

export function gradeMawangVoiceDesignRow(name, row) {
  const answer = MAWANG_VOICE_ANSWER_KEY[name];
  const normalized = normalizeVoiceDesignRow(row);
  if (!answer || !isVoiceDesignRowFilled(normalized)) return false;
  return VOICE_DESIGN_FIELD_KEYS.every((k) => normalized[k] === answer[k]);
}

export function formatVoiceDesignRowText(row) {
  const normalized = normalizeVoiceDesignRow(row);
  return VOICE_DESIGN_FIELD_KEYS.map((k) => `${k} ${normalized[k] || '—'}`).join(', ');
}
