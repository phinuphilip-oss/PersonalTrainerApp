import { NutritionTargets, UserProfile, WeightUnit } from '../types';

export function calculateNutritionTargets(profile: UserProfile): NutritionTargets {
  // Mifflin-St Jeor Equation
  const base = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age;
  let bmr: number;
  if (profile.gender === 'Male') {
    bmr = Math.round(base + 5);
  } else if (profile.gender === 'Female') {
    bmr = Math.round(base - 161);
  } else {
    bmr = Math.round(base - 78);
  }

  // Activity multiplier derived from training frequency & fitness level
  let activityFactor = 1.375;
  if (profile.daysPerWeek <= 2) activityFactor = 1.32;
  else if (profile.daysPerWeek === 3) activityFactor = 1.45;
  else if (profile.daysPerWeek === 4) activityFactor = 1.55;
  else if (profile.daysPerWeek === 5) activityFactor = 1.65;
  else activityFactor = 1.725;

  if (profile.fitnessLevel === 'Advanced') {
    activityFactor += 0.05;
  }

  const tdee = Math.round(bmr * activityFactor);

  // Goal-specific calorie & macro allocation
  let targetCalories = tdee;
  let calorieDeltaLabel = 'Maintenance';
  let proteinPerKg = 2.0;
  let fatCalorieRatio = 0.25;

  switch (profile.goal) {
    case 'Hypertrophy':
      targetCalories = Math.round(tdee + 250);
      calorieDeltaLabel = '+250 kcal lean surplus';
      proteinPerKg = 2.1;
      fatCalorieRatio = 0.25;
      break;
    case 'Fat Loss':
      targetCalories = Math.max(1350, Math.round(tdee - 450));
      calorieDeltaLabel = '-450 kcal controlled deficit';
      proteinPerKg = 2.2;
      fatCalorieRatio = 0.27;
      break;
    case 'Strength':
      targetCalories = Math.round(tdee + 150);
      calorieDeltaLabel = '+150 kcal strength fuel';
      proteinPerKg = 2.0;
      fatCalorieRatio = 0.28;
      break;
    case 'Endurance':
      targetCalories = Math.round(tdee + 200);
      calorieDeltaLabel = '+200 kcal glycogen support';
      proteinPerKg = 1.7;
      fatCalorieRatio = 0.22;
      break;
  }

  const protein = Math.round(profile.weightKg * proteinPerKg);
  const fats = Math.round((targetCalories * fatCalorieRatio) / 9);
  const remainingCalories = Math.max(0, targetCalories - protein * 4 - fats * 9);
  const carbs = Math.round(remainingCalories / 4);

  return {
    bmr,
    tdee,
    targetCalories,
    protein,
    carbs,
    fats,
    calorieDeltaLabel,
  };
}

export function kgToDisplay(kg: number, unit: WeightUnit): number {
  if (unit === 'lb') {
    return Math.round(kg * 2.20462 * 10) / 10;
  }
  return Math.round(kg * 10) / 10;
}

export function displayToKg(val: number, unit: WeightUnit): number {
  if (unit === 'lb') {
    return Math.round((val / 2.20462) * 10) / 10;
  }
  return Math.round(val * 10) / 10;
}

export function formatVolume(volumeKg: number, unit: WeightUnit): string {
  const val = unit === 'lb' ? Math.round(volumeKg * 2.20462) : Math.round(volumeKg);
  return `${val.toLocaleString()} ${unit}`;
}

export function formatDateShort(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
