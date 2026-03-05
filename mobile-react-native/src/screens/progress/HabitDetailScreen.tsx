import React, { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../../components/layout/Screen';
import { getHabitByKey } from '../../features/habits/habitRegistry';
import { useHabitTrend } from '../../features/progress/useHabitTrend';
import {
  dateToLocalKey,
  formatClock,
  formatEntryValue,
  resolveHabitGoals,
} from '../../features/progress/historyUtils';
import { useHistoryRange } from '../../features/progress/useHistoryRange';
import { useMe } from '../../features/users/useMe';
import type { ProgressStackParamList } from '../../navigation/types';
import { baseStyles } from '../../theme/components';
import { colors, radius, spacing } from '../../theme/tokens';

type HabitDetailScreenProps = NativeStackScreenProps<ProgressStackParamList, 'HabitDetail'>;

const toMonthRange = (baseDate: Date) => {
  const from = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1, 0, 0, 0, 0);
  const to = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    23,
    59,
    59,
    999,
  );
  return { fromISO: from.toISOString(), toISO: to.toISOString() };
};

const formatDateLabel = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '--';
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short' }).format(date);
};

export default function HabitDetailScreen({ navigation, route }: HabitDetailScreenProps) {
  const { habitKey } = route.params;
  const definition = getHabitByKey(habitKey);
  const monthRange = useMemo(() => toMonthRange(new Date()), []);

  const { data: trendData, loading: trendLoading, error: trendError, reload: reloadTrend } = useHabitTrend(
    habitKey,
    7,
  );
  const { entries, loading: monthLoading, error: monthError, reload: reloadMonth } = useHistoryRange(
    monthRange.fromISO,
    monthRange.toISO,
    definition?.idTipoHabito,
  );
  const { user, loading: meLoading, error: meError, reload: reloadMe } = useMe();

  const goalConfig = useMemo(
    () => resolveHabitGoals(user?.preferencias ?? null).find((item) => item.habitKey === habitKey),
    [habitKey, user?.preferencias],
  );

  const summary = useMemo(() => {
    const goalValue = goalConfig?.goalValue ?? definition?.goal.value ?? 1;
    const totalByDay = new Map<string, number>();
    entries.forEach((entry) => {
      const parsed = new Date(entry.f_registro);
      if (Number.isNaN(parsed.getTime())) return;
      const key = dateToLocalKey(parsed);
      const current = totalByDay.get(key) ?? 0;
      totalByDay.set(key, current + (Number(entry.valor) || 0));
    });

    const today = new Date();
    const plannedChecks = today.getDate();
    let completedChecks = 0;
    for (let day = 1; day <= plannedChecks; day += 1) {
      const date = new Date(today.getFullYear(), today.getMonth(), day, 12, 0, 0, 0);
      const key = dateToLocalKey(date);
      const total = totalByDay.get(key) ?? 0;
      if (goalValue > 0 && total >= goalValue) {
        completedChecks += 1;
      }
    }

    const completionRate = plannedChecks > 0 ? completedChecks / plannedChecks : 0;
    const hasData = entries.length > 0 && plannedChecks > 0;
    const statusLabel = !hasData ? 'SIN DATOS' : completionRate === 1 ? 'CUMPLIDO' : 'EN PROCESO';

    return {
      completedChecks,
      plannedChecks,
      completionPct: Math.round(completionRate * 100),
      statusLabel,
    };
  }, [definition?.goal.value, entries, goalConfig?.goalValue]);

  const olderRecent = useMemo(() => {
    const today = new Date();
    const todayKey = dateToLocalKey(today);
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 12, 0, 0, 0);
    const yesterdayKey = dateToLocalKey(yesterday);

    return [...entries]
      .sort((left, right) => new Date(right.f_registro).getTime() - new Date(left.f_registro).getTime())
      .filter((entry) => {
        const key = dateToLocalKey(new Date(entry.f_registro));
        return key !== todayKey && key !== yesterdayKey;
      })
      .slice(0, 6);
  }, [entries]);

  const loading = trendLoading || monthLoading || meLoading;
  const error = trendError || monthError || meError || null;
  const isEmpty =
    !loading &&
    !error &&
    trendData.recentToday.length === 0 &&
    trendData.recentYesterday.length === 0 &&
    olderRecent.length === 0;

  const handleRetry = async () => {
    await Promise.all([reloadTrend(), reloadMonth(), reloadMe()]);
  };

  const openHabitsHome = () => {
    const parent = navigation.getParent();
    if (!parent) return;

    if (habitKey === 'agua') {
      parent.navigate('HabitosTab' as never, { screen: 'Hidratacion' } as never);
      return;
    }
    if (habitKey === 'ejercicio') {
      parent.navigate('HabitosTab' as never, { screen: 'Ejercicio' } as never);
      return;
    }
    if (habitKey === 'sueno') {
      parent.navigate('HabitosTab' as never, { screen: 'Sueno' } as never);
      return;
    }
    if (habitKey === 'meditacion') {
      parent.navigate('HabitosTab' as never, { screen: 'Meditacion' } as never);
      return;
    }
    parent.navigate('HabitosTab' as never, { screen: 'Nutrition' } as never);
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
          <Text style={styles.headerTitle}>Detalle de {trendData.habitTitle}</Text>
          <View style={styles.headerSpacer} />
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <View style={styles.loadingBox} />
            <Text style={styles.loadingText}>Cargando detalle del habito...</Text>
          </View>
        ) : null}

        {error && !loading ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>No se pudo cargar el detalle del habito</Text>
            <Pressable onPress={handleRetry} style={({ pressed }) => [styles.retryButton, pressed ? styles.pressed : null]}>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : null}

        {!loading && !error ? (
          <>
            <View style={styles.summaryCard}>
              <View>
                <Text style={styles.summaryEyebrow}>MES ACTUAL</Text>
                <Text style={styles.summaryTitle}>Cumplimiento</Text>
              </View>
              <Text style={styles.summaryPct}>{summary.completionPct}%</Text>
              <Text style={styles.summaryRatio}>
                {summary.completedChecks}/{summary.plannedChecks}
              </Text>
              <Text style={styles.summaryStatus}>{summary.statusLabel}</Text>
            </View>

            <View style={styles.trendCard}>
              <Text style={styles.sectionTitle}>Tendencia ultimos 7 dias</Text>
              <View style={styles.trendBars}>
                {trendData.daily.map((point) => {
                  const height = point.pct > 0 ? Math.max(6, Math.round((point.pct / 100) * 72)) : 6;
                  return (
                    <View key={point.dateKey} style={styles.trendColumn}>
                      <View
                        style={[
                          styles.trendBar,
                          { height, backgroundColor: point.pct >= 100 ? '#22c55e' : '#c7d3dd' },
                        ]}
                      />
                      <Text style={styles.trendLabel}>{point.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <Text style={styles.sectionTitle}>Registros recientes</Text>

            {isEmpty ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>Sin registros para este habito.</Text>
                <Pressable onPress={openHabitsHome} style={({ pressed }) => [styles.emptyCta, pressed ? styles.pressed : null]}>
                  <Text style={styles.emptyCtaText}>Ir a Habitos</Text>
                </Pressable>
              </View>
            ) : null}

            {trendData.recentToday.length > 0 ? (
              <>
                <Text style={styles.groupTitle}>HOY</Text>
                {trendData.recentToday.map((item) => (
                  <View key={item.id} style={styles.entryCard}>
                    <Text style={styles.entryValue}>{item.valueLabel}</Text>
                    <Text style={styles.entryTime}>{item.timeLabel}</Text>
                  </View>
                ))}
              </>
            ) : null}

            {trendData.recentYesterday.length > 0 ? (
              <>
                <Text style={styles.groupTitle}>AYER</Text>
                {trendData.recentYesterday.map((item) => (
                  <View key={item.id} style={styles.entryCard}>
                    <Text style={styles.entryValue}>{item.valueLabel}</Text>
                    <Text style={styles.entryTime}>{item.timeLabel}</Text>
                  </View>
                ))}
              </>
            ) : null}

            {olderRecent.length > 0 ? (
              <>
                <Text style={styles.groupTitle}>ULTIMOS</Text>
                {olderRecent.map((entry) => (
                  <View key={entry.id_registro_habito} style={styles.entryCard}>
                    <Text style={styles.entryValue}>{formatEntryValue(habitKey, entry)}</Text>
                    <Text style={styles.entryTime}>
                      {formatDateLabel(entry.f_registro)} - {formatClock(entry.f_registro)}
                    </Text>
                  </View>
                ))}
              </>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.contentBottom + 12,
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
    fontWeight: '700',
    color: '#121831',
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  pressed: {
    opacity: 0.82,
  },
  summaryCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: '#edf1f5',
    paddingHorizontal: spacing.lgPlus,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lgPlus,
    gap: spacing.xs,
  },
  summaryEyebrow: {
    color: '#607187',
    fontSize: 12,
    letterSpacing: 1.8,
    fontWeight: '700',
  },
  summaryTitle: {
    color: '#111831',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  summaryPct: {
    fontSize: 34,
    lineHeight: 38,
    color: '#1bbf5e',
    fontWeight: '700',
  },
  summaryRatio: {
    color: '#51647c',
    fontSize: 18,
    fontWeight: '600',
  },
  summaryStatus: {
    marginTop: spacing.xs,
    color: '#60748d',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  trendCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: '#edf1f5',
    paddingHorizontal: spacing.lgPlus,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lgPlus,
  },
  trendBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    minHeight: 104,
    paddingTop: spacing.sm,
  },
  trendColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  trendBar: {
    width: 14,
    borderRadius: 6,
  },
  trendLabel: {
    color: '#8a9cb3',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111831',
    marginBottom: spacing.md,
  },
  groupTitle: {
    color: '#61758f',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  entryCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.mdPlus,
    marginBottom: spacing.md,
  },
  entryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#121831',
    marginBottom: spacing.xs,
  },
  entryTime: {
    color: '#60748d',
    fontSize: 16,
  },
  loadingCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingBox: {
    width: '100%',
    height: 98,
    borderRadius: radius.md,
    backgroundColor: '#edf1f4',
  },
  loadingText: {
    color: '#60748d',
    fontSize: 15,
    fontWeight: '600',
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
    fontSize: 16,
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
  emptyCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  emptyText: {
    color: '#60748d',
    fontSize: 16,
    marginBottom: spacing.md,
  },
  emptyCta: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#1bbf5e',
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: '#f8fffb',
  },
  emptyCtaText: {
    color: '#18b257',
    fontWeight: '700',
    fontSize: 15,
  },
});
