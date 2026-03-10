import React, { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AchievementItem } from '../../features/achievements/achievementRegistry';
import {
  addMonths,
  formatMonthLabel,
  getMonthMatrix,
  getWeekdayLabels,
  type WeekStartsOn,
} from '../../features/achievements/calendarUtils';
import { colors, fontSizes, spacing } from '../../theme/tokens';

type MonthlyCalendarProps = {
  month: Date;
  achievementsByDate: Record<string, AchievementItem[]>;
  onMonthChange: (nextMonth: Date) => void;
  onDayPress?: (dayKey: string, achievements: AchievementItem[]) => void;
  weekStartsOn?: WeekStartsOn;
};

export function MonthlyCalendar({
  month,
  achievementsByDate,
  onMonthChange,
  onDayPress,
  weekStartsOn = 0,
}: MonthlyCalendarProps) {
  const monthLabel = formatMonthLabel(month);
  const weekdayLabels = useMemo(() => getWeekdayLabels(weekStartsOn), [weekStartsOn]);
  const matrix = useMemo(
    () => getMonthMatrix(month.getFullYear(), month.getMonth(), weekStartsOn),
    [month, weekStartsOn],
  );

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mes anterior"
          onPress={() => onMonthChange(addMonths(month, -1))}
          style={({ pressed }) => [styles.navButton, pressed ? styles.pressed : null]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mes siguiente"
          onPress={() => onMonthChange(addMonths(month, 1))}
          style={({ pressed }) => [styles.navButton, pressed ? styles.pressed : null]}
        >
          <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.weekHeaderRow}>
        {weekdayLabels.map((label) => (
          <Text key={label} style={styles.weekHeaderLabel}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {matrix.map((week, weekIndex) => (
          <View key={week[0]?.isoDate ?? `week-${weekIndex}`} style={styles.weekRow}>
            {week.map((cell) => {
              const dayAchievements = cell.inCurrentMonth ? achievementsByDate[cell.isoDate] ?? [] : [];
              const badgeCount = dayAchievements.length;
              const compactBadges = Math.min(3, badgeCount);

              return (
                <Pressable
                  key={cell.isoDate}
                  accessibilityRole="button"
                  accessibilityLabel={`Dia ${cell.dayNumber}`}
                  disabled={!badgeCount}
                  onPress={() => onDayPress?.(cell.isoDate, dayAchievements)}
                  style={({ pressed }) => [
                    styles.dayCell,
                    !cell.inCurrentMonth ? styles.dayCellOutsideMonth : null,
                    badgeCount ? styles.dayCellWithAchievement : null,
                    pressed && badgeCount ? styles.pressed : null,
                  ]}
                >
                  <Text style={[styles.dayLabel, !cell.inCurrentMonth ? styles.dayLabelOutsideMonth : null]}>
                    {cell.dayNumber}
                  </Text>

                  {badgeCount ? (
                    <View style={styles.badgesRow}>
                      {Array.from({ length: compactBadges }).map((_, index) => (
                        <View key={`${cell.isoDate}-${index}`} style={styles.badgeDot} />
                      ))}
                      {badgeCount > 3 ? <Text style={styles.badgeMore}>+{badgeCount - 3}</Text> : null}
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  navButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  weekHeaderRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    paddingHorizontal: 2,
  },
  weekHeaderLabel: {
    flex: 1,
    textAlign: 'center',
    color: colors.textSubtle,
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  grid: {
    gap: spacing.xs,
  },
  weekRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dayCell: {
    flex: 1,
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e7ede8',
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    paddingBottom: 3,
  },
  dayCellOutsideMonth: {
    opacity: 0.45,
  },
  dayCellWithAchievement: {
    borderColor: '#a7debb',
    backgroundColor: '#edf8f1',
  },
  dayLabel: {
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  dayLabelOutsideMonth: {
    color: colors.textSubtle,
  },
  badgesRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.textAccent,
  },
  badgeMore: {
    color: colors.textAccent,
    fontSize: 9,
    fontWeight: '700',
    marginLeft: 2,
  },
  pressed: {
    opacity: 0.8,
  },
});
