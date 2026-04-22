import { useEffect, useMemo, useRef, useState } from 'react';
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppStore } from '../../store/useAppStore';

const keywords = ['기쁨', '슬픔', '긴장', '평화', '쓸쓸함', '경쾌', '웅장', '역동적'];
const colors = [
  { name: '짙은 보라', value: '#4c1d95' }, { name: '어두운 붉은색', value: '#991b1b' }, { name: '짙은 남색', value: '#1e3a8a' }, { name: '검정', value: '#374151' },
  { name: '어두운 황토', value: '#a16207' }, { name: '어두운 초록', value: '#166534' }, { name: '갈색', value: '#92400e' }, { name: '자주', value: '#86198f' }
];
const scienceOptions = [
  { emoji: '⛈️', label: '폭풍우' }, { emoji: '🌊', label: '파도' }, { emoji: '🌪️', label: '태풍' },
  { emoji: '🌫️', label: '안개' }, { emoji: '🌋', label: '화산' }, { emoji: '🌑', label: '일식' }
];
const ccItems = [
  { name: '체육', icon: '🏃', desc: '사진 찍기' },
  { name: '과학', icon: '🔬', desc: '자연 현상 고르기' },
  { name: '사회', icon: '🗺️', desc: '지도에서 장소 선택' },
  { name: '수학', icon: '△', desc: '도형 그리기' }
];
const sensoryPromptHints = [
  '이 음악을 한 장면의 영화로 바꾼다면 어떤 순간을 고를래?',
  '친구에게 이 곡 분위기를 10초 안에 설명한다면 어떤 단어 3개를 고를래?',
  '처음 들었을 때와 끝까지 들은 뒤 느낌이 어떻게 달라졌는지 적어볼래?',
  '같은 음악을 다른 친구는 다르게 느낄 수도 있어. 너의 해석 근거 1가지는 무엇일까?',
  '이 곡의 기분을 날씨나 자연 현상 하나에 비유하면 무엇이고, 왜 그렇게 느꼈을까?'
];

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng);
    }
  });
  return null;
}

