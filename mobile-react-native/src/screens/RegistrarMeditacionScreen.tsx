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
import { MeditationTemplateCard } from '../components/meditation/MeditationTemplateCard';
import { Screen } from '../components/layout/Screen';
import { Button } from '../components/ui/Button';
import { getHabitByKey } from '../features/habits/habitRegistry';
import { useCreateHabitEntry } from '../features/habits/useCreateHabitEntry';
import { emitMeditationFlash } from '../features/meditation/meditationFlash';
import {
  MEDITATION_TYPES,
  meditationTypeLabel,
  type MeditationSessionType,
  type MeditationTemplate,
} from '../features/meditation/types';
import { useRecentMeditationTemplates } from '../features/meditation/useRecentMeditationTemplates';
import { serializeMeditationNotes } from '../features/meditation/utils';
import type { HabitsStackParamList } from '../navigation/types';
import { baseStyles } from '../theme/components';
import { colors, fontSizes, radius, spacing } from '../theme/tokens';

type RegistrarMeditacionScreenProps = NativeStackScreenProps<HabitsStackParamList, 'RegistrarMeditacion'>;

const MOOD_VALUES = [1, 2, 3, 4, 5] as const;

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

const templateSubtitle = (template: MeditationTemplate) => {
  const parts: string[] = [];
  if (typeof template.moodBefore === 'number' || typeof template.moodAfter === 'number') {
    parts.push(`Mood ${template.moodBefore ?? '-'} -> ${template.moodAfter ?? '-'}`);
  }
  return parts.join(' - ');
};

