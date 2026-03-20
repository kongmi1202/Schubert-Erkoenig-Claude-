import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';

const chars = [
  { name: '해설자', icon: '🗣️', lyric: `"이 밤 폭풍 속 누가 말달려\n그는 아버지, 그 아들 그는 아..."`, audioTitle: '해설자 구간 듣기' },
  { name: '아버지', icon: '👨', lyric: `"걱정 마라, 안개란다"\n"아가, 그것은 안개다"`, audioTitle: '아버지 구간 듣기' },
  { name: '아들', icon: '👦', lyric: `"아빠, 마왕이 안 보여요?\n저 마왕이 내게 손짓해요!"`, audioTitle: '아들 구간 듣기' },
  { name: '마왕', icon: '👁️', lyric: `"사랑스런 아가야, 나와 함께 가자\n아름다운 꽃들이 피어 있단다"`, audioTitle: '마왕 구간 듣기' }
];

function VoiceDesign({ go }) {
  const selectedCharacter = useAppStore((s) => s.selectedCharacter);
  const setSelectedCharacter = useAppStore((s) => s.setSelectedCharacter);
  const [selectedChars, setSelectedChars] = useState(['해설자', '아버지']);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [voiceDesign, setVoiceDesign] = useState({
    해설자: { 음높이: '', 음계: '', 리듬꼴: '', 음색: '' },
    아버지: { 음높이: '', 음계: '', 리듬꼴: '', 음색: '' },
    아들: { 음높이: '', 음계: '', 리듬꼴: '', 음색: '' },
    마왕: { 음높이: '', 음계: '', 리듬꼴: '', 음색: '' }
  });

  const active = chars.find((c) => c.name === selectedCharacter) || chars[0];

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

        <div className="audio-bar voice-audio-bar">
          <button className="aud-btn" onClick={() => setAudioPlaying((p) => !p)}>
            {audioPlaying ? '❚❚' : '▶'}
          </button>
          <div className="aud-title">{active.audioTitle}</div>
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

        <div className="btn-row"><button className="btn-s" onClick={() => go('analyticalOverviewAnswer')}>← 이전</button><button className="btn-p" onClick={() => go('voiceAnswer')}>정답 비교 →</button></div>
      </div>
    </div>
  );
}

export default VoiceDesign;
