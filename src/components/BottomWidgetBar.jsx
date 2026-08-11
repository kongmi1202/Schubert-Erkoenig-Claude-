import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';

const stage2SubSteps = [
  { screen: 'analyticalOverview', label: '음악의 구성' },
  { screen: 'voiceDesign', label: '음악 요소 1' },
  { screen: 'pianoAnalysis', label: '음악 요소 2' }
];

const stage3SubSteps = [
  { screen: 'historyCards', label: '역사 맥락' },
  { screen: 'aestheticPage', label: '가치 판단' }
];

const bottomItems = [
  { id: 'sensoryPage', label: '1단계', icon: '🎨', screen: 'sensoryPage' },
  { id: 'stage2', label: '2단계', icon: '🔎', screen: null },
  { id: 'stage3', label: '3단계', icon: '🔥', screen: null },
  { id: 'finalCard', label: '최종', icon: '📄', screen: 'finalCard' }
];

function BottomWidgetBar({ currentScreen, go }) {
  const stage2Steps = stage2SubSteps;
  const stage2Screens = useMemo(() => stage2Steps.map((s) => s.screen), [stage2Steps]);
  const stage3Screens = useMemo(() => stage3SubSteps.map((s) => s.screen), []);
  const stageCompletion = useAppStore((s) => s.stageCompletion);

  const shouldShow = useMemo(
    () => ['sensoryPage', 'analyticalOverview', 'voiceDesign', 'pianoAnalysis', 'historyCards', 'aestheticPage', 'finalCard'].includes(currentScreen),
    [currentScreen]
  );

  const isInStage2 = stage2Screens.includes(currentScreen);
  const isInStage3 = stage3Screens.includes(currentScreen);
  const activeTopId = useMemo(() => {
    if (currentScreen === 'sensoryPage') return 'sensoryPage';
    if (currentScreen === 'finalCard') return 'finalCard';
    if (isInStage2) return 'stage2';
    if (isInStage3) return 'stage3';
    return null;
  }, [currentScreen, isInStage2, isInStage3]);

  const onTopClick = (item) => {
    if (item.id === 'stage2') {
      if (!isInStage2) go(stage2Steps[0].screen);
      return;
    }
    if (item.id === 'stage3') {
      if (!isInStage3) go(stage3SubSteps[0].screen);
      return;
    }
    if (item.screen) go(item.screen);
  };

  if (!shouldShow) return null;
  const topDone = {
    sensoryPage: stageCompletion.sensory,
    stage2: stageCompletion.analytical && stageCompletion.voice && stageCompletion.piano,
    stage3: stageCompletion.history && stageCompletion.aesthetic,
    finalCard: false
  };

  const subSteps = isInStage2 ? stage2Steps : (isInStage3 ? stage3SubSteps : null);

  return (
    <>
      {subSteps ? (
        <div id="stage2-subbar" aria-label={isInStage2 ? '2단계 서브 위젯바' : '3단계 서브 위젯바'}>
          {subSteps.map((s) => (
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
          const isActive = item.id === activeTopId;
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
