import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { 
  getReminders, updateReminder, requestPermissions,
  WorkoutReminder, WEEKDAYS
} from '@/lib/notifications';

export default function RemindersScreen() {
  const router = useRouter();
  const [reminders, setReminders] = useState<WorkoutReminder[]>([]);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await getReminders();
    setReminders(data);
    
    const permission = await requestPermissions();
    setHasPermission(permission);
  };

  const handleToggle = async (id: string) => {
    if (!hasPermission) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Notifications Disabled',
          'Enable notifications in Settings to use workout reminders.'
        );
        return;
      }
      setHasPermission(true);
    }

    const updated = await updateReminder(id, { 
      enabled: !reminders.find(r => r.id === id)?.enabled 
    });
    setReminders(updated);
  };

  const handleTimeChange = async (id: string, hour: number) => {
    const updated = await updateReminder(id, { hour });
    setReminders(updated);
  };

  const getWeekdayName = (weekday: number) => {
    return WEEKDAYS.find(w => w.value === weekday)?.label || '';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout Reminders</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {!hasPermission && (
          <View style={styles.permissionBanner}>
            <Ionicons name="notifications-off" size={24} color="#ff9500" />
            <View style={styles.permissionText}>
              <Text style={styles.permissionTitle}>Notifications Disabled</Text>
              <Text style={styles.permissionDesc}>
                Enable notifications to receive workout reminders
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.permissionButton}
              onPress={async () => {
                const granted = await requestPermissions();
                setHasPermission(granted);
              }}
            >
              <Text style={styles.permissionButtonText}>Enable</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>Weekly Reminders</Text>
        <Text style={styles.sectionDesc}>
          Get reminded on your training days
        </Text>

        {reminders.map((reminder) => (
          <View key={reminder.id} style={styles.reminderCard}>
            <View style={styles.reminderHeader}>
              <View style={styles.reminderInfo}>
                <Text style={styles.reminderDay}>{getWeekdayName(reminder.weekday)}</Text>
                <Text style={styles.reminderTime}>
                  {reminder.hour.toString().padStart(2, '0')}:{reminder.minute.toString().padStart(2, '0')}
                </Text>
              </View>
              <Switch
                value={reminder.enabled}
                onValueChange={() => handleToggle(reminder.id)}
                trackColor={{ false: '#333', true: '#007AFF' }}
                thumbColor="#fff"
              />
            </View>
            
            {reminder.enabled && (
              <View style={styles.timeSelector}>
                <Text style={styles.timeSelectorLabel}>Reminder time:</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.timeOptions}
                >
                  {[6, 7, 8, 9, 12, 17, 18, 19, 20].map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.timeOption,
                        reminder.hour === hour && styles.timeOptionActive
                      ]}
                      onPress={() => handleTimeChange(reminder.id, hour)}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        reminder.hour === hour && styles.timeOptionTextActive
                      ]}>
                        {hour.toString().padStart(2, '0')}:00
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        ))}

        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={20} color="#ffcc00" />
          <Text style={styles.tipText}>
            Tip: Set reminders 30-60 minutes before you want to start training 
            to give yourself time to prepare.
          </Text>
        </View>

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
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff950020',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
  },
  permissionText: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  permissionDesc: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  permissionButton: {
    backgroundColor: '#ff9500',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  permissionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
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
  reminderCard: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  reminderDay: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  reminderTime: {
    fontSize: 15,
    color: '#888',
  },
  timeSelector: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  timeSelectorLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 12,
  },
  timeOptions: {
    gap: 8,
  },
  timeOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#2c2c2e',
    borderRadius: 8,
  },
  timeOptionActive: {
    backgroundColor: '#007AFF',
  },
  timeOptionText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  timeOptionTextActive: {
    color: '#fff',
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginTop: 12,
    alignItems: 'flex-start',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
});
