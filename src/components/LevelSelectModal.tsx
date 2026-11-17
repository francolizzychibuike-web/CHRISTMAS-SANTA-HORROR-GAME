import { Lock, Play, Star, X } from 'lucide-react';
import { LEVELS } from '../game/levels';
import { isLevelUnlocked } from '../game/saveSystem';
import type { SaveData } from '../game/types';

interface LevelSelectModalProps {
  saveData: SaveData;
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

export function LevelSelectModal({ saveData, onSelectLevel, onClose }: LevelSelectModalProps) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6 bg-black/80"
      role="dialog"
      aria-modal="true"
      aria-label="Level Select"
    >
      <div className="w-full max-w-5xl max-h-[88vh] flex flex-col bg-[#0d1424] border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-100">Select Nightmare Stage</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              30 progressive locations across 6 midnight chapters · Collect Secret Presents for the True Ending
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close level select"
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {LEVELS.map((lvl) => {
            const unlocked = isLevelUnlocked(saveData, lvl.id);
            const rec = saveData.levelProgress[lvl.id];

            return (
              <button
                key={lvl.id}
                type="button"
                disabled={!unlocked}
                onClick={() => onSelectLevel(lvl.id)}
                className={`text-left p-4 rounded-lg border transition-colors flex flex-col justify-between gap-3 ${
                  unlocked
                    ? 'bg-[#131d33] hover:bg-[#1a2845] border-slate-700 hover:border-red-500/70 cursor-pointer'
                    : 'bg-[#0a101d] border-slate-800/80 opacity-55 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[11px] font-mono-tabular text-slate-400 truncate">
                      Level {lvl.id} · {lvl.chapter}
                    </div>
                    <h3 className="font-display text-base font-bold text-slate-100 truncate mt-0.5">
                      {lvl.name}
                    </h3>
                  </div>

                  {unlocked ? (
                    <Play className="w-4 h-4 text-red-400 shrink-0 mt-1" />
                  ) : (
                    <Lock className="w-4 h-4 text-slate-500 shrink-0 mt-1" />
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 font-mono-tabular pt-1 border-t border-slate-800/80">
                  <span>{rec?.completed ? `Best ${rec.bestScore}` : unlocked ? 'Ready' : 'Locked'}</span>
                  <span className="inline-flex items-center gap-1 text-amber-400">
                    <Star className={`w-3.5 h-3.5 ${rec?.presentsFound ? 'fill-amber-400' : 'text-slate-600'}`} />
                    <span>{rec?.presentsFound ?? 0}/1</span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
