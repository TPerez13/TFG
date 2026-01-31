import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../navigation/types';
import { Screen } from '../components/layout/Screen';
import { apiFetch } from '../services/api';
import type { Notification } from '../features/notifications/types';
import { colors, fontSizes, spacing } from '../theme/tokens';
import { useAuth } from '../navigation/AuthContext';

type DetailProps = NativeStackScreenProps<ProfileStackParamList, 'NotificationDetail'>;

export default function NotificationDetailScreen({ route, navigation }: DetailProps) {
  const { signOut } = useAuth();
  const [item, setItem] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await apiFetch(`/notifications/${route.params.notificationId}`);
        if (res.status === 401) {
          await signOut();
          return;
        }
        if (res.ok) {
          const payload = (await res.json()) as { item?: Notification };
          if (active) setItem(payload.item ?? null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [route.params.notificationId]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Detalle</Text>
          <View style={styles.headerSpacer} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.textAccent} style={styles.loading} />
        ) : item ? (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Tipo</Text>
              <Text style={styles.metaValue}>{item.type}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Estado</Text>
              <Text style={styles.metaValue}>{item.read ? 'Leida' : 'No leida'}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Fecha</Text>
              <Text style={styles.metaValue}>{new Date(item.createdAt).toLocaleString()}</Text>
            </View>
          </View>
        ) : (
          <Text style={styles.emptyText}>Notificacion no encontrada.</Text>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.contentTop,
    paddingBottom: spacing.contentBottom,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 36,
    height: 36,
  },
  loading: {
    marginTop: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: fontSizes.base,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  metaLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSubtle,
  },
  metaValue: {
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xxl,
  },
});