function SensoryPage({ go }) {
  const selectedKeywords = useAppStore((s) => s.selectedKeywords);
  const selectedColors = useAppStore((s) => s.selectedColors);
  const sensoryDesc = useAppStore((s) => s.sensoryDesc);
  const aiOpen = useAppStore((s) => s.aiOpen);
  const toggleKeyword = useAppStore((s) => s.toggleKeyword);
  const toggleColor = useAppStore((s) => s.toggleColor);
  const setSensoryDesc = useAppStore((s) => s.setSensoryDesc);
  const toggleAi = useAppStore((s) => s.toggleAi);
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const sensoryArtifacts = useAppStore((s) => s.sensoryArtifacts);
  const setSensoryArtifacts = useAppStore((s) => s.setSensoryArtifacts);
  const [selectedActivities, setSelectedActivities] = useState(sensoryArtifacts.selectedActivities || []);
  const [pePhoto, setPePhoto] = useState(sensoryArtifacts.pePhoto || '');
  const [peAnswer, setPeAnswer] = useState(sensoryArtifacts.peAnswer || '');
  const [scienceSelected, setScienceSelected] = useState(sensoryArtifacts.scienceSelected || []);
  const [scienceAnswer, setScienceAnswer] = useState(sensoryArtifacts.scienceAnswer || '');
  const [mapPosition, setMapPosition] = useState(null);
  const [mapAddress, setMapAddress] = useState(sensoryArtifacts.mapAddress || '');
  const [mapAnswer, setMapAnswer] = useState(sensoryArtifacts.mapAnswer || '');
  const [mathAnswer, setMathAnswer] = useState(sensoryArtifacts.mathAnswer || '');
  const [mathDrawing, setMathDrawing] = useState(sensoryArtifacts.mathDrawing || '');
  const [drawColor, setDrawColor] = useState('#000000');
  const [drawSize, setDrawSize] = useState(4);
  const [drawingSaved, setDrawingSaved] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [sensoryHint, setSensoryHint] = useState(sensoryPromptHints[0]);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mathCanvasRef = useRef(null);
  const drawingRef = useRef(false);

  const isActivityOn = (name) => selectedActivities.includes(name);

  const toggleActivity = (name) => {
    setSelectedActivities((prev) => {
      if (prev.includes(name)) return prev.filter((v) => v !== name);
      if (prev.length >= 2) return prev;
      return [...prev, name];
    });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
    } catch (e) {
      alert('카메라를 사용할 수 없습니다. 권한을 확인해주세요.');
      setCameraOn(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext('2d');
    ctx.drawImage(v, 0, 0);
    setPePhoto(c.toDataURL('image/png'));
    stopCamera();
  };

  const toggleScience = (label) => {
    setScienceSelected((prev) => {
      if (prev.includes(label)) return prev.filter((v) => v !== label);
      if (prev.length >= 3) return prev;
      return [...prev, label];
    });
  };

  useEffect(() => {
    if (!isActivityOn('체육')) stopCamera();
  }, [selectedActivities]);

  useEffect(() => {
    setSensoryArtifacts({ selectedActivities, pePhoto, peAnswer, scienceSelected, scienceAnswer, mapAddress, mapAnswer, mathDrawing, mathAnswer });
  }, [selectedActivities, pePhoto, peAnswer, scienceSelected, scienceAnswer, mapAddress, mapAnswer, mathDrawing, mathAnswer, setSensoryArtifacts]);

  useEffect(() => {
    if (!mapPosition) return;
    const run = async () => {
      try {
        const lat = mapPosition.lat;
        const lng = mapPosition.lng;
        const nominatimRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=ko,en&lat=${lat}&lon=${lng}`);
        const nominatimData = await nominatimRes.json();
        const nominatimAddress = nominatimData?.display_name?.trim();

        if (nominatimAddress) {
          setMapAddress(nominatimAddress);
          return;
        }

        // Fallback: works well for many countries when Nominatim is sparse/rate-limited.
        const fallbackRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=ko`);
        const fallbackData = await fallbackRes.json();
        const parts = [
          fallbackData?.locality,
          fallbackData?.city || fallbackData?.principalSubdivision,
          fallbackData?.countryName
        ].filter(Boolean);
        setMapAddress(parts.length ? parts.join(', ') : '주소를 찾을 수 없습니다.');
      } catch (e) {
        setMapAddress('주소를 불러오지 못했습니다.');
      }
    };
    run();
  }, [mapPosition]);

  useEffect(() => {
    const canvas = mathCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: p.clientX - rect.left, y: p.clientY - rect.top };
  };

  const beginDraw = (e) => {
    const canvas = mathCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e, canvas);
    drawingRef.current = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!drawingRef.current) return;
    const canvas = mathCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getPos(e, canvas);
    ctx.lineWidth = drawSize;
    ctx.strokeStyle = drawColor;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = () => {
    drawingRef.current = false;
  };

  const clearMath = () => {
    const canvas = mathCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setDrawingSaved(false);
    setMathDrawing('');
  };

  const saveMath = () => {
    const canvas = mathCanvasRef.current;
    if (canvas) setMathDrawing(canvas.toDataURL('image/png'));
    setDrawingSaved(true);
  };
  const showRandomSensoryHint = () => {
    const next = sensoryPromptHints[Math.floor(Math.random() * sensoryPromptHints.length)];
    setSensoryHint(next);
    if (!aiOpen.sensory) toggleAi('sensory');
  };

  const isStage1Complete = useMemo(() => {
    const hasKeywords = selectedKeywords.length > 0;
    const hasColors = selectedColors.length >= 2;
    const hasSensoryDesc = sensoryDesc.trim().length > 0;
    const hasTwoActivities = selectedActivities.length === 2;
    if (!hasKeywords || !hasColors || !hasSensoryDesc || !hasTwoActivities) return false;

    const activityDone = selectedActivities.every((activity) => {
      if (activity === '체육') return !!pePhoto && peAnswer.trim().length > 0;
      if (activity === '과학') return scienceSelected.length > 0 && scienceAnswer.trim().length > 0;
      if (activity === '사회') return !!mapAddress && mapAnswer.trim().length > 0;
      if (activity === '수학') return !!mathDrawing && mathAnswer.trim().length > 0;
      return true;
    });

    return activityDone;
  }, [
    selectedKeywords,
    selectedColors,
    sensoryDesc,
    selectedActivities,
    pePhoto,
    peAnswer,
    scienceSelected,
    scienceAnswer,
    mapAddress,
    mapAnswer,
    mathDrawing,
    mathAnswer
  ]);

  return (
    <div className="screen active">
      <div className="stage-header"><div className="s-eyebrow">STAGE 1 · 감각적 감상</div><div className="s-title">음악을 느껴보세요</div></div>
      <div className="body">
        <div className="sec">감성 키워드 선택 (여러 개 가능)</div>
        <div className="kw-grid">{keywords.map((k) => <button key={k} className={`kw-btn ${selectedKeywords.includes(k) ? 'on' : ''}`} onClick={() => toggleKeyword(k)}>{k}</button>)}</div>
        <div className="sec">핵심 색상 선택 (2~4개)</div>
        <div className="palette">{colors.map((c) => <button key={c.name} title={c.name} className={`pal-btn ${selectedColors.includes(c.name) ? 'on' : ''}`} style={{ background: c.value }} onClick={() => toggleColor(c.name)} />)}</div>
        <div className="pal-note">선택된 색상: {selectedColors.length}개 (2~4개 선택)</div>
        <div className="pal-selected-names">{selectedColors.length ? selectedColors.join(', ') : '선택한 색상 이름이 여기에 표시됩니다.'}</div>
        <div className="sec">느낌·분위기 서술</div>
        <textarea className="txt" value={sensoryDesc} onChange={(e) => setSensoryDesc(e.target.value)} placeholder="자유롭게 써보세요" />
        <button className="ai-btn" onClick={showRandomSensoryHint}>✨ 참고 예시 보기</button>
        <div className="small-note">버튼을 다시 누르면 질문이 랜덤으로 바뀝니다.</div>
        <div className={`ai-bubble ${aiOpen.sensory ? 'show' : ''}`}>
          <div className="ai-bubble-label">참고 예시 (정답 아님 · 그대로 복사 금지)</div>
          {sensoryHint}
        </div>

        <div className="sec">음악 말고 다른 방식으로 표현하기 (2개 선택)</div>
        <div className="cc-grid">
          {ccItems.map((item) => (
            <button key={item.name} className={`cc-btn ${isActivityOn(item.name) ? 'on' : ''}`} onClick={() => toggleActivity(item.name)}>
              <div className={`cc-icon ${item.name === '수학' ? 'cc-icon-math' : ''}`}>{item.icon}</div>
              <div className="cc-name">{item.name}</div>
              <div className="cc-desc">{item.desc}</div>
            </button>
          ))}
        </div>

        {isActivityOn('체육') ? (
          <div className="act-panel show">
            <div className="act-title">🏃 체육 - 사진 촬영 활동</div>
            {!pePhoto ? (
              <div className="cam-wrap">
                <video ref={videoRef} autoPlay playsInline />
                <div className="btn-row" style={{ paddingBottom: 0 }}>
                  <button className="btn-s" onClick={startCamera}>카메라 켜기</button>
                  <button className="btn-p" disabled={!cameraOn} style={!cameraOn ? { opacity: 0.5, cursor: 'not-allowed' } : undefined} onClick={capturePhoto}>사진 찍기</button>
                </div>
              </div>
            ) : (
              <>
                <img src={pePhoto} alt="촬영 사진" className="captured-img" />
                <div className="btn-row" style={{ paddingBottom: 0 }}>
                  <button className="btn-s" onClick={() => setPePhoto('')}>다시 찍기</button>
                </div>
              </>
            )}
            {pePhoto ? (
              <>
                <div className="small-note">이 동작과 '마왕'을 감상한 느낌이 어떤 관계가 있나요?</div>
                <textarea className="txt" value={peAnswer} onChange={(e) => setPeAnswer(e.target.value)} />
              </>
            ) : null}
          </div>
        ) : null}

        {isActivityOn('과학') ? (
          <div className="act-panel show">
            <div className="act-title">🔬 과학 - 자연 현상 선택 (1~3개)</div>
            <div className="sci-grid">
              {scienceOptions.map((opt) => (
                <button key={opt.label} className={`sci-btn ${scienceSelected.includes(opt.label) ? 'on' : ''}`} onClick={() => toggleScience(opt.label)}>
                  <div className="si">{opt.emoji}</div>{opt.label}
                </button>
              ))}
            </div>
            {scienceSelected.length > 0 ? (
              <>
                <div className="small-note">선택: {scienceSelected.join(', ')}</div>
                <div className="small-note">이 자연 현상과 '마왕'을 감상한 느낌이 어떤 관계가 있나요?</div>
                <textarea className="txt" value={scienceAnswer} onChange={(e) => setScienceAnswer(e.target.value)} />
              </>
            ) : null}
          </div>
        ) : null}

        {isActivityOn('사회') ? (
          <div className="act-panel show">
            <div className="act-title">🗺️ 사회 - 지도에서 장소 선택</div>
            <div className="map-wrap">
              <MapContainer center={[37.5665, 126.978]} zoom={5} style={{ height: '280px', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapClickHandler onPick={setMapPosition} />
                {mapPosition ? (
                  <CircleMarker
                    center={mapPosition}
                    radius={9}
                    pathOptions={{ color: '#a78bfa', fillColor: '#8b5cf6', fillOpacity: 0.85, weight: 2 }}
                  />
                ) : null}
              </MapContainer>
            </div>
            {mapPosition ? <div className="map-address">선택한 위치: {mapAddress}</div> : <div className="small-note">지도를 클릭해 마커를 찍어주세요.</div>}
            {mapPosition ? (
              <>
                <div className="small-note">이 장소와 '마왕'을 감상한 느낌이 어떤 관계가 있나요?</div>
                <textarea className="txt" value={mapAnswer} onChange={(e) => setMapAnswer(e.target.value)} />
              </>
            ) : null}
          </div>
        ) : null}

        {isActivityOn('수학') ? (
          <div className="act-panel show">
            <div className="act-title">△ 수학 - 도형 그리기</div>
            <div className="math-toolbar">
              {['#000000', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b'].map((c) => (
                <button key={c} className="math-color" style={{ background: c }} onClick={() => setDrawColor(c)} />
              ))}
              <button className="btn-s" onClick={() => setDrawSize(2)}>얇게</button>
              <button className="btn-s" onClick={() => setDrawSize(5)}>중간</button>
              <button className="btn-s" onClick={() => setDrawSize(9)}>굵게</button>
              <button className="btn-s" onClick={clearMath}>지우기</button>
              <button className="btn-p" onClick={saveMath}>저장</button>
            </div>
            <div className="math-canvas-wrap">
              <canvas
                ref={mathCanvasRef}
                width={640}
                height={280}
                onMouseDown={beginDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={beginDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
            </div>
            {drawingSaved ? (
              <>
                <div className="small-note">이 도형과 '마왕'을 감상한 느낌이 어떤 관계가 있나요?</div>
                <textarea className="txt" value={mathAnswer} onChange={(e) => setMathAnswer(e.target.value)} />
              </>
            ) : null}
          </div>
        ) : null}

        <div className="btn-row"><button className="btn-s" onClick={() => go('videoPage')}>← 이전</button><button className="btn-p" onClick={() => { setStageCompletion('sensory', isStage1Complete); go('analyticalOverview'); }}>다음 단계 →</button></div>
      </div>
    </div>
  );
}

export default SensoryPage;
