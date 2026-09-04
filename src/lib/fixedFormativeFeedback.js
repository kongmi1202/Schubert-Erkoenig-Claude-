import { VOICE_DESIGN_FIELD_KEYS, normalizeVoiceDesignRow } from './voiceDesignAnswers';
import {
  countTokenHits,
  evaluateOverviewQuestion,
  gradeOverviewQ1,
  gradeOverviewQ2,
  includesAnyToken
} from './overviewGrading';
import { buildMultiFieldSectionsPayload } from './formative/buildMultiField';
import { buildChoiceSectionsPayload } from './formative/buildChoiceSections';
import { buildSliderItemPayload, buildSingleChoiceFeedback } from './formative/buildSingleChoice';
import { buildCpFormSegmentPayload, buildCpRhythmItemPayload } from './formative/builders';
import { buildHyThemeMatchWrongPayload } from './formative/content/hyThemeMatch';
import { buildSbAtonalMatchWrongPayload, sbAtonalColumnOk } from './formative/content/sbAtonalMatch';
import {
  FOOTER,
  PARTIAL_FIELD_OK_NOTE,
  PARTIAL_SUMMARY_DEFAULT,
  verification
} from './formative/templates';
import { PIANO_LH_SCENE_CORRECT, PIANO_RH_SCENE_CORRECT } from './pianoSceneAnswers';

const VV_SONNET_META = {
  'vv-c1': { label: '천둥·번개 구간', focus: '셈여림 · 빠르기', tone: 'pitch' },
  'vv-c2': { label: '우박 구간', focus: '리듬꼴 · 셈여림', tone: 'timbre' }
};

const VV_SONNET_WRONG_FEEDBACK = {
  'vv-c1': {
    '음이 부드럽고 느리게 이어진다': {
      hint: '「음이 부드럽고 느리게 이어진다」를 골랐어요. 부드러운 선율은 잔잔한 바람이나 고요한 장면에 잘 어울리죠. 이 소네트는 하늘이 천둥치고 번개가 번쩍이는 장면이에요. 같은 구간을 다시 들으며, 소리가 살살 이어지는지 아니면 갑자기 세게 터지듯 들리는지 셈여림(소리의 세기)과 빠르기만 비교해 보세요.',
      example: '살살 이어지는 소리와 갑자기 세게 터지는 소리 중 어느 쪽에 가까운지 귀로만 비교해 보세요.'
    },
    '음이 점점 낮아지며 사라진다': {
      hint: '「음이 점점 낮아지며 사라진다」를 골랐어요. 음이 아래로 잦아들면 장면이 멀어지거나 잠잠해지는 느낌이 나요. 번개가 번쩍이는 가사와 맞춰 들으며, 이 구간이 점점 사그라드는지, 갑작스럽게 세게 터지는지 셈여림과 빠르기를 비교해 보세요.',
      example: '점점 잦아드는지, 갑자기 세게 터지는지 처음·한가운데만 짧게 비교해 들어 보세요.'
    },
    '음이 갑자기 강하고 빠르게 터진다': {
      hint: '「음이 갑자기 강하고 빠르게 터진다」를 골랐어요. 갑작스럽고 강한 소리는 천둥·번개 장면과 잘 어울릴 수 있어요. 이 구간에서 그 느낌이 처음부터 끝까지 이어지는지, 중간에 다른 느낌도 섞이는지 처음·한가운데·끝을 나눠 들어 보세요.',
      example: '구간을 세 부분으로 나눠, 강한 느낌이 계속인지 중간에 바뀌는지 들어 보세요.'
    }
  },
  'vv-c2': {
    '음이 길게 이어지며 서정적으로 흐른다': {
      hint: '「음이 길게 이어지며 서정적으로 흐른다」를 골랐어요. 긴 선율은 노래처럼 이어지는 장면에 잘 맞아요. 가사는 우박이 이삭을 때리는 장면이에요. 우박이 뚝뚝 떨어지는 모습을 떠올리며, 음이 길게 흐르는지 짧게 톡톡 끊기는지 리듬꼴만 다시 들어 보세요.',
      example: '길게 흐르는 선율과 짧게 톡톡 끊기는 음 중 우박 장면에 가까운 쪽을 골라 보세요.'
    },
    '음이 매우 느리고 조용해진다': {
      hint: '「음이 매우 느리고 조용해진다」를 골랐어요. 느리고 조용한 음악은 잠잠해지는 장면에 잘 어울리죠. 우박이 쏟아지는 가사와 맞춰 들으며, 이 구간이 잠잠한지, 짧고 또렷한 음이 여러 번 부딪히는지 빠르기와 셈여림을 비교해 보세요.',
      example: '잠잠한 느낌과 짧고 강하게 반복되는 느낌 중 어디에 가까운지 비교해 보세요.'
    },
    '음이 짧고 강하게 반복된다': {
      hint: '「음이 짧고 강하게 반복된다」를 골랐어요. 짧고 강한 반복은 우박이 떨어지는 느낌과 잘 맞을 수 있어요. 이 구간에서 그 느낌이 처음부터 끝까지 이어지는지, 중간에 다른 느낌도 섞이는지 리듬꼴을 나눠 들어 보세요.',
      example: '짧은 반복이 구간 내내 이어지는지, 중간에 다른 느낌이 섞이는지 들어 보세요.'
    }
  }
};

/** 사계 소네트 — 구간별 선택 → 맞음/다시 보기 카드 */
export function getVvSonnetActivityFixedFeedback({ items }) {
  const list = items || [];
  if (!list.length || list.some((item) => !String(item.userChoice || '').trim())) {
    return '각 구간의 보기를 모두 고른 뒤 피드백 보기를 눌러 주세요.';
  }

  return buildChoiceSectionsPayload({
    itemId: 'vv-sonnet',
    preflightMessage: '각 구간의 보기를 모두 고른 뒤 피드백 보기를 눌러 주세요.',
    items: list.map((item) => {
      const meta = VV_SONNET_META[item.segmentId] || {
        label: item.segmentId || '구간',
        focus: '시의 장면 · 음악 표현',
        tone: 'pitch'
      };
      return {
        key: item.segmentId,
        student: item.userChoice,
        correct: item.correctAnswer,
        label: meta.label,
        focus: meta.focus,
        tone: meta.tone,
        wrongHints: VV_SONNET_WRONG_FEEDBACK[item.segmentId],
        defaultWrongHint: {
          hint: '같은 구간을 다시 들으며 셈여림(소리의 세기)·빠르기·리듬꼴 중 무엇이 시의 장면과 가장 잘 맞는지 비교해 보세요.',
          example: '시의 장면을 떠올린 뒤, 소리의 세기·빠르기·리듬꼴만 귀로 비교해 보기를 다시 고르세요.'
        },
        missNote: (pick) => `네가 고른 「${pick}」은 이 구간의 음악 표현과 잘 맞지 않아요.`
      };
    }),
    correctSummary: '소네트 구간의 음악 표현이 모두 맞아요.',
    correctFooter:
      '표제음악에서는 시의 장면과 음악의 셈여림·빠르기·리듬꼴이 맞물려요. 같은 구간을 다시 들으며 확인해 보세요.'
  });
}

