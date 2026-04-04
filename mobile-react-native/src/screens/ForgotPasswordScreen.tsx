import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type {
  ForgotPasswordResponse,
  ResetPasswordResponse,
} from '@muchasvidas/shared';
import type { AuthStackParamList } from '../navigation/types';
import { Screen } from '../components/layout/Screen';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { apiFetch } from '../services/api';
import { baseStyles } from '../theme/components';
import { colors, fontSizes, spacing } from '../theme/tokens';

type ForgotPasswordScreenProps = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

type Step = 'request' | 'reset';

const DEFAULT_REQUEST_SUCCESS_MESSAGE =
  'Si el correo existe, te enviaremos un código de 6 dígitos por correo. Revisa tu bandeja de entrada.';
const DEFAULT_RESET_SUCCESS_MESSAGE = 'Contraseña restablecida correctamente.';

export default function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const [step, setStep] = useState<Step>('request');
  const [correo, setCorreo] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [resetDone, setResetDone] = useState(false);

  const normalizedCorreo = correo.trim();
  const normalizedCode = code.trim();
  const canRequestCode = normalizedCorreo.length > 0 && !loading;
  const canReset =
    normalizedCorreo.length > 0 &&
    normalizedCode.length === 6 &&
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    !loading;

  const handleCodeChange = (value: string) => {
    setCode(value.replace(/\D/g, '').slice(0, 6));
  };

  const requestCode = async () => {
    if (!canRequestCode) return;

    try {
      setLoading(true);
      setError(null);
      setInfo(null);
      setResetDone(false);

      const response = await apiFetch('/password/forgot', {
        method: 'POST',
        body: JSON.stringify({ correo: normalizedCorreo }),
      });

      const payload = (await response.json().catch(() => null)) as ForgotPasswordResponse | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? 'No se pudo solicitar el código de recuperación.');
      }

      setStep('reset');
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
      setInfo(payload?.message ?? DEFAULT_REQUEST_SUCCESS_MESSAGE);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo solicitar el código de recuperación.'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!canReset) return;

    setError(null);
    setInfo(null);

    if (newPassword !== confirmPassword) {
      setError('La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setLoading(true);
      const response = await apiFetch('/password/reset', {
        method: 'POST',
        body: JSON.stringify({
          correo: normalizedCorreo,
          code: normalizedCode,
          newPassword,
        }),
      });

      const payload = (await response.json().catch(() => null)) as ResetPasswordResponse | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? 'No se pudo restablecer la contraseña.');
      }

      setResetDone(true);
      setInfo(payload?.message ?? DEFAULT_RESET_SUCCESS_MESSAGE);
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={[baseStyles.content, styles.content]} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Recuperar contraseña</Text>
          <Text style={styles.subtitle}>
            {step === 'request'
              ? 'Paso 1: introduce tu correo para solicitar el código por email.'
              : 'Paso 2: introduce el código de 6 dígitos recibido por correo y define tu nueva contraseña.'}
          </Text>
        </View>

        <Text style={styles.label}>Correo</Text>
        <Input
          placeholder="correo@ejemplo.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={correo}
          onChangeText={setCorreo}
        />

        {step === 'request' ? (
          <Button
            title={loading ? 'Solicitando...' : 'Solicitar código'}
            onPress={requestCode}
            disabled={!canRequestCode}
          />
        ) : (
          <>
            <Text style={styles.label}>Código de 6 dígitos</Text>
            <Input
              placeholder="Código recibido por correo"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={handleCodeChange}
            />

            <Text style={styles.label}>Nueva contraseña</Text>
            <Input
              placeholder="Nueva contraseña"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <Text style={styles.label}>Confirmar contraseña</Text>
            <Input
              placeholder="Repite la nueva contraseña"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <Button
              title={loading ? 'Restableciendo...' : 'Restablecer contraseña'}
              onPress={resetPassword}
              disabled={!canReset}
            />
          </>
        )}

        {info ? <Text style={styles.info}>{info}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          title={resetDone ? 'Ir a Iniciar sesión' : 'Volver a Iniciar sesión'}
          onPress={() => navigation.navigate('Login')}
          style={styles.backButton}
          variant="outline"
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSizes.base,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  label: {
    fontSize: fontSizes.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  info: {
    marginTop: spacing.lg,
    color: colors.success,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  error: {
    marginTop: spacing.lg,
    color: colors.error,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  backButton: {
    marginTop: spacing.xl,
    width: '100%',
  },
});
