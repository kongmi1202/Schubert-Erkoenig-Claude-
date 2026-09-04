import { getApiKeySetupMessage, requestOpenAiText } from './openaiClient';
import { evaluateAestheticQ2 } from './aestheticQ2Grading';
import { evaluateAestheticQ3 } from './aestheticQ3Grading';
import { AESTHETIC_Q2_RUBRIC_KO, AESTHETIC_Q2_FEEDBACK_STRATEGIES_KO, AESTHETIC_Q3_RUBRIC_KO, AESTHETIC_Q3_FEEDBACK_STRATEGIES_KO } from './aestheticRubric';
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
import { unwrapStage2ItemPayload } from './formative/labeledItem';
import { formatMarkDisplay, parseMarkFromVerificationLine, stripFeedbackHeader } from './formative/markLabels';

const MSG_NO_KEY = getApiKeySetupMessage();

const STAGE2_RULES_KO = `[피드백 설계 원칙 — Kulhavy & Stock(1989)]
· 검증: ✓ / △ / ✗ (코드가 정함, 바꾸지 말 것)
· 설명: [내부 가이드] 내용만 옮겨 자연스럽게 이어 붙이기. 가이드에 없는 문장·추론·정답·정답 보기 문구 추가 금지
· 말투: 반말·해요체, 「네가 고른」 등 가이드와 같은 톤. 「학생이」「~습니다」「~할 수 있습니다」 금지
· 중학생이 읽기 쉽게, 음악 용어는 짧게 풀어 설명 (예: 셈여림=소리의 세기, 리듬꼴=박자 묶음)
· 오답·△ 피드백에서 절대 금지: 정답 보기 문구, 정답 악기·역할·장면 이름, A/B/A' 직접 지목, 「~이 맞아요/정답이에요」
· 오답·△에서는 학생 선택을 인정 → 왜 아쉬운지 → 무엇을 들어야 하는지(비교 질문) → 다시 들어보세요 순으로 3~4문장
· 항목 제목(선율:, 음계: 등) 나열 금지 — 한 덩어리 서술
· 검증 △·✗이고 틀린 항목이 여러 개면 가이드에 있는 것만 모두 다룰 것`;

const STAGE3_RULES_KO = `[피드백 설계 원칙 — Sadler]
· 상단 검증 줄 없음
· N. [문항 제목] → 목표 수준 / 현재 나의 수준 / 격차 메우기
· △·✗만 맨 끝에 「다시 시도해 보세요!」
· 2번·3번 판정은 아래 판정 준거 표만 사용 (코드가 채점, 피드백은 표에 맞게 작성)
· 2번: 선택한 요소의 음악적 특징을 구체적으로 썼는지 단일 기준으로 판정 (충족/부분/미충족)
· 2번 ✓: 격차 메우기에 강화·개념화 — 학생 답 인용→적절성 확인→음악 개념 연결. 답 고치기 요구 금지
· 2번 △·✗: 정답 문장·모범답안 직접 제공 금지. 청취 단서·질문으로 스스로 발견하도록 안내
· 따라서·그래서는 인과 근거로 보지 말 것
· 2단계에서 배운 음악 요소·특징은 정확한 키워드가 아니어도, 비슷한 뜻이면 인정
· 학생에게 필수 용어·정답 키워드를 요구하거나 암시하지 말 것
· 「정교화:」「설명:」 라벨 대신 「격차 메우기:」 사용
· 격차 메우기: 학생에게 직접 말하는 해요체 3~5문장. "안내해 주세요""제시해 주세요" 같은 교사 지시문·메타 설명 절대 금지
· 3번: 2번 근거로 곡에 대한 판단을 구체적으로 썼는지 단일 기준 (충족/부분/미충족). 긍정·부정 무관
· 3번 피드백 핵심: 발견한 특징을 근거로 자신의 판단을 더 논리적으로 만들게 하는 것 (2번과 다름)
· 3번 ✓: [판단 강화·확장] 인정→근거-판단 연결 확인→사고 확장. 다시 쓰라고 하지 말 것
· 3번 △: [근거-판단 연결 구체화] 판단 인정→부족한 연결 지점→효과·의미 질문→수정 유도. 특징→[?]→판단의 [?]를 학생이 채우게
· 3번 ✗: [근거 회상·연결 유도] 느낌/판단 수용→2번 근거 미사용 안내→2번에서 찾은 특징을 떠올려 평가 근거로 사용. 반드시 다시 들으라고 하지 말 것
· 3번 피드백: 2번 선택 요소·2번 답변·3번 답변을 모두 참고해, 학생이 2번에서 쓴 특징을 구체적으로 인용·언급할 것
· 3번 △·✗: 모범 평가 문장 직접 제공 금지`;