/** @deprecated 개별 구간용 — 활동 단위 getVvSonnetActivityFixedFeedback 사용 */
export function getVvSonnetFixedFeedback({ userChoice, correctAnswer, correctElaboration, segmentId }) {
  return getVvSonnetActivityFixedFeedback({
    items: [{ userChoice, correctAnswer, correctElaboration, segmentId }]
  });
}

const VV_CONCERTO_WRONG_FEEDBACK = {
  '독주만 계속 나온다': {
    hint: '「독주만 계속 나온다」를 골랐어요. 바이올린 한 대가 앞에서 노래하듯 연주하는 느낌이 강했나 봐요. 영상 전체를 다시 들으며, 한 대만 나오는지, 여러 현악기가 한꺼번에 들어와 소리가 두꺼워지는 순간도 있는지 음색의 밀도만 비교해 보세요.',
    example: '한 대가 두드러지는 구간과 여러 대가 함께 울리는 구간이 번갈아 있는지 귀로 찾아 보세요.'
  },
  '총주만 계속 나온다': {
    hint: '「총주만 계속 나온다」를 골랐어요. 현악 그룹이 함께 울리는 울림이 크게 들렸나 봐요. 영상 가운데를 다시 들으며, 전체가 계속 나오는지, 한 대가 앞으로 나와 소리가 얇아지는 순간도 있는지 밀도 변화만 비교해 보세요.',
    example: '전체가 두껍게 울리는 순간과 한 대가 앞으로 나오는 순간을 번갈아 찾아 보세요.'
  }
};

export function getVvConcertoFixedFeedback({ userChoice, correctAnswer }) {
  return buildChoiceSectionsPayload({
    itemId: 'vv-concerto',
    preflightMessage: '보기 중 하나를 고른 뒤 피드백 보기를 눌러 주세요.',
    items: [
      {
        key: 'discovery',
        student: userChoice,
        correct: correctAnswer,
        label: '독주·총주',
        focus: '음색 · 밀도 대비',
        tone: 'timbre',
        wrongHints: VV_CONCERTO_WRONG_FEEDBACK,
        defaultWrongHint: {
          hint: '영상에서 바이올린 한 대가 두드러지는 구간과 여러 현악기가 함께 울리는 구간을 찾아 보세요. 소리의 밀도와 음색이 어떻게 바뀌는지 비교해 들어 보세요.',
          example: '얇아지는 순간과 두꺼워지는 순간을 손으로 표시하며 들어 보세요.'
        },
        missNote: (pick) => `네가 고른 「${pick}」은 독주·총주가 나타나는 방식과 잘 맞지 않아요.`
      }
    ],
    correctSummary: '독주와 총주의 대비를 잘 짚었어요.',
    correctFooter:
      '바이올린 협주곡에서는 독주와 총주의 음색·밀도 대비가 중요해요. 영상에서 솔로와 앙상블 구간이 어떻게 바뀌는지 귀로 비교해 보세요.'
  });
}

export function getCpFormSegmentFixedFeedback({ cardId, label, feature }) {
  return buildCpFormSegmentPayload({ cardId, label, feature });
}

export function getCpRhythmFixedFeedback({ groupId, userChoice }) {
  return buildCpRhythmItemPayload({ groupId, userChoice });
}

const TONE_PAINTING_META = {
  s1: { label: '왕 중의 왕', focus: '음 높낮이 · 음화법', tone: 'pitch' },
  s2: { label: '할렐루야 반복', focus: '반복 · 강조', tone: 'scale' },
  s3: { label: '영원히 영원히', focus: '선율 길이 · 영원', tone: 'timbre' }
};

const TONE_PAINTING_WRONG_FEEDBACK = {
  s1: {
    '음이 갑자기 낮아진다': {
      hint: '「음이 갑자기 낮아진다」를 골랐어요. 음이 뚝 떨어지면 힘이 빠지거나 작아지는 느낌이 나기 쉬워요. 가사는 ‘왕 중의 왕’으로, 위엄과 높임을 떠올리게 해요. 이 구절에서 음이 가사의 느낌과 같은 방향으로 움직이는지, 반대로 움직이는지 음 높낮이·길이·빠르기를 비교해 들어 보세요.',
      example: '음이 위로 올라가는지, 아래로 떨어지는지 가사와 맞춰 들어 보세요.'
    },
    '리듬이 빨라진다': {
      hint: '「리듬이 빨라진다」를 골랐어요. 빨라지는 리듬은 긴박함을 잘 나타내죠. 이 구절은 박자가 급해지는지보다, 가사의 뜻을 음으로 그리는 음화법이에요. ‘왕 중의 왕’이 나올 때 음 높낮이·길이·빠르기 중 무엇이 가장 두드러지는지 들어 보세요.',
      example: '빠르기보다 음이 어느 방향으로 움직이는지에 귀를 모아 보세요.'
    },
    '선율이 길게 이어진다': {
      hint: '「선율이 길게 이어진다」를 골랐어요. 선율이 길게 이어지면 서정적으로 느껴질 수 있어요. 이 구절은 ‘왕’의 위대함을 어떻게 그리는지가 핵심이에요. 음의 길이뿐 아니라 가사가 나올 때 소리가 어떤 방향·느낌으로 움직이는지 비교해 들어 보세요.',
      example: '길게 이어지는지, 점점 높아지는지 가사와 함께 비교해 보세요.'
    }
  },
  s2: {
    '지루함을 준다': {
      hint: '「지루함을 준다」를 골랐어요. 같은 말이 반복되면 지루하게 들릴 수도 있죠. 다만 이 곡의 ‘할렐루야’ 반복이 힘이 빠지는지, 아니면 합창이 더 단단하게 쌓이는지 들어 보세요. 반복이 약해지는지·커지는지 셈여림과 함께 비교해 보면 효과가 달라 보여요.',
      example: '반복이 약해지는지, 더 힘 있게 쌓이는지 셈여림만 비교해 들어 보세요.'
    },
    '슬픔을 나타낸다': {
      hint: '「슬픔을 나타낸다」를 골랐어요. 슬픈 음악은 보통 어둡고 가라앉은 분위기예요. ‘할렐루야’는 찬양의 외침이에요. 이 구간이 슬프게 잦아드는지, 아니면 같은 말로 확신을 더하는 느낌인지 분위기를 다시 들어 보세요.',
      example: '가라앉는 분위기와 확신을 더하는 분위기 중 어디에 가까운지 들어 보세요.'
    },
    '음악이 끝나는 느낌을 준다': {
      hint: '「음악이 끝나는 느낌을 준다」를 골랐어요. 반복이 마침표처럼 들릴 때도 있어요. 이 구간의 ‘할렐루야’는 곡을 닫는 느낌일까요, 같은 말을 더 또렷이 외치는 느낌일까요? 반복이 끊기듯 끝나는지, 더 힘 있게 이어지는지 들어 보세요.',
      example: '끝나듯 끊기는지, 더 또렷이 이어지는지 반복의 힘을 비교해 보세요.'
    }
  },
  s3: {
    '음악이 갑자기 끝난다': {
      hint: '「음악이 갑자기 끝난다」를 골랐어요. 뚝 멈추는 끝은 ‘이제 그만’ 하는 느낌에 가깝죠. 가사는 ‘영원히 영원히’예요. 이 구간이 갑자기 멈추는지, 아니면 선율이 끊이지 않고 이어지는지 끝부분까지 들어 보세요.',
      example: '갑자기 멈추는지, 끊이지 않고 이어지는지 끝부분만 다시 들어 보세요.'
    },
    '음이 매우 낮아진다': {
      hint: '「음이 매우 낮아진다」를 골랐어요. 낮은 음은 무겁거나 가라앉은 느낌을 주기 쉬워요. ‘영원히’라는 가사가 나올 때 음이 아래로 내려가는지, 아니면 선율이 끝나지 않고 이어지는지 높낮이와 길이를 함께 들어 보세요.',
      example: '아래로 내려가는지, 끝나지 않고 이어지는지 높낮이·길이를 비교해 보세요.'
    },
    '리듬이 점점 빨라진다': {
      hint: '「리듬이 점점 빨라진다」를 골랐어요. 빨라지는 리듬은 긴박함을 잘 나타내죠. 그런데 이 가사는 ‘영원히’예요. 박자가 급해지는지, 아니면 선율이 끝나지 않고 계속 흘러가는지, 빠르기보다 선율이 얼마나 이어지는지에 귀를 모아 보세요.',
      example: '박자가 급해지는지, 선율이 계속 이어지는지 길이 쪽에 귀를 모아 보세요.'
    }
  }
};

