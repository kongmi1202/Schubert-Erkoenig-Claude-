import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';

const stage2SubSteps = [
  { screen: 'analyticalOverview', label: '개요 파악' },
  { screen: 'voiceDesign', label: '음색' },
  { screen: 'pianoAnalysis', label: '피아노 반주' },
  { screen: 'historyCards', label: '역사 맥락' }
];

const bottomItems = [
  { id: 'videoPage', label: '감상', icon: '🎵', screen: 'videoPage' },
  { id: 'sensoryPage', label: '1단계', icon: '🎨', screen: 'sensoryPage' },
  { id: 'stage2', label: '2단계', icon: '🔎', screen: null },
  { id: 'aestheticPage', label: '3단계', icon: '🔥', screen: 'aestheticPage' },
  { id: 'finalCard', label: '최종', icon: '📄', screen: 'finalCard' }
];

function BottomWidgetBar({ currentScreen, go }) {
  const selectedSong = useAppStore((s) => s.selectedSong);
  const stage2Steps = useMemo(() => (
    selectedSong === 'handel'
      ? [
          { screen: 'analyticalOverview', label: '개요 파악' },
          { screen: 'voiceDesign', label: '음화법' },
          { screen: 'pianoAnalysis', label: '화성·다성음악' },
          { screen: 'historyCards', label: '역사 맥락' }
        ]
      : selectedSong === 'haydn'
        ? [
            { screen: 'analyticalOverview', label: '개요 파악' },
            { screen: 'voiceDesign', label: '현악 4중주' },
            { screen: 'pianoAnalysis', label: '주제 비교' },
            { screen: 'historyCards', label: '역사 맥락' }
          ]
      : selectedSong === 'schoenberg'
        ? [
            { screen: 'analyticalOverview', label: '개요 파악' },
            { screen: 'voiceDesign', label: '슈프레흐슈팀메' },
            { screen: 'pianoAnalysis', label: '무조성' },
            { screen: 'historyCards', label: '역사 맥락' }
          ]
      : selectedSong === 'vivaldi'
        ? [
            { screen: 'analyticalOverview', label: '개요 파악' },
            { screen: 'voiceDesign', label: '표제 음악' },
            { screen: 'pianoAnalysis', label: '협주곡' },
            { screen: 'historyCards', label: '역사 맥락' }
          ]
      : selectedSong === 'chopin'
        ? [
            { screen: 'analyticalOverview', label: '개요 파악' },
            { screen: 'voiceDesign', label: '형식' },
            { screen: 'pianoAnalysis', label: '리듬' },
            { screen: 'historyCards', label: '역사 맥락' }
          ]
      : stage2SubSteps
  ), [selectedSong]);
  const stage2Screens = useMemo(() => stage2Steps.map((s) => s.screen), [stage2Steps]);
  const stageCompletion = useAppStore((s) => s.stageCompletion);

  const shouldShow = useMemo(
    () => ['videoPage', 'sensoryPage', 'analyticalOverview', 'voiceDesign', 'pianoAnalysis', 'historyCards', 'aestheticPage', 'finalCard'].includes(currentScreen),
    [currentScreen]
  );

  const isInStage2 = stage2Screens.includes(currentScreen);
  const activeTopId = useMemo(() => {
    if (currentScreen === 'videoPage') return 'videoPage';
    if (currentScreen === 'sensoryPage') return 'sensoryPage';
    if (currentScreen === 'aestheticPage') return 'aestheticPage';
    if (currentScreen === 'finalCard') return 'finalCard';
    if (isInStage2) return 'stage2';
    return null;
  }, [currentScreen, isInStage2]);

  const onTopClick = (item) => {
    if (item.id === 'stage2') {
      if (!isInStage2) go(stage2SubSteps[0].screen);
      return;
    }
    if (item.screen) go(item.screen);
  };

  if (!shouldShow) return null;
  const topDone = {
    videoPage: stageCompletion.video,
    sensoryPage: stageCompletion.sensory,
    stage2: stageCompletion.analytical && stageCompletion.voice && stageCompletion.piano && stageCompletion.history,
    aestheticPage: stageCompletion.aesthetic,
    finalCard: false
  };

  return (
    <>
      {isInStage2 ? (
        <div id="stage2-subbar" aria-label="2단계 서브 위젯바">
          {stage2Steps.map((s) => (
            <button
              key={s.screen}
              type="button"
              className={`stage2-tab ${currentScreen === s.screen ? 'active' : ''}`}
              onClick={() => go(s.screen)}
            >
              <span className="stage2-tab-dot" aria-hidden="true">•</span>
              {s.label}
            </button>
          ))}
        </div>
      ) : null}

      <nav id="bottom-widgetbar" aria-label="하단 위젯바">
        {bottomItems.map((item) => {
          const isActive = item.id === activeTopId || (item.id === 'stage2' && isInStage2);
          const stageState = isActive ? 'current' : (topDone[item.id] ? 'done' : 'todo');
          const stateSymbol = stageState === 'done' ? '●' : (stageState === 'current' ? '◐' : '○');
          return (
            <button
              key={item.id}
              type="button"
              className={`bottom-widget-btn ${isActive ? 'active' : ''}`}
              onClick={() => onTopClick(item)}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="bottom-widget-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="bottom-widget-label">{item.label}</span>
              <span className={`bottom-widget-state ${stageState}`} aria-hidden="true">{stateSymbol}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

export default BottomWidgetBar;

