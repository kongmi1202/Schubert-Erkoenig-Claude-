/**
 * 예술가곡 핵심 정리 패널 — 금테·다크 배경·3단 계층 타이포 (음색·가락선 활동 하단용)
 */
export default function ArtSongTakeaway({ eyebrow, title, description }) {
  return (
    <section className="art-song-takeaway" aria-labelledby="art-song-takeaway-heading">
      <div className="art-song-takeaway-inner">
        <div className="art-song-takeaway-copy">
          <p className="art-song-takeaway-eyebrow">{eyebrow}</p>
          <h3 id="art-song-takeaway-heading" className="art-song-takeaway-title">
            {title}
          </h3>
          <p className="art-song-takeaway-body">{description}</p>
        </div>
        <div className="art-song-takeaway-deco" aria-hidden>
          <span className="art-song-takeaway-star">✦</span>
        </div>
      </div>
    </section>
  );
}
