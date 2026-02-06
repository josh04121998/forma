import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function WorkoutsScreen() {
  const router = useRouter();
  const workouts: any[] = []; // TODO: Fetch from Supabase

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <TouchableOpacity 
          style={styles.newButton}
          onPress={() => router.push('/workout/new')}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.newButtonText}>New Workout</Text>
        </TouchableOpacity>

        {workouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="barbell-outline" size={64} color="#444" />
            <Text style={styles.emptyText}>No workouts yet</Text>
            <Text style={styles.emptySubtext}>Start your first workout to see it here</Text>
          </View>
        ) : (
          workouts.map((workout) => (
            <TouchableOpacity 
              key={workout.id} 
              style={styles.workoutCard}
              onPress={() => router.push(`/workout/${workout.id}`)}
            >
              <View style={styles.workoutHeader}>
                <Text style={styles.workoutName}>{workout.name || 'Untitled'}</Text>
                <Text style={styles.workoutDate}>
                  {new Date(workout.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.workoutMeta}>
                {workout.duration_minutes} min • {workout.sets?.length || 0} exercises
              </Text>
            </TouchableOpacity>
          ))
        )}
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
  newButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 24,
  },
  newButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  workoutCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  workoutDate: {
    fontSize: 14,
    color: '#888',
  },
  workoutMeta: {
    fontSize: 14,
    color: '#666',
  },
});
