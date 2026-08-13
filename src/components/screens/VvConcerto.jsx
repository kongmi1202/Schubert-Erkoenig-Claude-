import { useEffect, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { normalizeFormativeChoice } from '../../lib/compareFeedback';
import { getVvConcertoFixedFeedback } from '../../lib/fixedFormativeFeedback';
import FormativeFeedbackBlock from '../FormativeFeedbackBlock';

const VV_CONCERTO_Q = 'vv-concerto-q';
const VV_CONCERTO_CORRECT = '독주와 총주가 번갈아 나온다';
const VV_CONCERTO_CHOICES = ['독주만 계속 나온다', '총주만 계속 나온다', VV_CONCERTO_CORRECT];

function VvConcerto({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const vvConcertoState = useAppStore((s) => s.vvConcertoState);
  const setVvConcertoState = useAppStore((s) => s.setVvConcertoState);

  const [soloCount, setSoloCount] = useState(() => vvConcertoState?.soloCount ?? 0);
  const [tuttiCount, setTuttiCount] = useState(() => vvConcertoState?.tuttiCount ?? 0);
  const [selectedByGroup, setSelectedByGroup] = useState(() => ({
    [VV_CONCERTO_Q]: vvConcertoState?.discoveryChoice || ''
  }));
  const [fbDone, setFbDone] = useState(false);

  function selectChoice(groupId, value) {
    setSelectedByGroup((prev) => ({ ...prev, [groupId]: value }));
    setFbDone(false);
  }

  const resetCounts = () => {
    setSoloCount(0);
    setTuttiCount(0);
  };

  const picked = selectedByGroup[VV_CONCERTO_Q];
  const isCorrect =
    normalizeFormativeChoice(picked) === normalizeFormativeChoice(VV_CONCERTO_CORRECT);

  useEffect(() => {
    setVvConcertoState({
      soloCount,
      tuttiCount,
      discoveryChoice: selectedByGroup[VV_CONCERTO_Q] || '',
      quizResult: fbDone && isCorrect ? 'ok' : '',
      selectedBySegment: {},
      score: 0
    });
  }, [soloCount, tuttiCount, selectedByGroup, fbDone, isCorrect, setVvConcertoState]);

  return (
    <div className="screen active" id="vv-concerto">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2 · 분석적 감상</div>
        <div className="s-title">분석적 감상</div>
        <div className="s-desc">목표: 음악 요소, 음악적 특징 및 구성을 분석하고 비교하여 음악이 어떻게 표현되고 구성되는지 파악해 보세요.</div>
      </div>

      <div className="body voice-body">
        <div className="sec">
          3. 왼쪽 영상을 다시 보며, 바이올린 한 대가 연주하는 부분(독주)과 모든 현악기가 연주하는 부분(총주)을 구분하여 보세요.
        </div>

        <div className="sonnet-item vv-concerto-block">
          <div className="sec sonnet-item-num">
            3-1. 바이올린 한 대가 연주하는 부분(독주)과 모든 현악 그룹이 연주하는 부분(총주)이 나올 때마다 아래 버튼을 탭해보세요.
          </div>
          <div className="vv-concerto-tap-grid">
            <button
              type="button"
              className="vv-concerto-tap-btn solo"
              onClick={() => setSoloCount((c) => c + 1)}
            >
              <div className="vv-concerto-tap-emoji">🎻</div>
              <div className="vv-concerto-tap-label">바이올린 독주</div>
              <div className="vv-concerto-tap-desc">바이올린 한 대가 주로 연주해요</div>
              <div className="vv-concerto-count solo">{soloCount}회</div>
            </button>
            <button
              type="button"
              className="vv-concerto-tap-btn tutti"
              onClick={() => setTuttiCount((c) => c + 1)}
            >
              <div className="vv-concerto-tap-emoji">🎼</div>
              <div className="vv-concerto-tap-label">현악 그룹</div>
              <div className="vv-concerto-tap-desc">모든 현악기가 함께 연주해요</div>
              <div className="vv-concerto-count tutti">{tuttiCount}회</div>
            </button>
          </div>
          <button type="button" className="vv-concerto-reset" onClick={resetCounts}>
            처음부터 다시
          </button>
        </div>

        <div className="sonnet-item vv-concerto-block">
          <div className="sec sonnet-item-num">3-2. 독주와 총주가 어떻게 나타나나요?</div>
          <div id={VV_CONCERTO_Q} className="choice-list" style={{ marginBottom: 10 }}>
            {VV_CONCERTO_CHOICES.map((choice) => (
              <button
                key={choice}
                type="button"
                className={`choice-item ${picked === choice ? 'selected' : ''}`}
                onClick={() => selectChoice(VV_CONCERTO_Q, choice)}
              >
                {picked === choice ? '●' : '○'} {choice}
              </button>
            ))}
          </div>

          <div className="compare-ai-feedback" style={{ marginTop: 4, marginBottom: 12 }}>
            <FormativeFeedbackBlock
              key={`vv-concerto-fb-${picked || 'none'}`}
              disabled={!picked}
              getFeedback={() =>
                getVvConcertoFixedFeedback({
                  userChoice: picked || '',
                  correctAnswer: VV_CONCERTO_CORRECT
                })
              }
              onResult={() => {
                setFbDone(true);
                setStageCompletion('piano', true);
              }}
            />
          </div>
        </div>

        {fbDone && isCorrect ? (
          <div className="feat-card">
            <div className="feat-num">FEATURE</div>
            <div className="feat-title">사계의 주요 특징 ②: 바이올린 협주곡</div>
            <div className="feat-body">
              독주자와 그룹이
              <br />
              번갈아가며 연주한다
              <br />
              바이올린 협주곡에서
              <br />
              독주 바이올린과 현악 그룹은
              <br />
              번갈아가며 주고받아요.
              <br />
              이 형식을 리토르넬로라고 하며
              <br />
              &apos;사계&apos;의 핵심 구조예요.
            </div>
          </div>
        ) : null}

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('voiceDesign')}>← 이전: vv-sonnet</button>
          <button className="btn-p" onClick={() => { setStageCompletion('piano', true); go('historyCards'); }}>다음: 역사 맥락 →</button>
        </div>
      </div>
    </div>
  );
}

export default VvConcerto;
