import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

const SEGMENTS = [
  {
    id: 'vv-c1',
    audioId: 'vv-s1',
    quote: 'Tuona e fulmina il Ciel e grandioso',
    quoteKr: '하늘이 천둥치고 번개가 번쩍인다',
    question: '이 구절에서 음악은 어떻게 표현됐나요?',
    choices: [
      '음이 부드럽고 느리게 이어진다',
      '음이 갑자기 강하고 빠르게 터진다',
      '음이 점점 낮아지며 사라진다',
      '조용하고 규칙적으로 반복된다'
    ],
    answer: '음이 갑자기 강하고 빠르게 터진다',
    btnId: 'ans-vv-c1-btn',
    bodyId: 'ans-vv-c1-body',
    feedback: '천둥과 번개를 표현하기 위해 갑작스럽고 강한 셈여림(ff)과 빠른 음형을 사용했어요.'
  },
  {
    id: 'vv-c2',
    audioId: 'vv-s2',
    quote: 'Tronca il capo alle Spiche il Gran Grandiniero',
    quoteKr: '우박이 익은 이삭의 머리를 베어버린다',
    question: '우박이 쏟아지는 장면을 음악으로 어떻게 표현했나요?',
    choices: [
      '음이 길게 이어지며 서정적으로 흐른다',
      '음이 점점 높아지며 웅장해진다',
      '음이 짧고 강하게 반복된다',
      '음이 매우 느리고 조용해진다'
    ],
    answer: '음이 짧고 강하게 반복된다',
    btnId: 'ans-vv-c2-btn',
    bodyId: 'ans-vv-c2-body',
    feedback: '우박이 떨어지는 모습을 짧고 강한 음의 반복으로 묘사했어요. 음표 하나하나가 우박 알갱이 같아요.'
  }
];

const AUDIO_SRC = {
  'vv-s1': '/audio/vv-s1.mp3',
  'vv-s2': '/audio/vv-s2.mp3'
};

function VvSonnet({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const vvSonnetState = useAppStore((s) => s.vvSonnetState);
  const setVvSonnetState = useAppStore((s) => s.setVvSonnetState);
  const [selectedById, setSelectedById] = useState(() => vvSonnetState?.selectedById || {});
  const [resultById, setResultById] = useState({});
  const [openByBodyId, setOpenByBodyId] = useState({});
  const [playingId, setPlayingId] = useState('');
  const audioRefs = useRef({
    'vv-s1': null,
    'vv-s2': null
  });

  const stopOthers = (exceptId) => {
    Object.entries(audioRefs.current).forEach(([id, el]) => {
      if (!el) return;
      if (id !== exceptId) el.pause();
    });
  };

  const togglePlay = async (audioId) => {
    const el = audioRefs.current[audioId];
    if (!el) return;
    if (playingId === audioId) {
      el.pause();
      setPlayingId('');
      return;
    }
    stopOthers(audioId);
    try {
      await el.play();
      setPlayingId(audioId);
    } catch {
      setPlayingId('');
    }
  };

  function selectChoice(groupId, value) {
    setSelectedById((prev) => ({ ...prev, [groupId]: value }));
    setResultById((prev) => ({ ...prev, [groupId]: '' }));
  }

  function checkTP(groupId, correct, _btnId, bodyId) {
    const picked = selectedById[groupId];
    if (!picked) return;
    const isCorrect = picked === correct;
    setResultById((prev) => ({ ...prev, [groupId]: isCorrect ? 'ok' : 'ng' }));
    setOpenByBodyId((prev) => ({ ...prev, [bodyId]: !prev[bodyId] }));
    setStageCompletion('voice', true);
  }

  const canProceed = useMemo(
    () => SEGMENTS.every((segment) => typeof selectedById[segment.id] === 'string' && selectedById[segment.id]),
    [selectedById]
  );

  useEffect(() => {
    setVvSonnetState({ selectedById });
  }, [selectedById, setVvSonnetState]);

  return (
    <div className="screen active" id="vv-sonnet">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2-B · 분석적 감상 (비발디)</div>
        <div className="s-title">소네트</div>
        <div className="s-desc">음악 요소: 셈여림, 빠르기</div>
      </div>

      <div className="body voice-body">
        <div className="fb show info" style={{ marginBottom: 16 }}>
          💡 비발디는 소네트(시)의 내용을
          <br />
          음악으로 직접 묘사했어요.
          <br />
          구절을 읽고 음악이 어떻게 표현했는지 찾아보세요!
        </div>

        {SEGMENTS.map((segment) => {
          const picked = selectedById[segment.id];
          const result = resultById[segment.id];
          const answerOpen = openByBodyId[segment.bodyId];

          return (
            <div key={segment.id} className="sonnet-item">
              <audio
                id={segment.audioId}
                ref={(el) => {
                  audioRefs.current[segment.audioId] = el;
                }}
                src={AUDIO_SRC[segment.audioId]}
                preload="metadata"
                onEnded={() => setPlayingId((prev) => (prev === segment.audioId ? '' : prev))}
              />
              <div className="sonnet-quote">"{segment.quote}"</div>
              <div className="sonnet-quote-kr">"{segment.quoteKr}"</div>
              <button id={segment.audioId} type="button" className="btn-s" onClick={() => togglePlay(segment.audioId)} style={{ marginBottom: 12 }}>
                {playingId === segment.audioId ? '❚❚ 일시정지' : '▶ 재생'}
              </button>
              <div className="sonnet-q">{segment.question}</div>
              <div id={segment.id} className="choice-list" style={{ marginBottom: 10 }}>
                {segment.choices.map((choice) => (
                  <button
                    key={`${segment.id}-${choice}`}
                    type="button"
                    className={`choice-item ${picked === choice ? 'selected' : ''}`}
                    onClick={() => selectChoice(segment.id, choice)}
                  >
                    {picked === choice ? '●' : '○'} {choice}
                  </button>
                ))}
              </div>

              <button
                id={segment.btnId}
                type="button"
                className="answer-check-toggle"
                onClick={() => checkTP(segment.id, segment.answer, segment.btnId, segment.bodyId)}
                aria-expanded={!!answerOpen}
                disabled={!picked}
                style={!picked ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
              >
                <span className="answer-check-toggle-label">정답 확인하기</span>
                <span className="answer-check-toggle-chevron" aria-hidden="true">
                  {answerOpen ? '▲' : '▼'}
                </span>
              </button>

              <div id={segment.bodyId} className={`answer-compare-slide ${answerOpen ? 'open' : ''}`}>
                <div className="answer-compare-inner">
                  <div className={`fb show ${result === 'ok' ? 'ok' : 'info'}`}>
                    정답: {segment.answer}
                    <br />
                    {segment.feedback}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div className="feat-card">
          <div className="feat-num">FEATURE</div>
          <div className="feat-title">사계의 특징①: 표제음악</div>
          <div className="feat-body">
            소네트의 내용을 음악으로 직접 묘사한다
            <br />
            비발디는 시의 각 장면을
            <br />
            셈여림·빠르기·리듬꼴로 생생하게 표현해요.
            <br />
            이처럼 음악 외적 내용을 음악으로
            <br />
            묘사하는 것을 표제음악이라고 해요.
          </div>
        </div>

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('analyticalOverview')}>← 이전: vv-overview</button>
          <button
            className="btn-p"
            disabled={!canProceed}
            style={!canProceed ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            onClick={() => go('pianoAnalysis')}
          >
            다음: vv-concerto →
          </button>
        </div>
      </div>
    </div>
  );
}

export default VvSonnet;
