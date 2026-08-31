import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import OverviewAnswerCheckBlock from '../OverviewAnswerCheckBlock';

const ERLKONIG_OVERVIEW_Q2_HINT = '등장인물과 사건을 "처음-중간-끝" 순서로 짧게 써 보세요.';
const hallelujahPromptHints = [
  '"할렐루야"가 몇 번 반복되는지 느낌대로 써보세요.',
  '노래가 작게 시작해서 크게 커지는 부분을 써보세요.',
  '같은 "할렐루야"가 다르게 들린 이유를 한 줄로 써보세요.'
];

function AnalyticalOverview({ go }) {
  const selectedSong = useAppStore((s) => s.selectedSong);
  const isMawang = selectedSong === 'mawang';
  const isHaydn = selectedSong === 'haydn';
  const isErlkonig = isMawang;
  const aiOpen = useAppStore((s) => s.aiOpen);
  const toggleAi = useAppStore((s) => s.toggleAi);
  const characters = useAppStore((s) => s.analyticalCharacters);
  const story = useAppStore((s) => s.analyticalStory);
  const setAnalyticalCharacter = useAppStore((s) => s.setAnalyticalCharacter);
  const setAnalyticalStory = useAppStore((s) => s.setAnalyticalStory);
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);

  const [storyHint, setStoryHint] = useState(hallelujahPromptHints[0]);
  const promptHints = hallelujahPromptHints;
  const q1Title = isHaydn
    ? '1. 이 음악을 연주하는 악기들은 무엇일까요?'
    : (isErlkonig ? '1. 등장인물 4명을 적어보세요' : '1. 핵심 음악 요소 4가지를 적어보세요');
  const q2Title = isHaydn
    ? '2. 이 음악은 어떤 동물을 떠올리게 하나요? 그 이유는 무엇인가요?'
    : (isErlkonig ? '2. 줄거리' : '2. 곡의 전개와 분위기');
  const q1Placeholder = isHaydn ? '악기 이름을 적어보세요' : '등장인물';
  const q2Placeholder = isHaydn ? '' : (isErlkonig ? '마왕의 줄거리를 써보세요...' : '할렐루야의 전개와 분위기를 써보세요...');
  const q1AllFilled = useMemo(() => characters.every((c) => typeof c === 'string' && c.trim().length > 0), [characters]);
  const q2AllFilled = useMemo(() => typeof story === 'string' && story.trim().length > 0, [story]);
  const isAllFilled = q1AllFilled && q2AllFilled;
  const overviewData = { analyticalCharacters: characters, analyticalStory: story };
  const overviewSong = isHaydn ? 'haydn' : 'mawang';

  const overviewResponseKey = useMemo(
    () => JSON.stringify({
      song: overviewSong,
      characters: characters.map((c) => String(c || '').trim()),
      story: String(story || '').trim()
    }),
    [overviewSong, characters, story]
  );

  const showRandomStoryHint = () => {
    const next = promptHints[Math.floor(Math.random() * promptHints.length)];
    setStoryHint(next);
    if (!aiOpen.story) toggleAi('story');
  };

  return (
    <div className="screen active">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2 · 분석적 감상</div>
        <div className="s-title">분석적 감상</div>
        <div className="s-desc">목표: 음악 요소, 음악적 특징 및 구성을 분석하고 비교하여 음악이 어떻게 표현되고 구성되는지 파악해 보세요.</div>
      </div>
      <div className="body">

        <div className="sec">{q1Title}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {characters.map((character, idx) => (
            <input
              key={idx}
              className="txt"
              style={{ minHeight: 'auto', resize: 'none' }}
              value={character}
              onChange={(e) => setAnalyticalCharacter(idx, e.target.value)}
              placeholder={isHaydn ? `악기 ${idx + 1}` : `${q1Placeholder} ${idx + 1}`}
            />
          ))}
        </div>

        <div className="sec">{q2Title}</div>
        <textarea
          className="txt"
          value={story}
          onChange={(e) => setAnalyticalStory(e.target.value)}
          placeholder={q2Placeholder}
        />
        {isErlkonig ? (
          <div className="small-note" style={{ marginTop: 8, marginBottom: 10, lineHeight: 1.55 }}>
            작성 힌트: {ERLKONIG_OVERVIEW_Q2_HINT}
          </div>
        ) : null}
        {!isHaydn && !isErlkonig ? (
          <>
            <button className="ai-btn" onClick={showRandomStoryHint}>✨ 참고 예시 보기</button>
            <div className="small-note">버튼을 다시 누르면 질문이 랜덤으로 바뀝니다.</div>
            <div className={`ai-bubble ${aiOpen.story ? 'show' : ''}`}>
              <div className="ai-bubble-label">참고 예시 (정답 아님 · 그대로 복사 금지)</div>
              {storyHint}
            </div>
          </>
        ) : null}

        {isAllFilled ? (
          <OverviewAnswerCheckBlock
            key={overviewResponseKey}
            song={overviewSong}
            data={overviewData}
            onResult={() => setStageCompletion('analytical', true)}
          />
        ) : null}

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
