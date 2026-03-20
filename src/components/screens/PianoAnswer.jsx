function PianoAnswer({ go }) {
  return (
    <div className="screen active">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2-C · 정답 비교</div>
        <div className="s-title">모범 가락선과 비교해보세요</div>
      </div>
      <div className="body voice-body">
        <div className="sec">오른손 가락선 비교</div>
        <div className="cv-compare">
          <div className="cv-box">
            <div className="cv-label">내가 그린 선</div>
            <div className="cv-panel"><canvas width="520" height="190" /></div>
          </div>
          <div className="cv-box">
            <div className="cv-label">모범 악보</div>
            <div className="cv-panel score-panel">
              <img src="/assets/rh-score.png" alt="오른손 모범 악보" className="score-image" />
              <a href="/assets/rh-score.png" target="_blank" rel="noreferrer" className="score-link">원본 보기</a>
            </div>
          </div>
        </div>
        <div className="fb show info">오른손: 빠르고 불규칙하게 오르내리는 셋잇단음표 -&gt; 말발굽 소리를 묘사해요</div>

        <div className="sec">왼손 가락선 비교</div>
        <div className="cv-compare">
          <div className="cv-box">
            <div className="cv-label">내가 그린 선</div>
            <div className="cv-panel"><canvas width="520" height="190" /></div>
          </div>
          <div className="cv-box">
            <div className="cv-label">모범 악보</div>
            <div className="cv-panel score-panel">
              <img src="/assets/lh-score.png" alt="왼손 모범 악보" className="score-image" />
              <a href="/assets/lh-score.png" target="_blank" rel="noreferrer" className="score-link">원본 보기</a>
            </div>
          </div>
        </div>
        <div className="fb show info">왼손: 느리고 강하게 반복되는 베이스 -&gt; 심장이 두근거리는 긴박감을 표현해요</div>

        <div className="feat-card">
          <div className="feat-num">예술가곡의 두 번째 특징</div>
          <div className="feat-title">피아노는 성악과 동등한 역할을 한다</div>
          <div className="feat-body">피아노 반주는 단순히 성악을 받쳐주는 게 아니에요. 말이 달리는 장면, 심장이 두근거리는 긴박함을 직접 묘사하며 시의 내용을 음악으로 표현합니다.</div>
        </div>

        <div className="btn-row"><button className="btn-s" onClick={() => go('pianoAnalysis')}>← 이전</button><button className="btn-p" onClick={() => go('historyCards')}>다음 →</button></div>
      </div>
    </div>
  );
}

export default PianoAnswer;
