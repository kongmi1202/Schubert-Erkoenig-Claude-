import { useEffect, useMemo, useRef, useState } from 'react';
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
  '줄거리를 "처음-중간-끝" 순서로 짧게 써보세요.',
  '등장인물이 누구이고 무슨 일이 일어났는지 써보세요.',
  '가장 무서웠던 장면 1가지를 써보세요.',
  '아버지, 아들, 마왕 중 마음이 가장 느껴진 인물을 써보세요.',
  '결말에서 무슨 일이 있었는지 한 문장으로 써보세요.'
];
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
  const selectedKeywords = useAppStore((s) => s.selectedKeywords);
  const selectedColors = useAppStore((s) => s.selectedColors);
  const sensoryDesc = useAppStore((s) => s.sensoryDesc);
  const emotionResult = useAppStore((s) => s.emotionResult);
  const emotionSummary = useAppStore((s) => s.emotionSummary);
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
  const correctCharacters = isHaydn
    ? ['제1바이올린', '제2바이올린', '비올라', '첼로']
    : (isErlkonig ? correctCharactersErlkonig : correctCharactersHallelujah);
  const correctStory = isHaydn
    ? '종달새. 제1바이올린의 높고 가벼운 선율이 새의 지저귐처럼 들리기 때문이다.'
    : (isErlkonig ? correctStoryErlkonig : correctStoryHallelujah);
  const promptHints = isErlkonig ? storyPromptHints : hallelujahPromptHints;
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

  const emotionRows = useMemo(
    () =>
      emotionResult
        ? [
            { key: 'sadness', label: '슬픔', emoji: '😢', value: Number(emotionResult.sadness) || 0 },
            { key: 'fear', label: '공포', emoji: '😨', value: Number(emotionResult.fear) || 0 },
            { key: 'anger', label: '분노', emoji: '😠', value: Number(emotionResult.anger) || 0 },
            { key: 'happiness', label: '기쁨', emoji: '😊', value: Number(emotionResult.happiness) || 0 },
            { key: 'surprise', label: '놀라움', emoji: '😮', value: Number(emotionResult.surprise) || 0 },
            { key: 'disgust', label: '혐오', emoji: '😒', value: Number(emotionResult.disgust) || 0 }
          ].sort((a, b) => b.value - a.value)
        : [],
    [emotionResult]
  );
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
          <div style={{ marginTop: 10 }}>
            <div className="review-section-title">감정 분석 결과</div>
            <div className="review-item">
              {emotionRows.length
                ? emotionRows.map((item) => `${item.emoji} ${item.label} ${item.value}%`).join(' · ')
                : '분석 없음'}
            </div>
            <div className="small-note">{emotionSummary || '요약 없음'}</div>
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
        {!isHaydn ? (
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
