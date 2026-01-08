import React, { useState } from 'react';
import { Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '@muchasvidas/shared';
import type { RootStackParamList } from '../navigation/types';

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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View pointerEvents="none" style={styles.background}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
        <View style={styles.form}>
          {isSignUp ? (
            <View style={styles.inputRow}>
              <Text style={styles.inputIcon}>#</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre"
                placeholderTextColor="#a7a0c8"
                autoCapitalize="words"
                value={nombre}
                onChangeText={setNombre}
              />
            </View>
          ) : null}
          <View style={styles.inputRow}>
            <Text style={styles.inputIcon}>@</Text>
            <TextInput
              style={styles.input}
              placeholder="Correo"
              placeholderTextColor="#a7a0c8"
              autoCapitalize="none"
              keyboardType="email-address"
              value={correo}
              onChangeText={setCorreo}
            />
          </View>
          <View style={styles.inputRow}>
            <Text style={styles.inputIcon}>*</Text>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#a7a0c8"
              autoCapitalize="none"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <Pressable
              style={styles.toggleButton}
              onPress={() => setShowPassword((current) => !current)}
            >
              <Text style={styles.toggleText}>{showPassword ? 'Ocultar' : 'Ver'}</Text>
            </Pressable>
          </View>
          {isSignUp ? (
            <View style={styles.inputRow}>
              <Text style={styles.inputIcon}>*</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                placeholderTextColor="#a7a0c8"
                autoCapitalize="none"
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <Pressable
                style={styles.toggleButton}
                onPress={() => setShowConfirmPassword((current) => !current)}
              >
                <Text style={styles.toggleText}>{showConfirmPassword ? 'Ocultar' : 'Ver'}</Text>
              </Pressable>
            </View>
          ) : null}
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed ? styles.primaryButtonPressed : null,
            ]}
            onPress={handleAuth}
          >
            <Text style={styles.primaryButtonText}>{isSignUp ? 'Sign up' : 'Sign in'}</Text>
          </Pressable>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b10',
  },
  content: {
    padding: 24,
    paddingTop: 48,
    paddingBottom: 60,
    alignItems: 'center',
  },
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
    backgroundColor: '#3a2a68',
    opacity: 0.45,
    top: -160,
    left: -80,
  },
  glowBottom: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: '#6a3f78',
    opacity: 0.35,
    bottom: -180,
    right: -120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#b9b2db',
  },
  logoEnvelope: {
    width: 96,
    height: 72,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e6ddff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  envelopeTop: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: 16,
    height: 2,
    backgroundColor: '#e6ddff',
  },
  envelopeLeft: {
    position: 'absolute',
    width: 52,
    height: 2,
    backgroundColor: '#e6ddff',
    left: 6,
    bottom: 18,
    transform: [{ rotate: '28deg' }],
  },
  envelopeRight: {
    position: 'absolute',
    width: 52,
    height: 2,
    backgroundColor: '#e6ddff',
    right: 6,
    bottom: 18,
    transform: [{ rotate: '-28deg' }],
  },
  tabs: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 18,
  },
  tabText: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#8d86b1',
    paddingBottom: 6,
  },
  tabActive: {
    color: '#f6f2ff',
    borderBottomWidth: 2,
    borderBottomColor: '#f6f2ff',
  },
  form: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  inputIcon: {
    width: 22,
    textAlign: 'center',
    color: '#d4caff',
    fontSize: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#f6f2ff',
    paddingVertical: 0,
  },
  toggleButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  toggleText: {
    fontSize: 12,
    color: '#cfc4ff',
    letterSpacing: 0.4,
  },
  primaryButton: {
    backgroundColor: '#c6b6ff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 2,
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1324',
  },
  helpLink: {
    marginTop: 12,
    alignItems: 'center',
  },
  helpText: {
    fontSize: 12,
    color: '#b9b2db',
  },
  status: {
    marginTop: 12,
    fontSize: 12,
    color: '#b9b2db',
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  dividerText: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#8d86b1',
  },
  socialRow: {
    flexDirection: 'row',
    gap: 14,
  },
  socialButton: {
    width: 56,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonPressed: {
    opacity: 0.75,
  },
  socialText: {
    fontSize: 18,
    color: '#f6f2ff',
    fontWeight: '600',
  },
});
