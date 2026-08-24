import { StyleSheet, View, Text } from 'react-native';
import { COLORS } from '@/lib/constants';

interface Props {
  buffer: number;
  mustAttend: number;
  percent: number;
  target?: number;
}

export function BufferMeter({
  buffer,
  mustAttend,
  percent,
  target = 75,
}: Props) {
  const isAbove = percent >= target;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          {isAbove ? (
            <Text style={styles.iconText}>▲</Text>
          ) : (
            <Text style={[styles.iconText, { color: COLORS.red }]}>▼</Text>
          )}
        </View>
        <View style={styles.content}>
          {isAbove ? (
            <Text style={styles.headline}>
              <Text style={styles.number}>{buffer}</Text> class{buffer === 1 ? '' : 'es'} can be missed
            </Text>
          ) : (
            <Text style={styles.headline}>
              <Text style={[styles.number, { color: COLORS.red }]}>
                {mustAttend}
              </Text>{' '}
              class{mustAttend === 1 ? '' : 'es'} must be attended
            </Text>
          )}
          <Text style={styles.subtext}>
            {isAbove
              ? `You're above the ${target}% threshold`
              : `Below the ${target}% threshold — attend to recover`}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  flexDirection: 'row',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 14,
    color: COLORS.greenBright,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  headline: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
    lineHeight: 20,
  },
  number: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.greenBright,
    fontFamily: 'monospace',
  },
  subtext: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
