import { normalizeFormativeChoice } from './compareFeedback';
import { gradePianoLhScene, gradePianoRhScene } from './pianoSceneAnswers';
import { VOICE_DESIGN_FIELD_KEYS, normalizeVoiceDesignRow } from './voiceDesignAnswers';
import {
  countTokenHits,
  evaluateOverviewQuestion,
  gradeOverviewQ1,
  gradeOverviewQ2,
  includesAnyToken
} from './overviewGrading';

function verification(isCorrect, correctBody, wrongBody) {
  return isCorrect ? `검증: ✓\n${correctBody}` : `검증: ✗\n${wrongBody}`;
}

export function getVvSonnetFixedFeedback({ userChoice, correctAnswer, correctElaboration, segmentId }) {
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
  const wrongBody = VV_SONNET_WRONG_FEEDBACK[segmentId]?.[userChoice]
    || '같은 구간을 다시 들으며 셈여림(소리의 세기)·속도(템포)·리듬꼴 중 어디가 달라지는지 들어 보세요. 다시 생각해보세요.';
  return verification(false, '', wrongBody);
}

const VV_SONNET_WRONG_FEEDBACK = {
  'vv-c1': {
    '음이 부드럽고 느리게 이어진다':
      '「음이 부드럽고 느리게 이어진다」를 골랐어요. 부드러운 선율은 잔잔한 바람이나 고요한 장면에 잘 어울리죠.\n이 소네트는 하늘이 천둥치고 번개가 번쩍이는 장면이에요. 같은 구간을 다시 들으며, 소리가 살살 이어지는지 아니면 갑자기 세게 터지듯 들리는지 셈여림(소리의 세기)과 빠르기만 비교해 보세요.\n다시 들어보세요.',
    '음이 점점 낮아지며 사라진다':
      '「음이 점점 낮아지며 사라진다」를 골랐어요. 음이 아래로 잦아들면 장면이 멀어지거나 잠잠해지는 느낌이 나요.\n번개가 번쩍이는 가사와 맞춰 들으며, 이 구간이 점점 사그라드는지 아니면 세게 치고 나가는지 처음과 한가운데의 셈여림을 비교해 보세요.\n다시 들어보세요.'
  },
  'vv-c2': {
    '음이 길게 이어지며 서정적으로 흐른다':
      '「음이 길게 이어지며 서정적으로 흐른다」를 골랐어요. 긴 선율은 노래처럼 이어지는 장면에 잘 맞아요.\n가사는 우박이 이삭을 때리는 장면이에요. 우박이 뚝뚝 떨어지는 모습을 떠올리며, 음이 길게 흐르는지 짧게 톡톡 끊기는지 리듬꼴만 다시 들어 보세요.\n다시 들어보세요.',
    '음이 매우 느리고 조용해진다':
      '「음이 매우 느리고 조용해진다」를 골랐어요. 느리고 조용한 음악은 잠잠해지는 장면에 잘 어울리죠.\n우박이 쏟아지는 가사와 맞춰 들으며, 이 구간이 잠잠한지 아니면 짧고 또렷한 음이 여러 번 부딪히듯 들리는지 빠르기와 셈여림을 비교해 보세요.\n다시 들어보세요.'
  }
};

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
  const wrongBody = VV_CONCERTO_WRONG_FEEDBACK[userChoice]
    || '영상에서 바이올린 한 대가 두드러지는 구간과 현악 전체가 함께 울리는 구간을 번갈아 짚어 보세요. 다시 들어보세요.';
  return verification(false, '', wrongBody);
}

const VV_CONCERTO_WRONG_FEEDBACK = {
  '독주만 계속 나온다':
    '「독주만 계속 나온다」를 골랐어요. 바이올린 한 대가 앞에서 노래하듯 연주하는 느낌이 강했나 봐요.\n영상 전체를 다시 들으며, 한 대만 나오는지, 여러 현악기가 한꺼번에 들어와 소리가 두꺼워지는 순간도 있는지 음색의 밀도만 비교해 보세요.\n다시 들어보세요.',
  '총주만 계속 나온다':
    '「총주만 계속 나온다」를 골랐어요. 현악 그룹이 함께 울리는 울림이 크게 들렸나 봐요.\n영상 가운데를 다시 들으며, 전체가 계속 나오는지, 한 대가 앞으로 나와 소리가 얇아지는 순간도 있는지 독주와 그룹의 교대를 찾아 보세요.\n다시 들어보세요.'
};

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
  const wrongBody = CP_FORM_DISCOVERY_WRONG_FEEDBACK[userChoice]
    || '세 구간의 셈여림(소리의 세기)과 빠르기만 귀로 비교해 보세요. 가운데 구간이 앞·뒤와 어떻게 다른지 들어 보세요. 다시 들어보세요.';
  return verification(false, '', wrongBody);
}

const CP_FORM_DISCOVERY_WRONG_FEEDBACK = {
  '곡을 더 길게 만들기 위해':
    '「곡을 더 길게 만들기 위해」를 골랐어요. 가운데 구간이 시간만 늘리는 역할처럼 들렸나 봐요.\n세 구간을 이어서 들으며, 가운데가 앞·뒤와 같은 빠르기·세기로 그냥 이어지는지, 아니면 소리가 확 바뀌는지 셈여림과 템포만 비교해 보세요.\n다시 들어보세요.',
  '연주자가 쉬기 위해':
    '「연주자가 쉬기 위해」를 골랐어요. 가운데가 쉬는 시간처럼 잠잠해진다고 느꼈나 봐요.\n가운데 구간이 정말 멈추고 쉬는지, 아니면 다른 빠르기와 세기로 계속 연주되는지 소리의 움직임만 다시 들어 보세요.\n다시 들어보세요.'
};

const CP_FORM_SEGMENT_CORRECT_BODY = {
  'cp-f1':
    '이 구간은 형식의 첫 부분(A)이에요. 빠르기(템포)가 빠르고 셈여림(ff)이 강하게 들려 긴장감·에너지를 만듭니다.',
  'cp-f2':
    '이 구간은 A와 대비되는 가운데 부분(B)이에요. 빠르기가 느리고 셈여림(pp)이 부드럽게 들려 앞 구간과 극적으로 달라집니다.',
  'cp-f3':
    "이 구간은 A와 비슷한 마지막 부분(A')이에요. 다시 빠르고 강하게 돌아오지만, 끝에서는 셈여림이 조용히 줄어들어요."
};

const CP_FORM_LABEL_WRONG_HINT = {
  A: {
    hint: '「A」는 곡의 처음처럼 같은 출발점이라는 뜻으로 자주 쓰여요. 이 구간이 시작 부분과 같은 에너지로 열리는지, 아니면 분위기가 바뀐 한가운데인지 앞·뒤와 비교해 들어 보세요.',
    example: '빠르기·셈여림이 처음과 비슷한지, 확 달라졌는지 한 문장으로 말해 본 뒤 이름을 다시 골라 보세요.'
  },
  B: {
    hint: '「B」는 가운데처럼 앞뒤와 다른 부분이라는 뜻으로 자주 쓰여요. 이 구간이 정말 앞·뒤와 다른 빠르기·세기인지, 아니면 처음과 비슷한 에너지로 다시 열리는지 들어 보세요.',
    example: '부드럽게 느려지는지, 빠르고 강하게 밀어붙이는지 귀로만 비교해 보세요.'
  },
  "A'": {
    hint: '「A\u2019」는 처음과 비슷하게 다시 돌아오는 느낌으로 자주 쓰여요. 이 구간이 처음과 비슷한 에너지로 돌아오는지, 아니면 한가운데처럼 다른 분위기인지 들어 보세요.',
    example: '끝으로 갈수록 처음과 닮아지는지, 전혀 다른 색으로 남는지만 비교해 보세요.'
  }
};

const CP_FORM_FEATURE_WRONG_HINT = {
  '빠르고 강하다': {
    hint: '「빠르고 강하다」를 골랐어요. 빠르게 몰아치고 세게 울리는 구간처럼 들렸나 봐요. 이 구간만 다시 들으며 템포가 급한지, 셈여림이 세게 밀어붙이는지 확인해 보세요.',
    example: '심장이 빨라지는 느낌인지, 숨이 느려지는 느낌인지 한 단어로 말해 본 뒤 보기를 다시 고르세요.'
  },
  '느리고 부드럽다': {
    hint: '「느리고 부드럽다」를 골랐어요. 숨이 느려지고 소리가 감싸는 구간처럼 들렸나 봐요. 이 구간만 다시 들으며 템포가 느린지, 셈여림이 여린지 확인해 보세요.',
    example: '살살 감싸는지, 세게 밀어붙이는지 귀로만 비교해 보세요.'
  }
};

