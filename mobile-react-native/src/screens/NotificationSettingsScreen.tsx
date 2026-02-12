import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../navigation/types';
import { Screen } from '../components/layout/Screen';
import { apiFetch } from '../services/api';
import type { NotificationSettings } from '../features/notifications/types';
import { colors, fontSizes, spacing } from '../theme/tokens';
import { useAuth } from '../navigation/AuthContext';
import { PillToggle } from '../components/settings/PillToggle';

type SettingsProps = NativeStackScreenProps<ProfileStackParamList, 'NotificationSettings'>;

type NotificationPreferences = NotificationSettings & {
  hydration: boolean;
  nutrition: boolean;
  exercise: boolean;
  sleep: boolean;
  gamification: boolean;
  weeklyReport: boolean;
  weeklyDay: string;
  weeklyTime: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  quietHoursEnabled: boolean;
  quietFrom: string;
  quietTo: string;
};

const defaultSettings: NotificationPreferences = {
  enabled: true,
  reminders: true,
  achievements: true,
  challenges: true,
  system: true,
  hydration: true,
  nutrition: true,
  exercise: true,
  sleep: true,
  gamification: true,
  weeklyReport: false,
  weeklyDay: 'L',
  weeklyTime: '08:00',
  pushEnabled: true,
  emailEnabled: false,
  quietHoursEnabled: false,
  quietFrom: '22:00',
  quietTo: '07:00',
};

export default function NotificationSettingsScreen({ navigation }: SettingsProps) {
  const { signOut } = useAuth();
  const [settings, setSettings] = useState<NotificationPreferences>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await apiFetch('/users/me');
        if (res.status === 401) {
          await signOut();
          return;
        }
        if (!res.ok) return;
        const payload = (await res.json()) as { user?: { preferencias?: Record<string, unknown> | null } };
        const raw = payload.user?.preferencias as Record<string, unknown> | null;
        const fromPrefs = raw?.notificaciones as Partial<NotificationPreferences> | undefined;
        if (active) {
          setSettings({ ...defaultSettings, ...(fromPrefs ?? {}) });
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const update = async (next: NotificationPreferences) => {
    setSettings(next);
    setSaving(true);
    setFeedback(null);
    const res = await apiFetch('/users/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferencias: { notificaciones: next } }),
    });
    if (res.status === 401) {
      await signOut();
      setSaving(false);
      return;
    }
    setSaving(false);
    if (res.ok) {
      setFeedback('Cambios guardados.');
    } else {
      setFeedback('No se pudieron guardar los cambios.');
    }
  };

  const updateField = (key: keyof NotificationPreferences, value: boolean | string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Screen>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Ajustes</Text>
          <View style={styles.headerSpacer} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.textAccent} style={styles.loading} />
        ) : (
          <>
            <Text style={styles.sectionTitle}>Ajustes de notificaciones</Text>
            <View style={styles.card}>
              <SettingRow
                label="Activar notificaciones"
                description="Control general para habilitar o silenciar todos los avisos."
                value={settings.enabled}
                disabled={saving}
                onValueChange={(value) => {
                  setSettings((prev) => ({
                    ...prev,
                    enabled: value,
                    reminders: value,
                    achievements: value,
                    challenges: value,
                    system: value,
                    hydration: value,
                    nutrition: value,
                    exercise: value,
                    sleep: value,
                    gamification: value,
                    weeklyReport: value ? prev.weeklyReport : false,
                    pushEnabled: value,
                    emailEnabled: value,
                    quietHoursEnabled: value ? prev.quietHoursEnabled : false,
                  }));
                }}
              />
            </View>

            <Text style={styles.sectionTitle}>Categorias</Text>
            <View style={styles.card}>
              <SettingRow
                label="Hidratacion"
                description="Recordatorios para cumplir tu objetivo de agua diario."
                value={settings.hydration}
                disabled={saving}
                onValueChange={(v) => updateField('hydration', v)}
              />
              <SettingRow
                label="Nutricion"
                description="Avisos para registrar comidas y mantener constancia."
                value={settings.nutrition}
                disabled={saving}
                onValueChange={(v) => updateField('nutrition', v)}
              />
              <SettingRow
                label="Ejercicio"
                description="Notificaciones para no olvidar sesiones de actividad."
                value={settings.exercise}
                disabled={saving}
                onValueChange={(v) => updateField('exercise', v)}
              />
              <SettingRow
                label="Sueno"
                description="Recordatorios orientados a mejorar tu rutina de descanso."
                value={settings.sleep}
                disabled={saving}
                onValueChange={(v) => updateField('sleep', v)}
              />
              <SettingRow
                label="Gamificacion"
                description="Avisos de logros, rachas y recompensas."
                value={settings.gamification}
                disabled={saving}
                onValueChange={(v) => updateField('gamification', v)}
              />
              <SettingRow
                label="Sistema"
                description="Comunicaciones importantes de la aplicacion."
                value={settings.system}
                disabled={saving}
                onValueChange={(v) => updateField('system', v)}
              />
            </View>

            <Text style={styles.sectionTitle}>Resumen semanal</Text>
            <View style={styles.card}>
              <SettingRow
                label="Recibir informe semanal"
                description="Resumen automatico del progreso de tus habitos."
                value={settings.weeklyReport}
                disabled={saving}
                onValueChange={(value) => updateField('weeklyReport', value)}
              />
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Dia</Text>
                <TextInput
                  style={styles.input}
                  value={settings.weeklyDay}
                  onChangeText={(value) => updateField('weeklyDay', value)}
                  placeholder="L-D"
                />
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Hora</Text>
                <TextInput
                  style={styles.input}
                  value={settings.weeklyTime}
                  onChangeText={(value) => updateField('weeklyTime', value)}
                  placeholder="HH:MM"
                />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Canales</Text>
            <View style={styles.card}>
              <SettingRow
                label="Push en el movil"
                description="Requiere permiso del sistema."
                value={settings.pushEnabled}
                disabled={saving}
                onValueChange={(value) => updateField('pushEnabled', value)}
              />
              <SettingRow
                label="Email"
                description="Requiere configuracion de correo."
                value={settings.emailEnabled}
                disabled={saving}
                onValueChange={(value) => updateField('emailEnabled', value)}
              />
            </View>

            <Text style={styles.sectionTitle}>Horas silenciosas</Text>
            <View style={styles.card}>
              <SettingRow
                label="Activar horas silenciosas"
                description="Reduce interrupciones en el rango horario que definas."
                value={settings.quietHoursEnabled}
                disabled={saving}
                onValueChange={(value) => updateField('quietHoursEnabled', value)}
              />
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Desde</Text>
                <TextInput
                  style={styles.input}
                  value={settings.quietFrom}
                  onChangeText={(value) => updateField('quietFrom', value)}
                  placeholder="HH:MM"
                />
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Hasta</Text>
                <TextInput
                  style={styles.input}
                  value={settings.quietTo}
                  onChangeText={(value) => updateField('quietTo', value)}
                  placeholder="HH:MM"
                />
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => update(settings)}
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
    minWidth: 80,
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
