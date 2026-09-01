import { normalizeFormativeChoice } from './compareFeedback';
import { VOICE_DESIGN_FIELD_KEYS, normalizeVoiceDesignRow } from './voiceDesignAnswers';
import {
  countTokenHits,
  evaluateOverviewQuestion,
  gradeOverviewQ1,
  gradeOverviewQ2,
  includesAnyToken
} from './overviewGrading';
import { buildMultiFieldSectionsPayload } from './formative/buildMultiField';
import { buildSingleChoiceFeedback, buildSliderItemPayload } from './formative/buildSingleChoice';
import { buildCpFormSegmentPayload, buildCpRhythmItemPayload } from './formative/builders';
import { buildHyThemeMatchWrongPayload } from './formative/content/hyThemeMatch';
import { buildSbAtonalMatchWrongPayload, sbAtonalColumnOk } from './formative/content/sbAtonalMatch';
import { FOOTER, PARTIAL_SUMMARY_DEFAULT, verification, verificationWithMark } from './formative/templates';
import { PIANO_LH_SCENE_CORRECT, PIANO_RH_SCENE_CORRECT } from './pianoSceneAnswers';

export function getVvSonnetFixedFeedback({ userChoice, correctAnswer, correctElaboration, segmentId }) {
  return buildSingleChoiceFeedback({
    userChoice,
    correctAnswer,
    normalize: normalizeFormativeChoice,
    correctBody: correctElaboration
      ? `${String(correctElaboration).replace(/^[✓✔]\s*/, '')}`
      : '표제음악에서는 시의 장면과 음악의 셈여림·빠르기·리듬꼴이 맞물려요.',
    wrongHints: VV_SONNET_WRONG_FEEDBACK[segmentId],
    defaultWrongBody:
      '같은 구간을 다시 들으며 셈여림(소리의 세기)·빠르기·리듬꼴 중 무엇이 시의 장면과 가장 잘 맞는지 비교해 보세요. 다시 들어보세요.'
  });
}

const VV_SONNET_WRONG_FEEDBACK = {
  'vv-c1': {
    '음이 부드럽고 느리게 이어진다':
      '「음이 부드럽고 느리게 이어진다」를 골랐어요. 부드러운 선율은 잔잔한 바람이나 고요한 장면에 잘 어울리죠.\n이 소네트는 하늘이 천둥치고 번개가 번쩍이는 장면이에요. 같은 구간을 다시 들으며, 소리가 살살 이어지는지 아니면 갑자기 세게 터지듯 들리는지 셈여림(소리의 세기)과 빠르기만 비교해 보세요.\n다시 들어보세요.',
    '음이 점점 낮아지며 사라진다':
      '「음이 점점 낮아지며 사라진다」를 골랐어요. 음이 아래로 잦아들면 장면이 멀어지거나 잠잠해지는 느낌이 나요.\n번개가 번쩍이는 가사와 맞춰 들으며, 이 구간이 점점 사그라드는지, 갑작스럽게 세게 터지는지, 아니면 다른 방향으로 움직이는지 셈여림과 빠르기를 비교해 보세요.\n다시 들어보세요.',
    '음이 갑자기 강하고 빠르게 터진다':
      '「음이 갑자기 강하고 빠르게 터진다」를 골랐어요. 갑작스럽고 강한 소리는 천둥·번개 장면과 잘 어울릴 수 있어요.\n이 구간에서 그 느낌이 처음부터 끝까지 이어지는지, 중간에 다른 느낌도 섞이는지 처음·한가운데·끝을 나눠 들어 보세요.\n다시 들어보세요.'
  },
  'vv-c2': {
    '음이 길게 이어지며 서정적으로 흐른다':
      '「음이 길게 이어지며 서정적으로 흐른다」를 골랐어요. 긴 선율은 노래처럼 이어지는 장면에 잘 맞아요.\n가사는 우박이 이삭을 때리는 장면이에요. 우박이 뚝뚝 떨어지는 모습을 떠올리며, 음이 길게 흐르는지 짧게 톡톡 끊기는지 리듬꼴만 다시 들어 보세요.\n다시 들어보세요.',
    '음이 매우 느리고 조용해진다':
      '「음이 매우 느리고 조용해진다」를 골랐어요. 느리고 조용한 음악은 잠잠해지는 장면에 잘 어울리죠.\n우박이 쏟아지는 가사와 맞춰 들으며, 이 구간이 잠잠한지, 짧고 또렷한 음이 여러 번 부딪히는지, 아니면 다른 느낌이 섞이는지 빠르기와 셈여림을 비교해 보세요.\n다시 들어보세요.',
    '음이 짧고 강하게 반복된다':
      '「음이 짧고 강하게 반복된다」를 골랐어요. 짧고 강한 반복은 우박이 떨어지는 느낌과 잘 맞을 수 있어요.\n이 구간에서 그 느낌이 처음부터 끝까지 이어지는지, 중간에 다른 느낌도 섞이는지 리듬꼴을 나눠 들어 보세요.\n다시 들어보세요.'
  }
};