/**
 * 쇼팽 ABA 구간 카드 — 이름(A/B/A') + 특징(빠르기·셈여림) 형성적 피드백
 * @returns {{ kind: 'voice-sections', ... } | { kind: 'plain', text: string }}
 */
export function getCpFormSegmentFixedFeedback({
  cardId,
  label,
  feature,
  correctLabel,
  correctFeature
}) {
  const pickedLabel = String(label || '').trim();
  const pickedFeature = String(feature || '').trim();
  if (!pickedLabel || !pickedFeature) {
    return {
      kind: 'plain',
      text: '구간 이름(A·B·A\u2019)과 특징을 모두 고른 뒤 피드백 보기를 눌러 주세요.'
    };
  }

  const labelOk = pickedLabel === correctLabel;
  const featureOk = pickedFeature === correctFeature;
  const allMatch = labelOk && featureOk;
  const matchedCount = (labelOk ? 1 : 0) + (featureOk ? 1 : 0);
  const labelHint = CP_FORM_LABEL_WRONG_HINT[pickedLabel] || {
    hint: '앞·뒤 구간과 비교해, 이 구간이 처음과 비슷한지·가운데처럼 다른지·다시 돌아오는 느낌인지 들어 보세요.',
    example: '빠르기·셈여림이 비슷한 구간끼리 같은 이름, 확 달라지면 다른 이름을 떠올려 보세요.'
  };
  const featureHint = CP_FORM_FEATURE_WRONG_HINT[pickedFeature] || {
    hint: '같은 구간을 다시 들으며 빠르기(템포)와 셈여림(소리의 세기)만 귀로 비교해 보세요.',
    example: '빠른지·느린지, 강하게 밀어붙이는지·부드럽게 감싸는지 한 문장으로 말한 뒤 보기를 다시 고르세요.'
  };

  const sections = [
    {
      field: 'label',
      label: '구간 이름',
      focus: '형식 · A / B / A\u2019',
      tone: 'pitch',
      status: labelOk ? 'ok' : 'miss',
      studentPick: pickedLabel,
      note: labelOk
        ? '구간 이름 선택이 맞아요.'
        : `네가 고른 「${pickedLabel}」은 이 구간의 형식 위치와 잘 맞지 않아요.`,
      hint: labelOk ? '' : labelHint.hint,
      example: labelOk ? '' : labelHint.example
    },
    {
      field: 'feature',
      label: '구간 특징',
      focus: '빠르기 · 셈여림',
      tone: 'timbre',
      status: featureOk ? 'ok' : 'miss',
      studentPick: pickedFeature,
      note: featureOk
        ? '구간 특징 선택이 맞아요.'
        : `네가 고른 「${pickedFeature}」은 이 구간의 소리 특징과 잘 맞지 않아요.`,
      hint: featureOk ? '' : featureHint.hint,
      example: featureOk ? '' : featureHint.example
    }
  ];

  if (allMatch) {
    return {
      kind: 'voice-sections',
      isCorrect: true,
      verification: '검증: ✓',
      character: cardId,
      summary: '구간 이름과 특징이 모두 맞아요.',
      sections,
      footer: CP_FORM_SEGMENT_CORRECT_BODY[cardId] || '형식·빠르기·셈여림이 어떻게 맞물리는지 다시 들어 보세요.'
    };
  }

  return {
    kind: 'voice-sections',
    isCorrect: false,
    verification: '검증: ✗',
    character: cardId,
    summary: `구간 선택을 항목별로 점검했어요. 맞은 항목 ${matchedCount}개 · 다시 볼 항목 ${2 - matchedCount}개`,
    sections,
    footer: '정답 이름·특징 문구는 알려 주지 않아요. 각 영역의 힌트만 보고 다시 골라 보세요. 다시 들어보세요.'
  };
}

/**
 * 쇼팽 폴리리듬 활동 — 오른손/왼손 묶음·양손 겹침 객관식 형성적 피드백
 */
export function getCpRhythmFixedFeedback({ groupId, userChoice, correctAnswer }) {
  if (!normalizeFormativeChoice(userChoice)) {
    return '먼저 보기 중 하나를 고른 뒤 피드백 보기를 눌러 주세요.';
  }
  const isCorrect =
    normalizeFormativeChoice(userChoice) === normalizeFormativeChoice(correctAnswer);

  if (groupId === 'cp-rh-q') {
    if (isCorrect) {
      return verification(
        true,
        '오른손 선율은 16분음표가 짧게 이어져요. 한 박 안에 음표가 몇 개씩 묶이는지 귀와 악보를 함께 확인해 보세요.'
      );
    }
    const wrongBody = CP_RHYTHM_WRONG_FEEDBACK['cp-rh-q']?.[userChoice]
      || '오른손만 다시 들으며, 한 박 안에서 음표가 몇 개씩 묶여 빠르게 이어지는지 손으로 세어 보세요. 다시 들어보세요.';
    return verification(false, '', wrongBody);
  }

  if (groupId === 'cp-lh-q') {
    if (isCorrect) {
      return verification(
        true,
        '왼손 반주는 셋잇단음표로 묶여요. 오른손보다 조금 넓게 움직이는 리듬꼴을 귀로 비교해 보세요.'
      );
    }
    const wrongBody = CP_RHYTHM_WRONG_FEEDBACK['cp-lh-q']?.[userChoice]
      || '왼손만 다시 들으며, 한 묶음에 음표가 몇 개씩 모이는지 손바닥으로 박을 맞춰 세어 보세요. 다시 들어보세요.';
    return verification(false, '', wrongBody);
  }

  if (isCorrect) {
    return verification(
      true,
      '서로 다른 리듬꼴이 동시에 겹치는 것을 폴리리듬이라고 해요. 오른손·왼손의 박자가 같은지·다른지 격자표와 함께 다시 들어 보세요.'
    );
  }
  const wrongBody = CP_RHYTHM_WRONG_FEEDBACK['cp-poly-q']?.[userChoice]
    || '양손을 함께 들으며, 두 손이 같은 박으로 맞추는지·서로 다른 묶음으로 겹치는지·번갈아만 나오는지 비교해 보세요. 다시 들어보세요.';
  return verification(false, '', wrongBody);
}

const CP_RHYTHM_WRONG_FEEDBACK = {
  'cp-rh-q': {
    '2개씩':
      '「2개씩」을 골랐어요. 한 박에 음이 둘만 묶인다고 들렸나 봐요.\n오른손만 다시 들으며, 한 박 안에서 음이 두 번만 떨어지는지, 그보다 잘게 쪼개져 톡톡 지나가는지 손가락으로 세어 보세요.\n다시 들어보세요.',
    '3개씩':
      '「3개씩」을 골랐어요. 셋잇단처럼 세 개로 묶인다고 들렸나 봐요.\n오른손만 다시 들으며, 한 박의 음이 셋인지, 그보다 더 잘게 이어지는지 손으로 박을 맞춰 세어 보세요.\n다시 들어보세요.'
  },
  'cp-lh-q': {
    '2개씩':
      '「2개씩」을 골랐어요. 왼손이 둘씩 움직인다고 들렸나 봐요.\n왼손만 다시 들으며, 한 묶음이 둘로만 떨어지는지, 셋처럼 출렁이며 모이는지 손바닥으로 박을 맞춰 보세요.\n다시 들어보세요.',
    '4개씩':
      '「4개씩」을 골랐어요. 왼손도 오른손처럼 넷씩 잘게 쪼개진다고 들렸나 봐요.\n왼손만 다시 들으며, 오른손만큼 촘촘한지, 조금 더 넓은 묶음으로 움직이는지 비교해 보세요.\n다시 들어보세요.'
  },
  'cp-poly-q': {
    '같은 박자로 함께 맞춰 연주한다':
      '「같은 박자로 함께 맞춰 연주한다」를 골랐어요. 두 손이 나란히 걷는 것처럼 들렸나 봐요.\n양손을 함께 들으며, 박이 동시에 떨어지는지, 조금씩 어긋나며 겹치는지 격자표와 함께 비교해 보세요.\n다시 들어보세요.',
    '한 손씩 번갈아 연주한다':
      '「한 손씩 번갈아 연주한다」를 골랐어요. 한 손이 쉬고 다른 손이 나온다고 들렸나 봐요.\n양손을 함께 들으며, 정말 한 손만 나오는지, 두 손이 동시에 울리는지 귀로 확인해 보세요.\n다시 들어보세요.',
    '두 손이 같은 음표 묶음으로 움직인다':
      '「두 손이 같은 음표 묶음으로 움직인다」를 골랐어요. 오른손과 왼손의 묶음 개수가 같다고 들렸나 봐요.\n한 손씩 나눠 들으며, 한 박 안의 음 개수가 같은지 다른지 손가락으로 세어 보세요.\n다시 들어보세요.'
  }
};

