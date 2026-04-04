import { useCallback, useEffect, useRef, useState } from 'react';
import ArtSongTakeaway from '../ArtSongTakeaway';
import CompareAiFeedbackBlock from '../CompareAiFeedbackBlock';
import { generatePianoCompareFeedback } from '../../lib/compareFeedback';
import { useAppStore } from '../../store/useAppStore';

const PIANO_RH_AUDIO_SRC = '/audio/mawang-rh-accompaniment.mp3';
const PIANO_LH_AUDIO_SRC = '/audio/mawang-lh-accompaniment.mp3';
/** HTML audio volume 최대 1을 넘기는 배율 (Web Audio GainNode) */
const PIANO_PLAYBACK_GAIN = 2;

function connectPianoBoost(el, ctxRef, wiredRef) {
  if (!el || wiredRef.current) return ctxRef.current;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return ctxRef.current;
  const ctx = ctxRef.current ?? new AC();
  ctxRef.current = ctx;
  try {
    const src = ctx.createMediaElementSource(el);
    const gain = ctx.createGain();
    gain.gain.value = PIANO_PLAYBACK_GAIN;
    src.connect(gain);
    gain.connect(ctx.destination);
    el.volume = 1;
    wiredRef.current = true;
  } catch {
    el.volume = 1;
    wiredRef.current = true;
  }
  return ctx;
}

function setupDraw(canvas, getBrush) {
  const ctx = canvas.getContext('2d');
  let drawing = false;
  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: (p.clientX - r.left) * (canvas.width / r.width), y: (p.clientY - r.top) * (canvas.height / r.height) };
  };
  const down = (e) => { drawing = true; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
  const move = (e) => {
    if (!drawing) return;
    const p = pos(e);
    const brush = getBrush();
    ctx.lineWidth = brush.erase ? 24 : brush.size;
    ctx.strokeStyle = brush.erase ? '#1a1520' : brush.color;
    ctx.lineCap = 'round';
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };
  const up = () => { drawing = false; };
  canvas.addEventListener('mousedown', down);
  canvas.addEventListener('mousemove', move);
  canvas.addEventListener('mouseup', up);
  canvas.addEventListener('mouseleave', up);
  canvas.addEventListener('touchstart', down, { passive: true });
  canvas.addEventListener('touchmove', move, { passive: true });
  canvas.addEventListener('touchend', up, { passive: true });
  return () => {
    canvas.removeEventListener('mousedown', down);
    canvas.removeEventListener('mousemove', move);
    canvas.removeEventListener('mouseup', up);
    canvas.removeEventListener('mouseleave', up);
    canvas.removeEventListener('touchstart', down);
    canvas.removeEventListener('touchmove', move);
    canvas.removeEventListener('touchend', up);
  };
}

