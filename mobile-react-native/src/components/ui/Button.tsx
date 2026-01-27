// Boton reutilizable con estilo principal.
import React from 'react';
import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSizes, radius, spacing } from '../../theme/tokens';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  rightIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  rightIcon,
  style,
  textStyle,
}: ButtonProps) {
  const isOutline = variant === 'outline';
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        isOutline ? styles.buttonOutline : styles.buttonPrimary,
        pressed ? styles.pressed : null,
        style,
      ]}
      onPress={onPress}
    >
      <View style={styles.content}>
        <Text style={[styles.text, isOutline ? styles.textOutline : null, textStyle]}>{title}</Text>
        {rightIcon ? <View style={styles.iconSlot}>{rightIcon}</View> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.lg,
    paddingVertical: spacing.mdPlus,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginTop: 2,
    minHeight: 54,
  },
  buttonPrimary: {
    backgroundColor: colors.accent,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  pressed: {
    opacity: 0.85,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSlot: {
    marginLeft: spacing.sm,
  },
  text: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.textOnAccent,
  },
  textOutline: {
    color: colors.textPrimary,
  },
});
