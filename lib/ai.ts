const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface WorkoutRequest {
  goal: string;
  experience: string;
  duration: number;
  equipment?: string;
}

interface MealRequest {
  goal: string;
  calories: number;
  mealsPerDay: number;
}

async function callGroq(prompt: string): Promise<string> {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

export async function generateWorkout(request: WorkoutRequest) {
  const prompt = `Generate a workout plan with these parameters:
- Goal: ${request.goal}
- Experience level: ${request.experience}
- Target duration: ${request.duration} minutes
- Equipment: ${request.equipment || 'full gym'}

Return ONLY a valid JSON object (no markdown, no explanation) with this structure:
{
  "name": "workout name",
  "estimated_duration": number,
  "exercises": [
    {
      "name": "exercise name",
      "sets": number,
      "reps": "8-12" or number,
      "rest_seconds": number,
      "notes": "optional tips"
    }
  ]
}`;

  const response = await callGroq(prompt);
  
  // Extract JSON from response (handle potential markdown wrapping)
  let jsonStr = response;
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }
  
  return JSON.parse(jsonStr);
}

export async function generateMealPlan(request: MealRequest) {
  // Calculate macro split based on goal
  let proteinPct = 0.3, carbsPct = 0.4, fatPct = 0.3;
  if (request.goal === 'muscle_gain') {
    proteinPct = 0.35; carbsPct = 0.45; fatPct = 0.2;
  } else if (request.goal === 'fat_loss') {
    proteinPct = 0.4; carbsPct = 0.3; fatPct = 0.3;
  }

  const protein = Math.round((request.calories * proteinPct) / 4);
  const carbs = Math.round((request.calories * carbsPct) / 4);
  const fat = Math.round((request.calories * fatPct) / 9);

  const prompt = `Generate a daily meal plan with these requirements:
- Total calories: ${request.calories}
- Protein target: ${protein}g
- Carbs target: ${carbs}g
- Fat target: ${fat}g
- Number of meals: ${request.mealsPerDay}

Return ONLY a valid JSON object (no markdown, no explanation) with this structure:
{
  "name": "meal plan name",
  "total_calories": number,
  "total_protein": number,
  "total_carbs": number,
  "total_fat": number,
  "meals": [
    {
      "name": "Breakfast",
      "foods": [
        {
          "name": "food item",
          "portion": "1 cup",
          "calories": number,
          "protein": number,
          "carbs": number,
          "fat": number
        }
      ]
    }
  ]
}`;

  const response = await callGroq(prompt);
  
  // Extract JSON from response
  let jsonStr = response;
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }
  
  return JSON.parse(jsonStr);
}
