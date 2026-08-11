import { useAppStore } from '../store/useAppStore';
import { getSongListeningContent } from '../lib/songConfig';

function ListeningPanel({ collapsed, onToggle }) {
  const selectedSong = useAppStore((s) => s.selectedSong);
  const content = getSongListeningContent(selectedSong);

  return (
    <aside className={`listening-panel ${collapsed ? 'is-collapsed' : ''}`} aria-label="음악 감상">
      <button
        type="button"
        className="listening-panel-toggle"
        onClick={onToggle}
        aria-expanded={!collapsed}
      >
        <span className="listening-panel-toggle-title">
          {collapsed ? '음악 감상 펼치기' : '음악 감상'}
        </span>
        <span className="listening-panel-toggle-chevron" aria-hidden="true">
          {collapsed ? '▼' : '▲'}
        </span>
      </button>

      <div className="listening-panel-body">
        <div className="listening-panel-title">{content.videoTitle}</div>
        <div className="video-wrap listening-video">
          <iframe
            src={content.videoUrl}
            title={content.videoTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="lyrics-panel listening-lyrics">
          <div className="listening-lyrics-label">{content.panelLabel}</div>
          <pre className="listening-lyrics-pre">{content.lyricsText}</pre>
        </div>
      </div>
    </aside>
  );
}

export default ListeningPanel;
