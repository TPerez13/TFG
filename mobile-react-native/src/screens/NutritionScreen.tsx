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
import { ProgressBar } from '../components/ProgressBar';
import { MacroStatCard } from '../components/nutrition/MacroStatCard';
import { Screen } from '../components/layout/Screen';
import { ReminderDebugPanel } from '../components/settings/ReminderDebugPanel';
import { TimePickerField } from '../components/settings/TimePickerField';
import { Snackbar } from '../components/ui/Snackbar';
import { mealTypeLabel, mealTypeOptions } from '../features/nutrition/constants';
import { emitNutritionFlash, subscribeNutritionFlash } from '../features/nutrition/nutritionFlash';
import { sendHabitTestNotification } from '../features/notifications/localNotifications';
import { saveHabitReminderPatch } from '../features/notifications/reminderSettings';
import { useHabitReminderDebug } from '../features/notifications/useHabitReminderDebug';
import { useNutritionMutations } from '../features/nutrition/useNutritionMutations';
import { useNutritionToday } from '../features/nutrition/useNutritionToday';
import type { MealType } from '../features/nutrition/types';
import type { HabitsStackParamList } from '../navigation/types';
import { baseStyles } from '../theme/components';
import { colors, fontSizes, radius, spacing } from '../theme/tokens';

type NutritionScreenProps = NativeStackScreenProps<HabitsStackParamList, 'Nutrition'>;

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatHour = (isoDate: string) =>
  new Date(isoDate).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });

type SnackbarState = {
  visible: boolean;
  message: string;
  undoEntryId?: number;
};

