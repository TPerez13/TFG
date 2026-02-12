import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { PrivacyPreferences, UserDataExport, UserSummary } from '@muchasvidas/shared';
import { Screen } from '../components/layout/Screen';
import { DangerZone, ReadOnlyFieldRow, SettingsSection, ToggleRow } from '../components/settings/PrivacyBlocks';
import type { ProfileStackParamList } from '../navigation/types';
import { colors, fontSizes, spacing } from '../theme/tokens';
import { apiFetch } from '../services/api';
import { useAuth } from '../navigation/AuthContext';
import {
  defaultPrivacyPreferences,
  hasCompletePrivacyPreferences,
  normalizePrivacyPreferences,
} from '../features/users/preferences';
import { useMe } from '../features/users/useMe';
import { useUpdatePreferences } from '../features/users/useUpdatePreferences';

type PrivacyScreenProps = NativeStackScreenProps<ProfileStackParamList, 'Privacy'>;
type Banner = { type: 'success' | 'error'; message: string } | null;

const INFO_LAST_UPDATED = '12 de febrero de 2026';
const SUPPORT_EMAIL = 'soporte@muchasvidas.com';
const DELETE_KEYWORD = 'ELIMINAR';

const asMap = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const makeDummyExport = (
  user: UserSummary | null,
  privacy: PrivacyPreferences
): UserDataExport & { preferencias: Record<string, unknown>; notifications: unknown[] } => ({
  generatedAt: new Date().toISOString(),
  user: user ?? { id: 0, nombre: 'Usuario', correo: 'no-disponible@local' },
  habits: [],
  preferencias: { privacidad: privacy },
  notifications: [],
});

