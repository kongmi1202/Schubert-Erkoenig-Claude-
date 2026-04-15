import { useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import ArtSongTakeaway from '../ArtSongTakeaway';

const AUDIO_SRC = {
  'hy-instr1': '/audio/haydn-instr1.mp3',
  'hy-instr2': '/audio/haydn-instr2.mp3',
  'hy-instr3': '/audio/haydn-instr3.mp3'
};

const INSTRUMENTS = [
  { id: 'violin1', icon: '🎻', name: '제1바이올린', desc: '가장 높은 음역', sizeClass: 'size-v1' },
  { id: 'violin2', icon: '🎻', name: '제2바이올린', desc: '중간 높은 음역', sizeClass: 'size-v2' },
  { id: 'viola', icon: '🎻', name: '비올라', desc: '중간 음역', sizeClass: 'size-va' },
  { id: 'cello', icon: '🎻', name: '첼로', desc: '가장 낮은 음역', sizeClass: 'size-vc' }
];

const SEGMENTS = [
  {
    idx: 1,
    audioId: 'hy-instr1',
    gridId: 'ig-1',
    answer: '제1바이올린',
    feedback: '제1바이올린이에요! 가장 높은 음역으로 주선율을 담당해요.',
    btnId: 'hy-check-1',
    bodyId: 'hy-ans-1'
  },
  {
    idx: 2,
    audioId: 'hy-instr2',
    gridId: 'ig-2',
    answer: '첼로',
    feedback: '첼로예요! 가장 낮은 음역으로 베이스를 담당해요.',
    btnId: 'hy-check-2',
    bodyId: 'hy-ans-2'
  },
  {
    idx: 3,
    audioId: 'hy-instr3',
    gridId: 'ig-3',
    answer: '비올라',
    feedback: '비올라예요! 중간 음역으로 부선율을 담당해요.',
    btnId: 'hy-check-3',
    bodyId: 'hy-ans-3'
  }
];

function HyTimbre({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const [selectedByGrid, setSelectedByGrid] = useState({});
  const [resultByGrid, setResultByGrid] = useState({});
  const [openByBodyId, setOpenByBodyId] = useState({});
  const [playingId, setPlayingId] = useState('');
  const audioRefs = useRef({
    'hy-instr1': null,
    'hy-instr2': null,
    'hy-instr3': null
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

  function selInstr(el, gridId) {
    setSelectedByGrid((prev) => ({ ...prev, [gridId]: el }));
    setResultByGrid((prev) => ({ ...prev, [gridId]: '' }));
  }

  function checkHyTimbre(gridId, correct, btnId, bodyId) {
    const picked = selectedByGrid[gridId];
    if (!picked) return;
    const isCorrect = picked === correct;
    setResultByGrid((prev) => ({ ...prev, [gridId]: isCorrect ? 'ok' : 'ng' }));
    setOpenByBodyId((prev) => ({ ...prev, [bodyId]: !prev[bodyId] }));
    if (btnId && bodyId) {
      setStageCompletion('voice', true);
    }
  }

  const allSelected = useMemo(
    () => SEGMENTS.every((segment) => typeof selectedByGrid[segment.gridId] === 'string'),
    [selectedByGrid]
  );

  return (
    <div className="screen active">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2-B · 분석적 감상 (하이든)</div>
        <div className="s-title">현악 4중주 음색 비교</div>
      </div>

      <div className="body voice-body">
        <div className="fb show info" style={{ marginBottom: 16 }}>
          현악 4중주는 제1바이올린, 제2바이올린, 비올라, 첼로
          <br />
          4개의 현악기로 연주해요. 각 악기는 음높이와 음색이 달라요.
        </div>

        {SEGMENTS.map((segment) => {
          const picked = selectedByGrid[segment.gridId];
          const result = resultByGrid[segment.gridId];
          const answerOpen = openByBodyId[segment.bodyId];
          return (
            <section key={segment.gridId} style={{ marginBottom: 20 }}>
              <div className="sec">구간 {segment.idx}</div>
              <div className="review-card" style={{ marginBottom: 10 }}>
                <audio
                  id={segment.audioId}
                  ref={(el) => {
                    audioRefs.current[segment.audioId] = el;
                  }}
                  src={AUDIO_SRC[segment.audioId]}
                  preload="metadata"
                  onEnded={() => setPlayingId((prev) => (prev === segment.audioId ? '' : prev))}
                />
                <button
                  type="button"
                  className="btn-s"
                  onClick={() => togglePlay(segment.audioId)}
                  style={{ marginBottom: 12 }}
                >
                  {playingId === segment.audioId ? '❚❚ 오디오 일시정지' : '▶ 오디오 재생'}
                </button>

                <div id={segment.gridId} className="instr-grid">
                  {INSTRUMENTS.map((instrument) => {
                    const isSelected = picked === instrument.name;
                    const shouldShowResult = !!result && isSelected;
                    const stateClass = shouldShowResult ? result : (isSelected ? 'sel' : '');
                    return (
                      <button
                        key={`${segment.gridId}-${instrument.id}`}
                        type="button"
                        className={`instr-btn ${stateClass}`}
                        onClick={() => selInstr(instrument.name, segment.gridId)}
                      >
                        <div className={`instr-icon ${instrument.sizeClass}`}>{instrument.icon}</div>
                        <div className="instr-name">{instrument.name}</div>
                        <div className="instr-desc">{instrument.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                id={segment.btnId}
                type="button"
                className="answer-check-toggle"
                onClick={() => checkHyTimbre(segment.gridId, segment.answer, segment.btnId, segment.bodyId)}
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
            </section>
          );
        })}

        <ArtSongTakeaway
          eyebrow="현악 4중주의 특징"
          title="4개의 현악기가 하나의 앙상블을 이룬다"
          description="제1바이올린(주선율), 제2바이올린(화음), 비올라(중성부), 첼로(베이스)가 각각 다른 역할을 맡아요. 4개의 악기가 음색·음역을 달리하며 풍부한 앙상블을 만들어냅니다."
        />

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('analyticalOverview')}>← 이전</button>
          <button
            className="btn-p"
            disabled={!allSelected}
            style={!allSelected ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            onClick={() => go('pianoAnalysis')}
          >
            다음 단계 →
          </button>
        </div>
      </div>
    </div>
  );
}

export default HyTimbre;
