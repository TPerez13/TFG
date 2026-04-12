import React, { useCallback, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../components/layout/Screen';
import { useAuth } from '../navigation/AuthContext';
import { apiFetch } from '../services/api';
import {
  GOAL_EDITOR_ORDER,
  GOAL_UNITS,
  buildGoalInputMap,
  buildGoalPreferencePatch,
  type HabitGoalInputMap,
  type HabitGoalValidationErrors,
} from '../features/habits/goalPreferences';
import { getHabitByKey, type HabitKey } from '../features/habits/habitRegistry';
import { syncLocalHabitReminders } from '../features/notifications/syncLocalReminders';
import { baseStyles } from '../theme/components';
import { colors, fontSizes, spacing } from '../theme/tokens';

type HabitGoalsScreenProps = {
  navigation: {
    goBack: () => void;
  };
};

export default function HabitGoalsScreen({ navigation }: HabitGoalsScreenProps) {
  const { signOut } = useAuth();
  const [goalValues, setGoalValues] = useState<HabitGoalInputMap>(() => buildGoalInputMap(null));
  const [initialValues, setInitialValues] = useState<HabitGoalInputMap>(() => buildGoalInputMap(null));
  const [fieldErrors, setFieldErrors] = useState<HabitGoalValidationErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadGoals = useCallback(async () => {
    try {
      setLoading(true);
      setFeedback(null);
      const response = await apiFetch('/users/me');

      if (response.status === 401) {
        await signOut();
        return;
      }

      if (!response.ok) {
        throw new Error('No se pudieron cargar las metas.');
      }

      const payload = (await response.json()) as {
        user?: {
          preferencias?: Record<string, unknown> | null;
        };
      };
      const values = buildGoalInputMap(payload.user?.preferencias ?? null);
      setGoalValues(values);
      setInitialValues(values);
      setFieldErrors({});
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'No se pudieron cargar las metas.');
    } finally {
      setLoading(false);
    }
  }, [signOut]);

  useFocusEffect(
    useCallback(() => {
      void loadGoals();
    }, [loadGoals]),
  );

  const cards = useMemo(
    () =>
      GOAL_EDITOR_ORDER.map((habitKey) => {
        const habit = getHabitByKey(habitKey);
        return {
          habitKey,
          title: habit?.title ?? habitKey,
          icon: habit?.icon ?? 'ellipse-outline',
          accentColor: habit?.accentColor ?? colors.textAccent,
          helperText: helperTextByHabit[habitKey],
          unit: GOAL_UNITS[habitKey],
          value: goalValues[habitKey],
          error: fieldErrors[habitKey],
        };
      }),
    [fieldErrors, goalValues],
  );

  const isDirty = GOAL_EDITOR_ORDER.some((habitKey) => goalValues[habitKey] !== initialValues[habitKey]);

  const onChangeValue = (habitKey: HabitKey, nextValue: string) => {
    setGoalValues((current) => ({
      ...current,
      [habitKey]: nextValue,
    }));
    setFieldErrors((current) => {
      if (!current[habitKey]) return current;
      const nextErrors = { ...current };
      delete nextErrors[habitKey];
      return nextErrors;
    });
    if (feedback) {
      setFeedback(null);
    }
  };

  const saveGoals = async () => {
    const result = buildGoalPreferencePatch(goalValues);
    if (!result.ok) {
      setFieldErrors(result.errors);
      setFeedback('Revisa los campos marcados antes de guardar.');
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);
      const response = await apiFetch('/users/me', {
        method: 'PUT',
        body: JSON.stringify({
          preferencias: result.patch,
        }),
      });

      if (response.status === 401) {
        await signOut();
        return;
      }

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? 'No se pudieron guardar las metas.');
      }

      const payload = (await response.json()) as {
        preferencias?: Record<string, unknown> | null;
        user?: {
          preferencias?: Record<string, unknown> | null;
        };
      };
      const nextValues = buildGoalInputMap(payload.preferencias ?? payload.user?.preferencias ?? result.patch);
      setGoalValues(nextValues);
      setInitialValues(nextValues);
      setFieldErrors({});
      await syncLocalHabitReminders();
      setFeedback('Metas guardadas.');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'No se pudieron guardar las metas.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={[baseStyles.content, styles.content]}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Volver"
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backButton, pressed ? styles.backPressed : null]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Metas diarias</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.hero}>
          <Text style={styles.title}>Configura tus objetivos</Text>
          <Text style={styles.subtitle}>Estas metas se usan en las pantallas de hábitos y progreso.</Text>
        </View>

        {loading ? <ActivityIndicator size="large" color={colors.textAccent} style={styles.loading} /> : null}

        {!loading ? (
          <>
            <View style={styles.list}>
              {cards.map((card) => (
                <View key={card.habitKey} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.iconWrap, { backgroundColor: `${card.accentColor}1A` }]}>
                      <Ionicons name={card.icon as any} size={20} color={card.accentColor} />
                    </View>
                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle}>{card.title}</Text>
                      {card.helperText ? <Text style={styles.cardHelper}>{card.helperText}</Text> : null}
                    </View>
                    <View style={styles.unitBadge}>
                      <Text style={styles.unitBadgeText}>{card.unit}</Text>
                    </View>
                  </View>

                  <Text style={styles.inputLabel}>Objetivo diario</Text>
                  <TextInput
                    accessibilityLabel={`Meta diaria de ${card.title}`}
                    keyboardType={card.habitKey === 'sueno' ? 'decimal-pad' : 'number-pad'}
                    value={card.value}
                    onChangeText={(nextValue) => onChangeValue(card.habitKey, nextValue)}
                    placeholder="0"
                    placeholderTextColor={colors.placeholder}
                    style={[styles.input, card.error ? styles.inputError : null]}
                  />
                  {card.error ? <Text style={styles.fieldError}>{card.error}</Text> : null}
                </View>
              ))}
            </View>

            <View style={styles.noteCard}>
              <Text style={styles.noteTitle}>Sobre recordatorios y nutrición</Text>
              <Text style={styles.noteText}>
                Los recordatorios siguen usando su propia hora y se marcan como hechos cuando registras el
                hábito. En nutrición, la meta actual sigue siendo número de comidas; la meta de calorías irá
                aparte.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={saving || !isDirty}
              onPress={() => {
                void saveGoals();
              }}
              style={({ pressed }) => [
                styles.saveButton,
                saving || !isDirty ? styles.saveDisabled : null,
                pressed ? styles.backPressed : null,
              ]}
            >
              <Text style={styles.saveText}>{saving ? 'Guardando...' : 'Guardar metas'}</Text>
            </Pressable>

            {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const helperTextByHabit: Partial<Record<HabitKey, string>> = {
  agua: 'Cantidad total de agua que quieres registrar al día.',
  comidas: 'Objetivo diario de comidas registradas.',
  ejercicio: 'Tiempo total de actividad física diaria.',
  sueno: 'Horas de descanso que quieres completar al día.',
  meditacion: 'Minutos diarios dedicados a meditar.',
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.contentBottom + 24,
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
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: {
    opacity: 0.85,
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
  hero: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSizes.base,
    color: colors.textMuted,
    lineHeight: 22,
  },
  loading: {
    marginTop: spacing.xl,
  },
  list: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  cardHelper: {
    fontSize: fontSizes.sm,
    color: colors.textSubtle,
    lineHeight: 18,
  },
  unitBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  unitBadgeText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textMuted,
  },
  inputLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textSubtle,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: fontSizes.base,
    fontWeight: '600',
  },
  inputError: {
    borderColor: colors.error,
    backgroundColor: colors.errorSoft,
  },
  fieldError: {
    marginTop: spacing.xs,
    color: colors.error,
    fontSize: fontSizes.sm,
  },
  noteCard: {
    backgroundColor: colors.warningSoft,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ecd9b5',
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noteTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  noteText: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  saveDisabled: {
    opacity: 0.6,
  },
  saveText: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.textOnAccent,
  },
  feedback: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: fontSizes.sm,
  },
});