/** 할렐루야 음화법 — 구간별 선택 → 맞음/다시 보기 카드 */
export function getTonePaintingActivityFixedFeedback({ segments, selected }) {
  const list = segments || [];
  if (!list.length || list.some((seg) => selected?.[seg.id] === null || selected?.[seg.id] === undefined)) {
    return '각 구간의 보기를 모두 고른 뒤 피드백 보기를 눌러 주세요.';
  }

  return buildChoiceSectionsPayload({
    itemId: 'tone-painting',
    preflightMessage: '각 구간의 보기를 모두 고른 뒤 피드백 보기를 눌러 주세요.',
    items: list.map((seg) => {
      const meta = TONE_PAINTING_META[seg.id] || {
        label: seg.title || seg.id,
        focus: '가사 · 음화법',
        tone: 'pitch'
      };
      const selectedIndex = selected?.[seg.id];
      const selectedLabel = seg.options?.[selectedIndex] || '';
      const correctLabel = seg.options?.[seg.answer] || '';
      return {
        key: seg.id,
        student: selectedLabel,
        correct: correctLabel,
        label: meta.label,
        focus: meta.focus,
        tone: meta.tone,
        wrongHints: TONE_PAINTING_WRONG_FEEDBACK[seg.id],
        defaultWrongHint: {
          hint: '가사의 뜻과 음악이 같은 방향으로 움직이는지, 음 높낮이·반복·선율 길이·빠르기 중 무엇이 두드러지는지 비교해 들어 보세요.',
          example: '가사 한 단어를 떠올린 뒤, 소리가 같은 방향으로 움직이는지 귀로 맞춰 보세요.'
        },
        missNote: (pick) => `네가 고른 「${pick}」은 이 구절의 음화법과 잘 맞지 않아요.`
      };
    }),
    correctSummary: '가사와 음악의 음화법 연결을 잘 짚었어요.',
    correctFooter: '음높이·반복·선율 흐름이 가사와 어떻게 맞는지 다시 들어 보세요.'
  });
}

export function getTonePaintingFixedFeedback({
  segmentId,
  segmentTitle,
  selectedIndex,
  selectedLabel,
  correctIndex,
  correctElaboration,
  options
}) {
  const opts = options || [];
  const resolvedOptions =
    opts.length > 0
      ? opts
      : [
          ...(selectedLabel ? [selectedLabel] : []),
          ...(correctElaboration && correctElaboration !== selectedLabel
            ? [String(correctElaboration).replace(/^[✓✔]\s*/, '')]
            : [])
        ];
  // 레거시 단일 구간 호출: 선택 인덱스와 정답 인덱스로 판정
  if (selectedIndex === null || selectedIndex === undefined) {
    return `${segmentTitle || '구간'}에서 먼저 보기 중 하나를 선택한 뒤 피드백 보기를 눌러 주세요.`;
  }
  const correctLabel =
    (Array.isArray(options) && options[correctIndex]) ||
    (typeof correctIndex === 'number' && resolvedOptions[correctIndex]) ||
    selectedLabel;
  return getTonePaintingActivityFixedFeedback({
    segments: [
      {
        id: segmentId,
        title: segmentTitle,
        options: Array.isArray(options)
          ? options
          : {
              [selectedIndex]: selectedLabel,
              [correctIndex]: correctLabel
            },
        answer: correctIndex
      }
    ],
    selected: { [segmentId]: selectedIndex }
  });
}

