import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/layout/Screen';
import type { HabitsStackParamList } from '../navigation/types';
import { baseStyles } from '../theme/components';
import { colors, fontSizes, spacing } from '../theme/tokens';

type HabitGoalsScreenProps = NativeStackScreenProps<HabitsStackParamList, 'HabitGoals'>;

export default function HabitGoalsScreen({ navigation }: HabitGoalsScreenProps) {
  return (
    <Screen>
      <View style={[baseStyles.content, styles.content]}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Volver"
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backButton, pressed ? styles.backPressed : null]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Editar metas</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.title}>Configurar metas diarias</Text>
        <Text style={styles.subtitle}>Esta pantalla es un placeholder para edicion de metas.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    position: 'absolute',
    top: spacing.contentTop,
    left: spacing.xxl,
    right: spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: {
    opacity: 0.85,
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  title: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: fontSizes.base,
    color: colors.textMuted,
  },
});
