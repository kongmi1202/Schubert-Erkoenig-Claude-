import {
  buildCpFormActivityPayloads,
  buildCpRhythmActivityPayloads
} from './builders';
import { CP_RHYTHM_IDS, CP_RHYTHM_META } from './content/cpRhythm';
import { labeledStage2Item } from './labeledItem';
import { mawangVoiceActivityLabel } from '../voiceDesignAnswers';
import {
  getHyThemeMatchFixedFeedback,
  getHyThemePart3FixedFeedback,
  getHyTimbreFixedFeedback,
  getPianoSceneFixedFeedback,
  getSbSprechFixedFeedback,
  getSbAtonalMatchFixedFeedback,
  getTonePaintingFixedFeedback,
  getVoiceDesignFixedFeedback,
  getVvConcertoFixedFeedback,
  getVvSonnetFixedFeedback
} from '../fixedFormativeFeedback';

/**
 * 2단계 형성 피드백 활동 레지스트리
 * @type {Record<string, { title: string, buildPayloads: (ctx: object) => Array, studentSummary?: (ctx: object) => string }>}
 */
export const STAGE2_ACTIVITIES = {
  'cp-form': {
    title: '쇼팽 — ABA 형식',
    buildPayloads: (ctx) => buildCpFormActivityPayloads(ctx),
    studentSummary: ({ formAnswers, featureById }) =>
      ['cp-f1', 'cp-f2', 'cp-f3']
        .map((id, i) => `구간${i + 1}: ${formAnswers?.[id] || '—'} / ${featureById?.[id] || '—'}`)
        .join(' · ')
  },
  'cp-rhythm': {
    title: '쇼팽 — 폴리리듬',
    buildPayloads: (ctx) => {
      const payloads = buildCpRhythmActivityPayloads(ctx);
      return CP_RHYTHM_IDS.map((groupId, index) =>
        labeledStage2Item(CP_RHYTHM_META[groupId].label, payloads[index])
      );
    },
    studentSummary: ({ selectedByGroup }) =>
      ['cp-rh-q', 'cp-lh-q', 'cp-poly-q']
        .map((id) => `${id}: ${selectedByGroup?.[id] || '—'}`)
        .join(' / ')
  },
  'voice-design': {
    title: '마왕 — 등장인물 음색 설계',
    buildPayloads: ({ names, voiceDesign, answerKey }) => {
      const list = (names || []).filter(Boolean);
      if (!list.length) {
        return ['인물을 골라 선율·음계·음색을 모두 고른 뒤 피드백 보기를 눌러 주세요.'];
      }
      return list.map((name) =>
        labeledStage2Item(
          mawangVoiceActivityLabel(name),
          getVoiceDesignFixedFeedback([name], voiceDesign, answerKey)
        )
      );
    },
    studentSummary: ({ names, voiceDesign }) =>
      (names || [])
        .map((name) => `${name}: ${JSON.stringify(voiceDesign?.[name] || {})}`)
        .join(' / ')
  },
  'piano-scene': {
    title: '마왕 — 피아노 반주 장면',
    buildPayloads: (ctx) => [getPianoSceneFixedFeedback(ctx)],
    studentSummary: ({ rhScene, lhScene }) => `오른손: ${rhScene || '—'} / 왼손: ${lhScene || '—'}`
  },
  'hy-timbre': {
    title: '하이든 — 현악 4중주 음색',
    buildPayloads: ({ segments, selectedByGrid, roleByGrid }) =>
      (segments || []).map((segment) =>
        labeledStage2Item(
          `구간 ${segment.idx}`,
          getHyTimbreFixedFeedback({
            picked: selectedByGrid?.[segment.gridId],
            rolePick: roleByGrid?.[segment.gridId],
            answer: segment.answer,
            roleAnswer: segment.roleAnswer,
            segmentIdx: segment.idx
          })
        )
      ),
    studentSummary: ({ segments, selectedByGrid, roleByGrid }) =>
      (segments || [])
        .map((s) => `구간${s.idx}: ${selectedByGrid?.[s.gridId] || '—'} / ${roleByGrid?.[s.gridId] || '—'}`)
        .join(' · ')
  },
  'hy-theme': {
    title: '하이든 — 소나타 주제',
    buildPayloads: ({ placedOptions, selectedDeg }) => [
      labeledStage2Item(
        '4-1. 제1·제2주제 매칭',
        getHyThemeMatchFixedFeedback({
          theme1Ids: placedOptions?.theme1,
          theme2Ids: placedOptions?.theme2
        })
      ),
      labeledStage2Item('4-2. 조성(도수)', getHyThemePart3FixedFeedback({ selectedDeg }))
    ],
    studentSummary: ({ placedOptions, selectedDeg }) =>
      `제1주제: ${placedOptions?.theme1?.join(', ') || '—'} / 제2주제: ${placedOptions?.theme2?.join(', ') || '—'} / 도수: ${selectedDeg || '—'}`
  },
  'tone-painting': {
    title: '할렐루야 — 음화법',
    buildPayloads: ({ segments, selected }) =>
      (segments || []).map((segment) =>
        labeledStage2Item(
          segment.title,
          getTonePaintingFixedFeedback({
            segmentId: segment.id,
            segmentTitle: segment.title,
            selectedIndex: selected?.[segment.id],
            selectedLabel: segment.options?.[selected?.[segment.id]],
            correctIndex: segment.answer,
            correctElaboration: segment.feedback
          })
        )
      ),
    studentSummary: ({ segments, selected }) =>
      (segments || []).map((s) => `${s.title}: ${s.options?.[selected?.[s.id]] || '—'}`).join(' / ')
  },
  'vv-sonnet': {
    title: '비발디 — 소네트',
    buildPayloads: ({ items }) =>
      (items || []).map((item, index) =>
        labeledStage2Item(
          `2-${index + 1}.`,
          getVvSonnetFixedFeedback({
            userChoice: item.userChoice,
            correctAnswer: item.correctAnswer,
            correctElaboration: item.correctElaboration,
            segmentId: item.segmentId
          })
        )
      ),
    studentSummary: ({ items }) =>
      (items || []).map((item) => `${item.segmentId}: ${item.userChoice || '—'}`).join(' / ')
  },
  'vv-concerto': {
    title: '비발디 — 바이올린 협주곡',
    buildPayloads: (ctx) => [getVvConcertoFixedFeedback(ctx)],
    studentSummary: ({ userChoice }) => `선택: ${userChoice || '—'}`
  },
  'sb-sprech': {
    title: '쇤베르크 — 말하기와 노래하기',
    buildPayloads: ({ normal, sprech }) => [
      labeledStage2Item('송어(일반 성악)', getSbSprechFixedFeedback({ kind: 'normal', ...normal })),
      labeledStage2Item('피에로(슈프레흐슈팀메)', getSbSprechFixedFeedback({ kind: 'sprech', ...sprech }))
    ],
    studentSummary: ({ normal, sprech }) =>
      `송어: ${normal?.toneText || '—'} / 피에로: ${sprech?.toneText || '—'}`
  },
  'sb-atonal': {
    title: '쇤베르크 — 조성 vs 무조성',
    buildPayloads: ({ tonalCards, atonalCards }) => [
      labeledStage2Item('4. 카드 매칭', getSbAtonalMatchFixedFeedback({ tonalCards, atonalCards }))
    ],
    studentSummary: ({ tonalCards, atonalCards }) =>
      `송어: ${(tonalCards || []).join(', ') || '—'} / 피에로: ${(atonalCards || []).join(', ') || '—'}`
  }
};

/**
 * @param {string} activityId
 * @param {object} context
 */
export function buildStage2ActivityRequest(activityId, context) {
  const activity = STAGE2_ACTIVITIES[activityId];
  if (!activity) {
    throw new Error(`Unknown stage-2 activity: ${activityId}`);
  }
  return {
    fixedPayloads: activity.buildPayloads(context),
    activityTitle: activity.title,
    studentSummary: activity.studentSummary ? activity.studentSummary(context) : ''
  };
}
