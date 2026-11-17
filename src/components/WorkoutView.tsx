import React, { useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  MessageSquare,
  Plus,
  Timer,
  Trash2,
} from 'lucide-react';
import { Exercise, SwapAlternative, UserProfile, WorkoutDay, WorkoutProgram } from '../types';
import { displayToKg, formatTimer, formatVolume, kgToDisplay } from '../utils/calculations';
import { ExerciseSwapModal } from './ExerciseSwapModal';
import { RestTimerBar } from './RestTimerBar';

const HERO_BANNER_URL = '/src/assets/images/athletic_gym_banner_1794929448868.jpg';

interface WorkoutViewProps {
  profile: UserProfile;
  program: WorkoutProgram;
  activeDayIndex: number;
  sessionSeconds: number;
  restTimer: {
    visible: boolean;
    remainingSeconds: number;
    totalSeconds: number;
    isRunning: boolean;
    isFinished: boolean;
    soundEnabled: boolean;
    exerciseLabel?: string;
  };
  onSelectDay: (idx: number) => void;
  onUpdateSet: (
    dayId: string,
    exerciseId: string,
    setId: string,
    patch: { weightKg?: number; reps?: number; completed?: boolean }
  ) => void;
  onAddSet: (dayId: string, exerciseId: string) => void;
  onRemoveSet: (dayId: string, exerciseId: string, setId: string) => void;
  onSwapExercise: (dayId: string, exerciseId: string, alt: SwapAlternative) => void;
  onFinishWorkout: (day: WorkoutDay) => void;
  onStartRestTimer: (seconds: number, label: string) => void;
  onTimerToggle: () => void;
  onTimerReset: () => void;
  onTimerSetDuration: (seconds: number) => void;
  onTimerAddSeconds: (delta: number) => void;
  onTimerToggleSound: () => void;
  onTimerDismiss: () => void;
  onAskCoachAboutExercise: (exerciseName: string) => void;
}