export default function RegistrarMeditacionScreen({
  navigation,
  route,
}: RegistrarMeditacionScreenProps) {
  const initialType = route.params?.sessionTypeSeleccionada ?? 'respiracion';
  const [mode, setMode] = useState<'quick' | 'manual'>(route.params?.mode ?? 'quick');
  const [selectedType, setSelectedType] = useState<MeditationSessionType>(initialType);
  const [duration, setDuration] = useState('');
  const [moodBefore, setMoodBefore] = useState<number | undefined>(undefined);
  const [moodAfter, setMoodAfter] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [showDurationError, setShowDurationError] = useState(false);

  const { suggested, recent, loading: loadingRecent, error: recentError, reload } = useRecentMeditationTemplates();
  const { createEntry, creating } = useCreateHabitEntry();
  const meditationTypeId = getHabitByKey('meditacion')?.idTipoHabito ?? 5;
  const timeLabel = useMemo(() => formatNowTime(), []);

  useFocusEffect(
    React.useCallback(() => {
      void reload();
    }, [reload]),
  );

  const filteredSuggested = useMemo(
    () => suggested.filter((item) => item.type === selectedType),
    [selectedType, suggested],
  );

  const filteredRecent = useMemo(
    () => recent.filter((item) => item.type === selectedType),
    [recent, selectedType],
  );

  const saveMeditation = async (template: {
    type: MeditationSessionType;
    durationMin: number;
    moodBefore?: number;
    moodAfter?: number;
    notesText?: string;
  }) => {
    const notesJson = serializeMeditationNotes({
      type: template.type,
      moodBefore: template.moodBefore,
      moodAfter: template.moodAfter,
      notesText: template.notesText,
    });

    try {
      const created = await createEntry({
        typeId: meditationTypeId,
        value: template.durationMin,
        unit: 'min',
        dateTime: new Date().toISOString(),
        notes: notesJson ?? undefined,
      });

      emitMeditationFlash({
        message: 'Meditacion registrada correctamente!',
        undoEntryId: created.id_registro_habito,
      });
      navigation.reset({
        index: 1,
        routes: [
          { name: 'Habits' },
          {
            name: 'Meditacion',
            params: {
              sessionTypeSeleccionada: template.type,
              refreshToken: Date.now(),
            },
          },
        ],
      });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo registrar meditacion.');
    }
  };

  const onSaveManual = async () => {
    const parsedDuration = parseNumeric(duration);
    if (!parsedDuration || parsedDuration <= 0 || parsedDuration > 180) {
      setShowDurationError(true);
      return;
    }
    setShowDurationError(false);

    await saveMeditation({
      type: selectedType,
      durationMin: Math.round(parsedDuration),
      moodBefore,
      moodAfter,
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
          <Text style={styles.headerTitle}>Registro de Meditacion</Text>
          <Pressable onPress={() => Alert.alert('Ayuda', 'Disponible pronto.')}>
            <Text style={styles.helpText}>Ayuda</Text>
          </Pressable>
        </View>

        <View style={styles.modeCard}>
          <View style={styles.modeInfo}>
            <Ionicons name="leaf-outline" size={24} color={colors.textAccent} />
            <View>
              <Text style={styles.modeTitle}>Meditacion</Text>
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

        <Text style={styles.fieldLabel}>Tipo de meditacion</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {MEDITATION_TYPES.map((type) => (
            <Pressable
              key={type}
              onPress={() => setSelectedType(type)}
              style={({ pressed }) => [
                styles.chip,
                selectedType === type ? styles.chipActive : null,
                pressed ? styles.buttonPressed : null,
              ]}
            >
              <Text style={[styles.chipText, selectedType === type ? styles.chipTextActive : null]}>
                {meditationTypeLabel(type)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {mode === 'quick' ? (
          <View>
            <Text style={styles.sectionTitle}>Sugeridos</Text>
            {filteredSuggested.map((template) => (
              <MeditationTemplateCard
                key={`suggested-${template.label}`}
                type={template.type}
                durationMin={template.durationMin}
                subtitle={templateSubtitle(template)}
                onAdd={() => void saveMeditation(template)}
              />
            ))}

            <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Recientes</Text>
            {loadingRecent ? <ActivityIndicator size="small" color={colors.textAccent} /> : null}
            {recentError ? <Text style={styles.errorText}>{recentError}</Text> : null}
            {!loadingRecent && filteredRecent.length === 0 ? (
              <Text style={styles.emptyText}>No hay registros recientes para {meditationTypeLabel(selectedType)}.</Text>
            ) : null}
            {filteredRecent.map((template, index) => (
              <MeditationTemplateCard
                key={`recent-${template.label}-${index}`}
                type={template.type}
                durationMin={template.durationMin}
                subtitle={templateSubtitle(template)}
                onAdd={() => void saveMeditation(template)}
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
                const parsed = parseNumeric(value);
                if (showDurationError && parsed && parsed > 0 && parsed <= 180) {
                  setShowDurationError(false);
                }
              }}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.placeholder}
              style={[styles.input, showDurationError ? styles.inputError : null]}
            />
            {showDurationError ? <Text style={styles.errorText}>Introduce una duracion valida (1-180 min).</Text> : null}

            <Text style={styles.fieldLabel}>Estado de animo antes (opcional)</Text>
            <View style={styles.moodRow}>
              {MOOD_VALUES.map((value) => (
                <Pressable
                  key={`before-${value}`}
                  onPress={() => setMoodBefore(value)}
                  style={({ pressed }) => [
                    styles.moodChip,
                    moodBefore === value ? styles.moodChipActive : null,
                    pressed ? styles.buttonPressed : null,
                  ]}
                >
                  <Text style={[styles.moodText, moodBefore === value ? styles.moodTextActive : null]}>{value}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Estado de animo despues (opcional)</Text>
            <View style={styles.moodRow}>
              {MOOD_VALUES.map((value) => (
                <Pressable
                  key={`after-${value}`}
                  onPress={() => setMoodAfter(value)}
                  style={({ pressed }) => [
                    styles.moodChip,
                    moodAfter === value ? styles.moodChipActive : null,
                    pressed ? styles.buttonPressed : null,
                  ]}
                >
                  <Text style={[styles.moodText, moodAfter === value ? styles.moodTextActive : null]}>{value}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Notas (opcional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Ej. me senti mas calmado"
              placeholderTextColor={colors.placeholder}
              style={styles.input}
            />

            <Button
              title={creating ? 'Guardando...' : 'Guardar'}
              onPress={() => void onSaveManual()}
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
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  moodChip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  moodChipActive: {
    borderColor: colors.textAccent,
    backgroundColor: '#eafbf1',
  },
  moodText: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  moodTextActive: {
    color: '#167a43',
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
