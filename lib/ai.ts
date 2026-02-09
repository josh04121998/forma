// Groq API for AI generation
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface UserProfile {
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // cm
  weight: number; // kg
  goal: 'lose_fat' | 'build_muscle' | 'maintain' | 'strength';
  experience: 'beginner' | 'intermediate' | 'advanced';
  workoutDays: number; // 1-7
  workoutDuration: 30 | 45 | 60 | 90; // minutes per session
  equipment: 'full_gym' | 'home' | 'bodyweight';
  injuries?: string;
  dietaryRestrictions?: string[];
}

export interface GeneratedProgram {
  summary: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  workoutPlan: {
    name: string;
    schedule: {
      day: string;
      workout: {
        name: string;
        exercises: {
          name: string;
          sets: number;
          reps: string;
          rest: string;
          notes?: string;
        }[];
      } | 'Rest';
    }[];
  };
  mealPlan: {
    meals: {
      name: string;
      foods: {
        name: string;
        portion: string;
        calories: number;
        protein: number;
      }[];
    }[];
  };
}

async function callGroq(prompt: string, apiKey: string): Promise<string> {
  console.log('Calling Groq API...');
  
  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Groq response received');
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Groq fetch error:', error);
    throw error;
  }
}

export async function generateFullProgram(profile: UserProfile, apiKey: string): Promise<GeneratedProgram> {
  if (!apiKey) {
    throw new Error('API key is required. Set EXPO_PUBLIC_GROQ_API_KEY in your .env file.');
  }

  // Calculate TDEE and calorie targets
  const bmr = profile.gender === 'male'
    ? 88.362 + (13.397 * profile.weight) + (4.799 * profile.height) - (5.677 * profile.age)
    : 447.593 + (9.247 * profile.weight) + (3.098 * profile.height) - (4.330 * profile.age);
  
  const activityMultiplier = profile.workoutDays <= 2 ? 1.375 : profile.workoutDays <= 4 ? 1.55 : 1.725;
  const tdee = Math.round(bmr * activityMultiplier);
  
  let targetCalories = tdee;
  if (profile.goal === 'lose_fat') targetCalories = tdee - 500;
  if (profile.goal === 'build_muscle') targetCalories = tdee + 300;
  
  const prompt = `You are a professional fitness coach and nutritionist. Create a complete fitness program for this client:

**Client Profile:**
- Age: ${profile.age}
- Gender: ${profile.gender}
- Height: ${profile.height}cm
- Weight: ${profile.weight}kg
- Goal: ${profile.goal.replace('_', ' ')}
- Experience: ${profile.experience}
- Available days per week: ${profile.workoutDays}
- Time per workout: ${profile.workoutDuration} minutes (STRICT - workouts must fit this time limit)
- Equipment: ${profile.equipment.replace('_', ' ')}
${profile.injuries ? `- Injuries/Limitations: ${profile.injuries}` : ''}
${profile.dietaryRestrictions?.length ? `- Dietary restrictions: ${profile.dietaryRestrictions.join(', ')}` : ''}

**Calculated Targets:**
- TDEE: ${tdee} calories
- Target calories: ${targetCalories} calories

**Exercise Count Guidelines (STRICT - based on workout duration):**
- 30 min workouts: 4-5 exercises (compound focus, supersets encouraged)
- 45 min workouts: 5-6 exercises 
- 60 min workouts: 6-8 exercises
- 90 min workouts: 8-10 exercises

Create a comprehensive program. Return ONLY valid JSON (no markdown, no explanation):

{
  "summary": "Brief 2-3 sentence overview of the program and expected results",
  "calories": ${targetCalories},
  "protein": <grams based on goal>,
  "carbs": <grams>,
  "fat": <grams>,
  "workoutPlan": {
    "name": "Program name",
    "schedule": [
      {
        "day": "Monday",
        "workout": {
          "name": "Workout name (e.g., Push Day)",
          "exercises": [
            {"name": "Exercise", "sets": 3, "reps": "8-12", "rest": "90s", "notes": "optional tip"}
          ]
        }
      },
      {"day": "Tuesday", "workout": "Rest"}
    ]
  },
  "mealPlan": {
    "meals": [
      {
        "name": "Breakfast",
        "foods": [
          {"name": "Food item", "portion": "1 cup", "calories": 300, "protein": 20}
        ]
      }
    ]
  }
}

CRITICAL REQUIREMENTS:
- Include all 7 days in the schedule
- Match workout days to ${profile.workoutDays} training days
- Each workout MUST have the appropriate number of exercises for ${profile.workoutDuration} minute sessions (see guidelines above)
- Each workout must be completable in ${profile.workoutDuration} minutes or less (including rest periods)
- Meal plan should hit the calorie and macro targets
- Include variety: compound movements, isolation work, and accessory exercises`;

  const response = await callGroq(prompt, apiKey);
  
  // Extract JSON from response
  let jsonStr = response;
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }
  
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to parse JSON:', jsonStr);
    throw new Error('Failed to parse AI response');
  }
}
