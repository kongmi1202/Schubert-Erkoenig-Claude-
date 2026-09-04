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
          hint:
            '앞·뒤 구간과 번갈아 들으며, 이 구간의 빠르기·셈여림이 처음과 비슷한 에너지인지, 가운데처럼 분위기가 확 바뀌는지, 다시 처음과 닮아 돌아오는지 귀로만 비교해 보세요. 이름보다 소리의 닮음·다름을 먼저 말해 보는 게 좋아요.',
          example:
            '「처음과 비슷함 / 가운데처럼 대비됨 / 다시 닮아 돌아옴」 중 어디에 가까운지 한 문장으로 말한 뒤 이름을 다시 골라 보세요.'
        },
        missNote: (pick) => `네가 고른 「${pick}」은 이 구간의 형식 위치와 잘 맞지 않아요.`
      },
      {
        key: 'feature',
        student: feature,
        correct: correct.feature,
        wrongHints: CP_FORM_FEATURE_WRONG_HINT,
        defaultWrongHint: {
          hint:
            '같은 구간을 다시 들으며 빠르기(템포)와 셈여림(소리의 세기)을 따로 짚어 보세요. 박이 급하게 몰아치는지·숨이 느려지듯 여유로운지, 소리가 세게 밀어붙이는지·여리게 감싸는지 손바닥으로 박을 맞춰 가며 비교해 보세요. 구간 2·3이라면 구간 1과 번갈아 들어, 에너지가 비슷한지 분위기가 확 달라지는지도 살펴보세요.',
          example:
            '「박의 느낌」과 「소리의 세기」를 각각 한 단어로 말한 뒤, 구간 1과 비슷한지·대비되는지도 한 문장으로 정리해 보기를 다시 고르세요.'
        },
        missNote: (pick) =>
          `네가 고른 「${pick}」은 이 구간의 빠르기·셈여림 느낌과 잘 맞지 않아요.`
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
  return [
    buildMultiFieldSectionsPayload({
      itemId: 'cp-rhythm',
      preflightMessage: '오른손·왼손·양손 겹침을 모두 고른 뒤 피드백 보기를 눌러 주세요.',
      fields: CP_RHYTHM_IDS.map((groupId) => ({
        key: groupId,
        student: selectedByGroup?.[groupId],
        correct: CP_RHYTHM_META[groupId].correct,
        wrongHints: CP_RHYTHM_WRONG_HINTS[groupId],
        defaultWrongHint: CP_RHYTHM_DEFAULT_WRONG[groupId],
        missNote: (pick) =>
          `네가 고른 「${pick}」은 「${CP_RHYTHM_META[groupId].label}」과 잘 맞지 않아요.`
      })),
      fieldMeta: Object.fromEntries(
        CP_RHYTHM_IDS.map((groupId) => [
          groupId,
          {
            label: CP_RHYTHM_META[groupId].label,
            focus: CP_RHYTHM_META[groupId].focus,
            tone: CP_RHYTHM_META[groupId].tone
          }
        ])
      ),
      correctSummary: '오른손·왼손·양손 겹침이 모두 맞아요.',
      correctFooter:
        '서로 다른 리듬꼴이 동시에 겹치는 폴리리듬을, 격자표와 함께 한 번 더 들어 보세요.',
      wrongFooter: FOOTER.noAnswerReveal
    })
  ];
}
