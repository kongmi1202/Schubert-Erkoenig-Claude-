import { useAppStore } from '../../store/useAppStore';

function AnalyticalOverview({ go }) {
  const selectedKeywords = useAppStore((s) => s.selectedKeywords);
  const sensoryDesc = useAppStore((s) => s.sensoryDesc);
  const aiOpen = useAppStore((s) => s.aiOpen);
  const toggleAi = useAppStore((s) => s.toggleAi);
  const characters = useAppStore((s) => s.analyticalCharacters);
  const story = useAppStore((s) => s.analyticalStory);
  const setAnalyticalCharacter = useAppStore((s) => s.setAnalyticalCharacter);
  const setAnalyticalStory = useAppStore((s) => s.setAnalyticalStory);

  return (
    <div className="screen active"><div className="stage-header"><div className="s-eyebrow">STAGE 2-A · 분석적 감상</div><div className="s-title">전체적인 개요 파악</div></div>
      <div className="body">
        <div className="sec">1단계 감각적 감상 결과</div>
        <div className="review-card"><div className="review-grid"><div><div className="review-section-title">감성 키워드</div><div className="review-item">{selectedKeywords.join(', ') || '선택 없음'}</div></div><div><div className="review-section-title">서술</div><div className="review-item">{sensoryDesc || '서술 없음'}</div></div></div></div>
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
        <textarea className="txt" value={story} onChange={(e) => setAnalyticalStory(e.target.value)} placeholder="마왕의 줄거리를 써보세요..." />
        <button className="ai-btn" onClick={() => toggleAi('story')}>✨ AI 도우미 예시 보기</button>
        <div className={`ai-bubble ${aiOpen.story ? 'show' : ''}`}><div className="ai-bubble-label">AI 서술 예시</div>폭풍우 치는 밤, 아버지가 아픈 아들을 안고 말을 달린다.</div>
        <div className="btn-row"><button className="btn-s" onClick={() => go('sensoryPage')}>← 이전</button><button className="btn-p" onClick={() => go('analyticalOverviewAnswer')}>정답 비교 →</button></div>
      </div>
    </div>
  );
}

export default AnalyticalOverview;
