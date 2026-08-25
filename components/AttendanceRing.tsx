import { memo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '@/lib/constants';

interface Props {
  percent: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export const AttendanceRing = memo(function AttendanceRing({
  percent,
  size = 120,
  strokeWidth = 8,
  label,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safePercent = Number.isFinite(percent) ? percent : 0;
  const clampedPercent = Math.max(0, Math.min(100, safePercent));
  const dashOffset = circumference - (clampedPercent / 100) * circumference;
  const cx = size / 2;

  const isAbove = clampedPercent >= 75;
  const color = isAbove ? COLORS.green : COLORS.red;
  const strokeColor = isAbove ? COLORS.green : COLORS.redDim;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={cx}
          cy={cx}
          r={radius}
          fill="none"
          stroke={COLORS.border}
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={cx}
          cy={cx}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation="-90"
          originX={cx}
          originY={cx}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.percent, { color }]}>
          {clampedPercent.toFixed(1)}%
        </Text>
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    </View>
  );
});

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
