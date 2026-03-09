import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/layout/Screen';
import type { ProfileStackParamList } from '../navigation/types';
import { useAuth } from '../navigation/AuthContext';
import { apiFetch } from '../services/api';
import type { User } from '../types/models';
import { colors, fontSizes, spacing } from '../theme/tokens';

type EditProfileScreenProps = NativeStackScreenProps<ProfileStackParamList, 'EditProfile'>;

export default function EditProfileScreen({ navigation }: EditProfileScreenProps) {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [initialNombre, setInitialNombre] = useState('');
  const [initialCorreo, setInitialCorreo] = useState('');

  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setProfileError(null);
        const response = await apiFetch('/users/me');

        if (response.status === 401) {
          await signOut();
          return;
        }

        if (!response.ok) {
          throw new Error('No se pudo cargar tu perfil.');
        }

        const payload = (await response.json()) as { user?: User };
        const currentNombreValue = payload.user?.nombre ?? '';
        const currentCorreoValue = payload.user?.correo ?? '';

        if (!active) return;
        setNombre(currentNombreValue);
        setCorreo(currentCorreoValue);
        setInitialNombre(currentNombreValue);
        setInitialCorreo(currentCorreoValue);
      } catch (_err) {
        if (active) {
          setProfileError('No se pudo cargar tu perfil.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, [signOut]);

  const normalizedNombre = nombre.trim();
  const normalizedCorreo = correo.trim();

  const hasProfileChanges = useMemo(
    () => normalizedNombre !== initialNombre || normalizedCorreo !== initialCorreo,
    [initialCorreo, initialNombre, normalizedCorreo, normalizedNombre]
  );

  const canSaveProfile =
    normalizedNombre.length > 0 && normalizedCorreo.length > 0 && hasProfileChanges && !profileSaving;

  const canChangePassword =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    confirmNewPassword.length > 0 &&
    !passwordSaving;

  const handleSaveProfile = async () => {
    if (!canSaveProfile) return;

    try {
      setProfileSaving(true);
      setProfileError(null);

      const response = await apiFetch('/users/me', {
        method: 'PUT',
        body: JSON.stringify({
          nombre: normalizedNombre,
          correo: normalizedCorreo,
        }),
      });

      if (response.status === 401) {
        await signOut();
        return;
      }

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? 'No se pudo guardar el perfil.');
      }

      setInitialNombre(normalizedNombre);
      setInitialCorreo(normalizedCorreo);
      navigation.goBack();
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'No se pudo guardar el perfil.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!canChangePassword) return;

    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordError('La nueva contrasena y su confirmacion no coinciden.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('La nueva contrasena debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setPasswordSaving(true);
      const response = await apiFetch('/users/me/password', {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (response.status === 401) {
        await signOut();
        return;
      }

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? 'No se pudo actualizar la contrasena.');
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordSuccess(payload?.message ?? 'Contrasena actualizada correctamente.');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'No se pudo actualizar la contrasena.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton} accessibilityLabel="Volver">
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Editar Perfil</Text>
          <View style={styles.headerSpacer} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.textAccent} style={styles.loading} />
        ) : (
          <>
            <Text style={styles.sectionTitle}>Datos de perfil</Text>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              value={nombre}
              onChangeText={setNombre}
              autoCapitalize="words"
              autoCorrect={false}
              placeholder="Tu nombre"
              style={styles.input}
              placeholderTextColor={colors.placeholder}
            />

            <Text style={styles.label}>Correo o usuario</Text>
            <TextInput
              value={correo}
              onChangeText={setCorreo}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="correo@ejemplo.com"
              style={styles.input}
              placeholderTextColor={colors.placeholder}
            />

            {profileError ? <Text style={styles.errorText}>{profileError}</Text> : null}
            {!hasProfileChanges && !profileError ? (
              <Text style={styles.helperText}>No hay cambios pendientes.</Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              onPress={handleSaveProfile}
              disabled={!canSaveProfile}
              style={({ pressed }) => [
                styles.saveButton,
                !canSaveProfile ? styles.saveDisabled : null,
                pressed ? styles.savePressed : null,
              ]}
            >
              <Text style={styles.saveText}>{profileSaving ? 'Guardando...' : 'Guardar perfil'}</Text>
            </Pressable>

            <View style={styles.sectionDivider} />

            <Text style={styles.sectionTitle}>Cambiar contrasena</Text>
            <Text style={styles.label}>Contrasena actual</Text>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              placeholder="Contrasena actual"
              style={styles.input}
              placeholderTextColor={colors.placeholder}
            />

            <Text style={styles.label}>Nueva contrasena</Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              placeholder="Nueva contrasena"
              style={styles.input}
              placeholderTextColor={colors.placeholder}
            />

            <Text style={styles.label}>Confirmar nueva contrasena</Text>
            <TextInput
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              placeholder="Repite la nueva contrasena"
              style={styles.input}
              placeholderTextColor={colors.placeholder}
            />

            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            {passwordSuccess ? <Text style={styles.successText}>{passwordSuccess}</Text> : null}

            <Pressable
              accessibilityRole="button"
              onPress={handleChangePassword}
              disabled={!canChangePassword}
              style={({ pressed }) => [
                styles.saveButton,
                !canChangePassword ? styles.saveDisabled : null,
                pressed ? styles.savePressed : null,
              ]}
            >
              <Text style={styles.saveText}>{passwordSaving ? 'Actualizando...' : 'Cambiar contrasena'}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    fontSize: fontSizes.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.xxl,
  },
  label: {
    fontSize: fontSizes.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 14,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: fontSizes.base,
    marginBottom: spacing.lg,
  },
  helperText: {
    color: colors.textSubtle,
    fontSize: fontSizes.sm,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: '#b84a4a',
    fontSize: fontSizes.sm,
    marginBottom: spacing.lg,
  },
  successText: {
    color: '#2b7a3f',
    fontSize: fontSizes.sm,
    marginBottom: spacing.lg,
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  savePressed: {
    opacity: 0.85,
  },
  saveDisabled: {
    opacity: 0.6,
  },
  saveText: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.textOnAccent,
  },
});
