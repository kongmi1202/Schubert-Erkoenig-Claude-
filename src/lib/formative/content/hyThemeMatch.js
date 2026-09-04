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
    t1Card: 'o1',
    t2Card: 'o2',
    cards: ['o1', 'o2'],
    focus: '음과 음 사이 · 멀리 뜀 / 옆으로 이어짐',
    t1OkNote: '제1주제 칸의 선율 카드가 맞아요.',
    t2OkNote: '제2주제 칸의 선율 카드가 맞아요.',
    swapHint:
      '선율 카드가 서로 바뀐 것 같아요. 선율은 음과 음 사이가 어떻게 이어지는지를 말해요. 어떤 선율은 음이 멀리 뛰어오르듯 움직이고, 어떤 선율은 옆 음으로 살살 걸어가듯 이어져요. 두 클립을 번갈아 들으며, 지금 칸에 넣은 카드가 그 소리의 움직임과 같은 쪽인지 다시 맞춰 보세요.',
    swapExample:
      '손가락으로 음 높낮이를 따라가 보세요. 「멀리 뛰는 움직임」과 「옆 음으로 이어지는 움직임」 중, 각 클립이 어디에 가까운지 먼저 말한 뒤 카드를 다시 옮겨 보세요.',
    missingT1Hint:
      '제1주제 칸의 선율 카드가 아직 맞지 않아요. 선율은 음의 이어지는 모양이에요. 제1주제 클립만 다시 들으며, 음과 음 사이가 멀리 뛰어오르는지 옆 음으로 이어지는지 귀로 짚어 본 다음, 그 움직임에 가까운 카드를 골라 보세요.',
    missingT2Hint:
      '제2주제 칸의 선율 카드가 아직 맞지 않아요. 선율은 음의 이어지는 모양이에요. 제2주제 클립만 다시 들으며, 음과 음 사이가 멀리 뛰어오르는지 옆 음으로 이어지는지 귀로 짚어 본 다음, 그 움직임에 가까운 카드를 골라 보세요.',
    bothWrongHint:
      '선율 구분이 아직 주제와 잘 맞지 않아요. 선율은 음이 어떻게 이어지는지를 뜻해요. 멀리 뛰어오르는 움직임은 간격이 크게 들리고, 순차로 이어지는 움직임은 옆 음처럼 가깝게 들립니다. 두 클립을 각각 들으며 그 차이를 먼저 느낀 뒤, 카드가 그 소리와 같은 칸에 들어가 있는지 다시 살펴보세요.',
    bothWrongExample:
      '클립마다 「멀리 뜀」인지 「옆으로 이어짐」인지 한 단어로 말한 다음, 그 말에 맞는 카드를 각 칸에 다시 넣어 보세요.'
  },
  {
    label: '리듬',
    t1Card: 'o3',
    t2Card: 'o4',
    cards: ['o3', 'o4'],
    focus: '리듬꼴 · 짧게 끊김 / 길게 흐름',
    t1OkNote: '제1주제 칸의 리듬 카드가 맞아요.',
    t2OkNote: '제2주제 칸의 리듬 카드가 맞아요.',
    swapHint:
      '리듬 카드가 서로 바뀐 것 같아요. 리듬은 소리가 짧게 끊기는지, 길게 이어지는지를 말해요. 짧게 끊기면 톡톡 찍히듯 들리고, 길게 이어지면 늘어지며 흐르듯 들립니다. 두 클립을 번갈아 들으며, 지금 넣은 카드가 그 리듬 느낌과 같은 쪽인지 다시 맞춰 보세요.',
    swapExample:
      '손바닥으로 박을 맞춰 보세요. 「짧게 톡톡」과 「길게 흐르는」 중 각 클립이 어디에 가까운지 말한 뒤 카드를 다시 옮겨 보세요.',
    missingT1Hint:
      '제1주제 칸의 리듬 카드가 아직 맞지 않아요. 리듬은 음의 길이와 끊김을 뜻해요. 제1주제 클립만 들으며, 짧게 톡톡 끊기는지 길게 흐르는지 손바닥으로 맞춰 본 다음, 그 느낌에 가까운 카드를 골라 보세요.',
    missingT2Hint:
      '제2주제 칸의 리듬 카드가 아직 맞지 않아요. 리듬은 음의 길이와 끊김을 뜻해요. 제2주제 클립만 들으며, 짧게 톡톡 끊기는지 길게 흐르는지 손바닥으로 맞춰 본 다음, 그 느낌에 가까운 카드를 골라 보세요.',
    bothWrongHint:
      '리듬 구분이 아직 주제와 잘 맞지 않아요. 리듬은 소리가 어떻게 길이로 움직이는지를 말해요. 짧은 리듬은 또렷하게 끊기고, 긴 리듬은 부드럽게 이어집니다. 두 클립의 리듬 느낌을 각각 먼저 짚은 뒤, 카드가 그 소리와 같은 칸에 들어가 있는지 다시 살펴보세요.',
    bothWrongExample:
      '클립마다 「짧게 끊김」인지 「길게 이어짐」인지 한 단어로 말한 다음, 그 말에 맞는 카드를 각 칸에 다시 넣어 보세요.'
  },
  {
    label: '느낌',
    t1Card: 'o5',
    t2Card: 'o6',
    cards: ['o5', 'o6'],
    focus: '분위기 · 밝고 활기 / 부드럽고 서정',
    t1OkNote: '제1주제 칸의 느낌 카드가 맞아요.',
    t2OkNote: '제2주제 칸의 느낌 카드가 맞아요.',
    swapHint:
      '느낌 카드가 서로 바뀐 것 같아요. 느낌은 음악이 주는 분위기예요. 어떤 주제는 가볍고 또렷하게 들리고, 어떤 주제는 잔잔하고 노래하듯 부드럽게 들립니다. 두 클립을 번갈아 들으며, 지금 넣은 카드가 그 분위기와 같은 쪽인지 다시 맞춰 보세요.',
    swapExample:
      '각 클립을 듣고 「또렷하고 가벼운 기분」과 「잔잔하고 부드러운 기분」 중 어디에 가까운지 한 단어로 말한 뒤 카드를 다시 옮겨 보세요.',
    missingT1Hint:
      '제1주제 칸의 느낌 카드가 아직 맞지 않아요. 느낌은 곡이 주는 분위기예요. 제1주제 클립만 들으며, 분위기가 또렷하고 가벼운지 잔잔하고 부드러운지 먼저 느낀 다음, 그 기분에 가까운 카드를 골라 보세요.',
    missingT2Hint:
      '제2주제 칸의 느낌 카드가 아직 맞지 않아요. 느낌은 곡이 주는 분위기예요. 제2주제 클립만 들으며, 분위기가 또렷하고 가벼운지 잔잔하고 부드러운지 먼저 느낀 다음, 그 기분에 가까운 카드를 골라 보세요.',
    bothWrongHint:
      '느낌 구분이 아직 주제와 잘 맞지 않아요. 느낌은 음악이 전하는 분위기예요. 밝고 활기찬 느낌은 또렷하고 가볍게, 부드럽고 서정적인 느낌은 잔잔하고 노래하듯 들립니다. 두 클립의 분위기를 각각 먼저 말한 뒤, 카드가 그 기분과 같은 칸에 들어가 있는지 다시 살펴보세요.',
    bothWrongExample:
      '클립마다 「밝고 또렷함」인지 「잔잔하고 부드러움」인지 한 단어로 말한 다음, 그 말에 맞는 카드를 각 칸에 다시 넣어 보세요.'
  }
];

