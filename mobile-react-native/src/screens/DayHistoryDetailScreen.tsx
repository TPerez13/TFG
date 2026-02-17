import React, { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/layout/Screen';
import { HistoryHabitCard } from '../components/progress/HistoryHabitCard';
import {
  aggregateByHabitAndDay,
  formatClock,
  formatHabitValue,
  getDayRange,
  formatLongDate,
  getMotivationalText,
  parseDayKey,
  resolveHabitGoals,
  type AggregatedHabitDay,
  type HabitGoalConfig,
} from '../features/progress/historyUtils';
import { useHistoryRange } from '../features/progress/useHistoryRange';
import { useMe } from '../features/users/useMe';
import type { ProgressStackParamList } from '../navigation/types';
import { baseStyles } from '../theme/components';
import { colors, radius, spacing } from '../theme/tokens';

type DayHistoryDetailScreenProps = NativeStackScreenProps<ProgressStackParamList, 'DayHistoryDetail'>;

const getFallbackDayItems = (goals: HabitGoalConfig[]): AggregatedHabitDay[] =>
  goals.map((goal) => ({
    ...goal,
    total: 0,
    latestAt: null,
    achieved: false,
    pct: 0,
    displayValue: formatHabitValue(goal.habitKey, 0, goal.goalUnit),
    entries: [],
  }));

export default function DayHistoryDetailScreen({
  navigation,
  route,
}: DayHistoryDetailScreenProps) {
  const { dayKey, filter = 'todos' } = route.params;
  const date = useMemo(() => parseDayKey(dayKey), [dayKey]);
  const dayRange = useMemo(() => getDayRange(date), [date]);

  const { entries, loading: historyLoading, error, reload } = useHistoryRange(
    dayRange.fromISO,
    dayRange.toISO,
  );
  const { user, loading: meLoading, reload: reloadMe } = useMe();

  const goals = useMemo(() => resolveHabitGoals(user?.preferencias ?? null), [user?.preferencias]);
  const aggregated = useMemo(
    () => aggregateByHabitAndDay(entries, goals),
    [entries, goals],
  );
  const loading = historyLoading || meLoading;

  const dayItems = aggregated.get(dayKey) ?? getFallbackDayItems(goals);
  const visibleItems =
    filter === 'todos' ? dayItems.filter((item) => item.total > 0) : dayItems.filter((item) => item.habitKey === filter);

  const handleRetry = async () => {
    await Promise.all([reload(), reloadMe()]);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={[baseStyles.content, styles.content]}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}
          >
            <Ionicons name="chevron-back" size={30} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Historial del dia</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.dateLabel}>{formatLongDate(date)}</Text>

        {loading ? (
          <View style={styles.loadingCard}>
            <View style={styles.loadingLine} />
            <View style={styles.loadingBox} />
            <View style={styles.loadingBox} />
          </View>
        ) : null}

        {error && !loading ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>No se pudo cargar el historial</Text>
            <Pressable onPress={handleRetry} style={({ pressed }) => [styles.retryButton, pressed ? styles.pressed : null]}>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && !error && visibleItems.length === 0 ? (
          <Text style={styles.emptyText}>Aun no hay registros para este dia.</Text>
        ) : null}

        {!loading && !error
          ? visibleItems.map((item) => (
              <HistoryHabitCard
                key={`${dayKey}-${item.habitKey}`}
                icon={item.icon}
                iconColor={item.accentColor}
                iconBg={item.softColor}
                title={item.title}
                valueLabel={item.displayValue}
                rightLabel={formatClock(item.latestAt)}
                subtitle={getMotivationalText(item.habitKey, item.achieved)}
                onPress={() => navigation.navigate('HabitHistory', { habitKey: item.habitKey })}
              />
            ))
          : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.contentBottom + 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#101714',
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  pressed: {
    opacity: 0.82,
  },
  dateLabel: {
    color: '#5e6b84',
    fontSize: 17,
    marginBottom: spacing.lg,
    textTransform: 'capitalize',
  },
  loadingCard: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  loadingLine: {
    width: 180,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#e6eaee',
    marginBottom: spacing.md,
  },
  loadingBox: {
    width: '100%',
    height: 96,
    borderRadius: radius.md,
    backgroundColor: '#edf1f4',
    marginBottom: spacing.md,
  },
  errorCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#f0cdcd',
    backgroundColor: '#fff4f4',
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  errorTitle: {
    color: '#b34949',
    fontSize: 17,
    fontWeight: '600',
  },
  retryButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyText: {
    color: '#687484',
    fontSize: 16,
    marginBottom: spacing.lg,
  },
});
