import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSizes, radius, spacing } from '../../theme/tokens';

type SleepTemplateCardProps = {
  title: string;
  hours: number;
  subtitle?: string;
  onAdd: () => void;
};

const formatHours = (hours: number) => {
  const rounded = Math.round(hours * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded.toFixed(1)}`;
};

export function SleepTemplateCard({ title, hours, subtitle, onAdd }: SleepTemplateCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <Ionicons name="moon-outline" size={20} color={colors.textAccent} />
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.meta}>{formatHours(hours)} h</Text>
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
