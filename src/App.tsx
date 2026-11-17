import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Dumbbell,
  Flame,
  LayoutGrid,
  MessageSquare,
  RotateCcw,
  UserCog,
} from 'lucide-react';
import {
  BodyWeightEntry,
  CoachMessage,
  CompletedWorkoutLog,
  MealEntry,
  NavTab,
  SwapAlternative,
  UserProfile,
  WorkoutDay,
  WorkoutProgram,
} from './types';
import {
  SEED_COACH_MESSAGES,
  SEED_MEALS,
  SEED_PROFILE,
  SEED_PROGRAM,
  SEED_WEIGHT_HISTORY,
  SEED_WORKOUT_LOGS,
} from './data/seedData';
import { calculateNutritionTargets, getTodayISO, kgToDisplay } from './utils/calculations';
import {
  buildLoggedSets,
  createCoachMessage,
  generateWorkoutProgramApi,
  sendCoachMessageApi,
} from './utils/api';
import { playRestCompleteChime, playSetCompleteTick } from './utils/audio';
import { WorkoutView } from './components/WorkoutView';
import { ProgramBuilderView } from './components/ProgramBuilderView';
import { NutritionView } from './components/NutritionView';
import { ProgressView } from './components/ProgressView';
import { CoachView } from './components/CoachView';
import { ProfileOnboardingModal } from './components/ProfileOnboardingModal';

const STORAGE_KEY = 'kinetix_trainer_state_v1';

interface PersistedState {
  profile: UserProfile;
  program: WorkoutProgram;
  activeDayIndex: number;
  workoutLogs: CompletedWorkoutLog[];
  weightHistory: BodyWeightEntry[];
  meals: MealEntry[];
  coachMessages: CoachMessage[];
}

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (parsed.profile && parsed.program && Array.isArray(parsed.program.days)) {
        return {
          profile: parsed.profile,
          program: parsed.program,
          activeDayIndex: parsed.activeDayIndex ?? 0,
          workoutLogs: Array.isArray(parsed.workoutLogs) ? parsed.workoutLogs : [],
          weightHistory: Array.isArray(parsed.weightHistory) ? parsed.weightHistory : [],
          meals: Array.isArray(parsed.meals) ? parsed.meals : [],
          coachMessages:
            Array.isArray(parsed.coachMessages) && parsed.coachMessages.length > 0
              ? parsed.coachMessages
              : SEED_COACH_MESSAGES,
        };
      }
    }
  } catch {
    // Fallback to seed data if storage is unavailable or corrupted
  }
  return {
    profile: SEED_PROFILE,
    program: SEED_PROGRAM,
    activeDayIndex: 0,
    workoutLogs: SEED_WORKOUT_LOGS,
    weightHistory: SEED_WEIGHT_HISTORY,
    meals: SEED_MEALS,
    coachMessages: SEED_COACH_MESSAGES,
  };
}

const NAV_ITEMS: Array<{ id: NavTab; label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'workout', label: "Today's Workout", shortLabel: 'Workout', icon: Dumbbell },
  { id: 'program', label: 'Program Builder', shortLabel: 'Program', icon: LayoutGrid },
  { id: 'nutrition', label: 'Nutrition & Macros', shortLabel: 'Macros', icon: Flame },
  { id: 'progress', label: 'Progress', shortLabel: 'Progress', icon: Activity },
  { id: 'coach', label: 'AI Coach', shortLabel: 'Coach', icon: MessageSquare },
];