const AESTHETIC_Q2_GOAL_COMMON =
  '고른 음악 요소와 관련된 음악적 특징을 근거로, 그 요소가 왜 특별했는지 구체적으로 설명할 수 있어요.';

const AESTHETIC_Q2_GOAL_BY_TYPE = {
  음색: '등장인물의 음색이 곡 안에서 어떻게 들리는지, 음색에 맞는 특징을 구체적으로 쓰고 요소와 이유가 맞게 연결될 수 있어요.',
  반주: '피아노 반주가 장면·분위기와 어떻게 맞물리는지, 반주에 맞는 특징을 구체적으로 쓰고 요소와 이유가 맞게 연결될 수 있어요.',
  맥락: '사회·역사적 맥락과 이 곡의 음악적 특징을 연결해, 맥락에 맞는 이유를 구체적으로 쓸 수 있어요.',
  음화법: '음화법(음색·선율)이 가사·장면과 어떻게 맞물리는지, 음화법에 맞는 특징을 구체적으로 쓸 수 있어요.',
  화성다성음악: '화성·다성음악(소리의 어울림)이 이 곡에서 어떻게 드러나는지, 그 요소에 맞는 특징을 구체적으로 쓸 수 있어요.',
  현악음색: '현악 4중주의 음색·역할이 곡 안에서 어떻게 들리는지, 현악 음색에 맞게 구체적으로 쓸 수 있어요.',
  주제비교: '제1·제2주제의 대비가 곡을 어떻게 만들어 가는지, 주제에 맞는 특징을 구체적으로 쓸 수 있어요.',
  슈프레흐슈팀메: '슈프레흐슈팀메가 이 곡의 분위기·표현과 어떻게 맞물리는지, 그 요소에 맞게 구체적으로 쓸 수 있어요.',
  무조성: '무조성이 이 곡의 소리·분위기와 어떻게 연결되는지, 무조성에 맞게 구체적으로 쓸 수 있어요.',
  소네트: '소네트(표제음악)와 음악 묘사가 어떻게 맞물리는지, 소네트에 맞는 특징을 구체적으로 쓸 수 있어요.',
  바이올린협주곡: '협주곡의 독주·총주·형식이 곡을 어떻게 만드는지, 협주곡에 맞게 구체적으로 쓸 수 있어요.',
  ABA형식: 'ABA 형식에서 앞·가운데·뒤가 어떻게 다른지, 형식에 맞는 특징을 구체적으로 쓸 수 있어요.',
  폴리리듬: '폴리리듬(양손 리듬 겹침)이 어떻게 들리는지, 폴리리듬에 맞는 특징을 구체적으로 쓸 수 있어요.'
};

const AESTHETIC_Q3_GOAL =
  '2번에서 선택·설명한 음악적 특징을 근거로, 그 특징이 곡에 주는 효과·의미·개성 등의 관점에서 곡 전체에 대한 자신의 판단을 구체적으로 쓸 수 있어요.';

const Q2_LISTENING_CUES_BY_TYPE = {
  음색: '등장인물의 목소리 음색이 어떻게 들리는지, 높고 낮음·밝고 어두움 등',
  반주: '피아노 반주가 장면이나 분위기와 어떻게 맞물리는지',
  맥락: '곡의 시대·배경과 연결되는 음악적 특징',
  음화법: '가사나 장면과 맞게 음색·선율이 어떻게 변하는지',
  화성다성음악: '여러 소리가 어떻게 어울리거나 겹쳐 들리는지',
  현악음색: '바이올린·비올라·첼로·콘트라베이스가 각각 어떤 소리·역할로 들리는지',
  주제비교: '제1·제2주제의 가락·리듬·음색이 어떻게 다른지',
  슈프레흐슈팀메: '목소리가 정확한 음높이로 노래하는 것처럼 들리는지, 말하듯이 움직이는지',
  무조성: '음이 안정적으로 느껴지는지, 불안정하거나 낯선 소리로 들리는지',
  소네트: '음악이 가사·장면을 어떻게 묘사하는지',
  바이올린협주곡: '독주 바이올린과 오케스트라가 어떻게 역할을 나누는지',
  ABA형식: '앞·가운데·뒤 부분의 음악이 어떻게 달라지는지',
  폴리리듬: '양손(또는 여러 파트)의 리듬이 어떻게 겹쳐 들리는지'
};

