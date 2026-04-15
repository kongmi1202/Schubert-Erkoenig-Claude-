import { useCallback, useEffect, useMemo, useState } from 'react';
import CompareAiFeedbackBlock from '../CompareAiFeedbackBlock';
import { generateAnalyticalCompareFeedback } from '../../lib/compareFeedback';
import { useAppStore } from '../../store/useAppStore';

const correctCharactersErlkonig = ['해설자', '아버지', '아들', '마왕'];
const correctStoryErlkonig = '폭풍우 치는 밤, 아버지가 아픈 아들을 가슴에 안고 집으로 달려간다. 아들은 마왕의 유혹을 두려워하지만 아버지는 이를 부정한다. 집에 도착했을 때 아들은 이미 죽어 있다.';
const correctCharactersHallelujah = ['후렴(Hallelujah) 반복', '합창의 층위', '장조 화성', '점층적 전개'];
const correctStoryHallelujah = '할렐루야는 후렴이 반복되며 합창 성부가 점층적으로 쌓이고, 장조 화성과 오케스트라가 장엄한 예배적 분위기를 만든다.';
const colorMap = {
  '짙은 보라': '#4c1d95',
  '어두운 붉은색': '#991b1b',
  '짙은 남색': '#1e3a8a',
  검정: '#374151',
  '어두운 황토': '#a16207',
  '어두운 초록': '#166534',
  갈색: '#92400e',
  자주: '#86198f'
};
const storyPromptHints = [
  '줄거리를 "처음-중간-끝"으로 나누지 말고, 가장 긴장된 순간부터 거꾸로 설명해볼래?',
  '이야기의 핵심 갈등을 한 문장으로 쓰고, 그 이유를 한 문장으로 덧붙여봐.',
  '등장인물 입장에서 각각 한 줄씩 말풍선을 만든다면 어떤 말이 나올까?',
  '해설자가 이 장면을 뉴스처럼 전달한다면 어떤 표현을 쓸까?',
  '결말을 모르는 친구에게 스포일러 없이 분위기만 전달한다면 어떻게 쓸래?'
];
const hallelujahPromptHints = [
  '후렴이 어떻게 반복되는지(짧게-길게, 단순-풍성) 순서대로 적어볼래?',
  '혼자 부르는 느낌에서 합창으로 커지는 순간을 한 문장으로 써봐.',
  '같은 "할렐루야"가 왜 다르게 들리는지 화성/성부 관점으로 적어봐.'
];