export default function NutritionScreen({ navigation, route }: NutritionScreenProps) {
  const initialType = route.params?.tipoComidaSeleccionada ?? 'DESAYUNO';
  const [selectedType, setSelectedType] = useState<MealType>(initialType);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('13:00');
  const [reminderSaving, setReminderSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    visible: false,
    message: '',
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const today = useMemo(() => formatLocalDate(new Date()), []);
  const { data, loading, error, reload } = useNutritionToday(today, selectedType);
  const reminderDebug = useHabitReminderDebug(
    'nutricion',
    data?.reminderSnapshot ?? {
      globalEnabled: false,
      quietHoursEnabled: false,
      quietFrom: '22:00',
      quietTo: '07:00',
      habitEnabled: false,
      time: '13:00',
      lastCompletedDate: null,
    }
  );
  const { deleteEntry } = useNutritionMutations();

  useEffect(() => {
    if (route.params?.tipoComidaSeleccionada) {
      setSelectedType(route.params.tipoComidaSeleccionada);
    }
  }, [route.params?.tipoComidaSeleccionada, route.params?.refreshToken]);

  useEffect(() => {
    if (data) {
      setReminderEnabled(data.reminderEnabled);
      setReminderTime(data.reminderTime);
    }
  }, [data]);

  useEffect(() => {
    const unsubscribe = subscribeNutritionFlash((payload) => {
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
      void Promise.all([reload(), reminderDebug.reload()]);
    }, [reload, reminderDebug.reload]),
  );

  const historyItems = showAllHistory ? data?.historial ?? [] : (data?.historial ?? []).slice(0, 3);

  const handleReminderToggle = async (value: boolean) => {
    setReminderEnabled(value);
    setReminderSaving(true);
    try {
      const result = await saveHabitReminderPatch(
        'nutricion',
        {
          enabled: value,
        },
        { requestPermissions: value }
      );
      await reload();
      if (result.shouldBeScheduled && result.permissionState !== 'granted') {
        Alert.alert(
          'Permisos pendientes',
          'Cambios guardados, pero el sistema no tiene permisos para mostrar notificaciones.'
        );
      }
    } catch (err) {
      setReminderEnabled(!value);
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo guardar el recordatorio.');
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
        'nutricion',
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

  const sendTestNow = async () => {
    setSendingTest(true);
    try {
      const sent = await sendHabitTestNotification('nutricion');
      await reminderDebug.reload();
      if (!sent) {
        Alert.alert('Permisos pendientes', 'El sistema no tiene permisos para mostrar notificaciones.');
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo lanzar la prueba.');
    } finally {
      setSendingTest(false);
    }
  };

  const handleUndo = async () => {
    if (!snackbar.undoEntryId) return;

    try {
      await deleteEntry(snackbar.undoEntryId);
      setSnackbar({ visible: false, message: '' });
      emitNutritionFlash({ message: 'Registro deshecho.' });
      await reload();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo deshacer el registro.');
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
          <Text style={styles.headerTitle}>Alimentacion</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusTop}>
            <View>
              <Text style={styles.statusEyebrow}>Estado del dia</Text>
              <Text style={styles.statusTitle}>Comidas registradas</Text>
            </View>
            <Text style={styles.statusCount}>
              <Text style={styles.statusCountCurrent}>{data?.comidasRegistradas ?? 0}</Text> de{' '}
              {data?.objetivoDiario ?? 4}
            </Text>
          </View>
          <ProgressBar progress={data?.progreso ?? 0} fillColor="#22c55e" height={14} />
        </View>

        <Pressable
          onPress={() => navigation.navigate('NutritionQuickAdd', { tipoComidaSeleccionada: selectedType })}
          style={({ pressed }) => [styles.addButton, pressed ? styles.buttonPressed : null]}
        >
          <View style={styles.addIconWrap}>
            <Ionicons name="add" size={28} color="#22c55e" />
          </View>
          <Text style={styles.addButtonText}>ANADIR COMIDA</Text>
        </Pressable>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {mealTypeOptions.map((option) => {
            const active = option.key === selectedType;
            return (
              <Pressable
                key={option.key}
                onPress={() => setSelectedType(option.key)}
                style={({ pressed }) => [
                  styles.tabChip,
                  active ? styles.tabChipActive : null,
                  pressed ? styles.buttonPressed : null,
                ]}
              >
                <Ionicons name={option.icon} size={18} color={active ? '#22c55e' : colors.textSubtle} />
                <Text style={[styles.tabLabel, active ? styles.tabLabelActive : null]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionTitle}>Resumen Nutricional</Text>
        <View style={styles.macroRow}>
          <MacroStatCard label="Calorias" value={data?.resumen.kcal ?? 0} unit="kcal" />
          <MacroStatCard label="Proteina" value={data?.resumen.proteinaG ?? 0} unit="g" />
        </View>

        <View style={styles.historyHeader}>
          <Text style={styles.sectionTitle}>Historial de hoy</Text>
          <Pressable onPress={() => setShowAllHistory((current) => !current)}>
            <Text style={styles.showAll}>{showAllHistory ? 'Ver menos' : 'Ver todo'}</Text>
          </Pressable>
        </View>

        {loading ? <ActivityIndicator size="small" color={colors.textAccent} style={styles.loading} /> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {!loading && historyItems.length === 0 ? (
          <Text style={styles.emptyText}>No hay comidas registradas para {mealTypeLabel(selectedType)}.</Text>
        ) : null}

        {historyItems.map((entry) => (
          <View key={entry.idRegistroComida} style={styles.historyCard}>
            <View style={styles.historyIcon}>
              <Ionicons name="restaurant-outline" size={20} color="#22c55e" />
            </View>
            <View style={styles.historyInfo}>
              <Text style={styles.historyType}>{mealTypeLabel(entry.tipoComida)}</Text>
              <Text style={styles.historyName}>{entry.nombre}</Text>
            </View>
            <View style={styles.historyMetrics}>
              <Text style={styles.historyKcal}>{Math.round(entry.kcal)} kcal</Text>
              <Text style={styles.historyHour}>{formatHour(entry.fRegistro)}</Text>
            </View>
          </View>
        ))}

        <View style={styles.reminderCard}>
          <View style={styles.reminderIcon}>
            <Ionicons name="notifications-outline" size={22} color="#22c55e" />
          </View>
          <View style={styles.reminderTextWrap}>
            <Text style={styles.reminderTitle}>Recordatorios</Text>
            <Text style={styles.reminderSubtitle}>Notificar horas de comida</Text>
            {data?.globalNotificationsEnabled === false ? (
              <Text style={styles.reminderHint}>
                Este horario queda guardado, pero no se programa mientras las notificaciones globales
                esten desactivadas.
              </Text>
            ) : null}
            <TimePickerField
              value={reminderTime}
              onConfirm={saveReminderTime}
              disabled={!data || reminderSaving}
              modalTitle="Hora del recordatorio de nutricion"
              modalDescription="Se programa una unica notificacion local para este habito."
              accentColor="#22c55e"
              style={styles.reminderTimeInput}
            />
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={handleReminderToggle}
            disabled={reminderSaving}
            trackColor={{ true: '#22c55e', false: '#d1d5db' }}
            thumbColor="#ffffff"
          />
        </View>
        <ReminderDebugPanel
          data={reminderDebug.data}
          loading={reminderDebug.loading || !data}
          onSendTest={() => {
            void sendTestNow();
          }}
          sendingTest={sendingTest}
        />
      </ScrollView>
      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        actionLabel={snackbar.undoEntryId ? 'DESHACER' : undefined}
        onAction={snackbar.undoEntryId ? handleUndo : undefined}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.contentBottom + 36,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  headerTitle: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 38,
    height: 38,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.lgPlus,
    marginBottom: spacing.xl,
  },
  statusTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  statusEyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '700',
    color: colors.textSubtle,
    fontSize: fontSizes.md,
    marginBottom: spacing.xs,
  },
  statusTitle: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '800',
    color: colors.textPrimary,
    maxWidth: 220,
  },
  statusCount: {
    fontSize: 18,
    color: colors.textSubtle,
    fontWeight: '700',
  },
  statusCountCurrent: {
    fontSize: 34,
    lineHeight: 38,
    color: '#22c55e',
    fontWeight: '900',
  },
  addButton: {
    backgroundColor: '#22c55e',
    borderRadius: radius.lg,
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  addIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '800',
    color: '#f4fff7',
    letterSpacing: 1,
  },
  tabsRow: {
    gap: spacing.md,
    marginBottom: spacing.xl,
    paddingRight: spacing.sm,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  tabChipActive: {
    borderColor: '#22c55e',
    backgroundColor: '#eafbf1',
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  tabLabelActive: {
    color: '#15803d',
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  macroRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  showAll: {
    color: '#22c55e',
    fontSize: 16,
    fontWeight: '800',
  },
  loading: {
    marginBottom: spacing.sm,
  },
  errorText: {
    color: '#b84a4a',
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eafbf1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  historyInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  historyType: {
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    color: colors.textSubtle,
    fontWeight: '700',
    fontSize: fontSizes.xs,
    marginBottom: spacing.xs,
  },
  historyName: {
    color: colors.textPrimary,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '800',
  },
  historyMetrics: {
    alignItems: 'flex-end',
  },
  historyKcal: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  historyHour: {
    color: colors.textSubtle,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  reminderCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  reminderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eafbf1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  reminderTextWrap: {
    flex: 1,
    marginRight: spacing.md,
  },
  reminderTitle: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 19,
    marginBottom: 2,
  },
  reminderSubtitle: {
    color: colors.textMuted,
    fontSize: fontSizes.base,
  },
  reminderHint: {
    marginTop: spacing.xs,
    color: '#9a6b22',
    fontSize: fontSizes.sm,
    lineHeight: 18,
  },
  reminderTimeInput: {
    marginTop: spacing.sm,
    minWidth: 96,
    maxWidth: 112,
  },
});
