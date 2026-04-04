import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ArtSongTakeaway from '../ArtSongTakeaway';
import CompareAiFeedbackBlock from '../CompareAiFeedbackBlock';
import { generateVoiceDesignCompareFeedback } from '../../lib/compareFeedback';
import { useAppStore } from '../../store/useAppStore';

const chars = [
  {
    name: '해설자',
    icon: '🗣️',
    lyric: `"이 밤 폭풍 속 누가 말 달려 그들은 아버지와 아들"\n(독일 원어: "Wer reitet so spät durch Nacht und Wind? Es ist der Vater mit seinem Kind.")`,
    audioTitle: '해설자 구간 영상',
    start: 20,
    end: 36
  },
  {
    name: '아버지',
    icon: '👨',
    lyric: `"진정해, 진정해라, 아가. 마른 버들잎 소리란다."\n(독일 원어: "Sei ruhig, bleibe ruhig, mein Kind; in dürren Blättern säuselt der Wind.")`,
    audioTitle: '아버지 구간 영상',
    start: 121,
    end: 130
  },
  {
    name: '아들',
    icon: '👦',
    lyric: `"아버지, 아버지, 들리잖아요. 저 마왕이 내게 속삭여요."\n(독일 원어: "Mein Vater, mein Vater, und hörest du nicht, was Erlenkönig mir leise verspricht?")`,
    audioTitle: '아들 구간 영상',
    start: 108,
    end: 121
  },
  {
    name: '마왕',
    icon: '👁️',
    lyric: `"예쁜 아가, 나와 가자. 참 재미나는 놀이하며 아름다운 꽃동산에서 비단 옷도 많이 입혀주마."\n(독일 원어: "Du liebdes Kind, komm, geh' mit mir! Gar schöne Spiele spiel' ich mit dir; Mach' bunte Blumen sind an dem Strand,  meine Mutter hat manch' gülden Gewand.")`,
    audioTitle: '마왕 구간 영상',
    start: 86,
    end: 109
  }
];
const answerKey = {
  해설자: { 음높이: '중간', 음계: '단조', 리듬꼴: '김', 음색: '두꺼움' },
  아버지: { 음높이: '낮음', 음계: '단조', 리듬꼴: '김', 음색: '두꺼움' },
  아들: { 음높이: '높음', 음계: '단조', 리듬꼴: '짧음', 음색: '얇음' },
  마왕: { 음높이: '중간', 음계: '장조', 리듬꼴: '김', 음색: '중간' }
};

/** 정답 확인 패널 하단 모범 해설 (스크린샷 스타일 안내) */
const voiceCompareCommentary = {
  해설자:
    '해설자는 밤길 상황을 듣는 이에게 차분히 전달하는 역할이에요. 단조의 어두운 음계와 길게 이어지는 리듬으로 처음부터 긴장감을 깔고, 중간 높이·두꺼운 음색으로 이야기의 무게를 실어 줍니다.',
  아버지:
    '아버지는 아들을 달래며 현실을 지키려는 목소리예요. 낮은 음높이와 두꺼운 음색이 어른의 단단함을, 단조와 긴 리듬이 밤길의 압박을 함께 드러냅니다.',
  아들:
    '아들은 두려움과 호소가 섞인 목소리로 들려요. 높은 음높이, 짧게 끊기는 리듬, 얇은 음색이 불안과 다급함을 표현하고, 단조는 비극적 분위기와 맞닿아 있습니다.',
  마왕:
    '마왕은 달콤한 유혹을 속삭이는 인물이에요. 장조의 대비되는 밝음과 길게 이어지는 리듬, 중간 음색이 “부드러운 제안”처럼 들리게 설계된 모범안입니다.'
};

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

function SegmentYoutubePlayer({ videoId, start, end, title, replaySignal }) {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const lastReplayRef = useRef(replaySignal);

  useEffect(() => {
    let mounted = true;
    loadYouTubeIframeApi().then((YT) => {
      if (!mounted || !hostRef.current) return;
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      playerRef.current = new YT.Player(hostRef.current, {
        width: '100%',
        height: '100%',
        videoId,
        playerVars: {
          start,
          end,
          rel: 0,
          playsinline: 1,
          modestbranding: 1,
          controls: 1
        },
        events: {
          onStateChange: (event) => {
            // 구간 재생이 끝나면 시작점으로 되감고 멈춤 상태로 둡니다.
            // 사용자가 가운데 재생 버튼을 누르면 항상 해당 구간부터 다시 시작됩니다.
            if (event.data === YT.PlayerState.ENDED) {
              event.target.seekTo(start, true);
              event.target.pauseVideo();
            }
          }
        }
      });
    });
    return () => {
      mounted = false;
      if (playerRef.current?.destroy) playerRef.current.destroy();
      playerRef.current = null;
    };
  }, [videoId, start, end]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    if (replaySignal === lastReplayRef.current) return;
    lastReplayRef.current = replaySignal;
    if (typeof player.seekTo === 'function') {
      player.seekTo(start, true);
      player.playVideo();
    }
  }, [replaySignal, start]);

  return (
    <div className="video-wrap" style={{ marginBottom: 0 }}>
      <div ref={hostRef} title={title} style={{ position: 'absolute', inset: 0 }} />
    </div>
  );
}

