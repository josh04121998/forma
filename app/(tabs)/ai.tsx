import { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { generateFullProgram, UserProfile, GeneratedProgram } from '@/lib/ai';
import { config } from '@/lib/config';

type Step = 'basics' | 'goals' | 'preferences' | 'generating' | 'results';

export default function AICoachScreen() {
  const [step, setStep] = useState<Step>('basics');
  const [loading, setLoading] = useState(false);
  const [program, setProgram] = useState<GeneratedProgram | null>(null);

  // Form state
  const [profile, setProfile] = useState<UserProfile>({
    age: 25,
    gender: 'male',
    height: 175,
    weight: 75,
    goal: 'build_muscle',
    experience: 'intermediate',
    workoutDays: 4,
    equipment: 'full_gym',
    injuries: '',
    dietaryRestrictions: [],
  });

  const updateProfile = (key: keyof UserProfile, value: any) => {
    setProfile({ ...profile, [key]: value });
  };

  const handleGenerate = async () => {
    if (!config.groqApiKey) {
      Alert.alert('Setup Required', 'Please add your Groq API key to the .env file.\n\nEXPO_PUBLIC_GROQ_API_KEY=your-key');
      return;
    }
    
    setStep('generating');
    setLoading(true);
    try {
      const result = await generateFullProgram(profile, config.groqApiKey);
      setProgram(result);
      setStep('results');
    } catch (error) {
      console.error('Generation error:', error);
      Alert.alert('Error', 'Failed to generate program. Please try again.');
      setStep('preferences');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep('basics');
    setProgram(null);
  };

  // Step 1: Basic Info
  const renderBasics = () => (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>Let's get to know you</Text>
      <Text style={styles.stepSubtitle}>Basic information for your personalized plan</Text>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            value={String(profile.age)}
            onChangeText={(v) => updateProfile('age', parseInt(v) || 0)}
            keyboardType="numeric"
            placeholderTextColor="#666"
          />
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.optionRow}>
            {(['male', 'female'] as const).map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.smallOption, profile.gender === g && styles.optionActive]}
                onPress={() => updateProfile('gender', g)}
              >
                <Text style={[styles.optionText, profile.gender === g && styles.optionTextActive]}>
                  {g === 'male' ? '♂' : '♀'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Height (cm)</Text>
          <TextInput
            style={styles.input}
            value={String(profile.height)}
            onChangeText={(v) => updateProfile('height', parseInt(v) || 0)}
            keyboardType="numeric"
            placeholderTextColor="#666"
          />
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Weight (kg)</Text>
          <TextInput
            style={styles.input}
            value={String(profile.weight)}
            onChangeText={(v) => updateProfile('weight', parseInt(v) || 0)}
            keyboardType="numeric"
            placeholderTextColor="#666"
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Experience Level</Text>
        <View style={styles.optionRow}>
          {(['beginner', 'intermediate', 'advanced'] as const).map((e) => (
            <TouchableOpacity
              key={e}
              style={[styles.option, profile.experience === e && styles.optionActive]}
              onPress={() => updateProfile('experience', e)}
            >
              <Text style={[styles.optionText, profile.experience === e && styles.optionTextActive]}>
                {e.charAt(0).toUpperCase() + e.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={() => setStep('goals')}>
        <Text style={styles.nextButtonText}>Next</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  // Step 2: Goals
  const renderGoals = () => (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>What's your goal?</Text>
      <Text style={styles.stepSubtitle}>We'll tailor your program accordingly</Text>

      <View style={styles.goalGrid}>
        {[
          { key: 'lose_fat', icon: 'flame', label: 'Lose Fat', desc: 'Calorie deficit + training' },
          { key: 'build_muscle', icon: 'barbell', label: 'Build Muscle', desc: 'Hypertrophy focus' },
          { key: 'strength', icon: 'trophy', label: 'Get Stronger', desc: 'Strength training' },
          { key: 'maintain', icon: 'fitness', label: 'Stay Fit', desc: 'Maintain current shape' },
        ].map((g) => (
          <TouchableOpacity
            key={g.key}
            style={[styles.goalCard, profile.goal === g.key && styles.goalCardActive]}
            onPress={() => updateProfile('goal', g.key)}
          >
            <Ionicons 
              name={g.icon as any} 
              size={32} 
              color={profile.goal === g.key ? '#fff' : '#888'} 
            />
            <Text style={[styles.goalLabel, profile.goal === g.key && styles.goalLabelActive]}>
              {g.label}
            </Text>
            <Text style={[styles.goalDesc, profile.goal === g.key && styles.goalDescActive]}>
              {g.desc}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep('basics')}>
          <Ionicons name="arrow-back" size={20} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.nextButton, { flex: 1 }]} onPress={() => setStep('preferences')}>
          <Text style={styles.nextButtonText}>Next</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Step 3: Preferences
  const renderPreferences = () => (
    <View style={styles.form}>
      <Text style={styles.stepTitle}>Final details</Text>
      <Text style={styles.stepSubtitle}>Customize your program</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Days per week you can workout</Text>
        <View style={styles.optionRow}>
          {[2, 3, 4, 5, 6].map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.smallOption, profile.workoutDays === d && styles.optionActive]}
              onPress={() => updateProfile('workoutDays', d)}
            >
              <Text style={[styles.optionText, profile.workoutDays === d && styles.optionTextActive]}>
                {d}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Equipment Access</Text>
        <View style={styles.optionRow}>
          {[
            { key: 'full_gym', label: 'Full Gym' },
            { key: 'home', label: 'Home' },
            { key: 'bodyweight', label: 'None' },
          ].map((e) => (
            <TouchableOpacity
              key={e.key}
              style={[styles.option, profile.equipment === e.key && styles.optionActive]}
              onPress={() => updateProfile('equipment', e.key)}
            >
              <Text style={[styles.optionText, profile.equipment === e.key && styles.optionTextActive]}>
                {e.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Any injuries or limitations? (optional)</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
          value={profile.injuries}
          onChangeText={(v) => updateProfile('injuries', v)}
          placeholder="e.g., bad lower back, knee issues..."
          placeholderTextColor="#666"
          multiline
        />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => setStep('goals')}>
          <Ionicons name="arrow-back" size={20} color="#888" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.generateButton, { flex: 1 }]} onPress={handleGenerate}>
          <Ionicons name="sparkles" size={20} color="#fff" />
          <Text style={styles.generateButtonText}>Generate My Program</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Loading State
  const renderGenerating = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingTitle}>Creating your program...</Text>
      <Text style={styles.loadingSubtitle}>
        Our AI coach is designing your personalized{'\n'}workout and meal plan
      </Text>
    </View>
  );

  // Results
  const renderResults = () => {
    if (!program) return null;
    
    return (
      <View style={styles.form}>
        <View style={styles.resultHeader}>
          <Ionicons name="checkmark-circle" size={48} color="#30d158" />
          <Text style={styles.resultTitle}>Your Program is Ready!</Text>
        </View>

        <Text style={styles.summaryText}>{program.summary}</Text>

        {/* Macro Targets */}
        <View style={styles.macroCard}>
          <Text style={styles.sectionTitle}>Daily Targets</Text>
          <View style={styles.macroRow}>
            <View style={styles.macro}>
              <Text style={styles.macroValue}>{program.calories}</Text>
              <Text style={styles.macroLabel}>calories</Text>
            </View>
            <View style={styles.macro}>
              <Text style={styles.macroValue}>{program.protein}g</Text>
              <Text style={styles.macroLabel}>protein</Text>
            </View>
            <View style={styles.macro}>
              <Text style={styles.macroValue}>{program.carbs}g</Text>
              <Text style={styles.macroLabel}>carbs</Text>
            </View>
            <View style={styles.macro}>
              <Text style={styles.macroValue}>{program.fat}g</Text>
              <Text style={styles.macroLabel}>fat</Text>
            </View>
          </View>
        </View>

        {/* Workout Schedule Preview */}
        <View style={styles.scheduleCard}>
          <Text style={styles.sectionTitle}>{program.workoutPlan.name}</Text>
          {program.workoutPlan.schedule.slice(0, 7).map((day, i) => (
            <View key={i} style={styles.scheduleRow}>
              <Text style={styles.dayName}>{day.day}</Text>
              <Text style={styles.workoutName}>
                {day.workout === 'Rest' ? '🛋 Rest' : `💪 ${day.workout.name}`}
              </Text>
            </View>
          ))}
        </View>

        {/* Meal Plan Preview */}
        <View style={styles.mealCard}>
          <Text style={styles.sectionTitle}>Daily Meals</Text>
          {program.mealPlan.meals.map((meal, i) => (
            <View key={i} style={styles.mealRow}>
              <Text style={styles.mealName}>{meal.name}</Text>
              <Text style={styles.mealFoods}>
                {meal.foods.map(f => f.name).join(', ')}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.saveButton}>
          <Ionicons name="download" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>Save Program</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetButton} onPress={resetForm}>
          <Text style={styles.resetButtonText}>Generate New Program</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={step === 'generating' ? styles.centerContent : undefined}
      >
        {step === 'basics' && renderBasics()}
        {step === 'goals' && renderGoals()}
        {step === 'preferences' && renderPreferences()}
        {step === 'generating' && renderGenerating()}
        {step === 'results' && renderResults()}
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  form: {
    gap: 20,
    paddingTop: 16,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: -12,
  },
  field: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 15,
    color: '#888',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#1c1c1e',
    borderRadius: 10,
    padding: 16,
    color: '#fff',
    fontSize: 16,
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
  smallOption: {
    backgroundColor: '#1c1c1e',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 48,
  },
  optionActive: {
    backgroundColor: '#007AFF',
  },
  optionText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  optionTextActive: {
    color: '#fff',
  },
  goalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  goalCard: {
    width: '47%',
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  goalCardActive: {
    backgroundColor: '#007AFF',
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  goalLabelActive: {
    color: '#fff',
  },
  goalDesc: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  goalDescActive: {
    color: 'rgba(255,255,255,0.8)',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  backButton: {
    backgroundColor: '#1c1c1e',
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  loadingSubtitle: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
  },
  resultHeader: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryText: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 22,
    backgroundColor: '#1c1c1e',
    padding: 16,
    borderRadius: 12,
  },
  macroCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macro: {
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  macroLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  scheduleCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 16,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  dayName: {
    fontSize: 14,
    color: '#888',
    width: 80,
  },
  workoutName: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
    textAlign: 'right',
  },
  mealCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 16,
  },
  mealRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  mealName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
  mealFoods: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#30d158',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    padding: 16,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '500',
  },
});
