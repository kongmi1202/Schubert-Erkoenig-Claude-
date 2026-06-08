import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import ArtSongTakeaway from '../ArtSongTakeaway';
import CompareAiFeedbackBlock from '../CompareAiFeedbackBlock';
import { canOpenAnswerAfterFormativeAiGate, generateHyThemeMatchFeedback } from '../../lib/compareFeedback';
import { getHyThemePart3FixedFeedback } from '../../lib/fixedFormativeFeedback';
import FormativeFeedbackBlock from '../FormativeFeedbackBlock';

const HY_THEME1_YT_VIDEO_ID = 'ShXocJtmNeg';
const HY_THEME1_START_SEC = 0;
const HY_THEME1_END_SEC = 12;
const HY_THEME2_YT_VIDEO_ID = '_l3bN9LNenk';
const HY_THEME2_START_SEC = 0;
const HY_THEME2_END_SEC = 7;

const HY_MATCH_OPTIONS = [
  { id: 'o1', label: '음이 크게 도약한다' },
  { id: 'o2', label: '음이 순차적으로 이어진다' },
  { id: 'o3', label: '리듬이 짧게 끊어진다' },
  { id: 'o4', label: '리듬이 길게 이어진다' },
  { id: 'o5', label: '밝고 활기차다' },
  { id: 'o6', label: '부드럽고 서정적이다' }
];

const THEME1_CORRECT = new Set(['o1', 'o3', 'o5']);
const THEME1_WRONG = new Set(['o2', 'o4', 'o6']);
const THEME2_CORRECT = new Set(['o2', 'o4', 'o6']);
const THEME2_WRONG = new Set(['o1', 'o3', 'o5']);

function matchColumnCorrect(placedIds, correctSet, wrongSet) {
  if (!Array.isArray(placedIds) || placedIds.length === 0) return false;
  const hasCorrect = placedIds.some((id) => correctSet.has(id));
  const hasWrong = placedIds.some((id) => wrongSet.has(id));
  return hasCorrect && !hasWrong;
}

let ytApiPromise = null;
function loadYouTubeIframeApi() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prev === 'function') prev();
      resolve(window.YT);
    };
    document.body.appendChild(script);
  });
  return ytApiPromise;
}

function normPlaced(p) {
  return {
    theme1: Array.isArray(p?.theme1) ? p.theme1 : [],
    theme2: Array.isArray(p?.theme2) ? p.theme2 : []
  };
}

/** C4=60 … 화면에 맞는 한 옥타브+ 범위 (제1 G, 제2 D 포함) */
const HY_THEME_KEYBOARD_KEYS = [
  { note: 'C', black: true, wMidi: 60, bMidi: 61 },
  { note: 'D', black: true, wMidi: 62, bMidi: 63 },
  { note: 'E', wMidi: 64 },
  { note: 'F', black: true, wMidi: 65, bMidi: 66 },
  { note: 'G', black: true, wMidi: 67, bMidi: 68, mark: 'm1', label: 'G 제1', bClass: 'b1' },
  { note: 'A', black: true, wMidi: 69, bMidi: 70 },
  { note: 'B', wMidi: 71 },
  { note: 'C', black: true, wMidi: 72, bMidi: 73 },
  { note: 'D', black: true, wMidi: 74, bMidi: 75, mark: 'm2', label: 'D 제2', bClass: 'b2' }
];

