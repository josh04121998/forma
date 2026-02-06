import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/lib/auth';
import { getProfile, updateProfile, getWorkoutStats, clearAllData } from '@/lib/storage';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, syncToCloud, syncing } = useAuth();
  const [stats, setStats] = useState({ totalWorkouts: 0, totalSets: 0 });
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    height: '',
    weight: '',
  });

  const loadData = useCallback(async () => {
    const [localProfile, workoutStats] = await Promise.all([
      getProfile(),
      getWorkoutStats(),
    ]);
    
    setProfile({
      name: '',
      age: localProfile.age?.toString() || '',
      height: localProfile.heightCm?.toString() || '',
      weight: localProfile.weightKg?.toString() || '',
    });
    setStats(workoutStats);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSave = async () => {
    await updateProfile({
      age: profile.age ? parseInt(profile.age) : undefined,
      heightCm: profile.height ? parseInt(profile.height) : undefined,
      weightKg: profile.weight ? parseInt(profile.weight) : undefined,
    });
    Alert.alert('Saved', 'Profile updated');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Your local data will be kept. Sign in again to sync.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all local workouts and data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            loadData();
            Alert.alert('Done', 'All data cleared');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Profile</Text>

        {/* Account Status */}
        <View style={styles.accountCard}>
          <View style={styles.accountIcon}>
            <Ionicons 
              name={user ? "person-circle" : "person-circle-outline"} 
              size={48} 
              color={user ? "#007AFF" : "#888"} 
            />
          </View>
          <View style={styles.accountInfo}>
            {user ? (
              <>
                <Text style={styles.accountEmail}>{user.email}</Text>
                <Text style={styles.accountStatus}>
                  <Ionicons name="cloud-done" size={14} color="#30d158" /> Synced to cloud
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.accountTitle}>Local Account</Text>
                <Text style={styles.accountStatus}>Sign in to backup your data</Text>
              </>
            )}
          </View>
          {!user && (
            <TouchableOpacity 
              style={styles.accountButton}
              onPress={() => router.push('/auth/signup')}
            >
              <Text style={styles.accountButtonText}>Sign Up</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalWorkouts}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalSets}</Text>
            <Text style={styles.statLabel}>Sets</Text>
          </View>
        </View>

        {/* Profile Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          
          <View style={styles.form}>
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

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          {user ? (
            <>
              <TouchableOpacity style={styles.menuItem} onPress={syncToCloud}>
                <Ionicons name="cloud-upload-outline" size={22} color="#fff" />
                <Text style={styles.menuText}>
                  {syncing ? 'Syncing...' : 'Sync Now'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
                <Ionicons name="log-out-outline" size={22} color="#ff453a" />
                <Text style={[styles.menuText, { color: '#ff453a' }]}>Sign Out</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/auth/login')}
              >
                <Ionicons name="log-in-outline" size={22} color="#fff" />
                <Text style={styles.menuText}>Sign In</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/auth/signup')}
              >
                <Ionicons name="person-add-outline" size={22} color="#fff" />
                <Text style={styles.menuText}>Create Account</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            </>
          )}
          
          <TouchableOpacity style={styles.menuItem} onPress={handleClearData}>
            <Ionicons name="trash-outline" size={22} color="#ff453a" />
            <Text style={[styles.menuText, { color: '#ff453a' }]}>Clear Local Data</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Forma v1.0.0</Text>
        
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
  accountCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  accountIcon: {
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
  },
  accountEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  accountTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  accountStatus: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  accountButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  accountButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#333',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#1c1c1e',
    borderRadius: 10,
    padding: 14,
    color: '#fff',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  version: {
    textAlign: 'center',
    color: '#666',
    fontSize: 13,
    marginTop: 16,
  },
});
