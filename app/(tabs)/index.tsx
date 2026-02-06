import { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { getWorkoutStats, getWorkouts, getTemplates, LocalWorkout, WorkoutTemplate } from '@/lib/storage';
import { useAuth } from '@/lib/auth';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    thisWeek: 0,
    totalSets: 0,
  });
  const [recentWorkouts, setRecentWorkouts] = useState<LocalWorkout[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [workoutStats, workouts, templateList] = await Promise.all([
        getWorkoutStats(),
        getWorkouts(),
        getTemplates(),
      ]);
      setStats(workoutStats);
      setRecentWorkouts(workouts.slice(0, 3));
      setTemplates(templateList.slice(0, 3));
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.greeting}>Let's crush it 💪</Text>
        
        {/* Stats Grid */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.thisWeek}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalSets}</Text>
            <Text style={styles.statLabel}>Sets</Text>
          </View>
        </View>

        {/* Quick Start - Workout Templates */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Start</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/workouts')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.templatesRow}
          >
            {templates.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={styles.templateCard}
                onPress={() => router.push(`/workout/start?templateId=${template.id}`)}
              >
                <Ionicons name="barbell" size={24} color="#007AFF" />
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateMeta}>
                  {template.exercises.length} exercises
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.templateCard, styles.templateCardAdd]}
              onPress={() => router.push('/workout/create')}
            >
              <Ionicons name="add" size={24} color="#888" />
              <Text style={styles.templateAddText}>Create New</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* AI Coach Promo */}
        <TouchableOpacity 
          style={styles.aiPromo}
          onPress={() => router.push('/(tabs)/ai')}
        >
          <View style={styles.aiPromoIcon}>
            <Ionicons name="sparkles" size={24} color="#fff" />
          </View>
          <View style={styles.aiPromoText}>
            <Text style={styles.aiPromoTitle}>AI Coach</Text>
            <Text style={styles.aiPromoSubtitle}>Get a personalized workout program</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#888" />
        </TouchableOpacity>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Workouts</Text>
          
          {recentWorkouts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="barbell-outline" size={48} color="#444" />
              <Text style={styles.emptyText}>No workouts yet</Text>
              <Text style={styles.emptySubtext}>Pick a workout above to start!</Text>
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
                  </Text>
                </View>
                {workout.completedAt && (
                  <Ionicons name="checkmark-circle" size={20} color="#30d158" />
                )}
              </View>
            ))
          )}
        </View>

        {/* Sign Up Prompt */}
        {stats.totalWorkouts > 0 && !user && (
          <View style={styles.signupPrompt}>
            <Ionicons name="cloud-upload-outline" size={24} color="#007AFF" />
            <View style={styles.signupText}>
              <Text style={styles.signupTitle}>Backup your progress</Text>
              <Text style={styles.signupSubtitle}>Create an account to sync across devices</Text>
            </View>
            <TouchableOpacity 
              style={styles.signupButton}
              onPress={() => router.push('/auth/signup')}
            >
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
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  seeAll: {
    fontSize: 15,
    color: '#007AFF',
  },
  templatesRow: {
    gap: 12,
  },
  templateCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 16,
    width: 140,
    gap: 8,
  },
  templateCardAdd: {
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  templateMeta: {
    fontSize: 13,
    color: '#888',
  },
  templateAddText: {
    fontSize: 14,
    color: '#888',
  },
  aiPromo: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  aiPromoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiPromoText: {
    flex: 1,
  },
  aiPromoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  aiPromoSubtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
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
