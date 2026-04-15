import { useEffect, useMemo, useState } from 'react';
import { screenOrder, stepNames } from './store/useAppStore';
import Intro from './components/screens/Intro';
import StudentInfo from './components/screens/StudentInfo';
import SongSelect from './components/screens/SongSelect';
import VideoPage from './components/screens/VideoPage';
import SensoryPage from './components/screens/SensoryPage';
import AnalyticalOverview from './components/screens/AnalyticalOverview';
import VoiceDesign from './components/screens/VoiceDesign';
import PianoAnalysis from './components/screens/PianoAnalysis';
import HistoryCards from './components/screens/HistoryCards';
import AnalyticalOverviewHandel from './components/screens/AnalyticalOverviewHandel';
import TonePaintingHandel from './components/screens/TonePaintingHandel';
import MelodyCanvasHandel from './components/screens/MelodyCanvasHandel';
import HistoryCardsHandel from './components/screens/HistoryCardsHandel';
import HyTimbre from './components/screens/HyTimbre';
import AestheticPage from './components/screens/AestheticPage';
import FinalCard from './components/screens/FinalCard';
import BottomWidgetBar from './components/BottomWidgetBar';
import { useAppStore } from './store/useAppStore';

const screens = {
  intro: Intro,
  studentInfo: StudentInfo,
  songSelect: SongSelect,
  videoPage: VideoPage,
  sensoryPage: SensoryPage,
  analyticalOverview: AnalyticalOverview,
  voiceDesign: VoiceDesign,
  pianoAnalysis: PianoAnalysis,
  historyCards: HistoryCards,
  aestheticPage: AestheticPage,
  finalCard: FinalCard
};

function App() {
  const [currentScreen, setCurrentScreen] = useState('intro');
  const selectedSong = useAppStore((s) => s.selectedSong);
  const [raindrops, setRaindrops] = useState([]);

  useEffect(() => {
    setRaindrops(
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        height: 40 + Math.random() * 80,
        duration: 1.5 + Math.random() * 2,
        delay: Math.random() * 3,
        opacity: 0.3 + Math.random() * 0.4
      }))
    );
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentScreen]);

  const idx = useMemo(() => screenOrder.indexOf(currentScreen), [currentScreen]);
  const progress = (idx / (screenOrder.length - 1)) * 100;
  const Current = useMemo(() => {
    if (selectedSong === 'handel') {
      if (currentScreen === 'analyticalOverview') return AnalyticalOverviewHandel;
      if (currentScreen === 'voiceDesign') return TonePaintingHandel;
      if (currentScreen === 'pianoAnalysis') return MelodyCanvasHandel;
      if (currentScreen === 'historyCards') return HistoryCardsHandel;
    }
    if (selectedSong === 'haydn') {
      if (currentScreen === 'voiceDesign') return HyTimbre;
    }
    return screens[currentScreen];
  }, [currentScreen, selectedSong]);

  return (
    <>
      <div className="rain">
        {raindrops.map((d) => (
          <div
            key={d.id}
            className="raindrop"
            style={{
              left: `${d.left}%`,
              height: `${d.height}px`,
              animationDuration: `${d.duration}s`,
              animationDelay: `${d.delay}s`,
              opacity: d.opacity
            }}
          />
        ))}
      </div>

      <div id="prog-wrap"><div id="prog-fill" style={{ width: `${progress}%` }} /></div>
      <div id="step-nav">
        <div id="step-label" className={stepNames[currentScreen] ? 'on' : ''}>{stepNames[currentScreen] || ''}</div>
        <div id="step-dots">
          {screenOrder.slice(1).map((_, i) => (
            <div
              key={i}
              className={`step-dot ${i < idx - 1 ? 'done' : ''} ${i === idx - 1 ? 'active' : ''}`.trim()}
            />
          ))}
        </div>
      </div>

      <Current go={setCurrentScreen} />

      <BottomWidgetBar currentScreen={currentScreen} go={setCurrentScreen} />
    </>
  );
}

export default App;
