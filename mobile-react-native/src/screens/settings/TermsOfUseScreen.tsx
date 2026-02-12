import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../../components/layout/Screen';
import { LegalSection } from '../../components/settings/LegalSection';
import { TERMS_OF_USE_LAST_UPDATED, TERMS_OF_USE_SECTIONS } from '../../content/terms';
import type { ProfileStackParamList } from '../../navigation/types';
import { colors, fontSizes, spacing } from '../../theme/tokens';

type TermsOfUseScreenProps = NativeStackScreenProps<ProfileStackParamList, 'TermsOfUse'>;

export default function TermsOfUseScreen({ navigation }: TermsOfUseScreenProps) {
  return (
    <Screen>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton} accessibilityLabel="Volver">
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Terminos de uso</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Text style={styles.documentTitle}>Terminos de uso</Text>
        <Text style={styles.lastUpdated}>Ultima actualizacion: {TERMS_OF_USE_LAST_UPDATED}</Text>

        <View style={styles.card}>
          {TERMS_OF_USE_SECTIONS.map((section, index) => (
            <View key={section.title}>
              <LegalSection title={section.title} body={section.body} />
              {index < TERMS_OF_USE_SECTIONS.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.contentTop,
    paddingBottom: spacing.contentBottom + 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
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
  documentTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  lastUpdated: {
    fontSize: fontSizes.sm,
    color: colors.textSubtle,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
});
