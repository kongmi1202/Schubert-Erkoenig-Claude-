import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import SensoryStage1Review from '../SensoryStage1Review';

const correctCharactersErlkonig = ['해설자', '아버지', '아들', '마왕'];
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
  const overviewTitle = isHaydn ? '종달새 개요 파악' : (isErlkonig ? '전체적인 개요 파악' : '할렐루야 구조 파악');
  const overviewVideoSrc = isHaydn
    ? 'https://www.youtube.com/embed/BGX6u2NJxuM?start=0&end=28'
    : (isHandel ? 'https://www.youtube.com/embed/hIQ37oUDNYg' : 'https://www.youtube.com/embed/tgfmLln8zjg');
  const overviewVideoTitle = isHaydn ? '종달새 개요 영상' : (isErlkonig ? '마왕 해설 영상' : '할렐루야 해설 영상');
  const q1Title = isHaydn
    ? 'Q1. 이 음악을 연주하는 악기들은 무엇일까요?'
    : (isErlkonig ? 'Q1. 등장인물 4명을 적어보세요' : 'Q1. 핵심 음악 요소 4가지를 적어보세요');
  const q2Title = isHaydn
    ? 'Q2. 이 음악은 어떤 동물을 떠올리게 하나요? 그 이유는 무엇인가요?'
    : (isErlkonig ? 'Q2. 줄거리' : 'Q2. 곡의 전개와 분위기');
  const q1Placeholder = isHaydn ? '악기 이름을 적어보세요' : `등장인물`;
  const q2Placeholder = isHaydn ? '' : (isErlkonig ? '마왕의 줄거리를 써보세요...' : '할렐루야의 전개와 분위기를 써보세요...');
  const haydnPlayerHostRef = useRef(null);
  const haydnPlayerRef = useRef(null);
  const haydnWatchRef = useRef(null);

  // 사용자 입력을 전부 채웠을 때만 "정답 확인하기" 아이콘이 표시되도록 합니다.
  const q1AllFilled = useMemo(() => characters.every((c) => typeof c === 'string' && c.trim().length > 0), [characters]);
  const q2AllFilled = useMemo(() => typeof story === 'string' && story.trim().length > 0, [story]);
  const isAllFilled = q1AllFilled && q2AllFilled;

  const canOpenAnswerCheck = isAllFilled;

  useEffect(() => {
    if (!isAllFilled) setAnswerCheckOpen(false);
  }, [isAllFilled]);

  useEffect(() => {
    if (!isHaydn) return undefined;
    let cancelled = false;
    const stopWatcher = () => {
      if (haydnWatchRef.current) {
        window.clearInterval(haydnWatchRef.current);
        haydnWatchRef.current = null;
      }
    };
    const startWatcher = () => {
      stopWatcher();
      haydnWatchRef.current = window.setInterval(() => {
        const player = haydnPlayerRef.current;
        if (!player || typeof player.getCurrentTime !== 'function') return;
        const current = player.getCurrentTime();
        if (current >= 28) {
          player.pauseVideo();
          player.seekTo(0, true);
        }
      }, 200);
    };
    const createPlayer = () => {
      if (cancelled || !haydnPlayerHostRef.current || haydnPlayerRef.current) return;
      if (!window.YT || !window.YT.Player) return;
      haydnPlayerRef.current = new window.YT.Player(haydnPlayerHostRef.current, {
        videoId: 'BGX6u2NJxuM',
        playerVars: {
          start: 0,
          end: 28,
          rel: 0,
          playsinline: 1,
          modestbranding: 1
        },
        events: {
          onReady: (event) => {
            const iframe = event.target.getIframe();
            iframe.style.width = '100%';
            iframe.style.height = '100%';
          },
          onStateChange: (event) => {
            const state = window.YT?.PlayerState;
            if (state && event.data === state.PLAYING) startWatcher();
            else stopWatcher();
          }
        }
      });
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const prevReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevReady === 'function') prevReady();
        createPlayer();
      };
      if (!document.getElementById('youtube-iframe-api')) {
        const script = document.createElement('script');
        script.id = 'youtube-iframe-api';
        script.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      stopWatcher();
      if (haydnPlayerRef.current && typeof haydnPlayerRef.current.destroy === 'function') {
        haydnPlayerRef.current.destroy();
      }
      haydnPlayerRef.current = null;
    };
  }, [isHaydn]);

  const showRandomStoryHint = () => {
    const next = promptHints[Math.floor(Math.random() * promptHints.length)];
    setStoryHint(next);
    if (!aiOpen.story) toggleAi('story');
  };

  return (
    <div className="screen active">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2-A · 분석적 감상</div>
        <div className="s-title">{overviewTitle}</div>
      </div>
      <div className="body">
        <SensoryStage1Review />

        <div className="sec">{isHaydn ? '종달새 개요 영상' : (isErlkonig ? '마왕 해설 영상' : '할렐루야 해설 영상')}</div>
        <div className="video-wrap">
          {isHaydn ? (
            <div ref={haydnPlayerHostRef} style={{ width: '100%', height: '100%' }} />
          ) : (
            <iframe src={overviewVideoSrc} title={overviewVideoTitle} allowFullScreen />
          )}
        </div>

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
          <button
            type="button"
            className="answer-check-toggle"
            onClick={() => { setAnswerCheckOpen(!answerCheckOpen); setStageCompletion('analytical', true); }}
            aria-expanded={answerCheckOpen}
            disabled={!canOpenAnswerCheck}
          >
            <span className="answer-check-toggle-label">정답 확인하기</span>
            <span className="answer-check-toggle-chevron" aria-hidden="true">
              {answerCheckOpen ? '▲' : '▼'}
            </span>
          </button>
        ) : null}

        <div className={`answer-compare-slide ${canOpenAnswerCheck && answerCheckOpen ? 'open' : ''}`}>
          <div className="answer-compare-inner">
            <div className="sec">{isHaydn ? 'Q1. 악기 비교' : (isErlkonig ? 'Q1. 등장인물 비교' : 'Q1. 핵심 요소 비교')}</div>
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

            <div className="sec">{isHaydn ? 'Q2. 떠오르는 동물 비교' : (isErlkonig ? 'Q2. 줄거리 비교' : 'Q2. 전개/분위기 비교')}</div>
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
