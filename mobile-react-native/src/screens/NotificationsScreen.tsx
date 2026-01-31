import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../navigation/types';
import { Screen } from '../components/layout/Screen';
import { NotificationItem } from '../components/NotificationItem';
import { useNotificationsQuery } from '../features/notifications/useNotificationsQuery';
import type { NotificationType } from '../features/notifications/types';
import { apiFetch } from '../services/api';
import { colors, fontSizes, spacing } from '../theme/tokens';
import { useUnreadCount } from '../features/notifications/useUnreadCount';

type NotificationsScreenProps = NativeStackScreenProps<ProfileStackParamList, 'Notifications'>;

const FILTERS: Array<{ label: string; value?: NotificationType }> = [
  { label: 'Todas' },
  { label: 'Recordatorios', value: 'REMINDER' },
  { label: 'Logros', value: 'ACHIEVEMENT' },
  { label: 'Retos', value: 'CHALLENGE' },
  { label: 'Sistema', value: 'SYSTEM' },
];

export default function NotificationsScreen({ navigation }: NotificationsScreenProps) {
  const [filterType, setFilterType] = useState<NotificationType | undefined>(undefined);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { count, refresh: refreshUnread } = useUnreadCount();
  const { items, setItems, loading, refreshing, error, refresh, loadMore } = useNotificationsQuery({
    filter: { type: filterType, unreadOnly },
  });

  const emptyState = useMemo(() => {
    if (loading) return null;
    if (error) return <Text style={styles.stateText}>{error}</Text>;
    return <Text style={styles.stateText}>No hay notificaciones.</Text>;
  }, [error, loading]);

  const handleToggleRead = async (id: number, read: boolean) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read, readAt: read ? new Date().toISOString() : null } : item))
    );
    await apiFetch(`/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read }),
    });
    refreshUnread();
  };

  const handleDelete = async (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    await apiFetch(`/notifications/${id}`, { method: 'DELETE' });
    refreshUnread();
  };

  const markAllRead = async () => {
    await apiFetch('/notifications/read-all', { method: 'PATCH' });
    setItems((prev) => prev.map((item) => ({ ...item, read: true, readAt: item.readAt ?? new Date().toISOString() })));
    refreshUnread();
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Notificaciones</Text>
        <View style={styles.headerActions}>
          <Pressable onPress={() => navigation.navigate('NotificationSettings')} style={styles.iconButton}>
            <Ionicons name="settings-outline" size={20} color={colors.textPrimary} />
          </Pressable>
          <Pressable onPress={markAllRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Marcar todas</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.filtersRow}>
        {FILTERS.map((filter) => {
          const active = filter.value === filterType || (!filter.value && !filterType);
          return (
            <Pressable
              key={filter.label}
              onPress={() => setFilterType(filter.value)}
              style={[styles.filterChip, active ? styles.filterChipActive : null]}
            >
              <Text style={[styles.filterText, active ? styles.filterTextActive : null]}>
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => setUnreadOnly((prev) => !prev)}
          style={[styles.filterChip, unreadOnly ? styles.filterChipActive : null]}
        >
          <Text style={[styles.filterText, unreadOnly ? styles.filterTextActive : null]}>No leidas</Text>
        </Pressable>
      </View>

      <View style={styles.countRow}>
        <Text style={styles.countText}>{count} sin leer</Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.textAccent} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={emptyState}
          renderItem={({ item }) => (
            <NotificationItem
              item={item}
              onPress={() => {
                if (!item.read) {
                  handleToggleRead(item.id, true);
                }
                navigation.navigate('NotificationDetail', { notificationId: item.id });
              }}
              onToggleRead={() => handleToggleRead(item.id, !item.read)}
              onDelete={() => handleDelete(item.id)}
            />
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.contentTop,
    paddingBottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  markAllButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  markAllText: {
    fontSize: fontSizes.sm,
    color: colors.textAccent,
    fontWeight: '600',
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.md,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterText: {
    fontSize: fontSizes.sm,
    color: colors.textPrimary,
  },
  filterTextActive: {
    color: colors.textOnAccent,
    fontWeight: '700',
  },
  countRow: {
    paddingHorizontal: spacing.xxl,
    marginBottom: spacing.md,
  },
  countText: {
    fontSize: fontSizes.sm,
    color: colors.textSubtle,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.contentBottom + 20,
  },
  stateText: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xxl,
  },
});
