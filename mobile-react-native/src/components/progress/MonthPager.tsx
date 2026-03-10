import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../../theme/tokens';

type MonthPagerProps = {
  monthLabel: string;
  disablePrev: boolean;
  disableNext: boolean;
  onPrev: () => void;
  onNext: () => void;
};

export function MonthPager({ monthLabel, disablePrev, disableNext, onPrev, onNext }: MonthPagerProps) {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mes anterior"
        disabled={disablePrev}
        onPress={onPrev}
        style={({ pressed }) => [
          styles.navButton,
          disablePrev ? styles.disabled : null,
          pressed && !disablePrev ? styles.pressed : null,
        ]}
      >
        <Ionicons name="chevron-back" size={22} color={disablePrev ? '#9aa7a0' : colors.textPrimary} />
      </Pressable>

      <Text style={styles.label}>{monthLabel}</Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mes siguiente"
        disabled={disableNext}
        onPress={onNext}
        style={({ pressed }) => [
          styles.navButton,
          disableNext ? styles.disabled : null,
          pressed && !disableNext ? styles.pressed : null,
        ]}
      >
        <Ionicons name="chevron-forward" size={22} color={disableNext ? '#9aa7a0' : colors.textPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  navButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ebefec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.8,
  },
});
