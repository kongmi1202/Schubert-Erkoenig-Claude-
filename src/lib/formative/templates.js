export const PREFLIGHT = {
  selectChoice: '먼저 보기 중 하나를 고른 뒤 피드백 보기를 눌러 주세요.',
  completeAll: '먼저 모든 문항을 완료한 뒤 피드백 보기를 눌러 주세요.'
};

export const FOOTER = {
  noAnswerReveal: '정답 보기는 알려 주지 않아요. 각 영역의 힌트만 보고 다시 골라 보세요. 다시 들어보세요.',
  noAnswerRevealFields: '정답 이름·특징 문구는 알려 주지 않아요. 각 영역의 힌트만 보고 다시 골라 보세요. 다시 들어보세요.'
};

export function verification(isCorrect, correctBody, wrongBody = '') {
  return isCorrect ? `검증: ✓\n${correctBody}` : `검증: ✗\n${wrongBody}`;
}

export function verificationWithMark(mark, body) {
  return `검증: ${mark}\n${body}`;
}

/**
 * 오답 4단: 인정 → 공감 → 듣기 초점 → 재시도
 */
export function wrongPickBody({ pick, empathize, listenFocus, retry = '다시 들어보세요.' }) {
  const lines = [`「${pick}」을 골랐어요.`];
  if (empathize) lines.push(empathize);
  if (listenFocus) lines.push(listenFocus);
  if (retry) lines.push(retry);
  return lines.join('\n');
}

export function splitHintExample(pack) {
  if (!pack) return { hint: '', example: '' };
  if (typeof pack === 'string') {
    const [hint, ...rest] = pack.split(/\n예:\s*/);
    return { hint: hint.trim(), example: rest.join(' ').trim() };
  }
  return { hint: pack.hint || '', example: pack.example || '' };
}

export function resolveWrongHint(wrongHints, pick, fallback) {
  const entry = wrongHints?.[pick];
  if (!entry) return splitHintExample(fallback);
  return splitHintExample(entry);
}
