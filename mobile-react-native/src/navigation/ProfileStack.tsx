import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from './types';
import ProfileScreen from '../features/profile/screens/ProfileScreen';
import EditProfileScreen from '../features/profile/screens/EditProfileScreen';
import HabitGoalsScreen from '../features/habits/screens/HabitGoalsScreen';
import FeedScreen from '../features/profile/screens/FeedScreen';
import NotificationSettingsScreen from '../features/notifications/screens/NotificationSettingsScreen';
import PrivacyScreen from '../features/profile/screens/PrivacyScreen';
import SupportScreen from '../features/profile/screens/SupportScreen';
import AboutScreen from '../features/profile/screens/AboutScreen';
import AchievementsScreen from '../features/achievements/screens/AchievementsScreen';
import PrivacyPolicyScreen from '../features/profile/screens/PrivacyPolicyScreen';
import TermsOfUseScreen from '../features/profile/screens/TermsOfUseScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="HabitGoals" component={HabitGoalsScreen} />
      <Stack.Screen name="AchievementsScreen" component={AchievementsScreen} />
      <Stack.Screen name="Feed" component={FeedScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} />
      <Stack.Screen name="HelpSupport" component={SupportScreen} />
      <Stack.Screen name="AboutApp" component={AboutScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="TermsOfUse" component={TermsOfUseScreen} />
    </Stack.Navigator>
  );
}
