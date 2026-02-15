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

// Goal-specific training protocols (evidence-based)
function getGoalProtocol(goal: string): string {
  switch (goal) {
    case 'build_muscle':
      return `**HYPERTROPHY PROTOCOL (Muscle Building):**
- Rep range: 8-12 reps for most exercises (mechanical tension + metabolic stress)
- Sets: 3-4 sets per exercise, 10-20 sets per muscle group per week
- Rest: 60-90 seconds between sets (keeps metabolic stress high)
- Tempo: 2-3 seconds eccentric, 1 second concentric
- Focus on progressive overload and mind-muscle connection
- Include both compound movements AND isolation exercises
- Prioritize protein: 1.6-2.2g per kg bodyweight
- Caloric surplus: +200-300 calories above TDEE`;

    case 'lose_fat':
      return `**FAT LOSS / METABOLIC PROTOCOL:**
- Use SUPERSETS and CIRCUITS to maximize calorie burn and keep heart rate elevated
- Rep range: 12-15 reps (higher volume, lower rest)
- Rest: 30-45 seconds between sets, minimal rest in supersets
- Include metabolic finishers (battle ropes, burpees, etc.)
- Pair opposing muscle groups in supersets (e.g., push/pull)
- Compound movements prioritized for max calorie expenditure
- HIIT elements encouraged where appropriate
- Protein high: 2.0-2.4g per kg to preserve muscle
- Caloric deficit: -400-500 calories below TDEE`;

    case 'strength':
      return `**STRENGTH / POWERLIFTING PROTOCOL:**
- Rep range: 3-6 reps for main lifts (maximal strength)
- Sets: 4-6 sets for compound lifts
- Rest: 3-5 MINUTES between heavy sets (full ATP recovery)
- Focus on the big 3: Squat, Bench, Deadlift variations
- Progressive overload is #1 priority
- Accessory work: 8-12 reps to build supporting muscles
- Lower total exercise count, higher intensity
- Protein: 1.6-2.0g per kg bodyweight
- Slight caloric surplus or maintenance`;

    case 'maintain':
    default:
      return `**GENERAL FITNESS / MAINTENANCE PROTOCOL:**
- Mix of cardio AND resistance training for overall health
- Rep range: Varied (8-15 reps depending on exercise)
- Rest: 60-90 seconds
- Include 2-3 cardio sessions (LISS or moderate intensity)
- Full body or upper/lower splits work well
- Focus on movement quality and consistency
- Balance all muscle groups, prevent imbalances
- Maintenance calories (TDEE)
- Moderate protein: 1.4-1.6g per kg bodyweight`;
  }
}

function getExerciseGuidelines(goal: string, duration: number): string {
  const baseCount = duration === 30 ? '4-5' : duration === 45 ? '5-6' : duration === 60 ? '6-8' : '8-10';
  
  switch (goal) {
    case 'lose_fat':
      return `- ${baseCount} exercises per workout
- Structure as 2-3 SUPERSETS (A1/A2 format) to maximize efficiency
- Include at least one metabolic finisher or circuit
- Example superset: Bench Press → Bent Over Row (no rest between)`;
    
    case 'strength':
      return `- ${duration <= 45 ? '3-4' : '4-6'} exercises per workout (quality over quantity)
- 1-2 main compound lifts with longer rest
- 2-3 accessory exercises with moderate rest
- Don't rush - strength requires full recovery between sets`;
    
    default:
      return `- ${baseCount} exercises per workout
- Mix of compound and isolation movements
- Can include optional supersets for efficiency`;
  }
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

  // Calculate TDEE and calorie targets using Mifflin-St Jeor
  const bmr = profile.gender === 'male'
    ? (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) + 5
    : (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) - 161;
  
  const activityMultiplier = profile.workoutDays <= 2 ? 1.375 : profile.workoutDays <= 4 ? 1.55 : 1.725;
  const tdee = Math.round(bmr * activityMultiplier);
  
  // Goal-specific calorie adjustments
  let targetCalories = tdee;
  let proteinPerKg = 1.6;
  
  switch (profile.goal) {
    case 'lose_fat':
      targetCalories = tdee - 500; // 500 cal deficit
      proteinPerKg = 2.2; // Higher protein to preserve muscle
      break;
    case 'build_muscle':
      targetCalories = tdee + 250; // Lean bulk
      proteinPerKg = 2.0;
      break;
    case 'strength':
      targetCalories = tdee + 100; // Slight surplus
      proteinPerKg = 1.8;
      break;
    case 'maintain':
    default:
      targetCalories = tdee;
      proteinPerKg = 1.6;
  }
  
  const proteinGrams = Math.round(profile.weight * proteinPerKg);
  
  const goalProtocol = getGoalProtocol(profile.goal);
  const exerciseGuidelines = getExerciseGuidelines(profile.goal, profile.workoutDuration);

  const prompt = `You are an evidence-based fitness coach and sports nutritionist. Create a science-backed program.

**Client Profile:**
- Age: ${profile.age}
- Gender: ${profile.gender}
- Height: ${profile.height}cm
- Weight: ${profile.weight}kg
- Goal: ${profile.goal.replace('_', ' ').toUpperCase()}
- Experience: ${profile.experience}
- Training days: ${profile.workoutDays} per week
- Session duration: ${profile.workoutDuration} minutes (STRICT limit)
- Equipment: ${profile.equipment.replace('_', ' ')}
${profile.injuries ? `- Injuries/Limitations: ${profile.injuries}` : ''}
${profile.dietaryRestrictions?.length ? `- Dietary restrictions: ${profile.dietaryRestrictions.join(', ')}` : ''}

**Calculated Targets:**
- BMR: ${Math.round(bmr)} cal | TDEE: ${tdee} cal
- Target: ${targetCalories} calories
- Protein target: ${proteinGrams}g (${proteinPerKg}g/kg)

${goalProtocol}

**Exercise Count:**
${exerciseGuidelines}

Return ONLY valid JSON (no markdown, no explanation):

{
  "summary": "Brief 2-3 sentence overview tailored to their ${profile.goal.replace('_', ' ')} goal",
  "calories": ${targetCalories},
  "protein": ${proteinGrams},
  "carbs": <calculated grams>,
  "fat": <calculated grams>,
  "workoutPlan": {
    "name": "Program name reflecting the goal",
    "schedule": [
      {
        "day": "Monday",
        "workout": {
          "name": "Workout name",
          "exercises": [
            {"name": "Exercise", "sets": 4, "reps": "8-12", "rest": "90s", "notes": "form cue or tip"}
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
          {"name": "Food item", "portion": "amount", "calories": 300, "protein": 25}
        ]
      }
    ]
  }
}

REQUIREMENTS:
- Include all 7 days (${profile.workoutDays} training + rest days)
- FOLLOW THE ${profile.goal.replace('_', ' ').toUpperCase()} PROTOCOL STRICTLY
- Each workout must fit in ${profile.workoutDuration} minutes INCLUDING rest periods
- For fat loss: USE SUPERSETS (notate as "A1/A2" or "superset with X")
- For strength: Include proper long rest periods (3-5 min)
- Macros must add up to calorie target (protein: 4cal/g, carbs: 4cal/g, fat: 9cal/g)`;

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
