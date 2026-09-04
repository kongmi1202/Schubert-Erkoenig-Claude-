/** 쇤베르크 — 송어(조성) vs 피에로(무조성) 카드 매칭 피드백 */

export const SB_ATONAL_DIMS = [
  {
    label: '조성',
    tonalCard: '조성이 있다',
    atonalCard: '조성이 없다',
    cards: ['조성이 있다', '조성이 없다'],
    focus: '음이 모이는지 · 중심이 흔들리는지',
    swapHint:
      '조성 카드가 서로 바뀐 것 같아요. 조성이 있으면 음이 한곳으로 모이며 중심이 느껴지고, 조성이 없으면 중심음이 분명하지 않아 음이 떠다니는 듯 들릴 수 있어요. 두 곡을 번갈아 들으며, 지금 칸에 넣은 카드가 그 소리의 중심감과 같은 쪽인지 다시 맞춰 보세요.',
    swapExample:
      '각 곡을 듣고 「음이 한곳으로 모인다」와 「중심이 흔들린다」 중 어디에 가까운지 한 단어로 말한 뒤 카드를 다시 옮겨 보세요.',
    missingTonalHint:
      '송어 칸의 조성 카드가 아직 맞지 않아요. 조성이 있다는 것은 중심음이 느껴진다는 뜻이고, 조성이 없다는 것은 중심이 분명하지 않다는 뜻이에요. 송어 구간만 다시 들으며 음이 모이는지·떠다니는지 짚어 본 다음, 그 느낌에 가까운 카드를 골라 보세요.',
    missingAtonalHint:
      '피에로 칸의 조성 카드가 아직 맞지 않아요. 조성이 있다는 것은 중심음이 느껴진다는 뜻이고, 조성이 없다는 것은 중심이 분명하지 않다는 뜻이에요. 피에로 구간만 다시 들으며 음이 모이는지·떠다니는지 짚어 본 다음, 그 느낌에 가까운 카드를 골라 보세요.',
    bothWrongHint:
      '조성 구분이 아직 곡과 잘 맞지 않아요. 조성이 있으면 음이 한 중심으로 모이며 안정감을 주고, 조성이 없으면 중심이 분명하지 않아 음이 떠다니듯 들릴 수 있어요. 두 곡의 중심감을 각각 먼저 느낀 뒤, 카드가 그 소리와 같은 칸에 들어가 있는지 다시 살펴보세요.',
    bothWrongExample:
      '곡마다 「중심이 느껴짐」인지 「중심이 흔들림」인지 한 단어로 말한 다음, 그 말에 맞는 카드를 각 칸에 다시 넣어 보세요.'
  },
  {
    label: '분위기',
    tonalCard: '편안하고 안정적',
    atonalCard: '낯설고 긴장감',
    cards: ['편안하고 안정적', '낯설고 긴장감'],
    focus: '편안한 안정 · 낯선 긴장',
    swapHint:
      '분위기 카드가 서로 바뀐 것 같아요. 분위기는 음악이 주는 기분이에요. 어떤 곡은 편안하고 안정적으로 들리고, 어떤 곡은 낯설고 긴장되게 들립니다. 두 곡을 번갈아 들으며, 지금 넣은 카드가 그 기분과 같은 쪽인지 다시 맞춰 보세요.',
    swapExample:
      '각 곡을 듣고 「편안하고 안정적」과 「낯설고 긴장감」 중 어디에 가까운지 한 단어로 말한 뒤 카드를 다시 옮겨 보세요.',
    missingTonalHint:
      '송어 칸의 분위기 카드가 아직 맞지 않아요. 분위기는 곡이 전하는 기분이에요. 송어 구간만 들으며 편안하고 안정적인지, 낯설고 긴장되는지 먼저 느낀 다음, 그 기분에 가까운 카드를 골라 보세요.',
    missingAtonalHint:
      '피에로 칸의 분위기 카드가 아직 맞지 않아요. 분위기는 곡이 전하는 기분이에요. 피에로 구간만 들으며 편안하고 안정적인지, 낯설고 긴장되는지 먼저 느낀 다음, 그 기분에 가까운 카드를 골라 보세요.',
    bothWrongHint:
      '분위기 구분이 아직 곡과 잘 맞지 않아요. 분위기는 음악이 주는 감정이에요. 편안하고 안정적인 느낌은 마음이 가라앉듯 들리고, 낯설고 긴장되는 느낌은 예측하기 어렵게 들릴 수 있어요. 두 곡의 기분을 각각 먼저 말한 뒤, 카드가 그 기분과 같은 칸에 들어가 있는지 다시 살펴보세요.',
    bothWrongExample:
      '곡마다 「편안·안정」인지 「낯설·긴장」인지 한 단어로 말한 다음, 그 말에 맞는 카드를 각 칸에 다시 넣어 보세요.'
  },
  {
    label: '음 어울림',
    tonalCard: '음들이 서로 잘 어울린다.',
    atonalCard: '음들이 따로 논다.',
    cards: ['음들이 서로 잘 어울린다.', '음들이 따로 논다.'],
    focus: '잘 붙어 어울림 · 따로 움직임',
    swapHint:
      '음 어울림 카드가 서로 바뀐 것 같아요. 음 어울림은 여러 음이 어떻게 함께 울리는지를 말해요. 어떤 곡은 음들이 잘 붙어 하나로 들리고, 어떤 곡은 음들이 각자 따로 노는 것처럼 들립니다. 두 곡을 번갈아 들으며, 지금 넣은 카드가 그 화음 느낌과 같은 쪽인지 다시 맞춰 보세요.',
    swapExample:
      '각 곡을 듣고 「잘 붙어 어울림」과 「따로 움직임」 중 어디에 가까운지 한 단어로 말한 뒤 카드를 다시 옮겨 보세요.',
    missingTonalHint:
      '송어 칸의 음 어울림 카드가 아직 맞지 않아요. 음 어울림은 여러 음이 함께 울릴 때의 느낌이에요. 송어 구간만 들으며 음들이 잘 붙어 있는지, 각자 따로 노는지 짚어 본 다음, 그 느낌에 가까운 카드를 골라 보세요.',
    missingAtonalHint:
      '피에로 칸의 음 어울림 카드가 아직 맞지 않아요. 음 어울림은 여러 음이 함께 울릴 때의 느낌이에요. 피에로 구간만 들으며 음들이 잘 붙어 있는지, 각자 따로 노는지 짚어 본 다음, 그 느낌에 가까운 카드를 골라 보세요.',
    bothWrongHint:
      '음 어울림 구분이 아직 곡과 잘 맞지 않아요. 음 어울림은 화음처럼 여러 음이 어떻게 만나느냐를 말해요. 잘 어울리면 음이 하나로 붙고, 따로 놀면 음이 서로 겉도는 듯 들립니다. 두 곡의 화음 느낌을 각각 먼저 짚은 뒤, 카드가 그 소리와 같은 칸에 들어가 있는지 다시 살펴보세요.',
    bothWrongExample:
      '곡마다 「잘 어울림」인지 「따로 움직임」인지 한 단어로 말한 다음, 그 말에 맞는 카드를 각 칸에 다시 넣어 보세요.'
  }
];

