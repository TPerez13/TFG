import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type FeedScreenProps = NativeStackScreenProps<RootStackParamList, 'Feed'>;

const formatDate = (value?: string) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

const formatPreferences = (value?: Record<string, unknown> | string | null) => {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch (_err) {
    return 'N/A';
  }
};

export default function FeedScreen({ route, navigation }: FeedScreenProps) {
  const { user } = route.params;
  const userId = user.id ?? user.id_usuario;
  const name = user.nombre ?? user.username ?? 'N/A';
  const username = user.username;
  const email = user.correo ?? 'N/A';
  const createdAt = formatDate(user.f_creacion);
  const preferencesText = formatPreferences(user.preferencias);
  const greetingName = user.nombre ?? user.username ?? 'Usuario';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View pointerEvents="none" style={styles.background}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Feed</Text>
          <Text style={styles.title}>Hola, {greetingName}</Text>
          <Text style={styles.subtitle}>Datos de tu cuenta</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Perfil</Text>
          <View style={styles.row}>
            <Text style={styles.label}>ID</Text>
            <Text style={styles.value}>{userId ?? 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre</Text>
            <Text style={styles.value}>{name}</Text>
          </View>
          {username ? (
            <View style={styles.row}>
              <Text style={styles.label}>Usuario</Text>
              <Text style={styles.value}>{username}</Text>
            </View>
          ) : null}
          <View style={styles.row}>
            <Text style={styles.label}>Correo</Text>
            <Text style={styles.value}>{email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Creacion</Text>
            <Text style={styles.value}>{createdAt}</Text>
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Preferencias</Text>
          <Text style={styles.preferences}>{preferencesText}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed ? styles.logoutButtonPressed : null,
          ]}
          onPress={() => navigation.replace('Login')}
        >
          <Text style={styles.logoutText}>Salir</Text>
        </Pressable>
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
    paddingBottom: 48,
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
    backgroundColor: '#2f2a66',
    opacity: 0.5,
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
    marginBottom: 24,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#8d86b1',
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f6f2ff',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#b9b2db',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 12,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#cfc4ff',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#8d86b1',
  },
  value: {
    fontSize: 14,
    color: '#f6f2ff',
    textAlign: 'right',
    maxWidth: '65%',
  },
  preferences: {
    fontSize: 13,
    lineHeight: 18,
    color: '#f6f2ff',
  },
  logoutButton: {
    backgroundColor: '#c6b6ff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  logoutButtonPressed: {
    opacity: 0.85,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1324',
  },
});
