import { normalizeFormativeChoice } from './compareFeedback';
import { VOICE_DESIGN_FIELD_KEYS } from './voiceDesignAnswers';

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

/** 정답 보기 값을 쓰지 않고, 인물·요소별 듣기 초점·예시만 안내 */
const VOICE_FIELD_LISTEN_HINTS = {
  해설자: {
    음높이: {
      hint: '밤길 상황을 전하는 구간에서, 목소리가 바닥처럼 아주 낮은지·머리 위에서 울리듯 높은지·그 사이인지 비교해 보세요.',
      example: '같은 가사를 낮은/중간/높은 목소리로 상상한 뒤, 영상 속 소리와 더 가까운 쪽을 골라 보세요.'
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
    음높이: {
      hint: '아들을 달래는 구간에서, 어른 목소리처럼 낮은지·중간인지·아이처럼 높은지 비교해 보세요.',
      example: '“진정해라”를 낮은 목소리와 높은 목소리로 말해 본 뒤, 영상과 더 비슷한 쪽을 골라 보세요.'
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
    음높이: {
      hint: '호소하는 구간에서, 목소리가 낮게 깔리는지·중간인지·높게 솟는지 들어 보세요.',
      example: '“아버지, 아버지”가 낮은 톤인지 높은 톤인지, 영상만 듣고 손가락으로 높낮이를 그려 보세요.'
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
    음높이: {
      hint: '유혹하는 구간에서, 목소리가 아주 낮은지·중간인지·아주 높은지 비교해 보세요.',
      example: '“나와 가자”를 세 높이로 속삭여 본 뒤, 영상 속 높이와 가장 가까운 쪽을 골라 보세요.'
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
  음높이: { label: '음높이', focus: '소리의 높낮이', tone: 'pitch' },
  음계: { label: '음계', focus: '밝고 어두운 기분', tone: 'scale' },
  음색: { label: '음색', focus: '목소리 굵기', tone: 'timbre' }
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
  const row = voiceDesign?.[name] || {};
  const answer = answerKey?.[name] || {};
  const filled = keys.every((k) => row[k]);
  if (!filled) {
    return { kind: 'plain', text: '음높이·음계·음색을 모두 고른 뒤 피드백 보기를 눌러 주세요.' };
  }

  const matched = keys.filter((k) => row[k] === answer[k]);
  const missed = keys.filter((k) => row[k] !== answer[k]);
  const allMatch = missed.length === 0;

  const sections = keys.map((field) => {
    const meta = VOICE_FIELD_META[field];
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
    const { hint, example } = splitHintExample(VOICE_FIELD_LISTEN_HINTS[name]?.[field]);
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
      summary: `「${name}」음높이·음계·음색이 모두 맞아요.`,
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
