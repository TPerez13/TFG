import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from './tokens';

export const baseStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.contentTop,
    paddingBottom: spacing.contentBottom,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.xl,
  },
});
