import { useAppStore } from '../../store/useAppStore';

function VideoPage({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const lyrics = `[🎙️해설자] 누가 늦은 밤 말을 달려 그들은 아버지와 아들 / 아버지 아이를 품에 안고, 안고 달리네, 따뜻하게.
[👨아버지] 아들아, 무엇 때문에 떠느냐?
[👦아들] 아빠, 마왕이 안 보여요? 검은 옷에다 관을 썼는데.
[👨아버지] 아들아, 그것은 안개다.
[👑마왕] 예쁜 아가, 이리 오렴. 함께 재밌게 놀자꾸나. / 예쁜 꽃이 피어있단다. 너에게 줄 예쁜 황금빛 옷
[👦아들] 아버지, 아버지, 들리잖아요. 저 마왕이 속삭이는 소리.
[👨아버지] 진정해, 진정해, 아가. 낙엽이 날리는 소리다.
[👑마왕] 예쁜 아가, 나랑 가볼래? 예쁜 내 딸이 너를 기다려. / 너와 함께 밤 강가로 갈 거야. 함께 춤추며 노래 부를 거야. x2
[👦아들] 아버지, 아버지, 보이잖아요, 마왕의 딸 서 있는 것이.
[👨아버지] 아가, 아가, 내 보고 있어. 그것은 오래된 나무란다.
[👑마왕] 니가 좋아, 이 끌리는 예쁜 모습. 니가 싫어해도 데려가야지.
[👦아들] 아버지, 아버지, 나를 덮쳐요. 마왕이 나를 끌고 가요.
[🎙️해설자] 아버지 급히 마을 달려가 그의 품 안에 신음하는 아기 / 그가 집에 다 왔을 때, 품 속의 아기는 죽었네.`;

  return (
    <div className="screen active">
      <div className="stage-header"><div className="s-eyebrow">감상하기</div><div className="s-title">슈베르트의 '마왕'을 감상해보세요</div><div className="s-desc">영상을 끝까지 감상한 후 다음 단계로 이동하세요.</div></div>
      <div className="body video-page-body">
        <div className="video-lyrics-layout">
          <div className="video-wrap" style={{ marginBottom: 0 }}>
            <iframe src="https://www.youtube.com/embed/BXeE7rIAiTM" allowFullScreen />
          </div>
          <div className="lyrics-panel">
            <div style={{ fontSize: 11, letterSpacing: '.15em', color: 'var(--purple-light)', marginBottom: 10 }}>가사</div>
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'Noto Sans KR, sans-serif', fontSize: 12, lineHeight: 1.8, color: 'var(--text-dim)' }}>
              {lyrics}
            </pre>
          </div>
        </div>
        <div className="fb show info">🎵 영상을 감상하며 음악이 주는 느낌을 자유롭게 느껴보세요.</div>
        <div className="btn-row"><button className="btn-s" onClick={() => go('studentInfo')}>← 이전</button><button className="btn-p" onClick={() => { setStageCompletion('video', true); go('sensoryPage'); }}>감상 완료, 다음 →</button></div>
      </div>
    </div>
  );
}

export default VideoPage;
