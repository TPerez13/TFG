import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen } from '../components/layout/Screen';
import { Button } from '../components/ui/Button';
import { useAuth } from '../navigation/AuthContext';
import { baseStyles } from '../theme/components';
import { colors, fontSizes, spacing } from '../theme/tokens';

export default function ProfileScreen() {
  const { signOut } = useAuth();

  return (
    <Screen>
      <View style={[baseStyles.content, styles.content]}>
        <Text style={styles.title}>Perfil</Text>
        <Text style={styles.subtitle}>Pantalla en construccion.</Text>
        <Button title="Cerrar sesion" onPress={signOut} style={styles.button} />
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
    marginBottom: spacing.xxl,
  },
  button: {
    alignSelf: 'center',
    width: '70%',
  },
});
