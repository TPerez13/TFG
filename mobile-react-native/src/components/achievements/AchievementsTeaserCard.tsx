import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ClosestAchievementItem } from '../../features/achievements/useAchievements';
import { colors, fontSizes, spacing } from '../../theme/tokens';

type AchievementsTeaserCardProps = {
  items: ClosestAchievementItem[];
  loading: boolean;
  error: string | null;
  isEmptyHistory: boolean;
  onRetry: () => void;
  onPressAll: () => void;
  onPressItem: (item: ClosestAchievementItem) => void;
};

const formatProgress = (current: number, target: number) => `${current}/${target}`;

export function AchievementsTeaserCard({
  items,
  loading,
  error,
  isEmptyHistory,
  onRetry,
  onPressAll,
  onPressItem,
}: AchievementsTeaserCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>A punto de conseguir</Text>
        <Ionicons name="trophy-outline" size={18} color={colors.textAccent} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          {[0, 1, 2].map((item) => (
            <View key={item} style={styles.skeletonRow}>
              <View style={styles.skeletonIcon} />
              <View style={styles.skeletonTextBlock}>
                <View style={styles.skeletonLineMain} />
                <View style={styles.skeletonLineSub} />
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {!loading && error ? (
        <View style={styles.stateWrap}>
          <Text style={styles.errorText}>No se pudieron cargar los logros</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onRetry}
            style={({ pressed }) => [styles.retryButton, pressed ? styles.pressed : null]}
          >
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : null}

      {!loading && !error && isEmptyHistory ? (
        <View style={styles.stateWrap}>
          <Text style={styles.stateText}>Empieza hoy y desbloquea tu primer logro.</Text>
        </View>
      ) : null}

      {!loading && !error && !isEmptyHistory && items.length === 0 ? (
        <View style={styles.stateWrap}>
          <Text style={styles.stateText}>Sigue asi, pronto desbloquearas nuevos logros.</Text>
        </View>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <View style={styles.rows}>
          {items.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              onPress={() => onPressItem(item)}
              style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={item.icon as any} size={16} color={colors.textOnAccent} />
              </View>

              <View style={styles.rowBody}>
                <View style={styles.rowTop}>
                  <Text numberOfLines={1} style={styles.rowTitle}>
                    {item.title}
                  </Text>
                  <Text style={styles.rowProgressLabel}>
                    {formatProgress(item.progressCurrent, item.progressTarget)}
                  </Text>
                </View>

                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${Math.round(item.progressPct * 100)}%` }]} />
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={onPressAll}
        style={({ pressed }) => [styles.footerCta, pressed ? styles.pressed : null]}
      >
        <Text style={styles.footerCtaText}>Ver todos los logros</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textAccent} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  rows: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: {
    flex: 1,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: spacing.sm,
  },
  rowTitle: {
    flex: 1,
    fontSize: fontSizes.md,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  rowProgressLabel: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    fontWeight: '700',
  },
  track: {
    height: 7,
    borderRadius: 999,
    backgroundColor: colors.surfaceBorder,
    overflow: 'hidden',
  },
  fill: {
    height: 7,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  footerCta: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bde6c8',
    backgroundColor: '#effaf2',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  footerCtaText: {
    color: colors.textAccent,
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  stateWrap: {
    marginBottom: spacing.md,
  },
  stateText: {
    color: colors.textMuted,
    fontSize: fontSizes.md,
    lineHeight: 20,
  },
  errorText: {
    color: '#b84a4a',
    fontSize: fontSizes.md,
    marginBottom: spacing.sm,
  },
  retryButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  retryText: {
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  loadingWrap: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  skeletonIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceBorder,
  },
  skeletonTextBlock: {
    flex: 1,
    gap: 6,
  },
  skeletonLineMain: {
    height: 11,
    borderRadius: 999,
    width: '64%',
    backgroundColor: colors.surfaceBorder,
  },
  skeletonLineSub: {
    height: 7,
    borderRadius: 999,
    width: '100%',
    backgroundColor: colors.surfaceBorder,
  },
  pressed: {
    opacity: 0.82,
  },
});
