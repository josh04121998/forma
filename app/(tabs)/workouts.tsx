import { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { 
  getWorkouts, getWorkoutSets, deleteWorkout, 
  getTemplates, deleteTemplate,
  LocalWorkout, LocalWorkoutSet, WorkoutTemplate 
} from '@/lib/storage';
import { format } from 'date-fns';

type Tab = 'templates' | 'history';

export default function WorkoutsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('templates');
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [workouts, setWorkouts] = useState<LocalWorkout[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [workoutSets, setWorkoutSets] = useState<Record<string, LocalWorkoutSet[]>>({});
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [templateData, workoutData] = await Promise.all([
        getTemplates(),
        getWorkouts(),
      ]);
      setTemplates(templateData);
      setWorkouts(workoutData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const toggleExpand = async (workoutId: string) => {
    if (expandedId === workoutId) {
      setExpandedId(null);
      return;
    }
    
    setExpandedId(workoutId);
    
    if (!workoutSets[workoutId]) {
      const sets = await getWorkoutSets(workoutId);
      setWorkoutSets(prev => ({ ...prev, [workoutId]: sets }));
    }
  };

  const handleDeleteWorkout = (workout: LocalWorkout) => {
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
            loadData();
          },
        },
      ]
    );
  };

  const handleDeleteTemplate = (template: WorkoutTemplate) => {
    if (template.isDefault) {
      Alert.alert('Cannot Delete', 'Default templates cannot be deleted.');
      return;
    }
    
    Alert.alert(
      'Delete Template',
      `Delete "${template.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTemplate(template.id);
            loadData();
          },
        },
      ]
    );
  };

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

  const renderTemplates = () => (
    <>
      {templates.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="clipboard-outline" size={64} color="#444" />
          <Text style={styles.emptyText}>No workout templates</Text>
          <Text style={styles.emptySubtext}>Create your first template</Text>
        </View>
      ) : (
        templates.map((template) => (
          <TouchableOpacity
            key={template.id}
            style={styles.templateCard}
            onPress={() => router.push(`/workout/start?templateId=${template.id}`)}
            onLongPress={() => handleDeleteTemplate(template)}
          >
            <View style={styles.templateHeader}>
              <View style={styles.templateIcon}>
                <Ionicons name="barbell" size={20} color="#007AFF" />
              </View>
              <View style={styles.templateInfo}>
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateMeta}>
                  {template.exercises.length} exercises
                  {template.isDefault && ' • Default'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => router.push(`/workout/start?templateId=${template.id}`)}
              >
                <Ionicons name="play" size={16} color="#fff" />
                <Text style={styles.startButtonText}>Start</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.exerciseList}>
              {template.exercises.slice(0, 4).map((ex, i) => (
                <Text key={ex.id} style={styles.exerciseItem}>
                  • {ex.name} ({ex.targetSets}×{ex.targetReps})
                </Text>
              ))}
              {template.exercises.length > 4 && (
                <Text style={styles.exerciseMore}>
                  +{template.exercises.length - 4} more
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))
      )}
    </>
  );

  const renderHistory = () => (
    <>
      {workouts.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={64} color="#444" />
          <Text style={styles.emptyText}>No workout history</Text>
          <Text style={styles.emptySubtext}>Complete a workout to see it here</Text>
        </View>
      ) : (
        workouts.map((workout) => (
          <View key={workout.id} style={styles.historyCard}>
            <TouchableOpacity
              style={styles.historyHeader}
              onPress={() => toggleExpand(workout.id)}
              onLongPress={() => handleDeleteWorkout(workout)}
            >
              <View style={styles.historyInfo}>
                <Text style={styles.historyName}>{workout.name}</Text>
                <Text style={styles.historyMeta}>
                  {workout.completedAt 
                    ? format(new Date(workout.completedAt), 'EEE, MMM d • h:mm a')
                    : 'In progress'
                  }
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
                    <Text style={styles.exerciseGroupName}>{exercise.name}</Text>
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
    </>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Workouts</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/workout/create')}
        >
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'templates' && styles.tabActive]}
          onPress={() => setTab('templates')}
        >
          <Text style={[styles.tabText, tab === 'templates' && styles.tabTextActive]}>
            Templates
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'history' && styles.tabActive]}
          onPress={() => setTab('history')}
        >
          <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>
            History
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {tab === 'templates' ? renderTemplates() : renderHistory()}
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
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#888',
  },
  tabTextActive: {
    color: '#fff',
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
  templateCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  templateIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#007AFF20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  templateMeta: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  exerciseList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  exerciseItem: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  exerciseMore: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  historyCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  historyInfo: {
    flex: 1,
  },
  historyName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  historyMeta: {
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
  exerciseGroupName: {
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
