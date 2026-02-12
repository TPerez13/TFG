import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSizes, spacing } from '../../theme/tokens';
import { PillToggle } from './PillToggle';

type SettingsSectionProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function SettingsSection({ title, subtitle, children }: SettingsSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

type ReadOnlyFieldRowProps = {
  label: string;
  value: string;
  hideDivider?: boolean;
};

export function ReadOnlyFieldRow({ label, value, hideDivider }: ReadOnlyFieldRowProps) {
  return (
    <View style={[styles.row, !hideDivider ? styles.rowDivider : null]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
    </View>
  );
}

type ToggleRowProps = {
  label: string;
  description?: string;
  value: boolean;
  disabled?: boolean;
  onValueChange: (value: boolean) => void;
  hideDivider?: boolean;
};

export function ToggleRow({
  label,
  description,
  value,
  disabled,
  onValueChange,
  hideDivider,
}: ToggleRowProps) {
  return (
    <View style={[styles.row, styles.toggleRow, !hideDivider ? styles.rowDivider : null]}>
      <View style={styles.toggleCopy}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {description ? <Text style={styles.toggleDescription}>{description}</Text> : null}
      </View>
      <PillToggle value={value} disabled={disabled} onValueChange={onValueChange} />
    </View>
  );
}

type DangerZoneProps = {
  description: string;
  warning: string;
  buttonLabel: string;
  disabled?: boolean;
  onPress: () => void;
};

export function DangerZone({ description, warning, buttonLabel, disabled, onPress }: DangerZoneProps) {
  return (
    <View>
      <Text style={styles.dangerDescription}>{description}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [styles.dangerButton, disabled ? styles.disabled : null, pressed ? styles.pressed : null]}
      >
        <Text style={styles.dangerButtonText}>{buttonLabel}</Text>
      </Pressable>
      <Text style={styles.warningText}>{warning}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: fontSizes.md,
    color: colors.textSubtle,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  row: {
    paddingVertical: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  fieldLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSubtle,
    marginBottom: spacing.xs,
  },
  fieldValue: {
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  toggleCopy: {
    flex: 1,
    paddingRight: spacing.md,
  },
  toggleLabel: {
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  toggleDescription: {
    marginTop: 4,
    fontSize: fontSizes.sm,
    color: colors.textSubtle,
  },
  dangerDescription: {
    fontSize: fontSizes.md,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  dangerButton: {
    backgroundColor: '#fbe9e9',
    borderWidth: 1,
    borderColor: '#d94141',
    borderRadius: 999,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#b52d2d',
    fontSize: fontSizes.base,
    fontWeight: '700',
  },
  warningText: {
    marginTop: spacing.sm,
    fontSize: fontSizes.sm,
    color: colors.textMuted,
  },
  disabled: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.85,
  },
});
