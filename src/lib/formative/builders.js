import { buildMultiFieldSectionsPayload } from './buildMultiField';
import { buildSingleChoiceFeedback } from './buildSingleChoice';
import {
  CP_FORM_CARDS,
  CP_FORM_CORRECT,
  CP_FORM_FEATURE_WRONG_HINT,
  CP_FORM_FIELD_META,
  CP_FORM_LABEL_WRONG_HINT,
  CP_FORM_SEGMENT_CORRECT_BODY
} from './content/cpForm';
import {
  CP_RHYTHM_CORRECT_BODY,
  CP_RHYTHM_DEFAULT_WRONG,
  CP_RHYTHM_IDS,
  CP_RHYTHM_META,
  CP_RHYTHM_WRONG_HINTS
} from './content/cpRhythm';
import { FOOTER } from './templates';

// --- 쇼팽 ABA ---

export function buildCpFormSegmentPayload({ cardId, label, feature }) {
  const correct = CP_FORM_CORRECT[cardId] || { label: '', feature: '' };
  return buildMultiFieldSectionsPayload({
    itemId: cardId,
    preflightMessage: '구간 이름(A·B·A\u2019)과 특징을 모두 고른 뒤 피드백 보기를 눌러 주세요.',
    fields: [
      {
        key: 'label',
        student: label,
        correct: correct.label,
        wrongHints: CP_FORM_LABEL_WRONG_HINT,
        defaultWrongHint: {
          hint: '앞·뒤 구간과 비교해, 이 구간이 처음과 비슷한지·가운데처럼 다른지·다시 돌아오는 느낌인지 들어 보세요.',
          example: '빠르기·셈여림이 비슷한 구간끼리 같은 이름, 확 달라지면 다른 이름을 떠올려 보세요.'
        },
        missNote: (pick) => `네가 고른 「${pick}」은 이 구간의 형식 위치와 잘 맞지 않아요.`
      },
      {
        key: 'feature',
        student: feature,
        correct: correct.feature,
        wrongHints: CP_FORM_FEATURE_WRONG_HINT,
        defaultWrongHint: {
          hint: '같은 구간을 다시 들으며 빠르기(템포)와 셈여림(소리의 세기)만 귀로 비교해 보세요.',
          example: '빠른지·느린지, 강하게 밀어붙이는지·부드럽게 감싸는지 한 문장으로 말한 뒤 보기를 다시 고르세요.'
        },
        missNote: (pick) => `네가 고른 「${pick}」은 이 구간의 소리 특징과 잘 맞지 않아요.`
      }
    ],
    fieldMeta: CP_FORM_FIELD_META,
    correctSummary: '구간 이름과 특징이 모두 맞아요.',
    correctFooter: CP_FORM_SEGMENT_CORRECT_BODY[cardId] || '형식·빠르기·셈여림이 어떻게 맞물리는지 다시 들어 보세요.',
    wrongFooter: FOOTER.noAnswerRevealFields
  });
}

export function buildCpFormActivityPayloads({ formAnswers, featureById }) {
  return CP_FORM_CARDS.map((card) =>
    buildCpFormSegmentPayload({
      cardId: card.id,
      label: formAnswers?.[card.id],
      feature: featureById?.[card.id]
    })
  );
}

// --- 쇼팽 폴리리듬 ---

export function buildCpRhythmItemPayload({ groupId, userChoice }) {
  const meta = CP_RHYTHM_META[groupId];
  if (!meta) return '먼저 보기 중 하나를 고른 뒤 피드백 보기를 눌러 주세요.';

  return buildSingleChoiceFeedback({
    userChoice,
    correctAnswer: meta.correct,
    correctBody: CP_RHYTHM_CORRECT_BODY[groupId],
    wrongHints: CP_RHYTHM_WRONG_HINTS[groupId],
    formatWrong: (pick) => {
      const hint = CP_RHYTHM_WRONG_HINTS[groupId]?.[pick];
      if (hint) return hint;
      return CP_RHYTHM_DEFAULT_WRONG[groupId];
    }
  });
}

export function buildCpRhythmActivityPayloads({ selectedByGroup }) {
  return CP_RHYTHM_IDS.map((groupId) =>
    buildCpRhythmItemPayload({
      groupId,
      userChoice: selectedByGroup?.[groupId]
    })
  );
}
