import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { HabitDefinition } from '../features/habits/habitRegistry';
import { colors, fontSizes, radius, spacing } from '../theme/tokens';

type HabitCardProps = {
  habit: HabitDefinition;
  value: number;
  progress: number;
  style?: StyleProp<ViewStyle>;
  onPressAction?: () => void;
};

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

export function HabitCard({ habit, value, progress, style, onPressAction }: HabitCardProps) {
  const summary = habit.formatSummary
    ? habit.formatSummary(value, habit.target)
    : `${value} / ${habit.target} ${habit.unit}`;
  const isPrimaryAction = habit.action?.intent === 'quick';

  return (
    <View style={[styles.card, style]}>
      <View style={styles.headerRow}>
        <View style={[styles.badge, { backgroundColor: habit.softColor }]}>
          <Text style={[styles.badgeText, { color: habit.accentColor }]}>{habit.label}</Text>
        </View>
        <Text style={styles.progressText}>{formatPercent(progress)}</Text>
      </View>
      <View style={styles.mainRow}>
        <View style={styles.textColumn}>
          <Text style={styles.title}>{habit.title}</Text>
          <Text style={styles.subtitle}>{summary}</Text>
        </View>
        <View style={[styles.iconWrap, { backgroundColor: habit.softColor }]}>
          <View style={[styles.iconDot, { backgroundColor: habit.accentColor }]} />
        </View>
      </View>
      {habit.action ? (
        <Pressable
          accessibilityRole="button"
          onPress={onPressAction}
          style={({ pressed }) => [
            styles.actionButton,
            isPrimaryAction ? styles.actionPrimary : styles.actionOutline,
            pressed ? styles.actionPressed : null,
          ]}
        >
          <Text style={[styles.actionText, isPrimaryAction ? styles.actionTextPrimary : styles.actionTextOutline]}>
            {habit.action.label}
          </Text>
        </Pressable>
      ) : null}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  badgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  progressText: {
    fontSize: fontSizes.sm,
    color: colors.textSubtle,
    fontWeight: '600',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  textColumn: {
    flex: 1,
    paddingRight: spacing.md,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: colors.textMuted,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  actionButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  actionPrimary: {
    backgroundColor: colors.accent,
  },
  actionOutline: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surfaceMuted,
  },
  actionPressed: {
    opacity: 0.85,
  },
  actionText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  actionTextPrimary: {
    color: colors.textOnAccent,
  },
  actionTextOutline: {
    color: colors.textPrimary,
  },
});
