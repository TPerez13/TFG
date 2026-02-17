import React, { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/layout/Screen';
import { HistoryHabitCard } from '../components/progress/HistoryHabitCard';
import {
  aggregateByHabitAndDay,
  formatClock,
  formatDaySectionLabel,
  formatHabitValue,
  getDayRange,
  getMotivationalText,
  lastNDays,
  resolveHabitGoals,
  type AggregatedHabitDay,
  type HabitGoalConfig,
} from '../features/progress/historyUtils';
import { useHistoryRange } from '../features/progress/useHistoryRange';
import { useMe } from '../features/users/useMe';
import type { HistoryFilterKey, ProgressStackParamList } from '../navigation/types';
import { baseStyles } from '../theme/components';
import { colors, radius, spacing } from '../theme/tokens';

type HistoryScreenProps = NativeStackScreenProps<ProgressStackParamList, 'History'>;

const FILTER_OPTIONS: Array<{ key: HistoryFilterKey; label: string }> = [
  { key: 'todos', label: 'Todos' },
  { key: 'agua', label: 'Agua' },
  { key: 'ejercicio', label: 'Ejercicio' },
  { key: 'sueno', label: 'Sueno' },
  { key: 'meditacion', label: 'Meditacion' },
  { key: 'comidas', label: 'Comidas' },
];

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

export default function HistoryScreen({ navigation }: HistoryScreenProps) {
  const [selectedFilter, setSelectedFilter] = useState<HistoryFilterKey>('todos');
  const dayListDesc = useMemo(() => [...lastNDays(7)].reverse(), []);

  const range = useMemo(() => {
    const oldest = dayListDesc[dayListDesc.length - 1] ?? new Date();
    const newest = dayListDesc[0] ?? new Date();
    const from = getDayRange(oldest).fromISO;
    const to = getDayRange(newest).toISO;
    return { from, to };
  }, [dayListDesc]);

  const filterTypeId = useMemo(() => {
    if (selectedFilter === 'todos') return undefined;
    const goals = resolveHabitGoals(null);
    return goals.find((goal) => goal.habitKey === selectedFilter)?.typeId;
  }, [selectedFilter]);

  const { entries, loading: historyLoading, error, reload } = useHistoryRange(
    range.from,
    range.to,
    filterTypeId,
  );
  const { user, loading: meLoading, reload: reloadMe } = useMe();

  const goals = useMemo(() => resolveHabitGoals(user?.preferencias ?? null), [user?.preferencias]);
  const aggregated = useMemo(
    () => aggregateByHabitAndDay(entries, goals),
    [entries, goals],
  );

  const loading = historyLoading || meLoading;
  const isEmpty = !loading && !error && entries.length === 0;

  const onBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    const parent = navigation.getParent();
    if (parent) {
      parent.navigate('InicioTab' as never);
    }
  };

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
            onPress={onBack}
            style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}
          >
            <Ionicons name="chevron-back" size={30} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Historial</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {FILTER_OPTIONS.map((option) => {
            const active = selectedFilter === option.key;
            return (
              <Pressable
                key={option.key}
                onPress={() => setSelectedFilter(option.key)}
                style={({ pressed }) => [
                  styles.chip,
                  active ? styles.chipActive : null,
                  pressed ? styles.pressed : null,
                ]}
              >
                <Text style={[styles.chipLabel, active ? styles.chipLabelActive : null]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingBlock}>
            <View style={styles.loadingTitle} />
            <View style={styles.loadingCard} />
            <View style={styles.loadingCard} />
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

        {isEmpty ? <Text style={styles.emptyText}>Aun no hay registros.</Text> : null}

        {!loading && !error
          ? dayListDesc.map((date) => {
              const dayKey = `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`;
              const dayTitle = formatDaySectionLabel(date);
              const dayItems = aggregated.get(dayKey) ?? getFallbackDayItems(goals);
              const visibleItems =
                selectedFilter === 'todos'
                  ? dayItems.filter((item) => item.total > 0)
                  : dayItems.filter((item) => item.habitKey === selectedFilter);

              return (
                <View key={dayKey} style={styles.daySection}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayTitle}>{dayTitle}</Text>
                    <Pressable
                      onPress={() =>
                        navigation.navigate('DayHistoryDetail', {
                          dayKey,
                          filter: selectedFilter,
                        })
                      }
                    >
                      <Text style={styles.detailLink}>Ver detalle</Text>
                    </Pressable>
                  </View>

                  {visibleItems.length === 0 ? (
                    <Text style={styles.dayEmptyText}>Sin registros para este dia.</Text>
                  ) : (
                    visibleItems.map((item) => (
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
                  )}
                </View>
              );
            })
          : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.contentBottom + 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lgPlus,
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
    color: '#101714',
    fontWeight: '700',
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  pressed: {
    opacity: 0.82,
  },
  chipsRow: {
    paddingBottom: spacing.sm,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#d7dde0',
    backgroundColor: '#f0f2f4',
  },
  chipActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  chipLabel: {
    fontSize: 19,
    fontWeight: '700',
    color: '#151a18',
  },
  chipLabelActive: {
    color: '#f5fff8',
  },
  daySection: {
    marginTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dayTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#202724',
  },
  detailLink: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16b457',
    textDecorationLine: 'underline',
  },
  dayEmptyText: {
    color: '#6a7484',
    fontSize: 16,
    marginBottom: spacing.md,
    marginLeft: spacing.sm,
  },
  loadingBlock: {
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  loadingTitle: {
    width: 120,
    height: 20,
    borderRadius: 8,
    backgroundColor: '#e6eaee',
    marginBottom: spacing.md,
  },
  loadingCard: {
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
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  emptyText: {
    color: '#5f6d64',
    fontSize: 17,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
});
