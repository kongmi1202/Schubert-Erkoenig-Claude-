import { useAppStore } from '../../store/useAppStore';
import { useEffect } from 'react';

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
    q1, q2, q3, q2Type, setQ1, setQ2, setQ3, setQ2Type,
    selectedKeywords, selectedColors, sensoryDesc, sensoryArtifacts, analyticalCharacters, analyticalStory, setStageCompletion,
    selectedSong, handelLyricMeaning, handelOperaDiff, emotionResult, emotionSummary, voiceDesignState, pianoAnalysisState,
    tonePaintingHandelState, melodyCanvasHandelState, hyTimbreState, hyThemeState,
    vvSonnetState, vvConcertoState, cpFormState, cpRhythmState, sbSprechState, sbAtonalState
  } = useAppStore();
  const isHandel = selectedSong === 'handel';
  const isHaydn = selectedSong === 'haydn';
  const isSchoenberg = selectedSong === 'schoenberg';
  const isVivaldi = selectedSong === 'vivaldi';
  const isChopin = selectedSong === 'chopin';
  const isMawang = !isHandel && !isHaydn && !isSchoenberg && !isVivaldi && !isChopin;
  const analyticalAnswerCharacters = ['해설자', '아버지', '아들', '마왕'];
  const analyticalAnswerStory = '폭풍우 치는 밤, 아버지가 아픈 아들을 가슴에 안고 집으로 달려간다. 아들은 마왕의 유혹을 두려워하지만 아버지는 이를 부정한다. 집에 도착했을 때 아들은 이미 죽어 있다.';
  const schoenbergAnswerQ1 = ['소프라노(또는 메조소프라노)', '플루트', '클라리넷', '바이올린', '첼로', '피아노'];
  const schoenbergAnswerQ2 = '불안하고 몽환적이며 신비로운 분위기예요. 달빛 속 도취감과 공포가 뒤섞인 표현주의 특유의 감성을 담고 있어요.';
  const vivaldiAnswerQ1 = ['여름 폭풍우 장면', '지친 목동과 양떼', '갑작스러운 번개와 천둥', '우박으로 이삭이 쓸려감'];
  const vivaldiAnswerQ2 = '격렬하고 긴박한 폭풍우의 분위기예요. 빠른 템포와 강한 셈여림으로 폭풍우의 긴박함과 공포가 생생하게 전달돼요.';
  const chopinAnswerQ1 = '피아노 독주예요. 다른 악기 없이 피아노 한 대가 선율과 반주를 모두 표현해요.';
  const chopinAnswerQ2 = '빠르고 격렬한 A구간과 느리고 서정적인 B구간이 대비되어, 곡의 분위기가 극적으로 바뀌어요.';
  const haydnAnswerQ1 = ['제1바이올린', '제2바이올린', '비올라', '첼로'];
  const haydnAnswerQ2 = '종달새';
  const handelAnswerQ1 = '성경(요한계시록)을 바탕으로 한 종교적 내용이에요. 할렐루야, King of Kings 등 신의 위대함을 찬양하는 내용이 중심입니다.';
  const handelAnswerQ2 = [
    '가사내용: 오페라(사랑·영웅 이야기) / 오라토리오(종교적 내용)',
    '무대·연기: 오페라(의상·연기 있음) / 오라토리오(의상·연기 없음)',
    '공연장소: 오페라(오페라 극장) / 오라토리오(교회·콘서트홀)'
  ];
  const handelToneSegments = [
    { id: 's1', title: '구간 1', question: '이 구절에서 음악은 어떻게 표현됐나요?', answer: '음이 점점 높아진다' },
    { id: 's2', title: '구간 2', question: '이 구절에서 반복은 어떤 효과를 주나요?', answer: '강조와 확신을 표현한다' },
    { id: 's3', title: '구간 3', question: '영원함을 음악으로 어떻게 표현했나요?', answer: '선율이 끝없이 이어진다' }
  ];
  const handelToneOptionsById = {
    s1: ['음이 점점 높아진다', '음이 갑자기 낮아진다', '리듬이 빨라진다', '선율이 길게 이어진다'],
    s2: ['지루함을 준다', '강조와 확신을 표현한다', '슬픔을 나타낸다', '음악이 끝나는 느낌을 준다'],
    s3: ['음악이 갑자기 끝난다', '음이 매우 낮아진다', '선율이 끝없이 이어진다', '리듬이 점점 빨라진다']
  };
  const hyTimbreCorrectInstr = { 'ig-1': '바이올린', 'ig-2': '비올라', 'ig-3': '첼로' };
  const hyTimbreCorrectRole = { 'ig-1': '주선율', 'ig-2': '중성부', 'ig-3': '베이스' };
  const hyThemeMatchIdToLabel = {
    o1: '음이 크게 도약한다',
    o2: '음이 순차적으로 이어진다',
    o3: '리듬이 짧게 끊어진다',
    o4: '리듬이 길게 이어진다',
    o5: '밝고 활기차다',
    o6: '부드럽고 서정적이다'
  };
  const formatHyThemePlaced = (ids) =>
    Array.isArray(ids) && ids.length
      ? ids.map((id) => hyThemeMatchIdToLabel[id] || id).join(', ')
      : '없음';
  const vvSonnetCorrect = { 'vv-c1': '음이 갑자기 강하고 빠르게 터진다', 'vv-c2': '음이 짧고 강하게 반복된다' };
  const cpFormCorrect = { 'cp-f1': 'A', 'cp-f2': 'B', 'cp-f3': "A'" };
  const cpFeatureCorrect = { 'cp-f1': '빠르고 강하다', 'cp-f2': '느리고 부드럽다', 'cp-f3': '빠르고 강하다' };
  const cpRhythmCorrect = { 'cp-rh-q': '4개씩', 'cp-lh-q': '3개씩', 'cp-poly-q': '복잡하고 긴장감이 있다' };
  const q1WritingHint = '처음 느낌과 분석 후 느낌이 어떻게 달라졌는지 한 문장으로 써보세요.';
  const q2WritingHint = '고른 분석 요소가 왜 이 곡을 특별하게 만드는지 이유를 한 문장으로 써보세요.';
  const analyticalQ1Label = isHandel
    ? 'Q1 가사 내용 비교'
    : (isHaydn ? 'Q1 악기 구성 비교' : (isSchoenberg ? 'Q1 편성 비교' : (isVivaldi ? 'Q1 장면 묘사 비교' : (isChopin ? 'Q1 악기 편성 비교' : 'Q1 등장인물 비교'))));
  const analyticalQ2Label = isHandel
    ? 'Q2 오페라와의 차이 비교'
    : (isHaydn ? 'Q2 떠오르는 동물 비교' : (isSchoenberg ? 'Q2 분위기 비교' : (isVivaldi ? 'Q2 분위기 비교' : (isChopin ? 'Q2 분위기 변화 비교' : 'Q2 줄거리 비교'))));
  const showAnalyticalQ2 = !isVivaldi;
  const q2Options = isHandel
    ? [
        { value: '음화법', label: '음화법(음색, 가락)' },
        { value: '화성다성음악', label: '화성·다성음악(다양한 소리의 어울림)' },
        { value: '맥락', label: '사회역사적 맥락' }
      ]
    : isHaydn
      ? [
          { value: '현악음색', label: '현악 4중주(음색)' },
          { value: '주제비교', label: '제1, 2주제(가락, 리듬꼴, 음계)' },
          { value: '맥락', label: '사회역사적 맥락' }
        ]
      : isSchoenberg
        ? [
            { value: '슈프레흐슈팀메', label: '슈프레흐슈팀메 (달에 홀린 피에로)' },
            { value: '무조성', label: '무조성 (달에 홀린 피에로)' },
            { value: '맥락', label: '사회·역사적 맥락' }
          ]
        : isVivaldi
          ? [
              { value: '소네트', label: '소네트(표제 음악)' },
              { value: '바이올린협주곡', label: '협주곡(음색, 형식)' },
              { value: '맥락', label: '사회역사적 맥락' }
            ]
          : isChopin
            ? [
                { value: 'ABA형식', label: 'ABA 형식 (환상 즉흥곡)' },
                { value: '폴리리듬', label: '폴리리듬 (환상 즉흥곡)' },
                { value: '맥락', label: '사회·역사적 맥락' }
              ]
            : [
                { value: '음색', label: '등장인물의 음색' },
                { value: '반주', label: '피아노 반주' },
                { value: '맥락', label: '사회·역사적 맥락' }
              ];
  const voiceAnswerKey = {
    해설자: { 음높이: '중간', 음계: '단조', 리듬꼴: '김', 음색: '두꺼움' },
    아버지: { 음높이: '낮음', 음계: '단조', 리듬꼴: '김', 음색: '두꺼움' },
    아들: { 음높이: '높음', 음계: '단조', 리듬꼴: '짧음', 음색: '얇음' },
    마왕: { 음높이: '중간', 음계: '장조', 리듬꼴: '김', 음색: '중간' }
  };
  const voiceRows = Object.entries(voiceDesignState?.voiceDesign || {}).filter(([, row]) =>
    ['음높이', '음계', '리듬꼴', '음색'].some((k) => row?.[k])
  );
  const emotionRows = emotionResult
    ? [
        { key: 'sadness', label: '슬픔', emoji: '😢', value: Number(emotionResult.sadness) || 0 },
        { key: 'fear', label: '공포', emoji: '😨', value: Number(emotionResult.fear) || 0 },
        { key: 'anger', label: '분노', emoji: '😠', value: Number(emotionResult.anger) || 0 },
        { key: 'happiness', label: '기쁨', emoji: '😊', value: Number(emotionResult.happiness) || 0 },
        { key: 'surprise', label: '놀라움', emoji: '😮', value: Number(emotionResult.surprise) || 0 },
        { key: 'disgust', label: '혐오', emoji: '😒', value: Number(emotionResult.disgust) || 0 }
      ].sort((a, b) => b.value - a.value).slice(0, 3)
    : [];
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
    updateById('rv-kw-vv', keywordText);
    updateById('rv-desc-vv', descText);
    updateById('rv-kw-cp', keywordText);
    updateById('rv-desc-cp', descText);
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
              <div className="review-item">{analyticalQ1Label}</div>
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
                  ) : isVivaldi ? (
                    <div className="chip-row">
                      {analyticalCharacters.filter(Boolean).length
                        ? analyticalCharacters.filter(Boolean).map((c) => <span key={c} className="review-chip">{c}</span>)
                        : <span className="review-empty">없음</span>}
                    </div>
                  ) : isChopin ? (
                    <div className="fb show info">{analyticalCharacters?.[0] || '없음'}</div>
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
                  ) : isVivaldi ? (
                    <div className="chip-row">
                      {vivaldiAnswerQ1.map((c) => <span key={c} className="review-chip answer">{c}</span>)}
                    </div>
                  ) : isChopin ? (
                    <div className="fb show gold">{chopinAnswerQ1}</div>
                  ) : (
                    <div className="chip-row">
                      {analyticalAnswerCharacters.map((c) => <span key={c} className="review-chip answer">{c}</span>)}
                    </div>
                  )}
                </div>
              </div>

              {showAnalyticalQ2 ? (
                <>
                  <div className="review-item">{analyticalQ2Label}</div>
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
                      ) : isVivaldi ? (
                        <div className="fb show gold">{vivaldiAnswerQ2}</div>
                      ) : isChopin ? (
                        <div className="fb show gold">{chopinAnswerQ2}</div>
                      ) : (
                        <div className="fb show gold">{analyticalAnswerStory}</div>
                      )}
                    </div>
                  </div>
                </>
              ) : null}

              {isHandel ? (
                <>
                  <div className="review-item">2-B 음화법 활동 (내 답변 + 정답)</div>
                  <div style={{ display: 'grid', gap: 8, marginBottom: 10 }}>
                    {handelToneSegments.map((seg) => (
                      <div key={seg.id} className="review-card" style={{ padding: 12 }}>
                        <div className="small-note" style={{ marginBottom: 6 }}>{seg.title} · {seg.question}</div>
                        <div className="cmp-mini-grid">
                          <div>
                            <div className="small-note">내 답변</div>
                            <div className="review-item">
                              {tonePaintingHandelState?.selected?.[seg.id] === null
                                ? '없음'
                                : String(handelToneOptionsById[seg.id]?.[tonePaintingHandelState.selected[seg.id]] || '없음')}
                            </div>
                          </div>
                          <div>
                            <div className="small-note">정답</div>
                            <div className="review-item">{seg.answer}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="review-item">2-C 화성·다성 가락선 활동 (내 그림 + 개념 예시)</div>
                  <div className="cmp-mini-grid">
                    <div>
                      <div className="small-note">화성음악 · 내 가락선</div>
                      {melodyCanvasHandelState?.savedPreview?.harmony
                        ? <img src={melodyCanvasHandelState.savedPreview.harmony} alt="화성음악 내가 그린 가락선" className="score-image-inline" />
                        : <div className="review-empty">없음</div>}
                    </div>
                    <div>
                      <div className="small-note">화성음악 · 개념 예시</div>
                      <img src="/assets/handel-model-hallelujah.png" alt="화성음악 개념 예시 가락선" className="score-image-inline" />
                    </div>
                  </div>
                  <div className="cmp-mini-grid" style={{ marginBottom: 10 }}>
                    <div>
                      <div className="small-note">다성음악 · 내 가락선</div>
                      {melodyCanvasHandelState?.savedPreview?.poly
                        ? <img src={melodyCanvasHandelState.savedPreview.poly} alt="다성음악 내가 그린 가락선" className="score-image-inline" />
                        : <div className="review-empty">없음</div>}
                    </div>
                    <div>
                      <div className="small-note">다성음악 · 개념 예시</div>
                      <img src="/assets/handel-model-lord-reign.png" alt="다성음악 개념 예시 가락선" className="score-image-inline" />
                    </div>
                  </div>
                </>
              ) : null}
              {isHaydn ? (
                <>
                  <div className="review-item">2-B 현악 4중주 음색 비교 (내 답변 + 정답)</div>
                  <div className="cmp-mini-grid">
                    <div className="fb show info">
                      구간1 악기: {hyTimbreState?.selectedByGrid?.['ig-1'] || '없음'} · 역할: {hyTimbreState?.roleByGrid?.['ig-1'] || '없음'}
                    </div>
                    <div className="fb show gold">구간1 정답: {hyTimbreCorrectInstr['ig-1']} · {hyTimbreCorrectRole['ig-1']}</div>
                  </div>
                  <div className="cmp-mini-grid">
                    <div className="fb show info">
                      구간2 악기: {hyTimbreState?.selectedByGrid?.['ig-2'] || '없음'} · 역할: {hyTimbreState?.roleByGrid?.['ig-2'] || '없음'}
                    </div>
                    <div className="fb show gold">구간2 정답: {hyTimbreCorrectInstr['ig-2']} · {hyTimbreCorrectRole['ig-2']}</div>
                  </div>
                  <div className="cmp-mini-grid" style={{ marginBottom: 10 }}>
                    <div className="fb show info">
                      구간3 악기: {hyTimbreState?.selectedByGrid?.['ig-3'] || '없음'} · 역할: {hyTimbreState?.roleByGrid?.['ig-3'] || '없음'}
                    </div>
                    <div className="fb show gold">구간3 정답: {hyTimbreCorrectInstr['ig-3']} · {hyTimbreCorrectRole['ig-3']}</div>
                  </div>
                  <div className="review-item">2-C 주제 비교 — 두 주제 특징 배치</div>
                  <div className="cmp-mini-grid">
                    <div className="fb show info">제1주제 칸: {formatHyThemePlaced(hyThemeState?.matchPlaced?.theme1)}</div>
                    <div className="fb show gold">제1주제 정답 보기: 음이 크게 도약한다, 리듬이 짧게 끊어진다, 밝고 활기차다</div>
                  </div>
                  <div className="cmp-mini-grid" style={{ marginBottom: 10 }}>
                    <div className="fb show info">제2주제 칸: {formatHyThemePlaced(hyThemeState?.matchPlaced?.theme2)}</div>
                    <div className="fb show gold">제2주제 정답 보기: 음이 순차적으로 이어진다, 리듬이 길게 이어진다, 부드럽고 서정적이다</div>
                  </div>
                  <div className="review-item">2-C 도수 맞추기</div>
                  <div className="cmp-mini-grid">
                    <div className="review-item">도수 선택: {hyThemeState?.selectedDeg || '없음'} (정답: 5도)</div>
                  </div>
                </>
              ) : null}
              {isVivaldi ? (
                <>
                  <div className="review-item">2-B 소네트 활동 (내 답변 + 정답)</div>
                  <div className="cmp-mini-grid">
                    <div className="fb show info">구간1: {vvSonnetState?.selectedById?.['vv-c1'] || '없음'}</div>
                    <div className="fb show gold">구간1 정답: {vvSonnetCorrect['vv-c1']}</div>
                  </div>
                  <div className="cmp-mini-grid" style={{ marginBottom: 10 }}>
                    <div className="fb show info">구간2: {vvSonnetState?.selectedById?.['vv-c2'] || '없음'}</div>
                    <div className="fb show gold">구간2 정답: {vvSonnetCorrect['vv-c2']}</div>
                  </div>
                  <div className="review-item">2-C 바이올린 협주곡 활동 (독주·총주 체크 / 발견 질문)</div>
                  <div className="cmp-mini-grid">
                    <div className="fb show info">
                      독주 탭 {vvConcertoState?.soloCount ?? 0}회 · 총주 탭 {vvConcertoState?.tuttiCount ?? 0}회
                    </div>
                  </div>
                  <div className="cmp-mini-grid" style={{ marginBottom: 10 }}>
                    <div className="fb show info">발견 질문 선택: {vvConcertoState?.discoveryChoice || '없음'}</div>
                    <div className="fb show gold">정답: 독주와 총주가 번갈아 나온다</div>
                  </div>
                </>
              ) : null}
              {isChopin ? (
                <>
                  <div className="review-item">2-B ABA 형식 활동 (내 답변 + 정답)</div>
                  <div className="cmp-mini-grid">
                    <div className="fb show info">구간1: {cpFormState?.formAnswers?.['cp-f1'] || '없음'}</div>
                    <div className="fb show gold">구간1 정답: {cpFormCorrect['cp-f1']}</div>
                  </div>
                  <div className="cmp-mini-grid">
                    <div className="fb show info">구간2: {cpFormState?.formAnswers?.['cp-f2'] || '없음'}</div>
                    <div className="fb show gold">구간2 정답: {cpFormCorrect['cp-f2']}</div>
                  </div>
                  <div className="cmp-mini-grid" style={{ marginBottom: 10 }}>
                    <div className="fb show info">구간3: {cpFormState?.formAnswers?.['cp-f3'] || '없음'}</div>
                    <div className="fb show gold">구간3 정답: {cpFormCorrect['cp-f3']}</div>
                  </div>
                  <div className="cmp-mini-grid">
                    <div className="fb show info">구간1 특징: {cpFormState?.featureById?.['cp-f1'] || '없음'}</div>
                    <div className="fb show gold">정답: {cpFeatureCorrect['cp-f1']}</div>
                  </div>
                  <div className="cmp-mini-grid">
                    <div className="fb show info">구간2 특징: {cpFormState?.featureById?.['cp-f2'] || '없음'}</div>
                    <div className="fb show gold">정답: {cpFeatureCorrect['cp-f2']}</div>
                  </div>
                  <div className="cmp-mini-grid" style={{ marginBottom: 10 }}>
                    <div className="fb show info">구간3 특징: {cpFormState?.featureById?.['cp-f3'] || '없음'}</div>
                    <div className="fb show gold">정답: {cpFeatureCorrect['cp-f3']}</div>
                  </div>
                  <div className="cmp-mini-grid" style={{ marginBottom: 10 }}>
                    <div className="fb show info">ABA 발견 질문: {cpFormState?.discoveryChoice || '없음'}</div>
                    <div className="fb show gold">정답: 서로 다른 느낌을 대비시키기 위해</div>
                  </div>
                  <div className="review-item">2-C 폴리리듬 활동 (내 답변 + 정답)</div>
                  <div className="cmp-mini-grid">
                    <div className="fb show info">오른손 묶음: {cpRhythmState?.selectedByGroup?.['cp-rh-q'] || '없음'}</div>
                    <div className="fb show gold">정답: {cpRhythmCorrect['cp-rh-q']}</div>
                  </div>
                  <div className="cmp-mini-grid">
                    <div className="fb show info">왼손 묶음: {cpRhythmState?.selectedByGroup?.['cp-lh-q'] || '없음'}</div>
                    <div className="fb show gold">정답: {cpRhythmCorrect['cp-lh-q']}</div>
                  </div>
                  <div className="cmp-mini-grid" style={{ marginBottom: 10 }}>
                    <div className="fb show info">양손 느낌: {cpRhythmState?.selectedByGroup?.['cp-poly-q'] || '없음'}</div>
                    <div className="fb show gold">정답: {cpRhythmCorrect['cp-poly-q']}</div>
                  </div>
                </>
              ) : null}
              {isSchoenberg ? (
                <>
                  <div className="review-item">2-B 슈프레흐슈팀메 활동 (내 답변 + 정답)</div>
                  <div className="cmp-mini-grid" style={{ marginBottom: 10 }}>
                    <div className="fb show info">{sbSprechState?.selectedChoice || '없음'}</div>
                    <div className="fb show gold">정답: 음에 도달한 직후 바로 올라가거나 내려간다</div>
                  </div>
                  <div className="review-item">2-C 무조성 활동 (내 답변 + 정답)</div>
                  <div className="cmp-mini-grid">
                    <div className="fb show info">선택: {sbAtonalState?.selectedChoice || '없음'}</div>
                    <div className="fb show gold">정답: 불안하고 예측할 수 없다</div>
                  </div>
                  <div className="cmp-mini-grid" style={{ marginBottom: 10 }}>
                    <div className="fb show info">마왕 느낌: {sbAtonalState?.feelTonal || '없음'}</div>
                    <div className="fb show info">피에로 느낌: {sbAtonalState?.feelAtonal || '없음'}</div>
                  </div>
                </>
              ) : null}

              {isMawang ? (
                <>
                  <div className="review-item">2-B 음색 설계 (내 답변 + 정답)</div>
                  {voiceRows.length ? (
                    <div style={{ display: 'grid', gap: 8, marginBottom: 10 }}>
                      {voiceRows.map(([name, row]) => (
                        <div key={name} className="review-card" style={{ padding: 12 }}>
                          <div className="small-note" style={{ marginBottom: 6 }}>{name}</div>
                          <div className="cmp-mini-grid">
                            <div>
                              <div className="small-note">내 답변</div>
                              <div className="review-item">
                                음높이 {row.음높이 || '—'} · 음계 {row.음계 || '—'} · 리듬꼴 {row.리듬꼴 || '—'} · 음색 {row.음색 || '—'}
                              </div>
                            </div>
                            <div>
                              <div className="small-note">정답</div>
                              <div className="review-item">
                                음높이 {voiceAnswerKey[name]?.음높이 || '—'} · 음계 {voiceAnswerKey[name]?.음계 || '—'} · 리듬꼴 {voiceAnswerKey[name]?.리듬꼴 || '—'} · 음색 {voiceAnswerKey[name]?.음색 || '—'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="review-empty" style={{ marginBottom: 10 }}>입력 없음</div>
                  )}

                  <div className="review-item">2-C 피아노 반주 (내 답변 + 정답)</div>
                  <div className="cmp-mini-grid">
                    <div>
                      <div className="small-note">내 답변</div>
                      <div className="review-item">
                        오른손 장면: {pianoAnalysisState?.rhScene || '없음'}<br />
                        왼손 장면: {pianoAnalysisState?.lhScene || '없음'}
                      </div>
                    </div>
                    <div>
                      <div className="small-note">정답(모범 해설)</div>
                      <div className="review-item">
                        오른손: 말발굽/질주 같은 긴장감<br />
                        왼손: 심장 박동/쫓기는 긴박감
                      </div>
                    </div>
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
                  <div className="cmp-mini-grid">
                    <div>
                      <div className="small-note">내 오른손 그림</div>
                      {pianoAnalysisState?.savedPreview?.rh
                        ? <img src={pianoAnalysisState.savedPreview.rh} alt="내 오른손 가락선" className="score-image-inline" />
                        : <div className="review-empty">없음</div>}
                    </div>
                    <div>
                      <div className="small-note">내 왼손 그림</div>
                      {pianoAnalysisState?.savedPreview?.lh
                        ? <img src={pianoAnalysisState.savedPreview.lh} alt="내 왼손 가락선" className="score-image-inline" />
                        : <div className="review-empty">없음</div>}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
          {emotionResult ? (
            <div style={{ marginTop: 12 }}>
              <div className="review-section-title">감정 분석 결과</div>
              <div className="chip-row" style={{ marginBottom: 8 }}>
                {emotionRows.map((item) => (
                  <span key={item.key} className="review-chip">
                    {item.emoji} {item.label} {item.value}%
                  </span>
                ))}
              </div>
              <div className="fb show info">💬 {emotionSummary || '요약 없음'}</div>
            </div>
          ) : null}
        </div>

        <div className="sec">Q1. 분석 후 느낌의 변화</div>
        <div className="fill-box">
          처음엔 <span style={{ color: 'var(--purple-light)', fontStyle: 'italic' }}>[감각적 감상 키워드]</span>고 느꼈는데,<br />
          분석해 보니 <input className="fill-input" value={q1} onChange={(e) => setQ1(e.target.value)} placeholder="___________" /> 라고 느꼈다.
        </div>
        <div className="small-note">작성 힌트: {q1WritingHint}</div>

        <div className="sec">Q2. 분석 요소를 근거로 이 곡의 가치를 평가해보세요.</div>
        <select className="dropdown" value={q2Type} onChange={(e) => setQ2Type(e.target.value)}>
          <option value="">연결할 분석 요소를 선택하세요</option>
          {q2Options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {q2Type ? (
          <textarea
            className="txt"
            value={q2}
            onChange={(e) => setQ2(e.target.value)}
            placeholder="이 요소가 왜 이 곡을 더 좋게(또는 특별하게) 만드는지 근거를 써보세요."
          />
        ) : null}
        <div className="small-note">작성 힌트: {q2WritingHint}</div>

        <div className="sec">Q3. 오늘날 삶과 연결</div>
        <textarea className="txt" value={q3} onChange={(e) => setQ3(e.target.value)} placeholder={isHandel ? "할렐루야가 오늘날 나의 삶에서도 의미 있다고 느껴지는 순간이 있나요?" : (isHaydn ? "고전주의 음악인 '종달새'가 오늘날 나의 삶에서도 의미 있다고 느껴지는 순간이 있나요?" : (isSchoenberg ? "표현주의 음악인 '달에 홀린 피에로'가 오늘날 나의 삶에서도 의미 있다고 느껴지는 순간이 있나요?" : (isVivaldi ? "바로크 음악인 '사계 여름 3악장'이 오늘날 나의 삶에서도 의미 있다고 느껴지는 순간이 있나요?" : (isChopin ? "낭만주의 피아노곡인 '환상 즉흥곡'이 오늘날 나의 삶에서도 의미 있다고 느껴지는 순간이 있나요?" : "200년 전 음악인 '마왕'이 오늘날 나의 삶에서도 의미 있다고 느껴지는 순간이 있나요?"))))} />
        <div className="btn-row"><button className="btn-s" onClick={() => go('historyCards')}>← 이전</button><button className="btn-p" onClick={() => { setStageCompletion('aesthetic', true); go('finalCard'); }}>최종 감상문 만들기 →</button></div>
      </div>
    </div>
  );
}

export default AestheticPage;
