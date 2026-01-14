// Wrapper de pantalla con SafeArea y estilo base.
import React from 'react';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native';
import { baseStyles } from '../../theme/components';

type ScreenProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Screen({ children, style }: ScreenProps) {
  return <SafeAreaView style={[baseStyles.screen, style]}>{children}</SafeAreaView>;
}
