import { useState, useEffect } from 'react';
import { 
  StyleSheet, View, Text, ScrollView, TouchableOpacity, 
  TextInput, Alert, ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  getTemplate, createWorkout, addWorkoutSet, 
  WorkoutTemplate, TemplateExercise 
} from '@/lib/storage';

interface ExerciseLog {
  templateExercise: TemplateExercise;
  sets: SetLog[];
}

interface SetLog {
  id: string;
  reps: string;
  weight: string;
  completed: boolean;
}

export default function StartWorkoutScreen() {
  const router = useRouter();
  const { templateId } = useLocalSearchParams<{ templateId: string }>();
  const [template, setTemplate] = useState<WorkoutTemplate | null>(null);
  const [exercises, setExercises] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTemplate();
  }, [templateId]);

  const loadTemplate = async () => {
    if (!templateId) {
      Alert.alert('Error', 'No workout selected');
      router.back();
      return;
    }

    const data = await getTemplate(templateId);
    if (!data) {
      Alert.alert('Error', 'Workout not found');
      router.back();
      return;
    }

    setTemplate(data);
    
    // Initialize exercise logs with empty sets based on template
    const logs: ExerciseLog[] = data.exercises.map(ex => ({
      templateExercise: ex,
      sets: Array.from({ length: ex.targetSets }, (_, i) => ({
        id: `${ex.id}-${i}`,
        reps: '',
        weight: '',
        completed: false,
      })),
    }));
    setExercises(logs);
    setLoading(false);
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: string) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].sets[setIndex][field] = value;
    setExercises(newExercises);
  };

  const toggleSetComplete = (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].sets[setIndex].completed = 
      !newExercises[exerciseIndex].sets[setIndex].completed;
    setExercises(newExercises);
  };

  const addSet = (exerciseIndex: number) => {
    const newExercises = [...exercises];
    const exercise = newExercises[exerciseIndex];
    exercise.sets.push({
      id: `${exercise.templateExercise.id}-${exercise.sets.length}`,
      reps: '',
      weight: '',
      completed: false,
    });
    setExercises(newExercises);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].sets.splice(setIndex, 1);
    setExercises(newExercises);
  };

  const getCompletedSetsCount = () => {
    return exercises.reduce((total, ex) => 
      total + ex.sets.filter(s => s.completed).length, 0
    );
  };

  const finishWorkout = async () => {
    const completedSets = getCompletedSetsCount();
    
    if (completedSets === 0) {
      Alert.alert('No Sets Completed', 'Complete at least one set before finishing.');
      return;
    }

    Alert.alert(
      'Finish Workout?',
      `You completed ${completedSets} sets. Save this workout?`,
      [
        { text: 'Keep Training', style: 'cancel' },
        { text: 'Finish', onPress: saveWorkout },
      ]
    );
  };

  const saveWorkout = async () => {
    if (!template) return;

    setSaving(true);
    try {
      const workout = await createWorkout({
        templateId: template.id,
        name: template.name,
        completedAt: new Date().toISOString(),
      });

      // Save all completed sets
      for (const exercise of exercises) {
        const completedSets = exercise.sets.filter(s => s.completed);
        for (let i = 0; i < completedSets.length; i++) {
          const set = completedSets[i];
          await addWorkoutSet({
            workoutId: workout.id,
            exerciseName: exercise.templateExercise.name,
            setNumber: i + 1,
            reps: set.reps ? parseInt(set.reps) : undefined,
            weightKg: set.weight ? parseFloat(set.weight) : undefined,
            completed: true,
          });
        }
      }

      router.replace('/(tabs)/workouts');
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Failed to save workout');
    } finally {
      setSaving(false);
    }
  };

  const cancelWorkout = () => {
    Alert.alert(
      'Cancel Workout?',
      'Your progress will be lost.',
      [
        { text: 'Keep Training', style: 'cancel' },
        { text: 'Cancel', style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={cancelWorkout}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{template?.name}</Text>
          <Text style={styles.headerSubtitle}>
            {getCompletedSetsCount()} sets completed
          </Text>
        </View>
        <TouchableOpacity 
          onPress={finishWorkout}
          disabled={saving}
        >
          <Text style={[styles.finishText, saving && styles.finishTextDisabled]}>
            {saving ? 'Saving...' : 'Finish'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {exercises.map((exercise, exerciseIndex) => (
          <View key={exercise.templateExercise.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{exercise.templateExercise.name}</Text>
              <Text style={styles.targetText}>
                Target: {exercise.templateExercise.targetSets} × {exercise.templateExercise.targetReps}
              </Text>
            </View>

            {/* Sets Header */}
            <View style={styles.setsHeader}>
              <Text style={styles.setHeaderText}>Set</Text>
              <Text style={styles.setHeaderText}>Kg</Text>
              <Text style={styles.setHeaderText}>Reps</Text>
              <Text style={styles.setHeaderText}></Text>
            </View>

            {/* Sets */}
            {exercise.sets.map((set, setIndex) => (
              <View key={set.id} style={styles.setRow}>
                <Text style={styles.setNumber}>{setIndex + 1}</Text>
                <TextInput
                  style={[styles.setInput, set.completed && styles.setInputCompleted]}
                  value={set.weight}
                  onChangeText={(v) => updateSet(exerciseIndex, setIndex, 'weight', v)}
                  placeholder="-"
                  placeholderTextColor="#666"
                  keyboardType="decimal-pad"
                  editable={!set.completed}
                />
                <TextInput
                  style={[styles.setInput, set.completed && styles.setInputCompleted]}
                  value={set.reps}
                  onChangeText={(v) => updateSet(exerciseIndex, setIndex, 'reps', v)}
                  placeholder="-"
                  placeholderTextColor="#666"
                  keyboardType="number-pad"
                  editable={!set.completed}
                />
                <TouchableOpacity
                  style={[styles.checkButton, set.completed && styles.checkButtonActive]}
                  onPress={() => toggleSetComplete(exerciseIndex, setIndex)}
                >
                  <Ionicons 
                    name="checkmark" 
                    size={18} 
                    color={set.completed ? '#fff' : '#666'} 
                  />
                </TouchableOpacity>
              </View>
            ))}

            {/* Add/Remove Set */}
            <View style={styles.setActions}>
              <TouchableOpacity 
                style={styles.setActionButton}
                onPress={() => addSet(exerciseIndex)}
              >
                <Ionicons name="add" size={16} color="#007AFF" />
                <Text style={styles.setActionText}>Add Set</Text>
              </TouchableOpacity>
              {exercise.sets.length > 1 && (
                <TouchableOpacity 
                  style={styles.setActionButton}
                  onPress={() => removeSet(exerciseIndex, exercise.sets.length - 1)}
                >
                  <Ionicons name="remove" size={16} color="#ff453a" />
                  <Text style={[styles.setActionText, { color: '#ff453a' }]}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1e',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  finishText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#30d158',
  },
  finishTextDisabled: {
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  exerciseCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  exerciseHeader: {
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  targetText: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  setsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  setHeaderText: {
    flex: 1,
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  setNumber: {
    width: 32,
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    fontWeight: '600',
  },
  setInput: {
    flex: 1,
    backgroundColor: '#2c2c2e',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  setInputCompleted: {
    backgroundColor: '#1a3a1a',
    color: '#30d158',
  },
  checkButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#2c2c2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonActive: {
    backgroundColor: '#30d158',
  },
  setActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  setActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  setActionText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});
