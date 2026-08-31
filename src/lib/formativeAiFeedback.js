import { getApiKeySetupMessage, requestOpenAiText } from './openaiClient';
import { evaluateAestheticQ2 } from './aestheticQ2Grading';
import {
  getCpFormAbaDiscoveryFixedFeedback,
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

const MSG_NO_KEY = getApiKeySetupMessage();

const STAGE2_RULES_KO = `[피드백 설계 원칙 — Kulhavy & Stock(1989)]
· 검증: ✓ / △ / ✗
· 설명: 음악 요소명을 넣어 정교화
· 검증 △·✗이고 틀린 항목이 여러 개면 모두 다룰 것`;

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
  (payload.sections || []).filter((s) => s.status === 'miss').forEach((section) => {
    lines.push('');
    lines.push(`· ${section.label}: ${section.note}`);
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
    lines.push(`맞은 항목: ${okSections.map((s) => `${s.label}(${s.studentPick})`).join(', ')}`);
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

async function generateFormativeFromFixedGuide({
  fixedPayload,
  activityTitle = '',
  studentSummary = ''
}) {
  const mark = verificationMarkFromFixed(fixedPayload) || '✗';
  const displayGuide = buildDisplayGuide(fixedPayload, mark);
  const gptGuide = buildGptInternalGuide(fixedPayload, mark);
  if (!displayGuide && !gptGuide) return '피드백을 준비하지 못했어요.';
  if (isPreflightFeedbackMessage(displayGuide || gptGuide)) return displayGuide || gptGuide;

  const fallback = formatStage2Display(mark, displayGuide);
  const taskPrompt = `활동: ${activityTitle}
학생 응답: ${studentSummary || '(없음)'}
내부 판정: 검증: ${mark}

[내부 가이드]
${gptGuide}

출력:
검증: ${mark}
설명: (본문)`;

  const raw = await requestFormativeText(`${STAGE2_RULES_KO}\n\n${taskPrompt}`, fallback);
  return normalizeStage2AiOutput(raw, mark, displayGuide);
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
  return generateFormativeFromFixedGuide({
    fixedPayload: getVoiceDesignFixedFeedback(selectedChars, voiceDesign, answerKey),
    activityTitle: '마왕 — 등장인물 음색 설계',
    studentSummary: `${selectedChars?.[0] || ''}: ${JSON.stringify(voiceDesign?.[selectedChars?.[0]] || {})}`
  });
}

export async function generatePianoSceneFormativeAi(params) {
  return generateFormativeFromFixedGuide({
    fixedPayload: getPianoSceneFixedFeedback(params),
    activityTitle: '마왕 — 피아노 반주 장면',
    studentSummary: `오른손: ${params.rhScene || '—'} / 왼손: ${params.lhScene || '—'}`
  });
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
  return generateFormativeFromFixedGuide({
    fixedPayload: getVvConcertoFixedFeedback(params),
    activityTitle: '비발디 — 바이올린 협주곡',
    studentSummary: `선택: ${params.userChoice || '—'}`
  });
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

export async function generateCpFormAbaDiscoveryFormativeAi(params) {
  return generateFormativeFromFixedGuide({
    fixedPayload: getCpFormAbaDiscoveryFixedFeedback(params),
    activityTitle: '쇼팽 — ABA B구간 역할',
    studentSummary: `선택: ${params.userChoice || '—'}`
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
