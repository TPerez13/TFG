// Input reutilizable con icono y contenido opcional a la derecha.
import React from 'react';
import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, TextInputProps, ViewStyle } from 'react-native';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, fontSizes, radius, spacing } from '../../theme/tokens';

type InputProps = Omit<TextInputProps, 'style'> & {
  icon?: string;
  right?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

export function Input({
  icon,
  right,
  containerStyle,
  inputStyle,
  placeholderTextColor = colors.placeholder,
  ...props
}: InputProps) {
  return (
    <View style={[styles.row, containerStyle]}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <TextInput
        {...props}
        style={[styles.input, inputStyle]}
        placeholderTextColor={placeholderTextColor}
      />
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.outline,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
    minHeight: 54,
  },
  icon: {
    width: 22,
    textAlign: 'center',
    color: colors.textAccent,
    fontSize: fontSizes.base,
  },
  input: {
    flex: 1,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
});
