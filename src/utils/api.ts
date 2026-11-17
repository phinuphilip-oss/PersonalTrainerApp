import {
  AnalyzedMealResult,
  CoachMessage,
  Exercise,
  NutritionTargets,
  SwapAlternative,
  UserProfile,
  WorkoutDay,
  WorkoutProgram,
} from '../types';

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export function buildLoggedSets(setsCount: number, repsStr: string, suggestedWeightKg: number) {
  const parsedReps = parseInt(repsStr.split('-')[0] || '10', 10) || 10;
  return Array.from({ length: Math.max(1, setsCount) }, (_, idx) => ({
    id: `set-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
    weightKg: suggestedWeightKg,
    reps: parsedReps,
    completed: false,
  }));
}

export async function generateWorkoutProgramApi(
  profile: UserProfile,
  daysPerWeek: number,
  focusNotes?: string
): Promise<WorkoutProgram> {
  interface RawProgram {
    programName: string;
    splitSummary: string;
    days: Array<{
      dayNumber: number;
      title: string;
      focus: string;
      estimatedMinutes: number;
      exercises: Array<{
        name: string;
        muscleGroup: string;
        sets: number;
        reps: string;
        restSeconds: number;
        rpe: string;
        suggestedWeightKg: number;
        coachingCue: string;
      }>;
    }>;
  }

  const raw = await postJson<RawProgram>('/api/ai/generate-program', {
    profile,
    daysPerWeek,
    focusNotes,
  });

  const days: WorkoutDay[] = (raw.days || []).map((d, dayIdx) => ({
    id: `day-${Date.now()}-${dayIdx}`,
    dayNumber: d.dayNumber || dayIdx + 1,
    title: d.title,
    focus: d.focus,
    estimatedMinutes: d.estimatedMinutes || 55,
    exercises: (d.exercises || []).map((ex, exIdx) => ({
      id: `ex-${Date.now()}-${dayIdx}-${exIdx}`,
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      sets: ex.sets || 3,
      reps: ex.reps || '8-12',
      restSeconds: ex.restSeconds || 90,
      rpe: ex.rpe || 'RPE 8',
      suggestedWeightKg: Number(ex.suggestedWeightKg) || 0,
      coachingCue: ex.coachingCue || 'Control the eccentric and maintain a braced core.',
      loggedSets: buildLoggedSets(ex.sets || 3, ex.reps || '8-12', Number(ex.suggestedWeightKg) || 0),
    })),
  }));

  return {
    id: `prog-${Date.now()}`,
    programName: raw.programName || `${daysPerWeek}-Day ${profile.goal} Split`,
    splitSummary: raw.splitSummary || `Tailored for ${profile.equipment} training.`,
    createdAt: new Date().toISOString(),
    days,
  };
}

export async function swapExerciseApi(
  exercise: Exercise,
  profile: UserProfile,
  reason: string
): Promise<SwapAlternative[]> {
  const res = await postJson<{ alternatives: SwapAlternative[] }>('/api/ai/swap-exercise', {
    exercise,
    profile,
    reason,
  });
  return res.alternatives || [];
}

export async function analyzeMealApi(payload: {
  description?: string;
  imageBase64?: string;
  mimeType?: string;
  profile: UserProfile;
}): Promise<AnalyzedMealResult> {
  return postJson<AnalyzedMealResult>('/api/ai/analyze-meal', payload);
}

export async function sendCoachMessageApi(payload: {
  message: string;
  history: Array<{ role: 'user' | 'model'; content: string }>;
  imageBase64?: string;
  mimeType?: string;
  context: {
    profile: UserProfile;
    targets: NutritionTargets;
    todayNutrition: { calories: number; protein: number; carbs: number; fats: number };
    activeDayTitle: string;
    activeExercises: string[];
    recentWorkoutsSummary: string;
  };
}): Promise<string> {
  const res = await postJson<{ reply: string }>('/api/ai/coach', payload);
  return res.reply;
}

export function compressImageFile(file: File, maxDim = 900): Promise<{ base64: string; mimeType: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        const base64 = dataUrl.split(',')[1] || '';
        resolve({ base64, mimeType: 'image/jpeg', dataUrl });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function createCoachMessage(
  role: 'user' | 'model',
  content: string,
  imagePreview?: string
): CoachMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    role,
    content,
    timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    imagePreview,
  };
}
