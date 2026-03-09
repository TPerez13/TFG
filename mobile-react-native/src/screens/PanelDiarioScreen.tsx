import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/types';
import { Screen } from '../components/layout/Screen';
import { HabitCard } from '../components/HabitCard';
import { habitRegistry } from '../features/habits/habitRegistry';
import { apiFetch } from '../services/api';
import type { HabitEntry, User } from '../types/models';
import { baseStyles } from '../theme/components';
import { colors, fontSizes, spacing } from '../theme/tokens';

type PanelDiarioScreenProps = NativeStackScreenProps<HomeStackParamList, 'PanelDiario'>;

type HabitState = {
  key: string;
  total: number;
  progress: number;
};

const startOfDay = (baseDate: Date) =>
  new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0);
const endOfDay = (baseDate: Date) =>
  new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 59, 59, 999);

const progressMessage = (percent: number) => {
  if (percent >= 80) return 'Tu progreso de hoy va muy bien.';
  if (percent >= 55) return 'Buen ritmo. Sigue asi.';
  return 'Aun hay tiempo para avanzar hoy.';
};

const ProgressRing = ({ progress }: { progress: number }) => {
  const size = 180;
  const strokeWidth = 14;
  const clamped = Math.max(0, Math.min(1, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped);
  const innerSize = size - strokeWidth * 2;

  return (
    <View style={[styles.ringContainer, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.ringSvg}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.surfaceBorder}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.accent}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={dashOffset}
            fill="none"
          />
        </G>
      </Svg>
      <View
        style={[
          styles.ringInner,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
          },
        ]}
      />
      <View style={styles.ringLabel}>
        <Text style={styles.ringValue}>{Math.round(clamped * 100)}%</Text>
        <Text style={styles.ringCaption}>Completado</Text>
      </View>
    </View>
  );
};

export default function PanelDiarioScreen({ navigation }: PanelDiarioScreenProps) {
  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    const today = new Date();
    const from = startOfDay(today).toISOString();
    const to = endOfDay(today).toISOString();

    try {
      const [userRes, entriesRes] = await Promise.all([
        apiFetch('/users/me'),
        apiFetch(`/habits/entries?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
      ]);

      if (userRes.status === 401 || entriesRes.status === 401) {
        setError('Sesion expirada. Inicia sesion nuevamente.');
        return;
      }

      if (userRes.ok) {
        const payload = (await userRes.json()) as { user?: User };
        setUser(payload.user ?? null);
      } else {
        setError('No se pudo cargar el usuario.');
      }

      if (entriesRes.ok) {
        const payload = (await entriesRes.json()) as { entries?: HabitEntry[] };
        setEntries(payload.entries ?? []);
      } else {
        setEntries([]);
      }
    } catch (err: any) {
      setError(err?.message ?? 'Error al cargar el panel.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const totalsByType = useMemo(() => {
    const totals = new Map<number, number>();
    entries.forEach((entry) => {
      const current = totals.get(entry.id_tipo_habito) ?? 0;
      totals.set(entry.id_tipo_habito, current + (entry.valor ?? 0));
    });
    return totals;
  }, [entries]);

  const habitStates = useMemo(() => {
    return habitRegistry
      .filter((habit) => habit.visible !== false)
      .map((habit) => {
        const total = totalsByType.get(habit.idTipoHabito) ?? 0;
        const progress = habit.goal.value > 0 ? Math.min(total / habit.goal.value, 1) : 0;
        const state: HabitState = { key: habit.key, total, progress };
        return state;
      });
  }, [totalsByType]);

  const globalProgress = useMemo(() => {
    if (habitStates.length === 0) return 0;
    const sum = habitStates.reduce((acc, item) => acc + item.progress, 0);
    return sum / habitStates.length;
  }, [habitStates]);

  const greetingName = user?.nombre ?? user?.username ?? user?.correo ?? 'Usuario';
  const globalPercent = Math.round(globalProgress * 100);

  const onHabitAction = (habitKey: string) => {
    const habit = habitRegistry.find((item) => item.key === habitKey);
    if (!habit?.action) return;

    if (habit.action.intent === 'navigate' && habit.action.routeName) {
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate(habit.action.routeName as never);
        return;
      }
      return;
    }

    Alert.alert('Accion rapida', `Listo para ${habit.title.toLowerCase()}.`);
  };

  return (
    <Screen>
      <StatusBar barStyle="dark-content" />
      <View pointerEvents="none" style={styles.background}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
      </View>
      <ScrollView contentContainerStyle={[baseStyles.content, styles.content]}>
        <View style={styles.headerRow}>
          <View style={styles.avatar} />
          <Text style={styles.headerTitle}>Panel Diario</Text>
          <View style={styles.headerSpacer} />
        </View>
        <Text style={styles.greeting}>Buenos dias, {greetingName}</Text>
        <Text style={styles.subtitle}>Es un dia hermoso para estar saludable.</Text>

        <View style={styles.progressSection}>
          {loading ? <ActivityIndicator size="large" color={colors.textAccent} /> : <ProgressRing progress={globalProgress} />}
          <Text style={styles.progressMessage}>{progressMessage(globalPercent)}</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Habitos de hoy</Text>
          <Text style={styles.sectionMeta}>{globalPercent}% completado</Text>
        </View>

        <View style={styles.habitsList}>
          {habitRegistry
            .filter((habit) => habit.visible !== false)
            .map((habit) => {
              const state = habitStates.find((item) => item.key === habit.key);
              const total = state?.total ?? 0;
              const progress = state?.progress ?? 0;
              const subtitle = habit.formatSummary
                ? habit.formatSummary(total, habit.goal)
                : `${total} de ${habit.goal.value} ${habit.goal.unit}`;
              return (
                <HabitCard
                  key={habit.key}
                  habit={habit}
                  variant="home"
                  subtitle={subtitle}
                  progress={progress}
                  style={styles.habitCard}
                  actionLabel={habit.action?.label}
                  onPressAction={() => onHabitAction(habit.key)}
                />
              );
            })}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.contentBottom + 24,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  glowTop: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.glowTop,
    opacity: 0.6,
    top: -160,
    left: -90,
  },
  glowBottom: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: colors.glowBottom,
    opacity: 0.5,
    bottom: -200,
    right: -130,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandSoft,
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
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: colors.textMuted,
    marginBottom: spacing.xxl,
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  progressMessage: {
    marginTop: spacing.lg,
    fontSize: fontSizes.md,
    color: colors.textMuted,
    textAlign: 'center',
  },
  errorText: {
    marginTop: spacing.sm,
    fontSize: fontSizes.sm,
    color: '#b84a4a',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sectionMeta: {
    fontSize: fontSizes.sm,
    color: colors.textSubtle,
  },
  habitsList: {
    gap: spacing.lg,
  },
  habitCard: {
    width: '100%',
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringSvg: {
    position: 'absolute',
  },
  ringInner: {
    position: 'absolute',
    backgroundColor: colors.bg,
  },
  ringLabel: {
    position: 'absolute',
    alignItems: 'center',
  },
  ringValue: {
    fontSize: 34,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  ringCaption: {
    fontSize: fontSizes.sm,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textSubtle,
    marginTop: spacing.xs,
  },
});
