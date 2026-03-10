import React, { useCallback, useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { HabitCard } from '../components/HabitCard';
import { Screen } from '../components/layout/Screen';
import { habitRegistry } from '../features/habits/habitRegistry';
import type { MealType } from '../features/nutrition/types';
import type { HabitsStackParamList } from '../navigation/types';
import { apiFetch } from '../services/api';
import type { HabitEntry } from '../types/models';
import { baseStyles } from '../theme/components';
import { colors, spacing } from '../theme/tokens';

type HabitsScreenProps = NativeStackScreenProps<HabitsStackParamList, 'Habits'>;

const startOfDay = (baseDate: Date) =>
  new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0);
const endOfDay = (baseDate: Date) =>
  new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 59, 59, 999);
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const defaultMealType: MealType = 'DESAYUNO';

export default function HabitsScreen({ navigation }: HabitsScreenProps) {
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);

    const today = new Date();
    const from = startOfDay(today).toISOString();
    const to = endOfDay(today).toISOString();

    try {
      const response = await apiFetch(`/habits/entries?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      if (!response.ok) {
        setEntries([]);
        setError('No se pudo cargar el progreso de hoy.');
        return;
      }

      const payload = (await response.json()) as { entries?: HabitEntry[] };
      setEntries(payload.entries ?? []);
    } catch {
      setEntries([]);
      setError('No se pudo cargar el progreso de hoy.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries]),
  );

  const totalsByType = useMemo(() => {
    const totals = new Map<number, number>();
    entries.forEach((entry) => {
      const current = totals.get(entry.id_tipo_habito) ?? 0;
      totals.set(entry.id_tipo_habito, current + (entry.valor ?? 0));
    });
    return totals;
  }, [entries]);

  const habits = useMemo(() => habitRegistry.filter((habit) => habit.showInGoals !== false), []);

  const goalCards = useMemo(() => {
    return habits.map((habit) => {
      const total = totalsByType.get(habit.idTipoHabito) ?? 0;
      const progress = habit.goal.value > 0 ? clamp(total / habit.goal.value) : 0;
      const subtitle = habit.formatSummary
        ? habit.formatSummary(total, habit.goal)
        : `${total} de ${habit.goal.value} ${habit.goal.unit}`;

      return {
        habit,
        total,
        progress,
        subtitle,
      };
    });
  }, [habits, totalsByType]);

  return (
    <Screen>
      <StatusBar barStyle="dark-content" />
      <View pointerEvents="none" style={styles.background}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
      </View>
      <ScrollView contentContainerStyle={[baseStyles.content, styles.content]}>
        <View style={styles.header}>
          <View style={styles.headerSideSpacer} />
          <Text style={styles.headerTitle}>Mis Habitos</Text>
          <View style={styles.headerSideSpacer} />
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <Text style={styles.loadingText}>Cargando...</Text>
          </View>
        ) : null}

        {error && !loading ? (
          <View style={styles.errorWrap}>
            <Text style={styles.errorText}>No se pudo cargar...</Text>
            <Pressable onPress={loadEntries} style={styles.retryButton}>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.list}>
          {goalCards.map(({ habit, progress, subtitle }) => (
            <HabitCard
              key={habit.key}
              habit={habit}
              variant="goals"
              subtitle={subtitle}
              progress={progress}
              onPress={() => {
                if (habit.key === 'agua') {
                  navigation.navigate('Hidratacion');
                  return;
                }
                if (habit.key === 'ejercicio') {
                  navigation.navigate('Ejercicio');
                  return;
                }
                if (habit.key === 'sueno') {
                  navigation.navigate('Sueno');
                  return;
                }
                if (habit.key === 'meditacion') {
                  navigation.navigate('Meditacion');
                  return;
                }
                if (habit.key === 'comidas') {
                  navigation.navigate('Nutrition', { tipoComidaSeleccionada: defaultMealType });
                  return;
                }
                navigation.navigate('HabitDetail', {
                  habitKey: habit.key,
                  typeId: habit.idTipoHabito,
                });
              }}
            />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  glowTop: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.glowTop,
    opacity: 0.45,
    top: -160,
    left: -80,
  },
  glowBottom: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: colors.glowBottom,
    opacity: 0.35,
    bottom: -180,
    right: -120,
  },
  content: {
    paddingBottom: spacing.contentBottom + 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSideSpacer: {
    width: 38,
    height: 38,
  },
  loadingWrap: {
    marginBottom: spacing.lg,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  errorWrap: {
    marginBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff3f3',
    borderWidth: 1,
    borderColor: '#f3d8d8',
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  errorText: {
    color: '#b84a4a',
    fontSize: 13,
    flexShrink: 1,
  },
  retryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  retryText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    gap: spacing.lg,
  },
});
