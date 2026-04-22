import { useAppStore } from '../../store/useAppStore';

const SONG_CONFIG = {
  mawang: {
    videoUrl: 'https://www.youtube.com/embed/BXeE7rIAiTM',
    videoTitle: "슈베르트의 '마왕'을 감상해보세요",
    firstPage: 'sensoryPage',
    subtabs: [],
    cardAnalysis: '음색 대비, 인물별 선율과 리듬, 이야기 전개',
    cardSongTitle: "✦ 나의 마왕 감상문 · Erlkonig, Schubert 1815"
  },
  handel: {
    videoUrl: 'https://www.youtube.com/embed/XBSBBXFmHSE',
    videoTitle: "헨델의 '할렐루야'를 감상해보세요",
    firstPage: 'sensoryPage',
    subtabs: [],
    cardAnalysis: '합창의 화성, 반복되는 할렐루야 동기, 장엄한 종교적 분위기',
    cardSongTitle: "✦ 나의 할렐루야 감상문 · Messiah, Handel 1741"
  },
  haydn: {
    videoUrl: 'https://www.youtube.com/embed/kqnjVNKhWnc',
    videoTitle: "하이든 '종달새' 1악장을 감상해보세요",
    firstPage: 'hy-overview',
    subtabs: [
      { id: 'hy-overview', label: '개요 파악', page: 'hy-overview' },
      { id: 'hy-timbre', label: '현악 4중주', page: 'hy-timbre' },
      { id: 'hy-theme', label: '주제 비교', page: 'hy-theme' },
      { id: 'hy-history', label: '역사 맥락', page: 'hy-history' }
    ],
    cardAnalysis: '현악 4중주 음색, 두 주제 가락·리듬꼴·음계 비교, 소나타 형식',
    cardSongTitle: '✦ 나의 종달새 감상문 · String Quartet No.67, Haydn 1790'
  },
  schoenberg: {
    videoUrl: 'https://www.youtube.com/embed/-FUySRVF75k',
    videoTitle: "쇤베르크 '달에 취하여'를 감상해보세요",
    firstPage: 'sb-overview',
    subtabs: [
      { id: 'sb-overview', label: '개요 파악', page: 'sb-overview' },
      { id: 'sb-sprech', label: '슈프레흐슈팀메', page: 'sb-sprech' },
      { id: 'sb-atonal', label: '무조성', page: 'sb-atonal' },
      { id: 'sb-history', label: '역사 맥락', page: 'sb-history' }
    ],
    cardAnalysis: '슈프레흐슈팀메, 무조성, 표현주의 예술과의 연결',
    cardSongTitle: "✦ 나의 달에 취하여 감상문 · Mondestrunken, Schoenberg 1912"
  },
  vivaldi: {
    videoUrl: 'https://www.youtube.com/embed/wVAq3CzHf9E',
    videoTitle: "비발디 '사계' 중 여름 3악장을 감상해보세요",
    firstPage: 'vv-overview',
    subtabs: [
      { id: 'vv-overview', label: '개요 파악', page: 'vv-overview' },
      { id: 'vv-sonnet', label: '소네트', page: 'vv-sonnet' },
      { id: 'vv-concerto', label: '바이올린 협주곡', page: 'vv-concerto' },
      { id: 'vv-history', label: '역사 맥락', page: 'vv-history' }
    ],
    cardAnalysis: '소네트와 음악 연결, 바이올린 협주곡 독주·총주 구분',
    cardSongTitle: "✦ 나의 여름 감상문 · Summer Op.8 No.2, Vivaldi 1725"
  },
  chopin: {
    videoUrl: 'https://www.youtube.com/embed/dHwhfpN--Bk',
    videoTitle: "쇼팽 '환상 즉흥곡'을 감상해보세요",
    firstPage: 'cp-overview',
    subtabs: [
      { id: 'cp-overview', label: '개요 파악', page: 'cp-overview' },
      { id: 'cp-form', label: 'ABA 형식', page: 'cp-form' },
      { id: 'cp-rhythm', label: '폴리리듬', page: 'cp-rhythm' },
      { id: 'cp-history', label: '역사 맥락', page: 'cp-history' }
    ],
    cardAnalysis: 'ABA 형식 구간 분류, 폴리리듬(오른손 4박·왼손 3박)',
    cardSongTitle: '✦ 나의 환상 즉흥곡 감상문 · Fantasie Impromptu Op.66, Chopin 1835'
  }
};

