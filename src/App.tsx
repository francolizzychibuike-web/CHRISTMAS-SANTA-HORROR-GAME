import { useCallback, useEffect, useRef, useState } from 'react';
import { GameHud } from './components/GameHud';
import { HowToPlayModal } from './components/HowToPlayModal';
import { LevelSelectModal } from './components/LevelSelectModal';
import { SettingsModal } from './components/SettingsModal';
import { OutcomeModal, PauseModal } from './components/StatusModal';
import { TitleScreen } from './components/TitleScreen';
import { PhaserGameCanvas, type PhaserGameHandle } from './game/PhaserGameCanvas';
import { gameAudio } from './game/audio';
import { getLevelById } from './game/levels';
import {
  TOTAL_LEVELS,
  clampLevel,
  countTotalPresentsFound,
  determineFinalEnding,
  loadSaveData,
  recordLevelVictory,
  updateSettings,
} from './game/saveSystem';
import {
  SantaState,
  type GameScreenState,
  type GameSettings,
  type HudSnapshot,
  type InputState,
  type RunStats,
  type SaveData,
} from './game/types';

function createInitialHud(levelId: number): HudSnapshot {
  const lvl = getLevelById(levelId);
  return {
    levelId: lvl.id,
    levelName: lvl.name,
    lives: 3,
    maxLives: 3,
    score: 0,
    bells: 0,
    keysCollected: 0,
    keysRequired: lvl.keysRequired,
    presentsCollected: 0,
    presentsTotal: 1,
    stamina: 100,
    isSliding: false,
    isHidden: false,
    santaState: SantaState.PATROL,
    santaDistance: 999,
    speedBoostLeft: 0,
    shieldLeft: 0,
    invisibleLeft: 0,
    interactPrompt: null,
    checkpointReached: false,
    elapsedSeconds: 0,
  };
}

