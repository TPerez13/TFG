import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { AppTabParamList } from './types';
import { HomeStack } from './HomeStack';
import { HabitsStack } from './HabitsStack';
import { ProgressStack } from './ProgressStack';
import { ProfileStack } from './ProfileStack';
import { tabBarOptions } from './tabOptions';

const Tab = createBottomTabNavigator<AppTabParamList>();

export function AppTabs() {
  return (
    <Tab.Navigator screenOptions={tabBarOptions}>
      <Tab.Screen
        name="InicioTab"
        component={HomeStack}
        options={({ route }) => ({
          title: 'Inicio',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
          tabBarStyle: shouldHideTabBar(route) ? { display: 'none' } : tabBarOptions.tabBarStyle,
        })}
      />
      <Tab.Screen
        name="HabitosTab"
        component={HabitsStack}
        options={({ route }) => ({
          title: 'Habitos',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'clipboard' : 'clipboard-outline'} size={size} color={color} />
          ),
          tabBarStyle: shouldHideTabBar(route) ? { display: 'none' } : tabBarOptions.tabBarStyle,
        })}
      />
      <Tab.Screen
        name="ProgresoTab"
        component={ProgressStack}
        options={({ route }) => ({
          title: 'Progreso',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'stats-chart' : 'stats-chart-outline'} size={size} color={color} />
          ),
          tabBarStyle: shouldHideTabBar(route) ? { display: 'none' } : tabBarOptions.tabBarStyle,
        })}
      />
      <Tab.Screen
        name="PerfilTab"
        component={ProfileStack}
        options={({ route }) => ({
          title: 'Perfil',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
          tabBarStyle: shouldHideTabBar(route) ? { display: 'none' } : tabBarOptions.tabBarStyle,
        })}
      />
    </Tab.Navigator>
  );
}

const ROOT_ROUTES = new Set([
  'PanelDiario',
  'Habits',
  'Nutrition',
  'NutritionQuickAdd',
  'NutritionManualEntry',
  'Hidratacion',
  'RegistrarAgua',
  'Ejercicio',
  'RegistrarEjercicio',
  'Sueno',
  'RegistrarSueno',
  'Progress',
  'Profile',
]);

const shouldHideTabBar = (route: { name?: string } | undefined) => {
  const routeName = getFocusedRouteNameFromRoute(route as any);
  if (!routeName) return false;
  return !ROOT_ROUTES.has(routeName);
};