export const WorkoutView: React.FC<WorkoutViewProps> = ({
  profile,
  program,
  activeDayIndex,
  sessionSeconds,
  restTimer,
  onSelectDay,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onSwapExercise,
  onFinishWorkout,
  onStartRestTimer,
  onTimerToggle,
  onTimerReset,
  onTimerSetDuration,
  onTimerAddSeconds,
  onTimerToggleSound,
  onTimerDismiss,
  onAskCoachAboutExercise,
}) => {
  const [expandedCues, setExpandedCues] = useState<Record<string, boolean>>({});
  const [swapTarget, setSwapTarget] = useState<Exercise | null>(null);
  const [bannerFailed, setBannerFailed] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const activeDay = program.days[activeDayIndex] || program.days[0];

  const stats = useMemo(() => {
    if (!activeDay) return { completedSets: 0, totalSets: 0, volumeKg: 0, pct: 0 };
    let completedSets = 0;
    let totalSets = 0;
    let volumeKg = 0;
    for (const ex of activeDay.exercises) {
      for (const s of ex.loggedSets) {
        totalSets += 1;
        if (s.completed) {
          completedSets += 1;
          volumeKg += (s.weightKg || 0) * (s.reps || 0);
        }
      }
    }
    return {
      completedSets,
      totalSets,
      volumeKg,
      pct: totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0,
    };
  }, [activeDay]);

  if (!activeDay) {
    return (
      <div className="rounded-xl bg-[#11161D] border border-white/[0.08] p-8 text-center">
        <p className="text-slate-300 text-sm">No workout days available in your current program.</p>
      </div>
    );
  }

  const handleCompleteToggle = (exercise: Exercise, setId: string, currentlyCompleted: boolean) => {
    const nextCompleted = !currentlyCompleted;
    onUpdateSet(activeDay.id, exercise.id, setId, { completed: nextCompleted });
    if (nextCompleted) {
      onStartRestTimer(exercise.restSeconds || 90, exercise.name);
    }
  };

  const handleFinishClick = () => {
    onFinishWorkout(activeDay);
    setSavedNotice(`Logged ${activeDay.title} (${stats.completedSets} sets · ${formatVolume(stats.volumeKg, profile.unit)})`);
    setTimeout(() => setSavedNotice(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner with Dark Contrast Scrim */}
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-[#11161D]">
        {!bannerFailed ? (
          <img
            src={HERO_BANNER_URL}
            alt="Strength training rack in moody studio lighting"
            referrerPolicy="no-referrer"
            onError={() => setBannerFailed(true)}
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#18202B] via-[#11161D] to-[#090C10]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#090C10]/95 via-[#090C10]/80 to-[#090C10]/45" />

        <div className="relative p-5 sm:p-7 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span>{program.programName}</span>
              <span aria-hidden="true">·</span>
              <span>Day {activeDay.dayNumber} of {program.days.length}</span>
              <span aria-hidden="true">·</span>
              <span>{profile.equipment}</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
              {activeDay.title}
            </h1>
            <p className="text-sm text-slate-300">
              {activeDay.focus} · Est. {activeDay.estimatedMinutes} min
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onStartRestTimer(90, 'Manual Rest')}
              className="h-11 px-4 rounded-lg border border-white/15 bg-[#090C10]/70 hover:bg-[#090C10] text-slate-200 text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <Timer className="h-4 w-4 text-[#B8FF2C]" />
              Rest Timer
            </button>
            <button
              type="button"
              onClick={handleFinishClick}
              disabled={stats.completedSets === 0}
              className="h-11 px-5 rounded-lg bg-[#B8FF2C] text-[#090C10] text-xs font-semibold inline-flex items-center gap-2 hover:bg-[#c8ff57] transition-colors disabled:opacity-45 whitespace-nowrap shrink-0"
            >
              <CheckCircle2 className="h-4 w-4" />
              Finish & Save Session
            </button>
          </div>
        </div>

        {/* Session Telemetry Strip */}
        <div className="relative border-t border-white/[0.08] bg-[#090C10]/75 px-5 sm:px-7 py-3.5 grid grid-cols-3 gap-4">
          <div>
            <p className="text-[11px] text-slate-400">Session Time</p>
            <p className="font-mono text-base sm:text-lg font-semibold text-white tabular-nums flex items-center gap-1.5 mt-0.5">
              <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              {formatTimer(sessionSeconds)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Sets Completed</p>
            <p className="font-mono text-base sm:text-lg font-semibold text-white tabular-nums mt-0.5">
              {stats.completedSets} / {stats.totalSets}{' '}
              <span className="text-xs text-[#B8FF2C] font-normal">({stats.pct}%)</span>
            </p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Session Volume</p>
            <p className="font-mono text-base sm:text-lg font-semibold text-white tabular-nums mt-0.5">
              {formatVolume(stats.volumeKg, profile.unit)}
            </p>
          </div>
        </div>
      </div>

      {savedNotice && (
        <div className="rounded-xl bg-[#B8FF2C]/10 border border-[#B8FF2C]/35 px-4 py-3 text-sm text-[#B8FF2C] flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Split Day Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {program.days.map((day, idx) => {
          const isActive = idx === activeDayIndex;
          return (
            <button
              key={day.id}
              type="button"
              onClick={() => onSelectDay(idx)}
              className={`h-11 px-4 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-white/[0.10] border-white/25 text-white'
                  : 'bg-[#11161D] border-white/[0.08] text-slate-400 hover:text-white hover:border-white/20'
              }`}
            >
              Day {day.dayNumber}: {day.title.split('—')[0].trim()}
            </button>
          );
        })}
      </div>

      {/* Integrated Rest Timer */}
      {restTimer.visible && (
        <RestTimerBar
          remainingSeconds={restTimer.remainingSeconds}
          totalSeconds={restTimer.totalSeconds}
          isRunning={restTimer.isRunning}
          isFinished={restTimer.isFinished}
          soundEnabled={restTimer.soundEnabled}
          exerciseLabel={restTimer.exerciseLabel}
          onToggleRun={onTimerToggle}
          onReset={onTimerReset}
          onSetDuration={onTimerSetDuration}
          onAddSeconds={onTimerAddSeconds}
          onToggleSound={onTimerToggleSound}
          onDismiss={onTimerDismiss}
        />
      )}

      {/* Exercise Cards */}
      <div className="space-y-4">
        {activeDay.exercises.map((exercise, exIndex) => {
          const doneCount = exercise.loggedSets.filter((s) => s.completed).length;
          const allDone = doneCount === exercise.loggedSets.length && exercise.loggedSets.length > 0;
          const cueOpen = Boolean(expandedCues[exercise.id]);

          return (
            <section
              key={exercise.id}
              className="rounded-xl bg-[#11161D] border border-white/[0.08] overflow-hidden"
            >
              {/* Exercise Header */}
              <div className="px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
                    <span>0{exIndex + 1}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-sans">{exercise.muscleGroup}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {exercise.sets} × {exercise.reps}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{exercise.rpe}</span>
                    <span aria-hidden="true">·</span>
                    <span>Rest {exercise.restSeconds}s</span>
                  </div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold tracking-wide text-white mt-0.5 flex items-center gap-2">
                    <span className="truncate">{exercise.name}</span>
                    {allDone && <CheckCircle2 className="h-4 w-4 text-[#B8FF2C] shrink-0" />}
                  </h2>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedCues((prev) => ({ ...prev, [exercise.id]: !prev[exercise.id] }))
                    }
                    className="h-10 px-3 rounded-lg border border-white/[0.08] text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.04] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                  >
                    Form Cue
                    {cueOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setSwapTarget(exercise)}
                    className="h-10 px-3 rounded-lg border border-white/[0.10] bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5 text-[#B8FF2C]" />
                    Swap
                  </button>

                  <button
                    type="button"
                    onClick={() => onAskCoachAboutExercise(exercise.name)}
                    aria-label={`Ask AI Coach about ${exercise.name}`}
                    title="Ask Coach about form"
                    className="h-10 w-10 rounded-lg border border-white/[0.08] text-slate-300 hover:text-[#B8FF2C] hover:border-[#B8FF2C]/40 inline-flex items-center justify-center transition-colors shrink-0"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {cueOpen && (
                <div className="px-4 sm:px-5 py-3 bg-[#090C10]/60 border-b border-white/[0.06] text-xs text-slate-300 leading-relaxed">
                  {exercise.coachingCue}
                </div>
              )}

              {/* Set Logger Table */}
              <div className="px-4 sm:px-5 py-3">
                <div className="grid grid-cols-[44px_1fr_92px_78px_48px_36px] sm:grid-cols-[52px_1fr_116px_96px_52px_40px] items-center gap-2 pb-2 text-[11px] font-medium text-slate-500">
                  <span>Set</span>
                  <span>Previous</span>
                  <span>Weight ({profile.unit})</span>
                  <span>Reps</span>
                  <span className="text-center">Done</span>
                  <span className="sr-only">Remove</span>
                </div>

                <div className="divide-y divide-white/[0.05]">
                  {exercise.loggedSets.map((set, setIdx) => (
                    <div
                      key={set.id}
                      className={`grid grid-cols-[44px_1fr_92px_78px_48px_36px] sm:grid-cols-[52px_1fr_116px_96px_52px_40px] items-center gap-2 py-2 transition-colors ${
                        set.completed ? 'opacity-90' : ''
                      }`}
                    >
                      <span className="font-mono text-xs font-semibold text-slate-400 tabular-nums pl-1">
                        {setIdx + 1}
                      </span>

                      <span className="font-mono text-xs text-slate-500 tabular-nums truncate">
                        {set.previousBest || '—'}
                      </span>

                      <input
                        type="number"
                        step="0.5"
                        min={0}
                        aria-label={`Set ${setIdx + 1} weight in ${profile.unit}`}
                        value={kgToDisplay(set.weightKg, profile.unit)}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          onUpdateSet(activeDay.id, exercise.id, set.id, {
                            weightKg: Number.isNaN(val) ? 0 : displayToKg(val, profile.unit),
                          });
                        }}
                        className="h-11 w-full rounded-lg bg-[#090C10] border border-white/[0.09] px-2.5 font-mono text-sm text-white tabular-nums focus:border-[#B8FF2C] focus:outline-none"
                      />

                      <input
                        type="number"
                        min={0}
                        aria-label={`Set ${setIdx + 1} reps`}
                        value={set.reps}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          onUpdateSet(activeDay.id, exercise.id, set.id, {
                            reps: Number.isNaN(val) ? 0 : val,
                          });
                        }}
                        className="h-11 w-full rounded-lg bg-[#090C10] border border-white/[0.09] px-2.5 font-mono text-sm text-white tabular-nums focus:border-[#B8FF2C] focus:outline-none"
                      />

                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => handleCompleteToggle(exercise, set.id, set.completed)}
                          aria-label={set.completed ? `Mark set ${setIdx + 1} incomplete` : `Complete set ${setIdx + 1}`}
                          aria-pressed={set.completed}
                          className={`h-11 w-11 rounded-lg border inline-flex items-center justify-center transition-colors ${
                            set.completed
                              ? 'bg-[#B8FF2C] border-[#B8FF2C] text-[#090C10]'
                              : 'bg-[#090C10] border-white/[0.12] text-slate-400 hover:border-[#B8FF2C]/60 hover:text-white'
                          }`}
                        >
                          <Check className="h-4 w-4 stroke-[2.5]" />
                        </button>
                      </div>

                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => onRemoveSet(activeDay.id, exercise.id, set.id)}
                          disabled={exercise.loggedSets.length <= 1}
                          aria-label={`Remove set ${setIdx + 1}`}
                          className="h-9 w-9 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 inline-flex items-center justify-center transition-colors disabled:opacity-25"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2.5">
                  <button
                    type="button"
                    onClick={() => onAddSet(activeDay.id, exercise.id)}
                    className="h-10 px-3 rounded-lg border border-dashed border-white/[0.12] text-xs font-medium text-slate-400 hover:text-white hover:border-white/25 inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Set
                  </button>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {swapTarget && (
        <ExerciseSwapModal
          exercise={swapTarget}
          profile={profile}
          onSelectAlternative={(alt) => {
            onSwapExercise(activeDay.id, swapTarget.id, alt);
            setSwapTarget(null);
          }}
          onClose={() => setSwapTarget(null)}
        />
      )}
    </div>
  );
};
