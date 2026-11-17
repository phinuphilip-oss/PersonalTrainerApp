export type Gender = 'Male' | 'Female' | 'Non-binary';
export type FitnessLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type PrimaryGoal = 'Hypertrophy' | 'Fat Loss' | 'Endurance' | 'Strength';
export type Equipment = 'Full Gym' | 'Dumbbells Only' | 'Bodyweight';
export type WeightUnit = 'kg' | 'lb';
export type NavTab = 'workout' | 'program' | 'nutrition' | 'progress' | 'coach';

export interface UserProfile {
  name: string;
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  fitnessLevel: FitnessLevel;
  goal: PrimaryGoal;
  equipment: Equipment;
  daysPerWeek: number;
  restrictions: string;
  unit: WeightUnit;
}

export interface NutritionTargets {
  bmr: number;
  tdee: number;
  targetCalories: number;
  protein: number;
  carbs: number;
  fats: number;
  calorieDeltaLabel: string;
}

export interface ExerciseSet {
  id: string;
  weightKg: number;
  reps: number;
  completed: boolean;
  previousBest?: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  sets: number;
  reps: string;
  restSeconds: number;
  rpe: string;
  suggestedWeightKg: number;
  coachingCue: string;
  loggedSets: ExerciseSet[];
}

export interface WorkoutDay {
  id: string;
  dayNumber: number;
  title: string;
  focus: string;
  estimatedMinutes: number;
  exercises: Exercise[];
}

export interface WorkoutProgram {
  id: string;
  programName: string;
  splitSummary: string;
  createdAt: string;
  days: WorkoutDay[];
}

export interface CompletedWorkoutLog {
  id: string;
  date: string; // ISO YYYY-MM-DD
  dayTitle: string;
  focus: string;
  durationMinutes: number;
  totalVolumeKg: number;
  completedSets: number;
  totalSets: number;
  exercisesSummary: Array<{
    name: string;
    bestSet: string;
    volumeKg: number;
  }>;
}

export interface BodyWeightEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
}

export interface MealEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  notes?: string;
}

export interface CoachMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  imagePreview?: string;
}

export interface SwapAlternative {
  name: string;
  muscleGroup: string;
  sets: number;
  reps: string;
  restSeconds: number;
  rpe: string;
  suggestedWeightKg: number;
  coachingCue: string;
  whyItWorks: string;
}

export interface AnalyzedMealResult {
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  confidence: string;
  ingredients: string[];
  coachingNote: string;
}