function VideoPage({ go }) {
  const setStageCompletion = useAppStore((s) => s.setStageCompletion);
  const selectedSong = useAppStore((s) => s.selectedSong);
  const isChopin = selectedSong === 'chopin';
  const selectedConfig = SONG_CONFIG[selectedSong] || SONG_CONFIG.mawang;
  const isErlkonig = selectedSong !== 'handel' && selectedSong !== 'hallelujah' && selectedSong !== 'haydn';
  const lyricsErlkonig = `[🎙️해설자] 누가 늦은 밤 말을 달려 그들은 아버지와 아들 / 아버지 아이를 품에 안고, 안고 달리네, 따뜻하게.
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
  const lyricsHallelujah = `할렐루야!
전능의 주가 다스리신다, 할렐루야!

이 세상 나라들 영원히 주 그리스도의 다스리는 나라가 되고, 또 주가 길이 다스리시리, 영원히.

왕의 왕, 또 주의 주, (영원히), 할렐루야.
또 주의 주 다스리리. (또 주가 다스리리.)
또 주가 길이 다스리시리. (영원히)

할렐루야!`;
  const lyricsSchoenberg = `Den Wein, den man mit Augen trinkt,
눈으로 마시는 포도주를
Gießt Nachts der Mond in Wogen nieder,
달이 밤마다 물결처럼 쏟아붓고
Und eine Springflut überschwemmt
홍수가 범람하여
Den stillen Horizont.
고요한 지평선을 뒤덮는다.

Gelüste, schauerlich und süß,
오싹하고도 달콤한 욕망들이
Schwimmt ohne Zahl im Fluten nieder!
셀 수 없이 물결 속으로 흘러내린다!
Den Wein, den man mit Augen trinkt,
눈으로 마시는 포도주를
Gießt Nachts der Mond in Wogen nieder.
달이 밤마다 물결처럼 쏟아붓는다.

Der Dichter, den die Andacht treibt,
경건한 마음에 이끌리는 시인은
Berauscht sich an dem heilgen Tranke,
신성한 음료에 취해,
Gen Himmel wendet er verzückt
황홀경에 빠져 하늘을 향해
Das Haupt und taumelnd saugt und schlürft er
고개를 든 채 비틀거리며 빨아들이고 들이켠다
Den Wein, den man mit Augen trinkt.
눈으로 마시는 포도주를.`;
  const sonnetVivaldi = '아, 그의 두려움은 그럴 만하구나. 하늘은 천둥을 울리고 우박을 내려 익은 곡식을 모두 쓸어버리네.';
  const haydnGuide = `1) 시작 주제: 가장 먼저 들리는 선율이 어떤 악기인지 짐작해보세요.
2) 음색 구분: 제1바이올린·제2바이올린·비올라·첼로의 역할 차이를 들어보세요.
3) 분위기 변화: 밝고 가벼운 느낌에서 서정적인 느낌으로 바뀌는 지점을 찾아보세요.
4) 전체 감상: "종달새"라는 제목과 연결되는 이유를 선율의 움직임으로 설명해보세요.`;
  const chopinGuide = `1) 시작(빠른 구간): 오른손 선율과 왼손 반주의 속도 차이를 먼저 들어보세요.
2) 중간(느린 구간): 분위기가 어떻게 부드럽게 바뀌는지 단어로 적어보세요.
3) 다시 빠른 구간: 처음과 비슷하지만 무엇이 달라졌는지 비교해보세요.
4) 전체 감상: "격렬함 ↔ 서정성"의 대비가 언제 가장 크게 느껴지는지 찾아보세요.`;
  const pageTitle = selectedConfig.videoTitle;
  const iframeSrc = selectedConfig.videoUrl;
  const lyrics = selectedSong === 'haydn'
    ? ''
    : selectedSong === 'vivaldi'
      ? sonnetVivaldi
    : selectedSong === 'schoenberg'
      ? lyricsSchoenberg
      : (isErlkonig ? lyricsErlkonig : lyricsHallelujah);

  return (
    <div className="screen active">
      <div className="stage-header"><div className="s-eyebrow">감상하기</div><div className="s-title">{pageTitle}</div><div className="s-desc">영상을 끝까지 감상한 후 다음 단계로 이동하세요.</div></div>
      <div className="body video-page-body">
        <div className="video-lyrics-layout">
          <div className="video-wrap" style={{ marginBottom: 0 }}>
            <iframe src={iframeSrc} allowFullScreen />
          </div>
          <div className="lyrics-panel">
            <div style={{ fontSize: 11, letterSpacing: '.15em', color: 'var(--purple-light)', marginBottom: 10 }}>
              {(selectedSong === 'chopin' || selectedSong === 'haydn') ? '감상 가이드' : (selectedSong === 'vivaldi' ? '소네트' : '가사')}
            </div>
            <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'Noto Sans KR, sans-serif', fontSize: 12, lineHeight: 1.8, color: 'var(--text-dim)' }}>
              {selectedSong === 'chopin'
                ? chopinGuide
                : (selectedSong === 'haydn' ? haydnGuide : lyrics)}
            </pre>
          </div>
        </div>
        <div className="fb show info">🎵 영상을 감상하며 음악이 주는 느낌을 자유롭게 느껴보세요.</div>
        <div className="btn-row"><button className="btn-s" onClick={() => go('songSelect')}>← 이전</button><button className="btn-p" onClick={() => { setStageCompletion('video', true); go('sensoryPage'); }}>감상 완료, 다음 →</button></div>
      </div>
    </div>
  );
}

export default VideoPage;
