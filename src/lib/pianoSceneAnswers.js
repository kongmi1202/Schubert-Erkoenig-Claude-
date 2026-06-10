/** 마왕 2-C 피아노 반주 장면 선택지 · 정답 (표현 통일용) */
export const PIANO_RH_SCENE_CORRECT = '말이 달림';
export const PIANO_LH_SCENE_CORRECT = '심장이 두근거림';

export const PIANO_RH_SCENE_OPTIONS = [
  { icon: '🐎', name: PIANO_RH_SCENE_CORRECT },
  { icon: '⛈️', name: '폭풍우' },
  { icon: '🌊', name: '파도' },
  { icon: '💨', name: '바람' }
];

export const PIANO_LH_SCENE_OPTIONS = [
  { icon: '💓', name: PIANO_LH_SCENE_CORRECT },
  { icon: '🥁', name: '북소리' },
  { icon: '👣', name: '무거운 발걸음' },
  { icon: '🌊', name: '잔잔한 물결' }
];

const clean = (v) => (typeof v === 'string' ? v.trim() : '');

export function gradePianoRhScene(value) {
  return clean(value) === PIANO_RH_SCENE_CORRECT;
}

export function gradePianoLhScene(value) {
  return clean(value) === PIANO_LH_SCENE_CORRECT;
}

export function formatPianoSceneCorrectAnswer({ rh = true, lh = true } = {}) {
  const parts = [];
  if (rh) parts.push(`오른손 ${PIANO_RH_SCENE_CORRECT}`);
  if (lh) parts.push(`왼손 ${PIANO_LH_SCENE_CORRECT}`);
  return parts.join(' · ');
}
