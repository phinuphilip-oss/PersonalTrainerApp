import React, { useMemo, useState } from 'react';
import { Loader2, Sparkles, X } from 'lucide-react';
import { Equipment, FitnessLevel, Gender, PrimaryGoal, UserProfile, WeightUnit } from '../types';
import { calculateNutritionTargets, displayToKg, kgToDisplay } from '../utils/calculations';

interface ProfileOnboardingModalProps {
  initialProfile: UserProfile;
  isResetFlow: boolean;
  isGeneratingProgram: boolean;
  onSave: (profile: UserProfile, regenerateProgram: boolean, clearHistory: boolean) => Promise<void>;
  onClose: () => void;
}

const LEVELS: FitnessLevel[] = ['Beginner', 'Intermediate', 'Advanced'];
const GOALS: PrimaryGoal[] = ['Hypertrophy', 'Fat Loss', 'Strength', 'Endurance'];
const EQUIPMENTS: Equipment[] = ['Full Gym', 'Dumbbells Only', 'Bodyweight'];
const GENDERS: Gender[] = ['Male', 'Female', 'Non-binary'];

export const ProfileOnboardingModal: React.FC<ProfileOnboardingModalProps> = ({
  initialProfile,
  isResetFlow,
  isGeneratingProgram,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(isResetFlow ? '' : initialProfile.name);
  const [age, setAge] = useState(initialProfile.age);
  const [gender, setGender] = useState<Gender>(initialProfile.gender);
  const [heightCm, setHeightCm] = useState(initialProfile.heightCm);
  const [unit, setUnit] = useState<WeightUnit>(initialProfile.unit);
  const [weightDisplay, setWeightDisplay] = useState(
    kgToDisplay(initialProfile.weightKg, initialProfile.unit)
  );
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>(initialProfile.fitnessLevel);
  const [goal, setGoal] = useState<PrimaryGoal>(initialProfile.goal);
  const [equipment, setEquipment] = useState<Equipment>(initialProfile.equipment);
  const [daysPerWeek, setDaysPerWeek] = useState(initialProfile.daysPerWeek);
  const [restrictions, setRestrictions] = useState(isResetFlow ? '' : initialProfile.restrictions);
  const [regenerateProgram, setRegenerateProgram] = useState(isResetFlow);
  const [error, setError] = useState<string | null>(null);

  const draftProfile: UserProfile = useMemo(
    () => ({
      name: name.trim() || 'Athlete',
      age: Math.max(14, Math.min(90, Number(age) || 28)),
      gender,
      heightCm: Math.max(120, Math.min(230, Number(heightCm) || 175)),
      weightKg: Math.max(35, Math.min(220, displayToKg(Number(weightDisplay) || 75, unit))),
      fitnessLevel,
      goal,
      equipment,
      daysPerWeek,
      restrictions: restrictions.trim(),
      unit,
    }),
    [name, age, gender, heightCm, weightDisplay, unit, fitnessLevel, goal, equipment, daysPerWeek, restrictions]
  );

  const targets = useMemo(() => calculateNutritionTargets(draftProfile), [draftProfile]);

  const handleUnitChange = (nextUnit: WeightUnit) => {
    if (nextUnit === unit) return;
    const currentKg = displayToKg(Number(weightDisplay) || 75, unit);
    setUnit(nextUnit);
    setWeightDisplay(kgToDisplay(currentKg, nextUnit));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await onSave(draftProfile, regenerateProgram, isResetFlow);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-[#11161D] border border-white/[0.10] overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-white/[0.08]">
          <div>
            <h2 id="profile-modal-title" className="font-display text-2xl font-bold tracking-wide text-white">
              {isResetFlow ? 'Create New Athlete Profile' : 'Athlete Profile & Targets'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isResetFlow
                ? 'Configure your baseline metrics to reset logs and build a fresh training block.'
                : 'Update metrics, equipment, or injury restrictions. Targets recalculate live.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isGeneratingProgram}
            aria-label="Close profile editor"
            className="h-10 w-10 rounded-lg border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.05] inline-flex items-center justify-center shrink-0 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
          {/* Live Metabolic & Macro Preview */}
          <div className="rounded-xl bg-[#090C10] border border-white/[0.08] p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-medium text-slate-400">Live Metabolic Calculation</span>
              <span className="text-xs font-mono text-[#B8FF2C] tabular-nums">{targets.calorieDeltaLabel}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <p className="text-[11px] text-slate-400">BMR</p>
                <p className="font-mono text-base font-semibold text-white tabular-nums">{targets.bmr} kcal</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">TDEE</p>
                <p className="font-mono text-base font-semibold text-white tabular-nums">{targets.tdee} kcal</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">Daily Target</p>
                <p className="font-mono text-base font-semibold text-[#B8FF2C] tabular-nums">
                  {targets.targetCalories} kcal
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">Protein / Carbs</p>
                <p className="font-mono text-base font-semibold text-white tabular-nums">
                  {targets.protein}g / {targets.carbs}g
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">Fats</p>
                <p className="font-mono text-base font-semibold text-white tabular-nums">{targets.fats}g</p>
              </div>
            </div>
          </div>

          {/* Personal Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="athlete-name" className="block text-xs font-medium text-slate-300 mb-1.5">
                Name
              </label>
              <input
                id="athlete-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jordan Taylor"
                className="w-full h-11 rounded-lg bg-[#090C10] border border-white/[0.10] px-3.5 text-sm text-white placeholder:text-slate-500 focus:border-[#B8FF2C] focus:outline-none"
              />
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-300 mb-1.5">Gender</span>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-[#090C10] border border-white/[0.10]">
                {GENDERS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`h-9 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                      gender === g ? 'bg-white/12 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="athlete-age" className="block text-xs font-medium text-slate-300 mb-1.5">
                Age (years)
              </label>
              <input
                id="athlete-age"
                type="number"
                min={14}
                max={90}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full h-11 rounded-lg bg-[#090C10] border border-white/[0.10] px-3.5 font-mono text-sm text-white tabular-nums focus:border-[#B8FF2C] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="athlete-height" className="block text-xs font-medium text-slate-300 mb-1.5">
                Height (cm)
              </label>
              <input
                id="athlete-height"
                type="number"
                min={120}
                max={230}
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="w-full h-11 rounded-lg bg-[#090C10] border border-white/[0.10] px-3.5 font-mono text-sm text-white tabular-nums focus:border-[#B8FF2C] focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="athlete-weight" className="text-xs font-medium text-slate-300">
                  Weight ({unit})
                </label>
                <div className="flex items-center gap-1">
                  {(['kg', 'lb'] as WeightUnit[]).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => handleUnitChange(u)}
                      className={`px-2 py-0.5 rounded text-[11px] font-mono uppercase transition-colors ${
                        unit === u ? 'bg-[#B8FF2C] text-[#090C10] font-semibold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <input
                id="athlete-weight"
                type="number"
                step="0.1"
                min={35}
                max={450}
                value={weightDisplay}
                onChange={(e) => setWeightDisplay(Number(e.target.value))}
                className="w-full h-11 rounded-lg bg-[#090C10] border border-white/[0.10] px-3.5 font-mono text-sm text-white tabular-nums focus:border-[#B8FF2C] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="athlete-days" className="block text-xs font-medium text-slate-300 mb-1.5">
                Training Days / Week
              </label>
              <div className="grid grid-cols-4 gap-1.5 p-1 rounded-lg bg-[#090C10] border border-white/[0.10]">
                {[3, 4, 5, 6].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDaysPerWeek(d)}
                    className={`h-9 rounded-md font-mono text-xs font-semibold tabular-nums transition-colors ${
                      daysPerWeek === d ? 'bg-white/12 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Training Context */}
          <div className="space-y-4">
            <div>
              <span className="block text-xs font-medium text-slate-300 mb-1.5">Fitness Level</span>
              <div className="grid grid-cols-3 gap-2">
                {LEVELS.map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setFitnessLevel(lvl)}
                    className={`h-11 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap ${
                      fitnessLevel === lvl
                        ? 'bg-[#B8FF2C]/12 border-[#B8FF2C] text-[#B8FF2C]'
                        : 'bg-[#090C10] border-white/[0.08] text-slate-300 hover:border-white/20'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-300 mb-1.5">Primary Goal</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {GOALS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGoal(g)}
                    className={`h-11 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap ${
                      goal === g
                        ? 'bg-[#B8FF2C]/12 border-[#B8FF2C] text-[#B8FF2C]'
                        : 'bg-[#090C10] border-white/[0.08] text-slate-300 hover:border-white/20'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-300 mb-1.5">Available Equipment</span>
              <div className="grid grid-cols-3 gap-2">
                {EQUIPMENTS.map((eq) => (
                  <button
                    key={eq}
                    type="button"
                    onClick={() => setEquipment(eq)}
                    className={`h-11 rounded-lg border text-xs font-semibold transition-colors whitespace-nowrap ${
                      equipment === eq
                        ? 'bg-[#B8FF2C]/12 border-[#B8FF2C] text-[#B8FF2C]'
                        : 'bg-[#090C10] border-white/[0.08] text-slate-300 hover:border-white/20'
                    }`}
                  >
                    {eq}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="athlete-restrictions" className="block text-xs font-medium text-slate-300 mb-1.5">
                Injury or Mobility Restrictions
              </label>
              <textarea
                id="athlete-restrictions"
                rows={2}
                value={restrictions}
                onChange={(e) => setRestrictions(e.target.value)}
                placeholder="e.g. Left knee meniscus sensitivity on deep lunges, limited overhead mobility..."
                className="w-full rounded-lg bg-[#090C10] border border-white/[0.10] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#B8FF2C] focus:outline-none resize-none"
              />
            </div>

            <label className="flex items-start gap-3 rounded-xl bg-[#090C10] border border-white/[0.08] p-3.5 cursor-pointer">
              <input
                type="checkbox"
                checked={regenerateProgram}
                onChange={(e) => setRegenerateProgram(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#B8FF2C]"
              />
              <div>
                <p className="text-sm font-medium text-white">Generate a new tailored AI workout split on save</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rebuilds your {daysPerWeek}-day program for {equipment} and {goal}.
                </p>
              </div>
            </label>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={isGeneratingProgram}
              className="h-11 px-4 rounded-lg border border-white/[0.10] text-sm font-medium text-slate-300 hover:text-white hover:bg-white/[0.05] transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGeneratingProgram}
              className="h-11 px-5 rounded-lg bg-[#B8FF2C] text-[#090C10] text-sm font-semibold inline-flex items-center gap-2 hover:bg-[#c8ff57] transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {isGeneratingProgram ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Building Split...
                </>
              ) : regenerateProgram ? (
                <>
                  <Sparkles className="h-4 w-4" />
                  {isResetFlow ? 'Reset & Generate Split' : 'Save & Generate Split'}
                </>
              ) : (
                'Save Profile'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
