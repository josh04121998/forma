import { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import ProgressChart from '@/components/ProgressChart';
import { getExerciseHistory, getExercisePR, getWorkoutStats } from '@/lib/storage';
import { calculate1RM } from '@/lib/utils';
import { format } from 'date-fns';

interface ExerciseProgress {
  name: string;
  data: { date: string; value: number }[];
  pr: { weight: number; reps: number; date: string } | null;
  estimated1RM: number;
}

// Key exercises to track
const TRACKED_EXERCISES = [
  'Bench Press',
  'Barbell Squat', 
  'Deadlift',
  'Overhead Press',
  'Barbell Row',
];

export default function ProgressScreen() {
  const [exercises, setExercises] = useState<ExerciseProgress[]>([]);
  const [stats, setStats] = useState({ totalWorkouts: 0, thisWeek: 0, totalSets: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const workoutStats = await getWorkoutStats();
    setStats(workoutStats);

    const progressData: ExerciseProgress[] = [];

    for (const exerciseName of TRACKED_EXERCISES) {
      const history = await getExerciseHistory(exerciseName);
      const pr = await getExercisePR(exerciseName);

      if (history.length > 0) {
        // Get the heaviest set from each workout for the chart
        const chartData = history.map(h => {
          const maxWeight = Math.max(...h.sets.map(s => s.weightKg));
          return {
            date: h.date,
            value: maxWeight,
          };
        }).reverse(); // Oldest first for chart

        const estimated1RM = pr ? calculate1RM(pr.weight, pr.reps) : 0;

        progressData.push({
          name: exerciseName,
          data: chartData,
          pr,
          estimated1RM,
        });
      }
    }

    setExercises(progressData);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const selectedData = selectedExercise 
    ? exercises.find(e => e.name === selectedExercise)
    : exercises[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Progress</Text>

        {/* Summary Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.thisWeek}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalSets}</Text>
            <Text style={styles.statLabel}>Total Sets</Text>
          </View>
        </View>

        {exercises.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={64} color="#444" />
            <Text style={styles.emptyText}>No progress data yet</Text>
            <Text style={styles.emptySubtext}>
              Complete workouts to see your progress charts
            </Text>
          </View>
        ) : (
          <>
            {/* Exercise Selector */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.exerciseSelector}
              contentContainerStyle={styles.exerciseSelectorContent}
            >
              {exercises.map((ex) => (
                <TouchableOpacity
                  key={ex.name}
                  style={[
                    styles.exerciseChip,
                    (selectedExercise === ex.name || (!selectedExercise && ex === exercises[0])) && 
                      styles.exerciseChipActive
                  ]}
                  onPress={() => setSelectedExercise(ex.name)}
                >
                  <Text style={[
                    styles.exerciseChipText,
                    (selectedExercise === ex.name || (!selectedExercise && ex === exercises[0])) && 
                      styles.exerciseChipTextActive
                  ]}>
                    {ex.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Progress Chart */}
            {selectedData && (
              <View style={styles.chartContainer}>
                <ProgressChart
                  data={selectedData.data}
                  title={selectedData.name}
                  unit="kg"
                  height={220}
                />
              </View>
            )}

            {/* PR Card */}
            {selectedData?.pr && (
              <View style={styles.prCard}>
                <View style={styles.prHeader}>
                  <Ionicons name="trophy" size={24} color="#ffcc00" />
                  <Text style={styles.prTitle}>Personal Record</Text>
                </View>
                <View style={styles.prStats}>
                  <View style={styles.prStat}>
                    <Text style={styles.prValue}>{selectedData.pr.weight} kg</Text>
                    <Text style={styles.prLabel}>× {selectedData.pr.reps} reps</Text>
                  </View>
                  <View style={styles.prDivider} />
                  <View style={styles.prStat}>
                    <Text style={styles.prValue}>{selectedData.estimated1RM} kg</Text>
                    <Text style={styles.prLabel}>Est. 1RM</Text>
                  </View>
                </View>
                <Text style={styles.prDate}>
                  {format(new Date(selectedData.pr.date), 'MMMM d, yyyy')}
                </Text>
              </View>
            )}

            {/* All PRs Summary */}
            <Text style={styles.sectionTitle}>All Personal Records</Text>
            <View style={styles.prList}>
              {exercises.map((ex) => (
                <View key={ex.name} style={styles.prListItem}>
                  <Text style={styles.prListName}>{ex.name}</Text>
                  {ex.pr ? (
                    <View style={styles.prListStats}>
                      <Text style={styles.prListWeight}>{ex.pr.weight}kg × {ex.pr.reps}</Text>
                      <Text style={styles.prList1RM}>~{ex.estimated1RM}kg 1RM</Text>
                    </View>
                  ) : (
                    <Text style={styles.prListNone}>No data</Text>
                  )}
                </View>
              ))}
            </View>
          </>
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
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
    textAlign: 'center',
  },
  exerciseSelector: {
    marginBottom: 16,
  },
  exerciseSelectorContent: {
    gap: 8,
  },
  exerciseChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1c1c1e',
    borderRadius: 20,
  },
  exerciseChipActive: {
    backgroundColor: '#007AFF',
  },
  exerciseChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  exerciseChipTextActive: {
    color: '#fff',
  },
  chartContainer: {
    marginBottom: 16,
  },
  prCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ffcc0040',
  },
  prHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  prTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  prStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  prStat: {
    flex: 1,
    alignItems: 'center',
  },
  prDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#333',
  },
  prValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  prLabel: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  prDate: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  prList: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    overflow: 'hidden',
  },
  prListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  prListName: {
    fontSize: 15,
    color: '#fff',
    flex: 1,
  },
  prListStats: {
    alignItems: 'flex-end',
  },
  prListWeight: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  prList1RM: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  prListNone: {
    fontSize: 14,
    color: '#666',
  },
});
