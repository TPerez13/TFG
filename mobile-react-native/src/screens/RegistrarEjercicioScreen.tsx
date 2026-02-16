import React, { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ExerciseTemplateCard } from '../components/exercise/ExerciseTemplateCard';
import { Screen } from '../components/layout/Screen';
import { Button } from '../components/ui/Button';
import { emitExerciseFlash } from '../features/exercise/exerciseFlash';
import {
  EXERCISE_ACTIVITY_TYPES,
  EXERCISE_INTENSITIES,
  exerciseIntensityLabel,
  exerciseTypeLabel,
  type ExerciseActivityType,
  type ExerciseIntensity,
  type ExerciseTemplate,
} from '../features/exercise/types';
import { serializeExerciseNotes } from '../features/exercise/utils';
import { useRecentExerciseTemplates } from '../features/exercise/useRecentExerciseTemplates';
import { getHabitByKey } from '../features/habits/habitRegistry';
import { useCreateHabitEntry } from '../features/habits/useCreateHabitEntry';
import type { HabitsStackParamList } from '../navigation/types';
import { baseStyles } from '../theme/components';
import { colors, fontSizes, radius, spacing } from '../theme/tokens';

type RegistrarEjercicioScreenProps = NativeStackScreenProps<HabitsStackParamList, 'RegistrarEjercicio'>;

const formatNowTime = () =>
  new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

const parseNumeric = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed.replace(',', '.'));
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
};

const templateSubtitle = (template: ExerciseTemplate) => {
  const parts: string[] = [];
  if (template.intensity) {
    parts.push(`Intensidad ${exerciseIntensityLabel(template.intensity)}`);
  }
  if (typeof template.kcal === 'number') {
    parts.push(`${Math.round(template.kcal)} kcal`);
  }
  return parts.join(' - ');
};

