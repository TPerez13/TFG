import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { HomeStackParamList } from './types';
import PanelDiarioScreen from '../features/home/screens/PanelDiarioScreen';

const Stack = createNativeStackNavigator<HomeStackParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PanelDiario" component={PanelDiarioScreen} />
    </Stack.Navigator>
  );
}
