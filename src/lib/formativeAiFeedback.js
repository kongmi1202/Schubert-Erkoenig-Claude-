import { getApiKeySetupMessage, requestOpenAiText } from './openaiClient';
import { evaluateAestheticQ2 } from './aestheticQ2Grading';
import {
  getCpFormSegmentFixedFeedback,
  getCpRhythmFixedFeedback,
  getHyThemeMatchFixedFeedback,
  getHyThemePart3FixedFeedback,
  getHyTimbreFixedFeedback,
  getPianoSceneFixedFeedback,
  getSbSprechFixedFeedback,
  getTonePaintingFixedFeedback,
  getVoiceDesignFixedFeedback,
  getVvConcertoFixedFeedback,
  getVvSonnetFixedFeedback
} from './fixedFormativeFeedback';
import { buildStage2ActivityRequest } from './formative/stage2Activities';

const MSG_NO_KEY = getApiKeySetupMessage();

const STAGE2_RULES_KO = `[피드백 설계 원칙 — Kulhavy & Stock(1989)]
· 검증: ✓ / △ / ✗ (코드가 정함, 바꾸지 말 것)
· 설명: [내부 가이드] 내용만 옮겨 자연스럽게 이어 붙이기. 가이드에 없는 문장·추론·정답·정답 보기 문구 추가 금지
· 말투: 반말·해요체, 「네가 고른」 등 가이드와 같은 톤. 「학생이」「~습니다」「~할 수 있습니다」 금지
· 항목 제목(선율:, 음계: 등) 나열 금지 — 한 덩어리 서술
· 정답·맞은 보기·맞은 항목 이름·값을 직접 말하지 말 것 (맞은 항목은 개수만)
· 검증 △·✗이고 틀린 항목이 여러 개면 가이드에 있는 것만 모두 다룰 것`;

const STAGE3_RULES_KO = `[피드백 설계 원칙 — Sadler]
· 상단 검증 줄 없음
· 2. [가치 평가] → 목표 수준 / 현재 나의 수준 / 설명
· △·✗만 맨 끝에 「다시 시도해 보세요!」`;

const AESTHETIC_GOAL_BY_TYPE = {
  음색: '등장인물의 음색이 곡 안에서 어떻게 드러나는지 근거를 들어, 그것이 이 곡을 왜 특별하게 만드는지 평가할 수 있어요.',
  반주: '피아노 반주가 장면·분위기와 어떻게 맞물리는지 근거를 들어, 그것이 이 곡을 왜 특별하게 만드는지 평가할 수 있어요.',
  맥락: '사회·역사적 맥락과 이 곡의 음악적 특징을 연결해, 곡의 가치를 말할 수 있어요.',
  음화법: '음화법(음색·선율)이 가사·장면과 어떻게 맞물리는지 근거를 들어, 곡의 가치를 평가할 수 있어요.',
  화성다성음악: '화성·다성음악(소리의 어울림)이 이 곡에서 어떻게 드러나는지 근거를 들어, 곡의 가치를 평가할 수 있어요.',
  현악음색: '현악 4중주의 음색·역할이 곡 안에서 어떻게 들리는지 근거를 들어, 곡의 가치를 평가할 수 있어요.',
  주제비교: '제1·제2주제의 대비가 곡을 어떻게 만들어 가는지 근거를 들어, 가치를 평가할 수 있어요.',
  슈프레흐슈팀메: '슈프레흐슈팀메가 이 곡의 분위기·표현과 어떻게 맞물리는지 근거를 들어, 가치를 평가할 수 있어요.',
  무조성: '무조성이 이 곡의 소리·분위기와 어떻게 연결되는지 근거를 들어, 가치를 평가할 수 있어요.',
  소네트: '소네트(표제음악)와 음악 묘사가 어떻게 맞물리는지 근거를 들어, 곡의 가치를 평가할 수 있어요.',
  바이올린협주곡: '협주곡의 독주·총주·형식이 곡을 어떻게 만드는지 근거를 들어, 곡의 가치를 평가할 수 있어요.',
  ABA형식: 'ABA 형식에서 앞·가운데·뒤의 대비가 곡을 어떻게 만드는지 근거를 들어, 가치를 평가할 수 있어요.',
  폴리리듬: '폴리리듬(양손 리듬 겹침)이 분위기·긴장감과 어떻게 맞물리는지 근거를 들어, 가치를 평가할 수 있어요.'
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function msgApiFailed(status) {
  if (status === 429) {
    return `──\nOpenAI 요청 한도(HTTP 429)에 걸렸어요. 잠시 후 「피드백 보기」를 다시 눌러 보세요.`;
  }
  return `──\nOpenAI 요청이 실패했습니다${status ? ` (HTTP ${status})` : ''}. API 키·크레딧을 확인해 보세요.`;
}

async function requestFormativeText(prompt, fallbackBody) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const text = await requestOpenAiText({ model: 'gpt-4o-mini', input: prompt });
      const trimmed = text?.trim();
      if (trimmed) return trimmed;
      return fallbackBody;
    } catch (err) {
      if (err?.noKey) return `${fallbackBody}\n\n${MSG_NO_KEY}`;
      const retryable = err?.status === 429 || err?.status === 503;
      if (retryable && attempt < 3) {
        await sleep(Math.min(2500 * 2 ** attempt, 20_000));
        continue;
      }
      if (attempt < 3 && !err?.status) {
        await sleep(1500 * (attempt + 1));
        continue;
      }
      return `${fallbackBody}\n\n${msgApiFailed(err?.status)}`;
    }
  }
  return `${fallbackBody}\n\n${msgApiFailed(429)}`;
}

