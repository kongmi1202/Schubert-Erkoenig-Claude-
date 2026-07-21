const clean = (v) => (typeof v === 'string' ? v.trim() : '');

export function normalizeOverviewText(value) {
  return clean(value).toLowerCase().replace(/\s+/g, '');
}

export function includesAnyToken(value, tokens) {
  const text = normalizeOverviewText(value);
  return tokens.some((token) => text.includes(normalizeOverviewText(token)));
}

export function arraysEqualAsSet(actual, expected) {
  const actualSet = new Set((actual || []).filter(Boolean));
  if (actualSet.size !== expected.length) return false;
  return expected.every((item) => actualSet.has(item));
}

export const MAWANG_Q1_CHARACTERS = ['해설자', '아버지', '아들', '마왕'];

/** Q1 — 표준 이름 + 허용 동의어(칸마다 하나씩, 네 역할 모두 있어야 함) */
export const MAWANG_Q1_ROLE_ALIASES = {
  해설자: ['해설자', '내레이션', '나레이션'],
  아버지: ['아버지', '아빠'],
  아들: ['아들', '아이'],
  마왕: ['마왕']
};

/**
 * Q2 줄거리 — 네 가지 핵심 축(각 축마다 동의어 하나 이상).
 * 모두 포함되면 정답. 서술 방식·문장 순서는 달라도 됨.
 */
export const MAWANG_Q2_KEYWORD_GROUPS = [
  { id: 'father', label: '아버지', keywords: ['아버지', '아빠'] },
  { id: 'son', label: '아들', keywords: ['아들', '아이'] },
  { id: 'erlkonig', label: '마왕', keywords: ['마왕'] },
  { id: 'death', label: '결말(죽음)', keywords: ['죽', '죽음', '죽어'] }
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
      return n === a || n.includes(a);
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
const HAYDN_Q1_INSTRUMENTS = ['제1바이올린', '제2바이올린', '비올라', '첼로'];
const SCHOENBERG_Q1_INSTRUMENTS = [
  '소프라노(또는 메조소프라노)',
  '플루트',
  '클라리넷',
  '바이올린',
  '첼로',
  '피아노'
];

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

/** @returns {boolean | null} null when the song has no overview Q1 */
export function gradeOverviewQ1(song, data) {
  const chars = (data.analyticalCharacters || []).filter(Boolean);
  switch (song) {
    case 'mawang':
      return gradeMawangOverviewQ1(chars);
    case 'handel':
      return includesAnyToken(data.handelLyricMeaning, ['성경', '종교']);
    case 'haydn':
      return arraysEqualAsSet(chars, HAYDN_Q1_INSTRUMENTS);
    case 'vivaldi':
      return includesAnyToken(getOverviewStudentQ1(song, data), ['폭풍', '폭풍우']);
    case 'chopin':
      return includesAnyToken(chars[0], ['피아노']);
    case 'schoenberg':
      return arraysEqualAsSet(chars, SCHOENBERG_Q1_INSTRUMENTS);
    default:
      return null;
  }
}

/** @returns {boolean | null} null when the song has no overview Q2 */
export function gradeOverviewQ2(song, data) {
  if (!hasOverviewQ2(song)) return null;
  switch (song) {
    case 'mawang':
      return gradeMawangOverviewQ2(data.analyticalStory);
    case 'handel':
      return includesAnyToken(data.handelOperaDiff, ['오라토리오', '오페라']);
    case 'haydn':
      return normalizeOverviewText(data.analyticalStory) === '종달새';
    case 'chopin':
      return includesAnyToken(data.analyticalStory, ['빠르고', '서정']);
    case 'schoenberg':
      return includesAnyToken(data.analyticalStory, ['불안', '몽환']);
    default:
      return null;
  }
}
