const clean = (v) => (typeof v === 'string' ? v.trim() : '');

export function normalizeOverviewText(value) {
  return clean(value).toLowerCase().replace(/\s+/g, '');
}

export function includesAnyToken(value, tokens) {
  const text = normalizeOverviewText(value);
  return tokens.some((token) => text.includes(normalizeOverviewText(token)));
}

export function countTokenHits(value, tokens) {
  return tokens.filter((token) => includesAnyToken(value, [token])).length;
}

export function arraysEqualAsSet(actual, expected) {
  const actualSet = new Set((actual || []).filter(Boolean));
  if (actualSet.size !== expected.length) return false;
  return expected.every((item) => actualSet.has(item));
}

export const MAWANG_Q1_CHARACTERS = ['해설자', '아버지', '아들', '마왕'];

/** Q1 — 표준 이름 + 허용 동의어(칸마다 하나씩, 네 역할 모두 있어야 함) */
export const MAWANG_Q1_ROLE_ALIASES = {
  해설자: ['해설자', '해설', '내레이션', '나레이션', '내레이터'],
  아버지: ['아버지', '아빠'],
  아들: ['아들', '아이'],
  마왕: ['마왕']
};

/**
 * Q2 줄거리 — 네 가지 핵심 축(각 축마다 동의어 하나 이상).
 * 모두 포함되면 정답. 서술 방식·문장 순서는 달라도 됨.
 */
export const MAWANG_Q2_KEYWORD_GROUPS = [
  { id: 'father', label: '아버지', keywords: ['아버지', '아빠', '부모'] },
  { id: 'son', label: '아들', keywords: ['아들', '아이', '어린'] },
  { id: 'erlkonig', label: '마왕', keywords: ['마왕', '유혹', '유령'] },
  { id: 'death', label: '결말(죽음)', keywords: ['죽', '죽음', '죽어', '죽었', '별세'] }
];

/** Q2 보조 키워드 — 피드백 정교화용(채점 필수 아님) */
export const MAWANG_Q2_OPTIONAL_KEYWORDS = [
  '폭풍', '폭풍우', '밤', '유혹', '달려', '집', '안고', '무서', '두려', '부정'
];

export function resolveMawangCharacterRole(name) {
  const n = normalizeOverviewText(name);
  if (!n) return null;
  for (const [canonical, aliases] of Object.entries(MAWANG_Q1_ROLE_ALIASES)) {
    if (aliases.some((alias) => {
      const a = normalizeOverviewText(alias);
      if (!a) return false;
      // 완전 일치, 별칭 포함("해설자님"), 짧은 허용형("해설"→해설자)
      return n === a || n.includes(a) || (n.length >= 2 && a.startsWith(n));
    })) {
      return canonical;
    }
  }
  return null;
}

export function evaluateMawangOverviewQ1(chars) {
  const slots = (chars || []).map((c) => clean(c)).filter(Boolean);
  const roles = slots.map(resolveMawangCharacterRole);
  const matchedRoles = new Set(roles.filter(Boolean));
  const missingRoles = MAWANG_Q1_CHARACTERS.filter((r) => !matchedRoles.has(r));
  const unknownSlots = slots.filter((_, idx) => !roles[idx]);
  const duplicateRole = roles.filter(Boolean).length !== matchedRoles.size;
  const isCorrect = slots.length === 4
    && !unknownSlots.length
    && !duplicateRole
    && missingRoles.length === 0;
  return { isCorrect, matchedRoles: [...matchedRoles], missingRoles, unknownSlots, duplicateRole };
}

export function evaluateMawangOverviewQ2(story) {
  const text = normalizeOverviewText(story);
  const matchedGroups = MAWANG_Q2_KEYWORD_GROUPS.filter((group) =>
    group.keywords.some((kw) => text.includes(normalizeOverviewText(kw))));
  const missingGroups = MAWANG_Q2_KEYWORD_GROUPS.filter(
    (group) => !matchedGroups.some((g) => g.id === group.id)
  );
  return {
    isCorrect: missingGroups.length === 0 && text.length > 0,
    matchedGroups,
    missingGroups
  };
}

