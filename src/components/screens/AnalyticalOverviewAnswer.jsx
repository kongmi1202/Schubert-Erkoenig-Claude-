import { useAppStore } from '../../store/useAppStore';

const correctCharacters = ['해설자', '아버지', '아들', '마왕'];
const correctStory = '폭풍우 치는 밤, 아버지가 아픈 아들을 가슴에 안고 집으로 달려간다. 아들은 마왕의 유혹을 두려워하지만 아버지는 이를 부정한다. 집에 도착했을 때 아들은 이미 죽어 있다.';

function AnalyticalOverviewAnswer({ go }) {
  const userCharacters = useAppStore((s) => s.analyticalCharacters);
  const userStory = useAppStore((s) => s.analyticalStory);

  return (
    <div className="screen active">
      <div className="stage-header"><div className="s-eyebrow">STAGE 2-A · 정답 비교</div><div className="s-title">정답을 확인해보세요</div></div>
      <div className="body">
        <div className="sec">Q1. 등장인물 비교</div>
        <div className="review-card">
          <div className="review-grid">
            <div>
              <div className="review-section-title">내 답변</div>
              <div className="review-item">{userCharacters.filter(Boolean).join(', ') || '입력 없음'}</div>
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
          <div className="review-item" style={{ marginBottom: 14 }}>{userStory.trim() || '입력 없음'}</div>
          <div className="review-section-title">정답</div>
          <div className="review-item">{correctStory}</div>
        </div>

        <div className="btn-row"><button className="btn-s" onClick={() => go('analyticalOverview')}>← 이전</button><button className="btn-p" onClick={() => go('voiceDesign')}>다음 →</button></div>
      </div>
    </div>
  );
}

export default AnalyticalOverviewAnswer;
