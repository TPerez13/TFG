import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MeditationSessionType } from '../../features/meditation/types';
import { meditationTypeLabel } from '../../features/meditation/types';
import { colors, fontSizes, radius, spacing } from '../../theme/tokens';

type MeditationTemplateCardProps = {
  type: MeditationSessionType;
  durationMin: number;
  onAdd: () => void;
  subtitle?: string;
  titleOverride?: string;
};

const iconByType = (type: MeditationSessionType) => {
  if (type === 'respiracion') return 'leaf-outline';
  if (type === 'mindfulness') return 'eye-outline';
  if (type === 'guiada') return 'headset-outline';
  if (type === 'escaneo') return 'body-outline';
  return 'ellipse-outline';
};

export function MeditationTemplateCard({
  type,
  durationMin,
  onAdd,
  subtitle,
  titleOverride,
}: MeditationTemplateCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <Ionicons name={iconByType(type)} size={20} color={colors.textAccent} />
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>{titleOverride ?? meditationTypeLabel(type)}</Text>
          <Text style={styles.meta}>{Math.round(durationMin)} min</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      <Pressable onPress={onAdd} style={({ pressed }) => [styles.addButton, pressed ? styles.pressed : null]}>
        <Text style={styles.addText}>Anadir +</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  meta: {
    color: colors.textMuted,
    fontSize: fontSizes.base,
    fontWeight: '600',
  },
  subtitle: {
    color: colors.textSubtle,
    fontSize: fontSizes.sm,
    marginTop: 2,
  },
  addButton: {
    borderRadius: 18,
    backgroundColor: colors.textAccent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addText: {
    color: colors.textOnAccent,
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});
