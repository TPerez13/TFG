import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { HabitDefinition } from '../features/habits/habitRegistry';
import { colors, fontSizes, radius, spacing } from '../theme/tokens';
import { ProgressBar } from './ProgressBar';

type HabitCardProps = {
  habit: HabitDefinition;
  subtitle: string;
  progress: number;
  variant?: 'home' | 'goals';
  showPlusButton?: boolean;
  onQuickAdd?: () => void;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  actionLabel?: string;
  onPressAction?: () => void;
};

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

export function HabitCard({
  habit,
  subtitle,
  progress,
  variant = 'home',
  showPlusButton = false,
  onQuickAdd,
  style,
  onPress,
  actionLabel,
  onPressAction,
}: HabitCardProps) {
  const isHome = variant === 'home';
  const percent = formatPercent(progress);
  const homeActionLabel = actionLabel ?? habit.action?.label;
  const isPrimaryAction = habit.action?.intent === 'quick';
  const isPressable = Boolean(onPress);

  return (
    <Pressable
      accessibilityRole={isPressable ? 'button' : undefined}
      disabled={!isPressable}
      onPress={onPress}
      style={({ pressed }) => [styles.card, style, isPressable && pressed ? styles.cardPressed : null]}
    >
      <View style={styles.headerRow}>
        <View style={isHome ? [styles.badge, { backgroundColor: habit.softColor }] : styles.titleWithIcon}>
          {isHome ? (
            <Text style={[styles.badgeText, { color: habit.accentColor }]}>{habit.label}</Text>
          ) : (
            <>
              <View style={[styles.iconWrapSmall, { backgroundColor: habit.softColor }]}>
                <Ionicons name={habit.icon as any} size={18} color={habit.accentColor} />
              </View>
              <Text style={styles.goalsTitle}>{habit.title}</Text>
            </>
          )}
        </View>
        {showPlusButton ? (
          <Pressable
            accessibilityLabel={`Agregar registro de ${habit.title}`}
            accessibilityRole="button"
            onPress={(event) => {
              event.stopPropagation();
              onQuickAdd?.();
            }}
            style={({ pressed }) => [styles.quickAddButton, pressed ? styles.quickAddPressed : null]}
          >
            <Text style={styles.quickAddText}>+</Text>
          </Pressable>
        ) : (
          <Text style={styles.progressText}>{percent}</Text>
        )}
      </View>
      <View style={isHome ? styles.mainRow : styles.goalsMainRow}>
        <View style={styles.textColumn}>
          {isHome ? <Text style={styles.title}>{habit.title}</Text> : null}
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {isHome ? (
          <View style={[styles.iconWrap, { backgroundColor: habit.softColor }]}>
            <Ionicons name={habit.icon as any} size={24} color={habit.accentColor} />
          </View>
        ) : null}
      </View>
      <ProgressBar progress={progress} fillColor={habit.accentColor} style={styles.progressBar} />
      {isHome && homeActionLabel ? (
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
            {homeActionLabel}
          </Text>
        </Pressable>
      ) : null}
    </Pressable>
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
  cardPressed: {
    opacity: 0.9,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
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
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapSmall: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  goalsTitle: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.textPrimary,
    flexShrink: 1,
  },
  quickAddButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  quickAddPressed: {
    opacity: 0.85,
  },
  quickAddText: {
    fontSize: 18,
    lineHeight: 18,
    color: colors.textOnAccent,
    fontWeight: '700',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  goalsMainRow: {
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
  progressBar: {
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
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
