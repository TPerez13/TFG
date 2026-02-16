import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSizes, radius, spacing } from '../theme/tokens';
import { ProgressBar } from './ProgressBar';

type DailyProgressCardProps = {
  progress: number;
  completedGoals: number;
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function DailyProgressCard({ progress, completedGoals }: DailyProgressCardProps) {
  const safeProgress = clamp(progress);
  const percent = Math.round(safeProgress * 100);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Progreso Diario</Text>
        <Text style={styles.percent}>{percent}%</Text>
      </View>
      <ProgressBar progress={safeProgress} style={styles.progressBar} />
      <Text style={styles.message}>Buen trabajo! Has completado {completedGoals} metas.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.lgPlus,
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  percent: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.textAccent,
  },
  progressBar: {
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
});
