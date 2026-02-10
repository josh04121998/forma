import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { 
  getReminderSettings, toggleDay, setReminderTime, requestPermissions,
  ReminderSettings, WEEKDAYS
} from '@/lib/notifications';

const TIME_OPTIONS = [
  { hour: 6, label: '6 AM' },
  { hour: 7, label: '7 AM' },
  { hour: 8, label: '8 AM' },
  { hour: 12, label: '12 PM' },
  { hour: 17, label: '5 PM' },
  { hour: 18, label: '6 PM' },
  { hour: 19, label: '7 PM' },
  { hour: 20, label: '8 PM' },
];

export default function RemindersScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<ReminderSettings>({
    enabledDays: [],
    hour: 17,
    minute: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await getReminderSettings();
    setSettings(data);
  };

  const handleDayToggle = async (weekday: number) => {
    // Request permission on first enable
    if (!settings.enabledDays.includes(weekday)) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Enable Notifications',
          'Go to Settings to enable notifications for workout reminders.'
        );
        return;
      }
    }
    
    const updated = await toggleDay(weekday);
    setSettings(updated);
  };

  const handleTimeChange = async (hour: number) => {
    const updated = await setReminderTime(hour);
    setSettings(updated);
  };

  const isDayEnabled = (weekday: number) => settings.enabledDays.includes(weekday);
  const hasAnyEnabled = settings.enabledDays.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout Reminders</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>Training Days</Text>
        <Text style={styles.sectionDesc}>
          Select which days you want to be reminded
        </Text>

        <View style={styles.daysGrid}>
          {WEEKDAYS.map((day) => (
            <TouchableOpacity
              key={day.value}
              style={[
                styles.dayButton,
                isDayEnabled(day.value) && styles.dayButtonActive
              ]}
              onPress={() => handleDayToggle(day.value)}
            >
              <Text style={[
                styles.dayButtonText,
                isDayEnabled(day.value) && styles.dayButtonTextActive
              ]}>
                {day.short}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {hasAnyEnabled && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Reminder Time</Text>
            <Text style={styles.sectionDesc}>
              When should we remind you?
            </Text>

            <View style={styles.timeGrid}>
              {TIME_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.hour}
                  style={[
                    styles.timeButton,
                    settings.hour === option.hour && styles.timeButtonActive
                  ]}
                  onPress={() => handleTimeChange(option.hour)}
                >
                  <Text style={[
                    styles.timeButtonText,
                    settings.hour === option.hour && styles.timeButtonTextActive
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1c1c1e',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 15,
    color: '#888',
    marginBottom: 20,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dayButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1c1c1e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#007AFF',
  },
  dayButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  dayButtonTextActive: {
    color: '#fff',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1c1c1e',
  },
  timeButtonActive: {
    backgroundColor: '#007AFF',
  },
  timeButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#888',
  },
  timeButtonTextActive: {
    color: '#fff',
  },
});
