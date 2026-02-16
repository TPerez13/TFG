import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HabitsStackParamList } from './types';
import HabitsScreen from '../screens/HabitsScreen';
import HabitDetailScreen from '../screens/HabitDetailScreen';
import HabitGoalsScreen from '../screens/HabitGoalsScreen';
import NutritionScreen from '../screens/NutritionScreen';
import NutritionQuickAddScreen from '../screens/NutritionQuickAddScreen';
import NutritionManualEntryScreen from '../screens/NutritionManualEntryScreen';
import HidratacionScreen from '../screens/HidratacionScreen';
import RegistrarAguaScreen from '../screens/RegistrarAguaScreen';
import EjercicioScreen from '../screens/EjercicioScreen';
import RegistrarEjercicioScreen from '../screens/RegistrarEjercicioScreen';

const Stack = createNativeStackNavigator<HabitsStackParamList>();

export function HabitsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Habits" component={HabitsScreen} />
      <Stack.Screen name="HabitDetail" component={HabitDetailScreen} />
      <Stack.Screen name="HabitGoals" component={HabitGoalsScreen} />
      <Stack.Screen name="Nutrition" component={NutritionScreen} />
      <Stack.Screen name="NutritionQuickAdd" component={NutritionQuickAddScreen} />
      <Stack.Screen name="NutritionManualEntry" component={NutritionManualEntryScreen} />
      <Stack.Screen name="Hidratacion" component={HidratacionScreen} />
      <Stack.Screen name="RegistrarAgua" component={RegistrarAguaScreen} />
      <Stack.Screen name="Ejercicio" component={EjercicioScreen} />
      <Stack.Screen name="RegistrarEjercicio" component={RegistrarEjercicioScreen} />
    </Stack.Navigator>
  );
}
