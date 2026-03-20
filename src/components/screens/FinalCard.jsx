import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';

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

function FinalCard({ go }) {
  const {
    student, selectedKeywords, selectedColors, sensoryDesc, sensoryArtifacts,
    analyticalCharacters, analyticalStory, q1, q2, q3
  } = useAppStore();
  const analyticalAnswerCharacters = ['해설자', '아버지', '아들', '마왕'];
  const analyticalAnswerStory = '폭풍우 치는 밤, 아버지가 아픈 아들을 가슴에 안고 집으로 달려간다. 아들은 마왕의 유혹을 두려워하지만 아버지는 이를 부정한다. 집에 도착했을 때 아들은 이미 죽어 있다.';
  const studentLine = useMemo(() => `${student.className || '—'} ${student.id || ''} ${student.name || ''}`.trim(), [student]);

  return (
    <div className="screen active"><div className="stage-header"><div className="s-eyebrow">완성 · 최종 감상문</div><div className="s-title">나의 마왕 감상문</div></div>
      <div className="body voice-body">
        <div className="summary-card">
          <div className="summary-ey">✦ 나의 마왕 감상문 · Der Erlkönig, Schubert 1815</div>
          <div className="summary-row"><div className="summary-key">학생</div><div className="summary-val">{studentLine || '—'}</div></div>
          <div className="summary-div"></div>
          <div className="summary-ey">① 감각적 감상</div>
          <div className="chip-row">{selectedKeywords.length ? selectedKeywords.map((k) => <span key={k} className="review-chip">{k}</span>) : <span className="review-empty">키워드 없음</span>}</div>
          <div className="swatch-row">{selectedColors.length ? selectedColors.map((c) => <span key={c} className="review-swatch" title={c} style={{ background: colorMap[c] || '#555' }} />) : <span className="review-empty">색상 없음</span>}</div>
          <div className="fb show info">{sensoryDesc || '서술 없음'}</div>
          <div className="artifact-grid">
            {sensoryArtifacts?.pePhoto ? <div className="artifact-card"><div className="small-note">체육 사진</div><img src={sensoryArtifacts.pePhoto} alt="체육 사진" className="captured-img" /></div> : null}
            {sensoryArtifacts?.mathDrawing ? <div className="artifact-card"><div className="small-note">수학 그림</div><img src={sensoryArtifacts.mathDrawing} alt="수학 그림" className="captured-img" /></div> : null}
            {sensoryArtifacts?.scienceSelected?.length ? <div className="artifact-card"><div className="small-note">과학 선택</div><div className="chip-row">{sensoryArtifacts.scienceSelected.map((s) => <span key={s} className="review-chip">{s}</span>)}</div></div> : null}
            {sensoryArtifacts?.mapAddress ? <div className="artifact-card"><div className="small-note">사회 선택 장소</div><div className="map-address">{sensoryArtifacts.mapAddress}</div></div> : null}
          </div>

          <div className="summary-div"></div>
          <div className="summary-ey">② 분석적 감상</div>
          <div className="cmp-mini-grid">
            <div><div className="small-note">Q1 내 답변</div><div className="chip-row">{analyticalCharacters.filter(Boolean).length ? analyticalCharacters.filter(Boolean).map((c) => <span key={c} className="review-chip">{c}</span>) : <span className="review-empty">없음</span>}</div></div>
            <div><div className="small-note">Q1 정답</div><div className="chip-row">{analyticalAnswerCharacters.map((c) => <span key={c} className="review-chip answer">{c}</span>)}</div></div>
          </div>
          <div className="cmp-mini-grid">
            <div><div className="small-note">Q2 내 답변</div><div className="fb show info">{analyticalStory || '없음'}</div></div>
            <div><div className="small-note">Q2 정답</div><div className="fb show gold">{analyticalAnswerStory}</div></div>
          </div>

          <div className="summary-div"></div>
          <div className="summary-ey">③ 심미적 감상</div>
          <div className="summary-row"><div className="summary-key">변화</div><div className="summary-val">{q1 ? `분석해 보니 ${q1}라고 느꼈다.` : '—'}</div></div>
          <div className="summary-row"><div className="summary-key">이유</div><div className="summary-val">{q2 || '—'}</div></div>
          <div className="summary-row"><div className="summary-key">삶 연결</div><div className="summary-val">{q3 || '—'}</div></div>
        </div>

        <div className="sec">AI 감상문 평가</div>
        <div className="score-bars">
          <div className="score-bar-item"><div className="score-bar-label"><span>① 감각적 표현의 구체성</span><span>4 / 5</span></div><div className="score-bar-track"><div className="score-bar-fill" style={{ width: '80%' }} /></div></div>
          <div className="score-bar-item"><div className="score-bar-label"><span>② 음악 요소 분석의 정확성</span><span>3 / 5</span></div><div className="score-bar-track"><div className="score-bar-fill" style={{ width: '60%' }} /></div></div>
          <div className="score-bar-item"><div className="score-bar-label"><span>③ 감각+분석의 연결</span><span>4 / 5</span></div><div className="score-bar-track"><div className="score-bar-fill" style={{ width: '80%' }} /></div></div>
          <div className="score-bar-item"><div className="score-bar-label"><span>④ 가치와 삶의 확장</span><span>3 / 5</span></div><div className="score-bar-track"><div className="score-bar-fill" style={{ width: '60%' }} /></div></div>
        </div>
        <div className="total-score">총점: 14 / 20점</div>
        <div className="fb show gold">💬 음악의 긴박한 분위기를 색과 키워드로 잘 표현했어요. 분석 요소를 서술에 더 구체적으로 연결해보면 좋겠어요.</div>

        <div className="btn-row final-actions">
          <button className="btn-s" onClick={() => go('aestheticPage')}>← 다시 수정</button>
          <button className="btn-s" onClick={() => go('studentInfo')}>처음으로</button>
          <button className="btn-p" onClick={() => window.print()}>📄 PDF 저장</button>
          <button className="btn-p btn-send">📤 교사에게 전송</button>
        </div>
      </div>
    </div>
  );
}

export default FinalCard;