/** 정답 보기 값을 쓰지 않고, 인물·요소별 듣기 초점·예시만 안내 */
const VOICE_FIELD_LISTEN_HINTS = {
  해설자: {
    선율: {
      hint:
        '이야기를 전하는 구간에서 선율의 움직임을 다시 들어 보세요. 장면이 어떻게 흘러가는지 차분히 설명해 주듯 이어지는지, 같은 음 근처에서 맴돌며 답답한지, 꾸밈이 많아 화려하게 들리는지 귀로만 비교해 보세요.',
      example:
        '손가락으로 선율 높낮이를 따라가 보며 「담담히 전함 / 제자리 맴돔 / 화려하게 꾸밈」 중 어디에 가까운지 한 단어로 말한 뒤 보기를 다시 고르세요.'
    },
    음계: {
      hint:
        '해설자가 밤길을 전하는 구간의 분위기를 다시 들어 보세요. 밝고 가벼운지, 어둡고 무거운지 밝기·무게만 귀로 비교해 보세요. 장면의 긴장과 같은 방향인지 먼저 느낀 뒤 보기를 고르세요.',
      example: '분위기를 「밝음 / 어두움」 중 한 단어로 말한 뒤 보기를 다시 고르세요.'
    },
    음색: {
      hint:
        '해설자 목소리의 굵기를 다시 들어 보세요. 이야기를 앞에서 받쳐 줄 만큼 든든한지, 가볍고 여리게만 들리는지 음색만 비교해 보세요. 말의 내용이 또렷이 전달되는 굵기인지도 함께 느껴 보세요.',
      example: '목소리를 「든든한 굵기 / 여린 굵기」 중 어디에 가까운지 말한 뒤 보기를 다시 고르세요.'
    }
  },
  아버지: {
    선율: {
      hint:
        '아버지가 아이를 달래는 구간에서 선율의 높낮이와 움직임을 다시 들어 보세요. 낮게 감싸듯 이어지는지, 높이 날카롭게 튀는지, 꾸밈이 많아 화려한지 장면의 말투와 맞춰 비교해 보세요.',
      example:
        '선율을 따라가며 「낮고 부드럽게 감쌈 / 높고 날카로움 / 화려하게 꾸밈」 중 어디에 가까운지 말한 뒤 보기를 다시 고르세요.'
    },
    음계: {
      hint:
        '달래는 말이 나올 때 구간의 분위기를 다시 들어 보세요. 마음이 조금 편해지는 밝기인지, 긴장이 남는 어두움인지 밝기·무게만 비교해 보세요.',
      example: '「편해지는 방향 / 긴장이 남는 방향」 중 어디에 가까운지 느낀 뒤 보기를 다시 고르세요.'
    },
    음색: {
      hint:
        '아버지 목소리의 굵기를 다시 들어 보세요. 아이를 안심시키듯 든든하고 낮은지, 가볍고 여린지 음색만 비교해 보세요. 달래는 말에 어울리는 무게감인지도 함께 느껴 보세요.',
      example: '목소리를 「든든하고 낮음 / 가볍고 여림」 중 어디에 가까운지 말한 뒤 보기를 다시 고르세요.'
    }
  },
  아들: {
    선율: {
      hint:
        '아이가 호소하는 구간에서 선율의 움직임을 다시 들어 보세요. 같은 자리 근처에서 맴돌며 답답한지, 낮게 감싸듯 부드러운지, 밝게 뛰어오르는지 두려움·호소의 장면과 맞춰 비교해 보세요.',
      example:
        '선율을 따라가며 「제자리 맴돔 / 낮고 부드러움 / 밝게 뛰어오름」 중 어디에 가까운지 말한 뒤 보기를 다시 고르세요.'
    },
    음계: {
      hint:
        '두려움·호소가 섞인 구간의 분위기를 다시 들어 보세요. 불안이 남는 어두움인지, 밝고 가벼운 기분인지 밝기·무게만 비교해 보세요.',
      example: '「불안이 남음 / 밝고 가벼움」 중 어디에 가까운지 한 단어로 말한 뒤 보기를 다시 고르세요.'
    },
    음색: {
      hint:
        '아이 목소리의 굵기를 다시 들어 보세요. 여리고 얇게 들리는지, 묵직하고 두툼한지 음색만 비교해 보세요. 호소하는 아이의 장면에 어울리는 굵기인지도 함께 느껴 보세요.',
      example: '목소리를 「여리고 얇음 / 묵직하고 두툼함」 중 어디에 가까운지 말한 뒤 보기를 다시 고르세요.'
    }
  },
  마왕: {
    선율: {
      hint:
        '마왕이 유혹하는 구간에서 선율의 성격을 다시 들어 보세요. 꾸밈이 많아 달콤하고 화려한지, 낮고 무거운지, 같은 자리에 맴돌며 답답한지 유혹하는 말투와 맞춰 비교해 보세요.',
      example:
        '선율을 따라가며 「화려하게 꾸밈 / 낮고 무거움 / 제자리 맴돔」 중 어디에 가까운지 말한 뒤 보기를 다시 고르세요.'
    },
    음계: {
      hint:
        '유혹하는 구간의 분위기를 다시 들어 보세요. 다른 인물 구간과 나란히 들으며, 밝고 달콤한 기분인지 어둡고 무거운 기분인지 밝기·무게만 비교해 보세요.',
      example: '다른 인물과 비교해 「달콤·밝음 / 어둡·무거움」 중 어디에 가까운지 말한 뒤 보기를 다시 고르세요.'
    },
    음색: {
      hint:
        '마왕 목소리의 굵기를 다시 들어 보세요. 유혹하듯 가볍고 여린지, 묵직하고 두툼한지 음색만 비교해 보세요. 달콤한 말에 어울리는 소리의 결인지도 함께 느껴 보세요.',
      example: '목소리를 「가볍고 여림 / 묵직하고 두툼함」 중 어디에 가까운지 말한 뒤 보기를 다시 고르세요.'
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
        hint:
          '「한자리에 머무는 답답한 선율」을 골랐어요. 같은 음 근처에서 맴도는 호소처럼 들렸나 봐요. 해설자 구간을 다시 들으며, 선율이 제자리에 갇히는지, 아니면 장면을 차분히 전하며 앞으로 이어지는지 손가락으로 높낮이를 따라가 보세요.',
        example:
          '선율을 따라가며 「제자리 맴돔 / 담담히 앞으로 전함」 중 어디에 가까운지 말한 뒤 보기를 다시 고르세요.'
      },
      '달콤하고 화려한 선율': {
        hint:
          '「달콤하고 화려한 선율」을 골랐어요. 꾸며진 유혹처럼 들렸나 봐요. 해설자 구간을 다시 들으며, 꾸밈이 많아 화려한지, 아니면 이야기 전달에 맞게 담담히 이어지는지 귀로만 비교해 보세요.',
        example:
          '선율을 따라가며 「화려하게 꾸밈 / 담담히 전함」 중 어디에 가까운지 말한 뒤 보기를 다시 고르세요.'
      }
    },
    음계: {
      장조: {
        hint:
          '「장조」를 골랐어요. 밝고 경쾌한 기분으로 들렸나 봐요. 해설자가 밤길을 전하는 구간을 다시 들으며, 분위기가 밝고 가벼운지, 어둡고 무거운지 밝기·무게만 비교해 보세요.',
        example: '분위기를 「밝음 / 어두움」 중 한 단어로 말한 뒤 보기를 다시 고르세요.'
      }
    },
    음색: {
      얇음: {
        hint:
          '「얇음」을 골랐어요. 가볍고 여린 목소리로 들렸나 봐요. 해설자 목소리를 다시 들으며, 여리기만 한지, 이야기를 앞에서 받쳐 줄 만큼 든든한 굵기인지 음색만 비교해 보세요.',
        example: '목소리를 「여린 굵기 / 든든한 굵기」 중 어디에 가까운지 말한 뒤 보기를 다시 고르세요.'
      }
    }
  },
  아버지: {
    선율: {
      '높고 날카로운 선율': {
        hint:
          '「높고 날카로운 선율」을 골랐어요. 호소하듯 튀는 소리로 들렸나 봐요. 아버지가 아이를 달래는 구간을 다시 들으며, 선율이 높이 날카로운지, 낮게 감싸듯 이어지는지 높낮이와 움직임을 따라가 보세요.',
        example:
          '선율을 따라가며 「높고 날카로움 / 낮고 부드럽게 감쌈」 중 어디에 가까운지 말한 뒤 보기를 다시 고르세요.'
      },
      '달콤하고 화려한 선율': {
        hint:
          '「달콤하고 화려한 선율」을 골랐어요. 유혹하듯 꾸며진 소리로 들렸나 봐요. 아버지 구간을 다시 들으며, 꾸밈이 많은지, 달래는 말에 맞게 낮고 부드럽게 이어지는지 비교해 보세요. 다른 인물이 말할 때와 선율 성격이 같은지도 함께 들어 보세요.',
        example:
          '아버지·다른 인물을 번갈아 들으며 「화려하게 꾸밈 / 낮고 부드럽게 감쌈」 중 어디에 가까운지 말한 뒤 보기를 다시 고르세요.'
      }
    },
    음계: {
      단조: {
        hint:
          '「단조」를 골랐어요. 어둡고 무거운 기분으로 들렸나 봐요. 달래는 말이 나올 때 구간을 다시 들으며, 긴장이 남는 어두움인지, 마음이 조금 편해지는 밝기인지 밝기·무게만 비교해 보세요.',
        example: '「긴장이 남는 방향 / 편해지는 방향」 중 어디에 가까운지 느낀 뒤 보기를 다시 고르세요.'
      }
    },
    음색: {
      얇음: {
        hint:
          '「얇음」을 골랐어요. 가볍고 여린 목소리로 들렸나 봐요. 아버지 목소리를 다시 들으며, 여리기만 한지, 아이를 안심시키듯 든든하고 낮은 굵기인지 음색만 비교해 보세요.',
        example: '목소리를 「여린 굵기 / 든든하고 낮음」 중 어디에 가까운지 말한 뒤 보기를 다시 고르세요.'
      }
    }
  },
  아들: {
    선율: {
      '낮고 부드러운 선율': {
        hint:
          '「낮고 부드러운 선율」을 골랐어요. 달래듯 감싸는 소리로 들렸나 봐요. 아이가 호소하는 구간을 다시 들으며, 선율이 낮게 감싸는지, 같은 자리 근처에서 맴돌며 답답한지, 높낮이가 어떻게 움직이는지 따라가 보세요.',
        example:
          '선율을 따라가며 「낮고 부드러움 / 제자리 맴돔」 중 어디에 가까운지 말한 뒤 보기를 다시 고르세요.'
      },
      '밝고 경쾌하게 뛰어오르는 선율': {
        hint:
          '「밝고 경쾌하게 뛰어오르는 선율」을 골랐어요. 놀이처럼 도약한다고 들렸나 봐요. 아들 구간을 다시 들으며, 선율이 밝게 뛰어오르는지, 두려움·호소처럼 한곳에 맴돌거나 긴장되는지 귀로만 비교해 보세요.',
        example:
          '선율을 따라가며 「밝게 뛰어오름 / 긴장되며 맴돔」 중 어디에 가까운지 말한 뒤 보기를 다시 고르세요.'
      }
    },
    음계: {
      장조: {
        hint:
          '「장조」를 골랐어요. 밝고 가벼운 기분으로 들렸나 봐요. 두려움·호소가 섞인 구간을 다시 들으며, 분위기가 밝고 가벼운지, 불안이 남는 어두움인지 밝기·무게만 비교해 보세요.',
        example: '「밝고 가벼움 / 불안이 남음」 중 어디에 가까운지 한 단어로 말한 뒤 보기를 다시 고르세요.'
      }
    },
    음색: {
      두꺼움: {
        hint:
          '「두꺼움」을 골랐어요. 묵직하고 두툼한 목소리로 들렸나 봐요. 아이 목소리를 다시 들으며, 묵직하게 두툼한지, 호소하듯 여리고 얇은지 음색만 비교해 보세요.',
        example: '목소리를 「묵직하고 두툼함 / 여리고 얇음」 중 어디에 가까운지 말한 뒤 보기를 다시 고르세요.'
      }
    }
  },
  마왕: {
    선율: {
      '낮고 무거운 선율': {
        hint:
          '「낮고 무거운 선율」을 골랐어요. 경고처럼 내려가는 소리로 들렸나 봐요. 마왕이 유혹하는 구간을 다시 들으며, 선율이 낮고 무거운지, 꾸밈이 많아 달콤하고 화려한지 유혹하는 말투와 맞춰 비교해 보세요.',
        example:
          '선율을 따라가며 「낮고 무거움 / 화려하게 꾸밈」 중 어디에 가까운지 말한 뒤 보기를 다시 고르세요.'
      },
      '한자리에 머무는 답답한 선율': {
        hint:
          '「한자리에 머무는 답답한 선율」을 골랐어요. 같은 자리에 갇힌 소리로 들렸나 봐요. 마왕 구간을 다시 들으며, 선율이 제자리에 맴도는지, 유혹하듯 꾸며지며 움직이는지 귀로만 비교해 보세요.',
        example:
          '선율을 따라가며 「제자리 맴돔 / 화려하게 꾸밈」 중 어디에 가까운지 말한 뒤 보기를 다시 고르세요.'
      }
    },
    음계: {
      단조: {
        hint:
          '「단조」를 골랐어요. 어둡고 무거운 기분으로 들렸나 봐요. 유혹하는 구간을 다시 들으며, 다른 인물 구간과 나란히 비교해 보세요. 어둡고 무거운지, 달콤하고 밝은 기분인지 밝기·무게만 느껴 보세요.',
        example: '다른 인물과 비교해 「어둡·무거움 / 달콤·밝음」 중 어디에 가까운지 말한 뒤 보기를 다시 고르세요.'
      }
    },
    음색: {
      두꺼움: {
        hint:
          '「두꺼움」을 골랐어요. 묵직하고 두툼한 목소리로 들렸나 봐요. 마왕 목소리를 다시 들으며, 묵직하게 두툼한지, 유혹하듯 가볍고 여린지 음색만 비교해 보세요.',
        example: '목소리를 「묵직하고 두툼함 / 가볍고 여림」 중 어디에 가까운지 말한 뒤 보기를 다시 고르세요.'
      }
    }
  }
};

