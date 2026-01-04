import React, { useState } from 'react';
import { Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { LoginRequest, LoginResponse } from '@muchasvidas/shared';
import type { RootStackParamList } from '../navigation/types';

type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

const getBaseUrl = () => {
  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
  return 'http://localhost:3000';
};

const isLoginResponse = (payload: unknown): payload is LoginResponse => {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  const maybe = payload as Partial<LoginResponse>;
  return typeof maybe.message === 'string' && typeof maybe.user?.id === 'number' && typeof maybe.user?.username === 'string';
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  // const [status, setStatus] = useState<string>('Press the button to test');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginMsg, setLoginMsg] = useState<string>('');

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
      <StatusBar barStyle="dark-content" />
      <View pointerEvents="none" style={styles.background}>
        <View style={styles.circleLarge} />
        <View style={styles.circleSmall} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Muchas Vidas</Text>
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.subtitle}>Access your account to continue.</Text>
        </View>
        {/*
        <Text style={styles.title}>Muchas Vidas - Health</Text>
        <View style={{ height: 12 }} />
        <Button title="Test /api/health" onPress={checkHealth} />
        <View style={{ height: 16 }} />
        <Text selectable style={styles.status}>{status}</Text>

        <View style={{ height: 32 }} />
        */}
        <View style={styles.card}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Username"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Password"
            autoCapitalize="none"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed ? styles.primaryButtonPressed : null,
            ]}
            onPress={async () => {
              setLoginMsg('Sending credentials...');
              try {
                const payload: LoginRequest = { username, password };
                const res = await fetch(`${getBaseUrl()}/api/login`, {
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

                if (res.ok && isLoginResponse(parsed)) {
                  setLoginMsg(`${res.status} -> ${parsed.message} (user: ${parsed.user.username})`);
                  navigation.replace('Feed', { user: parsed.user });
                } else {
                  const fallback = (parsed as { message?: string } | null)?.message ?? raw;
                  setLoginMsg(`${res.status} -> ${fallback}`);
                }
              } catch (e: any) {
                setLoginMsg(`Error: ${e?.message ?? String(e)}`);
              }
            }}
          >
            <Text style={styles.primaryButtonText}>Sign in</Text>
          </Pressable>
          <Text selectable style={styles.status}>{loginMsg}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2efe9',
  },
  content: {
    padding: 24,
    paddingTop: 56,
    paddingBottom: 48,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 240,
  },
  circleLarge: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#f0cfa8',
    top: -90,
    right: -60,
  },
  circleSmall: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#cfe0d2',
    top: 40,
    left: -40,
  },
  header: {
    marginBottom: 28,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#5a4f3c',
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2b2a26',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#6e6657',
  },
  status: {
    marginTop: 12,
    fontSize: 14,
    color: '#5a4f3c',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4a4336',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d7d2c8',
    backgroundColor: '#f8f6f1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2b2a26',
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#c46b44',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
