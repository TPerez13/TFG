import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { HabitReminderDebugInfo } from '../../features/notifications/types';
import { colors, fontSizes, spacing } from '../../theme/tokens';

type ReminderDebugPanelProps = {
  data: HabitReminderDebugInfo | null;
  loading: boolean;
  onSendTest?: () => void;
  sendingTest?: boolean;
};

const formatBoolean = (value: boolean) => (value ? 'Si' : 'No');

const formatDateTime = (value: string | null, source: HabitReminderDebugInfo['nextScheduledSource']) => {
  if (!value) return 'No programada';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const label = parsed.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  if (source === 'scheduled') return `${label} (agenda local)`;
  if (source === 'calculated') return `${label} (calculada)`;
  return label;
};

const formatSystemDateTime = (value: Date) =>
  value.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

export function ReminderDebugPanel({
  data,
  loading,
  onSendTest,
  sendingTest = false,
}: ReminderDebugPanelProps) {
  const [systemTime, setSystemTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setSystemTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Diagnostico del aviso</Text>
      {loading ? <ActivityIndicator size="small" color={colors.textAccent} style={styles.loader} /> : null}
      {!loading && data ? (
        <>
          <DebugRow label="Hora del sistema" value={formatSystemDateTime(systemTime)} />
          <DebugRow label="Permiso actual" value={data.permissionState} />
          <DebugRow
            label="Proxima fecha programada"
            value={formatDateTime(data.nextScheduledAt, data.nextScheduledSource)}
          />
          <DebugRow label="Completado hoy" value={formatBoolean(data.completedToday)} />
          <DebugRow label="Bloqueado por global" value={formatBoolean(data.blockedByGlobal)} />
          <DebugRow label="Bloqueado por silencio" value={formatBoolean(data.blockedByQuietHours)} />
          <DebugRow label="Bloqueado por permisos" value={formatBoolean(data.blockedByPermissions)} />
        </>
      ) : null}
      {onSendTest ? (
        <Pressable
          accessibilityRole="button"
          onPress={onSendTest}
          disabled={loading || sendingTest}
          style={({ pressed }) => [
            styles.testButton,
            (loading || sendingTest) ? styles.testButtonDisabled : null,
            pressed ? styles.testButtonPressed : null,
          ]}
        >
          <Text style={styles.testButtonText}>
            {sendingTest ? 'Lanzando prueba...' : 'Lanzar notificacion de prueba'}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

type DebugRowProps = {
  label: string;
  value: string;
};

function DebugRow({ label, value }: DebugRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 16,
    padding: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  loader: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  label: {
    flex: 1,
    color: colors.textSubtle,
    fontSize: fontSizes.sm,
  },
  value: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    textAlign: 'right',
  },
  testButton: {
    marginTop: spacing.md,
    borderRadius: 999,
    backgroundColor: colors.textAccent,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonPressed: {
    opacity: 0.85,
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: fontSizes.base,
    fontWeight: '800',
  },
});
