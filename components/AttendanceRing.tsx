import { StyleSheet, View, Text } from 'react-native';
import { COLORS } from '@/lib/constants';

interface Props {
  percent: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function AttendanceRing({
  percent,
  size = 120,
  strokeWidth = 8,
  label,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercent = Math.max(0, Math.min(100, percent));
  const dashOffset = circumference - (clampedPercent / 100) * circumference;

  const isAbove = percent >= 75;
  const color = isAbove ? COLORS.greenBright : COLORS.red;
  const strokeColor = percent >= 75 ? COLORS.green : COLORS.redDim;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <svg width={size} height={size} style={styles.svg}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={COLORS.border}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <View style={styles.center}>
        <Text style={[styles.percent, { color }]}>
          {percent.toFixed(1)}%
        </Text>
        {label && <Text style={styles.label}>{label}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percent: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
