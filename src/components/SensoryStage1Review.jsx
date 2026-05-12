import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';

const colorMap = {
  '짙은 보라': '#4c1d95',
  '어두운 붉은색': '#991b1b',
  '짙은 남색': '#1e3a8a',
  검정: '#374151',
  '어두운 황토': '#a16207',
  '어두운 초록': '#166534',
  갈색: '#92400e',
  자주: '#86198f'
};

/**
 * 1단계(감각적 감상)에서 입력·선택한 내용을 2단계 개요 파악 등에서 그대로 보여줍니다.
 * @param {{ keywordsId?: string, sensoryDescId?: string }} [ids] — 선택적 DOM id (기존 화면 호환)
 */
export default function SensoryStage1Review({ ids }) {
  const selectedKeywords = useAppStore((s) => s.selectedKeywords);
  const selectedColors = useAppStore((s) => s.selectedColors);
  const sensoryDesc = useAppStore((s) => s.sensoryDesc);
  const emotionResult = useAppStore((s) => s.emotionResult);
  const emotionSummary = useAppStore((s) => s.emotionSummary);
  const sensoryArtifacts = useAppStore((s) => s.sensoryArtifacts);

  const emotionRows = useMemo(
    () =>
      emotionResult
        ? [
            { key: 'sadness', label: '슬픔', emoji: '😢', value: Number(emotionResult.sadness) || 0 },
            { key: 'fear', label: '공포', emoji: '😨', value: Number(emotionResult.fear) || 0 },
            { key: 'anger', label: '분노', emoji: '😠', value: Number(emotionResult.anger) || 0 },
            { key: 'happiness', label: '기쁨', emoji: '😊', value: Number(emotionResult.happiness) || 0 },
            { key: 'surprise', label: '놀라움', emoji: '😮', value: Number(emotionResult.surprise) || 0 },
            { key: 'disgust', label: '혐오', emoji: '😒', value: Number(emotionResult.disgust) || 0 }
          ].sort((a, b) => b.value - a.value)
        : [],
    [emotionResult]
  );

  return (
    <>
      <div className="sec">1단계 감각적 감상 결과</div>
      <div className="review-card" style={{ marginBottom: 14 }}>
        <div className="review-grid">
          <div>
            <div className="review-section-title">감성 키워드</div>
            <div id={ids?.keywordsId} className="review-item">{selectedKeywords.join(', ') || '선택 없음'}</div>
          </div>
          <div>
            <div className="review-section-title">느낌·분위기 서술</div>
            <div id={ids?.sensoryDescId} className="review-item">{sensoryDesc || '서술 없음'}</div>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <div className="review-section-title">감정 분석 결과</div>
          <div className="review-item">
            {emotionRows.length
              ? emotionRows.map((item) => `${item.emoji} ${item.label} ${item.value}%`).join(' · ')
              : '분석 없음'}
          </div>
          <div className="small-note">{emotionSummary || '요약 없음'}</div>
        </div>
      </div>
      <div className="review-card" style={{ marginBottom: 14 }}>
        <div className="review-grid">
          <div>
            <div className="review-section-title">핵심 색상</div>
            <div className="swatch-row">
              {selectedColors.length
                ? selectedColors.map((c) => (
                    <span key={c} className="review-swatch" style={{ background: colorMap[c] || '#555' }} title={c} />
                  ))
                : <span className="review-empty">선택 없음</span>}
            </div>
            <div className="review-item" style={{ marginBottom: 0 }}>{selectedColors.length ? selectedColors.join(', ') : ''}</div>
          </div>
          <div>
            <div className="review-section-title">다른 방식으로 음악 표현하기 (선택)</div>
            <div className="review-item">
              {sensoryArtifacts?.selectedActivities?.length ? sensoryArtifacts.selectedActivities.join(', ') : '선택 없음'}
            </div>
          </div>
        </div>

        <div className="artifact-grid">
          {sensoryArtifacts?.pePhoto ? (
            <div className="artifact-card">
              <div className="review-item">체육 사진</div>
              <img src={sensoryArtifacts.pePhoto} alt="체육 활동 사진" className="captured-img" />
              {sensoryArtifacts.peAnswer ? <div className="small-note">{sensoryArtifacts.peAnswer}</div> : null}
            </div>
          ) : null}
          {sensoryArtifacts?.scienceSelected?.length ? (
            <div className="artifact-card">
              <div className="review-item">과학 선택</div>
              <div className="chip-row">{sensoryArtifacts.scienceSelected.map((s) => <span key={s} className="review-chip">{s}</span>)}</div>
              {sensoryArtifacts.scienceAnswer ? <div className="small-note">{sensoryArtifacts.scienceAnswer}</div> : null}
            </div>
          ) : null}
          {sensoryArtifacts?.mapAddress ? (
            <div className="artifact-card">
              <div className="review-item">사회 선택 장소</div>
              <div className="map-address">{sensoryArtifacts.mapAddress}</div>
              {sensoryArtifacts.mapAnswer ? <div className="small-note">{sensoryArtifacts.mapAnswer}</div> : null}
            </div>
          ) : null}
          {sensoryArtifacts?.mathDrawing ? (
            <div className="artifact-card">
              <div className="review-item">수학 도형 그림</div>
              <img src={sensoryArtifacts.mathDrawing} alt="수학 활동 그림" className="captured-img" />
              {sensoryArtifacts.mathAnswer ? <div className="small-note">{sensoryArtifacts.mathAnswer}</div> : null}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
