// Offline-first local storage layer
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

// Storage keys
const KEYS = {
  WORKOUTS: 'forma_workouts',
  WORKOUT_SETS: 'forma_workout_sets',
  PROGRAMS: 'forma_programs',
  MEAL_PLANS: 'forma_meal_plans',
  PROGRESS: 'forma_progress',
  PROFILE: 'forma_profile',
  PENDING_SYNC: 'forma_pending_sync',
};

// Types
export interface LocalWorkout {
  id: string;
  name: string;
  notes?: string;
  programId?: string;
  durationMinutes?: number;
  startedAt: string;
  completedAt?: string;
  syncStatus: 'pending' | 'synced';
  createdAt: string;
}

export interface LocalWorkoutSet {
  id: string;
  workoutId: string;
  exerciseName: string;
  setNumber: number;
  reps?: number;
  weightKg?: number;
  rpe?: number;
  notes?: string;
  syncStatus: 'pending' | 'synced';
  createdAt: string;
}

export interface LocalProfile {
  heightCm?: number;
  weightKg?: number;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  goal?: string;
  experience?: string;
  workoutDays?: number;
  workoutDuration?: number;
  equipment?: string;
  injuries?: string;
  onboardingComplete: boolean;
}

export interface LocalProgram {
  id: string;
  name: string;
  summary?: string;
  schedule: any;
  durationWeeks: number;
  active: boolean;
  createdAt: string;
}

export interface LocalMealPlan {
  id: string;
  name: string;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  meals: any[];
  active: boolean;
  createdAt: string;
}

// Generic helpers
async function getArray<T>(key: string): Promise<T[]> {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return [];
  }
}

