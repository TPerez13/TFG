// Boton reutilizable con estilo principal.
import React from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fontSizes, radius, spacing } from '../../theme/tokens';

type ButtonProps = {
  title: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function Button({ title, onPress, style, textStyle }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, pressed ? styles.pressed : null, style]}
      onPress={onPress}
    >
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: 2,
  },
  pressed: {
    opacity: 0.85,
  },
  text: {
    fontSize: fontSizes.base,
    fontWeight: '600',
    color: colors.textOnAccent,
  },
});
