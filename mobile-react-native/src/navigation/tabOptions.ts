import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { colors } from '../theme/tokens';

export const tabBarOptions: BottomTabNavigationOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.textAccent,
  tabBarInactiveTintColor: colors.textSubtle,
  tabBarLabelStyle: {
    fontSize: 13,
    fontWeight: '700',
  },
  tabBarItemStyle: {
    minHeight: 48,
    paddingVertical: 4,
  },
  tabBarStyle: {
    backgroundColor: colors.surface,
    borderTopColor: colors.surfaceBorder,
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: 12,
    height: 72,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 10,
  },
};
