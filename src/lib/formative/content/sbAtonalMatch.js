/** 쇤베르크 — 송어(조성) vs 피에로(무조성) 카드 매칭 피드백 */

export const SB_ATONAL_DIMS = [
  {
    label: '조성·무조성',
    tonalCard: '조성 음악',
    atonalCard: '무조성 음악',
    cards: ['조성 음악', '무조성 음악'],
    listen:
      '송어와 피에로를 번갈아 들으며, 음이 한곳으로 모이는지·중심 없이 떠다니는지 비교해 보세요.',
    swap:
      '조성·무조성 카드가 서로 바뀐 것 같아요. 송어는 편하게 모이는 느낌, 피에로는 중심이 흔들리는 느낌인지 비교해 보세요.'
  },
  {
    label: '분위기',
    tonalCard: '편안하고 안정적',
    atonalCard: '낯설고 긴장감',
    cards: ['편안하고 안정적', '낯설고 긴장감'],
    listen:
      '두 곡을 번갈아 들으며, 편안하고 안정적인지·낯설고 긴장되는지 분위기만 비교해 보세요.',
    swap:
      '분위기 카드가 서로 바뀐 것 같아요. 송어는 편안한 느낌, 피에로는 긴장되는 느낌인지 비교해 보세요.'
  },
  {
    label: '음 어울림',
    tonalCard: '음들이 서로 잘 어울린다.',
    atonalCard: '음들이 따로 논다.',
    cards: ['음들이 서로 잘 어울린다.', '음들이 따로 논다.'],
    listen:
      '두 곡을 들으며, 음들이 잘 붙어 어울리는지·각자 따로 노는지 화음의 느낌을 비교해 보세요.',
    swap:
      '음 어울림 카드가 서로 바뀐 것 같아요. 송어는 잘 어울리는 느낌, 피에로는 따로 노는 느낌인지 비교해 보세요.'
  }
];

function cardsInDim(placed, cardPair) {
  return cardPair.filter((card) => placed.includes(card));
}

function isDimRowOk(tonal, atonal, dim) {
  return (
    tonal.includes(dim.tonalCard) &&
    !tonal.includes(dim.atonalCard) &&
    atonal.includes(dim.atonalCard) &&
    !atonal.includes(dim.tonalCard)
  );
}

function dimRowHint(tonal, atonal, dim) {
  if (tonal.includes(dim.atonalCard) && atonal.includes(dim.tonalCard)) return dim.swap;
  return dim.listen;
}

export function sbAtonalColumnOk(cards, correctSet, wrongSet) {
  if (!Array.isArray(cards) || cards.length === 0) return false;
  const hasCorrect = cards.some((c) => correctSet.has(c));
  const hasWrong = cards.some((c) => wrongSet.has(c));
  return hasCorrect && !hasWrong;
}

/**
 * @returns {{ intro: string, rows: Array, hints: Array, fallbackNote: string|null, footer: string }}
 */
export function buildSbAtonalMatchWrongPayload(tonal, atonal, { colTonalOk, colAtonalOk }) {
  let intro;
  if (colTonalOk && !colAtonalOk) {
    intro = '송어 칸은 맞았어요. 피에로 구간에 집중해 보세요.';
  } else if (colAtonalOk && !colTonalOk) {
    intro = '피에로 칸은 맞았어요. 송어 구간에 집중해 보세요.';
  } else {
    intro = '조성·무조성, 분위기, 음 어울림 카드를 송어·피에로 칸과 맞춰 보세요.';
  }

  const rows = SB_ATONAL_DIMS.map((dim) => ({
    dim: dim.label,
    theme1: cardsInDim(tonal, dim.cards),
    theme2: cardsInDim(atonal, dim.cards),
    needsWork: !isDimRowOk(tonal, atonal, dim)
  }));

  const hints = SB_ATONAL_DIMS.filter((dim) => !isDimRowOk(tonal, atonal, dim)).map((dim) => ({
    dim: dim.label,
    text: dimRowHint(tonal, atonal, dim)
  }));

  const fallbackNote =
    hints.length === 0
      ? '칸마다 카드가 여러 장이면, 같은 구분(조성·분위기·음 어울림)끼리 서로 맞는지 다시 점검해 보세요.'
      : null;

  return { intro, rows, hints, fallbackNote, footer: '다시 들어보세요.' };
}