export function getTonePaintingFixedFeedback({
  segmentId,
  segmentTitle,
  selectedIndex,
  selectedLabel,
  correctIndex,
  correctElaboration
}) {
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
  const pick = selectedLabel || '';
  const wrongBody = TONE_PAINTING_WRONG_FEEDBACK[segmentId]?.[pick]
    || '가사의 핵심 단어가 나올 때 음 높낮이, 반복, 선율 길이 중 어디에 귀를 둘지 들어 보세요. 다시 생각해보세요.';
  return verification(false, '', wrongBody);
}

const TONE_PAINTING_WRONG_FEEDBACK = {
  s1: {
    '음이 갑자기 낮아진다':
      '「음이 갑자기 낮아진다」를 골랐어요. 음이 뚝 떨어지면 힘이 빠지거나 작아지는 느낌이 나기 쉬워요.\n가사는 ‘왕 중의 왕’으로, 가장 높은 권위를 찬양하는 구절이에요. 이 가사가 나올 때 선율이 아래로 내려가는지, 아니면 다른 방향으로 움직이는지 음 높낮이에만 귀를 모아 다시 들어 보세요.\n다시 들어보세요.',
    '리듬이 빨라진다':
      '「리듬이 빨라진다」를 골랐어요. 빨라지는 리듬은 긴박함을 잘 나타내죠. 그런데 이 구절의 핵심은 박자가 급해지는지보다, 가사의 의미를 음으로 그리는 음화법이에요.\n빠르기보다 ‘왕 중의 왕’이 나올 때 음이 어디로 가는지(위·아래)를 한 번만 더 따라가 보세요.\n다시 들어보세요.',
    '선율이 길게 이어진다':
      '「선율이 길게 이어진다」를 골랐어요. 선율이 길게 이어지는 느낌도 있을 수 있지만, 이 구절은 ‘왕’의 위대함을 어떻게 그리는지가 핵심이에요.\n음의 길이보다, 가사가 나올 때 음이 올라가거나 내려가는 방향에 귀를 기울여 보세요.\n다시 들어보세요.'
  },
  s2: {
    '지루함을 준다':
      '「지루함을 준다」를 골랐어요. 같은 말이 반복되면 지루하게 들릴 수도 있죠.\n다만 이 곡의 ‘할렐루야’ 반복이 힘이 빠지는지, 아니면 합창이 더 단단하게 쌓이는지 들어 보세요. 반복이 약해지는지·커지는지 셈여림과 함께 비교해 보면 효과가 달라 보여요.\n다시 들어보세요.',
    '슬픔을 나타낸다':
      '「슬픔을 나타낸다」를 골랐어요. 슬픈 음악은 보통 어둡고 가라앉은 분위기예요.\n‘할렐루야’는 찬양의 외침이에요. 이 구간이 슬프게 잦아드는지, 아니면 같은 말로 확신을 더하는 느낌인지 분위기를 다시 들어 보세요.\n다시 들어보세요.',
    '음악이 끝나는 느낌을 준다':
      '「음악이 끝나는 느낌을 준다」를 골랐어요. 반복이 마침표처럼 들릴 때도 있어요.\n이 구간의 ‘할렐루야’는 곡을 닫는 느낌일까요, 같은 말을 더 또렷이 외치는 느낌일까요? 반복이 끊기듯 끝나는지, 더 힘 있게 이어지는지 들어 보세요.\n다시 들어보세요.'
  },
  s3: {
    '음악이 갑자기 끝난다':
      '「음악이 갑자기 끝난다」를 골랐어요. 뚝 멈추는 끝은 ‘이제 그만’ 하는 느낌에 가깝죠.\n가사는 ‘영원히 영원히’예요. 이 구간이 갑자기 멈추는지, 아니면 선율이 끊이지 않고 이어지는지 끝부분까지 들어 보세요.\n다시 들어보세요.',
    '음이 매우 낮아진다':
      '「음이 매우 낮아진다」를 골랐어요. 낮은 음은 무겁거나 가라앉은 느낌을 주기 쉬워요.\n‘영원히’라는 가사가 나올 때 음이 아래로 내려가는지, 아니면 선율이 끝나지 않고 이어지는지 높낮이와 길이를 함께 들어 보세요.\n다시 들어보세요.',
    '리듬이 점점 빨라진다':
      '「리듬이 점점 빨라진다」를 골랐어요. 빨라지는 리듬은 긴박함을 잘 나타내죠. 그런데 이 가사는 ‘영원히’예요.\n박자가 급해지는지, 아니면 선율이 끝나지 않고 계속 흘러가는지, 빠르기보다 선율이 얼마나 이어지는지에 귀를 모아 보세요.\n다시 들어보세요.'
  }
};

/** 정답 보기 값을 쓰지 않고, 인물·요소별 듣기 초점·예시만 안내 */
const VOICE_FIELD_LISTEN_HINTS = {
  해설자: {
    선율: {
      hint: '이야기를 전하는 구간에서, 선율이 장면을 차분히 설명해 주는지·한곳에 맴도는지·화려하게 꾸며지는지 비교해 보세요.',
      example: '뉴스처럼 담담히 전하는 선율과, 유혹하듯 화려한 선율 중 영상에 가까운 쪽을 골라 보세요.'
    },
    음계: {
      hint: '이 구간의 기분부터 짚어 보세요. 밝고 경쾌한지, 아니면 어둡고 진지한지 귀로만 비교해 보세요.',
      example: '“신나는 놀이” 느낌인지, “무거운 이야기” 느낌인지 한 단어로 먼저 말해 본 뒤 보기를 다시 고르면 좋아요.'
    },
    음색: {
      hint: '목소리의 굵기를 들어 보세요. 묵직하고 풍부한지, 가볍고 여린지 비교해 보세요.',
      example: '두꺼운 담요처럼 감싸는 소리인지, 얇은 실처럼 가벼운 소리인지 떠올려 보세요.'
    }
  },
  아버지: {
    선율: {
      hint: '달래는 구간에서, 선율이 낮고 부드럽게 감싸는지·높고 날카로운지·화려하게 꾸며지는지 들어 보세요.',
      example: '아이를 진정시키는 부드러운 선율과, 날카롭게 튀는 선율 중 영상에 가까운 쪽을 골라 보세요.'
    },
    음계: {
      hint: '달래는 말이어도 곡 분위기는 어떤가요? 밝고 가벼운지, 어둡고 무거운지 들어 보세요.',
      example: '안심이 되는 밝음인지, 밤길의 긴장·압박이 남아 있는지 먼저 느낀 뒤 보기를 다시 고르세요.'
    },
    음색: {
      hint: '아버지의 목소리가 단단하고 묵직한지, 가볍고 여린지 비교해 보세요.',
      example: '큰 북처럼 두툼한 소리인지, 피리처럼 얇은 소리인지 상상해 보면 고르기 쉬워요.'
    }
  },
  아들: {
    선율: {
      hint: '호소하는 구간에서, 선율이 같은 자리에서 답답하게 반복되는지·낮게 부드럽게 흐르는지·밝게 뛰어오르는지 들어 보세요.',
      example: '손이 한 음 근처에서 맴도는지, 위아래로 크게 움직이는지 영상만 듣고 비교해 보세요.'
    },
    음계: {
      hint: '두려움·호소가 섞인 구간이 밝고 가벼운지, 어둡고 불안한지 비교해 보세요.',
      example: '놀이터처럼 밝은지, 밤길처럼 무거운지 한 문장으로 말한 뒤 보기를 다시 고르세요.'
    },
    음색: {
      hint: '아이 목소리처럼 가볍고 여린지, 묵직하고 두툼한지 들어 보세요.',
      example: '얇은 실 소리와 두꺼운 담요 소리 중, 영상에 더 가까운 쪽을 고르면 좋아요.'
    }
  },
  마왕: {
    선율: {
      hint: '유혹하는 구간에서, 선율이 달콤하고 화려하게 꾸며지는지·낮고 무거운지·한자리에 머무는지 비교해 보세요.',
      example: '속삭이듯 꾸며진 선율과, 묵직하게만 내려가는 선율 중 영상에 가까운 쪽을 골라 보세요.'
    },
    음계: {
      hint: '달콤한 유혹처럼 들리는데, 분위기는 밝은 쪽인지 어두운 쪽인지 들어 보세요.',
      example: '다른 인물 구간과 나란히 들으며 “더 밝아졌는지 / 더 어두워졌는지”만 먼저 비교해 보세요.'
    },
    음색: {
      hint: '속삭이듯 가벼운지, 묵직하고 두툼한지 비교해 보세요.',
      example: '부드러운 속삭임(얇고 가벼운 소리)과 무거운 경고(두꺼운 소리) 중 어느 쪽에 가까운지 떠올려 보세요.'
    }
  }
};