function VoiceDesign({ go }) {
  const selectedCharacter = useAppStore((s) => s.selectedCharacter);
  const setSelectedCharacter = useAppStore((s) => s.setSelectedCharacter);
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const [selectedChars, setSelectedChars] = useState(['해설자', '아버지']);
  const [voiceDesign, setVoiceDesign] = useState({
    해설자: { 음높이: '', 음계: '', 리듬꼴: '', 음색: '' },
    아버지: { 음높이: '', 음계: '', 리듬꼴: '', 음색: '' },
    아들: { 음높이: '', 음계: '', 리듬꼴: '', 음색: '' },
    마왕: { 음높이: '', 음계: '', 리듬꼴: '', 음색: '' }
  });
  const [showCompare, setShowCompare] = useState(false);
  const [segmentReplaySignal, setSegmentReplaySignal] = useState(0);

  const active = chars.find((c) => c.name === selectedCharacter) || chars[0];
  const videoId = '8noeFpdfWcQ';

  const toggleChar = (name) => {
    setSelectedChars((prev) => {
      if (prev.includes(name)) {
        if (prev.length === 1) return prev;
        const next = prev.filter((v) => v !== name);
        if (selectedCharacter === name) setSelectedCharacter(next[0]);
        return next;
      }
      if (prev.length < 2) return [...prev, name];
      return [prev[1], name];
    });
    setSelectedCharacter(name);
  };

  const selectDesign = (category, value) => {
    setVoiceDesign((prev) => ({
      ...prev,
      [selectedCharacter]: { ...prev[selectedCharacter], [category]: value }
    }));
  };

  const isSel = (category, value) => voiceDesign[selectedCharacter]?.[category] === value;
  const isCharacterFilled = (name) => {
    const row = voiceDesign[name];
    if (!row) return false;
    return ['음높이', '음계', '리듬꼴', '음색'].every((k) => row[k]);
  };
  const canCheckAnswer = useMemo(
    () =>
      selectedChars.length === 2 && selectedChars.every(isCharacterFilled),
    [selectedChars, voiceDesign]
  );

  /** 현재 편집 중인 인물만 네 항목이 모두 채워졌을 때 정답 확인 UI 표시 */
  const canShowAnswerCheck = useMemo(
    () => isCharacterFilled(selectedCharacter),
    [selectedCharacter, voiceDesign]
  );

  const requestVoiceFeedback = useCallback(
    () => generateVoiceDesignCompareFeedback([selectedCharacter], voiceDesign, answerKey),
    [selectedCharacter, voiceDesign]
  );

  const designKeys = ['음높이', '음계', '리듬꼴', '음색'];

  useEffect(() => {
    if (canCheckAnswer) setStageCompletion('voice', true);
  }, [canCheckAnswer, setStageCompletion]);

  useEffect(() => {
    if (!canShowAnswerCheck) setShowCompare(false);
  }, [canShowAnswerCheck]);

  return (
    <div className="screen active"><div className="stage-header"><div className="s-eyebrow">STAGE 2-B · 분석적 감상 — 음색</div><div className="s-title">인물의 목소리를 설계해보세요</div><div className="s-desc">알아보고 싶은 등장인물 2명을 선택하고 목소리를 설계해보세요.<br />음악 요소: <strong>음색</strong></div></div>
      <div className="body voice-body">
        <div className="sec">등장인물 선택 (2명)</div>
        <div className="char-tabs">
          {chars.map((c) => (
            <button
              key={c.name}
              type="button"
              className={`char-tab ${selectedCharacter === c.name ? 'active' : ''} ${selectedChars.includes(c.name) ? 'picked' : ''}`}
              onClick={() => toggleChar(c.name)}
            >
              <span>{c.icon}</span> {c.name}
            </button>
          ))}
        </div>
        <div className="small-note">선택됨: {selectedChars.join(', ')}</div>

        <div className="char-card voice-char-card">
          <div className="char-emoji">{active.icon}</div>
          <div>
            <div className="char-name">{active.name}</div>
            <div className="char-lyric">{active.lyric}</div>
          </div>
        </div>

        <div className="audio-bar voice-audio-bar" style={{ display: 'block' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
            <div className="aud-title-sm">{active.audioTitle}</div>
            <button className="btn-s" type="button" onClick={() => setSegmentReplaySignal((k) => k + 1)}>다시 듣기</button>
          </div>
          <SegmentYoutubePlayer
            videoId={videoId}
            start={active.start}
            end={active.end}
            title={`${active.name} 구간 영상`}
            replaySignal={segmentReplaySignal}
          />
        </div>

        <div className="vd-item">
          <div className="vd-label">음높이 <span className="tip-wrap"><span className="q-mini">?</span><span className="tip-bubble">소리가 높은지 낮은지를 말해요. 아이 목소리는 높고, 어른 목소리는 더 낮아요.</span></span></div>
          <div className="vd-opts">
            {['낮음', '중간', '높음'].map((v) => <button key={v} className={`vd-opt ${isSel('음높이', v) ? 'sel' : ''}`} onClick={() => selectDesign('음높이', v)}>{v}</button>)}
          </div>
        </div>

        <div className="vd-item">
          <div className="vd-label">음계 <span className="tip-wrap"><span className="q-mini">?</span><span className="tip-bubble">음악의 기분이에요. 단조는 어둡고 진지한 느낌, 장조는 밝고 신나는 느낌이 나요.</span></span></div>
          <div className="vd-opts">
            {['단조', '장조'].map((v) => <button key={v} className={`vd-opt ${isSel('음계', v) ? 'sel' : ''}`} onClick={() => selectDesign('음계', v)}>{v}</button>)}
          </div>
        </div>

        <div className="vd-item">
          <div className="vd-label">리듬꼴 <span className="tip-wrap"><span className="q-mini">?</span><span className="tip-bubble">소리가 짧게 톡톡 끊기는지, 길게 이어지는지예요. 걷는 발걸음처럼 느낄 수도 있어요.</span></span></div>
          <div className="vd-opts">
            {['짧음', '김'].map((v) => <button key={v} className={`vd-opt ${isSel('리듬꼴', v) ? 'sel' : ''}`} onClick={() => selectDesign('리듬꼴', v)}>{v}</button>)}
          </div>
        </div>

        <div className="vd-item">
          <div className="vd-label">음색 <span className="tip-wrap"><span className="q-mini">?</span><span className="tip-bubble">목소리의 색깔 같은 거예요. 두꺼우면 묵직하고, 얇으면 가볍고 날카롭게 들려요.</span></span></div>
          <div className="vd-opts">
            {['두꺼움', '중간', '얇음'].map((v) => <button key={v} className={`vd-opt ${isSel('음색', v) ? 'sel' : ''}`} onClick={() => selectDesign('음색', v)}>{v}</button>)}
          </div>
        </div>

        {canShowAnswerCheck ? (
          <>
            <button
              type="button"
              className="answer-check-toggle"
              onClick={() => setShowCompare((v) => !v)}
              aria-expanded={showCompare}
            >
              <span className="answer-check-toggle-label">정답 확인하기 · {selectedCharacter}</span>
              <span className="answer-check-toggle-chevron" aria-hidden="true">
                {showCompare ? '▲' : '▼'}
              </span>
            </button>

            <div className={`answer-compare-slide ${showCompare ? 'open' : ''}`}>
              <div className="answer-compare-inner voice-compare-panel">
                <div className="voice-compare-head">
                  <span className="voice-compare-badge">{active.icon}</span>
                  <span className="voice-compare-title">{selectedCharacter} 음색 설계 비교</span>
                </div>
                <table className="cmp-table cmp-table-voice">
                  <thead>
                    <tr>
                      <th className="col-element">요소</th>
                      <th>나의 설계</th>
                      <th>정답</th>
                      <th className="col-mark" aria-label="일치 여부" />
                    </tr>
                  </thead>
                  <tbody>
                    {designKeys.map((key) => {
                      const mine = voiceDesign[selectedCharacter]?.[key] || '';
                      const correct = answerKey[selectedCharacter]?.[key] ?? '—';
                      const match = mine && mine === correct;
                      return (
                        <tr key={key}>
                          <td className="row-label col-element">{key}</td>
                          <td>{mine || '—'}</td>
                          <td className="voice-correct-cell">{correct}</td>
                          <td className="col-mark">
                            <span className={`voice-compare-mark ${match ? 'ok' : 'bad'}`} aria-label={match ? '일치' : '불일치 또는 미선택'}>
                              {match ? '✓' : '✗'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="vd-answer-comment">{voiceCompareCommentary[selectedCharacter] ?? ''}</div>
                <div className="fb show info">💬 위 정답은 시와 음악 해설에 맞춘 모범안이에요. 나의 설계와 비교해 들어보며 감각을 맞춰 보세요.</div>
                <CompareAiFeedbackBlock requestFn={requestVoiceFeedback} />
              </div>
            </div>
          </>
        ) : null}

        {canCheckAnswer ? (
          <ArtSongTakeaway
            eyebrow="예술가곡의 첫 번째 특징"
            title="시와 음악이 하나가 된다"
            description="괴테의 시 속 각 인물의 성격과 감정이 음높이·음색·리듬꼴로 그대로 표현됩니다. 시의 내용을 음악이 직접 표현하는 것이 예술가곡의 핵심이에요."
          />
        ) : null}

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('analyticalOverview')}>← 이전</button>
          <button className="btn-p" disabled={!canCheckAnswer} style={!canCheckAnswer ? { opacity: 0.5, cursor: 'not-allowed' } : undefined} onClick={() => go('pianoAnalysis')}>다음 단계 →</button>
        </div>
      </div>
    </div>
  );
}

export default VoiceDesign;