function AnalyticalOverview({ go }) {
  const selectedSong = useAppStore((s) => s.selectedSong);
  const isErlkonig = selectedSong !== 'handel' && selectedSong !== 'hallelujah';
  const selectedKeywords = useAppStore((s) => s.selectedKeywords);
  const selectedColors = useAppStore((s) => s.selectedColors);
  const sensoryDesc = useAppStore((s) => s.sensoryDesc);
  const sensoryArtifacts = useAppStore((s) => s.sensoryArtifacts);
  const aiOpen = useAppStore((s) => s.aiOpen);
  const toggleAi = useAppStore((s) => s.toggleAi);
  const characters = useAppStore((s) => s.analyticalCharacters);
  const story = useAppStore((s) => s.analyticalStory);
  const setAnalyticalCharacter = useAppStore((s) => s.setAnalyticalCharacter);
  const setAnalyticalStory = useAppStore((s) => s.setAnalyticalStory);
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);

  const answerCheckOpen = useAppStore((s) => s.answerCheckOpen);
  const setAnswerCheckOpen = useAppStore((s) => s.setAnswerCheckOpen);
  const [storyHint, setStoryHint] = useState(storyPromptHints[0]);
  const correctCharacters = isErlkonig ? correctCharactersErlkonig : correctCharactersHallelujah;
  const correctStory = isErlkonig ? correctStoryErlkonig : correctStoryHallelujah;
  const promptHints = isErlkonig ? storyPromptHints : hallelujahPromptHints;

  // 사용자 입력을 전부 채웠을 때만 "정답 확인하기" 아이콘이 표시되도록 합니다.
  const q1AllFilled = useMemo(() => characters.every((c) => typeof c === 'string' && c.trim().length > 0), [characters]);
  const q2AllFilled = useMemo(() => typeof story === 'string' && story.trim().length > 0, [story]);
  const isAllFilled = q1AllFilled && q2AllFilled;

  const userCharactersText = useMemo(
    () => characters.filter((c) => c && c.trim()).join(', '),
    [characters]
  );

  const requestAnalyticalFeedback = useCallback(
    () =>
      generateAnalyticalCompareFeedback({
        userCharacterSlots: characters,
        userCharactersText,
        correctCharacters,
        userStory: story,
        correctStory
      }),
    [characters, userCharactersText, story]
  );

  useEffect(() => {
    if (!isAllFilled) setAnswerCheckOpen(false);
  }, [isAllFilled]);
  const showRandomStoryHint = () => {
    const next = promptHints[Math.floor(Math.random() * promptHints.length)];
    setStoryHint(next);
    if (!aiOpen.story) toggleAi('story');
  };

  return (
    <div className="screen active">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2-A · 분석적 감상</div>
        <div className="s-title">{isErlkonig ? '전체적인 개요 파악' : '할렐루야 구조 파악'}</div>
      </div>
      <div className="body">
        <div className="sec">1단계 감각적 감상 결과</div>
        <div className="review-card" style={{ marginBottom: 14 }}>
          <div className="review-grid">
            <div>
              <div className="review-section-title">감성 키워드</div>
              <div className="review-item">{selectedKeywords.join(', ') || '선택 없음'}</div>
            </div>
            <div>
              <div className="review-section-title">서술</div>
              <div className="review-item">{sensoryDesc || '서술 없음'}</div>
            </div>
          </div>
        </div>
        <div className="review-card">
          <div className="review-grid">
            <div>
              <div className="review-section-title">핵심 색상</div>
              <div className="swatch-row">
                {selectedColors.length
                  ? selectedColors.map((c) => <span key={c} className="review-swatch" style={{ background: colorMap[c] || '#555' }} title={c} />)
                  : <span className="review-empty">선택 없음</span>}
              </div>
              <div className="review-item" style={{ marginBottom: 0 }}>{selectedColors.length ? selectedColors.join(', ') : ''}</div>
            </div>
            <div>
              <div className="review-section-title">교과 연계 활동 선택</div>
              <div className="review-item">{sensoryArtifacts?.selectedActivities?.length ? sensoryArtifacts.selectedActivities.join(', ') : '선택 없음'}</div>
            </div>
          </div>

          <div className="artifact-grid">
            {sensoryArtifacts?.pePhoto ? (
              <div className="artifact-card">
                <div className="review-item">체육 사진</div>
                <img src={sensoryArtifacts.pePhoto} alt="체육 활동 사진" className="captured-img" />
                {sensoryArtifacts.peAnswer ? <div className="small-note">{sensoryArtifacts.peAnswer}</div> : null}
              </div>
            ) : null}
            {sensoryArtifacts?.scienceSelected?.length ? (
              <div className="artifact-card">
                <div className="review-item">과학 선택</div>
                <div className="chip-row">{sensoryArtifacts.scienceSelected.map((s) => <span key={s} className="review-chip">{s}</span>)}</div>
                {sensoryArtifacts.scienceAnswer ? <div className="small-note">{sensoryArtifacts.scienceAnswer}</div> : null}
              </div>
            ) : null}
            {sensoryArtifacts?.mapAddress ? (
              <div className="artifact-card">
                <div className="review-item">사회 선택 장소</div>
                <div className="map-address">{sensoryArtifacts.mapAddress}</div>
                {sensoryArtifacts.mapAnswer ? <div className="small-note">{sensoryArtifacts.mapAnswer}</div> : null}
              </div>
            ) : null}
            {sensoryArtifacts?.mathDrawing ? (
              <div className="artifact-card">
                <div className="review-item">수학 도형 그림</div>
                <img src={sensoryArtifacts.mathDrawing} alt="수학 활동 그림" className="captured-img" />
                {sensoryArtifacts.mathAnswer ? <div className="small-note">{sensoryArtifacts.mathAnswer}</div> : null}
              </div>
            ) : null}
          </div>
        </div>

        <div className="sec">{isErlkonig ? '마왕 해설 영상' : '할렐루야 해설 영상'}</div>
        <div className="video-wrap">
          <iframe src={isErlkonig ? 'https://www.youtube.com/embed/tgfmLln8zjg' : 'https://www.youtube.com/embed/usfiAsWR4qU'} title={isErlkonig ? '마왕 해설 영상' : '할렐루야 해설 영상'} allowFullScreen />
        </div>

        <div className="sec">{isErlkonig ? 'Q1. 등장인물 4명을 적어보세요' : 'Q1. 핵심 음악 요소 4가지를 적어보세요'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {characters.map((character, idx) => (
            <input
              key={idx}
              className="txt"
              style={{ minHeight: 'auto', resize: 'none' }}
              value={character}
              onChange={(e) => setAnalyticalCharacter(idx, e.target.value)}
              placeholder={`등장인물 ${idx + 1}`}
            />
          ))}
        </div>

        <div className="sec">{isErlkonig ? 'Q2. 줄거리' : 'Q2. 곡의 전개와 분위기'}</div>
        <textarea
          className="txt"
          value={story}
          onChange={(e) => setAnalyticalStory(e.target.value)}
          placeholder={isErlkonig ? '마왕의 줄거리를 써보세요...' : '할렐루야의 전개와 분위기를 써보세요...'}
        />
        <button className="ai-btn" onClick={showRandomStoryHint}>✨ 생각 질문 보기</button>
        <div className="small-note">버튼을 다시 누르면 질문이 랜덤으로 바뀝니다.</div>
        <div className={`ai-bubble ${aiOpen.story ? 'show' : ''}`}>
          <div className="ai-bubble-label">생각 질문 (정답 아님 · 그대로 복사 금지)</div>
          {storyHint}
        </div>

        {isAllFilled ? (
          <button type="button" className="answer-check-toggle" onClick={() => { setAnswerCheckOpen(!answerCheckOpen); setStageCompletion('analytical', true); }} aria-expanded={answerCheckOpen}>
            <span className="answer-check-toggle-label">정답 확인하기</span>
            <span className="answer-check-toggle-chevron" aria-hidden="true">
              {answerCheckOpen ? '▲' : '▼'}
            </span>
          </button>
        ) : null}

        <div className={`answer-compare-slide ${answerCheckOpen ? 'open' : ''}`}>
          <div className="answer-compare-inner">
            <div className="sec">{isErlkonig ? 'Q1. 등장인물 비교' : 'Q1. 핵심 요소 비교'}</div>
            <div className="review-card">
              <div className="review-grid">
                <div>
                  <div className="review-section-title">내 답변</div>
                  <div className="review-item">{characters.filter((c) => c && c.trim()).join(', ') || '입력 없음'}</div>
                </div>
                <div>
                  <div className="review-section-title">정답</div>
                  <div className="review-item">{correctCharacters.join(', ')}</div>
                </div>
              </div>
            </div>

            <div className="sec">{isErlkonig ? 'Q2. 줄거리 비교' : 'Q2. 전개/분위기 비교'}</div>
            <div className="review-card">
              <div className="review-section-title">내 답변</div>
              <div className="review-item" style={{ marginBottom: 14 }}>{story.trim() || '입력 없음'}</div>
              <div className="review-section-title">정답</div>
              <div className="review-item">{correctStory}</div>
            </div>

            <CompareAiFeedbackBlock requestFn={requestAnalyticalFeedback} />
          </div>
        </div>

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('sensoryPage')}>← 이전</button>
          <button
            className="btn-p"
            disabled={!isAllFilled}
            style={!isAllFilled ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            onClick={() => go('voiceDesign')}
          >
            다음 단계 →
          </button>
        </div>
      </div>
    </div>
  );
}

export default AnalyticalOverview;
