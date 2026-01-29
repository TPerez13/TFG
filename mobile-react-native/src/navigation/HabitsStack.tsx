import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HabitsStackParamList } from './types';
import HabitsScreen from '../screens/HabitsScreen';

const Stack = createNativeStackNavigator<HabitsStackParamList>();

export function HabitsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Habits" component={HabitsScreen} />
    </Stack.Navigator>
  );
}