function midiToFreq(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

/** 짧은 건반음 (샘플 없이 Web Audio) */
function playHyKeyboardMidi(ctx, midi) {
  const t0 = ctx.currentTime;
  const dur = 0.28;
  const f = midiToFreq(midi);
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  osc1.type = 'triangle';
  osc2.type = 'sine';
  osc1.frequency.setValueAtTime(f, t0);
  osc2.frequency.setValueAtTime(f * 2, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.16, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);
  osc1.start(t0);
  osc2.start(t0);
  osc1.stop(t0 + dur + 0.03);
  osc2.stop(t0 + dur + 0.03);
}

/** Fisher–Yates shuffle (copy) */
function shuffleMatchOptions(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function HyTheme({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const hyThemeState = useAppStore((s) => s.hyThemeState);
  const setHyThemeState = useAppStore((s) => s.setHyThemeState);

  const t1YtHostRef = useRef(null);
  const t1YtPlayerRef = useRef(null);
  const t2YtHostRef = useRef(null);
  const t2YtPlayerRef = useRef(null);
  const keySoundCtxRef = useRef(null);
  const pressedClearRef = useRef(null);

  const [playing, setPlaying] = useState('');
  const [pressedKeyId, setPressedKeyId] = useState(null);
  const [placedOptions, setPlacedOptions] = useState(() => normPlaced(hyThemeState?.matchPlaced));
  const [selectedOption, setSelectedOption] = useState(null);

  const [matchChecked, setMatchChecked] = useState(false);
  const [matchOpen, setMatchOpen] = useState(false);
  const [matchAiGate, setMatchAiGate] = useState(null);

  const [selectedDeg, setSelectedDeg] = useState(() => hyThemeState?.selectedDeg || '');
  const [degChecked, setDegChecked] = useState(false);
  const [degOpen, setDegOpen] = useState(false);
  const [degAiGate, setDegAiGate] = useState(null);

  const shuffledMatchOptions = useMemo(() => shuffleMatchOptions(HY_MATCH_OPTIONS), []);

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
      ['rh-cv', 'lh-cv', 'harm-cv', 'poly-cv'].forEach(initCV);
    };
    window.addEventListener('load', onLoad);
    onLoad();
    return () => window.removeEventListener('load', onLoad);
  }, []);

  useEffect(() => {
    let mounted = true;
    loadYouTubeIframeApi().then((YT) => {
      if (!mounted || !t1YtHostRef.current) return;
      if (t1YtPlayerRef.current?.destroy) {
        t1YtPlayerRef.current.destroy();
        t1YtPlayerRef.current = null;
      }
      t1YtPlayerRef.current = new YT.Player(t1YtHostRef.current, {
        width: '1',
        height: '1',
        videoId: HY_THEME1_YT_VIDEO_ID,
        playerVars: {
          start: HY_THEME1_START_SEC,
          end: HY_THEME1_END_SEC,
          controls: 0,
          rel: 0,
          playsinline: 1,
          modestbranding: 1
        },
        events: {
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.ENDED) {
              event.target.seekTo(HY_THEME1_START_SEC, true);
              event.target.pauseVideo();
              setPlaying((p) => (p === 'hy-th1' ? '' : p));
            }
          }
        }
      });
    });
    return () => {
      mounted = false;
      if (t1YtPlayerRef.current?.destroy) t1YtPlayerRef.current.destroy();
      t1YtPlayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    loadYouTubeIframeApi().then((YT) => {
      if (!mounted || !t2YtHostRef.current) return;
      if (t2YtPlayerRef.current?.destroy) {
        t2YtPlayerRef.current.destroy();
        t2YtPlayerRef.current = null;
      }
      t2YtPlayerRef.current = new YT.Player(t2YtHostRef.current, {
        width: '1',
        height: '1',
        videoId: HY_THEME2_YT_VIDEO_ID,
        playerVars: {
          start: HY_THEME2_START_SEC,
          end: HY_THEME2_END_SEC,
          controls: 0,
          rel: 0,
          playsinline: 1,
          modestbranding: 1
        },
        events: {
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.ENDED) {
              event.target.seekTo(HY_THEME2_START_SEC, true);
              event.target.pauseVideo();
              setPlaying((p) => (p === 'hy-th2' ? '' : p));
            }
          }
        }
      });
    });
    return () => {
      mounted = false;
      if (t2YtPlayerRef.current?.destroy) t2YtPlayerRef.current.destroy();
      t2YtPlayerRef.current = null;
    };
  }, []);

  const toggleAudio = async (id) => {
    if (id === 'hy-th1') {
      const ytPlayer = t1YtPlayerRef.current;
      if (!ytPlayer) return;
      if (playing === 'hy-th1') {
        ytPlayer.pauseVideo?.();
        setPlaying('');
        return;
      }
      t2YtPlayerRef.current?.pauseVideo?.();
      ytPlayer.seekTo?.(HY_THEME1_START_SEC, true);
      ytPlayer.playVideo?.();
      setPlaying('hy-th1');
      return;
    }
    const ytPlayer = t2YtPlayerRef.current;
    if (!ytPlayer) return;
    if (playing === 'hy-th2') {
      ytPlayer.pauseVideo?.();
      setPlaying('');
      return;
    }
    t1YtPlayerRef.current?.pauseVideo?.();
    ytPlayer.seekTo?.(HY_THEME2_START_SEC, true);
    ytPlayer.playVideo?.();
    setPlaying('hy-th2');
  };

  const flashPressed = useCallback((id) => {
    setPressedKeyId(id);
    if (pressedClearRef.current) clearTimeout(pressedClearRef.current);
    pressedClearRef.current = window.setTimeout(() => {
      setPressedKeyId((prev) => (prev === id ? null : prev));
    }, 140);
  }, []);

  const playWhiteKey = useCallback(
    (midi, idx) => {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!keySoundCtxRef.current) keySoundCtxRef.current = new AC();
      const ctx = keySoundCtxRef.current;
      void ctx.resume?.().catch(() => {});
      try {
        playHyKeyboardMidi(ctx, midi);
      } catch {
        /* noop */
      }
      flashPressed(`w-${idx}`);
    },
    [flashPressed]
  );

  const playBlackKey = useCallback(
    (midi, idx) => {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!keySoundCtxRef.current) keySoundCtxRef.current = new AC();
      const ctx = keySoundCtxRef.current;
      void ctx.resume?.().catch(() => {});
      try {
        playHyKeyboardMidi(ctx, midi);
      } catch {
        /* noop */
      }
      flashPressed(`b-${idx}`);
    },
    [flashPressed]
  );

  useEffect(
    () => () => {
      if (pressedClearRef.current) clearTimeout(pressedClearRef.current);
    },
    []
  );

  const optionFullyPlaced = (id) =>
    placedOptions.theme1.includes(id) && placedOptions.theme2.includes(id);

  const tapOption = (id) => {
    if (optionFullyPlaced(id)) return;
    setSelectedOption((prev) => (prev === id ? null : id));
    setMatchChecked(false);
  };

  const placeInSlot = (slot) => {
    if (!selectedOption) return;
    setPlacedOptions((prev) => {
      if (prev[slot].includes(selectedOption)) return prev;
      return { ...prev, [slot]: [...prev[slot], selectedOption] };
    });
    setSelectedOption(null);
    setMatchChecked(false);
  };

  const removeFromSlot = (slot, id) => {
    setPlacedOptions((prev) => ({
      ...prev,
      [slot]: prev[slot].filter((x) => x !== id)
    }));
    setMatchChecked(false);
  };

  function selDegH(el) {
    setSelectedDeg(el);
    setDegChecked(false);
  }

  function checkDegH() {
    setDegChecked(true);
    setDegOpen((prev) => !prev);
  }

  function checkMatchH() {
    setMatchChecked(true);
    setMatchOpen((prev) => !prev);
    setStageCompletion('piano', true);
  }

  const canCheckMatch = placedOptions.theme1.length > 0 && placedOptions.theme2.length > 0;
  const canCheckDeg = useMemo(() => !!selectedDeg, [selectedDeg]);
  const canProceed = useMemo(() => canCheckMatch && canCheckDeg, [canCheckMatch, canCheckDeg]);

  const matchCol1Ok = matchColumnCorrect(placedOptions.theme1, THEME1_CORRECT, THEME1_WRONG);
  const matchCol2Ok = matchColumnCorrect(placedOptions.theme2, THEME2_CORRECT, THEME2_WRONG);
  const matchBothCorrect = matchCol1Ok && matchCol2Ok;

  const matchSnapshot = useMemo(
    () =>
      JSON.stringify({
        t1: [...placedOptions.theme1].sort(),
        t2: [...placedOptions.theme2].sort()
      }),
    [placedOptions]
  );
  const degSnapshot = useMemo(() => JSON.stringify({ selectedDeg: selectedDeg || '' }), [selectedDeg]);
  const degCorrect = selectedDeg === '5도';

  const canOpenMatchAnswerCheck =
    canCheckMatch &&
    matchAiGate?.feedbackCompleted &&
    canOpenAnswerAfterFormativeAiGate({
      feedbackCompleted: matchAiGate.feedbackCompleted,
      wasCorrectWhenFeedbackRequested: matchAiGate.wasCorrectWhenFeedbackRequested,
      responseAtFeedback: matchAiGate.responseAtFeedback,
      currentResponse: matchSnapshot
    });
  const canOpenDegAnswerCheck =
    canCheckDeg &&
    degAiGate?.feedbackCompleted &&
    canOpenAnswerAfterFormativeAiGate({
      feedbackCompleted: degAiGate.feedbackCompleted,
      wasCorrectWhenFeedbackRequested: degAiGate.wasCorrectWhenFeedbackRequested,
      responseAtFeedback: degAiGate.responseAtFeedback,
      currentResponse: degSnapshot
    });

  useEffect(() => {
    setHyThemeState({ matchPlaced: placedOptions, selectedDeg });
  }, [placedOptions, selectedDeg, setHyThemeState]);

  const slotBaseStyle = {
    background: 'var(--bg3)',
    border: '1px solid var(--border)',
    minHeight: 80,
    padding: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    borderRadius: 4
  };

  const slotCheckedStyle = (slot) => {
    if (!matchChecked) return {};
    const ok = slot === 'theme1' ? matchCol1Ok : matchCol2Ok;
    return {
      borderColor: ok ? 'var(--green)' : 'var(--crimson)',
      background: ok ? 'var(--green-pale)' : 'var(--crimson-pale)'
    };
  };

  const tagStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 10px',
    background: 'var(--surface2)',
    border: '1px solid var(--border2)',
    fontSize: 11,
    fontWeight: 300,
    borderRadius: 4
  };

  return (
    <div className="screen active">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2-C · 분석적 감상 (하이든)</div>
        <div className="s-title">주제 비교</div>
        <div className="s-desc">음악 요소: 가락, 리듬꼴, 음계</div>
      </div>

      <div className="body voice-body">
        <div
          style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}
        >
          <div ref={t1YtHostRef} />
          <div ref={t2YtHostRef} />
        </div>

        <div className="sec">두 주제의 특징을 찾아보세요</div>
        <div className="fb show info" style={{ marginBottom: 12, whiteSpace: 'pre-line' }}>
          {`💡 두 주제를 각각 들으며
아래 보기 카드 중 알맞은 것을
각 주제 칸에 넣어보세요.
여러 개를 넣어도 좋아요!`}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginBottom: 16
          }}
        >
          <button
            type="button"
            id="hy-th1"
            onClick={() => toggleAudio('hy-th1')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 4,
              padding: '14px 16px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: '#4a7fc1',
              color: '#fff',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>{playing === 'hy-th1' ? '❚❚' : '▶'}</span>
            <span style={{ fontSize: 15, fontWeight: 600 }}>제1주제</span>
            <span style={{ fontSize: 12, opacity: 0.95 }}>밝고 도약적인 선율</span>
          </button>
          <button
            type="button"
            id="hy-th2"
            onClick={() => toggleAudio('hy-th2')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 4,
              padding: '14px 16px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: '#c4922a',
              color: '#fff',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>{playing === 'hy-th2' ? '❚❚' : '▶'}</span>
            <span style={{ fontSize: 15, fontWeight: 600 }}>제2주제</span>
            <span style={{ fontSize: 12, opacity: 0.95 }}>부드럽고 순차적인 선율</span>
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10,
            marginBottom: 16
          }}
        >
          {shuffledMatchOptions.map((opt) => {
            const exhausted = optionFullyPlaced(opt.id);
            const isSel = selectedOption === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => tapOption(opt.id)}
                disabled={exhausted}
                style={{
                  border: '1px solid var(--border)',
                  background: isSel ? 'var(--purple-pale)' : 'var(--surface)',
                  padding: '12px 14px',
                  fontSize: 12,
                  cursor: exhausted ? 'not-allowed' : 'pointer',
                  textAlign: 'center',
                  borderRadius: 6,
                  borderColor: isSel ? 'var(--purple)' : 'var(--border)',
                  color: isSel ? 'var(--purple-light)' : 'var(--text)',
                  opacity: exhausted ? 0.4 : 1,
                  pointerEvents: exhausted ? 'none' : 'auto'
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => placeInSlot('theme1')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                placeInSlot('theme1');
              }
            }}
            style={{
              ...slotBaseStyle,
              borderLeft: '3px solid #4a7fc1',
              ...slotCheckedStyle('theme1'),
              width: '100%',
              cursor: 'pointer',
              alignItems: 'stretch',
              textAlign: 'left'
            }}
          >
              <div style={{ fontWeight: 600, color: '#4a7fc1', fontSize: 13 }}>제1주제</div>
              {placedOptions.theme1.length === 0 ? (
                <div style={{ color: 'var(--text-faint)', fontSize: 12, textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  보기를 선택한 후 탭하세요
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {placedOptions.theme1.map((oid, idx) => (
                    <span key={`t1-${oid}-${idx}`} style={tagStyle}>
                      {HY_MATCH_OPTIONS.find((o) => o.id === oid)?.label}
                      <button
                        type="button"
                        aria-label="칸에서 빼기"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromSlot('theme1', oid);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-dim)',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: 12,
                          lineHeight: 1
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
          </div>
          <div
            role="button"
            tabIndex={0}
            onClick={() => placeInSlot('theme2')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                placeInSlot('theme2');
              }
            }}
            style={{
              ...slotBaseStyle,
              borderLeft: '3px solid #c4922a',
              ...slotCheckedStyle('theme2'),
              width: '100%',
              cursor: 'pointer',
              alignItems: 'stretch',
              textAlign: 'left'
            }}
          >
              <div style={{ fontWeight: 600, color: '#c4922a', fontSize: 13 }}>제2주제</div>
              {placedOptions.theme2.length === 0 ? (
                <div style={{ color: 'var(--text-faint)', fontSize: 12, textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  보기를 선택한 후 탭하세요
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {placedOptions.theme2.map((oid, idx) => (
                    <span key={`t2-${oid}-${idx}`} style={tagStyle}>
                      {HY_MATCH_OPTIONS.find((o) => o.id === oid)?.label}
                      <button
                        type="button"
                        aria-label="칸에서 빼기"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromSlot('theme2', oid);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-dim)',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: 12,
                          lineHeight: 1
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
          </div>
        </div>

        <CompareAiFeedbackBlock
          requestFn={() =>
            generateHyThemeMatchFeedback({
              theme1Ids: placedOptions.theme1,
              theme2Ids: placedOptions.theme2
            })
          }
          disabled={!canCheckMatch}
          onRequested={() => {
            setMatchAiGate({
              feedbackCompleted: false,
              responseAtFeedback: matchSnapshot,
              wasCorrectWhenFeedbackRequested: matchBothCorrect
            });
            setMatchOpen(false);
          }}
          onResult={() => {
            setMatchAiGate((g) => (g ? { ...g, feedbackCompleted: true } : g));
          }}
        />
        <button
          id="hy-ans-tone-btn"
          type="button"
          className="answer-check-toggle"
          onClick={checkMatchH}
          disabled={!canOpenMatchAnswerCheck}
          style={!canOpenMatchAnswerCheck ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          aria-expanded={matchOpen}
        >
          <span className="answer-check-toggle-label">
            {canOpenMatchAnswerCheck ? '정답 확인하기' : '피드백 반영 후 정답 확인하기'}
          </span>
          <span className="answer-check-toggle-chevron" aria-hidden="true">
            {matchOpen ? '▲' : '▼'}
          </span>
        </button>
        {!canCheckMatch ? (
          <div className="small-note" style={{ marginTop: 8 }}>
            칸을 채워주세요
          </div>
        ) : null}
        <div id="hy-ans-tone-body" className={`answer-compare-slide ${matchOpen ? 'open' : ''}`}>
          <div className="answer-compare-inner">
            <div className={`fb show ${matchChecked && matchCol1Ok && matchCol2Ok ? 'ok' : 'info'}`}>
              정답 요약
              <br />
              제1주제: 음이 크게 도약한다 · 리듬이 짧게 끊어진다 · 밝고 활기차다
              <br />
              제2주제: 음이 순차적으로 이어진다 · 리듬이 길게 이어진다 · 부드럽고 서정적이다
            </div>
          </div>
        </div>

        <div className="sec">파트 3 — 건반 그림 + 도 수 맞추기</div>
        <div className="keyboard-wrap">
          <div className="keyboard-label">피아노 건반으로 보는 두 주제의 조성</div>
          <div className="small-note" style={{ marginBottom: 10, lineHeight: 1.65, color: 'var(--text-dim)' }}>
            흰 건반과 검은 건반을 누르면 소리가 나요. 소리를 들으며 <strong style={{ color: 'var(--text)' }}>G(솔)</strong>에서{' '}
            <strong style={{ color: 'var(--text)' }}>D(레)</strong>까지의 도수를 계산해 보세요.
          </div>
          <div
            className="keyboard"
            role="group"
            aria-label="조성 확인용 건반. 흰 건반과 검은 건반을 누르면 소리가 납니다."
          >
            {HY_THEME_KEYBOARD_KEYS.map((k, idx) => (
              <div
                key={`hy-k-${k.wMidi}-${idx}`}
                tabIndex={0}
                className={`key-w ${k.mark || ''} ${pressedKeyId === `w-${idx}` ? 'is-pressed' : ''}`}
                onClick={() => playWhiteKey(k.wMidi, idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    playWhiteKey(k.wMidi, idx);
                  }
                }}
                aria-label={`${k.note} 흰 건반`}
              >
                {k.black ? (
                  <button
                    type="button"
                    className={`key-b ${pressedKeyId === `b-${idx}` ? 'is-pressed' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (typeof k.bMidi === 'number') playBlackKey(k.bMidi, idx);
                    }}
                    aria-label={`${k.note}와 다음 음 사이 검은 건반`}
                  />
                ) : null}
                <span className={`key-label ${k.bClass || ''}`}>{k.label || k.note}</span>
              </div>
            ))}
          </div>
          <div className="keyboard-note">
            {matchChecked ? (
              <>
                제1주제: <strong style={{ color: '#6b9fd4' }}>G장조(사장조)</strong> · 제2주제:{' '}
                <strong style={{ color: '#d4aa4a' }}>D장조(라장조)</strong>
                <br />
                G에서 D까지 몇 도 차이일까요?
              </>
            ) : (
              <>
                주제 특징 활동을 완료하면 두 주제의 조성이 공개됩니다.
                <br />
                먼저 보기 배치와 정답 확인을 마무리해 주세요.
              </>
            )}
          </div>
        </div>

        <div id="hy-deg-opts" className="degree-opts-h">
          {['3도', '5도', '8도'].map((deg) => (
            <button key={deg} type="button" className={`degree-opt-h ${selectedDeg === deg ? 'sel' : ''}`} onClick={() => selDegH(deg)}>
              {deg}
            </button>
          ))}
        </div>

        <FormativeFeedbackBlock
          key={`hy-deg-fb-${selectedDeg || 'none'}`}
          getFeedback={() => getHyThemePart3FixedFeedback({ selectedDeg })}
          onRequested={() => {
            setDegAiGate({
              feedbackCompleted: false,
              responseAtFeedback: degSnapshot,
              wasCorrectWhenFeedbackRequested: degCorrect
            });
            setDegOpen(false);
          }}
          onResult={() => {
            setDegAiGate((g) => (g ? { ...g, feedbackCompleted: true } : g));
          }}
        />
        <button
          id="hy-ans-deg-btn"
          type="button"
          className="answer-check-toggle"
          onClick={checkDegH}
          disabled={!canOpenDegAnswerCheck}
          style={!canOpenDegAnswerCheck ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          aria-expanded={degOpen}
        >
          <span className="answer-check-toggle-label">
            {canOpenDegAnswerCheck ? '정답 확인하기' : '피드백 반영 후 정답 확인하기'}
          </span>
          <span className="answer-check-toggle-chevron" aria-hidden="true">
            {degOpen ? '▲' : '▼'}
          </span>
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

        {canProceed ? (
          <ArtSongTakeaway
            eyebrow="고전주의 소나타 형식의 특징"
            title="두 주제의 대비가 형식미를 만든다"
            description="고전주의 소나타 형식에서 제1주제와 제2주제는 5도 차이의 조성을 사용해요. 같은 장조이지만 조성이 바뀌고 가락과 리듬꼴이 달라지면서 두 주제가 서로 대비를 이루고, 이것이 고전주의 음악의 형식미를 만들어냅니다."
          />
        ) : null}

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('voiceDesign')}>
            ← 이전
          </button>
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
