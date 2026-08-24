import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AppProvider } from '@/lib/AppContext';
import { COLORS } from '@/lib/constants';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <ErrorBoundary>
    <AppProvider>
      <StatusBar style="light" backgroundColor={COLORS.black} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.black },
        }}
      >
        <Stack.Screen name="+not-found" />
      </Stack>
    </AppProvider>
    </ErrorBoundary>
  );
}
