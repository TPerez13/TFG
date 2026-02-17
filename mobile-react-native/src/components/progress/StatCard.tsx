import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type StatCardProps = {
  icon: IconName;
  title: string;
  value: number;
  valueLabel?: string;
  caption: string;
  captionColor?: string;
};

export function StatCard({ icon, title, value, valueLabel, caption, captionColor }: StatCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Ionicons name={icon} size={24} color={colors.textAccent} />
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.metricWrap}>
        <Text style={styles.value}>{value}</Text>
        {valueLabel ? <Text style={styles.valueLabel}>{valueLabel}</Text> : null}
      </View>

      <Text style={[styles.caption, captionColor ? { color: captionColor } : null]}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 176,
    backgroundColor: '#dbe5df',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#a8deb8',
    paddingHorizontal: spacing.lgPlus,
    paddingVertical: spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: '#0f1612',
  },
  metricWrap: {
    marginBottom: spacing.md,
  },
  value: {
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '700',
    color: '#0f1612',
  },
  valueLabel: {
    fontSize: 29,
    lineHeight: 31,
    color: '#0f1612',
    fontWeight: '500',
  },
  caption: {
    marginTop: 'auto',
    color: '#1bbf5e',
    fontSize: 16,
    fontWeight: '700',
  },
});
