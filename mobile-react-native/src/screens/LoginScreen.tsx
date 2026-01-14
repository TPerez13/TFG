// Pantalla de inicio de sesion y registro.
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '@muchasvidas/shared';
import type { RootStackParamList } from '../navigation/types';
import { Screen } from '../components/layout/Screen';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { baseStyles } from '../theme/components';
import { colors, fontSizes, radius, spacing } from '../theme/tokens';

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

const getBaseUrl = () => {
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
  return 'http://localhost:3000';
};

type AuthResponse = LoginResponse | RegisterResponse;

const isAuthResponse = (payload: unknown): payload is AuthResponse => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  const maybe = payload as Partial<AuthResponse>;
  const user = maybe.user as Partial<AuthResponse['user']> | undefined;
  return typeof maybe.message === 'string' && typeof user?.id === 'number';
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  // const [status, setStatus] = useState<string>('Press the button to test');
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
      const res = await fetch(`${getBaseUrl()}/api/${endpoint}`, {
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
        navigation.replace('Feed', { user: parsed.user });
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
      <StatusBar barStyle="light-content" />
      <View pointerEvents="none" style={styles.background}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
      </View>
      <ScrollView contentContainerStyle={baseStyles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoEnvelope}>
            <View style={styles.envelopeTop} />
            <View style={styles.envelopeLeft} />
            <View style={styles.envelopeRight} />
          </View>
          <View style={styles.tabs}>
            <Pressable onPress={() => switchMode('signin')}>
              <Text style={[styles.tabText, mode === 'signin' ? styles.tabActive : null]}>Sign in</Text>
            </Pressable>
            <Pressable onPress={() => switchMode('signup')}>
              <Text style={[styles.tabText, mode === 'signup' ? styles.tabActive : null]}>Sign up</Text>
            </Pressable>
          </View>
          <Text style={styles.subtitle}>{isSignUp ? 'Create your account' : 'Access your account'}</Text>
        </View>
        {/*
        <Text style={styles.title}>Muchas Vidas - Health</Text>
        <View style={{ height: 12 }} />
        <Button title="Test /api/health" onPress={checkHealth} />
        <View style={{ height: 16 }} />
        <Text selectable style={styles.status}>{status}</Text>

        <View style={{ height: 32 }} />
        */}
        <View style={baseStyles.card}>
          {isSignUp ? (
            <Input
              icon="#"
              placeholder="Nombre"
              autoCapitalize="words"
              value={nombre}
              onChangeText={setNombre}
            />
          ) : null}
          <Input
            icon="@"
            placeholder="Correo"
            autoCapitalize="none"
            keyboardType="email-address"
            value={correo}
            onChangeText={setCorreo}
          />
          <Input
            icon="*"
            placeholder="Password"
            autoCapitalize="none"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            right={(
              <Pressable
                style={styles.toggleButton}
                onPress={() => setShowPassword((current) => !current)}
              >
                <Text style={styles.toggleText}>{showPassword ? 'Ocultar' : 'Ver'}</Text>
              </Pressable>
            )}
          />
          {isSignUp ? (
            <Input
              icon="*"
              placeholder="Confirm password"
              autoCapitalize="none"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              right={(
                <Pressable
                  style={styles.toggleButton}
                  onPress={() => setShowConfirmPassword((current) => !current)}
                >
                  <Text style={styles.toggleText}>{showConfirmPassword ? 'Ocultar' : 'Ver'}</Text>
                </Pressable>
              )}
            />
          ) : null}
          <Button title={isSignUp ? 'Sign up' : 'Sign in'} onPress={handleAuth} />
          {!isSignUp ? (
            <Pressable style={styles.helpLink}>
              <Text style={styles.helpText}>Cannot access your account?</Text>
            </Pressable>
          ) : null}
          <Text selectable style={styles.status}>{authMsg}</Text>
        </View>
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{isSignUp ? 'Or sign up with' : 'Or sign in with'}</Text>
          <View style={styles.dividerLine} />
        </View>
        <View style={styles.socialRow}>
          <Pressable style={({ pressed }) => [styles.socialButton, pressed ? styles.socialButtonPressed : null]}>
            <Text style={styles.socialText}>f</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.socialButton, pressed ? styles.socialButtonPressed : null]}>
            <Text style={styles.socialText}>g</Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  glowTop: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.glowTop,
    opacity: 0.45,
    top: -160,
    left: -80,
  },
  glowBottom: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: colors.glowBottom,
    opacity: 0.35,
    bottom: -180,
    right: -120,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontSize: fontSizes.md,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  logoEnvelope: {
    width: 96,
    height: 72,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.outline,
    justifyContent: 'center',
    alignItems: 'center',
  },
  envelopeTop: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 16,
    height: 2,
    backgroundColor: colors.outline,
  },
  envelopeLeft: {
    position: 'absolute',
    width: 52,
    height: 2,
    backgroundColor: colors.outline,
    left: 6,
    bottom: 18,
    transform: [{ rotate: '28deg' }],
  },
  envelopeRight: {
    position: 'absolute',
    width: 52,
    height: 2,
    backgroundColor: colors.outline,
    right: 6,
    bottom: 18,
    transform: [{ rotate: '-28deg' }],
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.lgPlus,
  },
  tabText: {
    fontSize: fontSizes.sm,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.textSubtle,
    paddingBottom: spacing.xs,
  },
  tabActive: {
    color: colors.textPrimary,
    borderBottomWidth: 2,
    borderBottomColor: colors.textPrimary,
  },
  toggleButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  toggleText: {
    fontSize: fontSizes.sm,
    color: colors.textAccent,
    letterSpacing: 0.4,
  },
  helpLink: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  helpText: {
    fontSize: fontSizes.sm,
    color: colors.textMuted,
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
    gap: spacing.sm,
    marginTop: spacing.xxl,
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.divider,
  },
  dividerText: {
    fontSize: fontSizes.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textSubtle,
  },
  socialRow: {
    flexDirection: 'row',
    gap: spacing.mdPlus,
  },
  socialButton: {
    width: 56,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonPressed: {
    opacity: 0.75,
  },
  socialText: {
    fontSize: fontSizes.lg,
    color: colors.textPrimary,
    fontWeight: '600',
  },
});
