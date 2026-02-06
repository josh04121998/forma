import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { getWorkoutStats, getWorkouts, LocalWorkout } from '@/lib/storage';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    thisWeek: 0,
    totalSets: 0,
  });
  const [recentWorkouts, setRecentWorkouts] = useState<LocalWorkout[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [workoutStats, workouts] = await Promise.all([
        getWorkoutStats(),
        getWorkouts(),
      ]);
      setStats(workoutStats);
      setRecentWorkouts(workouts.slice(0, 5)); // Last 5 workouts
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    if (minutes < 60) return `${minutes}m`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.greeting}>Let's crush it 💪</Text>
        
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/workout/new')}
          >
            <Ionicons name="barbell" size={24} color="#fff" />
            <Text style={styles.primaryButtonText}>Start Workout</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push('/(tabs)/ai')}
          >
            <Ionicons name="sparkles" size={24} color="#fff" />
            <Text style={styles.secondaryButtonText}>AI Coach</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="calendar-outline" size={20} color="#007AFF" />
            <Text style={styles.statValue}>{stats.thisWeek}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="barbell-outline" size={20} color="#30d158" />
            <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
            <Text style={styles.statLabel}>Total Workouts</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="layers-outline" size={20} color="#ff9f0a" />
            <Text style={styles.statValue}>{stats.totalSets}</Text>
            <Text style={styles.statLabel}>Total Sets</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="cloud-offline-outline" size={20} color="#888" />
            <Text style={styles.statValue}>Local</Text>
            <Text style={styles.statLabel}>Storage</Text>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Workouts</Text>
          
          {recentWorkouts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="barbell-outline" size={48} color="#444" />
              <Text style={styles.emptyText}>No workouts yet</Text>
              <Text style={styles.emptySubtext}>Start your first workout!</Text>
            </View>
          ) : (
            recentWorkouts.map((workout) => (
              <View key={workout.id} style={styles.workoutCard}>
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutName}>{workout.name}</Text>
                  <Text style={styles.workoutMeta}>
                    {workout.completedAt 
                      ? formatDistanceToNow(new Date(workout.completedAt), { addSuffix: true })
                      : 'In progress'
                    }
                    {workout.durationMinutes ? ` • ${formatDuration(workout.durationMinutes)}` : ''}
                  </Text>
                </View>
                <View style={styles.syncBadge}>
                  <Ionicons 
                    name={workout.syncStatus === 'synced' ? 'cloud-done' : 'cloud-offline'} 
                    size={16} 
                    color={workout.syncStatus === 'synced' ? '#30d158' : '#888'} 
                  />
                </View>
              </View>
            ))
          )}
        </View>

        {/* Sign Up Prompt (shown after first workout) */}
        {stats.totalWorkouts > 0 && (
          <View style={styles.signupPrompt}>
            <Ionicons name="cloud-upload-outline" size={24} color="#007AFF" />
            <View style={styles.signupText}>
              <Text style={styles.signupTitle}>Backup your progress</Text>
              <Text style={styles.signupSubtitle}>Create an account to sync across devices</Text>
            </View>
            <TouchableOpacity style={styles.signupButton}>
              <Text style={styles.signupButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
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
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 24,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  workoutCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  workoutMeta: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  syncBadge: {
    marginLeft: 12,
  },
  signupPrompt: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#007AFF33',
  },
  signupText: {
    flex: 1,
  },
  signupTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  signupSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  signupButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
