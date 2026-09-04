import { buildMultiFieldSectionsPayload } from './buildMultiField';
import { FOOTER, PARTIAL_SUMMARY_DEFAULT, PREFLIGHT } from './templates';

/**
 * 단일·복수 객관식 → 맞음/다시 보기 카드(voice-sections)
 * @param {object} opts
 * @param {string} opts.itemId
 * @param {string} [opts.preflightMessage]
 * @param {Array<{
 *   key: string,
 *   student: string,
 *   correct: string,
 *   label: string,
 *   focus?: string,
 *   tone?: string,
 *   wrongHints?: Record<string, any>,
 *   defaultWrongHint?: any,
 *   missNote?: (pick: string) => string,
 *   okNote?: string
 * }>} opts.items
 * @param {string} [opts.correctSummary]
 * @param {string} [opts.correctFooter]
 * @param {string} [opts.wrongFooter]
 * @param {string|((matched: number, total: number) => string)} [opts.partialSummary]
 */
export function buildChoiceSectionsPayload({
  itemId,
  preflightMessage = PREFLIGHT.selectChoice,
  items,
  correctSummary,
  correctFooter,
  wrongFooter = FOOTER.noAnswerReveal,
  partialSummary = PARTIAL_SUMMARY_DEFAULT
}) {
  const list = items || [];
  return buildMultiFieldSectionsPayload({
    itemId,
    preflightMessage,
    fields: list.map((item) => ({
      key: item.key,
      student: item.student,
      correct: item.correct,
      wrongHints: item.wrongHints,
      defaultWrongHint: item.defaultWrongHint,
      missNote:
        item.missNote ||
        ((pick) => `네가 고른 「${pick}」은 「${item.label}」과 잘 맞지 않아요.`),
      okNote: item.okNote
    })),
    fieldMeta: Object.fromEntries(
      list.map((item) => [
        item.key,
        {
          label: item.label,
          focus: item.focus || '',
          tone: item.tone || 'pitch'
        }
      ])
    ),
    correctSummary: correctSummary || '선택한 항목이 모두 맞아요.',
    correctFooter: correctFooter || '같은 구간을 다시 들으며 소리와 선택을 맞춰 보세요.',
    wrongFooter,
    partialSummary
  });
}