function cellCards(placed, cardIds) {
  return cardIds
    .filter((card) => placed.includes(card))
    .map((label) => ({ id: label, label }));
}

function isDimRowOk(tonal, atonal, dim) {
  return (
    tonal.includes(dim.tonalCard) &&
    !tonal.includes(dim.atonalCard) &&
    atonal.includes(dim.atonalCard) &&
    !atonal.includes(dim.tonalCard)
  );
}

function cellStatus(placed, dim, which) {
  const correct = which === 'tonal' ? dim.tonalCard : dim.atonalCard;
  const wrong = which === 'tonal' ? dim.atonalCard : dim.tonalCard;
  const hasCorrect = placed.includes(correct);
  const hasWrong = placed.includes(wrong);
  if (hasCorrect && !hasWrong) return 'ok';
  if (!hasCorrect && !hasWrong) return 'empty';
  return 'miss';
}

function buildDimFeedback(tonal, atonal, dim) {
  const tonalStatus = cellStatus(tonal, dim, 'tonal');
  const atonalStatus = cellStatus(atonal, dim, 'atonal');
  const rowOk = isDimRowOk(tonal, atonal, dim);
  const swapped = tonal.includes(dim.atonalCard) && atonal.includes(dim.tonalCard);

  let note = '';
  let hint = '';
  let example = '';

  if (rowOk) {
    note = `${dim.label} 구분은 양쪽 칸이 모두 맞아요.`;
  } else if (swapped) {
    note = `${dim.label} 카드가 송어·피에로 칸에서 서로 바뀐 것 같아요.`;
    hint = dim.swapHint;
    example = dim.swapExample;
  } else if (tonalStatus === 'ok' && atonalStatus !== 'ok') {
    note = `송어 칸의 ${dim.label}은 맞아요. 피에로 칸의 ${dim.label}만 다시 맞춰 보세요.`;
    hint = dim.missingAtonalHint;
    example = dim.swapExample;
  } else if (atonalStatus === 'ok' && tonalStatus !== 'ok') {
    note = `피에로 칸의 ${dim.label}은 맞아요. 송어 칸의 ${dim.label}만 다시 맞춰 보세요.`;
    hint = dim.missingTonalHint;
    example = dim.swapExample;
  } else {
    note = `${dim.label} 구분이 아직 곡과 잘 맞지 않아요.`;
    hint = dim.bothWrongHint;
    example = dim.bothWrongExample;
  }

  const theme1Cards = cellCards(tonal, dim.cards).map((card) => ({
    ...card,
    status: card.label === dim.tonalCard ? 'ok' : 'miss'
  }));
  const theme2Cards = cellCards(atonal, dim.cards).map((card) => ({
    ...card,
    status: card.label === dim.atonalCard ? 'ok' : 'miss'
  }));

  return {
    dim: dim.label,
    focus: dim.focus,
    theme1: theme1Cards.map((c) => c.label),
    theme2: theme2Cards.map((c) => c.label),
    theme1Cards,
    theme2Cards,
    t1Status: tonalStatus,
    t2Status: atonalStatus,
    needsWork: !rowOk,
    status: rowOk ? 'ok' : 'miss',
    note,
    hint,
    example
  };
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
    intro =
      '송어 칸은 방향이 맞아요. 아래 표에서 「다시 보기」가 붙은 구분만 피에로 구간에 맞춰 다시 골라 보세요.';
  } else if (colAtonalOk && !colTonalOk) {
    intro =
      '피에로 칸은 방향이 맞아요. 아래 표에서 「다시 보기」가 붙은 구분만 송어 구간에 맞춰 다시 골라 보세요.';
  } else {
    intro =
      '아래 표에서 「맞음」과 「다시 보기」를 확인한 뒤, 틀린 구분만 두 곡을 비교해 다시 맞춰 보세요.';
  }

  const rows = SB_ATONAL_DIMS.map((dim) => buildDimFeedback(tonal, atonal, dim));
  const missRows = rows.filter((row) => row.needsWork);

  const hints = missRows.map((row) => ({
    dim: row.dim,
    text: row.hint,
    example: row.example,
    note: row.note
  }));

  const fallbackNote =
    hints.length === 0
      ? '칸마다 카드가 여러 장이면, 같은 구분(조성·분위기·음 어울림)끼리 서로 맞는지 다시 점검해 보세요.'
      : null;

  return {
    intro,
    rows,
    hints,
    fallbackNote,
    footer: '정답 카드 이름은 알려 주지 않아요. 표의 힌트만 보고 다시 골라 보세요. 다시 들어보세요.'
  };
}
