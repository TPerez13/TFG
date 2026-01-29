// Pantalla principal de habitos.
import React from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/layout/Screen';
import type { HabitsStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme/tokens';

type HabitsScreenProps = NativeStackScreenProps<HabitsStackParamList, 'Habits'>;

const habits = ['Nutrition', 'Exercise', 'Meditation', 'Dream', 'Hydration'];

export default function HabitsScreen({}: HabitsScreenProps) {
  return (
    <Screen>
      <StatusBar barStyle="dark-content" />
      <View pointerEvents="none" style={styles.background}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Your Habits</Text>
        <View style={styles.list}>
          {habits.map((habit) => (
            <Text key={habit} style={styles.habitText}>
              {habit}
            </Text>
          ))}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  glowTop: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.glowTop,
    opacity: 0.45,
    top: -160,
    left: -80,
  },
  glowBottom: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: colors.glowBottom,
    opacity: 0.35,
    bottom: -180,
    right: -120,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.contentTop,
    paddingBottom: spacing.contentBottom + 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xxl,
  },
  list: {
    alignItems: 'center',
    gap: spacing.xl,
  },
  habitText: {
    fontSize: 22,
    color: colors.textMuted,
    letterSpacing: 0.4,
  },
});