const VOICE_FIELD_META = {
  선율: { label: '선율', focus: '선율의 움직임·성격', tone: 'pitch' },
  음계: { label: '음계', focus: '밝고 어두운 기분', tone: 'scale' },
  음색: { label: '음색', focus: '목소리 굵기', tone: 'timbre' }
};

const VOICE_WRONG_PICK_HINTS = {
  해설자: {
    선율: {
      '한자리에 머무는 답답한 선율': {
        hint: '「한자리에 머무는 답답한 선율」을 골랐어요. 같은 음 근처에서 맴도는 호소처럼 들렸나 봐요. 해설자 구간을 다시 들으며, 선율이 제자리에 갇혀 있는지, 장면을 차분히 설명해 주듯 이어지는지 비교해 보세요.',
        example: '답답하게 반복되는지, 이야기하듯 흘러가는지 한 문장으로 말한 뒤 보기를 다시 고르세요.'
      },
      '달콤하고 화려한 선율': {
        hint: '「달콤하고 화려한 선율」을 골랐어요. 꾸며진 유혹처럼 들렸나 봐요. 해설자 구간을 다시 들으며, 선율이 화려하게 장식되는지, 장면을 담담히 전하는지 비교해 보세요.',
        example: '속삭이듯 꾸미는지, 뉴스처럼 담담한지 영상만 듣고 골라 보세요.'
      }
    },
    음계: {
      장조: {
        hint: '「장조」를 골랐어요. 밝고 경쾌한 기분으로 들렸나 봐요. 해설자가 밤길을 전하는 구간이 놀이처럼 밝은지, 어둡고 진지한지 귀로만 비교해 보세요.',
        example: '“신나는 놀이”인지 “무거운 이야기”인지 한 단어로 먼저 말해 보세요.'
      }
    },
    음색: {
      얇음: {
        hint: '「얇음」을 골랐어요. 가볍고 여린 목소리로 들렸나 봐요. 해설자 목소리를 다시 들으며, 얇은 실처럼 가벼운지, 두꺼운 담요처럼 묵직한지 비교해 보세요.',
        example: '여린 속삭임인지, 이야기를 받쳐 주는 굵기인지 떠올려 보세요.'
      }
    }
  },
  아버지: {
    선율: {
      '높고 날카로운 선율': {
        hint: '「높고 날카로운 선율」을 골랐어요. 호소하듯 튀는 소리로 들렸나 봐요. 달래는 구간을 다시 들으며, 선율이 날카롭게 치솟는지, 낮고 부드럽게 감싸는지 비교해 보세요.',
        example: '아이를 진정시키는 부드러운 선율과, 날카롭게 튀는 선율 중 영상에 가까운 쪽을 골라 보세요.'
      },
      '달콤하고 화려한 선율': {
        hint: '「달콤하고 화려한 선율」을 골랐어요. 유혹하듯 꾸며진 소리로 들렸나 봐요. 아버지 구간을 다시 들으며, 화려하게 장식되는지, 낮고 부드럽게 달래는지 비교해 보세요.',
        example: '속삭이듯 꾸미는지, 어른이 안심시키듯 낮게 흐르는지 들어 보세요.'
      }
    },
    음계: {
      단조: {
        hint: '「단조」를 골랐어요. 어둡고 무거운 기분으로 들렸나 봐요. 달래는 말이어도, 이 구간이 밤길처럼 어두운지, 안심이 되는 밝음인지 들어 보세요.',
        example: '긴장·압박이 남는지, 조금 밝아지는지 한 문장으로 말한 뒤 보기를 다시 고르세요.'
      }
    },
    음색: {
      얇음: {
        hint: '「얇음」을 골랐어요. 가볍고 여린 목소리로 들렸나 봐요. 아버지 목소리를 다시 들으며, 피리처럼 얇은지, 큰 북처럼 두툼하고 단단한지 비교해 보세요.',
        example: '아이처럼 여린 소리인지, 어른의 묵직한 소리인지 떠올려 보세요.'
      }
    }
  },
  아들: {
    선율: {
      '낮고 부드러운 선율': {
        hint: '「낮고 부드러운 선율」을 골랐어요. 달래듯 감싸는 소리로 들렸나 봐요. 호소하는 구간을 다시 들으며, 낮게 부드럽게 흐르는지, 같은 자리에서 답답하게 반복되는지 비교해 보세요.',
        example: '손을 낮게 쓰다듬듯 움직이는지, 한 음 근처에서 맴도는지 영상만 듣고 비교해 보세요.'
      },
      '밝고 경쾌하게 뛰어오르는 선율': {
        hint: '「밝고 경쾌하게 뛰어오르는 선율」을 골랐어요. 놀이처럼 도약한다고 들렸나 봐요. 아들 구간을 다시 들으며, 밝게 뛰어오르는지, 같은 자리에서 답답하게 반복되는지 비교해 보세요.',
        example: '경쾌한 도약인지, 두려움에 발이 묶인 반복인지 한 문장으로 말해 보세요.'
      }
    },
    음계: {
      장조: {
        hint: '「장조」를 골랐어요. 밝고 가벼운 기분으로 들렸나 봐요. 두려움·호소가 섞인 구간이 놀이터처럼 밝은지, 밤길처럼 무거운지 비교해 보세요.',
        example: '밝음인지 불안인지 한 문장으로 말한 뒤 보기를 다시 고르세요.'
      }
    },
    음색: {
      두꺼움: {
        hint: '「두꺼움」을 골랐어요. 묵직하고 두툼한 목소리로 들렸나 봐요. 아이 목소리를 다시 들으며, 두꺼운 담요 같은지, 얇은 실처럼 가볍고 여린지 비교해 보세요.',
        example: '어른처럼 굵은지, 아이처럼 얇은지 떠올려 보세요.'
      }
    }
  },
  마왕: {
    선율: {
      '낮고 무거운 선율': {
        hint: '「낮고 무거운 선율」을 골랐어요. 경고처럼 내려가는 소리로 들렸나 봐요. 유혹하는 구간을 다시 들으며, 묵직하게만 내려가는지, 달콤하고 화려하게 꾸며지는지 비교해 보세요.',
        example: '무거운 경고인지, 속삭이듯 꾸며진 선율인지 영상만 듣고 골라 보세요.'
      },
      '한자리에 머무는 답답한 선율': {
        hint: '「한자리에 머무는 답답한 선율」을 골랐어요. 같은 자리에 갇힌 소리로 들렸나 봐요. 마왕 구간을 다시 들으며, 제자리에 맴도는지, 달콤하고 화려하게 꾸며지는지 비교해 보세요.',
        example: '답답한 반복인지, 유혹하듯 장식되는 선율인지 비교해 보세요.'
      }
    },
    음계: {
      단조: {
        hint: '「단조」를 골랐어요. 어둡고 무거운 기분으로 들렸나 봐요. 달콤한 유혹처럼 들리는데, 분위기는 어두운 쪽인지 밝은 쪽인지 다른 인물 구간과 나란히 들어 보세요.',
        example: '더 어두워졌는지, 더 밝아졌는지 한 단어로 먼저 비교해 보세요.'
      }
    },
    음색: {
      두꺼움: {
        hint: '「두꺼움」을 골랐어요. 묵직하고 두툼한 목소리로 들렸나 봐요. 마왕 구간을 다시 들으며, 무거운 경고처럼 굵은지, 부드러운 속삭임처럼 얇고 가벼운지 비교해 보세요.',
        example: '두꺼운 소리와 가볍고 여린 소리 중 영상에 가까운 쪽을 골라 보세요.'
      }
    }
  }
};

function splitHintExample(pack) {
  if (!pack) {
    return {
      hint: '해당 구간을 다시 들으며 소리의 높낮이·밝고 어두운 느낌·목소리 굵기를 비교해 보세요.',
      example: ''
    };
  }
  if (typeof pack === 'string') {
    const [hint, ...rest] = pack.split(/\n예:\s*/);
    return { hint: hint.trim(), example: rest.join(' ').trim() };
  }
  return { hint: pack.hint || '', example: pack.example || '' };
}

