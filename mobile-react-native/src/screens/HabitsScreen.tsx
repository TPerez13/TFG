import React, { useCallback, useMemo, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { HabitCard } from '../components/HabitCard';
import { Screen } from '../components/layout/Screen';
import { habitRegistry, type HabitKey } from '../features/habits/habitRegistry';
import { normalizeEntryValueForGoal, resolveHabitGoals } from '../features/progress/historyUtils';
import type { MealType } from '../features/nutrition/types';
import type { HabitsStackParamList } from '../navigation/types';
import { apiFetch } from '../services/api';
import type { HabitEntry, User } from '../types/models';
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
  const [user, setUser] = useState<User | null>(null);
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
      const [entriesRes, userRes] = await Promise.all([
        apiFetch(`/habits/entries?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
        apiFetch('/users/me'),
      ]);

      if (!entriesRes.ok) {
        setEntries([]);
        setError('No se pudo cargar el progreso de hoy.');
        setUser(null);
        return;
      }

      const payload = (await entriesRes.json()) as { entries?: HabitEntry[] };
      setEntries(payload.entries ?? []);

      if (userRes.ok) {
        const userPayload = (await userRes.json()) as { user?: User };
        setUser(userPayload.user ?? null);
      } else {
        setUser(null);
      }
    } catch {
      setEntries([]);
      setUser(null);
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

  const goalsByHabit = useMemo(() => {
    const goals = resolveHabitGoals(user?.preferencias ?? null);
    return new Map(goals.map((goal) => [goal.habitKey, goal]));
  }, [user?.preferencias]);

  const totalsByType = useMemo(() => {
    const totals = new Map<number, number>();
    entries.forEach((entry) => {
      const habit = habitRegistry.find((item) => item.idTipoHabito === entry.id_tipo_habito);
      if (!habit) return;
      const goal = goalsByHabit.get(habit.key);
      const normalizedValue = normalizeEntryValueForGoal(habit.key, entry, goal?.goalUnit);
      const current = totals.get(entry.id_tipo_habito) ?? 0;
      totals.set(entry.id_tipo_habito, current + normalizedValue);
    });
    return totals;
  }, [entries, goalsByHabit]);

  const habits = useMemo(() => habitRegistry.filter((habit) => habit.showInGoals !== false), []);

  const goalCards = useMemo(() => {
    return habits.map((habit) => {
      const goal = goalsByHabit.get(habit.key);
      const target = {
        value: goal?.goalValue ?? habit.goal.value,
        unit: goal?.goalUnit ?? habit.goal.unit,
      };
      const total = totalsByType.get(habit.idTipoHabito) ?? 0;
      const progress = target.value > 0 ? clamp(total / target.value) : 0;
      const subtitle = habit.formatSummary
        ? habit.formatSummary(total, target)
        : `${total} de ${target.value} ${target.unit}`;

      return {
        habit,
        total,
        progress,
        subtitle,
      };
    });
  }, [goalsByHabit, habits, totalsByType]);

  const onHabitPress = (habitKey: HabitKey, typeId: number) => {
    if (habitKey === 'agua') {
      navigation.navigate('Hidratacion');
      return;
    }
    if (habitKey === 'ejercicio') {
      navigation.navigate('Ejercicio');
      return;
    }
    if (habitKey === 'sueno') {
      navigation.navigate('Sueno');
      return;
    }
    if (habitKey === 'meditacion') {
      navigation.navigate('Meditacion');
      return;
    }
    if (habitKey === 'comidas') {
      navigation.navigate('Nutrition', { tipoComidaSeleccionada: defaultMealType });
      return;
    }
    navigation.navigate('HabitDetail', {
      habitKey,
      typeId,
    });
  };

  const onHabitQuickAdd = (habitKey: HabitKey) => {
    if (habitKey === 'agua') {
      navigation.navigate('RegistrarAgua', { mode: 'quick' });
      return;
    }
    if (habitKey === 'ejercicio') {
      navigation.navigate('RegistrarEjercicio', { mode: 'quick' });
      return;
    }
    if (habitKey === 'sueno') {
      navigation.navigate('RegistrarSueno', { mode: 'quick' });
      return;
    }
    if (habitKey === 'meditacion') {
      navigation.navigate('RegistrarMeditacion', { mode: 'quick' });
      return;
    }
    if (habitKey === 'comidas') {
      navigation.navigate('NutritionQuickAdd', { tipoComidaSeleccionada: defaultMealType });
      return;
    }
  };

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
          <Text style={styles.headerTitle}>Mis Hábitos</Text>
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
              showPlusButton={habit.quickAdd.enabled}
              onQuickAdd={() => onHabitQuickAdd(habit.key)}
              onPress={() => onHabitPress(habit.key, habit.idTipoHabito)}
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
