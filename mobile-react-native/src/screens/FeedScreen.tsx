// Pantalla de feed con detalles del usuario.
import React from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../navigation/types';
import { useAuth } from '../navigation/AuthContext';
import type { NotificationSettings } from '../features/notifications/types';
import { normalizeNotificationSettingsFromPreferences } from '../features/notifications/settings';

type FeedScreenProps = NativeStackScreenProps<ProfileStackParamList, 'Feed'>;

const formatDate = (value?: string) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

type Preferences = {
  tema?: string;
  idioma?: string;
  notificationSettings?: NotificationSettings;
};

const formatBoolean = (value?: boolean) => {
  if (value === true) return 'Si';
  if (value === false) return 'No';
  return 'N/A';
};

const normalizePreferences = (value?: Record<string, unknown> | string | null): Preferences | null => {
  if (value === null || value === undefined) return null;

  let raw: Record<string, unknown> | null = null;
  if (typeof value === 'string') {
    try {
      raw = JSON.parse(value) as Record<string, unknown>;
    } catch (_err) {
      return null;
    }
  } else if (typeof value === 'object') {
    raw = value;
  }

  if (!raw) return null;

  const tema = typeof raw.tema === 'string' ? raw.tema : undefined;
  const idioma = typeof raw.idioma === 'string' ? raw.idioma : undefined;

  const notificationSettings = normalizeNotificationSettingsFromPreferences(raw);

  if (!tema && !idioma && !notificationSettings) return null;

  return {
    tema,
    idioma,
    notificationSettings,
  };
};

export default function FeedScreen({ route, navigation }: FeedScreenProps) {
  const { signOut } = useAuth();
  const user = route.params?.user;
  const userId = user?.id ?? (user as { id_usuario?: number } | undefined)?.id_usuario;
  const name = user?.nombre ?? user?.username ?? 'N/A';
  const username = user?.username;
  const email = user?.correo ?? 'N/A';
  const createdAt = formatDate(user?.f_creacion);
  const preferences = normalizePreferences(user?.preferencias ?? null);
  const greetingName = user?.nombre ?? user?.username ?? 'Usuario';
  const notificationSettings = preferences?.notificationSettings;
  const quietHoursText = notificationSettings
    ? `${notificationSettings.global.quietFrom} - ${notificationSettings.global.quietTo}`
    : 'N/A';
  const habitItems: Array<{ key: keyof NotificationSettings['habits']; label: string }> = [
    { key: 'hidratacion', label: 'Hidratacion' },
    { key: 'nutricion', label: 'Nutricion' },
    { key: 'ejercicio', label: 'Ejercicio' },
    { key: 'sueno', label: 'Sueno' },
    { key: 'meditacion', label: 'Meditacion' },
  ];

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
          {preferences ? (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Tema</Text>
                <Text style={styles.value}>{preferences.tema ?? 'N/A'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Idioma</Text>
                <Text style={styles.value}>{preferences.idioma ?? 'N/A'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Quiet hours</Text>
                <Text style={styles.value}>{quietHoursText}</Text>
              </View>
              <View style={styles.sectionDivider} />
              <Text style={styles.sectionTitle}>Notificaciones</Text>
              {notificationSettings ? (
                <>
                  <View style={styles.row}>
                    <Text style={styles.label}>Global</Text>
                    <Text
                      style={[
                        styles.value,
                        notificationSettings.global.enabled ? styles.valueOn : styles.valueOff,
                      ]}
                    >
                      {formatBoolean(notificationSettings.global.enabled)}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>Silencio</Text>
                    <Text style={styles.value}>{quietHoursText}</Text>
                  </View>
                  {habitItems.map((item) => {
                    const habit = notificationSettings.habits[item.key];
                    return (
                      <View key={item.key} style={styles.row}>
                        <Text style={styles.label}>{item.label}</Text>
                        <Text style={[styles.value, habit.enabled ? styles.valueOn : styles.valueOff]}>
                          {formatBoolean(habit.enabled)} ({habit.time})
                        </Text>
                      </View>
                    );
                  })}
                </>
              ) : (
                <Text style={styles.emptyText}>Sin datos de notificaciones</Text>
              )}
            </>
          ) : (
            <Text style={styles.emptyText}>Sin preferencias</Text>
          )}
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.logoutButton,
            pressed ? styles.logoutButtonPressed : null,
          ]}
          onPress={() => signOut()}
        >
          <Text style={styles.logoutText}>Salir</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.habitsButton,
            pressed ? styles.habitsButtonPressed : null,
          ]}
          onPress={() => navigation.getParent()?.navigate('HabitosTab' as never)}
        >
          <Text style={styles.habitsText}>Volver a mis habitos</Text>
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
  valueOn: {
    color: '#9be7c4',
  },
  valueOff: {
    color: '#f3a4a4',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#8d86b1',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#b9b2db',
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
  habitsButton: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  habitsButtonPressed: {
    opacity: 0.8,
  },
  habitsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f6f2ff',
  },
});