export function getVvConcertoFixedFeedback({ userChoice, correctAnswer }) {
  return buildSingleChoiceFeedback({
    userChoice,
    correctAnswer,
    normalize: normalizeFormativeChoice,
    correctBody:
      '바이올린 협주곡에서는 독주와 총주의 음색·밀도 대비가 중요해요. 영상에서 솔로와 앙상블 구간이 어떻게 바뀌는지 귀로 비교해 보세요.',
    wrongHints: VV_CONCERTO_WRONG_FEEDBACK,
    defaultWrongBody:
      '영상에서 바이올린 한 대가 두드러지는 구간과 여러 현악기가 함께 울리는 구간을 찾아 보세요. 소리의 밀도와 음색이 어떻게 바뀌는지 비교해 들어 보세요. 다시 들어보세요.'
  });
}

const VV_CONCERTO_WRONG_FEEDBACK = {
  '독주만 계속 나온다':
    '「독주만 계속 나온다」를 골랐어요. 바이올린 한 대가 앞에서 노래하듯 연주하는 느낌이 강했나 봐요.\n영상 전체를 다시 들으며, 한 대만 나오는지, 여러 현악기가 한꺼번에 들어와 소리가 두꺼워지는 순간도 있는지 음색의 밀도만 비교해 보세요.\n다시 들어보세요.',
  '총주만 계속 나온다':
    '「총주만 계속 나온다」를 골랐어요. 현악 그룹이 함께 울리는 울림이 크게 들렸나 봐요.\n영상 가운데를 다시 들으며, 전체가 계속 나오는지, 한 대가 앞으로 나와 소리가 얇아지는 순간도 있는지 밀도 변화만 비교해 보세요.\n다시 들어보세요.'
};

export function getCpFormSegmentFixedFeedback({ cardId, label, feature }) {
  return buildCpFormSegmentPayload({ cardId, label, feature });
}

export function getCpRhythmFixedFeedback({ groupId, userChoice }) {
  return buildCpRhythmItemPayload({ groupId, userChoice });
}

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
    || '「' + pick + '」을 골랐어요. 가사의 뜻과 음악이 같은 방향으로 움직이는지, 음 높낮이·반복·선율 길이·빠르기 중 무엇이 두드러지는지 비교해 들어 보세요. 다시 들어보세요.';
  return verification(false, '', wrongBody);
}

