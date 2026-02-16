import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSizes, radius, spacing } from '../../theme/tokens';

type SnackbarProps = {
  visible: boolean;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function Snackbar({ visible, message, actionLabel, onAction }: SnackbarProps) {
  if (!visible) return null;

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <View style={styles.container}>
        <Text style={styles.message}>{message}</Text>
        {actionLabel && onAction ? (
          <Pressable
            accessibilityRole="button"
            onPress={onAction}
            style={({ pressed }) => [styles.actionButton, pressed ? styles.actionPressed : null]}
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: spacing.xxl,
    right: spacing.xxl,
    bottom: spacing.contentBottom + 12,
  },
  container: {
    backgroundColor: '#07100b',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  message: {
    color: '#f4fff7',
    fontSize: fontSizes.base,
    fontWeight: '600',
    flex: 1,
  },
  actionButton: {
    backgroundColor: '#38423b',
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  actionPressed: {
    opacity: 0.85,
  },
  actionText: {
    color: '#f4fff7',
    fontSize: fontSizes.base,
    fontWeight: '800',
  },
});