export function buildVoiceSectionsExplanation(payload, mark) {
  const lines = [];
  if (payload.summary) lines.push(payload.summary);
  if (mark === '✓' && payload.footer) {
    lines.push('');
    lines.push(payload.footer);
  }
  (payload.sections || []).filter((s) => s.status === 'miss').forEach((section) => {
    lines.push('');
    lines.push(section.note);
    if (section.hint) lines.push(section.hint);
    if (section.example) lines.push(section.example);
  });
  const combined = lines.join('\n').trim();
  if ((mark === '△' || mark === '✗') && !/다시 (들어|생각)/.test(combined)) {
    return `${combined}\n다시 들어보세요.`;
  }
  return combined;
}

function buildVoiceSectionsGptGuide(payload, mark) {
  const lines = [];
  if (payload.summary) lines.push(payload.summary);
  const okSections = (payload.sections || []).filter((s) => s.status === 'ok');
  const missSections = (payload.sections || []).filter((s) => s.status === 'miss');
  if (okSections.length) {
    lines.push(`맞은 항목 수: ${okSections.length} (어떤 항목인지·정답 값은 학생에게 말하지 말 것)`);
  }
  missSections.forEach((section) => {
    lines.push('');
    lines.push(`다시 볼 항목 — ${section.label}`);
    lines.push(`학생 선택: ${section.studentPick}`);
    lines.push(`짚을 내용: ${section.note}`);
    if (section.hint) lines.push(`듣기 힌트: ${section.hint}`);
    if (section.example) lines.push(`예시 방향: ${section.example}`);
  });
  if ((mark === '△' || mark === '✗') && payload.footer) {
    const footerCore = String(payload.footer).replace(/다시 (들어|생각).*$/m, '').trim();
    if (footerCore) lines.push(footerCore);
  }
  return lines.join('\n').trim();
}

export function verificationMarkFromFixed(payload) {
  if (typeof payload === 'string') {
    if (/검증\s*[:：]\s*△/.test(payload)) return '△';
    if (/검증\s*[:：]\s*✓/.test(payload)) return '✓';
    if (/검증\s*[:：]\s*✗/.test(payload)) return '✗';
    return null;
  }
  if (payload?.kind === 'voice-sections') {
    if (/△/.test(payload.verification || '')) return '△';
    if (payload.isCorrect) return '✓';
    const okCount = (payload.sections || []).filter((s) => s.status === 'ok').length;
    const total = (payload.sections || []).length;
    if (okCount > 0 && okCount < total) return '△';
    return '✗';
  }
  return '✗';
}

function extractExplanationBody(guide) {
  let body = String(guide || '').trim();
  body = body.replace(/^검증\s*[:：]\s*[✓△✗]\s*\n?/, '');
  body = body.replace(/^설명\s*[:：]\s*/, '');
  return body.trim();
}

export function formatStage2Display(mark, body) {
  return `검증: ${mark}\n설명: ${extractExplanationBody(body)}`;
}

function normalizeStage2AiOutput(raw, mark, fallbackGuide) {
  const text = String(raw || '').trim();
  const fallback = formatStage2Display(mark, extractExplanationBody(fallbackGuide));
  if (!text) return fallback;
  const lines = text.split(/\r?\n/);
  let bodyLines = /검증\s*[:：]\s*[✓△✗]/.test((lines[0] || '').trim()) ? lines.slice(1) : lines;
  const body = bodyLines.join('\n').replace(/^설명\s*[:：]\s*/, '').trim();
  return body ? formatStage2Display(mark, body) : fallback;
}

