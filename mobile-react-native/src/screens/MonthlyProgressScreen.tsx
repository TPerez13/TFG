import React, { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Screen } from '../components/layout/Screen';
import { AchievementCard } from '../components/progress/AchievementCard';
import { InsightCard } from '../components/progress/InsightCard';
import { MonthPager } from '../components/progress/MonthPager';
import { StatCard } from '../components/progress/StatCard';
import { WeeklyBars } from '../components/progress/WeeklyBars';
import { useMonthlyProgress } from '../features/progress/useMonthlyProgress';
import type { ProgressStackParamList } from '../navigation/types';
import { baseStyles } from '../theme/components';
import { colors, fontSizes, radius, spacing } from '../theme/tokens';

type MonthlyProgressScreenProps = NativeStackScreenProps<ProgressStackParamList, 'Progress'>;

const isCurrentMonth = (candidate: Date) => {
  const today = new Date();
  return (
    candidate.getFullYear() === today.getFullYear() && candidate.getMonth() === today.getMonth()
  );
};

const shiftMonth = (baseDate: Date, delta: number) =>
  new Date(baseDate.getFullYear(), baseDate.getMonth() + delta, 1, 12, 0, 0, 0);

const getStatusChipStyle = (status: 'CUMPLIDO' | 'EN PROCESO' | 'SIN DATOS') => {
  if (status === 'CUMPLIDO') {
    return { bg: '#d7efdf', text: '#15a44b' };
  }
  if (status === 'SIN DATOS') {
    return { bg: '#e9eef2', text: '#617283' };
  }
  return { bg: '#fff0d8', text: '#ad6a00' };
};

const getStreakCaption = (streakDays: number, isEmpty: boolean) => {
  if (isEmpty) return '¡Empieza hoy!';
  if (streakDays >= 20) return '¡Excelente!';
  if (streakDays >= 10) return '¡Buen ritmo!';
  return 'Sigue avanzando';
};

export default function MonthlyProgressScreen({ navigation }: MonthlyProgressScreenProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => shiftMonth(new Date(), 0));
  const { data, loading, error, reload } = useMonthlyProgress(selectedMonth);
  const disableNext = isCurrentMonth(selectedMonth);
  const statusChip = getStatusChipStyle(data.statusLabel);

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

  const shareMessage = useMemo(
    () =>
      `Logro mensual - ${data.monthLabel}\nRacha del mes: ${data.streakDays} dias\nPromedio mensual: ${data.monthlyAvg}%\nHabitos completados: ${data.habitsCompleted}\n${data.achievementTitle}`,
    [data.achievementTitle, data.habitsCompleted, data.monthLabel, data.monthlyAvg, data.streakDays],
  );

  const handleShare = async () => {
    try {
      await Share.share({
        title: 'Logro del mes',
        message: shareMessage,
      });
    } catch {
      // No-op: si el usuario cierra el modal, no necesitamos feedback.
    }
  };

  const handlePrevMonth = () => setSelectedMonth((current) => shiftMonth(current, -1));
  const handleNextMonth = () => {
    if (!disableNext) {
      setSelectedMonth((current) => shiftMonth(current, 1));
    }
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
            <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Progreso Mensual</Text>
          <View style={styles.headerSpacer} />
        </View>

        <MonthPager
          monthLabel={data.monthLabel}
          disableNext={disableNext}
          onPrev={handlePrevMonth}
          onNext={handleNextMonth}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir historial"
          onPress={() => navigation.navigate('History')}
          style={({ pressed }) => [styles.historyLinkButton, pressed ? styles.pressed : null]}
        >
          <Ionicons name="time-outline" size={18} color={colors.textAccent} />
          <Text style={styles.historyLinkText}>Ver historial</Text>
        </Pressable>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color={colors.textAccent} />
            <Text style={styles.loadingText}>Cargando progreso mensual...</Text>
          </View>
        ) : null}

        {error && !loading ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>No se pudo cargar el progreso mensual</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reintentar"
              onPress={() => {
                void reload();
              }}
              style={({ pressed }) => [styles.retryButton, pressed ? styles.pressed : null]}
            >
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : null}

        {!error && !loading ? (
          <>
            {data.isEmpty ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Sin registros para este periodo</Text>
                <Text style={styles.emptySubtitle}>
                  Empieza a registrar habitos para ver tu progreso mensual.
                </Text>
              </View>
            ) : null}

            <View style={styles.statsRow}>
              <StatCard
                icon="flame-outline"
                title="Racha del mes"
                value={data.streakDays}
                valueLabel="Días"
                caption={getStreakCaption(data.streakDays, data.isEmpty)}
              />
              <StatCard
                icon="checkmark-circle-outline"
                title="Hábitos"
                value={data.habitsCompleted}
                caption="COMPLETADOS"
                captionColor="#56698a"
              />
            </View>

            <Text style={styles.sectionTitle}>Análisis Mensual</Text>
            <Text style={styles.sectionSubtitle}>Progreso por semanas</Text>

            <View style={styles.analysisCard}>
              <View style={styles.analysisTop}>
                <View>
                  <Text style={styles.analysisPct}>{data.monthlyAvg}%</Text>
                  <Text style={styles.analysisLabel}>Promedio Mensual</Text>
                </View>
                <View style={[styles.statusChip, { backgroundColor: statusChip.bg }]}>
                  <Text style={[styles.statusChipText, { color: statusChip.text }]}>
                    {data.statusLabel}
                  </Text>
                </View>
              </View>
              <WeeklyBars weekly={data.weekly} bestWeekIndex={data.bestWeekIndex} />
            </View>

            <InsightCard
              bestWeekIndex={data.bestWeekIndex}
              bestWeekPct={data.bestWeekPct}
              isEmpty={data.isEmpty}
            />

            <AchievementCard title={data.achievementTitle} onShare={handleShare} />
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.contentBottom + 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.md,
    fontSize: 20,
    fontWeight: '700',
    color: '#101614',
  },
  headerSpacer: {
    width: 42,
    height: 42,
  },
  pressed: {
    opacity: 0.8,
  },
  historyLinkButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  historyLinkText: {
    color: colors.textAccent,
    fontWeight: '700',
    fontSize: fontSizes.md,
  },
  loadingCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: fontSizes.md,
  },
  errorCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#f0cdcd',
    backgroundColor: '#fff4f4',
    padding: spacing.lg,
    marginBottom: spacing.lgPlus,
    gap: spacing.md,
  },
  errorTitle: {
    color: '#b34949',
    fontSize: fontSizes.base,
    lineHeight: 21,
    fontWeight: '600',
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  retryText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: fontSizes.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    color: '#121716',
    fontSize: 25,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    color: '#56698a',
    fontSize: 20,
    marginBottom: spacing.lgPlus,
  },
  analysisCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lgPlus,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lgPlus,
  },
  analysisTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  analysisPct: {
    color: '#101615',
    fontSize: 41,
    lineHeight: 45,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  analysisLabel: {
    color: '#546a89',
    fontSize: 21,
    fontWeight: '600',
  },
  statusChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: '#d7efdf',
    minWidth: 120,
    alignItems: 'center',
  },
  statusChipText: {
    color: '#15a44b',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
  },
  emptyCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.base,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: fontSizes.md,
    lineHeight: 20,
  },
});
