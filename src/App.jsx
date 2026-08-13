import { useEffect, useMemo, useState } from 'react';
import { screenOrder, stepNames } from './store/useAppStore';
import Intro from './components/screens/Intro';
import ProgramGuide from './components/screens/ProgramGuide';
import StudentInfo from './components/screens/StudentInfo';
import SongSelect from './components/screens/SongSelect';
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
import HyTheme from './components/screens/HyTheme';
import HistoryCardsHaydn from './components/screens/HistoryCardsHaydn';
import SbOverview from './components/screens/SbOverview';
import SbSprech from './components/screens/SbSprech';
import SbAtonal from './components/screens/SbAtonal';
import SbHistory from './components/screens/SbHistory';
import VvOverview from './components/screens/VvOverview';
import VvSonnet from './components/screens/VvSonnet';
import VvConcerto from './components/screens/VvConcerto';
import VvHistory from './components/screens/VvHistory';
import CpOverview from './components/screens/CpOverview';
import CpForm from './components/screens/CpForm';
import CpRhythm from './components/screens/CpRhythm';
import CpHistory from './components/screens/CpHistory';
import AestheticPage from './components/screens/AestheticPage';
import FinalCard from './components/screens/FinalCard';
import BottomWidgetBar from './components/BottomWidgetBar';
import HelpButton from './components/HelpButton';
import ListeningPanel from './components/ListeningPanel';
import { useAppStore } from './store/useAppStore';

const screens = {
  intro: Intro,
  programGuide: ProgramGuide,
  studentInfo: StudentInfo,
  songSelect: SongSelect,
  sensoryPage: SensoryPage,
  analyticalOverview: AnalyticalOverview,
  voiceDesign: VoiceDesign,
  pianoAnalysis: PianoAnalysis,
  historyCards: HistoryCards,
  aestheticPage: AestheticPage,
  finalCard: FinalCard
};

const STAGE_SCREENS = [
  'sensoryPage',
  'analyticalOverview',
  'voiceDesign',
  'pianoAnalysis',
  'historyCards',
  'aestheticPage'
];

function App() {
  const [currentScreen, setCurrentScreen] = useState('intro');
  const selectedSong = useAppStore((s) => s.selectedSong);
  const [raindrops, setRaindrops] = useState([]);
  const [listeningCollapsed, setListeningCollapsed] = useState(false);

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

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const apply = () => setListeningCollapsed(mq.matches);
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, [selectedSong]);

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
      if (currentScreen === 'pianoAnalysis') return HyTheme;
      if (currentScreen === 'historyCards') return HistoryCardsHaydn;
    }
    if (selectedSong === 'schoenberg') {
      if (currentScreen === 'analyticalOverview') return SbOverview;
      if (currentScreen === 'voiceDesign') return SbSprech;
      if (currentScreen === 'pianoAnalysis') return SbAtonal;
      if (currentScreen === 'historyCards') return SbHistory;
    }
    if (selectedSong === 'vivaldi') {
      if (currentScreen === 'analyticalOverview') return VvOverview;
      if (currentScreen === 'voiceDesign') return VvSonnet;
      if (currentScreen === 'pianoAnalysis') return VvConcerto;
      if (currentScreen === 'historyCards') return VvHistory;
    }
    if (selectedSong === 'chopin') {
      if (currentScreen === 'analyticalOverview') return CpOverview;
      if (currentScreen === 'voiceDesign') return CpForm;
      if (currentScreen === 'pianoAnalysis') return CpRhythm;
      if (currentScreen === 'historyCards') return CpHistory;
    }
    return screens[currentScreen];
  }, [currentScreen, selectedSong]);

  const helpStep = useMemo(() => {
    if (currentScreen === 'intro' || currentScreen === 'programGuide') return 'intro';
    if (currentScreen === 'sensoryPage') return 'step1';
    if (['analyticalOverview', 'voiceDesign', 'pianoAnalysis'].includes(currentScreen)) return 'step2';
    if (['historyCards', 'aestheticPage'].includes(currentScreen)) return 'step3';
    if (currentScreen === 'finalCard') return 'final';
    return 'intro';
  }, [currentScreen]);

  const showListeningShell = STAGE_SCREENS.includes(currentScreen) && Boolean(selectedSong);

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

      {showListeningShell ? (
        <div className={`stage-workspace ${listeningCollapsed ? 'listening-collapsed' : ''}`}>
          <ListeningPanel
            collapsed={listeningCollapsed}
            onToggle={() => setListeningCollapsed((v) => !v)}
          />
          <div className="stage-workspace-main">
            <Current go={setCurrentScreen} />
          </div>
        </div>
      ) : (
        <Current go={setCurrentScreen} />
      )}

      <HelpButton currentStep={helpStep} />
      <BottomWidgetBar currentScreen={currentScreen} go={setCurrentScreen} />
    </>
  );
}

export default App;
