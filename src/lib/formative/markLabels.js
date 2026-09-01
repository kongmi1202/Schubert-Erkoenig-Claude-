/** @type {Record<'✓' | '△' | '✗', string>} */
export const MARK_LABELS = {
  '✓': '참 잘했어요!',
  '△': '조금 아쉬워요ㅠㅠ',
  '✗': '많이 아쉬워요ㅠㅠ'
};

/**
 * @param {'✓' | '△' | '✗' | string} mark
 * @returns {string}
 */
export function formatMarkDisplay(mark) {
  const label = MARK_LABELS[mark];
  return label ? `${mark} ${label}` : String(mark || '');
}

/**
 * 검증 줄에서 기호만 추출 (뒤 문구 유무와 무관)
 * @param {string} line
 * @returns {'✓' | '△' | '✗' | null}
 */
export function parseMarkFromVerificationLine(line) {
  const match = String(line || '').trim().match(/^검증\s*[:：]\s*([✓△✗])/);
  return match ? match[1] : null;
}

/** 피드백 문자열 맨 앞 검증·설명 머리글만 제거 */
export function stripFeedbackHeader(text) {
  let body = String(text || '').trim();
  body = body.replace(/^검증\s*[:：]\s*[✓△✗](?:\s+[^\n]*)?\r?\n/, '');
  body = body.replace(/^설명\s*[:：]\s*/, '');
  return body.trim();
}
