import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../theme/tokens';

type InsightCardProps = {
  bestWeekIndex: number;
  bestWeekPct: number;
  isEmpty: boolean;
};

export function InsightCard({ bestWeekIndex, bestWeekPct, isEmpty }: InsightCardProps) {
  const title = isEmpty ? 'Aun no hay semanas registradas' : `¡Tu mejor semana fue la S${bestWeekIndex + 1}!`;
  const subtitle = isEmpty ? 'Comienza a registrar habitos para ver tus tendencias.' : `Mantuviste un ${bestWeekPct}% de cumplimiento.`;

  return (
    <View style={styles.card}>
      <View style={styles.leftAccent} />
      <View style={styles.iconWrap}>
        <Ionicons name="trophy" size={26} color={colors.textAccent} />
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: '#dbe7e1',
    borderWidth: 1,
    borderColor: '#d0ddd6',
    overflow: 'hidden',
    paddingVertical: spacing.lg,
    paddingRight: spacing.lgPlus,
    marginBottom: spacing.lgPlus,
  },
  leftAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: '#22c55e',
  },
  iconWrap: {
    width: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 21,
    lineHeight: 26,
    color: '#101814',
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: '#4d647f',
    fontSize: 18,
    lineHeight: 24,
  },
});
