// Exercise service - fetches from Supabase with local cache
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const CACHE_KEY = 'forma_exercises_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  equipment: string | null;
  instructions: string | null;
}

interface CachedExercises {
  data: Exercise[];
  timestamp: number;
}

// Fallback exercises if offline and no cache - with form tips
const FALLBACK_EXERCISES: Exercise[] = [
  { id: '1', name: 'Barbell Squat', muscle_group: 'legs', equipment: 'barbell', instructions: 'Keep chest up, knees tracking over toes. Descend until thighs are parallel or below.' },
  { id: '2', name: 'Bench Press', muscle_group: 'chest', equipment: 'barbell', instructions: 'Retract shoulder blades, arch back slightly. Lower bar to mid-chest, press up and back.' },
  { id: '3', name: 'Deadlift', muscle_group: 'back', equipment: 'barbell', instructions: 'Keep back flat, bar close to body. Drive through heels, lock out hips at top.' },
  { id: '4', name: 'Overhead Press', muscle_group: 'shoulders', equipment: 'barbell', instructions: 'Brace core, press bar straight up. Move head through as bar passes face.' },
  { id: '5', name: 'Barbell Row', muscle_group: 'back', equipment: 'barbell', instructions: 'Hinge at hips, keep back flat. Pull bar to lower chest, squeeze shoulder blades.' },
  { id: '6', name: 'Pull-ups', muscle_group: 'back', equipment: 'bodyweight', instructions: 'Start from dead hang, pull until chin over bar. Control the descent.' },
  { id: '7', name: 'Push-ups', muscle_group: 'chest', equipment: 'bodyweight', instructions: 'Keep body straight, lower chest to floor. Elbows at 45 degree angle.' },
  { id: '8', name: 'Dumbbell Curl', muscle_group: 'arms', equipment: 'dumbbell', instructions: 'Keep elbows pinned to sides. Control the weight on the way down.' },
  { id: '9', name: 'Tricep Pushdown', muscle_group: 'arms', equipment: 'cable', instructions: 'Keep elbows at sides, extend fully. Squeeze triceps at bottom.' },
  { id: '10', name: 'Leg Press', muscle_group: 'legs', equipment: 'machine', instructions: 'Feet shoulder-width on platform. Lower until 90 degrees, press through heels.' },
  { id: '11', name: 'Lat Pulldown', muscle_group: 'back', equipment: 'cable', instructions: 'Lean back slightly, pull bar to upper chest. Squeeze lats at bottom.' },
  { id: '12', name: 'Dumbbell Shoulder Press', muscle_group: 'shoulders', equipment: 'dumbbell', instructions: 'Start at shoulder height, press straight up. Don\'t lock out elbows.' },
  { id: '13', name: 'Romanian Deadlift', muscle_group: 'legs', equipment: 'barbell', instructions: 'Slight knee bend, hinge at hips. Feel stretch in hamstrings, keep bar close.' },
  { id: '14', name: 'Incline Bench Press', muscle_group: 'chest', equipment: 'barbell', instructions: 'Set bench to 30-45 degrees. Lower to upper chest, press up and back.' },
  { id: '15', name: 'Cable Fly', muscle_group: 'chest', equipment: 'cable', instructions: 'Slight bend in elbows, squeeze chest as hands meet. Control the stretch.' },
  { id: '16', name: 'Leg Curl', muscle_group: 'legs', equipment: 'machine', instructions: 'Keep hips down, curl weight up. Squeeze hamstrings at top.' },
  { id: '17', name: 'Leg Extension', muscle_group: 'legs', equipment: 'machine', instructions: 'Extend legs fully, squeeze quads at top. Control the descent.' },
  { id: '18', name: 'Face Pull', muscle_group: 'shoulders', equipment: 'cable', instructions: 'Pull rope to face level, externally rotate at end. Great for shoulder health.' },
  { id: '19', name: 'Lateral Raise', muscle_group: 'shoulders', equipment: 'dumbbell', instructions: 'Slight bend in elbows, raise to shoulder height. Control the descent.' },
  { id: '20', name: 'Plank', muscle_group: 'core', equipment: 'bodyweight', instructions: 'Keep body straight, core braced. Don\'t let hips sag or pike up.' },
  { id: '21', name: 'Lunges', muscle_group: 'legs', equipment: 'bodyweight', instructions: 'Step forward, lower until back knee nearly touches floor. Push back to start.' },
  { id: '22', name: 'Dips', muscle_group: 'chest', equipment: 'bodyweight', instructions: 'Lean forward for chest, stay upright for triceps. Lower until 90 degrees.' },
  { id: '23', name: 'Hip Thrust', muscle_group: 'legs', equipment: 'barbell', instructions: 'Upper back on bench, drive through heels. Squeeze glutes at top.' },
  { id: '24', name: 'Calf Raises', muscle_group: 'legs', equipment: 'machine', instructions: 'Full range of motion - stretch at bottom, squeeze at top.' },
];

export async function getExercises(): Promise<Exercise[]> {
  try {
    // Check cache first
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed: CachedExercises = JSON.parse(cached);
      const age = Date.now() - parsed.timestamp;
      
      // Return cache if fresh
      if (age < CACHE_DURATION) {
        return parsed.data;
      }
    }

    // Fetch from Supabase
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching exercises:', error);
      // Return cached data if available, otherwise fallback
      if (cached) {
        return JSON.parse(cached).data;
      }
      return FALLBACK_EXERCISES;
    }

    // Cache the result
    const cacheData: CachedExercises = {
      data: data || [],
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

    return data || FALLBACK_EXERCISES;
  } catch (error) {
    console.error('Error in getExercises:', error);
    return FALLBACK_EXERCISES;
  }
}

export function getMuscleGroups(): string[] {
  return ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];
}

export function filterExercises(
  exercises: Exercise[], 
  muscleGroup?: string, 
  search?: string
): Exercise[] {
  return exercises.filter(ex => {
    if (muscleGroup && ex.muscle_group !== muscleGroup) return false;
    if (search && !ex.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
}
