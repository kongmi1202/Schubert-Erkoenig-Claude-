import { useEffect, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';

const correctCharacters = ['해설자', '아버지', '아들', '마왕'];
const correctStory = '폭풍우 치는 밤, 아버지가 아픈 아들을 가슴에 안고 집으로 달려간다. 아들은 마왕의 유혹을 두려워하지만 아버지는 이를 부정한다. 집에 도착했을 때 아들은 이미 죽어 있다.';

function AnalyticalOverview({ go }) {
  const selectedKeywords = useAppStore((s) => s.selectedKeywords);
  const sensoryDesc = useAppStore((s) => s.sensoryDesc);
  const aiOpen = useAppStore((s) => s.aiOpen);
  const toggleAi = useAppStore((s) => s.toggleAi);
  const characters = useAppStore((s) => s.analyticalCharacters);
  const story = useAppStore((s) => s.analyticalStory);
  const setAnalyticalCharacter = useAppStore((s) => s.setAnalyticalCharacter);
  const setAnalyticalStory = useAppStore((s) => s.setAnalyticalStory);
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);

  const answerCheckOpen = useAppStore((s) => s.answerCheckOpen);
  const setAnswerCheckOpen = useAppStore((s) => s.setAnswerCheckOpen);

  // 사용자 입력을 전부 채웠을 때만 "정답 확인하기" 아이콘이 표시되도록 합니다.
  const q1AllFilled = useMemo(() => characters.every((c) => typeof c === 'string' && c.trim().length > 0), [characters]);
  const q2AllFilled = useMemo(() => typeof story === 'string' && story.trim().length > 0, [story]);
  const isAllFilled = q1AllFilled && q2AllFilled;

  useEffect(() => {
    if (!isAllFilled) setAnswerCheckOpen(false);
  }, [isAllFilled]);

  return (
    <div className="screen active">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2-A · 분석적 감상</div>
        <div className="s-title">전체적인 개요 파악</div>
      </div>
      <div className="body">
        <div className="sec">1단계 감각적 감상 결과</div>
        <div className="review-card">
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

        <div className="sec">마왕 해설 영상</div>
        <div className="video-wrap">
          <iframe src="https://www.youtube.com/embed/tgfmLln8zjg" title="마왕 해설 영상" allowFullScreen />
        </div>

        <div className="sec">Q1. 등장인물 4명을 적어보세요</div>
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

        <div className="sec">Q2. 줄거리</div>
        <textarea
          className="txt"
          value={story}
          onChange={(e) => setAnalyticalStory(e.target.value)}
          placeholder="마왕의 줄거리를 써보세요..."
        />
        <button className="ai-btn" onClick={() => toggleAi('story')}>✨ AI 도우미 예시 보기</button>
        <div className={`ai-bubble ${aiOpen.story ? 'show' : ''}`}>
          <div className="ai-bubble-label">AI 서술 예시</div>
          폭풍우 치는 밤, 아버지가 아픈 아들을 안고 말을 달린다.
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
            <div className="sec">Q1. 등장인물 비교</div>
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

            <div className="sec">Q2. 줄거리 비교</div>
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
