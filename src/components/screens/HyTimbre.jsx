import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import ArtSongTakeaway from '../ArtSongTakeaway';
import ActivityEndFeedback from '../ActivityEndFeedback';
import { generateStage2ActivityFeedback } from '../../lib/formativeAiFeedback';

const AUDIO_SRC = {
  'hy-instr1': '/audio/haydn-violin.mp3',
  'hy-instr2': '/audio/haydn-viola.mp3',
  'hy-instr3': '/audio/haydn-cello.mp3'
};

const INSTRUMENTS = [
  { id: 'violin', icon: '🎻', name: '바이올린', desc: '높은 음역', sizeClass: 'size-v1' },
  { id: 'viola', icon: '🎻', name: '비올라', desc: '중간 음역', sizeClass: 'size-va' },
  { id: 'cello', icon: '🎻', name: '첼로', desc: '낮은 음역', sizeClass: 'size-vc' }
];

/** 역할 카드 — key는 선택값 */
const ROLES = [
  { id: 'r-melody', key: '주선율', title: '주선율', desc: '가장 높은 음역을 담당해요' },
  { id: 'r-inner', key: '중성부', title: '중성부', desc: '중간 음역을 담당해요' },
  { id: 'r-bass', key: '베이스', title: '베이스', desc: '가장 낮은 음역을 담당해요' }
];

const SEGMENTS = [
  {
    idx: 1,
    audioId: 'hy-instr1',
    gridId: 'ig-1',
    answer: '바이올린',
    roleAnswer: '주선율',
    btnId: 'hy-check-1',
    bodyId: 'hy-ans-1'
  },
  {
    idx: 2,
    audioId: 'hy-instr2',
    gridId: 'ig-2',
    answer: '비올라',
    roleAnswer: '중성부',
    btnId: 'hy-check-2',
    bodyId: 'hy-ans-2'
  },
  {
    idx: 3,
    audioId: 'hy-instr3',
    gridId: 'ig-3',
    answer: '첼로',
    roleAnswer: '베이스',
    btnId: 'hy-check-3',
    bodyId: 'hy-ans-3'
  }
];

function HyTimbre({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const hyTimbreState = useAppStore((s) => s.hyTimbreState);
  const setHyTimbreState = useAppStore((s) => s.setHyTimbreState);
  const [selectedByGrid, setSelectedByGrid] = useState(() => hyTimbreState?.selectedByGrid || {});
  const [roleByGrid, setRoleByGrid] = useState(() => hyTimbreState?.roleByGrid || {});
  const [activityFbDone, setActivityFbDone] = useState(false);
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

  function selInstr(name, gridId) {
    setSelectedByGrid((prev) => ({ ...prev, [gridId]: name }));
    setActivityFbDone(false);
  }

  function selRole(roleKey, gridId) {
    setRoleByGrid((prev) => ({ ...prev, [gridId]: roleKey }));
    setActivityFbDone(false);
  }

  const allSelected = useMemo(
    () =>
      SEGMENTS.every(
        (segment) =>
          typeof selectedByGrid[segment.gridId] === 'string' && typeof roleByGrid[segment.gridId] === 'string'
      ),
    [selectedByGrid, roleByGrid]
  );

  const canProceed = allSelected && activityFbDone;

  useEffect(() => {
    setHyTimbreState({ selectedByGrid, roleByGrid });
  }, [selectedByGrid, roleByGrid, setHyTimbreState]);

  return (
    <div className="screen active">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2 · 분석적 감상</div>
        <div className="s-title">분석적 감상</div>
        <div className="s-desc">목표: 음악 요소, 음악적 특징 및 구성을 분석하여 음악이 어떻게 표현되고 구성되는지 파악해 보세요.</div>
      </div>

      <div className="body voice-body">
        <div className="sec">3. 이 곡은 현악4중주로, 제1바이올린, 제2바이올린, 비올라, 첼로 4개의 현악기로 연주해요. 각 악기는 음높이와 음색이 달라요. 각 구간을 듣고 어떤 악기의 음색인지, 이 악기는 어떤 역할을 하는지 선택해보세요.</div>

        {SEGMENTS.map((segment) => {
          const picked = selectedByGrid[segment.gridId];
          const rolePick = roleByGrid[segment.gridId];
          const bothPicked = !!(picked && rolePick);

          return (
            <section key={segment.gridId} style={{ marginBottom: 20 }}>
              <div className="sec">구간 {segment.idx}</div>
              <div className="small-note" style={{ marginBottom: 10, fontSize: 16, lineHeight: 1.5 }}>
                구간{segment.idx}을 듣고 어떤 악기의 음색인지, 이 악기는 어떤 역할을 하는지 선택해보세요.
              </div>
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
                    return (
                      <button
                        key={`${segment.gridId}-${instrument.id}`}
                        type="button"
                        className={`instr-btn ${isSelected ? 'sel' : ''}`}
                        onClick={() => selInstr(instrument.name, segment.gridId)}
                      >
                        <div className={`instr-icon ${instrument.sizeClass}`}>{instrument.icon}</div>
                        <div className="instr-name">{instrument.name}</div>
                        <div className="instr-desc">{instrument.desc}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="instr-grid">
                  {ROLES.map((role) => {
                    const isSelected = rolePick === role.key;
                    return (
                      <button
                        key={`${segment.gridId}-${role.id}`}
                        type="button"
                        className={`instr-btn hy-role-btn ${isSelected ? 'sel' : ''}`}
                        onClick={() => selRole(role.key, segment.gridId)}
                      >
                        <div className="hy-role-title">{role.title}</div>
                        <div className="hy-role-desc">{role.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
              {!bothPicked ? (
                <div className="small-note" style={{ marginTop: 8 }}>
                  악기와 역할을 모두 선택해주세요
                </div>
              ) : null}
            </section>
          );
        })}

        <ActivityEndFeedback
          style={{ marginTop: 4, marginBottom: 12 }}
          key={`hy-timbre-activity-fb-${JSON.stringify({ selectedByGrid, roleByGrid })}`}
          requestFn={() =>
            generateStage2ActivityFeedback('hy-timbre', {
              segments: SEGMENTS,
              selectedByGrid,
              roleByGrid
            })
          }
          onResult={() => {
            setActivityFbDone(true);
            setStageCompletion('voice', true);
          }}
        />

        {canProceed ? (
          <ArtSongTakeaway
            eyebrow="현악 4중주의 특징"
            title="4개의 현악기가 하나의 앙상블을 이룬다"
            description="제1바이올린(주선율), 제2바이올린(화음), 비올라(중성부), 첼로(베이스)가 각각 다른 역할을 맡아요. 4개의 악기가 음색·음역을 달리하며 풍부한 앙상블을 만들어냅니다."
          />
        ) : null}

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('analyticalOverview')}>
            ← 이전
          </button>
          <button
            className="btn-p"
            disabled={!canProceed}
            style={!canProceed ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            onClick={() => { setStageCompletion('voice', true); go('pianoAnalysis'); }}
          >
            다음 단계 →
          </button>
        </div>
      </div>
    </div>
  );
}

export default HyTimbre;
