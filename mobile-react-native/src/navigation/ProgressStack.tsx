import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProgressStackParamList } from './types';
import MonthlyProgressScreen from '../screens/MonthlyProgressScreen';
import HistoryScreen from '../screens/HistoryScreen';
import DayHistoryDetailScreen from '../screens/DayHistoryDetailScreen';
import HabitHistoryScreen from '../screens/HabitHistoryScreen';
import HabitDetailPlaceholderScreen from '../screens/HabitDetailPlaceholderScreen';

const Stack = createNativeStackNavigator<ProgressStackParamList>();

export function ProgressStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Progress" component={MonthlyProgressScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="DayHistoryDetail" component={DayHistoryDetailScreen} />
      <Stack.Screen name="HabitHistory" component={HabitHistoryScreen} />
      <Stack.Screen name="HabitDetailPlaceholder" component={HabitDetailPlaceholderScreen} />
    </Stack.Navigator>
  );
}
