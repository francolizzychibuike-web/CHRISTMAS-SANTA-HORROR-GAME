import { Volume2, VolumeX, Music, Play, Map, HelpCircle, Settings } from 'lucide-react';
import type { GameSettings } from '../game/types';

interface TitleScreenProps {
  highestUnlockedLevel: number;
  totalScore: number;
  settings: GameSettings;
  onPlayGame: (levelId: number) => void;
  onOpenLevelSelect: () => void;
  onOpenHowToPlay: () => void;
  onOpenSettings: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
}

const SNOWFLAKES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  left: `${(i * 4.3 + (i % 3) * 2.1) % 100}%`,
  size: 3 + (i % 4) * 1.5,
  duration: `${6 + (i % 5) * 1.6}s`,
  delay: `${-(i * 0.7)}s`,
  opacity: 0.35 + (i % 4) * 0.14,
}));

export function TitleScreen({
  highestUnlockedLevel,
  totalScore,
  settings,
  onPlayGame,
  onOpenLevelSelect,
  onOpenHowToPlay,
  onOpenSettings,
  onToggleSound,
  onToggleMusic,
}: TitleScreenProps) {
  return (
    <div className="fixed inset-0 z-20 flex flex-col justify-between overflow-hidden bg-[#070b14]">
      {/* Illustrated Key-Art Backdrop */}
      <img
        src="/src/assets/images/title_bg_1794923976821.jpg"
        alt="Snowy Christmas village under threat of Evil Santa"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
      />

      {/* Directional contrast scrim preserving Evil Santa & village art while keeping upper-left negative space readable */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(105deg, rgba(7,11,20,0.88) 0%, rgba(7,11,20,0.58) 44%, rgba(7,11,20,0.18) 76%, rgba(7,11,20,0.55) 100%)',
        }}
      />

      {/* Ambient animated snowfall */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {SNOWFLAKES.map((flake) => (
          <span
            key={flake.id}
            className="absolute top-0 rounded-full bg-slate-100"
            style={{
              left: flake.left,
              width: `${flake.size}px`,
              height: `${flake.size}px`,
              opacity: flake.opacity,
              animation: `snowfallDrift ${flake.duration} linear ${flake.delay} infinite`,
            }}
          />
        ))}
      </div>

      {/* Top utility bar: Sound / Music quick toggles */}
      <div className="relative z-10 flex items-center justify-end gap-2 px-6 pt-5 sm:px-10">
        <button
          type="button"
          onClick={onToggleSound}
          aria-label={settings.soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 bg-[#0d1424]/90 border border-slate-700/80 rounded-lg hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          <span>{settings.soundEnabled ? 'Sound On' : 'Sound Off'}</span>
        </button>

        <button
          type="button"
          onClick={onToggleMusic}
          aria-label={settings.musicEnabled ? 'Mute music' : 'Enable music'}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 bg-[#0d1424]/90 border border-slate-700/80 rounded-lg hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Music className={`w-4 h-4 ${settings.musicEnabled ? 'text-amber-400' : 'text-slate-500'}`} />
          <span>{settings.musicEnabled ? 'Music On' : 'Music Off'}</span>
        </button>
      </div>

      {/* Upper-Left Negative Space Anchor: Custom SVG Emblem & Primary Menu */}
      <main className="relative z-10 flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 max-w-2xl">
        {/* Bespoke SVG Title Lockup */}
        <div className="mb-6">
          <svg
            viewBox="0 0 540 132"
            className="w-full max-w-[500px] h-auto drop-shadow-[0_6px_18px_rgba(0,0,0,0.85)]"
            role="img"
            aria-label="Bad Santa: Christmas Nightmare"
          >
            {/* Ornamental frost divider */}
            <path d="M12 18 L185 18 M235 18 L410 18" stroke="#991b1b" strokeWidth="2" strokeLinecap="round" />
            <polygon points="210,8 220,18 210,28 200,18" fill="#dc2626" stroke="#fde68a" strokeWidth="1.5" />

            {/* Primary Display Title */}
            <text
              x="10"
              y="76"
              fontFamily="Fraunces, Georgia, serif"
              fontWeight="900"
              fontSize="56"
              fill="#f8fafc"
              stroke="#090d16"
              strokeWidth="6"
              paintOrder="stroke fill"
              letterSpacing="1"
            >
              BAD SANTA
            </text>

            {/* Subtitle */}
            <text
              x="14"
              y="112"
              fontFamily="Fraunces, Georgia, serif"
              fontWeight="700"
              fontSize="24"
              fill="#f87171"
              stroke="#090d16"
              strokeWidth="4"
              paintOrder="stroke fill"
              letterSpacing="4"
            >
              CHRISTMAS NIGHTMARE
            </text>
          </svg>

          <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-md leading-relaxed">
            Outrun, outslide, and hide from Father Christmas across 30 cursed winter stages before midnight claims the village.
          </p>
        </div>

        {/* Menu Actions */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 max-w-2xl">
          <button
            type="button"
            data-start="true"
            onClick={() => onPlayGame(highestUnlockedLevel)}
            className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 text-base font-bold text-white bg-[#dc2626] hover:bg-[#b91c1c] border border-red-400/40 rounded-lg shadow-[0_8px_24px_rgba(220,38,38,0.38)] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-300"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{highestUnlockedLevel > 1 ? `Play Level ${highestUnlockedLevel}` : 'Play Game'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenLevelSelect}
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-slate-100 bg-[#11192b]/95 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Map className="w-4 h-4 text-amber-400" />
            <span>Level Select</span>
          </button>

          <button
            type="button"
            onClick={onOpenHowToPlay}
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-slate-100 bg-[#11192b]/95 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-sky-400" />
            <span>How To Play</span>
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-semibold text-slate-100 bg-[#11192b]/95 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-300" />
            <span>Settings</span>
          </button>
        </div>

        {/* Clean Unboxed Progression Summary */}
        <div className="mt-5 flex items-center gap-3 text-xs text-slate-300 font-mono-tabular">
          <span>Unlocked {highestUnlockedLevel} / 30 Levels</span>
          <span aria-hidden="true">·</span>
          <span>Best Total {totalScore.toLocaleString()} pts</span>
        </div>
      </main>

      {/* Bottom Safe-Margin Single Flat Inline Control Hint */}
      <footer className="relative z-10 px-6 pb-5 sm:px-12 lg:px-16">
        <p className="text-xs sm:text-sm text-slate-300/90 font-medium tracking-wide">
          A / D or Arrows Move · Space Jump · S / Down Slide · Shift Sprint · E Hide / Interact · Esc Pause
        </p>
      </footer>
    </div>
  );
}
