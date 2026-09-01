import { gradeExact } from './grade';
import { DEFAULT_WRONG_LISTEN_BODY, PREFLIGHT, verification, wrongPickBody } from './templates';

/**
 * A형 활동 — 단일 선택 형성적 피드백 (검증 문자열)
 */
export function buildSingleChoiceFeedback({
  userChoice,
  correctAnswer,
  normalize = (v) => String(v || '').trim(),
  preflightMessage = PREFLIGHT.selectChoice,
  correctBody,
  wrongHints = {},
  defaultWrongBody = '',
  /** @param {string} pick @returns {{ empathize?: string, listenFocus?: string, retry?: string } | string} */
  formatWrong
}) {
  if (!normalize(userChoice)) return preflightMessage;

  const isCorrect = normalize(userChoice) === normalize(correctAnswer);
  if (isCorrect) return verification(true, correctBody);

  const pick = String(userChoice || '').trim();
  let wrongBody = '';

  if (typeof formatWrong === 'function') {
    const formatted = formatWrong(pick);
    wrongBody = typeof formatted === 'string' ? formatted : wrongPickBody({ pick, ...formatted });
  } else if (wrongHints[pick]) {
    wrongBody = typeof wrongHints[pick] === 'string' ? wrongHints[pick] : wrongPickBody({ pick, ...wrongHints[pick] });
  } else {
    wrongBody = defaultWrongBody || DEFAULT_WRONG_LISTEN_BODY;
  }

  return verification(false, '', wrongBody);
}

/**
 * 슬라이더·조건부 단일 선택 (쇤베르크 슈프레흐슈팀메 등)
 */
export function buildConditionalSingleChoice({
  ready,
  notReadyMessage,
  isCorrect,
  correctBody,
  wrongBody
}) {
  if (!ready) return notReadyMessage;
  return isCorrect ? verification(true, correctBody) : verification(false, '', wrongBody);
}

/**
 * 슬라이더 2단계 — 구간별 맞음/다시 보기 UI용 payload
 */
export function buildSliderItemPayload({
  ready,
  notReadyMessage,
  isCorrect,
  toneText,
  correctBody,
  wrongBody
}) {
  if (!ready) return notReadyMessage;
  return {
    kind: 'slider-item',
    isCorrect: Boolean(isCorrect),
    studentPick: toneText || '',
    body: isCorrect ? correctBody : wrongBody
  };
}

/**
 * @param {string} student
 * @param {string} correct
 */
export function isChoiceCorrect(student, correct) {
  return gradeExact(student, correct) === 'correct';
}
