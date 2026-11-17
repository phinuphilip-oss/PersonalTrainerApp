import React, { useMemo, useRef, useState } from 'react';
import { AlertCircle, Camera, Check, Loader2, Plus, Sparkles, Trash2, X } from 'lucide-react';
import { AnalyzedMealResult, MealEntry, NutritionTargets, UserProfile } from '../types';
import { analyzeMealApi, compressImageFile } from '../utils/api';
import { getTodayISO } from '../utils/calculations';

interface NutritionViewProps {
  profile: UserProfile;
  targets: NutritionTargets;
  meals: MealEntry[];
  onAddMeal: (meal: Omit<MealEntry, 'id'>) => void;
  onDeleteMeal: (mealId: string) => void;
  onEditProfile: () => void;
}

export const NutritionView: React.FC<NutritionViewProps> = ({
  profile,
  targets,
  meals,
  onAddMeal,
  onDeleteMeal,
  onEditProfile,
}) => {
  const today = getTodayISO();
  const todayMeals = useMemo(() => meals.filter((m) => m.date === today), [meals, today]);

  const totals = useMemo(() => {
    return todayMeals.reduce(
      (acc, m) => ({
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fats: acc.fats + m.fats,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  }, [todayMeals]);

  // AI Meal Analyzer State
  const [description, setDescription] = useState('');
  const [imageData, setImageData] = useState<{ base64: string; mimeType: string; dataUrl: string } | null>(
    null
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analyzedResult, setAnalyzedResult] = useState<AnalyzedMealResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Manual Quick-Add State
  const [showManual, setShowManual] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualCals, setManualCals] = useState('');
  const [manualProtein, setManualProtein] = useState('');
  const [manualCarbs, setManualCarbs] = useState('');
  const [manualFats, setManualFats] = useState('');

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalyzeError(null);
    try {
      const compressed = await compressImageFile(file);
      setImageData(compressed);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Unable to read image.');
    }
  };

  const handleAnalyzeMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() && !imageData) {
      setAnalyzeError('Enter a meal description or attach a photo first.');
      return;
    }
    setAnalyzing(true);
    setAnalyzeError(null);
    setAnalyzedResult(null);
    try {
      const result = await analyzeMealApi({
        description: description.trim() || undefined,
        imageBase64: imageData?.base64,
        mimeType: imageData?.mimeType,
        profile,
      });
      setAnalyzedResult(result);
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Meal analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLogAnalyzed = () => {
    if (!analyzedResult) return;
    onAddMeal({
      date: today,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      name: analyzedResult.mealName,
      calories: analyzedResult.calories,
      protein: analyzedResult.protein,
      carbs: analyzedResult.carbs,
      fats: analyzedResult.fats,
      notes: analyzedResult.coachingNote,
    });
    setAnalyzedResult(null);
    setDescription('');
    setImageData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;
    const protein = Math.max(0, Number(manualProtein) || 0);
    const carbs = Math.max(0, Number(manualCarbs) || 0);
    const fats = Math.max(0, Number(manualFats) || 0);
    const calories = Number(manualCals) || protein * 4 + carbs * 4 + fats * 9;

    onAddMeal({
      date: today,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      name: manualName.trim(),
      calories: Math.round(calories),
      protein: Math.round(protein),
      carbs: Math.round(carbs),
      fats: Math.round(fats),
    });

    setManualName('');
    setManualCals('');
    setManualProtein('');
    setManualCarbs('');
    setManualFats('');
    setShowManual(false);
  };

  const macroRows = [
    {
      label: 'Calories',
      current: totals.calories,
      target: targets.targetCalories,
      unit: 'kcal',
      barColor: 'bg-[#B8FF2C]',
    },
    {
      label: 'Protein',
      current: totals.protein,
      target: targets.protein,
      unit: 'g',
      barColor: 'bg-[#38BDF8]',
    },
    {
      label: 'Carbohydrates',
      current: totals.carbs,
      target: targets.carbs,
      unit: 'g',
      barColor: 'bg-slate-200',
    },
    {
      label: 'Fats',
      current: totals.fats,
      target: targets.fats,
      unit: 'g',
      barColor: 'bg-amber-400',
    },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400">
            Mifflin-St Jeor Model · {profile.goal} · {targets.calorieDeltaLabel}
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white mt-0.5">
            Nutrition & Macros
          </h1>
        </div>
        <button
          type="button"
          onClick={onEditProfile}
          className="h-11 px-4 rounded-lg border border-white/[0.10] text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/[0.05] transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          Recalculate Metrics
        </button>
      </header>

      {/* Metabolic Baseline + Macro Progress */}
      <section className="rounded-xl bg-[#11161D] border border-white/[0.08] p-5 sm:p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-5 border-b border-white/[0.06]">
          <div>
            <p className="text-xs text-slate-400">Basal Metabolic Rate (BMR)</p>
            <p className="font-mono text-2xl font-semibold text-white tabular-nums mt-1">
              {targets.bmr.toLocaleString()} <span className="text-xs font-normal text-slate-500">kcal</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Maintenance (TDEE)</p>
            <p className="font-mono text-2xl font-semibold text-white tabular-nums mt-1">
              {targets.tdee.toLocaleString()} <span className="text-xs font-normal text-slate-500">kcal</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Daily Target</p>
            <p className="font-mono text-2xl font-semibold text-[#B8FF2C] tabular-nums mt-1">
              {targets.targetCalories.toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-500">kcal</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Remaining Today</p>
            <p className="font-mono text-2xl font-semibold text-white tabular-nums mt-1">
              {Math.max(0, targets.targetCalories - totals.calories).toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-500">kcal</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {macroRows.map((row) => {
            const pct = row.target > 0 ? Math.min(100, Math.round((row.current / row.target) * 100)) : 0;
            return (
              <div key={row.label} className="space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-medium text-slate-300">{row.label}</span>
                  <span className="font-mono text-xs text-slate-400 tabular-nums">
                    <strong className="text-white font-semibold">{row.current}</strong> / {row.target}
                    {row.unit === 'g' ? 'g' : ''}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#090C10] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${row.barColor} transition-all duration-300`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[11px] font-mono text-slate-500 tabular-nums">
                  {pct}% of target · {Math.max(0, row.target - row.current)}
                  {row.unit === 'g' ? 'g' : ' kcal'} left
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* AI Meal Analyzer + Daily Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* AI Meal Photo / Text Analyzer */}
        <section className="lg:col-span-5 rounded-xl bg-[#11161D] border border-white/[0.08] p-5 space-y-4">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-wide text-white">
              AI Meal Macro Analyzer
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Describe what you ate or upload a meal photo for instant macro estimation.
            </p>
          </div>

          <form onSubmit={handleAnalyzeMeal} className="space-y-3.5">
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 200g grilled salmon, 1 cup cooked quinoa, steamed asparagus with 1 tbsp olive oil"
              className="w-full rounded-lg bg-[#090C10] border border-white/[0.10] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#B8FF2C] focus:outline-none resize-none"
            />

            {imageData && (
              <div className="relative rounded-lg overflow-hidden border border-white/[0.10] bg-[#090C10]">
                <img
                  src={imageData.dataUrl}
                  alt="Selected meal preview"
                  className="h-40 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageData(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  aria-label="Remove meal photo"
                  className="absolute top-2 right-2 h-8 w-8 rounded-lg bg-black/75 text-white hover:bg-black inline-flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImagePick}
                className="hidden"
                id="meal-photo-upload"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-11 px-3.5 rounded-lg border border-white/[0.10] bg-[#090C10] hover:bg-white/[0.04] text-xs font-semibold text-slate-200 inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                <Camera className="h-4 w-4 text-slate-400" />
                {imageData ? 'Change Photo' : 'Add Photo'}
              </button>

              <button
                type="submit"
                disabled={analyzing}
                className="flex-1 h-11 px-4 rounded-lg bg-[#B8FF2C] text-[#090C10] text-xs font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#c8ff57] transition-colors disabled:opacity-60 whitespace-nowrap"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Estimate Macros
                  </>
                )}
              </button>
            </div>
          </form>

          {analyzeError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-200 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span>{analyzeError}</span>
            </div>
          )}

          {analyzedResult && (
            <div className="rounded-xl bg-[#090C10] border border-[#B8FF2C]/35 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-white">{analyzedResult.mealName}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Confidence: {analyzedResult.confidence}
                  </p>
                </div>
                <span className="font-mono text-sm font-semibold text-[#B8FF2C] tabular-nums shrink-0">
                  {analyzedResult.calories} kcal
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-xs tabular-nums">
                <div className="rounded bg-[#11161D] px-2.5 py-1.5">
                  <span className="text-slate-400 block text-[10px] font-sans">Protein</span>
                  <span className="text-[#38BDF8] font-semibold">{analyzedResult.protein}g</span>
                </div>
                <div className="rounded bg-[#11161D] px-2.5 py-1.5">
                  <span className="text-slate-400 block text-[10px] font-sans">Carbs</span>
                  <span className="text-white font-semibold">{analyzedResult.carbs}g</span>
                </div>
                <div className="rounded bg-[#11161D] px-2.5 py-1.5">
                  <span className="text-slate-400 block text-[10px] font-sans">Fats</span>
                  <span className="text-amber-400 font-semibold">{analyzedResult.fats}g</span>
                </div>
              </div>

              {analyzedResult.ingredients.length > 0 && (
                <p className="text-xs text-slate-400">
                  Detected: {analyzedResult.ingredients.join(', ')}
                </p>
              )}
              <p className="text-xs text-slate-300 leading-relaxed">{analyzedResult.coachingNote}</p>

              <button
                type="button"
                onClick={handleLogAnalyzed}
                className="w-full h-10 rounded-lg bg-[#B8FF2C] text-[#090C10] text-xs font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-[#c8ff57] transition-colors"
              >
                <Check className="h-4 w-4" />
                Log Meal to Today
              </button>
            </div>
          )}
        </section>

        {/* Today's Meal Ledger */}
        <section className="lg:col-span-7 rounded-xl bg-[#11161D] border border-white/[0.08] p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-wide text-white">
                Today&apos;s Intake Log
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {todayMeals.length} {todayMeals.length === 1 ? 'meal' : 'meals'} logged today
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowManual((v) => !v)}
              className="h-10 px-3.5 rounded-lg border border-white/[0.10] text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/[0.05] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Quick Add
            </button>
          </div>

          {showManual && (
            <form
              onSubmit={handleManualSubmit}
              className="rounded-xl bg-[#090C10] border border-white/[0.08] p-4 space-y-3"
            >
              <input
                type="text"
                required
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Meal name (e.g. Turkey wrap & side salad)"
                className="w-full h-10 rounded-lg bg-[#11161D] border border-white/[0.10] px-3 text-sm text-white placeholder:text-slate-500 focus:border-[#B8FF2C] focus:outline-none"
              />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input
                  type="number"
                  min={0}
                  value={manualCals}
                  onChange={(e) => setManualCals(e.target.value)}
                  placeholder="Calories"
                  className="h-10 rounded-lg bg-[#11161D] border border-white/[0.10] px-3 font-mono text-xs text-white placeholder:text-slate-500 tabular-nums focus:border-[#B8FF2C] focus:outline-none"
                />
                <input
                  type="number"
                  min={0}
                  value={manualProtein}
                  onChange={(e) => setManualProtein(e.target.value)}
                  placeholder="Protein (g)"
                  className="h-10 rounded-lg bg-[#11161D] border border-white/[0.10] px-3 font-mono text-xs text-white placeholder:text-slate-500 tabular-nums focus:border-[#B8FF2C] focus:outline-none"
                />
                <input
                  type="number"
                  min={0}
                  value={manualCarbs}
                  onChange={(e) => setManualCarbs(e.target.value)}
                  placeholder="Carbs (g)"
                  className="h-10 rounded-lg bg-[#11161D] border border-white/[0.10] px-3 font-mono text-xs text-white placeholder:text-slate-500 tabular-nums focus:border-[#B8FF2C] focus:outline-none"
                />
                <input
                  type="number"
                  min={0}
                  value={manualFats}
                  onChange={(e) => setManualFats(e.target.value)}
                  placeholder="Fats (g)"
                  className="h-10 rounded-lg bg-[#11161D] border border-white/[0.10] px-3 font-mono text-xs text-white placeholder:text-slate-500 tabular-nums focus:border-[#B8FF2C] focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManual(false)}
                  className="h-9 px-3 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-lg bg-[#B8FF2C] text-[#090C10] text-xs font-semibold hover:bg-[#c8ff57]"
                >
                  Save Meal
                </button>
              </div>
            </form>
          )}

          {todayMeals.length === 0 ? (
            <div className="py-10 text-center space-y-2 border-t border-white/[0.06]">
              <p className="text-sm text-slate-300">No meals logged today yet.</p>
              <p className="text-xs text-slate-500">
                Use the AI Meal Macro Analyzer or Quick Add to track your daily intake.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06] border-t border-white/[0.06]">
              {todayMeals.map((meal) => (
                <div key={meal.id} className="py-3.5 flex items-start justify-between gap-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                      <span>{meal.time}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-300 font-semibold">{meal.calories} kcal</span>
                    </div>
                    <p className="text-sm font-semibold text-white">{meal.name}</p>
                    <p className="font-mono text-xs text-slate-400 tabular-nums">
                      P {meal.protein}g · C {meal.carbs}g · F {meal.fats}g
                    </p>
                    {meal.notes && <p className="text-xs text-slate-500">{meal.notes}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => onDeleteMeal(meal.id)}
                    aria-label={`Delete ${meal.name}`}
                    className="h-9 w-9 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 inline-flex items-center justify-center shrink-0 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
