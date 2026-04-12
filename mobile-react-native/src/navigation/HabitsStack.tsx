import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HabitsStackParamList } from './types';
import HabitsScreen from '../features/habits/screens/HabitsScreen';
import HabitDetailScreen from '../features/habits/screens/HabitDetailScreen';
import HabitGoalsScreen from '../features/habits/screens/HabitGoalsScreen';
import NutritionScreen from '../features/nutrition/screens/NutritionScreen';
import NutritionQuickAddScreen from '../features/nutrition/screens/NutritionQuickAddScreen';
import NutritionManualEntryScreen from '../features/nutrition/screens/NutritionManualEntryScreen';
import HidratacionScreen from '../features/hydration/screens/HidratacionScreen';
import RegistrarAguaScreen from '../features/hydration/screens/RegistrarAguaScreen';
import EjercicioScreen from '../features/exercise/screens/EjercicioScreen';
import RegistrarEjercicioScreen from '../features/exercise/screens/RegistrarEjercicioScreen';
import SuenoScreen from '../features/sleep/screens/SuenoScreen';
import RegistrarSuenoScreen from '../features/sleep/screens/RegistrarSuenoScreen';
import MeditacionScreen from '../features/meditation/screens/MeditacionScreen';
import RegistrarMeditacionScreen from '../features/meditation/screens/RegistrarMeditacionScreen';

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
      <Stack.Screen name="Sueno" component={SuenoScreen} />
      <Stack.Screen name="RegistrarSueno" component={RegistrarSuenoScreen} />
      <Stack.Screen name="Meditacion" component={MeditacionScreen} />
      <Stack.Screen name="RegistrarMeditacion" component={RegistrarMeditacionScreen} />
    </Stack.Navigator>
  );
}
