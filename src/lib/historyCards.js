/** 곡별 역사 맥락 카드 id·제목 (최종 감상문 3단락 반영용) */
export const HISTORY_CARD_CATALOG = {
  mawang: [
    { id: 'fc1', title: '낭만 시대' },
    { id: 'fc2', title: '슈베르트' },
    { id: 'fc3', title: '괴테' },
    { id: 'fc4', title: '예술가곡' }
  ],
  handel: [
    { id: 'baroque', title: '바로크 시대' },
    { id: 'handel', title: '헨델' },
    { id: 'standing', title: '기립 전통' },
    { id: 'oratorio', title: '오라토리오' }
  ],
  haydn: [
    { id: 'hy-c1', title: '고전주의 시대' },
    { id: 'hy-c2', title: '하이든' },
    { id: 'hy-c3', title: '종달새' },
    { id: 'hy-c4', title: '소나타 형식' }
  ],
  schoenberg: [
    { id: 'sb-c1', title: '표현주의 시대' },
    { id: 'sb-c2', title: '쇤베르크' },
    { id: 'sb-c3', title: '뭉크와 칸딘스키' },
    { id: 'sb-c4', title: '달에 홀린 피에로' }
  ],
  vivaldi: [
    { id: 'vv-c1', title: '바로크 시대' },
    { id: 'vv-c2', title: '비발디' },
    { id: 'vv-c3', title: '사계' },
    { id: 'vv-c4', title: '바이올린 협주곡' }
  ],
  chopin: [
    { id: 'cp-c1', title: '낭만주의 시대' },
    { id: 'cp-c2', title: '쇼팽' },
    { id: 'cp-c3', title: '환상 즉흥곡' },
    { id: 'cp-c4', title: '즉흥곡' }
  ]
};

export function getFlippedHistoryCardIds(songId, flippedHistoryCardsBySong, legacyFlippedCards) {
  const fromStore = flippedHistoryCardsBySong?.[songId];
  if (fromStore?.length) return fromStore;
  if (songId === 'mawang' && legacyFlippedCards?.length) return legacyFlippedCards;
  return [];
}

export function getHistoryCardTitlesForSong(songId, flippedIds) {
  const catalog = HISTORY_CARD_CATALOG[songId];
  if (!catalog || !flippedIds?.length) return [];
  return flippedIds
    .map((id) => catalog.find((c) => c.id === id)?.title)
    .filter(Boolean);
}