export function gradeMawangOverviewQ1(chars) {
  return evaluateMawangOverviewQ1(chars).isCorrect;
}

export function gradeMawangOverviewQ2(story) {
  return evaluateMawangOverviewQ2(story).isCorrect;
}

/** 대비·변화 표현 — 2축 질문에서 한 축 + 대비면 유사 정답으로 인정 */
const OVERVIEW_CONTRAST_TOKENS = ['대비', '바뀌', '달라', '다르', '전환', '극적', '변화', '느낌이'];

function groupTokens(group) {
  return [...(group.keywords || []), ...(group.softKeywords || [])];
}

function groupMatchesText(text, group) {
  return includesAnyToken(text, groupTokens(group));
}

/**
 * 서술형 개요 — 축마다 동의어·유사 표현. 모든 축이 있어야 정답(관대 모드 포함).
 * hint는 학생/AI 피드백용이며 정답 단어를 넣지 않는다.
 */
export const OVERVIEW_KEYWORD_GROUPS = {
  'handel:q1': [
    {
      id: 'source',
      keywords: ['성경', '종교', '계시록', '요한', '신앙'],
      softKeywords: ['하나님', '신', '기독', '말씀', '이야기'],
      hint: '가사가 어떤 이야기·주제를 바탕으로 하는지 한 줄을 더 넣어 보세요.'
    },
    {
      id: 'praise',
      keywords: ['찬양', '할렐루야', '기리', '주님', '하나님', '왕', '주'],
      softKeywords: ['경배', '영광', '위대', '신', '축복'],
      sufficientAlone: true,
      hint: '후렴이 누구를 기리는지, 어떤 마음으로 노래하는지 적어 보세요.'
    }
  ],
  'handel:q2': [
    {
      id: 'genre',
      keywords: ['오라토리오', '오페라'],
      softKeywords: ['장르', '합창곡', '종교음악', '종교', '종교적', '합창', '관현악'],
      hint: '이 곡의 장르와 오페라를 비교해 적어 보세요.'
    },
    {
      id: 'staging',
      keywords: ['무대', '의상', '연기', '연출'],
      softKeywords: [
        '배우', '배역', '무대공연', '눈에 보이', '보이지', '없이', '없다', '없어',
        '안 입', '안입', '안 한', '안한', '하지 않', '안 한다', '안한다', '하지않',
        '합창만', '노래만'
      ],
      hint: '무대·의상·연기처럼 눈에 보이는 연출이 있는지 없는지를 비교해 적어 보세요.'
    }
  ],
  'haydn:q1': [
    {
      id: 'violins',
      keywords: ['바이올린', '제1바이올린', '제2바이올린', '1바이올린', '2바이올린'],
      softKeywords: ['현악', '4중주', '사중주', '두 개의 바이올린'],
      hint: '현악 4중주의 바이올린 성부가 빠졌는지 확인해 보세요.'
    },
    {
      id: 'viola',
      keywords: ['비올라'],
      softKeywords: ['중간', '중성'],
      hint: '비올라(중간 음역)가 있는지 들어 보세요.'
    },
    {
      id: 'cello',
      keywords: ['첼로'],
      softKeywords: ['낮은', '베이스', '초벌'],
      hint: '첼로(낮은 음역)가 있는지 들어 보세요.'
    }
  ],
  'haydn:q2': [
    {
      id: 'animal',
      keywords: ['종달새'],
      softKeywords: ['새', '지저', '짹짹', 'bird'],
      hint: '떠오르는 동물의 이름을 분명히 적어 보세요.'
    },
    {
      id: 'reason',
      keywords: ['바이올린', '선율', '가락', '멜로디', '높', '가볍', '지저', '맑', '빠르'],
      softKeywords: ['제1', '가벼', '얇', '올라', '경쾌', '소리', '이유', '때문'],
      hint: '어느 악기의 선율이, 어떻게 들려서 그렇게 느껴지는지 이유를 적어 보세요.'
    }
  ],
  'vivaldi:q1': [
    {
      id: 'summer',
      keywords: ['여름'],
      softKeywords: ['summer', '계절', '무더'],
      hint: '어느 계절의 장면인지도 넣어 보세요.'
    },
    {
      id: 'weather',
      keywords: ['폭풍', '폭풍우', '천둥', '번개', '우박'],
      softKeywords: ['비', '바람', '날씨', '하늘', '무서', '격렬', '태양', '더위', '목동'],
      hint: '소네트의 하늘·날씨 장면이 드러나는지 다시 읽어 보세요.'
    }
  ],
  'chopin:q1': [
    {
      id: 'piano_solo',
      keywords: ['피아노', '건반'],
      softKeywords: [
        '독주', '한 대', '한대', '혼자', '다른 악기 없', '피아노만', '오케스트라 없',
        '단독', '선율', '반주', '양손', 'piano'
      ],
      hint: '한 대의 피아노가 선율과 반주를 모두 맡는지 확인해 보세요.'
    }
  ],
  'chopin:q2': [
    {
      id: 'fast',
      keywords: ['빠르', '격렬'],
      softKeywords: ['강하', '세게', '앞부분', '앞', '처음', 'a구간', '에너지', '활기'],
      hint: '앞부분의 빠르기·세기가 어떤지 적어 보세요.'
    },
    {
      id: 'slow',
      keywords: ['느리', '서정', '부드'],
      softKeywords: ['잔잔', '여유', '중간', '가운데', 'b구간', '조용', 'pp', '부드럽'],
      hint: '중간부에서 빠르기·분위기가 바뀌는지도 적어 보세요.'
    }
  ],
  'schoenberg:q2': [
    {
      id: 'tension',
      keywords: ['불안', '긴장', '공포', '두려'],
      softKeywords: ['무서', '불편', '긴장감', '도취', '표현주의'],
      hint: '긴장되거나 편한지, 감정을 형용사로 적어 보세요.'
    },
    {
      id: 'dream',
      keywords: ['몽환', '신비', '낯설', '환상'],
      softKeywords: ['달빛', '달', '몽롱', '아득', '이상', '신비로'],
      hint: '달빛 속 장면이 또렷한지 아득한지, 분위기를 한 단어 더 적어 보세요.'
    }
  ]
};