export default function RegistrarEjercicioScreen({
  navigation,
  route,
}: RegistrarEjercicioScreenProps) {
  const initialType = route.params?.activityTypeSeleccionada ?? 'caminata';
  const [mode, setMode] = useState<'quick' | 'manual'>(route.params?.mode ?? 'quick');
  const [selectedType, setSelectedType] = useState<ExerciseActivityType>(initialType);
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState<ExerciseIntensity | undefined>(undefined);
  const [kcal, setKcal] = useState('');
  const [notes, setNotes] = useState('');
  const [showDurationError, setShowDurationError] = useState(false);

  const { suggested, recent, loading: loadingRecent, error: recentError, reload } = useRecentExerciseTemplates();
  const { createEntry, creating } = useCreateHabitEntry();
  const exerciseTypeId = getHabitByKey('ejercicio')?.idTipoHabito ?? 3;
  const timeLabel = useMemo(() => formatNowTime(), []);

  useFocusEffect(
    React.useCallback(() => {
      void reload();
    }, [reload]),
  );

  const filteredSuggested = useMemo(
    () => suggested.filter((item) => item.activityType === selectedType),
    [selectedType, suggested],
  );

  const filteredRecent = useMemo(
    () => recent.filter((item) => item.activityType === selectedType),
    [recent, selectedType],
  );

  const saveExercise = async (template: {
    activityType: ExerciseActivityType;
    durationMin: number;
    intensity?: ExerciseIntensity;
    kcal?: number;
    notesText?: string;
  }) => {
    const notesJson = serializeExerciseNotes({
      activityType: template.activityType,
      intensity: template.intensity,
      kcal: template.kcal,
      notesText: template.notesText,
    });

    try {
      const created = await createEntry({
        typeId: exerciseTypeId,
        value: template.durationMin,
        unit: 'min',
        dateTime: new Date().toISOString(),
        notes: notesJson ?? undefined,
      });

      emitExerciseFlash({
        message: 'Ejercicio registrado correctamente!',
        undoEntryId: created.id_registro_habito,
      });
      navigation.reset({
        index: 1,
        routes: [
          { name: 'Habits' },
          {
            name: 'Ejercicio',
            params: {
              activityTypeSeleccionada: template.activityType,
              refreshToken: Date.now(),
            },
          },
        ],
      });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo registrar ejercicio.');
    }
  };

  const handleManualSave = async () => {
    const parsedDuration = parseNumeric(duration);
    if (!parsedDuration || parsedDuration <= 0) {
      setShowDurationError(true);
      return;
    }
    setShowDurationError(false);

    const parsedKcal = parseNumeric(kcal);
    await saveExercise({
      activityType: selectedType,
      durationMin: parsedDuration,
      intensity,
      kcal: typeof parsedKcal === 'number' && parsedKcal > 0 ? parsedKcal : undefined,
      notesText: notes.trim() || undefined,
    });
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={[baseStyles.content, styles.content]}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.iconButton, pressed ? styles.buttonPressed : null]}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Registro de Ejercicio</Text>
          <Pressable onPress={() => Alert.alert('Ayuda', 'Disponible pronto.')}>
            <Text style={styles.helpText}>Ayuda</Text>
          </Pressable>
        </View>

        <View style={styles.modeCard}>
          <View style={styles.modeInfo}>
            <Ionicons name="barbell-outline" size={24} color={colors.textAccent} />
            <View>
              <Text style={styles.modeTitle}>Ejercicio</Text>
              <Text style={styles.modeMeta}>Hoy, {timeLabel}</Text>
            </View>
          </View>
          <Pressable
            onPress={() => setMode((current) => (current === 'quick' ? 'manual' : 'quick'))}
            style={({ pressed }) => [styles.switchButton, pressed ? styles.buttonPressed : null]}
          >
            <Text style={styles.switchButtonText}>
              {mode === 'quick' ? 'Cambiar a Manual' : 'Cambiar a Registro Rapido'}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.fieldLabel}>Tipo de actividad</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {EXERCISE_ACTIVITY_TYPES.map((activityType) => (
            <Pressable
              key={activityType}
              onPress={() => setSelectedType(activityType)}
              style={({ pressed }) => [
                styles.chip,
                selectedType === activityType ? styles.chipActive : null,
                pressed ? styles.buttonPressed : null,
              ]}
            >
              <Text style={[styles.chipText, selectedType === activityType ? styles.chipTextActive : null]}>
                {exerciseTypeLabel(activityType)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {mode === 'quick' ? (
          <View>
            <Text style={styles.sectionTitle}>Sugeridos</Text>
            {filteredSuggested.map((template) => (
              <ExerciseTemplateCard
                key={`suggested-${template.label}`}
                activityType={template.activityType}
                durationMin={template.durationMin}
                subtitle={templateSubtitle(template) || template.notesText}
                titleOverride={template.notesText && template.activityType === 'otro' ? template.notesText : undefined}
                onAdd={() => void saveExercise(template)}
              />
            ))}

            <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Recientes</Text>
            {loadingRecent ? <ActivityIndicator size="small" color={colors.textAccent} /> : null}
            {recentError ? <Text style={styles.errorText}>{recentError}</Text> : null}
            {!loadingRecent && filteredRecent.length === 0 ? (
              <Text style={styles.emptyText}>No hay registros recientes para {exerciseTypeLabel(selectedType)}.</Text>
            ) : null}
            {filteredRecent.map((template, index) => (
              <ExerciseTemplateCard
                key={`recent-${template.label}-${index}`}
                activityType={template.activityType}
                durationMin={template.durationMin}
                subtitle={templateSubtitle(template)}
                titleOverride={template.notesText && template.activityType === 'otro' ? template.notesText : undefined}
                onAdd={() => void saveExercise(template)}
              />
            ))}
          </View>
        ) : (
          <View>
            <Text style={styles.fieldLabel}>Duracion (min)</Text>
            <TextInput
              value={duration}
              onChangeText={(value) => {
                setDuration(value);
                const parsedValue = parseNumeric(value);
                if (showDurationError && parsedValue && parsedValue > 0) {
                  setShowDurationError(false);
                }
              }}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.placeholder}
              style={[styles.input, showDurationError ? styles.inputError : null]}
            />
            {showDurationError ? <Text style={styles.errorText}>Introduce la duracion en minutos.</Text> : null}

            <Text style={styles.fieldLabel}>Intensidad (opcional)</Text>
            <View style={styles.chipWrap}>
              <Pressable
                onPress={() => setIntensity(undefined)}
                style={({ pressed }) => [
                  styles.chip,
                  !intensity ? styles.chipActive : null,
                  pressed ? styles.buttonPressed : null,
                ]}
              >
                <Text style={[styles.chipText, !intensity ? styles.chipTextActive : null]}>Sin intensidad</Text>
              </Pressable>
              {EXERCISE_INTENSITIES.map((value) => (
                <Pressable
                  key={value}
                  onPress={() => setIntensity(value)}
                  style={({ pressed }) => [
                    styles.chip,
                    intensity === value ? styles.chipActive : null,
                    pressed ? styles.buttonPressed : null,
                  ]}
                >
                  <Text style={[styles.chipText, intensity === value ? styles.chipTextActive : null]}>
                    {exerciseIntensityLabel(value)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Calorias (kcal) opcional</Text>
            <TextInput
              value={kcal}
              onChangeText={setKcal}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.placeholder}
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>Notas (opcional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Ej. circuito de piernas"
              placeholderTextColor={colors.placeholder}
              style={styles.input}
            />

            <Button
              title={creating ? 'Guardando...' : 'Guardar'}
              onPress={() => void handleManualSave()}
              style={styles.saveButton}
            />
            <Button
              title="Cambiar a Registro Rapido"
              variant="outline"
              onPress={() => setMode('quick')}
              style={styles.switchModeButton}
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

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
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  helpText: {
    color: colors.textAccent,
    fontSize: fontSizes.base,
    fontWeight: '700',
  },
  modeCard: {
    borderRadius: radius.lg,
    backgroundColor: '#dff2e7',
    borderWidth: 1,
    borderColor: '#d0e8d9',
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  modeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modeTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  modeMeta: {
    fontSize: fontSizes.base,
    color: colors.textMuted,
    fontWeight: '600',
  },
  switchButton: {
    alignSelf: 'flex-end',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  switchButtonText: {
    color: colors.textPrimary,
    fontSize: fontSizes.base,
    fontWeight: '700',
  },
  fieldLabel: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  chipRow: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: {
    borderColor: colors.textAccent,
    backgroundColor: '#eafbf1',
  },
  chipText: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#167a43',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  sectionSpacing: {
    marginTop: spacing.lg,
  },
  errorText: {
    color: '#b84a4a',
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  input: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#d0d7d1',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 18,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    minHeight: 58,
  },
  inputError: {
    borderColor: '#e67a00',
  },
  saveButton: {
    marginTop: spacing.lg,
  },
  switchModeButton: {
    marginTop: spacing.md,
    backgroundColor: '#f0f3f1',
    borderColor: '#d9e2db',
  },
});
