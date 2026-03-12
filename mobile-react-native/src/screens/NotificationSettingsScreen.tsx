import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../navigation/types';
import { Screen } from '../components/layout/Screen';
import type { NotificationSettings } from '../features/notifications/types';
import { DEFAULT_NOTIFICATION_SETTINGS, isValidTimeValue } from '../features/notifications/settings';
import { colors, fontSizes, spacing } from '../theme/tokens';
import { useAuth } from '../navigation/AuthContext';
import { PillToggle } from '../components/settings/PillToggle';
import {
  fetchNotificationSettings,
  NotificationSettingsApiError,
  patchNotificationSettings,
} from '../features/notifications/api';

type SettingsProps = NativeStackScreenProps<ProfileStackParamList, 'NotificationSettings'>;

export default function NotificationSettingsScreen({ navigation }: SettingsProps) {
  const { signOut } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [globalEnabled, setGlobalEnabled] = useState(DEFAULT_NOTIFICATION_SETTINGS.global.enabled);
  const [summaryTime, setSummaryTime] = useState(DEFAULT_NOTIFICATION_SETTINGS.global.summaryTime);
  const [quietEnabled, setQuietEnabled] = useState(DEFAULT_NOTIFICATION_SETTINGS.global.quietHoursEnabled);
  const [quietFrom, setQuietFrom] = useState(DEFAULT_NOTIFICATION_SETTINGS.global.quietFrom);
  const [quietTo, setQuietTo] = useState(DEFAULT_NOTIFICATION_SETTINGS.global.quietTo);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const loadedSettings = await fetchNotificationSettings();
        if (active) setSettings(loadedSettings);
      } catch (error) {
        if (error instanceof NotificationSettingsApiError && error.status === 401) {
          await signOut();
          return;
        }
        if (active) {
          setFeedback('No se pudo cargar la configuracion.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [signOut]);

  useEffect(() => {
    setGlobalEnabled(settings.global.enabled);
    setSummaryTime(settings.global.summaryTime);
    setQuietEnabled(settings.global.quietHoursEnabled);
    setQuietFrom(settings.global.quietFrom);
    setQuietTo(settings.global.quietTo);
  }, [settings]);

  const saveGlobal = async () => {
    const normalizedSummaryTime = summaryTime.trim();
    const normalizedQuietFrom = quietFrom.trim();
    const normalizedQuietTo = quietTo.trim();

    if (!isValidTimeValue(normalizedSummaryTime)) {
      setFeedback('Hora de resumen invalida. Usa HH:MM.');
      return;
    }
    if (!isValidTimeValue(normalizedQuietFrom)) {
      setFeedback('Hora inicio silencio invalida. Usa HH:MM.');
      return;
    }
    if (!isValidTimeValue(normalizedQuietTo)) {
      setFeedback('Hora fin silencio invalida. Usa HH:MM.');
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const nextSettings = await patchNotificationSettings({
        global: {
          enabled: globalEnabled,
          summaryTime: normalizedSummaryTime,
          quietHoursEnabled: quietEnabled,
          quietFrom: normalizedQuietFrom,
          quietTo: normalizedQuietTo,
        },
      });
      setSettings(nextSettings);
      setFeedback('Cambios guardados.');
    } catch (error) {
      if (error instanceof NotificationSettingsApiError && error.status === 401) {
        await signOut();
        return;
      }
      setFeedback('No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Notificaciones</Text>
          <View style={styles.headerSpacer} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.textAccent} style={styles.loading} />
        ) : (
          <>
            <Text style={styles.sectionTitle}>Configuracion global</Text>
            <View style={styles.card}>
              <SettingRow
                label="Activar notificaciones"
                description="Si esta desactivado, los avisos de habitos no se consideran activos."
                value={globalEnabled}
                disabled={saving}
                onValueChange={setGlobalEnabled}
              />

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Hora resumen</Text>
                <TextInput
                  style={styles.input}
                  editable={!saving}
                  value={summaryTime}
                  onChangeText={setSummaryTime}
                  placeholder="HH:MM"
                />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Horas silenciosas</Text>
            <View style={styles.card}>
              <SettingRow
                label="Activar horas silenciosas"
                description="Durante este rango se intenta no interrumpir."
                value={quietEnabled}
                disabled={saving}
                onValueChange={setQuietEnabled}
              />
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Inicio</Text>
                <TextInput
                  style={styles.input}
                  editable={!saving}
                  value={quietFrom}
                  onChangeText={setQuietFrom}
                  placeholder="HH:MM"
                />
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Fin</Text>
                <TextInput
                  style={styles.input}
                  editable={!saving}
                  value={quietTo}
                  onChangeText={setQuietTo}
                  placeholder="HH:MM"
                />
              </View>
            </View>

            <View style={styles.noteCard}>
              <Text style={styles.noteTitle}>Configuracion por habito</Text>
              <Text style={styles.noteText}>
                Se edita en cada pantalla de habito (toggle + hora), pero se guarda en la misma fuente de
                verdad que esta pantalla.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void saveGlobal();
              }}
              disabled={saving}
              style={({ pressed }) => [
                styles.saveButton,
                saving ? styles.saveDisabled : null,
                pressed ? styles.savePressed : null,
              ]}
            >
              <Text style={styles.saveText}>Guardar cambios</Text>
            </Pressable>
            {saving ? <Text style={styles.feedback}>Guardando...</Text> : null}
            {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

type SettingRowProps = {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

function SettingRow({ label, description, value, onValueChange, disabled = false }: SettingRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {description ? <Text style={styles.helperText}>{description}</Text> : null}
      </View>
      <PillToggle value={value} disabled={disabled} onValueChange={onValueChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.contentTop,
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
  loading: {
    marginTop: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  noteCard: {
    backgroundColor: '#f3f6fb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d6deea',
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  noteTitle: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  noteText: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  rowText: {
    flex: 1,
    paddingRight: spacing.md,
  },
  rowLabel: {
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  helperText: {
    marginTop: 2,
    fontSize: fontSizes.sm,
    color: colors.textSubtle,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 10,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 90,
    textAlign: 'center',
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  savePressed: {
    opacity: 0.85,
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
    marginBottom: spacing.sm,
  },
});
