import {
  getOverviewReferenceQ1,
  getOverviewReferenceQ2,
  getOverviewStudentQ1,
  getOverviewStudentQ2,
  gradeOverviewQ1,
  gradeOverviewQ2,
  hasOverviewQ2,
  MAWANG_Q1_CHARACTERS
} from './overviewGrading';

const clean = (v) => (typeof v === 'string' ? v.trim() : '');

export const OVERVIEW_QUESTION_LABELS = {
  mawang: {
    q1: '1. 등장인물 4명',
    q2: '2. 줄거리'
  },
  handel: {
    q1: '1. 이 음악의 가사는 어떤 내용인가요?',
    q2: '2. 이 음악은 오페라와 어떤 차이가 있나요?'
  },
  haydn: {
    q1: '1. 이 음악을 연주하는 악기들은 무엇일까요?',
    q2: '2. 이 음악은 어떤 동물을 떠올리게 하나요? 그 이유는 무엇인가요?'
  },
  vivaldi: {
    q1: '1. 소네트를 보고, 이 곡에서 묘사하는 내용이 무엇인지 적어보세요.'
  },
  chopin: {
    q1: '1. 이 음악을 연주하는 악기는 무엇인가요?',
    q2: '2. 이 음악의 전체적인 분위기는 어떤가요? 곡을 들으며 느낌이 바뀌는 부분이 있었나요?'
  },
  schoenberg: {
    q1: '1. 이 음악을 연주하는 악기들(또는 연주 형태)과 성악가의 성종(성부)은?',
    q2: '2. 이 음악의 전체적인 분위기는 어떤가요?'
  }
};

function formatStudentQ1(song, data) {
  const chars = data.analyticalCharacters || [];
  if (song === 'mawang') {
    const lines = MAWANG_Q1_CHARACTERS.map((label, idx) => {
      const value = clean(chars[idx]);
      return `${label}: ${value || '—'}`;
    });
    return lines.join('\n');
  }
  if (song === 'haydn') {
    const lines = ['제1바이올린', '제2바이올린', '비올라', '첼로'].map((label, idx) => {
      const value = clean(chars[idx]);
      return `${label}: ${value || '—'}`;
    });
    return lines.join('\n');
  }
  const text = getOverviewStudentQ1(song, data);
  return text || '입력 없음';
}

function formatStudentQ2(song, data) {
  const text = getOverviewStudentQ2(song, data);
  return text || '입력 없음';
}

/**
 * 음악의 구성 — 맨 끝 「정답 확인하기」용 비교 항목
 * @returns {{ id: string, title: string, student: string, reference: string, isCorrect: boolean | null }[]}
 */
export function buildOverviewAnswerReveal(song, data) {
  const labels = OVERVIEW_QUESTION_LABELS[song];
  if (!labels) return [];

  const items = [];
  const q1Grade = gradeOverviewQ1(song, data);
  items.push({
    id: 'q1',
    title: labels.q1,
    student: formatStudentQ1(song, data),
    reference: getOverviewReferenceQ1(song),
    isCorrect: q1Grade
  });

  if (hasOverviewQ2(song) && labels.q2) {
    const q2Grade = gradeOverviewQ2(song, data);
    items.push({
      id: 'q2',
      title: labels.q2,
      student: formatStudentQ2(song, data),
      reference: getOverviewReferenceQ2(song),
      isCorrect: q2Grade
    });
  }

  return items;
}
