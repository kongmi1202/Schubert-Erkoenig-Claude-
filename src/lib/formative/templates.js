export const PREFLIGHT = {
  selectChoice: '먼저 보기 중 하나를 고른 뒤 피드백 보기를 눌러 주세요.',
  completeAll: '먼저 모든 문항을 완료한 뒤 피드백 보기를 눌러 주세요.'
};

export const FOOTER = {
  noAnswerReveal: '정답 보기는 알려 주지 않아요. 힌트만 보고 다시 골라 보세요. 다시 들어보세요.',
  noAnswerRevealFields: '정답 이름·특징 문구는 알려 주지 않아요. 힌트만 보고 다시 골라 보세요. 다시 들어보세요.'
};

/** △일 때 맞은 항목 — 정답 값·이름은 말하지 않음 */
export const PARTIAL_FIELD_OK_NOTE =
  '이 항목은 방향이 맞아요. 왜 그렇게 느꼈는지 한 번 말해 본 뒤, 나머지도 같은 방식으로 들어 보세요.';

export const PARTIAL_SUMMARY_DEFAULT =
  '일부는 방향이 맞아요. 맞게 느낀 부분을 기준 삼아, 나머지도 같은 구간을 다시 들어 보세요.';

/** A형 기본 오답 — 보기 문구를 인정하고 귀로 비교 유도 (정답 미노출) */
export const DEFAULT_WRONG_LISTEN_BODY =
  '네가 고른 보기가 이 구간의 소리와 어떻게 연결되는지, 음높이·셈여림·빠르기·리듬꼴 중 두세 가지를 나란히 비교해 보세요. 다시 들어보세요.';

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
    const byExample = pack.split(/\n예:\s*/);
    if (byExample.length > 1) {
      return { hint: byExample[0].trim(), example: byExample.slice(1).join(' ').trim() };
    }
    const parts = pack
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((p) => !/^다시 (들어|생각)/.test(p));
    const withoutPick = parts.filter((p) => !/^「[^」]+」/.test(p));
    const lines = withoutPick.length ? withoutPick : parts;
    if (lines.length >= 2) {
      return { hint: lines.slice(0, -1).join(' '), example: lines[lines.length - 1] };
    }
    return { hint: (lines[0] || pack).trim(), example: '' };
  }
  if (pack.hint || pack.example) {
    return { hint: pack.hint || '', example: pack.example || '' };
  }
  if (pack.empathize || pack.listenFocus) {
    return {
      hint: [pack.empathize, pack.listenFocus].filter(Boolean).join(' '),
      example: pack.example || ''
    };
  }
  return { hint: '', example: '' };
}

export function resolveWrongHint(wrongHints, pick, fallback) {
  const entry = wrongHints?.[pick];
  if (!entry) return splitHintExample(fallback);
  return splitHintExample(entry);
}
