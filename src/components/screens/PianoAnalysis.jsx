import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ArtSongTakeaway from '../ArtSongTakeaway';
import FormativeFeedbackBlock from '../FormativeFeedbackBlock';
import { getPianoSceneFixedFeedback } from '../../lib/fixedFormativeFeedback';
import { PIANO_LH_SCENE_OPTIONS, PIANO_RH_SCENE_OPTIONS } from '../../lib/pianoSceneAnswers';
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

function PianoAnalysis({ go }) {
  const selectedSong = useAppStore((s) => s.selectedSong);
  const isErlkonig = selectedSong !== 'handel' && selectedSong !== 'hallelujah';
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const pianoAnalysisState = useAppStore((s) => s.pianoAnalysisState);
  const setPianoAnalysisState = useAppStore((s) => s.setPianoAnalysisState);
  const [rhPlaying, setRhPlaying] = useState(false);
  const [lhPlaying, setLhPlaying] = useState(false);
  const [rhScene, setRhScene] = useState(() => pianoAnalysisState?.rhScene || '');
  const [lhScene, setLhScene] = useState(() => pianoAnalysisState?.lhScene || '');
  const [sceneFeedbackKey, setSceneFeedbackKey] = useState(0);
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
    setPianoAnalysisState({ rhScene, lhScene });
  }, [rhScene, lhScene, setPianoAnalysisState]);

  const canCheckAnswer = !!rhScene && !!lhScene;
  const sceneSnapshot = useMemo(
    () => JSON.stringify({ rhScene, lhScene }),
    [rhScene, lhScene]
  );
  const getSceneFeedback = useCallback(
    () => getPianoSceneFixedFeedback({ rhScene, lhScene }),
    [rhScene, lhScene]
  );

  useEffect(() => {
    setSceneFeedbackKey((k) => k + 1);
  }, [sceneSnapshot]);

  useEffect(() => {
    if (canCheckAnswer) setStageCompletion('piano', true);
  }, [canCheckAnswer, setStageCompletion]);

  return (
    <div className="screen active"><div className="stage-header"><div className="s-eyebrow">STAGE 2 · 분석적 감상</div><div className="s-title">분석적 감상</div><div className="s-desc">목표: 음악 요소, 음악적 특징 및 구성을 분석하고 비교하여 음악이 어떻게 표현되고 구성되는지 파악해 보세요.</div></div>
      <div className="body voice-body">
        <div className="sec">4. 이 곡의 피아노 반주는 노래의 장면을 묘사해요. 각 손의 반주를 듣고 어떤 장면을 표현하는지 맞춰보세요.</div>
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
        <div className="audio-bar piano-audio-bar">
          <button type="button" className="aud-btn" aria-label={rhPlaying ? '오른손 반주 일시정지' : '오른손 반주 재생'} onClick={() => setRhPlaying((p) => !p)}>
            {rhPlaying ? '❚❚' : '▶'}
          </button>
          <div>
            <div className="aud-title-sm">오른손 반주만 듣기</div>
            <div className="aud-sub">빠른 셋잇단음표 패턴</div>
          </div>
        </div>
        <div className="sec">오른손 반주와 어울리는 장면</div>
        <div className="scene-grid">
          {PIANO_RH_SCENE_OPTIONS.map((item) => (
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
        <div className="audio-bar piano-audio-bar">
          <button type="button" className="aud-btn" aria-label={lhPlaying ? '왼손 반주 일시정지' : '왼손 반주 재생'} onClick={() => setLhPlaying((p) => !p)}>
            {lhPlaying ? '❚❚' : '▶'}
          </button>
          <div>
            <div className="aud-title-sm">왼손 반주만 듣기</div>
            <div className="aud-sub">느리고 강한 베이스</div>
          </div>
        </div>
        <div className="sec">왼손 반주와 어울리는 장면</div>
        <div className="scene-grid">
          {PIANO_LH_SCENE_OPTIONS.map((item) => (
            <button key={item.name} className={`scene-btn ${lhScene === item.name ? 'sel' : ''}`} onClick={() => setLhScene(item.name)}>
              <div className="scene-icon">{item.icon}</div>
              <div className="scene-name">{item.name}</div>
            </button>
          ))}
        </div>

        {canCheckAnswer ? (
          <FormativeFeedbackBlock
            key={`piano-scene-fb-${sceneFeedbackKey}`}
            getFeedback={getSceneFeedback}
          />
        ) : null}

        {canCheckAnswer ? (
          <ArtSongTakeaway
            eyebrow={isErlkonig ? '예술가곡의 두 번째 특징' : '할렐루야 감상의 핵심'}
            title={isErlkonig ? '피아노는 성악과 동등한 역할을 한다' : '반주와 합창이 함께 장엄함을 만든다'}
            description={isErlkonig ? '피아노 반주는 단순히 성악을 받쳐주는 게 아니에요. 말이 달리는 장면, 심장이 두근거리는 긴박함을 직접 묘사하며 시의 내용을 음악으로 표현합니다.' : '할렐루야의 반주는 합창의 반복 후렴을 떠받치고 화성을 확장해 울림을 키웁니다. 고음/저음의 역할을 분리해 들으면 곡의 구조가 더 또렷하게 보여요.'}
          />
        ) : null}

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('voiceDesign')}>← 이전</button>
          <button className="btn-p" disabled={!canCheckAnswer} style={!canCheckAnswer ? { opacity: 0.5, cursor: 'not-allowed' } : undefined} onClick={() => { setStageCompletion('piano', true); go('historyCards'); }}>다음 단계 →</button>
        </div>
      </div>
    </div>
  );
}

export default PianoAnalysis;