function cellCards(placed, cardIds) {
  return cardIds
    .filter((id) => placed.includes(id))
    .map((id) => ({
      id,
      label: HY_MATCH_LABELS[id]
    }));
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

function cellStatus(placed, dim, which) {
  const correctId = which === 't1' ? dim.t1Card : dim.t2Card;
  const wrongId = which === 't1' ? dim.t2Card : dim.t1Card;
  const hasCorrect = placed.includes(correctId);
  const hasWrong = placed.includes(wrongId);
  if (hasCorrect && !hasWrong) return 'ok';
  if (!hasCorrect && !hasWrong) return 'empty';
  return 'miss';
}

function buildDimFeedback(t1, t2, dim) {
  const t1Status = cellStatus(t1, dim, 't1');
  const t2Status = cellStatus(t2, dim, 't2');
  const rowOk = isDimRowOk(t1, t2, dim);
  const swapped = t1.includes(dim.t2Card) && t2.includes(dim.t1Card);

  let note = '';
  let hint = '';
  let example = '';

  if (rowOk) {
    note = `${dim.label} 구분은 양쪽 칸이 모두 맞아요.`;
  } else if (swapped) {
    note = `${dim.label} 카드가 제1·제2주제 칸에서 서로 바뀐 것 같아요.`;
    hint = dim.swapHint;
    example = dim.swapExample;
  } else if (t1Status === 'ok' && t2Status !== 'ok') {
    note = `제1주제 칸의 ${dim.label}은 맞아요. 제2주제 칸의 ${dim.label}만 다시 맞춰 보세요.`;
    hint = dim.missingT2Hint;
    example = dim.swapExample;
  } else if (t2Status === 'ok' && t1Status !== 'ok') {
    note = `제2주제 칸의 ${dim.label}은 맞아요. 제1주제 칸의 ${dim.label}만 다시 맞춰 보세요.`;
    hint = dim.missingT1Hint;
    example = dim.swapExample;
  } else {
    note = `${dim.label} 구분이 아직 주제와 잘 맞지 않아요.`;
    hint = dim.bothWrongHint;
    example = dim.bothWrongExample;
  }

  const theme1Cards = cellCards(t1, dim.cards).map((card) => ({
    ...card,
    status: card.id === dim.t1Card ? 'ok' : 'miss'
  }));
  const theme2Cards = cellCards(t2, dim.cards).map((card) => ({
    ...card,
    status: card.id === dim.t2Card ? 'ok' : 'miss'
  }));

  return {
    dim: dim.label,
    focus: dim.focus,
    theme1: theme1Cards.map((c) => c.label),
    theme2: theme2Cards.map((c) => c.label),
    theme1Cards,
    theme2Cards,
    t1Status,
    t2Status,
    needsWork: !rowOk,
    status: rowOk ? 'ok' : 'miss',
    note,
    hint,
    example
  };
}

/**
 * @returns {{ intro: string, rows: Array, hints: Array, fallbackNote: string|null, footer: string }}
 */
export function buildHyThemeMatchWrongPayload(t1, t2, { col1Ok, col2Ok }) {
  let intro;
  if (col1Ok && !col2Ok) {
    intro =
      '제1주제 칸은 방향이 맞아요. 아래 표에서 「다시 보기」가 붙은 구분만 제2주제 클립에 맞춰 다시 골라 보세요.';
  } else if (col2Ok && !col1Ok) {
    intro =
      '제2주제 칸은 방향이 맞아요. 아래 표에서 「다시 보기」가 붙은 구분만 제1주제 클립에 맞춰 다시 골라 보세요.';
  } else {
    intro =
      '아래 표에서 「맞음」과 「다시 보기」를 확인한 뒤, 틀린 구분만 두 클립을 비교해 다시 맞춰 보세요.';
  }

  const rows = HY_THEME_DIMS.map((dim) => buildDimFeedback(t1, t2, dim));
  const missRows = rows.filter((row) => row.needsWork);

  const hints = missRows.map((row) => ({
    dim: row.dim,
    text: row.hint,
    example: row.example,
    note: row.note
  }));

  const fallbackNote =
    hints.length === 0
      ? '칸마다 카드가 여러 장이면, 같은 구분(선율·리듬·느낌)끼리 서로 맞는지 다시 점검해 보세요.'
      : null;

  return {
    intro,
    rows,
    hints,
    fallbackNote,
    footer: '정답 카드 이름은 알려 주지 않아요. 표의 힌트만 보고 다시 골라 보세요. 다시 들어보세요.'
  };
}