export function getVoiceDesignFixedFeedback(selectedChars, voiceDesign, answerKey) {
  const keys = VOICE_DESIGN_FIELD_KEYS;
  const name = selectedChars?.[0];
  if (!name) {
    return { kind: 'plain', text: '인물을 선택하고 세 항목을 모두 고른 뒤 피드백 보기를 눌러 주세요.' };
  }
  const row = normalizeVoiceDesignRow(voiceDesign?.[name]);
  const answer = answerKey?.[name] || {};

  return buildMultiFieldSectionsPayload({
    itemId: name,
    preflightMessage: '선율·음계·음색을 모두 고른 뒤 피드백 보기를 눌러 주세요.',
    fields: keys.map((field) => ({
      key: field,
      student: row[field],
      correct: answer[field],
      wrongHints: VOICE_WRONG_PICK_HINTS[name]?.[field],
      defaultWrongHint: VOICE_FIELD_LISTEN_HINTS[name]?.[field],
      missNote: (pick) => `네가 고른 「${pick}」은 이 구간과 잘 맞지 않아요.`
    })),
    fieldMeta: VOICE_FIELD_META,
    correctSummary: `「${name}」선율·음계·음색이 모두 맞아요.`,
    correctFooter: '영상을 한 번 더 들으며 세 가지가 어떻게 함께 들리는지 확인해 보세요.',
    wrongFooter: FOOTER.noAnswerReveal,
    partialSummary: () => PARTIAL_SUMMARY_DEFAULT
  });
}

