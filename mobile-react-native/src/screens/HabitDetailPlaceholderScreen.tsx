import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/layout/Screen';
import type { ProgressStackParamList } from '../navigation/types';
import { baseStyles } from '../theme/components';
import { colors, spacing } from '../theme/tokens';

type HabitDetailPlaceholderScreenProps = NativeStackScreenProps<
  ProgressStackParamList,
  'HabitDetailPlaceholder'
>;

export default function HabitDetailPlaceholderScreen({
  navigation,
  route,
}: HabitDetailPlaceholderScreenProps) {
  const { habitKey } = route.params;

  return (
    <Screen>
      <View style={[baseStyles.content, styles.content]}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backButton, pressed ? styles.pressed : null]}
          >
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Detalle del Habito</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.title}>Detalle para {habitKey}</Text>
        <Text style={styles.subtitle}>Esta vista aun no esta disponible para este habito.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#101714',
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  pressed: {
    opacity: 0.82,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
  },
});

