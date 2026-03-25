import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { generateFinalEssay } from '../../lib/finalEssayGenerator';

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
  const [essayText, setEssayText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const evaluation = useMemo(() => {
    const t = (v) => (v || '').trim();
    const activityAnswers = [sensoryArtifacts?.peAnswer, sensoryArtifacts?.scienceAnswer, sensoryArtifacts?.mapAnswer, sensoryArtifacts?.mathAnswer]
      .filter((v) => t(v).length > 0).length;
    const activityArtifacts = [sensoryArtifacts?.pePhoto, sensoryArtifacts?.mathDrawing, sensoryArtifacts?.mapAddress]
      .filter(Boolean).length + (sensoryArtifacts?.scienceSelected?.length ? 1 : 0);

    const hasAnyInput = (
      selectedKeywords.length > 0 ||
      selectedColors.length > 0 ||
      t(sensoryDesc).length > 0 ||
      activityAnswers > 0 ||
      analyticalCharacters.some((c) => t(c).length > 0) ||
      t(analyticalStory).length > 0 ||
      t(q1).length > 0 ||
      t(q2).length > 0 ||
      t(q3).length > 0
    );

    if (!hasAnyInput) {
      return {
        ungraded: true,
        items: [],
        total: 0,
        feedback: '미채점 상태입니다. 1~3단계 입력을 완료하면 평가 점수와 코멘트가 표시됩니다.'
      };
    }

    const s1 = Math.min(5,
      (selectedKeywords.length > 0 ? 1 : 0) +
      (selectedColors.length >= 2 ? 1 : 0) +
      (t(sensoryDesc).length >= 20 ? 2 : t(sensoryDesc).length > 0 ? 1 : 0) +
      (activityAnswers > 0 || activityArtifacts > 0 ? 1 : 0)
    );
    const s2 = Math.min(5,
      (analyticalCharacters.filter((c) => t(c).length > 0).length >= 4 ? 2 : analyticalCharacters.some((c) => t(c).length > 0) ? 1 : 0) +
      (t(analyticalStory).length >= 40 ? 3 : t(analyticalStory).length > 0 ? 2 : 0)
    );
    const s3 = Math.min(5,
      ((selectedKeywords.length > 0 || t(sensoryDesc).length > 0) && (t(analyticalStory).length > 0 || analyticalCharacters.some((c) => t(c).length > 0)) ? 3 : 1) +
      (t(q1).length > 0 ? 1 : 0) +
      (t(q2).length > 0 ? 1 : 0)
    );
    const s4 = Math.min(5,
      (t(q2).length >= 20 ? 2 : t(q2).length > 0 ? 1 : 0) +
      (t(q3).length >= 30 ? 3 : t(q3).length > 0 ? 2 : 0)
    );

    const items = [
      { label: '① 감각적 표현의 구체성', score: s1 },
      { label: '② 음악 요소 분석의 정확성', score: s2 },
      { label: '③ 감각+분석의 연결', score: s3 },
      { label: '④ 가치와 삶의 확장', score: s4 }
    ];
    const total = items.reduce((acc, it) => acc + it.score, 0);
    const feedback = total >= 16
      ? '강점이 잘 드러난 감상문입니다. 각 단계의 근거가 비교적 구체적으로 연결되어 있습니다.'
      : total >= 10
        ? '핵심 내용은 잘 정리되었습니다. 각 단계의 답변을 문장으로 조금 더 구체화하면 더 좋아집니다.'
        : '입력된 근거가 아직 적습니다. 1~3단계 답변을 조금 더 채우면 평가 신뢰도가 높아집니다.';

    return { ungraded: false, items, total, feedback };
  }, [selectedKeywords, selectedColors, sensoryDesc, sensoryArtifacts, analyticalCharacters, analyticalStory, q1, q2, q3]);

  const onGenerateEssay = async () => {
    setIsGenerating(true);
    const text = await generateFinalEssay({
      student,
      selectedKeywords,
      selectedColors,
      sensoryDesc,
      sensoryArtifacts,
      analyticalCharacters,
      analyticalStory,
      q1,
      q2,
      q3
    });
    setEssayText(text);
    setIsGenerating(false);
  };

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

        <div className="sec">학생 완성 글 (1~3단계 종합)</div>
        <div className="summary-card">
          <div className="summary-row">
            <div className="summary-key">생성</div>
            <button className="btn-p" onClick={onGenerateEssay} disabled={isGenerating}>
              {isGenerating ? '생성 중...' : 'AI로 완성 글 만들기'}
            </button>
          </div>
          <div className="summary-div"></div>
          <div className="fb show info">
            {essayText || '버튼을 누르면 학생 입력을 바탕으로 자연스러운 최종 감상문이 생성됩니다.'}
          </div>
        </div>

        <div className="sec">AI 감상문 평가</div>
        {evaluation.ungraded ? (
          <div className="fb show gold">미채점 · {evaluation.feedback}</div>
        ) : (
          <>
            <div className="score-bars">
              {evaluation.items.map((it) => (
                <div key={it.label} className="score-bar-item">
                  <div className="score-bar-label"><span>{it.label}</span><span>{it.score} / 5</span></div>
                  <div className="score-bar-track"><div className="score-bar-fill" style={{ width: `${(it.score / 5) * 100}%` }} /></div>
                </div>
              ))}
            </div>
            <div className="total-score">총점: {evaluation.total} / 20점</div>
            <div className="fb show gold">💬 {evaluation.feedback}</div>
          </>
        )}

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