const PIANO_RH_WRONG_HINT = {
  폭풍우: {
    hint:
      '「폭풍우」를 골랐어요. 오른손이 넓게 몰아치는 것처럼 들렸나 봐요. 오른손만 다시 들으며, 하늘이 열리는 듯 크게 출렁이는지, 짧게 자주 뛰어가며 촘촘히 반복되는지 리듬의 폭과 촘촘함만 비교해 보세요.',
    example:
      '손바닥으로 박을 치며 「넓게 출렁임 / 짧게 자주 반복」 중 어디에 가까운지 말한 뒤 보기를 다시 고르세요.'
  },
  파도: {
    hint:
      '「파도」를 골랐어요. 오른손이 느릿하게 오르내리는 것처럼 들렸나 봐요. 오른손만 다시 들으며, 넓게 출렁이며 느리게 오르내리는지, 짧게 자주 반복되며 급하게 움직이는지 리듬만 비교해 보세요.',
    example:
      '「넓고 느리게 출렁임 / 짧고 자주 반복」 중 어디에 가까운지 귀로만 비교한 뒤 보기를 다시 고르세요.'
  },
  바람: {
    hint:
      '「바람」을 골랐어요. 오른손이 스치듯 지나가는 것처럼 들렸나 봐요. 오른손만 다시 들으며, 흩어지듯 스쳐 지나가는지, 규칙적으로 톡톡 반복되는지 리듬만 비교해 보세요.',
    example:
      '손바닥으로 박을 치며 「스쳐 지나감 / 규칙적으로 톡톡 반복」 중 어디에 가까운지 말한 뒤 보기를 다시 고르세요.'
  }
};

const PIANO_LH_WRONG_HINT = {
  북소리: {
    hint:
      '「북소리」를 골랐어요. 왼손이 타악기처럼 딱딱 끊긴다고 들렸나 봐요. 왼손만 다시 들으며, 북처럼 표면이 맞부딪히는 소리인지, 낮은 음이 가슴 박동처럼 규칙적으로 이어지는지 음색과 박동만 비교해 보세요.',
    example:
      '손바닥으로 박을 맞춰 「딱딱 끊기는 타점 / 낮게 규칙적인 박동」 중 어디에 가까운지 말한 뒤 보기를 다시 고르세요.'
  },
  '무거운 발걸음': {
    hint:
      '「무거운 발걸음」을 골랐어요. 왼손이 한 걸음씩 짚는 것처럼 들렸나 봐요. 왼손만 다시 들으며, 천천히 무겁게 내딛는지, 짧게 자주 찍히는 박동처럼 움직이는지 빠르기와 무게만 비교해 보세요.',
    example:
      '손바닥으로 박을 맞춰 「느리게 내딛는 무게 / 짧게 자주 찍히는 박동」 중 어디에 가까운지 말한 뒤 보기를 다시 고르세요.'
  },
  '잔잔한 물결': {
    hint:
      '「잔잔한 물결」을 골랐어요. 왼손이 부드럽게 흐른다고 들렸나 봐요. 왼손만 다시 들으며, 잔잔히 이어지는지, 짧고 규칙적으로 강하게 찍히는지 셈여림과 끊김만 비교해 보세요.',
    example:
      '「부드럽게 흐름 / 짧고 규칙적으로 찍힘」 중 어디에 가까운지 귀로만 비교한 뒤 보기를 다시 고르세요.'
  }
};

export function getPianoSceneFixedFeedback({ rhScene, lhScene }) {
  return buildMultiFieldSectionsPayload({
    itemId: 'piano-scene',
    preflightMessage: '오른손·왼손 장면을 모두 고른 뒤 피드백 보기를 눌러 주세요.',
    fields: [
      {
        key: 'rh',
        student: rhScene,
        correct: PIANO_RH_SCENE_CORRECT,
        wrongHints: PIANO_RH_WRONG_HINT,
        missNote: (pick) => `네가 고른 「${pick}」은 오른손 반주와 잘 맞지 않아요.`,
        defaultWrongHint: {
          hint:
            '오른손만 다시 들으며, 빠르고 촘촘하게 반복되는 리듬이 어떤 움직임을 떠올리게 하는지 비교해 보세요. 넓게 출렁이는지, 짧게 자주 뛰어가는지, 스치듯 지나가는지 리듬의 폭과 촘촘함만 짚어 보세요.',
          example:
            '손바닥으로 박을 치며 「넓게 출렁임 / 짧게 자주 반복 / 스쳐 지나감」 중 어디에 가까운지 말한 뒤 보기를 다시 고르세요.'
        }
      },
      {
        key: 'lh',
        student: lhScene,
        correct: PIANO_LH_SCENE_CORRECT,
        wrongHints: PIANO_LH_WRONG_HINT,
        missNote: (pick) => `네가 고른 「${pick}」은 왼손 반주와 잘 맞지 않아요.`,
        defaultWrongHint: {
          hint:
            '왼손만 다시 들으며, 낮고 강하게 반복되는 베이스가 어떤 박동·무게감을 주는지 비교해 보세요. 딱딱 끊기는 타점인지, 느리게 내딛는 무게인지, 짧고 규칙적인 박동인지 손바닥으로 맞춰 보세요.',
          example:
            '「딱딱한 타점 / 느린 발걸음 / 짧은 규칙 박동」 중 어디에 가까운지 말한 뒤 보기를 다시 고르세요.'
        }
      }
    ],
    fieldMeta: {
      rh: { label: '오른손 장면', focus: '빠른 반복 리듬 · 움직임', tone: 'pitch' },
      lh: { label: '왼손 장면', focus: '낮은 베이스 · 박동/무게', tone: 'timbre' }
    },
    correctSummary: '오른손·왼손 장면이 모두 맞아요.',
    correctFooter:
      '각 손 반주를 다시 들으며, 고른 장면이 소리의 리듬·무게와 어떻게 연결되는지 확인해 보세요.',
    wrongFooter: '정답 장면 이름은 알려 주지 않아요. 각 영역의 힌트만 보고 다시 골라 보세요. 다시 들어보세요.',
    partialSummary: () => PARTIAL_SUMMARY_DEFAULT
  });
}

const HY_THEME_T1_CORRECT = new Set(['o1', 'o3', 'o5']);
const HY_THEME_T1_WRONG = new Set(['o2', 'o4', 'o6']);
const HY_THEME_T2_CORRECT = new Set(['o2', 'o4', 'o6']);
const HY_THEME_T2_WRONG = new Set(['o1', 'o3', 'o5']);

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
      '두 주제의 선율 움직임·리듬꼴·느낌이 칸과 잘 맞아요. 소나타 형식에서는 제1주제와 제2주제가 이렇게 대비되며, 조성(도수) 차이와 함께 곡의 형식미를 만들어요.'
    );
  }

  const mark = col1Ok || col2Ok ? '△' : '✗';
  return {
    kind: 'hy-theme-match',
    mark,
    ...buildHyThemeMatchWrongPayload(t1, t2, { col1Ok, col2Ok })
  };
}

export function getHyThemePart3FixedFeedback({ selectedDeg }) {
  return buildSingleChoiceFeedback({
    userChoice: selectedDeg,
    correctAnswer: '5도',
    preflightMessage: '3도·5도·8도 중 하나를 고른 뒤 피드백 보기를 눌러 주세요.',
    correctBody:
      'G에서 D까지의 간격을 건반에서 세어 보았어요. 5도는 시작음에서 다섯 칸 떨어진 느낌으로, 소나타 형식에서 두 주제의 조성 관계를 만드는 데 자주 쓰여요. 선율과 함께 떠올려 보세요.',
    wrongHints: HY_THEME_DEG_WRONG_FEEDBACK,
    defaultWrongBody:
      '건반에서 두 주제의 시작음을 함께 누른 뒤, 그 사이를 한 칸씩 세어 보세요. 3도·5도·8도 중 어떤 느낌에 가까운지 비교해 보세요. 다시 생각해보세요.'
  });
}

