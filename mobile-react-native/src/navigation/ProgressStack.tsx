import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProgressStackParamList } from './types';
import MonthlyProgressScreen from '../features/progress/screens/MonthlyProgressScreen';
import HistoryScreen from '../features/progress/screens/HistoryScreen';
import DayHistoryDetailScreen from '../features/progress/screens/DayHistoryDetailScreen';
import HabitHistoryScreen from '../features/progress/screens/HabitHistoryScreen';
import HabitDetailScreen from '../features/progress/screens/HabitDetailScreen';

const Stack = createNativeStackNavigator<ProgressStackParamList>();

export function ProgressStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Progress" component={MonthlyProgressScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="DayHistoryDetail" component={DayHistoryDetailScreen} />
      <Stack.Screen name="HabitHistory" component={HabitHistoryScreen} />
      <Stack.Screen name="HabitDetail" component={HabitDetailScreen} />
    </Stack.Navigator>
  );
}