function isOverviewContrastAnswer(text) {
  return includesAnyToken(text, OVERVIEW_CONTRAST_TOKENS);
}

function isOverviewSimilarToReference(student, reference, groups, groupedEval) {
  const text = clean(student);
  const ref = clean(reference);
  if (!text || !ref || !groups?.length || !groupedEval) return false;

  const softMatched = groups.filter((g) => groupMatchesText(text, g));
  if (softMatched.length === groups.length) return true;

  if (softMatched.some((g) => g.sufficientAlone)) return true;

  const refConcepts = groups
    .flatMap((g) => groupTokens(g))
    .filter((token) => includesAnyToken(ref, [token]));
  if (!refConcepts.length) return false;

  const matchedConcepts = softMatched.flatMap((g) => groupTokens(g));
  const studentConceptHits = matchedConcepts.filter((token) => includesAnyToken(text, [token])).length;

  if (softMatched.length >= Math.ceil(groups.length / 2) && studentConceptHits >= 1) {
    return true;
  }

  const refHits = refConcepts.filter((token) => includesAnyToken(text, [token])).length;
  const minConceptHits = Math.max(1, Math.ceil(refConcepts.length * 0.35));
  if (refHits >= minConceptHits && softMatched.length >= 1) {
    return true;
  }

  if (
    groups.length === 2
    && softMatched.length >= 1
    && isOverviewContrastAnswer(text)
    && text.length >= 10
  ) {
    return true;
  }

  return groupedEval.matchedGroups.length > 0 && refHits >= minConceptHits;
}