function truncateStudentQuote(text, maxLen = 48) {
  const t = String(text || '').trim().replace(/\s+/g, ' ');
  if (!t) return '';
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen)}…`;
}

function getQ2ListeningCue(q2Type) {
  return Q2_LISTENING_CUES_BY_TYPE[q2Type] || '고른 음악 요소와 관련된 소리나 표현';
}

export function buildAestheticQ2GapText({ score, q2Text, q2Label, q2Type }) {
  const element = q2Label || q2Type || '고른 음악 요소';
  const quote = truncateStudentQuote(q2Text);
  const cue = getQ2ListeningCue(q2Type);

  if (score === 2) {
    const lead = quote
      ? `「${quote}」라고 쓴 특징을 잘 찾아냈어요.`
      : '고른 요소에 맞는 음악적 특징을 잘 찾아냈어요.';
    return `${lead} 이것이 ${element}에서 나타나는 중요한 음악적 특징과 잘 맞아요. 네가 들은 소리를 음악 개념과 연결해 쓴 점이 좋아요.`;
  }

  if (score === 1) {
    const lead = quote
      ? `「${quote}」에서 방향은 좋아요.`
      : '관련된 방향으로 쓴 점은 좋아요.';
    return `${lead} 다만 '어떻게' 다른지·어떤 특징인지가 조금 더 드러나면 이유가 분명해질 것 같아요. ${cue}에 주목해서 다시 표현해 보세요.`;
  }

  const lead = quote
    ? `「${quote}」처럼 느낌은 잘 전했어요.`
    : '생각을 적어 준 점은 좋아요.';
  return `${lead} 지금 답변에는 '${element}'의 음악적 특징이 아직 드러나지 않았어요. 음악을 다시 들으며 ${cue}에 주목해 보세요. 들은 특징을 이유로 적어 보세요.`;
}

function summarizeQ2FeaturePhrase(q2Text, maxLen = 28) {
  const t = String(q2Text || '').trim().replace(/\s+/g, ' ');
  if (!t) return '음악적 특징';
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen)}…`;
}