function isPreflightFeedbackMessage(text) {
  const t = String(text || '').trim();
  if (!t || /검증\s*[:：]\s*[✓△✗]/.test(t)) return !t;
  return /먼저|적은 뒤|고른 뒤|넣은 뒤|움직여|선택해|채워|입력/.test(t);
}

function buildDisplayGuide(fixedPayload, mark) {
  if (fixedPayload?.kind === 'voice-sections') return buildVoiceSectionsExplanation(fixedPayload, mark);
  return extractExplanationBody(typeof fixedPayload === 'string' ? fixedPayload : fixedPayload?.text || '');
}

function buildGptInternalGuide(fixedPayload, mark) {
  if (fixedPayload?.kind === 'voice-sections') return buildVoiceSectionsGptGuide(fixedPayload, mark);
  return buildDisplayGuide(fixedPayload, mark);
}

function stage2ExplanationLooksUnsafe(mark, body, displayGuide) {
  const text = String(body || '').trim();
  if (!text) return true;
  if (/학생이|습니다|할 수 있습니다|적합할 수|부적합|판단되어/.test(text)) return true;
  if (/^(선율|음계|음색|구간|오른손|왼손)\s*[:：]/m.test(text)) return true;
  if (mark === '✓') return false;
  const guide = String(displayGuide || '');
  const guideLen = guide.replace(/\s+/g, '').length;
  const textLen = text.replace(/\s+/g, '').length;
  if (guideLen > 0 && textLen > guideLen * 1.35) return true;
  return false;
}

function combineMarkFromPayloads(payloads) {
  const marks = (payloads || []).map((p) => verificationMarkFromFixed(p) || '✗');
  if (!marks.length) return '✗';
  if (marks.every((m) => m === '✓')) return '✓';
  if (marks.every((m) => m === '✗')) return '✗';
  return '△';
}

function labelForCombinedPayload(payload) {
  if (payload?.kind !== 'voice-sections') return '';
  const id = payload.character;
  if (!id || id === 'piano-scene') return '';
  if (/^cp-f\d$/.test(id)) {
    const nums = { 'cp-f1': '1', 'cp-f2': '2', 'cp-f3': '3' };
    return `구간 ${nums[id] || id}`;
  }
  return `「${id}」`;
}

function buildCombinedDisplayGuide(payloads) {
  return (payloads || [])
    .map((p) => {
      const mark = verificationMarkFromFixed(p) || '✗';
      const body = buildDisplayGuide(p, mark);
      if (!body) return '';
      const label = labelForCombinedPayload(p);
      return label ? `${label}\n${body}` : body;
    })
    .filter(Boolean)
    .join('\n\n');
}

function buildCombinedGptGuide(payloads) {
  return (payloads || [])
    .map((p) => {
      const mark = verificationMarkFromFixed(p) || '✗';
      const body = buildGptInternalGuide(p, mark);
      if (!body) return '';
      const label = labelForCombinedPayload(p);
      return label ? `[${label}]\n${body}` : body;
    })
    .filter(Boolean)
    .join('\n\n');
}

async function generateFormativeFromGuides({
  mark,
  displayGuide,
  gptGuide,
  activityTitle = '',
  studentSummary = ''
}) {
  if (!displayGuide && !gptGuide) return '피드백을 준비하지 못했어요.';
  if (isPreflightFeedbackMessage(displayGuide || gptGuide)) return displayGuide || gptGuide;

  // 2단계: 고정 가이드만 표시 (검증·힌트는 코드에서 결정, GPT 재구성 생략)
  return formatStage2Display(mark, displayGuide);
}

async function generateFormativeFromFixedGuide({
  fixedPayload,
  activityTitle = '',
  studentSummary = ''
}) {
  const mark = verificationMarkFromFixed(fixedPayload) || '✗';
  const displayGuide = buildDisplayGuide(fixedPayload, mark);
  const gptGuide = buildGptInternalGuide(fixedPayload, mark);
  return generateFormativeFromGuides({
    mark,
    displayGuide,
    gptGuide,
    activityTitle,
    studentSummary
  });
}

export async function generateCombinedFormativeAi({
  fixedPayloads,
  activityTitle = '',
  studentSummary = ''
}) {
  const items = (fixedPayloads || []).filter(Boolean);
  const preflight = items.find(
    (p) =>
      (typeof p === 'string' && isPreflightFeedbackMessage(p)) ||
      (p?.kind === 'plain' && isPreflightFeedbackMessage(p.text))
  );
  if (preflight) return typeof preflight === 'string' ? preflight : preflight.text;
  if (!items.length) return '먼저 모든 문항을 완료한 뒤 피드백 보기를 눌러 주세요.';

  const mark = combineMarkFromPayloads(items);
  const displayGuide = buildCombinedDisplayGuide(items);
  const gptGuide = buildCombinedGptGuide(items);
  return generateFormativeFromGuides({
    mark,
    displayGuide,
    gptGuide,
    activityTitle,
    studentSummary
  });
}

