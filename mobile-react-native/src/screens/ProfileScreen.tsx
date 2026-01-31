import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Screen } from '../components/layout/Screen';
import { useAuth } from '../navigation/AuthContext';
import { apiFetch } from '../services/api';
import type { User } from '../types/models';
import type { ProfileStackParamList } from '../navigation/types';
import { baseStyles } from '../theme/components';
import { colors, fontSizes, spacing } from '../theme/tokens';

type ProfileScreenProps = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { signOut } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadUser = async () => {
      try {
        const res = await apiFetch('/users/me');
        if (!res.ok) return;
        const payload = (await res.json()) as { user?: User };
        if (active) setUser(payload.user ?? null);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadUser();
    return () => {
      active = false;
    };
  }, []);

  const displayName = user?.nombre ?? user?.username ?? user?.correo ?? 'Usuario';
  const memberSince = user?.f_creacion ? new Date(user.f_creacion).getFullYear() : null;

  return (
    <Screen>
      <ScrollView contentContainerStyle={[baseStyles.content, styles.content]}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} accessibilityLabel="Volver">
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Perfil de Usuario</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.avatarWrap}>
          <View style={styles.avatarOuter}>
            <View style={styles.avatarInner}>
              <Ionicons name="person" size={64} color={colors.textSubtle} />
            </View>
          </View>
        </View>
        {loading ? (
          <ActivityIndicator color={colors.textAccent} />
        ) : (
          <>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.memberSince}>
              {memberSince ? `Miembro desde ${memberSince}` : 'Miembro desde 2023'}
            </Text>
          </>
        )}

        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.editButton, pressed ? styles.buttonPressed : null]}
        >
          <Text style={styles.editButtonText}>Editar Perfil</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Ajustes de la App</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="notifications"
            title="Notificaciones"
            subtitle="Gestiona avisos y recordatorios"
            onPress={() => navigation.navigate('NotificationSettings')}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="shield-checkmark"
            title="Privacidad"
            subtitle="Gestiona tus datos de..."
            onPress={() => navigation.navigate('Privacy')}
          />
        </View>

        <Text style={styles.sectionTitle}>Soporte</Text>
        <View style={styles.card}>
          <SettingsRow
            icon="help-circle"
            title="Ayuda y Soporte"
            subtitle="Obten ayuda o..."
            onPress={() => navigation.navigate('HelpSupport')}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="information-circle"
            title="Sobre la App"
            subtitle="Version 2.4.0"
            onPress={() => navigation.navigate('AboutApp')}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.logoutButton, pressed ? styles.logoutPressed : null]}
          onPress={signOut}
        >
          <Ionicons name="log-out-outline" size={20} color="#d94141" />
          <Text style={styles.logoutText}>Cerrar Sesion</Text>
        </Pressable>

        <Text style={styles.footerText}>HealthyHabits esta disenado para ti.</Text>
      </ScrollView>
    </Screen>
  );
}

type SettingsRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress?: () => void;
};

function SettingsRow({ icon, title, subtitle, onPress }: SettingsRowProps) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowIconWrap}>
        <Ionicons name={icon} size={20} color={colors.textAccent} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.contentBottom + 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xxl,
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
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
  headerSpacer: {
    width: 36,
    height: 36,
  },
  avatarWrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarOuter: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#b8c4bf',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  memberSince: {
    fontSize: fontSizes.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  editButton: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    paddingVertical: spacing.mdPlus,
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  editButtonText: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.textOnAccent,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },
  logoutButton: {
    borderWidth: 2,
    borderColor: '#d94141',
    borderRadius: 999,
    paddingVertical: spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  logoutPressed: {
    opacity: 0.85,
  },
  logoutText: {
    fontSize: fontSizes.base,
    fontWeight: '700',
    color: '#d94141',
  },
  footerText: {
    fontSize: fontSizes.sm,
    color: colors.textSubtle,
    textAlign: 'center',
  },
});
