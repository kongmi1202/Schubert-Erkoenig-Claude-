import { useAppStore } from '../../store/useAppStore';
import { useEffect, useState } from 'react';

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
const q1Hints = [
  '처음 느낌과 지금 느낌이 달라졌다면, 가장 크게 바뀐 단어 1개는 무엇일까?',
  '분석 전에 놓쳤던 소리 하나를 지금은 어떻게 해석하고 있니?',
  '처음 판단을 스스로 반박한다면 어떤 문장을 쓸 수 있을까?',
  '친구가 "왜 그렇게 생각해?"라고 물으면 근거로 어떤 장면을 말할래?'
];
const q2Hints = [
  '선택한 분석 요소가 어느 장면에서 가장 잘 들렸는지 먼저 적어봐.',
  '그 요소가 없다면 음악 느낌이 어떻게 달라질지 상상해볼래?',
  '요소-장면-감정 순서로 연결해서 한 문장을 만들어봐.',
  '네 해석과 다른 해석도 가능하다고 본다면, 그 차이는 어디서 생길까?'
];

function AestheticPage({ go }) {
  const {
    q1, q2, q3, q2Type, setQ1, setQ2, setQ3, setQ2Type, toggleAi, aiOpen,
    selectedKeywords, selectedColors, sensoryDesc, sensoryArtifacts, analyticalCharacters, analyticalStory, setStageCompletion,
    selectedSong, handelLyricMeaning, handelOperaDiff
  } = useAppStore();
  const isHandel = selectedSong === 'handel';
  const isHaydn = selectedSong === 'haydn';
  const isSchoenberg = selectedSong === 'schoenberg';
  const analyticalAnswerCharacters = ['해설자', '아버지', '아들', '마왕'];
  const analyticalAnswerStory = '폭풍우 치는 밤, 아버지가 아픈 아들을 가슴에 안고 집으로 달려간다. 아들은 마왕의 유혹을 두려워하지만 아버지는 이를 부정한다. 집에 도착했을 때 아들은 이미 죽어 있다.';
  const schoenbergAnswerQ1 = ['소프라노(또는 메조소프라노)', '플루트', '클라리넷', '바이올린', '첼로', '피아노'];
  const schoenbergAnswerQ2 = '불안하고 몽환적이며 신비로운 분위기예요. 달빛 속 도취감과 공포가 뒤섞인 표현주의 특유의 감성을 담고 있어요.';
  const haydnAnswerQ1 = ['제1바이올린', '제2바이올린', '비올라', '첼로'];
  const haydnAnswerQ2 = '종달새';
  const handelAnswerQ1 = '성경(요한계시록)을 바탕으로 한 종교적 내용이에요. 할렐루야, King of Kings 등 신의 위대함을 찬양하는 내용이 중심입니다.';
  const handelAnswerQ2 = [
    '가사내용: 오페라(사랑·영웅 이야기) / 오라토리오(종교적 내용)',
    '무대·연기: 오페라(의상·연기 있음) / 오라토리오(의상·연기 없음)',
    '공연장소: 오페라(오페라 극장) / 오라토리오(교회·콘서트홀)'
  ];
  const [q1Hint, setQ1Hint] = useState(q1Hints[0]);
  const [q2Hint, setQ2Hint] = useState(q2Hints[0]);
  const showRandomQ1Hint = () => {
    const next = q1Hints[Math.floor(Math.random() * q1Hints.length)];
    setQ1Hint(next);
    if (!aiOpen.q1) toggleAi('q1');
  };
  const showRandomQ2Hint = () => {
    const next = q2Hints[Math.floor(Math.random() * q2Hints.length)];
    setQ2Hint(next);
    if (!aiOpen.q2) toggleAi('q2');
  };

  useEffect(() => {
    const updateById = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    const keywordText = selectedKeywords.length ? selectedKeywords.join(', ') : '없음';
    const descText = sensoryDesc || '없음';
    updateById('rv-kw-hy', keywordText);
    updateById('rv-desc-hy', descText);
    updateById('rv-kw-sb', keywordText);
    updateById('rv-desc-sb', descText);
  }, [selectedKeywords, sensoryDesc]);

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
              <div className="review-item">{isHandel ? 'Q1 가사 내용 비교' : (isHaydn ? 'Q1 악기 구성 비교' : (isSchoenberg ? 'Q1 편성 비교' : 'Q1 등장인물 비교'))}</div>
              <div className="cmp-mini-grid">
                <div>
                  <div className="small-note">내 답변</div>
                  {isHandel ? (
                    <div className="fb show info">{handelLyricMeaning || '없음'}</div>
                  ) : isHaydn ? (
                    <div className="chip-row">
                      {analyticalCharacters.filter(Boolean).length
                        ? analyticalCharacters.filter(Boolean).map((c) => <span key={c} className="review-chip">{c}</span>)
                        : <span className="review-empty">없음</span>}
                    </div>
                  ) : isSchoenberg ? (
                    <div className="chip-row">
                      {analyticalCharacters.filter(Boolean).length
                        ? analyticalCharacters.filter(Boolean).map((c) => <span key={c} className="review-chip">{c}</span>)
                        : <span className="review-empty">없음</span>}
                    </div>
                  ) : (
                    <div className="chip-row">
                      {analyticalCharacters.filter(Boolean).length
                        ? analyticalCharacters.filter(Boolean).map((c) => <span key={c} className="review-chip">{c}</span>)
                        : <span className="review-empty">없음</span>}
                    </div>
                  )}
                </div>
                <div>
                  <div className="small-note">정답</div>
                  {isHandel ? (
                    <div className="fb show gold">{handelAnswerQ1}</div>
                  ) : isHaydn ? (
                    <div className="chip-row">
                      {haydnAnswerQ1.map((c) => <span key={c} className="review-chip answer">{c}</span>)}
                    </div>
                  ) : isSchoenberg ? (
                    <div className="chip-row">
                      {schoenbergAnswerQ1.map((c) => <span key={c} className="review-chip answer">{c}</span>)}
                    </div>
                  ) : (
                    <div className="chip-row">
                      {analyticalAnswerCharacters.map((c) => <span key={c} className="review-chip answer">{c}</span>)}
                    </div>
                  )}
                </div>
              </div>

              <div className="review-item">{isHandel ? 'Q2 오페라와의 차이 비교' : (isHaydn ? 'Q2 떠오르는 동물 비교' : (isSchoenberg ? 'Q2 분위기 비교' : 'Q2 줄거리 비교'))}</div>
              <div className="cmp-mini-grid">
                <div>
                  <div className="small-note">내 답변</div>
                  <div className="fb show info">{isHandel ? (handelOperaDiff || '없음') : (analyticalStory || '없음')}</div>
                </div>
                <div>
                  <div className="small-note">정답</div>
                  {isHandel ? (
                    <div className="fb show gold">{handelAnswerQ2.join('\n')}</div>
                  ) : isHaydn ? (
                    <div className="fb show gold">{haydnAnswerQ2}</div>
                  ) : isSchoenberg ? (
                    <div className="fb show gold">{schoenbergAnswerQ2}</div>
                  ) : (
                    <div className="fb show gold">{analyticalAnswerStory}</div>
                  )}
                </div>
              </div>

              <div className="review-item">{isHandel ? '분석 활동 정답 자료(원형)' : '분석 활동 정답 자료(원형)'}</div>
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
        <button className="ai-btn" onClick={showRandomQ1Hint}>✨ 생각 질문 보기</button>
        <div className="small-note">버튼을 다시 누르면 질문이 랜덤으로 바뀝니다.</div>
        <div className={`ai-bubble ${aiOpen.q1 ? 'show' : ''}`}><div className="ai-bubble-label">생각 질문 (정답 아님 · 그대로 복사 금지)</div>{q1Hint}</div>

        <div className="sec">Q2. 분석 요소와 연결</div>
        <select className="dropdown" value={q2Type} onChange={(e) => setQ2Type(e.target.value)}><option value="">연결할 분석 요소를 선택하세요</option><option value="음색">{isHandel ? '성부/음화법' : '등장인물의 음색'}</option><option value="반주">{isHandel ? '멜로디/가락선' : '피아노 반주'}</option><option value="맥락">사회·역사적 맥락</option><option value="현악음색">현악 4중주 음색 (종달새)</option><option value="주제비교">두 주제 비교 (종달새)</option><option value="슈프레흐슈팀메">슈프레흐슈팀메 (달에 홀린 피에로)</option><option value="무조성">무조성 (달에 홀린 피에로)</option></select>
        {q2Type ? <textarea className="txt" value={q2} onChange={(e) => setQ2(e.target.value)} placeholder="이유를 써보세요" /> : null}
        <button className="ai-btn" onClick={showRandomQ2Hint}>✨ 생각 질문 보기</button>
        <div className="small-note">버튼을 다시 누르면 질문이 랜덤으로 바뀝니다.</div>
        <div className={`ai-bubble ${aiOpen.q2 ? 'show' : ''}`}><div className="ai-bubble-label">생각 질문 (정답 아님 · 그대로 복사 금지)</div>{q2Hint}</div>

        <div className="sec">Q3. 오늘날 삶과 연결</div>
        <textarea className="txt" value={q3} onChange={(e) => setQ3(e.target.value)} placeholder={isHandel ? "할렐루야가 오늘날 나의 삶에서도 의미 있다고 느껴지는 순간이 있나요?" : (isHaydn ? "고전주의 음악인 '종달새'가 오늘날 나의 삶에서도 의미 있다고 느껴지는 순간이 있나요?" : (isSchoenberg ? "표현주의 음악인 '달에 홀린 피에로'가 오늘날 나의 삶에서도 의미 있다고 느껴지는 순간이 있나요?" : "200년 전 음악인 '마왕'이 오늘날 나의 삶에서도 의미 있다고 느껴지는 순간이 있나요?"))} />
        <div className="btn-row"><button className="btn-s" onClick={() => go('historyCards')}>← 이전</button><button className="btn-p" onClick={() => { setStageCompletion('aesthetic', true); go('finalCard'); }}>최종 감상문 만들기 →</button></div>
      </div>
    </div>
  );
}

export default AestheticPage;
