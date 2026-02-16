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
import { Screen } from '../components/layout/Screen';
import { SleepTemplateCard } from '../components/sleep/SleepTemplateCard';
import { Button } from '../components/ui/Button';
import { getHabitByKey } from '../features/habits/habitRegistry';
import { useCreateHabitEntry } from '../features/habits/useCreateHabitEntry';
import { emitSleepFlash } from '../features/sleep/sleepFlash';
import { SLEEP_QUALITIES, sleepQualityLabel, type SleepQuality, type SleepTemplate } from '../features/sleep/types';
import { useRecentSleepTemplates } from '../features/sleep/useRecentSleepTemplates';
import { formatHours, serializeSleepNotes } from '../features/sleep/utils';
import type { HabitsStackParamList } from '../navigation/types';
import { baseStyles } from '../theme/components';
import { colors, fontSizes, radius, spacing } from '../theme/tokens';

type RegistrarSuenoScreenProps = NativeStackScreenProps<HabitsStackParamList, 'RegistrarSueno'>;

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

const templateSubtitle = (template: SleepTemplate) => {
  const parts: string[] = [];
  if (template.start && template.end) {
    parts.push(`${template.start} - ${template.end}`);
  }
  if (template.quality) {
    parts.push(`Calidad ${sleepQualityLabel(template.quality)}`);
  }
  return parts.join(' - ');
};

export default function RegistrarSuenoScreen({ navigation, route }: RegistrarSuenoScreenProps) {
  const [mode, setMode] = useState<'quick' | 'manual'>(route.params?.mode ?? 'quick');
  const [hours, setHours] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [quality, setQuality] = useState<SleepQuality | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [showHoursError, setShowHoursError] = useState(false);

  const { suggested, recent, loading: loadingRecent, error: recentError, reload } = useRecentSleepTemplates();
  const { createEntry, creating } = useCreateHabitEntry();
  const sleepTypeId = getHabitByKey('sueno')?.idTipoHabito ?? 4;
  const timeLabel = useMemo(() => formatNowTime(), []);

  useFocusEffect(
    React.useCallback(() => {
      void reload();
    }, [reload]),
  );

  const saveSleep = async (template: {
    hours: number;
    start?: string;
    end?: string;
    quality?: SleepQuality;
    notesText?: string;
  }) => {
    const notesJson = serializeSleepNotes({
      start: template.start,
      end: template.end,
      quality: template.quality,
      notesText: template.notesText,
    });

    try {
      const created = await createEntry({
        typeId: sleepTypeId,
        value: template.hours,
        unit: 'h',
        dateTime: new Date().toISOString(),
        notes: notesJson ?? undefined,
      });

      emitSleepFlash({
        message: 'Sueno registrado correctamente!',
        undoEntryId: created.id_registro_habito,
      });
      navigation.reset({
        index: 1,
        routes: [
          { name: 'Habits' },
          {
            name: 'Sueno',
            params: {
              refreshToken: Date.now(),
            },
          },
        ],
      });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo registrar sueno.');
    }
  };

  const onSaveManual = async () => {
    const parsedHours = parseNumeric(hours);
    if (!parsedHours || parsedHours <= 0 || parsedHours > 24) {
      setShowHoursError(true);
      return;
    }
    setShowHoursError(false);

    await saveSleep({
      hours: parsedHours,
      quality,
      start: start.trim() || undefined,
      end: end.trim() || undefined,
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
          <Text style={styles.headerTitle}>Registro de Sueno</Text>
          <Pressable onPress={() => Alert.alert('Ayuda', 'Disponible pronto.')}>
            <Text style={styles.helpText}>Ayuda</Text>
          </Pressable>
        </View>

        <View style={styles.modeCard}>
          <View style={styles.modeInfo}>
            <Ionicons name="moon-outline" size={24} color={colors.textAccent} />
            <View>
              <Text style={styles.modeTitle}>Sueno</Text>
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

        {mode === 'quick' ? (
          <View>
            <Text style={styles.sectionTitle}>Sugeridos</Text>
            {suggested.map((template) => (
              <SleepTemplateCard
                key={`suggested-${template.label}`}
                title={`Dormi ${formatHours(template.hours)} h`}
                hours={template.hours}
                subtitle={templateSubtitle(template)}
                onAdd={() => void saveSleep(template)}
              />
            ))}

            <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Recientes</Text>
            {loadingRecent ? <ActivityIndicator size="small" color={colors.textAccent} /> : null}
            {recentError ? <Text style={styles.errorText}>{recentError}</Text> : null}
            {!loadingRecent && recent.length === 0 ? (
              <Text style={styles.emptyText}>No hay registros recientes de sueno.</Text>
            ) : null}
            {recent.map((template, index) => (
              <SleepTemplateCard
                key={`recent-${template.label}-${index}`}
                title={template.start && template.end ? `${template.start} - ${template.end}` : `Dormi ${formatHours(template.hours)} h`}
                hours={template.hours}
                subtitle={templateSubtitle(template)}
                onAdd={() => void saveSleep(template)}
              />
            ))}
          </View>
        ) : (
          <View>
            <Text style={styles.fieldLabel}>Horas dormidas</Text>
            <TextInput
              value={hours}
              onChangeText={(value) => {
                setHours(value);
                const parsed = parseNumeric(value);
                if (showHoursError && parsed && parsed > 0 && parsed <= 24) {
                  setShowHoursError(false);
                }
              }}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.placeholder}
              style={[styles.input, showHoursError ? styles.inputError : null]}
            />
            {showHoursError ? <Text style={styles.errorText}>Introduce horas validas entre 0 y 24.</Text> : null}

            <View style={styles.row}>
              <View style={styles.fieldFlex}>
                <Text style={styles.fieldLabel}>Hora inicio (opcional)</Text>
                <TextInput
                  value={start}
                  onChangeText={setStart}
                  placeholder="23:30"
                  placeholderTextColor={colors.placeholder}
                  style={styles.input}
                />
              </View>
              <View style={styles.fieldFlex}>
                <Text style={styles.fieldLabel}>Hora fin (opcional)</Text>
                <TextInput
                  value={end}
                  onChangeText={setEnd}
                  placeholder="07:10"
                  placeholderTextColor={colors.placeholder}
                  style={styles.input}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Calidad (opcional)</Text>
            <View style={styles.qualityWrap}>
              <Pressable
                onPress={() => setQuality(undefined)}
                style={({ pressed }) => [
                  styles.chip,
                  !quality ? styles.chipActive : null,
                  pressed ? styles.buttonPressed : null,
                ]}
              >
                <Text style={[styles.chipText, !quality ? styles.chipTextActive : null]}>Sin calidad</Text>
              </Pressable>
              {SLEEP_QUALITIES.map((value) => (
                <Pressable
                  key={value}
                  onPress={() => setQuality(value)}
                  style={({ pressed }) => [
                    styles.chip,
                    quality === value ? styles.chipActive : null,
                    pressed ? styles.buttonPressed : null,
                  ]}
                >
                  <Text style={[styles.chipText, quality === value ? styles.chipTextActive : null]}>
                    {sleepQualityLabel(value)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Notas (opcional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Ej. me desperte una vez"
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
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  sectionSpacing: {
    marginTop: spacing.lg,
  },
  fieldLabel: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.sm,
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
  errorText: {
    color: '#b84a4a',
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  fieldFlex: {
    flex: 1,
  },
  qualityWrap: {
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
  saveButton: {
    marginTop: spacing.lg,
  },
  switchModeButton: {
    marginTop: spacing.md,
    backgroundColor: '#f0f3f1',
    borderColor: '#d9e2db',
  },
});
