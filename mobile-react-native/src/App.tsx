import React, { useCallback, useState } from 'react';
import { Button, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View, TextInput } from 'react-native';
import type { LoginRequest, LoginResponse } from '@muchasvidas/shared';

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

export default function App() {
  const [status, setStatus] = useState<string>('Pulsa el botón para probar');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loginMsg, setLoginMsg] = useState<string>('');

  const checkHealth = useCallback(async () => {
    setStatus('Consultando /api/health...');
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Muchas Vidas — Health</Text>
        <View style={{ height: 12 }} />
        <Button title="Probar /api/health" onPress={checkHealth} />
        <View style={{ height: 16 }} />
        <Text selectable style={styles.status}>{status}</Text>

        <View style={{ height: 32 }} />
        <Text style={styles.title}>Login básico</Text>
        <View style={{ height: 12 }} />
        <TextInput
          style={styles.input}
          placeholder="Usuario"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
        <View style={{ height: 8 }} />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          autoCapitalize="none"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <View style={{ height: 12 }} />
        <Button
          title="Iniciar sesión"
          onPress={async () => {
            setLoginMsg('Enviando credenciales...');
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
                setLoginMsg(`${res.status} -> ${parsed.message} (usuario: ${parsed.user.username})`);
              } else {
                const fallback = (parsed as { message?: string } | null)?.message ?? raw;
                setLoginMsg(`${res.status} -> ${fallback}`);
              }
            } catch (e: any) {
              setLoginMsg(`Error: ${e?.message ?? String(e)}`);
            }
          }}
        />
        <View style={{ height: 12 }} />
        <Text selectable style={styles.status}>{loginMsg}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  status: {
    fontSize: 14,
    color: '#222',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
});
