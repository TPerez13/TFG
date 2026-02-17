import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../theme/tokens';

type HistoryHabitCardProps = {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  valueLabel: string;
  rightLabel?: string;
  subtitle?: string;
  onPress?: () => void;
};

export function HistoryHabitCard({
  icon,
  iconColor,
  iconBg,
  title,
  valueLabel,
  rightLabel,
  subtitle,
  onPress,
}: HistoryHabitCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, pressed ? styles.pressed : null]}
    >
      <View style={[styles.iconBubble, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as never} size={24} color={iconColor} />
      </View>

      <View style={styles.card}>
        <View style={styles.topRow}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.rightLabel}>{rightLabel ?? '--:--'}</Text>
        </View>
        <Text style={styles.value}>{valueLabel}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  pressed: {
    opacity: 0.84,
  },
  iconBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: spacing.sm,
  },
  card: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    paddingVertical: spacing.mdPlus,
    paddingHorizontal: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#101714',
  },
  rightLabel: {
    fontSize: 17,
    color: '#667084',
    fontWeight: '600',
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: '#19b95b',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 24,
    color: '#435062',
    fontWeight: '600',
  },
});
