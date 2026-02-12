import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { PrivacyPreferences, UserDataExport, UserSummary } from '@muchasvidas/shared';
import { Screen } from '../components/layout/Screen';
import type { ProfileStackParamList } from '../navigation/types';
import { colors, fontSizes, spacing } from '../theme/tokens';
import { apiFetch } from '../services/api';
import { useAuth } from '../navigation/AuthContext';

type PrivacyScreenProps = NativeStackScreenProps<ProfileStackParamList, 'Privacy'>;
type ScreenState = 'loading' | 'success' | 'error';
type Feedback = { type: 'success' | 'error'; message: string } | null;

const defaultPrivacy: PrivacyPreferences = {
  permitirAnalitica: true,
  personalizacion: true,
  mostrarContenidoEnPantallaBloqueada: false,
};

const normalizePrivacy = (value: unknown): PrivacyPreferences => {
  const raw = (value as Partial<PrivacyPreferences> | undefined) ?? {};
  return {
    permitirAnalitica:
      typeof raw.permitirAnalitica === 'boolean' ? raw.permitirAnalitica : defaultPrivacy.permitirAnalitica,
    personalizacion: typeof raw.personalizacion === 'boolean' ? raw.personalizacion : defaultPrivacy.personalizacion,
    mostrarContenidoEnPantallaBloqueada:
      typeof raw.mostrarContenidoEnPantallaBloqueada === 'boolean'
        ? raw.mostrarContenidoEnPantallaBloqueada
        : defaultPrivacy.mostrarContenidoEnPantallaBloqueada,
  };
};

const hasFullPrivacy = (value: unknown): boolean => {
  if (!value || typeof value !== 'object') return false;
  const current = value as Partial<PrivacyPreferences>;
  return (
    typeof current.permitirAnalitica === 'boolean' &&
    typeof current.personalizacion === 'boolean' &&
    typeof current.mostrarContenidoEnPantallaBloqueada === 'boolean'
  );
};

