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
  '처음 느낌과 지금 느낌이 어떻게 달라졌는지 한 문장으로 써보세요.',
  '처음에는 못 들었는데, 지금은 들리는 소리 1가지를 써보세요.',
  '생각이 바뀐 이유를 "왜냐하면"으로 시작해 써보세요.',
  '친구에게 설명하듯 쉽게 한 문장으로 써보세요.'
];
const q2HintsByType = {
  default: [
    '고른 요소가 이 곡의 가치를 높인다고 생각하는지 써보세요.',
    '왜 그렇게 평가하는지 근거를 한 줄로 써보세요.',
    '"요소 + 장면 + 내 평가" 순서로 한 문장으로 써보세요.'
  ],
  음색: [
    '목소리(음색)가 이 곡의 감정 표현에 도움이 되었는지 평가해보세요.',
    '어떤 인물 목소리가 평가 근거가 되는지 써보세요.',
    '"음색 덕분에 이 곡은 ___ 점이 좋다"처럼 써보세요.'
  ],
  반주: [
    '반주가 이 곡의 긴장감/몰입감을 높였는지 평가해보세요.',
    '반주가 특히 좋았던 장면을 근거로 써보세요.',
    '"반주가 ___해서 이 곡의 가치가 높다"처럼 써보세요.'
  ],
  맥락: [
    '시대 배경을 알고 들으니 곡이 더 의미 있다고 느꼈는지 평가해보세요.',
    '오늘날 내 삶과 연결되는 점을 근거로 써보세요.',
    '"지금 들어도 가치 있는 이유는 ___"처럼 써보세요.'
  ],
  현악음색: [
    '현악기 음색이 곡의 매력을 높였는지 평가해보세요.',
    '어떤 악기 소리가 평가 근거가 되는지 써보세요.',
    '"이 음색 때문에 이 곡이 더 아름답다"처럼 써보세요.'
  ],
  주제비교: [
    '두 주제 대비가 곡 완성도를 높였는지 평가해보세요.',
    '어느 부분이 더 인상적이었는지 근거를 써보세요.',
    '"주제 대비가 좋아서 이 곡이 ___하다"처럼 써보세요.'
  ],
  슈프레흐슈팀메: [
    '슈프레흐슈팀메가 곡의 표현력을 높였는지 평가해보세요.',
    '일반 창법과 다른 점을 근거로 써보세요.',
    '"이 창법 덕분에 감정이 더 잘 전달된다"처럼 써보세요.'
  ],
  무조성: [
    '무조성이 이 곡의 개성을 높였는지 평가해보세요.',
    '낯선 느낌이 곡의 분위기에 어떤 효과를 냈는지 써보세요.',
    '"무조성이라서 이 곡이 더 ___하게 느껴진다"처럼 써보세요.'
  ],
  소네트: [
    '소네트와 음악의 연결이 곡의 전달력을 높였는지 평가해보세요.',
    '어떤 장면이 가장 생생했는지 근거를 써보세요.',
    '"시와 음악이 잘 맞아 이 곡이 더 인상적이다"처럼 써보세요.'
  ],
  바이올린협주곡: [
    '독주/총주 대비가 곡의 재미를 높였는지 평가해보세요.',
    '어느 부분이 더 몰입됐는지 근거를 써보세요.',
    '"독주와 총주의 대비가 좋아서 이 곡이 더 멋지다"처럼 써보세요.'
  ],
  ABA형식: [
    'ABA 형식이 곡의 완성도를 높였는지 평가해보세요.',
    'A와 B 대비가 왜 중요한지 근거를 써보세요.',
    '"형식이 뚜렷해서 곡이 더 기억에 남는다"처럼 써보세요.'
  ],
  폴리리듬: [
    '폴리리듬이 곡의 긴장감과 매력을 높였는지 평가해보세요.',
    '리듬이 겹치는 부분을 근거로 써보세요.',
    '"폴리리듬 덕분에 이 곡이 더 특별하다"처럼 써보세요.'
  ]
};