/**
 * 음색 설계 피드백 — UI 카드 렌더용 구조 + 게이트용 verification 문자열
 * @returns {{ kind: 'voice-sections', isCorrect: boolean, verification: string, character: string, summary: string, sections: Array, footer: string } | { kind: 'plain', text: string }}
 */
export function getVoiceDesignFixedFeedback(selectedChars, voiceDesign, answerKey) {
  const keys = VOICE_DESIGN_FIELD_KEYS;
  const name = selectedChars?.[0];
  if (!name) {
    return { kind: 'plain', text: '인물을 선택하고 세 항목을 모두 고른 뒤 피드백 보기를 눌러 주세요.' };
  }
  const row = normalizeVoiceDesignRow(voiceDesign?.[name]);
  const answer = answerKey?.[name] || {};
  const filled = keys.every((k) => row[k]);
  if (!filled) {
    return { kind: 'plain', text: '선율·음계·음색을 모두 고른 뒤 피드백 보기를 눌러 주세요.' };
  }

  const matched = keys.filter((k) => row[k] === answer[k]);
  const missed = keys.filter((k) => row[k] !== answer[k]);
  const allMatch = missed.length === 0;

  const sections = keys.map((field) => {
    const meta = VOICE_FIELD_META[field] || { label: field, focus: '', tone: 'pitch' };
    const ok = row[field] === answer[field];
    const studentPick = row[field] || '미선택';
    if (ok) {
      return {
        field,
        label: meta.label,
        focus: meta.focus,
        tone: meta.tone,
        status: 'ok',
        studentPick,
        note: `${meta.label} 선택이 맞아요.`,
        hint: '',
        example: ''
      };
    }
    const { hint, example } = splitHintExample(
      VOICE_WRONG_PICK_HINTS[name]?.[field]?.[studentPick] || VOICE_FIELD_LISTEN_HINTS[name]?.[field]
    );
    return {
      field,
      label: meta.label,
      focus: meta.focus,
      tone: meta.tone,
      status: 'miss',
      studentPick,
      note: `네가 고른 「${studentPick}」은 이 구간과 잘 맞지 않아요.`,
      hint,
      example
    };
  });

  if (allMatch) {
    return {
      kind: 'voice-sections',
      isCorrect: true,
      verification: '검증: ✓',
      character: name,
      summary: `「${name}」선율·음계·음색이 모두 맞아요.`,
      sections,
      footer: '영상을 한 번 더 들으며 세 가지가 어떻게 함께 들리는지 확인해 보세요.'
    };
  }

  return {
    kind: 'voice-sections',
    isCorrect: false,
    verification: '검증: ✗',
    character: name,
    summary: `「${name}」설계를 항목별로 점검했어요. 맞은 항목 ${matched.length}개 · 다시 볼 항목 ${missed.length}개`,
    sections,
    footer: '정답 보기는 알려 주지 않아요. 각 영역의 힌트만 보고 다시 골라 보세요. 다시 들어보세요.'
  };
}

const PIANO_RH_WRONG_HINT = {
  폭풍우: {
    hint: '「폭풍우」를 골랐어요. 오른손이 넓게 몰아치는 것처럼 들렸나 봐요. 오른손만 다시 들으며, 크게 출렁이는지 짧게 자주 뛰어가는지 리듬의 촘촘함만 비교해 보세요.',
    example: '하늘이 열리는 넓은 소리인지, 말이 달리듯 톡톡 반복되는 소리인지 손으로 박자를 쳐 보며 골라 보세요.'
  },
  파도: {
    hint: '「파도」를 골랐어요. 오른손이 느릿하게 오르내리는 것처럼 들렸나 봐요. 오른손만 다시 들으며, 넓게 출렁이는지 짧게 자주 반복되는지 비교해 보세요.',
    example: '물결처럼 천천히 흔들리는지, 달리듯이 촘촘한지 귀로만 비교해 보세요.'
  },
  바람: {
    hint: '「바람」을 골랐어요. 오른손이 스치듯 지나가는 것처럼 들렸나 봐요. 오른손만 다시 들으며, 흩어지듯 스치는지 짧게 자주 뛰어가는지 리듬만 비교해 보세요.',
    example: '스쳐 지나가는 소리인지, 규칙적으로 톡톡 반복되는 소리인지 손으로 박자를 쳐 보세요.'
  }
};

const PIANO_LH_WRONG_HINT = {
  북소리: {
    hint: '「북소리」를 골랐어요. 왼손이 타악기처럼 딱딱 끊긴다고 들렸나 봐요. 왼손만 다시 들으며, 북처럼 표면이 맞부딪히는 소리인지, 낮은 음이 가슴처럼 반복되는지 비교해 보세요.',
    example: '딱딱 끊기는 타점인지, 낮게 쿵쿵 이어지는 박동인지 손바닥으로 박을 맞춰 보세요.'
  },
  '무거운 발걸음': {
    hint: '「무거운 발걸음」을 골랐어요. 왼손이 한 걸음씩 짚는 것처럼 들렸나 봐요. 왼손만 다시 들으며, 천천히 내딛는지, 짧게 반복되는 박동처럼 찍히는지 비교해 보세요.',
    example: '느리게 내딛는 무게인지, 가슴이 뛰듯 자주 찍히는지 손바닥으로 박을 맞춰 보세요.'
  },
  '잔잔한 물결': {
    hint: '「잔잔한 물결」을 골랐어요. 왼손이 부드럽게 흐른다고 들렸나 봐요. 왼손만 다시 들으며, 잔잔히 이어지는지, 낮고 짧게 쿵쿵 찍히는지 비교해 보세요.',
    example: '부드럽게 흐르는 느낌인지, 가슴이 뛰듯 반복되는 느낌인지 귀로만 비교해 보세요.'
  }
};

/**
 * 마왕 2-C 피아노 반주 · 오른손/왼손 장면 선택 형성적 피드백 (정답 보기 미포함)
 */
export function getPianoSceneFixedFeedback({ rhScene, lhScene }) {
  const rh = String(rhScene || '').trim();
  const lh = String(lhScene || '').trim();
  if (!rh || !lh) {
    return { kind: 'plain', text: '오른손·왼손 장면을 모두 고른 뒤 피드백 보기를 눌러 주세요.' };
  }

  const rhOk = gradePianoRhScene(rh);
  const lhOk = gradePianoLhScene(lh);
  const allMatch = rhOk && lhOk;
  const matchedCount = (rhOk ? 1 : 0) + (lhOk ? 1 : 0);

  const sections = [
    {
      field: 'rh',
      label: '오른손 장면',
      focus: '빠른 반복 리듬 · 움직임',
      tone: 'pitch',
      status: rhOk ? 'ok' : 'miss',
      studentPick: rh,
      note: rhOk ? '오른손 장면 선택이 맞아요.' : `네가 고른 「${rh}」은 오른손 반주와 잘 맞지 않아요.`,
      hint: rhOk ? '' : (PIANO_RH_WRONG_HINT[rh]?.hint || '오른손만 다시 들으며, 빠르고 촘촘하게 반복되는 리듬이 어떤 움직임을 떠올리게 하는지 비교해 보세요.'),
      example: rhOk ? '' : (PIANO_RH_WRONG_HINT[rh]?.example || '잔잔한 물결처럼 느리게 흔들리는지, 달리듯이 짧게 자주 뛰어가는지 손으로 박자를 쳐 보며 골라 보세요.')
    },
    {
      field: 'lh',
      label: '왼손 장면',
      focus: '낮은 베이스 · 박동/무게',
      tone: 'timbre',
      status: lhOk ? 'ok' : 'miss',
      studentPick: lh,
      note: lhOk ? '왼손 장면 선택이 맞아요.' : `네가 고른 「${lh}」은 왼손 반주와 잘 맞지 않아요.`,
      hint: lhOk ? '' : (PIANO_LH_WRONG_HINT[lh]?.hint || '왼손만 다시 들으며, 낮고 강하게 반복되는 베이스가 어떤 박동·무게감을 주는지 비교해 보세요.'),
      example: lhOk ? '' : (PIANO_LH_WRONG_HINT[lh]?.example || '부드럽게 흐르는 느낌인지, 가슴이 뛰듯 짧게 쿵쿵 찍히는 느낌인지 손바닥으로 박을 맞춰 보며 골라 보세요.')
    }
  ];

  if (allMatch) {
    return {
      kind: 'voice-sections',
      isCorrect: true,
      verification: '검증: ✓',
      character: 'piano-scene',
      summary: '오른손·왼손 장면이 모두 맞아요.',
      sections,
      footer: '각 손 반주를 다시 들으며, 고른 장면이 소리의 리듬·무게와 어떻게 연결되는지 확인해 보세요.'
    };
  }

  return {
    kind: 'voice-sections',
    isCorrect: false,
    verification: '검증: ✗',
    character: 'piano-scene',
    summary: `장면 선택을 손별로 점검했어요. 맞은 항목 ${matchedCount}개 · 다시 볼 항목 ${2 - matchedCount}개`,
    sections,
    footer: '정답 장면 이름은 알려 주지 않아요. 각 영역의 힌트만 보고 다시 골라 보세요. 다시 들어보세요.'
  };
}

