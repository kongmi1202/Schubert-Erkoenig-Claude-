import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import CompareAiFeedbackBlock from '../CompareAiFeedbackBlock';
import {
  generateAestheticQ2FormativeAi,
  generateAestheticQ3FormativeAi
} from '../../lib/formativeAiFeedback';

function AestheticPage({ go }) {
  const {
    q2, q3, q2Type, setQ2, setQ3, setQ2Type,
    setStageCompletion, selectedSong
  } = useAppStore();
  const isHandel = selectedSong === 'handel';
  const isHaydn = selectedSong === 'haydn';
  const isSchoenberg = selectedSong === 'schoenberg';
  const isVivaldi = selectedSong === 'vivaldi';
  const isChopin = selectedSong === 'chopin';
  const q2Options = isHandel
    ? [
        { value: '음화법', label: '음화법(음색, 가락)' },
        { value: '화성다성음악', label: '화성·다성음악(다양한 소리의 어울림)' },
        { value: '맥락', label: '사회역사적 맥락' }
      ]
    : isHaydn
      ? [
          { value: '현악음색', label: '현악 4중주(음색)' },
          { value: '주제비교', label: '제1, 2주제(가락, 리듬꼴, 음계)' },
          { value: '맥락', label: '사회역사적 맥락' }
        ]
      : isSchoenberg
        ? [
            { value: '슈프레흐슈팀메', label: '슈프레흐슈팀메 (달에 홀린 피에로)' },
            { value: '무조성', label: '무조성 (달에 홀린 피에로)' },
            { value: '맥락', label: '사회·역사적 맥락' }
          ]
        : isVivaldi
          ? [
              { value: '소네트', label: '소네트(표제 음악)' },
              { value: '바이올린협주곡', label: '협주곡(음색, 형식)' },
              { value: '맥락', label: '사회역사적 맥락' }
            ]
          : isChopin
            ? [
                { value: 'ABA형식', label: 'ABA 형식 (환상 즉흥곡)' },
                { value: '폴리리듬', label: '폴리리듬 (환상 즉흥곡)' },
                { value: '맥락', label: '사회·역사적 맥락' }
              ]
            : [
                { value: '음색', label: '등장인물의 음색' },
                { value: '반주', label: '피아노 반주' },
                { value: '맥락', label: '사회·역사적 맥락' }
              ];

  const q2Label = useMemo(
    () => q2Options.find((opt) => opt.value === q2Type)?.label || q2Type,
    [q2Options, q2Type]
  );
  const canShowQ2Feedback = Boolean(q2Type && q2.trim().length >= 8);
  const canShowQ3Feedback = Boolean(q2Type && q2.trim().length >= 8 && q3.trim().length >= 8);
  const q2FeedbackKey = useMemo(
    () => `${q2Type}|${q2.trim()}`,
    [q2Type, q2]
  );
  const q3FeedbackKey = useMemo(
    () => `${q2Type}|${q2.trim()}|${q3.trim()}`,
    [q2Type, q2, q3]
  );

  return (
    <div className="screen active">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 3 · 심미적 감상</div>
        <div className="s-title">심미적 감상</div>
        <div className="s-desc">목표: 음악의 다양한 요소들을 바탕으로 음악의 가치를 평가해 보세요.</div>
      </div>
      <div className="body voice-body">
        <div className="sec">
          2. 악곡에서 특별하다고 생각했던 음악 요소를 아래에서 고르고, 그렇게 생각한 이유를 적어 보세요.
        </div>
        <select className="dropdown" value={q2Type} onChange={(e) => setQ2Type(e.target.value)}>
          <option value="">특별하다고 느낀 음악 요소를 선택하세요</option>
          {q2Options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {q2Type ? (
          <textarea
            className="txt"
            value={q2}
            onChange={(e) => setQ2(e.target.value)}
            placeholder="어떻게 들리는지·어떤 느낌인지, 왜 특별하게 느껴졌는지"
          />
        ) : null}

        {canShowQ2Feedback ? (
          <CompareAiFeedbackBlock
            key={q2FeedbackKey}
            requestFn={() =>
              generateAestheticQ2FormativeAi({
                selectedSong,
                q2Type,
                q2Label,
                q2
              })
            }
          />
        ) : null}

        <div className="sec">
          3. 2번에서 고른 음악 요소와 그 이유를 바탕으로, 이 곡에 대해 어떻게 평가하고 싶은지 적어 보세요.
        </div>
        <textarea
          className="txt"
          value={q3}
          onChange={(e) => setQ3(e.target.value)}
          disabled={!q2Type || q2.trim().length < 8}
          placeholder={
            q2Type && q2.trim().length >= 8
              ? '2번의 특징과 나의 판단을 바탕으로, 이 곡 전체를 어떻게 평가하고 싶은지 써 보세요.'
              : '2번을 먼저 완성해 주세요.'
          }
        />

        {canShowQ3Feedback ? (
          <CompareAiFeedbackBlock
            key={q3FeedbackKey}
            requestFn={() =>
              generateAestheticQ3FormativeAi({
                selectedSong,
                q2Type,
                q2Label,
                q2,
                q3
              })
            }
          />
        ) : null}

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('historyCards')}>← 이전</button>
          <button className="btn-p" onClick={() => { setStageCompletion('aesthetic', true); go('finalCard'); }}>최종 감상문 만들기 →</button>
        </div>
      </div>
    </div>
  );
}

export default AestheticPage;
