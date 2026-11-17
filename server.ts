import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '12mb' }));

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please add your Gemini API key in the Settings > Secrets panel.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const status = (err as { status?: number })?.status;
      if (status && status >= 400 && status < 500 && status !== 429) {
        throw err;
      }
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 600 * attempt));
      }
    }
  }
  throw lastError;
}

function formatApiError(err: unknown): { status: number; message: string } {
  const e = err as { status?: number; message?: string };
  const msg = e?.message || 'Unexpected error communicating with Gemini API.';
  if (msg.includes('GEMINI_API_KEY')) {
    return { status: 500, message: msg };
  }
  if (e?.status === 403 || e?.status === 400) {
    return {
      status: e.status,
      message: 'API key issue or invalid request. Please verify your API key in Settings > Secrets.',
    };
  }
  if (e?.status === 429) {
    return {
      status: 429,
      message: 'Rate limit reached. Please wait a moment and try again.',
    };
  }
  return { status: e?.status || 500, message: msg };
}

// 1. Generate Multi-Day Workout Program
app.post('/api/ai/generate-program', async (req, res) => {
  try {
    const { profile, daysPerWeek, focusNotes } = req.body;
    const ai = getGeminiClient();

    const prompt = `Design a structured ${daysPerWeek || profile.daysPerWeek || 4}-day weekly workout program for this athlete:
- Age: ${profile.age}, Gender: ${profile.gender}, Height: ${profile.heightCm} cm, Weight: ${profile.weightKg} kg
- Fitness Level: ${profile.fitnessLevel}
- Primary Goal: ${profile.goal}
- Available Equipment: ${profile.equipment}
- Injury / Mobility Restrictions: ${profile.restrictions || 'None'}
${focusNotes ? `- Additional Focus Notes: ${focusNotes}` : ''}

Requirements:
- Every exercise MUST strictly use only the available equipment (${profile.equipment}) and respect all injury/mobility restrictions (${profile.restrictions || 'None'}).
- Include 5 to 6 exercises per training day with clear compound-to-isolation ordering.
- Provide practical, biomechanically accurate coaching cues (1-2 crisp sentences each).
- Provide realistic target weight suggestions in kg appropriate for their level and body weight (use 0 for bodyweight movements).`;

    const response = await withRetry(() =>
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You are an NSCA-certified strength and conditioning specialist. Return clean, structured JSON workout plans.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              programName: { type: Type.STRING },
              splitSummary: { type: Type.STRING },
              days: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dayNumber: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    focus: { type: Type.STRING },
                    estimatedMinutes: { type: Type.INTEGER },
                    exercises: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          name: { type: Type.STRING },
                          muscleGroup: { type: Type.STRING },
                          sets: { type: Type.INTEGER },
                          reps: { type: Type.STRING },
                          restSeconds: { type: Type.INTEGER },
                          rpe: { type: Type.STRING },
                          suggestedWeightKg: { type: Type.NUMBER },
                          coachingCue: { type: Type.STRING },
                        },
                        required: [
                          'name',
                          'muscleGroup',
                          'sets',
                          'reps',
                          'restSeconds',
                          'rpe',
                          'suggestedWeightKg',
                          'coachingCue',
                        ],
                      },
                    },
                  },
                  required: ['dayNumber', 'title', 'focus', 'estimatedMinutes', 'exercises'],
                },
              },
            },
            required: ['programName', 'splitSummary', 'days'],
          },
        },
      })
    );

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json(parsed);
  } catch (err) {
    const formatted = formatApiError(err);
    res.status(formatted.status).json({ error: formatted.message });
  }
});

// 2. Biomechanically Equivalent Exercise Swap
app.post('/api/ai/swap-exercise', async (req, res) => {
  try {
    const { exercise, profile, reason } = req.body;
    const ai = getGeminiClient();

    const prompt = `Suggest 3 biomechanically equivalent exercise alternatives to replace "${exercise.name}" (Target Muscle: ${exercise.muscleGroup}, Prescribed: ${exercise.sets} sets x ${exercise.reps} reps).
Athlete context:
- Equipment: ${profile.equipment}
- Goal: ${profile.goal}
- Fitness Level: ${profile.fitnessLevel}
- Injury/Mobility Restrictions: ${profile.restrictions || 'None'}
- Swap Reason: ${reason || 'Looking for an equivalent variation or equipment alternative'}

Ensure all 3 alternatives strictly fit the athlete's equipment and avoid aggravating any listed restrictions.`;

    const response = await withRetry(() =>
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You are a biomechanics expert and certified personal trainer. Return 3 distinct, practical exercise swaps as JSON.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              alternatives: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    muscleGroup: { type: Type.STRING },
                    sets: { type: Type.INTEGER },
                    reps: { type: Type.STRING },
                    restSeconds: { type: Type.INTEGER },
                    rpe: { type: Type.STRING },
                    suggestedWeightKg: { type: Type.NUMBER },
                    coachingCue: { type: Type.STRING },
                    whyItWorks: { type: Type.STRING },
                  },
                  required: [
                    'name',
                    'muscleGroup',
                    'sets',
                    'reps',
                    'restSeconds',
                    'rpe',
                    'suggestedWeightKg',
                    'coachingCue',
                    'whyItWorks',
                  ],
                },
              },
            },
            required: ['alternatives'],
          },
        },
      })
    );

    const parsed = JSON.parse((response.text ?? '{"alternatives":[]}').trim());
    res.json(parsed);
  } catch (err) {
    const formatted = formatApiError(err);
    res.status(formatted.status).json({ error: formatted.message });
  }
});

