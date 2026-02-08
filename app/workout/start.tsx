import { useState, useEffect } from 'react';
import { 
  StyleSheet, View, Text, ScrollView, TouchableOpacity, 
  TextInput, Alert, ActivityIndicator, Modal, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  getTemplate, createWorkout, addWorkoutSet, getProfile,
  WorkoutTemplate, TemplateExercise 
} from '@/lib/storage';
import { getExercises, filterExercises, getMuscleGroups, Exercise } from '@/lib/exercises';

interface ExerciseLog {
  id: string;
  name: string;
  targetSets: number;
  targetReps: string;
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
  const [useKg, setUseKg] = useState(true);
  
  // Exercise picker state
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'add' | 'replace'>('add');
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [templateId]);

  const loadData = async () => {
    // Load user preferences
    const profile = await getProfile();
    // Default to kg, can be changed in profile
    
    // Load exercises for picker
    const exList = await getExercises();
    setAvailableExercises(exList);

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
    
    const logs: ExerciseLog[] = data.exercises.map(ex => ({
      id: ex.id,
      name: ex.name,
      targetSets: ex.targetSets,
      targetReps: ex.targetReps,
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
      id: `${exercise.id}-${exercise.sets.length}`,
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

  const openAddExercise = () => {
    setPickerMode('add');
    setReplaceIndex(null);
    setShowPicker(true);
  };

  const openReplaceExercise = (index: number) => {
    setPickerMode('replace');
    setReplaceIndex(index);
    setShowPicker(true);
  };

  const selectExercise = (exercise: Exercise) => {
    const newExercise: ExerciseLog = {
      id: Date.now().toString(),
      name: exercise.name,
      targetSets: 3,
      targetReps: '8-12',
      sets: Array.from({ length: 3 }, (_, i) => ({
        id: `${Date.now()}-${i}`,
        reps: '',
        weight: '',
        completed: false,
      })),
    };

    if (pickerMode === 'replace' && replaceIndex !== null) {
      const newExercises = [...exercises];
      newExercises[replaceIndex] = newExercise;
      setExercises(newExercises);
    } else {
      setExercises([...exercises, newExercise]);
    }

    setShowPicker(false);
    setSearchQuery('');
    setSelectedMuscle(null);
  };

  const removeExercise = (index: number) => {
    Alert.alert(
      'Remove Exercise',
      `Remove ${exercises[index].name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            const newExercises = [...exercises];
            newExercises.splice(index, 1);
            setExercises(newExercises);
          }
        },
      ]
    );
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

    // Save directly without confirmation
    await saveWorkout();
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

      for (const exercise of exercises) {
        const completedSets = exercise.sets.filter(s => s.completed);
        for (let i = 0; i < completedSets.length; i++) {
          const set = completedSets[i];
          await addWorkoutSet({
            workoutId: workout.id,
            exerciseName: exercise.name,
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
    const completedSets = getCompletedSetsCount();
    if (completedSets > 0) {
      Alert.alert(
        'Discard Workout?',
        `You have ${completedSets} completed sets. Discard?`,
        [
          { text: 'Keep Training', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  const filteredExercises = filterExercises(
    availableExercises, 
    selectedMuscle || undefined, 
    searchQuery || undefined
  );

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
          <View key={exercise.id} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseTitleRow}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <View style={styles.exerciseActions}>
                  <TouchableOpacity 
                    onPress={() => openReplaceExercise(exerciseIndex)}
                    style={styles.exerciseActionBtn}
                  >
                    <Ionicons name="swap-horizontal" size={18} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => removeExercise(exerciseIndex)}
                    style={styles.exerciseActionBtn}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ff453a" />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.targetText}>
                Target: {exercise.targetSets} × {exercise.targetReps}
              </Text>
            </View>

            {/* Sets Header */}
            <View style={styles.setsHeader}>
              <Text style={styles.setHeaderText}>Set</Text>
              <Text style={styles.setHeaderText}>{useKg ? 'Kg' : 'Lbs'}</Text>
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
                />
                <TextInput
                  style={[styles.setInput, set.completed && styles.setInputCompleted]}
                  value={set.reps}
                  onChangeText={(v) => updateSet(exerciseIndex, setIndex, 'reps', v)}
                  placeholder="-"
                  placeholderTextColor="#666"
                  keyboardType="number-pad"
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

        {/* Add Exercise Button */}
        <TouchableOpacity style={styles.addExerciseButton} onPress={openAddExercise}>
          <Ionicons name="add" size={24} color="#007AFF" />
          <Text style={styles.addExerciseText}>Add Exercise</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Exercise Picker Modal */}
      <Modal visible={showPicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setShowPicker(false);
              setSearchQuery('');
              setSelectedMuscle(null);
            }}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {pickerMode === 'replace' ? 'Replace Exercise' : 'Add Exercise'}
            </Text>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#888" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search exercises..."
              placeholderTextColor="#666"
              autoFocus
            />
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContainer}
          >
            <TouchableOpacity
              style={[styles.filterChip, !selectedMuscle && styles.filterChipActive]}
              onPress={() => setSelectedMuscle(null)}
            >
              <Text style={[styles.filterText, !selectedMuscle && styles.filterTextActive]}>All</Text>
            </TouchableOpacity>
            {getMuscleGroups().map(muscle => (
              <TouchableOpacity
                key={muscle}
                style={[styles.filterChip, selectedMuscle === muscle && styles.filterChipActive]}
                onPress={() => setSelectedMuscle(muscle)}
              >
                <Text style={[styles.filterText, selectedMuscle === muscle && styles.filterTextActive]}>
                  {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FlatList
            data={filteredExercises}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.exerciseOption}
                onPress={() => selectExercise(item)}
              >
                <View>
                  <Text style={styles.exerciseOptionName}>{item.name}</Text>
                  <Text style={styles.exerciseOptionMeta}>
                    {item.muscle_group} • {item.equipment || 'bodyweight'}
                  </Text>
                </View>
                <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
          />
        </SafeAreaView>
      </Modal>
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
  exerciseTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  exerciseActions: {
    flexDirection: 'row',
    gap: 12,
  },
  exerciseActionBtn: {
    padding: 4,
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1e',
  },
  modalCancel: {
    fontSize: 17,
    color: '#007AFF',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 10,
    margin: 16,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
  },
  filterScroll: {
    maxHeight: 40,
  },
  filterContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#1c1c1e',
  },
  filterChipActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
  },
  exerciseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    marginBottom: 8,
  },
  exerciseOptionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  exerciseOptionMeta: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
});
