/** @typedef {'empty' | 'correct' | 'partial' | 'wrong'} ItemStatus */

/**
 * @param {string} student
 * @param {string} correct
 * @returns {'empty' | 'correct' | 'wrong'}
 */
export function gradeExact(student, correct) {
  const pick = String(student || '').trim();
  if (!pick) return 'empty';
  return pick === correct ? 'correct' : 'wrong';
}

/**
 * @param {Array<{ key: string, student: string, correct: string }>} fields
 * @returns {{ itemStatus: ItemStatus, fields: Array<{ key: string, status: 'empty' | 'correct' | 'wrong', student: string, correct: string }> }}
 */
export function gradeFields(fields) {
  const graded = fields.map((f) => ({
    key: f.key,
    status: gradeExact(f.student, f.correct),
    student: String(f.student || '').trim(),
    correct: f.correct
  }));

  if (graded.some((f) => f.status === 'empty')) {
    return { itemStatus: 'empty', fields: graded };
  }

  const correctCount = graded.filter((f) => f.status === 'correct').length;
  if (correctCount === graded.length) return { itemStatus: 'correct', fields: graded };
  if (correctCount > 0) return { itemStatus: 'partial', fields: graded };
  return { itemStatus: 'wrong', fields: graded };
}

/**
 * @param {ItemStatus} itemStatus
 * @returns {'✓' | '△' | '✗'}
 */
export function itemStatusToMark(itemStatus) {
  if (itemStatus === 'correct') return '✓';
  if (itemStatus === 'partial') return '△';
  return '✗';
}

/**
 * @param {Array<'✓' | '△' | '✗'>} marks
 * @returns {'✓' | '△' | '✗'}
 */
export function combineMarks(marks) {
  if (!marks.length) return '✗';
  if (marks.every((m) => m === '✓')) return '✓';
  if (marks.every((m) => m === '✗')) return '✗';
  return '△';
}
