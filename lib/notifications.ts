import { AppData, ScheduleEntry } from './types';
import { addDays, minToTime } from './attendance';

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof document !== 'undefined') return false;
  const Notifications = await import('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  await configureNotificationActions(Notifications);
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function rescheduleClassReminders(
  data: AppData,
  minutesBefore = 10
): Promise<boolean> {
  if (typeof document !== 'undefined') return false;
  const Notifications = await import('expo-notifications');
  await configureNotificationActions(Notifications);
  if (!(await requestNotificationPermission())) return false;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const now = Date.now();
  const upcoming = data.schedule.filter((entry) => {
    if (entry.status !== 'unmarked') return false;
    const date = new Date(`${addDays(entry.weekStartDate, entry.dayInt)}T00:00:00`);
    if (Number.isNaN(date.getTime())) return false;
    date.setMinutes(entry.startMin - minutesBefore);
    return date.getTime() > now;
  });
  for (const entry of upcoming.slice(0, 100)) {
    try {
      await scheduleReminder(Notifications, entry, minutesBefore);
    } catch {
      // One malformed entry must not prevent other reminders from being registered.
    }
  }
  return true;
}

export async function cancelClassReminders(): Promise<void> {
  if (typeof document !== 'undefined') return;
  const Notifications = await import('expo-notifications');
  await Notifications.cancelAllScheduledNotificationsAsync();
}

async function scheduleReminder(
  Notifications: typeof import('expo-notifications'),
  entry: ScheduleEntry,
  minutesBefore: number
) {
  const date = new Date(`${addDays(entry.weekStartDate, entry.dayInt)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return;
  date.setMinutes(entry.startMin - minutesBefore);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Upcoming class',
      body: `${minToTime(entry.startMin)} - mark attendance after class`,
      data: { entryId: entry.id },
      categoryIdentifier: 'attendance',
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
}

async function configureNotificationActions(
  Notifications: typeof import('expo-notifications')
) {
  await Notifications.setNotificationCategoryAsync('attendance', [
    { identifier: 'attended', buttonTitle: 'Attended' },
    { identifier: 'late', buttonTitle: 'Late' },
    { identifier: 'missed', buttonTitle: 'Missed', options: { isDestructive: true } },
  ]);
}