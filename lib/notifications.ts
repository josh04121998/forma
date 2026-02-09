// Notification service for workout reminders
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

export interface WorkoutReminder {
  id: string;
  title: string;
  body: string;
  weekday: number; // 1 = Sunday, 2 = Monday, etc.
  hour: number;
  minute: number;
  enabled: boolean;
}

const DEFAULT_REMINDERS: WorkoutReminder[] = [
  {
    id: 'mon',
    title: "Time to train! 💪",
    body: "Your Monday workout is waiting",
    weekday: 2, // Monday
    hour: 17,
    minute: 0,
    enabled: false,
  },
  {
    id: 'wed',
    title: "Midweek gains! 🏋️",
    body: "Wednesday workout time",
    weekday: 4, // Wednesday
    hour: 17,
    minute: 0,
    enabled: false,
  },
  {
    id: 'fri',
    title: "Friday pump! 🔥",
    body: "End the week strong",
    weekday: 6, // Friday
    hour: 17,
    minute: 0,
    enabled: false,
  },
];

// Request notification permissions
export async function requestPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  
  if (existingStatus === 'granted') return true;
  
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// Get all reminders
export async function getReminders(): Promise<WorkoutReminder[]> {
  try {
    const data = await AsyncStorage.getItem(REMINDER_KEY);
    return data ? JSON.parse(data) : DEFAULT_REMINDERS;
  } catch {
    return DEFAULT_REMINDERS;
  }
}

// Save reminders
export async function saveReminders(reminders: WorkoutReminder[]): Promise<void> {
  await AsyncStorage.setItem(REMINDER_KEY, JSON.stringify(reminders));
  await scheduleAllReminders(reminders);
}

// Update a single reminder
export async function updateReminder(
  id: string, 
  updates: Partial<WorkoutReminder>
): Promise<WorkoutReminder[]> {
  const reminders = await getReminders();
  const updatedReminders = reminders.map(r => 
    r.id === id ? { ...r, ...updates } : r
  );
  await saveReminders(updatedReminders);
  return updatedReminders;
}

// Toggle reminder on/off
export async function toggleReminder(id: string): Promise<WorkoutReminder[]> {
  const reminders = await getReminders();
  const reminder = reminders.find(r => r.id === id);
  if (reminder) {
    return updateReminder(id, { enabled: !reminder.enabled });
  }
  return reminders;
}

// Schedule all enabled reminders
async function scheduleAllReminders(reminders: WorkoutReminder[]): Promise<void> {
  // Cancel all existing scheduled notifications
  await Notifications.cancelAllScheduledNotificationsAsync();
  
  const hasPermission = await requestPermissions();
  if (!hasPermission) return;

  // Schedule enabled reminders
  for (const reminder of reminders) {
    if (!reminder.enabled) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: reminder.body,
        sound: 'default',
      },
      trigger: {
        weekday: reminder.weekday,
        hour: reminder.hour,
        minute: reminder.minute,
        repeats: true,
      },
    });
  }
}

// Add a custom one-time reminder
export async function scheduleOneTimeReminder(
  title: string,
  body: string,
  date: Date
): Promise<string> {
  const hasPermission = await requestPermissions();
  if (!hasPermission) throw new Error('Notification permissions not granted');

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
    },
    trigger: date,
  });

  return id;
}

// Cancel a specific notification
export async function cancelReminder(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

// Get all scheduled notifications (for debugging)
export async function getScheduledNotifications() {
  return Notifications.getAllScheduledNotificationsAsync();
}

// Days of the week for UI
export const WEEKDAYS = [
  { value: 1, label: 'Sunday', short: 'Sun' },
  { value: 2, label: 'Monday', short: 'Mon' },
  { value: 3, label: 'Tuesday', short: 'Tue' },
  { value: 4, label: 'Wednesday', short: 'Wed' },
  { value: 5, label: 'Thursday', short: 'Thu' },
  { value: 6, label: 'Friday', short: 'Fri' },
  { value: 7, label: 'Saturday', short: 'Sat' },
];
