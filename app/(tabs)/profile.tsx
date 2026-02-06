import { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    height: '',
    weight: '',
    goal: 'muscle',
    experience: 'intermediate',
  });

  const handleSave = () => {
    // TODO: Save to Supabase
    console.log('Saving profile:', profile);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={48} color="#888" />
          </View>
          <TouchableOpacity>
            <Text style={styles.changePhoto}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={profile.name}
              onChangeText={(v) => setProfile({ ...profile, name: v })}
              placeholder="Your name"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={profile.age}
                onChangeText={(v) => setProfile({ ...profile, age: v })}
                placeholder="25"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={profile.height}
                onChangeText={(v) => setProfile({ ...profile, height: v })}
                placeholder="175"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={profile.weight}
                onChangeText={(v) => setProfile({ ...profile, weight: v })}
                placeholder="75"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Goal</Text>
            <View style={styles.optionRow}>
              {[
                { key: 'strength', label: 'Strength' },
                { key: 'muscle', label: 'Muscle' },
                { key: 'weight_loss', label: 'Fat Loss' },
              ].map((g) => (
                <TouchableOpacity
                  key={g.key}
                  style={[styles.option, profile.goal === g.key && styles.optionActive]}
                  onPress={() => setProfile({ ...profile, goal: g.key })}
                >
                  <Text style={[styles.optionText, profile.goal === g.key && styles.optionTextActive]}>
                    {g.label}
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
                  style={[styles.option, profile.experience === e && styles.optionActive]}
                  onPress={() => setProfile({ ...profile, experience: e })}
                >
                  <Text style={[styles.optionText, profile.experience === e && styles.optionTextActive]}>
                    {e.charAt(0).toUpperCase() + e.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton}>
          <Ionicons name="log-out-outline" size={20} color="#ff453a" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
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
  avatarContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  changePhoto: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '500',
  },
  form: {
    gap: 20,
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
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
    marginBottom: 48,
    padding: 16,
  },
  signOutText: {
    color: '#ff453a',
    fontSize: 16,
    fontWeight: '500',
  },
});