export default function PrivacyScreen({ navigation }: PrivacyScreenProps) {
  const { signOut } = useAuth();
  const [screenState, setScreenState] = useState<ScreenState>('loading');
  const [user, setUser] = useState<UserSummary | null>(null);
  const [privacy, setPrivacy] = useState<PrivacyPreferences>(defaultPrivacy);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const savePrivacy = async (next: PrivacyPreferences, silent = false): Promise<boolean> => {
    try {
      setSaving(true);
      const res = await apiFetch('/users/me', {
        method: 'PUT',
        body: JSON.stringify({ preferencias: { privacidad: next } }),
      });

      if (res.status === 401) {
        await signOut();
        return false;
      }

      if (!res.ok) {
        throw new Error('No se pudieron guardar las preferencias.');
      }

      if (!silent) {
        setFeedback({ type: 'success', message: 'Preferencias de privacidad guardadas.' });
      }
      return true;
    } catch (_error) {
      setFeedback({ type: 'error', message: 'Error al guardar tus preferencias.' });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const load = async () => {
    try {
      setScreenState('loading');
      setFeedback(null);
      const res = await apiFetch('/users/me');

      if (res.status === 401) {
        await signOut();
        return;
      }
      if (!res.ok) {
        throw new Error('No se pudo cargar el perfil.');
      }

      const payload = (await res.json()) as { user?: UserSummary };
      const currentUser = payload.user ?? null;
      const prefs = (currentUser?.preferencias as Record<string, unknown> | null) ?? null;
      const currentPrivacy = normalizePrivacy(prefs?.privacidad);

      setUser(currentUser);
      setPrivacy(currentPrivacy);
      setScreenState('success');

      if (!hasFullPrivacy(prefs?.privacidad)) {
        await savePrivacy(currentPrivacy, true);
      }
    } catch (_error) {
      setScreenState('error');
      setFeedback({ type: 'error', message: 'No se pudo cargar la configuracion de privacidad.' });
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const updateToggle = async (key: keyof PrivacyPreferences, value: boolean) => {
    const previous = privacy;
    const next = { ...privacy, [key]: value };
    setPrivacy(next);
    const ok = await savePrivacy(next);
    if (!ok) {
      setPrivacy(previous);
    }
  };

  const downloadData = async () => {
    try {
      setExporting(true);
      setFeedback(null);
      const res = await apiFetch('/users/me/export');

      if (res.status === 401) {
        await signOut();
        return;
      }
      if (!res.ok) {
        throw new Error('No se pudo generar la exportacion.');
      }

      const payload = (await res.json()) as UserDataExport;
      await Share.share({
        title: 'Exportacion de datos - MuchasVidas',
        message: JSON.stringify(payload, null, 2),
      });

      setFeedback({
        type: 'success',
        message: `Exportacion JSON lista (${payload.habits.length} registros de habitos).`,
      });
    } catch (_error) {
      setFeedback({ type: 'error', message: 'No se pudo descargar la exportacion JSON.' });
    } finally {
      setExporting(false);
    }
  };

  const deleteAccount = async () => {
    try {
      setDeleting(true);
      setFeedback(null);
      const res = await apiFetch('/users/me', { method: 'DELETE' });

      if (res.status === 401) {
        await signOut();
        return;
      }
      if (!res.ok) {
        throw new Error('No se pudo eliminar la cuenta.');
      }

      await signOut();
    } catch (_error) {
      setFeedback({ type: 'error', message: 'No se pudo eliminar la cuenta.' });
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Eliminar mi cuenta', 'Se borraran tu cuenta y todos tus datos.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Continuar',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Confirmacion final', 'Esta accion es irreversible. Deseas continuar?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Si, eliminar', style: 'destructive', onPress: () => void deleteAccount() },
          ]);
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Privacidad</Text>
          <View style={styles.headerSpacer} />
        </View>

        {screenState === 'loading' ? (
          <ActivityIndicator size="large" color={colors.textAccent} style={styles.loading} />
        ) : null}

        {screenState === 'error' ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Error al cargar privacidad</Text>
            <Text style={styles.statusSubtitle}>Reintenta para recuperar tus datos de cuenta.</Text>
            <Pressable style={styles.retryButton} onPress={() => void load()}>
              <Text style={styles.retryText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : null}

        {screenState === 'success' ? (
          <>
            {feedback ? (
              <View style={[styles.feedback, feedback.type === 'error' ? styles.feedbackError : styles.feedbackOk]}>
                <Text style={styles.feedbackText}>{feedback.message}</Text>
              </View>
            ) : null}

            <Text style={styles.sectionTitle}>Datos de la cuenta</Text>
            <View style={styles.card}>
              <ReadonlyRow label="Correo" value={user?.correo ?? 'No disponible'} />
              <ReadonlyRow label="Nombre" value={user?.nombre ?? 'No disponible'} />
              <Pressable
                style={[styles.primaryButton, exporting ? styles.buttonDisabled : null]}
                disabled={exporting}
                onPress={() => void downloadData()}
              >
                <Text style={styles.primaryButtonText}>
                  {exporting ? 'Generando exportacion...' : 'Descargar mis datos'}
                </Text>
              </Pressable>
            </View>

            <Text style={styles.sectionTitle}>Control de datos</Text>
            <View style={styles.card}>
              <ToggleRow
                label="Permitir analitica"
                value={privacy.permitirAnalitica}
                disabled={saving}
                onValueChange={(value) => void updateToggle('permitirAnalitica', value)}
              />
              <ToggleRow
                label="Personalizacion"
                value={privacy.personalizacion}
                disabled={saving}
                onValueChange={(value) => void updateToggle('personalizacion', value)}
              />
            </View>

            <Text style={styles.sectionTitle}>Privacidad de notificaciones</Text>
            <View style={styles.card}>
              <ToggleRow
                label="Mostrar contenido en pantalla bloqueada"
                value={privacy.mostrarContenidoEnPantallaBloqueada}
                disabled={saving}
                onValueChange={(value) => void updateToggle('mostrarContenidoEnPantallaBloqueada', value)}
              />
            </View>

            <Text style={styles.sectionTitle}>Gestion</Text>
            <View style={styles.card}>
              <Pressable
                style={[styles.dangerButton, deleting ? styles.buttonDisabled : null]}
                disabled={deleting}
                onPress={confirmDelete}
              >
                <Text style={styles.dangerButtonText}>{deleting ? 'Eliminando...' : 'Eliminar mi cuenta'}</Text>
              </Pressable>
              <Text style={styles.legalText}>Esta accion es irreversible.</Text>
            </View>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

type ToggleRowProps = {
  label: string;
  value: boolean;
  disabled?: boolean;
  onValueChange: (value: boolean) => void;
};

function ToggleRow({ label, value, disabled, onValueChange }: ToggleRowProps) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{ true: colors.accent, false: colors.surfaceBorder }}
      />
    </View>
  );
}

type ReadonlyRowProps = {
  label: string;
  value: string;
};

function ReadonlyRow({ label, value }: ReadonlyRowProps) {
  return (
    <View style={styles.readonlyRow}>
      <Text style={styles.readonlyLabel}>{label}</Text>
      <Text style={styles.readonlyValue}>{value}</Text>
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
  statusCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.lg,
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
  feedback: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  feedbackOk: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.accent,
  },
  feedbackError: {
    backgroundColor: '#fff0f0',
    borderColor: '#ffb3b3',
  },
  feedbackText: {
    fontSize: fontSizes.md,
    color: colors.textPrimary,
  },
  readonlyRow: {
    marginBottom: spacing.md,
  },
  readonlyLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSubtle,
    marginBottom: spacing.xs,
  },
  readonlyValue: {
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  toggleLabel: {
    flex: 1,
    paddingRight: spacing.md,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  primaryButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.textOnAccent,
    fontSize: fontSizes.base,
    fontWeight: '700',
  },
  dangerButton: {
    backgroundColor: '#fbe9e9',
    borderWidth: 1,
    borderColor: '#d94141',
    borderRadius: 999,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#b52d2d',
    fontSize: fontSizes.base,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  legalText: {
    marginTop: spacing.sm,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
});
