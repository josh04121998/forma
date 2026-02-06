import { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { getWorkouts, getWorkoutSets, deleteWorkout, LocalWorkout, LocalWorkoutSet } from '@/lib/storage';
import { format } from 'date-fns';

export default function WorkoutsScreen() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<LocalWorkout[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [workoutSets, setWorkoutSets] = useState<Record<string, LocalWorkoutSet[]>>({});
  const [loading, setLoading] = useState(true);

  const loadWorkouts = useCallback(async () => {
    try {
      const data = await getWorkouts();
      setWorkouts(data);
    } catch (error) {
      console.error('Error loading workouts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [loadWorkouts])
  );

  const toggleExpand = async (workoutId: string) => {
    if (expandedId === workoutId) {
      setExpandedId(null);
      return;
    }
    
    setExpandedId(workoutId);
    
    // Load sets if not cached
    if (!workoutSets[workoutId]) {
      const sets = await getWorkoutSets(workoutId);
      setWorkoutSets(prev => ({ ...prev, [workoutId]: sets }));
    }
  };

  const handleDelete = (workout: LocalWorkout) => {
    Alert.alert(
      'Delete Workout',
      `Delete "${workout.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteWorkout(workout.id);
            loadWorkouts();
          },
        },
      ]
    );
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    if (minutes < 60) return `${minutes}min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
  };

  // Group sets by exercise
  const groupSets = (sets: LocalWorkoutSet[]) => {
    const grouped: { name: string; sets: LocalWorkoutSet[] }[] = [];
    sets.forEach(set => {
      const existing = grouped.find(g => g.name === set.exerciseName);
      if (existing) {
        existing.sets.push(set);
      } else {
        grouped.push({ name: set.exerciseName, sets: [set] });
      }
    });
    return grouped;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Workouts</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/workout/new')}
        >
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {workouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={64} color="#444" />
            <Text style={styles.emptyText}>No workouts yet</Text>
            <Text style={styles.emptySubtext}>
              Start tracking your gains!
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/workout/new')}
            >
              <Text style={styles.emptyButtonText}>Start Workout</Text>
            </TouchableOpacity>
          </View>
        ) : (
          workouts.map((workout) => (
            <View key={workout.id} style={styles.workoutCard}>
              <TouchableOpacity
                style={styles.workoutHeader}
                onPress={() => toggleExpand(workout.id)}
                onLongPress={() => handleDelete(workout)}
              >
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutName}>{workout.name}</Text>
                  <Text style={styles.workoutMeta}>
                    {workout.completedAt 
                      ? format(new Date(workout.completedAt), 'EEE, MMM d')
                      : 'In progress'
                    }
                    {workout.durationMinutes ? ` • ${formatDuration(workout.durationMinutes)}` : ''}
                  </Text>
                </View>
                <Ionicons
                  name={expandedId === workout.id ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#888"
                />
              </TouchableOpacity>

              {expandedId === workout.id && workoutSets[workout.id] && (
                <View style={styles.setsContainer}>
                  {groupSets(workoutSets[workout.id]).map((exercise, idx) => (
                    <View key={idx} style={styles.exerciseGroup}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      {exercise.sets.map((set, setIdx) => (
                        <View key={set.id} style={styles.setRow}>
                          <Text style={styles.setNumber}>{setIdx + 1}</Text>
                          <Text style={styles.setDetail}>
                            {set.weightKg ? `${set.weightKg}kg` : '-'}
                          </Text>
                          <Text style={styles.setDetail}>
                            {set.reps ? `${set.reps} reps` : '-'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))}
                  {workoutSets[workout.id].length === 0 && (
                    <Text style={styles.noSetsText}>No sets recorded</Text>
                  )}
                </View>
              )}
            </View>
          ))
        )}

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
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#888',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#666',
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  workoutCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  workoutMeta: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  setsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    padding: 16,
    paddingTop: 12,
  },
  exerciseGroup: {
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  setNumber: {
    width: 24,
    fontSize: 14,
    color: '#666',
  },
  setDetail: {
    flex: 1,
    fontSize: 14,
    color: '#ccc',
  },
  noSetsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});
