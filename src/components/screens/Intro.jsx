import { useEffect, useState } from 'react';

function Intro({ go }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const cols = ['#8b5cf6', '#c0392b', '#b8963e', '#a78bfa'];
    setParticles(
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        size: 2 + Math.random() * 4,
        left: Math.random() * 100,
        duration: 6 + Math.random() * 8,
        delay: Math.random() * 6,
        color: cols[Math.floor(Math.random() * cols.length)]
      }))
    );
  }, []);

  return (
    <div className="screen active" id="intro">
      <div className="intro-particles">
        {particles.map((p) => (
          <div
            key={p.id}
            className="particle"
            style={{ width: p.size, height: p.size, left: `${p.left}%`, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`, background: p.color }}
          />
        ))}
      </div>
      <div className="intro-badge">MUSIK · APPRECIATION · LEARNING</div>
      <div className="intro-de">Der Erlkönig</div>
      <div className="intro-title">음악 감상 학습</div>
      <div className="intro-composer">Music Appreciation Learning System</div>
      <div className="intro-stages">
        <div className="intro-stage">① 감각적 감상</div><div className="intro-stage">② 분석적 감상</div><div className="intro-stage">③ 심미적 감상</div>
      </div>
      <button className="btn-enter" onClick={() => go('studentInfo')}>학습 시작하기</button>
    </div>
  );
}

export default Intro;
