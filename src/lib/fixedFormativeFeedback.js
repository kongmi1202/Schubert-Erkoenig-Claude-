import { normalizeFormativeChoice } from './compareFeedback';

function verification(isCorrect, correctBody, wrongBody) {
  return isCorrect ? `검증: ✓\n${correctBody}` : `검증: ✗\n${wrongBody}`;
}

export function getVvSonnetFixedFeedback({ userChoice, correctAnswer, correctElaboration }) {
  if (!normalizeFormativeChoice(userChoice)) {
    return '먼저 보기 중 하나를 고른 뒤 피드백 보기를 눌러 주세요.';
  }
  const isCorrect =
    normalizeFormativeChoice(userChoice) === normalizeFormativeChoice(correctAnswer);
  if (isCorrect) {
    const body = correctElaboration
      ? `${String(correctElaboration).replace(/^[✓✔]\s*/, '')}`
      : '표제음악에서는 시의 장면과 음악의 셈여림·빠르기·리듬꼴이 맞물려요.';
    return verification(true, body);
  }
  return verification(
    false,
    '',
    '같은 구간을 다시 들으며 셈여림(소리의 세기)·속도(템포)·리듬꼴 중 어디가 달라지는지 들어 보세요. 다시 생각해보세요.'
  );
}

export function getVvConcertoFixedFeedback({ userChoice, correctAnswer }) {
  if (!normalizeFormativeChoice(userChoice)) {
    return '먼저 보기 중 하나를 고른 뒤 피드백 보기를 눌러 주세요.';
  }
  const isCorrect =
    normalizeFormativeChoice(userChoice) === normalizeFormativeChoice(correctAnswer);
  if (isCorrect) {
    return verification(
      true,
      '바이올린 협주곡에서는 독주와 총주의 음색·밀도 대비가 중요해요. 영상에서 솔로와 앙상블 구간이 어떻게 바뀌는지 귀로 비교해 보세요.'
    );
  }
  return verification(
    false,
    '',
    '영상에서 바이올린 한 대가 두드러지는 구간과 현악 전체가 함께 울리는 구간을 번갈아 짚어 보세요. 다시 들어보세요.'
  );
}

export function getCpFormAbaDiscoveryFixedFeedback({ userChoice, correctAnswer }) {
  if (!normalizeFormativeChoice(userChoice)) {
    return '먼저 보기 중 하나를 고른 뒤 피드백 보기를 눌러 주세요.';
  }
  const isCorrect =
    normalizeFormativeChoice(userChoice) === normalizeFormativeChoice(correctAnswer);
  if (isCorrect) {
    return verification(
      true,
      'ABA 형식에서 가운데 구간은 앞·뒤와 다른 느낌을 만듭니다. A·B·A\u2019를 이어 들으며 셈여림과 빠르기가 어떻게 달라지는지 짚어 보세요.'
    );
  }
  return verification(
    false,
    '',
    '세 구간의 셈여림(소리의 세기)과 빠르기만 귀로 비교해 보세요. 가운데 구간이 앞·뒤와 어떻게 다른지 들어 보세요. 다시 들어보세요.'
  );
}

export function getTonePaintingFixedFeedback({ segmentTitle, selectedIndex, correctIndex, correctElaboration }) {
  if (selectedIndex === null || selectedIndex === undefined) {
    return `${segmentTitle}에서 먼저 보기 중 하나를 선택한 뒤 피드백 보기를 눌러 주세요.`;
  }
  const isCorrect = selectedIndex === correctIndex;
  if (isCorrect) {
    const body = correctElaboration
      ? String(correctElaboration).replace(/^[✓✔]\s*/, '')
      : '가사와 음악의 음화법 연결을 잘 짚었어요. 음높이·반복·선율 흐름이 가사와 어떻게 맞는지 다시 들어 보세요.';
    return verification(true, body);
  }
  return verification(
    false,
    '',
    '가사의 핵심 단어가 나올 때 음 높낮이, 반복, 선율 길이 중 어디에 귀를 둘지 들어 보세요. 다시 생각해보세요.'
  );
}

export function getVoiceDesignFixedFeedback(selectedChars, voiceDesign, answerKey) {
  const keys = ['음높이', '음계', '리듬꼴', '음색'];
  const name = selectedChars?.[0];
  if (!name) {
    return '인물을 선택하고 네 항목을 모두 고른 뒤 피드백 보기를 눌러 주세요.';
  }
  const row = voiceDesign?.[name] || {};
  const answer = answerKey?.[name] || {};
  const filled = keys.every((k) => row[k]);
  if (!filled) {
    return '음높이·음계·리듬꼴·음색을 모두 고른 뒤 피드백 보기를 눌러 주세요.';
  }
  const allMatch = keys.every((k) => row[k] === answer[k]);
  if (allMatch) {
    return verification(
      true,
      `「${name}」의 음높이·음계·리듬꼴·음색이 과제와 맞아요. 이 인물 구간을 다시 들으며 네가 고른 네 가지가 소리와 어떻게 연결되는지 확인해 보세요.`
    );
  }
  const revisit = keys.filter((k) => row[k] !== answer[k]);
  return verification(
    false,
    '',
    `${revisit.join('·')}부터 다시 들으며 소리의 높낮이, 밝고 어두운 느낌, 리듬 길이, 목소리 굵기를 귀로 비교해 보세요. 다시 들어보세요.`
  );
}

export function getHyThemePart3FixedFeedback({ selectedDeg }) {
  if (!selectedDeg) {
    return '3도·5도·8도 중 하나를 고른 뒤 피드백 보기를 눌러 주세요.';
  }
  const isCorrect = selectedDeg === '5도';
  if (isCorrect) {
    return verification(
      true,
      'G에서 D까지의 간격을 건반에서 세어 보았어요. 두 주제의 조성 관계를 선율과 연결해 생각해 보세요.'
    );
  }
  return verification(
    false,
    '',
    '시작음 G와 목표음 D를 건반에서 함께 누른 뒤, 그 사이를 한 칸씩 세어 보세요. 다시 생각해보세요.'
  );
}