const TONE_PAINTING_WRONG_FEEDBACK = {
  s1: {
    '음이 갑자기 낮아진다':
      '「음이 갑자기 낮아진다」를 골랐어요. 음이 뚝 떨어지면 힘이 빠지거나 작아지는 느낌이 나기 쉬워요.\n가사는 ‘왕 중의 왕’으로, 위엄과 높임을 떠올리게 해요. 이 구절에서 음이 가사의 느낌과 같은 방향으로 움직이는지, 반대로 움직이는지 음 높낮이·길이·빠르기를 비교해 들어 보세요.\n다시 들어보세요.',
    '리듬이 빨라진다':
      '「리듬이 빨라진다」를 골랐어요. 빨라지는 리듬은 긴박함을 잘 나타내죠.\n이 구절은 박자가 급해지는지보다, 가사의 뜻을 음으로 그리는 음화법이에요. ‘왕 중의 왕’이 나올 때 음 높낮이·길이·빠르기 중 무엇이 가장 두드러지는지 들어 보세요.\n다시 들어보세요.',
    '선율이 길게 이어진다':
      '「선율이 길게 이어진다」를 골랐어요. 선율이 길게 이어지면 서정적으로 느껴질 수 있어요.\n이 구절은 ‘왕’의 위대함을 어떻게 그리는지가 핵심이에요. 음의 길이뿐 아니라 가사가 나올 때 소리가 어떤 방향·느낌으로 움직이는지 비교해 들어 보세요.\n다시 들어보세요.'
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
      example: '영상만 먼저 듣고, 세 보기 중 가장 가까운 쪽을 골라 보세요.'
    },
    음계: {
      hint: '이 구간의 기분이 장면과 맞는지, 밝기·무게만 귀로 비교해 보세요.',
      example: '분위기를 한 단어로 말한 뒤 보기를 다시 고르세요.'
    },
    음색: {
      hint: '목소리 굵기가 이야기 전달에 맞는지 들어 보세요.',
      example: '영상만 듣고 목소리 굵기를 떠올려 보세요.'
    }
  },
  아버지: {
    선율: {
      hint: '아버지가 아이를 달래는 구간에서, 선율의 높낮이와 움직임이 장면과 맞는지 들어 보세요.',
      example: '영상만 먼저 듣고, 세 보기 중 가장 가까운 쪽을 골라 보세요.'
    },
    음계: {
      hint: '달래는 말일 때, 이 구간의 분위기가 장면과 맞는지 밝기·무게만 들어 보세요.',
      example: '편해지는 방향인지, 긴장이 남는 방향인지 먼저 느낀 뒤 보기를 다시 고르세요.'
    },
    음색: {
      hint: '아버지 목소리 굵기가 장면에 어울리는지 들어 보세요.',
      example: '영상만 듣고 목소리 굵기를 떠올려 보세요.'
    }
  },
  아들: {
    선율: {
      hint: '아이가 호소하는 구간에서, 선율이 같은 자리에 머무는지·위아래로 움직이는지 들어 보세요.',
      example: '영상만 먼저 듣고, 세 보기 중 가장 가까운 쪽을 골라 보세요.'
    },
    음계: {
      hint: '두려움·호소가 섞인 구간의 분위기가 장면과 맞는지 들어 보세요.',
      example: '불안이 남는지, 조금 풀리는지 한 단어로 말한 뒤 보기를 다시 고르세요.'
    },
    음색: {
      hint: '아이 목소리 굵기가 장면에 어울리는지 들어 보세요.',
      example: '영상만 듣고 목소리 굵기를 떠올려 보세요.'
    }
  },
  마왕: {
    선율: {
      hint: '마왕이 유혹하는 구간에서, 선율이 꾸며지는지·묵직한지·한자리에 머무는지 비교해 보세요.',
      example: '영상만 먼저 듣고, 세 보기 중 가장 가까운 쪽을 골라 보세요.'
    },
    음계: {
      hint: '유혹하는 구간의 분위기가 장면과 맞는지, 다른 인물 구간과 나란히 들어 보세요.',
      example: '분위기를 한 단어로 비교한 뒤 보기를 다시 고르세요.'
    },
    음색: {
      hint: '마왕 목소리 굵기가 유혹하는 장면에 어울리는지 들어 보세요.',
      example: '영상만 듣고 목소리 굵기를 떠올려 보세요.'
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
        hint: '「한자리에 머무는 답답한 선율」을 골랐어요. 같은 음 근처에서 맴도는 호소처럼 들렸나 봐요. 해설자 구간을 다시 들으며, 선율이 장면을 차분히 전하는지 귀로만 비교해 보세요.',
        example: '영상만 먼저 듣고, 세 보기 중 가장 가까운 쪽을 골라 보세요.'
      },
      '달콤하고 화려한 선율': {
        hint: '「달콤하고 화려한 선율」을 골랐어요. 꾸며진 유혹처럼 들렸나 봐요. 해설자 구간을 다시 들으며, 선율이 이야기 전달에 맞는지 귀로만 비교해 보세요.',
        example: '영상만 먼저 듣고, 세 보기 중 가장 가까운 쪽을 골라 보세요.'
      }
    },
    음계: {
      장조: {
        hint: '「장조」를 골랐어요. 밝고 경쾌한 기분으로 들렸나 봐요. 해설자가 밤길을 전하는 구간의 분위기가 장면과 맞는지 들어 보세요.',
        example: '분위기를 한 단어로 말한 뒤 보기를 다시 고르세요.'
      }
    },
    음색: {
      얇음: {
        hint: '「얇음」을 골랐어요. 가볍고 여린 목소리로 들렸나 봐요. 해설자 목소리가 이야기를 받쳐 주는지 귀로만 비교해 보세요.',
        example: '영상만 듣고 목소리 굵기를 떠올려 보세요.'
      }
    }
  },
  아버지: {
    선율: {
      '높고 날카로운 선율': {
        hint: '「높고 날카로운 선율」을 골랐어요. 호소하듯 튀는 소리로 들렸나 봐요. 아버지가 아이를 달래는 구간을 다시 들으며, 선율의 높낮이와 움직임이 장면과 맞는지 귀로만 비교해 보세요.',
        example: '영상만 먼저 듣고, 세 보기 중 가장 가까운 쪽을 골라 보세요.'
      },
      '달콤하고 화려한 선율': {
        hint: '「달콤하고 화려한 선율」을 골랐어요. 유혹하듯 꾸며진 소리로 들렸나 봐요. 아버지 구간을 다시 들으며, 선율이 달래는 말에 어울리는지 귀로만 비교해 보세요.',
        example: '다른 인물이 말할 때와 선율이 같은지 다른지 비교해 보세요.'
      }
    },
    음계: {
      단조: {
        hint: '「단조」를 골랐어요. 어둡고 무거운 기분으로 들렸나 봐요. 같은 구간을 다시 들으며, 분위기가 장면과 맞는지 밝기·무게만 비교해 보세요.',
        example: '편해지는 방향인지, 긴장이 남는 방향인지 먼저 느낀 뒤 보기를 다시 고르세요.'
      }
    },
    음색: {
      얇음: {
        hint: '「얇음」을 골랐어요. 가볍고 여린 목소리로 들렸나 봐요. 아버지 목소리가 장면에 어울리는 굵기인지 귀로만 비교해 보세요.',
        example: '영상만 듣고 목소리 굵기를 떠올려 보세요.'
      }
    }
  },
  아들: {
    선율: {
      '낮고 부드러운 선율': {
        hint: '「낮고 부드러운 선율」을 골랐어요. 달래듯 감싸는 소리로 들렸나 봐요. 아이가 호소하는 구간을 다시 들으며, 선율의 움직임이 장면과 맞는지 귀로만 비교해 보세요.',
        example: '영상만 먼저 듣고, 세 보기 중 가장 가까운 쪽을 골라 보세요.'
      },
      '밝고 경쾌하게 뛰어오르는 선율': {
        hint: '「밝고 경쾌하게 뛰어오르는 선율」을 골랐어요. 놀이처럼 도약한다고 들렸나 봐요. 아들 구간을 다시 들으며, 선율이 두려움·호소와 맞는지 귀로만 비교해 보세요.',
        example: '영상만 먼저 듣고, 세 보기 중 가장 가까운 쪽을 골라 보세요.'
      }
    },
    음계: {
      장조: {
        hint: '「장조」를 골랐어요. 밝고 가벼운 기분으로 들렸나 봐요. 두려움·호소가 섞인 구간의 분위기가 장면과 맞는지 들어 보세요.',
        example: '불안이 남는지, 조금 풀리는지 한 단어로 말한 뒤 보기를 다시 고르세요.'
      }
    },
    음색: {
      두꺼움: {
        hint: '「두꺼움」을 골랐어요. 묵직하고 두툼한 목소리로 들렸나 봐요. 아이 목소리가 장면에 어울리는 굵기인지 귀로만 비교해 보세요.',
        example: '영상만 듣고 목소리 굵기를 떠올려 보세요.'
      }
    }
  },
  마왕: {
    선율: {
      '낮고 무거운 선율': {
        hint: '「낮고 무거운 선율」을 골랐어요. 경고처럼 내려가는 소리로 들렸나 봐요. 마왕이 유혹하는 구간을 다시 들으며, 선율이 장면과 맞는지 귀로만 비교해 보세요.',
        example: '영상만 먼저 듣고, 세 보기 중 가장 가까운 쪽을 골라 보세요.'
      },
      '한자리에 머무는 답답한 선율': {
        hint: '「한자리에 머무는 답답한 선율」을 골랐어요. 같은 자리에 갇힌 소리로 들렸나 봐요. 마왕 구간을 다시 들으며, 선율이 유혹하는 말에 어울리는지 귀로만 비교해 보세요.',
        example: '영상만 먼저 듣고, 세 보기 중 가장 가까운 쪽을 골라 보세요.'
      }
    },
    음계: {
      단조: {
        hint: '「단조」를 골랐어요. 어둡고 무거운 기분으로 들렸나 봐요. 유혹하는 구간의 분위기가 장면과 맞는지, 다른 인물 구간과 나란히 들어 보세요.',
        example: '분위기를 한 단어로 비교한 뒤 보기를 다시 고르세요.'
      }
    },
    음색: {
      두꺼움: {
        hint: '「두꺼움」을 골랐어요. 묵직하고 두툼한 목소리로 들렸나 봐요. 마왕 목소리가 유혹하는 장면에 어울리는 굵기인지 귀로만 비교해 보세요.',
        example: '영상만 듣고 목소리 굵기를 떠올려 보세요.'
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
    hint: '「폭풍우」를 골랐어요. 오른손이 넓게 몰아치는 것처럼 들렸나 봐요. 오른손만 다시 들으며, 크게 출렁이는지 짧게 자주 뛰어가는지 리듬의 촘촘함만 비교해 보세요.',
    example: '하늘이 열리는 넓은 소리인지, 짧게 자주 반복되는 소리인지 손으로 박자를 쳐 보며 골라 보세요.'
  },
  파도: {
    hint: '「파도」를 골랐어요. 오른손이 느릿하게 오르내리는 것처럼 들렸나 봐요. 오른손만 다시 들으며, 넓게 출렁이는지 짧게 자주 반복되는지 비교해 보세요.',
    example: '넓게 퍼지는 소리인지, 짧게 자주 반복되는 소리인지 귀로만 비교해 보세요.'
  },
  바람: {
    hint: '「바람」을 골랐어요. 오른손이 스치듯 지나가는 것처럼 들렸나 봐요. 오른손만 다시 들으며, 흩어지듯 스치는지 짧게 자주 뛰어가는지 리듬만 비교해 보세요.',
    example: '스쳐 지나가는 소리인지, 규칙적으로 톡톡 반복되는 소리인지 손으로 박자를 쳐 보세요.'
  }
};

const PIANO_LH_WRONG_HINT = {
  북소리: {
    hint: '「북소리」를 골랐어요. 왼손이 타악기처럼 딱딱 끊긴다고 들렸나 봐요. 왼손만 다시 들으며, 북처럼 표면이 맞부딪히는 소리인지, 낮은 음이 가슴처럼 반복되는지 비교해 보세요.',
    example: '딱딱 끊기는 타점인지, 낮게 규칙적으로 이어지는 박동인지 손바닥으로 박을 맞춰 보세요.'
  },
  '무거운 발걸음': {
    hint: '「무거운 발걸음」을 골랐어요. 왼손이 한 걸음씩 짚는 것처럼 들렸나 봐요. 왼손만 다시 들으며, 천천히 내딛는지, 짧게 반복되는 박동처럼 찍히는지 비교해 보세요.',
    example: '느리게 내딛는 무게인지, 짧게 자주 찍히는 박동인지 손바닥으로 박을 맞춰 보세요.'
  },
  '잔잔한 물결': {
    hint: '「잔잔한 물결」을 골랐어요. 왼손이 부드럽게 흐른다고 들렸나 봐요. 왼손만 다시 들으며, 잔잔히 이어지는지, 짧고 규칙적으로 찍히는지 비교해 보세요.',
    example: '부드럽게 흐르는 느낌인지, 짧고 규칙적으로 찍히는 느낌인지 귀로만 비교해 보세요.'
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
          hint: '오른손만 다시 들으며, 빠르고 촘촘하게 반복되는 리듬이 어떤 움직임을 떠올리게 하는지 비교해 보세요.',
          example: '넓게 출렁이는 느낌인지, 짧게 자주 뛰어가는 느낌인지 손으로 박자를 쳐 보며 골라 보세요.'
        }
      },
      {
        key: 'lh',
        student: lhScene,
        correct: PIANO_LH_SCENE_CORRECT,
        wrongHints: PIANO_LH_WRONG_HINT,
        missNote: (pick) => `네가 고른 「${pick}」은 왼손 반주와 잘 맞지 않아요.`,
        defaultWrongHint: {
          hint: '왼손만 다시 들으며, 낮고 강하게 반복되는 베이스가 어떤 박동·무게감을 주는지 비교해 보세요.',
          example: '부드럽게 흐르는 느낌인지, 짧고 규칙적으로 찍히는 느낌인지 손바닥으로 박을 맞춰 보며 골라 보세요.'
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

export function getSbAtonalMatchFixedFeedback({ tonalCards, atonalCards }) {
  const tonal = tonalCards || [];
  const atonal = atonalCards || [];
  if (!tonal.length || !atonal.length) {
    return '여섯 장의 카드를 모두 칸에 넣은 뒤 피드백 보기를 눌러 주세요.';
  }

  const tonalCorrect = new Set(['조성 음악', '편안하고 안정적', '음들이 서로 잘 어울린다.']);
  const tonalWrong = new Set(['무조성 음악', '낯설고 긴장감', '음들이 따로 논다.']);
  const atonalCorrect = new Set(['무조성 음악', '낯설고 긴장감', '음들이 따로 논다.']);
  const atonalWrong = new Set(['조성 음악', '편안하고 안정적', '음들이 서로 잘 어울린다.']);
  const colTonalOk = sbAtonalColumnOk(tonal, tonalCorrect, tonalWrong);
  const colAtonalOk = sbAtonalColumnOk(atonal, atonalCorrect, atonalWrong);

  if (colTonalOk && colAtonalOk) {
    return verification(
      true,
      '조성곡과 무조성 곡의 안정감·긴장감·음의 어울림이 칸과 잘 맞아요. 두 곡을 번갈아 들으며 차이를 다시 확인해 보세요.'
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
    '건반에서 두 시작음을 함께 누른 뒤, 그 사이를 한 칸씩 세어 보세요. 다시 생각해보세요.',
  '8도':
    '「8도」를 골랐어요. 8도는 같은 음이름의 위·아래처럼 한 옥타브 떨어진 간격이에요.\n' +
    '건반에서 두 시작음의 글자를 보고, 그 사이를 한 칸씩 세어 보세요. 다시 생각해보세요.'
};

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

const HY_TIMBRE_SEGMENT = {
  1: {
    scene:
      '현악 4중주는 네 악기가 서로 다른 음역을 맡아요. 이 클립에서 들리는 선이 높은지·가운데인지·낮은지, 그리고 그 악기가 어떤 역할을 하는지 귀와 선택을 맞춰 보세요.',
    partialOk:
      '악기와 역할 중 하나는 이 구간과 잘 맞았어요. 같은 소리를 다시 들으며, 나머지 선택도 음역과 역할이 서로 맞는지 맞춰 보세요.'
  },
  2: {
    scene:
      '현악 4중주는 네 악기가 서로 다른 음역을 맡아요. 이 클립에서 들리는 선이 높은지·가운데인지·낮은지, 그리고 그 악기가 어떤 역할을 하는지 귀와 선택을 맞춰 보세요.',
    partialOk:
      '악기와 역할 중 하나는 이 구간과 잘 맞았어요. 같은 소리를 다시 들으며, 나머지 선택도 음역과 역할이 서로 맞는지 맞춰 보세요.'
  },
  3: {
    scene:
      '현악 4중주는 네 악기가 서로 다른 음역을 맡아요. 이 클립에서 들리는 선이 높은지·가운데인지·낮은지, 그리고 그 악기가 어떤 역할을 하는지 귀와 선택을 맞춰 보세요.',
    partialOk:
      '악기와 역할 중 하나는 이 구간과 잘 맞았어요. 같은 소리를 다시 들으며, 나머지 선택도 음역과 역할이 서로 맞는지 맞춰 보세요.'
  }
};

const HY_TIMBRE_CORRECT = {
  1: '악기와 역할이 모두 맞아요! 바이올린이 가장 높은 선율(주선율)을 맡아요. 종달새처럼 높고 맑게 떠오르는 선이 어떻게 노래하는지 이어 들어 보세요.',
  2: '악기와 역할이 모두 맞아요! 비올라가 중간 음역(중성부)으로 주선율과 베이스 사이를 채워요. 세 선이 어떻게 겹쳐지는지 비교해 들어 보세요.',
  3: '악기와 역할이 모두 맞아요! 첼로가 가장 낮은 선(베이스)으로 앙상블을 받쳐요. 무게감 있는 받침이 어떻게 깔리는지 끝까지 들어 보세요.'
};

function buildHyTimbreWrongBody({ picked, rolePick, instrOk, roleOk, segmentIdx }) {
  const seg = HY_TIMBRE_SEGMENT[segmentIdx] || {};
  const instrRange = HY_TIMBRE_RANGE[picked];
  const roleRange = HY_TIMBRE_RANGE[rolePick];
  const instrLabel = HY_TIMBRE_RANGE_LABEL[picked] || '그 음역';
  const roleLabel = HY_TIMBRE_RANGE_LABEL[rolePick] || '그 역할';
  const lines = [];
  if (seg.scene) lines.push(seg.scene);

  if (!instrOk && !roleOk) {
    if (instrRange && roleRange && instrRange === roleRange) {
      lines.push(
        `「${picked}」·「${rolePick}」를 골랐어요. 둘 다 ${instrLabel}이에요.`,
        '악기 이름과 역할이 같은 음역을 가리키고 있어요. 이 구간에서 높은 선·가운데 선·낮은 선 중 어디에 해당하는지 한 가지로 맞춰 들어 보세요.',
        HY_TIMBRE_LISTEN_HINT[instrRange],
        '다시 들어보세요.'
      );
    } else {
      lines.push(
        `「${picked}」·「${rolePick}」를 골랐어요. ${picked}${koreanEunNeun(picked)} ${instrLabel}, ${rolePick}${koreanEunNeun(rolePick)} ${roleLabel}이에요.`,
        '악기와 역할이 서로 다른 음역을 가리키고 있어요. 이 구간이 높은지·가운데인지·낮은지 한 가지로 맞춰 들어 보세요.',
        HY_TIMBRE_LISTEN_HINT[instrRange] || HY_TIMBRE_LISTEN_HINT[roleRange] || '음높이만 다시 들어 보세요.',
        '다시 들어보세요.'
      );
    }
    return lines.join('\n');
  }

  if (!instrOk) {
    if (roleOk && seg.partialOk) lines.push(seg.partialOk);
    lines.push(
      `「${picked}」를 골랐어요. ${picked}${koreanEunNeun(picked)} ${instrLabel}이에요.`,
      '이 구간의 소리와 네가 고른 악기의 음역이 같은지, 역할과도 맞는지 함께 비교해 들어 보세요.',
      HY_TIMBRE_LISTEN_HINT[instrRange] || '음높이만 다시 들어 보세요.',
      '다시 들어보세요.'
    );
    return lines.join('\n');
  }

  if (seg.partialOk) lines.push(seg.partialOk);
  lines.push(
    `「${rolePick}」를 골랐어요. ${rolePick}${koreanEunNeun(rolePick)} ${roleLabel}이에요.`,
    HY_TIMBRE_LISTEN_HINT[roleRange] || '이 구간이 높은지 낮은지 역할을 다시 들어 보세요.',
    '다시 들어보세요.'
  );
  return lines.join('\n');
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
  const mark = instrOk || roleOk ? '△' : '✗';
  return verificationWithMark(mark, buildHyTimbreWrongBody({ picked, rolePick, instrOk, roleOk, segmentIdx }));
}

