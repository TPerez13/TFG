import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Notification } from '../features/notifications/types';
import { colors, fontSizes, spacing } from '../theme/tokens';

type NotificationItemProps = {
  item: Notification;
  onPress: () => void;
  onToggleRead: () => void;
  onDelete: () => void;
};

const formatRelative = (value: string) => {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.round(hours / 24);
  return `${days} d`;
};

export function NotificationItem({ item, onPress, onToggleRead, onDelete }: NotificationItemProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.time}>{formatRelative(item.createdAt)}</Text>
      </View>
      <Text style={styles.body} numberOfLines={2}>
        {item.body}
      </Text>
      <View style={styles.footerRow}>
        <Pressable onPress={onToggleRead} style={styles.actionButton}>
          <Text style={styles.actionText}>{item.read ? 'Marcar no leida' : 'Marcar leida'}</Text>
        </Pressable>
        <Pressable onPress={onDelete} style={[styles.actionButton, styles.deleteButton]}>
          <Text style={[styles.actionText, styles.deleteText]}>Eliminar</Text>
        </Pressable>
        {!item.read ? <View style={styles.unreadDot} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    paddingRight: spacing.sm,
  },
  time: {
    fontSize: fontSizes.sm,
    color: colors.textSubtle,
  },
  body: {
    fontSize: fontSizes.md,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  actionButton: {
    paddingVertical: spacing.xs,
  },
  actionText: {
    fontSize: fontSizes.sm,
    color: colors.textAccent,
    fontWeight: '600',
  },
  deleteButton: {},
  deleteText: {
    color: '#c94747',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginLeft: 'auto',
  },
});
