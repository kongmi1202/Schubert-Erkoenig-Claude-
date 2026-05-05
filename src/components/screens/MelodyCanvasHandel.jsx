import { useEffect, useMemo, useRef, useState } from 'react';
import ArtSongTakeaway from '../ArtSongTakeaway';
import { SegmentYoutubePlayer } from '../SegmentYoutubePlayer';
import { useAppStore } from '../../store/useAppStore';

/** 할렐루야 감상(VideoPage handel)과 동일 영상 */
const HANDEL_HALLELUJAH_VIDEO_ID = 'XBSBBXFmHSE';
const SEGMENT_HALLELUJAH_FULL_CHOIR = { start: 11, end: 30 };
const SEGMENT_LORD_REIGN_POLY = { start: 99, end: 122 };

const SCORE_SHOT_SRC = {
  harmony: '/assets/handel-harmony-shot.png',
  poly: '/assets/handel-poly-shot.png'
};

const MODEL_LINE_SRC = {
  harmony: '/assets/handel-model-hallelujah.png',
  poly: '/assets/handel-model-lord-reign.png'
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

function MelodyCanvasHandel({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const melodyCanvasHandelState = useAppStore((s) => s.melodyCanvasHandelState);
  const setMelodyCanvasHandelState = useAppStore((s) => s.setMelodyCanvasHandelState);

  const harmonyRef = useRef(null);
  const polyRef = useRef(null);
  const harmonyYtRef = useRef(null);
  const polyYtRef = useRef(null);

  const [harmonyBrush, setHarmonyBrush] = useState({ color: '#a78bfa', size: 2, erase: false });
  const [polyBrush, setPolyBrush] = useState({ color: '#f87171', size: 2, erase: false });
  const [harmonyDirty, setHarmonyDirty] = useState(false);
  const [polyDirty, setPolyDirty] = useState(false);
  const [guideOpen, setGuideOpen] = useState({ harmony: true, poly: false });
  const [compareOpen, setCompareOpen] = useState({ harmony: false, poly: false });
  const [savedPreview, setSavedPreview] = useState(() => melodyCanvasHandelState?.savedPreview || { harmony: '', poly: '' });

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

  useEffect(() => {
    setMelodyCanvasHandelState({ savedPreview });
  }, [savedPreview, setMelodyCanvasHandelState]);

  return (
    <div className="screen active">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2-C · 분석적 감상 (할렐루야)</div>
        <div className="s-title">가락선 악보 그리기</div>
        <div className="s-desc">화성음악·다성음악의 움직임을 선으로 표현해보세요.</div>
      </div>
      <div className="body voice-body">
        <div className="sec">A 구간</div>
        <div className="audio-bar voice-audio-bar">
          <div className="voice-audio-main">
            <div className="voice-audio-yt">
              <SegmentYoutubePlayer
                videoId={HANDEL_HALLELUJAH_VIDEO_ID}
                start={SEGMENT_HALLELUJAH_FULL_CHOIR.start}
                end={SEGMENT_HALLELUJAH_FULL_CHOIR.end}
                title="할렐루야! 합창 전체 구간 (0:11–0:30)"
                onPlayerReady={(p) => {
                  harmonyYtRef.current = p;
                }}
                onPlaying={() => {
                  polyYtRef.current?.pauseVideo?.();
                }}
              />
            </div>
            <div className="voice-audio-title-wrap">
              <div className="aud-title-sm">할렐루야! — 합창 전체가 함께</div>
            </div>
          </div>
          <div className="voice-audio-score">
            <img src={SCORE_SHOT_SRC.harmony} alt="할렐루야 합창 전체 악보" />
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

        {savedPreview.harmony ? (
          <button type="button" className="answer-check-toggle" onClick={() => setCompareOpen((p) => ({ ...p, harmony: !p.harmony }))} aria-expanded={compareOpen.harmony}>
            <span className="answer-check-toggle-label">정답 비교하기</span>
            <span className="answer-check-toggle-chevron" aria-hidden="true">{compareOpen.harmony ? '▲' : '▼'}</span>
          </button>
        ) : null}
        {savedPreview.harmony ? (
          <div className={`answer-compare-slide ${compareOpen.harmony ? 'open' : ''}`}>
            <div className="answer-compare-inner">
              <div className="cv-compare">
                <div className="cv-box">
                  <div className="cv-label">내가 그린 선</div>
                  <div className="cv-panel">
                    <img src={savedPreview.harmony} alt="화성음악 가락선 저장 이미지" className="cv-drawing-image" />
                  </div>
                </div>
                <div className="cv-box">
                  <div className="cv-label">개념 예시 가락선</div>
                  <div className="cv-panel">
                    <img src={MODEL_LINE_SRC.harmony} alt="할렐루야 모범 가락선" className="cv-drawing-image" />
                  </div>
                </div>
              </div>
              <div className="fb show info">
                1. 내가 그린 가락선 악보에서 베이스→테너→알토→소프라노처럼 성부가 번갈아 움직이는지 확인해 보세요.<br />
                2. 이렇게 모든 성부가 같은 선율을 번갈아 노래하는 부분을 '다성음악'이라고 해요!<br />
                3. 내가 그린 가락선 악보가 마음에 들지 않으면 지우고 다시 그려 보세요.
              </div>
            </div>
          </div>
        ) : null}

        <div className="sec">B 구간</div>
        <div className="audio-bar voice-audio-bar">
          <div className="voice-audio-main">
            <div className="voice-audio-yt">
              <SegmentYoutubePlayer
                videoId={HANDEL_HALLELUJAH_VIDEO_ID}
                start={SEGMENT_LORD_REIGN_POLY.start}
                end={SEGMENT_LORD_REIGN_POLY.end}
                title="또 주가 길이 다스리시리 성부 구간 (1:39–2:02)"
                onPlayerReady={(p) => {
                  polyYtRef.current = p;
                }}
                onPlaying={() => {
                  harmonyYtRef.current?.pauseVideo?.();
                }}
              />
            </div>
            <div className="voice-audio-title-wrap">
              <div className="aud-title-sm">또 주가 길이 다스리시리 — 각 성부가 차례로</div>
            </div>
          </div>
          <div className="voice-audio-score">
            <img src={SCORE_SHOT_SRC.poly} alt="또 주가 길이 다스리시리 성부 진행 악보" />
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

        {savedPreview.poly ? (
          <button type="button" className="answer-check-toggle" onClick={() => setCompareOpen((p) => ({ ...p, poly: !p.poly }))} aria-expanded={compareOpen.poly}>
            <span className="answer-check-toggle-label">정답 비교하기</span>
            <span className="answer-check-toggle-chevron" aria-hidden="true">{compareOpen.poly ? '▲' : '▼'}</span>
          </button>
        ) : null}
        {savedPreview.poly ? (
          <div className={`answer-compare-slide ${compareOpen.poly ? 'open' : ''}`}>
            <div className="answer-compare-inner">
              <div className="cv-compare">
                <div className="cv-box">
                  <div className="cv-label">내가 그린 선</div>
                  <div className="cv-panel">
                    <img src={savedPreview.poly} alt="다성음악 가락선 저장 이미지" className="cv-drawing-image" />
                  </div>
                </div>
                <div className="cv-box">
                  <div className="cv-label">개념 예시 가락선</div>
                  <div className="cv-panel">
                    <img src={MODEL_LINE_SRC.poly} alt="또 주가 길이 다스리시리 모범 가락선" className="cv-drawing-image" />
                  </div>
                </div>
              </div>
              <div className="fb show info">핵심 개념(다성음악): 베이스→테너→알토→소프라노처럼 성부가 번갈아 움직이는지(교대 진행)만 확인하면 돼요. 선 모양은 다양해도 괜찮아요.</div>
              <div className="fb show info">
                1. 내가 그린 가락선 악보에서 네 성부가 동시에 함께 움직이는 확인해 보세요.<br />
                2. 베이스(Bass)부터 소프라노(Soprano)까지 가락선이 순서에 맞게 위치해있는지 확인해 보세요.<br />
                3. 이렇게 모든 성부가 화음을 맞춰 함께 노래하는 부분을 '화성음악'이라고 해요!<br />
                4. 내가 그린 가락선 악보가 마음에 들지 않으면 지우고 다시 그려 보세요.
              </div>
            </div>
          </div>
        ) : null}

        {allDone ? (
          <ArtSongTakeaway
            eyebrow="오라토리오의 두 번째 특징"
            title="합창의 비중이 크며 중창과 독창도 함께 사용한다"
            description="종교적 내용의 장엄함과 웅장함을 표현하기 위해 대규모 합창이 중심이 돼요. 여기에 중창과 독창이 더해지면서 다양한 감정과 이야기를 전달해요."
          />
        ) : null}

        {allDone ? (
          <div className="review-card" style={{ marginTop: 12 }}>
            <div className="review-section-title">가락선으로 정리하는 핵심 개념</div>
            <div className="fb show info" style={{ marginBottom: 10 }}>
              화성음악: 여러 성부가 함께 움직여 선들이 비슷한 방향으로 진행돼요.
            </div>
            <div className="fb show info" style={{ marginBottom: 0 }}>
              다성음악: 각 성부가 독립적으로 움직여 선들이 서로 엇갈리며 진행돼요.
            </div>
          </div>
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
