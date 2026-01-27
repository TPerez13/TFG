// Pantalla principal de habitos.
import React from 'react';
import { Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/layout/Screen';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme/tokens';

type HabitsScreenProps = NativeStackScreenProps<RootStackParamList, 'Habits'>;

const habits = ['Nutrition', 'Exercise', 'Meditation', 'Dream', 'Hydration'];

export default function HabitsScreen({ navigation, route }: HabitsScreenProps) {
  const user = route.params?.user;
  const token = route.params?.token;

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
      <View style={styles.navBar}>
        <Pressable
          accessibilityLabel="Perfil"
          style={({ pressed }) => [styles.navButton, pressed ? styles.navButtonPressed : null]}
          onPress={() => navigation.navigate('Feed', { user, token })}
        >
          <View style={styles.userIcon}>
            <View style={styles.userHead} />
            <View style={styles.userBody} />
          </View>
        </Pressable>
        <Pressable
          accessibilityLabel="Ideas"
          style={({ pressed }) => [styles.navButton, pressed ? styles.navButtonPressed : null]}
        >
          <View style={styles.bulbIcon}>
            <View style={styles.bulbGlass} />
            <View style={styles.bulbBase} />
          </View>
        </Pressable>
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
  navBar: {
    position: 'absolute',
    left: spacing.xxxl,
    right: spacing.xxxl,
    bottom: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  navButtonPressed: {
    opacity: 0.75,
  },
  userIcon: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  userHead: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.6,
    borderColor: colors.icon,
    marginBottom: 2,
  },
  userBody: {
    width: 18,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.6,
    borderColor: colors.icon,
  },
  bulbIcon: {
    width: 22,
    height: 24,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  bulbGlass: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.6,
    borderColor: colors.icon,
  },
  bulbBase: {
    marginTop: 3,
    width: 10,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.icon,
  },
});
