import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeftRight, Check, Loader2, RefreshCw, X } from 'lucide-react';
import { Exercise, SwapAlternative, UserProfile } from '../types';
import { swapExerciseApi } from '../utils/api';
import { kgToDisplay } from '../utils/calculations';

interface ExerciseSwapModalProps {
  exercise: Exercise;
  profile: UserProfile;
  onSelectAlternative: (alt: SwapAlternative) => void;
  onClose: () => void;
}

const QUICK_REASONS = [
  'Equipment is occupied',
  'Joint discomfort or pain',
  'Want a biomechanically fresh variation',
];

export const ExerciseSwapModal: React.FC<ExerciseSwapModalProps> = ({
  exercise,
  profile,
  onSelectAlternative,
  onClose,
}) => {
  const [reason, setReason] = useState(QUICK_REASONS[0]);
  const [alternatives, setAlternatives] = useState<SwapAlternative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlternatives = async (swapReason: string) => {
    setLoading(true);
    setError(null);
    try {
      const results = await swapExerciseApi(exercise, profile, swapReason);
      setAlternatives(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to fetch exercise swaps.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlternatives(reason);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.id]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="swap-modal-title"
    >
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-[#11161D] border border-white/[0.10] overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-white/[0.08]">
          <div className="min-w-0">
            <h2 id="swap-modal-title" className="font-display text-2xl font-bold tracking-wide text-white truncate">
              Swap Exercise
            </h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              Replacing {exercise.name} · {exercise.muscleGroup} · {profile.equipment}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close swap modal"
            className="h-10 w-10 rounded-lg border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.05] inline-flex items-center justify-center shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          <div className="space-y-2">
            <label htmlFor="swap-reason-input" className="block text-xs font-medium text-slate-300">
              Reason for swap
            </label>
            <div className="flex flex-wrap gap-2">
              {QUICK_REASONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setReason(item);
                    fetchAlternatives(item);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                    reason === item
                      ? 'bg-white/10 border-white/25 text-white'
                      : 'border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <input
                id="swap-reason-input"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Right shoulder feels pinched at the bottom"
                className="flex-1 h-11 rounded-lg bg-[#090C10] border border-white/[0.10] px-3.5 text-sm text-white placeholder:text-slate-500 focus:border-[#B8FF2C] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => fetchAlternatives(reason)}
                disabled={loading}
                className="h-11 px-4 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-10 flex flex-col items-center justify-center text-center gap-3">
              <Loader2 className="h-6 w-6 text-[#B8FF2C] animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-white">Finding biomechanically equivalent swaps</p>
                <p className="text-xs text-slate-400">
                  Matching {exercise.muscleGroup} stimulus for {profile.equipment}
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="text-sm font-medium text-red-200">{error}</p>
                <button
                  type="button"
                  onClick={() => fetchAlternatives(reason)}
                  className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-100 text-xs font-semibold hover:bg-red-500/30 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {alternatives.map((alt, idx) => (
                <div
                  key={`${alt.name}-${idx}`}
                  className="rounded-xl bg-[#090C10] border border-white/[0.08] p-4 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-white">{alt.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5 font-mono tabular-nums">
                        {alt.muscleGroup} · {alt.sets} × {alt.reps} · {alt.rpe} ·{' '}
                        {alt.suggestedWeightKg > 0
                          ? `~${kgToDisplay(alt.suggestedWeightKg, profile.unit)} ${profile.unit}`
                          : 'Bodyweight'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectAlternative(alt)}
                      className="h-10 px-3.5 rounded-lg bg-[#B8FF2C] text-[#090C10] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#c8ff57] transition-colors whitespace-nowrap shrink-0"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Use Swap
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{alt.whyItWorks}</p>
                  <p className="text-xs text-slate-400 border-t border-white/[0.06] pt-2.5">
                    Form cue: {alt.coachingCue}
                  </p>
                </div>
              ))}
              {alternatives.length === 0 && (
                <div className="py-6 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5 text-slate-500" />
                  No alternatives returned. Try adjusting the reason and refreshing.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