export default function PrivacyScreen({ navigation }: PrivacyScreenProps) {
  const { signOut } = useAuth();
  const { user, setUser, loading, error, reload } = useMe();
  const { saving, error: updateError, clearError, updatePreferences } = useUpdatePreferences();

  const [privacy, setPrivacy] = useState<PrivacyPreferences>(defaultPrivacyPreferences);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [banner, setBanner] = useState<Banner>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  const hydratedRef = useRef<number | null>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isBusy = saving || exporting || deleting;
  const canConfirmDelete = deleteInput.trim().toUpperCase() === DELETE_KEYWORD && !deleting;

  const showBanner = (type: 'success' | 'error', message: string, autoHideMs = 2200) => {
    setBanner({ type, message });
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
    }
    if (autoHideMs > 0) {
      bannerTimerRef.current = setTimeout(() => setBanner(null), autoHideMs);
    }
  };

  const persistPrivacy = async (next: PrivacyPreferences, silent = false): Promise<boolean> => {
    if (!user) return false;

    const merged = await updatePreferences(asMap(user.preferencias), { privacidad: next });
    if (!merged) {
      return false;
    }

    setUser((current) => (current ? { ...current, preferencias: merged } : current));
    if (!silent) {
      showBanner('success', 'Guardado');
    }
    return true;
  };

  useEffect(() => {
    if (!user) return;

    const currentPrefs = asMap(user.preferencias);
    const normalized = normalizePrivacyPreferences(currentPrefs.privacidad);
    setPrivacy(normalized);

    if (!hasCompletePrivacyPreferences(currentPrefs.privacidad) && hydratedRef.current !== user.id) {
      hydratedRef.current = user.id;
      void persistPrivacy(normalized, true);
    }
  }, [user]);

  useEffect(() => {
    if (updateError) {
      showBanner('error', updateError, 0);
    }
  }, [updateError]);

  useEffect(() => {
    return () => {
      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current);
      }
    };
  }, []);

  const onToggle = async (key: keyof PrivacyPreferences, value: boolean) => {
    if (!user || isBusy) return;

    clearError();
    const previous = privacy;
    const next = { ...privacy, [key]: value };
    setPrivacy(next);

    const ok = await persistPrivacy(next);
    if (!ok) {
      setPrivacy(previous);
    }
  };

  const runExport = async () => {
    try {
      setExporting(true);
      clearError();

      let payload: unknown;
      const response = await apiFetch('/users/me/export');

      if (response.status === 401) {
        await signOut();
        return;
      }

      if (response.status === 404) {
        // TODO: remove fallback once every environment has /users/me/export enabled.
        payload = makeDummyExport(user, privacy);
      } else if (!response.ok) {
        throw new Error('Export endpoint failed.');
      } else {
        payload = (await response.json()) as UserDataExport;
      }

      await Share.share({
        title: 'Exportacion de datos - MuchasVidas',
        message: JSON.stringify(payload, null, 2),
      });

      showBanner('success', 'Exportacion lista para compartir.');
    } catch (_error) {
      showBanner('error', 'No se pudo completar la exportacion.');
    } finally {
      setExporting(false);
    }
  };

  const confirmExport = () => {
    Alert.alert(
      'Descargar mis datos',
      'Se incluira perfil, preferencias, registros de habitos y notificaciones. La generacion puede tardar unos segundos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Continuar', onPress: () => void runExport() },
      ]
    );
  };

  const runDelete = async () => {
    try {
      setDeleting(true);
      const response = await apiFetch('/users/me', { method: 'DELETE' });

      if (response.status === 401) {
        await signOut();
        return;
      }

      if (!response.ok) {
        throw new Error('Delete failed.');
      }

      setDeleteModalVisible(false);
      setDeleteInput('');
      await signOut();
    } catch (_error) {
      showBanner('error', 'No se pudo eliminar la cuenta. Intenta nuevamente.', 0);
    } finally {
      setDeleting(false);
    }
  };

  const startDeleteFlow = () => {
    Alert.alert(
      'Eliminar mi cuenta',
      'Esta accion borra tu cuenta y datos asociados. Luego tendras que confirmar escribiendo ELIMINAR.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Continuar', style: 'destructive', onPress: () => setDeleteModalVisible(true) },
      ]
    );
  };

  return (
    <Screen>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton} accessibilityLabel="Volver">
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Privacidad</Text>
          <View style={styles.headerSpacer} />
        </View>

        {banner ? (
          <View style={[styles.banner, banner.type === 'error' ? styles.bannerError : styles.bannerSuccess]}>
            <Text style={styles.bannerText}>{banner.message}</Text>
          </View>
        ) : null}

        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>No se pudo cargar la configuracion de privacidad</Text>
            <Text style={styles.errorDescription}>Comprueba tu conexion y vuelve a intentarlo.</Text>
            <Pressable style={styles.retryButton} onPress={() => void reload()}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <SettingsSection
              title="Datos de la cuenta"
              subtitle="Consulta tu informacion principal. Estos campos son solo lectura."
            >
              <ReadOnlyFieldRow label="Correo" value={user?.correo ?? 'No disponible'} />
              <ReadOnlyFieldRow label="Nombre" value={user?.nombre ?? 'No disponible'} hideDivider />
              <Pressable
                style={[styles.actionButton, isBusy ? styles.buttonDisabled : null]}
                onPress={confirmExport}
                disabled={isBusy}
              >
                {exporting ? (
                  <ActivityIndicator size="small" color={colors.textOnAccent} />
                ) : (
                  <Text style={styles.actionButtonText}>Descargar mis datos</Text>
                )}
              </Pressable>
            </SettingsSection>

            <SettingsSection
              title="Control de datos"
              subtitle="Decide como se usan tus datos para analisis y personalizacion."
            >
              <ToggleRow
                label="Permitir analitica"
                description="Nos ayuda a mejorar estabilidad y experiencia general."
                value={privacy.analyticsEnabled}
                disabled={isBusy}
                onValueChange={(value) => void onToggle('analyticsEnabled', value)}
              />
              <ToggleRow
                label="Personalizacion"
                description="Adapta sugerencias y contenidos a tu actividad."
                value={privacy.personalizationEnabled}
                disabled={isBusy}
                onValueChange={(value) => void onToggle('personalizationEnabled', value)}
                hideDivider
              />
            </SettingsSection>

            <SettingsSection
              title="Privacidad de notificaciones"
              subtitle="Controla la visibilidad del contenido mostrado en avisos."
            >
              <ToggleRow
                label="Mostrar contenido en pantalla bloqueada"
                description="Depende del sistema operativo. Esta preferencia se guarda dentro de la app."
                value={privacy.lockScreenContent}
                disabled={isBusy}
                onValueChange={(value) => void onToggle('lockScreenContent', value)}
                hideDivider
              />
            </SettingsSection>

            <SettingsSection
              title="Gestion"
              subtitle="Acciones sensibles sobre tu cuenta y tus datos."
            >
              <DangerZone
                description="Si eliminas la cuenta perderas acceso a registros, preferencias y configuraciones."
                warning="Esta accion es irreversible."
                buttonLabel={deleting ? 'Eliminando...' : 'Eliminar mi cuenta'}
                disabled={isBusy}
                onPress={startDeleteFlow}
              />
            </SettingsSection>

            <SettingsSection title="Informacion" subtitle="Detalles y contacto relacionados con privacidad.">
              <ReadOnlyFieldRow label="Ultima actualizacion" value={INFO_LAST_UPDATED} />
              <ReadOnlyFieldRow label="Contacto" value={SUPPORT_EMAIL} hideDivider />
            </SettingsSection>
          </>
        )}
      </ScrollView>

      <Modal visible={deleteModalVisible} transparent animationType="fade" onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirmacion final</Text>
            <Text style={styles.modalText}>
              Escribe <Text style={styles.modalKeyword}>{DELETE_KEYWORD}</Text> para confirmar que quieres eliminar tu cuenta.
            </Text>
            <TextInput
              value={deleteInput}
              onChangeText={setDeleteInput}
              autoCapitalize="characters"
              placeholder={DELETE_KEYWORD}
              placeholderTextColor={colors.placeholder}
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalSecondary]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setDeleteInput('');
                }}
              >
                <Text style={styles.modalSecondaryText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalDanger, !canConfirmDelete ? styles.buttonDisabled : null]}
                onPress={() => void runDelete()}
                disabled={!canConfirmDelete}
              >
                <Text style={styles.modalDangerText}>Eliminar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function LoadingSkeleton() {
  return (
    <View>
      {[0, 1, 2].map((index) => (
        <View key={index} style={styles.skeletonCard}>
          <View style={styles.skeletonLineLong} />
          <View style={styles.skeletonLineMedium} />
          <View style={styles.skeletonLineShort} />
        </View>
      ))}
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
  banner: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  bannerSuccess: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.accent,
  },
  bannerError: {
    backgroundColor: '#fff0f0',
    borderColor: '#ffb3b3',
  },
  bannerText: {
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  actionButton: {
    marginTop: spacing.md,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    minHeight: 46,
  },
  actionButtonText: {
    color: colors.textOnAccent,
    fontSize: fontSizes.base,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  errorCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.lg,
  },
  errorTitle: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  errorDescription: {
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
  retryButtonText: {
    color: colors.textOnAccent,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  modalText: {
    fontSize: fontSizes.md,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  modalKeyword: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  modalSecondary: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surfaceMuted,
  },
  modalDanger: {
    borderWidth: 1,
    borderColor: '#d94141',
    backgroundColor: '#fbe9e9',
  },
  modalSecondaryText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  modalDangerText: {
    color: '#b52d2d',
    fontWeight: '700',
  },
  skeletonCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  skeletonLineLong: {
    height: 14,
    width: '80%',
    backgroundColor: colors.surfaceBorder,
    borderRadius: 999,
    marginBottom: spacing.sm,
  },
  skeletonLineMedium: {
    height: 12,
    width: '55%',
    backgroundColor: colors.surfaceBorder,
    borderRadius: 999,
    marginBottom: spacing.sm,
  },
  skeletonLineShort: {
    height: 12,
    width: '35%',
    backgroundColor: colors.surfaceBorder,
    borderRadius: 999,
  },
});
