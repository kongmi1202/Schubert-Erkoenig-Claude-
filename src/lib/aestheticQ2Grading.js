import { includesAnyToken } from './overviewGrading';

/**
 * 3단계 Q2 — Sadler V1(형식적 근거) × V2(가치 판단)
 * A: V1=2,V2=2→✓ | B: V1=2,V2≤1→△ | C: V1≤1,V2=2→△ | D: 그 외→✗
 */

const VALUE_STRONG = [
  '특별', '가치', '왜', '때문', '좋게', '매력', '의미', '효과', '돋보', '조화',
  '전달', '표현', '연결', '만들어', '느껴', '느낌', '인상', '중요', '어울'
];

const VALUE_CONNECTION = [
  '때문', '그래서', '덕분', '연결', '만들', '느껴', '표현', '전달', '왜', '특별', '가치'
];

const VALUE_WEAK = ['신기', '재미', '좋아', '멋', '대단', '즐거', '재밌', '흥미', '인상적'];

const V1_BY_TYPE = {
  음색: {
    groups: [
      ['음색', '목소리', '성부'],
      ['아버지', '아들', '마왕', '해설', '인물', '4명', '다른', '한명'],
      ['선율', '두꺼', '얇', '낮', '높', '음계', '장조', '단조']
    ],
    minimum: ['음색', '목소리', '가수', '인물']
  },
  반주: {
    groups: [
      ['반주', '피아노'],
      ['오른손', '왼손', '손'],
      ['장면', '리듬', '몰아치', '달리', '폭풍', '말']
    ],
    minimum: ['반주', '피아노']
  },
  음화법: {
    groups: [
      ['음화', '가사', '선율', '음색'],
      ['반복', '음높', '할렐루야', '장면'],
      ['대비', '어울', '맞']
    ],
    minimum: ['음화', '가사', '선율']
  },
  화성다성음악: {
    groups: [
      ['화성', '다성', '성부', '네성부', '4성부'],
      ['함께', '어울', '겹', '조화', '같이', '동시'],
      ['번갈아', '교대', '나누', '겹쳐', '대비', '선율', '리듬']
    ],
    minimum: ['화성', '다성', '성부']
  },
  현악음색: {
    groups: [
      ['바이올린', '비올라', '첼로', '현악'],
      ['주선율', '중성', '베이스', '음역', '역할'],
      ['음색', '선율', '어울']
    ],
    minimum: ['바이올린', '현악', '음색']
  },
  주제비교: {
    groups: [
      ['제1', '제2', '주제', '1주제', '2주제'],
      ['선율', '리듬', '느낌', '대비'],
      ['조성', '음계', '움직']
    ],
    minimum: ['주제', '제1', '제2']
  },
  슈프레흐슈팀메: {
    groups: [
      ['슈프레', '말하기', '노래'],
      ['피에로', '경계', '반쯤'],
      ['분위기', '표현', '긴장']
    ],
    minimum: ['슈프레', '말하기', '노래', '피에로']
  },
  무조성: {
    groups: [
      ['무조', '조성'],
      ['안정', '긴장', '낯설', '불안'],
      ['어울', '따로', '화음', '소리']
    ],
    minimum: ['무조', '조성', '안정', '긴장']
  },
  소네트: {
    groups: [
      ['소네트', '표제', '시'],
      ['장면', '묘사', '폭풍', '비'],
      ['음악', '셈여림', '빠르', '느리', '리듬']
    ],
    minimum: ['소네트', '표제', '시']
  },
  바이올린협주곡: {
    groups: [
      ['협주', '독주', '총주', '바이올린'],
      ['앙상블', '오케스트라', '형식'],
      ['대비', '어울', '선율']
    ],
    minimum: ['협주', '바이올린', '독주']
  },
  ABA형식: {
    groups: [
      ['aba', '형식', 'a구간', 'b구간', '앞', '가운데', '뒤'],
      ['대비', '다르', '빠르', '느리', '셈여림'],
      ['비슷', '같', '돌아', '반복', '유사']
    ],
    minimum: ['aba', '형식', '구간', 'a', 'b']
  },
  폴리리듬: {
    groups: [
      ['폴리', '리듬', '양손', '겹'],
      ['오른손', '왼손', '손'],
      ['박자', '긴장', '추진', '분위기']
    ],
    minimum: ['리듬', '폴리', '오른손', '왼손']
  },
  맥락: {
    groups: [
      ['시대', '역사', '맥락', '당시', '배경'],
      ['작곡', '사회', '종교', '문화'],
      ['음악', '곡', '표현', '의미']
    ],
    minimum: ['시대', '역사', '맥락', '배경']
  }
};

