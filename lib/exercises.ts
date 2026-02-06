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

// Fallback exercises if offline and no cache
const FALLBACK_EXERCISES: Exercise[] = [
  { id: '1', name: 'Barbell Squat', muscle_group: 'legs', equipment: 'barbell', instructions: null },
  { id: '2', name: 'Bench Press', muscle_group: 'chest', equipment: 'barbell', instructions: null },
  { id: '3', name: 'Deadlift', muscle_group: 'back', equipment: 'barbell', instructions: null },
  { id: '4', name: 'Overhead Press', muscle_group: 'shoulders', equipment: 'barbell', instructions: null },
  { id: '5', name: 'Barbell Row', muscle_group: 'back', equipment: 'barbell', instructions: null },
  { id: '6', name: 'Pull-ups', muscle_group: 'back', equipment: 'bodyweight', instructions: null },
  { id: '7', name: 'Push-ups', muscle_group: 'chest', equipment: 'bodyweight', instructions: null },
  { id: '8', name: 'Dumbbell Curl', muscle_group: 'arms', equipment: 'dumbbell', instructions: null },
  { id: '9', name: 'Tricep Pushdown', muscle_group: 'arms', equipment: 'cable', instructions: null },
  { id: '10', name: 'Leg Press', muscle_group: 'legs', equipment: 'machine', instructions: null },
  { id: '11', name: 'Lat Pulldown', muscle_group: 'back', equipment: 'cable', instructions: null },
  { id: '12', name: 'Dumbbell Shoulder Press', muscle_group: 'shoulders', equipment: 'dumbbell', instructions: null },
  { id: '13', name: 'Romanian Deadlift', muscle_group: 'legs', equipment: 'barbell', instructions: null },
  { id: '14', name: 'Incline Bench Press', muscle_group: 'chest', equipment: 'barbell', instructions: null },
  { id: '15', name: 'Cable Fly', muscle_group: 'chest', equipment: 'cable', instructions: null },
  { id: '16', name: 'Leg Curl', muscle_group: 'legs', equipment: 'machine', instructions: null },
  { id: '17', name: 'Leg Extension', muscle_group: 'legs', equipment: 'machine', instructions: null },
  { id: '18', name: 'Face Pull', muscle_group: 'shoulders', equipment: 'cable', instructions: null },
  { id: '19', name: 'Lateral Raise', muscle_group: 'shoulders', equipment: 'dumbbell', instructions: null },
  { id: '20', name: 'Plank', muscle_group: 'core', equipment: 'bodyweight', instructions: null },
  { id: '21', name: 'Lunges', muscle_group: 'legs', equipment: 'bodyweight', instructions: null },
  { id: '22', name: 'Dips', muscle_group: 'chest', equipment: 'bodyweight', instructions: null },
  { id: '23', name: 'Hip Thrust', muscle_group: 'legs', equipment: 'barbell', instructions: null },
  { id: '24', name: 'Calf Raises', muscle_group: 'legs', equipment: 'machine', instructions: null },
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
