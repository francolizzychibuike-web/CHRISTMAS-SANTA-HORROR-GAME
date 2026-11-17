import { Home, Play, RotateCcw, Volume2, VolumeX, Music } from 'lucide-react';
import { TOTAL_LEVELS, TRUE_ENDING_PRESENTS_THRESHOLD } from '../game/saveSystem';
import type { GameSettings, RunStats } from '../game/types';

interface PauseModalProps {
  levelId: number;
  levelName: string;
  settings: GameSettings;
  onResume: () => void;
  onRestart: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onMainMenu: () => void;
}

export function PauseModal({
  levelId,
  levelName,
  settings,
  onResume,
  onRestart,
  onToggleSound,
  onToggleMusic,
  onMainMenu,
}: PauseModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
      role="dialog"
      aria-modal="true"
      aria-label="Game Paused"
    >
      <div className="w-full max-w-sm bg-[#0d1424] border border-slate-700 rounded-xl p-6 shadow-2xl text-center space-y-5">
        <div>
          <div className="text-xs font-mono-tabular text-red-400">LEVEL {levelId}</div>
          <h2 className="font-display text-2xl font-bold text-white mt-0.5">{levelName}</h2>
          <p className="text-xs text-slate-400 mt-1">Game Paused</p>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-sm rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart Level</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onToggleSound}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#131d33] hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
              <span>{settings.soundEnabled ? 'Sound On' : 'Sound Off'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleMusic}
              className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#131d33] hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              <Music className={`w-4 h-4 ${settings.musicEnabled ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>{settings.musicEnabled ? 'Music On' : 'Music Off'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onMainMenu}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-transparent hover:bg-slate-800/70 border border-slate-700 text-slate-300 font-semibold text-sm rounded-lg transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface OutcomeModalProps {
  stats: RunStats;
  onPrimaryAction: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export function OutcomeModal({ stats, onPrimaryAction, onRestart, onMainMenu }: OutcomeModalProps) {
  const isVictory = stats.outcome === 'victory' || stats.outcome === 'final_victory';
  const isFinal = stats.outcome === 'final_victory';
  const hasNextLevel = isVictory && stats.levelId < TOTAL_LEVELS;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      role="dialog"
      aria-modal="true"
      aria-label={isVictory ? 'Level Cleared' : 'Game Over'}
    >
      <div className="w-full max-w-md bg-[#0d1424] border border-slate-700 rounded-xl p-6 sm:p-7 shadow-2xl space-y-5">
        {!isVictory && (
          <div className="flex flex-col items-center text-center">
            {/* Scary non-graphic Evil Santa silhouette */}
            <svg viewBox="0 0 120 80" className="w-28 h-20 mb-2" aria-hidden="true">
              <path d="M22 76 C22 44, 98 44, 98 76 Z" fill="#450a0a" />
              <circle cx="60" cy="34" r="18" fill="#1e293b" stroke="#090d16" strokeWidth="2" />
              <path d="M40 24 L80 24 L54 5 L34 15 Z" fill="#7f1d1d" />
              <path d="M46 39 L74 39 L66 58 L60 52 L54 58 Z" fill="#cbd5e1" />
              <circle cx="53" cy="31" r="3" fill="#ff1e38" />
              <circle cx="67" cy="31" r="3" fill="#ff1e38" />
            </svg>
            <h2 className="font-display text-3xl font-black text-red-400">CAUGHT IN THE NIGHTMARE</h2>
            <p className="text-xs text-slate-400 mt-1">
              Level {stats.levelId}: {stats.levelName}
            </p>
          </div>
        )}

        {isVictory && (
          <div className="text-center">
            <div className="text-xs font-mono-tabular text-emerald-400">
              {isFinal ? 'ALL 30 NIGHTMARE STAGES SURVIVED' : `LEVEL ${stats.levelId} CLEARED`}
            </div>
            <h2 className="font-display text-3xl font-black text-white mt-1">
              {isFinal
                ? stats.endingKind === 'true_savior'
                  ? 'True Ending: Savior of Christmas'
                  : 'Midnight Escape Complete'
                : stats.levelName}
            </h2>
            {isFinal && (
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {stats.endingKind === 'true_savior'
                  ? `You recovered ${stats.totalPresentsAcrossGame ?? 0} Secret Presents and broke the curse over the Christmas Village!`
                  : `You escaped Evil Santa's grasp across all 30 levels! Collect ${TRUE_ENDING_PRESENTS_THRESHOLD}+ Secret Presents to unlock the True Ending.`}
              </p>
            )}
          </div>
        )}

        {/* 3 Tabular Metrics */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <div className="bg-[#131d33] border border-slate-800 rounded-lg p-3 text-center">
            <div className="text-[11px] text-slate-400">SCORE</div>
            <div className="font-mono-tabular text-lg font-bold text-white mt-0.5">{stats.score}</div>
            <div className="text-[10px] font-mono-tabular text-slate-400">Best {stats.bestScore}</div>
          </div>

          <div className="bg-[#131d33] border border-slate-800 rounded-lg p-3 text-center">
            <div className="text-[11px] text-slate-400">{isVictory ? 'TIME' : 'KEYS'}</div>
            <div className="font-mono-tabular text-lg font-bold text-amber-300 mt-0.5">
              {isVictory ? `${stats.elapsedSeconds}s` : `${stats.keysCollected}/${stats.keysRequired}`}
            </div>
            <div className="text-[10px] font-mono-tabular text-slate-400">
              {isVictory ? `${stats.damageTaken} Hits` : 'Collected'}
            </div>
          </div>

          <div className="bg-[#131d33] border border-slate-800 rounded-lg p-3 text-center">
            <div className="text-[11px] text-slate-400">LOOT</div>
            <div className="font-mono-tabular text-lg font-bold text-emerald-300 mt-0.5">
              {stats.bells}
            </div>
            <div className="text-[10px] font-mono-tabular text-slate-400">
              Presents {stats.presentsCollected}/{stats.presentsTotal}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 pt-1">
          <button
            type="button"
            data-start="true"
            onClick={onPrimaryAction}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-lg transition-colors cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{hasNextLevel ? `Next: Level ${stats.levelId + 1}` : isVictory ? 'Play Again' : 'Try Again'}</span>
          </button>

          {hasNextLevel && (
            <button
              type="button"
              onClick={onRestart}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Replay Level {stats.levelId}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onMainMenu}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-transparent hover:bg-slate-800/70 border border-slate-700 text-slate-300 font-semibold text-sm rounded-lg transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
}
