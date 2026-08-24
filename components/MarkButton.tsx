import { StyleSheet, View, Text, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS } from '@/lib/constants';
import { MarkStatus } from '@/lib/types';

interface Props {
  status: MarkStatus;
  active?: boolean;
  onPress: () => void;
  label: string;
  short: string;
  color: string;
  size?: 'sm' | 'md';
}

export function MarkButton({
  status,
  active,
  onPress,
  label,
  short,
  color,
  size = 'md',
}: Props) {
  const isActive = active;
  const isSm = size === 'sm';

  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.container,
        isSm && styles.containerSm,
        isActive && { backgroundColor: color, borderColor: color },
        pressed && styles.pressed,
      ]}
    >
      <Text
        style={[
          styles.short,
          isSm && styles.shortSm,
          isActive ? styles.shortActive : { color },
        ]}
      >
        {short}
      </Text>
      {!isSm && (
        <Text
          style={[
            styles.label,
            isActive ? styles.labelActive : { color: COLORS.textSecondary },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.surfaceAlt,
    flex: 1,
  },
  containerSm: {
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 6,
    flexDirection: 'column',
    gap: 2,
  },
  short: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  shortSm: {
    fontSize: 11,
  },
  shortActive: {
    color: '#FFFFFF',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelActive: {
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
});
