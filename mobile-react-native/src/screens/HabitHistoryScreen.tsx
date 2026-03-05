import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/layout/Screen';
import { useHabitTrend } from '../features/progress/useHabitTrend';
import type { ProgressStackParamList } from '../navigation/types';
import { baseStyles } from '../theme/components';
import { colors, radius, spacing } from '../theme/tokens';

type HabitHistoryScreenProps = NativeStackScreenProps<ProgressStackParamList, 'HabitHistory'>;

export default function HabitHistoryScreen({ navigation, route }: HabitHistoryScreenProps) {
  const { habitKey } = route.params;
  const { data, loading, error, reload } = useHabitTrend(habitKey, 7);

  const openHabitDetail = () => navigation.navigate('HabitDetail', { habitKey });

  const openHabitsHome = () => {
    const parent = navigation.getParent();
    if (!parent) return;

    if (habitKey === 'agua') {
      parent.navigate('HabitosTab' as never, { screen: 'Hidratacion' } as never);
      return;
    }
    if (habitKey === 'ejercicio') {
      parent.navigate('HabitosTab' as never, { screen: 'Ejercicio' } as never);
      return;
    }
    if (habitKey === 'sueno') {
      parent.navigate('HabitosTab' as never, { screen: 'Sueno' } as never);
      return;
    }
    if (habitKey === 'meditacion') {
      parent.navigate('HabitosTab' as never, { screen: 'Meditacion' } as never);
      return;
    }
    parent.navigate('HabitosTab' as never, { screen: 'Nutrition' } as never);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={[baseStyles.content, styles.content]}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}
          >
            <Ionicons name="chevron-back" size={30} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Historial de {data.habitTitle}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.trendCard}>
          <View style={styles.trendTop}>
            <View>
              <Text style={styles.eyebrow}>ULTIMOS 7 DIAS</Text>
              <Text style={styles.trendTitle}>Tendencia</Text>
            </View>
            <View style={styles.avgWrap}>
              <Text style={styles.avgPct}>{data.avgPct}%</Text>
              <Text style={styles.avgLabel}>Meta promedio</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingCard}>
              <View style={styles.trendLoading} />
              <Text style={styles.loadingText}>Cargando historial del habito...</Text>
            </View>
          ) : (
            <View style={styles.trendBars}>
              {data.daily.map((point) => {
                const height = point.pct > 0 ? Math.max(6, Math.round((point.pct / 100) * 72)) : 6;
                return (
                  <View key={point.dateKey} style={styles.trendColumn}>
                    <View
                      style={[
                        styles.trendBar,
                        {
                          height,
                          backgroundColor: point.pct >= 100 ? '#22c55e' : '#c7d3dd',
                        },
                      ]}
                    />
                    <Text style={styles.trendLabel}>{point.label}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Registros Recientes</Text>

        {error && !loading ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>No se pudo cargar el historial</Text>
            <Pressable onPress={() => void reload()} style={({ pressed }) => [styles.retryButton, pressed ? styles.pressed : null]}>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : null}

        {!error && !loading && data.recentToday.length === 0 && data.recentYesterday.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Sin registros en los ultimos 7 dias.</Text>
            <Pressable onPress={openHabitsHome} style={({ pressed }) => [styles.emptyCta, pressed ? styles.pressed : null]}>
              <Text style={styles.emptyCtaText}>Ir a Habitos</Text>
            </Pressable>
          </View>
        ) : null}

        {data.recentToday.length > 0 ? (
          <>
            <Text style={styles.groupTitle}>HOY</Text>
            {data.recentToday.map((item) => (
              <View key={item.id} style={styles.entryCard}>
                <View style={[styles.entryIcon, { backgroundColor: data.softColor }]}>
                  <Ionicons name={data.icon as never} size={22} color={data.accentColor} />
                </View>
                <View style={styles.entryInfo}>
                  <Text style={styles.entryValue}>{item.valueLabel}</Text>
                  <Text style={styles.entryTime}>{item.timeLabel}</Text>
                </View>
                <Pressable style={({ pressed }) => [styles.menuButton, pressed ? styles.pressed : null]}>
                  <Ionicons name="ellipsis-vertical" size={20} color="#c0cad4" />
                </Pressable>
              </View>
            ))}
          </>
        ) : null}

        {data.recentYesterday.length > 0 ? (
          <>
            <Text style={styles.groupTitle}>AYER</Text>
            {data.recentYesterday.map((item) => (
              <View key={item.id} style={styles.entryCard}>
                <View style={[styles.entryIcon, { backgroundColor: data.softColor }]}>
                  <Ionicons name={data.icon as never} size={22} color={data.accentColor} />
                </View>
                <View style={styles.entryInfo}>
                  <Text style={styles.entryValue}>{item.valueLabel}</Text>
                  <Text style={styles.entryTime}>{item.timeLabel}</Text>
                </View>
                <Pressable style={({ pressed }) => [styles.menuButton, pressed ? styles.pressed : null]}>
                  <Ionicons name="ellipsis-vertical" size={20} color="#c0cad4" />
                </Pressable>
              </View>
            ))}
          </>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={openHabitDetail}
          style={({ pressed }) => [styles.ctaButton, pressed ? styles.pressed : null]}
        >
          <Ionicons name="add-circle" size={28} color="#19b95b" />
          <Text style={styles.ctaText}>Ir a Detalle del Habito</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.contentBottom + 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lgPlus,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#121831',
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  pressed: {
    opacity: 0.82,
  },
  trendCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: '#edf1f5',
    paddingHorizontal: spacing.lgPlus,
    paddingVertical: spacing.lg,
    marginBottom: spacing.xxl,
  },
  trendTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lgPlus,
  },
  eyebrow: {
    color: '#607187',
    fontSize: 13,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  trendTitle: {
    color: '#111831',
    fontSize: 24,
    fontWeight: '700',
  },
  avgWrap: {
    alignItems: 'flex-end',
  },
  avgPct: {
    fontSize: 20,
    color: '#1bbf5e',
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  avgLabel: {
    color: '#8da1b8',
    fontSize: 17,
  },
  trendLoading: {
    width: '100%',
    height: 110,
    borderRadius: 14,
    backgroundColor: '#dde5ec',
  },
  loadingCard: {
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    color: '#60748d',
    fontSize: 15,
    fontWeight: '600',
  },
  trendBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    minHeight: 104,
    paddingTop: spacing.sm,
  },
  trendColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  trendBar: {
    width: 14,
    borderRadius: 6,
  },
  trendLabel: {
    color: '#8a9cb3',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: '#111831',
    marginBottom: spacing.mdPlus,
  },
  groupTitle: {
    color: '#61758f',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginBottom: spacing.sm,
  },
  entryCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.mdPlus,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  entryIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.mdPlus,
  },
  entryInfo: {
    flex: 1,
  },
  entryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#121831',
    marginBottom: spacing.xs,
  },
  entryTime: {
    color: '#60748d',
    fontSize: 17,
  },
  menuButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButton: {
    marginTop: spacing.lgPlus,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#1bbf5e',
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: '#f8fffb',
  },
  ctaText: {
    color: '#18b257',
    fontSize: 23,
    fontWeight: '700',
  },
  errorCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#f0cdcd',
    backgroundColor: '#fff4f4',
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  errorText: {
    color: '#b34949',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  retryText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  emptyText: {
    color: '#60748d',
    fontSize: 16,
    marginBottom: spacing.md,
  },
  emptyCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  emptyCta: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#1bbf5e',
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: '#f8fffb',
  },
  emptyCtaText: {
    color: '#18b257',
    fontWeight: '700',
    fontSize: 15,
  },
});
