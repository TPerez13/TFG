import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/layout/Screen';
import { baseStyles } from '../theme/components';
import { colors, fontSizes, spacing } from '../theme/tokens';

export default function ProgressScreen() {
  return (
    <Screen>
      <View style={[baseStyles.content, styles.content]}>
        <Text style={styles.title}>Progreso</Text>
        <Text style={styles.subtitle}>Pantalla en construccion.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSizes.base,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
