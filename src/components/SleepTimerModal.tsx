import React from 'react';
import { Moon, X, Check, Timer } from 'lucide-react';

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTimerMinutes: number | null; // e.g. 15, 30, or -1 for end of chapter
  onSetTimer: (minutes: number | null) => void;
  sleepTimerLeft: number | null;
}

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({
  isOpen,
  onClose,
  currentTimerMinutes,
  onSetTimer,
  sleepTimerLeft,
}) => {
  if (!isOpen) return null;

  const timerOptions = [
    { label: 'Off / Cancel Timer', value: null },
    { label: '5 minutes', value: 5 },
    { label: '15 minutes', value: 15 },
    { label: '30 minutes', value: 30 },
    { label: '45 minutes', value: 45 },
    { label: '60 minutes (1 Hour)', value: 60 },
    { label: 'End of current chapter', value: -1 },
  ];

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${s}s remaining`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-[#151726] border border-white/10 rounded-2xl p-6 shadow-2xl text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base">Audiobook Sleep Timer</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close sleep timer dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {sleepTimerLeft !== null && (
          <div className="mb-4 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-center gap-2">
            <Timer className="w-4 h-4 animate-spin text-indigo-400" />
            <span className="font-semibold">{formatTimer(sleepTimerLeft)}</span>
          </div>
        )}

        <div className="space-y-1.5">
          {timerOptions.map((opt) => {
            const isSelected = currentTimerMinutes === opt.value;
            return (
              <button
                key={opt.label}
                onClick={() => {
                  onSetTimer(opt.value);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-stone-950 shadow-md'
                    : 'bg-white/[0.03] text-slate-300 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <Check className="w-4 h-4 text-stone-950" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
