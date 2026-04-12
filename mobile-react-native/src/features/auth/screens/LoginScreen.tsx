// Pantalla de inicio de sesión y registro.
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '@muchasvidas/shared';
import type { AuthStackParamList } from '../../../navigation/types';
import { Screen } from '../../../components/layout/Screen';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { apiFetch } from '../../../services/api';
import { useAuth } from '../../../navigation/AuthContext';
import { baseStyles } from '../../../theme/components';
import { colors, fontSizes, spacing } from '../../../theme/tokens';

type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

type AuthResponse = LoginResponse | RegisterResponse;

const isAuthResponse = (payload: unknown): payload is AuthResponse => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  const maybe = payload as Partial<AuthResponse>;
  const user = maybe.user as Partial<AuthResponse['user']> | undefined;
  return typeof maybe.message === 'string' && typeof user?.id === 'number';
};

const logoSource: ImageSourcePropType = require('../../assets/logo.png');

export default function LoginScreen({ navigation }: LoginScreenProps) {
  // const [status, setStatus] = useState<string>('Press the button to test');
  const { signIn } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [nombre, setNombre] = useState<string>('');
  const [correo, setCorreo] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [authMsg, setAuthMsg] = useState<string>('');
  const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const isSignUp = mode === 'signup';
  const passwordsMismatch = isSignUp && confirmPassword.length > 0 && password !== confirmPassword;
  const statusTitle =
    authStatus === 'error'
      ? isSignUp
        ? 'No se pudo crear la cuenta'
        : 'No se pudo iniciar sesión'
      : authStatus === 'success'
        ? isSignUp
          ? 'Cuenta creada correctamente'
          : 'Inicio de sesión correcto'
        : isSignUp
          ? 'Creando cuenta'
          : 'Iniciando sesión';

  const switchMode = (nextMode: 'signin' | 'signup') => {
    setMode(nextMode);
    setAuthMsg('');
    setAuthStatus('idle');
  };

  const handleAuth = async () => {
    if (isSignUp) {
      if (!nombre || !correo || !password) {
        setAuthStatus('error');
        setAuthMsg('Completa nombre, correo y contraseña.');
        return;
      }
      if (password !== confirmPassword) {
        setAuthStatus('error');
        setAuthMsg('Las contraseñas no coinciden.');
        return;
      }
    } else if (!correo || !password) {
      setAuthStatus('error');
      setAuthMsg('Ingresa correo y contraseña.');
      return;
    }

    setAuthStatus('loading');
    setAuthMsg(isSignUp ? 'Creando cuenta...' : 'Enviando credenciales...');
    try {
      const endpoint = isSignUp ? 'register' : 'login';
      const payload: LoginRequest | RegisterRequest = isSignUp
        ? { correo, nombre, password }
        : { correo, password };
      const res = await apiFetch(`/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const raw = await res.text();
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(raw);
      } catch (_err) {
        parsed = null;
      }

      if (res.ok && isAuthResponse(parsed)) {
        const displayName = parsed.user.nombre ?? parsed.user.correo ?? parsed.user.username ?? 'usuario';
        setAuthStatus('success');
        setAuthMsg(`${parsed.message} (usuario: ${displayName})`);
        if (parsed.token) {
          await signIn(parsed.token);
        } else {
          setAuthStatus('error');
          setAuthMsg('Login correcto, pero no se recibió token.');
        }
      } else {
        const fallback = (parsed as { message?: string } | null)?.message ?? raw;
        setAuthStatus('error');
        setAuthMsg(fallback);
      }
    } catch (e: any) {
      setAuthStatus('error');
      setAuthMsg(`Error: ${e?.message ?? String(e)}`);
    }
  };

  return (
    <Screen>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={[baseStyles.content, styles.content]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            {logoSource ? (
              <Image source={logoSource} style={styles.logoImage} resizeMode="contain" />
            ) : (
              <View style={styles.logoFallback}>
                <Text style={styles.logoFallbackText}>MV</Text>
              </View>
            )}
          </View>
          <Text style={styles.title}>{isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}</Text>
          <Text style={styles.subtitle}>
            {isSignUp
              ? 'Crea tu cuenta para continuar tu camino hacia el bienestar.'
              : 'Bienvenido de nuevo. Continúa con tu camino hacia el bienestar.'}
          </Text>
        </View>

        <View style={styles.form}>
          {isSignUp ? (
            <>
              <Text style={styles.label}>Nombre</Text>
              <Input
                placeholder="Tu nombre"
                autoCapitalize="words"
                value={nombre}
                onChangeText={setNombre}
              />
            </>
          ) : null}
          <Text style={styles.label}>Correo electrónico</Text>
          <Input
            placeholder="nombre@ejemplo.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={correo}
            onChangeText={setCorreo}
          />
          <Text style={styles.label}>Contraseña</Text>
          <Input
            placeholder="Tu contraseña"
            autoCapitalize="none"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            right={(
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowPassword((current) => !current)}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={22}
                  color={showPassword ? colors.textAccent : colors.textSubtle}
                />
              </Pressable>
            )}
          />
          {isSignUp ? (
            <>
              <Text style={styles.label}>Confirmar contraseña</Text>
              <Input
                placeholder="Repite tu contraseña"
                autoCapitalize="none"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                containerStyle={passwordsMismatch ? styles.inputErrorContainer : undefined}
                right={(
                  <Pressable
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword((current) => !current)}
                    accessibilityRole="button"
                    accessibilityLabel={showConfirmPassword ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={22}
                      color={showConfirmPassword ? colors.textAccent : colors.textSubtle}
                    />
                  </Pressable>
                )}
              />
              {passwordsMismatch ? (
                <View style={styles.inlineErrorRow}>
                  <Ionicons name="alert-circle" size={16} color={colors.error} />
                  <Text style={styles.inlineErrorText}>Las contraseñas no coinciden.</Text>
                </View>
              ) : null}
            </>
          ) : null}
          {!isSignUp ? (
            <Pressable style={styles.forgotLink} onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </Pressable>
          ) : null}
          <Button
            title={isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
            onPress={handleAuth}
            style={styles.primaryButton}
          />
          {authMsg ? (
            <View
              style={[
                styles.statusBanner,
                authStatus === 'error'
                  ? styles.statusBannerError
                  : authStatus === 'success'
                    ? styles.statusBannerSuccess
                    : styles.statusBannerInfo,
              ]}
            >
              <View
                style={[
                  styles.statusIconWrap,
                  authStatus === 'error'
                    ? styles.statusIconWrapError
                    : authStatus === 'success'
                      ? styles.statusIconWrapSuccess
                      : styles.statusIconWrapInfo,
                ]}
              >
                <Ionicons
                  name={
                    authStatus === 'error'
                      ? 'alert'
                      : authStatus === 'success'
                        ? 'checkmark'
                        : 'time-outline'
                  }
                  size={18}
                  color={
                    authStatus === 'error'
                      ? '#fff'
                      : authStatus === 'success'
                        ? '#fff'
                        : colors.textPrimary
                  }
                />
              </View>
              <View style={styles.statusContent}>
                <Text
                  style={[
                    styles.statusTitle,
                    authStatus === 'error'
                      ? styles.statusTitleError
                      : authStatus === 'success'
                        ? styles.statusTitleSuccess
                        : styles.statusTitleInfo,
                  ]}
                >
                  {statusTitle}
                </Text>
                <Text
                  selectable
                  style={[
                    styles.statusText,
                    authStatus === 'error'
                      ? styles.statusTextError
                      : authStatus === 'success'
                        ? styles.statusTextSuccess
                        : styles.statusTextInfo,
                  ]}
                >
                  {authMsg}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <View style={styles.dividerDot} />
          <View style={styles.dividerLine} />
        </View>
        <Text style={styles.footerText}>
          {isSignUp ? 'Ya tienes una cuenta?' : 'No tienes una cuenta?'}
        </Text>
        <Button
          title={isSignUp ? 'Iniciar sesión' : 'Crear cuenta'}
          onPress={() => switchMode(isSignUp ? 'signin' : 'signup')}
          variant="outline"
          style={styles.secondaryButton}
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
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: fontSizes.base,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  logoWrap: {
    width: 120,
    height: 120,
    borderRadius: 30,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    padding: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  logoFallbackText: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textOnAccent,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: fontSizes.base,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  eyeButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputErrorContainer: {
    borderColor: colors.error,
    backgroundColor: colors.errorSoft,
  },
  inlineErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: -spacing.md,
    marginBottom: spacing.md,
  },
  inlineErrorText: {
    fontSize: fontSizes.sm,
    color: colors.error,
    fontWeight: '700',
  },
  forgotLink: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  forgotText: {
    fontSize: fontSizes.sm,
    color: colors.textAccent,
    fontWeight: '600',
  },
  statusBanner: {
    marginTop: spacing.md,
    borderRadius: 18,
    borderWidth: 2,
    borderLeftWidth: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2,
  },
  statusBannerError: {
    backgroundColor: '#fff1f1',
    borderColor: '#efb4b4',
    shadowColor: colors.error,
  },
  statusBannerSuccess: {
    backgroundColor: '#edf9f0',
    borderColor: '#b7dfc1',
    shadowColor: colors.success,
  },
  statusBannerInfo: {
    backgroundColor: '#f4f7f5',
    borderColor: colors.surfaceBorder,
    shadowColor: '#5c6b63',
  },
  statusIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  statusIconWrapError: {
    backgroundColor: colors.error,
  },
  statusIconWrapSuccess: {
    backgroundColor: colors.success,
  },
  statusIconWrapInfo: {
    backgroundColor: '#dfe8e2',
  },
  statusContent: {
    flex: 1,
    gap: 2,
  },
  statusTitle: {
    fontSize: fontSizes.md,
    fontWeight: '800',
  },
  statusText: {
    fontSize: fontSizes.sm,
    lineHeight: 19,
    fontWeight: '700',
  },
  statusTitleError: {
    color: '#8f2f2f',
  },
  statusTitleSuccess: {
    color: '#15552f',
  },
  statusTitleInfo: {
    color: colors.textPrimary,
  },
  statusTextError: {
    color: '#8f2f2f',
  },
  statusTextSuccess: {
    color: '#15552f',
  },
  statusTextInfo: {
    color: colors.textMuted,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.divider,
  },
  dividerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.textAccent,
    marginHorizontal: spacing.sm,
  },
  footerText: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  primaryButton: {
    width: '100%',
    marginTop: spacing.lg,
  },
  secondaryButton: {
    width: '100%',
    marginTop: spacing.sm,
  },
});
