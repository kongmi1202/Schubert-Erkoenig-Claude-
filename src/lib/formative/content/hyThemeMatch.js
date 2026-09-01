/** 종달새 — 제1·제2주제 카드 매칭 피드백 */

export const HY_MATCH_LABELS = {
  o1: '음이 크게 도약한다',
  o2: '음이 순차적으로 이어진다',
  o3: '리듬이 짧게 끊어진다',
  o4: '리듬이 길게 이어진다',
  o5: '밝고 활기차다',
  o6: '부드럽고 서정적이다'
};

/** 선율·리듬·느낌 — 제1주제 칸 / 제2주제 칸에 맞는 카드 id */
export const HY_THEME_DIMS = [
  {
    label: '선율',
    t1Card: 'o2',
    t2Card: 'o1',
    cards: ['o1', 'o2'],
    listen:
      '제1·제2주제 클립을 들으며, 음이 멀리 뛰는지 옆 음으로 이어지는지 비교해 보세요.',
    swap:
      '선율 카드가 서로 바뀐 것 같아요. 두 클립을 들으며, 멀리 뛰는 느낌과 옆으로 이어지는 느낌 중 어디에 맞는지 비교해 보세요.'
  },
  {
    label: '리듬',
    t1Card: 'o4',
    t2Card: 'o3',
    cards: ['o3', 'o4'],
    listen:
      '두 클립을 들으며, 리듬이 짧게 끊기는지 길게 흐르는지 비교해 보세요.',
    swap:
      '리듬 카드가 서로 바뀐 것 같아요. 두 클립을 들으며, 짧게 끊기는 느낌과 길게 흐르는 느낌 중 어디에 맞는지 비교해 보세요.'
  },
  {
    label: '느낌',
    t1Card: 'o6',
    t2Card: 'o5',
    cards: ['o5', 'o6'],
    listen:
      '두 클립을 들으며, 분위기가 또렷한지 잔잔한지 비교해 보세요.',
    swap:
      '느낌 카드가 서로 바뀐 것 같아요. 두 클립을 들으며, 또렷한 느낌과 잔잔한 느낌 중 어디에 맞는지 비교해 보세요.'
  }
];

function cardsInDim(placed, cardIds) {
  return cardIds.filter((id) => placed.includes(id)).map((id) => HY_MATCH_LABELS[id]);
}

function isDimRowOk(t1, t2, dim) {
  const t1Has = (id) => t1.includes(id);
  const t2Has = (id) => t2.includes(id);
  return (
    t1Has(dim.t1Card) &&
    !t1Has(dim.t2Card) &&
    t2Has(dim.t2Card) &&
    !t2Has(dim.t1Card)
  );
}

function dimRowHint(t1, t2, dim) {
  if (t1.includes(dim.t2Card) && t2.includes(dim.t1Card)) return dim.swap;
  return dim.listen;
}

/**
 * @returns {{ intro: string, rows: Array, hints: Array, fallbackNote: string|null, footer: string }}
 */
export function buildHyThemeMatchWrongPayload(t1, t2, { col1Ok, col2Ok }) {
  let intro;
  if (col1Ok && !col2Ok) {
    intro = '제1주제 칸은 맞았어요. 제2주제 클립에 집중해 보세요.';
  } else if (col2Ok && !col1Ok) {
    intro = '제2주제 칸은 맞았어요. 제1주제 클립에 집중해 보세요.';
  } else {
    intro = '선율·리듬·느낌 카드를 제1·제2주제 칸과 맞춰 보세요.';
  }

  const rows = HY_THEME_DIMS.map((dim) => ({
    dim: dim.label,
    theme1: cardsInDim(t1, dim.cards),
    theme2: cardsInDim(t2, dim.cards),
    needsWork: !isDimRowOk(t1, t2, dim)
  }));

  const hints = HY_THEME_DIMS.filter((dim) => !isDimRowOk(t1, t2, dim)).map((dim) => ({
    dim: dim.label,
    text: dimRowHint(t1, t2, dim)
  }));

  const fallbackNote =
    hints.length === 0
      ? '칸마다 카드가 여러 장이면, 같은 구분(선율·리듬·느낌)끼리 서로 맞는지 다시 점검해 보세요.'
      : null;

  return { intro, rows, hints, fallbackNote, footer: '다시 들어보세요.' };
}
