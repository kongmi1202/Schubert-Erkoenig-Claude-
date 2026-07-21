/** 마왕 2-B 음색 설계 — 채점·표시 공통 (리듬꼴 제외) */
export const VOICE_DESIGN_FIELD_KEYS = ['음높이', '음계', '음색'];

export const VOICE_TIMBRE_OPTIONS = ['두꺼움', '얇음'];

export const MAWANG_VOICE_ANSWER_KEY = {
  해설자: { 음높이: '중간', 음계: '단조', 음색: '두꺼움' },
  아버지: { 음높이: '낮음', 음계: '단조', 음색: '두꺼움' },
  아들: { 음높이: '높음', 음계: '단조', 음색: '얇음' },
  마왕: { 음높이: '중간', 음계: '장조', 음색: '얇음' }
};

export function createEmptyVoiceDesignRow() {
  return { 음높이: '', 음계: '', 음색: '' };
}

export function createEmptyMawangVoiceDesign() {
  return {
    해설자: createEmptyVoiceDesignRow(),
    아버지: createEmptyVoiceDesignRow(),
    아들: createEmptyVoiceDesignRow(),
    마왕: createEmptyVoiceDesignRow()
  };
}

export function isVoiceDesignRowFilled(row) {
  if (!row) return false;
  return VOICE_DESIGN_FIELD_KEYS.every((k) => Boolean(row[k]));
}

export function gradeMawangVoiceDesignRow(name, row) {
  const answer = MAWANG_VOICE_ANSWER_KEY[name];
  if (!answer || !isVoiceDesignRowFilled(row)) return false;
  return VOICE_DESIGN_FIELD_KEYS.every((k) => row[k] === answer[k]);
}

export function formatVoiceDesignRowText(row) {
  return VOICE_DESIGN_FIELD_KEYS.map((k) => `${k} ${row?.[k] || '—'}`).join(', ');
}
