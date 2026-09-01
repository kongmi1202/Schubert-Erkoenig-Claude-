import { gradeFields, itemStatusToMark } from './grade';
import { FOOTER, splitHintExample } from './templates';

/**
 * B형 활동 — 항목별 다중 필드 형성적 피드백 payload
 * @returns {{ kind: 'voice-sections', ... } | { kind: 'plain', text: string }}
 */
export function buildMultiFieldSectionsPayload({
  itemId,
  preflightMessage,
  fields,
  correctSummary,
  correctFooter,
  wrongFooter = FOOTER.noAnswerRevealFields,
  partialSummary,
  fieldMeta
}) {
  const graded = gradeFields(
    fields.map((f) => ({
      key: f.key,
      student: f.student,
      correct: f.correct
    }))
  );

  if (graded.itemStatus === 'empty') {
    return { kind: 'plain', text: preflightMessage };
  }

  const matchedCount = graded.fields.filter((f) => f.status === 'correct').length;
  const total = graded.fields.length;

  const sections = graded.fields.map((f) => {
    const meta = fieldMeta[f.key] || { label: f.key, focus: '', tone: 'pitch' };
    const def = fields.find((x) => x.key === f.key) || {};
    const ok = f.status === 'correct';
    const studentPick = f.student || '미선택';

    if (ok) {
      return {
        field: f.key,
        label: meta.label,
        focus: meta.focus,
        tone: meta.tone,
        status: 'ok',
        studentPick,
        note: def.okNote || `${meta.label} 선택이 맞아요.`,
        hint: '',
        example: ''
      };
    }

    const { hint, example } = splitHintExample(
      def.wrongHints?.[studentPick] || def.defaultWrongHint
    );

    return {
      field: f.key,
      label: meta.label,
      focus: meta.focus,
      tone: meta.tone,
      status: 'miss',
      studentPick,
      note:
        def.missNote?.(studentPick) ||
        `네가 고른 「${studentPick}」은 이 구간의 ${meta.label}과 잘 맞지 않아요.`,
      hint,
      example
    };
  });

  const mark = itemStatusToMark(graded.itemStatus);
  const allMatch = graded.itemStatus === 'correct';

  if (allMatch) {
    return {
      kind: 'voice-sections',
      isCorrect: true,
      verification: '검증: ✓',
      character: itemId,
      summary: correctSummary,
      sections,
      footer: correctFooter
    };
  }

  const summary =
    typeof partialSummary === 'function'
      ? partialSummary(matchedCount, total)
      : partialSummary ||
        `구간 선택을 항목별로 점검했어요. 맞은 항목 ${matchedCount}개 · 다시 볼 항목 ${total - matchedCount}개`;

  return {
    kind: 'voice-sections',
    isCorrect: false,
    verification: `검증: ${mark}`,
    character: itemId,
    summary,
    sections,
    footer: wrongFooter
  };
}
