import { Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { SantaState, type HudSnapshot, type InputState } from '../game/types';

interface GameHudProps {
  hud: HudSnapshot;
  soundEnabled: boolean;
  showTouchControls: boolean;
  touchInputRef: { current: Partial<InputState> };
  onPause: () => void;
  onRestart: () => void;
  onToggleSound: () => void;
}

export function GameHud({
  hud,
  soundEnabled,
  showTouchControls,
  touchInputRef,
  onPause,
  onRestart,
  onToggleSound,
}: GameHudProps) {
  const isChasing = hud.santaState === SantaState.CHASE || hud.santaState === SantaState.ALERT_LAUGH;

  const setHold = (key: 'left' | 'right' | 'jumpHeld' | 'slide' | 'sprint', val: boolean) => {
    touchInputRef.current[key] = val;
    if (key === 'jumpHeld' && val) {
      touchInputRef.current.jumpJustPressed = true;
    }
  };

  return (
    <div className="fixed inset-0 z-30 pointer-events-none flex flex-col justify-between p-3 sm:p-5">
      {/* Top HUD Perimeter Row */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left Cluster: Lives, Stage, Keys, Stamina, Active Power-Ups */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-[#0a101ee6] border border-slate-700/80 rounded-lg shadow-[0_6px_20px_rgba(0,0,0,0.65)]">
            {/* Heart-Ornament Vitality Sockets */}
            <div className="flex items-center gap-0.5 sm:gap-1" aria-label={`Lives ${hud.lives} of ${hud.maxLives}`}>
              {Array.from({ length: hud.maxLives }, (_, i) => {
                const full = i < hud.lives;
                return (
                  <svg key={i} viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true">
                    <path
                      d="M12 21s-7.5-4.7-9.2-9.5C1.5 7.9 4 4.5 7.6 4.5c2 0 3.6 1 4.4 2.4.8-1.4 2.4-2.4 4.4-2.4C20 4.5 22.5 7.9 21.2 11.5 19.5 16.3 12 21 12 21z"
                      fill={full ? '#ef4444' : '#1e293b'}
                      stroke="#090d16"
                      strokeWidth="1.8"
                    />
                    {full && <circle cx="8.5" cy="9" r="1.4" fill="#fecaca" />}
                  </svg>
                );
              })}
            </div>

            <span className="h-4 w-px bg-slate-700" aria-hidden="true" />

            {/* Keys Counter */}
            <div className="flex items-center gap-1 sm:gap-1.5 font-mono-tabular text-xs sm:text-sm font-bold text-amber-300" aria-label={`Keys ${hud.keysCollected} of ${hud.keysRequired}`}>
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" aria-hidden="true">
                <circle cx="8" cy="12" r="4.5" fill="#fbbf24" stroke="#090d16" strokeWidth="1.5" />
                <path d="M12 11h9v3h-2v3h-2.5v-3H12z" fill="#fbbf24" stroke="#090d16" strokeWidth="1.2" />
              </svg>
              <span>
                {hud.keysCollected}/{hud.keysRequired}
              </span>
            </div>

            <span className="hidden sm:block h-4 w-px bg-slate-700" aria-hidden="true" />

            {/* Level Name */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-200 max-w-[200px] truncate">
              <span className="text-red-400 font-mono-tabular">L{hud.levelId}</span>
              <span className="truncate">{hud.levelName}</span>
            </div>
          </div>

          {/* Stamina Bar + Power-up timers */}
          <div className="flex items-center gap-2">
            <div className="w-24 sm:w-28 h-2 bg-[#0a101ee6] border border-slate-700/80 rounded-sm overflow-hidden" aria-label={`Stamina ${hud.stamina}%`}>
              <div
                className="h-full bg-sky-400 transition-transform duration-75 origin-left"
                style={{ transform: `scaleX(${Math.max(0, Math.min(1, hud.stamina / 100))})` }}
              />
            </div>

            {hud.speedBoostLeft > 0 && (
              <span className="text-[11px] font-mono-tabular font-bold text-sky-300 bg-[#0a101ee6] border border-sky-500/50 px-2 py-0.5 rounded">
                SPD {hud.speedBoostLeft.toFixed(1)}s
              </span>
            )}
            {hud.shieldLeft > 0 && (
              <span className="text-[11px] font-mono-tabular font-bold text-emerald-300 bg-[#0a101ee6] border border-emerald-500/50 px-2 py-0.5 rounded">
                SHD {hud.shieldLeft.toFixed(1)}s
              </span>
            )}
            {hud.invisibleLeft > 0 && (
              <span className="text-[11px] font-mono-tabular font-bold text-purple-300 bg-[#0a101ee6] border border-purple-500/50 px-2 py-0.5 rounded">
                INV {hud.invisibleLeft.toFixed(1)}s
              </span>
            )}
          </div>
        </div>

        {/* Top-Center Contextual State Cue */}
        <div className="hidden md:flex flex-col items-center">
          {isChasing && (
            <div className="px-4 py-1.5 bg-[#7f1d1df0] border border-red-400/70 rounded-lg text-xs font-bold tracking-wider text-red-100 animate-nightmare-pulse shadow-lg">
              SANTA IS HUNTING YOU
            </div>
          )}
          {!isChasing && hud.isHidden && (
            <div className="px-4 py-1.5 bg-[#0f172ae6] border border-emerald-500/60 rounded-lg text-xs font-bold tracking-wider text-emerald-300">
              HIDDEN IN COVER
            </div>
          )}
        </div>

        {/* Top-Right Cluster: Score, Bells & Utility Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-[#0a101ee6] border border-slate-700/80 rounded-lg shadow-[0_6px_20px_rgba(0,0,0,0.65)] font-mono-tabular">
            <div className="text-right">
              <div className="text-[9px] sm:text-[10px] text-slate-400 leading-none">SCORE</div>
              <div className="text-xs sm:text-sm font-bold text-white leading-tight">{hud.score}</div>
            </div>
            <span className="h-4 sm:h-5 w-px bg-slate-700" aria-hidden="true" />
            <div className="flex items-center gap-1 text-amber-300 text-xs sm:text-sm font-bold" aria-label={`Golden Bells ${hud.bells}`}>
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" aria-hidden="true">
                <path
                  d="M6 17c0-5 2-9 6-9s6 4 6 9l2 2H4l2-2z"
                  fill="#facc15"
                  stroke="#090d16"
                  strokeWidth="1.5"
                />
                <circle cx="12" cy="20.5" r="1.8" fill="#b45309" />
              </svg>
              <span>{hud.bells}</span>
            </div>
          </div>

          <div className="pointer-events-auto flex items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              tabIndex={-1}
              aria-label={soundEnabled ? 'Mute sound (M)' : 'Unmute sound (M)'}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleSound();
              }}
              className="hidden sm:flex w-9 h-9 items-center justify-center bg-[#0a101ee6] hover:bg-slate-800 border border-slate-700/80 rounded-lg text-slate-200 transition-colors cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label="Restart level (R)"
              onClick={(e) => {
                e.currentTarget.blur();
                onRestart();
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-[#0a101ee6] hover:bg-slate-800 border border-slate-700/80 rounded-lg text-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label="Pause game (P)"
              onClick={(e) => {
                e.currentTarget.blur();
                onPause();
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-[#0a101ee6] hover:bg-slate-800 border border-slate-700/80 rounded-lg text-slate-200 transition-colors cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Area: Contextual Interact Prompt + Mobile Touch Controls */}
      <div className="flex flex-col gap-3">
        {hud.interactPrompt && (
          <div className="self-center px-4 py-2 bg-[#0a101ef2] border border-amber-400/60 rounded-lg text-xs sm:text-sm font-semibold text-amber-200 shadow-lg">
            {hud.interactPrompt}
          </div>
        )}

        {showTouchControls && (
          <div className="flex items-end justify-between gap-2 pb-1">
            {/* Left / Right Movement Pad */}
            <div className="pointer-events-auto flex items-center gap-2">
              <button
                type="button"
                aria-label="Move Left"
                onPointerDown={() => setHold('left', true)}
                onPointerUp={() => setHold('left', false)}
                onPointerLeave={() => setHold('left', false)}
                onPointerCancel={() => setHold('left', false)}
                className="w-14 h-14 flex items-center justify-center bg-[#0d1424cc] active:bg-red-700 border border-slate-600 rounded-xl text-white font-bold text-lg select-none"
              >
                ◀
              </button>
              <button
                type="button"
                aria-label="Move Right"
                onPointerDown={() => setHold('right', true)}
                onPointerUp={() => setHold('right', false)}
                onPointerLeave={() => setHold('right', false)}
                onPointerCancel={() => setHold('right', false)}
                className="w-14 h-14 flex items-center justify-center bg-[#0d1424cc] active:bg-red-700 border border-slate-600 rounded-xl text-white font-bold text-lg select-none"
              >
                ▶
              </button>
            </div>

            {/* Right Action Cluster: Sprint, Interact, Slide, Jump */}
            <div className="pointer-events-auto grid grid-cols-2 gap-2">
              <button
                type="button"
                aria-label="Sprint"
                onPointerDown={() => setHold('sprint', true)}
                onPointerUp={() => setHold('sprint', false)}
                onPointerLeave={() => setHold('sprint', false)}
                onPointerCancel={() => setHold('sprint', false)}
                className="h-12 px-3 flex items-center justify-center bg-[#0d1424cc] active:bg-amber-600 border border-slate-600 rounded-xl text-amber-300 font-bold text-xs select-none"
              >
                SPRINT
              </button>
              <button
                type="button"
                aria-label="Interact or Hide"
                onPointerDown={() => {
                  touchInputRef.current.interactJustPressed = true;
                }}
                className="h-12 px-3 flex items-center justify-center bg-[#0d1424cc] active:bg-emerald-600 border border-slate-600 rounded-xl text-emerald-300 font-bold text-xs select-none"
              >
                HIDE / E
              </button>
              <button
                type="button"
                aria-label="Slide"
                onPointerDown={() => setHold('slide', true)}
                onPointerUp={() => setHold('slide', false)}
                onPointerLeave={() => setHold('slide', false)}
                onPointerCancel={() => setHold('slide', false)}
                className="h-14 px-4 flex items-center justify-center bg-[#0d1424cc] active:bg-sky-600 border border-sky-500/60 rounded-xl text-sky-300 font-bold text-xs select-none"
              >
                SLIDE
              </button>
              <button
                type="button"
                aria-label="Jump"
                onPointerDown={() => setHold('jumpHeld', true)}
                onPointerUp={() => setHold('jumpHeld', false)}
                onPointerLeave={() => setHold('jumpHeld', false)}
                onPointerCancel={() => setHold('jumpHeld', false)}
                className="h-14 px-4 flex items-center justify-center bg-red-700/90 active:bg-red-500 border border-red-400/70 rounded-xl text-white font-bold text-xs select-none"
              >
                JUMP
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