const HY_THEME_DEG_WRONG_FEEDBACK = {
  '3도':
    '「3도」를 골랐어요. 3도는 두 음이 바로 옆 건반처럼 가까울 때 느껴지는 간격이에요.\n' +
    '건반에서 두 주제의 시작음을 함께 누른 뒤, 그 사이를 한 칸씩 손가락으로 세어 보세요. 아주 가까운 간격인지, 그보다 조금 더 벌어진 간격인지, 한 옥타브처럼 멀리 떨어진 간격인지 비교해 보세요.\n' +
    '다시 생각해보세요.',
  '8도':
    '「8도」를 골랐어요. 8도는 같은 음이름의 위·아래처럼 한 옥타브 떨어진 간격이에요.\n' +
    '건반에서 두 주제의 시작음 글자를 보고, 그 사이를 한 칸씩 손가락으로 세어 보세요. 한 옥타브만큼 멀리 떨어졌는지, 그보다 가까운 간격인지 귀와 눈으로 함께 비교해 보세요.\n' +
    '다시 생각해보세요.'
};

export function getSbAtonalMatchFixedFeedback({ tonalCards, atonalCards }) {
  const tonal = tonalCards || [];
  const atonal = atonalCards || [];
  if (!tonal.length || !atonal.length) {
    return '여섯 장의 카드를 모두 칸에 넣은 뒤 피드백 보기를 눌러 주세요.';
  }

  const tonalCorrect = new Set(['조성이 있다', '편안하고 안정적', '음들이 서로 잘 어울린다.']);
  const tonalWrong = new Set(['조성이 없다', '낯설고 긴장감', '음들이 따로 논다.']);
  const atonalCorrect = new Set(['조성이 없다', '낯설고 긴장감', '음들이 따로 논다.']);
  const atonalWrong = new Set(['조성이 있다', '편안하고 안정적', '음들이 서로 잘 어울린다.']);
  const colTonalOk = sbAtonalColumnOk(tonal, tonalCorrect, tonalWrong);
  const colAtonalOk = sbAtonalColumnOk(atonal, atonalCorrect, atonalWrong);

  if (colTonalOk && colAtonalOk) {
    return verification(
      true,
      '두 곡의 조성 유무·안정감·긴장감·음의 어울림이 칸과 잘 맞아요. 두 곡을 번갈아 들으며 차이를 다시 확인해 보세요.'
    );
  }

  const mark = colTonalOk || colAtonalOk ? '△' : '✗';
  return {
    kind: 'hy-theme-match',
    mark,
    col1Header: '송어 칸',
    col2Header: '피에로 칸',
    ...buildSbAtonalMatchWrongPayload(tonal, atonal, { colTonalOk, colAtonalOk })
  };
}

/**
 * 쇤베르크 슈프레흐슈팀메 — 말하기↔노래하기 슬라이더 형성적 피드백
 * @param {'normal' | 'sprech'} kind
 */
export function getSbSprechFixedFeedback({ kind, hasMoved, isCorrect, toneText }) {
  if (kind === 'normal') {
    return buildSliderItemPayload({
      ready: hasMoved,
      notReadyMessage: '먼저 슬라이더를 움직여 본 뒤 피드백 보기를 눌러 주세요.',
      isCorrect,
      toneText,
      correctBody:
        '일반 성악은 음높이(피치)를 안정적으로 유지하며 노래해요. 음이 흔들리지 않고 이어지는지 다시 들어 보세요.',
      wrongBody:
        SB_SPRECH_WRONG_FEEDBACK.normal[toneText] ||
        '송어 구간을 다시 들으며, 음이 한자리에 오래 머무는지·말하기처럼 짧게 끊기는지 비교해 보세요. 다시 들어보세요.'
    });
  }

  return buildSliderItemPayload({
    ready: hasMoved,
    notReadyMessage: '먼저 슬라이더를 움직여 본 뒤 피드백 보기를 눌러 주세요.',
    isCorrect,
    toneText,
    correctBody:
      '슈프레흐슈팀메는 말과 노래의 경계에 있어요. 음에 닿을락 말락 하며 말하기에 더 가깝게 들리는지 확인해 보세요.',
    wrongBody:
      SB_SPRECH_WRONG_FEEDBACK.sprech[toneText] ||
      '피에로 구간을 다시 들으며, 음이 고정되어 이어지는지·바로 흔들리며 말처럼 들리는지 비교해 보세요. 다시 들어보세요.'
  });
}

