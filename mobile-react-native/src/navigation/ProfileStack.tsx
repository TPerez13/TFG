import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from './types';
import ProfileScreen from '../screens/ProfileScreen';
import FeedScreen from '../screens/FeedScreen';
import InProgressScreen from '../screens/InProgressScreen';
import NotificationDetailScreen from '../screens/NotificationDetailScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Feed" component={FeedScreen} />
      <Stack.Screen name="NotificationDetail" component={NotificationDetailScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="Privacy" component={InProgressScreen} />
      <Stack.Screen name="HelpSupport" component={InProgressScreen} />
      <Stack.Screen name="AboutApp" component={InProgressScreen} />
    </Stack.Navigator>
  );
}
