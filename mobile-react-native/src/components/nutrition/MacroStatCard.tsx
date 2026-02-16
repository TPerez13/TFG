import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSizes, radius, spacing } from '../../theme/tokens';

type MacroStatCardProps = {
  label: string;
  value: number;
  unit: string;
};

export function MacroStatCard({ label, value, unit }: MacroStatCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Text style={styles.value}>{Math.round(value)}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  label: {
    fontSize: 15,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: colors.textSubtle,
    marginBottom: spacing.sm,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
  },
  value: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  unit: {
    fontSize: 20,
    lineHeight: 24,
    color: colors.textSubtle,
    fontWeight: '700',
  },
});
