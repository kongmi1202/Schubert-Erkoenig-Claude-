import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

const AUDIO_SRC = {
  'hy-th1': '/audio/haydn-theme-1.mp3',
  'hy-th2': '/audio/haydn-theme-2.mp3'
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
    const brush = getBrush();
    ctx.lineWidth = brush.erase ? 20 : brush.size;
    ctx.strokeStyle = brush.erase ? '#1a1520' : brush.color;
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

function HyTheme({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);

  const t1Ref = useRef(null);
  const t2Ref = useRef(null);
  const modelT1Ref = useRef(null);
  const modelT2Ref = useRef(null);
  const t1AudioRef = useRef(null);
  const t2AudioRef = useRef(null);

  const [t1Brush, setT1Brush] = useState({ color: '#4a7fc1', size: 3, erase: false });
  const [t2Brush, setT2Brush] = useState({ color: '#c4922a', size: 3, erase: false });
  const [t1Dirty, setT1Dirty] = useState(false);
  const [t2Dirty, setT2Dirty] = useState(false);
  const [playing, setPlaying] = useState('');
  const [myPreview, setMyPreview] = useState({ t1: '', t2: '' });
  const [cvOpen, setCvOpen] = useState(false);

  const [feelT1, setFeelT1] = useState('');
  const [feelT2, setFeelT2] = useState('');
  const [toneByGroup, setToneByGroup] = useState({ 'hy-tone-t1': '', 'hy-tone-t2': '' });
  const [toneChecked, setToneChecked] = useState(false);
  const [toneOpen, setToneOpen] = useState(false);

  const [selectedDeg, setSelectedDeg] = useState('');
  const [degChecked, setDegChecked] = useState(false);
  const [degOpen, setDegOpen] = useState(false);

  useEffect(() => {
    const cleanups = [];
    if (t1Ref.current) {
      cleanups.push(setupDraw(t1Ref.current, () => t1Brush, () => setT1Dirty(true)));
    }
    if (t2Ref.current) {
      cleanups.push(setupDraw(t2Ref.current, () => t2Brush, () => setT2Dirty(true)));
    }
    return () => cleanups.forEach((fn) => fn());
  }, [t1Brush, t2Brush]);

  useEffect(() => {
    const initCV = (id) => {
      const cv = document.getElementById(id);
      if (!cv || cv.tagName !== 'CANVAS') return;
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };
    const onLoad = () => {
      ['rh-cv', 'lh-cv', 'harm-cv', 'poly-cv', 'hy-t1-cv', 'hy-t2-cv'].forEach(initCV);
    };
    window.addEventListener('load', onLoad);
    onLoad();
    return () => window.removeEventListener('load', onLoad);
  }, []);

  const toggleAudio = async (id) => {
    const current = id === 'hy-th1' ? t1AudioRef.current : t2AudioRef.current;
    const other = id === 'hy-th1' ? t2AudioRef.current : t1AudioRef.current;
    if (!current) return;
    if (playing === id) {
      current.pause();
      setPlaying('');
      return;
    }
    other?.pause();
    try {
      await current.play();
      setPlaying(id);
    } catch {
      setPlaying('');
    }
  };

  const clearCanvas = (canvasRef, key) => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    if (key === 't1') {
      setT1Dirty(false);
      setMyPreview((prev) => ({ ...prev, t1: '' }));
    } else {
      setT2Dirty(false);
      setMyPreview((prev) => ({ ...prev, t2: '' }));
    }
  };

  function drawHyModel(hand) {
    const target = hand === 't1' ? modelT1Ref.current : modelT2Ref.current;
    if (!target) return;
    const ctx = target.getContext('2d');
    ctx.clearRect(0, 0, target.width, target.height);
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = hand === 't1' ? '#4a7fc1' : '#c4922a';
    ctx.beginPath();
    if (hand === 't1') {
      const pts = [
        [16, 84], [60, 52], [108, 88], [150, 40], [196, 72], [244, 34], [286, 80],
        [334, 46], [380, 86], [426, 44], [472, 74], [520, 30], [566, 82], [620, 50]
      ];
      ctx.moveTo(pts[0][0], pts[0][1]);
      pts.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
    } else {
      const pts = [
        [16, 70], [72, 64], [128, 58], [184, 62], [240, 66], [296, 60],
        [352, 54], [408, 58], [464, 64], [520, 68], [576, 62], [624, 56]
      ];
      ctx.moveTo(pts[0][0], pts[0][1]);
      pts.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
    }
    ctx.stroke();
  }

  function checkHyCV() {
    if (!t1Ref.current || !t2Ref.current) return;
    setMyPreview({
      t1: t1Ref.current.toDataURL('image/png'),
      t2: t2Ref.current.toDataURL('image/png')
    });
    drawHyModel('t1');
    drawHyModel('t2');
    setCvOpen((prev) => !prev);
    setStageCompletion('piano', true);
  }

  function selToneH(el, groupId) {
    setToneByGroup((prev) => ({ ...prev, [groupId]: el }));
    setToneChecked(false);
  }

  function checkToneH() {
    setToneChecked(true);
    setToneOpen((prev) => !prev);
  }

  function selDegH(el) {
    setSelectedDeg(el);
    setDegChecked(false);
  }

  function checkDegH() {
    setDegChecked(true);
    setDegOpen((prev) => !prev);
  }

  const canCheckCV = useMemo(() => t1Dirty && t2Dirty, [t1Dirty, t2Dirty]);
  const canCheckTone = useMemo(
    () => feelT1.trim() && feelT2.trim() && toneByGroup['hy-tone-t1'] && toneByGroup['hy-tone-t2'],
    [feelT1, feelT2, toneByGroup]
  );
  const canCheckDeg = useMemo(() => !!selectedDeg, [selectedDeg]);
  const canProceed = useMemo(
    () => canCheckCV && canCheckTone && canCheckDeg,
    [canCheckCV, canCheckTone, canCheckDeg]
  );
  const toneCorrect = toneByGroup['hy-tone-t1'] === '장조' && toneByGroup['hy-tone-t2'] === '장조';
  const degCorrect = selectedDeg === '5도';

  return (
    <div className="screen active">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2-C · 분석적 감상 (하이든)</div>
        <div className="s-title">주제 비교</div>
        <div className="s-desc">음악 요소: 가락, 리듬꼴, 음계</div>
      </div>

      <div className="body voice-body">
        <div className="sec">파트 1 — 두 주제 듣고 가락선 그리기</div>

        <div className="audio-bar voice-audio-bar" style={{ borderLeft: '3px solid #4a7fc1' }}>
          <audio id="hy-th1" ref={t1AudioRef} src={AUDIO_SRC['hy-th1']} preload="metadata" onEnded={() => setPlaying((p) => (p === 'hy-th1' ? '' : p))} />
          <button type="button" className="aud-btn" style={{ background: 'linear-gradient(135deg,#4a7fc1,#6b9fd4)' }} onClick={() => toggleAudio('hy-th1')}>
            {playing === 'hy-th1' ? '❚❚' : '▶'}
          </button>
          <div>
            <div className="aud-title-sm">제1주제</div>
            <div className="aud-sub" style={{ color: '#6b9fd4' }}>밝고 도약적인 선율</div>
          </div>
        </div>

        <div className="audio-bar voice-audio-bar" style={{ borderLeft: '3px solid #c4922a' }}>
          <audio id="hy-th2" ref={t2AudioRef} src={AUDIO_SRC['hy-th2']} preload="metadata" onEnded={() => setPlaying((p) => (p === 'hy-th2' ? '' : p))} />
          <button type="button" className="aud-btn" style={{ background: 'linear-gradient(135deg,#c4922a,#d4aa4a)' }} onClick={() => toggleAudio('hy-th2')}>
            {playing === 'hy-th2' ? '❚❚' : '▶'}
          </button>
          <div>
            <div className="aud-title-sm">제2주제</div>
            <div className="aud-sub" style={{ color: '#d4aa4a' }}>부드럽고 순차적인 선율</div>
          </div>
        </div>

        <div className="small-note" style={{ marginBottom: 10 }}>
          🔼 음이 높아지면 위로 · 🔽 낮아지면 아래로
          <br />
          ⚡ 빠르면 짧게 · 〰️ 느리면 길게
        </div>

        <div className="review-card" style={{ marginBottom: 12 }}>
          <div className="review-section-title" style={{ color: '#6b9fd4' }}>제1주제 가락선</div>
          <div className="palette-bar" style={{ marginBottom: 10 }}>
            {['#4a7fc1', '#6b9fd4', '#34d399'].map((c, i) => (
              <button
                key={c}
                id={`pb-hyt1-${i + 1}`}
                className={`pal-color-btn ${t1Brush.color === c && !t1Brush.erase ? 'active' : ''}`}
                style={{ background: c }}
                onClick={() => setT1Brush((b) => ({ ...b, color: c, erase: false }))}
              />
            ))}
            <button id="hy-t1-er" className={`pal-tool ${t1Brush.erase ? 'active' : ''}`} onClick={() => setT1Brush((b) => ({ ...b, erase: !b.erase }))}>지우개</button>
            <button className="pal-tool" onClick={() => clearCanvas(t1Ref, 't1')}>전체지우기</button>
          </div>
          <div className="canvas-wrap"><canvas id="hy-t1-cv" ref={t1Ref} width="640" height="120" /></div>
        </div>

        <div className="review-card" style={{ marginBottom: 12 }}>
          <div className="review-section-title" style={{ color: '#d4aa4a' }}>제2주제 가락선</div>
          <div className="palette-bar" style={{ marginBottom: 10 }}>
            {['#c4922a', '#d4aa4a', '#a78bfa'].map((c, i) => (
              <button
                key={c}
                id={`pb-hyt2-${i + 1}`}
                className={`pal-color-btn ${t2Brush.color === c && !t2Brush.erase ? 'active' : ''}`}
                style={{ background: c }}
                onClick={() => setT2Brush((b) => ({ ...b, color: c, erase: false }))}
              />
            ))}
            <button id="hy-t2-er" className={`pal-tool ${t2Brush.erase ? 'active' : ''}`} onClick={() => setT2Brush((b) => ({ ...b, erase: !b.erase }))}>지우개</button>
            <button className="pal-tool" onClick={() => clearCanvas(t2Ref, 't2')}>전체지우기</button>
          </div>
          <div className="canvas-wrap"><canvas id="hy-t2-cv" ref={t2Ref} width="640" height="120" /></div>
        </div>

        <button
          id="hy-ans-cv-btn"
          type="button"
          className="answer-check-toggle"
          onClick={checkHyCV}
          disabled={!canCheckCV}
          style={!canCheckCV ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          aria-expanded={cvOpen}
        >
          <span className="answer-check-toggle-label">가락선 정답 비교하기</span>
          <span className="answer-check-toggle-chevron" aria-hidden="true">{cvOpen ? '▲' : '▼'}</span>
        </button>
        <div id="hy-ans-cv-body" className={`answer-compare-slide ${cvOpen ? 'open' : ''}`}>
          <div className="answer-compare-inner">
            <div className="sec">제1주제</div>
            <div className="cv-compare">
              <div className="cv-box">
                <div className="cv-label">내가 그린 선</div>
                <div className="cv-panel">
                  {myPreview.t1 ? <img id="hy-my-t1" src={myPreview.t1} alt="제1주제 내가 그린 가락선" className="cv-drawing-image" /> : <div className="small-note">아직 없음</div>}
                </div>
              </div>
              <div className="cv-box">
                <div className="cv-label">모범 가락선</div>
                <div className="cv-panel"><canvas id="hy-model-t1" ref={modelT1Ref} width="640" height="120" /></div>
              </div>
            </div>
            <div className="fb show info">음이 활발하게 도약하고 짧게 끊어지는 리듬 → 경쾌한 느낌</div>

            <div className="sec">제2주제</div>
            <div className="cv-compare">
              <div className="cv-box">
                <div className="cv-label">내가 그린 선</div>
                <div className="cv-panel">
                  {myPreview.t2 ? <img id="hy-my-t2" src={myPreview.t2} alt="제2주제 내가 그린 가락선" className="cv-drawing-image" /> : <div className="small-note">아직 없음</div>}
                </div>
              </div>
              <div className="cv-box">
                <div className="cv-label">모범 가락선</div>
                <div className="cv-panel"><canvas id="hy-model-t2" ref={modelT2Ref} width="640" height="120" /></div>
              </div>
            </div>
            <div className="fb show info">음이 순차적으로 부드럽게 이어지는 선율 → 서정적 느낌</div>
          </div>
        </div>

        <div className="sec">파트 2 — 느낌 표현 + 장단조 선택</div>
        <div className="fb show info" style={{ marginBottom: 12 }}>장조는 밝고 활기찬 느낌, 단조는 어둡고 무거운 느낌이에요.</div>

        <div className="feel-grid-h">
          <div className="feel-card-h fc1">
            <div className="feel-title-h">제1주제</div>
            <textarea id="hy-feel-t1" className="txt" value={feelT1} onChange={(e) => setFeelT1(e.target.value)} placeholder="제1주제 느낌을 써보세요..." />
            <div id="hy-tone-t1" className="tone-opts-h">
              {['장조', '단조'].map((tone) => (
                <button key={tone} type="button" className={`tone-opt-h ${toneByGroup['hy-tone-t1'] === tone ? 'sel' : ''}`} onClick={() => selToneH(tone, 'hy-tone-t1')}>{tone}</button>
              ))}
            </div>
          </div>
          <div className="feel-card-h fc2">
            <div className="feel-title-h">제2주제</div>
            <textarea id="hy-feel-t2" className="txt" value={feelT2} onChange={(e) => setFeelT2(e.target.value)} placeholder="제2주제 느낌을 써보세요..." />
            <div id="hy-tone-t2" className="tone-opts-h">
              {['장조', '단조'].map((tone) => (
                <button key={tone} type="button" className={`tone-opt-h ${toneByGroup['hy-tone-t2'] === tone ? 'sel' : ''}`} onClick={() => selToneH(tone, 'hy-tone-t2')}>{tone}</button>
              ))}
            </div>
          </div>
        </div>

        <button
          id="hy-ans-tone-btn"
          type="button"
          className="answer-check-toggle"
          onClick={checkToneH}
          disabled={!canCheckTone}
          style={!canCheckTone ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          aria-expanded={toneOpen}
        >
          <span className="answer-check-toggle-label">정답 확인하기</span>
          <span className="answer-check-toggle-chevron" aria-hidden="true">{toneOpen ? '▲' : '▼'}</span>
        </button>
        <div id="hy-ans-tone-body" className={`answer-compare-slide ${toneOpen ? 'open' : ''}`}>
          <div className="answer-compare-inner">
            <div className={`fb show ${toneChecked && toneCorrect ? 'ok' : 'info'}`}>
              정답: 둘 다 장조
              <br />
              두 주제 모두 장조예요! 가락의 흐름과 리듬꼴이 달라서
              <br />
              느낌이 다르게 느껴져요.
            </div>
          </div>
        </div>

        <div className="sec">파트 3 — 건반 그림 + 도 수 맞추기</div>
        <div className="keyboard-wrap">
          <div className="keyboard-label">KEYBOARD MAP</div>
          <div className="keyboard">
            {[
              { note: 'C', black: true },
              { note: 'D', black: true, mark: 'm2', label: 'D 제2', bClass: 'b2' },
              { note: 'E' },
              { note: 'F', black: true },
              { note: 'G', black: true, mark: 'm1', label: 'G 제1', bClass: 'b1' },
              { note: 'A', black: true },
              { note: 'B' },
              { note: 'C' },
              { note: 'D' }
            ].map((k, idx) => (
              <div key={`${k.note}-${idx}`} className={`key-w ${k.mark || ''}`}>
                {k.black ? <span className="key-b" /> : null}
                <span className={`key-label ${k.bClass || ''}`}>{k.label || k.note}</span>
              </div>
            ))}
          </div>
          <div className="keyboard-note">제1주제: G장조(사장조) · 제2주제: D장조(라장조)</div>
        </div>

        <div id="hy-deg-opts" className="degree-opts-h">
          {['3도', '5도', '8도'].map((deg) => (
            <button key={deg} type="button" className={`degree-opt-h ${selectedDeg === deg ? 'sel' : ''}`} onClick={() => selDegH(deg)}>{deg}</button>
          ))}
        </div>

        <button
          id="hy-ans-deg-btn"
          type="button"
          className="answer-check-toggle"
          onClick={checkDegH}
          disabled={!canCheckDeg}
          style={!canCheckDeg ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          aria-expanded={degOpen}
        >
          <span className="answer-check-toggle-label">정답 확인하기</span>
          <span className="answer-check-toggle-chevron" aria-hidden="true">{degOpen ? '▲' : '▼'}</span>
        </button>
        <div id="hy-ans-deg-body" className={`answer-compare-slide ${degOpen ? 'open' : ''}`}>
          <div className="answer-compare-inner">
            <div className={`fb show ${degChecked && degCorrect ? 'ok' : 'info'}`}>
              ✓ 5도 차이예요! G→A→B→C→D, 5개 음 간격이에요.
              <br />
              고전주의 소나타 형식에서 제1·제2주제는
              <br />
              5도 차이 조성을 사용하는 것이 특징이에요.
            </div>
          </div>
        </div>

        <div className="review-card" style={{ marginTop: 14 }}>
          <div className="review-section-title">고전주의 소나타 형식의 특징</div>
          <div className="review-item" style={{ marginBottom: 0 }}>
            두 주제의 대비가 형식미를 만든다
            <br />
            제1주제와 제2주제는 5도 차이의 조성을 사용해요.
            <br />
            두 주제의 가락·리듬꼴·조성이 달라지면서 대비를 이루고
            <br />
            이것이 고전주의 음악의 형식미를 만들어냅니다.
          </div>
        </div>

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('voiceDesign')}>← 이전</button>
          <button
            className="btn-p"
            disabled={!canProceed}
            style={!canProceed ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            onClick={() => go('historyCards')}
          >
            다음 단계 →
          </button>
        </div>
      </div>
    </div>
  );
}

export default HyTheme;