async function setArray<T>(key: string, data: T[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing ${key}:`, error);
  }
}

// ============================================
// Workouts
// ============================================
export async function getWorkouts(): Promise<LocalWorkout[]> {
  const workouts = await getArray<LocalWorkout>(KEYS.WORKOUTS);
  return workouts.sort((a, b) => 
    new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
}

export async function getWorkout(id: string): Promise<LocalWorkout | null> {
  const workouts = await getWorkouts();
  return workouts.find(w => w.id === id) || null;
}

export async function createWorkout(data: Partial<LocalWorkout>): Promise<LocalWorkout> {
  const workout: LocalWorkout = {
    id: uuidv4(),
    name: data.name || 'Workout',
    notes: data.notes,
    programId: data.programId,
    durationMinutes: data.durationMinutes,
    startedAt: data.startedAt || new Date().toISOString(),
    completedAt: data.completedAt,
    syncStatus: 'pending',
    createdAt: new Date().toISOString(),
  };
  
  const workouts = await getArray<LocalWorkout>(KEYS.WORKOUTS);
  workouts.push(workout);
  await setArray(KEYS.WORKOUTS, workouts);
  
  return workout;
}

export async function updateWorkout(id: string, updates: Partial<LocalWorkout>): Promise<LocalWorkout | null> {
  const workouts = await getArray<LocalWorkout>(KEYS.WORKOUTS);
  const index = workouts.findIndex(w => w.id === id);
  
  if (index === -1) return null;
  
  workouts[index] = { ...workouts[index], ...updates, syncStatus: 'pending' };
  await setArray(KEYS.WORKOUTS, workouts);
  
  return workouts[index];
}

export async function deleteWorkout(id: string): Promise<void> {
  const workouts = await getArray<LocalWorkout>(KEYS.WORKOUTS);
  await setArray(KEYS.WORKOUTS, workouts.filter(w => w.id !== id));
  
  // Also delete associated sets
  const sets = await getArray<LocalWorkoutSet>(KEYS.WORKOUT_SETS);
  await setArray(KEYS.WORKOUT_SETS, sets.filter(s => s.workoutId !== id));
}

// ============================================
// Workout Sets
// ============================================
export async function getWorkoutSets(workoutId: string): Promise<LocalWorkoutSet[]> {
  const sets = await getArray<LocalWorkoutSet>(KEYS.WORKOUT_SETS);
  return sets
    .filter(s => s.workoutId === workoutId)
    .sort((a, b) => a.setNumber - b.setNumber);
}

export async function addWorkoutSet(data: Omit<LocalWorkoutSet, 'id' | 'syncStatus' | 'createdAt'>): Promise<LocalWorkoutSet> {
  const set: LocalWorkoutSet = {
    ...data,
    id: uuidv4(),
    syncStatus: 'pending',
    createdAt: new Date().toISOString(),
  };
  
  const sets = await getArray<LocalWorkoutSet>(KEYS.WORKOUT_SETS);
  sets.push(set);
  await setArray(KEYS.WORKOUT_SETS, sets);
  
  return set;
}

export async function updateWorkoutSet(id: string, updates: Partial<LocalWorkoutSet>): Promise<void> {
  const sets = await getArray<LocalWorkoutSet>(KEYS.WORKOUT_SETS);
  const index = sets.findIndex(s => s.id === id);
  
  if (index !== -1) {
    sets[index] = { ...sets[index], ...updates, syncStatus: 'pending' };
    await setArray(KEYS.WORKOUT_SETS, sets);
  }
}

export async function deleteWorkoutSet(id: string): Promise<void> {
  const sets = await getArray<LocalWorkoutSet>(KEYS.WORKOUT_SETS);
  await setArray(KEYS.WORKOUT_SETS, sets.filter(s => s.id !== id));
}

// ============================================
// Profile (onboarding data)
// ============================================
export async function getProfile(): Promise<LocalProfile> {
  try {
    const data = await AsyncStorage.getItem(KEYS.PROFILE);
    return data ? JSON.parse(data) : { onboardingComplete: false };
  } catch {
    return { onboardingComplete: false };
  }
}

export async function updateProfile(updates: Partial<LocalProfile>): Promise<LocalProfile> {
  const current = await getProfile();
  const updated = { ...current, ...updates };
  await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(updated));
  return updated;
}

// ============================================
// Programs (AI-generated)
// ============================================
export async function getPrograms(): Promise<LocalProgram[]> {
  return getArray<LocalProgram>(KEYS.PROGRAMS);
}

export async function getActiveProgram(): Promise<LocalProgram | null> {
  const programs = await getPrograms();
  return programs.find(p => p.active) || null;
}

export async function saveProgram(data: Omit<LocalProgram, 'id' | 'createdAt'>): Promise<LocalProgram> {
  const program: LocalProgram = {
    ...data,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  
  // Deactivate other programs if this one is active
  let programs = await getArray<LocalProgram>(KEYS.PROGRAMS);
  if (program.active) {
    programs = programs.map(p => ({ ...p, active: false }));
  }
  
  programs.push(program);
  await setArray(KEYS.PROGRAMS, programs);
  
  return program;
}

// ============================================
// Meal Plans
// ============================================
export async function getMealPlans(): Promise<LocalMealPlan[]> {
  return getArray<LocalMealPlan>(KEYS.MEAL_PLANS);
}

export async function getActiveMealPlan(): Promise<LocalMealPlan | null> {
  const plans = await getMealPlans();
  return plans.find(p => p.active) || null;
}

export async function saveMealPlan(data: Omit<LocalMealPlan, 'id' | 'createdAt'>): Promise<LocalMealPlan> {
  const plan: LocalMealPlan = {
    ...data,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  
  let plans = await getArray<LocalMealPlan>(KEYS.MEAL_PLANS);
  if (plan.active) {
    plans = plans.map(p => ({ ...p, active: false }));
  }
  
  plans.push(plan);
  await setArray(KEYS.MEAL_PLANS, plans);
  
  return plan;
}

// ============================================
// Stats / Summary
// ============================================
export async function getWorkoutStats(): Promise<{
  totalWorkouts: number;
  thisWeek: number;
  totalSets: number;
  lastWorkout: LocalWorkout | null;
}> {
  const workouts = await getWorkouts();
  const sets = await getArray<LocalWorkoutSet>(KEYS.WORKOUT_SETS);
  
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const completedWorkouts = workouts.filter(w => w.completedAt);
  const thisWeek = completedWorkouts.filter(w => 
    new Date(w.completedAt!) > weekAgo
  ).length;
  
  return {
    totalWorkouts: completedWorkouts.length,
    thisWeek,
    totalSets: sets.length,
    lastWorkout: completedWorkouts[0] || null,
  };
}

// ============================================
// Clear all data (for testing/logout)
// ============================================
export async function clearAllData(): Promise<void> {
  await Promise.all(
    Object.values(KEYS).map(key => AsyncStorage.removeItem(key))
  );
}