/** 2단계 활동 ID 기반 형성 피드백 (고정 문구, 유형별 검증·정교화) */
export async function generateStage2ActivityFeedback(activityId, context) {
  const req = buildStage2ActivityRequest(activityId, context);
  return generateCombinedFormativeAi(req);
}

function formatAestheticFallback({ goal, mark, guide }) {
  const retry = mark === '✓' ? '' : '\n\n다시 시도해 보세요!';
  return `2. [가치 평가]\n\n🎯 목표 수준:\n${goal}\n\n📍 현재 나의 수준: ${mark}\n\n📝 설명:\n${guide}${retry}`;
}

function normalizeAestheticAiOutput(raw, mark, goal, guide) {
  const fallback = formatAestheticFallback({ goal, mark, guide });
  const text = String(raw || '').trim();
  if (!text || !/2\.\s*\[가치 평가\]/.test(text)) return fallback;
  return text.replace(/(📍\s*현재 나의 수준\s*[:：]\s*)[✓△✗]/, `$1${mark}`);
}

export async function generateVoiceDesignFormativeAi(selectedChars, voiceDesign, answerKey) {
  return generateStage2ActivityFeedback('voice-design', {
    names: selectedChars,
    voiceDesign,
    answerKey
  });
}

export async function generatePianoSceneFormativeAi(params) {
  return generateStage2ActivityFeedback('piano-scene', params);
}

export async function generateTonePaintingFormativeAi(params) {
  return generateFormativeFromFixedGuide({
    fixedPayload: getTonePaintingFixedFeedback(params),
    activityTitle: `할렐루야 — 음화법 ${params.segmentTitle || ''}`,
    studentSummary: `선택: ${params.selectedLabel || '—'}`
  });
}

export async function generateHyTimbreFormativeAi(params) {
  return generateFormativeFromFixedGuide({
    fixedPayload: getHyTimbreFixedFeedback(params),
    activityTitle: `하이든 — 악기·역할 (구간 ${params.segmentIdx || ''})`,
    studentSummary: `악기: ${params.picked || '—'} / 역할: ${params.rolePick || '—'}`
  });
}

export async function generateHyThemeMatchFormativeAi(params) {
  return generateFormativeFromFixedGuide({
    fixedPayload: getHyThemeMatchFixedFeedback(params),
    activityTitle: '하이든 — 제1·제2주제 매칭',
    studentSummary: `제1: ${(params.theme1Ids || []).join(', ')} / 제2: ${(params.theme2Ids || []).join(', ')}`
  });
}

export async function generateHyThemePart3FormativeAi(params) {
  return generateFormativeFromFixedGuide({
    fixedPayload: getHyThemePart3FixedFeedback(params),
    activityTitle: '하이든 — 두 주제 조성(도수)',
    studentSummary: `선택: ${params.selectedDeg || '—'}`
  });
}

export async function generateVvSonnetFormativeAi(params) {
  return generateFormativeFromFixedGuide({
    fixedPayload: getVvSonnetFixedFeedback(params),
    activityTitle: '비발디 — 소네트(표제음악)',
    studentSummary: `선택: ${params.userChoice || '—'}`
  });
}

export async function generateVvConcertoFormativeAi(params) {
  return generateStage2ActivityFeedback('vv-concerto', params);
}

export async function generateCpFormSegmentFormativeAi(params) {
  return generateFormativeFromFixedGuide({
    fixedPayload: getCpFormSegmentFixedFeedback(params),
    activityTitle: `쇼팽 — ABA 형식 (${params.cardId || ''})`,
    studentSummary: `${params.label || '—'} / ${params.feature || '—'}`
  });
}

export async function generateCpRhythmFormativeAi(params) {
  return generateFormativeFromFixedGuide({
    fixedPayload: getCpRhythmFixedFeedback(params),
    activityTitle: '쇼팽 — 폴리리듬',
    studentSummary: `선택: ${params.userChoice || '—'}`
  });
}

