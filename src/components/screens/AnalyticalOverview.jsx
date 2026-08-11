import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import CompareAiFeedbackBlock from '../CompareAiFeedbackBlock';
import {
  canOpenAnswerAfterFormativeAiGate,
  generateMawangOverviewFeedback
} from '../../lib/compareFeedback';
import {
  evaluateMawangOverviewQ1,
  evaluateMawangOverviewQ2,
  MAWANG_Q1_CHARACTERS,
  MAWANG_Q1_ROLE_ALIASES
} from '../../lib/overviewGrading';

const correctCharactersErlkonig = MAWANG_Q1_CHARACTERS;
const correctStoryErlkonig = '폭풍우 치는 밤, 아버지가 아픈 아들을 가슴에 안고 집으로 달려간다. 아들은 마왕의 유혹을 두려워하지만 아버지는 이를 부정한다. 집에 도착했을 때 아들은 이미 죽어 있다.';
const correctCharactersHallelujah = ['후렴(Hallelujah) 반복', '합창의 층위', '장조 화성', '점층적 전개'];
const correctStoryHallelujah = '할렐루야는 후렴이 반복되며 합창 성부가 점층적으로 쌓이고, 장조 화성과 오케스트라가 장엄한 예배적 분위기를 만든다.';
const ERLKONIG_OVERVIEW_Q2_HINT = '등장인물과 사건을 "처음-중간-끝" 순서로 짧게 써 보세요.';
const hallelujahPromptHints = [
  '"할렐루야"가 몇 번 반복되는지 느낌대로 써보세요.',
  '노래가 작게 시작해서 크게 커지는 부분을 써보세요.',
  '같은 "할렐루야"가 다르게 들린 이유를 한 줄로 써보세요.'
];
function AnalyticalOverview({ go }) {
  const selectedSong = useAppStore((s) => s.selectedSong);
  const isMawang = selectedSong === 'mawang';
  const isHandel = selectedSong === 'handel';
  const isHaydn = selectedSong === 'haydn';
  const isErlkonig = isMawang;
  const aiOpen = useAppStore((s) => s.aiOpen);
  const toggleAi = useAppStore((s) => s.toggleAi);
  const characters = useAppStore((s) => s.analyticalCharacters);
  const story = useAppStore((s) => s.analyticalStory);
  const setAnalyticalCharacter = useAppStore((s) => s.setAnalyticalCharacter);
  const setAnalyticalStory = useAppStore((s) => s.setAnalyticalStory);
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);

  const answerCheckOpen = useAppStore((s) => s.answerCheckOpen);
  const setAnswerCheckOpen = useAppStore((s) => s.setAnswerCheckOpen);
  const [storyHint, setStoryHint] = useState(hallelujahPromptHints[0]);
  const correctCharacters = isHaydn
    ? ['제1바이올린', '제2바이올린', '비올라', '첼로']
    : (isErlkonig ? correctCharactersErlkonig : correctCharactersHallelujah);
  const correctStory = isHaydn
    ? '종달새. 제1바이올린의 높고 가벼운 선율이 새의 지저귐처럼 들리기 때문이다.'
    : (isErlkonig ? correctStoryErlkonig : correctStoryHallelujah);
  const promptHints = hallelujahPromptHints;
  const q1Title = isHaydn
    ? '1. 이 음악을 연주하는 악기들은 무엇일까요?'
    : (isErlkonig ? '1. 등장인물 4명을 적어보세요' : '1. 핵심 음악 요소 4가지를 적어보세요');
  const q2Title = isHaydn
    ? '2. 이 음악은 어떤 동물을 떠올리게 하나요? 그 이유는 무엇인가요?'
    : (isErlkonig ? '2. 줄거리' : '2. 곡의 전개와 분위기');
  const q1Placeholder = isHaydn ? '악기 이름을 적어보세요' : `등장인물`;
  const q2Placeholder = isHaydn ? '' : (isErlkonig ? '마왕의 줄거리를 써보세요...' : '할렐루야의 전개와 분위기를 써보세요...');
  // 사용자 입력을 전부 채웠을 때만 "정답 확인하기" 아이콘이 표시되도록 합니다.
  const q1AllFilled = useMemo(() => characters.every((c) => typeof c === 'string' && c.trim().length > 0), [characters]);
  const q2AllFilled = useMemo(() => typeof story === 'string' && story.trim().length > 0, [story]);
  const isAllFilled = q1AllFilled && q2AllFilled;

  const [overviewAiGate, setOverviewAiGate] = useState({
    feedbackCompleted: false,
    responseAtFeedback: '',
    wasCorrectWhenFeedbackRequested: false
  });
  const overviewResponseKey = useMemo(
    () => JSON.stringify({
      characters: characters.map((c) => String(c || '').trim()),
      story: String(story || '').trim()
    }),
    [characters, story]
  );
  const mawangOverviewCorrect = useMemo(() => {
    if (!isErlkonig) return false;
    return evaluateMawangOverviewQ1(characters).isCorrect
      && evaluateMawangOverviewQ2(story).isCorrect;
  }, [isErlkonig, characters, story]);
  const canOpenAnswerCheckWithFeedback = isErlkonig
    ? isAllFilled
      && overviewAiGate.feedbackCompleted
      && canOpenAnswerAfterFormativeAiGate({
        feedbackCompleted: overviewAiGate.feedbackCompleted,
        wasCorrectWhenFeedbackRequested: overviewAiGate.wasCorrectWhenFeedbackRequested,
        responseAtFeedback: overviewAiGate.responseAtFeedback,
        currentResponse: overviewResponseKey
      })
    : isAllFilled;

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

        {isErlkonig && isAllFilled ? (
          <div className="compare-ai-feedback" style={{ marginTop: 12, marginBottom: 8 }}>
            <CompareAiFeedbackBlock
              key={`mawang-overview-fb-${overviewResponseKey}`}
              requestFn={() => generateMawangOverviewFeedback({
                userCharacterSlots: characters,
                userStory: story
              })}
              onRequested={() => {
                setOverviewAiGate({
                  feedbackCompleted: false,
                  responseAtFeedback: overviewResponseKey,
                  wasCorrectWhenFeedbackRequested: mawangOverviewCorrect
                });
              }}
              onResult={() => {
                setOverviewAiGate((prev) => ({ ...prev, feedbackCompleted: true }));
              }}
            />
          </div>
        ) : null}

        {isAllFilled ? (
          <button
            type="button"
            className="answer-check-toggle"
            onClick={() => { setAnswerCheckOpen(!answerCheckOpen); setStageCompletion('analytical', true); }}
            aria-expanded={answerCheckOpen}
            disabled={!canOpenAnswerCheckWithFeedback}
            style={!canOpenAnswerCheckWithFeedback ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          >
            <span className="answer-check-toggle-label">
              {canOpenAnswerCheckWithFeedback
                ? '정답 확인하기'
                : (isErlkonig ? '피드백 반영 후 정답 확인하기' : '정답 확인하기')}
            </span>
            <span className="answer-check-toggle-chevron" aria-hidden="true">
              {answerCheckOpen ? '▲' : '▼'}
            </span>
          </button>
        ) : null}

        <div className={`answer-compare-slide ${canOpenAnswerCheckWithFeedback && answerCheckOpen ? 'open' : ''}`}>
          <div className="answer-compare-inner">
            <div className="sec">{isHaydn ? '1. 악기 비교' : (isErlkonig ? '1. 등장인물 비교' : '1. 핵심 요소 비교')}</div>
            <div className="review-card">
              <div className="review-grid">
                <div>
                  <div className="review-section-title">내 답변</div>
                  <div className="review-item">{characters.filter((c) => c && c.trim()).join(', ') || '입력 없음'}</div>
                </div>
                <div>
                  <div className="review-section-title">정답</div>
                  <div className="review-item">
                    {correctCharacters.join(', ')}
                    {isErlkonig ? (
                      <>
                        <br />
                        <span className="small-note">({Object.entries(MAWANG_Q1_ROLE_ALIASES).map(([k, v]) => `${k}: ${v.filter((a) => a !== k).join('/') || k}`).join(' · ')})</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="sec">{isHaydn ? '2. 떠오르는 동물 비교' : (isErlkonig ? '2. 줄거리 비교' : '2. 전개/분위기 비교')}</div>
            <div className="review-card">
              <div className="review-section-title">내 답변</div>
              <div className="review-item" style={{ marginBottom: 14 }}>{story.trim() || '입력 없음'}</div>
              <div className="review-section-title">정답</div>
              <div className="review-item">{correctStory}</div>
            </div>
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