function countGroupHits(text, groups) {
  return groups.filter((group) => group.some((token) => includesAnyToken(text, [token]))).length;
}

export function scoreAestheticV1(q2Type, q2) {
  const text = String(q2 || '').trim();
  if (!text) return 0;

  const rubric = V1_BY_TYPE[q2Type];
  if (!rubric) {
    const genericHits = countGroupHits(text, [
      ['음악', '소리', '선율', '리듬', '음색', '형식', '화성'],
      ['들', '느낌', '구간', '장면', '대비']
    ]);
    if (genericHits >= 2 && text.length >= 25) return 2;
    if (genericHits >= 1 && text.length >= 15) return 1;
    return 0;
  }

  const groupHits = countGroupHits(text, rubric.groups);
  if (groupHits >= 2) return 2;
  if (groupHits >= 1) return 1;
  if (rubric.minimum.some((token) => includesAnyToken(text, [token]))) return 1;
  return 0;
}

export function scoreAestheticV2(q2) {
  const text = String(q2 || '').trim();
  if (!text) return 0;

  const strongHits = VALUE_STRONG.filter((token) => includesAnyToken(text, [token])).length;
  const hasConnection = VALUE_CONNECTION.some((token) => includesAnyToken(text, [token]));
  const hasWeakReaction = VALUE_WEAK.some((token) => includesAnyToken(text, [token]));

  if (strongHits >= 2 || (strongHits >= 1 && hasConnection && text.length >= 20)) return 2;
  if (strongHits >= 1 || (hasWeakReaction && text.length >= 12)) return 1;
  return 0;
}

export function getAestheticQ2Path(v1, v2) {
  if (v1 === 2 && v2 === 2) return 'A';
  if (v1 === 2 && v2 <= 1) return 'B';
  if (v1 <= 1 && v2 === 2) return 'C';
  return 'D';
}

export function markFromAestheticPath(path) {
  if (path === 'A') return '✓';
  if (path === 'B' || path === 'C') return '△';
  return '✗';
}

const PATH_GUIDES = {
  A: '고른 음악 요소의 특징(근거)과 이 곡의 가치 판단을 잘 연결했어요. 같은 요소로 곡을 한 번 더 들어 보세요.',
  B: '음악 요소의 특징(2단계에서 배운 근거)은 잘 짚었어요. 그 특징이 이 곡을 왜 특별하게 만드는지, 나의 가치 판단을 한두 문장 더 써 보세요.',
  C: '가치를 평가하려는 방향은 좋아요. 어떤 음악적 특징(2단계에서 배운 요소)이 그런 느낌·판단으로 이어졌는지 근거를 더 넣어 보세요.',
  D: '가치 평가는 음악의 특징과 나의 느낌·판단을 연결해야 해요. 고른 요소 하나를 정해, 어떻게 들리는지와 왜 가치 있다고 보는지 함께 써 보세요.'
};

const PATH_PROMPTS = {
  A: '근거와 가치 판단이 모두 충족됐어요. 학생이 고른 요소와 답을 짧게 반영하며 칭찬하되 모범 감상문을 베끼지 말 것.',
  B: '근거(V1)는 충족, 가치 판단(V2)이 미흡이에요. 이미 쓴 음악적 특징을 인정한 뒤, 그 특징이 곡의 가치와 어떻게 연결되는지 쓰도록 안내하세요.',
  C: '가치 판단(V2)은 충족, 근거(V1)가 미흡이에요. 평가 방향은 인정하고, 어떤 음악 요소·특징이 그 판단의 근거인지 짚도록 안내하세요.',
  D: '근거와 가치 판단이 모두 미흡이에요. 고른 요소의 특징 + 가치 연결을 함께 쓰도록 안내하세요. 정답 문장 암시 금지.'
};

export function evaluateAestheticQ2({ q2Type, q2 }) {
  const text = String(q2 || '').trim();
  if (!q2Type || text.length < 10) {
    return { v1: 0, v2: 0, path: 'D', mark: '✗', guide: PATH_GUIDES.D, pathPrompt: PATH_PROMPTS.D };
  }

  const v1 = scoreAestheticV1(q2Type, text);
  const v2 = scoreAestheticV2(text);
  const path = getAestheticQ2Path(v1, v2);
  const mark = markFromAestheticPath(path);

  return { v1, v2, path, mark, guide: PATH_GUIDES[path], pathPrompt: PATH_PROMPTS[path] };
}
