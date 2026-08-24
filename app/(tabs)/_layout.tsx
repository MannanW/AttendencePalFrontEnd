import { Tabs, Redirect } from 'expo-router';
import { COLORS } from '@/lib/constants';
import { LayoutDashboard, CalendarDays, Settings } from 'lucide-react-native';
import { useApp } from '@/lib/AppContext';

export default function TabLayout() {
  const { data, loading } = useApp();

  if (loading) return null;
  if (!data.isOnboarded || data.subjects.length === 0) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.black,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          height: 56,
          paddingBottom: 4,
        },
        tabBarActiveTintColor: COLORS.green,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Today',
          tabBarIcon: ({ size, color }) => (
            <LayoutDashboard size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ size, color }) => (
            <CalendarDays size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}
