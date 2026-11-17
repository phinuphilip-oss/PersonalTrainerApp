import {
  BodyWeightEntry,
  CoachMessage,
  CompletedWorkoutLog,
  MealEntry,
  UserProfile,
  WorkoutProgram,
} from '../types';
import { getTodayISO } from '../utils/calculations';

function daysAgoISO(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const SEED_PROFILE: UserProfile = {
  name: 'Alex Rivera',
  age: 29,
  gender: 'Male',
  heightCm: 179,
  weightKg: 79.4,
  fitnessLevel: 'Intermediate',
  goal: 'Hypertrophy',
  equipment: 'Full Gym',
  daysPerWeek: 4,
  restrictions: 'Mild right anterior shoulder sensitivity on deep barbell dips',
  unit: 'kg',
};

export const SEED_PROGRAM: WorkoutProgram = {
  id: 'prog-seed-ul4',
  programName: 'Upper / Lower Hypertrophy Block',
  splitSummary:
    '4-day progressive overload split balancing mechanical tension compounds with shoulder-friendly hypertrophy accessories.',
  createdAt: daysAgoISO(14),
  days: [
    {
      id: 'day-seed-1',
      dayNumber: 1,
      title: 'Upper Body A — Push & Pull Density',
      focus: 'Chest, Back, Delts & Arms',
      estimatedMinutes: 58,
      exercises: [
        {
          id: 'ex-1-1',
          name: 'Incline Dumbbell Press',
          muscleGroup: 'Upper Chest',
          sets: 4,
          reps: '8-10',
          restSeconds: 120,
          rpe: 'RPE 8',
          suggestedWeightKg: 32,
          coachingCue:
            'Set bench to 30 degrees, tuck elbows 35 degrees from torso, and pause 1 second near the chest.',
          loggedSets: [
            { id: 's-1-1-1', weightKg: 32, reps: 10, completed: true, previousBest: '30kg × 10' },
            { id: 's-1-1-2', weightKg: 32, reps: 9, completed: true, previousBest: '30kg × 10' },
            { id: 's-1-1-3', weightKg: 32, reps: 9, completed: false, previousBest: '30kg × 9' },
            { id: 's-1-1-4', weightKg: 30, reps: 10, completed: false, previousBest: '30kg × 8' },
          ],
        },
        {
          id: 'ex-1-2',
          name: 'Chest-Supported T-Bar Row',
          muscleGroup: 'Mid Back & Lats',
          sets: 4,
          reps: '8-10',
          restSeconds: 120,
          rpe: 'RPE 8.5',
          suggestedWeightKg: 55,
          coachingCue:
            'Keep sternum glued to the pad, drive elbows back toward hips, and squeeze scapulae for a full beat.',
          loggedSets: [
            { id: 's-1-2-1', weightKg: 55, reps: 10, completed: false, previousBest: '52.5kg × 10' },
            { id: 's-1-2-2', weightKg: 55, reps: 9, completed: false, previousBest: '52.5kg × 9' },
            { id: 's-1-2-3', weightKg: 55, reps: 8, completed: false, previousBest: '52.5kg × 9' },
            { id: 's-1-2-4', weightKg: 52.5, reps: 10, completed: false, previousBest: '50kg × 10' },
          ],
        },
        {
          id: 'ex-1-3',
          name: 'Neutral-Grip Lat Pulldown',
          muscleGroup: 'Lats',
          sets: 3,
          reps: '10-12',
          restSeconds: 90,
          rpe: 'RPE 8',
          suggestedWeightKg: 64,
          coachingCue:
            'Initiate with scapular depression before bending the elbows; keep ribcage stacked over pelvis.',
          loggedSets: [
            { id: 's-1-3-1', weightKg: 64, reps: 12, completed: false, previousBest: '62kg × 12' },
            { id: 's-1-3-2', weightKg: 64, reps: 11, completed: false, previousBest: '62kg × 11' },
            { id: 's-1-3-3', weightKg: 64, reps: 10, completed: false, previousBest: '62kg × 10' },
          ],
        },
        {
          id: 'ex-1-4',
          name: 'Cable Lateral Raise',
          muscleGroup: 'Side Delts',
          sets: 3,
          reps: '12-15',
          restSeconds: 60,
          rpe: 'RPE 9',
          suggestedWeightKg: 10,
          coachingCue:
            'Set pulley at wrist height, sweep arm out in the scapular plane (30 degrees forward), and control the descent.',
          loggedSets: [
            { id: 's-1-4-1', weightKg: 10, reps: 15, completed: false, previousBest: '10kg × 14' },
            { id: 's-1-4-2', weightKg: 10, reps: 14, completed: false, previousBest: '10kg × 13' },
            { id: 's-1-4-3', weightKg: 10, reps: 13, completed: false, previousBest: '10kg × 12' },
          ],
        },
        {
          id: 'ex-1-5',
          name: 'EZ-Bar Preacher Curl',
          muscleGroup: 'Biceps',
          sets: 3,
          reps: '10-12',
          restSeconds: 75,
          rpe: 'RPE 9',
          suggestedWeightKg: 30,
          coachingCue:
            'Keep triceps planted on the pad and lower to 95% extension with a slow 3-second eccentric.',
          loggedSets: [
            { id: 's-1-5-1', weightKg: 30, reps: 12, completed: false, previousBest: '27.5kg × 12' },
            { id: 's-1-5-2', weightKg: 30, reps: 11, completed: false, previousBest: '27.5kg × 11' },
            { id: 's-1-5-3', weightKg: 30, reps: 10, completed: false, previousBest: '27.5kg × 10' },
          ],
        },
      ],
    },
    {
      id: 'day-seed-2',
      dayNumber: 2,
      title: 'Lower Body A — Quad & Hinge Power',
      focus: 'Quads, Hamstrings, Glutes & Calves',
      estimatedMinutes: 60,
      exercises: [
        {
          id: 'ex-2-1',
          name: 'Hack Squat',
          muscleGroup: 'Quads',
          sets: 4,
          reps: '6-8',
          restSeconds: 150,
          rpe: 'RPE 8',
          suggestedWeightKg: 110,
          coachingCue:
            'Place feet low-to-mid on the sled, let knees track freely over toes, and control to full depth.',
          loggedSets: [
            { id: 's-2-1-1', weightKg: 110, reps: 8, completed: false, previousBest: '105kg × 8' },
            { id: 's-2-1-2', weightKg: 110, reps: 8, completed: false, previousBest: '105kg × 8' },
            { id: 's-2-1-3', weightKg: 110, reps: 7, completed: false, previousBest: '105kg × 7' },
            { id: 's-2-1-4', weightKg: 110, reps: 7, completed: false, previousBest: '105kg × 6' },
          ],
        },
        {
          id: 'ex-2-2',
          name: 'Barbell Romanian Deadlift',
          muscleGroup: 'Hamstrings & Glutes',
          sets: 4,
          reps: '8-10',
          restSeconds: 120,
          rpe: 'RPE 8',
          suggestedWeightKg: 95,
          coachingCue:
            'Unlock knees slightly, push hips straight back while dragging the bar along thighs, and stop when hip travel ends.',
          loggedSets: [
            { id: 's-2-2-1', weightKg: 95, reps: 10, completed: false, previousBest: '90kg × 10' },
            { id: 's-2-2-2', weightKg: 95, reps: 9, completed: false, previousBest: '90kg × 9' },
            { id: 's-2-2-3', weightKg: 95, reps: 9, completed: false, previousBest: '90kg × 9' },
            { id: 's-2-2-4', weightKg: 95, reps: 8, completed: false, previousBest: '90kg × 8' },
          ],
        },
        {
          id: 'ex-2-3',
          name: 'Bulgarian Split Squat',
          muscleGroup: 'Quads & Glutes',
          sets: 3,
          reps: '10-12',
          restSeconds: 90,
          rpe: 'RPE 8.5',
          suggestedWeightKg: 24,
          coachingCue:
            'Slight forward torso lean, keep front foot tripod rooted, and drive straight up through mid-foot.',
          loggedSets: [
            { id: 's-2-3-1', weightKg: 24, reps: 12, completed: false, previousBest: '22kg × 12' },
            { id: 's-2-3-2', weightKg: 24, reps: 11, completed: false, previousBest: '22kg × 11' },
            { id: 's-2-3-3', weightKg: 24, reps: 10, completed: false, previousBest: '22kg × 10' },
          ],
        },
        {
          id: 'ex-2-4',
          name: 'Seated Leg Curl',
          muscleGroup: 'Hamstrings',
          sets: 3,
          reps: '12-15',
          restSeconds: 75,
          rpe: 'RPE 9',
          suggestedWeightKg: 52,
          coachingCue:
            'Lock lap pad tightly to maximize hamstring stretch at the top and hold peak contraction for 1 second.',
          loggedSets: [
            { id: 's-2-4-1', weightKg: 52, reps: 14, completed: false, previousBest: '50kg × 14' },
            { id: 's-2-4-2', weightKg: 52, reps: 13, completed: false, previousBest: '50kg × 13' },
            { id: 's-2-4-3', weightKg: 52, reps: 12, completed: false, previousBest: '50kg × 12' },
          ],
        },
        {
          id: 'ex-2-5',
          name: 'Standing Calf Raise',
          muscleGroup: 'Calves',
          sets: 4,
          reps: '12-15',
          restSeconds: 60,
          rpe: 'RPE 9',
          suggestedWeightKg: 70,
          coachingCue:
            'Pause 2 seconds in the full bottom stretch to eliminate Achilles bounce before driving onto big toes.',
          loggedSets: [
            { id: 's-2-5-1', weightKg: 70, reps: 15, completed: false, previousBest: '65kg × 15' },
            { id: 's-2-5-2', weightKg: 70, reps: 14, completed: false, previousBest: '65kg × 14' },
            { id: 's-2-5-3', weightKg: 70, reps: 13, completed: false, previousBest: '65kg × 13' },
            { id: 's-2-5-4', weightKg: 70, reps: 12, completed: false, previousBest: '65kg × 12' },
          ],
        },
      ],
    },
    {
      id: 'day-seed-3',
      dayNumber: 3,
      title: 'Upper Body B — Width & Overhead',
      focus: 'Shoulders, Upper Back, Chest & Triceps',
      estimatedMinutes: 55,
      exercises: [
        {
          id: 'ex-3-1',
          name: 'Seated Dumbbell Shoulder Press',
          muscleGroup: 'Front & Side Delts',
          sets: 4,
          reps: '8-10',
          restSeconds: 120,
          rpe: 'RPE 8',
          suggestedWeightKg: 24,
          coachingCue:
            'Use a 75-degree high-incline bench with neutral-angled elbows to protect the anterior shoulder capsule.',
          loggedSets: [
            { id: 's-3-1-1', weightKg: 24, reps: 10, completed: false, previousBest: '22kg × 10' },
            { id: 's-3-1-2', weightKg: 24, reps: 9, completed: false, previousBest: '22kg × 10' },
            { id: 's-3-1-3', weightKg: 24, reps: 9, completed: false, previousBest: '22kg × 9' },
            { id: 's-3-1-4', weightKg: 24, reps: 8, completed: false, previousBest: '22kg × 8' },
          ],
        },
        {
          id: 'ex-3-2',
          name: 'Single-Arm Dumbbell Row',
          muscleGroup: 'Lats & Rhomboids',
          sets: 3,
          reps: '10-12',
          restSeconds: 90,
          rpe: 'RPE 8.5',
          suggestedWeightKg: 34,
          coachingCue:
            'Brace free hand on bench, arc the dumbbell back toward the hip pocket, and avoid torso twisting.',
          loggedSets: [
            { id: 's-3-2-1', weightKg: 34, reps: 12, completed: false, previousBest: '32kg × 12' },
            { id: 's-3-2-2', weightKg: 34, reps: 11, completed: false, previousBest: '32kg × 11' },
            { id: 's-3-2-3', weightKg: 34, reps: 10, completed: false, previousBest: '32kg × 10' },
          ],
        },
        {
          id: 'ex-3-3',
          name: 'Pec Deck Machine Fly',
          muscleGroup: 'Chest',
          sets: 3,
          reps: '12-15',
          restSeconds: 75,
          rpe: 'RPE 9',
          suggestedWeightKg: 54,
          coachingCue:
            'Keep shoulder blades retracted into the pad and bring inner elbows together without letting shoulders roll forward.',
          loggedSets: [
            { id: 's-3-3-1', weightKg: 54, reps: 14, completed: false, previousBest: '50kg × 15' },
            { id: 's-3-3-2', weightKg: 54, reps: 13, completed: false, previousBest: '50kg × 14' },
            { id: 's-3-3-3', weightKg: 54, reps: 12, completed: false, previousBest: '50kg × 13' },
          ],
        },
        {
          id: 'ex-3-4',
          name: 'Rope Overhead Triceps Extension',
          muscleGroup: 'Triceps Long Head',
          sets: 3,
          reps: '10-14',
          restSeconds: 75,
          rpe: 'RPE 9',
          suggestedWeightKg: 27,
          coachingCue:
            'Lean slightly forward with ribs down, keep elbows fixed in space, and stretch fully behind the head.',
          loggedSets: [
            { id: 's-3-4-1', weightKg: 27, reps: 13, completed: false, previousBest: '25kg × 13' },
            { id: 's-3-4-2', weightKg: 27, reps: 12, completed: false, previousBest: '25kg × 12' },
            { id: 's-3-4-3', weightKg: 27, reps: 11, completed: false, previousBest: '25kg × 11' },
          ],
        },
        {
          id: 'ex-3-5',
          name: 'Face Pulls',
          muscleGroup: 'Rear Delts & Rotator Cuff',
          sets: 3,
          reps: '15-20',
          restSeconds: 60,
          rpe: 'RPE 8',
          suggestedWeightKg: 18,
          coachingCue:
            'Pull rope toward forehead with thumbs leading back into external rotation for shoulder health.',
          loggedSets: [
            { id: 's-3-5-1', weightKg: 18, reps: 18, completed: false, previousBest: '16kg × 18' },
            { id: 's-3-5-2', weightKg: 18, reps: 17, completed: false, previousBest: '16kg × 17' },
            { id: 's-3-5-3', weightKg: 18, reps: 16, completed: false, previousBest: '16kg × 16' },
          ],
        },
      ],
    },
    {
      id: 'day-seed-4',
      dayNumber: 4,
      title: 'Lower Body B — Posterior Chain & Core',
      focus: 'Glutes, Hamstrings, Quads & Abs',
      estimatedMinutes: 56,
      exercises: [
        {
          id: 'ex-4-1',
          name: 'Barbell Hip Thrust',
          muscleGroup: 'Glutes',
          sets: 4,
          reps: '8-12',
          restSeconds: 120,
          rpe: 'RPE 8.5',
          suggestedWeightKg: 120,
          coachingCue:
            'Keep chin tucked, ribs down, and achieve full posterior pelvic tilt at lockout without hyperextending lumbar spine.',
          loggedSets: [
            { id: 's-4-1-1', weightKg: 120, reps: 11, completed: false, previousBest: '115kg × 11' },
            { id: 's-4-1-2', weightKg: 120, reps: 10, completed: false, previousBest: '115kg × 10' },
            { id: 's-4-1-3', weightKg: 120, reps: 10, completed: false, previousBest: '115kg × 10' },
            { id: 's-4-1-4', weightKg: 120, reps: 9, completed: false, previousBest: '115kg × 9' },
          ],
        },
        {
          id: 'ex-4-2',
          name: '45-Degree Leg Press',
          muscleGroup: 'Quads & Glutes',
          sets: 4,
          reps: '10-12',
          restSeconds: 120,
          rpe: 'RPE 8.5',
          suggestedWeightKg: 160,
          coachingCue:
            'Control the sled down until pelvis begins to peel off the pad, then drive smoothly without locking knees hard.',
          loggedSets: [
            { id: 's-4-2-1', weightKg: 160, reps: 12, completed: false, previousBest: '150kg × 12' },
            { id: 's-4-2-2', weightKg: 160, reps: 11, completed: false, previousBest: '150kg × 11' },
            { id: 's-4-2-3', weightKg: 160, reps: 11, completed: false, previousBest: '150kg × 11' },
            { id: 's-4-2-4', weightKg: 160, reps: 10, completed: false, previousBest: '150kg × 10' },
          ],
        },
        {
          id: 'ex-4-3',
          name: 'Leg Extension',
          muscleGroup: 'Quads',
          sets: 3,
          reps: '12-15',
          restSeconds: 75,
          rpe: 'RPE 9',
          suggestedWeightKg: 58,
          coachingCue:
            'Pull yourself down into the seat handles and pause briefly at full knee extension.',
          loggedSets: [
            { id: 's-4-3-1', weightKg: 58, reps: 15, completed: false, previousBest: '55kg × 15' },
            { id: 's-4-3-2', weightKg: 58, reps: 14, completed: false, previousBest: '55kg × 14' },
            { id: 's-4-3-3', weightKg: 58, reps: 13, completed: false, previousBest: '55kg × 13' },
          ],
        },
        {
          id: 'ex-4-4',
          name: 'Hanging Leg Raise',
          muscleGroup: 'Core',
          sets: 3,
          reps: '10-15',
          restSeconds: 60,
          rpe: 'RPE 8.5',
          suggestedWeightKg: 0,
          coachingCue:
            'Curl pelvis upward toward the ribs rather than swinging straight legs; control the lowering phase.',
          loggedSets: [
            { id: 's-4-4-1', weightKg: 0, reps: 14, completed: false, previousBest: 'BW × 13' },
            { id: 's-4-4-2', weightKg: 0, reps: 13, completed: false, previousBest: 'BW × 12' },
            { id: 's-4-4-3', weightKg: 0, reps: 12, completed: false, previousBest: 'BW × 12' },
          ],
        },
      ],
    },
  ],
};

export const SEED_WORKOUT_LOGS: CompletedWorkoutLog[] = [
  {
    id: 'log-1',
    date: daysAgoISO(13),
    dayTitle: 'Upper Body A — Push & Pull Density',
    focus: 'Chest, Back, Delts & Arms',
    durationMinutes: 56,
    totalVolumeKg: 6820,
    completedSets: 17,
    totalSets: 17,
    exercisesSummary: [
      { name: 'Incline Dumbbell Press', bestSet: '30kg × 10', volumeKg: 1140 },
      { name: 'Chest-Supported T-Bar Row', bestSet: '50kg × 10', volumeKg: 1950 },
    ],
  },
  {
    id: 'log-2',
    date: daysAgoISO(11),
    dayTitle: 'Lower Body A — Quad & Hinge Power',
    focus: 'Quads, Hamstrings, Glutes & Calves',
    durationMinutes: 62,
    totalVolumeKg: 10940,
    completedSets: 18,
    totalSets: 18,
    exercisesSummary: [
      { name: 'Hack Squat', bestSet: '100kg × 8', volumeKg: 3100 },
      { name: 'Barbell Romanian Deadlift', bestSet: '87.5kg × 10', volumeKg: 3325 },
    ],
  },
  {
    id: 'log-3',
    date: daysAgoISO(9),
    dayTitle: 'Upper Body B — Width & Overhead',
    focus: 'Shoulders, Upper Back, Chest & Triceps',
    durationMinutes: 54,
    totalVolumeKg: 6410,
    completedSets: 16,
    totalSets: 16,
    exercisesSummary: [
      { name: 'Seated Dumbbell Shoulder Press', bestSet: '22kg × 10', volumeKg: 814 },
      { name: 'Single-Arm Dumbbell Row', bestSet: '32kg × 12', volumeKg: 1056 },
    ],
  },
  {
    id: 'log-4',
    date: daysAgoISO(6),
    dayTitle: 'Lower Body B — Posterior Chain & Core',
    focus: 'Glutes, Hamstrings, Quads & Abs',
    durationMinutes: 58,
    totalVolumeKg: 12180,
    completedSets: 14,
    totalSets: 14,
    exercisesSummary: [
      { name: 'Barbell Hip Thrust', bestSet: '115kg × 11', volumeKg: 4600 },
      { name: '45-Degree Leg Press', bestSet: '150kg × 12', volumeKg: 6600 },
    ],
  },
  {
    id: 'log-5',
    date: daysAgoISO(4),
    dayTitle: 'Upper Body A — Push & Pull Density',
    focus: 'Chest, Back, Delts & Arms',
    durationMinutes: 59,
    totalVolumeKg: 7340,
    completedSets: 17,
    totalSets: 17,
    exercisesSummary: [
      { name: 'Incline Dumbbell Press', bestSet: '32kg × 9', volumeKg: 1216 },
      { name: 'Chest-Supported T-Bar Row', bestSet: '52.5kg × 10', volumeKg: 2045 },
    ],
  },
  {
    id: 'log-6',
    date: daysAgoISO(2),
    dayTitle: 'Lower Body A — Quad & Hinge Power',
    focus: 'Quads, Hamstrings, Glutes & Calves',
    durationMinutes: 61,
    totalVolumeKg: 11860,
    completedSets: 18,
    totalSets: 18,
    exercisesSummary: [
      { name: 'Hack Squat', bestSet: '105kg × 8', volumeKg: 3255 },
      { name: 'Barbell Romanian Deadlift', bestSet: '90kg × 10', volumeKg: 3420 },
    ],
  },
];

export const SEED_WEIGHT_HISTORY: BodyWeightEntry[] = [
  { id: 'w-1', date: daysAgoISO(21), weightKg: 78.2 },
  { id: 'w-2', date: daysAgoISO(18), weightKg: 78.5 },
  { id: 'w-3', date: daysAgoISO(15), weightKg: 78.4 },
  { id: 'w-4', date: daysAgoISO(12), weightKg: 78.8 },
  { id: 'w-5', date: daysAgoISO(9), weightKg: 79.0 },
  { id: 'w-6', date: daysAgoISO(6), weightKg: 79.1 },
  { id: 'w-7', date: daysAgoISO(3), weightKg: 79.3 },
  { id: 'w-8', date: getTodayISO(), weightKg: 79.4 },
];

export const SEED_MEALS: MealEntry[] = [
  {
    id: 'meal-1',
    date: getTodayISO(),
    time: '08:15 AM',
    name: 'Greek Yogurt Protein Bowl with Oats & Blueberries',
    calories: 540,
    protein: 44,
    carbs: 62,
    fats: 12,
    notes: 'Pre-training slow-digesting carbs + high leucine protein',
  },
  {
    id: 'meal-2',
    date: getTodayISO(),
    time: '01:05 PM',
    name: 'Grilled Chicken Breast, Jasmine Rice & Avocado',
    calories: 760,
    protein: 58,
    carbs: 78,
    fats: 22,
    notes: 'Post-workout glycogen replenishment meal',
  },
  {
    id: 'meal-3',
    date: getTodayISO(),
    time: '04:30 PM',
    name: 'Whey Isolate Shake & Banana',
    calories: 255,
    protein: 28,
    carbs: 31,
    fats: 2,
    notes: 'Afternoon protein bridge',
  },
];

export const SEED_COACH_MESSAGES: CoachMessage[] = [
  {
    id: 'coach-welcome-1',
    role: 'model',
    content:
      "Welcome back, Alex. I have your 4-day Upper / Lower Hypertrophy block loaded and noted your mild right anterior shoulder sensitivity. Today is **Upper Body A** — ask me for form cues on any lift, request a mid-session swap if a joint feels tight, or upload a meal photo for instant macro estimates.",
    timestamp: 'Just now',
  },
];
