// Pantalla de inicio de sesion y registro.
import React, { useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '@muchasvidas/shared';
import type { AuthStackParamList } from '../navigation/types';
import { Screen } from '../components/layout/Screen';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { apiFetch } from '../services/api';
import { useAuth } from '../navigation/AuthContext';
import { baseStyles } from '../theme/components';
import { colors, fontSizes, spacing } from '../theme/tokens';

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

const logoSource: ImageSourcePropType | null = null;

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
  const isSignUp = mode === 'signup';

  const switchMode = (nextMode: 'signin' | 'signup') => {
    setMode(nextMode);
    setAuthMsg('');
  };

  const handleAuth = async () => {
    if (isSignUp) {
      if (!nombre || !correo || !password) {
        setAuthMsg('Completa nombre, correo y contrasena.');
        return;
      }
      if (password !== confirmPassword) {
        setAuthMsg('Las contrasenas no coinciden.');
        return;
      }
    } else if (!correo || !password) {
      setAuthMsg('Ingresa correo y contrasena.');
      return;
    }

    setAuthMsg(isSignUp ? 'Creating account...' : 'Sending credentials...');
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
        setAuthMsg(`${res.status} -> ${parsed.message} (user: ${displayName})`);
        if (parsed.token) {
          await signIn(parsed.token);
        } else {
          setAuthMsg('Login correcto, pero no se recibio token.');
        }
      } else {
        const fallback = (parsed as { message?: string } | null)?.message ?? raw;
        setAuthMsg(`${res.status} -> ${fallback}`);
      }
    } catch (e: any) {
      setAuthMsg(`Error: ${e?.message ?? String(e)}`);
    }
  };

  /*
  const checkHealth = useCallback(async () => {
    setStatus('Checking /api/health...');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(`${getBaseUrl()}/api/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      const text = await res.text();
      setStatus(`${res.status} -> ${text}`);
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? String(e)}`);
    } finally {
      clearTimeout(timeout);
    }
  }, []);
  */

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
          <Text style={styles.title}>{isSignUp ? 'Crear cuenta' : 'Iniciar Sesion'}</Text>
          <Text style={styles.subtitle}>
            {isSignUp
              ? 'Crea tu cuenta para continuar tu camino hacia el bienestar.'
              : 'Bienvenido de nuevo. Continua con tu camino hacia el bienestar.'}
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
          <Text style={styles.label}>Correo Electronico</Text>
          <Input
            placeholder="nombre@ejemplo.com"
            autoCapitalize="none"
            keyboardType="email-address"
            value={correo}
            onChangeText={setCorreo}
          />
          <Text style={styles.label}>Contrasena</Text>
          <Input
            placeholder="Tu contrasena"
            autoCapitalize="none"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            right={(
              <Pressable
                style={styles.eyeButton}
                onPress={() => setShowPassword((current) => !current)}
              >
                <View style={[styles.eyeOuter, showPassword ? styles.eyeOuterActive : null]}>
                  <View style={[styles.eyePupil, showPassword ? styles.eyePupilActive : null]} />
                </View>
              </Pressable>
            )}
          />
          {isSignUp ? (
            <>
              <Text style={styles.label}>Confirmar contrasena</Text>
              <Input
                placeholder="Repite tu contrasena"
                autoCapitalize="none"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                right={(
                  <Pressable
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword((current) => !current)}
                  >
                    <View style={[styles.eyeOuter, showConfirmPassword ? styles.eyeOuterActive : null]}>
                      <View style={[styles.eyePupil, showConfirmPassword ? styles.eyePupilActive : null]} />
                    </View>
                  </Pressable>
                )}
              />
            </>
          ) : null}
          {!isSignUp ? (
            <Pressable style={styles.forgotLink}>
              <Text style={styles.forgotText}>Olvidaste tu contrasena?</Text>
            </Pressable>
          ) : null}
          <Button
            title={isSignUp ? 'Crear cuenta ->' : 'Iniciar Sesion'}
            onPress={handleAuth}
            style={styles.primaryButton}
          />
          {authMsg ? (
            <Text selectable style={styles.status}>{authMsg}</Text>
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
          title={isSignUp ? 'Iniciar sesion' : 'Crear cuenta'}
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
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.brandSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoImage: {
    width: 52,
    height: 52,
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
  },
  eyeOuter: {
    width: 22,
    height: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeOuterActive: {
    borderColor: colors.textPrimary,
  },
  eyePupil: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textAccent,
  },
  eyePupilActive: {
    backgroundColor: colors.textPrimary,
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
  status: {
    marginTop: spacing.md,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
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
