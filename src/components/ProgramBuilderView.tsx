import React, { useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { UserProfile, WorkoutProgram } from '../types';
import { kgToDisplay } from '../utils/calculations';

interface ProgramBuilderViewProps {
  profile: UserProfile;
  program: WorkoutProgram;
  isGenerating: boolean;
  generationError: string | null;
  onGenerateProgram: (daysPerWeek: number, focusNotes: string) => Promise<void>;
  onStartDay: (dayIndex: number) => void;
  onEditProfile: () => void;
}

export const ProgramBuilderView: React.FC<ProgramBuilderViewProps> = ({
  profile,
  program,
  isGenerating,
  generationError,
  onGenerateProgram,
  onStartDay,
  onEditProfile,
}) => {
  const [daysPerWeek, setDaysPerWeek] = useState(profile.daysPerWeek);
  const [focusNotes, setFocusNotes] = useState('');

  const weeklyStats = useMemo(() => {
    const muscleSetCounts: Record<string, number> = {};
    let totalWeeklySets = 0;

    for (const day of program.days) {
      for (const ex of day.exercises) {
        const count = ex.loggedSets.length || ex.sets;
        totalWeeklySets += count;
        const primary = ex.muscleGroup.split('&')[0].trim();
        muscleSetCounts[primary] = (muscleSetCounts[primary] || 0) + count;
      }
    }

    const sortedMuscles = Object.entries(muscleSetCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return { totalWeeklySets, sortedMuscles };
  }, [program]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onGenerateProgram(daysPerWeek, focusNotes);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400">
            {profile.goal} · {profile.fitnessLevel} · {profile.equipment}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mt-0.5">
            Program Builder
          </h1>
        </div>
        <button
          type="button"
          onClick={onEditProfile}
          className="h-11 px-4 rounded-lg border border-white/[0.10] text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/[0.05] transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          Update Equipment & Restrictions
        </button>
      </header>

      {/* AI Generator Control Panel */}
      <section className="rounded-xl bg-[#11161D] border border-white/[0.08] p-5 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            <div className="shrink-0">
              <span className="block text-xs font-medium text-slate-300 mb-1.5">Weekly Split Frequency</span>
              <div className="grid grid-cols-4 gap-1.5 p-1 rounded-lg bg-[#090C10] border border-white/[0.10]">
                {[3, 4, 5, 6].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDaysPerWeek(d)}
                    className={`h-9 w-14 rounded-md font-mono text-xs font-semibold tabular-nums transition-colors ${
                      daysPerWeek === d ? 'bg-white/12 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {d} Days
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <label htmlFor="program-focus-notes" className="block text-xs font-medium text-slate-300 mb-1.5">
                Custom Emphasis or Constraints (Optional)
              </label>
              <input
                id="program-focus-notes"
                type="text"
                value={focusNotes}
                onChange={(e) => setFocusNotes(e.target.value)}
                placeholder="e.g. Prioritize upper back thickness, keep sessions under 45 minutes..."
                className="w-full h-11 rounded-lg bg-[#090C10] border border-white/[0.10] px-3.5 text-sm text-white placeholder:text-slate-500 focus:border-[#B8FF2C] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="h-11 px-5 rounded-lg bg-[#B8FF2C] text-[#090C10] text-xs font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#c8ff57] transition-colors disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating Split...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate AI Program
                </>
              )}
            </button>
          </div>

          {profile.restrictions && (
            <p className="text-xs text-slate-400">
              Active restriction guardrails: <span className="text-slate-200">{profile.restrictions}</span>
            </p>
          )}

          {generationError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{generationError}</span>
            </div>
          )}
        </form>
      </section>

      {/* Active Program Overview + Weekly Volume */}
      <section className="rounded-xl bg-[#11161D] border border-white/[0.08] p-5 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-wide text-white">
              {program.programName}
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl">{program.splitSummary}</p>
          </div>
          <div className="text-left md:text-right shrink-0">
            <p className="text-[11px] text-slate-400">Weekly Working Sets</p>
            <p className="font-mono text-2xl font-semibold text-[#B8FF2C] tabular-nums">
              {weeklyStats.totalWeeklySets} sets
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {weeklyStats.sortedMuscles.map(([muscle, count]) => (
            <div key={muscle} className="rounded-lg bg-[#090C10] border border-white/[0.06] px-3.5 py-2.5">
              <p className="text-xs text-slate-400 truncate">{muscle}</p>
              <p className="font-mono text-base font-semibold text-white tabular-nums mt-0.5">
                {count} <span className="text-xs font-normal text-slate-500">sets/wk</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Split Days Grid */}
      {isGenerating ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: daysPerWeek }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-xl bg-[#11161D] border border-white/[0.08] p-5 space-y-3 animate-pulse"
            >
              <div className="h-5 w-48 bg-white/[0.08] rounded" />
              <div className="h-3.5 w-32 bg-white/[0.05] rounded" />
              <div className="space-y-2 pt-3">
                <div className="h-9 w-full bg-white/[0.04] rounded" />
                <div className="h-9 w-full bg-white/[0.04] rounded" />
                <div className="h-9 w-full bg-white/[0.04] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {program.days.map((day, idx) => (
            <article
              key={day.id}
              className="rounded-xl bg-[#11161D] border border-white/[0.08] flex flex-col justify-between overflow-hidden"
            >
              <div>
                <div className="px-5 py-4 border-b border-white/[0.06] flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-slate-400 tabular-nums">
                      Day {day.dayNumber} · ~{day.estimatedMinutes} min · {day.exercises.length} exercises
                    </p>
                    <h3 className="font-display text-xl font-bold tracking-wide text-white mt-0.5">
                      {day.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{day.focus}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onStartDay(idx)}
                    className="h-10 px-3.5 rounded-lg bg-white/[0.07] hover:bg-[#B8FF2C] hover:text-[#090C10] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                  >
                    Train
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-white/[0.05] px-5">
                  {day.exercises.map((ex) => (
                    <div key={ex.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-100 truncate">{ex.name}</p>
                        <p className="text-xs text-slate-500 truncate">{ex.muscleGroup}</p>
                      </div>
                      <div className="text-right font-mono text-xs text-slate-300 tabular-nums shrink-0">
                        <span>
                          {ex.loggedSets.length || ex.sets} × {ex.reps}
                        </span>
                        <span className="text-slate-500 ml-2">
                          {ex.suggestedWeightKg > 0
                            ? `${kgToDisplay(ex.suggestedWeightKg, profile.unit)}${profile.unit}`
                            : 'BW'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