function AestheticPage({ go }) {
  const {
    q1, q2, q3, q2Type, setQ1, setQ2, setQ3, setQ2Type, toggleAi, aiOpen,
    selectedKeywords, selectedColors, sensoryDesc, sensoryArtifacts, analyticalCharacters, analyticalStory, setStageCompletion,
    selectedSong, handelLyricMeaning, handelOperaDiff, emotionResult, emotionSummary, voiceDesignState, pianoAnalysisState
  } = useAppStore();
  const isHandel = selectedSong === 'handel';
  const isHaydn = selectedSong === 'haydn';
  const isSchoenberg = selectedSong === 'schoenberg';
  const isVivaldi = selectedSong === 'vivaldi';
  const isChopin = selectedSong === 'chopin';
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
  const [q1Hint, setQ1Hint] = useState(q1Hints[0]);
  const [q2Hint, setQ2Hint] = useState(q2HintsByType.default[0]);
  const q2Options = isHandel
    ? [
        { value: '음색', label: '성부/음화법' },
        { value: '반주', label: '멜로디/가락선' },
        { value: '맥락', label: '사회·역사적 맥락' }
      ]
    : isHaydn
      ? [
          { value: '현악음색', label: '현악 4중주 음색 (종달새)' },
          { value: '주제비교', label: '두 주제 비교 (종달새)' },
          { value: '맥락', label: '사회·역사적 맥락' }
        ]
      : isSchoenberg
        ? [
            { value: '슈프레흐슈팀메', label: '슈프레흐슈팀메 (달에 홀린 피에로)' },
            { value: '무조성', label: '무조성 (달에 홀린 피에로)' },
            { value: '맥락', label: '사회·역사적 맥락' }
          ]
        : isVivaldi
          ? [
              { value: '소네트', label: '소네트와 음악 연결 (여름)' },
              { value: '바이올린협주곡', label: '바이올린 협주곡 독주·총주 (여름)' },
              { value: '맥락', label: '사회·역사적 맥락' }
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
  const showRandomQ1Hint = () => {
    const next = q1Hints[Math.floor(Math.random() * q1Hints.length)];
    setQ1Hint(next);
    if (!aiOpen.q1) toggleAi('q1');
  };
  const showRandomQ2Hint = () => {
    const pool = q2HintsByType[q2Type] || q2HintsByType.default;
    const next = pool[Math.floor(Math.random() * pool.length)];
    setQ2Hint(next);
    if (!aiOpen.q2) toggleAi('q2');
  };
  useEffect(() => {
    const pool = q2HintsByType[q2Type] || q2HintsByType.default;
    setQ2Hint(pool[0]);
  }, [q2Type]);

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
              <div className="review-item">{isHandel ? 'Q1 가사 내용 비교' : (isHaydn ? 'Q1 악기 구성 비교' : (isSchoenberg ? 'Q1 편성 비교' : (isVivaldi ? 'Q1 장면 묘사 비교' : (isChopin ? 'Q1 악기 편성 비교' : 'Q1 등장인물 비교'))))}</div>
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

              <div className="review-item">{isHandel ? 'Q2 오페라와의 차이 비교' : (isHaydn ? 'Q2 떠오르는 동물 비교' : (isSchoenberg ? 'Q2 분위기 비교' : (isVivaldi ? 'Q2 분위기 비교' : (isChopin ? 'Q2 분위기 변화 비교' : 'Q2 줄거리 비교'))))}</div>
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
        <button className="ai-btn" onClick={showRandomQ1Hint}>✨ 참고 예시 보기</button>
        <div className="small-note">버튼을 다시 누르면 질문이 랜덤으로 바뀝니다.</div>
        <div className={`ai-bubble ${aiOpen.q1 ? 'show' : ''}`}><div className="ai-bubble-label">참고 예시 (정답 아님 · 그대로 복사 금지)</div>{q1Hint}</div>

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
        <button className="ai-btn" onClick={showRandomQ2Hint}>✨ 참고 예시 보기</button>
        <div className="small-note">버튼을 다시 누르면 질문이 랜덤으로 바뀝니다.</div>
        <div className={`ai-bubble ${aiOpen.q2 ? 'show' : ''}`}><div className="ai-bubble-label">참고 예시 (정답 아님 · 그대로 복사 금지)</div>{q2Hint}</div>

        <div className="sec">Q3. 오늘날 삶과 연결</div>
        <textarea className="txt" value={q3} onChange={(e) => setQ3(e.target.value)} placeholder={isHandel ? "할렐루야가 오늘날 나의 삶에서도 의미 있다고 느껴지는 순간이 있나요?" : (isHaydn ? "고전주의 음악인 '종달새'가 오늘날 나의 삶에서도 의미 있다고 느껴지는 순간이 있나요?" : (isSchoenberg ? "표현주의 음악인 '달에 홀린 피에로'가 오늘날 나의 삶에서도 의미 있다고 느껴지는 순간이 있나요?" : (isVivaldi ? "바로크 음악인 '사계 여름 3악장'이 오늘날 나의 삶에서도 의미 있다고 느껴지는 순간이 있나요?" : (isChopin ? "낭만주의 피아노곡인 '환상 즉흥곡'이 오늘날 나의 삶에서도 의미 있다고 느껴지는 순간이 있나요?" : "200년 전 음악인 '마왕'이 오늘날 나의 삶에서도 의미 있다고 느껴지는 순간이 있나요?"))))} />
        <div className="btn-row"><button className="btn-s" onClick={() => go('historyCards')}>← 이전</button><button className="btn-p" onClick={() => { setStageCompletion('aesthetic', true); go('finalCard'); }}>최종 감상문 만들기 →</button></div>
      </div>
    </div>
  );
}

export default AestheticPage;
