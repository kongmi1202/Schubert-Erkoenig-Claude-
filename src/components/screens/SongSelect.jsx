import { useAppStore } from '../../store/useAppStore';

const SONGS = [
  {
    id: 'mawang',
    icon: '🎭',
    title: '마왕',
    composer: 'SCHUBERT · 1815',
    tags: ['낭만주의', '예술가곡', '4명의 등장인물']
  },
  {
    id: 'handel',
    icon: '🎵',
    title: '할렐루야',
    composer: 'HANDEL · 1741',
    tags: ['바로크', '오라토리오', '화성·다성음악']
  },
  {
    id: 'haydn',
    icon: '🎻',
    title: '종달새',
    composer: 'HAYDN · 1790',
    tags: ['고전주의', '현악 4중주', '소나타 형식']
  },
  {
    id: 'schoenberg',
    icon: '🌙',
    title: '달에 홀린 피에로',
    composer: 'SCHOENBERG · 1912',
    tags: ['표현주의', '무조성', '슈프레흐슈팀메']
  }
];

function SongSelect({ go }) {
  const selectedSong = useAppStore((s) => s.selectedSong);
  const setSelectedSong = useAppStore((s) => s.setSelectedSong);

  const onSelect = (songId) => {
    setSelectedSong(songId);
    go('videoPage');
  };

  return (
    <div className="screen active">
      <div className="stage-header">
        <div className="s-eyebrow">악곡 선택</div>
        <div className="s-title">감상할 곡을 선택하세요</div>
        <div className="s-desc">선택한 곡에 맞는 감상 활동이 제공됩니다.</div>
      </div>
      <div className="body">
        <div className="song-select-grid">
          {SONGS.map((song) => (
            <button
              key={song.id}
              type="button"
              className={`song-select-card ${selectedSong === song.id ? 'active' : ''}`}
              onClick={() => onSelect(song.id)}
            >
              <div className="song-select-icon">{song.icon}</div>
              <div className="song-select-title">{song.title}</div>
              <div className="song-select-composer">{song.composer}</div>
              <div className="song-select-tags">
                {song.tags.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
        <div className="btn-row">
          <button className="btn-s" onClick={() => go('studentInfo')}>← 이전</button>
        </div>
      </div>
    </div>
  );
}

export default SongSelect;