const HY_THEME_T1_CORRECT = new Set(['o1', 'o3', 'o5']);
const HY_THEME_T1_WRONG = new Set(['o2', 'o4', 'o6']);
const HY_THEME_T2_CORRECT = new Set(['o2', 'o4', 'o6']);
const HY_THEME_T2_WRONG = new Set(['o1', 'o3', 'o5']);

const HY_THEME_MATCH_CARD_HINT = {
  t1: {
    o2: '제1주제 칸에 「음이 순차적으로 이어진다」를 넣었어요. 순차 진행은 음이 옆 칸으로 살살 걸어가듯 들릴 때 잘 맞아요.\n제1주제 클립만 다시 들으며, 음과 음 사이가 가까운지 멀리 뛰어오르는지 선율의 움직임만 비교해 보세요.',
    o4: '제1주제 칸에 「리듬이 길게 이어진다」를 넣었어요. 긴 리듬은 음이 늘어지며 흐를 때 잘 맞아요.\n제1주제 클립만 다시 들으며, 리듬이 길게 흐르는지 짧게 톡톡 끊어지는지 리듬꼴만 비교해 보세요.',
    o6: '제1주제 칸에 「부드럽고 서정적이다」를 넣었어요. 서정적인 느낌은 노래하듯 잔잔할 때 잘 맞아요.\n제1주제 클립만 다시 들으며, 느낌이 잔잔한지 가볍고 또렷한지 분위기만 비교해 보세요.'
  },
  t2: {
    o1: '제2주제 칸에 「음이 크게 도약한다」를 넣었어요. 도약은 음이 멀리 뛰어오를 때 잘 맞아요.\n제2주제 클립만 다시 들으며, 음과 음 사이가 멀리 뛰는지 옆 음으로 이어지는지 선율의 움직임만 비교해 보세요.',
    o3: '제2주제 칸에 「리듬이 짧게 끊어진다」를 넣었어요. 짧은 리듬은 톡톡 끊어질 때 잘 맞아요.\n제2주제 클립만 다시 들으며, 리듬이 짧게 끊기는지 길게 흐르는지 리듬꼴만 비교해 보세요.',
    o5: '제2주제 칸에 「밝고 활기차다」를 넣었어요. 활기찬 느낌은 가볍고 또렷할 때 잘 맞아요.\n제2주제 클립만 다시 들으며, 느낌이 또렷한지 잔잔한지 분위기만 비교해 보세요.'
  }
};

const HY_THEME_MATCH_SWAP_HINT = {
  melody:
    '제1주제 칸에 「음이 순차적으로 이어진다」, 제2주제 칸에 「음이 크게 도약한다」를 넣었어요.\n두 클립을 번갈아 들으며, 어느 쪽이 음이 멀리 뛰고 어느 쪽이 옆 음으로 이어지는지 선율의 움직임만 비교해 보세요.',
  rhythm:
    '제1주제 칸에 「리듬이 길게 이어진다」, 제2주제 칸에 「리듬이 짧게 끊어진다」를 넣었어요.\n두 클립을 번갈아 들으며, 어느 쪽 리듬이 짧게 톡톡이고 어느 쪽이 길게 흐르는지 리듬꼴만 비교해 보세요.',
  mood:
    '제1주제 칸에 「부드럽고 서정적이다」, 제2주제 칸에 「밝고 활기차다」를 넣었어요.\n두 클립을 번갈아 들으며, 어느 쪽이 가볍고 또렷하고 어느 쪽이 잔잔한지 분위기만 비교해 보세요.'
};

function hyThemeMatchColumnOk(placedIds, correctSet, wrongSet) {
  if (!Array.isArray(placedIds) || placedIds.length === 0) return false;
  const hasCorrect = placedIds.some((id) => correctSet.has(id));
  const hasWrong = placedIds.some((id) => wrongSet.has(id));
  return hasCorrect && !hasWrong;
}

export function getHyThemeMatchFixedFeedback({ theme1Ids, theme2Ids }) {
  const t1 = theme1Ids || [];
  const t2 = theme2Ids || [];
  if (!t1.length || !t2.length) {
    return '제1주제와 제2주제 칸에 카드를 넣은 뒤 피드백 보기를 눌러 주세요.';
  }

  const col1Ok = hyThemeMatchColumnOk(t1, HY_THEME_T1_CORRECT, HY_THEME_T1_WRONG);
  const col2Ok = hyThemeMatchColumnOk(t2, HY_THEME_T2_CORRECT, HY_THEME_T2_WRONG);
  if (col1Ok && col2Ok) {
    return verification(
      true,
      '두 주제의 선율 움직임·리듬꼴·느낌이 칸과 잘 맞아요. 소나타 형식에서는 제1주제와 제2주제가 이렇게 대비되며 형식을 만들어요.'
    );
  }

  const t1Wrong = t1.filter((id) => HY_THEME_T1_WRONG.has(id));
  const t2Wrong = t2.filter((id) => HY_THEME_T2_WRONG.has(id));
  const parts = [];
  const used = new Set();

  const swaps = [
    { dim: 'melody', t1: 'o2', t2: 'o1' },
    { dim: 'rhythm', t1: 'o4', t2: 'o3' },
    { dim: 'mood', t1: 'o6', t2: 'o5' }
  ];
  swaps.forEach((swap) => {
    if (t1Wrong.includes(swap.t1) && t2Wrong.includes(swap.t2)) {
      parts.push(HY_THEME_MATCH_SWAP_HINT[swap.dim]);
      used.add(`t1:${swap.t1}`);
      used.add(`t2:${swap.t2}`);
    }
  });

  t1Wrong.forEach((id) => {
    if (used.has(`t1:${id}`)) return;
    const hint = HY_THEME_MATCH_CARD_HINT.t1[id];
    if (hint) parts.push(hint);
  });
  t2Wrong.forEach((id) => {
    if (used.has(`t2:${id}`)) return;
    const hint = HY_THEME_MATCH_CARD_HINT.t2[id];
    if (hint) parts.push(hint);
  });

  if (!parts.length) {
    return verification(
      false,
      '',
      '두 주제를 번갈아 들으며 선율의 움직임·리듬꼴·느낌이 같은 칸에 모였는지 점검해 보세요.\n다시 들어보세요.'
    );
  }

  return verification(false, '', `${parts.slice(0, 2).join('\n')}\n다시 들어보세요.`);
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
  const wrongBody = HY_THEME_DEG_WRONG_FEEDBACK[selectedDeg]
    || '시작음 G와 목표음 D를 건반에서 함께 누른 뒤, 그 사이를 한 칸씩 세어 보세요. 다시 생각해보세요.';
  return verification(false, '', wrongBody);
}

const HY_THEME_DEG_WRONG_FEEDBACK = {
  '3도':
    '「3도」를 골랐어요. 3도는 시작음에서 가까운 이웃처럼 느껴지는 간격이에요.\n건반에서 G(솔)와 D(레)를 함께 누른 뒤, 두 음이 바로 옆처럼 가까운지, 그 사이에 흰 건반이 더 있는지 한 칸씩 세어 보세요.\n다시 생각해보세요.',
  '8도':
    '「8도」를 골랐어요. 8도는 한 옥타브, 같은 음이름의 위·아래처럼 느껴지는 간격이에요.\n건반에서 G와 D의 음이름이 같은지 다른지 글자를 보고, 그 사이를 한 칸씩 세어 보세요.\n다시 생각해보세요.'
};

/**
 * 쇤베르크 슈프레흐슈팀메 — 말하기↔노래하기 슬라이더 형성적 피드백
 * @param {'normal' | 'sprech'} kind
 */
