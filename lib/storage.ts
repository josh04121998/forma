// Offline-first local storage layer
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

// Storage keys
const KEYS = {
  WORKOUTS: 'forma_workouts',
  WORKOUT_SETS: 'forma_workout_sets',
  TEMPLATES: 'forma_templates', // Workout templates (reusable)
  PROGRAMS: 'forma_programs',
  MEAL_PLANS: 'forma_meal_plans',
  PROGRESS: 'forma_progress',
  PROFILE: 'forma_profile',
  INITIALIZED: 'forma_initialized',
};

// ============================================
// Types
// ============================================
export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: TemplateExercise[];
  isDefault?: boolean; // Pre-populated templates
  createdAt: string;
}

export interface TemplateExercise {
  id: string;
  name: string;
  targetSets: number;
  targetReps: string; // e.g., "8-12"
  notes?: string;
}

export interface LocalWorkout {
  id: string;
  templateId?: string; // Which template this was started from
  name: string;
  notes?: string;
  programId?: string;
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
  completed: boolean;
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
  // Unit preferences
  weightUnit: 'kg' | 'lbs';
  heightUnit: 'cm' | 'ft';
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

// ============================================
// Default PPL Templates
// ============================================
const DEFAULT_TEMPLATES: Omit<WorkoutTemplate, 'id' | 'createdAt'>[] = [
  {
    name: 'Push Day',
    isDefault: true,
    exercises: [
      { id: '1', name: 'Bench Press', targetSets: 4, targetReps: '6-8' },
      { id: '2', name: 'Overhead Press', targetSets: 3, targetReps: '8-10' },
      { id: '3', name: 'Incline Dumbbell Press', targetSets: 3, targetReps: '10-12' },
      { id: '4', name: 'Lateral Raise', targetSets: 3, targetReps: '12-15' },
      { id: '5', name: 'Tricep Pushdown', targetSets: 3, targetReps: '10-12' },
      { id: '6', name: 'Overhead Tricep Extension', targetSets: 2, targetReps: '12-15' },
    ],
  },
  {
    name: 'Pull Day',
    isDefault: true,
    exercises: [
      { id: '1', name: 'Deadlift', targetSets: 4, targetReps: '5-6' },
      { id: '2', name: 'Pull-ups', targetSets: 3, targetReps: '6-10' },
      { id: '3', name: 'Barbell Row', targetSets: 3, targetReps: '8-10' },
      { id: '4', name: 'Face Pull', targetSets: 3, targetReps: '15-20' },
      { id: '5', name: 'Barbell Curl', targetSets: 3, targetReps: '10-12' },
      { id: '6', name: 'Hammer Curl', targetSets: 2, targetReps: '12-15' },
    ],
  },
  {
    name: 'Leg Day',
    isDefault: true,
    exercises: [
      { id: '1', name: 'Barbell Squat', targetSets: 4, targetReps: '6-8' },
      { id: '2', name: 'Romanian Deadlift', targetSets: 3, targetReps: '8-10' },
      { id: '3', name: 'Leg Press', targetSets: 3, targetReps: '10-12' },
      { id: '4', name: 'Leg Curl', targetSets: 3, targetReps: '10-12' },
      { id: '5', name: 'Leg Extension', targetSets: 3, targetReps: '12-15' },
      { id: '6', name: 'Calf Raises', targetSets: 4, targetReps: '12-15' },
    ],
  },
];

// ============================================
// Helpers
// ============================================
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
// Initialize with defaults
// ============================================
export async function initializeDefaults(): Promise<void> {
  const initialized = await AsyncStorage.getItem(KEYS.INITIALIZED);
  if (initialized) return;

  // Add default templates
  const templates: WorkoutTemplate[] = DEFAULT_TEMPLATES.map(t => ({
    ...t,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  }));
  await setArray(KEYS.TEMPLATES, templates);
  await AsyncStorage.setItem(KEYS.INITIALIZED, 'true');
}

// ============================================
// Workout Templates
// ============================================
export async function getTemplates(): Promise<WorkoutTemplate[]> {
  await initializeDefaults();
  return getArray<WorkoutTemplate>(KEYS.TEMPLATES);
}

export async function getTemplate(id: string): Promise<WorkoutTemplate | null> {
  const templates = await getTemplates();
  return templates.find(t => t.id === id) || null;
}

export async function createTemplate(data: Omit<WorkoutTemplate, 'id' | 'createdAt'>): Promise<WorkoutTemplate> {
  const template: WorkoutTemplate = {
    ...data,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  
  const templates = await getArray<WorkoutTemplate>(KEYS.TEMPLATES);
  templates.push(template);
  await setArray(KEYS.TEMPLATES, templates);
  
  return template;
}

export async function updateTemplate(id: string, updates: Partial<WorkoutTemplate>): Promise<WorkoutTemplate | null> {
  const templates = await getArray<WorkoutTemplate>(KEYS.TEMPLATES);
  const index = templates.findIndex(t => t.id === id);
  
  if (index === -1) return null;
  
  templates[index] = { ...templates[index], ...updates };
  await setArray(KEYS.TEMPLATES, templates);
  
  return templates[index];
}

export async function deleteTemplate(id: string): Promise<void> {
  const templates = await getArray<WorkoutTemplate>(KEYS.TEMPLATES);
  await setArray(KEYS.TEMPLATES, templates.filter(t => t.id !== id));
}

// ============================================
// Workouts (logged sessions)
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
    templateId: data.templateId,
    notes: data.notes,
    programId: data.programId,
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
// Profile
// ============================================
export async function getProfile(): Promise<LocalProfile> {
  const defaults: LocalProfile = { 
    onboardingComplete: false,
    weightUnit: 'kg',
    heightUnit: 'cm',
  };
  try {
    const data = await AsyncStorage.getItem(KEYS.PROFILE);
    return data ? { ...defaults, ...JSON.parse(data) } : defaults;
  } catch {
    return defaults;
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
// Exercise History (for previous workout data)
// ============================================
export interface ExerciseHistory {
  date: string;
  sets: { reps: number; weightKg: number }[];
}

export async function getExerciseHistory(exerciseName: string): Promise<ExerciseHistory[]> {
  const workouts = await getWorkouts();
  const allSets = await getArray<LocalWorkoutSet>(KEYS.WORKOUT_SETS);
  
  const history: ExerciseHistory[] = [];
  
  for (const workout of workouts) {
    if (!workout.completedAt) continue;
    
    const exerciseSets = allSets
      .filter(s => s.workoutId === workout.id && s.exerciseName === exerciseName)
      .sort((a, b) => a.setNumber - b.setNumber)
      .map(s => ({ reps: s.reps || 0, weightKg: s.weightKg || 0 }));
    
    if (exerciseSets.length > 0) {
      history.push({
        date: workout.completedAt,
        sets: exerciseSets,
      });
    }
  }
  
  return history.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export async function getLastWorkoutForExercise(exerciseName: string): Promise<ExerciseHistory | null> {
  const history = await getExerciseHistory(exerciseName);
  return history[0] || null;
}

// Get all exercise PRs
export async function getExercisePR(exerciseName: string): Promise<{ weight: number; reps: number; date: string } | null> {
  const history = await getExerciseHistory(exerciseName);
  
  let best: { weight: number; reps: number; date: string } | null = null;
  let best1RM = 0;
  
  for (const entry of history) {
    for (const set of entry.sets) {
      // Epley formula for estimated 1RM
      const reps = Math.min(set.reps, 12);
      const est1RM = set.weightKg * (1 + reps / 30);
      
      if (est1RM > best1RM) {
        best1RM = est1RM;
        best = { weight: set.weightKg, reps: set.reps, date: entry.date };
      }
    }
  }
  
  return best;
}

// ============================================
// Stats
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
// Clear all data
// ============================================
export async function clearAllData(): Promise<void> {
  await Promise.all(
    Object.values(KEYS).map(key => AsyncStorage.removeItem(key))
  );
}
