import { useAppStore } from '../../store/useAppStore';

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

function AestheticPage({ go }) {
  const {
    q1, q2, q3, q2Type, setQ1, setQ2, setQ3, setQ2Type, toggleAi, aiOpen,
    selectedKeywords, selectedColors, sensoryDesc, sensoryArtifacts, analyticalCharacters, analyticalStory
  } = useAppStore();
  const analyticalAnswerCharacters = ['해설자', '아버지', '아들', '마왕'];
  const analyticalAnswerStory = '폭풍우 치는 밤, 아버지가 아픈 아들을 가슴에 안고 집으로 달려간다. 아들은 마왕의 유혹을 두려워하지만 아버지는 이를 부정한다. 집에 도착했을 때 아들은 이미 죽어 있다.';

  return (
    <div className="screen active"><div className="stage-header"><div className="s-eyebrow">STAGE 3 · 심미적 감상</div><div className="s-title">나의 음악적 가치 판단</div><div className="s-desc">감각적·분석적 감상을 종합하여 이 음악을 평가해보세요.</div></div>
      <div className="body voice-body">
        <div className="sec">나의 감상 여정 돌아보기</div>
        <div className="review-card">
          <div className="review-grid">
            <div className="journey-block">
              <div className="review-section-title">① 감각적 감상 (내 입력 원형)</div>
              <div className="review-item">키워드</div>
              <div className="chip-row">
                {selectedKeywords.length ? selectedKeywords.map((k) => <span key={k} className="review-chip">{k}</span>) : <span className="review-empty">없음</span>}
              </div>

              <div className="review-item">색상</div>
              <div className="swatch-row">
                {selectedColors.length ? selectedColors.map((c) => <span key={c} className="review-swatch" style={{ background: colorMap[c] || '#555' }} title={c} />) : <span className="review-empty">없음</span>}
              </div>

              <div className="review-item">서술</div>
              <div className="fb show info">{sensoryDesc || '없음'}</div>

              <div className="artifact-grid">
                {sensoryArtifacts.pePhoto ? <div className="artifact-card"><div className="review-item">체육 사진</div><img src={sensoryArtifacts.pePhoto} alt="체육 활동 사진" className="captured-img" />{sensoryArtifacts.peAnswer ? <div className="small-note">{sensoryArtifacts.peAnswer}</div> : null}</div> : null}
                {sensoryArtifacts.mathDrawing ? <div className="artifact-card"><div className="review-item">수학 도형 그림</div><img src={sensoryArtifacts.mathDrawing} alt="수학 활동 그림" className="captured-img" />{sensoryArtifacts.mathAnswer ? <div className="small-note">{sensoryArtifacts.mathAnswer}</div> : null}</div> : null}
                {sensoryArtifacts.scienceSelected?.length ? <div className="artifact-card"><div className="review-item">과학 선택</div><div className="chip-row">{sensoryArtifacts.scienceSelected.map((s) => <span key={s} className="review-chip">{s}</span>)}</div>{sensoryArtifacts.scienceAnswer ? <div className="small-note">{sensoryArtifacts.scienceAnswer}</div> : null}</div> : null}
                {sensoryArtifacts.mapAddress ? <div className="artifact-card"><div className="review-item">사회 선택 장소</div><div className="map-address">{sensoryArtifacts.mapAddress}</div>{sensoryArtifacts.mapAnswer ? <div className="small-note">{sensoryArtifacts.mapAnswer}</div> : null}</div> : null}
              </div>
            </div>

            <div className="journey-block">
              <div className="review-section-title">② 분석적 감상 (내 답변 + 정답)</div>
              <div className="review-item">Q1 등장인물 비교</div>
              <div className="cmp-mini-grid">
                <div>
                  <div className="small-note">내 답변</div>
                  <div className="chip-row">
                    {analyticalCharacters.filter(Boolean).length
                      ? analyticalCharacters.filter(Boolean).map((c) => <span key={c} className="review-chip">{c}</span>)
                      : <span className="review-empty">없음</span>}
                  </div>
                </div>
                <div>
                  <div className="small-note">정답</div>
                  <div className="chip-row">
                    {analyticalAnswerCharacters.map((c) => <span key={c} className="review-chip answer">{c}</span>)}
                  </div>
                </div>
              </div>

              <div className="review-item">Q2 줄거리 비교</div>
              <div className="cmp-mini-grid">
                <div><div className="small-note">내 답변</div><div className="fb show info">{analyticalStory || '없음'}</div></div>
                <div><div className="small-note">정답</div><div className="fb show gold">{analyticalAnswerStory}</div></div>
              </div>

              <div className="review-item">분석 활동 정답 자료(원형)</div>
              <div className="cmp-mini-grid">
                <div>
                  <div className="small-note">오른손 모범 악보</div>
                  <img src="/assets/rh-score.png" alt="오른손 모범 악보" className="score-image-inline" />
                </div>
                <div>
                  <div className="small-note">왼손 모범 악보</div>
                  <img src="/assets/lh-score.png" alt="왼손 모범 악보" className="score-image-inline" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sec">Q1. 분석 후 느낌의 변화</div>
        <div className="fill-box">
          처음엔 <span style={{ color: 'var(--purple-light)', fontStyle: 'italic' }}>[감각적 감상 키워드]</span>고 느꼈는데,<br />
          분석해 보니 <input className="fill-input" value={q1} onChange={(e) => setQ1(e.target.value)} placeholder="___________" /> 라고 느꼈다.
        </div>
        <button className="ai-btn" onClick={() => toggleAi('q1')}>✨ AI 도우미 예시 보기</button>
        <div className={`ai-bubble ${aiOpen.q1 ? 'show' : ''}`}><div className="ai-bubble-label">AI 서술 예시</div>처음엔 무섭고 긴박하게 느꼈는데, 분석해 보니 감정을 정교하게 설계한 음악이라고 느꼈다.</div>

        <div className="sec">Q2. 분석 요소와 연결</div>
        <select className="dropdown" value={q2Type} onChange={(e) => setQ2Type(e.target.value)}><option value="">연결할 분석 요소를 선택하세요</option><option value="음색">등장인물의 음색</option><option value="반주">피아노 반주</option><option value="맥락">사회·역사적 맥락</option></select>
        {q2Type ? <textarea className="txt" value={q2} onChange={(e) => setQ2(e.target.value)} placeholder="이유를 써보세요" /> : null}
        <button className="ai-btn" onClick={() => toggleAi('q2')}>✨ AI 도우미 예시 보기</button>
        <div className={`ai-bubble ${aiOpen.q2 ? 'show' : ''}`}><div className="ai-bubble-label">AI 서술 예시</div>음색이 인물의 감정을 다르게 들리게 해서 이야기 장면이 더 선명하게 느껴졌다.</div>

        <div className="sec">Q3. 오늘날 삶과 연결</div>
        <textarea className="txt" value={q3} onChange={(e) => setQ3(e.target.value)} placeholder="200년 전 음악인 '마왕'이 오늘날 나의 삶에서도 의미 있다고 느껴지는 순간이 있나요?" />
        <div className="btn-row"><button className="btn-s" onClick={() => go('historyCards')}>← 이전</button><button className="btn-p" onClick={() => go('finalCard')}>최종 감상문 만들기 →</button></div>
      </div>
    </div>
  );
}

export default AestheticPage;
