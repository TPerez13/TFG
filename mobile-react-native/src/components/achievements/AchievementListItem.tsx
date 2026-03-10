import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import type { AchievementItem } from '../../features/achievements/achievementRegistry';
import { colors, fontSizes, spacing } from '../../theme/tokens';

type AchievementListItemProps = {
  achievement: AchievementItem;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const formatUnlockedAt = (unlockedAt: string | null) => {
  if (!unlockedAt) return null;
  const parsed = new Date(`${unlockedAt}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return unlockedAt;
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
};

export function AchievementListItem({ achievement }: AchievementListItemProps) {
  const progress = achievement.progress;
  const progressPct =
    progress && progress.target > 0
      ? clamp((progress.current / progress.target) * 100, 0, 100)
      : achievement.unlocked
        ? 100
        : 0;
  const unlockedDateLabel = formatUnlockedAt(achievement.unlockedAt);

  return (
    <View style={[styles.card, achievement.unlocked ? styles.cardUnlocked : styles.cardLocked]}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, achievement.unlocked ? styles.iconWrapUnlocked : styles.iconWrapLocked]}>
          <Ionicons
            name={achievement.icon as any}
            size={20}
            color={achievement.unlocked ? colors.textOnAccent : colors.textSubtle}
          />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>{achievement.title}</Text>
          <Text style={styles.description}>{achievement.description}</Text>
        </View>
        <View style={[styles.stateBadge, achievement.unlocked ? styles.stateBadgeUnlocked : styles.stateBadgeLocked]}>
          <Text style={[styles.stateBadgeText, achievement.unlocked ? styles.stateBadgeTextUnlocked : null]}>
            {achievement.unlocked ? 'Desbloqueado' : 'Bloqueado'}
          </Text>
        </View>
      </View>

      {progress ? (
        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>
              Progreso {progress.current}/{progress.target}
            </Text>
            <Text style={styles.progressPct}>{Math.round(progressPct)}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
        </View>
      ) : null}

      {achievement.unlocked && unlockedDateLabel ? (
        <Text style={styles.unlockedAt}>Conseguido el {unlockedDateLabel}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardUnlocked: {
    borderColor: '#bde6c8',
  },
  cardLocked: {
    borderColor: colors.surfaceBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  iconWrapUnlocked: {
    backgroundColor: colors.accent,
  },
  iconWrapLocked: {
    backgroundColor: '#e8ece9',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  description: {
    fontSize: fontSizes.md,
    color: colors.textMuted,
    lineHeight: 19,
  },
  stateBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  stateBadgeUnlocked: {
    borderColor: '#99d8ae',
    backgroundColor: '#e8f8ee',
  },
  stateBadgeLocked: {
    borderColor: '#d2d9d4',
    backgroundColor: '#f0f3f1',
  },
  stateBadgeText: {
    fontSize: fontSizes.xs,
    fontWeight: '700',
    color: colors.textMuted,
  },
  stateBadgeTextUnlocked: {
    color: '#19713d',
  },
  progressSection: {
    marginTop: spacing.md,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  progressText: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  progressPct: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  progressTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: '#e6ece8',
    overflow: 'hidden',
  },
  progressFill: {
    height: 7,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  unlockedAt: {
    marginTop: spacing.sm,
    color: colors.textSubtle,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
});
