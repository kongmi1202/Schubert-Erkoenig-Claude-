import { useMemo, useRef, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

const AUDIO_SRC = {
  'cp-rh': '/audio/cp-rh.mp3',
  'cp-lh': '/audio/cp-lh.mp3',
  'cp-both': '/audio/cp-both.mp3'
};

const CHOICES = {
  'cp-rh-q': ['2개씩', '3개씩', '4개씩', '6개씩'],
  'cp-lh-q': ['2개씩', '3개씩', '4개씩', '6개씩'],
  'cp-poly-q': ['단순하고 편안하다', '복잡하고 긴장감이 있다', '느리고 서정적이다', '규칙적이고 반복된다']
};

function CpRhythm({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const [selectedByGroup, setSelectedByGroup] = useState({});
  const [resultByGroup, setResultByGroup] = useState({});
  const [openByBodyId, setOpenByBodyId] = useState({});
  const [playingId, setPlayingId] = useState('');
  const [polyDesc, setPolyDesc] = useState('');
  const [showHint, setShowHint] = useState(false);
  const audioRefs = useRef({
    'cp-rh': null,
    'cp-lh': null,
    'cp-both': null
  });

  function selectChoice(groupId, value) {
    setSelectedByGroup((prev) => ({ ...prev, [groupId]: value }));
    setResultByGroup((prev) => ({ ...prev, [groupId]: '' }));
  }

  function checkTP(groupId, correct, _btnId, bodyId) {
    const picked = selectedByGroup[groupId];
    if (!picked) return;
    const isCorrect = picked === correct;
    setResultByGroup((prev) => ({ ...prev, [groupId]: isCorrect ? 'ok' : 'ng' }));
    setOpenByBodyId((prev) => ({ ...prev, [bodyId]: !prev[bodyId] }));
    setStageCompletion('piano', true);
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

  const allChecked = useMemo(
    () => ['cp-rh-q', 'cp-lh-q', 'cp-poly-q'].every((groupId) => !!resultByGroup[groupId]),
    [resultByGroup]
  );
  const canProceed = allChecked && polyDesc.trim().length > 0;
  const hintText = `두 리듬이 동시에 들릴 때
박자가 한 방향으로만 가지 않고
엇갈리며 밀고 당기는 느낌이 나는지
중심으로 설명해보세요.`;

  return (
    <div className="screen active" id="cp-rhythm">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2-C · 분석적 감상 (쇼팽)</div>
        <div className="s-title">폴리리듬</div>
        <div className="s-desc">음악 요소: 여러 가지 박자의 리듬꼴</div>
      </div>

      <div className="body voice-body">
        <div className="fb show info">
          💡 피아노는 오른손과 왼손이
          <br />
          서로 다른 역할을 해요.
          <br />
          이 곡에서 두 손은 서로 다른
          <br />
          리듬으로 연주한답니다!
        </div>

        <div className="sec">오른손 리듬</div>
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
        <div className="audio-bar voice-audio-bar">
          <button type="button" className="aud-btn" onClick={() => togglePlay('cp-rh')}>
            {playingId === 'cp-rh' ? '❚❚' : '▶'}
          </button>
          <div>
            <div className="aud-title-sm">오른손만 듣기</div>
          </div>
        </div>
        <div className="review-card" style={{ marginBottom: 10 }}>
          <div style={{ marginBottom: 12 }}>오른손 음표는 몇 개씩 묶여 있나요?</div>
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
        <button
          id="ans-cp-rh-btn"
          type="button"
          className="answer-check-toggle"
          onClick={() => checkTP('cp-rh-q', '4개씩', 'ans-cp-rh-btn', 'ans-cp-rh-body')}
          aria-expanded={!!openByBodyId['ans-cp-rh-body']}
          disabled={!selectedByGroup['cp-rh-q']}
          style={!selectedByGroup['cp-rh-q'] ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
        >
          <span className="answer-check-toggle-label">정답 확인하기</span>
          <span className="answer-check-toggle-chevron" aria-hidden="true">{openByBodyId['ans-cp-rh-body'] ? '▲' : '▼'}</span>
        </button>
        <div id="ans-cp-rh-body" className={`answer-compare-slide ${openByBodyId['ans-cp-rh-body'] ? 'open' : ''}`}>
          <div className="answer-compare-inner">
            <div className={`fb show ${resultByGroup['cp-rh-q'] === 'ok' ? 'ok' : 'info'}`}>
              오른손은 16분음표 4개씩 묶여
              <br />
              빠르게 달려가요.
            </div>
          </div>
        </div>

        <div className="sec">왼손 리듬</div>
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
        <div className="audio-bar voice-audio-bar">
          <button type="button" className="aud-btn" onClick={() => togglePlay('cp-lh')}>
            {playingId === 'cp-lh' ? '❚❚' : '▶'}
          </button>
          <div>
            <div className="aud-title-sm">왼손만 듣기</div>
          </div>
        </div>
        <div className="review-card" style={{ marginBottom: 10 }}>
          <div style={{ marginBottom: 12 }}>왼손 음표는 몇 개씩 묶여 있나요?</div>
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
        <button
          id="ans-cp-lh-btn"
          type="button"
          className="answer-check-toggle"
          onClick={() => checkTP('cp-lh-q', '3개씩', 'ans-cp-lh-btn', 'ans-cp-lh-body')}
          aria-expanded={!!openByBodyId['ans-cp-lh-body']}
          disabled={!selectedByGroup['cp-lh-q']}
          style={!selectedByGroup['cp-lh-q'] ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
        >
          <span className="answer-check-toggle-label">정답 확인하기</span>
          <span className="answer-check-toggle-chevron" aria-hidden="true">{openByBodyId['ans-cp-lh-body'] ? '▲' : '▼'}</span>
        </button>
        <div id="ans-cp-lh-body" className={`answer-compare-slide ${openByBodyId['ans-cp-lh-body'] ? 'open' : ''}`}>
          <div className="answer-compare-inner">
            <div className={`fb show ${resultByGroup['cp-lh-q'] === 'ok' ? 'ok' : 'info'}`}>
              왼손은 셋잇단음표 3개씩 묶여
              <br />
              오른손보다 조금 느리게 움직여요.
            </div>
          </div>
        </div>

        <div className="sec">두 손이 합쳐지면?</div>
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
        <div className="audio-bar voice-audio-bar">
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
              <tr>
                <td className="row-label">왼손 (3박)</td>
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
            </tbody>
          </table>
          <div className="poly-legend">
            <div className="poly-legend-item"><span className="poly-legend-dot" style={{ background: 'rgba(74,127,193,.18)' }}></span>오른손 (4박)</div>
            <div className="poly-legend-item"><span className="poly-legend-dot" style={{ background: 'rgba(196,146,42,.18)' }}></span>왼손 (3박)</div>
            <div className="poly-legend-item"><span className="poly-legend-dot" style={{ background: 'rgba(192,57,43,.22)' }}></span>두 손이 동시에 연주</div>
          </div>
        </div>

        <div className="review-card" style={{ marginBottom: 10 }}>
          <div style={{ marginBottom: 12 }}>두 손이 함께 연주될 때 어떤 느낌인가요?</div>
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
        <button
          id="ans-cp-poly-btn"
          type="button"
          className="answer-check-toggle"
          onClick={() => checkTP('cp-poly-q', '복잡하고 긴장감이 있다', 'ans-cp-poly-btn', 'ans-cp-poly-body')}
          aria-expanded={!!openByBodyId['ans-cp-poly-body']}
          disabled={!selectedByGroup['cp-poly-q']}
          style={!selectedByGroup['cp-poly-q'] ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
        >
          <span className="answer-check-toggle-label">정답 확인하기</span>
          <span className="answer-check-toggle-chevron" aria-hidden="true">{openByBodyId['ans-cp-poly-body'] ? '▲' : '▼'}</span>
        </button>
        <div id="ans-cp-poly-body" className={`answer-compare-slide ${openByBodyId['ans-cp-poly-body'] ? 'open' : ''}`}>
          <div className="answer-compare-inner">
            <div className={`fb show ${resultByGroup['cp-poly-q'] === 'ok' ? 'ok' : 'info'}`}>
              오른손 4박과 왼손 3박이 동시에 진행되어
              <br />
              복잡하고 긴장된 느낌을 만들어요.
              <br />
              이처럼 두 가지 이상의 박자가
              <br />
              동시에 나타나는 것을
              <br />
              폴리리듬이라고 해요.
            </div>
          </div>
        </div>

        <div className="sec">폴리리듬이 이 곡의 분위기에 어떤 영향을 준다고 생각하나요?</div>
        <textarea
          id="cp-poly-desc"
          className="txt"
          value={polyDesc}
          onChange={(e) => setPolyDesc(e.target.value)}
          placeholder="긴장감, 추진력, 불안정한 느낌 등을 중심으로 써보세요."
        />
        <button type="button" className="ai-btn" onClick={() => setShowHint((prev) => !prev)}>✨ 참고 예시 보기</button>
        <div className={`ai-bubble ${showHint ? 'show' : ''}`}>
          <div className="ai-bubble-label">참고 예시 (정답 아님 · 그대로 복사 금지)</div>
          {hintText}
        </div>

        <div className="feat-card">
          <div className="feat-num">FEATURE</div>
          <div className="feat-title">환상 즉흥곡의 특징 ②</div>
          <div className="feat-body">
            복잡한 리듬꼴로 긴장감과 추진력을 만든다
            <br />
            오른손 4박과 왼손 3박이 동시에 진행되는
            <br />
            폴리리듬은 단순한 반주와 멜로디의
            <br />
            조합을 넘어서요.
            <br />
            두 손이 독립적으로 움직이며
            <br />
            만들어내는 긴장감이
            <br />
            낭만주의 피아노 음악의 특징이에요.
          </div>
        </div>

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('voiceDesign')}>← 이전: cp-form</button>
          <button
            className="btn-p"
            disabled={!canProceed}
            style={!canProceed ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            onClick={() => go('historyCards')}
          >
            다음: cp-history →
          </button>
        </div>
      </div>
    </div>
  );
}

export default CpRhythm;
