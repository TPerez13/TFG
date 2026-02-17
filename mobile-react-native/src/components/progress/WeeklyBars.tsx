import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../theme/tokens';

type WeeklyBarsProps = {
  weekly: number[];
  bestWeekIndex: number;
};

const WEEK_LABELS = ['S1', 'S2', 'S3', 'S4', 'S5'];

export function WeeklyBars({ weekly, bestWeekIndex }: WeeklyBarsProps) {
  return (
    <View style={styles.chartShell}>
      <View style={styles.barsArea}>
        {WEEK_LABELS.map((label, index) => {
          const value = Math.max(0, Math.min(100, weekly[index] ?? 0));
          const isBest = index === bestWeekIndex;
          const height = value > 0 ? Math.max(8, Math.round((value / 100) * 118)) : 6;

          return (
            <View key={label} style={styles.barColumn}>
              <View style={[styles.bar, { height }, isBest ? styles.barBest : styles.barMuted]} />
            </View>
          );
        })}
      </View>

      <View style={styles.labelsRow}>
        {WEEK_LABELS.map((label, index) => {
          const isBest = index === bestWeekIndex;
          return (
            <Text key={label} style={[styles.label, isBest ? styles.labelBest : null]}>
              {label}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartShell: {
    marginTop: spacing.lgPlus,
    borderRadius: radius.md,
    backgroundColor: '#edf1ee',
    borderWidth: 1,
    borderColor: '#e5e9e7',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.mdPlus,
  },
  barsArea: {
    height: 126,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: 22,
    borderRadius: 7,
  },
  barBest: {
    backgroundColor: '#22c55e',
  },
  barMuted: {
    backgroundColor: '#cfd9d3',
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    color: '#111',
    fontWeight: '500',
  },
  labelBest: {
    color: colors.textAccent,
    fontWeight: '700',
  },
});
