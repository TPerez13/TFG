import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Screen } from '../components/layout/Screen';
import { useAuth } from '../navigation/AuthContext';
import { apiFetch } from '../services/api';
import type { User } from '../types/models';
import type { ProfileStackParamList } from '../navigation/types';
import { baseStyles } from '../theme/components';
import { colors, fontSizes, spacing } from '../theme/tokens';
import { SettingsRow } from '../components/settings/SettingsRow';
import {
  avatarPresets,
  getAvatarIdFromPreferences,
  getAvatarPresetById,
} from '../features/users/avatarPresets';

type ProfileScreenProps = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { signOut } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const loadUser = async () => {
        try {
          setLoading(true);
          const res = await apiFetch('/users/me');
          if (res.status === 401) {
            await signOut();
            return;
          }
          if (!res.ok) return;
          const payload = (await res.json()) as { user?: User };
          if (active) setUser(payload.user ?? null);
        } finally {
          if (active) setLoading(false);
        }
      };
      void loadUser();
      return () => {
        active = false;
      };
    }, [signOut])
  );

  const displayName = user?.nombre ?? user?.username ?? user?.correo ?? 'Usuario';
  const memberSince = user?.f_creacion ? new Date(user.f_creacion).getFullYear() : null;
  const selectedAvatarId = getAvatarIdFromPreferences(user?.preferencias ?? null);
  const selectedAvatar = getAvatarPresetById(selectedAvatarId);

  const handleSelectAvatar = async (avatarId: string) => {
    if (!user || avatarSaving) return;
    if (avatarId === selectedAvatarId) {
      setAvatarModalVisible(false);
      return;
    }

    try {
      setAvatarSaving(true);
      const response = await apiFetch('/users/me', {
        method: 'PUT',
        body: JSON.stringify({
          preferencias: {
            perfil: {
              avatarId,
            },
          },
        }),
      });

      if (response.status === 401) {
        await signOut();
        return;
      }

      if (!response.ok) {
        throw new Error('No se pudo actualizar el avatar.');
      }

      const payload = (await response.json()) as {
        user?: User;
        preferencias?: Record<string, unknown> | null;
      };

      setUser((current) => {
        const nextUser = payload.user ?? current;
        if (!nextUser) return current;
        return {
          ...nextUser,
          preferencias: payload.preferencias ?? payload.user?.preferencias ?? nextUser.preferencias ?? null,
        };
      });
      setAvatarModalVisible(false);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo actualizar el avatar.');
    } finally {
      setAvatarSaving(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={[baseStyles.content, styles.content]}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Perfil de Usuario</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cambiar avatar"
          disabled={loading || avatarSaving || !user}
          onPress={() => setAvatarModalVisible(true)}
          style={({ pressed }) => [
            styles.avatarButton,
            loading || avatarSaving || !user ? styles.avatarDisabled : null,
            pressed && !loading && !avatarSaving && user ? styles.buttonPressed : null,
          ]}
        >
          <View style={styles.avatarWrap}>
            <View style={[styles.avatarOuter, { borderColor: selectedAvatar.ringColor }]}>
              <View style={[styles.avatarInner, { backgroundColor: selectedAvatar.bgColor }]}>
                <Ionicons name={selectedAvatar.icon as any} size={64} color={selectedAvatar.iconColor} />
              </View>
            </View>
          </View>
          <Text style={styles.avatarHint}>Toca para cambiar avatar</Text>
        </Pressable>

        {loading && <ActivityIndicator color={colors.textAccent} style={styles.profileLoader} />}

        {!loading && (
          <>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.memberSince}>{memberSince ? `Miembro desde ${memberSince}` : 'Miembro desde 2023'}</Text>
          </>
        )}

        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('EditProfile')}
          style={({ pressed }) => [styles.editButton, pressed ? styles.buttonPressed : null]}
        >
          <Text style={styles.editButtonText}>Editar Perfil</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Ajustes de la App</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="notifications"
            title="Notificaciones"
            subtitle="Gestiona avisos y recordatorios"
            onPress={() => navigation.navigate('NotificationSettings')}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="shield-checkmark"
            title="Privacidad"
            subtitle="Gestiona tus datos y preferencias"
            onPress={() => navigation.navigate('Privacy')}
          />
        </View>

        <Text style={styles.sectionTitle}>Soporte</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="help-circle"
            title="Ayuda y Soporte"
            subtitle="FAQ, contacto y reporte de errores"
            onPress={() => navigation.navigate('HelpSupport')}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="information-circle"
            title="Sobre la App"
            subtitle="Version, creditos y licencias"
            onPress={() => navigation.navigate('AboutApp')}
          />
        </View>

        <Text style={styles.sectionTitle}>Politica / Terminos</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="document-text"
            title="Politica de privacidad"
            subtitle="Como usamos y protegemos tus datos"
            onPress={() => navigation.navigate('PrivacyPolicy')}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="newspaper"
            title="Terminos de uso"
            subtitle="Condiciones generales de uso de la app"
            onPress={() => navigation.navigate('TermsOfUse')}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.logoutButton, pressed ? styles.logoutPressed : null]}
          onPress={signOut}
        >
          <Ionicons name="log-out-outline" size={20} color="#d94141" />
          <Text style={styles.logoutText}>Cerrar Sesion</Text>
        </Pressable>

        <Text style={styles.footerText}>TrackHabit Loop esta disenado para ti.</Text>
      </ScrollView>

      <Modal
        visible={avatarModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Elige tu avatar</Text>
            <View style={styles.avatarGrid}>
              {avatarPresets.map((preset) => {
                const selected = selectedAvatarId === preset.id;
                return (
                  <Pressable
                    key={preset.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Avatar ${preset.label}`}
                    disabled={avatarSaving}
                    onPress={() => {
                      void handleSelectAvatar(preset.id);
                    }}
                    style={({ pressed }) => [
                      styles.presetCard,
                      selected ? styles.presetCardSelected : null,
                      pressed && !avatarSaving ? styles.buttonPressed : null,
                    ]}
                  >
                    <View style={[styles.presetAvatarOuter, { borderColor: preset.ringColor }]}>
                      <View style={[styles.presetAvatarInner, { backgroundColor: preset.bgColor }]}>
                        <Ionicons name={preset.icon as any} size={24} color={preset.iconColor} />
                      </View>
                    </View>
                    <Text style={styles.presetLabel}>{preset.label}</Text>
                    {selected ? <Ionicons name="checkmark-circle" size={16} color={colors.textAccent} /> : null}
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={avatarSaving}
              onPress={() => setAvatarModalVisible(false)}
              style={({ pressed }) => [styles.modalCloseButton, pressed ? styles.buttonPressed : null]}
            >
              <Text style={styles.modalCloseText}>{avatarSaving ? 'Guardando...' : 'Cerrar'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.contentBottom + 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
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
  avatarButton: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarDisabled: {
    opacity: 0.75,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarOuter: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#b8c4bf',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    fontWeight: '600',
  },
  profileLoader: {
    marginBottom: spacing.lg,
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  memberSince: {
    fontSize: fontSizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  editButton: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: spacing.mdPlus,
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  editButtonText: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.textOnAccent,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },
  logoutButton: {
    borderWidth: 2,
    borderColor: '#d94141',
    borderRadius: 999,
    paddingVertical: spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  logoutPressed: {
    opacity: 0.85,
  },
  logoutText: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: '#d94141',
  },
  footerText: {
    fontSize: fontSizes.sm,
    color: colors.textSubtle,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  presetCard: {
    width: '31%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  presetCardSelected: {
    borderColor: colors.textAccent,
    backgroundColor: '#ecfaf2',
  },
  presetAvatarOuter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetAvatarInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetLabel: {
    fontSize: fontSizes.xs,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  modalCloseButton: {
    alignSelf: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  modalCloseText: {
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
    fontWeight: '700',
  },
});
