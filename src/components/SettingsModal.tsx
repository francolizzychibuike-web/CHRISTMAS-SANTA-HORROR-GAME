import { X } from 'lucide-react';
import type { GameSettings } from '../game/types';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (patch: Partial<GameSettings>) => void;
  onClose: () => void;
}

export function SettingsModal({ settings, onUpdateSettings, onClose }: SettingsModalProps) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6 bg-black/80"
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <div className="w-full max-w-md bg-[#0d1424] border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="font-display text-2xl font-bold text-slate-100">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-slate-100">Sound Effects</div>
              <div className="text-xs text-slate-400">Footsteps, snow slides, Santa laughter, storm wind</div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                settings.soundEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {settings.soundEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-slate-100">Background Music</div>
              <div className="text-xs text-slate-400">Eerie Christmas music box &amp; dynamic chase score</div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSettings({ musicEnabled: !settings.musicEnabled })}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                settings.musicEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {settings.musicEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="space-y-2">
            <div className="font-semibold text-slate-100">Touch Controls Overlay</div>
            <div className="flex items-center gap-1.5 p-1 bg-[#080d18] border border-slate-800 rounded-lg">
              {(['auto', 'always', 'off'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onUpdateSettings({ mobileControls: mode })}
                  className={`flex-1 py-2 text-xs font-semibold rounded-md capitalize transition-colors cursor-pointer ${
                    settings.mobileControls === mode
                      ? 'bg-red-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-800">
            <div>
              <div className="font-semibold text-slate-100">Unlock All 30 Levels</div>
              <div className="text-xs text-slate-400">Jump directly into any nightmare stage</div>
            </div>
            <button
              type="button"
              onClick={() => onUpdateSettings({ unlockAllLevels: !settings.unlockAllLevels })}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                settings.unlockAllLevels ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {settings.unlockAllLevels ? 'Unlocked' : 'Progression'}
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
