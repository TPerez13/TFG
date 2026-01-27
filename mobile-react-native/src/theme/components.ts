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
    alignItems: 'stretch',
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
  },
});
