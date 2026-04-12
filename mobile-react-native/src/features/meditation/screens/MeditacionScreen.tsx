import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { ProgressBar } from '../../../components/ui/ProgressBar';
import { Screen } from '../../../components/layout/Screen';
import { TimePickerField } from '../../../components/ui/TimePickerField';
import { Snackbar } from '../../../components/ui/Snackbar';
import { useDeleteHabitEntry } from '../../habits/useDeleteHabitEntry';
import { emitMeditationFlash, subscribeMeditationFlash } from '../meditationFlash';
import {
  MEDITATION_TYPES,
  meditationTypeLabel,
  type MeditationSessionType,
} from '../types';
import { useMeditationToday } from '../useMeditationToday';
import { saveHabitReminderPatch } from '../../notifications/reminderSettings';
import type { HabitsStackParamList } from '../../../navigation/types';
import { baseStyles } from '../../../theme/components';
import { colors, fontSizes, radius, spacing } from '../../../theme/tokens';

type MeditacionScreenProps = NativeStackScreenProps<HabitsStackParamList, 'Meditacion'>;

type SnackbarState = {
  visible: boolean;
  message: string;
  undoEntryId?: number;
};

const formatHour = (isoDate: string) =>
  new Date(isoDate).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

export default function MeditacionScreen({ navigation, route }: MeditacionScreenProps) {
  const today = useMemo(() => new Date(), []);
  const initialType = route.params?.sessionTypeSeleccionada;
  const [selectedType, setSelectedType] = useState<MeditationSessionType | undefined>(initialType);
  const [showAll, setShowAll] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('20:00');
  const [reminderSaving, setReminderSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    visible: false,
    message: '',
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data, loading, error, reload } = useMeditationToday(today, selectedType);
  const { deleteEntry, deleting } = useDeleteHabitEntry();

  useEffect(() => {
    if (route.params?.sessionTypeSeleccionada) {
      setSelectedType(route.params.sessionTypeSeleccionada);
    }
  }, [route.params?.refreshToken, route.params?.sessionTypeSeleccionada]);

  useEffect(() => {
    setReminderEnabled(data.remindersEnabled);
    setReminderTime(data.reminderTime);
  }, [data.remindersEnabled, data.reminderTime]);

  useEffect(() => {
    const unsubscribe = subscribeMeditationFlash((payload) => {
      setSnackbar({
        visible: true,
        message: payload.message,
        undoEntryId: payload.undoEntryId,
      });
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setSnackbar((current) => ({ ...current, visible: false }));
      }, 5000);
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void reload();
    }, [reload]),
  );

  const historyItems = showAll ? data.history : data.history.slice(0, 5);

  const handleReminderToggle = async (nextValue: boolean) => {
    setReminderEnabled(nextValue);
    setReminderSaving(true);
    try {
      const result = await saveHabitReminderPatch(
        'meditacion',
        {
          enabled: nextValue,
        },
        { requestPermissions: nextValue }
      );
      await reload();
      if (result.shouldBeScheduled && result.permissionState !== 'granted') {
        Alert.alert(
          'Permisos pendientes',
          'Cambios guardados, pero el sistema no tiene permisos para mostrar notificaciones.'
        );
      }
    } catch (err) {
      setReminderEnabled((current) => !current);
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo guardar recordatorio.');
    } finally {
      setReminderSaving(false);
    }
  };

  const saveReminderTime = async (nextValue: string) => {
    const previousValue = reminderTime;
    setReminderTime(nextValue);
    setReminderSaving(true);
    try {
      const result = await saveHabitReminderPatch(
        'meditacion',
        {
          time: nextValue,
        },
        { requestPermissions: reminderEnabled }
      );
      await reload();
      if (result.shouldBeScheduled && result.permissionState !== 'granted') {
        Alert.alert(
          'Permisos pendientes',
          'Cambios guardados, pero el sistema no tiene permisos para mostrar notificaciones.'
        );
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo guardar la hora.');
      setReminderTime(previousValue);
    } finally {
      setReminderSaving(false);
    }
  };

  const onUndo = async () => {
    if (!snackbar.undoEntryId || deleting) return;
    try {
      await deleteEntry(snackbar.undoEntryId);
      setSnackbar({ visible: false, message: '' });
      emitMeditationFlash({ message: 'Registro de meditación deshecho.' });
      await reload();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo deshacer registro.');
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={[baseStyles.content, styles.content]}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.iconButton, pressed ? styles.buttonPressed : null]}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Meditación</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.stateCard}>
          <Text style={styles.stateEyebrow}>Estado del día</Text>
          <Text style={styles.stateTitle}>Minutos meditados</Text>
          <Text style={styles.stateCount}>
            {Math.round(data.totalMin)} de {data.goalMin} min
          </Text>
          <ProgressBar progress={data.progress} fillColor={colors.accent} height={12} style={styles.stateBar} />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            navigation.navigate('RegistrarMeditacion', {
              mode: 'quick',
              sessionTypeSeleccionada: selectedType,
            })
          }
          style={({ pressed }) => [styles.addButton, pressed ? styles.buttonPressed : null]}
        >
          <Text style={styles.addButtonText}>+ AÑADIR MEDITACIÓN</Text>
        </Pressable>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <Pressable
            onPress={() => setSelectedType(undefined)}
            style={({ pressed }) => [
              styles.filterChip,
              !selectedType ? styles.filterChipActive : null,
              pressed ? styles.buttonPressed : null,
            ]}
          >
            <Text style={[styles.filterChipText, !selectedType ? styles.filterChipTextActive : null]}>Todos</Text>
          </Pressable>
          {MEDITATION_TYPES.map((type) => (
            <Pressable
              key={type}
              onPress={() => setSelectedType(type)}
              style={({ pressed }) => [
                styles.filterChip,
                selectedType === type ? styles.filterChipActive : null,
                pressed ? styles.buttonPressed : null,
              ]}
            >
              <Text style={[styles.filterChipText, selectedType === type ? styles.filterChipTextActive : null]}>
                {meditationTypeLabel(type)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total minutos</Text>
            <Text style={styles.summaryValue}>{Math.round(data.totalMin)} min</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Sesiones hoy</Text>
            <Text style={styles.summaryValue}>{data.sessionsCount}</Text>
          </View>
        </View>

        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>Historial de hoy</Text>
          <Pressable onPress={() => setShowAll((current) => !current)}>
            <Text style={styles.showAll}>{showAll ? 'Ver menos' : 'Ver todo'}</Text>
          </Pressable>
        </View>

        {loading ? <ActivityIndicator size="small" color={colors.textAccent} style={styles.loader} /> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {!loading && historyItems.length === 0 ? (
          <Text style={styles.emptyText}>Aún no registraste meditación hoy. Unos minutos hacen diferencia.</Text>
        ) : null}

        {historyItems.map((item) => (
          <View key={item.id} style={styles.historyItem}>
            <View style={styles.historyLeft}>
              <Text style={styles.historyType}>{meditationTypeLabel(item.type)}</Text>
              <Text style={styles.historyDuration}>{Math.round(item.durationMin)} min</Text>
              {item.moodBefore || item.moodAfter ? (
                <Text style={styles.historyMeta}>
                  Mood: {item.moodBefore ?? '-'} {'->'} {item.moodAfter ?? '-'}
                </Text>
              ) : null}
            </View>
            <Text style={styles.historyHour}>{formatHour(item.dateTime)}</Text>
          </View>
        ))}

        <View style={styles.reminderCard}>
          <View style={styles.reminderIcon}>
            <Ionicons name="notifications-outline" size={20} color={colors.textAccent} />
          </View>
          <View style={styles.reminderText}>
            <Text style={styles.reminderTitle}>Recordatorios</Text>
            <Text style={styles.reminderSubtitle}>Recordatorios de meditación</Text>
            {!data.globalNotificationsEnabled ? (
              <Text style={styles.reminderHint}>
                Este horario queda guardado, pero no se programa mientras las notificaciones globales
                estén desactivadas.
              </Text>
            ) : null}
            <TimePickerField
              value={reminderTime}
              onConfirm={saveReminderTime}
              disabled={reminderSaving}
              modalTitle="Hora del recordatorio de meditación"
              modalDescription="Se programa una única notificación local para este hábito."
              style={styles.reminderTimeInput}
            />
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={handleReminderToggle}
            disabled={reminderSaving}
            trackColor={{ false: '#d1d5db', true: colors.accent }}
            thumbColor="#ffffff"
          />
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        actionLabel={snackbar.undoEntryId ? 'DESHACER' : undefined}
        onAction={snackbar.undoEntryId ? onUndo : undefined}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.contentBottom + 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  stateCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.lgPlus,
    marginBottom: spacing.lg,
  },
  stateEyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    color: colors.textSubtle,
    fontSize: fontSizes.sm,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  stateTitle: {
    color: colors.textPrimary,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  stateCount: {
    color: colors.textAccent,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  stateBar: {
    marginTop: spacing.xs,
  },
  addButton: {
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.accent,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  addButtonText: {
    color: colors.textOnAccent,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  chipRow: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  filterChip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterChipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.brandSoft,
  },
  filterChipText: {
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 14,
  },
  filterChipTextActive: {
    color: colors.textAccent,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    padding: spacing.lg,
  },
  summaryLabel: {
    color: colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  showAll: {
    color: colors.textAccent,
    fontSize: 16,
    fontWeight: '700',
  },
  loader: {
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  historyItem: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  historyLeft: {
    flex: 1,
    marginRight: spacing.md,
  },
  historyType: {
    color: colors.textSubtle,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    marginBottom: 2,
  },
  historyDuration: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  historyMeta: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
  },
  historyHour: {
    color: colors.textSubtle,
    fontSize: fontSizes.base,
    fontWeight: '600',
  },
  reminderCard: {
    marginTop: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
    marginRight: spacing.md,
  },
  reminderText: {
    flex: 1,
  },
  reminderTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  reminderSubtitle: {
    color: colors.textMuted,
    fontSize: fontSizes.base,
  },
  reminderHint: {
    marginTop: spacing.xs,
    color: colors.warning,
    fontSize: fontSizes.sm,
    lineHeight: 18,
  },
  reminderTimeInput: {
    marginTop: spacing.sm,
    minWidth: 96,
    maxWidth: 112,
  },
});