export default function App() {
  const [saveData, setSaveData] = useState<SaveData>(() => loadSaveData());
  const [screenState, setScreenState] = useState<GameScreenState>('title');
  const [activeLevelId, setActiveLevelId] = useState<number>(() => saveData.highestUnlockedLevel);
  const [hud, setHud] = useState<HudSnapshot>(() => createInitialHud(saveData.highestUnlockedLevel));
  const [outcomeStats, setOutcomeStats] = useState<RunStats | null>(null);
  const [activeMenuModal, setActiveMenuModal] = useState<'levels' | 'howto' | 'settings' | null>(null);
  const [isTouchViewport, setIsTouchViewport] = useState(false);

  const phaserRef = useRef<PhaserGameHandle | null>(null);
  const touchInputRef = useRef<Partial<InputState>>({});

  // Sync audio settings
  useEffect(() => {
    gameAudio.setSettings(saveData.settings.soundEnabled, saveData.settings.musicEnabled);
  }, [saveData.settings.soundEnabled, saveData.settings.musicEnabled]);

  // Sync body[data-state] for clean state inspection
  useEffect(() => {
    document.body.dataset.state = screenState;
  }, [screenState]);

  // Detect touch / narrow viewport for responsive mobile controls
  useEffect(() => {
    const checkViewport = () => {
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isNarrow = window.innerWidth <= 900;
      setIsTouchViewport(hasTouch || isNarrow);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  const startLevel = useCallback(
    (levelId: number) => {
      const clamped = clampLevel(levelId);
      gameAudio.unlock();
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      touchInputRef.current = {};
      setActiveMenuModal(null);
      setOutcomeStats(null);
      setActiveLevelId(clamped);
      setHud(createInitialHud(clamped));
      setScreenState('playing');

      const best = saveData.levelProgress[clamped]?.bestScore ?? 0;
      // If Phaser is already mounted, load level immediately; otherwise initialLevelId handles boot
      phaserRef.current?.loadLevel(clamped, best);
    },
    [saveData.levelProgress],
  );

  // Support ?autostart=1 and optional ?level=N query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const levelParam = Number(params.get('level'));
    const startLvl = Number.isFinite(levelParam) && levelParam >= 1 ? clampLevel(levelParam) : saveData.highestUnlockedLevel;
    if (params.get('autostart') === '1') {
      startLevel(startLvl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTogglePause = useCallback(() => {
    if (screenState === 'playing') {
      setScreenState('paused');
      phaserRef.current?.setPaused(true);
    } else if (screenState === 'paused') {
      setScreenState('playing');
      phaserRef.current?.setPaused(false);
    }
  }, [screenState]);

  const handleRestartLevel = useCallback(() => {
    startLevel(activeLevelId);
  }, [activeLevelId, startLevel]);

  const handleMainMenu = useCallback(() => {
    gameAudio.stopSceneAudio();
    touchInputRef.current = {};
    setOutcomeStats(null);
    setScreenState('title');
  }, []);

  const handleUpdateSettings = useCallback((patch: Partial<GameSettings>) => {
    setSaveData((prev) => updateSettings(prev, patch));
  }, []);

  const handleLevelComplete = useCallback((stats: RunStats) => {
    setSaveData((prev) => {
      const updated = recordLevelVictory(prev, {
        levelId: stats.levelId,
        score: stats.score,
        bells: stats.bells,
        presentsFound: stats.presentsCollected,
        elapsedSeconds: stats.elapsedSeconds,
      });
      const endingKind = stats.levelId === TOTAL_LEVELS ? determineFinalEnding(updated) : undefined;
      const totalPresentsAcrossGame = countTotalPresentsFound(updated);
      setOutcomeStats({
        ...stats,
        bestScore: Math.max(stats.score, updated.levelProgress[stats.levelId]?.bestScore ?? 0),
        endingKind,
        totalPresentsAcrossGame,
      });
      return updated;
    });
    setScreenState('gameover');
  }, []);

  const handleGameOver = useCallback((stats: RunStats) => {
    setOutcomeStats(stats);
    setScreenState('gameover');
  }, []);

  // Global keyboard shortcuts (Title Enter/Space start, Playing Esc/P/R/M)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (screenState === 'title' && !activeMenuModal) {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          startLevel(saveData.highestUnlockedLevel);
        }
        return;
      }

      if (screenState === 'playing' || screenState === 'paused') {
        if (e.code === 'Escape' || e.code === 'KeyP') {
          e.preventDefault();
          handleTogglePause();
        } else if (e.code === 'KeyR' && screenState === 'playing') {
          e.preventDefault();
          handleRestartLevel();
        } else if (e.code === 'KeyM') {
          e.preventDefault();
          handleUpdateSettings({ soundEnabled: !saveData.settings.soundEnabled });
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    screenState,
    activeMenuModal,
    saveData.highestUnlockedLevel,
    saveData.settings.soundEnabled,
    startLevel,
    handleTogglePause,
    handleRestartLevel,
    handleUpdateSettings,
  ]);

  const showTouchControls =
    saveData.settings.mobileControls === 'always' ||
    (saveData.settings.mobileControls === 'auto' && isTouchViewport);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#070b14]">
      {/* Title Screen */}
      {screenState === 'title' && (
        <TitleScreen
          highestUnlockedLevel={saveData.highestUnlockedLevel}
          totalScore={saveData.totalScore}
          settings={saveData.settings}
          onPlayGame={startLevel}
          onOpenLevelSelect={() => setActiveMenuModal('levels')}
          onOpenHowToPlay={() => setActiveMenuModal('howto')}
          onOpenSettings={() => setActiveMenuModal('settings')}
          onToggleSound={() => handleUpdateSettings({ soundEnabled: !saveData.settings.soundEnabled })}
          onToggleMusic={() => handleUpdateSettings({ musicEnabled: !saveData.settings.musicEnabled })}
        />
      )}

      {/* Title Sub-Modals */}
      {screenState === 'title' && activeMenuModal === 'levels' && (
        <LevelSelectModal
          saveData={saveData}
          onSelectLevel={startLevel}
          onClose={() => setActiveMenuModal(null)}
        />
      )}

      {screenState === 'title' && activeMenuModal === 'howto' && (
        <HowToPlayModal onClose={() => setActiveMenuModal(null)} />
      )}

      {screenState === 'title' && activeMenuModal === 'settings' && (
        <SettingsModal
          settings={saveData.settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setActiveMenuModal(null)}
        />
      )}

      {/* Phaser 3 Active Game World */}
      {screenState !== 'title' && (
        <>
          <PhaserGameCanvas
            ref={phaserRef}
            initialLevelId={activeLevelId}
            bestScoreForLevel={saveData.levelProgress[activeLevelId]?.bestScore ?? 0}
            touchInputRef={touchInputRef}
            onHudUpdate={setHud}
            onLevelComplete={handleLevelComplete}
            onGameOver={handleGameOver}
          />

          <GameHud
            hud={hud}
            soundEnabled={saveData.settings.soundEnabled}
            showTouchControls={showTouchControls}
            touchInputRef={touchInputRef}
            onPause={handleTogglePause}
            onRestart={handleRestartLevel}
            onToggleSound={() => handleUpdateSettings({ soundEnabled: !saveData.settings.soundEnabled })}
          />
        </>
      )}

      {/* Pause Modal */}
      {screenState === 'paused' && (
        <PauseModal
          levelId={hud.levelId}
          levelName={hud.levelName}
          settings={saveData.settings}
          onResume={handleTogglePause}
          onRestart={handleRestartLevel}
          onToggleSound={() => handleUpdateSettings({ soundEnabled: !saveData.settings.soundEnabled })}
          onToggleMusic={() => handleUpdateSettings({ musicEnabled: !saveData.settings.musicEnabled })}
          onMainMenu={handleMainMenu}
        />
      )}

      {/* Victory / Final Ending / Game Over Modal */}
      {screenState === 'gameover' && outcomeStats && (
        <OutcomeModal
          stats={outcomeStats}
          onPrimaryAction={() => {
            if (
              (outcomeStats.outcome === 'victory' || outcomeStats.outcome === 'final_victory') &&
              outcomeStats.levelId < TOTAL_LEVELS
            ) {
              startLevel(outcomeStats.levelId + 1);
            } else {
              startLevel(outcomeStats.levelId);
            }
          }}
          onRestart={() => startLevel(outcomeStats.levelId)}
          onMainMenu={handleMainMenu}
        />
      )}
    </div>
  );
}
