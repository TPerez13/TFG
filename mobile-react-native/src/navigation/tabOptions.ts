import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { colors } from '../theme/tokens';

export const tabBarOptions: BottomTabNavigationOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.accent,
  tabBarInactiveTintColor: '#9aa7a0',
  tabBarLabelStyle: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabBarStyle: {
    backgroundColor: '#ffffff',
    borderTopColor: '#e7efe9',
    borderTopWidth: 1,
    paddingTop: 6,
    paddingBottom: 10,
    height: 68,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
  },
};
