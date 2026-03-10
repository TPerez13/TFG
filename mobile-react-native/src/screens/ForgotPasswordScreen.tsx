import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../navigation/types';
import { Screen } from '../components/layout/Screen';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { apiFetch } from '../services/api';
import { baseStyles } from '../theme/components';
import { colors, fontSizes, spacing } from '../theme/tokens';

type ForgotPasswordScreenProps = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

type Step = 'request' | 'reset';

type ForgotPasswordResponse = {
  message?: string;
  devResetCode?: string;
};

type ResetPasswordResponse = {
  message?: string;
};

export default function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const [step, setStep] = useState<Step>('request');
  const [correo, setCorreo] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [resetDone, setResetDone] = useState(false);

  const normalizedCorreo = useMemo(() => correo.trim(), [correo]);
  const canRequestCode = normalizedCorreo.length > 0 && !loading;
  const canReset =
    normalizedCorreo.length > 0 &&
    code.trim().length > 0 &&
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    !loading;

  const requestCode = async () => {
    if (!canRequestCode) return;

    try {
      setLoading(true);
      setError(null);
      setInfo(null);
      setDevCode(null);

      const response = await apiFetch('/password/forgot', {
        method: 'POST',
        body: JSON.stringify({ correo: normalizedCorreo }),
      });

      const payload = (await response.json().catch(() => null)) as ForgotPasswordResponse | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? 'No se pudo iniciar la recuperacion.');
      }

      setStep('reset');
      setInfo(payload?.message ?? 'Revisa el codigo y continua con el restablecimiento.');
      setDevCode(payload?.devResetCode ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar la recuperacion.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!canReset) return;

    setError(null);
    setInfo(null);

    if (newPassword !== confirmPassword) {
      setError('La nueva contrasena y su confirmacion no coinciden.');
      return;
    }

    if (newPassword.length < 6) {
      setError('La nueva contrasena debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setLoading(true);
      const response = await apiFetch('/password/reset', {
        method: 'POST',
        body: JSON.stringify({
          correo: normalizedCorreo,
          code: code.trim(),
          newPassword,
        }),
      });

      const payload = (await response.json().catch(() => null)) as ResetPasswordResponse | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? 'No se pudo restablecer la contrasena.');
      }

      setResetDone(true);
      setInfo(payload?.message ?? 'Contrasena restablecida correctamente.');
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo restablecer la contrasena.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={[baseStyles.content, styles.content]} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Recuperar Contrasena</Text>
          <Text style={styles.subtitle}>
            {step === 'request'
              ? 'Ingresa tu correo para generar un codigo temporal.'
              : 'Introduce el codigo y define tu nueva contrasena.'}
          </Text>
        </View>

        <Text style={styles.label}>Correo</Text>
        <Input
          placeholder="correo@ejemplo.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={correo}
          onChangeText={setCorreo}
        />

        {step === 'request' ? (
          <Button title={loading ? 'Enviando...' : 'Enviar codigo'} onPress={requestCode} disabled={!canRequestCode} />
        ) : (
          <>
            <Text style={styles.label}>Codigo</Text>
            <Input
              placeholder="Codigo de 6 digitos"
              autoCapitalize="none"
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
            />

            <Text style={styles.label}>Nueva contrasena</Text>
            <Input
              placeholder="Nueva contrasena"
              autoCapitalize="none"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <Text style={styles.label}>Confirmar contrasena</Text>
            <Input
              placeholder="Repite la nueva contrasena"
              autoCapitalize="none"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <Button
              title={loading ? 'Restableciendo...' : 'Restablecer contrasena'}
              onPress={resetPassword}
              disabled={!canReset}
            />
          </>
        )}

        {info ? <Text style={styles.info}>{info}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {devCode ? <Text style={styles.devCode}>Codigo de prueba: {devCode}</Text> : null}

        <Pressable style={styles.backLink} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.backLinkText}>{resetDone ? 'Ir a Iniciar Sesion' : 'Volver a Iniciar Sesion'}</Text>
        </Pressable>
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
    color: '#2b7a3f',
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
  error: {
    marginTop: spacing.lg,
    color: '#b84a4a',
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
  devCode: {
    marginTop: spacing.sm,
    color: colors.textPrimary,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    fontWeight: '700',
  },
  backLink: {
    marginTop: spacing.xl,
    alignSelf: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  backLinkText: {
    color: colors.textAccent,
    fontSize: fontSizes.base,
    fontWeight: '600',
  },
});
