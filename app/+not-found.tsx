import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/lib/constants';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found', headerShown: false }} />
      <View style={styles.container}>
        <Text style={styles.text}>This screen doesn't exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: COLORS.black,
  },
  text: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  link: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.green,
    borderRadius: 8,
  },
  linkText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
});
