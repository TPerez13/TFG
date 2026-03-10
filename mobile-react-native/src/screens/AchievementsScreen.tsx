import React, { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Screen } from '../components/layout/Screen';
import { AchievementListItem } from '../components/achievements/AchievementListItem';
import { MonthlyCalendar } from '../components/achievements/MonthlyCalendar';
import type { AchievementItem } from '../features/achievements/achievementRegistry';
import { startOfMonth } from '../features/achievements/calendarUtils';
import { useAchievements } from '../features/achievements/useAchievements';
import type { ProfileStackParamList } from '../navigation/types';
import { baseStyles } from '../theme/components';
import { colors, fontSizes, spacing } from '../theme/tokens';

type AchievementsScreenProps = NativeStackScreenProps<ProfileStackParamList, 'AchievementsScreen'>;
type FilterKey = 'all' | 'unlocked' | 'locked';
type SelectedDay = {
  dayKey: string;
  achievements: AchievementItem[];
};

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'unlocked', label: 'Desbloqueados' },
  { key: 'locked', label: 'Por desbloquear' },
];

const formatSelectedDayLabel = (dayKey: string) => {
  const parsed = new Date(`${dayKey}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return dayKey;
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
};

const Header = ({ onBack }: { onBack: () => void }) => (
  <View style={styles.header}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Volver"
      onPress={onBack}
      style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}
    >
      <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
    </Pressable>
    <Text style={styles.headerTitle}>Logros</Text>
    <View style={styles.headerSpacer} />
  </View>
);

const LoadingState = ({ onBack }: { onBack: () => void }) => (
  <ScrollView contentContainerStyle={[baseStyles.content, styles.content]}>
    <Header onBack={onBack} />
    <View style={styles.skeletonSummary} />
    <View style={styles.skeletonChipRow}>
      <View style={styles.skeletonChip} />
      <View style={styles.skeletonChip} />
      <View style={styles.skeletonChip} />
    </View>
    <View style={styles.skeletonCard} />
    <View style={styles.skeletonCard} />
    <View style={styles.skeletonCalendar} />
  </ScrollView>
);

const ErrorState = ({ onBack, onRetry }: { onBack: () => void; onRetry: () => void }) => (
  <ScrollView contentContainerStyle={[baseStyles.content, styles.content]}>
    <Header onBack={onBack} />
    <View style={styles.errorCard}>
      <Text style={styles.errorTitle}>No se pudieron cargar los logros</Text>
      <Text style={styles.errorSubtitle}>Comprueba tu conexion y vuelve a intentarlo.</Text>
      <Pressable onPress={onRetry} style={({ pressed }) => [styles.retryButton, pressed ? styles.pressed : null]}>
        <Text style={styles.retryText}>Reintentar</Text>
      </Pressable>
    </View>
  </ScrollView>
);

export default function AchievementsScreen({ navigation }: AchievementsScreenProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => startOfMonth(new Date()));
  const [filter, setFilter] = useState<FilterKey>('all');
  const [selectedDay, setSelectedDay] = useState<SelectedDay | null>(null);
  const { achievements, achievementsByDate, loading, error, reload, isEmpty } =
    useAchievements(selectedMonth);

  const unlockedCount = useMemo(
    () => achievements.filter((item) => item.unlocked).length,
    [achievements],
  );

  const filteredAchievements = useMemo(() => {
    if (filter === 'unlocked') return achievements.filter((item) => item.unlocked);
    if (filter === 'locked') return achievements.filter((item) => !item.unlocked);
    return achievements;
  }, [achievements, filter]);

  if (loading) {
    return (
      <Screen>
        <LoadingState onBack={() => navigation.goBack()} />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState
          onBack={() => navigation.goBack()}
          onRetry={() => {
            void reload();
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={filteredAchievements}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AchievementListItem achievement={item} />}
        contentContainerStyle={[baseStyles.content, styles.content, styles.listContent]}
        ListHeaderComponent={
          <View>
            <Header onBack={() => navigation.goBack()} />

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Resumen</Text>
              <Text style={styles.summaryValue}>
                {unlockedCount}/{achievements.length} desbloqueados
              </Text>
            </View>

            {isEmpty ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Aun no hay registros</Text>
                <Text style={styles.emptySubtitle}>
                  Empieza creando un habito y registrando tu primer dia.
                </Text>
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>Listado de logros</Text>
            <View style={styles.filtersRow}>
              {FILTER_OPTIONS.map((option) => {
                const active = option.key === filter;
                return (
                  <Pressable
                    key={option.key}
                    accessibilityRole="button"
                    onPress={() => setFilter(option.key)}
                    style={({ pressed }) => [
                      styles.filterChip,
                      active ? styles.filterChipActive : null,
                      pressed ? styles.pressed : null,
                    ]}
                  >
                    <Text style={[styles.filterLabel, active ? styles.filterLabelActive : null]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.filteredEmpty}>
            <Text style={styles.filteredEmptyTitle}>No hay logros para este filtro.</Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.calendarSection}>
            <Text style={styles.sectionTitle}>Calendario</Text>
            <MonthlyCalendar
              month={selectedMonth}
              achievementsByDate={achievementsByDate}
              onMonthChange={(nextMonth) => {
                setSelectedMonth(nextMonth);
                setSelectedDay(null);
              }}
              onDayPress={(dayKey, dayAchievements) => {
                if (!dayAchievements.length) return;
                setSelectedDay({
                  dayKey,
                  achievements: dayAchievements,
                });
              }}
            />
          </View>
        }
      />

      <Modal
        visible={Boolean(selectedDay)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDay(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedDay(null)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Logros del dia</Text>
            <Text style={styles.modalDate}>
              {selectedDay ? formatSelectedDayLabel(selectedDay.dayKey) : ''}
            </Text>
            <View style={styles.modalList}>
              {selectedDay?.achievements.map((achievement) => (
                <View key={achievement.id} style={styles.modalItem}>
                  <View style={styles.modalItemIcon}>
                    <Ionicons name={achievement.icon as any} size={16} color={colors.textOnAccent} />
                  </View>
                  <Text style={styles.modalItemTitle}>{achievement.title}</Text>
                </View>
              ))}
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => setSelectedDay(null)}
              style={({ pressed }) => [styles.modalCloseButton, pressed ? styles.pressed : null]}
            >
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.contentBottom + 10,
  },
  listContent: {
    alignItems: 'stretch',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 18,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryTitle: {
    fontSize: fontSizes.sm,
    color: colors.textSubtle,
    fontWeight: '700',
    marginBottom: spacing.xs,
    letterSpacing: 0.2,
  },
  summaryValue: {
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  filterChipActive: {
    borderColor: '#a7debb',
    backgroundColor: '#eaf9f0',
  },
  filterLabel: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  filterLabelActive: {
    color: '#1e7f46',
  },
  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.base,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: fontSizes.md,
    lineHeight: 20,
  },
  filteredEmpty: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  filteredEmptyTitle: {
    color: colors.textMuted,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  calendarSection: {
    marginTop: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.lg,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: fontSizes.base,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalDate: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    marginBottom: spacing.md,
  },
  modalList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  modalItemIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  modalItemTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  modalCloseText: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  errorCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f3c8c8',
    backgroundColor: '#fff5f5',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  errorTitle: {
    color: '#b34848',
    fontSize: fontSizes.base,
    fontWeight: '700',
  },
  errorSubtitle: {
    color: '#b06464',
    fontSize: fontSizes.md,
    lineHeight: 20,
  },
  retryButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryText: {
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  skeletonSummary: {
    height: 86,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  skeletonChipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  skeletonChip: {
    width: 92,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  skeletonCard: {
    height: 120,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  skeletonCalendar: {
    height: 300,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.82,
  },
});
