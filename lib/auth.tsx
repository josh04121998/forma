// Auth context and Supabase sync
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import * as storage from './storage';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  syncToCloud: () => Promise<void>;
  syncing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Auto-sync on login
        if (session?.user) {
          await syncLocalToCloud(session.user.id);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Sync local data after signup
      if (data.user) {
        await syncLocalToCloud(data.user.id);
      }
      
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const syncLocalToCloud = async (userId: string) => {
    setSyncing(true);
    try {
      // 1. Sync profile/onboarding data
      const localProfile = await storage.getProfile();
      if (localProfile.onboardingComplete) {
        await supabase.from('profiles').upsert({
          id: userId,
          height_cm: localProfile.heightCm,
          weight_kg: localProfile.weightKg,
          age: localProfile.age,
          gender: localProfile.gender,
          goal: localProfile.goal,
          experience: localProfile.experience,
          workout_days: localProfile.workoutDays,
          workout_duration: localProfile.workoutDuration,
          equipment: localProfile.equipment,
          injuries: localProfile.injuries,
          onboarding_complete: true,
        });
      }

      // 2. Sync workouts
      const localWorkouts = await storage.getWorkouts();
      for (const workout of localWorkouts) {
        if (workout.syncStatus === 'pending') {
          const { data: dbWorkout, error } = await supabase
            .from('workouts')
            .insert({
              user_id: userId,
              name: workout.name,
              notes: workout.notes,
              duration_minutes: workout.durationMinutes,
              started_at: workout.startedAt,
              completed_at: workout.completedAt,
              local_id: workout.id,
              sync_status: 'synced',
            })
            .select()
            .single();

          if (error) {
            console.error('Error syncing workout:', error);
            continue;
          }

          // Sync sets for this workout
          const localSets = await storage.getWorkoutSets(workout.id);
          for (const set of localSets) {
            await supabase.from('workout_sets').insert({
              workout_id: dbWorkout.id,
              exercise_name: set.exerciseName,
              set_number: set.setNumber,
              reps: set.reps,
              weight_kg: set.weightKg,
              rpe: set.rpe,
              notes: set.notes,
              local_id: set.id,
              sync_status: 'synced',
            });
          }

          // Mark local workout as synced
          await storage.updateWorkout(workout.id, { syncStatus: 'synced' });
        }
      }

      // 3. Sync AI programs
      const localPrograms = await storage.getPrograms();
      for (const program of localPrograms) {
        await supabase.from('workout_programs').insert({
          user_id: userId,
          name: program.name,
          summary: program.summary,
          duration_weeks: program.durationWeeks,
          schedule: program.schedule,
          active: program.active,
          ai_generated: true,
        });
      }

      // 4. Sync meal plans
      const localMealPlans = await storage.getMealPlans();
      for (const plan of localMealPlans) {
        await supabase.from('meal_plans').insert({
          user_id: userId,
          name: plan.name,
          target_calories: plan.targetCalories,
          target_protein_g: plan.targetProtein,
          target_carbs_g: plan.targetCarbs,
          target_fat_g: plan.targetFat,
          meals: plan.meals,
          active: plan.active,
          ai_generated: true,
        });
      }

      console.log('Sync complete!');
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  const syncToCloud = async () => {
    if (!user) {
      Alert.alert('Not logged in', 'Please sign in to sync your data.');
      return;
    }
    await syncLocalToCloud(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
        syncToCloud,
        syncing,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
