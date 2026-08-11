import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import EmotionAnalysis from '../EmotionAnalysis';

const keywords = ['기쁨', '슬픔', '긴장', '평화', '쓸쓸함', '경쾌', '웅장', '역동적'];
const colors = [
  { name: '짙은 보라', value: '#4c1d95' }, { name: '어두운 붉은색', value: '#991b1b' }, { name: '짙은 남색', value: '#1e3a8a' }, { name: '검정', value: '#374151' },
  { name: '어두운 황토', value: '#a16207' }, { name: '어두운 초록', value: '#166534' }, { name: '갈색', value: '#92400e' }, { name: '자주', value: '#86198f' }
];

function SensoryPage({ go }) {
  const selectedKeywords = useAppStore((s) => s.selectedKeywords);
  const selectedColors = useAppStore((s) => s.selectedColors);
  const sensoryDesc = useAppStore((s) => s.sensoryDesc);
  const toggleKeyword = useAppStore((s) => s.toggleKeyword);
  const toggleColor = useAppStore((s) => s.toggleColor);
  const setSensoryDesc = useAppStore((s) => s.setSensoryDesc);
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const setSensoryArtifacts = useAppStore((s) => s.setSensoryArtifacts);
  const [emotionTrigger, setEmotionTrigger] = useState(0);

  useEffect(() => {
    setSensoryArtifacts({
      selectedActivities: [],
      pePhoto: '',
      peAnswer: '',
      scienceSelected: [],
      scienceAnswer: '',
      mapAddress: '',
      mapAnswer: '',
      mathDrawing: '',
      mathAnswer: ''
    });
  }, [setSensoryArtifacts]);

  const isStage1Complete = useMemo(() => {
    const hasKeywords = selectedKeywords.length > 0;
    const hasColors = selectedColors.length >= 2;
    const hasSensoryDesc = sensoryDesc.trim().length > 0;
    return hasKeywords && hasColors && hasSensoryDesc;
  }, [
    selectedKeywords,
    selectedColors,
    sensoryDesc
  ]);

  return (
    <div className="screen active">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 1 · 감각적 감상</div>
        <div className="s-title">감각적 감상</div>
        <div className="s-desc">목표: 음악을 집중하여 듣고, 음악에서 느껴지는 자신의 감성과 느낌을 다양하게 표현해 보세요.</div>
      </div>
      <div className="body">
        <div className="sec">1. 이 곡에서 느낀 감성 키워드를 모두 골라보세요.</div>
        <div className="kw-grid">{keywords.map((k) => <button key={k} className={`kw-btn ${selectedKeywords.includes(k) ? 'on' : ''}`} onClick={() => toggleKeyword(k)}>{k}</button>)}</div>
        <div className="sec">2. 이 곡을 듣고 떠오른 색상을 모두 골라보세요.</div>
        <div className="palette">{colors.map((c) => <button key={c.name} title={c.name} className={`pal-btn ${selectedColors.includes(c.name) ? 'on' : ''}`} style={{ background: c.value }} onClick={() => toggleColor(c.name)} />)}</div>
        <div className="pal-note">선택된 색상: {selectedColors.length}개 (2~4개 선택)</div>
        <div className="pal-selected-names">{selectedColors.length ? selectedColors.join(', ') : '선택한 색상 이름이 여기에 표시됩니다.'}</div>
        <div className="sec">3. 이 곡에서 느낀 느낌이나 분위기를 왜 그렇게 느꼈는지 이유와 함께 적어보세요.</div>
        <textarea className="txt" value={sensoryDesc} onChange={(e) => setSensoryDesc(e.target.value)} placeholder="자유롭게 써보세요" />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn-p" type="button" onClick={() => setEmotionTrigger((v) => v + 1)}>📊 이 곡에서 느낀 나의 감정 분석하기</button>
        </div>
        <EmotionAnalysis text={sensoryDesc} triggerKey={emotionTrigger} hideButton />

        <div className="btn-row"><button className="btn-s" onClick={() => go('songSelect')}>← 이전</button><button className="btn-p" onClick={() => { setStageCompletion('sensory', isStage1Complete); go('analyticalOverview'); }}>다음 단계 →</button></div>
      </div>
    </div>
  );
}

export default SensoryPage;