export function evaluateOverviewKeywordGroups(text, groups, options = {}) {
  const list = groups || [];
  const body = clean(text);
  if (!list.length || !body) {
    return { isCorrect: false, matchedGroups: [], missingGroups: list };
  }

  const matchedGroups = list.filter((group) => groupMatchesText(body, group));
  const missingGroups = list.filter((group) => !matchedGroups.some((g) => g.id === group.id));

  let isCorrect = missingGroups.length === 0;

  if (!isCorrect && options.lenient !== false) {
    if (matchedGroups.some((g) => g.sufficientAlone)) {
      isCorrect = true;
    } else if (
      list.length === 2
      && matchedGroups.length >= 1
      && isOverviewContrastAnswer(body)
      && body.length >= 10
    ) {
      isCorrect = true;
    } else if (list.length >= 2 && matchedGroups.length >= Math.ceil(list.length / 2)) {
      isCorrect = true;
    }
  }

  return {
    isCorrect,
    matchedGroups,
    missingGroups: isCorrect ? [] : missingGroups
  };
}

export function evaluateOverviewQuestion(song, question, data, options = {}) {
  const groups = OVERVIEW_KEYWORD_GROUPS[`${song}:${question}`];
  if (!groups) return null;
  const text = question === 'q1'
    ? getOverviewStudentQ1(song, data)
    : getOverviewStudentQ2(song, data);
  const grouped = evaluateOverviewKeywordGroups(text, groups, options);
  if (grouped.isCorrect || options.lenient === false) return grouped;

  const reference = question === 'q1'
    ? getOverviewReferenceQ1(song)
    : getOverviewReferenceQ2(song);
  if (isOverviewSimilarToReference(text, reference, groups, grouped)) {
    return { ...grouped, isCorrect: true, missingGroups: [] };
  }
  return grouped;
}

const HAYDN_Q1_INSTRUMENTS = ['제1바이올린', '제2바이올린', '비올라', '첼로'];
const SCHOENBERG_Q1_VOICE_TOKENS = ['소프라노', '메조소프라노', '메조', '성악'];
const SCHOENBERG_Q1_INSTRUMENT_TOKENS = ['플루트', '클라리넷', '바이올린', '첼로', '피아노'];

export const OVERVIEW_REFERENCE_ANSWERS = {
  mawang: {
    q1: MAWANG_Q1_CHARACTERS.join(', '),
    q2: '폭풍우 치는 밤, 아버지가 아픈 아들을 가슴에 안고 집으로 달려간다. 아들은 마왕의 유혹을 두려워하지만 아버지는 이를 부정한다. 집에 도착했을 때 아들은 이미 죽어 있다.'
  },
  handel: {
    q1: '성경(요한계시록)을 바탕으로 한 종교적 내용이에요. 할렐루야, King of Kings 등 신의 위대함을 찬양하는 내용이 중심입니다.',
    q2: '오페라와 달리 오라토리오는 무대 연기·의상 없이 합창과 관현악으로 종교적 내용을 전달해요.'
  },
  haydn: {
    q1: HAYDN_Q1_INSTRUMENTS.join(', '),
    q2: '종달새. 제1바이올린의 높고 가벼운 선율이 새의 지저귐처럼 들리기 때문이다.'
  },
  vivaldi: {
    q1: '여름 폭풍우의 장면을 묘사하고 있어요. 타오르는 태양 아래 지친 목동과 양떼, 갑작스러운 폭풍과 번개, 우박으로 이삭이 쓸려가는 장면을 담고 있어요.'
  },
  chopin: {
    q1: '피아노 독주예요. 다른 악기 없이 피아노 한 대가 선율과 반주를 모두 표현해요.',
    q2: '빠르고 격렬한 A구간과 느리고 서정적인 B구간이 대비되어, 곡의 분위기가 극적으로 바뀌어요.'
  },
  schoenberg: {
    q1: '소프라노(또는 메조소프라노) 성악, 플루트, 클라리넷, 바이올린, 첼로, 피아노로 구성된 실내악이에요.',
    q2: '불안하고 몽환적이며 신비로운 분위기예요. 달빛 속 도취감과 공포가 뒤섞인 표현주의 특유의 감성을 담고 있어요.'
  }
};