export function getSbSprechFixedFeedback({ kind, hasMoved, isCorrect, toneText }) {
  if (!hasMoved) {
    return '먼저 슬라이더를 움직여 본 뒤 피드백 보기를 눌러 주세요.';
  }

  if (kind === 'normal') {
    if (isCorrect) {
      return verification(
        true,
        '일반 성악은 음높이(피치)를 안정적으로 유지하며 노래해요. 음이 흔들리지 않고 이어지는지 다시 들어 보세요.'
      );
    }
    const wrongBody = SB_SPRECH_WRONG_FEEDBACK.normal[toneText]
      || '송어 구간을 다시 들으며, 음이 한자리에 오래 머무는지·말하기처럼 짧게 끊기는지 비교해 보세요. 다시 들어보세요.';
    return verification(false, '', wrongBody);
  }

  if (isCorrect) {
    return verification(
      true,
      '슈프레흐슈팀메는 말과 노래의 경계에 있어요. 음에 닿을락 말락 하며 말하기에 더 가깝게 들리는지 확인해 보세요.'
    );
  }
  const wrongBody = SB_SPRECH_WRONG_FEEDBACK.sprech[toneText]
    || '피에로 구간을 다시 들으며, 음이 고정되어 이어지는지·바로 흔들리며 말처럼 들리는지 비교해 보세요. 다시 들어보세요.';
  return verification(false, '', wrongBody);
}

const SB_SPRECH_WRONG_FEEDBACK = {
  normal: {
    '완전히 말하기':
      '슬라이더를 「완전히 말하기」쪽에 두었어요. 송어가 말하듯 짧게 끊긴다고 들렸나 봐요.\n일반 가곡 구간을 다시 들으며, 음이 바로 떨어지듯 말하는지, 한 음에 오래 머무르며 노래하는지 비교해 보세요.\n다시 들어보세요.',
    '말하기에 가까워요':
      '슬라이더를 「말하기에 가까워요」쪽에 두었어요. 말과 노래 사이처럼 들렸나 봐요.\n송어 구간을 다시 들으며, 음이 흔들리다 떨어지는지, 흔들림 없이 한 음에 머무르는지 비교해 보세요.\n다시 들어보세요.',
    '정중앙이예요':
      '슬라이더를 「정중앙」에 두었어요. 말과 노래가 반반처럼 들렸나 봐요.\n송어 구간을 다시 들으며, 중간에 걸쳐 있는지, 음높이가 안정적으로 이어지는 노래에 더 가까운지 귀로 비교해 보세요.\n다시 들어보세요.',
    '노래하기에 가까워요':
      '슬라이더를 「노래하기에 가까워요」쪽에 두었어요. 거의 노래라고 느꼈나 봐요.\n송어 구간을 다시 들으며, ‘가까운 노래’인지, 음이 흔들림 없이 끝까지 이어지는 완전한 성악인지 비교해 보세요.\n다시 들어보세요.'
  },
  sprech: {
    '완전히 말하기':
      '슬라이더를 「완전히 말하기」쪽에 두었어요. 피에로가 말만 한다고 들렸나 봐요.\n이 구간을 다시 들으며, 음에 전혀 안 닿는지, 닿을락 말락 하며 말과 노래 사이에 걸쳐 있는지 비교해 보세요.\n다시 들어보세요.',
    '정중앙이예요':
      '슬라이더를 「정중앙」에 두었어요. 말과 노래가 반반처럼 들렸나 봐요.\n피에로 구간을 다시 들으며, 정확히 가운데인지, 음에 살짝 닿았다가 바로 말처럼 흐르는지 비교해 보세요.\n다시 들어보세요.',
    '노래하기에 가까워요':
      '슬라이더를 「노래하기에 가까워요」쪽에 두었어요. 거의 노래처럼 들렸나 봐요.\n피에로 구간을 다시 들으며, 음이 안정적으로 이어지는지, 닿자마자 흔들리며 말처럼 들리는지 비교해 보세요.\n다시 들어보세요.',
    '완전히 노래하기':
      '슬라이더를 「완전히 노래하기」쪽에 두었어요. 일반 성악처럼 들렸나 봐요.\n피에로 구간을 다시 들으며, 음이 고정되어 이어지는지, 말하듯 미끄러지며 음높이가 흔들리는지 비교해 보세요.\n다시 들어보세요.'
  }
};

function overviewEmptyMessage(question) {
  return question === 'q1'
    ? '1번 답을 적은 뒤 피드백 보기를 눌러 주세요.'
    : '2번 답을 적은 뒤 피드백 보기를 눌러 주세요.';
}

function missingOverviewGroupHints(evalResult) {
  const hints = (evalResult?.missingGroups || []).map((group) => group.hint).filter(Boolean);
  if (!hints.length) return '';
  return `${hints.join('\n')}\n다시 생각해보세요.`;
}

function getHaydnOverviewQ1WrongFeedback(chars) {
  const slots = (chars || []).map((c) => String(c || '').trim()).filter(Boolean);
  const joined = slots.join(' ');
  if (includesAnyToken(joined, ['피아노', '플루트', '오케스트라', '트럼펫', '호른', '오보에'])) {
    return '현악기가 아닌 이름이 들어 있어요.\n영상에서 활로 켜는 악기만 몇 종류인지, 음역이 어떻게 나뉘는지 다시 들어 보세요.\n다시 들어보세요.';
  }
  const hasViola = includesAnyToken(joined, ['비올라']);
  const hasCello = includesAnyToken(joined, ['첼로']);
  const violinSlots = slots.filter((slot) => includesAnyToken(slot, ['바이올린'])).length;
  const parts = ['현악 앙상블의 음역이 빠지지 않았는지 네 칸을 다시 보세요.'];
  if (violinSlots < 2) {
    parts.push('높은 선율과 그 바로 아래 성부를 맡는 현악기가 두 칸에 나뉘어 있는지 확인해 보세요.');
  }
  if (!hasViola) {
    parts.push('주선율과 가장 낮은 선 사이, 중간 음역을 채우는 현악기가 있는지 들어 보세요.');
  }
  if (!hasCello) {
    parts.push('가장 낮고 굵은 선이 어느 악기인지, 베이스처럼 받치는 소리가 있는지 들어 보세요.');
  }
  parts.push('다시 들어보세요.');
  return parts.join('\n');
}

function getSchoenbergOverviewQ1WrongFeedback(text) {
  const voiceOk = includesAnyToken(text, ['소프라노', '메조소프라노', '메조', '성악']);
  const instrumentHits = countTokenHits(text, ['플루트', '클라리넷', '바이올린', '첼로', '피아노']);
  const parts = ['편성을 다시 적어 보세요.'];
  if (!voiceOk) {
    parts.push('노래하는 목소리(성악)가 빠졌는지, 어떤 높이의 목소리인지 다시 들어 보세요.');
  }
  if (instrumentHits < 4) {
    parts.push('실내악으로 몇 종류의 악기가 함께 들리는지, 관·현·건반을 나눠 적어 보세요.');
  }
  parts.push('다시 들어보세요.');
  return parts.join('\n');
}

function getChopinOverviewQ2WrongFeedback(story) {
  const fast = includesAnyToken(story, ['빠르', '격렬']);
  const slow = includesAnyToken(story, ['느리', '서정', '부드']);
  if (fast && !slow) {
    return '빠른 부분만 적었어요.\n곡 한가운데에서 빠르기와 분위기가 바뀌는 구간이 있는지도 적어 보세요.\n다시 들어보세요.';
  }
  if (slow && !fast) {
    return '느린 부분만 적었어요.\n앞부분의 빠르기·세기와 중간부가 같은지 다른지 대비해서 적어 보세요.\n다시 들어보세요.';
  }
  return '앞부분과 중간부의 빠르기·세기·분위기가 같은지 다른지 대비해서 적어 보세요.\n다시 들어보세요.';
}

/**
 * 개요 파악(서술형) — 모범 문장·정답 목록을 보여 주지 않는 형성적 피드백
 * @param {'q1' | 'q2'} question
 */
