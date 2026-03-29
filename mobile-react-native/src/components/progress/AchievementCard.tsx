import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../ui/Button';
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

      <Button
        title="COMPARTIR LOGRO"
        onPress={onShare}
        rightIcon={<Ionicons name="share-social-outline" size={18} color={colors.textOnAccent} />}
        style={styles.shareButton}
      />
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
    width: '100%',
    marginTop: 0,
  },
});
