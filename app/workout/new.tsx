import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { createWorkout, addWorkoutSet } from '@/lib/storage';

interface ExerciseSet {
  id: string;
  reps: string;
  weight: string;
  completed: boolean;
}

interface Exercise {
  id: string;
  name: string;
  sets: ExerciseSet[];
}

export default function NewWorkoutScreen() {
  const router = useRouter();
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const addExercise = () => {
    setExercises([
      ...exercises,
      {
        id: Date.now().toString(),
        name: '',
        sets: [{ id: Date.now().toString() + '-1', reps: '', weight: '', completed: false }],
      },
    ]);
  };

  const updateExerciseName = (exerciseId: string, name: string) => {
    setExercises(exercises.map((ex) => (ex.id === exerciseId ? { ...ex, name } : ex)));
  };

  const addSet = (exerciseId: string) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: [...ex.sets, { id: Date.now().toString(), reps: '', weight: '', completed: false }],
            }
          : ex
      )
    );
  };

  const updateSet = (exerciseId: string, setId: string, field: 'reps' | 'weight', value: string) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s)),
            }
          : ex
      )
    );
  };

  const toggleSetComplete = (exerciseId: string, setId: string) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((s) => (s.id === setId ? { ...s, completed: !s.completed } : s)),
            }
          : ex
      )
    );
  };

  const removeExercise = (exerciseId: string) => {
    setExercises(exercises.filter((ex) => ex.id !== exerciseId));
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, sets: ex.sets.filter((s) => s.id !== setId) }
          : ex
      )
    );
  };

  const finishWorkout = async () => {
    // Filter out exercises with no name or no completed sets
    const validExercises = exercises.filter(ex => 
      ex.name.trim() && ex.sets.some(s => s.completed)
    );

    if (validExercises.length === 0) {
      Alert.alert('No Exercises', 'Complete at least one set before finishing.');
      return;
    }

    try {
      // Create workout in local storage
      const workout = await createWorkout({
        name: workoutName.trim() || `Workout ${new Date().toLocaleDateString()}`,
        durationMinutes: Math.floor(timer / 60),
        completedAt: new Date().toISOString(),
      });

      // Save all completed sets
      for (const exercise of validExercises) {
        const completedSets = exercise.sets.filter(s => s.completed);
        for (let i = 0; i < completedSets.length; i++) {
          const set = completedSets[i];
          await addWorkoutSet({
            workoutId: workout.id,
            exerciseName: exercise.name,
            setNumber: i + 1,
            reps: set.reps ? parseInt(set.reps) : undefined,
            weightKg: set.weight ? parseFloat(set.weight) : undefined,
          });
        }
      }

      Alert.alert('Workout Saved! 💪', `Duration: ${formatTime(timer)}`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Failed to save workout. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Workout</Text>
        <TouchableOpacity onPress={finishWorkout}>
          <Text style={styles.finishText}>Finish</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Workout Name */}
        <TextInput
          style={styles.nameInput}
          value={workoutName}
          onChangeText={setWorkoutName}
          placeholder="Workout Name (optional)"
          placeholderTextColor="#666"
        />

        {/* Timer */}
        <View style={styles.timerCard}>
          <View style={styles.timerDisplay}>
            <Ionicons name="time-outline" size={24} color="#888" />
            <Text style={styles.timerText}>{formatTime(timer)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.timerButton, isRunning && styles.timerButtonActive]}
            onPress={() => setIsRunning(!isRunning)}
          >
            <Ionicons name={isRunning ? 'pause' : 'play'} size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Exercises */}
        {exercises.map((exercise) => (
          <View key={exercise.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <TextInput
                style={styles.exerciseNameInput}
                value={exercise.name}
                onChangeText={(v) => updateExerciseName(exercise.id, v)}
                placeholder="Exercise name"
                placeholderTextColor="#666"
              />
              <TouchableOpacity onPress={() => removeExercise(exercise.id)}>
                <Ionicons name="trash-outline" size={20} color="#ff453a" />
              </TouchableOpacity>
            </View>

            {/* Sets Header */}
            <View style={styles.setsHeader}>
              <Text style={styles.setHeaderText}>Set</Text>
              <Text style={styles.setHeaderText}>Weight (kg)</Text>
              <Text style={styles.setHeaderText}>Reps</Text>
              <Text style={styles.setHeaderText}></Text>
            </View>

            {/* Sets */}
            {exercise.sets.map((set, index) => (
              <View key={set.id} style={styles.setRow}>
                <Text style={styles.setNumber}>{index + 1}</Text>
                <TextInput
                  style={styles.setInput}
                  value={set.weight}
                  onChangeText={(v) => updateSet(exercise.id, set.id, 'weight', v)}
                  placeholder="0"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.setInput}
                  value={set.reps}
                  onChangeText={(v) => updateSet(exercise.id, set.id, 'reps', v)}
                  placeholder="0"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={[styles.checkButton, set.completed && styles.checkButtonActive]}
                  onPress={() => toggleSetComplete(exercise.id, set.id)}
                >
                  <Ionicons name="checkmark" size={18} color={set.completed ? '#fff' : '#666'} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addSetButton} onPress={() => addSet(exercise.id)}>
              <Ionicons name="add" size={18} color="#007AFF" />
              <Text style={styles.addSetText}>Add Set</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Add Exercise Button */}
        <TouchableOpacity style={styles.addExerciseButton} onPress={addExercise}>
          <Ionicons name="add" size={24} color="#007AFF" />
          <Text style={styles.addExerciseText}>Add Exercise</Text>
        </TouchableOpacity>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1e',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  finishText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  nameInput: {
    backgroundColor: '#1c1c1e',
    borderRadius: 10,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  timerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timerText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  timerButton: {
    backgroundColor: '#333',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerButtonActive: {
    backgroundColor: '#ff453a',
  },
  exerciseCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  exerciseNameInput: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    marginRight: 12,
  },
  setsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
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
  },
  setInput: {
    flex: 1,
    backgroundColor: '#2c2c2e',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 15,
    textAlign: 'center',
  },
  checkButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#2c2c2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonActive: {
    backgroundColor: '#30d158',
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    marginTop: 8,
  },
  addSetText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  addExerciseText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});
