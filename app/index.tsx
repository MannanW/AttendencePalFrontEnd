import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useApp } from '@/lib/AppContext';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '@/lib/constants';

export default function Index() {
  const { data, loading } = useApp();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.black, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.green} size="large" />
      </View>
    );
  }

  if (!data.isOnboarded || data.subjects.length === 0) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)/dashboard" />;
}
