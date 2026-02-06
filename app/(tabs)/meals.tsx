import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function MealsScreen() {
  const router = useRouter();
  const mealPlans: any[] = []; // TODO: Fetch from Supabase

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <TouchableOpacity 
          style={styles.generateButton}
          onPress={() => router.push('/(tabs)/ai')}
        >
          <Ionicons name="sparkles" size={24} color="#fff" />
          <Text style={styles.generateButtonText}>Generate Meal Plan</Text>
        </TouchableOpacity>

        {mealPlans.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={64} color="#444" />
            <Text style={styles.emptyText}>No meal plans yet</Text>
            <Text style={styles.emptySubtext}>Generate your first AI meal plan</Text>
          </View>
        ) : (
          mealPlans.map((plan) => (
            <TouchableOpacity 
              key={plan.id} 
              style={styles.planCard}
              onPress={() => router.push(`/meal/${plan.id}`)}
            >
              <Text style={styles.planName}>{plan.name}</Text>
              <View style={styles.macros}>
                <View style={styles.macro}>
                  <Text style={styles.macroValue}>{plan.target_calories}</Text>
                  <Text style={styles.macroLabel}>cal</Text>
                </View>
                <View style={styles.macro}>
                  <Text style={styles.macroValue}>{plan.target_protein_g}g</Text>
                  <Text style={styles.macroLabel}>protein</Text>
                </View>
                <View style={styles.macro}>
                  <Text style={styles.macroValue}>{plan.target_carbs_g}g</Text>
                  <Text style={styles.macroLabel}>carbs</Text>
                </View>
                <View style={styles.macro}>
                  <Text style={styles.macroValue}>{plan.target_fat_g}g</Text>
                  <Text style={styles.macroLabel}>fat</Text>
                </View>
              </View>
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
  generateButton: {
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
  generateButtonText: {
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
  planCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  macros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macro: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  macroLabel: {
    fontSize: 12,
    color: '#888',
  },
});
