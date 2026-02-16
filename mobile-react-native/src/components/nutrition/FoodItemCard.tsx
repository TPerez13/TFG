import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FoodTemplate } from '../../features/nutrition/types';
import { colors, fontSizes, radius, spacing } from '../../theme/tokens';

type FoodItemCardProps = {
  item: FoodTemplate;
  onAdd: () => void;
  compact?: boolean;
};

export function FoodItemCard({ item, onAdd, compact = false }: FoodItemCardProps) {
  return (
    <View style={[styles.card, compact ? styles.cardCompact : null]}>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {item.nombre}
        </Text>
        <Text style={styles.kcal}>{Math.round(item.kcal)} kcal</Text>
        <Pressable
          accessibilityRole="button"
          onPress={onAdd}
          style={({ pressed }) => [styles.addButton, pressed ? styles.addButtonPressed : null]}
        >
          <Text style={styles.addText}>Anadir</Text>
          <View style={styles.addIconWrap}>
            <Ionicons name="add" size={16} color={colors.textOnAccent} />
          </View>
        </Pressable>
      </View>
      <View style={styles.imagePlaceholder}>
        <Ionicons name="restaurant-outline" size={28} color={colors.placeholder} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardCompact: {
    paddingVertical: spacing.md,
  },
  info: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    fontSize: 21,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  kcal: {
    fontSize: fontSizes.xl,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  addButton: {
    alignSelf: 'flex-start',
    borderRadius: radius.lg,
    backgroundColor: '#22c55e',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  addButtonPressed: {
    opacity: 0.85,
  },
  addText: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.textOnAccent,
  },
  addIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
