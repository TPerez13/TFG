import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../navigation/types';
import { Screen } from '../components/layout/Screen';
import { baseStyles } from '../theme/components';
import { colors, fontSizes, spacing } from '../theme/tokens';

type InProgressProps = NativeStackScreenProps<ProfileStackParamList, 'Privacy' | 'HelpSupport' | 'AboutApp'>;

const getTitle = (routeName: InProgressProps['route']['name']) => {
  switch (routeName) {
    case 'Privacy':
      return 'Privacidad';
    case 'HelpSupport':
      return 'Ayuda y Soporte';
    case 'AboutApp':
      return 'Sobre la App';
    default:
      return 'En progreso';
  }
};

export default function InProgressScreen({ route, navigation }: InProgressProps) {
  return (
    <Screen>
      <View style={[baseStyles.content, styles.content]}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Volver"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>{getTitle(route.name)}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <Text style={styles.title}>{getTitle(route.name)}</Text>
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
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
