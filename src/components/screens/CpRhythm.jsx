import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import ActivityEndFeedback from '../ActivityEndFeedback';
import { generateStage2ActivityFeedback } from '../../lib/formativeAiFeedback';

const AUDIO_SRC = {
  'cp-rh': '/audio/cp-rh.mp3',
  'cp-lh': '/audio/cp-lh.mp3',
  'cp-both': '/audio/cp-both.mp3'
};

const POLY_CORRECT = '오른손 4박과 왼손 3박이 동시에 진행된다';

const CHOICES = {
  'cp-rh-q': ['2개씩', '3개씩', '4개씩'],
  'cp-lh-q': ['2개씩', '3개씩', '4개씩'],
  'cp-poly-q': [
    '같은 박자로 함께 맞춰 연주한다',
    POLY_CORRECT,
    '한 손씩 번갈아 연주한다',
    '두 손이 같은 음표 묶음으로 움직인다'
  ]
};

const QUIZ_META = {
  'cp-rh-q': { correct: '4개씩' },
  'cp-lh-q': { correct: '3개씩' },
  'cp-poly-q': { correct: POLY_CORRECT }
};

const QUIZ_IDS = ['cp-rh-q', 'cp-lh-q', 'cp-poly-q'];

function CpRhythm({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const cpRhythmState = useAppStore((s) => s.cpRhythmState);
  const setCpRhythmState = useAppStore((s) => s.setCpRhythmState);
  const [selectedByGroup, setSelectedByGroup] = useState(() => cpRhythmState?.selectedByGroup || {});
  const [activityFbDone, setActivityFbDone] = useState(false);
  const [playingId, setPlayingId] = useState('');
  const audioRefs = useRef({
    'cp-rh': null,
    'cp-lh': null,
    'cp-both': null
  });

  function selectChoice(groupId, value) {
    setSelectedByGroup((prev) => ({ ...prev, [groupId]: value }));
    setActivityFbDone(false);
  }

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

  const allAnswered = useMemo(
    () => QUIZ_IDS.every((groupId) => !!selectedByGroup[groupId]),
    [selectedByGroup]
  );
  const canProceed = allAnswered && activityFbDone;

  useEffect(() => {
    setCpRhythmState({ selectedByGroup });
  }, [selectedByGroup, setCpRhythmState]);

  return (
    <div className="screen active" id="cp-rhythm">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2 · 분석적 감상</div>
        <div className="s-title">분석적 감상</div>
        <div className="s-desc">목표: 음악 요소, 음악적 특징 및 구성을 분석하고 비교하여 음악이 어떻게 표현되고 구성되는지 파악해 보세요.</div>
      </div>

      <div className="body voice-body">
        <div className="sec">4. 이 곡은 오른손과 왼손이 서로 다른 리듬으로 연주해요. 각 손이 어떤 리듬을 연주하는지 맞춰보세요.</div>

        <div className="sec">4-1. 오른손 리듬</div>
        <div className="sonnet-item">
          <div className="sec sonnet-item-num">[보기]</div>
          <div className="score-img-wrap">
            <img className="score-img" src="/images/chopin-rh.png" alt="환상 즉흥곡 오른손 악보" />
            <div className="score-img-caption">오른손 악보 — 16분음표</div>
          </div>
          <audio
            id="cp-rh"
            ref={(el) => {
              audioRefs.current['cp-rh'] = el;
            }}
            src={AUDIO_SRC['cp-rh']}
            preload="metadata"
            onEnded={() => setPlayingId((prev) => (prev === 'cp-rh' ? '' : prev))}
          />
          <div className="audio-bar voice-audio-bar" style={{ justifyContent: 'flex-start' }}>
            <button type="button" className="aud-btn" onClick={() => togglePlay('cp-rh')}>
              {playingId === 'cp-rh' ? '❚❚' : '▶'}
            </button>
            <div>
              <div className="aud-title-sm">오른손만 듣기</div>
            </div>
          </div>
        </div>
        <div className="sonnet-item">
          <div className="sec sonnet-item-num">[문제]</div>
          <div className="cp-rhythm-q">오른손 음표는 몇 개씩 묶여 있나요?</div>
          <div id="cp-rh-q" className="choice-list">
            {CHOICES['cp-rh-q'].map((choice) => (
              <button
                key={`cp-rh-q-${choice}`}
                type="button"
                className={`choice-item ${selectedByGroup['cp-rh-q'] === choice ? 'selected' : ''}`}
                onClick={() => selectChoice('cp-rh-q', choice)}
              >
                {selectedByGroup['cp-rh-q'] === choice ? '●' : '○'} {choice}
              </button>
            ))}
          </div>
        </div>

        <div className="sec">4-2. 왼손 리듬</div>
        <div className="sonnet-item">
          <div className="sec sonnet-item-num">[보기]</div>
          <div className="score-img-wrap">
            <img className="score-img" src="/images/chopin-lh.png" alt="환상 즉흥곡 왼손 악보" />
            <div className="score-img-caption">왼손 악보 — 셋잇단음표</div>
          </div>
          <audio
            id="cp-lh"
            ref={(el) => {
              audioRefs.current['cp-lh'] = el;
            }}
            src={AUDIO_SRC['cp-lh']}
            preload="metadata"
            onEnded={() => setPlayingId((prev) => (prev === 'cp-lh' ? '' : prev))}
          />
          <div className="audio-bar voice-audio-bar" style={{ justifyContent: 'flex-start' }}>
            <button type="button" className="aud-btn" onClick={() => togglePlay('cp-lh')}>
              {playingId === 'cp-lh' ? '❚❚' : '▶'}
            </button>
            <div>
              <div className="aud-title-sm">왼손만 듣기</div>
            </div>
          </div>
        </div>
        <div className="sonnet-item">
          <div className="sec sonnet-item-num">[문제]</div>
          <div className="cp-rhythm-q">왼손 음표는 몇 개씩 묶여 있나요?</div>
          <div id="cp-lh-q" className="choice-list">
            {CHOICES['cp-lh-q'].map((choice) => (
              <button
                key={`cp-lh-q-${choice}`}
                type="button"
                className={`choice-item ${selectedByGroup['cp-lh-q'] === choice ? 'selected' : ''}`}
                onClick={() => selectChoice('cp-lh-q', choice)}
              >
                {selectedByGroup['cp-lh-q'] === choice ? '●' : '○'} {choice}
              </button>
            ))}
          </div>
        </div>

        <div className="sec">4-3. 두 손이 합쳐지면?</div>
        <div className="sonnet-item">
          <div className="sec sonnet-item-num">[보기]</div>
          <div className="score-img-wrap">
            <img className="score-img" src="/images/chopin-both.png" alt="환상 즉흥곡 양손 악보" />
            <div className="score-img-caption">양손 악보 — 오른손 4박 + 왼손 3박</div>
          </div>
          <audio
            id="cp-both"
            ref={(el) => {
              audioRefs.current['cp-both'] = el;
            }}
            src={AUDIO_SRC['cp-both']}
            preload="metadata"
            onEnded={() => setPlayingId((prev) => (prev === 'cp-both' ? '' : prev))}
          />
          <div className="audio-bar voice-audio-bar" style={{ justifyContent: 'flex-start' }}>
            <button type="button" className="aud-btn" onClick={() => togglePlay('cp-both')}>
              {playingId === 'cp-both' ? '❚❚' : '▶'}
            </button>
            <div>
              <div className="aud-title-sm">양손 합쳐서 듣기</div>
            </div>
          </div>

          <div className="poly-grid-wrap">
            <div className="poly-grid-label">리듬 격자 — 12칸 (4×3)</div>
            <table className="poly-grid-table">
              <tbody>
                <tr>
                  <td className="row-label">오른손 (4박)</td>
                  <td className="note-both">♩</td>
                  <td></td>
                  <td></td>
                  <td className="note-lh">♩</td>
                  <td></td>
                  <td></td>
                  <td className="note-lh">♩</td>
                  <td></td>
                  <td></td>
                  <td className="note-lh">♩</td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td className="row-label">왼손 (3박)</td>
                  <td className="note-both">♩</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td className="note-rh">♩</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td className="note-rh">♩</td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
            <div className="poly-legend">
              <div className="poly-legend-item"><span className="poly-legend-dot" style={{ background: 'rgba(74,127,193,.18)' }}></span>오른손 (4박)</div>
              <div className="poly-legend-item"><span className="poly-legend-dot" style={{ background: 'rgba(196,146,42,.18)' }}></span>왼손 (3박)</div>
              <div className="poly-legend-item"><span className="poly-legend-dot" style={{ background: 'rgba(192,57,43,.22)' }}></span>두 손이 동시에 연주</div>
            </div>
          </div>
        </div>
        <div className="sonnet-item">
          <div className="sec sonnet-item-num">[문제]</div>
          <div className="cp-rhythm-q">두 손 리듬이 어떻게 겹치나요?</div>
          <div id="cp-poly-q" className="choice-list">
            {CHOICES['cp-poly-q'].map((choice) => (
              <button
                key={`cp-poly-q-${choice}`}
                type="button"
                className={`choice-item ${selectedByGroup['cp-poly-q'] === choice ? 'selected' : ''}`}
                onClick={() => selectChoice('cp-poly-q', choice)}
              >
                {selectedByGroup['cp-poly-q'] === choice ? '●' : '○'} {choice}
              </button>
            ))}
          </div>
        </div>

        <ActivityEndFeedback
          style={{ marginTop: 12, marginBottom: 12 }}
          key={`cp-rhythm-activity-fb-${JSON.stringify(selectedByGroup)}`}
          requestFn={() => generateStage2ActivityFeedback('cp-rhythm', { selectedByGroup })}
          onResult={() => {
            setActivityFbDone(true);
            setStageCompletion('piano', true);
          }}
        />

        {canProceed ? (
          <div className="feat-card">
            <div className="feat-num">FEATURE</div>
            <div className="feat-title">환상 즉흥곡의 특징 ②</div>
            <div className="feat-body">
              환상즉흥곡은 복잡한 리듬꼴로 긴장감과 추진력을 만들어요.
              <br />
              오른손 4박과 왼손 3박이 동시에 진행되는
              <br />
              리듬을 폴리리듬이라고 하고, 이 리듬은 단순한 반주와 멜로디의
              <br />
              조합을 넘어서요.
              <br />
              두 손이 독립적으로 움직이며
              <br />
              만들어내는 긴장감이 특징이예요.
            </div>
          </div>
        ) : null}

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('voiceDesign')}>← 이전: cp-form</button>
          <button
            className="btn-p"
            disabled={!canProceed}
            style={!canProceed ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            onClick={() => { setStageCompletion('piano', true); go('historyCards'); }}
          >
            다음: 역사 맥락 →
          </button>
        </div>
      </div>
    </div>
  );
}

export default CpRhythm;
