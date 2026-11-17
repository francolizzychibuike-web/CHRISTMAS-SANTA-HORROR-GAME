import { X } from 'lucide-react';

interface HowToPlayModalProps {
  onClose: () => void;
}

export function HowToPlayModal({ onClose }: HowToPlayModalProps) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6 bg-black/80"
      role="dialog"
      aria-modal="true"
      aria-label="How To Play"
    >
      <div className="w-full max-w-3xl max-h-[88vh] flex flex-col bg-[#0d1424] border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="font-display text-2xl font-bold text-slate-100">Survival Guide</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close survival guide"
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300 leading-relaxed">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-display text-lg font-bold text-white mb-2">Controls</h3>
              <ul className="space-y-1.5 text-slate-300">
                <li><strong className="text-white">A / D or Left / Right:</strong> Move</li>
                <li><strong className="text-white">Space / W / Up:</strong> Jump &amp; Double Jump (press again in mid-air)</li>
                <li><strong className="text-white">S / Down Arrow:</strong> Slide under beams &amp; down slopes</li>
                <li><strong className="text-white">Shift:</strong> Sprint (uses stamina)</li>
                <li><strong className="text-white">E:</strong> Hide in wardrobes/snowdrifts or pull gate levers</li>
                <li><strong className="text-white">P / Esc:</strong> Pause · <strong className="text-white">R:</strong> Restart · <strong className="text-white">M:</strong> Mute</li>
              </ul>
            </div>

            <div>
              <h3 className="font-display text-lg font-bold text-white mb-2">Sliding &amp; Escaping</h3>
              <p>
                Hold <strong className="text-sky-300">Slide (S / Down)</strong> to duck beneath low-hanging icicle beams and narrow tunnels. Sliding down snowy hills builds massive speed—jump out of a slide to clear wide chasms or outrun Evil Santa.
              </p>
            </div>
          </section>

          <hr className="border-slate-800" />

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-display text-lg font-bold text-white mb-2">Evil Santa AI &amp; Hiding</h3>
              <p>
                Evil Santa patrols each stage, laughs before charging when he spots you, and accelerates when you near the exit. Slip into a <strong className="text-amber-300">Wardrobe, Snowdrift, Locker, or Crate [E]</strong> to break his line of sight—he will search nearby before returning to patrol.
              </p>
            </div>

            <div>
              <h3 className="font-display text-lg font-bold text-white mb-2">Keys, Power-Ups &amp; Endings</h3>
              <p>
                Collect all <strong className="text-amber-300">Christmas Keys</strong> to unlock the Rescue Exit. Grab <strong className="text-sky-300">Speed Boost</strong>, <strong className="text-emerald-400">Protection Shield</strong>, <strong className="text-purple-400">Invisibility Cloak</strong>, and <strong className="text-rose-400">Extra Lives</strong>. Find at least 18 Secret Presents across the 30 stages to unlock the True Ending!
              </p>
            </div>
          </section>
        </div>

        <div className="px-6 py-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
