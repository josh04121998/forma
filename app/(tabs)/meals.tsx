import { useState, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { getMealPlans, getActiveMealPlan, LocalMealPlan } from '@/lib/storage';

export default function MealsScreen() {
  const router = useRouter();
  const [mealPlans, setMealPlans] = useState<LocalMealPlan[]>([]);
  const [activePlan, setActivePlan] = useState<LocalMealPlan | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [plans, active] = await Promise.all([
      getMealPlans(),
      getActiveMealPlan(),
    ]);
    setMealPlans(plans);
    setActivePlan(active);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Meals</Text>

        <TouchableOpacity 
          style={styles.generateButton}
          onPress={() => router.push('/(tabs)/ai')}
        >
          <Ionicons name="sparkles" size={24} color="#fff" />
          <Text style={styles.generateButtonText}>Generate Meal Plan</Text>
        </TouchableOpacity>

        {activePlan ? (
          <>
            {/* Active Plan */}
            <View style={styles.activePlanCard}>
              <View style={styles.activeBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#30d158" />
                <Text style={styles.activeBadgeText}>Active Plan</Text>
              </View>
              
              <Text style={styles.planName}>{activePlan.name}</Text>
              
              <View style={styles.macros}>
                <View style={styles.macro}>
                  <Text style={styles.macroValue}>{activePlan.targetCalories}</Text>
                  <Text style={styles.macroLabel}>calories</Text>
                </View>
                <View style={styles.macro}>
                  <Text style={styles.macroValue}>{activePlan.targetProtein}g</Text>
                  <Text style={styles.macroLabel}>protein</Text>
                </View>
                <View style={styles.macro}>
                  <Text style={styles.macroValue}>{activePlan.targetCarbs}g</Text>
                  <Text style={styles.macroLabel}>carbs</Text>
                </View>
                <View style={styles.macro}>
                  <Text style={styles.macroValue}>{activePlan.targetFat}g</Text>
                  <Text style={styles.macroLabel}>fat</Text>
                </View>
              </View>

              {/* Meals */}
              <View style={styles.mealsSection}>
                <Text style={styles.mealsSectionTitle}>Daily Meals</Text>
                {activePlan.meals.map((meal: any, index: number) => (
                  <View key={index} style={styles.mealItem}>
                    <Text style={styles.mealName}>{meal.name}</Text>
                    <View style={styles.foodsList}>
                      {meal.foods.map((food: any, foodIndex: number) => (
                        <Text key={foodIndex} style={styles.foodItem}>
                          • {food.name} ({food.portion}) - {food.calories} cal, {food.protein}g protein
                        </Text>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="restaurant-outline" size={64} color="#444" />
            <Text style={styles.emptyText}>No meal plan yet</Text>
            <Text style={styles.emptySubtext}>
              Generate a personalized meal plan with AI Coach
            </Text>
          </View>
        )}

        {/* Previous Plans */}
        {mealPlans.filter(p => p.id !== activePlan?.id).length > 0 && (
          <View style={styles.previousSection}>
            <Text style={styles.sectionTitle}>Previous Plans</Text>
            {mealPlans.filter(p => p.id !== activePlan?.id).map((plan) => (
              <View key={plan.id} style={styles.planCard}>
                <Text style={styles.planCardName}>{plan.name}</Text>
                <Text style={styles.planCardMacros}>
                  {plan.targetCalories} cal • {plan.targetProtein}g protein
                </Text>
              </View>
            ))}
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
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 20,
  },
  generateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  activePlanCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#30d15840',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  activeBadgeText: {
    fontSize: 13,
    color: '#30d158',
    fontWeight: '600',
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  macros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#2c2c2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  macro: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  macroLabel: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  mealsSection: {
    gap: 16,
  },
  mealsSectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  mealItem: {
    backgroundColor: '#2c2c2e',
    borderRadius: 12,
    padding: 16,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  foodsList: {
    gap: 4,
  },
  foodItem: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  emptyState: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    gap: 8,
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
  previousSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  planCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  planCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  planCardMacros: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
});