export async function generateSbSprechFormativeAi(params) {
  const title = params.kind === 'normal' ? '송어(일반 성악)' : '피에로(슈프레흐슈팀메)';
  return generateFormativeFromFixedGuide({
    fixedPayload: getSbSprechFixedFeedback(params),
    activityTitle: `쇤베르크 — ${title}`,
    studentSummary: `슬라이더: ${params.toneText || '—'}`
  });
}

function sbAtonalColumnOk(cards, correctSet, wrongSet) {
  if (!Array.isArray(cards) || cards.length === 0) return false;
  const hasCorrect = cards.some((c) => correctSet.has(c));
  const hasWrong = cards.some((c) => wrongSet.has(c));
  return hasCorrect && !hasWrong;
}

function buildSbAtonalFixedGuide({ tonalCards, atonalCards }) {
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
    return '검증: ✓\n조성곡과 무조성 곡의 안정감·긴장감·음의 어울림이 칸과 잘 맞아요. 두 곡을 번갈아 들으며 차이를 다시 확인해 보세요.';
  }

  const wrongTonal = tonal.filter((card) => tonalWrong.has(card));
  const wrongAtonal = atonal.filter((card) => atonalWrong.has(card));
  const parts = [];

  wrongTonal.forEach((card) => {
    if (card === '무조성 음악') {
      parts.push('송어 칸의 「무조성 음악」을 다시 들어 보세요. 조성감만 비교해 보세요.');
    } else if (card === '낯설고 긴장감') {
      parts.push('송어 칸의 「낯설고 긴장감」을 다시 들어 보세요. 분위기만 비교해 보세요.');
    } else if (card === '음들이 따로 논다.') {
      parts.push('송어 칸의 「음들이 따로 논다.」를 다시 들어 보세요. 화음의 느낌을 비교해 보세요.');
    }
  });
  wrongAtonal.forEach((card) => {
    if (card === '조성 음악') {
      parts.push('피에로 칸의 「조성 음악」을 다시 들어 보세요. 조성감만 비교해 보세요.');
    } else if (card === '편안하고 안정적') {
      parts.push('피에로 칸의 「편안하고 안정적」을 다시 들어 보세요. 분위기만 비교해 보세요.');
    } else if (card === '음들이 서로 잘 어울린다.') {
      parts.push('피에로 칸의 「음들이 서로 잘 어울린다.」를 다시 들어 보세요. 화음의 느낌을 비교해 보세요.');
    }
  });

  const body = parts.length
    ? `${parts.join('\n')}\n다시 들어보세요.`
    : '두 곡을 번갈아 들으며 안정감·긴장감·음의 어울림이 같은 칸에 모였는지 점검해 보세요.\n다시 들어보세요.';
  const mark = colTonalOk || colAtonalOk ? '△' : '✗';
  return `검증: ${mark}\n${body}`;
}

export async function generateSbAtonalFormativeAi({ tonalCards, atonalCards }) {
  const fixedGuide = buildSbAtonalFixedGuide({ tonalCards, atonalCards });
  if (isPreflightFeedbackMessage(fixedGuide)) return fixedGuide;

  return generateFormativeFromFixedGuide({
    fixedPayload: fixedGuide,
    activityTitle: '쇤베르크 — 무조성 카드 매칭',
    studentSummary: `조성: ${(tonalCards || []).join(', ')} / 무조: ${(atonalCards || []).join(', ')}`
  });
}

export async function generateAestheticQ2FormativeAi({ selectedSong, q2Type, q2Label, q2 }) {
  const text = String(q2 || '').trim();
  if (!q2Type) return '연결할 분석 요소를 먼저 고른 뒤 피드백 보기를 눌러 주세요.';
  if (text.length < 8) return '가치 평가 내용을 먼저 적은 뒤 피드백 보기를 눌러 주세요.';

  const { mark, guide, pathPrompt, v1, v2, path } = evaluateAestheticQ2({ q2Type, q2 });
  const goal = AESTHETIC_GOAL_BY_TYPE[q2Type] || '고른 음악 요소와 이 곡의 소리·구조를 연결해 가치를 평가할 수 있어요.';
  const fallback = formatAestheticFallback({ goal, mark, guide });

  const taskPrompt = `악곡: ${selectedSong || '—'}
고른 분석 요소: ${q2Label || q2Type}
학생 답변: ${text}

내부 판정(노출 금지): V1=${v1}/2, V2=${v2}/2, 경로${path}, 현재=${mark}

[목표 수준]
${goal}

[피드백 방향]
${pathPrompt}

[고정 가이드]
${guide}`;

  const raw = await requestFormativeText(`${STAGE3_RULES_KO}\n\n${taskPrompt}`, fallback);
  return normalizeAestheticAiOutput(raw, mark, goal, guide);
}
