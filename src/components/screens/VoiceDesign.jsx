import { useMemo, useState } from 'react';
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
  const [segmentReloadKey, setSegmentReloadKey] = useState(0);

  const active = chars.find((c) => c.name === selectedCharacter) || chars[0];
  const videoId = '8noeFpdfWcQ';
  const segmentSrc = `https://www.youtube.com/embed/${videoId}?start=${active.start}&end=${active.end}&rel=0&modestbranding=1&playsinline=1&k=${segmentReloadKey}`;

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

  return (
    <div className="screen active"><div className="stage-header"><div className="s-eyebrow">STAGE 2-B · 분석적 감상 — 음색</div><div className="s-title">인물의 목소리를 설계해보세요</div><div className="s-desc">알아보고 싶은 등장인물 2명을 선택하고 목소리를 설계해보세요.<br />음악 요소: <strong>음색</strong></div></div>
      <div className="body voice-body">
        <div className="sec">등장인물 선택 (2명)</div>
        <div className="char-tabs">
          {chars.map((c) => (
            <button key={c.name} className={`char-tab ${selectedCharacter === c.name ? 'active' : ''} ${selectedChars.includes(c.name) ? 'picked' : ''}`} onClick={() => toggleChar(c.name)}>
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
            <button className="btn-s" type="button" onClick={() => setSegmentReloadKey((k) => k + 1)}>다시 듣기</button>
          </div>
          <div className="video-wrap" style={{ marginBottom: 0 }}>
            <iframe
              src={segmentSrc}
              title={`${active.name} 구간 영상`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
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

        {canCheckAnswer ? (
          <button type="button" className="answer-check-toggle" onClick={() => { setShowCompare((v) => !v); setStageCompletion('voice', true); }} aria-expanded={showCompare}>
            <span className="answer-check-toggle-label">정답 확인하기</span>
            <span className="answer-check-toggle-chevron" aria-hidden="true">
              {showCompare ? '▲' : '▼'}
            </span>
          </button>
        ) : null}

        <div className={`answer-compare-slide ${showCompare ? 'open' : ''}`}>
          <div className="answer-compare-inner">
            <table className="cmp-table">
              <thead>
                <tr>
                  <th>인물</th>
                  <th>요소</th>
                  <th>내 설계</th>
                  <th>모범 설계</th>
                </tr>
              </thead>
              <tbody>
                {selectedChars.flatMap((name) => (['음높이', '음계', '리듬꼴', '음색'].map((key) => (
                  <tr key={`${name}-${key}`}>
                    <td className="row-label">{name}</td>
                    <td>{key}</td>
                    <td>{voiceDesign[name][key] || '—'}</td>
                    <td>{answerKey[name][key]}</td>
                  </tr>
                ))))}
              </tbody>
            </table>
            <div className="fb show info">💬 시의 인물 성격에 따라 음높이·음계·리듬꼴·음색이 달라지도록 설계했는지 비교해보세요.</div>
          </div>
        </div>

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('analyticalOverview')}>← 이전</button>
          <button className="btn-p" disabled={!canCheckAnswer} style={!canCheckAnswer ? { opacity: 0.5, cursor: 'not-allowed' } : undefined} onClick={() => go('pianoAnalysis')}>다음 단계 →</button>
        </div>
      </div>
    </div>
  );
}

export default VoiceDesign;
