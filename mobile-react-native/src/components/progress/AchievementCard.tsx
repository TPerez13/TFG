import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../theme/tokens';

type AchievementCardProps = {
  title: string;
  onShare: () => void;
};

export function AchievementCard({ title, onShare }: AchievementCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.medalWrap}>
          <Ionicons name="medal-outline" size={28} color="#fff" />
        </View>
        <View style={styles.titleWrap}>
          <Text style={styles.eyebrow}>LOGRO DEL MES</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Compartir logro"
        onPress={onShare}
        style={({ pressed }) => [styles.shareButton, pressed ? styles.sharePressed : null]}
      >
        <Text numberOfLines={1} style={styles.shareLabel}>
          Compartir con la Fa...
        </Text>
        <Ionicons name="share-social-outline" size={22} color="#f6fff9" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: radius.md,
    padding: spacing.lgPlus,
    marginBottom: spacing.contentBottom,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  medalWrap: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5c400',
    shadowColor: '#f5c400',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 5,
  },
  titleWrap: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  eyebrow: {
    color: '#556b87',
    fontSize: 14,
    letterSpacing: 2.2,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  title: {
    color: '#111515',
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '700',
  },
  shareButton: {
    backgroundColor: '#20c85e',
    borderRadius: 28,
    minHeight: 64,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  shareLabel: {
    color: '#f6fff9',
    fontSize: 19,
    fontWeight: '700',
    flexShrink: 1,
    marginRight: spacing.sm,
  },
  sharePressed: {
    opacity: 0.85,
  },
});
