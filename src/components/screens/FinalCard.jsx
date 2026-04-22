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
    selectedSong, analyticalCharacters, analyticalStory, handelLyricMeaning, handelOperaDiff, q1, q2, q3
  } = useAppStore();
  const isHandel = selectedSong === 'handel';
  const isHaydn = selectedSong === 'haydn';
  const isSchoenberg = selectedSong === 'schoenberg';
  const isVivaldi = selectedSong === 'vivaldi';
  const songTitle = isHandel ? '할렐루야' : (isHaydn ? '종달새' : (isSchoenberg ? '달에 홀린 피에로' : (isVivaldi ? '여름 3악장' : '마왕')));
  const songSubtitle = isHandel ? 'Hallelujah Chorus, Handel 1741' : (isHaydn ? 'String Quartet No.67, Haydn 1790' : (isSchoenberg ? 'Pierrot Lunaire, Schoenberg 1912' : (isVivaldi ? 'Summer, Vivaldi 1725' : 'Der Erlkönig, Schubert 1815')));
  const songLabel = selectedSong === 'handel'
    ? '할렐루야 (헨델)'
    : (selectedSong === 'mawang'
      ? '마왕 (슈베르트)'
      : (selectedSong === 'haydn'
        ? '종달새 (하이든)'
        : (selectedSong === 'vivaldi'
          ? '여름 (비발디)'
        : (selectedSong === 'schoenberg'
          ? '달에 취하여 (쇤베르크)'
          : '—'))));
  const analyticalAnswerCharacters = ['해설자', '아버지', '아들', '마왕'];
  const analyticalAnswerStory = '폭풍우 치는 밤, 아버지가 아픈 아들을 가슴에 안고 집으로 달려간다. 아들은 마왕의 유혹을 두려워하지만 아버지는 이를 부정한다. 집에 도착했을 때 아들은 이미 죽어 있다.';
  const handelAnswerQ1 = '성경(요한계시록)을 바탕으로 한 종교적 내용이에요. 할렐루야, King of Kings 등 신의 위대함을 찬양하는 내용이 중심입니다.';
  const handelAnswerQ2 = '오페라와 달리 오라토리오는 무대 연기·의상 없이 합창과 관현악으로 종교적 내용을 전달해요.';
  const haydnAnswerQ1 = ['제1바이올린', '제2바이올린', '비올라', '첼로'];
  const haydnAnswerQ2 = '종달새';
  const schoenbergAnswerQ1 = ['소프라노(또는 메조소프라노)', '플루트', '클라리넷', '바이올린', '첼로', '피아노'];
  const schoenbergAnswerQ2 = '불안하고 몽환적이며 신비로운 분위기예요. 달빛 속 도취감과 공포가 뒤섞인 표현주의 특유의 감성을 담고 있어요.';
  const vivaldiAnswerQ1 = ['여름 폭풍우 장면', '지친 목동과 양떼', '갑작스러운 번개와 천둥', '우박으로 이삭이 쓸려감'];
  const vivaldiAnswerQ2 = '격렬하고 긴박한 폭풍우의 분위기예요. 빠른 템포와 강한 셈여림으로 폭풍우의 긴박함과 공포가 생생하게 전달돼요.';
  const studentLine = useMemo(() => `${student.className || '—'} ${student.id || ''} ${student.name || ''}`.trim(), [student]);
  const [essayText, setEssayText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const evaluation = useMemo(() => {
    const t = (v) => (v || '').trim();
    const activityAnswers = [sensoryArtifacts?.peAnswer, sensoryArtifacts?.scienceAnswer, sensoryArtifacts?.mapAnswer, sensoryArtifacts?.mathAnswer]
      .filter((v) => t(v).length > 0).length;
    const activityArtifacts = [sensoryArtifacts?.pePhoto, sensoryArtifacts?.mathDrawing, sensoryArtifacts?.mapAddress]
      .filter(Boolean).length + (sensoryArtifacts?.scienceSelected?.length ? 1 : 0);

    const analyticalQ1 = isHandel ? handelLyricMeaning : analyticalCharacters.filter((c) => t(c).length > 0).join(', ');
    const analyticalQ2 = isHandel ? handelOperaDiff : analyticalStory;

    const hasAnyInput = (
      selectedKeywords.length > 0 ||
      selectedColors.length > 0 ||
      t(sensoryDesc).length > 0 ||
      activityAnswers > 0 ||
      t(analyticalQ1).length > 0 ||
      t(analyticalQ2).length > 0 ||
      t(q1).length > 0 ||
      t(q2).length > 0 ||
      t(q3).length > 0
    );

    if (!hasAnyInput) {
      return {
        ungraded: true,
        items: [],
        feedback: '미채점 상태입니다. 1~3단계 입력을 완료하면 단계별 등급과 코멘트가 표시됩니다.'
      };
    }

    const stage1Score = Math.min(5,
      (selectedKeywords.length > 0 ? 1 : 0) +
      (selectedColors.length >= 2 ? 1 : 0) +
      (t(sensoryDesc).length >= 20 ? 2 : t(sensoryDesc).length > 0 ? 1 : 0) +
      (activityAnswers > 0 || activityArtifacts > 0 ? 1 : 0)
    );
    const stage2Score = Math.min(5,
      (t(analyticalQ1).length >= (isHandel ? 20 : 8) ? 2 : t(analyticalQ1).length > 0 ? 1 : 0) +
      (t(analyticalQ2).length >= 35 ? 3 : t(analyticalQ2).length > 0 ? 2 : 0)
    );
    const stage3Score = Math.min(5,
      (t(q1).length >= 10 ? 2 : t(q1).length > 0 ? 1 : 0) +
      (t(q2).length >= 20 ? 2 : t(q2).length > 0 ? 1 : 0) +
      (t(q3).length >= 25 ? 1 : 0)
    );

    const toGrade = (score) => (score >= 4 ? '상' : score >= 2 ? '중' : '하');
    const gradeStage1 = toGrade(stage1Score);
    const gradeStage2 = toGrade(stage2Score);
    const gradeStage3 = toGrade(stage3Score);

    const items = [
      {
        label: '1단계 감각적 감상',
        grade: gradeStage1,
        comment: gradeStage1 === '상'
          ? '키워드·색·서술·활동 근거가 균형 있게 제시되었습니다.'
          : gradeStage1 === '중'
            ? '핵심 감상 근거는 보입니다. 키워드나 서술을 조금 더 구체화해 보세요.'
            : '감각적 감상 입력이 적습니다. 키워드/색/서술을 보강해 보세요.'
      },
      {
        label: '2단계 분석적 감상',
        grade: gradeStage2,
        comment: gradeStage2 === '상'
          ? '질문별 답변이 구체적이며 정답 관점과의 연결이 잘 보입니다.'
          : gradeStage2 === '중'
            ? '분석의 방향은 좋습니다. 근거 문장을 조금 더 자세히 써보세요.'
            : '분석 답변이 짧거나 비어 있습니다. Q1/Q2를 보강해 보세요.'
      },
      {
        label: '3단계 심미적 감상',
        grade: gradeStage3,
        comment: gradeStage3 === '상'
          ? '느낌 변화, 이유, 삶 연결이 잘 이어져 가치 판단이 분명합니다.'
          : gradeStage3 === '중'
            ? '개인적 해석은 보입니다. 이유와 삶 연결을 조금 더 확장해 보세요.'
            : '심미적 감상 문항의 작성 분량이 부족합니다. Q1~Q3를 채워 보세요.'
      }
    ];
    const highCount = [gradeStage1, gradeStage2, gradeStage3].filter((g) => g === '상').length;
    const feedback = highCount >= 2
      ? '전반적으로 단계별 성취가 높습니다. 표현의 밀도를 유지하며 문장을 다듬어 보세요.'
      : highCount === 1
        ? '단계별 강점이 보입니다. 중/하 단계를 보강하면 감상문 완성도가 더 높아집니다.'
        : '각 단계의 입력을 조금 더 채우면 평가 신뢰도와 감상문 완성도가 크게 올라갑니다.';

    return { ungraded: false, items, feedback };
  }, [selectedKeywords, selectedColors, sensoryDesc, sensoryArtifacts, isHandel, handelLyricMeaning, handelOperaDiff, analyticalCharacters, analyticalStory, q1, q2, q3]);

  const onGenerateEssay = async () => {
    setIsGenerating(true);
    const text = await generateFinalEssay({
      student,
      selectedSong,
      selectedKeywords,
      selectedColors,
      sensoryDesc,
      sensoryArtifacts,
      analyticalCharacters,
      analyticalStory,
      handelLyricMeaning,
      handelOperaDiff,
      q1,
      q2,
      q3
    });
    setEssayText(text);
    setIsGenerating(false);
  };
  const stageGrades = useMemo(() => {
    if (evaluation.ungraded) {
      return {
        stage1: '미채점',
        stage2: '미채점',
        stage3: '미채점'
      };
    }
    const gradeByLabel = Object.fromEntries(evaluation.items.map((item) => [item.label, item.grade]));
    return {
      stage1: gradeByLabel['1단계 감각적 감상'] || '미채점',
      stage2: gradeByLabel['2단계 분석적 감상'] || '미채점',
      stage3: gradeByLabel['3단계 심미적 감상'] || '미채점'
    };
  }, [evaluation]);
  const gradeBadgeBaseStyle = {
    marginLeft: 8,
    padding: '2px 8px',
    borderRadius: 999,
    fontSize: 11
  };
  const getGradeBadgeStyle = (grade) => {
    if (grade === '상') {
      return {
        ...gradeBadgeBaseStyle,
        border: '1px solid rgba(34,197,94,0.55)',
        background: 'rgba(34,197,94,0.16)',
        color: '#86efac'
      };
    }
    if (grade === '중') {
      return {
        ...gradeBadgeBaseStyle,
        border: '1px solid rgba(251,191,36,0.55)',
        background: 'rgba(251,191,36,0.16)',
        color: '#fcd34d'
      };
    }
    if (grade === '하') {
      return {
        ...gradeBadgeBaseStyle,
        border: '1px solid rgba(248,113,113,0.55)',
        background: 'rgba(248,113,113,0.16)',
        color: '#fca5a5'
      };
    }
    return {
      ...gradeBadgeBaseStyle,
      border: '1px solid var(--border2)',
      background: 'var(--surface2)',
      color: 'var(--purple-light)'
    };
  };

  return (
    <div className="screen active"><div className="stage-header"><div className="s-eyebrow">완성 · 최종 감상문</div><div className="s-title">나의 {songTitle} 감상문</div></div>
      <div className="body voice-body">
        <div className="summary-card">
          <div className="summary-ey">✦ 나의 {songTitle} 감상문 · {songSubtitle}</div>
          <div className="summary-row"><div className="summary-key">학생</div><div className="summary-val">{studentLine || '—'}</div></div>
          <div className="summary-row"><div className="summary-key">악곡</div><div className="summary-val">{songLabel}</div></div>
          <div className="summary-div"></div>
          <div className="summary-ey">① 감각적 감상 <span style={getGradeBadgeStyle(stageGrades.stage1)}>등급 {stageGrades.stage1}</span></div>
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
            <div>
              <div className="small-note">Q1 내 답변</div>
              {isHandel ? (
                <div className="fb show info">{handelLyricMeaning || '없음'}</div>
              ) : isHaydn ? (
                <div className="chip-row">{analyticalCharacters.filter(Boolean).length ? analyticalCharacters.filter(Boolean).map((c) => <span key={c} className="review-chip">{c}</span>) : <span className="review-empty">없음</span>}</div>
              ) : isSchoenberg ? (
                <div className="chip-row">{analyticalCharacters.filter(Boolean).length ? analyticalCharacters.filter(Boolean).map((c) => <span key={c} className="review-chip">{c}</span>) : <span className="review-empty">없음</span>}</div>
              ) : isVivaldi ? (
                <div className="chip-row">{analyticalCharacters.filter(Boolean).length ? analyticalCharacters.filter(Boolean).map((c) => <span key={c} className="review-chip">{c}</span>) : <span className="review-empty">없음</span>}</div>
              ) : (
                <div className="chip-row">{analyticalCharacters.filter(Boolean).length ? analyticalCharacters.filter(Boolean).map((c) => <span key={c} className="review-chip">{c}</span>) : <span className="review-empty">없음</span>}</div>
              )}
            </div>
            <div>
              <div className="small-note">Q1 정답 <span style={getGradeBadgeStyle(stageGrades.stage2)}>등급 {stageGrades.stage2}</span></div>
              {isHandel ? (
                <div className="fb show gold">{handelAnswerQ1}</div>
              ) : isHaydn ? (
                <div className="chip-row">{haydnAnswerQ1.map((c) => <span key={c} className="review-chip answer">{c}</span>)}</div>
              ) : isSchoenberg ? (
                <div className="chip-row">{schoenbergAnswerQ1.map((c) => <span key={c} className="review-chip answer">{c}</span>)}</div>
              ) : isVivaldi ? (
                <div className="chip-row">{vivaldiAnswerQ1.map((c) => <span key={c} className="review-chip answer">{c}</span>)}</div>
              ) : (
                <div className="chip-row">{analyticalAnswerCharacters.map((c) => <span key={c} className="review-chip answer">{c}</span>)}</div>
              )}
            </div>
          </div>
          <div className="cmp-mini-grid">
            <div><div className="small-note">Q2 내 답변</div><div className="fb show info">{isHandel ? (handelOperaDiff || '없음') : (analyticalStory || '없음')}</div></div>
            <div><div className="small-note">Q2 정답</div><div className="fb show gold">{isHandel ? handelAnswerQ2 : (isHaydn ? haydnAnswerQ2 : (isSchoenberg ? schoenbergAnswerQ2 : (isVivaldi ? vivaldiAnswerQ2 : analyticalAnswerStory)))}</div></div>
          </div>

          <div className="summary-div"></div>
          <div className="summary-ey">③ 심미적 감상 <span style={getGradeBadgeStyle(stageGrades.stage3)}>등급 {stageGrades.stage3}</span></div>
          <div className="summary-row"><div className="summary-key">변화</div><div className="summary-val">{q1 ? `분석해 보니 ${q1}라고 느꼈다.` : '—'}</div></div>
          <div className="summary-row"><div className="summary-key">이유</div><div className="summary-val">{q2 || '—'}</div></div>
          <div className="summary-row"><div className="summary-key">삶 연결</div><div className="summary-val">{q3 || '—'}</div></div>
          <div className="fb show gold" style={{ marginTop: 10 }}>
            💬 {evaluation.feedback}
          </div>
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