const SB_SPRECH_WRONG_FEEDBACK = {
  normal: {
    '완전히 말하기':
      '슬라이더를 「완전히 말하기」쪽에 두었어요. 송어가 말하듯 짧게 끊긴다고 들렸나 봐요.\n' +
      '일반 가곡 구간을 다시 들으며, 음이 바로 떨어지듯 말하는지, 한 음에 오래 머무르며 노래하는지 비교해 보세요. 음높이(피치)가 흔들리지 않고 이어지는지도 함께 들어 보세요.\n' +
      '다시 들어보세요.',
    '말하기에 가까워요':
      '슬라이더를 「말하기에 가까워요」쪽에 두었어요. 말과 노래 사이처럼 들렸나 봐요.\n' +
      '송어 구간을 다시 들으며, 음이 흔들리다 떨어지는지, 흔들림 없이 한 음에 머무르는지 비교해 보세요. 성악처럼 음이 안정적으로 이어지는 쪽에 더 가까운지도 짚어 보세요.\n' +
      '다시 들어보세요.',
    '정중앙이예요':
      '슬라이더를 「정중앙」에 두었어요. 말과 노래가 반반처럼 들렸나 봐요.\n' +
      '송어 구간을 다시 들으며, 중간에 걸쳐 있는지, 음높이가 안정적으로 이어지는 노래에 더 가까운지 귀로 비교해 보세요. 말처럼 끊기는지·노래처럼 이어지는지를 양 끝과 함께 느껴 보세요.\n' +
      '다시 들어보세요.',
    '노래하기에 가까워요':
      '슬라이더를 「노래하기에 가까워요」쪽에 두었어요. 거의 노래라고 느꼈나 봐요.\n' +
      '송어 구간을 다시 들으며, ‘가까운 노래’인지, 음이 흔들림 없이 끝까지 이어지는 완전한 성악인지 비교해 보세요. 음높이가 고정되어 유지되는지도 함께 들어 보세요.\n' +
      '다시 들어보세요.'
  },
  sprech: {
    '완전히 말하기':
      '슬라이더를 「완전히 말하기」쪽에 두었어요. 피에로가 말만 한다고 들렸나 봐요.\n' +
      '이 구간을 다시 들으며, 음에 전혀 안 닿는지, 닿을락 말락 하며 말과 노래 사이에 걸쳐 있는지 비교해 보세요. 음높이만 살짝 스치고 바로 말처럼 흐르는지도 들어 보세요.\n' +
      '다시 들어보세요.',
    '정중앙이예요':
      '슬라이더를 「정중앙」에 두었어요. 말과 노래가 반반처럼 들렸나 봐요.\n' +
      '피에로 구간을 다시 들으며, 정확히 가운데인지, 음에 살짝 닿았다가 바로 말처럼 흐르는지 비교해 보세요. 일반 성악처럼 음이 고정되는지·미끄러지듯 흔들리는지도 함께 들어 보세요.\n' +
      '다시 들어보세요.',
    '노래하기에 가까워요':
      '슬라이더를 「노래하기에 가까워요」쪽에 두었어요. 거의 노래처럼 들렸나 봐요.\n' +
      '피에로 구간을 다시 들으며, 음이 안정적으로 이어지는지, 닿자마자 흔들리며 말처럼 들리는지 비교해 보세요. 음높이에 오래 머무는지·바로 미끄러지는지도 짚어 보세요.\n' +
      '다시 들어보세요.',
    '완전히 노래하기':
      '슬라이더를 「완전히 노래하기」쪽에 두었어요. 일반 성악처럼 들렸나 봐요.\n' +
      '피에로 구간을 다시 들으며, 음이 고정되어 이어지는지, 말하듯 미끄러지며 음높이가 흔들리는지 비교해 보세요. 음에 닿을락 말락 하는 느낌이 있는지도 함께 들어 보세요.\n' +
      '다시 들어보세요.'
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
  high: '이 구간이 가장 높고 가벼운 선인지, 그보다 낮고 굵은 선인지 음높이만 다시 들어 보세요. 종달새처럼 위로 떠오르는 소리인지도 함께 느껴 보세요.',
  mid: '이 구간이 가운데 음역인지, 더 높거나 더 낮은지 비교해 들어 보세요. 주선율과 가장 낮은 선 사이를 채우는 소리인지도 함께 짚어 보세요.',
  low: '이 구간이 가장 낮고 굵은 받침인지, 그보다 높은지 음높이만 다시 들어 보세요. 앙상블 아래에서 무게를 받치는 소리인지도 함께 느껴 보세요.'
};

const HY_TIMBRE_CORRECT = {
  1: '바이올린이 가장 높은 선율(주선율)을 맡아요. 종달새처럼 높고 맑게 떠오르는 선이 어떻게 노래하는지 이어 들어 보세요.',
  2: '비올라가 중간 음역(중성부)으로 주선율과 베이스 사이를 채워요. 세 선이 어떻게 겹쳐지는지 비교해 들어 보세요.',
  3: '첼로가 가장 낮은 선(베이스)으로 앙상블을 받쳐요. 무게감 있는 받침이 어떻게 깔리는지 끝까지 들어 보세요.'
};

function buildHyTimbreFieldHint({ pick, kind, segmentIdx }) {
  const range = HY_TIMBRE_RANGE[pick];
  const rangeLabel = HY_TIMBRE_RANGE_LABEL[pick] || '그 음역';
  const listen = HY_TIMBRE_LISTEN_HINT[range] || '음높이만 다시 들어 보세요.';
  if (kind === 'instr') {
    return {
      hint: `「${pick}」를 골랐어요. ${pick}${koreanEunNeun(pick)} ${rangeLabel}이에요. 구간 ${segmentIdx}만 다시 들으며, 네가 고른 악기의 음역과 이 구간의 소리가 같은 높이대인지 비교해 들어 보세요. ${listen}`,
      example: '높은 선·가운데 선·낮은 선 중 어디에 가까운지 귀로만 맞춰 본 뒤, 악기 이름을 다시 고르세요.'
    };
  }
  return {
    hint: `「${pick}」를 골랐어요. ${pick}${koreanEunNeun(pick)} ${rangeLabel}이에요. 구간 ${segmentIdx}만 다시 들으며, 그 역할(가장 높은 선·가운데 채움·가장 낮은 받침)과 음역이 맞는지 함께 들어 보세요. ${listen}`,
    example: '주선율·중성부·베이스 중 이 구간의 역할에 가까운 쪽을 음역과 함께 다시 골라 보세요.'
  };
}

/** 종달새 현악 음색 — 구간별 악기·역할 → 맞음/다시 보기 카드 */
export function getHyTimbreActivityFixedFeedback({ segments, selectedByGrid, roleByGrid }) {
  const list = segments || [];
  if (!list.length || list.some((seg) => !selectedByGrid?.[seg.gridId] || !roleByGrid?.[seg.gridId])) {
    return '각 구간의 악기와 역할을 모두 고른 뒤 피드백 보기를 눌러 주세요.';
  }

  const fields = [];
  const fieldMeta = {};
  list.forEach((seg) => {
    const instrKey = `instr-${seg.idx}`;
    const roleKey = `role-${seg.idx}`;
    const picked = selectedByGrid[seg.gridId];
    const rolePick = roleByGrid[seg.gridId];
    fields.push({
      key: instrKey,
      student: picked,
      correct: seg.answer,
      wrongHints: {},
      defaultWrongHint: buildHyTimbreFieldHint({ pick: picked, kind: 'instr', segmentIdx: seg.idx }),
      missNote: (pick) => `네가 고른 「${pick}」은 구간 ${seg.idx} 악기와 잘 맞지 않아요.`
    });
    fields.push({
      key: roleKey,
      student: rolePick,
      correct: seg.roleAnswer,
      wrongHints: {},
      defaultWrongHint: buildHyTimbreFieldHint({ pick: rolePick, kind: 'role', segmentIdx: seg.idx }),
      missNote: (pick) => `네가 고른 「${pick}」은 구간 ${seg.idx} 역할과 잘 맞지 않아요.`
    });
    fieldMeta[instrKey] = {
      label: `구간 ${seg.idx} 악기`,
      focus: '음역 · 악기 음색',
      tone: 'pitch'
    };
    fieldMeta[roleKey] = {
      label: `구간 ${seg.idx} 역할`,
      focus: '주선율 · 중성부 · 베이스',
      tone: 'timbre'
    };
  });

  const correctBits = list.map((seg) => HY_TIMBRE_CORRECT[seg.idx]).filter(Boolean);

  return buildMultiFieldSectionsPayload({
    itemId: 'hy-timbre',
    preflightMessage: '각 구간의 악기와 역할을 모두 고른 뒤 피드백 보기를 눌러 주세요.',
    fields,
    fieldMeta,
    correctSummary: '악기와 역할이 모두 맞아요.',
    correctFooter: correctBits.join(' ') || '현악 4중주의 음색 나뉨을 이어 들어 보세요.',
    wrongFooter: FOOTER.noAnswerRevealFields,
    partialSummary: () => PARTIAL_SUMMARY_DEFAULT
  });
}

export function getHyTimbreFixedFeedback({ picked, rolePick, answer, roleAnswer, segmentIdx }) {
  return getHyTimbreActivityFixedFeedback({
    segments: [
      {
        idx: segmentIdx,
        gridId: 'single',
        answer,
        roleAnswer
      }
    ],
    selectedByGrid: { single: picked },
    roleByGrid: { single: rolePick }
  });
}

