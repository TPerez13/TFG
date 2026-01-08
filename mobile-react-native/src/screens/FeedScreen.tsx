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

type NotificationSettings = {
  habilitadas?: boolean;
  hidratacion?: boolean;
  nutricion?: boolean;
  ejercicio?: boolean;
  sueno?: boolean;
  meditacion?: boolean;
};

type Preferences = {
  tema?: string;
  idioma?: string;
  quiet_hours?: {
    desde?: string;
    hasta?: string;
  };
  notificaciones?: NotificationSettings;
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

  let quiet_hours: Preferences['quiet_hours'];
  if (raw.quiet_hours && typeof raw.quiet_hours === 'object') {
    const quietRaw = raw.quiet_hours as Record<string, unknown>;
    const desde = typeof quietRaw.desde === 'string' ? quietRaw.desde : undefined;
    const hasta = typeof quietRaw.hasta === 'string' ? quietRaw.hasta : undefined;
    if (desde || hasta) {
      quiet_hours = { desde, hasta };
    }
  }

  let notificaciones: NotificationSettings | undefined;
  if (raw.notificaciones && typeof raw.notificaciones === 'object') {
    const notifRaw = raw.notificaciones as Record<string, unknown>;
    const getBool = (key: keyof NotificationSettings) =>
      typeof notifRaw[key] === 'boolean' ? (notifRaw[key] as boolean) : undefined;

    notificaciones = {
      habilitadas: getBool('habilitadas'),
      hidratacion: getBool('hidratacion'),
      nutricion: getBool('nutricion'),
      ejercicio: getBool('ejercicio'),
      sueno: getBool('sueno'),
      meditacion: getBool('meditacion'),
    };

    if (Object.values(notificaciones).every((value) => value === undefined)) {
      notificaciones = undefined;
    }
  }

  if (!tema && !idioma && !quiet_hours && !notificaciones) return null;

  return {
    tema,
    idioma,
    quiet_hours,
    notificaciones,
  };
};

export default function FeedScreen({ route, navigation }: FeedScreenProps) {
  const { user } = route.params;
  const userId = user.id ?? user.id_usuario;
  const name = user.nombre ?? user.username ?? 'N/A';
  const username = user.username;
  const email = user.correo ?? 'N/A';
  const createdAt = formatDate(user.f_creacion);
  const preferences = normalizePreferences(user.preferencias);
  const greetingName = user.nombre ?? user.username ?? 'Usuario';
  const quietHours = preferences?.quiet_hours;
  const quietHoursText =
    quietHours?.desde || quietHours?.hasta
      ? `${quietHours?.desde ?? '--:--'} - ${quietHours?.hasta ?? '--:--'}`
      : 'N/A';
  const notificationItems: Array<{ key: keyof NotificationSettings; label: string }> = [
    { key: 'habilitadas', label: 'Habilitadas' },
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
              {preferences.notificaciones ? (
                notificationItems.map((item) => {
                  const status = preferences.notificaciones?.[item.key];
                  return (
                    <View key={item.key} style={styles.row}>
                      <Text style={styles.label}>{item.label}</Text>
                      <Text
                        style={[
                          styles.value,
                          status === true ? styles.valueOn : null,
                          status === false ? styles.valueOff : null,
                        ]}
                      >
                        {formatBoolean(status)}
                      </Text>
                    </View>
                  );
                })
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
});
