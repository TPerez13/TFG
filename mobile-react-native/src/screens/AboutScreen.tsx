import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AppInfoResponse } from '@muchasvidas/shared';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/layout/Screen';
import type { ProfileStackParamList } from '../navigation/types';
import { colors, fontSizes, spacing } from '../theme/tokens';
import { apiFetch } from '../services/api';

type AboutScreenProps = NativeStackScreenProps<ProfileStackParamList, 'AboutApp'>;
type ScreenState = 'loading' | 'success' | 'error';

const changelog = [
  'v0.2 - Panel diario y registro de habitos.',
  'v0.3 - Sistema de notificaciones y centro de avisos.',
  'v0.4 - Ajustes de privacidad, ayuda y soporte.',
];
const appConfig = require('../../app.json');

export default function AboutScreen({ navigation }: AboutScreenProps) {
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [appInfo, setAppInfo] = useState<AppInfoResponse | null>(null);

  const localVersion = appConfig?.expo?.version ?? '0.0.0';
  const localBuild = String(appConfig?.expo?.android?.versionCode ?? appConfig?.expo?.ios?.buildNumber ?? 'dev');

  const load = async () => {
    try {
      setScreenState('loading');
      const res = await apiFetch('/app/info');
      if (!res.ok) {
        throw new Error('No se pudo cargar /app/info');
      }
      const payload = (await res.json()) as AppInfoResponse;
      setAppInfo(payload);
      setScreenState('success');
    } catch (_error) {
      setScreenState('error');
      setAppInfo(null);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <Screen>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Sobre la App</Text>
          <View style={styles.headerSpacer} />
        </View>

        {screenState === 'loading' ? (
          <ActivityIndicator size="large" color={colors.textAccent} style={styles.loading} />
        ) : null}

        {screenState === 'error' ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>No se pudo cargar informacion remota</Text>
            <Text style={styles.statusSubtitle}>Se mostraran datos locales de la app.</Text>
            <Pressable style={styles.retryButton} onPress={() => void load()}>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : null}

        {screenState !== 'loading' ? (
          <>
            <Text style={styles.sectionTitle}>Version</Text>
            <View style={styles.card}>
              <InfoRow label="VersionName" value={localVersion} />
              <InfoRow label="BuildNumber" value={localBuild} />
              <InfoRow label="Entorno" value={appInfo?.environment ?? 'local'} />
              <InfoRow label="Commit" value={appInfo?.commitHash ?? 'N/D'} />
            </View>

            <Text style={styles.sectionTitle}>Descripcion</Text>
            <View style={styles.card}>
              <Text style={styles.paragraph}>
                MuchasVidas ayuda a registrar habitos diarios, visualizar progreso y mantener rutinas saludables con
                feedback simple.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Creditos</Text>
            <View style={styles.card}>
              <InfoRow label="Autor" value="Pablo" />
              <InfoRow label="Tutor" value="(placeholder) Tutor TFG" />
              <InfoRow label="Tecnologias" value="React Native, TypeScript, Node/Express, PostgreSQL" />
            </View>

            <Text style={styles.sectionTitle}>Changelog</Text>
            <View style={styles.card}>
              {changelog.map((item) => (
                <Text key={item} style={styles.changelogItem}>
                  {item}
                </Text>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Licencias</Text>
            <View style={styles.card}>
              <Pressable
                style={styles.licenseButton}
                onPress={() =>
                  Alert.alert(
                    'Licencias',
                    'Placeholder MVP: aqui se mostrara una lista de licencias de dependencias.'
                  )
                }
              >
                <Text style={styles.licenseButtonText}>Ver licencias</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
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
  loading: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  infoRow: {
    marginBottom: spacing.sm,
  },
  infoLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSubtle,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  paragraph: {
    fontSize: fontSizes.md,
    color: colors.textMuted,
    lineHeight: 20,
  },
  changelogItem: {
    fontSize: fontSizes.md,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  licenseButton: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 999,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  licenseButtonText: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  statusTitle: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statusSubtitle: {
    fontSize: fontSizes.md,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  retryText: {
    color: colors.textOnAccent,
    fontWeight: '700',
  },
});
