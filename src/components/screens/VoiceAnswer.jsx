function VoiceAnswer({ go }) {
  return (
    <div className="screen active">
      <div className="stage-header">
        <div className="s-eyebrow">STAGE 2-B · 음색 정답 비교</div>
        <div className="s-title">나의 설계 vs 슈베르트의 설계</div>
      </div>
      <div className="body voice-body">
        <table className="cmp-table">
          <thead>
            <tr>
              <th>요소</th>
              <th>나의 설계</th>
              <th>슈베르트의 설계</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="row-label">선율</td><td>—</td><td>장면을 담담히 전하는 선율</td><td className="tag-ok">✓</td></tr>
            <tr><td className="row-label">음계</td><td>—</td><td>단조</td><td className="tag-ok">✓</td></tr>
            <tr><td className="row-label">음색</td><td>—</td><td>두꺼움</td><td className="tag-ok">✓</td></tr>
          </tbody>
        </table>

        <div className="fb show info">💬 해설자는 담담한 선율로 이야기를 전달해요. 단조의 어두운 음계로 처음부터 긴장감을 설정합니다.</div>

        <div className="feat-card">
          <div className="feat-num">예술가곡의 첫 번째 특징</div>
          <div className="feat-title">시와 음악이 하나가 된다</div>
          <div className="feat-body">괴테의 시 속 각 인물의 성격과 감정이 선율, 음색, 음계로 그대로 표현됩니다. 시의 내용을 음악이 직접 표현하는 것이 예술가곡의 핵심이에요.</div>
        </div>

        <div className="btn-row">
          <button className="btn-s" onClick={() => go('voiceDesign')}>← 이전</button>
          <button className="btn-p" onClick={() => go('pianoAnalysis')}>다음 →</button>
        </div>
      </div>
    </div>
  );
}

export default VoiceAnswer;
