import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
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
import { ProgressBar } from '../components/ProgressBar';
import { Screen } from '../components/layout/Screen';
import { TimePickerField } from '../components/settings/TimePickerField';
import { Snackbar } from '../components/ui/Snackbar';
import { emitHydrationFlash, subscribeHydrationFlash } from '../features/hydration/hydrationFlash';
import { useHydrationToday } from '../features/hydration/useHydrationToday';
import { useDeleteHabitEntry } from '../features/habits/useDeleteHabitEntry';
import { saveHabitReminderPatch } from '../features/notifications/reminderSettings';
import type { HabitsStackParamList } from '../navigation/types';
import { baseStyles } from '../theme/components';
import { colors, fontSizes, radius, spacing } from '../theme/tokens';

type HidratacionScreenProps = NativeStackScreenProps<HabitsStackParamList, 'Hidratacion'>;

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

const formatGoal = (value: number, unit: 'ml' | 'vasos' | 'l') => {
  if (unit === 'ml') return `${Math.round(value)} ml`;
  if (unit === 'l') return `${value.toFixed(1)} L`;
  return `${Number(value.toFixed(1))} vasos`;
};

export default function HidratacionScreen({ navigation }: HidratacionScreenProps) {
  const today = useMemo(() => new Date(), []);
  const [showAll, setShowAll] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('10:00');
  const [reminderSaving, setReminderSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    visible: false,
    message: '',
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data, loading, error, reload } = useHydrationToday(today);
  const { deleteEntry, deleting } = useDeleteHabitEntry();

  useEffect(() => {
    setReminderEnabled(data.remindersEnabled);
    setReminderTime(data.reminderTime);
  }, [data.remindersEnabled, data.reminderTime]);

  useEffect(() => {
    const unsubscribe = subscribeHydrationFlash((payload) => {
      setSnackbar({
        visible: true,
        message: payload.message,
        undoEntryId: payload.undoEntryId,
      });
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setSnackbar((current) => ({ ...current, visible: false }));
      }, 5000);
    });

    return () => {
      unsubscribe();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void reload();
    }, [reload]),
  );

  const goalLabel = useMemo(() => formatGoal(data.goal.value, data.goal.unit), [data.goal.unit, data.goal.value]);
  const totalLabel = useMemo(() => {
    if (data.goal.unit === 'ml') return `${Math.round(data.totalMl)} ml`;
    if (data.goal.unit === 'l') return `${(data.totalMl / 1000).toFixed(1)} L`;
    return `${Number(data.totalVasos.toFixed(1))} vasos`;
  }, [data.goal.unit, data.totalMl, data.totalVasos]);
  const remainingLabel = useMemo(() => `${Math.round(data.remainingMl)} ml`, [data.remainingMl]);

  const historyItems = showAll ? data.history : data.history.slice(0, 5);

  const handleReminderToggle = async (nextValue: boolean) => {
    setReminderEnabled(nextValue);
    setReminderSaving(true);
    try {
      const result = await saveHabitReminderPatch(
        'hidratacion',
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
        'hidratacion',
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
      emitHydrationFlash({ message: 'Registro de agua deshecho.' });
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
          <Text style={styles.headerTitle}>Hidratación</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.stateCard}>
          <View style={styles.stateHeader}>
            <Text style={styles.stateEyebrow}>Estado del día</Text>
            <Text style={styles.stateCount}>{totalLabel} de {goalLabel}</Text>
          </View>
          <Text style={styles.stateTitle}>Agua registrada</Text>
          <ProgressBar progress={data.progress} fillColor={colors.accent} height={12} style={styles.stateBar} />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('RegistrarAgua')}
          style={({ pressed }) => [styles.addButton, pressed ? styles.buttonPressed : null]}
        >
          <Text style={styles.addButtonText}>+ AÑADIR AGUA</Text>
        </Pressable>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total</Text>
            <Text style={styles.summaryValue}>{totalLabel}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Restante</Text>
            <Text style={styles.summaryValue}>{remainingLabel}</Text>
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
          <Text style={styles.emptyText}>No registraste agua hoy todavía.</Text>
        ) : null}

        {historyItems.map((item) => (
          <View key={item.id} style={styles.historyItem}>
            <Text style={styles.historyAmount}>{item.label}</Text>
            <Text style={styles.historyHour}>{formatHour(item.dateTime)}</Text>
          </View>
        ))}

        <View style={styles.reminderCard}>
          <View style={styles.reminderIcon}>
            <Ionicons name="notifications-outline" size={20} color={colors.textAccent} />
          </View>
          <View style={styles.reminderText}>
            <Text style={styles.reminderTitle}>Recordatorios</Text>
            <Text style={styles.reminderSubtitle}>Recordatorios de hidratación</Text>
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
              modalTitle="Hora del recordatorio de hidratación"
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
    paddingBottom: spacing.contentBottom + 32,
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
  stateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stateEyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: colors.textSubtle,
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  stateCount: {
    color: colors.textAccent,
    fontSize: fontSizes.base,
    fontWeight: '700',
  },
  stateTitle: {
    color: colors.textPrimary,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800',
    marginBottom: spacing.md,
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
    letterSpacing: 1.2,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  showAll: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textAccent,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
  },
  historyAmount: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
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