// 3. Analyze Meal Photo &/or Description for Macro Tracking
app.post('/api/ai/analyze-meal', async (req, res) => {
  try {
    const { description, imageBase64, mimeType, profile } = req.body;
    if (!description && !imageBase64) {
      res.status(400).json({ error: 'Please provide a meal description or upload a meal photo.' });
      return;
    }

    const ai = getGeminiClient();
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    if (imageBase64 && mimeType) {
      parts.push({
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      });
    }

    parts.push({
      text: `Analyze this meal and estimate its nutritional macronutrient breakdown accurately.
${description ? `User description: "${description}"` : 'Analyze the attached meal photo.'}
Athlete goal: ${profile?.goal || 'Hypertrophy'}.
Return realistic, well-calibrated estimates for calories, protein (g), carbs (g), and fats (g), plus a short list of identified ingredients and one brief coaching note aligned with their goal.`,
    });

    const response = await withRetry(() =>
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          systemInstruction:
            'You are a registered sports dietitian. Estimate meal macros with high practical accuracy and return clean JSON.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              mealName: { type: Type.STRING },
              calories: { type: Type.INTEGER },
              protein: { type: Type.INTEGER },
              carbs: { type: Type.INTEGER },
              fats: { type: Type.INTEGER },
              confidence: { type: Type.STRING },
              ingredients: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              coachingNote: { type: Type.STRING },
            },
            required: [
              'mealName',
              'calories',
              'protein',
              'carbs',
              'fats',
              'confidence',
              'ingredients',
              'coachingNote',
            ],
          },
        },
      })
    );

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json(parsed);
  } catch (err) {
    const formatted = formatApiError(err);
    res.status(formatted.status).json({ error: formatted.message });
  }
});

// 4. Persistent Conversational AI Coach & Form Advisor
app.post('/api/ai/coach', async (req, res) => {
  try {
    const { message, history, imageBase64, mimeType, context } = req.body;
    const ai = getGeminiClient();

    const systemInstruction = `You are Coach Kinetix, an elite NSCA-certified personal trainer, biomechanics specialist, and sports nutrition advisor.
You know this athlete's live profile, program, and training history:
- Athlete: ${context?.profile?.name || 'Athlete'}, ${context?.profile?.age}y, ${context?.profile?.gender}, ${context?.profile?.heightCm}cm, ${context?.profile?.weightKg}kg
- Level: ${context?.profile?.fitnessLevel} | Goal: ${context?.profile?.goal} | Equipment: ${context?.profile?.equipment}
- Injury / Mobility Restrictions: ${context?.profile?.restrictions || 'None reported'}
- Daily Nutrition Targets: ${context?.targets?.targetCalories} kcal (P: ${context?.targets?.protein}g, C: ${context?.targets?.carbs}g, F: ${context?.targets?.fats}g)
- Today's Nutrition Logged: ${context?.todayNutrition?.calories || 0} kcal (P: ${context?.todayNutrition?.protein || 0}g, C: ${context?.todayNutrition?.carbs || 0}g, F: ${context?.todayNutrition?.fats || 0}g)
- Active Workout Day: ${context?.activeDayTitle || 'None'} (${context?.activeExercises?.join(', ') || 'None'})
- Recent Completed Sessions: ${context?.recentWorkoutsSummary || 'No recent sessions logged yet'}

Guidelines:
- Give direct, actionable, biomechanically sound advice tailored to their equipment and restrictions.
- For form cues, use 3-4 crisp bullet points (setup, execution, breathing/bracing, common fault to avoid).
- For pain or discomfort questions, immediately suggest safe biomechanical swaps that fit their equipment and remind them to stop any movement causing sharp joint pain.
- For meal photos or food descriptions, provide an estimated macro breakdown (Calories, Protein, Carbs, Fats) and compare it to their remaining daily targets.
- Keep responses concise, scannable, and motivating without fluff.`;

    const contents: Array<{
      role: 'user' | 'model';
      parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
    }> = [];

    if (Array.isArray(history)) {
      for (const turn of history.slice(-10)) {
        if (turn.role === 'user' || turn.role === 'model') {
          contents.push({
            role: turn.role,
            parts: [{ text: String(turn.content || '') }],
          });
        }
      }
    }

    const userParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
    if (imageBase64 && mimeType) {
      userParts.push({
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      });
    }
    userParts.push({
      text: message || 'Please analyze this image and advise me based on my fitness profile.',
    });

    contents.push({
      role: 'user',
      parts: userParts,
    });

    const response = await withRetry(() =>
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents,
        config: {
          systemInstruction,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      })
    );

    res.json({ reply: response.text ?? 'I could not generate a response. Please try again.' });
  } catch (err) {
    const formatted = formatApiError(err);
    res.status(formatted.status).json({ error: formatted.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Kinetix server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
