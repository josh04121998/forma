// Simple notification service for workout reminders
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const REMINDER_KEY = 'forma_reminders';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface ReminderSettings {
  enabledDays: number[]; // 1=Sun, 2=Mon, etc.
  hour: number;
  minute: number;
}

const DEFAULT_SETTINGS: ReminderSettings = {
  enabledDays: [],
  hour: 17, // 5 PM default
  minute: 0,
};

export const WEEKDAYS = [
  { value: 2, label: 'Monday', short: 'Mon' },
  { value: 3, label: 'Tuesday', short: 'Tue' },
  { value: 4, label: 'Wednesday', short: 'Wed' },
  { value: 5, label: 'Thursday', short: 'Thu' },
  { value: 6, label: 'Friday', short: 'Fri' },
  { value: 7, label: 'Saturday', short: 'Sat' },
  { value: 1, label: 'Sunday', short: 'Sun' },
];

// Request notification permissions
export async function requestPermissions(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') return false;
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') return true;
    
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.log('Notification permission error:', error);
    return false;
  }
}

// Get reminder settings
export async function getReminderSettings(): Promise<ReminderSettings> {
  try {
    const data = await AsyncStorage.getItem(REMINDER_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // Ensure valid structure
      return {
        enabledDays: Array.isArray(parsed.enabledDays) ? parsed.enabledDays : [],
        hour: typeof parsed.hour === 'number' ? parsed.hour : 17,
        minute: typeof parsed.minute === 'number' ? parsed.minute : 0,
      };
    }
    return DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// Save reminder settings (without scheduling - that's separate)
export async function saveReminderSettings(settings: ReminderSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(REMINDER_KEY, JSON.stringify(settings));
    // Schedule in background, don't await to prevent crashes
    scheduleReminders(settings).catch(e => console.log('Schedule error:', e));
  } catch (error) {
    console.log('Error saving reminders:', error);
  }
}

// Toggle a specific day
export async function toggleDay(weekday: number): Promise<ReminderSettings> {
  try {
    const settings = await getReminderSettings();
    const index = settings.enabledDays.indexOf(weekday);
    
    if (index >= 0) {
      settings.enabledDays.splice(index, 1);
    } else {
      settings.enabledDays.push(weekday);
    }
    
    await saveReminderSettings(settings);
    return settings;
  } catch (error) {
    console.log('Error toggling day:', error);
    return await getReminderSettings();
  }
}

// Update reminder time
export async function setReminderTime(hour: number, minute: number = 0): Promise<ReminderSettings> {
  try {
    const settings = await getReminderSettings();
    settings.hour = hour;
    settings.minute = minute;
    await saveReminderSettings(settings);
    return settings;
  } catch (error) {
    console.log('Error setting time:', error);
    return await getReminderSettings();
  }
}

// Schedule all reminders based on settings
async function scheduleReminders(settings: ReminderSettings): Promise<void> {
  try {
    if (Platform.OS === 'web') return;
    
    // Cancel all existing
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    if (!settings.enabledDays || settings.enabledDays.length === 0) return;
    
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const messages = [
      "Time to train! 💪",
      "Workout time! 🏋️",
      "Let's get it! 🔥",
      "Gym time! 💥",
    ];

    // Schedule for each enabled day
    for (const weekday of settings.enabledDays) {
      try {
        const dayName = WEEKDAYS.find(d => d.value === weekday)?.label || '';
        const message = messages[weekday % messages.length];
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: message,
            body: `Your ${dayName} workout is waiting`,
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: weekday,
            hour: settings.hour,
            minute: settings.minute,
          },
        });
      } catch (dayError) {
        console.log(`Error scheduling ${weekday}:`, dayError);
      }
    }
  } catch (error) {
    console.log('Error scheduling reminders:', error);
  }
}

// Check if notifications are available
export async function checkNotificationSupport(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') return false;
    return true;
  } catch {
    return false;
  }
}
