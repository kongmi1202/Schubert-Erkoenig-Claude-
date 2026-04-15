import { useEffect, useMemo, useRef, useState } from 'react';
import ArtSongTakeaway from '../ArtSongTakeaway';
import { useAppStore } from '../../store/useAppStore';

const AUDIO_SRC = {
  harmony: '/audio/handel-harmony.mp3',
  poly: '/audio/handel-polyphony.mp3'
};

function setupDraw(canvas, getBrush, onDirty) {
  const ctx = canvas.getContext('2d');
  let drawing = false;

  const getPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  const onDown = (e) => {
    drawing = true;
    onDirty();
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    canvas.setPointerCapture?.(e.pointerId);
  };

  const onMove = (e) => {
    if (!drawing) return;
    const p = getPos(e);
    const b = getBrush();
    ctx.lineWidth = b.erase ? 26 : b.size;
    ctx.strokeStyle = b.erase ? '#1a1520' : b.color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const onUp = (e) => {
    drawing = false;
    canvas.releasePointerCapture?.(e.pointerId);
  };

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointerleave', onUp);

  return () => {
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerup', onUp);
    canvas.removeEventListener('pointerleave', onUp);
  };
}

function drawHarmonyModel(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const lines = [
    { y: 72, color: '#f59e0b', w: 6 },
    { y: 92, color: '#a78bfa', w: 6 },
    { y: 112, color: '#60a5fa', w: 6 }
  ];
  const pts = [20, 70, 130, 185, 250, 320, 390, 470, 540, 620, 700, 780, 860];
  lines.forEach((line) => {
    ctx.beginPath();
    ctx.strokeStyle = line.color;
    ctx.lineWidth = line.w;
    ctx.lineCap = 'round';
    ctx.moveTo(pts[0], line.y + 10);
    for (let i = 1; i < pts.length; i += 1) {
      const upDown = i % 2 === 0 ? -16 : 16;
      ctx.lineTo(pts[i], line.y + upDown);
    }
    ctx.stroke();
  });
}

function drawPolyModel(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const specs = [
    { color: '#f87171', startY: 58, delta: 14 },
    { color: '#a78bfa', startY: 98, delta: -15 },
    { color: '#34d399', startY: 132, delta: 11 }
  ];
  const xs = [20, 80, 140, 200, 270, 340, 410, 480, 560, 640, 720, 800, 870];
  specs.forEach((s, idx) => {
    ctx.beginPath();
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.moveTo(xs[0], s.startY);
    for (let i = 1; i < xs.length; i += 1) {
      const zig = ((i + idx) % 2 === 0 ? -1 : 1) * s.delta;
      ctx.lineTo(xs[i], s.startY + zig);
    }
    ctx.stroke();
  });
}

function MelodyCanvasHandel({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);

  const harmonyRef = useRef(null);
  const polyRef = useRef(null);
  const modelHarmonyRef = useRef(null);
  const modelPolyRef = useRef(null);
  const harmonyAudioRef = useRef(null);
  const polyAudioRef = useRef(null);

  const [harmonyBrush, setHarmonyBrush] = useState({ color: '#a78bfa', size: 2, erase: false });
  const [polyBrush, setPolyBrush] = useState({ color: '#f87171', size: 2, erase: false });
  const [harmonyDirty, setHarmonyDirty] = useState(false);
  const [polyDirty, setPolyDirty] = useState(false);
  const [harmonyPlaying, setHarmonyPlaying] = useState(false);
  const [polyPlaying, setPolyPlaying] = useState(false);
  const [guideOpen, setGuideOpen] = useState({ harmony: true, poly: false });
  const [compareOpen, setCompareOpen] = useState({ harmony: false, poly: false });
  const [savedPreview, setSavedPreview] = useState({ harmony: '', poly: '' });

  useEffect(() => {
    const cleanups = [];
    if (harmonyRef.current) {
      cleanups.push(setupDraw(harmonyRef.current, () => harmonyBrush, () => setHarmonyDirty(true)));
    }
    if (polyRef.current) {
      cleanups.push(setupDraw(polyRef.current, () => polyBrush, () => setPolyDirty(true)));
    }
    return () => cleanups.forEach((fn) => fn());
  }, [harmonyBrush, polyBrush]);

  useEffect(() => {
    if (modelHarmonyRef.current) drawHarmonyModel(modelHarmonyRef.current);
    if (modelPolyRef.current) drawPolyModel(modelPolyRef.current);
  }, []);

  useEffect(() => {
    const h = harmonyAudioRef.current;
    const p = polyAudioRef.current;
    if (!h || !p) return undefined;
    if (harmonyPlaying) {
      p.pause();
      setPolyPlaying(false);
      h.play().catch(() => setHarmonyPlaying(false));
    } else {
      h.pause();
    }
    return undefined;
  }, [harmonyPlaying]);

  useEffect(() => {
    const h = harmonyAudioRef.current;
    const p = polyAudioRef.current;
    if (!h || !p) return undefined;
    if (polyPlaying) {
      h.pause();
      setHarmonyPlaying(false);
      p.play().catch(() => setPolyPlaying(false));
    } else {
      p.pause();
    }
    return undefined;
  }, [polyPlaying]);

  const clearCanvas = (canvasRef, key) => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    if (key === 'harmony') setHarmonyDirty(false);
    if (key === 'poly') setPolyDirty(false);
    setSavedPreview((prev) => ({ ...prev, [key]: '' }));
  };

  const saveCanvasPreview = (canvasRef, key) => {
    const c = canvasRef.current;
    if (!c) return;
    setSavedPreview((prev) => ({ ...prev, [key]: c.toDataURL('image/png') }));
  };

  const allDone = useMemo(() => harmonyDirty && polyDirty, [harmonyDirty, polyDirty]);

  return (
    <div className="screen active">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2-C · 분석적 감상 (할렐루야)</div>
        <div className="s-title">가락선 악보 그리기</div>
        <div className="s-desc">화성음악·다성음악의 움직임을 선으로 표현해보세요.</div>
      </div>
      <div className="body voice-body">
        <div className="sec">A 구간</div>
        <audio ref={harmonyAudioRef} src={AUDIO_SRC.harmony} preload="auto" onEnded={() => setHarmonyPlaying(false)} />
        <div className="audio-bar voice-audio-bar">
          <button type="button" className="aud-btn" onClick={() => setHarmonyPlaying((v) => !v)}>
            {harmonyPlaying ? '❚❚' : '▶'}
          </button>
          <div>
            <div className="aud-title-sm">Hallelujah! — 합창 전체가 함께</div>
          </div>
        </div>

        <div className="piano-guide">
          <button type="button" className="piano-guide-head" aria-expanded={guideOpen.harmony} onClick={() => setGuideOpen((p) => ({ ...p, harmony: !p.harmony }))}>
            <span>💡 가락선 안내</span>
            <span aria-hidden="true">{guideOpen.harmony ? '▲' : '▼'}</span>
          </button>
          {guideOpen.harmony ? (
            <div className="piano-guide-body">
              <p>음악의 높낮이와 흐름을 선으로 표현하는 방법이에요.</p>
              <p>여러 성부가 함께 움직이면 선들이 같이 올라가고 내려가요!</p>
              <div className="piano-guide-grid">
                <div className="piano-guide-chip">🔼 음이 높아지면 → 선을 위로</div>
                <div className="piano-guide-chip">🔽 음이 낮아지면 → 선을 아래로</div>
                <div className="piano-guide-chip">🎵 여러 성부가 함께 → 선이 같이 움직임</div>
                <div className="piano-guide-chip">〰️ 두껍고 묵직한 선으로 표현</div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="palette-bar">
          {['#a78bfa', '#f59e0b', '#60a5fa', '#34d399'].map((c) => (
            <button key={c} className={`pal-color-btn ${harmonyBrush.color === c && !harmonyBrush.erase ? 'active' : ''}`} style={{ background: c }} onClick={() => setHarmonyBrush((b) => ({ ...b, color: c, erase: false }))} />
          ))}
          <button className={`pal-size ${harmonyBrush.size === 2 ? 'active' : ''}`} onClick={() => setHarmonyBrush((b) => ({ ...b, size: 2, erase: false }))}>얇음</button>
          <button className={`pal-size ${harmonyBrush.size === 4 ? 'active' : ''}`} onClick={() => setHarmonyBrush((b) => ({ ...b, size: 4, erase: false }))}>중간</button>
          <button className={`pal-size ${harmonyBrush.size === 7 ? 'active' : ''}`} onClick={() => setHarmonyBrush((b) => ({ ...b, size: 7, erase: false }))}>굵음</button>
          <button className={`pal-tool ${harmonyBrush.erase ? 'active' : ''}`} onClick={() => setHarmonyBrush((b) => ({ ...b, erase: !b.erase }))}>지우개</button>
          <button className="pal-tool" onClick={() => clearCanvas(harmonyRef, 'harmony')}>전체지우기</button>
          <button className="btn-p" onClick={() => saveCanvasPreview(harmonyRef, 'harmony')}>저장</button>
        </div>
        <div className="canvas-wrap"><canvas ref={harmonyRef} width="900" height="170" /></div>

        <button type="button" className="answer-check-toggle" onClick={() => setCompareOpen((p) => ({ ...p, harmony: !p.harmony }))} aria-expanded={compareOpen.harmony}>
          <span className="answer-check-toggle-label">정답 비교하기</span>
          <span className="answer-check-toggle-chevron" aria-hidden="true">{compareOpen.harmony ? '▲' : '▼'}</span>
        </button>
        <div className={`answer-compare-slide ${compareOpen.harmony ? 'open' : ''}`}>
          <div className="answer-compare-inner">
            <div className="cv-compare">
              <div className="cv-box">
                <div className="cv-label">내가 그린 선</div>
                <div className="cv-panel">
                  {savedPreview.harmony ? (
                    <img src={savedPreview.harmony} alt="화성음악 가락선 저장 이미지" className="cv-drawing-image" />
                  ) : (
                    <div className="small-note">저장 버튼을 누르면 여기 표시돼요.</div>
                  )}
                </div>
              </div>
              <div className="cv-box">
                <div className="cv-label">모범 가락선</div>
                <div className="cv-panel"><canvas ref={modelHarmonyRef} width="900" height="170" /></div>
              </div>
            </div>
            <div className="fb show info">화성음악: 여러 성부가 함께 올라가고 내려가는 두꺼운 선 → 합창이 하나로 움직이는 웅장함을 표현해요</div>
          </div>
        </div>

        <div className="sec">B 구간</div>
        <audio ref={polyAudioRef} src={AUDIO_SRC.poly} preload="auto" onEnded={() => setPolyPlaying(false)} />
        <div className="audio-bar voice-audio-bar">
          <button type="button" className="aud-btn" onClick={() => setPolyPlaying((v) => !v)}>
            {polyPlaying ? '❚❚' : '▶'}
          </button>
          <div>
            <div className="aud-title-sm">For the Lord God — 각 성부가 차례로</div>
          </div>
        </div>

        <div className="piano-guide">
          <button type="button" className="piano-guide-head" aria-expanded={guideOpen.poly} onClick={() => setGuideOpen((p) => ({ ...p, poly: !p.poly }))}>
            <span>💡 가락선 안내</span>
            <span aria-hidden="true">{guideOpen.poly ? '▲' : '▼'}</span>
          </button>
          {guideOpen.poly ? (
            <div className="piano-guide-body">
              <p>각 성부가 독립적으로 움직이면 선들이 서로 엇갈려요!</p>
              <div className="piano-guide-grid">
                <div className="piano-guide-chip">↗ 한 성부가 올라갈 때 다른 성부는 내려가요</div>
                <div className="piano-guide-chip">↘ 선들이 서로 엇갈리는 모양으로 그려요</div>
                <div className="piano-guide-chip">🎵 여러 개의 선을 따로따로 그려도 좋아요</div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="palette-bar">
          {['#f87171', '#a78bfa', '#60a5fa', '#34d399'].map((c) => (
            <button key={c} className={`pal-color-btn ${polyBrush.color === c && !polyBrush.erase ? 'active' : ''}`} style={{ background: c }} onClick={() => setPolyBrush((b) => ({ ...b, color: c, erase: false }))} />
          ))}
          <button className={`pal-size ${polyBrush.size === 2 ? 'active' : ''}`} onClick={() => setPolyBrush((b) => ({ ...b, size: 2, erase: false }))}>얇음</button>
          <button className={`pal-size ${polyBrush.size === 4 ? 'active' : ''}`} onClick={() => setPolyBrush((b) => ({ ...b, size: 4, erase: false }))}>중간</button>
          <button className={`pal-size ${polyBrush.size === 7 ? 'active' : ''}`} onClick={() => setPolyBrush((b) => ({ ...b, size: 7, erase: false }))}>굵음</button>
          <button className={`pal-tool ${polyBrush.erase ? 'active' : ''}`} onClick={() => setPolyBrush((b) => ({ ...b, erase: !b.erase }))}>지우개</button>
          <button className="pal-tool" onClick={() => clearCanvas(polyRef, 'poly')}>전체지우기</button>
          <button className="btn-p" onClick={() => saveCanvasPreview(polyRef, 'poly')}>저장</button>
        </div>
        <div className="canvas-wrap"><canvas ref={polyRef} width="900" height="170" /></div>

        <button type="button" className="answer-check-toggle" onClick={() => setCompareOpen((p) => ({ ...p, poly: !p.poly }))} aria-expanded={compareOpen.poly}>
          <span className="answer-check-toggle-label">정답 비교하기</span>
          <span className="answer-check-toggle-chevron" aria-hidden="true">{compareOpen.poly ? '▲' : '▼'}</span>
        </button>
        <div className={`answer-compare-slide ${compareOpen.poly ? 'open' : ''}`}>
          <div className="answer-compare-inner">
            <div className="cv-compare">
              <div className="cv-box">
                <div className="cv-label">내가 그린 선</div>
                <div className="cv-panel">
                  {savedPreview.poly ? (
                    <img src={savedPreview.poly} alt="다성음악 가락선 저장 이미지" className="cv-drawing-image" />
                  ) : (
                    <div className="small-note">저장 버튼을 누르면 여기 표시돼요.</div>
                  )}
                </div>
              </div>
              <div className="cv-box">
                <div className="cv-label">모범 가락선</div>
                <div className="cv-panel"><canvas ref={modelPolyRef} width="900" height="170" /></div>
              </div>
            </div>
            <div className="fb show info">다성음악: 여러 선이 서로 다른 방향으로 엇갈리는 모양 → 각 성부가 독립적으로 움직이는 풍부한 화음</div>
          </div>
        </div>

        {allDone ? (
          <ArtSongTakeaway
            eyebrow="오라토리오의 두 번째 특징"
            title="합창의 비중이 크며 중창과 독창도 함께 사용한다"
            description="종교적 내용의 장엄함과 웅장함을 표현하기 위해 대규모 합창이 중심이 돼요. 여기에 중창과 독창이 더해지면서 다양한 감정과 이야기를 전달해요."
          />
        ) : null}

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('voiceDesign')}>← 이전</button>
          <button
            className="btn-p"
            disabled={!allDone}
            style={!allDone ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            onClick={() => {
              setStageCompletion('piano', true);
              go('historyCards');
            }}
          >
            다음 단계 →
          </button>
        </div>
      </div>
    </div>
  );
}

export default MelodyCanvasHandel;
