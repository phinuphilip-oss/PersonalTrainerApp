import React from 'react';
import { Bell, Pause, Play, Plus, RotateCcw, Volume2, VolumeX, X } from 'lucide-react';
import { formatTimer } from '../utils/calculations';

interface RestTimerBarProps {
  remainingSeconds: number;
  totalSeconds: number;
  isRunning: boolean;
  isFinished: boolean;
  soundEnabled: boolean;
  exerciseLabel?: string;
  onToggleRun: () => void;
  onReset: () => void;
  onSetDuration: (seconds: number) => void;
  onAddSeconds: (delta: number) => void;
  onToggleSound: () => void;
  onDismiss: () => void;
}

export const RestTimerBar: React.FC<RestTimerBarProps> = ({
  remainingSeconds,
  totalSeconds,
  isRunning,
  isFinished,
  soundEnabled,
  exerciseLabel,
  onToggleRun,
  onReset,
  onSetDuration,
  onAddSeconds,
  onToggleSound,
  onDismiss,
}) => {
  const progress = totalSeconds > 0 ? Math.max(0, Math.min(1, remainingSeconds / totalSeconds)) : 0;
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div
      className={`rounded-xl border px-4 py-3 transition-colors ${
        isFinished
          ? 'bg-[#B8FF2C]/12 border-[#B8FF2C]/50'
          : 'bg-[#11161D] border-white/[0.10]'
      }`}
      role="region"
      aria-label="Rest timer"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-11 w-11 shrink-0 flex items-center justify-center">
            <svg className="h-11 w-11 -rotate-90" viewBox="0 0 44 44" aria-hidden="true">
              <circle
                cx="22"
                cy="22"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="3"
              />
              <circle
                cx="22"
                cy="22"
                r={radius}
                fill="none"
                stroke={isFinished ? '#B8FF2C' : '#B8FF2C'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-[stroke-dashoffset] duration-300"
              />
            </svg>
            {isFinished ? (
              <Bell className="h-4 w-4 text-[#B8FF2C] absolute" />
            ) : (
              <span className="font-mono text-[10px] font-semibold text-slate-300 absolute tabular-nums">
                {Math.round(progress * 100)}%
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-baseline gap-2.5">
              <span
                className={`font-mono text-2xl font-semibold tracking-tight tabular-nums ${
                  isFinished ? 'text-[#B8FF2C]' : 'text-white'
                }`}
              >
                {formatTimer(remainingSeconds)}
              </span>
              <span className="text-xs font-medium text-slate-400 truncate">
                {isFinished
                  ? 'Rest complete — ready for next set'
                  : exerciseLabel
                  ? `Rest · ${exerciseLabel}`
                  : 'Rest Timer'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              {[60, 90, 120].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => onSetDuration(sec)}
                  className={`px-2 py-0.5 text-xs font-mono tabular-nums rounded border transition-colors whitespace-nowrap shrink-0 ${
                    totalSeconds === sec
                      ? 'bg-white/10 border-white/25 text-white'
                      : 'border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {sec}s
                </button>
              ))}
              <button
                type="button"
                onClick={() => onAddSeconds(15)}
                className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-mono tabular-nums rounded border border-white/[0.08] text-slate-300 hover:text-white hover:border-white/20 transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="h-3 w-3" />
                15s
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onToggleRun}
            aria-label={isRunning ? 'Pause rest timer' : 'Start rest timer'}
            className="h-11 px-3.5 rounded-lg bg-[#B8FF2C] text-[#090C10] font-semibold text-xs inline-flex items-center gap-1.5 hover:bg-[#c8ff57] transition-colors whitespace-nowrap shrink-0"
          >
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isRunning ? 'Pause' : isFinished ? 'Restart' : 'Start'}
          </button>

          <button
            type="button"
            onClick={onReset}
            aria-label="Reset timer"
            className="h-11 w-11 rounded-lg border border-white/[0.10] text-slate-300 hover:text-white hover:bg-white/[0.05] inline-flex items-center justify-center transition-colors shrink-0"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute timer chime' : 'Enable timer chime'}
            className="h-11 w-11 rounded-lg border border-white/[0.10] text-slate-300 hover:text-white hover:bg-white/[0.05] inline-flex items-center justify-center transition-colors shrink-0"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4 text-slate-500" />}
          </button>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close rest timer"
            className="h-11 w-11 rounded-lg border border-white/[0.10] text-slate-400 hover:text-white hover:bg-white/[0.05] inline-flex items-center justify-center transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
