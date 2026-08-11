import { useAppStore } from '../../store/useAppStore';

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

  return (
    <div className="screen active">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 3 · 심미적 감상</div>
        <div className="s-title">심미적 감상</div>
        <div className="s-desc">목표: 음악의 다양한 요소들을 바탕으로 음악의 가치를 평가해 보세요.</div>
      </div>
      <div className="body voice-body">
        <div className="sec">2. 2단계 분석적 감상에서 학습했던 음악 요소를 하나 고르고, 그 음악 요소가 이 곡을 왜 특별하게 만드는지 평가해 보세요.</div>
        <select className="dropdown" value={q2Type} onChange={(e) => setQ2Type(e.target.value)}>
          <option value="">연결할 분석 요소를 선택하세요</option>
          {q2Options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {q2Type ? (
          <textarea
            className="txt"
            value={q2}
            onChange={(e) => setQ2(e.target.value)}
            placeholder="이 요소가 왜 이 곡을 더 좋게(또는 특별하게) 만드는지 근거를 써보세요."
          />
        ) : null}

        <div className="sec">3. 이 곡을 나의 삶에서 어떤 순간에 어떻게 사용할 수 있을까요?</div>
        <textarea
          className="txt"
          value={q3}
          onChange={(e) => setQ3(e.target.value)}
          placeholder="예: 긴장될 때, 슬플 때, 집중할 때 등 — 언제·어떻게 쓸지 써보세요."
        />
        <div className="btn-row">
          <button className="btn-s" onClick={() => go('historyCards')}>← 이전</button>
          <button className="btn-p" onClick={() => { setStageCompletion('aesthetic', true); go('finalCard'); }}>최종 감상문 만들기 →</button>
        </div>
      </div>
    </div>
  );
}

export default AestheticPage;