function summarizeQ3JudgmentPhrase(q3Text, maxLen = 32) {
  const t = String(q3Text || '').trim().replace(/\s+/g, ' ');
  if (!t) return '';
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen)}…`;
}

export function buildAestheticQ3GapText({ score, q2Text, q3Text }) {
  const q2Feature = summarizeQ2FeaturePhrase(q2Text);
  const q3Judgment = summarizeQ3JudgmentPhrase(q3Text);

  if (score === 2) {
    const judgmentLead = q3Judgment
      ? `${q2Feature}을(를) 근거로 「${q3Judgment}」라고 잘 판단했어요.`
      : `${q2Feature}을(를) 근거로 곡에 대한 판단을 잘 연결했어요.`;
    return `${judgmentLead} 이미 음악적 특징을 근거로 자신의 생각을 구체적으로 설명했어요. 이 특징이 다른 음악과 비교했을 때 이 곡을 어떻게 다르게 느끼게 하는지도 생각해 보면 판단을 한 단계 더 확장할 수 있어요.`;
  }

  if (score === 1) {
    const judgmentHint = q3Judgment.includes('독특')
      ? '이 곡이 독특하다고 판단한'
      : q3Judgment
        ? `「${q3Judgment}」라고 판단한`
        : '곡에 대한 판단을 내린';
    const gapDetail = q3Judgment.includes('독특')
      ? '다만 그 특징이 왜 곡을 독특하게 만든다고 생각했는지가 조금 더 드러나면 좋아요.'
      : '다만 그 특징이 왜 그렇게 평가하게 되었는지가 조금 더 드러나면 좋아요.';
    return `2번에서 찾은 '${q2Feature}'을(를) 근거로 ${judgmentHint} 점은 좋아요. ${gapDetail} 이러한 표현 방식이 곡의 분위기나 느낌에 어떤 영향을 주는지 생각해 보고, 그 효과를 자신의 판단과 연결해 보세요.`;
  }

  const feelingLead = q3Judgment
    ? `「${q3Judgment}」라는 자신의 생각은 잘 표현했어요.`
    : '자신의 생각은 잘 표현했어요.';
  return `${feelingLead} 하지만 지금 답변에는 2번에서 찾은 '${q2Feature}'이(가) 그 판단의 근거로 아직 사용되지 않았어요. 2번에서 찾은 특징이 곡의 분위기나 느낌에 어떤 영향을 주었는지 생각한 뒤, 그것을 근거로 왜 그렇게 평가했는지 연결해 보세요.`;
}

function isMetaInstructionGap(text) {
  return /안내해\s*주세요|제시해\s*주세요|설명해\s*주세요|알려\s*주세요|작성해\s*주세요|인용·요약할\s*것/.test(
    String(text || '')
  );
}

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
  (payload.sections || []).forEach((section) => {
    lines.push('');
    lines.push(`[${section.label}]`);
    if (section.status === 'ok') {
      lines.push(section.note);
    } else {
      lines.push(section.note);
      if (section.hint) lines.push(section.hint);
      if (section.example) lines.push(section.example);
    }
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
  const core = unwrapStage2ItemPayload(payload);
  if (core?.kind === 'hy-theme-match') return core.mark || '✗';
  if (typeof core === 'string') {
    const head = core.trim();
    if (/^검증\s*[:：]\s*△/.test(head)) return '△';
    if (/^검증\s*[:：]\s*✓/.test(head)) return '✓';
    if (/^검증\s*[:：]\s*✗/.test(head)) return '✗';
    return null;
  }
  if (core?.kind === 'voice-sections') {
    if (/△/.test(core.verification || '')) return '△';
    if (core.isCorrect) return '✓';
    const okCount = (core.sections || []).filter((s) => s.status === 'ok').length;
    const total = (core.sections || []).length;
    if (okCount > 0 && okCount < total) return '△';
    return '✗';
  }
  if (core?.kind === 'slider-item') return core.isCorrect ? '✓' : '✗';
  return '✗';
}

function extractExplanationBody(guide) {
  return stripFeedbackHeader(guide);
}

export function formatStage2Display(mark, body) {
  return `검증: ${formatMarkDisplay(mark)}\n설명: ${extractExplanationBody(body)}`;
}

/** CompareAiFeedbackBlock 등 UI용 — 검증 줄과 본문 분리 */
export function parseStage2FeedbackText(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  const lines = raw.split(/\r?\n/);
  const mark = parseMarkFromVerificationLine(lines[0] || '');
  if (!mark) return null;
  const body = lines
    .slice(1)
    .join('\n')
    .replace(/^설명\s*[:：]\s*/, '')
    .trim();
  return { mark, body };
}

/** 3단계 Sadler 피드백 — 현재 나의 수준 기호 추출 */
export function parseAestheticFeedbackText(text) {
  const raw = String(text || '').trim();
  if (!/^\d\.\s*\[/.test(raw)) return null;
  const levelMatch = raw.match(/📍\s*현재 나의 수준\s*[:：]\s*([✓△✗])/);
  if (!levelMatch) return null;
  return { mark: levelMatch[1], body: raw };
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

function isPreflightPayload(payload) {
  if (payload?.kind === 'labeled') return isPreflightFeedbackMessage(payload.body);
  if (typeof payload === 'string') return isPreflightFeedbackMessage(payload);
  if (payload?.kind === 'plain') return isPreflightFeedbackMessage(payload.text);
  if (payload?.kind === 'slider-item') return false;
  return false;
}

function preflightPayloadText(payload) {
  if (payload?.kind === 'labeled') return payload.body;
  if (typeof payload === 'string') return payload;
  if (payload?.kind === 'plain') return payload.text;
  return '';
}

function buildDisplayGuide(fixedPayload, mark) {
  const core = unwrapStage2ItemPayload(fixedPayload);
  if (core?.kind === 'voice-sections') return buildVoiceSectionsExplanation(core, mark);
  if (core?.kind === 'slider-item') return core.body || '';
  return extractExplanationBody(typeof core === 'string' ? core : core?.text || '');
}

function buildGptInternalGuide(fixedPayload, mark) {
  const core = unwrapStage2ItemPayload(fixedPayload);
  if (core?.kind === 'voice-sections') return buildVoiceSectionsGptGuide(core, mark);
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
  if (payload?.itemLabel) return payload.itemLabel;
  if (payload?.kind === 'labeled') return payload.label;
  const core = unwrapStage2ItemPayload(payload);
  if (core?.kind !== 'voice-sections') return '';
  const id = core.character;
  if (!id || id === 'piano-scene') return '';
  if (/^cp-f\d$/.test(id)) {
    const nums = { 'cp-f1': '1', 'cp-f2': '2', 'cp-f3': '3' };
    return `구간 ${nums[id] || id}`;
  }
  // 활동 단위 카드 패널(소네트·협주곡·음화법·폴리리듬·음색 등)은 상단 라벨 생략
  if (
    /^(vv-sonnet|vv-concerto|tone-painting|cp-rhythm|hy-timbre|hy-theme-match|hy-theme-deg)$/.test(
      id
    )
  ) {
    return '';
  }
  return `「${id}」`;
}

function buildStage2SectionFromPayload(payload) {
  const label = labelForCombinedPayload(payload);
  const core = unwrapStage2ItemPayload(payload);
  if (core?.kind === 'hy-theme-match') {
    return { label, kind: 'hy-theme-match', ...core };
  }
  if (core?.kind === 'voice-sections') {
    const { kind, verification, ...rest } = core;
    return { label, kind: 'voice-sections', ...rest };
  }
  if (core?.kind === 'slider-item') {
    const { kind, ...rest } = core;
    return { label, kind: 'slider-item', ...rest };
  }
  const mark = verificationMarkFromFixed(payload) || '✗';
  const body = buildDisplayGuide(payload, mark).trim();
  if (!body) return null;
  return { label, kind: 'text', body };
}

function buildStage2SectionsPayload(payloads) {
  const sections = (payloads || []).map(buildStage2SectionFromPayload).filter(Boolean);
  const hasStructured = sections.some(
    (s) => s.kind === 'hy-theme-match' || s.kind === 'voice-sections' || s.kind === 'slider-item'
  );
  if (!hasStructured) return null;
  const mark = combineMarkFromPayloads(payloads);
  return { kind: 'stage2-sections', mark, sections };
}

function buildCombinedDisplayGuide(payloads) {
  const multi = (payloads || []).length > 1;
  return (payloads || [])
    .map((p) => {
      const mark = verificationMarkFromFixed(p) || '✗';
      const body = buildDisplayGuide(p, mark).trim();
      const label = multi ? labelForCombinedPayload(p) : '';
      if (!body) return '';
      if (!label) return body;
      return `${label}\n${body}`;
    })
    .filter(Boolean)
    .join('\n\n');
}

function buildCombinedGptGuide(payloads) {
  const multi = (payloads || []).length > 1;
  return (payloads || [])
    .map((p) => {
      const mark = verificationMarkFromFixed(p) || '✗';
      const body = buildGptInternalGuide(p, mark);
      if (!body) return '';
      const label = multi ? labelForCombinedPayload(p) : '';
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
  const preflight = items.find((p) => isPreflightPayload(p));
  if (preflight) return preflightPayloadText(preflight);
  if (!items.length) return '먼저 모든 문항을 완료한 뒤 피드백 보기를 눌러 주세요.';

  const structured = buildStage2SectionsPayload(items);
  if (structured) return structured;

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

function formatAestheticFallback({ questionNum, questionTitle, goal, mark, guide }) {
  const retry = mark === '✓' ? '' : '\n\n다시 시도해 보세요!';
  return `${questionNum}. [${questionTitle}]\n\n🎯 목표 수준:\n${goal}\n\n📍 현재 나의 수준: ${formatMarkDisplay(mark)}\n\n📝 격차 메우기:\n${guide}${retry}`;
}

function normalizeAestheticAiOutput(raw, { questionNum, questionTitle, mark, goal, guide }) {
  const fallback = formatAestheticFallback({ questionNum, questionTitle, goal, mark, guide });
  const text = String(raw || '').trim();
  const headerPattern = new RegExp(`^${questionNum}\\.\\s*\\[`);
  if (!text || !headerPattern.test(text)) return fallback;

  const gapMatch = text.match(/📝\s*격차 메우기\s*[:：]\s*([\s\S]*?)(?:\n\n다시 시도|$)/);
  if (gapMatch && isMetaInstructionGap(gapMatch[1])) return fallback;

  return text
    .replace(
      /(📍\s*현재 나의 수준\s*[:：]\s*)[✓△✗](?:\s+[^\n]*)?/,
      `$1${formatMarkDisplay(mark)}`
    )
    .replace(/📝\s*설명\s*[:：]/g, '📝 격차 메우기:');
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

export async function generateSbAtonalFormativeAi({ tonalCards, atonalCards }) {
  return generateStage2ActivityFeedback('sb-atonal', { tonalCards, atonalCards });
}

export async function generateAestheticQ2FormativeAi({ selectedSong, q2Type, q2Label, q2 }) {
  const text = String(q2 || '').trim();
  if (!q2Type) return '특별하다고 느낀 음악 요소를 먼저 고른 뒤 피드백 보기를 눌러 주세요.';
  if (text.length < 8) return '그렇게 생각한 이유를 먼저 적은 뒤 피드백 보기를 눌러 주세요.';

  const { mark, pathPrompt, score } = await evaluateAestheticQ2({ q2Type, q2Label, q2 });
  const goal = AESTHETIC_Q2_GOAL_BY_TYPE[q2Type] || AESTHETIC_Q2_GOAL_COMMON;
  const gapBody = buildAestheticQ2GapText({ score, q2Text: text, q2Label, q2Type });
  const meta = { questionNum: 2, questionTitle: '선택 요소의 음악적 특징 설명', goal, mark, guide: gapBody };
  const fallback = formatAestheticFallback(meta);

  const taskPrompt = `${AESTHETIC_Q2_RUBRIC_KO}

${AESTHETIC_Q2_FEEDBACK_STRATEGIES_KO}

악곡: ${selectedSong || '—'}
고른 음악 요소: ${q2Label || q2Type}
학생 답변: ${text}

내부 판정(노출 금지): score=${score}/2, 현재=${mark}

[목표 수준]
${goal}

[이번 학생 피드백 방향]
${pathPrompt}

[출력 형식 — 반드시 준수]
2. [선택 요소의 음악적 특징 설명]

🎯 목표 수준:
(위 목표 수준 그대로)

📍 현재 나의 수준: ${formatMarkDisplay(mark)}

📝 격차 메우기:
(학생에게 직접 말하는 형성적 피드백 3~5문장. 위 전략·예시 문체를 따르되 학생 답변에 맞게 새로 작성. 교사 지시문 금지)`;

  const raw = await requestFormativeText(`${STAGE3_RULES_KO}\n\n${taskPrompt}`, fallback);
  return normalizeAestheticAiOutput(raw, meta);
}

export async function generateAestheticQ3FormativeAi({
  selectedSong,
  q2Type,
  q2Label,
  q2,
  q3
}) {
  const q2Text = String(q2 || '').trim();
  const q3Text = String(q3 || '').trim();

  const evaluation = await evaluateAestheticQ3({ q2Type, q2Label, q2: q2Text, q3: q3Text });
  const { mark, pathPrompt, score, needsQ2 } = evaluation;

  if (needsQ2) {
    return evaluation.guide;
  }

  if (q3Text.length < 8) {
    return evaluation.guide;
  }

  const goal = AESTHETIC_Q3_GOAL;
  const gapBody = buildAestheticQ3GapText({ score, q2Text, q3Text });
  const meta = { questionNum: 3, questionTitle: '2번 근거로 한 곡 전체 판단', goal, mark, guide: gapBody };
  const fallback = formatAestheticFallback(meta);

  const taskPrompt = `${AESTHETIC_Q3_RUBRIC_KO}

${AESTHETIC_Q3_FEEDBACK_STRATEGIES_KO}

악곡: ${selectedSong || '—'}
2번 선택: ${q2Label || q2Type || '—'}
2번 답변: ${q2Text}
3번 답변: ${q3Text}

내부 판정(노출 금지): score=${score}/2, 현재=${mark}

[목표 수준]
${goal}

[이번 학생 피드백 방향]
${pathPrompt}

[출력 형식 — 반드시 준수]
3. [2번 근거로 한 곡 전체 판단]

🎯 목표 수준:
(위 목표 수준 그대로)

📍 현재 나의 수준: ${formatMarkDisplay(mark)}

📝 격차 메우기:
(학생에게 직접 말하는 형성적 피드백 2~4문장. 2번·3번 답변을 반영해 위 예시 문체로 새로 작성. 교사 지시문·긴 인용 금지)`;

  const raw = await requestFormativeText(`${STAGE3_RULES_KO}\n\n${taskPrompt}`, fallback);
  return normalizeAestheticAiOutput(raw, meta);
}