export function hasOverviewQ2(song) {
  return song !== 'vivaldi';
}

export function getOverviewStudentQ1(song, data) {
  const chars = data.analyticalCharacters || [];
  switch (song) {
    case 'handel':
      return clean(data.handelLyricMeaning);
    case 'chopin':
    case 'schoenberg':
      return clean(chars[0]);
    case 'vivaldi':
      return clean(chars[0]) || chars.filter(Boolean).join(', ');
    default:
      return chars.filter(Boolean).join(', ');
  }
}

export function getOverviewStudentQ2(song, data) {
  if (!hasOverviewQ2(song)) return '';
  if (song === 'handel') return clean(data.handelOperaDiff);
  return clean(data.analyticalStory);
}

export function getOverviewReferenceQ1(song) {
  return OVERVIEW_REFERENCE_ANSWERS[song]?.q1 || '';
}

export function getOverviewReferenceQ2(song) {
  return OVERVIEW_REFERENCE_ANSWERS[song]?.q2 || '';
}

function gradeHaydnOverviewQ1(chars) {
  const slots = (chars || []).map((c) => clean(c)).filter(Boolean);
  const joined = slots.join(' ');
  const grouped = evaluateOverviewKeywordGroups(joined, OVERVIEW_KEYWORD_GROUPS['haydn:q1']);
  if (grouped.isCorrect) return true;
  const hasViola = includesAnyToken(joined, ['비올라']);
  const hasCello = includesAnyToken(joined, ['첼로']);
  const hasVln1 = includesAnyToken(joined, ['제1바이올린', '제1 바이올린', '1바이올린']);
  const hasVln2 = includesAnyToken(joined, ['제2바이올린', '제2 바이올린', '2바이올린']);
  if (hasViola && hasCello && hasVln1 && hasVln2) return true;
  const violinSlots = slots.filter((slot) => includesAnyToken(slot, ['바이올린'])).length;
  return hasViola && hasCello && violinSlots >= 2;
}

function gradeSchoenbergOverviewQ1(text) {
  const voiceOk = includesAnyToken(text, [
    ...SCHOENBERG_Q1_VOICE_TOKENS,
    '노래', '목소리', '가창', '성부', '여성'
  ]);
  const instrumentHits = countTokenHits(text, SCHOENBERG_Q1_INSTRUMENT_TOKENS);
  if (voiceOk && instrumentHits >= 3) return true;
  return includesAnyToken(text, ['실내악', '편성']) && instrumentHits >= 3;
}

/** @returns {boolean | null} null when the song has no overview Q1 */
export function gradeOverviewQ1(song, data) {
  const grouped = evaluateOverviewQuestion(song, 'q1', data);
  if (grouped) return grouped.isCorrect;
  const chars = (data.analyticalCharacters || []).filter(Boolean);
  switch (song) {
    case 'mawang':
      return gradeMawangOverviewQ1(chars);
    case 'haydn':
      return gradeHaydnOverviewQ1(chars);
    case 'schoenberg':
      return gradeSchoenbergOverviewQ1(getOverviewStudentQ1(song, data));
    default:
      return null;
  }
}

/** @returns {boolean | null} null when the song has no overview Q2 */
export function gradeOverviewQ2(song, data) {
  if (!hasOverviewQ2(song)) return null;
  const grouped = evaluateOverviewQuestion(song, 'q2', data);
  if (grouped) return grouped.isCorrect;
  switch (song) {
    case 'mawang':
      return gradeMawangOverviewQ2(data.analyticalStory);
    default:
      return null;
  }
}
