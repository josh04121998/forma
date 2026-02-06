import { useState, useEffect } from 'react';
import { 
  StyleSheet, View, Text, ScrollView, TouchableOpacity, 
  TextInput, Modal, FlatList, Alert 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { createTemplate, TemplateExercise } from '@/lib/storage';
import { getExercises, filterExercises, getMuscleGroups, Exercise } from '@/lib/exercises';

export default function CreateWorkoutScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<TemplateExercise[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    const data = await getExercises();
    setAvailableExercises(data);
  };

  const addExercise = (exercise: Exercise) => {
    const newExercise: TemplateExercise = {
      id: Date.now().toString(),
      name: exercise.name,
      targetSets: 3,
      targetReps: '8-12',
    };
    setExercises([...exercises, newExercise]);
    setShowPicker(false);
    setSearchQuery('');
    setSelectedMuscle(null);
  };

  const addCustomExercise = () => {
    if (!searchQuery.trim()) return;
    
    const newExercise: TemplateExercise = {
      id: Date.now().toString(),
      name: searchQuery.trim(),
      targetSets: 3,
      targetReps: '8-12',
    };
    setExercises([...exercises, newExercise]);
    setShowPicker(false);
    setSearchQuery('');
  };

  const updateExercise = (id: string, field: keyof TemplateExercise, value: any) => {
    setExercises(exercises.map(ex => 
      ex.id === id ? { ...ex, [field]: value } : ex
    ));
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= exercises.length) return;
    
    const newExercises = [...exercises];
    [newExercises[index], newExercises[newIndex]] = [newExercises[newIndex], newExercises[index]];
    setExercises(newExercises);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a workout name');
      return;
    }
    if (exercises.length === 0) {
      Alert.alert('No Exercises', 'Add at least one exercise');
      return;
    }

    setSaving(true);
    try {
      await createTemplate({
        name: name.trim(),
        exercises,
      });
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save workout');
    } finally {
      setSaving(false);
    }
  };

  const filteredExercises = filterExercises(
    availableExercises, 
    selectedMuscle || undefined, 
    searchQuery || undefined
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Workout</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          <Text style={[styles.saveText, saving && styles.saveTextDisabled]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Name Input */}
        <View style={styles.field}>
          <Text style={styles.label}>Workout Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Push Day, Upper Body A"
            placeholderTextColor="#666"
          />
        </View>

        {/* Exercises */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exercises</Text>
          
          {exercises.map((exercise, index) => (
            <View key={exercise.id} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <View style={styles.exerciseActions}>
                  <TouchableOpacity onPress={() => moveExercise(index, 'up')}>
                    <Ionicons name="chevron-up" size={20} color="#888" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => moveExercise(index, 'down')}>
                    <Ionicons name="chevron-down" size={20} color="#888" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeExercise(exercise.id)}>
                    <Ionicons name="trash-outline" size={20} color="#ff453a" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.exerciseInputs}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Sets</Text>
                  <TextInput
                    style={styles.smallInput}
                    value={String(exercise.targetSets)}
                    onChangeText={(v) => updateExercise(exercise.id, 'targetSets', parseInt(v) || 0)}
                    keyboardType="numeric"
                    placeholder="3"
                    placeholderTextColor="#666"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Reps</Text>
                  <TextInput
                    style={styles.smallInput}
                    value={exercise.targetReps}
                    onChangeText={(v) => updateExercise(exercise.id, 'targetReps', v)}
                    placeholder="8-12"
                    placeholderTextColor="#666"
                  />
                </View>
              </View>
            </View>
          ))}

          {/* Add Exercise Button */}
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowPicker(true)}
          >
            <Ionicons name="add" size={24} color="#007AFF" />
            <Text style={styles.addButtonText}>Add Exercise</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Exercise Picker Modal */}
      <Modal
        visible={showPicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              setShowPicker(false);
              setSearchQuery('');
              setSelectedMuscle(null);
            }}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Exercise</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#888" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search or add custom..."
              placeholderTextColor="#666"
              autoFocus
            />
          </View>

          {/* Muscle Group Filter */}
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

          {/* Add Custom Option */}
          {searchQuery.trim() && !filteredExercises.some(e => 
            e.name.toLowerCase() === searchQuery.toLowerCase()
          ) && (
            <TouchableOpacity 
              style={styles.customOption}
              onPress={addCustomExercise}
            >
              <Ionicons name="add-circle" size={24} color="#007AFF" />
              <Text style={styles.customOptionText}>
                Add "{searchQuery}" as custom exercise
              </Text>
            </TouchableOpacity>
          )}

          {/* Exercise List */}
          <FlatList
            data={filteredExercises}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.exerciseOption}
                onPress={() => addExercise(item)}
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
  saveText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  saveTextDisabled: {
    opacity: 0.5,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  field: {
    marginTop: 20,
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#888',
  },
  input: {
    backgroundColor: '#1c1c1e',
    borderRadius: 10,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  exerciseCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  exerciseActions: {
    flexDirection: 'row',
    gap: 12,
  },
  exerciseInputs: {
    flexDirection: 'row',
    gap: 16,
  },
  inputGroup: {
    flex: 1,
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    color: '#888',
  },
  smallInput: {
    backgroundColor: '#2c2c2e',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 15,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  addButtonText: {
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
  customOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
  },
  customOptionText: {
    fontSize: 15,
    color: '#007AFF',
    flex: 1,
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
