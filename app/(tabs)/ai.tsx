import { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { generateWorkout, generateMealPlan } from '@/lib/ai';

type Tab = 'workout' | 'meal';

export default function AICoachScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('workout');
  const [loading, setLoading] = useState(false);
  const [generatedWorkout, setGeneratedWorkout] = useState<any>(null);
  const [generatedMeal, setGeneratedMeal] = useState<any>(null);

  // Workout form
  const [workoutGoal, setWorkoutGoal] = useState('muscle');
  const [experience, setExperience] = useState('intermediate');
  const [duration, setDuration] = useState('60');
  const [equipment, setEquipment] = useState('full');

  // Meal form
  const [mealGoal, setMealGoal] = useState('muscle_gain');
  const [calories, setCalories] = useState('2500');
  const [mealsPerDay, setMealsPerDay] = useState('4');

  const handleGenerateWorkout = async () => {
    setLoading(true);
    setGeneratedWorkout(null);
    try {
      const workout = await generateWorkout({
        goal: workoutGoal,
        experience,
        duration: parseInt(duration),
        equipment: equipment === 'full' ? 'full gym' : equipment === 'home' ? 'dumbbells only' : 'bodyweight only',
      });
      setGeneratedWorkout(workout);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to generate workout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMealPlan = async () => {
    setLoading(true);
    setGeneratedMeal(null);
    try {
      const mealPlan = await generateMealPlan({
        goal: mealGoal,
        calories: parseInt(calories),
        mealsPerDay: parseInt(mealsPerDay),
      });
      setGeneratedMeal(mealPlan);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to generate meal plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'workout' && styles.activeTab]}
            onPress={() => setActiveTab('workout')}
          >
            <Ionicons name="barbell" size={20} color={activeTab === 'workout' ? '#fff' : '#888'} />
            <Text style={[styles.tabText, activeTab === 'workout' && styles.activeTabText]}>Workout</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'meal' && styles.activeTab]}
            onPress={() => setActiveTab('meal')}
          >
            <Ionicons name="restaurant" size={20} color={activeTab === 'meal' ? '#fff' : '#888'} />
            <Text style={[styles.tabText, activeTab === 'meal' && styles.activeTabText]}>Meal Plan</Text>
          </TouchableOpacity>
        </View>

        {/* Workout Generation */}
        {activeTab === 'workout' && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>Generate Workout</Text>
            <Text style={styles.formSubtitle}>AI will create a personalized workout</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Goal</Text>
              <View style={styles.optionRow}>
                {['strength', 'muscle', 'weight_loss'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.option, workoutGoal === g && styles.optionActive]}
                    onPress={() => setWorkoutGoal(g)}
                  >
                    <Text style={[styles.optionText, workoutGoal === g && styles.optionTextActive]}>
                      {g === 'strength' ? 'Strength' : g === 'muscle' ? 'Muscle' : 'Fat Loss'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Experience</Text>
              <View style={styles.optionRow}>
                {['beginner', 'intermediate', 'advanced'].map((e) => (
                  <TouchableOpacity
                    key={e}
                    style={[styles.option, experience === e && styles.optionActive]}
                    onPress={() => setExperience(e)}
                  >
                    <Text style={[styles.optionText, experience === e && styles.optionTextActive]}>
                      {e.charAt(0).toUpperCase() + e.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Equipment</Text>
              <View style={styles.optionRow}>
                {[
                  { key: 'full', label: 'Full Gym' },
                  { key: 'home', label: 'Home' },
                  { key: 'none', label: 'Bodyweight' },
                ].map((e) => (
                  <TouchableOpacity
                    key={e.key}
                    style={[styles.option, equipment === e.key && styles.optionActive]}
                    onPress={() => setEquipment(e.key)}
                  >
                    <Text style={[styles.optionText, equipment === e.key && styles.optionTextActive]}>
                      {e.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Duration (minutes)</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                placeholderTextColor="#666"
              />
            </View>

            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleGenerateWorkout}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="#fff" />
                  <Text style={styles.generateButtonText}>Generate Workout</Text>
                </>
              )}
            </TouchableOpacity>

            {generatedWorkout && (
              <View style={styles.result}>
                <Text style={styles.resultTitle}>{generatedWorkout.name}</Text>
                <Text style={styles.resultMeta}>~{generatedWorkout.estimated_duration} min</Text>
                {generatedWorkout.exercises?.map((ex: any, i: number) => (
                  <View key={i} style={styles.exercise}>
                    <Text style={styles.exerciseName}>{ex.name}</Text>
                    <Text style={styles.exerciseMeta}>
                      {ex.sets} sets × {ex.reps} • {ex.rest_seconds}s rest
                    </Text>
                    {ex.notes && <Text style={styles.exerciseNotes}>{ex.notes}</Text>}
                  </View>
                ))}
                <TouchableOpacity style={styles.useButton}>
                  <Text style={styles.useButtonText}>Use This Workout</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Meal Generation */}
        {activeTab === 'meal' && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>Generate Meal Plan</Text>
            <Text style={styles.formSubtitle}>AI will create a personalized meal plan</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Goal</Text>
              <View style={styles.optionRow}>
                {['muscle_gain', 'fat_loss', 'maintenance'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.option, mealGoal === g && styles.optionActive]}
                    onPress={() => setMealGoal(g)}
                  >
                    <Text style={[styles.optionText, mealGoal === g && styles.optionTextActive]}>
                      {g === 'muscle_gain' ? 'Gain' : g === 'fat_loss' ? 'Lose' : 'Maintain'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Daily Calories</Text>
              <TextInput
                style={styles.input}
                value={calories}
                onChangeText={setCalories}
                keyboardType="numeric"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Meals per Day</Text>
              <View style={styles.optionRow}>
                {['3', '4', '5', '6'].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.option, mealsPerDay === m && styles.optionActive]}
                    onPress={() => setMealsPerDay(m)}
                  >
                    <Text style={[styles.optionText, mealsPerDay === m && styles.optionTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleGenerateMealPlan}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="#fff" />
                  <Text style={styles.generateButtonText}>Generate Meal Plan</Text>
                </>
              )}
            </TouchableOpacity>

            {generatedMeal && (
              <View style={styles.result}>
                <Text style={styles.resultTitle}>{generatedMeal.name}</Text>
                <Text style={styles.resultMeta}>
                  {generatedMeal.total_calories} cal • {generatedMeal.total_protein}g protein
                </Text>
                {generatedMeal.meals?.map((meal: any, i: number) => (
                  <View key={i} style={styles.exercise}>
                    <Text style={styles.exerciseName}>{meal.name}</Text>
                    {meal.foods?.map((food: any, j: number) => (
                      <Text key={j} style={styles.exerciseMeta}>
                        {food.name} ({food.portion}) - {food.calories} cal
                      </Text>
                    ))}
                  </View>
                ))}
                <TouchableOpacity style={styles.useButton}>
                  <Text style={styles.useButtonText}>Save Meal Plan</Text>
                </TouchableOpacity>
              </View>
            )}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 4,
    marginTop: 16,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#333',
  },
  tabText: {
    color: '#888',
    fontSize: 15,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  form: {
    gap: 16,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  formSubtitle: {
    fontSize: 15,
    color: '#888',
    marginBottom: 8,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    color: '#888',
    fontWeight: '500',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    backgroundColor: '#1c1c1e',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  optionActive: {
    backgroundColor: '#007AFF',
  },
  optionText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#fff',
  },
  input: {
    backgroundColor: '#1c1c1e',
    borderRadius: 10,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  generateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  result: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  resultMeta: {
    fontSize: 14,
    color: '#888',
  },
  exercise: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 12,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
  exerciseMeta: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  exerciseNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  useButton: {
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  useButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