export default function App() {
  const [state, setState] = useState<PersistedState>(loadInitialState);
  const [activeTab, setActiveTab] = useState<NavTab>('workout');
  const [profileModal, setProfileModal] = useState<{ open: boolean; isReset: boolean }>({
    open: false,
    isReset: false,
  });

  // Program generation state
  const [isGeneratingProgram, setIsGeneratingProgram] = useState(false);
  const [programError, setProgramError] = useState<string | null>(null);

  // Coach chat state
  const [isCoachSending, setIsCoachSending] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);
  const [coachDraftPrompt, setCoachDraftPrompt] = useState<string | undefined>(undefined);

  // Active session elapsed timer (seconds)
  const [sessionSeconds, setSessionSeconds] = useState(0);

  // Rest timer state
  const [restTimer, setRestTimer] = useState({
    visible: false,
    remainingSeconds: 90,
    totalSeconds: 90,
    isRunning: false,
    isFinished: false,
    soundEnabled: true,
    exerciseLabel: '' as string | undefined,
  });

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }, [state]);

  // Session timer tick when on workout tab and at least 1 set is completed
  const activeDay = state.program.days[state.activeDayIndex] || state.program.days[0];
  const hasCompletedAnySet = useMemo(() => {
    if (!activeDay) return false;
    return activeDay.exercises.some((ex) => ex.loggedSets.some((s) => s.completed));
  }, [activeDay]);

  useEffect(() => {
    if (!hasCompletedAnySet) return;
    const interval = window.setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [hasCompletedAnySet]);

  // Rest timer countdown
  useEffect(() => {
    if (!restTimer.isRunning) return;
    const interval = window.setInterval(() => {
      setRestTimer((prev) => {
        if (!prev.isRunning) return prev;
        if (prev.remainingSeconds <= 1) {
          if (prev.soundEnabled) {
            playRestCompleteChime();
          }
          return {
            ...prev,
            remainingSeconds: 0,
            isRunning: false,
            isFinished: true,
          };
        }
        return {
          ...prev,
          remainingSeconds: prev.remainingSeconds - 1,
        };
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [restTimer.isRunning]);

  const targets = useMemo(() => calculateNutritionTargets(state.profile), [state.profile]);

  const todayNutrition = useMemo(() => {
    const today = getTodayISO();
    return state.meals
      .filter((m) => m.date === today)
      .reduce(
        (acc, m) => ({
          calories: acc.calories + m.calories,
          protein: acc.protein + m.protein,
          carbs: acc.carbs + m.carbs,
          fats: acc.fats + m.fats,
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0 }
      );
  }, [state.meals]);

  // Workout handlers
  const handleUpdateSet = useCallback(
    (
      dayId: string,
      exerciseId: string,
      setId: string,
      patch: { weightKg?: number; reps?: number; completed?: boolean }
    ) => {
      if (patch.completed === true) {
        playSetCompleteTick();
      }
      setState((prev) => ({
        ...prev,
        program: {
          ...prev.program,
          days: prev.program.days.map((day) => {
            if (day.id !== dayId) return day;
            return {
              ...day,
              exercises: day.exercises.map((ex) => {
                if (ex.id !== exerciseId) return ex;
                return {
                  ...ex,
                  loggedSets: ex.loggedSets.map((s) =>
                    s.id === setId ? { ...s, ...patch } : s
                  ),
                };
              }),
            };
          }),
        },
      }));
    },
    []
  );

  const handleAddSet = useCallback((dayId: string, exerciseId: string) => {
    setState((prev) => ({
      ...prev,
      program: {
        ...prev.program,
        days: prev.program.days.map((day) => {
          if (day.id !== dayId) return day;
          return {
            ...day,
            exercises: day.exercises.map((ex) => {
              if (ex.id !== exerciseId) return ex;
              const last = ex.loggedSets[ex.loggedSets.length - 1];
              return {
                ...ex,
                loggedSets: [
                  ...ex.loggedSets,
                  {
                    id: `set-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                    weightKg: last ? last.weightKg : ex.suggestedWeightKg,
                    reps: last ? last.reps : 10,
                    completed: false,
                  },
                ],
              };
            }),
          };
        }),
      },
    }));
  }, []);

  const handleRemoveSet = useCallback((dayId: string, exerciseId: string, setId: string) => {
    setState((prev) => ({
      ...prev,
      program: {
        ...prev.program,
        days: prev.program.days.map((day) => {
          if (day.id !== dayId) return day;
          return {
            ...day,
            exercises: day.exercises.map((ex) => {
              if (ex.id !== exerciseId || ex.loggedSets.length <= 1) return ex;
              return {
                ...ex,
                loggedSets: ex.loggedSets.filter((s) => s.id !== setId),
              };
            }),
          };
        }),
      },
    }));
  }, []);

  const handleSwapExercise = useCallback(
    (dayId: string, exerciseId: string, alt: SwapAlternative) => {
      setState((prev) => ({
        ...prev,
        program: {
          ...prev.program,
          days: prev.program.days.map((day) => {
            if (day.id !== dayId) return day;
            return {
              ...day,
              exercises: day.exercises.map((ex) => {
                if (ex.id !== exerciseId) return ex;
                return {
                  ...ex,
                  name: alt.name,
                  muscleGroup: alt.muscleGroup,
                  sets: alt.sets,
                  reps: alt.reps,
                  restSeconds: alt.restSeconds,
                  rpe: alt.rpe,
                  suggestedWeightKg: alt.suggestedWeightKg,
                  coachingCue: alt.coachingCue,
                  loggedSets: buildLoggedSets(alt.sets, alt.reps, alt.suggestedWeightKg),
                };
              }),
            };
          }),
        },
      }));
    },
    []
  );

  const handleFinishWorkout = useCallback(
    (day: WorkoutDay) => {
      let totalVolumeKg = 0;
      let completedSets = 0;
      let totalSets = 0;
      const exercisesSummary: CompletedWorkoutLog['exercisesSummary'] = [];

      for (const ex of day.exercises) {
        let exVol = 0;
        let bestVol = -1;
        let bestSet = '—';
        for (const s of ex.loggedSets) {
          totalSets += 1;
          if (s.completed) {
            completedSets += 1;
            const v = (s.weightKg || 0) * (s.reps || 0);
            exVol += v;
            totalVolumeKg += v;
            if (v > bestVol) {
              bestVol = v;
              bestSet = `${s.weightKg}kg × ${s.reps}`;
            }
          }
        }
        if (exVol > 0 || bestVol >= 0) {
          exercisesSummary.push({ name: ex.name, bestSet, volumeKg: Math.round(exVol) });
        }
      }

      const newLog: CompletedWorkoutLog = {
        id: `log-${Date.now()}`,
        date: getTodayISO(),
        dayTitle: day.title,
        focus: day.focus,
        durationMinutes: Math.max(15, Math.round(sessionSeconds / 60) || day.estimatedMinutes),
        totalVolumeKg: Math.round(totalVolumeKg),
        completedSets,
        totalSets,
        exercisesSummary,
      };

      setState((prev) => ({
        ...prev,
        workoutLogs: [...prev.workoutLogs, newLog],
        // Reset checkmarks on this day and update previousBest hints
        program: {
          ...prev.program,
          days: prev.program.days.map((d) => {
            if (d.id !== day.id) return d;
            return {
              ...d,
              exercises: d.exercises.map((ex) => ({
                ...ex,
                loggedSets: ex.loggedSets.map((s) => ({
                  ...s,
                  previousBest: s.completed
                    ? `${kgToDisplay(s.weightKg, prev.profile.unit)}${prev.profile.unit} × ${s.reps}`
                    : s.previousBest,
                  completed: false,
                })),
              })),
            };
          }),
        },
        activeDayIndex: (prev.activeDayIndex + 1) % Math.max(1, prev.program.days.length),
      }));
      setSessionSeconds(0);
    },
    [sessionSeconds]
  );

  // Rest timer controls
  const startRestTimer = useCallback((seconds: number, label: string) => {
    setRestTimer((prev) => ({
      ...prev,
      visible: true,
      remainingSeconds: seconds,
      totalSeconds: seconds,
      isRunning: true,
      isFinished: false,
      exerciseLabel: label,
    }));
  }, []);

  // Program generation
  const handleGenerateProgram = useCallback(
    async (daysPerWeek: number, focusNotes: string, profileOverride?: UserProfile) => {
      const targetProfile = profileOverride || { ...state.profile, daysPerWeek };
      setIsGeneratingProgram(true);
      setProgramError(null);
      try {
        const nextProgram = await generateWorkoutProgramApi(targetProfile, daysPerWeek, focusNotes);
        setState((prev) => ({
          ...prev,
          profile: { ...targetProfile, daysPerWeek },
          program: nextProgram,
          activeDayIndex: 0,
        }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unable to generate workout split.';
        setProgramError(msg);
        throw err;
      } finally {
        setIsGeneratingProgram(false);
      }
    },
    [state.profile]
  );

  // Profile Save / Reset
  const handleSaveProfile = useCallback(
    async (nextProfile: UserProfile, regenerate: boolean, clearHistory: boolean) => {
      const today = getTodayISO();
      if (clearHistory) {
        setState((prev) => ({
          ...prev,
          profile: nextProfile,
          workoutLogs: [],
          weightHistory: [{ id: `w-${Date.now()}`, date: today, weightKg: nextProfile.weightKg }],
          meals: [],
          coachMessages: [
            createCoachMessage(
              'model',
              `Fresh profile ready, ${nextProfile.name}. I've updated your targets for **${nextProfile.goal}** with **${nextProfile.equipment}**${
                nextProfile.restrictions ? ` and noted your restriction (${nextProfile.restrictions})` : ''
              }. Ask me anytime for form cues, mid-session swaps, or meal macro checks.`
            ),
          ],
        }));
        setSessionSeconds(0);
      } else {
        setState((prev) => {
          const existingToday = prev.weightHistory.find((w) => w.date === today);
          const updatedWeights = existingToday
            ? prev.weightHistory.map((w) =>
                w.date === today ? { ...w, weightKg: nextProfile.weightKg } : w
              )
            : [...prev.weightHistory, { id: `w-${Date.now()}`, date: today, weightKg: nextProfile.weightKg }];
          return {
            ...prev,
            profile: nextProfile,
            weightHistory: updatedWeights,
          };
        });
      }

      if (regenerate) {
        await handleGenerateProgram(nextProfile.daysPerWeek, '', nextProfile);
      }
      setProfileModal({ open: false, isReset: false });
    },
    [handleGenerateProgram]
  );

  // Meals & Weight
  const handleAddMeal = useCallback((meal: Omit<MealEntry, 'id'>) => {
    setState((prev) => ({
      ...prev,
      meals: [{ ...meal, id: `meal-${Date.now()}` }, ...prev.meals],
    }));
  }, []);

  const handleDeleteMeal = useCallback((mealId: string) => {
    setState((prev) => ({
      ...prev,
      meals: prev.meals.filter((m) => m.id !== mealId),
    }));
  }, []);

  const handleLogWeight = useCallback((weightKg: number, date: string) => {
    setState((prev) => {
      const exists = prev.weightHistory.some((w) => w.date === date);
      const nextWeights = exists
        ? prev.weightHistory.map((w) => (w.date === date ? { ...w, weightKg } : w))
        : [...prev.weightHistory, { id: `w-${Date.now()}`, date, weightKg }];
      return {
        ...prev,
        profile: { ...prev.profile, weightKg },
        weightHistory: nextWeights,
      };
    });
  }, []);

  // AI Coach Chat
  const handleSendCoachMessage = useCallback(
    async (text: string, image?: { base64: string; mimeType: string; dataUrl: string }) => {
      const userMsg = createCoachMessage(
        'user',
        text || 'Please analyze this image based on my goals.',
        image?.dataUrl
      );
      setCoachError(null);
      setIsCoachSending(true);

      const historySnapshot = state.coachMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      setState((prev) => ({
        ...prev,
        coachMessages: [...prev.coachMessages, userMsg],
      }));

      try {
        const recentWorkoutsSummary = state.workoutLogs
          .slice(-4)
          .map((l) => `${l.date}: ${l.dayTitle} (${l.totalVolumeKg}kg volume)`)
          .join('; ');

        const reply = await sendCoachMessageApi({
          message: userMsg.content,
          history: historySnapshot,
          imageBase64: image?.base64,
          mimeType: image?.mimeType,
          context: {
            profile: state.profile,
            targets,
            todayNutrition,
            activeDayTitle: activeDay?.title || 'Rest Day',
            activeExercises: activeDay?.exercises.map((e) => e.name) || [],
            recentWorkoutsSummary,
          },
        });

        setState((prev) => ({
          ...prev,
          coachMessages: [...prev.coachMessages, createCoachMessage('model', reply)],
        }));
      } catch (err) {
        setCoachError(err instanceof Error ? err.message : 'Unable to reach AI Coach.');
      } finally {
        setIsCoachSending(false);
      }
    },
    [state.coachMessages, state.profile, state.workoutLogs, targets, todayNutrition, activeDay]
  );

  const handleAskCoachAboutExercise = useCallback((exerciseName: string) => {
    setCoachDraftPrompt(
      `Give me crisp form cues and common mistakes to avoid for ${exerciseName}, keeping my restrictions in mind.`
    );
    setActiveTab('coach');
  }, []);

  return (
    <div className="min-h-screen bg-[#090C10] text-slate-100 flex flex-col lg:flex-row">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-[#0D1117] border-r border-white/[0.08] z-30">
        <div className="px-6 py-5 border-b border-white/[0.06]">
          <span className="font-display text-2xl font-bold tracking-wider text-white whitespace-nowrap">
            KINETIX
          </span>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full h-11 px-3.5 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#B8FF2C]/12 text-[#B8FF2C]'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Athlete Profile Footer */}
        <div className="p-4 border-t border-white/[0.08] space-y-3">
          <div className="px-1">
            <p className="text-sm font-semibold text-white truncate">{state.profile.name}</p>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {state.profile.goal} · {kgToDisplay(state.profile.weightKg, state.profile.unit)}{' '}
              {state.profile.unit}
            </p>
            <p className="font-mono text-[11px] text-slate-500 tabular-nums mt-1">
              {targets.targetCalories} kcal · P{targets.protein} C{targets.carbs} F{targets.fats}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setProfileModal({ open: true, isReset: false })}
              className="h-10 px-2.5 rounded-lg border border-white/[0.10] text-xs font-medium text-slate-200 hover:text-white hover:bg-white/[0.05] inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <UserCog className="h-3.5 w-3.5" />
              Profile
            </button>
            <button
              type="button"
              onClick={() => setProfileModal({ open: true, isReset: true })}
              className="h-10 px-2.5 rounded-lg border border-white/[0.10] text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.05] inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              New Profile
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Compact Top Bar (52px) */}
      <header className="lg:hidden sticky top-0 z-30 h-[52px] px-4 bg-[#0D1117]/95 backdrop-blur-md border-b border-white/[0.08] flex items-center justify-between gap-4">
        <span className="font-display text-xl font-bold tracking-wider text-white whitespace-nowrap shrink-0">
          KINETIX
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setProfileModal({ open: true, isReset: false })}
            className="h-9 px-3 rounded-lg border border-white/[0.10] text-xs font-medium text-slate-200 hover:text-white inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <UserCog className="h-3.5 w-3.5" />
            Profile
          </button>
          <button
            type="button"
            onClick={() => setProfileModal({ open: true, isReset: true })}
            aria-label="Reset or create new profile"
            className="h-9 w-9 rounded-lg border border-white/[0.10] text-slate-400 hover:text-white inline-flex items-center justify-center"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 lg:pl-64 pb-24 lg:pb-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {activeTab === 'workout' && (
            <WorkoutView
              profile={state.profile}
              program={state.program}
              activeDayIndex={state.activeDayIndex}
              sessionSeconds={sessionSeconds}
              restTimer={restTimer}
              onSelectDay={(idx) => setState((prev) => ({ ...prev, activeDayIndex: idx }))}
              onUpdateSet={handleUpdateSet}
              onAddSet={handleAddSet}
              onRemoveSet={handleRemoveSet}
              onSwapExercise={handleSwapExercise}
              onFinishWorkout={handleFinishWorkout}
              onStartRestTimer={startRestTimer}
              onTimerToggle={() =>
                setRestTimer((prev) => {
                  if (prev.isFinished) {
                    return {
                      ...prev,
                      remainingSeconds: prev.totalSeconds,
                      isRunning: true,
                      isFinished: false,
                    };
                  }
                  return { ...prev, isRunning: !prev.isRunning };
                })
              }
              onTimerReset={() =>
                setRestTimer((prev) => ({
                  ...prev,
                  remainingSeconds: prev.totalSeconds,
                  isRunning: false,
                  isFinished: false,
                }))
              }
              onTimerSetDuration={(sec) =>
                setRestTimer((prev) => ({
                  ...prev,
                  totalSeconds: sec,
                  remainingSeconds: sec,
                  isRunning: true,
                  isFinished: false,
                }))
              }
              onTimerAddSeconds={(delta) =>
                setRestTimer((prev) => ({
                  ...prev,
                  totalSeconds: prev.totalSeconds + delta,
                  remainingSeconds: prev.remainingSeconds + delta,
                  isFinished: false,
                }))
              }
              onTimerToggleSound={() =>
                setRestTimer((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
              }
              onTimerDismiss={() =>
                setRestTimer((prev) => ({ ...prev, visible: false, isRunning: false }))
              }
              onAskCoachAboutExercise={handleAskCoachAboutExercise}
            />
          )}

          {activeTab === 'program' && (
            <ProgramBuilderView
              profile={state.profile}
              program={state.program}
              isGenerating={isGeneratingProgram}
              generationError={programError}
              onGenerateProgram={(days, notes) => handleGenerateProgram(days, notes)}
              onStartDay={(idx) => {
                setState((prev) => ({ ...prev, activeDayIndex: idx }));
                setActiveTab('workout');
              }}
              onEditProfile={() => setProfileModal({ open: true, isReset: false })}
            />
          )}

          {activeTab === 'nutrition' && (
            <NutritionView
              profile={state.profile}
              targets={targets}
              meals={state.meals}
              onAddMeal={handleAddMeal}
              onDeleteMeal={handleDeleteMeal}
              onEditProfile={() => setProfileModal({ open: true, isReset: false })}
            />
          )}

          {activeTab === 'progress' && (
            <ProgressView
              profile={state.profile}
              workoutLogs={state.workoutLogs}
              weightHistory={state.weightHistory}
              onLogWeight={handleLogWeight}
            />
          )}

          {activeTab === 'coach' && (
            <CoachView
              profile={state.profile}
              targets={targets}
              activeDayTitle={activeDay?.title || 'Rest Day'}
              messages={state.coachMessages}
              isSending={isCoachSending}
              error={coachError}
              draftPrompt={coachDraftPrompt}
              onConsumeDraftPrompt={() => setCoachDraftPrompt(undefined)}
              onSendMessage={handleSendCoachMessage}
              onClearChat={() => {
                setCoachError(null);
                setState((prev) => ({
                  ...prev,
                  coachMessages: [
                    createCoachMessage(
                      'model',
                      `Thread cleared, ${prev.profile.name}. What are we working on today — form checks, a mid-session swap, or meal macros?`
                    ),
                  ],
                }));
              }}
            />
          )}
        </div>
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (64px) */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 h-16 bg-[#0D1117]/95 backdrop-blur-md border-t border-white/[0.08] grid grid-cols-5 items-center"
        aria-label="Mobile navigation"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`h-full flex flex-col items-center justify-center gap-1 transition-colors ${
                active ? 'text-[#B8FF2C]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium tracking-tight whitespace-nowrap">
                {item.shortLabel}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Profile Onboarding / Edit / Reset Modal */}
      {profileModal.open && (
        <ProfileOnboardingModal
          initialProfile={state.profile}
          isResetFlow={profileModal.isReset}
          isGeneratingProgram={isGeneratingProgram}
          onSave={handleSaveProfile}
          onClose={() => setProfileModal({ open: false, isReset: false })}
        />
      )}
    </div>
  );
}