function PianoAnalysis({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const rhRef = useRef(null);
  const lhRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [rhBrush, setRhBrush] = useState({ color: '#a78bfa', size: 2, erase: false });
  const [lhBrush, setLhBrush] = useState({ color: '#f87171', size: 2, erase: false });
  const [saved, setSaved] = useState({ rh: false, lh: false });
  const [rhPlaying, setRhPlaying] = useState(false);
  const [lhPlaying, setLhPlaying] = useState(false);
  const [rhScene, setRhScene] = useState('');
  const [lhScene, setLhScene] = useState('');
  const [showCompare, setShowCompare] = useState(false);
  const rhAudioRef = useRef(null);
  const lhAudioRef = useRef(null);
  const pianoCtxRef = useRef(null);
  const rhBoostWiredRef = useRef(false);
  const lhBoostWiredRef = useRef(false);

  useEffect(() => {
    const rh = rhAudioRef.current;
    const lh = lhAudioRef.current;
    if (!rh) return;

    const run = async () => {
      if (rhPlaying) {
        lh?.pause();
        setLhPlaying(false);
        connectPianoBoost(rh, pianoCtxRef, rhBoostWiredRef);
        if (lh) connectPianoBoost(lh, pianoCtxRef, lhBoostWiredRef);
        const ctx = pianoCtxRef.current;
        if (ctx?.state === 'suspended') await ctx.resume();
        try {
          await rh.play();
        } catch {
          setRhPlaying(false);
        }
      } else {
        rh.pause();
      }
    };
    void run();
  }, [rhPlaying]);

  useEffect(() => {
    const rh = rhAudioRef.current;
    const lh = lhAudioRef.current;
    if (!lh) return;

    const run = async () => {
      if (lhPlaying) {
        rh?.pause();
        setRhPlaying(false);
        connectPianoBoost(rh, pianoCtxRef, rhBoostWiredRef);
        connectPianoBoost(lh, pianoCtxRef, lhBoostWiredRef);
        const ctx = pianoCtxRef.current;
        if (ctx?.state === 'suspended') await ctx.resume();
        try {
          await lh.play();
        } catch {
          setLhPlaying(false);
        }
      } else {
        lh.pause();
      }
    };
    void run();
  }, [lhPlaying]);

  useEffect(() => () => {
    rhAudioRef.current?.pause();
    lhAudioRef.current?.pause();
    pianoCtxRef.current?.close().catch(() => {});
    pianoCtxRef.current = null;
    rhBoostWiredRef.current = false;
    lhBoostWiredRef.current = false;
  }, []);

  useEffect(() => {
    const cleanups = [];
    if (rhRef.current) cleanups.push(setupDraw(rhRef.current, () => rhBrush));
    if (lhRef.current) cleanups.push(setupDraw(lhRef.current, () => lhBrush));
    setReady(true);
    return () => cleanups.forEach((fn) => fn());
  }, [rhBrush, lhBrush]);

  const clearCanvas = (canvasRef, key) => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    setSaved((prev) => ({ ...prev, [key]: false }));
  };
  const canCheckAnswer = saved.rh && saved.lh && !!rhScene && !!lhScene;

  const requestPianoFeedback = useCallback(() => generatePianoCompareFeedback(), []);

  return (
    <div className="screen active"><div className="stage-header"><div className="s-eyebrow">STAGE 2-C · 분석적 감상 — 음계 · 리듬꼴</div><div className="s-title">피아노 전주 분석하기</div><div className="s-desc">오른손과 왼손 반주를 각각 듣고 가락선으로 표현해보세요.<br />음악 요소: <strong>음계, 리듬꼴</strong></div></div>
      <div className="body voice-body">
        <div className="sec">오른손 반주</div>
        <audio
          ref={rhAudioRef}
          className="piano-audio-hidden"
          src={PIANO_RH_AUDIO_SRC}
          preload="auto"
          onLoadedMetadata={(e) => {
            e.currentTarget.volume = 1;
          }}
          onEnded={() => setRhPlaying(false)}
        />
        <div className="audio-bar voice-audio-bar piano-audio-bar">
          <button type="button" className="aud-btn" aria-label={rhPlaying ? '오른손 반주 일시정지' : '오른손 반주 재생'} onClick={() => setRhPlaying((p) => !p)}>
            {rhPlaying ? '❚❚' : '▶'}
          </button>
          <div>
            <div className="aud-title-sm">오른손 반주만 듣기</div>
            <div className="aud-sub">빠른 셋잇단음표 패턴</div>
          </div>
        </div>
        <div className="small-note">오른손 반주를 들으며 가락선을 그려보세요</div>
        <div className="palette-bar">
          {['#a78bfa', '#f87171', '#34d399', '#fbbf24', '#60a5fa'].map((c) => (
            <button key={c} className={`pal-color-btn ${rhBrush.color === c && !rhBrush.erase ? 'active' : ''}`} style={{ background: c }} onClick={() => setRhBrush((b) => ({ ...b, color: c, erase: false }))} />
          ))}
          <button className={`pal-size ${rhBrush.size === 2 ? 'active' : ''}`} onClick={() => setRhBrush((b) => ({ ...b, size: 2, erase: false }))}>얇음</button>
          <button className={`pal-size ${rhBrush.size === 4 ? 'active' : ''}`} onClick={() => setRhBrush((b) => ({ ...b, size: 4, erase: false }))}>중간</button>
          <button className={`pal-size ${rhBrush.size === 7 ? 'active' : ''}`} onClick={() => setRhBrush((b) => ({ ...b, size: 7, erase: false }))}>굵음</button>
          <button className={`pal-tool ${rhBrush.erase ? 'active' : ''}`} onClick={() => setRhBrush((b) => ({ ...b, erase: !b.erase }))}>지우개</button>
          <button className="pal-tool" onClick={() => clearCanvas(rhRef, 'rh')}>전체 지우기</button>
          <button className="btn-p" onClick={() => setSaved((s) => ({ ...s, rh: true }))}>저장</button>
        </div>
        <div className="canvas-wrap"><canvas ref={rhRef} width="900" height="170" /></div>
        {saved.rh ? <div className="small-note">오른손 가락선이 저장되었습니다.</div> : null}
        <div className="sec">오른손 반주와 어울리는 장면</div>
        <div className="scene-grid">
          {[
            { icon: '🐎', name: '말이 달림' },
            { icon: '⛈️', name: '폭풍우' },
            { icon: '🌊', name: '파도' },
            { icon: '💨', name: '바람' }
          ].map((item) => (
            <button key={item.name} className={`scene-btn ${rhScene === item.name ? 'sel' : ''}`} onClick={() => setRhScene(item.name)}>
              <div className="scene-icon">{item.icon}</div>
              <div className="scene-name">{item.name}</div>
            </button>
          ))}
        </div>

        <div className="sec">왼손 반주</div>
        <audio
          ref={lhAudioRef}
          className="piano-audio-hidden"
          src={PIANO_LH_AUDIO_SRC}
          preload="auto"
          onLoadedMetadata={(e) => {
            e.currentTarget.volume = 1;
          }}
          onEnded={() => setLhPlaying(false)}
        />
        <div className="audio-bar voice-audio-bar piano-audio-bar">
          <button type="button" className="aud-btn" aria-label={lhPlaying ? '왼손 반주 일시정지' : '왼손 반주 재생'} onClick={() => setLhPlaying((p) => !p)}>
            {lhPlaying ? '❚❚' : '▶'}
          </button>
          <div>
            <div className="aud-title-sm">왼손 반주만 듣기</div>
            <div className="aud-sub">느리고 강한 베이스</div>
          </div>
        </div>
        <div className="small-note">왼손 반주를 들으며 가락선을 그려보세요</div>
        <div className="palette-bar">
          {['#f87171', '#a78bfa', '#fbbf24', '#34d399', '#60a5fa'].map((c) => (
            <button key={c} className={`pal-color-btn ${lhBrush.color === c && !lhBrush.erase ? 'active' : ''}`} style={{ background: c }} onClick={() => setLhBrush((b) => ({ ...b, color: c, erase: false }))} />
          ))}
          <button className={`pal-size ${lhBrush.size === 2 ? 'active' : ''}`} onClick={() => setLhBrush((b) => ({ ...b, size: 2, erase: false }))}>얇음</button>
          <button className={`pal-size ${lhBrush.size === 4 ? 'active' : ''}`} onClick={() => setLhBrush((b) => ({ ...b, size: 4, erase: false }))}>중간</button>
          <button className={`pal-size ${lhBrush.size === 7 ? 'active' : ''}`} onClick={() => setLhBrush((b) => ({ ...b, size: 7, erase: false }))}>굵음</button>
          <button className={`pal-tool ${lhBrush.erase ? 'active' : ''}`} onClick={() => setLhBrush((b) => ({ ...b, erase: !b.erase }))}>지우개</button>
          <button className="pal-tool" onClick={() => clearCanvas(lhRef, 'lh')}>전체 지우기</button>
          <button className="btn-p" onClick={() => setSaved((s) => ({ ...s, lh: true }))}>저장</button>
        </div>
        <div className="canvas-wrap"><canvas ref={lhRef} width="900" height="170" /></div>
        {saved.lh ? <div className="small-note">왼손 가락선이 저장되었습니다.</div> : null}
        <div className="sec">왼손 반주와 어울리는 장면</div>
        <div className="scene-grid">
          {[
            { icon: '💓', name: '심장이 두근거림' },
            { icon: '🥁', name: '북소리' },
            { icon: '👣', name: '무거운 발걸음' },
            { icon: '🌊', name: '잔잔한 물결' }
          ].map((item) => (
            <button key={item.name} className={`scene-btn ${lhScene === item.name ? 'sel' : ''}`} onClick={() => setLhScene(item.name)}>
              <div className="scene-icon">{item.icon}</div>
              <div className="scene-name">{item.name}</div>
            </button>
          ))}
        </div>

        {!ready ? <div className="small-note">캔버스 로딩 중...</div> : null}

        {canCheckAnswer ? (
          <button type="button" className="answer-check-toggle" onClick={() => { setShowCompare((v) => !v); setStageCompletion('piano', true); }} aria-expanded={showCompare}>
            <span className="answer-check-toggle-label">정답 확인하기</span>
            <span className="answer-check-toggle-chevron" aria-hidden="true">
              {showCompare ? '▲' : '▼'}
            </span>
          </button>
        ) : null}

        <div className={`answer-compare-slide ${showCompare ? 'open' : ''}`}>
          <div className="answer-compare-inner">
            <div className="sec">오른손 가락선 비교</div>
            <div className="cv-compare">
              <div className="cv-box">
                <div className="cv-label">내가 그린 선</div>
                <div className="cv-panel"><canvas width="520" height="190" /></div>
              </div>
              <div className="cv-box">
                <div className="cv-label">모범 악보</div>
                <div className="cv-panel score-panel">
                  <img src="/assets/rh-score.png" alt="오른손 모범 악보" className="score-image" />
                  <a href="/assets/rh-score.png" target="_blank" rel="noreferrer" className="score-link">원본 보기</a>
                </div>
              </div>
            </div>
            <div className="fb show info">오른손: 빠르고 불규칙하게 오르내리는 셋잇단음표 -&gt; 말발굽 소리를 묘사해요</div>

            <div className="sec">왼손 가락선 비교</div>
            <div className="cv-compare">
              <div className="cv-box">
                <div className="cv-label">내가 그린 선</div>
                <div className="cv-panel"><canvas width="520" height="190" /></div>
              </div>
              <div className="cv-box">
                <div className="cv-label">모범 악보</div>
                <div className="cv-panel score-panel">
                  <img src="/assets/lh-score.png" alt="왼손 모범 악보" className="score-image" />
                  <a href="/assets/lh-score.png" target="_blank" rel="noreferrer" className="score-link">원본 보기</a>
                </div>
              </div>
            </div>
            <div className="fb show info">왼손: 느리고 강하게 반복되는 베이스 -&gt; 심장이 두근거리는 긴박감을 표현해요</div>
            <CompareAiFeedbackBlock requestFn={requestPianoFeedback} />
          </div>
        </div>

        {canCheckAnswer ? (
          <ArtSongTakeaway
            eyebrow="예술가곡의 두 번째 특징"
            title="피아노는 성악과 동등한 역할을 한다"
            description="피아노 반주는 단순히 성악을 받쳐주는 게 아니에요. 말이 달리는 장면, 심장이 두근거리는 긴박함을 직접 묘사하며 시의 내용을 음악으로 표현합니다."
          />
        ) : null}

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('voiceDesign')}>← 이전</button>
          <button className="btn-p" disabled={!canCheckAnswer} style={!canCheckAnswer ? { opacity: 0.5, cursor: 'not-allowed' } : undefined} onClick={() => go('historyCards')}>다음 단계 →</button>
        </div>
      </div>
    </div>
  );
}

export default PianoAnalysis;