export function getOverviewFixedFeedback({ song, question, data }) {
  const payload = data || {};
  if (question === 'q1') {
    const q1 = String(
      song === 'handel'
        ? payload.handelLyricMeaning || ''
        : song === 'vivaldi' || song === 'chopin' || song === 'schoenberg'
          ? payload.analyticalCharacters?.[0] || ''
          : (payload.analyticalCharacters || []).filter(Boolean).join(', ')
    ).trim();
    if (!q1) return overviewEmptyMessage('q1');
    const isCorrect = gradeOverviewQ1(song, payload) === true;
    if (isCorrect) {
      const correctBody = {
        handel: '가사의 주제와 후렴이 무엇을 기리는지 잘 짚었어요. 합창이 그 내용을 어떻게 전하는지도 들어 보세요.',
        haydn: '현악 4중주의 네 성부를 잘 짚었어요. 높은 선율·그다음 성부·중간·낮은 음역이 어떻게 나뉘는지 이어 들어 보세요.',
        vivaldi: '소네트의 장면과 음악을 잘 연결했어요. 표제음악에서는 시의 장면이 셈여림·빠르기·리듬과 맞물려요.',
        chopin: '한 대의 악기가 선율과 반주를 모두 맡는 독주 편성을 잘 짚었어요. 오른손과 왼손의 역할이 어떻게 나뉘는지도 들어 보세요.',
        schoenberg: '성악과 실내악 편성을 잘 짚었어요. 목소리와 악기 음색이 어떻게 겹치는지도 이어 들어 보세요.'
      }[song] || '핵심을 잘 짚었어요. 들은 소리와 적은 답을 한 번 더 맞춰 보세요.';
      return verification(true, correctBody);
    }
    const groupedWrong = missingOverviewGroupHints(evaluateOverviewQuestion(song, 'q1', payload));
    const wrongBody = groupedWrong || {
      handel:
        '가사에서 누구를 기리는지, 후렴이 어떤 내용을 전하는지 한 문장으로 다시 적어 보세요.\n다시 생각해보세요.',
      haydn: getHaydnOverviewQ1WrongFeedback(payload.analyticalCharacters),
      vivaldi:
        '왼쪽 감상 가이드의 소네트를 다시 읽고, 이 곡이 어떤 날씨·장면인지 한두 문장으로 적어 보세요.\n다시 들어보세요.',
      chopin:
        '오케스트라나 다른 악기가 함께 나오는지, 한 대가 선율과 반주를 모두 치는지 영상을 다시 보세요.\n다시 들어보세요.',
      schoenberg: getSchoenbergOverviewQ1WrongFeedback(q1)
    }[song] || '적은 답을 다시 점검해 보세요.\n다시 생각해보세요.';
    return verification(false, '', wrongBody);
  }

  const q2 = String(
    song === 'handel' ? payload.handelOperaDiff || '' : payload.analyticalStory || ''
  ).trim();
  if (!q2) return overviewEmptyMessage('q2');
  const isCorrect = gradeOverviewQ2(song, payload) === true;
  if (isCorrect) {
    const correctBody = {
      handel: '무대 연기 없이 합창과 관현악으로 내용을 전하는 장르 차이를 잘 짚었어요. 의상·연기·장소가 어떻게 다른지도 떠올려 보세요.',
      haydn: '높은 바이올린 선율이 어떤 동물처럼 들리는지 잘 연결했어요. 가볍고 빠른 음형이 지저귐처럼 들리는지 이어 들어 보세요.',
      chopin: '빠르고 격렬한 부분과 느리고 서정적인 부분의 대비를 잘 짚었어요. 이 대비가 곡의 형식을 어떻게 나누는지도 들어 보세요.',
      schoenberg: '불안하고 몽환적인 분위기를 잘 짚었어요. 달빛·도취·긴장이 음색과 어떻게 맞물리는지 이어 들어 보세요.'
    }[song] || '핵심을 잘 짚었어요. 들은 느낌과 적은 답을 한 번 더 맞춰 보세요.';
    return verification(true, correctBody);
  }
  const groupedWrong = missingOverviewGroupHints(evaluateOverviewQuestion(song, 'q2', payload));
  const wrongBody = groupedWrong || {
    handel:
      '무대에서 배우가 의상을 입고 연기하는지, 합창과 연주만으로 내용을 전하는지 비교해 적어 보세요.\n다시 생각해보세요.',
    haydn:
      '제1바이올린의 높고 가벼운 선율이 어떤 동물 소리처럼 들리는지 다시 들어 보세요.\n다시 들어보세요.',
    chopin: getChopinOverviewQ2WrongFeedback(payload.analyticalStory),
    schoenberg:
      '처음 들었을 때 느낀 분위기와 감정을 구체적인 형용사로 적어 보세요. 달빛 속 장면이 편안한지 긴장되는지 비교해 보세요.\n다시 들어보세요.'
  }[song] || '적은 답을 다시 점검해 보세요.\n다시 생각해보세요.';
  return verification(false, '', wrongBody);
}

function koreanEunNeun(word) {
  const code = String(word || '').charCodeAt(String(word || '').length - 1);
  if (code < 0xac00 || code > 0xd7a3) return '는';
  return (code - 0xac00) % 28 ? '은' : '는';
}

const HY_TIMBRE_RANGE = {
  바이올린: 'high',
  비올라: 'mid',
  첼로: 'low',
  주선율: 'high',
  중성부: 'mid',
  베이스: 'low'
};

const HY_TIMBRE_RANGE_LABEL = {
  바이올린: '높은 음역',
  비올라: '중간 음역',
  첼로: '낮은 음역',
  주선율: '가장 높은 선',
  중성부: '중간 음역',
  베이스: '가장 낮은 받침'
};

const HY_TIMBRE_LISTEN_HINT = {
  high: '이 구간이 가장 높고 가벼운지, 그보다 낮고 굵은지 음높이만 다시 들어 보세요.',
  mid: '이 구간이 가운데 음역인지, 더 높거나 더 낮은지 비교해 들어 보세요.',
  low: '이 구간이 가장 낮고 굵은지, 그보다 높은지 음높이만 다시 들어 보세요.'
};

const HY_TIMBRE_CORRECT = {
  1: '높은 음역의 현악기가 주선율을 담당해요. 현악 4중주에서 가장 높은 선이 어떻게 노래하는지 이어 들어 보세요.',
  2: '중간 음역의 현악기가 중성부를 받쳐 줘요. 주선율과 베이스 사이에서 어떻게 채워지는지 들어 보세요.',
  3: '낮은 음역의 현악기가 베이스를 담당해요. 가장 낮은 선이 앙상블을 어떻게 받치는지 들어 보세요.'
};

function buildHyTimbreWrongBody({ picked, rolePick, instrOk, roleOk }) {
  const instrRange = HY_TIMBRE_RANGE[picked];
  const roleRange = HY_TIMBRE_RANGE[rolePick];
  const instrLabel = HY_TIMBRE_RANGE_LABEL[picked] || '그 음역';
  const roleLabel = HY_TIMBRE_RANGE_LABEL[rolePick] || '그 역할';

  if (!instrOk && !roleOk) {
    if (instrRange && roleRange && instrRange === roleRange) {
      return [
        `「${picked}」·「${rolePick}」를 골랐어요. 둘 다 ${instrLabel}이에요.`,
        HY_TIMBRE_LISTEN_HINT[instrRange],
        '다시 들어보세요.'
      ].join('\n');
    }
    return [
      `「${picked}」·「${rolePick}」를 골랐어요. ${picked}${koreanEunNeun(picked)} ${instrLabel}, ${rolePick}${koreanEunNeun(rolePick)} ${roleLabel}이에요.`,
      '악기와 역할이 서로 다른 음역을 가리키고 있어요. 이 구간이 높은지·가운데인지·낮은지 한 가지로 맞춰 들어 보세요.',
      '다시 들어보세요.'
    ].join('\n');
  }

  if (!instrOk) {
    return [
      `「${picked}」를 골랐어요. ${picked}${koreanEunNeun(picked)} ${instrLabel}이에요.`,
      HY_TIMBRE_LISTEN_HINT[instrRange] || '이 구간이 높은지 낮은지 음높이만 다시 들어 보세요.',
      '다시 들어보세요.'
    ].join('\n');
  }

  return [
    `「${rolePick}」를 골랐어요. ${rolePick}${koreanEunNeun(rolePick)} ${roleLabel}이에요.`,
    HY_TIMBRE_LISTEN_HINT[roleRange] || '이 구간이 높은지 낮은지 역할을 다시 들어 보세요.',
    '다시 들어보세요.'
  ].join('\n');
}

export function getHyTimbreFixedFeedback({ picked, rolePick, answer, roleAnswer, segmentIdx }) {
  if (!picked || !rolePick) {
    return '악기와 역할을 모두 고른 뒤 피드백 보기를 눌러 주세요.';
  }
  const instrOk = picked === answer;
  const roleOk = rolePick === roleAnswer;
  if (instrOk && roleOk) {
    return verification(true, HY_TIMBRE_CORRECT[segmentIdx] || '음역과 역할이 잘 맞아요. 현악 4중주의 음색 나뉨을 이어 들어 보세요.');
  }
  return verification(false, '', buildHyTimbreWrongBody({ picked, rolePick, instrOk, roleOk }));
}

